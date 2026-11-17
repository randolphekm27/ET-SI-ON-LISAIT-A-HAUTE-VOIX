import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Feather,
  Languages,
  Lock,
  Mail,
  MapPin,
  Mic2,
  Phone,
  Scale,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BrandPatternBand,
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { DepotSubmissionPanel } from '../components/DepotSubmissionPanel';
import { EditorialImage } from '../components/EditorialImage';
import { InteractiveRubric } from '../components/InteractiveRubric';
import {
  EditorialExpandable,
  EditorialReveal,
  EditorialTitleReveal,
  ParallaxDepthCard,
  PhotographicPlate,
  ThreePhaseNarrativeArc,
} from '../components/MotionPrimitives';
import { SectionAnchorRail } from '../components/SectionAnchorRail';
import { VideoPrepWorkshop } from '../components/VideoPrepWorkshop';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { EDITORIAL_EASE, EDITORIAL_SPRING } from '../lib/motion';
import { useSiteConfig } from '../lib/site-config';

interface PhaseEpreuveCard {
  number: string;
  tag: string;
  duration: string;
  title: string;
  summary: string;
  concreteAdvice: string;
  extraParagraphs: string[];
  formatsLabel: string;
  formats: string;
}

interface PhaseGuideTab {
  tabLabel: string;
  kicker: string;
  title: string;
  paragraphs: string[];
  checklist: string[];
}

interface PhaseEditorialDossier {
  sectionKicker: string;
  sectionTitle: string;
  sectionSubtitle: string;
  introParagraphs: string[];
  maskedSummary: string;
  timelineWindow: string;
  deliverableSummary: string;
  outcomeSummary: string;
  epreuvesHeading: string;
  epreuvesLead: string;
  epreuves: PhaseEpreuveCard[];
  guideHeading: string;
  guideLead: string;
  guideTabs: PhaseGuideTab[];
  equityRules: Array<{
    kicker: string;
    title: string;
    description: string;
  }>;
  checklistBeforeSend: string[];
  practicalNote: string;
}

