import crypto from 'node:crypto';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db, isCloudSqlConfigured } from '../src/db/index.ts';
import { ensureDatabaseSchemaReady } from '../src/db/schema-sync.ts';
import {
  phases as phasesTable,
  registrations as registrationsTable,
  submissions as submissionsTable,
} from '../src/db/schema.ts';
import {
  MAX_TEXT_SUBMISSION_LENGTH,
  MAX_UPLOAD_BYTES,
  normalizeSubmissionMimeType,
} from '../src/lib/submissions-config.ts';
import {
  SUBMISSIONS_BUCKET,
  ensureSubmissionsBucket,
  getSupabaseAdmin,
  isSupabaseAdminConfigured,
} from './supabase-admin.ts';
import type {
  AdminSubmissionAccess,
  AdminSubmissionItem,
  CandidateSubmissionSummary,
  SubmissionKind,
  SubmissionPublicPhaseStatus,
  SubmissionStatus,
} from '../src/types/competition';

class SubmissionHttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Rate limit léger en mémoire : max 10 requêtes par minute par IP et par référence
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 10;
const rateBucket = new Map<string, number[]>();

export function enforceSubmissionRateLimit(ip: string, referenceCode?: string): void {
  const now = Date.now();
  const keys = [`ip:${ip || 'unknown'}`];
  const refNorm = (referenceCode || '').trim().toUpperCase();
  if (refNorm) {
    keys.push(`ref:${refNorm}`);
  }

  for (const key of keys) {
    const timestamps = (rateBucket.get(key) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
    if (timestamps.length >= RATE_MAX_REQUESTS) {
      throw new SubmissionHttpError(
        429,
        'Trop de tentatives en peu de temps. Merci de patienter une minute avant de réessayer.',
      );
    }
    timestamps.push(now);
    rateBucket.set(key, timestamps);
  }

  // Nettoyage opportuniste pour éviter la croissance infinie en mémoire
  if (rateBucket.size > 2000) {
    for (const [key, list] of rateBucket.entries()) {
      const fresh = list.filter((ts) => now - ts < RATE_WINDOW_MS);
      if (fresh.length === 0) {
        rateBucket.delete(key);
      } else {
        rateBucket.set(key, fresh);
      }
    }
  }
}

async function assertDatabaseReady(): Promise<void> {
  if (!isCloudSqlConfigured()) {
    throw new SubmissionHttpError(
      503,
      "Le service de dépôt n'est pas disponible sans base de données PostgreSQL configurée (DATABASE_URL manquant).",
    );
  }
  await ensureDatabaseSchemaReady();
}

function assertStorageConfigured(): void {
  if (!isSupabaseAdminConfigured()) {
    throw new SubmissionHttpError(
      503,
      'Le stockage des dépôts Supabase est indisponible sur le serveur (SUPABASE_URL ou SUPABASE_SECRET_KEY manquant).',
    );
  }
}

export function sanitizeFileName(rawName: string): string {
  const trimmed = (rawName || '').trim();
  const lastDot = trimmed.lastIndexOf('.');
  const rawBase = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  const rawExt = lastDot > 0 ? trimmed.slice(lastDot).toLowerCase() : '';

  const cleanExt = rawExt.replace(/[^a-z0-9.]/g, '').slice(0, 10);
  const cleanBase = rawBase
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  const safeBase = cleanBase || 'production';
  return `${safeBase}${cleanExt}`;
}

async function verifyCandidateCredentials(referenceCode: string, email: string) {
  const cleanRef = (referenceCode || '').trim().toUpperCase();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanRef || !cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new SubmissionHttpError(
      400,
      'Indiquez votre code de référence (ex. UCAEP-2026-0001) et l’adresse e-mail utilisée à l’inscription.',
    );
  }

  const rows = await db
    .select()
    .from(registrationsTable)
    .where(
      and(
        sql`upper(trim(${registrationsTable.referenceCode})) = ${cleanRef}`,
        sql`lower(trim(${registrationsTable.email})) = ${cleanEmail}`,
      ),
    )
    .limit(1);

  if (!rows[0]) {
    throw new SubmissionHttpError(
      401,
      "Aucune inscription trouvée avec ce code de référence et cette adresse e-mail.",
    );
  }

  return rows[0];
}

