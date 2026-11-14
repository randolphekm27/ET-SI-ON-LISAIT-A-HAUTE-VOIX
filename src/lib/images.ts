import heroImg from '../assets/images/hero_ucaep_lecture_1794529691534.jpg';
import plumeImg from '../assets/images/pillar_plume_writing_1794529692550.jpg';
import connaissanceImg from '../assets/images/pillar_connaissance_study_1794529691495.jpg';
import eloquenceImg from '../assets/images/pillar_eloquence_stage_1794529692943.jpg';
import campusImg from '../assets/images/news_campus_dialogue_1794529692603.jpg';
import heroPortraitImg from '../assets/images/hero_voice_portrait_1794549126251.jpg';
import handwritingInkImg from '../assets/images/editorial_handwriting_ink_1794549126566.jpg';
import audienceListeningImg from '../assets/images/editorial_audience_listening_1794549126545.jpg';
import type { MediaAssetKey } from '../types/competition';

export type ExtendedMediaKey =
  | MediaAssetKey
  | 'portrait'
  | 'writing'
  | 'audience';

export const MEDIA_ASSETS: Record<
  ExtendedMediaKey,
  { src: string; alt: string; caption: string }
> = {
  hero: {
    src: heroImg,
    alt: "Étudiante lisant à haute voix devant des étudiants à l'université",
    caption: "Lecture à voix haute à l'ENSET de Lokossa",
  },
  portrait: {
    src: heroPortraitImg,
    alt: 'Jeune étudiante africaine lisant un texte imprimé devant un micro dans une lumière chaude',
    caption: 'Interprétation orale d’un texte — ENSET de Lokossa',
  },
  plume: {
    src: plumeImg,
    alt: 'Jeune étudiante écrivant un texte dans un cahier sur une table en bois',
    caption: 'Phase 01 · La Plume (en ligne)',
  },
  writing: {
    src: handwritingInkImg,
    alt: "Gros plan sur la main d'un étudiant écrivant au stylo dans un cahier entouré de livres",
    caption: "Rédaction des textes et préparation de l'interprétation",
  },
  connaissance: {
    src: connaissanceImg,
    alt: 'Deux étudiants discutant autour de livres ouverts à la bibliothèque',
    caption: 'Phase 02 · La Connaissance (en ligne)',
  },
  eloquence: {
    src: eloquenceImg,
    alt: 'Étudiante prenant la parole au pupitre devant un public attentif',
    caption: "Phase 03 · L'Éloquence (en présentiel)",
  },
  campus: {
    src: campusImg,
    alt: "Étudiants discutant et partageant des livres sur le campus en fin d'après-midi",
    caption: 'Échanges étudiants sur le campus',
  },
  audience: {
    src: audienceListeningImg,
    alt: 'Étudiants réunis et attentifs lors d’une séance de lecture et de prise de parole',
    caption: "Écoute collective et partage d'idées",
  },
};

export function getMediaAsset(key: ExtendedMediaKey | string) {
  if (key in MEDIA_ASSETS) {
    return MEDIA_ASSETS[key as ExtendedMediaKey];
  }
  return MEDIA_ASSETS.campus;
}