const PHASE_EDITORIAL_DOSSIERS: Record<string, PhaseEditorialDossier> = {
  'phase-1': {
    sectionKicker: 'Étape 01 · Présentation de la phase',
    sectionTitle: 'Phase 1 — La Plume',
    sectionSubtitle: 'Écrire deux textes personnels, puis les lire face caméra',
    introParagraphs: [
      "Dans cette première phase, vous travaillez chez vous sur deux créations écrites personnelles avant de les enregistrer en vidéo. L'objectif est simple : apprendre à organiser vos idées par écrit, à trouver des mots précis sans artifice, puis à transmettre le sens de votre texte à l'oral.",
      "Le jury n'attend pas un vocabulaire compliqué ni des tournures artificielles. Une page claire, sincère et bien construite vaut toujours mieux qu'un texte surchargé. L'exercice mobilise à la fois votre sens de l'observation, la correction de la langue française et votre capacité à lire à haute voix avec un débit posé.",
      "La Phase 1 est qualificative : les deux textes et leurs vidéos sont évalués sur 20 points par deux lecteurs différents, sous code d'anonymat. Les candidats retenus accèdent ensuite à la Phase 2 (« La Connaissance »).",
    ],
    maskedSummary:
      "La Phase 1 demande deux créations écrites individuelles accompagnées chacune d'une lecture vidéo (jusqu'à 5 minutes). Les intitulés exacts des deux exercices sont publiés automatiquement à l'ouverture officielle de la phase.",
    timelineWindow: 'Jours 1 à 5 · En ligne',
    deliverableSummary: '2 textes originaux + 2 vidéos (≤ 5 min chacune)',
    outcomeSummary: 'Qualification vers la Phase 2 (« La Connaissance »)',
    epreuvesHeading: 'Présentation des deux épreuves de La Plume',
    epreuvesLead:
      'Vous devez réaliser ces deux exercices dans l’ordre : rédiger chaque texte personnellement, puis vous filmer en train de le lire ou de l’interpréter.',
    epreuves: [
      {
        number: '01',
        tag: 'Épreuve 01 · Autoportrait littéraire',
        duration: 'Texte + vidéo (≤ 5 min)',
        title: '« Je suis… »',
        summary:
          "Vous rédigez un autoportrait littéraire qui montre qui vous êtes au-delà de votre nom, de votre filière ou de votre année d'études. Par exemple, vous pouvez partir d'une habitude qui vous caractérise, d'un souvenir d'apprentissage, d'une contradiction que vous traversez ou d'un projet qui guide vos choix.",
        concreteAdvice:
          "Évitez la simple fiche d'état civil (« Je m'appelle…, je suis en Licence 2… »). Préférez un angle précis : une scène vécue, une conviction ou une image qui explique votre manière de voir le monde.",
        extraParagraphs: [
          "Ce premier défi vous laisse le choix de la forme : récit autobiographique, lettre adressée à vous-même, monologue intérieur, poème ou prose construite. Ce qui compte, c'est que le lecteur découvre une réflexion véritablement personnelle.",
          "Avant de tourner la vidéo, relisez votre texte à voix haute crayon en main : supprimez les phrases trop longues qui coupent votre souffle et vérifiez que l'ouverture donne tout de suite envie d'écouter.",
        ],
        formatsLabel: 'Formes d’écriture libres',
        formats:
          'Récit personnel, lettre à soi-même, monologue, poème ou prose littéraire en français.',
      },
      {
        number: '02',
        tag: 'Épreuve 02 · Parole gardée sous silence',
        duration: 'Texte + vidéo (≤ 5 min)',
        title: "« Les mots que l'on n'ose pas dire »",
        summary:
          "Vous mettez par écrit une pensée, une gratitude, un constat ou une vérité que l'on retient souvent par pudeur, par crainte ou par manque d'occasion. Vous pouvez vous adresser à un proche, à un enseignant, à votre promotion ou à la société.",
        concreteAdvice:
          "Il n'est pas nécessaire d'inventer une histoire tragique. Une reconnaissance jamais exprimée, un regret lucide ou une question honnête sur nos habitudes collectives touchent davantage lorsqu'ils sonnent juste.",
        extraParagraphs: [
          "Vous pouvez choisir la forme d'une lettre que l'on n'a jamais envoyée, d'un poème, d'un monologue ou d'un court récit. Gardez un fil conducteur clair entre le début et la fin du texte.",
          "L'usage ponctuel d'une expression ou d'un proverbe en langue nationale béninoise est permis s'il éclaire naturellement le propos en français.",
        ],
        formatsLabel: 'Supports admis',
        formats:
          'Lettre non envoyée, poème, monologue ou récit personnel en français (touches de langues nationales possibles).',
      },
    ],
    guideHeading: 'Ce qu’il faut produire, comment travailler et comment filmer',
    guideLead:
      'Suivez ces trois volets pour préparer vos écrits, enregistrer vos vidéos sans matériel complexe et vérifier votre dossier.',
    guideTabs: [
      {
        tabLabel: '01 · Ce que vous devez produire',
        kicker: 'Étape 03 · Livrables attendus',
        title: 'Deux textes distincts et leurs deux vidéos correspondantes',
        paragraphs: [
          "À l'issue de la Phase 1, votre dossier complet comprend deux créations écrites distinctes — une pour « Je suis… » et une pour « Les mots que l'on n'ose pas dire » — ainsi qu'une vidéo de lecture ou d'interprétation pour chacun des deux textes.",
          "Chaque vidéo doit correspondre fidèlement au texte écrit que vous avez soumis : ne déposez pas un brouillon différent de ce que vous lisez face caméra. Les deux travaux sont strictement individuels.",
        ],
        checklist: [
          'Texte 1 (« Je suis… ») déposé dans votre espace candidat.',
          'Texte 2 (« Les mots que l’on n’ose pas dire ») déposé séparément.',
          'Deux vidéos claires et audibles (chacune de 5 minutes maximum).',
        ],
      },
      {
        tabLabel: '02 · Comment vous y prendre',
        kicker: 'Étape 04 · Méthode de travail',
        title: 'Avancer par étapes simples, de l’idée à la relecture orale',
        paragraphs: [
          "Commencez par noter sur une feuille ce que vous voulez vraiment dire en deux ou trois idées simples, sans chercher tout de suite de « belles phrases ». Rédigez ensuite un premier jet continu pour ne pas bloquer sur chaque mot.",
          "Une fois le texte terminé, lisez-le debout à voix haute. Vous repérerez immédiatement les répétitions, les phrases trop lourdes et les endroits où vous manquez d'air. Corrigez ces passages avant même de sortir votre téléphone.",
        ],
        checklist: [
          'Jour 1 : poser vos idées et rédiger le premier jet des deux textes.',
          'Jour 2 : relire à voix haute, corriger l’orthographe et chronométrer la lecture.',
          'Jour 3 : enregistrer vos vidéos au calme et déposer l’ensemble avant clôture.',
        ],
      },
      {
        tabLabel: '03 · Enregistrer votre vidéo',
        kicker: 'Étape 05 · Préparation technique',
        title: 'Un téléphone portable dans un endroit calme suffit',
        paragraphs: [
          "Aucun studio ni matériel professionnel n'est demandé. Installez-vous dans une salle fermée ou un coin calme, face à une fenêtre ou une lampe douce (évitez d'avoir la lumière vive derrière votre dos), et calez votre téléphone à hauteur des yeux.",
          "Faites un court essai de dix secondes et écoutez-le au casque pour vérifier que votre voix porte sans écho ni bruit de ventilateur. Évitez les musiques de fond ou les effets de montage : le jury souhaite entendre votre voix et votre diction clairement.",
        ],
        checklist: [
          'Cadrage stable, visage bien éclairé, loin des bruits extérieurs.',
          'Articulation nette, rythme posé et pauses entre les idées.',
          'Vérifier que la vidéo ne dépasse pas 05:00 avant l’envoi.',
        ],
      },
    ],
    equityRules: [
      {
        kicker: 'Anonymat',
        title: 'Vos copies sont lues sous code UCAEP',
        description:
          "Les membres du jury ne voient ni votre nom, ni votre filière, ni votre année d'études pendant l'évaluation. Ce code protège l'impartialité de la notation.",
      },
      {
        kicker: 'Originalité',
        title: 'Pourquoi l’IA et le plagiat sont interdits',
        description:
          "Le concours évalue votre propre écriture et votre voix. Un texte généré par intelligence artificielle ou recopié entraîne la disqualification dès la vérification.",
      },
      {
        kicker: 'Langues',
        title: 'Français et expressions béninoises',
        description:
          "La langue de rédaction est le français. Quelques mots ou proverbes en langue nationale peuvent être utilisés s'ils enrichissent naturellement le texte.",
      },
    ],
    checklistBeforeSend: [
      'J’ai relu mes deux textes personnels et vérifié qu’aucun passage n’est copié.',
      'J’ai vérifié que chaque vidéo dure moins de 5 minutes et que le son est audible.',
      'Chaque vidéo lit fidèlement le texte correspondant soumis dans l’espace dépôt.',
      'Mon code UCAEP-2026-XXXX est correctement renseigné (notamment si un Google Form est actif).',
    ],
    practicalNote:
      'Notation sur 20 points en double correction anonyme. Après affichage des résultats sous code, vous disposez de 24 heures pour signaler par écrit toute erreur matérielle.',
  },
  'phase-2': {
    sectionKicker: 'Étape 01 · Présentation de la phase',
    sectionTitle: 'Phase 2 — La Connaissance',
    sectionSubtitle: 'Vulgariser un sujet scientifique et réfléchir sur l’éducation',
    introParagraphs: [
      "La Phase 2 s'adresse aux candidats qualifiés après La Plume. Après l'écriture personnelle, vous travaillez ici la précision des idées et l'art de faire comprendre : expliquer clairement un sujet scientifique du quotidien et développer une réflexion personnelle sur l'école et le savoir.",
      "À l'ENSET de Lokossa, vous manipulez déjà des concepts techniques et pédagogiques. Cette phase vous demande d'en sortir avec rigueur : comment expliquer un mécanisme sans jargon inutile à quelqu'un qui ne connaît pas votre filière ?",
      "Comme pour la Phase 1, vous déposez vos productions écrites et vos présentations vidéo en ligne (jusqu'à 5 minutes par épreuve), sous votre code d'anonymat UCAEP. Les meilleurs dossiers accèdent aux ateliers de la Grande Finale.",
    ],
    maskedSummary:
      "La Phase 2 se déroule en ligne pour les qualifiés de La Plume. Elle porte sur la vulgarisation scientifique et la réflexion sur la transmission des savoirs, avec remise de contenus écrits et vidéo. Les intitulés précis restent masqués jusqu'à l'ouverture au Jour 6.",
    timelineWindow: 'Jours 6 à 11 · En ligne',
    deliverableSummary: '2 productions écrites + 2 vidéos (≤ 5 min chacune)',
    outcomeSummary: 'Sélection des finalistes pour Phase 3 (présentiel)',
    epreuvesHeading: 'Présentation des deux épreuves de La Connaissance',
    epreuvesLead:
      'Deux exercices complémentaires qui associent exactitude du fond, exemples concrets et aisance orale face caméra.',
    epreuves: [
      {
        number: '03',
        tag: 'Épreuve 03 · Vulgarisation scientifique',
        duration: 'Texte explicatif + vidéo (≤ 5 min)',
        title: '« La science dans notre quotidien »',
        summary:
          "Vous choisissez un phénomène, un objet technique ou un principe scientifique présent dans la vie courante et vous l'expliquez de façon progressive. Par exemple : pourquoi le ciel change de couleur le soir, comment fonctionne un téléphone, pourquoi un objet flotte ou coule, comment un réfrigérateur conserve les aliments ou comment une ampoule éclaire.",
        concreteAdvice:
          "Ces exemples sont là pour vous orienter, pas pour limiter votre choix : prenez un sujet qui vous intéresse vraiment, vérifiez son exactitude scientifique et bannissez la simple récitation de formules.",
        extraParagraphs: [
          "Imaginez que vous parlez à un étudiant d'une toute autre filière ou à un proche curieux : partez d'une question simple (« Qu'observe-t-on ? »), expliquez le mécanisme étape par étape, puis terminez par ce que cela change dans notre quotidien.",
          "En vidéo, vous pouvez montrer un objet simple sur votre table ou dessiner un petit schéma à main levée sur une feuille si cela facilite la compréhension.",
        ],
        formatsLabel: 'Ce qui est attendu',
        formats:
          'Explication exacte et progressive, exemples tirés du réel et support visuel simple si utile.',
      },
      {
        number: '04',
        tag: 'Épreuve 04 · Réflexion éducative',
        duration: 'Texte argumenté + vidéo (≤ 5 min)',
        title: "« L'école, le savoir et l'avenir »",
        summary:
          "Vous construisez une réflexion structurée sur le rôle de l'éducation, la valeur de l'apprentissage et la responsabilité des apprenants et futurs enseignants. Vous pouvez par exemple interroger la place de l'esprit critique, l'écart entre théorie et pratique, ou ce qui donne sens aux études aujourd'hui.",
        concreteAdvice:
          "Évitez de simplement lister les difficultés du système éducatif ou d'enchaîner des phrases générales. Défendez une idée claire, appuyée sur deux ou trois arguments solides et des exemples précis.",
        extraParagraphs: [
          "Vous pouvez rédiger ce travail sous la forme d'un essai, d'un discours, d'une lettre ouverte ou d'un plaidoyer. Veillez à bien marquer l'enchaînement de vos idées pour que le lecteur suive votre raisonnement sans effort.",
          "Dans la vidéo qui accompagne ce texte, il s'agit d'une présentation orale vivante : regardez l'objectif, marquez des pauses entre vos arguments et portez votre conviction avec calme.",
        ],
        formatsLabel: 'Formes d’expression admises',
        formats:
          'Discours, essai, lettre ouverte, plaidoyer ou récit réflexif structuré et argumenté.',
      },
    ],
    guideHeading: 'Produits attendus, méthode pédagogique et réalisation vidéo',
    guideLead:
      'Organisez votre préparation entre exactitude du contenu écrit et clarté de la présentation orale.',
    guideTabs: [
      {
        tabLabel: '01 · Ce que vous devez produire',
        kicker: 'Étape 03 · Livrables attendus',
        title: 'Deux écrits structurés et deux vidéos pédagogiques',
        paragraphs: [
          "Votre dossier de Phase 2 comprend deux textes personnels (le dossier de vulgarisation scientifique et le texte réflexif sur l'école et l'avenir) ainsi que leurs deux présentations vidéo correspondantes.",
          "Les enregistrements doivent refléter fidèlement les textes soumis, tout en restant naturels à l'oral dans la limite stricte des 5 minutes par épreuve.",
        ],
        checklist: [
          'Production 1 (« La science dans notre quotidien ») + sa vidéo explicative.',
          'Production 2 (« L’école, le savoir et l’avenir ») + sa vidéo de présentation.',
          'Exactitude des notions scientifiques et cohérence entre texte et vidéo.',
        ],
      },
      {
        tabLabel: '02 · Comment vous y prendre',
        kicker: 'Étape 04 · Méthode de préparation',
        title: 'Vérifier les faits, puis simplifier le vocabulaire',
        paragraphs: [
          "Pour l'épreuve scientifique, vérifiez d'abord chaque étape du phénomène dans un manuel ou un cours fiable afin qu'aucune approximation ne subsiste. Ensuite seulement, traduisez chaque terme technique par une comparaison accessible.",
          "Pour la réflexion éducative, formulez votre thèse en une seule phrase avant de rédiger. Si vous ne pouvez pas résumer votre point de vue en une phrase, c'est que votre plan gagne encore à être resserré.",
        ],
        checklist: [
          'Jour 6 : arrêter vos deux sujets et vérifier vos sources scientifiques.',
          'Jours 7 à 8 : rédiger les deux textes et tester la clarté auprès d’un camarade.',
          'Jour 9 : filmer dans un endroit calme et transmettre le dossier sous code UCAEP.',
        ],
      },
      {
        tabLabel: '03 · Enregistrer votre vidéo',
        kicker: 'Étape 05 · Tournage au smartphone',
        title: 'Privilégier la pédagogie plutôt que le montage',
        paragraphs: [
          "Tournez avec votre téléphone posé face à vous, à bonne lumière et sans bruit parasite. Si vous utilisez un objet courant (une bouteille d'eau, une lampe, un cahier) pour votre démonstration scientifique, vérifiez qu'il reste bien visible dans le cadre.",
          "Parlez à un rythme légèrement plus lent que dans une conversation courante : celui qui découvre une notion scientifique a besoin d'une seconde de silence pour assimiler chaque idée.",
        ],
        checklist: [
          'Son net, débit posé et explication progressive sans lire mécaniquement.',
          'Accessoires ou schémas lisibles si vous illustrez le sujet scientifique.',
          'Durée vérifiée sous 05:00 avec le calculateur ci-dessous.',
        ],
      },
    ],
    equityRules: [
      {
        kicker: 'Rigueur & pédagogie',
        title: 'Exactitude sans jargon inutile',
        description:
          'Simplifier pour être compris ne veut pas dire déformer les faits. Le jury note à la fois la justesse du contenu et votre capacité à le rendre clair.',
      },
      {
        kicker: 'Anonymat',
        title: 'Correction sous référence UCAEP',
        description:
          'Vos travaux restent associés uniquement à votre code candidat pour assurer une évaluation impartiale entre toutes les filières de l’ENSET.',
      },
      {
        kicker: 'Suite du parcours',
        title: 'Vers les ateliers et la finale',
        description:
          'Les finalistes retenus bénéficient de deux jours d’ateliers pratiques de diction sur le campus avant la Grande Finale en présentiel.',
      },
    ],
    checklistBeforeSend: [
      'J’ai vérifié l’exactitude scientifique de mon explication « La science dans notre quotidien ».',
      'Mon texte « L’école, le savoir et l’avenir » défend un point de vue clair et argumenté.',
      'Mes deux vidéos durent moins de 5 minutes et s’entendent sans bruit de fond.',
      'Mes envois respectent la date limite indiquée dans l’espace dépôt.',
    ],
    practicalNote:
      'Phase qualificative sur 20 points réservée aux qualifiés de La Plume. Les résultats sont publiés sous code candidat avec possibilité de recours matériel sous 24 heures.',
  },
  'phase-3': {
    sectionKicker: 'Étape 01 · Présentation de la phase',
    sectionTitle: "Phase 3 — L'Éloquence",
    sectionSubtitle: 'Deux jours d’ateliers sur le campus puis la Grande Finale devant public',
    introParagraphs: [
      "La troisième et dernière phase se déroule entièrement en présentiel à l'ENSET de Lokossa. Il n'y a plus de fichier ni de vidéo à envoyer en ligne : vous défendez vos idées en direct devant le public étudiant et le jury.",
      "Pour vous y préparer sereinement, l'organisation prévoit deux journées d'ateliers pratiques (Jours 12 et 13) encadrées par la Session Théâtre de l'UCAEP. Vous y travaillez la respiration, l'articulation, le regard, la gestion du trac et l'utilisation du micro sur scène.",
      "Le Jour 14, lors de la finale, vous enchaînez deux exercices complémentaires : une prise de parole préparée chez vous sur un sujet libre, puis une courte improvisation à partir d'un thème découvert sur place.",
    ],
    maskedSummary:
      "La Phase 3 (« L'Éloquence ») réunit les finalistes en présentiel à l'ENSET de Lokossa après deux journées d'ateliers de diction (Jours 12 et 13). Les intitulés exacts des deux épreuves finales sont publiés à l'approche de la finale.",
    timelineWindow: 'Jours 12 à 14 · En présentiel',
    deliverableSummary: 'Présence aux ateliers (J12–13) + 2 passages sur scène (J14)',
    outcomeSummary: 'Palmarès final et remise des attestations officielles',
    epreuvesHeading: 'Présentation des deux épreuves de L’Éloquence',
    epreuvesLead:
      'Deux passages complémentaires en direct devant jury et public, sans élimination en cours de soirée.',
    epreuves: [
      {
        number: '05',
        tag: 'Épreuve 05 · Discours préparé sur sujet libre',
        duration: 'Passage sur scène (≤ 5 min)',
        title: '« La parole que le monde doit entendre »',
        summary:
          "Vous préparez à l'avance une prise de parole personnelle sur le thème de votre choix (littéraire, éducatif, scientifique, social ou culturel), puis vous la présentez devant le jury et la salle le jour de la finale.",
        concreteAdvice:
          "Choisissez un sujet sur lequel vous avez une vraie conviction personnelle, pas un discours trop large qui cherche à tout dire en cinq minutes. Une idée forte bien défendue marque plus l'auditoire.",
        extraParagraphs: [
          "Votre discours gagne à être structuré clairement : une entrée en matière qui capte l'attention, deux ou trois arguments appuyés sur du concret, et une conclusion nette.",
          "Durant les ateliers des Jours 12 et 13, vous pouvez répéter votre passage au micro avec l'encadrement de la Session Théâtre pour ajuster votre posture et vos silences.",
        ],
        formatsLabel: 'Champ du sujet',
        formats:
          'Thème libre (éducatif, scientifique, littéraire, social ou culturel) préparé en amont et prononcé en direct.',
      },
      {
        number: '06',
        tag: 'Épreuve 06 · Improvisation sur thème tiré sur place',
        duration: 'Temps de préparation court + parole sur scène',
        title: "« Le défi de l'inattendu »",
        summary:
          "Le jour de la finale, un sujet vous est communiqué sur place. Après un court moment de préparation pour organiser vos idées, vous prenez la parole sans texte rédigé au préalable.",
        concreteAdvice:
          "En improvisation, ne cherchez pas à parler vite dès la première seconde. Prenez cinq secondes pour respirer, annoncez votre idée principale en une phrase claire, donnez un exemple concret puis concluez posément.",
        extraParagraphs: [
          "Cet exercice évalue votre capacité d'écoute, votre sang-froid et votre manière d'organiser une pensée rapidement face à l'imprévu.",
          "Aucun savoir encyclopédique caché n'est attendu : la pertinence du raisonnement, le contact avec le public et la clarté d'élocution comptent avant tout.",
        ],
        formatsLabel: 'Ce qui est évalué',
        formats:
          'Écoute, réactivité d’argumentation, structuration rapide de la pensée et présence devant la salle.',
      },
    ],
    guideHeading: 'Comment se déroulent la préparation et la soirée finale',
    guideLead:
      'Retrouvez l’organisation concrète des Jours 12, 13 et 14 sur le campus de l’ENSET de Lokossa.',
    guideTabs: [
      {
        tabLabel: '01 · Ce qu’il faut préparer',
        kicker: 'Étape 03 · Avant le campus',
        title: 'Votre discours préparé et votre présence aux ateliers',
        paragraphs: [
          "Pour cette phase finale, vous n'avez aucun fichier à déposer sur la plateforme. Votre travail personnel en amont consiste à rédiger puis mémoriser les points clés de votre discours « La parole que le monde doit entendre ».",
          "Veillez à ce que votre intervention reste confortable sous les 5 minutes : vous pourrez utiliser le minuteur de lecture sur cette page pour calibrer votre texte avant les ateliers.",
        ],
        checklist: [
          'Aucun envoi en ligne requis pour la Phase 3.',
          'Discours préparé sur sujet libre calibré sous 05:00.',
          'Présence indispensable aux deux jours d’ateliers et au Jour 14.',
        ],
      },
      {
        tabLabel: '02 · Ateliers Jours 12–13',
        kicker: 'Étape 04 · Encadrement Session Théâtre',
        title: 'Travailler la voix, le souffle et l’espace scénique',
        paragraphs: [
          "Les Jours 12 et 13 réunissent les finalistes à l'ENSET de Lokossa avec l'équipe de la Session Théâtre UCAEP. Le premier jour est consacré aux exercices collectifs : poser sa respiration, projeter la voix sans crier, gérer le trac et regarder la salle.",
          "Le deuxième jour permet des passages d'essai individuels et des réglages techniques au microphone pour vous sentir à l'aise dans la salle de la finale.",
        ],
        checklist: [
          'Jour 12 : respiration, articulation, gestion du trac et écoute.',
          'Jour 13 : répétitions individuelles et calage technique au micro.',
          'Retours bienveillants sans modifier votre style personnel.',
        ],
      },
      {
        tabLabel: '03 · Soirée finale Jour 14',
        kicker: 'Étape 05 · Passage devant jury et public',
        title: 'Enchaîner les deux épreuves sans élimination intermédiaire',
        paragraphs: [
          "Le Jour 14, tous les finalistes présentent successivement leur discours préparé puis l'épreuve d'improvisation devant le jury pluridisciplinaire et le public. Aucune élimination n'a lieu entre les deux épreuves de la soirée.",
          "À l'issue des passages, le jury délibère pour proclamer le palmarès de l'édition 2026 et remettre les attestations officielles à chaque participant.",
        ],
        checklist: [
          'Acte 1 : « La parole que le monde doit entendre ».',
          'Acte 2 : « Le défi de l’inattendu » sur thème communiqué sur place.',
          'Délibération finale, palmarès et remise des attestations.',
        ],
      },
    ],
    equityRules: [
      {
        kicker: '100 % présentiel',
        title: 'Aucun dépôt en ligne requis',
        description:
          'Toutes les évaluations de Phase 3 se déroulent en direct sur le campus de l’ENSET de Lokossa devant la salle et le jury.',
      },
      {
        kicker: 'Jury pluridisciplinaire',
        title: 'Évaluation globale de la soirée',
        description:
          'Les deux passages (préparé et spontané) sont notés ensemble sur 20 points sans élimination au milieu de la finale.',
      },
      {
        kicker: 'Attestations',
        title: 'Reconnaissance pour chaque participant',
        description:
          'Tous les étudiants engagés dans le concours sont invités à la finale et reçoivent une attestation officielle UCAEP.',
      },
    ],
    checklistBeforeSend: [
      'J’ai testé la durée de mon discours préparé pour rester en dessous de 5 minutes.',
      'J’ai noté les dates et horaires des ateliers de diction (Jours 12 et 13) sur le campus.',
      'Je prépare mes repères mentaux sans dépendre uniquement de feuilles lues mot à mot.',
      'Je suis prêt à arriver en avance le Jour 14 pour le tirage de l’ordre de passage.',
    ],
    practicalNote:
      'Grande Finale en présentiel à l’ENSET de Lokossa, notée sur 20 points sans élimination en cours de soirée. Aucun dépôt de fichier en ligne n’est demandé.',
  },
};

