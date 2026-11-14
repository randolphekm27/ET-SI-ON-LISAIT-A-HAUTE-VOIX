-- ==============================================================================
-- INITIALISATION COMPLÈTE BASE DE DONNÉES SUPABASE
-- Projet: Concours « Et si on lisait à haute voix ? » (UCAEP - Bénin)
-- ==============================================================================

-- 1. Table des utilisateurs
CREATE TABLE IF NOT EXISTS public.users (
	id serial PRIMARY KEY NOT NULL,
	uid text NOT NULL UNIQUE,
	email text NOT NULL,
	display_name text,
	role text DEFAULT 'member' NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Table des phases du concours
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

-- 3. Table des annonces
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

-- 4. Table des articles d'actualités
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

-- 5. Table des inscriptions des candidats
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

-- 6. Table des messages de contact
CREATE TABLE IF NOT EXISTS public.contact_messages (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL,
	email text NOT NULL,
	subject text NOT NULL,
	message text NOT NULL,
	status text DEFAULT 'non_lu' NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 7. Table des paramètres du site
CREATE TABLE IF NOT EXISTS public.site_settings (
	key text PRIMARY KEY NOT NULL,
	value jsonb NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 8. Table des dépôts de candidatures (fichiers et textes écrits)
-- S'adapte automatiquement si registrations.id est de type uuid ou text dans votre base existante
DO $$
DECLARE
	reg_id_type text;
	phase_id_type text;
BEGIN
	SELECT format_type(a.atttypid, a.atttypmod) INTO reg_id_type
	FROM pg_attribute a
	JOIN pg_class c ON a.attrelid = c.oid
	JOIN pg_namespace n ON c.relnamespace = n.oid
	WHERE n.nspname = 'public' AND c.relname = 'registrations' AND a.attname = 'id' AND NOT a.attisdropped;

	SELECT format_type(a.atttypid, a.atttypmod) INTO phase_id_type
	FROM pg_attribute a
	JOIN pg_class c ON a.attrelid = c.oid
	JOIN pg_namespace n ON c.relnamespace = n.oid
	WHERE n.nspname = 'public' AND c.relname = 'competition_phases' AND a.attname = 'id' AND NOT a.attisdropped;

	reg_id_type := COALESCE(reg_id_type, 'text');
	phase_id_type := COALESCE(phase_id_type, 'text');

	EXECUTE format($sql$
		CREATE TABLE IF NOT EXISTS public.submissions (
			id text PRIMARY KEY NOT NULL,
			registration_id %s NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
			phase_id %s NOT NULL REFERENCES public.competition_phases(id) ON DELETE CASCADE,
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
		)
	$sql$, reg_id_type, phase_id_type);
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS submissions_registration_phase_uidx
	ON public.submissions (registration_id, phase_id);

-- 9. Séquence de numérotation pour les références d'inscription (UCAEP-2026-0001)
CREATE SEQUENCE IF NOT EXISTS public.registration_ref_seq START WITH 1 INCREMENT BY 1;
SELECT setval(
  'public.registration_ref_seq',
  COALESCE((SELECT count(*) FROM public.registrations), 0) + 1,
  false
);

-- 10. Sécurité RLS (Row Level Security)
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings      ENABLE ROW LEVEL SECURITY;

-- 10. Politiques de lecture publique
DROP POLICY IF EXISTS "Public can read published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Public can read published news"          ON public.news_articles;
DROP POLICY IF EXISTS "Public can read revealed phases"         ON public.competition_phases;

CREATE POLICY "Public can read published announcements"
ON public.announcements FOR SELECT TO anon, authenticated
USING (status = 'published' and published_at::timestamptz <= now());

CREATE POLICY "Public can read published news"
ON public.news_articles FOR SELECT TO anon, authenticated
USING (status = 'published' and published_at::timestamptz <= now());

CREATE POLICY "Public can read revealed phases"
ON public.competition_phases FOR SELECT TO anon, authenticated
USING (is_revealed = true);
