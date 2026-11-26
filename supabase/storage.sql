-- ==============================================================================
-- Script Storage : Création du bucket privé « candidatures » (100 Mo max)
-- Note : Le Plan Gratuit Supabase plafonne l'upload côté serveur à 50 Mo ;
-- passez au Plan Pro (ou compressez sous 50 Mo) pour dépasser 50 Mo.
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
  104857600,
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
  file_size_limit = 104857600,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
