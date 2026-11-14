export type ScenicAssetKey =
  | 'plume'
  | 'lanterne'
  | 'monstera'
  | 'palmier'
  | 'hibiscus'
  | 'tamtam'
  | 'livres';

export interface ScenicAssetMeta {
  src: string;
  alt: string;
  aspect: string;
}

export const SCENIC_ASSETS: Record<ScenicAssetKey, ScenicAssetMeta> = {
  plume: {
    src: '/assets/aistudio/Plume_africaine_et_stylo_dor__orn_s_c827dd48.png',
    alt: "Plume d'écriture africaine ornée de motifs dorés",
    aspect: 'aspect-[3/2]',
  },
  lanterne: {
    src: '/assets/aistudio/Lanterne_ancienne_en_bronze_grav____flamme_chaleureuse_5d8fb287.png',
    alt: 'Lanterne ancienne en bronze gravé diffusant une flamme chaleureuse',
    aspect: 'aspect-[2/3]',
  },
  monstera: {
    src: '/assets/aistudio/Arrangement_de_feuilles_de_monstera_tropicales_34878c0f.png',
    alt: 'Feuillage tropical de monstera',
    aspect: 'aspect-[1392/1130]',
  },
  palmier: {
    src: '/assets/aistudio/Branche_de_palmier_tropicale_luxuriante_612d6d86.png',
    alt: 'Fronde de palmier tropicale',
    aspect: 'aspect-[3/2]',
  },
  hibiscus: {
    src: '/assets/aistudio/Hibiscus_rouge_avec_feuilles_et_bouton_21a1c82e.png',
    alt: 'Fleur d’hibiscus rouge épanouie',
    aspect: 'aspect-[1370/1148]',
  },
  tamtam: {
    src: '/assets/aistudio/Djemb__africain_aux_motifs_sculpt_s_59bb113a.png',
    alt: 'Tam-tam africain sculpté aux motifs géométriques',
    aspect: 'aspect-[1105/1423]',
  },
  livres: {
    src: '/assets/aistudio/Livres_africains_aux_motifs_dor_s_480c7631.png',
    alt: 'Pile de livres reliés aux motifs dorés',
    aspect: 'aspect-[3/2]',
  },
};
