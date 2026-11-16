import heroImg from '../assets/images/doc_hero_lecture_1794838417863.jpg';
import plumeImg from '../assets/images/doc_plume_writing_1794838418544.jpg';
import connaissanceImg from '../assets/images/doc_connaissance_study_1794838420622.jpg';
import eloquenceImg from '../assets/images/doc_eloquence_clean_1794838471910.jpg';
import campusImg from '../assets/images/doc_campus_clean_1794838471491.jpg';
import heroPortraitImg from '../assets/images/doc_portrait_lecture_1794838418193.jpg';
import handwritingInkImg from '../assets/images/doc_writing_closeup_1794838419533.jpg';
import audienceListeningImg from '../assets/images/doc_audience_listening_1794838421644.jpg';
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
    alt: 'Étudiante béninoise lisant son cahier à voix haute devant ses camarades en salle de cours',
    caption: 'Lecture à voix haute devant un groupe d’étudiants',
  },
  portrait: {
    src: heroPortraitImg,
    alt: 'Jeune étudiante béninoise en chemise légère lisant un texte manuscrit en salle de classe éclairée par la lumière du jour',
    caption: 'Mise en voix d’un texte personnel — esprit du concours',
  },
  plume: {
    src: plumeImg,
    alt: 'Étudiant béninois rédigeant un texte au stylo dans un cahier près d’une fenêtre ouverte',
    caption: 'Phase 01 · La Plume — écriture originale en ligne',
  },
  writing: {
    src: handwritingInkImg,
    alt: 'Gros plan sur des mains écrivant au stylo sur un cahier Seyès posé sur une table en bois',
    caption: 'Préparation écrite avant la lecture ou l’enregistrement vidéo',
  },
  connaissance: {
    src: connaissanceImg,
    alt: 'Deux étudiants béninois échangeant autour d’un cahier et d’un schéma scientifique en salle d’étude',
    caption: 'Phase 02 · La Connaissance — vulgarisation en ligne',
  },
  eloquence: {
    src: eloquenceImg,
    alt: 'Étudiant béninois prenant la parole debout devant ses camarades assis aux tables d’un amphithéâtre',
    caption: 'Phase 03 · L’Éloquence — prise de parole en présentiel',
  },
  campus: {
    src: campusImg,
    alt: 'Trois étudiants béninois discutant cahiers en main dans une allée couverte du campus universitaire',
    caption: 'Échanges et entraide entre étudiants sur le campus',
  },
  audience: {
    src: audienceListeningImg,
    alt: 'Groupe d’étudiants béninois écoutant attentivement une présentation dans une salle de cours',
    caption: 'Écoute collective et débat étudiant',
  },
};

export function getMediaAsset(key: ExtendedMediaKey | string) {
  if (key in MEDIA_ASSETS) {
    return MEDIA_ASSETS[key as ExtendedMediaKey];
  }
  return MEDIA_ASSETS.campus;
}
