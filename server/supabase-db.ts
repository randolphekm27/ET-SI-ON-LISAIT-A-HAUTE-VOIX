import crypto from 'node:crypto';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabase-admin.ts';
import type {
  Announcement,
  CompetitionPhase,
  ContactMessageRecord,
  ContactPayload,
  MediaAssetKey,
  NewsArticle,
  PhaseTestDetails,
  PublicationStatus,
  RegistrationPayload,
  RegistrationRecord,
  SubmissionKind,
  SubmissionStatus,
} from '../src/types/competition';

export interface SupabaseStoreSnapshot {
  phases: CompetitionPhase[];
  announcements: Announcement[];
  news: NewsArticle[];
  registrations: RegistrationRecord[];
  contacts: ContactMessageRecord[];
  settings: {
    googleAppsScriptUrl: string;
    googleFormActionUrl: string;
    officialEmail: string;
  };
}

export interface DbPhaseRowLike {
  id: string;
  number: number;
  title: string;
  shortDescription: string;
  format: 'En ligne' | 'En présentiel';
  statusLabel: 'À venir' | 'Ouverte' | 'En cours' | 'Verrouillée' | 'Clôturée';
  isRevealed: boolean;
  submissionsOpen: boolean;
  submissionDeadline: Date | string | null;
  imageKey: MediaAssetKey;
  testDetails: PhaseTestDetails | null;
  sortOrder: number;
}

export interface DbRegistrationRowLike {
  id: string;
  referenceCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'Féminin' | 'Masculin' | 'Préfère ne pas préciser';
  institution: string;
  department: string;
  studyLevel: string;
  studentId: string;
  motivation: string;
  readingExperience: string;
  acceptRules: boolean;
  syncedToGoogleSheets: boolean;
  syncTarget: 'google_apps_script' | 'google_forms' | 'local_archive';
  createdAt: Date | string;
}

export interface DbSubmissionRowLike {
  id: string;
  registrationId: string;
  phaseId: string;
  kind: SubmissionKind;
  storagePath: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  textContent: string | null;
  status: SubmissionStatus;
  organizerNote: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

let preferRestFlag = false;

export function shouldUseSupabaseRestFallback(): boolean {
  if (!isSupabaseAdminConfigured()) return false;
  if (preferRestFlag) return true;
  // Sur Vercel, l'hôte direct db.<ref>.supabase.co est IPv6 uniquement (ENOTFOUND sur AWS Lambda IPv4)
  const dbUrl = (process.env.DATABASE_URL || '').trim();
  if (!dbUrl && isSupabaseAdminConfigured()) return true;
  if (process.env.VERCEL && /@db\.[a-z0-9]+\.supabase\.co/i.test(dbUrl)) {
    return true;
  }
  return false;
}

export function markPreferSupabaseRest(): void {
  if (isSupabaseAdminConfigured()) {
    preferRestFlag = true;
  }
}

export function isNetworkOrDnsError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as {
    code?: unknown;
    message?: unknown;
    cause?: { code?: unknown; message?: unknown };
  };
  const code = String(e.cause?.code || e.code || '').toUpperCase();
  const msg = String(e.cause?.message || e.message || '').toLowerCase();
  if (
    [
      'ENOTFOUND',
      'EAI_AGAIN',
      'ENETUNREACH',
      'EHOSTUNREACH',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ECONNRESET',
    ].includes(code)
  ) {
    return true;
  }
  return (
    msg.includes('getaddrinfo') ||
    msg.includes('enotfound') ||
    msg.includes('enetunreach') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout')
  );
}

