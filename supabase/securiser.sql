-- ==============================================================================
-- Script 1/3 : Activation stricte du Row Level Security (RLS) sur toutes les tables
-- ==============================================================================
-- Verrouille toutes les tables contre l'API Supabase directe (clé publishable / anon).
-- Le serveur Express se connecte via DATABASE_URL (rôle postgres) : il n'est pas bloqué.

alter table public.users              enable row level security;
alter table public.competition_phases enable row level security;
alter table public.announcements      enable row level security;
alter table public.news_articles      enable row level security;
alter table public.registrations      enable row level security;
alter table public.contact_messages   enable row level security;
alter table public.site_settings      enable row level security;
