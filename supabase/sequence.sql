-- ==============================================================================
-- Script 3/3 : Séquence PostgreSQL pour les codes de référence (UCAEP-2026-0001)
-- ==============================================================================
-- Garantit l'unicité et la concurrence sans risque de doublon entre candidats.

create sequence if not exists public.registration_ref_seq start with 1 increment by 1;

-- Synchronise la valeur avec le nombre d'inscriptions déjà enregistrées
select setval(
  'public.registration_ref_seq',
  coalesce((select count(*) from public.registrations), 0) + 1,
  false
);