function evaluatePhaseAcceptance(phase: typeof phasesTable.$inferSelect): {
  acceptingNow: boolean;
  closedReason: string | null;
} {
  if (phase.id === 'phase-3' || phase.format === 'En présentiel') {
    return {
      acceptingNow: false,
      closedReason: 'Épreuve en présentiel sur le campus : aucun dépôt en ligne n’est demandé.',
    };
  }

  if (!phase.submissionsOpen) {
    return {
      acceptingNow: false,
      closedReason: 'Les dépôts en ligne ne sont pas encore ouverts pour cette phase.',
    };
  }

  if (phase.submissionDeadline) {
    const deadlineMs =
      phase.submissionDeadline instanceof Date
        ? phase.submissionDeadline.getTime()
        : Date.parse(String(phase.submissionDeadline));
    if (!Number.isNaN(deadlineMs) && Date.now() > deadlineMs) {
      return {
        acceptingNow: false,
        closedReason: 'La date limite de dépôt pour cette phase est dépassée.',
      };
    }
  }

  return { acceptingNow: true, closedReason: null };
}

function mapCandidateSubmissionSummary(
  row: typeof submissionsTable.$inferSelect,
): CandidateSubmissionSummary {
  const excerpt =
    row.kind === 'text' && row.textContent
      ? row.textContent.length > 240
        ? `${row.textContent.slice(0, 240).trim()}...`
        : row.textContent
      : null;

  return {
    id: row.id,
    phaseId: row.phaseId,
    kind: row.kind,
    fileName: row.fileName ?? null,
    mimeType: row.mimeType ?? null,
    sizeBytes: row.sizeBytes ?? null,
    textExcerpt: excerpt,
    textContent: row.kind === 'text' ? row.textContent ?? null : null,
    status: row.status,
    organizerNote: row.organizerNote || '',
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt:
      row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  };
}

export async function getCandidateSubmissionStatus(input: {
  referenceCode: string;
  email: string;
}): Promise<{
  candidate: {
    firstName: string;
    lastName: string;
    referenceCode: string;
    department: string;
    studyLevel: string;
  };
  phases: SubmissionPublicPhaseStatus[];
}> {
  await assertDatabaseReady();
  const candidate = await verifyCandidateCredentials(input.referenceCode, input.email);

  const [phaseRows, submissionRows] = await Promise.all([
    db.select().from(phasesTable).orderBy(asc(phasesTable.sortOrder)),
    db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.registrationId, candidate.id)),
  ]);

  const byPhase = new Map(submissionRows.map((s) => [s.phaseId, s]));

  const phaseStatuses: SubmissionPublicPhaseStatus[] = phaseRows.map((phase) => {
    const acceptance = evaluatePhaseAcceptance(phase);
    const existing = byPhase.get(phase.id);

    return {
      id: phase.id,
      number: String(phase.number).padStart(2, '0'),
      title: phase.title,
      format: phase.format,
      statusLabel: phase.statusLabel,
      isRevealed: phase.isRevealed,
      submissionsOpen: Boolean(phase.submissionsOpen),
      submissionDeadline: phase.submissionDeadline
        ? phase.submissionDeadline instanceof Date
          ? phase.submissionDeadline.toISOString()
          : String(phase.submissionDeadline)
        : null,
      acceptingNow: acceptance.acceptingNow,
      closedReason: acceptance.closedReason,
      testDetails: phase.isRevealed ? phase.testDetails || null : null,
      existingSubmission: existing ? mapCandidateSubmissionSummary(existing) : null,
    };
  });

  return {
    candidate: {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      referenceCode: candidate.referenceCode,
      department: candidate.department,
      studyLevel: candidate.studyLevel,
    },
    phases: phaseStatuses,
  };
}

