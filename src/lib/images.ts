import type { MediaAssetKey } from '../types/competition';

export const MEDIA_ASSETS: Record<
  MediaAssetKey,
  { src: string; alt: string; caption: string }
> = {
  hero: {
    src: '/src/assets/images/hero_ucaep_lecture_1794529691534.jpg',
    alt: "Étudiante lisant à haute voix devant un auditoire universitaire baigné de lumière dorée",
    caption: "Lecture à haute voix — Auditoire universitaire",
  },
  plume: {
    src: '/src/assets/images/pillar_plume_writing_1794529692550.jpg',
    alt: "Jeune étudiante rédigeant un texte dans un cahier ivoire sur une table en bois",
    caption: "Phase 01 · L'atelier d'écriture",
  },
  connaissance: {
    src: '/src/assets/images/pillar_connaissance_study_1794529691495.jpg',
    alt: "Deux étudiants échangeant autour de livres ouverts dans une bibliothèque universitaire",
    caption: "Phase 02 · Culture générale et lecture critique",
  },
  eloquence: {
    src: '/src/assets/images/pillar_eloquence_stage_1794529692943.jpg',
    alt: "Étudiante prenant la parole avec assurance au pupitre devant un public attentif",
    caption: "Phase 03 · L'art oratoire sur scène",
  },
  campus: {
    src: '/src/assets/images/news_campus_dialogue_1794529692603.jpg',
    alt: "Étudiants discutant et partageant des ouvrages dans une cour universitaire en fin d'après-midi",
    caption: "Rencontres littéraires sur le campus",
  },
};

export function getMediaAsset(key: MediaAssetKey | string) {
  if (key in MEDIA_ASSETS) {
    return MEDIA_ASSETS[key as MediaAssetKey];
  }
  return MEDIA_ASSETS.campus;
}
