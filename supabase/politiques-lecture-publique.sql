-- ==============================================================================
-- Script 2/3 : Politiques de lecture publique (facultatif / lecture directe)
-- ==============================================================================
-- Autorise la lecture des annonces publiées, des actualités et des phases révélées.
-- Attention : registrations, users, contact_messages et app_settings restent INTERDITES à anon.

drop policy if exists "Public can read published announcements" on public.announcements;
drop policy if exists "Public can read published news"          on public.news_articles;
drop policy if exists "Public can read revealed phases"         on public.phases;

create policy "Public can read published announcements"
on public.announcements for select to anon, authenticated
using (status = 'published' and published_at::timestamptz <= now());

create policy "Public can read published news"
on public.news_articles for select to anon, authenticated
using (status = 'published' and published_at::timestamptz <= now());

create policy "Public can read revealed phases"
on public.phases for select to anon, authenticated
using (is_revealed = true);