export async function initCandidateSubmission(input: {
  referenceCode: string;
  email: string;
  phaseId: string;
  kind: SubmissionKind;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
}): Promise<{
  kind: SubmissionKind;
  storagePath?: string;
  token?: string;
  signedUrl?: string;
  normalizedMimeType?: string;
  maxBytes: number;
  maxTextLength: number;
}> {
  await assertDatabaseReady();
  const candidate = await verifyCandidateCredentials(input.referenceCode, input.email);

  const phaseRows = await db
    .select()
    .from(phasesTable)
    .where(eq(phasesTable.id, (input.phaseId || '').trim()))
    .limit(1);

  const phase = phaseRows[0];
  if (!phase) {
    throw new SubmissionHttpError(404, 'Phase du concours introuvable.');
  }

  const acceptance = evaluatePhaseAcceptance(phase);
  if (!acceptance.acceptingNow) {
    throw new SubmissionHttpError(
      403,
      acceptance.closedReason || 'Les dépôts sont fermés pour cette phase.',
    );
  }

  if (input.kind === 'text') {
    return {
      kind: 'text',
      maxBytes: MAX_UPLOAD_BYTES,
      maxTextLength: MAX_TEXT_SUBMISSION_LENGTH,
    };
  }

  if (input.kind !== 'file') {
    throw new SubmissionHttpError(400, 'Type de dépôt invalide (fichier ou texte requis).');
  }

  assertStorageConfigured();

  const rawFileName = (input.fileName || '').trim();
  const sizeBytes = Number(input.sizeBytes);
  if (!rawFileName) {
    throw new SubmissionHttpError(400, 'Le nom du fichier est obligatoire.');
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new SubmissionHttpError(400, 'Ce fichier semble vide (0 octet).');
  }
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    throw new SubmissionHttpError(
      400,
      'Votre fichier dépasse la limite autorisée de 50 Mo. Exportez en MP4 720p ou compressez-le avant de réessayer.',
    );
  }

  const normalizedMime = normalizeSubmissionMimeType(rawFileName, input.mimeType);
  if (!normalizedMime) {
    throw new SubmissionHttpError(
      400,
      'Format non autorisé. Utilisez une vidéo (MP4, MOV, WebM), un audio (MP3, M4A, WAV, OGG) ou un document (PDF, DOCX, DOC).',
    );
  }

  const cleanName = sanitizeFileName(rawFileName);
  const storagePath = `${candidate.referenceCode}/${phase.id}/${Date.now()}-${cleanName}`;

  await ensureSubmissionsBucket();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(SUBMISSIONS_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (error || !data?.token) {
    throw new SubmissionHttpError(
      502,
      "Impossible de préparer le transfert vers le stockage sécurisé. Réessayez dans un instant.",
    );
  }

  return {
    kind: 'file',
    storagePath: data.path || storagePath,
    token: data.token,
    signedUrl: data.signedUrl,
    normalizedMimeType: normalizedMime,
    maxBytes: MAX_UPLOAD_BYTES,
    maxTextLength: MAX_TEXT_SUBMISSION_LENGTH,
  };
}