function formatDeadline(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function SinglePhasePage({ initialAnchor }: { initialAnchor?: string }) {
  const { siteConfig, activePhase, phasesSummary, announcements } = useSiteConfig();
  const guideTabGroupId = useId();
  const [expandedAnnId, setExpandedAnnId] = useState<string | null>(null);
  const [expandedEpreuves, setExpandedEpreuves] = useState<Record<string, boolean>>({});
  const [activeGuideTab, setActiveGuideTab] = useState(0);

  useEffect(() => {
    setExpandedEpreuves({});
    setActiveGuideTab(0);
  }, [activePhase?.id]);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  const phaseTitle = activePhase
    ? `Phase ${activePhase.number} · ${activePhase.title}`
    : 'Phase active';

  usePageSeo(
    phaseTitle,
    activePhase?.shortDescription ||
      'Guide complet du candidat : consignes, préparation vidéo, barème et espace de dépôt pour la phase en cours du concours UCAEP.',
  );

  useEffect(() => {
    const targetId =
      initialAnchor ||
      (typeof window !== 'undefined' && window.location.hash
        ? window.location.hash.replace(/^#/, '')
        : '');
    if (!targetId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [initialAnchor]);

  async function handleSendContact(e: FormEvent) {
    e.preventDefault();
    setContactError('');
    setContactSending(true);
    try {
      await fetchApiJson('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject || `Question — ${phaseTitle}`,
          message: contactMessage,
        }),
      });
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    } catch (err) {
      setContactError(
        err instanceof Error
          ? err.message
          : "Votre message n'a pas pu être envoyé pour le moment.",
      );
    } finally {
      setContactSending(false);
    }
  }

  if (!activePhase) {
    return <div className="min-h-screen bg-ucaep-paper" />;
  }

  const isPresentiel =
    activePhase.format === 'En présentiel' || activePhase.id === 'phase-3';
  const dossier =
    PHASE_EDITORIAL_DOSSIERS[activePhase.id] ||
    PHASE_EDITORIAL_DOSSIERS['phase-1'];
  const deadlineLabel = formatDeadline(activePhase.submissionDeadline);
  const hasNotice = Boolean(siteConfig.customNotice && siteConfig.customNotice.trim());

  const epreuveParts = activePhase.testDetails?.theme
    ? activePhase.testDetails.theme
        .split('·')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="bg-ucaep-paper text-ucaep-ink">
      {/* SECTION 1 : HERO PLEIN ÉCRAN CENTRÉ SUR LA PHASE ACTIVE */}
      <section
        id="phase-apercu"
        className="relative min-h-[100dvh] flex flex-col justify-between bg-[#F7E6C8] text-[#4E2A1E] pt-24 lg:pt-28 overflow-hidden"
      >
        <BrandPatternSurface
          variant="gold"
          tileWidth={210}
          opacityClass="opacity-[0.06]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="gold"
          tileWidth={140}
          blendMultiply
          doubleRing
          orbit
          className="hidden lg:block -top-24 -right-16 w-72 h-72 opacity-[0.09]"
        />

        <div className="relative z-10 w-full max-w-[1520px] mx-auto px-5 sm:px-8 lg:px-14 my-auto py-8 lg:py-12">
          {hasNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EDITORIAL_EASE }}
              className="mb-8 px-4 py-3 bg-[#FBF9F5]/90 border border-[#4E2A1E]/20 rounded-sm text-xs sm:text-sm text-[#4E2A1E] flex flex-wrap items-center justify-between gap-3"
            >
              <p className="font-medium leading-relaxed">{siteConfig.customNotice}</p>
              <a
                href="#informations"
                className="text-xs font-semibold underline hover:text-ucaep-green shrink-0"
              >
                Consulter les annonces
              </a>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Colonne gauche */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.56, ease: EDITORIAL_EASE }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4E2A1E]/80">
                <span>Session Théâtre UCAEP · ENSET de Lokossa</span>
                <span aria-hidden="true">·</span>
                <span className="text-ucaep-green">
                  Phase {activePhase.number} — {activePhase.statusLabel}
                </span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-[4.25rem] font-semibold tracking-tight leading-[1.03] text-[#4E2A1E] text-balance">
                {activePhase.title}
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-normal italic text-[#4E2A1E]/80 mt-2">
                  Et si on lisait à haute voix ? — Édition 2026
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#171412]/85 leading-relaxed max-w-prose">
                {activePhase.shortDescription}
              </p>

              {/* Repères essentiels sans répétition */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-t border-b border-[#4E2A1E]/18 tabular-nums">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#4E2A1E]/65">
                    Format
                  </p>
                  <p className="text-sm font-semibold text-[#4E2A1E] mt-1">
                    {activePhase.format}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#4E2A1E]/65">
                    Statut
                  </p>
                  <p className="text-sm font-semibold text-ucaep-green mt-1">
                    {activePhase.statusLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#4E2A1E]/65">
                    Temps max
                  </p>
                  <p className="text-sm font-semibold text-[#4E2A1E] mt-1">
                    5 min · / 20 pts
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#4E2A1E]/65">
                    {isPresentiel ? 'Lieu' : 'Clôture dépôt'}
                  </p>
                  <p className="text-sm font-semibold text-[#4E2A1E] mt-1">
                    {isPresentiel
                      ? 'ENSET de Lokossa'
                      : deadlineLabel ||
                        (activePhase.submissionsOpen ? 'Dépôts ouverts' : 'Voir calendrier')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <a
                  href="#depot-production"
                  className="btn-tactile inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider rounded-[4px] bg-[#4E2A1E] text-[#FBF9F5] hover:bg-[#3a1f16]"
                >
                  <span>
                    {isPresentiel
                      ? 'Consulter le programme sur le campus'
                      : activePhase.submissionsOpen
                        ? 'Déposer mes productions'
                        : 'Accéder à mon espace candidat'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#comprendre-phase"
                  className="btn-tactile inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider rounded-[4px] border border-[#4E2A1E]/35 text-[#4E2A1E] hover:bg-[#4E2A1E]/6"
                >
                  <span>Consulter les consignes</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>

            {/* Colonne droite : Photographie documentaire */}
            <div className="lg:col-span-5">
              <div className="relative bg-[#4E2A1E] p-3 sm:p-4 rounded-sm shadow-xl">
                <PhotographicPlate
                  immediate
                  parallaxAmount={8}
                  className="aspect-[4/5] max-h-[540px] w-full rounded-[2px]"
                >
                  <EditorialImage
                    assetKey={activePhase.imageKey}
                    priority
                    className="w-full h-full object-cover"
                  />
                </PhotographicPlate>
                <div className="pt-3.5 px-1 flex items-center justify-between text-xs text-[#F7E6C8]/85">
                  <span className="font-serif italic">
                    Phase {activePhase.number} · {activePhase.title}
                  </span>
                  <span className="font-mono uppercase tracking-widest text-[10px] text-ucaep-gold">
                    ENSET Lokossa
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bandeau inférieur brun profond : repère des 3 phases */}
        <div className="relative z-10 bg-[#4E2A1E] text-[#F7E6C8] border-t border-ucaep-gold/25">
          <BrandPatternBand variant="obsidian" tileWidth={140} className="h-2 opacity-80" />
          <div className="max-w-[1520px] mx-auto px-5 sm:px-8 lg:px-14 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 tabular-nums">
              {phasesSummary.map((p) => {
                const isCurrent = p.id === activePhase.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 ${
                      isCurrent ? 'text-ucaep-gold font-semibold' : 'text-[#F7E6C8]/60'
                    }`}
                  >
                    <span className="font-mono">{p.number}</span>
                    <span>{p.title}</span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase tracking-widest text-[#FBF9F5]/85">
                        (phase active)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[#F7E6C8]/75">
              Guide complet du candidat : consignes, préparation, barème et dépôt réunis ici.
            </p>
          </div>
        </div>
      </section>

      <SectionAnchorRail
        items={[
          { id: 'comprendre-phase', num: '01', label: 'Guide de la phase' },
          {
            id: 'atelier-video',
            num: '02',
            label: isPresentiel ? 'Préparer son passage' : 'Préparer sa vidéo',
          },
          { id: 'consignes', num: '03', label: 'Vérifier & barème' },
          {
            id: 'depot-production',
            num: '04',
            label: isPresentiel ? 'Finale présentiel' : 'Déposer',
          },
          { id: 'informations', num: '05', label: 'Annonces & contact' },
        ]}
      />

      {/* SECTION 2 : GUIDE PROGRESSIF DE LA PHASE ACTIVE (ÉTAPES 1 À 5 SANS RÉPÉTITION) */}
      <section
        id="comprendre-phase"
        className="relative scroll-mt-20 py-16 lg:py-24 bg-[#FBF9F5] paper-grain border-b border-ucaep-brown/14 overflow-hidden"
      >
        <BrandPatternSurface
          variant="brown"
          tileWidth={230}
          opacityClass="opacity-[0.035]"
          blendMultiply
        />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 space-y-16">
          <ThreePhaseNarrativeArc
            activeStepIndex={Math.max(0, Number.parseInt(activePhase.number, 10) - 1)}
          />

          {/* ÉTAPE 1 : PRÉSENTATION EN PARAGRAPHES CONTINUS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <EditorialReveal className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                  {dossier.sectionKicker}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ucaep-brown leading-[1.08] text-balance">
                  <EditorialTitleReveal>{dossier.sectionTitle}</EditorialTitleReveal>
                </h2>
                <p className="font-serif italic text-lg sm:text-xl text-ucaep-brown/80">
                  {dossier.sectionSubtitle}
                </p>
              </div>

              <div className="space-y-4 max-w-prose text-base sm:text-[17px] text-ucaep-ink/88 leading-[1.75]">
                {activePhase.isRevealed ? (
                  dossier.introParagraphs.map((para, idx) => <p key={idx}>{para}</p>)
                ) : (
                  <p>{dossier.maskedSummary}</p>
                )}
              </div>
            </EditorialReveal>

            <ParallaxDepthCard offset={6} className="lg:col-span-4">
              <aside className="bg-white border border-ucaep-brown/15 rounded-sm p-6 sm:p-7 space-y-5">
                <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-widest text-ucaep-gold border-b border-ucaep-brown/12 pb-3">
                  {activePhase.id === 'phase-1' ? (
                    <Feather className="w-4 h-4" />
                  ) : activePhase.id === 'phase-2' ? (
                    <BookOpen className="w-4 h-4" />
                  ) : (
                    <Mic2 className="w-4 h-4" />
                  )}
                  <span>En bref · Phase {activePhase.number}</span>
                </div>

                <dl className="divide-y divide-ucaep-brown/10 text-sm">
                  <div className="py-3 space-y-1">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-ucaep-brown/65">
                      Calendrier
                    </dt>
                    <dd className="font-medium text-ucaep-brown tabular-nums">
                      {dossier.timelineWindow}
                    </dd>
                  </div>
                  <div className="py-3 space-y-1">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-ucaep-brown/65">
                      À remettre
                    </dt>
                    <dd className="font-medium text-ucaep-ink">
                      {dossier.deliverableSummary}
                    </dd>
                  </div>
                  <div className="py-3 space-y-1">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-ucaep-brown/65">
                      Suite du parcours
                    </dt>
                    <dd className="font-medium text-ucaep-green">
                      {dossier.outcomeSummary}
                    </dd>
                  </div>
                </dl>
              </aside>
            </ParallaxDepthCard>
          </div>

          {/* ÉTAPE 2 : PRÉSENTATION DES ÉPREUVES (PROTÉGÉE PAR isRevealed) */}
          <EditorialReveal className="space-y-6 pt-8 border-t border-ucaep-brown/14">
            <div className="space-y-2 max-w-prose">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold">
                Étape 02 · Présentation des épreuves
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                {dossier.epreuvesHeading}
              </h3>
              <p className="text-sm sm:text-base text-ucaep-ink/78 leading-relaxed">
                {dossier.epreuvesLead}
              </p>
            </div>

            {activePhase.isRevealed ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {dossier.epreuves.map((epreuve, idx) => {
                  const isExpanded = Boolean(expandedEpreuves[epreuve.number]);
                  return (
                    <ParallaxDepthCard key={epreuve.number} offset={idx === 0 ? 5 : -5} delay={idx * 0.06}>
                      <article className="bg-white border border-ucaep-brown/16 rounded-sm p-6 sm:p-8 space-y-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ucaep-brown/12 pb-3 tabular-nums">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold">
                            {epreuve.tag}
                          </span>
                          <span className="text-xs font-semibold text-ucaep-green">
                            {epreuve.duration}
                          </span>
                        </div>

                        <h4 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                          {epreuve.title}
                        </h4>

                        <p className="text-[15px] sm:text-base text-ucaep-ink/88 leading-[1.7] max-w-prose">
                          {epreuve.summary}
                        </p>

                        <div className="p-4 bg-[#F7E6C8]/38 border border-ucaep-brown/14 rounded-sm space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-brown">
                            Repère utile sans sujet imposé
                          </p>
                          <p className="text-xs sm:text-sm text-ucaep-ink/85 leading-relaxed">
                            {epreuve.concreteAdvice}
                          </p>
                        </div>

                        <p className="text-xs text-ucaep-brown/80 leading-relaxed">
                          <strong className="font-semibold text-ucaep-brown">
                            {epreuve.formatsLabel} :
                          </strong>{' '}
                          {epreuve.formats}
                        </p>

                        <EditorialExpandable isOpen={isExpanded}>
                          <div className="pt-4 border-t border-ucaep-brown/12 space-y-3 text-sm text-ucaep-ink/84 leading-[1.75]">
                            {epreuve.extraParagraphs.map((paragraph, pIdx) => (
                              <p key={pIdx}>{paragraph}</p>
                            ))}
                          </div>
                        </EditorialExpandable>

                        <div className="pt-2 border-t border-ucaep-brown/10">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() =>
                              setExpandedEpreuves((prev) => ({
                                ...prev,
                                [epreuve.number]: !prev[epreuve.number],
                              }))
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors"
                          >
                            <span>
                              {isExpanded
                                ? 'Masquer les repères de préparation'
                                : 'Lire les repères de préparation'}
                            </span>
                            <motion.span
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
                              className="inline-flex"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </motion.span>
                          </button>
                        </div>
                      </article>
                    </ParallaxDepthCard>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {['01', '02'].map((num) => (
                  <article
                    key={num}
                    className="bg-white border border-ucaep-brown/16 rounded-sm p-6 sm:p-8 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-ucaep-brown/12 pb-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold">
                        Épreuve {num} · Phase {activePhase.number}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ucaep-brown/75">
                        <Lock className="w-3.5 h-3.5 text-ucaep-gold" />
                        Masquée
                      </span>
                    </div>
                    <h4 className="font-serif text-2xl font-semibold text-ucaep-brown">
                      Sujet et consignes en attente de publication
                    </h4>
                    <p className="text-sm text-ucaep-ink/80 leading-relaxed">
                      L&apos;intitulé précis et le sujet de cette épreuve sont masqués jusqu&apos;à l&apos;ouverture officielle par l&apos;équipe organisatrice de l&apos;UCAEP.
                    </p>
                  </article>
                ))}
              </div>
            )}
          </EditorialReveal>

          {/* ÉTAPES 3, 4 & 5 : CE QU'IL FAUT PRODUIRE, MÉTHODE ET PRÉPARATION */}
          {activePhase.isRevealed && (
            <EditorialReveal className="space-y-6 pt-8 border-t border-ucaep-brown/14">
              <div className="space-y-2 max-w-prose">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                  Étapes 03 à 05 · Méthode et réalisation
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                  {dossier.guideHeading}
                </h3>
                <p className="text-sm sm:text-base text-ucaep-ink/78 leading-relaxed">
                  {dossier.guideLead}
                </p>
              </div>

              {(() => {
                const safeIdx =
                  activeGuideTab < dossier.guideTabs.length ? activeGuideTab : 0;
                const currentTab = dossier.guideTabs[safeIdx];
                return (
                  <div className="bg-white border border-ucaep-brown/16 rounded-sm overflow-hidden">
                    <div
                      role="tablist"
                      aria-label={dossier.guideHeading}
                      className="flex flex-wrap border-b border-ucaep-brown/14 bg-[#F7E6C8]/28"
                    >
                      {dossier.guideTabs.map((tab, idx) => {
                        const isActive = idx === safeIdx;
                        return (
                          <button
                            key={tab.tabLabel}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveGuideTab(idx)}
                            className={`relative px-5 py-4 text-xs sm:text-sm font-semibold transition-colors text-left whitespace-nowrap ${
                              isActive
                                ? 'text-ucaep-brown bg-white'
                                : 'text-ucaep-brown/65 hover:text-ucaep-brown hover:bg-white/50'
                            }`}
                          >
                            <span>{tab.tabLabel}</span>
                            {isActive && (
                              <motion.span
                                layoutId={`guide-underline-${guideTabGroupId}`}
                                aria-hidden="true"
                                transition={EDITORIAL_SPRING}
                                className="absolute inset-x-0 bottom-0 h-0.5 bg-ucaep-brown"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentTab.tabLabel}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
                        className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                      >
                        <div className="lg:col-span-7 space-y-4">
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-gold">
                              {currentTab.kicker}
                            </p>
                            <h4 className="font-serif text-2xl font-semibold text-ucaep-brown">
                              {currentTab.title}
                            </h4>
                          </div>

                          <div className="space-y-3 text-sm sm:text-[15.5px] text-ucaep-ink/86 leading-[1.75] max-w-prose">
                            {currentTab.paragraphs.map((p, pIdx) => (
                              <p key={pIdx}>{p}</p>
                            ))}
                          </div>
                        </div>

                        <div className="lg:col-span-5 p-5 sm:p-6 bg-ucaep-paper border border-ucaep-brown/12 rounded-sm space-y-3.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-green">
                            Points clés de cette étape
                          </p>
                          <ul className="space-y-3 text-xs sm:text-sm text-ucaep-ink/88 leading-relaxed">
                            {currentTab.checklist.map((point) => (
                              <li key={point} className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-ucaep-green shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                );
              })()}
            </EditorialReveal>
          )}

          {/* ENGAGEMENTS D'ÉQUITÉ ET UTILITÉ DES RÈGLES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-ucaep-brown/14">
            {dossier.equityRules.map((rule, idx) => {
              const IconComp = idx === 0 ? Scale : idx === 1 ? ShieldCheck : Languages;
              return (
                <div
                  key={rule.title}
                  className="p-6 bg-ucaep-ivory/35 border border-ucaep-brown/14 rounded-sm space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-brown/80">
                    <IconComp className="w-3.5 h-3.5 text-ucaep-gold shrink-0" />
                    <span>{rule.kicker}</span>
                  </div>
                  <h4 className="font-serif text-lg font-semibold text-ucaep-brown">
                    {rule.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-ucaep-ink/82 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2B : ATELIER PRATIQUE DU TEXTE À LA VIDÉO (5 MIN) */}
      <section
        id="atelier-video"
        className="relative scroll-mt-20 py-16 lg:py-20 bg-[#F4EDE1] paper-grain border-b border-ucaep-brown/12 overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 space-y-8">
          <div className="max-w-prose space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              Étape 05 bis · Outil de préparation · Limite 05:00
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown text-balance">
              {isPresentiel
                ? 'Calibrer votre discours sous les 5 minutes'
                : 'Tester votre temps de lecture avant d’enregistrer votre vidéo'}
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ink/78 leading-relaxed">
              Collez votre brouillon dans le simulateur ci-dessous pour vérifier si votre texte tient confortablement sous la barre des 5 minutes, puis cochez les préparatifs matériels.
            </p>
          </div>

          <VideoPrepWorkshop isPresentiel={isPresentiel} />
        </div>
      </section>

      {/* SECTION 3 : ÉTAPE 6 — VÉRIFIER AVANT L'ENVOI & BARÈME SUR 20 POINTS */}
      <section
        id="consignes"
        className="relative scroll-mt-20 py-16 lg:py-24 bg-ucaep-paper border-b border-ucaep-brown/12"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 space-y-12">
          <div className="max-w-prose space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              Étape 06 · Vérifier avant l’envoi &amp; barème
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ucaep-brown text-balance">
              Règlement de phase et notation — {activePhase.title}
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ink/78 leading-relaxed">
              Avant d&apos;envoyer votre dossier ou de passer sur scène, relisez les consignes officielles publiées par l&apos;équipe et consultez la grille exacte sur 20 points.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-8">
              {activePhase.isRevealed && activePhase.testDetails ? (
                <div className="p-6 sm:p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-6">
                  <div className="space-y-2 border-b border-ucaep-brown/12 pb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-ucaep-gold">
                      Note officielle de la phase
                    </p>
                    <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                      {activePhase.testDetails.instructionsTitle}
                    </h3>
                  </div>

                  {epreuveParts.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-ucaep-brown/75">
                        Intitulés retenus
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {epreuveParts.map((part, idx) => (
                          <div
                            key={part}
                            className="p-4 bg-ucaep-paper border border-ucaep-brown/15 rounded-sm space-y-1"
                          >
                            <span className="font-mono text-[11px] text-ucaep-green font-semibold">
                              0{idx + 1}
                            </span>
                            <p className="font-serif text-base font-semibold text-ucaep-brown">
                              {part}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 max-w-prose">
                    <p className="text-xs font-semibold uppercase tracking-widest text-ucaep-brown/75">
                      Directives officielles
                    </p>
                    <p className="text-base text-ucaep-ink/85 leading-relaxed whitespace-pre-line">
                      {activePhase.testDetails.instructions}
                    </p>
                  </div>

                  {activePhase.testDetails.submissionNote && (
                    <div className="pt-4 border-t border-ucaep-brown/12 text-xs text-ucaep-brown/80 font-medium">
                      {activePhase.testDetails.submissionNote}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 sm:p-8 bg-ucaep-ivory/45 border border-ucaep-brown/18 rounded-sm space-y-4">
                  <div className="flex items-center gap-2.5 text-ucaep-brown font-semibold text-sm">
                    <Lock className="w-4 h-4 text-ucaep-gold" />
                    <span>Consignes en attente de publication</span>
                  </div>
                  <p className="text-sm text-ucaep-ink/80 leading-relaxed">
                    Les sujets détaillés de la Phase {activePhase.number} ({activePhase.title})
                    s&apos;afficheront ici automatiquement dès leur activation par
                    l&apos;équipe organisatrice de l&apos;UCAEP.
                  </p>
                  <p className="text-xs text-ucaep-brown/75">
                    Format : {activePhase.format} · Durée maximale : jusqu&apos;à 5 minutes.
                  </p>
                </div>
              )}

              {activePhase.isRevealed && (
                <div className="p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-4">
                  <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                    Vérifications rapides avant {isPresentiel ? 'la finale' : 'l’envoi'}
                  </h3>
                  <ul className="space-y-3 text-sm text-ucaep-ink/85">
                    {dossier.checklistBeforeSend.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-ucaep-green shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="lg:col-span-5 space-y-6">
              <div
                data-parallax-card="6"
                className="p-6 sm:p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-4"
              >
                <div className="flex items-baseline justify-between border-b border-ucaep-brown/12 pb-3">
                  <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                    Règles d&apos;évaluation
                  </h3>
                  <span className="font-mono text-xs font-semibold text-ucaep-gold tabular-nums">
                    Total : 20 pts
                  </span>
                </div>

                <div className="p-4 bg-ucaep-paper border border-ucaep-brown/12 rounded-sm text-xs sm:text-sm text-ucaep-ink/85 leading-relaxed">
                  {dossier.practicalNote}
                </div>

                <p className="text-xs text-ucaep-brown/75 leading-relaxed">
                  Cliquez sur chaque critère du barème interactif ci-dessous pour savoir précisément ce que le jury examine.
                </p>
              </div>

              {deadlineLabel && !isPresentiel && (
                <div className="p-5 bg-[#4E2A1E] text-[#FBF9F5] rounded-sm flex items-start gap-3.5">
                  <Clock className="w-5 h-5 text-ucaep-gold shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-ucaep-gold">
                      Date limite de dépôt
                    </p>
                    <p className="text-sm font-semibold tabular-nums">{deadlineLabel}</p>
                    <p className="text-xs text-[#F7E6C8]/75">
                      Déposez vos textes et vidéos sans attendre la dernière heure : tant qu&apos;un texte n&apos;est pas encore validé par le jury, vous pouvez le mettre à jour.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>

          <InteractiveRubric phaseId={activePhase.id} compact />
        </div>
      </section>

      {/* SECTION 4 : ÉTAPE 7 — DÉPOSER VOS PRODUCTIONS OU PROGRAMME PRÉSENTIEL */}
      <section
        id="depot-production"
        className="relative scroll-mt-20 py-16 lg:py-24 bg-ucaep-paper paper-fiber border-b border-ucaep-brown/12 overflow-hidden"
      >
        <BrandPatternWave
          variant="green"
          tileWidth={170}
          opacity={0.075}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-16"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 space-y-8">
          <div className="space-y-3 max-w-prose">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              Étape 07 · {isPresentiel ? 'Sur le campus' : 'Déposer vos productions'}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
              {isPresentiel
                ? 'Ateliers et Grande Finale à l’ENSET de Lokossa'
                : `Transmettre vos travaux — Phase ${activePhase.number}`}
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ink/78 leading-relaxed">
              {isPresentiel
                ? "Aucun fichier n'est à déposer en ligne pour cette phase : retrouvez ci-dessous les étapes de votre venue sur le campus."
                : 'Identifiez-vous avec votre code d’anonymat UCAEP-2026-XXXX et votre adresse e-mail pour soumettre vos deux textes, suivre leur validation par le jury ou accéder au formulaire vidéo.'}
            </p>
          </div>

          {isPresentiel ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ucaep-green">
                  <Calendar className="w-4 h-4" />
                  <span>Jours 12 et 13 · Ateliers préparatoires</span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                  Diction, souffle et essais au micro
                </h3>
                <p className="text-sm text-ucaep-ink/82 leading-relaxed">
                  Les finalistes bénéficient de deux journées d&apos;exercices collectifs et de répétitions individuelles avec la Session Théâtre UCAEP sur le campus de Lokossa.
                </p>
              </div>

              <div className="p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ucaep-gold">
                  <MapPin className="w-4 h-4" />
                  <span>Jour 14 · Grande Finale publique</span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                  Passages devant le jury et remise des attestations
                </h3>
                <p className="text-sm text-ucaep-ink/82 leading-relaxed">
                  {activePhase.isRevealed
                    ? "Chaque finaliste présente son discours préparé (« La parole que le monde doit entendre ») puis l'épreuve d'improvisation (« Le défi de l'inattendu »), avant la proclamation du palmarès et la remise des attestations."
                    : "Chaque finaliste présente deux épreuves orales devant le jury et le public (intitulés communiqués à l'approche de la finale), suivies de la remise des attestations."}
                </p>
              </div>
            </div>
          ) : (
            <DepotSubmissionPanel
              lockedPhaseId={activePhase.id}
              hideRegistrationHint
            />
          )}
        </div>
      </section>

      {/* SECTION 5 : ANNONCES OFFICIELLES & CONTACT DIRECT */}
      <section
        id="informations"
        className="scroll-mt-20 py-16 lg:py-24 bg-[#FBF9F5]"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                Informations officielles
              </p>
              <h2 className="font-serif text-3xl font-semibold text-ucaep-brown">
                Annonces &amp; notes de l&apos;organisation
              </h2>
            </div>

            {announcements.length === 0 ? (
              <div className="p-6 bg-white border border-ucaep-brown/15 rounded-sm text-sm text-ucaep-ink/70">
                Aucune annonce publiée pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-ucaep-brown/15 border-t border-b border-ucaep-brown/15 bg-white px-6 rounded-sm">
                {announcements.map((ann) => {
                  const isExpanded = expandedAnnId === ann.id;
                  return (
                    <article key={ann.id} className="py-5 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ucaep-brown/70 tabular-nums">
                        <span className="font-semibold text-ucaep-green">
                          {ann.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatFrenchDate(ann.publishedAt)}</span>
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                        {ann.title}
                      </h3>
                      <p className="text-sm text-ucaep-ink/80 leading-relaxed">
                        {ann.excerpt}
                      </p>
                      <EditorialExpandable isOpen={isExpanded}>
                        <div className="pt-2 text-sm text-ucaep-ink/85 leading-relaxed whitespace-pre-line border-t border-ucaep-brown/10">
                          {ann.content}
                        </div>
                      </EditorialExpandable>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAnnId(isExpanded ? null : ann.id)
                        }
                        className="text-xs font-semibold text-ucaep-brown hover:text-ucaep-gold underline pt-1"
                      >
                        {isExpanded ? 'Réduire la note' : 'Lire la note complète'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-6">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-gold">
                  Assistance candidats
                </p>
                <h2 className="font-serif text-2xl font-semibold text-ucaep-brown">
                  Joindre l&apos;équipe UCAEP
                </h2>
                <p className="text-sm text-ucaep-ink/78 leading-relaxed">
                  Un doute sur une consigne, votre code UCAEP ou l&apos;envoi de vos fichiers ? Écrivez directement à l&apos;équipe organisatrice en précisant votre code candidat si vous en avez déjà un.
                </p>
              </div>

              <div className="space-y-3 text-sm text-ucaep-ink/85 tabular-nums border-t border-b border-ucaep-brown/12 py-4">
                <p className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-ucaep-brown shrink-0" />
                  <a
                    href="mailto:ucaeplokossa@gmail.com"
                    className="hover:underline font-medium"
                  >
                    ucaeplokossa@gmail.com
                  </a>
                </p>
                <p className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-ucaep-brown shrink-0" />
                  <span>+229 01 68 62 46 00 · +229 01 96 11 80 37</span>
                </p>
                <p className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-ucaep-brown shrink-0" />
                  <span>ENSET de Lokossa — UNSTIM, Bénin</span>
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!contactOpen ? (
                  <motion.button
                    key="open-btn"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      setContactOpen(true);
                      setContactSuccess(false);
                    }}
                    className="w-full py-3 px-5 text-xs font-semibold uppercase tracking-wider rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Écrire à l&apos;organisation</span>
                  </motion.button>
                ) : contactSuccess ? (
                  <motion.div
                    key="contact-sent"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
                    className="p-4 bg-ucaep-green/10 border border-ucaep-green/30 rounded-sm text-sm text-ucaep-green space-y-2"
                  >
                    <p className="font-semibold">Message transmis à l&apos;UCAEP.</p>
                    <p className="text-xs">
                      L&apos;équipe organisatrice vous répondra à l&apos;adresse e-mail que vous avez indiquée.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="contact-form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
                    onSubmit={handleSendContact}
                    className="space-y-3"
                  >
                    {contactError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 text-xs bg-red-50 border border-red-300 text-red-900 rounded-sm"
                      >
                        {contactError}
                      </motion.p>
                    )}
                    <input
                      type="text"
                      required
                      placeholder="Votre nom complet"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Votre e-mail"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                    />
                    <input
                      type="text"
                      placeholder={`Objet (ex. ${phaseTitle})`}
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                    />
                    <textarea
                      rows={3}
                      required
                      placeholder="Votre question ou précision..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={contactSending}
                        className="btn-tactile flex-1 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] disabled:opacity-50"
                      >
                        {contactSending ? 'Envoi...' : 'Envoyer le message'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactOpen(false)}
                        className="py-2.5 px-3 text-xs font-medium text-ucaep-brown hover:underline"
                      >
                        Fermer
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