function mapPhaseFromRest(row: Record<string, any>): CompetitionPhase {
  return {
    id: String(row.id),
    number: String(row.phase_number ?? 1).padStart(2, '0'),
    title: String(row.title || ''),
    shortDescription: String(row.short_description || ''),
    format: (row.format || 'En ligne') as CompetitionPhase['format'],
    statusLabel: (row.status_label || 'À venir') as CompetitionPhase['statusLabel'],
    isRevealed: Boolean(row.is_revealed),
    submissionsOpen: Boolean(row.submissions_open),
    submissionDeadline: row.submission_deadline ? String(row.submission_deadline) : null,
    imageKey: (row.image_key || 'campus') as MediaAssetKey,
    testDetails: (row.test_details || null) as PhaseTestDetails | null,
  };
}

export function mapPhaseRowLikeFromRest(row: Record<string, any>): DbPhaseRowLike {
  return {
    id: String(row.id),
    number: Number(row.phase_number ?? 1),
    title: String(row.title || ''),
    shortDescription: String(row.short_description || ''),
    format: (row.format || 'En ligne') as DbPhaseRowLike['format'],
    statusLabel: (row.status_label || 'À venir') as DbPhaseRowLike['statusLabel'],
    isRevealed: Boolean(row.is_revealed),
    submissionsOpen: Boolean(row.submissions_open),
    submissionDeadline: row.submission_deadline ? String(row.submission_deadline) : null,
    imageKey: (row.image_key || 'campus') as MediaAssetKey,
    testDetails: (row.test_details || null) as PhaseTestDetails | null,
    sortOrder: Number(row.display_order ?? 0),
  };
}

function mapAnnouncementFromRest(row: Record<string, any>): Announcement {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt),
    content: String(row.content),
    publishedAt: String(row.published_at),
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : undefined,
    status: (row.status || 'draft') as PublicationStatus,
    category: String(row.category || 'Officiel'),
    imageKey: (row.image_key || 'campus') as MediaAssetKey,
  };
}

function mapNewsFromRest(row: Record<string, any>): NewsArticle {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    category: (row.category || 'Vie du concours') as NewsArticle['category'],
    publishedAt: String(row.published_at),
    readTime: String(row.read_time || '2 min'),
    excerpt: String(row.excerpt),
    content: Array.isArray(row.content) ? row.content : [],
    imageKey: (row.image_key || 'campus') as MediaAssetKey,
    featured: Boolean(row.featured),
    status: (row.status || 'published') as PublicationStatus,
  };
}

function mapRegistrationFromRest(row: Record<string, any>): DbRegistrationRowLike {
  return {
    id: String(row.id),
    referenceCode: String(row.reference_code),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    email: String(row.email),
    phone: String(row.phone),
    birthDate: String(row.birth_date),
    gender: (row.gender || 'Féminin') as RegistrationRecord['gender'],
    institution: String(row.institution),
    department: String(row.department),
    studyLevel: String(row.study_level),
    studentId: String(row.student_id),
    motivation: String(row.motivation),
    readingExperience: String(row.reading_experience || ''),
    acceptRules: Boolean(row.accept_rules ?? true),
    syncedToGoogleSheets: Boolean(row.synced_to_google_sheets),
    syncTarget: (row.sync_target || 'local_archive') as RegistrationRecord['syncTarget'],
    createdAt: String(row.created_at),
  };
}