export async function completeCandidateSubmission(input: {
  referenceCode: string;
  email: string;
  phaseId: string;
  kind: SubmissionKind;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  textContent?: string;
}): Promise<CandidateSubmissionSummary> {
  await assertDatabaseReady();
  const candidate = await verifyCandidateCredentials(input.referenceCode, input.email);

  const phaseRows = await db
    .select()
    .from(phasesTable)
    .where(eq(phasesTable.id, (input.phaseId || '').trim()))
    .limit(1);

  const phase = phaseRows[0];
  if (!phase) {
    throw new SubmissionHttpError(404, 'Phase du concours introuvable.');
  }

  const acceptance = evaluatePhaseAcceptance(phase);
  if (!acceptance.acceptingNow) {
    throw new SubmissionHttpError(
      403,
      acceptance.closedReason || 'Les dépôts sont fermés pour cette phase.',
    );
  }

  const existingRows = await db
    .select()
    .from(submissionsTable)
    .where(
      and(
        eq(submissionsTable.registrationId, candidate.id),
        eq(submissionsTable.phaseId, phase.id),
      ),
    )
    .limit(1);
  const previous = existingRows[0] || null;
  const oldStoragePath = previous?.storagePath || null;

  if (input.kind === 'text') {
    const cleanText = (input.textContent || '').trim();
    if (!cleanText) {
      throw new SubmissionHttpError(400, 'Écrivez votre texte avant d’envoyer votre dépôt.');
    }
    if (cleanText.length > MAX_TEXT_SUBMISSION_LENGTH) {
      throw new SubmissionHttpError(
        400,
        `Votre texte dépasse la limite de ${MAX_TEXT_SUBMISSION_LENGTH.toLocaleString('fr-FR')} caractères.`,
      );
    }

    const now = new Date();
    const byteSize = Buffer.byteLength(cleanText, 'utf8');
    const savedRows = await db
      .insert(submissionsTable)
      .values({
        id: previous?.id || crypto.randomUUID(),
        registrationId: candidate.id,
        phaseId: phase.id,
        kind: 'text',
        storagePath: null,
        fileName: null,
        mimeType: 'text/plain',
        sizeBytes: byteSize,
        textContent: cleanText,
        status: 'received',
        organizerNote: '',
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [submissionsTable.registrationId, submissionsTable.phaseId],
        set: {
          kind: 'text',
          storagePath: null,
          fileName: null,
          mimeType: 'text/plain',
          sizeBytes: byteSize,
          textContent: cleanText,
          status: 'received',
          organizerNote: '',
          updatedAt: now,
        },
      })
      .returning();

    if (oldStoragePath && isSupabaseAdminConfigured()) {
      getSupabaseAdmin()
        .storage.from(SUBMISSIONS_BUCKET)
        .remove([oldStoragePath])
        .catch(() => {});
    }

    return mapCandidateSubmissionSummary(savedRows[0]);
  }

  if (input.kind !== 'file') {
    throw new SubmissionHttpError(400, 'Type de dépôt invalide.');
  }

  assertStorageConfigured();

  const storagePath = (input.storagePath || '').trim();
  const expectedPrefix = `${candidate.referenceCode}/${phase.id}/`;
  if (
    !storagePath ||
    !storagePath.startsWith(expectedPrefix) ||
    storagePath.includes('..') ||
    storagePath.slice(expectedPrefix.length).includes('/')
  ) {
    throw new SubmissionHttpError(400, 'Chemin de stockage invalide pour ce dossier.');
  }

  const rawFileName = (input.fileName || '').trim() || storagePath.slice(expectedPrefix.length);
  const normalizedMime = normalizeSubmissionMimeType(rawFileName, input.mimeType);
  if (!normalizedMime) {
    throw new SubmissionHttpError(400, 'Format de fichier non autorisé.');
  }

  // Vérification côté Supabase Storage que l'objet existe et respecte 50 Mo
  const objectName = storagePath.slice(expectedPrefix.length);
  const folder = `${candidate.referenceCode}/${phase.id}`;
  const admin = getSupabaseAdmin();
  const { data: listed, error: listErr } = await admin.storage
    .from(SUBMISSIONS_BUCKET)
    .list(folder, { limit: 100, search: objectName });

  if (listErr) {
    throw new SubmissionHttpError(
      502,
      'Impossible de confirmer la présence du fichier dans le stockage sécurisé.',
    );
  }

  const matchedObject = (listed || []).find((item) => item.name === objectName);
  if (!matchedObject) {
    throw new SubmissionHttpError(
      400,
      'Le fichier n’a pas encore été reçu dans le stockage. Relancez le téléversement.',
    );
  }

  const storedSize = Number(
    (matchedObject.metadata as { size?: number } | null)?.size ?? input.sizeBytes ?? 0,
  );
  if (!Number.isFinite(storedSize) || storedSize <= 0 || storedSize > MAX_UPLOAD_BYTES) {
    await admin.storage.from(SUBMISSIONS_BUCKET).remove([storagePath]).catch(() => {});
    throw new SubmissionHttpError(
      400,
      'La taille du fichier envoyé est invalide ou dépasse 50 Mo.',
    );
  }

  const safeDisplayName = rawFileName.slice(0, 180);
  const now = new Date();
  const savedRows = await db
    .insert(submissionsTable)
    .values({
      id: previous?.id || crypto.randomUUID(),
      registrationId: candidate.id,
      phaseId: phase.id,
      kind: 'file',
      storagePath,
      fileName: safeDisplayName,
      mimeType: normalizedMime,
      sizeBytes: storedSize,
      textContent: null,
      status: 'received',
      organizerNote: '',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [submissionsTable.registrationId, submissionsTable.phaseId],
      set: {
        kind: 'file',
        storagePath,
        fileName: safeDisplayName,
        mimeType: normalizedMime,
        sizeBytes: storedSize,
        textContent: null,
        status: 'received',
        organizerNote: '',
        updatedAt: now,
      },
    })
    .returning();

  if (oldStoragePath && oldStoragePath !== storagePath) {
    admin.storage
      .from(SUBMISSIONS_BUCKET)
      .remove([oldStoragePath])
      .catch(() => {});
  }

  return mapCandidateSubmissionSummary(savedRows[0]);
}

