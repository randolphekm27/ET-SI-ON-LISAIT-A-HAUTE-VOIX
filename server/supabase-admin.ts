import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  ALLOWED_SUBMISSION_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from '../src/lib/submissions-config.ts';

export const SUBMISSIONS_BUCKET = 'candidatures';

let cachedAdminClient: SupabaseClient | null = null;
let bucketEnsured = false;

function readSupabaseServerCredentials(): { url: string; secretKey: string } {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const secretKey = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();
  return { url, secretKey };
}

export function isSupabaseAdminConfigured(): boolean {
  const { url, secretKey } = readSupabaseServerCredentials();
  return Boolean(url && secretKey);
}

export function getSupabaseAdmin(): SupabaseClient {
  const { url, secretKey } = readSupabaseServerCredentials();
  if (!url || !secretKey) {
    const err = new Error(
      "Le service de stockage Supabase n'est pas configuré sur le serveur (SUPABASE_URL ou SUPABASE_SECRET_KEY manquant).",
    );
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedAdminClient;
}

export async function ensureSubmissionsBucket(): Promise<void> {
  if (bucketEnsured) return;
  const admin = getSupabaseAdmin();

  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    throw new Error(`Impossible de vérifier le stockage Supabase (${listError.message}).`);
  }

  const exists = (buckets || []).some((b) => b.id === SUBMISSIONS_BUCKET || b.name === SUBMISSIONS_BUCKET);
  if (!exists) {
    const { error: createError } = await admin.storage.createBucket(SUBMISSIONS_BUCKET, {
      public: false,
      fileSizeLimit: MAX_UPLOAD_BYTES,
      allowedMimeTypes: [...ALLOWED_SUBMISSION_MIME_TYPES],
    });
    if (createError && !createError.message.toLowerCase().includes('already exists')) {
      throw new Error(`Impossible de créer le bucket privé (${createError.message}).`);
    }
  }

  bucketEnsured = true;
}
