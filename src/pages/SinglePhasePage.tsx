import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
import {
  BrandPatternBand,
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { DepotSubmissionPanel } from '../components/DepotSubmissionPanel';
import { EditorialImage } from '../components/EditorialImage';
import { InteractiveRubric } from '../components/InteractiveRubric';
import { SectionAnchorRail } from '../components/SectionAnchorRail';
import { VideoPrepWorkshop } from '../components/VideoPrepWorkshop';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { useEditorialScrollMotion } from '../lib/motion';
import { useSiteConfig } from '../lib/site-config';

interface PhaseEpreuveCard {
  number: string;
  tag: string;
  duration: string;
  title: string;
  summary: string;
  keyPoints: Array<{ label: string; text: string }>;
  paragraphs: string[];
  formatsLabel: string;
  formats: string;
}

interface PhaseEditorialBlock {
  tabLabel: string;
  kicker: string;
  title: string;
  summary: string;
  takeaways: string[];
  paragraphs: string[];
}

interface PhaseWorkflowCard {
  step: string;
  timing: string;
  title: string;
  detail: string;
}

interface PhaseRuleCard {
  kicker: string;
  title: string;
  description: string;
}

interface PhaseInstitutionalDossier {
  sectionKicker: string;
  sectionTitle: string;
  sectionSubtitle: string;
  introSummary: string;
  introHighlights: Array<{ num: string; title: string; detail: string }>;
  introParagraph: string;
  timelineWindow: string;
  outcomeSummary: string;
  epreuvesTitle: string;
  epreuvesIntro: string;
  epreuves: PhaseEpreuveCard[];
  modalitiesHeading: string;
  modalitiesSubheading: string;
  modalitiesBlocks: PhaseEditorialBlock[];
  closingKicker: string;
  closingTitle: string;
  closingSummary: string;
  closingStatement: string;
  workflowTitle: string;
  workflowIntro: string;
  workflowSteps: PhaseWorkflowCard[];
  rulesCards: PhaseRuleCard[];
  criteria: Array<{ label: string; points: string }>;
  deliverables: string[];
  practicalNote: string;
}

const PHASE_INSTITUTIONAL_DOSSIERS: Record<string, PhaseInstitutionalDossier> = {
  'phase-1': {
    sectionKicker: '01 · Présentation officielle — Phase 1',
    sectionTitle: 'Phase 1 — La Plume',
    sectionSubtitle: 'Création littéraire, écriture personnelle et lecture à haute voix',
    introSummary:
      "Consacrée à la création littéraire et à l'expression personnelle, La Plume invite chaque candidat à observer, ressentir, structurer une pensée originale puis à lui donner vie à haute voix face caméra.",
    introHighlights: [
      {
        num: '01',
        title: 'Deux défis d’écriture',
        detail: 'Un autoportrait (« Je suis… ») et une parole intérieure (« Les mots que l’on n’ose pas dire »).',
      },
      {
        num: '02',
        title: 'De la page à la voix',
        detail: 'Chaque texte est accompagné d’une vidéo de lecture ou d’interprétation expressive.',
      },
      {
        num: '03',
        title: 'Simplicité & authenticité',
        detail: 'Un téléphone portable au calme suffit : le texte et la sincérité de la voix priment.',
      },
    ],
    introParagraph:
      "La première phase du concours « ET SI ON LISAIT À HAUTE VOIX ? », baptisée « LA PLUME », est une invitation à explorer le pouvoir des mots, à donner forme à ses pensées et à faire entendre une voix qui ne demande qu'à s'exprimer. Cette étape est entièrement consacrée à la création littéraire et à l'expression personnelle. Elle offre aux candidats l'occasion de révéler leur imagination, leur sensibilité, leur capacité à construire un texte et, surtout, leur manière singulière de raconter le monde. Il ne s'agit pas simplement de savoir écrire sans faute ou d'employer des mots compliqués. Il s'agit plutôt de savoir observer, ressentir, réfléchir, organiser ses idées et les traduire dans une création qui puisse toucher, interpeller ou faire réfléchir celui qui la découvre. Chaque candidat est donc invité à prendre sa plume, à trouver son inspiration et à produire des textes qui portent véritablement sa marque.",
    timelineWindow: 'Jours 1 à 5 · Phase qualificative en ligne',
    outcomeSummary: '2 textes originaux + 2 vidéos · Qualification vers la Phase 2.',
    epreuvesTitle: 'Les deux défis d’écriture distincts',
    epreuvesIntro:
      'Deux créations personnelles aux intentions complémentaires, chacune suivie de sa mise en voix vidéo.',
    epreuves: [
      {
        number: '01',
        tag: 'Premier défi · Autoportrait littéraire',
        duration: 'Texte + vidéo (≤ 5 min)',
        title: '« Je suis… »',
        summary:
          "Un exercice d'autoportrait littéraire pour aller au-delà de votre état civil et proposer un véritable regard sur qui vous êtes profondément.",
        keyPoints: [
          {
            label: 'À éviter',
            text: 'Réciter son identité, son cursus scolaire ou dresser une simple liste de qualités et défauts.',
          },
          {
            label: 'Pistes d’exploration',
            text: 'Expériences fondatrices, aspirations, convictions, peurs, contradictions, image ou métaphore forte.',
          },
          {
            label: 'Objectif',
            text: 'Construire un texte personnel, cohérent et expressif qui révèle une personnalité.',
          },
        ],
        paragraphs: [
          "Pour cette première phase, les participants devront relever deux défis d'écriture distincts, chacun reposant sur une thématique précise et une intention particulière. Le premier défi, intitulé « Je suis… », est un exercice d'autoportrait littéraire. Il invite chaque candidat à se raconter, mais pas de manière ordinaire. Il ne s'agit pas de réciter son identité, de présenter son cursus scolaire ou de dresser une liste de ses qualités et de ses défauts. Le candidat devra aller au-delà des informations habituelles pour proposer un véritable regard sur lui-même.",
          "Qui est-il derrière son nom ? Quelles expériences ont contribué à construire sa personnalité ? Quelles sont ses aspirations, ses convictions, ses rêves, ses peurs, ses contradictions ou les valeurs auxquelles il s'attache ? Quelle histoire, quelle image ou quelle métaphore pourrait traduire ce qu'il est profondément ? Autant de pistes qui peuvent nourrir cette création. Le participant dispose d'une liberté dans le choix de la forme littéraire : récit autobiographique, lettre à soi-même, poème, monologue, prose poétique ou toute autre forme pertinente. L'essentiel est de construire un texte personnel, cohérent, original et suffisamment expressif pour permettre au lecteur de découvrir une personnalité à travers les mots.",
        ],
        formatsLabel: 'Formes littéraires libres',
        formats:
          'Récit autobiographique, lettre à soi-même, poème, monologue, prose poétique ou toute autre forme pertinente.',
      },
      {
        number: '02',
        tag: 'Deuxième défi · Paroles silencieuses',
        duration: 'Texte + vidéo (≤ 5 min)',
        title: "« Les mots que l'on n'ose pas dire »",
        summary:
          "Un espace pour donner une voix aux pensées, émotions et vérités gardées silencieuses — adressées à une personne, une génération ou la société.",
        keyPoints: [
          {
            label: 'Registres possibles',
            text: 'Confession, hommage, regret, dénonciation, cri du cœur, message d’espoir ou réflexion collective.',
          },
          {
            label: 'Approche attendue',
            text: 'Privilégier la sincérité, la précision du propos et la sensibilité plutôt qu’un drame artificiel.',
          },
          {
            label: 'Objectif',
            text: 'Choisir un sujet qui vous parle réellement et le transformer en création littéraire porteuse d’intention.',
          },
        ],
        paragraphs: [
          "Le deuxième défi, « Les mots que l'on n'ose pas dire », invite les candidats à explorer une autre dimension de l'expression : celle des pensées, des émotions et des vérités que l'on garde parfois pour soi. Chacun possède des mots qu'il n'a jamais eu le courage de prononcer, des sentiments qu'il peine à exprimer, des questions auxquelles il n'a jamais obtenu de réponse ou des messages qu'il aurait aimé adresser à une personne, à une communauté, à une génération ou même à la société tout entière.",
          "Cet exercice offre aux participants un espace pour donner une voix à ces paroles restées silencieuses. Il peut s'agir d'une confession, d'un hommage, d'un regret, d'une dénonciation, d'un cri du cœur, d'une prise de conscience, d'un message d'espoir ou d'une réflexion sur une réalité personnelle ou collective. Le candidat devra choisir un sujet qui lui parle réellement et le transformer en une création littéraire capable de transmettre une intention. Une lettre, un poème, un monologue, un récit ou un texte libre peuvent servir de support à cette expression. La démarche doit rester personnelle et authentique : il ne s'agit pas de rechercher une histoire artificiellement dramatique, mais de trouver les mots justes pour exprimer une pensée avec profondeur, sensibilité et sincérité.",
        ],
        formatsLabel: 'Supports admis',
        formats:
          'Lettre, poème, monologue, récit ou texte libre exprimant une démarche personnelle et authentique.',
      },
    ],
    modalitiesHeading: 'De la page à la parole : vidéo, conditions et livrables',
    modalitiesSubheading:
      'Parcourez les trois volets essentiels pour préparer et enregistrer vos productions sans stress.',
    modalitiesBlocks: [
      {
        tabLabel: '01 · Interprétation & vidéo',
        kicker: 'Exigence d’interprétation',
        title: 'Une vidéo de lecture ou d’interprétation par texte',
        summary:
          "Chaque texte écrit doit être lu ou mis en voix face caméra pour faire passer la création de la page à la parole et permettre au jury d'évaluer votre appropriation.",
        takeaways: [
          'Filmer deux vidéos distinctes : une pour « Je suis… » et une pour « Les mots que l’on n’ose pas dire ».',
          'Soigner la diction, l’articulation, le rythme, l’intonation et le respect des pauses.',
          'Engager le regard, la posture et la respiration pour faire ressentir le sens du texte.',
        ],
        paragraphs: [
          "Cependant, le travail des candidats ne s'arrêtera pas à la rédaction de ces deux textes. Puisque le concours porte également sur la lecture à haute voix et l'expression, chaque production écrite devra être accompagnée d'une vidéo de lecture ou d'interprétation. Après avoir rédigé son premier texte, le candidat devra donc se filmer en train de le lire ou de le mettre en voix. Il devra ensuite procéder de la même manière pour son deuxième texte.",
          "L'objectif est de faire passer la création de la page à la parole, de donner une présence aux mots et de permettre au jury d'apprécier non seulement la qualité de l'écriture, mais également la manière dont le candidat s'approprie son texte. Il sera ainsi attendu des participants qu'ils accordent une attention particulière à leur diction, à leur articulation, à leur rythme, à leur intonation, à leurs pauses et à la transmission des émotions. Une lecture ne consiste pas uniquement à prononcer correctement les phrases : elle suppose de comprendre ce que l'on dit, de respecter le sens du texte et de trouver la manière de le faire ressentir à celui qui écoute. Le regard, la posture, la respiration et l'engagement du candidat pourront également contribuer à rendre son interprétation plus vivante.",
        ],
      },
      {
        tabLabel: '02 · Conditions techniques',
        kicker: 'Simplicité & authenticité',
        title: 'Un téléphone portable dans un lieu calme suffit',
        summary:
          "Aucun studio ni équipement professionnel n'est exigé : l'essentiel est de bien vous voir, de vous entendre distinctement et de laisser parler le texte.",
        takeaways: [
          'Choisir un endroit calme avec une lumière correcte et un son clair et audible.',
          'Éviter les effets de montage ou artifices techniques qui masquent votre interprétation.',
          'Mettre en avant la qualité littéraire du texte, votre personnalité et votre présence vocale.',
        ],
        paragraphs: [
          "Les vidéos devront permettre de distinguer clairement le candidat et d'entendre sa prestation dans de bonnes conditions. Il n'est pas nécessaire de disposer d'un appareil professionnel ou d'un studio pour participer. Un téléphone portable peut parfaitement suffire, à condition de choisir un environnement calme, de veiller à la qualité du son et de réaliser un enregistrement suffisamment clair.",
          "Les candidats sont encouragés à soigner leur présentation et leur interprétation, sans que les effets de montage ou les artifices techniques ne prennent le dessus sur le travail littéraire et la prestation orale. Ce qui doit avant tout retenir l'attention, c'est le texte proposé, la personnalité qui s'y révèle et la capacité du participant à donner vie à ses propres mots.",
        ],
      },
      {
        tabLabel: '03 · Livrables attendus',
        kicker: 'Dépôt complet',
        title: 'Ce que chaque candidat transmet en fin de phase',
        summary:
          "À l'issue de la Phase 1, votre dossier complet réunit vos deux créations écrites individuelles et leurs deux vidéos correspondantes.",
        takeaways: [
          'Création n°1 : texte original « Je suis… » + sa vidéo d’interprétation.',
          'Création n°2 : texte original « Les mots que l’on n’ose pas dire » + sa vidéo d’interprétation.',
          'Travail strictement personnel, avec correspondance fidèle entre chaque vidéo et le texte soumis.',
        ],
        paragraphs: [
          "À la fin de cette première phase, chaque candidat devra donc transmettre deux textes originaux et deux vidéos correspondantes : une première création autour du thème « Je suis… », accompagnée de sa vidéo d'interprétation, puis une seconde création autour du thème « Les mots que l'on n'ose pas dire », également accompagnée de sa vidéo. Les deux exercices devront être réalisés individuellement et les textes devront être des créations personnelles du candidat. Les participants devront veiller à ce que leurs vidéos correspondent bien aux textes soumis et que leur interprétation permette d'en saisir le sens et l'intention.",
        ],
      },
    ],
    closingKicker: 'Esprit de la Phase 1',
    closingTitle: 'Révéler une plume et une voix singulière',
    closingSummary:
      "À travers « LA PLUME », chaque étudiant montre ce que les mots peuvent raconter, révéler ou questionner — sur la page comme par la voix.",
    closingStatement:
      "Car avant de prendre la parole devant un public, il faut parfois commencer par trouver les mots qui méritent d'être entendus.",
    workflowTitle: 'Ce que les candidats vont faire concrètement',
    workflowIntro:
      'Quatre étapes simples pour passer de l’inspiration au dépôt en ligne.',
    workflowSteps: [
      {
        step: 'Étape 01',
        timing: 'Jours 1 à 2',
        title: 'Rédiger vos deux textes',
        detail:
          'Composer individuellement « Je suis… » puis « Les mots que l’on n’ose pas dire » sans plagiat ni IA.',
      },
      {
        step: 'Étape 02',
        timing: 'Jours 2 à 3',
        title: 'Filmer vos deux lectures',
        detail:
          'Enregistrer au calme (un téléphone suffit) la mise en voix de chacun de vos textes.',
      },
      {
        step: 'Étape 03',
        timing: 'Avant clôture (J3)',
        title: 'Déposer sous code UCAEP',
        detail:
          'Transmettre vos textes et vidéos ci-dessous avec votre code d’anonymat UCAEP-2026-XXXX.',
      },
      {
        step: 'Étape 04',
        timing: 'Jours 4 à 5',
        title: 'Évaluation & qualification',
        detail:
          'Le jury évalue anonymement sur 20 points puis publie la liste des qualifiés pour La Connaissance.',
      },
    ],
    rulesCards: [
      {
        kicker: 'Anonymat & équité',
        title: 'Évaluation sous code candidat',
        description:
          'Aucune identité nominative n’est communiquée aux correcteurs pendant l’examen des copies. Utilisez uniquement votre code UCAEP.',
      },
      {
        kicker: 'Authenticité',
        title: 'Créations strictement personnelles',
        description:
          'Les deux exercices doivent être réalisés individuellement et sans recours à l’intelligence artificielle ou au plagiat.',
      },
      {
        kicker: 'Langues & expression',
        title: 'Français et sensibilité culturelle',
        description:
          'Langue principale : le français, avec la possibilité d’intégrer avec justesse des expressions ou proverbes béninois.',
      },
    ],
    criteria: [
      { label: 'Sincérité et profondeur du propos', points: '6 pts' },
      { label: 'Qualité de la langue et de l’écriture', points: '6 pts' },
      { label: 'Originalité et créativité littéraire', points: '5 pts' },
      { label: 'Cohérence, diction et interprétation', points: '3 pts' },
    ],
    deliverables: [
      'Texte original n°1 (« Je suis… ») + sa vidéo de lecture ou d’interprétation.',
      'Texte original n°2 (« Les mots que l’on n’ose pas dire ») + sa vidéo d’interprétation.',
      'Enregistrement clair, audible et réalisé individuellement sous code d’anonymat UCAEP.',
    ],
    practicalNote:
      'Phase qualificative évaluée sur 20 points sous anonymat strict. Un recours écrit reste possible dans les 24 heures suivant l’affichage des résultats pour toute erreur matérielle.',
  },
  'phase-2': {
    sectionKicker: '01 · Présentation officielle — Phase 2',
    sectionTitle: 'Phase 2 — La Connaissance',
    sectionSubtitle: 'Réflexion, vulgarisation scientifique et transmission du savoir',
    introSummary:
      "Consacrée à la réflexion et à la transmission du savoir, La Connaissance met en valeur la curiosité intellectuelle, la rigueur d'analyse et la capacité à rendre des notions complexes accessibles à tous.",
    introHighlights: [
      {
        num: '01',
        title: 'Vulgarisation scientifique',
        detail: 'Expliquer simplement et avec exactitude un phénomène de la vie courante.',
      },
      {
        num: '02',
        title: 'Réflexion éducative',
        detail: 'Construire une pensée argumentée sur l’école, le savoir et l’avenir.',
      },
      {
        num: '03',
        title: 'Pédagogie face caméra',
        detail: 'Présenter vos deux productions en vidéo de manière claire et vivante.',
      },
    ],
    introParagraph:
      "Après avoir exploré leur créativité et leur capacité à exprimer des émotions à travers l'écriture lors de la première phase, les candidats entrent dans une nouvelle étape du concours : « LA CONNAISSANCE ». Cette deuxième phase est consacrée à la réflexion, à la compréhension et à la transmission du savoir. Elle invite les participants à démontrer qu'ils ne sont pas seulement capables de manier les mots pour raconter une histoire ou exprimer un sentiment, mais qu'ils peuvent également s'en servir pour expliquer le monde qui les entoure, partager des connaissances et faire réfléchir leur public. L'ambition de cette phase est de mettre en valeur la curiosité intellectuelle, la capacité d'analyse et l'aptitude à rendre des idées parfois complexes accessibles à tous. Car le savoir ne prend véritablement toute sa valeur que lorsqu'il peut être compris, partagé et utilisé pour éclairer les autres.",
    timelineWindow: 'Jours 6 à 11 · Phase qualificative en ligne',
    outcomeSummary: '2 productions écrites + 2 vidéos · Sélection des finalistes.',
    epreuvesTitle: 'Les deux défis complémentaires',
    epreuvesIntro:
      'Deux exercices exigeants mêlant justesse scientifique, sens critique et art de la transmission.',
    epreuves: [
      {
        number: '03',
        tag: 'Premier défi · Vulgarisation scientifique',
        duration: 'Production + vidéo pédagogique',
        title: '« La science dans notre quotidien »',
        summary:
          "Choisir un phénomène scientifique, une innovation ou un principe technique du quotidien et l'expliquer clairement à un public non spécialiste.",
        keyPoints: [
          {
            label: 'Exemples possibles',
            text: 'Couleur du coucher de soleil, fonctionnement d’un téléphone, flottabilité, réfrigérateur, ampoule…',
          },
          {
            label: 'À éviter',
            text: 'Réciter des formules ou empiler du jargon spécialisé sans explication progressive.',
          },
          {
            label: 'Méthode conseillée',
            text: 'S’appuyer sur des exemples concrets, objets du quotidien, schémas ou démonstrations simples.',
          },
        ],
        paragraphs: [
          "Pour cette deuxième phase, les candidats devront relever deux défis complémentaires, chacun reposant sur une thématique différente. Le premier défi, intitulé « La science dans notre quotidien », porte sur la vulgarisation scientifique. Il consiste à choisir un phénomène, un principe scientifique, une découverte, une innovation ou un concept technique, puis à l'expliquer de manière claire, accessible et captivante. Les candidats devront partir d'un sujet précis et montrer comment celui-ci se manifeste dans la vie de tous les jours, comment il fonctionne ou pourquoi il mérite notre attention. Ils pourront, par exemple, expliquer pourquoi le ciel change de couleur au coucher du soleil, comment fonctionne un téléphone portable, pourquoi certains objets flottent tandis que d'autres coulent, comment le réfrigérateur conserve les aliments, ce qui permet à une ampoule de produire de la lumière ou encore les principes scientifiques qui se cachent derrière certaines pratiques quotidiennes. Le choix du sujet est libre, à condition qu'il présente un véritable intérêt scientifique et que les explications proposées soient exactes. Le candidat devra éviter de simplement réciter des définitions ou d'accumuler des informations. Il lui faudra plutôt construire une explication progressive, illustrer ses propos avec des exemples concrets et trouver une manière intéressante de faire comprendre son sujet à une personne qui ne possède pas nécessairement de connaissances préalables dans le domaine.",
          "Ce premier exercice ne vise donc pas à désigner celui qui connaît le plus de formules scientifiques ou qui maîtrise le vocabulaire le plus spécialisé. Il cherche plutôt à révéler la capacité des candidats à comprendre une notion et à la transmettre efficacement. Un bon exercice de vulgarisation doit permettre au public de découvrir quelque chose, de comprendre un mécanisme ou de regarder autrement une situation qu'il rencontre habituellement sans forcément en connaître l'explication. Le participant devra ainsi faire preuve de rigueur dans le contenu, de pédagogie dans sa démarche et de créativité dans sa présentation. Il pourra utiliser des objets du quotidien, des illustrations, des démonstrations simples ou des exemples pour rendre son explication plus vivante. L'essentiel est que le public puisse suivre son raisonnement et retenir quelque chose à l'issue de la présentation.",
        ],
        formatsLabel: 'Exigence pédagogique',
        formats:
          'Explication progressive, rigueur scientifique, exemples concrets, objets du quotidien ou démonstrations simples.',
      },
      {
        number: '04',
        tag: 'Deuxième défi · Réflexion éducative',
        duration: 'Production + lecture expressive',
        title: "« L'école, le savoir et l'avenir »",
        summary:
          "Interroger le rôle de l'éducation, la valeur du savoir et la responsabilité des apprenants et futurs enseignants dans l'avenir de la société.",
        keyPoints: [
          {
            label: 'Pistes de réflexion',
            text: 'Que signifie apprendre ? Quelle place pour l’esprit critique, la créativité et l’innovation à l’école ?',
          },
          {
            label: 'À éviter',
            text: 'Se limiter à énumérer les problèmes du système éducatif ou à répéter des généralités.',
          },
          {
            label: 'Attente du jury',
            text: 'Développer une pensée personnelle structurée, appuyée sur des arguments et des exemples précis.',
          },
        ],
        paragraphs: [
          "Le deuxième défi, intitulé « L'école, le savoir et l'avenir », invite les candidats à mener une réflexion sur la place de l'éducation et de la connaissance dans la construction de l'individu et de la société. L'école ne se limite pas à un lieu où l'on apprend des leçons, où l'on prépare des examens ou où l'on obtient des diplômes. Elle constitue également un espace de formation, de transmission, de découverte, de confrontation des idées et de préparation à la vie. À travers cet exercice, les participants devront proposer un texte qui interroge le rôle de l'école, la valeur du savoir, la responsabilité des enseignants et des apprenants, ainsi que les perspectives qu'offre l'éducation pour l'avenir. Que signifie réellement apprendre ? L'école prépare-t-elle suffisamment les jeunes aux réalités du monde actuel ? Quelle place faut-il accorder à la curiosité, à l'esprit critique, à la créativité et à l'innovation dans les apprentissages ? Le savoir peut-il transformer une société ? Quel rôle les futurs enseignants et les étudiants peuvent-ils jouer dans la construction d'un avenir meilleur ? Ces questions constituent des pistes de réflexion et non des sujets imposés. Chaque candidat pourra choisir l'angle qui l'inspire, développer son propre point de vue et défendre une idée à travers une production structurée et argumentée.",
          "Pour ce deuxième défi, le candidat devra produire un texte personnel dans lequel il développe une réflexion cohérente, soutient ses idées et cherche à faire comprendre son regard sur l'éducation et le devenir de la société. Il pourra adopter la forme d'un discours, d'un essai, d'une lettre ouverte, d'un plaidoyer, d'un récit réflexif ou de toute autre forme d'expression pertinente. Il ne s'agira pas simplement d'énumérer les problèmes du système éducatif ou de répéter des idées générales sur l'importance de l'école. Le participant devra construire une véritable pensée, apporter des arguments, mobiliser des exemples et, si nécessaire, proposer des pistes de réflexion. Sa production devra témoigner de sa capacité à prendre du recul, à questionner une réalité et à communiquer une vision personnelle.",
        ],
        formatsLabel: 'Formes d’expression admises',
        formats:
          'Discours, essai, lettre ouverte, plaidoyer, récit réflexif ou toute autre forme structurée et argumentée.',
      },
    ],
    modalitiesHeading: 'Vidéos attendues, conditions techniques et soumission',
    modalitiesSubheading:
      'Consultez par onglet les attentes vidéo, les supports conseillés et les livrables de la phase.',
    modalitiesBlocks: [
      {
        tabLabel: '01 · Les 2 vidéos attendues',
        kicker: 'Présentations vidéo',
        title: 'Deux formats vidéo adaptés à chaque défi',
        summary:
          "Chaque texte s'accompagne d'une vidéo : une présentation pédagogique accessible pour le sujet scientifique et une lecture expressive pour le texte éducatif.",
        takeaways: [
          'Défi 1 (Science) : vidéo pédagogique adressée à quelqu’un qui découvre la notion.',
          'Défi 2 (École & avenir) : lecture expressive ou présentation orale mettant en relief vos convictions.',
          'Évaluation de la maîtrise du sujet, de la clarté du discours et de la capacité à intéresser.',
        ],
        paragraphs: [
          "Comme lors de la première phase, les productions écrites devront être accompagnées de vidéos. Pour le défi « La science dans notre quotidien », chaque candidat devra réaliser une vidéo pédagogique dans laquelle il présente et explique le sujet scientifique qu'il a choisi. Il devra s'adresser à son public comme s'il cherchait à faire découvrir une notion à une personne qui ne la connaît pas. Il lui faudra donc organiser son explication, introduire progressivement les informations, employer un langage compréhensible et veiller à la justesse de ses propos.",
          "Pour le défi « L'école, le savoir et l'avenir », le participant devra enregistrer une vidéo dans laquelle il donne vie à son texte à travers une lecture expressive ou une présentation orale. Il devra faire ressortir les idées importantes, transmettre ses convictions et capter l'attention par la qualité de son expression. Dans les deux cas, la vidéo devra permettre au jury d'apprécier la maîtrise du sujet, la clarté du discours, la qualité de la communication et la capacité du candidat à intéresser son auditoire.",
        ],
      },
      {
        tabLabel: '02 · Supports & enregistrement',
        kicker: 'Réalisation pratique',
        title: 'Un téléphone portable et des supports visuels sobres',
        summary:
          "Tournez simplement avec votre téléphone dans un endroit calme ; des objets, schémas ou expériences simples peuvent appuyer la démonstration scientifique.",
        takeaways: [
          'Environnement calme, image nette et son audible avec un simple smartphone.',
          'Objets, schémas ou illustrations bienvenus pour clarifier le sujet scientifique.',
          'Les effets de montage restent secondaires : votre prestation reste centrale.',
        ],
        paragraphs: [
          "Les candidats n'ont pas besoin de disposer d'un équipement audiovisuel professionnel pour réaliser leurs productions. Un téléphone portable peut suffire, à condition de privilégier un environnement calme, une bonne qualité sonore et une image suffisamment claire.",
          "Pour la vidéo scientifique, les participants peuvent intégrer des objets, des schémas, des expériences simples ou des illustrations afin de faciliter la compréhension de leur sujet. Pour la seconde vidéo, ils sont invités à soigner leur diction, leur articulation, leur intonation et leur posture afin de rendre leur réflexion plus vivante. Les supports visuels et les effets de montage peuvent accompagner la présentation, mais ils ne doivent jamais remplacer la prestation du candidat ni masquer la qualité réelle de son travail.",
        ],
      },
      {
        tabLabel: '03 · Livrables à soumettre',
        kicker: 'Dépôt complet',
        title: 'Récapitulatif des productions de Phase 2',
        summary:
          "Chaque candidat qualifié dépose ses deux productions écrites personnelles et leurs deux vidéos correspondantes via l'espace sécurisé UCAEP.",
        takeaways: [
          'Production n°1 : vulgarisation scientifique ou technique + sa vidéo explicative.',
          'Production n°2 : réflexion sur l’école, le savoir et l’avenir + sa vidéo de présentation.',
          'Correspondance exacte entre les textes soumis et les enregistrements vidéo.',
        ],
        paragraphs: [
          "À l'issue de cette deuxième phase, chaque participant devra donc soumettre deux productions écrites et deux vidéos correspondantes : une première production consacrée à la vulgarisation d'un sujet scientifique ou technique, accompagnée de sa vidéo explicative, puis une seconde production portant sur l'école, le savoir et l'avenir, accompagnée de sa vidéo de présentation ou de lecture expressive. Les textes devront être personnels, originaux et construits par les candidats eux-mêmes. Les vidéos devront correspondre aux productions soumises et permettre au jury d'apprécier concrètement les compétences mobilisées dans chaque exercice.",
        ],
      },
    ],
    closingKicker: 'Esprit de la Phase 2',
    closingTitle: 'Expliquer pour faire comprendre, réfléchir pour faire avancer',
    closingSummary:
      "« LA CONNAISSANCE » met les candidats face à deux exigences essentielles : rendre la science accessible avec précision et interroger l'éducation avec recul.",
    closingStatement:
      "Car savoir quelque chose est une richesse, mais être capable de le transmettre aux autres est une compétence qui peut véritablement transformer les choses.",
    workflowTitle: 'Ce que les candidats vont faire concrètement',
    workflowIntro:
      'De la sélection du sujet jusqu’au dépôt de vos vidéos pédagogiques.',
    workflowSteps: [
      {
        step: 'Étape 01',
        timing: 'Jour 6',
        title: 'Choisir ses angles et sujets',
        detail:
          'Sélectionner un phénomène du quotidien et définir votre thèse sur l’école, le savoir et l’avenir.',
      },
      {
        step: 'Étape 02',
        timing: 'Jours 6 à 8',
        title: 'Rédiger vos deux dossiers',
        detail:
          'Construire une explication progressive exacte et une réflexion personnelle structurée.',
      },
      {
        step: 'Étape 03',
        timing: 'Avant clôture (J9)',
        title: 'Filmer et déposer en ligne',
        detail:
          'Enregistrer la démonstration scientifique et la lecture expressive, puis déposer sous code UCAEP.',
      },
      {
        step: 'Étape 04',
        timing: 'Jours 10 à 11',
        title: 'Délibération & finalistes',
        detail:
          'Le jury pluridisciplinaire sélectionne les finalistes appelés à L’Éloquence.',
      },
    ],
    rulesCards: [
      {
        kicker: 'Rigueur & vulgarisation',
        title: 'Exactitude du fond et pédagogie',
        description:
          'Les explications scientifiques doivent être exactes, progressives et compréhensibles par un public non spécialiste.',
      },
      {
        kicker: 'Anonymat préservé',
        title: 'Évaluation sous code UCAEP',
        description:
          'Les travaux sont examinés sous référence anonyme afin de garantir l’impartialité entre toutes les filières.',
      },
      {
        kicker: 'Vers la finale',
        title: 'Accès aux ateliers de L’Éloquence',
        description:
          'Les candidats retenus accèdent aux ateliers préparatoires et à la Grande Finale en présentiel.',
      },
    ],
    criteria: [
      { label: 'Exactitude scientifique et maîtrise des idées', points: '6 pts' },
      { label: 'Clarté pédagogique et capacité de vulgarisation', points: '6 pts' },
      { label: 'Qualité de l’expression orale et conviction', points: '5 pts' },
      { label: 'Structure logique et argumentation', points: '3 pts' },
    ],
    deliverables: [
      'Production écrite n°1 (« La science dans notre quotidien ») + sa vidéo pédagogique.',
      'Production écrite n°2 (« L’école, le savoir et l’avenir ») + sa vidéo de présentation.',
      'Textes personnels et originaux correspondant fidèlement aux vidéos soumises.',
    ],
    practicalNote:
      'Phase qualificative sur 20 points réservée aux candidats qualifiés après La Plume. Les scores demeurent confidentiels jusqu’à publication officielle sous code.',
  },
  'phase-3': {
    sectionKicker: '01 · Présentation officielle — Phase 3',
    sectionTitle: "Phase 3 — L'Éloquence",
    sectionSubtitle: 'La grande finale en présentiel devant un public et un jury',
    introSummary:
      "Ultime étape du concours tenue en présentiel devant un public et un jury, L'Éloquence réunit tout ce que les finalistes ont développé : maîtrise des mots, construction des idées, confiance en soi et présence sur scène.",
    introHighlights: [
      {
        num: '01',
        title: '100 % en présentiel',
        detail: 'Aucun dépôt vidéo en ligne : tout se joue en direct devant public et jury.',
      },
      {
        num: '02',
        title: 'Discours préparé libre',
        detail: 'Défendre une conviction personnelle sur un thème de votre choix.',
      },
      {
        num: '03',
        title: 'Improvisation en direct',
        detail: 'Réagir avec créativité et sang-froid sur un thème dévoilé le jour même.',
      },
    ],
    introParagraph:
      "Après avoir exploré l'écriture et démontré leur capacité à transmettre des connaissances, les candidats accèdent à la dernière étape du concours : « L'ÉLOQUENCE ». Contrairement aux deux premières phases, qui se déroulent à distance à travers des productions vidéo, cette ultime étape se tiendra en présentiel, devant un public et un jury. Elle représente le moment où les candidats devront mettre en pratique tout ce qu'ils ont développé jusque-là : la maîtrise des mots, la construction des idées, la confiance en soi et la capacité à captiver un auditoire.",
    timelineWindow: 'Jours 12 à 14 · En présentiel à l’ENSET de Lokossa',
    outcomeSummary: '2 épreuves sur scène devant public et jury · Palmarès et distinctions.',
    epreuvesTitle: 'Les deux épreuves de la Grande Finale',
    epreuvesIntro:
      'Deux prises de parole publiques complémentaires pour évaluer à la fois la conviction préparée et la spontanéité.',
    epreuves: [
      {
        number: '05',
        tag: 'Première épreuve · Intervention préparée',
        duration: 'Discours devant jury et public',
        title: '« La parole que le monde doit entendre »',
        summary:
          "Préparer chez soi une intervention orale personnelle sur un sujet libre, puis la défendre sur scène le jour de la finale avec force d'argumentation.",
        keyPoints: [
          {
            label: 'Sujet libre',
            text: 'Domaine littéraire, social, scientifique, éducatif ou culturel au choix du finaliste.',
          },
          {
            label: 'Construction',
            text: 'Élaborer un discours personnel, défendre une idée ou porter une conviction importante.',
          },
          {
            label: 'Évaluation en direct',
            text: 'Pertinence du propos, qualité de l’argumentation et capacité à convaincre l’auditoire.',
          },
        ],
        paragraphs: [
          "Cette phase comportera deux épreuves. La première, « La parole que le monde doit entendre », consiste à préparer chez soi une intervention orale autour d'un sujet libre, pouvant être littéraire, social, scientifique, éducatif ou culturel. Chaque candidat devra construire un discours personnel, défendre une idée, partager une conviction ou porter un message qu'il juge important.",
          "Le jour de la finale, il présentera son intervention devant le jury et le public, en veillant à la pertinence de son propos, à la qualité de son argumentation et à sa capacité à convaincre.",
        ],
        formatsLabel: 'Champ du sujet',
        formats:
          'Sujet libre — littéraire, social, scientifique, éducatif ou culturel — défendu en présentiel devant le jury et le public.',
      },
      {
        number: '06',
        tag: 'Deuxième épreuve · Improvisation sur place',
        duration: 'Préparation courte & prise de parole',
        title: "« Le défi de l'inattendu »",
        summary:
          "Découvrir un thème le jour de la finale, organiser ses idées en un temps limité puis prendre la parole sans discours préparé à l'avance.",
        keyPoints: [
          {
            label: 'Thème sur place',
            text: 'Sujet communiqué le jour même avec un court temps de préparation pour bâtir son plan.',
          },
          {
            label: 'Prise de parole spontanée',
            text: 'Prendre la parole sans texte rédigé au préalable devant le jury et la salle.',
          },
          {
            label: 'Qualités évaluées',
            text: 'Spontanéité, réactivité, créativité, structuration rapide d’une pensée et aisance.',
          },
        ],
        paragraphs: [
          "La seconde épreuve, « Le défi de l'inattendu », mettra les candidats face à une situation d'improvisation. Le thème leur sera communiqué le jour de la finale. Ils disposeront alors d'un temps de préparation pour organiser leurs idées, construire leur intervention et trouver la meilleure manière de traiter le sujet proposé.",
          "Ils devront ensuite prendre la parole sans avoir préparé leur discours à l'avance. Cette épreuve permettra notamment d'évaluer leur spontanéité, leur réactivité, leur créativité, leur capacité à structurer rapidement une pensée et leur aisance face à l'imprévu.",
        ],
        formatsLabel: 'Compétences évaluées',
        formats:
          'Spontanéité, réactivité, créativité, structuration rapide d’une pensée et aisance face à l’imprévu.',
      },
    ],
    modalitiesHeading: 'Organisation de la finale en présentiel',
    modalitiesSubheading:
      'Aucun fichier vidéo n’est à déposer en ligne : préparez votre venue sur le campus de l’ENSET de Lokossa.',
    modalitiesBlocks: [
      {
        tabLabel: '01 · Ateliers de diction (J12–13)',
        kicker: 'Préparation en amont',
        title: 'Ateliers de diction et maîtrise scénique',
        summary:
          'Deux journées encadrées par la Session Théâtre UCAEP sur le campus pour travailler le souffle, la posture et la projection vocale avant le jour J.',
        takeaways: [
          'Exercices collectifs de respiration, articulation et gestion du trac (Jour 12).',
          'Répétitions individuelles et calage technique au micro sur scène (Jour 13).',
          'Accompagnement personnalisé de votre passage préparé sans dénaturer votre style.',
        ],
        paragraphs: [
          'En prélude à la Grande Finale, les finalistes participent sur le campus de l’ENSET de Lokossa à deux journées d’ateliers pratiques encadrées par la Session Théâtre UCAEP pour travailler la respiration, la posture, l’occupation de l’espace et la projection vocale.',
        ],
      },
      {
        tabLabel: '02 · Finale devant jury (J14)',
        kicker: 'Le jour de la finale',
        title: 'Passages devant le jury et le public',
        summary:
          'Chaque finaliste enchaîne sur scène son discours préparé puis l’épreuve d’improvisation devant la communauté universitaire et le jury pluridisciplinaire.',
        takeaways: [
          'Acte 1 : « La parole que le monde doit entendre » — intervention préparée chez soi.',
          'Acte 2 : « Le défi de l’inattendu » — thème remis sur place et improvisation.',
          'Clôture : délibération en direct, palmarès et remise des attestations officielles.',
        ],
        paragraphs: [
          'Chaque finaliste enchaîne la présentation de son discours préparé « La parole que le monde doit entendre » puis relève en direct « Le défi de l’inattendu » après communication du thème sur place et temps de préparation.',
        ],
      },
    ],
    closingKicker: 'Esprit de la Phase 3',
    closingTitle: 'De la page écrite à la présence sur scène',
    closingSummary:
      "Bien plus que réciter un texte, les finalistes doivent penser, convaincre, émouvoir et défendre leurs idées face à un auditoire.",
    closingStatement:
      "« L'ÉLOQUENCE » constitue ainsi le grand rendez-vous final du concours, celui où les mots quittent définitivement la page pour prendre toute leur dimension sur scène.",
    workflowTitle: 'Ce que les finalistes vont vivre étape par étape',
    workflowIntro:
      'De la préparation individuelle jusqu’au passage public sur la scène de l’ENSET.',
    workflowSteps: [
      {
        step: 'Étape 01',
        timing: 'En amont',
        title: 'Préparer son discours libre',
        detail:
          'Construire « La parole que le monde doit entendre » sur le thème de votre choix.',
      },
      {
        step: 'Étape 02',
        timing: 'Jours 12 à 13',
        title: 'Ateliers et calage scénique',
        detail:
          'Travail de diction, souffle, posture et essais micro avec la Session Théâtre.',
      },
      {
        step: 'Étape 03',
        timing: 'Jour 14 · Scène',
        title: 'Discours & improvisation',
        detail:
          'Présenter votre discours préparé puis relever « Le défi de l’inattendu » en direct.',
      },
      {
        step: 'Étape 04',
        timing: 'Clôture (J14)',
        title: 'Délibération et distinctions',
        detail:
          'Proclamation du palmarès et remise des prix et attestations aux finalistes.',
      },
    ],
    rulesCards: [
      {
        kicker: 'Modalité 100 % présentielle',
        title: 'Aucun dépôt en ligne requis',
        description:
          'Contrairement aux deux premières phases à distance, toute l’évaluation se tient physiquement devant le jury et le public.',
      },
      {
        kicker: 'Jury pluridisciplinaire',
        title: 'Évaluation en direct sur scène',
        description:
          'Le jury apprécie conjointement la pertinence du propos, l’argumentation, l’émotion et la réactivité en improvisation.',
      },
      {
        kicker: 'Valorisation',
        title: 'Attestations et rayonnement',
        description:
          'Tous les finalistes reçoivent une attestation officielle et participent au rayonnement de l’art oratoire à l’ENSET.',
      },
    ],
    criteria: [
      { label: 'Présence scénique, posture et diction', points: '6 pts' },
      { label: 'Pertinence du propos et argumentation', points: '6 pts' },
      { label: 'Spontanéité et maîtrise de l’imprévu', points: '5 pts' },
      { label: 'Capacité à convaincre et captiver l’auditoire', points: '3 pts' },
    ],
    deliverables: [
      'Discours préparé chez soi : « La parole que le monde doit entendre ».',
      'Présence aux ateliers préparatoires et à la Grande Finale à l’ENSET de Lokossa.',
      'Prise de parole spontanée sur place : « Le défi de l’inattendu ».',
    ],
    practicalNote:
      'Grande Finale en présentiel à l’ENSET de Lokossa devant le jury et le public. Aucun dépôt de fichier en ligne n’est requis pour cette étape.',
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
  const pageRef = useRef<HTMLDivElement>(null);
  const [expandedAnnId, setExpandedAnnId] = useState<string | null>(null);
  const [showFullIntro, setShowFullIntro] = useState(false);
  const [expandedEpreuves, setExpandedEpreuves] = useState<Record<string, boolean>>({});
  const [activeModalityIdx, setActiveModalityIdx] = useState(0);
  const [showFullModality, setShowFullModality] = useState(false);

  useEditorialScrollMotion(pageRef, [activePhase?.id]);

  useEffect(() => {
    setShowFullIntro(false);
    setExpandedEpreuves({});
    setActiveModalityIdx(0);
    setShowFullModality(false);
  }, [activePhase?.id]);

  // Quick inline contact state
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
      'Toutes les informations, consignes et modalités de participation pour la phase en cours du concours UCAEP.',
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
    PHASE_INSTITUTIONAL_DOSSIERS[activePhase.id] ||
    PHASE_INSTITUTIONAL_DOSSIERS['phase-1'];
  const deadlineLabel = formatDeadline(activePhase.submissionDeadline);
  const hasNotice = Boolean(siteConfig.customNotice && siteConfig.customNotice.trim());

  const epreuveParts = activePhase.testDetails?.theme
    ? activePhase.testDetails.theme
        .split('·')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div ref={pageRef} className="bg-ucaep-paper text-ucaep-ink">
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
            <div className="mb-8 px-4 py-3 bg-[#FBF9F5]/90 border border-[#4E2A1E]/20 rounded-sm text-xs sm:text-sm text-[#4E2A1E] flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium leading-relaxed">{siteConfig.customNotice}</p>
              <a
                href="#informations"
                className="text-xs font-semibold underline hover:text-ucaep-green shrink-0"
              >
                Voir les annonces
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Colonne gauche */}
            <div className="lg:col-span-7 space-y-6">
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

              <p className="text-base sm:text-lg text-[#171412]/85 leading-relaxed max-w-2xl">
                {activePhase.shortDescription}
              </p>

              {/* Métadonnées épurées sans pilules */}
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
                    Présentation
                  </p>
                  <p className="text-sm font-semibold text-[#4E2A1E] mt-1">
                    Jusqu&apos;à 5 min · / 20 pts
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
                      ? 'Programme en présentiel'
                      : activePhase.submissionsOpen
                        ? 'Déposer ma production'
                        : 'Accéder à mon dossier'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#comprendre-phase"
                  className="btn-tactile inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider rounded-[4px] border border-[#4E2A1E]/35 text-[#4E2A1E] hover:bg-[#4E2A1E]/6"
                >
                  <span>Présentation complète</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Colonne droite : Visuel éditorial de la phase */}
            <div className="lg:col-span-5">
              <div className="relative bg-[#4E2A1E] p-3 sm:p-4 rounded-sm shadow-xl">
                <div className="aspect-[4/5] max-h-[540px] w-full overflow-hidden rounded-[2px]">
                  <EditorialImage
                    assetKey={activePhase.imageKey}
                    priority
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="pt-3.5 px-1 flex items-center justify-between text-xs text-[#F7E6C8]/85">
                  <span className="font-serif italic">
                    Phase {activePhase.number} · {activePhase.title}
                  </span>
                  <span className="font-mono uppercase tracking-widest text-[10px] text-ucaep-gold">
                    Édition 2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bandeau inférieur brun profond : repère de progression des 3 phases */}
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
              Présentation complète, consignes et espace de dépôt réunis sur cette page.
            </p>
          </div>
        </div>
      </section>

      <SectionAnchorRail
        items={[
          { id: 'comprendre-phase', num: '01', label: 'Présentation' },
          {
            id: 'atelier-video',
            num: '02',
            label: isPresentiel ? 'Préparation scénique' : 'Atelier vidéo 5 min',
          },
          { id: 'consignes', num: '03', label: 'Consignes & barème' },
          {
            id: 'depot-production',
            num: '04',
            label: isPresentiel ? 'Finale présentiel' : 'Espace dépôt',
          },
          { id: 'informations', num: '05', label: 'Annonces & contact' },
        ]}
      />

      {/* SECTION 2 : PRÉSENTATION DYNAMIQUE ET STRUCTURÉE DE LA PHASE ACTIVE */}
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
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 space-y-14">
          {/* En-tête éditorial aéré + 3 repères immédiats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                  {dossier.sectionKicker}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ucaep-brown leading-[1.08] text-balance">
                  {dossier.sectionTitle}
                </h2>
                <p className="font-serif italic text-lg sm:text-xl text-ucaep-brown/80">
                  {dossier.sectionSubtitle}
                </p>
              </div>

              <div className="space-y-3 max-w-prose">
                <p className="text-base sm:text-[17px] text-ucaep-ink/90 leading-relaxed">
                  {dossier.introSummary}
                </p>

                {showFullIntro && (
                  <p className="pt-3 border-t border-ucaep-brown/12 text-sm sm:text-[15px] text-ucaep-ink/82 leading-[1.75]">
                    {dossier.introParagraph}
                  </p>
                )}

                <button
                  type="button"
                  aria-expanded={showFullIntro}
                  onClick={() => setShowFullIntro((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors pt-1"
                >
                  <span>
                    {showFullIntro
                      ? 'Masquer le texte complet'
                      : 'Lire la présentation détaillée'}
                  </span>
                  {showFullIntro ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* 3 repères visuels immédiats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {dossier.introHighlights.map((item, idx) => (
                  <div
                    key={item.num}
                    className="p-4 bg-white border border-ucaep-brown/14 rounded-sm space-y-1.5"
                  >
                    <span className="font-mono text-[11px] font-semibold text-ucaep-gold tabular-nums">
                      {item.num}
                    </span>
                    <h3 className="font-serif text-base font-semibold text-ucaep-brown">
                      {item.title}
                    </h3>
                    <p className="text-xs text-ucaep-ink/78 leading-relaxed">
                      {!activePhase.isRevealed && idx === 0
                        ? "Deux épreuves complémentaires dont les intitulés exacts sont masqués jusqu'à l'ouverture officielle de cette phase."
                        : item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="lg:col-span-4 bg-white border border-ucaep-brown/15 rounded-sm p-6 sm:p-7 space-y-5">
              <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-widest text-ucaep-gold border-b border-ucaep-brown/12 pb-3">
                {activePhase.id === 'phase-1' ? (
                  <Feather className="w-4 h-4" />
                ) : activePhase.id === 'phase-2' ? (
                  <BookOpen className="w-4 h-4" />
                ) : (
                  <Mic2 className="w-4 h-4" />
                )}
                <span>Fiche synthétique · Phase {activePhase.number}</span>
              </div>

              <dl className="divide-y divide-ucaep-brown/10 text-sm">
                <div className="py-3 space-y-1">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-ucaep-brown/65">
                    Fenêtre du parcours
                  </dt>
                  <dd className="font-medium text-ucaep-brown tabular-nums">
                    {dossier.timelineWindow}
                  </dd>
                </div>
                <div className="py-3 space-y-1">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-ucaep-brown/65">
                    Modalité d&apos;organisation
                  </dt>
                  <dd className="font-medium text-ucaep-ink">
                    {activePhase.format} · 2 épreuves
                  </dd>
                </div>
                <div className="py-3 space-y-1">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-ucaep-brown/65">
                    Issue de l&apos;étape
                  </dt>
                  <dd className="font-medium text-ucaep-green">
                    {dossier.outcomeSummary}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>

          {/* Sous-section A : Les deux défis / épreuves (Synthèse + Pistes clés + Note dépliable) */}
          <div className="space-y-6 pt-6 border-t border-ucaep-brown/14">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold">
                  Cahier des épreuves
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                  {dossier.epreuvesTitle}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-ucaep-ink/75 max-w-md">
                {dossier.epreuvesIntro}
              </p>
            </div>

            {activePhase.isRevealed ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {dossier.epreuves.map((epreuve) => {
                  const isExpanded = Boolean(expandedEpreuves[epreuve.number]);
                  return (
                    <article
                      key={epreuve.number}
                      className="bg-white border border-ucaep-brown/16 rounded-sm p-6 sm:p-8 space-y-5"
                    >
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

                      <p className="text-[15px] text-ucaep-ink/90 leading-relaxed">
                        {epreuve.summary}
                      </p>

                      <ul className="space-y-2.5 pt-1">
                        {epreuve.keyPoints.map((kp) => (
                          <li
                            key={kp.label}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-ucaep-ink/85 leading-relaxed"
                          >
                            <CheckCircle2 className="w-4 h-4 text-ucaep-green shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-semibold text-ucaep-brown">
                                {kp.label} :
                              </strong>{' '}
                              {kp.text}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="p-3.5 bg-[#F7E6C8]/38 border border-ucaep-brown/14 rounded-sm space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-brown">
                          {epreuve.formatsLabel}
                        </p>
                        <p className="text-xs text-ucaep-ink/85 leading-relaxed">
                          {epreuve.formats}
                        </p>
                      </div>

                      {isExpanded && (
                        <div className="pt-4 border-t border-ucaep-brown/12 space-y-3 text-sm text-ucaep-ink/82 leading-[1.75]">
                          {epreuve.paragraphs.map((paragraph, pIdx) => (
                            <p key={pIdx}>{paragraph}</p>
                          ))}
                        </div>
                      )}

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
                              ? 'Réduire les consignes détaillées'
                              : 'Lire les consignes détaillées'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </article>
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
                      L&apos;intitulé précis et le cahier des charges de cette épreuve sont masqués jusqu&apos;à l&apos;ouverture officielle par l&apos;équipe organisatrice de l&apos;UCAEP.
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sous-section B : Onglets interactifs (Format, Vidéo & Livrables) */}
          {activePhase.isRevealed && (
          <div className="space-y-6 pt-6 border-t border-ucaep-brown/14">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                  Guide pratique
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                  {dossier.modalitiesHeading}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-ucaep-ink/75 max-w-md">
                {dossier.modalitiesSubheading}
              </p>
            </div>

            {(() => {
              const safeIdx =
                activeModalityIdx < dossier.modalitiesBlocks.length
                  ? activeModalityIdx
                  : 0;
              const currentBlock = dossier.modalitiesBlocks[safeIdx];
              return (
                <div className="bg-white border border-ucaep-brown/16 rounded-sm overflow-hidden">
                  {/* Barre d'onglets */}
                  <div
                    role="tablist"
                    aria-label={dossier.modalitiesHeading}
                    className="flex flex-wrap border-b border-ucaep-brown/14 bg-[#F7E6C8]/28"
                  >
                    {dossier.modalitiesBlocks.map((block, idx) => {
                      const isActive = idx === safeIdx;
                      return (
                        <button
                          key={block.tabLabel}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => {
                            setActiveModalityIdx(idx);
                            setShowFullModality(false);
                          }}
                          className={`px-5 py-4 text-xs sm:text-sm font-semibold transition-colors border-b-2 text-left whitespace-nowrap ${
                            isActive
                              ? 'border-ucaep-brown text-ucaep-brown bg-white'
                              : 'border-transparent text-ucaep-brown/65 hover:text-ucaep-brown hover:bg-white/50'
                          }`}
                        >
                          {block.tabLabel}
                        </button>
                      );
                    })}
                  </div>

                  {/* Contenu structuré de l'onglet actif */}
                  <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-6 space-y-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-gold">
                          {currentBlock.kicker}
                        </p>
                        <h4 className="font-serif text-2xl font-semibold text-ucaep-brown">
                          {currentBlock.title}
                        </h4>
                      </div>

                      <p className="text-sm sm:text-[15.5px] text-ucaep-ink/88 leading-relaxed">
                        {currentBlock.summary}
                      </p>

                      {showFullModality && (
                        <div className="pt-3 border-t border-ucaep-brown/12 space-y-3 text-sm text-ucaep-ink/82 leading-[1.75]">
                          {currentBlock.paragraphs.map((p, pIdx) => (
                            <p key={pIdx}>{p}</p>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        aria-expanded={showFullModality}
                        onClick={() => setShowFullModality((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors pt-1"
                      >
                        <span>
                          {showFullModality
                            ? 'Masquer le détail complet'
                            : 'Afficher la note complète'}
                        </span>
                        {showFullModality ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="lg:col-span-6 p-5 sm:p-6 bg-ucaep-paper border border-ucaep-brown/12 rounded-sm space-y-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-green">
                        À retenir en un coup d&apos;œil
                      </p>
                      <ul className="space-y-3 text-xs sm:text-sm text-ucaep-ink/88 leading-relaxed">
                        {currentBlock.takeaways.map((point) => (
                          <li key={point} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-ucaep-green shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          )}

          {/* Sous-section C : Conclusion synthétique de la phase */}
          <article className="bg-[#4E2A1E] text-[#FBF9F5] rounded-sm p-7 sm:p-10 space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-gold">
                {dossier.closingKicker}
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#F7E6C8]">
                {dossier.closingTitle}
              </h3>
            </div>
            <p className="text-sm sm:text-base text-[#FBF9F5]/85 leading-relaxed max-w-3xl">
              {dossier.closingSummary}
            </p>
            <p className="font-serif italic text-lg sm:text-2xl text-ucaep-gold pt-3 border-t border-[#F7E6C8]/20">
              {dossier.closingStatement}
            </p>
          </article>

          {/* Sous-section D : Ce que les candidats vont faire concrètement (4 étapes séquentielles) */}
          {activePhase.isRevealed && (
          <div className="space-y-6 pt-4 border-t border-ucaep-brown/14">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                  Déroulement pratique
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                  {dossier.workflowTitle}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-ucaep-ink/75 max-w-md">
                {dossier.workflowIntro}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {dossier.workflowSteps.map((item) => (
                <div
                  key={item.step}
                  className="bg-white border border-ucaep-brown/15 rounded-sm p-6 space-y-3"
                >
                  <div className="flex items-baseline justify-between gap-2 border-b border-ucaep-brown/10 pb-2.5 tabular-nums">
                    <span className="font-mono text-xs font-semibold text-ucaep-gold uppercase tracking-wider">
                      {item.step}
                    </span>
                    <span className="text-[11px] font-medium text-ucaep-green">
                      {item.timing}
                    </span>
                  </div>
                  <h4 className="font-serif text-xl font-semibold text-ucaep-brown leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-ucaep-ink/80 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Sous-section E : Engagements institutionnels & Règles d'équité */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-ucaep-brown/14">
            {dossier.rulesCards.map((rule, idx) => {
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
                  <p className="text-xs sm:text-sm text-ucaep-ink/80 leading-relaxed">
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
          <div className="max-w-3xl space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              Accompagnement pas à pas · Limite 05:00
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown text-balance">
              {isPresentiel
                ? 'Préparer votre passage et votre minuterie'
                : 'Du texte à la vidéo : calculateur 5 min et checklist'}
            </h2>
          </div>

          <VideoPrepWorkshop isPresentiel={isPresentiel} />
        </div>
      </section>

      {/* SECTION 3 : CONSIGNES OFFICIELLES & BARÈME DE LA PHASE */}
      <section
        id="consignes"
        className="relative scroll-mt-20 py-16 lg:py-24 bg-ucaep-paper border-b border-ucaep-brown/12"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 space-y-12">
          <div className="max-w-3xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              02 · Cahier des charges &amp; barème
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ucaep-brown text-balance">
              Consignes officielles — {activePhase.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Sujet & Consignes détaillées */}
            <div className="lg:col-span-7 space-y-8">
              {activePhase.isRevealed && activePhase.testDetails ? (
                <div className="p-6 sm:p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-6">
                  <div className="space-y-2 border-b border-ucaep-brown/12 pb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-ucaep-gold">
                      Intitulé officiel
                    </p>
                    <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                      {activePhase.testDetails.instructionsTitle}
                    </h3>
                  </div>

                  {epreuveParts.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-ucaep-brown/75">
                        Thèmes et épreuves à préparer
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
                      Directives aux candidats
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
                    <span>Consignes en cours de publication</span>
                  </div>
                  <p className="text-sm text-ucaep-ink/80 leading-relaxed">
                    Les sujets détaillés de la Phase {activePhase.number} ({activePhase.title})
                    seront affichés à cet emplacement dès leur activation officielle par
                    l&apos;équipe organisatrice de l&apos;UCAEP.
                  </p>
                  <p className="text-xs text-ucaep-brown/75">
                    Format : {activePhase.format} · Durée maximale de présentation : jusqu&apos;à
                    5 minutes.
                  </p>
                </div>
              )}

              {activePhase.isRevealed && (
              <div className="p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-4">
                <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                  Liste de contrôle avant envoi ou passage
                </h3>
                <ul className="space-y-3 text-sm text-ucaep-ink/85">
                  {dossier.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-ucaep-green shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              )}
            </div>

            {/* Colonne droite : Note pratique & Date limite */}
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
                  Explorez chaque critère dans le barème interactif ci-dessous pour connaître précisément les attentes du jury et les erreurs à éviter.
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
                      Pensez à déposer votre fichier à l&apos;avance ; vous pourrez le
                      remplacer jusqu&apos;à la clôture.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>

          <InteractiveRubric phaseId={activePhase.id} compact />
        </div>
      </section>

      {/* SECTION 4 : ESPACE DÉPÔT INTÉGRÉ OU MODALITÉS PRÉSENTIELLES */}
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
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              03 · {isPresentiel ? 'Organisation sur le campus' : 'Dépôt en ligne'}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
              {isPresentiel
                ? 'Déroulement de la finale à l’ENSET de Lokossa'
                : `Déposer votre production — Phase ${activePhase.number}`}
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ink/75 max-w-2xl">
              {isPresentiel
                ? "La Phase 03 (L'Éloquence) se tient intégralement en présentiel devant le jury et le public. Retrouvez ci-dessous l'organisation pratique des ateliers et de la finale."
                : 'Utilisez directement cet espace sans quitter la page : renseignez votre code d’anonymat UCAEP et votre adresse e-mail pour envoyer ou mettre à jour votre travail.'}
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
                  Diction, souffle et posture scénique
                </h3>
                <p className="text-sm text-ucaep-ink/80 leading-relaxed">
                  Les finalistes sélectionnés à l&apos;issue des deux phases en ligne
                  bénéficient de deux journées d&apos;accompagnement collectif et
                  individuel avec la Session Théâtre UCAEP sur le campus.
                </p>
              </div>

              <div className="p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ucaep-gold">
                  <MapPin className="w-4 h-4" />
                  <span>Jour 14 · Grande Finale publique</span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                  Passages devant le jury et remise des prix
                </h3>
                <p className="text-sm text-ucaep-ink/80 leading-relaxed">
                  {activePhase.isRevealed
                    ? "Chaque finaliste présente son discours préparé (« La parole que le monde doit entendre ») puis relève l'épreuve d'improvisation (« Le défi de l'inattendu »), suivis de la remise des attestations de participation."
                    : "Chaque finaliste présente deux épreuves en présentiel devant le jury et le public (dont les intitulés précis sont communiqués à l'approche de la finale), suivies de la remise des attestations de participation."}
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
          {/* Annonces */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                04 · Communications officielles
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
                      {isExpanded && (
                        <div className="pt-2 text-sm text-ucaep-ink/85 leading-relaxed whitespace-pre-line border-t border-ucaep-brown/10">
                          {ann.content}
                        </div>
                      )}
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

          {/* Contact direct */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-6">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-gold">
                  Assistance candidats
                </p>
                <h2 className="font-serif text-2xl font-semibold text-ucaep-brown">
                  Joindre l&apos;équipe UCAEP
                </h2>
                <p className="text-sm text-ucaep-ink/75">
                  Un souci avec votre code d&apos;anonymat ou votre dépôt ? Contactez
                  directement la Session Théâtre.
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

              {!contactOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setContactOpen(true);
                    setContactSuccess(false);
                  }}
                  className="w-full py-3 px-5 text-xs font-semibold uppercase tracking-wider rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Écrire un message à l&apos;équipe</span>
                </button>
              ) : contactSuccess ? (
                <div className="p-4 bg-ucaep-green/10 border border-ucaep-green/30 rounded-sm text-sm text-ucaep-green space-y-2">
                  <p className="font-semibold">Message transmis à l&apos;UCAEP.</p>
                  <p className="text-xs">
                    L&apos;équipe organisatrice vous répondra à l&apos;adresse indiquée.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendContact} className="space-y-3">
                  {contactError && (
                    <p className="p-3 text-xs bg-red-50 border border-red-300 text-red-900 rounded-sm">
                      {contactError}
                    </p>
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
                      className="flex-1 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] disabled:opacity-50"
                    >
                      {contactSending ? 'Envoi...' : 'Envoyer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactOpen(false)}
                      className="py-2.5 px-3 text-xs font-medium text-ucaep-brown hover:underline"
                    >
                      Fermer
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
