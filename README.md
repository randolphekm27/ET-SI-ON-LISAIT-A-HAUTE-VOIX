# Concours « Et si on lisait à haute voix ? » — UCAEP (ENSET de Lokossa)

Site officiel, système d'inscription, dépôt de productions (fichiers et textes écrits) et espace organisateurs (`/gestion`).

## Architecture des dépôts de candidatures

- **Base PostgreSQL (Supabase)** : tables gérées via Drizzle (`src/db/schema.ts`), avec RLS activé et aucune politique permissive pour `anon`/`authenticated` sur `registrations` ou `submissions`.
- **Stockage Supabase (`candidatures`)** : bucket **privé** (limite 50 Mo). Les fichiers (vidéo, audio, PDF, Word) sont envoyés **directement depuis le navigateur vers Supabase Storage** via une URL signée (`POST /api/submissions/init` → `uploadToSignedUrl` → `POST /api/submissions/complete`) afin de ne jamais traverser les fonctions Vercel (limite ~4,5 Mo).
- **Consultation organisateurs (`/gestion`)** : génération à la demande d'une URL signée temporaire (10 minutes) via `SUPABASE_SECRET_KEY` uniquement côté serveur.

## Variables d'environnement à configurer

Dans `.env` en local et dans **Vercel → Project Settings → Environment Variables (Production & Preview)** :

| Variable | Portée | Description |
| --- | --- | --- |
| `DATABASE_URL` | Serveur | Chaîne PostgreSQL Supabase (Transaction Pooler `:6543`) |
| `SUPABASE_URL` | Serveur | URL du projet Supabase (`https://...supabase.co`) |
| `SUPABASE_SECRET_KEY` | Serveur uniquement | Clé secrète Supabase (`sb_secret_...`). **Ne jamais préfixer par `VITE_`.** |
| `VITE_SUPABASE_URL` | Client + Build Vite | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client + Build Vite | Clé publique (`sb_publishable_...`) |
| `ORGANIZER_ACCESS_CODE` | Serveur | Code d'accès à `/gestion` (obligatoire, aucun code par défaut en clair) |
| `ORGANIZER_EMAILS` | Serveur | E-mails organisateurs autorisés (facultatif) |
| `GOOGLE_APPS_SCRIPT_URL` | Serveur | Webhook Google Sheets facultatif |

> **Important (Vercel)** : toute modification des variables `VITE_SUPABASE_URL` ou `VITE_SUPABASE_PUBLISHABLE_KEY` nécessite de **relancer un déploiement (Redeploy)** pour que Vite les injecte dans le bundle client (`dist/`).

## Mise en service (dans l'ordre)

```bash
# 1. Installer les dépendances
bun install

# 2. Pousser le schéma Drizzle vers Supabase PostgreSQL
npm run db:push

# 3. Dans Supabase → SQL Editor, exécuter dans l'ordre :
#    - supabase/securiser.sql
#    - supabase/storage.sql

# 4. Vérifier la compilation et le typage
npm run lint
npm run build
```
