import { isCloudSqlConfigured, pool } from './index.ts';

let schemaPromise: Promise<void> | null = null;
let isSchemaReady = false;

const SCHEMA_SYNC_SQL = `
CREATE TABLE IF NOT EXISTS public.users (
  id serial PRIMARY KEY NOT NULL,
  uid text NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text,
  role text DEFAULT 'member' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.competition_phases (
  id text PRIMARY KEY NOT NULL,
  phase_number integer NOT NULL,
  title text NOT NULL,
  short_description text NOT NULL,
  format text NOT NULL,
  status_label text NOT NULL,
  is_revealed boolean DEFAULT false NOT NULL,
  submissions_open boolean DEFAULT false NOT NULL,
  submission_deadline timestamp with time zone,
  image_key text NOT NULL,
  test_details jsonb,
  display_order integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.competition_phases
  ADD COLUMN IF NOT EXISTS submissions_open boolean DEFAULT false NOT NULL;

ALTER TABLE public.competition_phases
  ADD COLUMN IF NOT EXISTS submission_deadline timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.announcements (
  id text PRIMARY KEY NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  published_at timestamp with time zone NOT NULL,
  scheduled_at timestamp with time zone,
  status text DEFAULT 'draft' NOT NULL,
  category text NOT NULL,
  image_key text DEFAULT 'campus' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.news_articles (
  id text PRIMARY KEY NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  published_at timestamp with time zone NOT NULL,
  read_time text NOT NULL,
  excerpt text NOT NULL,
  content jsonb NOT NULL,
  image_key text DEFAULT 'campus' NOT NULL,
  featured boolean DEFAULT false NOT NULL,
  status text DEFAULT 'published' NOT NULL,
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id text PRIMARY KEY NOT NULL,
  reference_code text NOT NULL UNIQUE,
  user_uid text REFERENCES public.users(uid),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  birth_date text NOT NULL,
  gender text NOT NULL,
  institution text NOT NULL,
  department text NOT NULL,
  study_level text NOT NULL,
  student_id text NOT NULL UNIQUE,
  motivation text NOT NULL,
  reading_experience text DEFAULT '' NOT NULL,
  accept_rules boolean DEFAULT true NOT NULL,
  status text DEFAULT 'registered' NOT NULL,
  synced_to_google_sheets boolean DEFAULT false NOT NULL,
  sync_target text DEFAULT 'local_archive' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id text PRIMARY KEY NOT NULL,
  registration_id text NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  phase_id text NOT NULL REFERENCES public.competition_phases(id) ON DELETE CASCADE,
  kind text NOT NULL,
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes integer,
  text_content text,
  status text DEFAULT 'received' NOT NULL,
  organizer_note text DEFAULT '' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS submissions_registration_phase_uidx
  ON public.submissions (registration_id, phase_id);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'non_lu' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.registration_ref_seq START WITH 1 INCREMENT BY 1;
`;

export function getPostgresErrorCode(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const e = err as { code?: unknown; cause?: { code?: unknown } };
  if (typeof e.cause?.code === 'string') return e.cause.code;
  if (typeof e.code === 'string') return e.code;
  return '';
}

export function isSchemaDriftError(err: unknown): boolean {
  const code = getPostgresErrorCode(err);
  // 42703 = undefined_column, 42P01 = undefined_table
  return code === '42703' || code === '42P01';
}

/**
 * S'assure de manière idempotente que les tables et colonnes ajoutées
 * (ex: submissions_open, submission_deadline, submissions) existent bien
 * même si la base Supabase a été initialisée avant les évolutions récentes.
 */
export async function ensureDatabaseSchemaReady(force = false): Promise<void> {
  if (!isCloudSqlConfigured()) return;
  if (isSchemaReady && !force) return;

  if (!schemaPromise || force) {
    schemaPromise = (async () => {
      try {
        await pool.query(SCHEMA_SYNC_SQL);
        isSchemaReady = true;
      } catch (err) {
        schemaPromise = null;
        throw err;
      }
    })();
  }

  return schemaPromise;
}
