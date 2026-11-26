import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db, isCloudSqlConfigured } from '../src/db/index.ts';
import { ensureDatabaseSchemaReady, isSchemaDriftError } from '../src/db/schema-sync.ts';
import {
  phases as phasesTable,
  registrations as registrationsTable,
  submissions as submissionsTable,
} from '../src/db/schema.ts';
import {
  MAX_TEXT_SUBMISSION_LENGTH,
  MAX_UPLOAD_BYTES,
  SUPABASE_FREE_QUOTA_BYTES,
  buildBundleCombinedNote,
  computeBundleOverallStatus,
  isVideoMimeType,
  normalizeSubmissionMimeType,
  parseDualTextContent,
  serializeDualTextContent,
  type DualTextSubmissionPayload,
} from '../src/lib/submissions-config.ts';
import {
  getLocalDataDir,
  readJsonStore,
  withJsonStoreLock,
  type LocalSubmissionRecord,
} from './store.ts';
import {
  SUBMISSIONS_BUCKET,
  ensureSubmissionsBucket,
  getSupabaseAdmin,
  isSupabaseAdminConfigured,
} from './supabase-admin.ts';
import {
  type DbPhaseRowLike,
  type DbRegistrationRowLike,
  type DbSubmissionRowLike,
  getCandidateSubmissionsViaSupabaseRest,
  getPhaseByIdViaSupabaseRest,
  getSubmissionByIdViaSupabaseRest,
  getSubmissionForCandidatePhaseViaSupabaseRest,
  isPgFallbackEligibleError,
  listAdminSubmissionsViaSupabaseRest,
  listPhasesViaSupabaseRest,
  markPreferSupabaseRest,
  normalizeCandidateRefCode,
  shouldUseSupabaseRestFallback,
  updateSubmissionReviewViaSupabaseRest,
  upsertSubmissionViaSupabaseRest,
  verifyCandidateViaSupabaseRest,
} from './supabase-db.ts';
import type {
  AdminStorageStats,
  AdminSubmissionAccess,
  AdminSubmissionItem,
  AdminVideoSlotAccess,
  CandidateSubmissionSummary,
  PublicVideoSlotSummary,
  SubmissionKind,
  SubmissionPublicPhaseStatus,
  SubmissionStatus,
  VideoSlotSubmission,
} from '../src/types/competition';

export type SubmissionUploadMode = 'supabase_signed' | 'local_server';

class SubmissionHttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Rate limit léger en mémoire : max 25 requêtes par minute par IP et par référence
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 25;
const rateBucket = new Map<string, number[]>();

