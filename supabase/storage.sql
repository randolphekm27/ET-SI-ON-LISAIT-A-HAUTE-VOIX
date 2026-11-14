-- ==============================================================================
-- Script Storage : Création du bucket privé « candidatures » (50 Mo max)
-- ==============================================================================
-- Exécutez ce script une seule fois dans le SQL Editor de Supabase.
-- Aucune politique publique n'est ajoutée sur storage.objects :
-- - Les dépôts candidats passent par une URL signée temporaire (uploadToSignedUrl).
-- - Les téléchargements organisateurs passent par une URL signée de 10 minutes
--   générée uniquement côté serveur avec SUPABASE_SECRET_KEY après authentification.

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'candidatures',
  'candidatures',
  false,
  52428800,
  ARRAY[
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