function mapSubmissionFromRest(row: Record<string, any>): DbSubmissionRowLike {
  return {
    id: String(row.id),
    registrationId: String(row.registration_id),
    phaseId: String(row.phase_id),
    kind: (row.kind || 'file') as SubmissionKind,
    storagePath: row.storage_path ? String(row.storage_path) : null,
    fileName: row.file_name ? String(row.file_name) : null,
    mimeType: row.mime_type ? String(row.mime_type) : null,
    sizeBytes:
      row.size_bytes !== null && row.size_bytes !== undefined
        ? Number(row.size_bytes)
        : null,
    textContent: row.text_content !== null && row.text_content !== undefined ? String(row.text_content) : null,
    status: (row.status || 'received') as SubmissionStatus,
    organizerNote: String(row.organizer_note || ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function seedDefaultsViaRestIfEmpty(defaults: {
  phases: CompetitionPhase[];
  announcements: Announcement[];
  news: NewsArticle[];
}): Promise<void> {
  const admin = getSupabaseAdmin();

  const { data: existingPhases } = await admin
    .from('competition_phases')
    .select('id')
    .limit(1);
  if (!existingPhases || existingPhases.length === 0) {
    await admin.from('competition_phases').upsert(
      defaults.phases.map((p, idx) => ({
        id: p.id,
        phase_number: parseInt(p.number, 10) || idx + 1,
        title: p.title,
        short_description: p.shortDescription,
        format: p.format,
        status_label: p.statusLabel,
        is_revealed: p.isRevealed,
        submissions_open: Boolean(p.submissionsOpen),
        submission_deadline: p.submissionDeadline || null,
        image_key: p.imageKey,
        test_details: p.testDetails || null,
        display_order: idx + 1,
      })),
      { onConflict: 'id' },
    );
  }

  const { data: existingAnn } = await admin
    .from('announcements')
    .select('id')
    .limit(1);
  if (!existingAnn || existingAnn.length === 0) {
    await admin.from('announcements').upsert(
      defaults.announcements.map((a) => ({
        id: crypto.randomUUID(),
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        published_at: a.publishedAt,
        scheduled_at: a.scheduledAt || null,
        status: a.status,
        category: a.category,
        image_key: a.imageKey,
      })),
      { onConflict: 'slug' },
    );
  }

  const { data: existingNews } = await admin
    .from('news_articles')
    .select('id')
    .limit(1);
  if (!existingNews || existingNews.length === 0) {
    await admin.from('news_articles').upsert(
      defaults.news.map((n) => ({
        id: crypto.randomUUID(),
        slug: n.slug,
        title: n.title,
        category: n.category,
        published_at: n.publishedAt,
        read_time: n.readTime,
        excerpt: n.excerpt,
        content: n.content,
        image_key: n.imageKey,
        featured: Boolean(n.featured),
        status: n.status,
      })),
      { onConflict: 'slug' },
    );
  }
}

export async function readStoreViaSupabaseRest(defaults: {
  phases: CompetitionPhase[];
  announcements: Announcement[];
  news: NewsArticle[];
}): Promise<SupabaseStoreSnapshot> {
  const admin = getSupabaseAdmin();

  const phasesRes = await admin
    .from('competition_phases')
    .select('*')
    .order('display_order', { ascending: true });
  if (phasesRes.error) {
    throw new Error(`Supabase REST (competition_phases): ${phasesRes.error.message}`);
  }

  if (!phasesRes.data || phasesRes.data.length === 0) {
    await seedDefaultsViaRestIfEmpty(defaults);
  }

  const [pRes, aRes, nRes, rRes, cRes, sRes] = await Promise.all([
    admin.from('competition_phases').select('*').order('display_order', { ascending: true }),
    admin.from('announcements').select('*').order('published_at', { ascending: false }),
    admin.from('news_articles').select('*').order('published_at', { ascending: false }),
    admin.from('registrations').select('*').order('created_at', { ascending: false }),
    admin.from('contact_messages').select('*').order('created_at', { ascending: false }),
    admin.from('site_settings').select('*'),
  ]);

  if (pRes.error) throw new Error(pRes.error.message);
  if (aRes.error) throw new Error(aRes.error.message);
  if (nRes.error) throw new Error(nRes.error.message);
  if (rRes.error) throw new Error(rRes.error.message);
  if (cRes.error) throw new Error(cRes.error.message);

  const settingsMap = new Map<string, string>();
  for (const row of sRes.data || []) {
    const val = row.value;
    settingsMap.set(
      String(row.key),
      typeof val === 'string'
        ? val
        : typeof val === 'object' && val !== null
          ? val.url || val.value || JSON.stringify(val)
          : String(val || ''),
    );
  }

  return {
    phases: (pRes.data || []).map(mapPhaseFromRest),
    announcements: (aRes.data || []).map(mapAnnouncementFromRest),
    news: (nRes.data || []).map(mapNewsFromRest),
    registrations: (rRes.data || []).map((r) => {
      const mapped = mapRegistrationFromRest(r);
      return {
        ...mapped,
        createdAt: String(mapped.createdAt),
      };
    }),
    contacts: (cRes.data || []).map((c) => ({
      id: String(c.id),
      name: String(c.name),
      email: String(c.email),
      subject: String(c.subject),
      message: String(c.message),
      createdAt: String(c.created_at),
    })),
    settings: {
      googleAppsScriptUrl:
        settingsMap.get('googleAppsScriptUrl') ||
        process.env.GOOGLE_APPS_SCRIPT_URL ||
        '',
      googleFormActionUrl:
        settingsMap.get('googleFormActionUrl') ||
        process.env.GOOGLE_FORM_ACTION_URL ||
        '',
      officialEmail: 'ucaeplokossa@gmail.com',
    },
  };
}

export async function createAnnouncementViaSupabaseRest(input: {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: PublicationStatus;
  scheduledAt?: string;
  imageKey: MediaAssetKey;
}): Promise<Announcement> {
  const admin = getSupabaseAdmin();
  const { data: slugRows } = await admin
    .from('announcements')
    .select('id')
    .eq('slug', input.slug)
    .limit(1);
  const uniqueSlug =
    slugRows && slugRows.length > 0
      ? `${input.slug}-${Date.now().toString().slice(-4)}`
      : input.slug;

  const { data, error } = await admin
    .from('announcements')
    .insert({
      id: crypto.randomUUID(),
      slug: uniqueSlug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      category: input.category,
      status: input.status,
      scheduled_at:
        input.status === 'scheduled' && input.scheduledAt ? input.scheduledAt : null,
      published_at: new Date().toISOString(),
      image_key: input.imageKey,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Impossible de créer l'annonce.");
  }
  return mapAnnouncementFromRest(data);
}

export async function updateAnnouncementViaSupabaseRest(
  id: string,
  patch: {
    title?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    status?: PublicationStatus;
    scheduledAt?: string;
  },
): Promise<Announcement | null> {
  const admin = getSupabaseAdmin();
  const { data: current } = await admin
    .from('announcements')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!current) return null;

  const nextStatus = patch.status || current.status;
  const { data, error } = await admin
    .from('announcements')
    .update({
      title: patch.title?.trim() || current.title,
      excerpt: patch.excerpt?.trim() || current.excerpt,
      content: patch.content?.trim() || current.content,
      category: patch.category?.trim() || current.category,
      status: nextStatus,
      scheduled_at:
        nextStatus === 'scheduled'
          ? patch.scheduledAt || current.scheduled_at
          : null,
      published_at:
        nextStatus === 'published' && current.status !== 'published'
          ? new Date().toISOString()
          : current.published_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapAnnouncementFromRest(data);
}

export async function updatePhaseViaSupabaseRest(
  id: string,
  patch: {
    statusLabel?: CompetitionPhase['statusLabel'];
    isRevealed?: boolean;
    submissionsOpen?: boolean;
    submissionDeadline?: Date | null | undefined;
    testDetails?: Partial<PhaseTestDetails>;
  },
): Promise<CompetitionPhase | null> {
  const admin = getSupabaseAdmin();
  const { data: current } = await admin
    .from('competition_phases')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!current) return null;

  const existingDetails = (current.test_details || null) as PhaseTestDetails | null;
  const nextDetails: PhaseTestDetails | null = patch.testDetails
    ? {
        instructionsTitle:
          patch.testDetails.instructionsTitle ||
          existingDetails?.instructionsTitle ||
          '',
        theme: patch.testDetails.theme || existingDetails?.theme || '',
        instructions:
          patch.testDetails.instructions || existingDetails?.instructions || '',
        submissionNote:
          patch.testDetails.submissionNote || existingDetails?.submissionNote || '',
      }
    : existingDetails;

  const nextOpen =
    current.format === 'En présentiel' || current.id === 'phase-3'
      ? false
      : typeof patch.submissionsOpen === 'boolean'
        ? patch.submissionsOpen
        : Boolean(current.submissions_open);

  const { data, error } = await admin
    .from('competition_phases')
    .update({
      status_label: patch.statusLabel || current.status_label,
      is_revealed:
        typeof patch.isRevealed === 'boolean' ? patch.isRevealed : current.is_revealed,
      submissions_open: nextOpen,
      submission_deadline:
        patch.submissionDeadline === undefined
          ? current.submission_deadline
          : patch.submissionDeadline
            ? patch.submissionDeadline.toISOString()
            : null,
      test_details: nextDetails,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapPhaseFromRest(data);
}

export async function createNewsViaSupabaseRest(input: {
  slug: string;
  title: string;
  category: NewsArticle['category'];
  excerpt: string;
  paragraphs: string[];
  readTime: string;
  imageKey: MediaAssetKey;
  status: PublicationStatus;
}): Promise<NewsArticle> {
  const admin = getSupabaseAdmin();
  const { data: slugRows } = await admin
    .from('news_articles')
    .select('id')
    .eq('slug', input.slug)
    .limit(1);
  const uniqueSlug =
    slugRows && slugRows.length > 0
      ? `${input.slug}-${Date.now().toString().slice(-4)}`
      : input.slug;

  const { data, error } = await admin
    .from('news_articles')
    .insert({
      id: crypto.randomUUID(),
      slug: uniqueSlug,
      title: input.title,
      category: input.category,
      published_at: new Date().toISOString(),
      read_time: input.readTime,
      excerpt: input.excerpt,
      content: input.paragraphs,
      image_key: input.imageKey,
      featured: false,
      status: input.status,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Impossible de publier l'actualité.");
  }
  return mapNewsFromRest(data);
}

export async function updateNewsViaSupabaseRest(
  id: string,
  patch: {
    title?: string;
    excerpt?: string;
    paragraphs?: string[];
    category?: NewsArticle['category'];
    status?: PublicationStatus;
    imageKey?: MediaAssetKey;
  },
): Promise<NewsArticle | null> {
  const admin = getSupabaseAdmin();
  const { data: current } = await admin
    .from('news_articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!current) return null;

  const { data, error } = await admin
    .from('news_articles')
    .update({
      title: patch.title?.trim() || current.title,
      excerpt: patch.excerpt?.trim() || current.excerpt,
      content: patch.paragraphs || current.content,
      category: patch.category || current.category,
      status: patch.status || current.status,
      image_key: patch.imageKey || current.image_key,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapNewsFromRest(data);
}

export async function updateSettingsViaSupabaseRest(cleanUrl: string): Promise<{
  googleAppsScriptUrl: string;
  googleFormActionUrl: string;
  officialEmail: string;
}> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('site_settings').upsert(
    {
      key: 'googleAppsScriptUrl',
      value: { url: cleanUrl },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  );
  if (error) {
    throw new Error(error.message);
  }
  return {
    googleAppsScriptUrl: cleanUrl,
    googleFormActionUrl: process.env.GOOGLE_FORM_ACTION_URL || '',
    officialEmail: 'ucaeplokossa@gmail.com',
  };
}

export async function saveRegistrationViaSupabaseRest(
  payload: RegistrationPayload,
  normalizedEmail: string,
  normalizedMatricule: string,
): Promise<{ record: RegistrationRecord; gasUrl: string }> {
  const admin = getSupabaseAdmin();

  const { data: existingDup } = await admin
    .from('registrations')
    .select('id,email,student_id')
    .or(`email.eq.${normalizedEmail},student_id.eq.${normalizedMatricule}`)
    .limit(1);

  if (existingDup && existingDup.length > 0) {
    const dup = existingDup[0];
    const msg =
      String(dup.student_id || '').toUpperCase() === normalizedMatricule
        ? 'Une inscription existe déjà avec ce numéro matricule.'
        : 'Une inscription existe déjà avec cette adresse e-mail.';
    const conflictErr = new Error(msg);
    (conflictErr as Error & { statusCode?: number }).statusCode = 409;
    throw conflictErr;
  }

  const { data: latestRefs } = await admin
    .from('registrations')
    .select('reference_code')
    .order('created_at', { ascending: false })
    .limit(50);

  let maxNum = 0;
  for (const r of latestRefs || []) {
    const m = String(r.reference_code || '').match(/(\d+)$/);
    if (m) {
      const parsed = parseInt(m[1], 10);
      if (!Number.isNaN(parsed) && parsed > maxNum) maxNum = parsed;
    }
  }
  const referenceCode = `UCAEP-2026-${String(maxNum + 1).padStart(4, '0')}`;

  const { data: gasRow } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'googleAppsScriptUrl')
    .maybeSingle();

  const rawGas = gasRow?.value;
  const gasUrl =
    (typeof rawGas === 'string'
      ? rawGas
      : (rawGas as { url?: string } | null)?.url) ||
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    '';

  const nowIso = new Date().toISOString();
  const record: RegistrationRecord = {
    ...payload,
    email: normalizedEmail,
    studentId: normalizedMatricule,
    id: crypto.randomUUID(),
    referenceCode,
    createdAt: nowIso,
    syncedToGoogleSheets: false,
    syncTarget: gasUrl ? 'google_apps_script' : 'local_archive',
  };

  const { error: insertErr } = await admin.from('registrations').insert({
    id: record.id,
    reference_code: record.referenceCode,
    first_name: record.firstName,
    last_name: record.lastName,
    email: record.email,
    phone: record.phone,
    birth_date: record.birthDate,
    gender: record.gender,
    institution: record.institution,
    department: record.department,
    study_level: record.studyLevel,
    student_id: record.studentId,
    motivation: record.motivation,
    reading_experience: record.readingExperience || '',
    accept_rules: Boolean(record.acceptRules),
    status: 'registered',
    synced_to_google_sheets: false,
    sync_target: record.syncTarget,
    created_at: nowIso,
  });

  if (insertErr) {
    if (insertErr.code === '23505') {
      const conflictErr = new Error(
        'Une inscription existe déjà avec cette adresse e-mail ou ce numéro matricule.',
      );
      (conflictErr as Error & { statusCode?: number }).statusCode = 409;
      throw conflictErr;
    }
    throw new Error(insertErr.message);
  }

  return { record, gasUrl };
}

export async function markRegistrationSyncedViaSupabaseRest(id: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin
    .from('registrations')
    .update({ synced_to_google_sheets: true })
    .eq('id', id);
}

export async function saveContactViaSupabaseRest(
  payload: ContactPayload,
): Promise<ContactMessageRecord> {
  const admin = getSupabaseAdmin();
  const record: ContactMessageRecord = {
    ...payload,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  const { error } = await admin.from('contact_messages').insert({
    id: record.id,
    name: record.name,
    email: record.email,
    subject: record.subject,
    message: record.message,
    status: 'non_lu',
    created_at: record.createdAt,
  });

  if (error) throw new Error(error.message);
  return record;
}

export async function verifyCandidateViaSupabaseRest(
  cleanRef: string,
  cleanEmail: string,
): Promise<DbRegistrationRowLike | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('registrations')
    .select('*')
    .ilike('reference_code', cleanRef)
    .ilike('email', cleanEmail)
    .limit(1);

  if (error) throw new Error(error.message);
  if (!data || !data[0]) return null;
  return mapRegistrationFromRest(data[0]);
}

export async function listPhasesViaSupabaseRest(): Promise<DbPhaseRowLike[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('competition_phases')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(mapPhaseRowLikeFromRest);
}

export async function getPhaseByIdViaSupabaseRest(
  phaseId: string,
): Promise<DbPhaseRowLike | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('competition_phases')
    .select('*')
    .eq('id', phaseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPhaseRowLikeFromRest(data) : null;
}

export async function getCandidateSubmissionsViaSupabaseRest(
  registrationId: string,
): Promise<DbSubmissionRowLike[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('submissions')
    .select('*')
    .eq('registration_id', registrationId);
  if (error) throw new Error(error.message);
  return (data || []).map(mapSubmissionFromRest);
}

export async function getSubmissionForCandidatePhaseViaSupabaseRest(
  registrationId: string,
  phaseId: string,
): Promise<DbSubmissionRowLike | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('submissions')
    .select('*')
    .eq('registration_id', registrationId)
    .eq('phase_id', phaseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSubmissionFromRest(data) : null;
}

export async function upsertSubmissionViaSupabaseRest(values: {
  id: string;
  registrationId: string;
  phaseId: string;
  kind: SubmissionKind;
  storagePath: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  textContent: string | null;
  status: SubmissionStatus;
  organizerNote: string;
}): Promise<DbSubmissionRowLike> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from('submissions')
    .upsert(
      {
        id: values.id,
        registration_id: values.registrationId,
        phase_id: values.phaseId,
        kind: values.kind,
        storage_path: values.storagePath,
        file_name: values.fileName,
        mime_type: values.mimeType,
        size_bytes: values.sizeBytes,
        text_content: values.textContent,
        status: values.status,
        organizer_note: values.organizerNote,
        created_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'registration_id,phase_id' },
    )
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Impossible d'enregistrer le dépôt.");
  }
  return mapSubmissionFromRest(data);
}

export async function listAdminSubmissionsViaSupabaseRest(filters?: {
  phaseId?: string;
  status?: string;
}): Promise<
  Array<{
    submission: DbSubmissionRowLike;
    registration: DbRegistrationRowLike;
    phase: DbPhaseRowLike;
  }>
> {
  const admin = getSupabaseAdmin();
  let query = admin
    .from('submissions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filters?.phaseId && filters.phaseId !== 'all') {
    query = query.eq('phase_id', filters.phaseId);
  }
  if (filters?.status && ['received', 'validated', 'rejected'].includes(filters.status)) {
    query = query.eq('status', filters.status);
  }

  const [subRes, regRes, phRes] = await Promise.all([
    query,
    admin.from('registrations').select('*'),
    admin.from('competition_phases').select('*'),
  ]);

  if (subRes.error) throw new Error(subRes.error.message);
  if (regRes.error) throw new Error(regRes.error.message);
  if (phRes.error) throw new Error(phRes.error.message);

  const regById = new Map((regRes.data || []).map((r) => [String(r.id), mapRegistrationFromRest(r)]));
  const phById = new Map((phRes.data || []).map((p) => [String(p.id), mapPhaseRowLikeFromRest(p)]));

  const results: Array<{
    submission: DbSubmissionRowLike;
    registration: DbRegistrationRowLike;
    phase: DbPhaseRowLike;
  }> = [];

  for (const row of subRes.data || []) {
    const submission = mapSubmissionFromRest(row);
    const registration = regById.get(submission.registrationId);
    const phase = phById.get(submission.phaseId);
    if (registration && phase) {
      results.push({ submission, registration, phase });
    }
  }

  return results;
}

export async function getSubmissionByIdViaSupabaseRest(
  submissionId: string,
): Promise<DbSubmissionRowLike | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSubmissionFromRest(data) : null;
}

export async function updateSubmissionReviewViaSupabaseRest(
  submissionId: string,
  patch: {
    status: SubmissionStatus;
    organizerNote: string;
  },
): Promise<DbSubmissionRowLike> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('submissions')
    .update({
      status: patch.status,
      organizer_note: patch.organizerNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(error?.message || 'Dépôt introuvable.');
  }
  return mapSubmissionFromRest(data);
}