export function enforceSubmissionRateLimit(ip: string, referenceCode?: string): void {
  const now = Date.now();
  const keys = [`ip:${ip || 'unknown'}`];
  const refNorm = normalizeCandidateRefCode(referenceCode || '');
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

function useRestDb(): boolean {
  return (
    shouldUseSupabaseRestFallback() ||
    (!isCloudSqlConfigured() && isSupabaseAdminConfigured())
  );
}

function useLocalJsonDb(): boolean {
  return !useRestDb() && !isCloudSqlConfigured();
}

function getUploadMode(): SubmissionUploadMode {
  return isSupabaseAdminConfigured() ? 'supabase_signed' : 'local_server';
}

export function getSubmissionsPublicConfig(): {
  fileUploadReady: boolean;
  uploadMode: SubmissionUploadMode;
  maxBytes: number;
  maxTextLength: number;
} {
  return {
    fileUploadReady: true,
    uploadMode: getUploadMode(),
    maxBytes: MAX_UPLOAD_BYTES,
    maxTextLength: MAX_TEXT_SUBMISSION_LENGTH,
  };
}

function getLocalSigningSecret(): string {
  const raw =
    (process.env.ORGANIZER_ACCESS_CODE || '').trim() ||
    (process.env.SUPABASE_SECRET_KEY || '').trim() ||
    'ucaep-local-upload-secret-2026';
  return crypto.createHash('sha256').update(`ucaep-uploads:${raw}`).digest('hex');
}

function signTokenPayload(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getLocalSigningSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyTokenPayload<T extends { exp?: number }>(token: string): T | null {
  const parts = (token || '').trim().split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = crypto
    .createHmac('sha256', getLocalSigningSecret())
    .update(encoded)
    .digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getLocalUploadsRoot(): string {
  return path.resolve(getLocalDataDir(), 'uploads');
}

function resolveSafeUploadDiskPath(storagePath: string): string {
  const root = getLocalUploadsRoot();
  const cleanRel = storagePath.replace(/^\/+/, '');
  if (!cleanRel || cleanRel.includes('..') || path.isAbsolute(cleanRel)) {
    throw new SubmissionHttpError(400, 'Chemin de fichier invalide.');
  }
  const target = path.resolve(root, cleanRel);
  if (!target.startsWith(`${root}${path.sep}`)) {
    throw new SubmissionHttpError(400, 'Chemin de fichier hors périmètre.');
  }
  return target;
}

async function withDbMode<T>(handlers: {
  pg: () => Promise<T>;
  rest: () => Promise<T>;
  local: () => Promise<T>;
}): Promise<T> {
  if (useRestDb()) {
    return handlers.rest();
  }
  if (useLocalJsonDb()) {
    return handlers.local();
  }
  try {
    return await handlers.pg();
  } catch (err) {
    if (isSchemaDriftError(err)) {
      try {
        await ensureDatabaseSchemaReady(true);
        return await handlers.pg();
      } catch (retryErr) {
        err = retryErr;
      }
    }
    if (isPgFallbackEligibleError(err) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      return handlers.rest();
    }
    throw err;
  }
}

async function assertDatabaseReady(): Promise<void> {
  if (useRestDb() || useLocalJsonDb()) {
    return;
  }
  try {
    await ensureDatabaseSchemaReady();
  } catch (err) {
    if (isPgFallbackEligibleError(err) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      return;
    }
    throw err;
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

async function verifyCandidateCredentials(
  referenceCode: string,
  email: string,
): Promise<DbRegistrationRowLike> {
  const cleanRef = (referenceCode || '').trim().toUpperCase();
  const normRef = normalizeCandidateRefCode(referenceCode || '');
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!normRef || !cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new SubmissionHttpError(
      400,
      'Indiquez votre code de référence (ex. UCAEP-2026-0001) et l’adresse e-mail utilisée à l’inscription.',
    );
  }

  const lookup = await withDbMode<{
    candidate: DbRegistrationRowLike | null;
    emailFound: boolean;
  }>({
    pg: async () => {
      const byEmail = await db
        .select()
        .from(registrationsTable)
        .where(sql`lower(trim(${registrationsTable.email})) = ${cleanEmail}`)
        .limit(10);

      if (byEmail.length === 0) {
        return { candidate: null, emailFound: false };
      }
      const matched = byEmail.find(
        (r) => normalizeCandidateRefCode(r.referenceCode) === normRef,
      );
      return { candidate: matched || null, emailFound: true };
    },
    rest: () => verifyCandidateViaSupabaseRest(cleanRef, cleanEmail),
    local: async () => {
      const store = await readJsonStore();
      const byEmail = store.registrations.filter(
        (r) => (r.email || '').trim().toLowerCase() === cleanEmail,
      );
      if (byEmail.length === 0) {
        return { candidate: null, emailFound: false };
      }
      const matched = byEmail.find(
        (r) => normalizeCandidateRefCode(r.referenceCode) === normRef,
      );
      return {
        candidate: matched
          ? {
              ...matched,
              readingExperience: matched.readingExperience || '',
            }
          : null,
        emailFound: true,
      };
    },
  });

  if (!lookup.candidate) {
    if (lookup.emailFound) {
      throw new SubmissionHttpError(
        401,
        'Cette adresse e-mail est bien inscrite, mais le code de référence ne correspond pas. Vérifiez le code reçu lors de votre inscription (ex. UCAEP-2026-0001).',
      );
    }
    throw new SubmissionHttpError(
      401,
      "Aucune inscription trouvée avec ce code de référence et cette adresse e-mail.",
    );
  }

  return lookup.candidate;
}

function evaluatePhaseAcceptance(phase: DbPhaseRowLike): {
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

function extractSubmissionBundle(
  row: DbSubmissionRowLike | LocalSubmissionRecord,
): DualTextSubmissionPayload {
  const parsed = parseDualTextContent(row.textContent, row.status);
  let video1 = parsed.video1;
  const video2 = parsed.video2;

  if (!video1 && row.kind === 'file' && row.storagePath) {
    const updatedIso =
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt || new Date().toISOString());
    video1 = {
      storagePath: row.storagePath,
      fileName: row.fileName || 'video-1.mp4',
      mimeType: row.mimeType || 'video/mp4',
      sizeBytes: Number(row.sizeBytes) > 0 ? Number(row.sizeBytes) : 1,
      status: row.status,
      note: row.organizerNote || '',
      uploadedAt: updatedIso,
    };
  }

  return {
    __ucaepDualText: 1,
    text1: row.kind === 'file' && !parsed.isStructured ? '' : parsed.text1,
    text2: parsed.text2,
    text1Status: parsed.text1Status,
    text2Status: parsed.text2Status,
    text1Note: parsed.text1Note,
    text2Note: parsed.text2Note,
    video1,
    video2,
  };
}

function toPublicVideoSlot(
  slot: VideoSlotSubmission | null | undefined,
): PublicVideoSlotSummary | null {
  if (!slot) return null;
  return {
    fileName: slot.fileName,
    mimeType: slot.mimeType,
    sizeBytes: slot.sizeBytes,
    status: slot.status,
    note: slot.note || '',
    uploadedAt: slot.uploadedAt,
  };
}

function buildPersistedBundleFields(bundle: DualTextSubmissionPayload): {
  kind: SubmissionKind;
  storagePath: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number;
  textContent: string;
  status: SubmissionStatus;
  organizerNote: string;
} {
  const hasAnyText = Boolean(bundle.text1.trim() || bundle.text2.trim());
  const primaryVideo = bundle.video1 || bundle.video2 || null;
  const kind: SubmissionKind = hasAnyText ? 'text' : primaryVideo ? 'file' : 'text';
  const textContent = serializeDualTextContent(bundle);
  const totalVideoBytes =
    (bundle.video1?.sizeBytes || 0) + (bundle.video2?.sizeBytes || 0);
  const sizeBytes = primaryVideo
    ? totalVideoBytes
    : Buffer.byteLength(textContent, 'utf8');
  const status = computeBundleOverallStatus(bundle);
  const organizerNote = buildBundleCombinedNote({
    text1Note: bundle.text1Note,
    text2Note: bundle.text2Note,
    video1Note: bundle.video1?.note,
    video2Note: bundle.video2?.note,
  });

  return {
    kind,
    storagePath: primaryVideo ? primaryVideo.storagePath : null,
    fileName: primaryVideo ? primaryVideo.fileName : null,
    mimeType: primaryVideo ? primaryVideo.mimeType : null,
    sizeBytes,
    textContent,
    status,
    organizerNote,
  };
}

function buildTextSummaryPreview(bundle: DualTextSubmissionPayload): string | null {
  const parts: string[] = [];
  if (bundle.text1.trim()) {
    const snippet = bundle.text1.trim().slice(0, 75).replace(/\s+/g, ' ');
    parts.push(`T1 : ${snippet}${bundle.text1.trim().length > 75 ? '…' : ''}`);
  }
  if (bundle.text2.trim()) {
    const snippet = bundle.text2.trim().slice(0, 75).replace(/\s+/g, ' ');
    parts.push(`T2 : ${snippet}${bundle.text2.trim().length > 75 ? '…' : ''}`);
  }
  if (parts.length === 0) return null;
  const joined = parts.join(' · ');
  return joined.length > 180 ? `${joined.slice(0, 177).trim()}...` : joined;
}

function mapCandidateSubmissionSummary(
  row: DbSubmissionRowLike | LocalSubmissionRecord,
): CandidateSubmissionSummary {
  const bundle = extractSubmissionBundle(row);
  const excerpt = buildTextSummaryPreview(bundle);
  const primaryVideo = bundle.video1 || bundle.video2 || null;

  return {
    id: row.id,
    phaseId: row.phaseId,
    kind: row.kind,
    fileName: primaryVideo?.fileName ?? row.fileName ?? null,
    mimeType: primaryVideo?.mimeType ?? row.mimeType ?? null,
    sizeBytes: primaryVideo?.sizeBytes ?? row.sizeBytes ?? null,
    textExcerpt: excerpt,
    textContent: bundle.text1 || null,
    text1Content: bundle.text1 || null,
    text2Content: bundle.text2 || null,
    text1Status: bundle.text1.trim() ? bundle.text1Status : undefined,
    text2Status: bundle.text2.trim() ? bundle.text2Status : undefined,
    text1Note: bundle.text1Note || '',
    text2Note: bundle.text2Note || '',
    video1: toPublicVideoSlot(bundle.video1),
    video2: toPublicVideoSlot(bundle.video2),
    status: row.status,
    organizerNote: row.organizerNote || '',
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt:
      row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  };
}

function toDbPhaseLikeFromLocal(p: {
  id: string;
  number: string;
  title: string;
  shortDescription: string;
  format: 'En ligne' | 'En présentiel';
  statusLabel: DbPhaseRowLike['statusLabel'];
  isRevealed: boolean;
  submissionsOpen?: boolean;
  submissionDeadline?: string | null;
  imageKey: DbPhaseRowLike['imageKey'];
  testDetails?: DbPhaseRowLike['testDetails'];
}, index: number): DbPhaseRowLike {
  return {
    id: p.id,
    number: parseInt(p.number, 10) || index + 1,
    title: p.title,
    shortDescription: p.shortDescription,
    format: p.format,
    statusLabel: p.statusLabel,
    isRevealed: p.isRevealed,
    submissionsOpen: Boolean(p.submissionsOpen),
    submissionDeadline: p.submissionDeadline ?? null,
    imageKey: p.imageKey,
    testDetails: p.testDetails || null,
    sortOrder: index + 1,
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

  const [phaseRows, submissionRows] = await withDbMode<[DbPhaseRowLike[], DbSubmissionRowLike[]]>({
    pg: () =>
      Promise.all([
        db.select().from(phasesTable).orderBy(asc(phasesTable.sortOrder)),
        db
          .select()
          .from(submissionsTable)
          .where(eq(submissionsTable.registrationId, candidate.id)),
      ]),
    rest: () =>
      Promise.all([
        listPhasesViaSupabaseRest(),
        getCandidateSubmissionsViaSupabaseRest(candidate.id),
      ]),
    local: async () => {
      const store = await readJsonStore();
      return [
        store.phases.map((p, idx) => toDbPhaseLikeFromLocal(p, idx)),
        (store.submissions || []).filter((s) => s.registrationId === candidate.id),
      ];
    },
  });

  const byPhase = new Map<string, DbSubmissionRowLike>(
    submissionRows.map((s) => [s.phaseId, s]),
  );

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
      externalForm: null,
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

async function getPhaseForSubmission(phaseId: string): Promise<DbPhaseRowLike | null> {
  const cleanPhaseId = (phaseId || '').trim();
  return withDbMode<DbPhaseRowLike | null>({
    pg: async () => {
      const phaseRows = await db
        .select()
        .from(phasesTable)
        .where(eq(phasesTable.id, cleanPhaseId))
        .limit(1);
      return phaseRows[0] || null;
    },
    rest: () => getPhaseByIdViaSupabaseRest(cleanPhaseId),
    local: async () => {
      const store = await readJsonStore();
      const idx = store.phases.findIndex((p) => p.id === cleanPhaseId);
      if (idx === -1) return null;
      return toDbPhaseLikeFromLocal(store.phases[idx], idx);
    },
  });
}

async function getExistingSubmissionForCandidatePhase(
  registrationId: string,
  phaseId: string,
): Promise<DbSubmissionRowLike | null> {
  return withDbMode<DbSubmissionRowLike | null>({
    pg: async () => {
      const existingRows = await db
        .select()
        .from(submissionsTable)
        .where(
          and(
            eq(submissionsTable.registrationId, registrationId),
            eq(submissionsTable.phaseId, phaseId),
          ),
        )
        .limit(1);
      return existingRows[0] || null;
    },
    rest: () => getSubmissionForCandidatePhaseViaSupabaseRest(registrationId, phaseId),
    local: async () => {
      const store = await readJsonStore();
      return (
        (store.submissions || []).find(
          (s) => s.registrationId === registrationId && s.phaseId === phaseId,
        ) || null
      );
    },
  });
}

export async function initCandidateSubmission(input: {
  referenceCode: string;
  email: string;
  phaseId: string;
  kind: SubmissionKind;
  textSlot?: 1 | 2;
  videoSlot?: 1 | 2;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
}): Promise<{
  kind: SubmissionKind;
  uploadMode?: SubmissionUploadMode;
  storagePath?: string;
  token?: string;
  signedUrl?: string;
  normalizedMimeType?: string;
  maxBytes: number;
  maxTextLength: number;
}> {
  await assertDatabaseReady();
  const candidate = await verifyCandidateCredentials(input.referenceCode, input.email);

  const phase = await getPhaseForSubmission(input.phaseId);
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

  const previous = await getExistingSubmissionForCandidatePhase(candidate.id, phase.id);
  const prevBundle = previous ? extractSubmissionBundle(previous) : null;

  if (input.kind === 'text') {
    const slot = input.textSlot === 2 ? 2 : 1;
    if (slot === 1 && prevBundle?.text1.trim() && prevBundle.text1Status === 'validated') {
      throw new SubmissionHttpError(
        403,
        'Votre Texte 1 a déjà été validé par le jury : la resoumission est désactivée.',
      );
    }
    if (slot === 2 && prevBundle?.text2.trim() && prevBundle.text2Status === 'validated') {
      throw new SubmissionHttpError(
        403,
        'Votre Texte 2 a déjà été validé par le jury : la resoumission est désactivée.',
      );
    }
    return {
      kind: 'text',
      maxBytes: MAX_UPLOAD_BYTES,
      maxTextLength: MAX_TEXT_SUBMISSION_LENGTH,
    };
  }

  if (input.kind !== 'file') {
    throw new SubmissionHttpError(400, 'Type de dépôt invalide (fichier ou texte requis).');
  }

  const vSlot: 1 | 2 = input.videoSlot === 2 ? 2 : 1;
  if (vSlot === 1 && prevBundle?.video1?.status === 'validated') {
    throw new SubmissionHttpError(
      403,
      'Votre Vidéo 1 a déjà été validée par le jury : la resoumission est désactivée.',
    );
  }
  if (vSlot === 2 && prevBundle?.video2?.status === 'validated') {
    throw new SubmissionHttpError(
      403,
      'Votre Vidéo 2 a déjà été validée par le jury : la resoumission est désactivée.',
    );
  }

  const rawFileName = (input.fileName || '').trim();
  const sizeBytes = Number(input.sizeBytes);
  if (!rawFileName) {
    throw new SubmissionHttpError(400, 'Le nom du fichier vidéo est obligatoire.');
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new SubmissionHttpError(400, 'Ce fichier semble vide (0 octet).');
  }
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    throw new SubmissionHttpError(
      400,
      'Votre vidéo dépasse la limite autorisée de 100 Mo. Compressez-la (ex. avec Proton Video Compressor) avant de réessayer.',
    );
  }

  const normalizedMime = normalizeSubmissionMimeType(rawFileName, input.mimeType);
  if (!normalizedMime || !isVideoMimeType(normalizedMime)) {
    throw new SubmissionHttpError(
      400,
      'Format non autorisé pour le dépôt vidéo. Utilisez exclusivement une vidéo MP4, MOV ou WebM (max 100 Mo).',
    );
  }

  const cleanName = sanitizeFileName(rawFileName);
  const storagePath = `${candidate.referenceCode}/${phase.id}/video-${vSlot}-${Date.now()}-${cleanName}`;

  if (isSupabaseAdminConfigured()) {
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
      uploadMode: 'supabase_signed',
      storagePath: data.path || storagePath,
      token: data.token,
      signedUrl: data.signedUrl,
      normalizedMimeType: normalizedMime,
      maxBytes: MAX_UPLOAD_BYTES,
      maxTextLength: MAX_TEXT_SUBMISSION_LENGTH,
    };
  }

  // Mode serveur local (sans Supabase) : jeton HMAC vers POST /api/submissions/local-upload
  const uploadToken = signTokenPayload({
    purpose: 'local-upload',
    storagePath,
    mimeType: normalizedMime,
    maxSize: MAX_UPLOAD_BYTES,
    exp: Date.now() + 15 * 60 * 1000,
  });

  return {
    kind: 'file',
    uploadMode: 'local_server',
    storagePath,
    token: uploadToken,
    signedUrl: '/api/submissions/local-upload',
    normalizedMimeType: normalizedMime,
    maxBytes: MAX_UPLOAD_BYTES,
    maxTextLength: MAX_TEXT_SUBMISSION_LENGTH,
  };
}

export async function handleLocalFileUpload(
  token: string,
  buffer: Buffer,
): Promise<{ ok: true; storagePath: string; sizeBytes: number }> {
  const payload = verifyTokenPayload<{
    purpose?: string;
    storagePath?: string;
    mimeType?: string;
    exp?: number;
  }>(token);

  if (!payload || payload.purpose !== 'local-upload' || !payload.storagePath) {
    throw new SubmissionHttpError(
      401,
      'Jeton de téléversement invalide ou expiré. Relancez l’envoi.',
    );
  }

  if (!Buffer.isBuffer(buffer) || buffer.length <= 0) {
    throw new SubmissionHttpError(400, 'Le fichier reçu est vide.');
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new SubmissionHttpError(
      400,
      'Votre vidéo dépasse la limite autorisée de 100 Mo.',
    );
  }

  const diskPath = resolveSafeUploadDiskPath(payload.storagePath);
  await fs.mkdir(path.dirname(diskPath), { recursive: true });
  await fs.writeFile(diskPath, buffer);

  return {
    ok: true,
    storagePath: payload.storagePath,
    sizeBytes: buffer.length,
  };
}

async function deleteStoredFileIfExists(storagePath: string | null | undefined): Promise<void> {
  if (!storagePath) return;
  if (isSupabaseAdminConfigured()) {
    await getSupabaseAdmin()
      .storage.from(SUBMISSIONS_BUCKET)
      .remove([storagePath])
      .catch(() => {});
    return;
  }
  try {
    const diskPath = resolveSafeUploadDiskPath(storagePath);
    await fs.unlink(diskPath);
  } catch {
    // ignore missing old local file
  }
}

async function persistSubmissionBundleRow(params: {
  previous: DbSubmissionRowLike | null;
  registrationId: string;
  phaseId: string;
  bundle: DualTextSubmissionPayload;
}): Promise<DbSubmissionRowLike> {
  const fields = buildPersistedBundleFields(params.bundle);
  const now = new Date();
  const nowIso = now.toISOString();

  return withDbMode<DbSubmissionRowLike>({
    pg: async () => {
      const savedRows = await db
        .insert(submissionsTable)
        .values({
          id: params.previous?.id || crypto.randomUUID(),
          registrationId: params.registrationId,
          phaseId: params.phaseId,
          kind: fields.kind,
          storagePath: fields.storagePath,
          fileName: fields.fileName,
          mimeType: fields.mimeType,
          sizeBytes: fields.sizeBytes,
          textContent: fields.textContent,
          status: fields.status,
          organizerNote: fields.organizerNote,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [submissionsTable.registrationId, submissionsTable.phaseId],
          set: {
            kind: fields.kind,
            storagePath: fields.storagePath,
            fileName: fields.fileName,
            mimeType: fields.mimeType,
            sizeBytes: fields.sizeBytes,
            textContent: fields.textContent,
            status: fields.status,
            organizerNote: fields.organizerNote,
            updatedAt: now,
          },
        })
        .returning();
      return savedRows[0];
    },
    rest: () =>
      upsertSubmissionViaSupabaseRest({
        id: params.previous?.id || crypto.randomUUID(),
        registrationId: params.registrationId,
        phaseId: params.phaseId,
        kind: fields.kind,
        storagePath: fields.storagePath,
        fileName: fields.fileName,
        mimeType: fields.mimeType,
        sizeBytes: fields.sizeBytes,
        textContent: fields.textContent,
        status: fields.status,
        organizerNote: fields.organizerNote,
      }),
    local: () =>
      withJsonStoreLock((store) => {
        const list = store.submissions || (store.submissions = []);
        const existingIdx = list.findIndex(
          (s) =>
            s.registrationId === params.registrationId &&
            s.phaseId === params.phaseId,
        );
        const nextRecord: LocalSubmissionRecord = {
          id: existingIdx !== -1 ? list[existingIdx].id : crypto.randomUUID(),
          registrationId: params.registrationId,
          phaseId: params.phaseId,
          kind: fields.kind,
          storagePath: fields.storagePath,
          fileName: fields.fileName,
          mimeType: fields.mimeType,
          sizeBytes: fields.sizeBytes,
          textContent: fields.textContent,
          status: fields.status,
          organizerNote: fields.organizerNote,
          createdAt: existingIdx !== -1 ? list[existingIdx].createdAt : nowIso,
          updatedAt: nowIso,
        };
        if (existingIdx !== -1) {
          list[existingIdx] = nextRecord;
        } else {
          list.unshift(nextRecord);
        }
        return nextRecord;
      }),
  });
}

export async function completeCandidateSubmission(input: {
  referenceCode: string;
  email: string;
  phaseId: string;
  kind: SubmissionKind;
  textSlot?: 1 | 2;
  videoSlot?: 1 | 2;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  textContent?: string;
}): Promise<CandidateSubmissionSummary> {
  await assertDatabaseReady();
  const candidate = await verifyCandidateCredentials(input.referenceCode, input.email);

  const phase = await getPhaseForSubmission(input.phaseId);
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

  const previous = await getExistingSubmissionForCandidatePhase(candidate.id, phase.id);
  const prevBundle = previous ? extractSubmissionBundle(previous) : null;

  if (input.kind === 'text') {
    const slot: 1 | 2 = input.textSlot === 2 ? 2 : 1;

    if (slot === 1 && prevBundle?.text1.trim() && prevBundle.text1Status === 'validated') {
      throw new SubmissionHttpError(
        403,
        'Votre Texte 1 a déjà été validé par le jury : la resoumission est désactivée.',
      );
    }
    if (slot === 2 && prevBundle?.text2.trim() && prevBundle.text2Status === 'validated') {
      throw new SubmissionHttpError(
        403,
        'Votre Texte 2 a déjà été validé par le jury : la resoumission est désactivée.',
      );
    }

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

    const nextBundle: DualTextSubmissionPayload = {
      __ucaepDualText: 1,
      text1: slot === 1 ? cleanText : prevBundle?.text1 || '',
      text2: slot === 2 ? cleanText : prevBundle?.text2 || '',
      text1Status: slot === 1 ? 'received' : prevBundle?.text1Status || 'received',
      text2Status: slot === 2 ? 'received' : prevBundle?.text2Status || 'received',
      text1Note: slot === 1 ? '' : prevBundle?.text1Note || '',
      text2Note: slot === 2 ? '' : prevBundle?.text2Note || '',
      video1: prevBundle?.video1 || null,
      video2: prevBundle?.video2 || null,
    };

    const savedRow = await persistSubmissionBundleRow({
      previous,
      registrationId: candidate.id,
      phaseId: phase.id,
      bundle: nextBundle,
    });

    return mapCandidateSubmissionSummary(savedRow);
  }

  if (input.kind !== 'file') {
    throw new SubmissionHttpError(400, 'Type de dépôt invalide.');
  }

  const vSlot: 1 | 2 = input.videoSlot === 2 ? 2 : 1;
  if (vSlot === 1 && prevBundle?.video1?.status === 'validated') {
    throw new SubmissionHttpError(
      403,
      'Votre Vidéo 1 a déjà été validée par le jury : la resoumission est désactivée.',
    );
  }
  if (vSlot === 2 && prevBundle?.video2?.status === 'validated') {
    throw new SubmissionHttpError(
      403,
      'Votre Vidéo 2 a déjà été validée par le jury : la resoumission est désactivée.',
    );
  }

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
  if (!normalizedMime || !isVideoMimeType(normalizedMime)) {
    throw new SubmissionHttpError(
      400,
      'Format de vidéo non autorisé (MP4, MOV ou WebM requis).',
    );
  }

  let storedSize = 0;

  if (isSupabaseAdminConfigured()) {
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
        'La vidéo n’a pas encore été reçue dans le stockage. Relancez le téléversement.',
      );
    }

    storedSize = Number(
      (matchedObject.metadata as { size?: number } | null)?.size ?? input.sizeBytes ?? 0,
    );
    if (!Number.isFinite(storedSize) || storedSize <= 0 || storedSize > MAX_UPLOAD_BYTES) {
      await admin.storage.from(SUBMISSIONS_BUCKET).remove([storagePath]).catch(() => {});
      throw new SubmissionHttpError(
        400,
        'La taille de la vidéo envoyée est invalide ou dépasse 100 Mo.',
      );
    }
  } else {
    const diskPath = resolveSafeUploadDiskPath(storagePath);
    let stat;
    try {
      stat = await fs.stat(diskPath);
    } catch {
      throw new SubmissionHttpError(
        400,
        'La vidéo n’a pas encore été reçue par le serveur. Relancez le téléversement.',
      );
    }
    storedSize = stat.size;
    if (!Number.isFinite(storedSize) || storedSize <= 0 || storedSize > MAX_UPLOAD_BYTES) {
      await fs.unlink(diskPath).catch(() => {});
      throw new SubmissionHttpError(
        400,
        'La taille de la vidéo envoyée est invalide ou dépasse 100 Mo.',
      );
    }
  }

  const safeDisplayName = rawFileName.slice(0, 180);
  const nowIso = new Date().toISOString();
  const newVideoSlot: VideoSlotSubmission = {
    storagePath,
    fileName: safeDisplayName,
    mimeType: normalizedMime,
    sizeBytes: storedSize,
    status: 'received',
    note: '',
    uploadedAt: nowIso,
  };

  const nextBundle: DualTextSubmissionPayload = {
    __ucaepDualText: 1,
    text1: prevBundle?.text1 || '',
    text2: prevBundle?.text2 || '',
    text1Status: prevBundle?.text1Status || 'received',
    text2Status: prevBundle?.text2Status || 'received',
    text1Note: prevBundle?.text1Note || '',
    text2Note: prevBundle?.text2Note || '',
    video1: vSlot === 1 ? newVideoSlot : prevBundle?.video1 || null,
    video2: vSlot === 2 ? newVideoSlot : prevBundle?.video2 || null,
  };

  const savedRow = await persistSubmissionBundleRow({
    previous,
    registrationId: candidate.id,
    phaseId: phase.id,
    bundle: nextBundle,
  });

  const oldSlotPath =
    vSlot === 1 ? prevBundle?.video1?.storagePath : prevBundle?.video2?.storagePath;
  if (oldSlotPath && oldSlotPath !== storagePath) {
    await deleteStoredFileIfExists(oldSlotPath);
  }

  return mapCandidateSubmissionSummary(savedRow);
}

export async function listAdminSubmissions(filters?: {
  phaseId?: string;
  status?: string;
}): Promise<{
  storageConfigured: boolean;
  uploadMode: SubmissionUploadMode;
  storageStats: AdminStorageStats;
  submissions: AdminSubmissionItem[];
}> {
  await assertDatabaseReady();

  // Récupération de l'ensemble des dépôts pour garantir une jauge de quota 1 Go exacte même si un filtre est actif
  const allRows = await withDbMode<
    Array<{
      submission: DbSubmissionRowLike;
      registration: DbRegistrationRowLike;
      phase: DbPhaseRowLike;
    }>
  >({
    pg: async () => {
      return db
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
        .innerJoin(phasesTable, eq(submissionsTable.phaseId, phasesTable.id))
        .orderBy(desc(submissionsTable.updatedAt));
    },
    rest: () => listAdminSubmissionsViaSupabaseRest(),
    local: async () => {
      const store = await readJsonStore();
      const regById = new Map(store.registrations.map((r) => [r.id, r]));
      const phaseById = new Map(
        store.phases.map((p, idx) => [p.id, toDbPhaseLikeFromLocal(p, idx)]),
      );

      return (store.submissions || [])
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .map((submission) => {
          const registration = regById.get(submission.registrationId);
          const phase = phaseById.get(submission.phaseId);
          return registration && phase
            ? { submission, registration, phase }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x));
    },
  });

  let totalBytes = 0;
  let fileCount = 0;

  for (const { submission } of allRows) {
    const bundle = extractSubmissionBundle(submission);
    if (bundle.video1) {
      totalBytes += bundle.video1.sizeBytes;
      fileCount += 1;
    }
    if (bundle.video2) {
      totalBytes += bundle.video2.sizeBytes;
      fileCount += 1;
    }
  }

  const storageStats: AdminStorageStats = {
    totalBytes,
    quotaBytes: SUPABASE_FREE_QUOTA_BYTES,
    fileCount,
    usagePercent: Math.min(
      100,
      Math.round((totalBytes / SUPABASE_FREE_QUOTA_BYTES) * 1000) / 10,
    ),
  };

  const filteredRows = allRows.filter(({ submission }) => {
    if (filters?.phaseId && filters.phaseId !== 'all' && submission.phaseId !== filters.phaseId) {
      return false;
    }
    if (
      filters?.status &&
      ['received', 'validated', 'rejected'].includes(filters.status) &&
      submission.status !== filters.status
    ) {
      return false;
    }
    return true;
  });

  const items: AdminSubmissionItem[] = filteredRows.map(
    ({ submission, registration, phase }) => {
      const bundle = extractSubmissionBundle(submission);
      const v1Size = bundle.video1?.sizeBytes || 0;
      const v2Size = bundle.video2?.sizeBytes || 0;
      const primaryVideo = bundle.video1 || bundle.video2 || null;

      return {
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
        fileName: primaryVideo?.fileName ?? submission.fileName ?? null,
        mimeType: primaryVideo?.mimeType ?? submission.mimeType ?? null,
        sizeBytes: primaryVideo?.sizeBytes ?? submission.sizeBytes ?? null,
        textPreview: buildTextSummaryPreview(bundle),
        text1Status: bundle.text1.trim() ? bundle.text1Status : undefined,
        text2Status: bundle.text2.trim() ? bundle.text2Status : undefined,
        video1Name: bundle.video1?.fileName ?? null,
        video1SizeBytes: bundle.video1?.sizeBytes ?? null,
        video1Status: bundle.video1 ? bundle.video1.status : undefined,
        video2Name: bundle.video2?.fileName ?? null,
        video2SizeBytes: bundle.video2?.sizeBytes ?? null,
        video2Status: bundle.video2 ? bundle.video2.status : undefined,
        totalFileBytes: v1Size + v2Size,
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
      };
    },
  );

  return {
    storageConfigured: true,
    uploadMode: getUploadMode(),
    storageStats,
    submissions: items,
  };
}

async function resolveVideoSlotAccess(
  slot: VideoSlotSubmission | null | undefined,
): Promise<AdminVideoSlotAccess | null> {
  if (!slot || !slot.storagePath) return null;

  if (isSupabaseAdminConfigured()) {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage
      .from(SUBMISSIONS_BUCKET)
      .createSignedUrl(slot.storagePath, 600);

    return {
      fileName: slot.fileName,
      mimeType: slot.mimeType,
      sizeBytes: slot.sizeBytes,
      signedUrl: !error && data?.signedUrl ? data.signedUrl : null,
      expiresInSeconds: !error && data?.signedUrl ? 600 : null,
      status: slot.status,
      note: slot.note || '',
      uploadedAt: slot.uploadedAt,
    };
  }

  const diskPath = resolveSafeUploadDiskPath(slot.storagePath);
  let exists = false;
  try {
    await fs.access(diskPath);
    exists = true;
  } catch {
    exists = false;
  }

  let signedUrl: string | null = null;
  if (exists) {
    const downloadToken = signTokenPayload({
      purpose: 'local-download',
      storagePath: slot.storagePath,
      fileName: slot.fileName || 'video.mp4',
      mimeType: slot.mimeType || 'video/mp4',
      exp: Date.now() + 600 * 1000,
    });
    signedUrl = `/api/submissions/local-file?token=${encodeURIComponent(downloadToken)}`;
  }

  return {
    fileName: slot.fileName,
    mimeType: slot.mimeType,
    sizeBytes: slot.sizeBytes,
    signedUrl,
    expiresInSeconds: signedUrl ? 600 : null,
    status: slot.status,
    note: slot.note || '',
    uploadedAt: slot.uploadedAt,
  };
}

export async function getAdminSubmissionAccess(
  submissionId: string,
): Promise<AdminSubmissionAccess> {
  await assertDatabaseReady();
  const submission = await withDbMode<DbSubmissionRowLike | null>({
    pg: async () => {
      const rows = await db
        .select()
        .from(submissionsTable)
        .where(eq(submissionsTable.id, submissionId))
        .limit(1);
      return rows[0] || null;
    },
    rest: () => getSubmissionByIdViaSupabaseRest(submissionId),
    local: async () => {
      const store = await readJsonStore();
      return (store.submissions || []).find((s) => s.id === submissionId) || null;
    },
  });

  if (!submission) {
    throw new SubmissionHttpError(404, 'Dépôt introuvable.');
  }

  const bundle = extractSubmissionBundle(submission);
  const [video1Access, video2Access] = await Promise.all([
    resolveVideoSlotAccess(bundle.video1),
    resolveVideoSlotAccess(bundle.video2),
  ]);
  const primaryVideo = video1Access || video2Access || null;

  return {
    id: submission.id,
    kind: submission.kind,
    fileName: primaryVideo?.fileName ?? submission.fileName ?? null,
    mimeType: primaryVideo?.mimeType ?? submission.mimeType ?? null,
    sizeBytes: primaryVideo?.sizeBytes ?? submission.sizeBytes ?? null,
    signedUrl: primaryVideo?.signedUrl ?? null,
    expiresInSeconds: primaryVideo?.expiresInSeconds ?? null,
    textContent: bundle.text1 || null,
    text1Content: bundle.text1 || null,
    text2Content: bundle.text2 || null,
    text1Status: bundle.text1.trim() ? bundle.text1Status : undefined,
    text2Status: bundle.text2.trim() ? bundle.text2Status : undefined,
    text1Note: bundle.text1Note || '',
    text2Note: bundle.text2Note || '',
    video1: video1Access,
    video2: video2Access,
  };
}

export async function resolveLocalSubmissionFile(token: string): Promise<{
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}> {
  const payload = verifyTokenPayload<{
    purpose?: string;
    storagePath?: string;
    fileName?: string;
    mimeType?: string;
    exp?: number;
  }>(token);

  if (!payload || payload.purpose !== 'local-download' || !payload.storagePath) {
    throw new SubmissionHttpError(401, 'Lien de téléchargement expiré ou invalide.');
  }

  const diskPath = resolveSafeUploadDiskPath(payload.storagePath);
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(diskPath);
  } catch {
    throw new SubmissionHttpError(404, 'Fichier introuvable.');
  }

  return {
    fileName: sanitizeFileName(payload.fileName || 'production'),
    mimeType: payload.mimeType || 'application/octet-stream',
    buffer,
  };
}

async function persistBundleReviewUpdate(
  submissionId: string,
  bundle: DualTextSubmissionPayload,
): Promise<DbSubmissionRowLike> {
  const fields = buildPersistedBundleFields(bundle);
  return withDbMode<DbSubmissionRowLike>({
    pg: async () => {
      const updated = await db
        .update(submissionsTable)
        .set({
          kind: fields.kind,
          storagePath: fields.storagePath,
          fileName: fields.fileName,
          mimeType: fields.mimeType,
          sizeBytes: fields.sizeBytes,
          textContent: fields.textContent,
          status: fields.status,
          organizerNote: fields.organizerNote,
          updatedAt: new Date(),
        })
        .where(eq(submissionsTable.id, submissionId))
        .returning();
      return updated[0];
    },
    rest: () =>
      updateSubmissionReviewViaSupabaseRest(submissionId, {
        status: fields.status,
        organizerNote: fields.organizerNote,
        kind: fields.kind,
        storagePath: fields.storagePath,
        fileName: fields.fileName,
        mimeType: fields.mimeType,
        textContent: fields.textContent,
        sizeBytes: fields.sizeBytes,
      }),
    local: () =>
      withJsonStoreLock((store) => {
        const list = store.submissions || [];
        const idx = list.findIndex((s) => s.id === submissionId);
        if (idx === -1) {
          throw new SubmissionHttpError(404, 'Dépôt introuvable.');
        }
        list[idx] = {
          ...list[idx],
          kind: fields.kind,
          storagePath: fields.storagePath,
          fileName: fields.fileName,
          mimeType: fields.mimeType,
          sizeBytes: fields.sizeBytes,
          textContent: fields.textContent,
          status: fields.status,
          organizerNote: fields.organizerNote,
          updatedAt: new Date().toISOString(),
        };
        return list[idx];
      }),
  });
}

export async function updateAdminSubmissionReview(
  submissionId: string,
  patch: {
    status?: SubmissionStatus;
    organizerNote?: string;
    textSlot?: 1 | 2;
    videoSlot?: 1 | 2;
  },
): Promise<{
  id: string;
  status: SubmissionStatus;
  organizerNote: string;
  updatedAt: string;
  text1Status?: SubmissionStatus;
  text2Status?: SubmissionStatus;
  text1Note?: string;
  text2Note?: string;
  video1Status?: SubmissionStatus;
  video2Status?: SubmissionStatus;
  video1Note?: string;
  video2Note?: string;
}> {
  await assertDatabaseReady();

  const current = await withDbMode<DbSubmissionRowLike | null>({
    pg: async () => {
      const existingRows = await db
        .select()
        .from(submissionsTable)
        .where(eq(submissionsTable.id, submissionId))
        .limit(1);
      return existingRows[0] || null;
    },
    rest: () => getSubmissionByIdViaSupabaseRest(submissionId),
    local: async () => {
      const store = await readJsonStore();
      return (store.submissions || []).find((s) => s.id === submissionId) || null;
    },
  });

  if (!current) {
    throw new SubmissionHttpError(404, 'Dépôt introuvable.');
  }

  const bundle = extractSubmissionBundle(current);
  const validPatchStatus =
    patch.status && ['received', 'validated', 'rejected'].includes(patch.status)
      ? patch.status
      : undefined;

  if (patch.textSlot === 1 || patch.textSlot === 2) {
    if (patch.textSlot === 1 && !bundle.text1.trim()) {
      throw new SubmissionHttpError(
        400,
        "Le Texte 1 n'a pas encore été soumis par ce candidat.",
      );
    }
    if (patch.textSlot === 2 && !bundle.text2.trim()) {
      throw new SubmissionHttpError(
        400,
        "Le Texte 2 n'a pas encore été soumis par ce candidat.",
      );
    }

    if (
      patch.textSlot === 2 &&
      validPatchStatus === 'validated' &&
      bundle.text1Status !== 'validated'
    ) {
      throw new SubmissionHttpError(
        400,
        "Validation séquentielle requise : validez d'abord le Texte 1 avant de valider le Texte 2.",
      );
    }

    const nextBundle: DualTextSubmissionPayload = {
      ...bundle,
      text1Status:
        patch.textSlot === 1 && validPatchStatus ? validPatchStatus : bundle.text1Status,
      text2Status:
        patch.textSlot === 2 && validPatchStatus ? validPatchStatus : bundle.text2Status,
      text1Note:
        patch.textSlot === 1 && typeof patch.organizerNote === 'string'
          ? patch.organizerNote.trim().slice(0, 700)
          : bundle.text1Note,
      text2Note:
        patch.textSlot === 2 && typeof patch.organizerNote === 'string'
          ? patch.organizerNote.trim().slice(0, 700)
          : bundle.text2Note,
    };

    const row = await persistBundleReviewUpdate(submissionId, nextBundle);
    return {
      id: row.id,
      status: row.status,
      organizerNote: row.organizerNote,
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      text1Status: nextBundle.text1.trim() ? nextBundle.text1Status : undefined,
      text2Status: nextBundle.text2.trim() ? nextBundle.text2Status : undefined,
      text1Note: nextBundle.text1Note,
      text2Note: nextBundle.text2Note,
      video1Status: nextBundle.video1?.status,
      video2Status: nextBundle.video2?.status,
      video1Note: nextBundle.video1?.note || '',
      video2Note: nextBundle.video2?.note || '',
    };
  }

  if (patch.videoSlot === 1 || patch.videoSlot === 2) {
    const target = patch.videoSlot === 1 ? bundle.video1 : bundle.video2;
    if (!target) {
      throw new SubmissionHttpError(
        400,
        `La Vidéo ${patch.videoSlot} n'a pas encore été déposée par ce candidat.`,
      );
    }

    const updatedSlot: VideoSlotSubmission = {
      ...target,
      status: validPatchStatus ?? target.status,
      note:
        typeof patch.organizerNote === 'string'
          ? patch.organizerNote.trim().slice(0, 700)
          : target.note || '',
    };

    const nextBundle: DualTextSubmissionPayload = {
      ...bundle,
      video1: patch.videoSlot === 1 ? updatedSlot : bundle.video1,
      video2: patch.videoSlot === 2 ? updatedSlot : bundle.video2,
    };

    const row = await persistBundleReviewUpdate(submissionId, nextBundle);
    return {
      id: row.id,
      status: row.status,
      organizerNote: row.organizerNote,
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      text1Status: nextBundle.text1.trim() ? nextBundle.text1Status : undefined,
      text2Status: nextBundle.text2.trim() ? nextBundle.text2Status : undefined,
      text1Note: nextBundle.text1Note,
      text2Note: nextBundle.text2Note,
      video1Status: nextBundle.video1?.status,
      video2Status: nextBundle.video2?.status,
      video1Note: nextBundle.video1?.note || '',
      video2Note: nextBundle.video2?.note || '',
    };
  }

  const nextStatus: SubmissionStatus = validPatchStatus ?? current.status;
  const nextNote =
    typeof patch.organizerNote === 'string'
      ? patch.organizerNote.trim().slice(0, 1500)
      : current.organizerNote;

  const row = await withDbMode<DbSubmissionRowLike>({
    pg: async () => {
      const updated = await db
        .update(submissionsTable)
        .set({
          status: nextStatus,
          organizerNote: nextNote,
          updatedAt: new Date(),
        })
        .where(eq(submissionsTable.id, submissionId))
        .returning();
      return updated[0];
    },
    rest: () =>
      updateSubmissionReviewViaSupabaseRest(submissionId, {
        status: nextStatus,
        organizerNote: nextNote,
      }),
    local: () =>
      withJsonStoreLock((store) => {
        const list = store.submissions || [];
        const idx = list.findIndex((s) => s.id === submissionId);
        if (idx === -1) {
          throw new SubmissionHttpError(404, 'Dépôt introuvable.');
        }
        list[idx] = {
          ...list[idx],
          status: nextStatus,
          organizerNote: nextNote,
          updatedAt: new Date().toISOString(),
        };
        return list[idx];
      }),
  });

  return {
    id: row.id,
    status: row.status,
    organizerNote: row.organizerNote,
    updatedAt:
      row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  };
}

export async function purgeAdminSubmissionVideo(
  submissionId: string,
  videoSlot: 1 | 2,
): Promise<{
  id: string;
  freedBytes: number;
  status: SubmissionStatus;
  organizerNote: string;
}> {
  await assertDatabaseReady();

  const current = await withDbMode<DbSubmissionRowLike | null>({
    pg: async () => {
      const existingRows = await db
        .select()
        .from(submissionsTable)
        .where(eq(submissionsTable.id, submissionId))
        .limit(1);
      return existingRows[0] || null;
    },
    rest: () => getSubmissionByIdViaSupabaseRest(submissionId),
    local: async () => {
      const store = await readJsonStore();
      return (store.submissions || []).find((s) => s.id === submissionId) || null;
    },
  });

  if (!current) {
    throw new SubmissionHttpError(404, 'Dépôt introuvable.');
  }

  const bundle = extractSubmissionBundle(current);
  const target = videoSlot === 1 ? bundle.video1 : bundle.video2;
  if (!target) {
    throw new SubmissionHttpError(
      404,
      `Aucune Vidéo ${videoSlot} enregistrée pour ce dossier.`,
    );
  }

  const nextBundle: DualTextSubmissionPayload = {
    ...bundle,
    video1: videoSlot === 1 ? null : bundle.video1,
    video2: videoSlot === 2 ? null : bundle.video2,
  };

  const saved = await persistBundleReviewUpdate(submissionId, nextBundle);
  await deleteStoredFileIfExists(target.storagePath);

  return {
    id: saved.id,
    freedBytes: target.sizeBytes,
    status: saved.status,
    organizerNote: saved.organizerNote,
  };
}

export function isSubmissionHttpError(err: unknown): err is SubmissionHttpError {
  return err instanceof SubmissionHttpError;
}