export async function listAdminSubmissions(filters?: {
  phaseId?: string;
  status?: string;
}): Promise<{
  storageConfigured: boolean;
  submissions: AdminSubmissionItem[];
}> {
  await assertDatabaseReady();

  const conditions = [];
  if (filters?.phaseId && filters.phaseId !== 'all') {
    conditions.push(eq(submissionsTable.phaseId, filters.phaseId));
  }
  if (
    filters?.status &&
    ['received', 'validated', 'rejected'].includes(filters.status)
  ) {
    conditions.push(eq(submissionsTable.status, filters.status as SubmissionStatus));
  }

  const baseQuery = db
    .select({
      submission: submissionsTable,
      registration: registrationsTable,
      phase: phasesTable,
    })
    .from(submissionsTable)
    .innerJoin(
      registrationsTable,
      eq(submissionsTable.registrationId, registrationsTable.id),
    )
    .innerJoin(phasesTable, eq(submissionsTable.phaseId, phasesTable.id));

  const rows =
    conditions.length > 0
      ? await baseQuery
          .where(and(...conditions))
          .orderBy(desc(submissionsTable.updatedAt))
      : await baseQuery.orderBy(desc(submissionsTable.updatedAt));

  const items: AdminSubmissionItem[] = rows.map(({ submission, registration, phase }) => ({
    id: submission.id,
    registrationId: registration.id,
    referenceCode: registration.referenceCode,
    candidateName: `${registration.firstName} ${registration.lastName}`,
    candidateDepartment: registration.department,
    candidateStudyLevel: registration.studyLevel,
    phaseId: phase.id,
    phaseNumber: String(phase.number).padStart(2, '0'),
    phaseTitle: phase.title,
    kind: submission.kind,
    fileName: submission.fileName ?? null,
    mimeType: submission.mimeType ?? null,
    sizeBytes: submission.sizeBytes ?? null,
    textPreview:
      submission.kind === 'text' && submission.textContent
        ? submission.textContent.length > 160
          ? `${submission.textContent.slice(0, 160).trim()}...`
          : submission.textContent
        : null,
    status: submission.status,
    organizerNote: submission.organizerNote || '',
    createdAt:
      submission.createdAt instanceof Date
        ? submission.createdAt.toISOString()
        : String(submission.createdAt),
    updatedAt:
      submission.updatedAt instanceof Date
        ? submission.updatedAt.toISOString()
        : String(submission.updatedAt),
  }));

  return {
    storageConfigured: isSupabaseAdminConfigured(),
    submissions: items,
  };
}

export async function getAdminSubmissionAccess(
  submissionId: string,
): Promise<AdminSubmissionAccess> {
  await assertDatabaseReady();
  const rows = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.id, submissionId))
    .limit(1);

  const submission = rows[0];
  if (!submission) {
    throw new SubmissionHttpError(404, 'Dépôt introuvable.');
  }

  if (submission.kind === 'text') {
    return {
      id: submission.id,
      kind: 'text',
      fileName: null,
      mimeType: 'text/plain',
      sizeBytes: submission.sizeBytes ?? null,
      signedUrl: null,
      expiresInSeconds: null,
      textContent: submission.textContent || '',
    };
  }

  if (!submission.storagePath) {
    throw new SubmissionHttpError(404, 'Aucun fichier associé à ce dépôt.');
  }

  assertStorageConfigured();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(SUBMISSIONS_BUCKET)
    .createSignedUrl(submission.storagePath, 600);

  if (error || !data?.signedUrl) {
    throw new SubmissionHttpError(
      502,
      'Impossible de générer le lien temporaire de lecture.',
    );
  }

  return {
    id: submission.id,
    kind: 'file',
    fileName: submission.fileName ?? null,
    mimeType: submission.mimeType ?? null,
    sizeBytes: submission.sizeBytes ?? null,
    signedUrl: data.signedUrl,
    expiresInSeconds: 600,
    textContent: null,
  };
}

export async function updateAdminSubmissionReview(
  submissionId: string,
  patch: {
    status?: SubmissionStatus;
    organizerNote?: string;
  },
): Promise<{
  id: string;
  status: SubmissionStatus;
  organizerNote: string;
  updatedAt: string;
}> {
  await assertDatabaseReady();

  const existingRows = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.id, submissionId))
    .limit(1);

  const current = existingRows[0];
  if (!current) {
    throw new SubmissionHttpError(404, 'Dépôt introuvable.');
  }

  const nextStatus: SubmissionStatus =
    patch.status && ['received', 'validated', 'rejected'].includes(patch.status)
      ? patch.status
      : current.status;

  const nextNote =
    typeof patch.organizerNote === 'string'
      ? patch.organizerNote.trim().slice(0, 1500)
      : current.organizerNote;

  const updated = await db
    .update(submissionsTable)
    .set({
      status: nextStatus,
      organizerNote: nextNote,
      updatedAt: new Date(),
    })
    .where(eq(submissionsTable.id, submissionId))
    .returning();

  const row = updated[0];
  return {
    id: row.id,
    status: row.status,
    organizerNote: row.organizerNote,
    updatedAt:
      row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  };
}

export function isSubmissionHttpError(err: unknown): err is SubmissionHttpError {
  return err instanceof SubmissionHttpError;
}
