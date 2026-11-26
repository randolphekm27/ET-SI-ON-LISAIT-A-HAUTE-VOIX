import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  ALLOWED_SUBMISSION_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from '../src/lib/submissions-config.ts';

export const SUBMISSIONS_BUCKET = 'candidatures';

let cachedAdminClient: SupabaseClient | null = null;
let bucketEnsured = false;

function stripEnvValue(raw: string | undefined): string {
  let val = (raw || '').trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }
  return val;
}

function isPlaceholderValue(val: string): boolean {
  if (!val) return true;
  const lower = val.toLowerCase();
  return (
    lower.includes('[project-ref]') ||
    lower.includes('[your-password]') ||
    lower.includes('[votre_') ||
    lower.includes('placeholder') ||
    val === 'sb_secret_...' ||
    val === 'sb_publishable_...' ||
    lower === 'changez-moi'
  );
}

function inferSupabaseUrlFromDatabaseUrl(): string {
  const dbUrl = stripEnvValue(process.env.DATABASE_URL);
  if (!dbUrl) return '';
  const directMatch = dbUrl.match(/@db\.([a-z0-9]+)\.supabase\.co/i);
  if (directMatch?.[1]) {
    return `https://${directMatch[1]}.supabase.co`;
  }
  const poolerMatch = dbUrl.match(/\/\/postgres\.([a-z0-9]+)[:@]/i);
  if (poolerMatch?.[1]) {
    return `https://${poolerMatch[1]}.supabase.co`;
  }
  return '';
}

function readSupabaseServerCredentials(): { url: string; secretKey: string } {
  const explicitUrl =
    stripEnvValue(process.env.SUPABASE_URL) ||
    stripEnvValue(process.env.VITE_SUPABASE_URL) ||
    stripEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const url = !isPlaceholderValue(explicitUrl)
    ? explicitUrl
    : inferSupabaseUrlFromDatabaseUrl();

  const rawSecret =
    stripEnvValue(process.env.SUPABASE_SECRET_KEY) ||
    stripEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    stripEnvValue(process.env.SUPABASE_SERVICE_KEY) ||
    stripEnvValue(process.env.SUPABASE_ADMIN_KEY);
  const secretKey = isPlaceholderValue(rawSecret) ? '' : rawSecret;

  return {
    url: isPlaceholderValue(url) ? '' : url,
    secretKey,
  };
}

export function getSupabaseServerDiagnostics(): {
  hasUrl: boolean;
  hasSecretKey: boolean;
  inferredUrlFromDb: boolean;
} {
  const explicitUrl =
    stripEnvValue(process.env.SUPABASE_URL) ||
    stripEnvValue(process.env.VITE_SUPABASE_URL) ||
    stripEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const { url, secretKey } = readSupabaseServerCredentials();
  return {
    hasUrl: Boolean(url),
    hasSecretKey: Boolean(secretKey),
    inferredUrlFromDb: isPlaceholderValue(explicitUrl) && Boolean(url),
  };
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

  const existing = (buckets || []).find(
    (b) => b.id === SUBMISSIONS_BUCKET || b.name === SUBMISSIONS_BUCKET,
  );
  if (!existing) {
    const { error: createError } = await admin.storage.createBucket(SUBMISSIONS_BUCKET, {
      public: false,
      fileSizeLimit: MAX_UPLOAD_BYTES,
      allowedMimeTypes: [...ALLOWED_SUBMISSION_MIME_TYPES],
    });
    if (createError && !createError.message.toLowerCase().includes('already exists')) {
      // Sur le Plan Gratuit Supabase, fileSizeLimit > 50 Mo est refusé côté API :
      // on retombe automatiquement sur 50 Mo pour que la création du bucket réussisse.
      const fallbackLimit = 50 * 1024 * 1024;
      const { error: fallbackError } = await admin.storage.createBucket(SUBMISSIONS_BUCKET, {
        public: false,
        fileSizeLimit: fallbackLimit,
        allowedMimeTypes: [...ALLOWED_SUBMISSION_MIME_TYPES],
      });
      if (fallbackError && !fallbackError.message.toLowerCase().includes('already exists')) {
        throw new Error(`Impossible de créer le bucket privé (${fallbackError.message}).`);
      }
    }
  } else if (
    typeof existing.file_size_limit === 'number' &&
    existing.file_size_limit < MAX_UPLOAD_BYTES
  ) {
    // Tente de relever le plafond du bucket existant jusqu'à 100 Mo (sans bloquer si Plan Gratuit)
    await admin.storage
      .updateBucket(SUBMISSIONS_BUCKET, {
        public: false,
        fileSizeLimit: MAX_UPLOAD_BYTES,
        allowedMimeTypes: [...ALLOWED_SUBMISSION_MIME_TYPES],
      })
      .catch(() => {});
  }

  bucketEnsured = true;
}
