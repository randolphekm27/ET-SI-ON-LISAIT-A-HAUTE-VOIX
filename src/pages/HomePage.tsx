import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Clock,
  Feather,
  Lock,
  Megaphone,
  Mic2,
  Newspaper,
  Scale,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  BrandPatternArch,
  BrandPatternBand,
  BrandPatternCircle,
  BrandPatternEdge,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialImage } from '../components/EditorialImage';
import { InteractiveRubric } from '../components/InteractiveRubric';
import { LanterneSequence } from '../components/LanterneSequence';
import {
  EditorialHairline,
  EditorialReveal,
  EditorialTitleReveal,
  ParallaxDepthCard,
  PhotographicPlate,
  ThreePhaseNarrativeArc,
} from '../components/MotionPrimitives';
import { ScenicStageAsset } from '../components/ScenicStageAsset';
import { fetchApiJson } from '../lib/api';
import { useCandidateSession } from '../lib/candidate-session';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { EDITORIAL_EASE } from '../lib/motion';
import { SCENIC_ASSETS } from '../lib/scenic-assets';
import type {
  CompetitionPhase,
  PublicAnnouncement,
  PublicNewsArticle,
} from '../types/competition';

const MANIFESTO_CARDS = [
  {
    index: '01',
    keyFigure: 'Pourquoi',
    title: 'Compléter vos études scientifiques et techniques',
    detail:
      "Savoir résoudre un exercice ne suffit pas toujours quand il faut défendre un mémoire, expliquer une idée complexe ou captiver une future classe : ce concours entraîne à écrire juste et à parler clair.",
    Icon: Users,
  },
  {
    index: '02',
    keyFigure: 'Comment',
    title: 'Deux étapes en vidéo, puis une finale sur scène',
    detail:
      "Vous commencez chez vous avec un simple téléphone portable : vous déposez deux textes puis deux exposés filmés (jusqu'à 5 min), avant une Grande Finale en présentiel pour les finalistes.",
    Icon: Clock,
  },
  {
    index: '03',
    keyFigure: 'Pour qui',
    title: 'Gratuit pour tout étudiant de l’ENSET de Lokossa',
    detail:
      "Toutes les filières et années d'études sont accueillies gratuitement, sans expérience théâtrale ni littéraire préalable. Votre envie d'apprendre et d'essayer suffit.",
    Icon: Scale,
  },
  {
    index: '04',
    keyFigure: 'Équité',
    title: 'Un jury pluridisciplinaire et des copies anonymes',
    detail:
      "Vos productions sont lues en double correction sous votre seul code candidat UCAEP, sans mention de nom ni de filière, avec un droit de recours écrit sous 24 heures.",
    Icon: ShieldCheck,
  },
];

export function HomePage() {
  usePageSeo(
    'Accueil',
    "Concours culturel gratuit organisé par la Session Théâtre de l'UCAEP pour tous les étudiants de l'ENSET de Lokossa : écriture originale, vulgarisation scientifique et éloquence en public.",
  );

  const heroRef = useRef<HTMLElement>(null);
  const shouldReduce = useReducedMotion();
  const candidateSession = useCandidateSession();
  const [phases, setPhases] = useState<CompetitionPhase[]>([]);
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [news, setNews] = useState<PublicNewsArticle[]>([]);
  const [loaded, setLoaded] = useState(false);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const smoothHeroProgress = useSpring(heroProgress, {
    stiffness: 160,
    damping: 28,
    mass: 0.45,
  });

  const plumeX = useTransform(smoothHeroProgress, [0, 1], shouldReduce ? [0, 0] : [0, 22]);
  const plumeY = useTransform(smoothHeroProgress, [0, 1], shouldReduce ? [0, 0] : [0, 150]);
  const plumeRotate = useTransform(smoothHeroProgress, [0, 1], shouldReduce ? [-4, -4] : [-4, -12]);

  const monsteraX = useTransform(smoothHeroProgress, [0, 1], shouldReduce ? [0, 0] : [0, -22]);
  const monsteraY = useTransform(smoothHeroProgress, [0, 1], shouldReduce ? [0, 0] : [0, -28]);
  const monsteraRotate = useTransform(smoothHeroProgress, [0, 1], shouldReduce ? [6, 6] : [6, 1]);
  const monsteraOpacity = useTransform(smoothHeroProgress, [0, 1], shouldReduce ? [1, 1] : [1, 0.2]);

  const portraitY = useTransform(smoothHeroProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-6%']);
  const portraitScale = useTransform(smoothHeroProgress, [0, 1], shouldReduce ? [1, 1] : [1, 1.035]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchApiJson<{ phases: CompetitionPhase[] }>('/api/phases'),
      fetchApiJson<{ announcements: PublicAnnouncement[] }>('/api/announcements'),
      fetchApiJson<{ news: PublicNewsArticle[] }>('/api/news'),
    ])
      .then(([pData, aData, nData]) => {
        if (!active) return;
        setPhases(pData.phases || []);
        setAnnouncements((aData.announcements || []).slice(0, 2));
        setNews((nData.news || []).slice(0, 3));
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const hasOpenSubmissions = phases.some((p) => Boolean(p.submissionsOpen));
  const leadNews = news[0];
  const secondaryNews = news.slice(1, 3);

  return (
    <div className="bg-ucaep-paper">
      {/* ================================================================
          SECTION 1 · HERO IVOIRE ÉDITORIAL + MONSTERA + ONDE BRUNE + PLUME
          ================================================================ */}
      <section
        ref={heroRef}
        className="relative z-20 w-full min-h-[100dvh] bg-[radial-gradient(ellipse_at_72%_30%,#FCF5E6_0%,#F7E6C8_58%,#EDD6AF_100%)] text-[#4E2A1E] pt-[132px] sm:pt-[112px] lg:pt-[100px] flex flex-col justify-between paper-grain"
      >
        {/* SVG clipPath réutilisable pour les angles échancrés du cadre portrait */}
        <svg aria-hidden="true" width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <clipPath id="hero-cartouche-clip" clipPathUnits="objectBoundingBox">
              <path d="M 0.055 0 L 0.945 0 A 0.055 0.042 0 0 0 1 0.042 L 1 0.958 A 0.055 0.042 0 0 0 0.945 1 L 0.055 1 A 0.055 0.042 0 0 0 0 0.958 L 0 0.042 A 0.055 0.042 0 0 0 0.055 0 Z" />
            </clipPath>
          </defs>
        </svg>

        {/* Plan 1 : Texture papier, bordure africaine discrète à gauche & lumière d'atelier */}
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <BrandPatternEdge
            variant="brown"
            side="left"
            className="w-2.5 sm:w-3.5 lg:w-4 opacity-[0.18] mix-blend-multiply"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_84%_22%,rgba(255,252,245,0.48)_0%,rgba(209,154,58,0.06)_44%,transparent_72%)]"
          />
          <BrandPatternCircle
            variant="brown"
            tileWidth={120}
            blendMultiply
            ring={false}
            className="hidden md:block bottom-36 left-10 w-32 h-32 opacity-[0.065]"
          />
        </div>

        {/* Plan 2 : ASSET VÉGÉTAL — MONSTERA (angle supérieur gauche, orientée vers le centre) */}
        <motion.div
          aria-hidden="true"
          data-scenic-asset="monstera"
          data-scenic-plan="2"
          style={{
            x: monsteraX,
            y: monsteraY,
            rotate: monsteraRotate,
            opacity: monsteraOpacity,
          }}
          className="hero-monstera pointer-events-none select-none absolute z-[5] top-[70px] sm:top-[76px] left-3 sm:left-5 lg:left-6 w-24 sm:w-32 lg:w-40 xl:w-44 aspect-[1392/1130]"
        >
          <motion.img
            src={SCENIC_ASSETS.monstera.src}
            alt=""
            loading="eager"
            decoding="async"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EDITORIAL_EASE }}
            className="scenic-object w-full h-full object-contain"
          />
        </motion.div>

        {/* Plan 2 : Composition principale 54% gauche / 46% droite sur toute la largeur éditoriale */}
        <div className="relative z-20 max-w-[1520px] mx-auto w-full px-5 sm:px-8 lg:px-14 xl:px-20 my-auto py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,54fr)_minmax(0,46fr)] gap-10 lg:gap-12 xl:gap-16 items-center">
            {/* COLONNE GAUCHE — Contenu éditorial (ordre strict & copywriting intact) */}
            <div className="lg:pl-8 xl:pl-12 space-y-6 sm:space-y-7">
              {/* 1. Contexte du concours */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: EDITORIAL_EASE }}
                className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8C5A0D]"
              >
                <span>Session Théâtre · UCAEP</span>
                <span aria-hidden="true" className="h-3 w-px bg-[#4E2A1E]/25" />
                <span className="text-[#4E2A1E]/85">ENSET de Lokossa — UNSTIM</span>
                <span
                  aria-hidden="true"
                  className="hidden sm:block h-px flex-1 max-w-[110px] bg-[#4E2A1E]/22 ml-2"
                />
              </motion.div>

              {/* 2. Titre monumental (76px–100px desktop) */}
              <h1 className="font-serif text-[#4E2A1E] tracking-tight">
                <span className="block overflow-hidden">
                  <motion.span
                    initial={{ y: '104%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 0.72, delay: 0.14, ease: EDITORIAL_EASE }}
                    className="block text-[2.85rem] sm:text-[4.2rem] lg:text-[4.75rem] xl:text-[5.5rem] 2xl:text-[6rem] font-semibold leading-[0.96]"
                  >
                    Et si on lisait
                  </motion.span>
                </span>
                <span className="block overflow-hidden">
                  <motion.span
                    initial={{ y: '104%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 0.72, delay: 0.24, ease: EDITORIAL_EASE }}
                    className="block text-[2.85rem] sm:text-[4.2rem] lg:text-[4.75rem] xl:text-[5.5rem] 2xl:text-[6rem] italic font-normal text-[#4E2A1E] leading-[1.03] pr-2"
                  >
                    à haute voix ?
                  </motion.span>
                </span>
              </h1>

              {/* 3. Description (max 570px) */}
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.54, delay: 0.3, ease: EDITORIAL_EASE }}
                className="text-base sm:text-lg text-[#4E2A1E]/90 max-w-[570px] leading-relaxed font-normal"
              >
                Organisé gratuitement par la Session Théâtre de l&apos;UCAEP pour{' '}
                <strong className="text-[#4E2A1E] font-semibold">
                  tous les étudiants de l&apos;ENSET de Lokossa
                </strong>
                , ce concours vous accompagne pas à pas : rédiger un texte personnel, vulgariser une notion scientifique en vidéo, puis prendre la parole devant un auditoire.
              </motion.p>

              {/* 4. Trois informations clés avec séparateurs verticaux fins */}
              <motion.dl
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.52, delay: 0.36, ease: EDITORIAL_EASE }}
                className="grid grid-cols-3 gap-3 sm:gap-6 max-w-[560px] pt-1 pb-2 text-xs"
              >
                <div>
                  <dt className="uppercase tracking-[0.18em] text-[#8C5A0D] text-[10px] sm:text-[11px] font-semibold">
                    Accès
                  </dt>
                  <dd className="font-serif text-[15px] sm:text-xl text-[#4E2A1E] font-semibold mt-1">
                    ENSET · Gratuit
                  </dd>
                </div>
                <div className="border-l border-[#4E2A1E]/18 pl-3 sm:pl-6">
                  <dt className="uppercase tracking-[0.18em] text-[#8C5A0D] text-[10px] sm:text-[11px] font-semibold">
                    Parcours
                  </dt>
                  <dd className="font-serif text-[15px] sm:text-xl text-[#4E2A1E] font-semibold mt-1 tabular-nums">
                    2 en ligne · 1 campus
                  </dd>
                </div>
                <div className="border-l border-[#4E2A1E]/18 pl-3 sm:pl-6">
                  <dt className="uppercase tracking-[0.18em] text-[#8C5A0D] text-[10px] sm:text-[11px] font-semibold">
                    Clôture
                  </dt>
                  <dd className="font-serif text-[15px] sm:text-xl text-[#4E2A1E] font-semibold mt-1 tabular-nums">
                    20 nov. 2026
                  </dd>
                </div>
              </motion.dl>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.65, delay: 0.38, ease: EDITORIAL_EASE }}
                className="origin-left h-px max-w-[560px] bg-[#4E2A1E]/14"
              />

              {/* 5. CTA existants et ordre conservé */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.44, ease: EDITORIAL_EASE }}
                className="pt-1 flex flex-wrap items-center gap-4 sm:gap-5"
              >
                {candidateSession ? (
                  <Link
                    to="/depot"
                    className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold rounded-[4px] bg-[#D19A3A] text-[#2B160E] hover:bg-[#c58d2e] whitespace-nowrap shrink-0"
                  >
                    <span>Accéder à mon espace ({candidateSession.referenceCode})</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link
                    to="/inscription"
                    className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold rounded-[4px] bg-[#D19A3A] text-[#2B160E] hover:bg-[#c58d2e] whitespace-nowrap shrink-0"
                  >
                    <span>Commencer mon inscription</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                )}

                {!candidateSession && hasOpenSubmissions && (
                  <Link
                    to="/depot"
                    className="btn-tactile inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-[4px] border border-[#D19A3A] bg-transparent text-[#4E2A1E] hover:bg-[#D19A3A]/12 whitespace-nowrap shrink-0"
                  >
                    <span>Déposer une production</span>
                  </Link>
                )}

                <Link
                  to="/parcours"
                  className="editorial-underline py-2 text-sm font-semibold text-[#4E2A1E] hover:text-[#8C5A0D] transition-colors whitespace-nowrap shrink-0"
                >
                  Découvrir les 3 phases et les épreuves
                </Link>
              </motion.div>
            </div>

            {/* COLONNE DROITE — Photographie principale encadrée (style cartouche brun + double filet doré) */}
            <div className="relative z-10 flex justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, clipPath: 'inset(10% 0% 0% 0%)' }}
                animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
                transition={{ duration: 0.85, delay: 0.06, ease: EDITORIAL_EASE }}
                className="relative w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[450px] xl:max-w-[480px] p-2"
              >
                {/* Double filet fin brun & or entourant la silhouette échancrée */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 400 540"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 w-full h-full"
                >
                  <path
                    d="M 24 2 L 376 2 A 22 22 0 0 0 398 24 L 398 516 A 22 22 0 0 0 376 538 L 24 538 A 22 22 0 0 0 2 516 L 2 24 A 22 22 0 0 0 24 2 Z"
                    fill="none"
                    stroke="#4E2A1E"
                    strokeOpacity="0.45"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 27 6 L 373 6 A 18 18 0 0 0 394 27 L 394 513 A 18 18 0 0 0 373 534 L 27 534 A 18 18 0 0 0 6 513 L 6 27 A 18 18 0 0 0 27 6 Z"
                    fill="none"
                    stroke="#D19A3A"
                    strokeOpacity="0.7"
                    strokeWidth="0.9"
                  />
                </svg>

                <figure
                  style={{ clipPath: 'url(#hero-cartouche-clip)' }}
                  className="relative bg-[#4E2A1E] p-3 sm:p-4 shadow-[0_28px_64px_-22px_rgba(78,42,30,0.4)]"
                >
                  <div className="relative aspect-[3/4] max-h-[490px] w-full overflow-hidden bg-[#2E160E]">
                    <motion.div
                      style={{ y: portraitY, scale: portraitScale }}
                      initial={{ scale: 1.07 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.95, ease: EDITORIAL_EASE }}
                      className="w-full h-full"
                    >
                      <EditorialImage
                        assetKey="portrait"
                        priority
                        className="object-cover object-top"
                      />
                    </motion.div>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2E160E]/40 via-transparent to-transparent"
                    />
                  </div>
                  <motion.figcaption
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.42, ease: EDITORIAL_EASE }}
                    className="pt-3.5 pb-1 px-1.5 flex items-center justify-between text-xs text-[#F7E6C8]"
                  >
                    <span className="font-serif italic text-sm text-[#F7E6C8]">
                      Créer · Transmettre · Rayonner
                    </span>
                    <span className="font-mono uppercase tracking-[0.2em] text-[10px] text-[#D19A3A] tabular-nums">
                      Édition 2026
                    </span>
                  </motion.figcaption>
                </figure>
              </motion.div>
            </div>
          </div>
        </div>

        {/* TRANSITION ORGANIQUE INFÉRIEURE BRUN PROFOND (#4E2A1E) */}
        <div className="relative z-[12] mt-10 lg:mt-12 w-full">
          {/* Onde organique sculptée reliant la zone ivoire au socle brun */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 84"
            preserveAspectRatio="none"
            className="block w-full h-11 sm:h-14 lg:h-[72px] -mb-px pointer-events-none select-none"
          >
            {/* Ruban doré / terre cuite discret le long de la crête gauche */}
            <path
              d="M0,14 C240,54 520,58 840,46 C1120,35 1295,12 1440,26 L1440,84 L0,84 Z"
              fill="#9C5B25"
              fillOpacity="0.72"
            />
            {/* Onde principale brun profond #4E2A1E */}
            <path
              d="M0,28 C255,66 530,54 845,48 C1130,42 1300,18 1440,34 L1440,84 L0,84 Z"
              fill="#4E2A1E"
            />
            <path
              d="M0,28 C255,66 530,54 845,48 C1130,42 1300,18 1440,34"
              fill="none"
              stroke="#D19A3A"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
          </svg>

          {/* Socle brun profond intégrant le suivi des phases & date de clôture */}
          <div className="relative bg-[#4E2A1E] text-[#F7E6C8] overflow-hidden">
            <BrandPatternSurface
              variant="gold"
              tileWidth={190}
              opacityClass="opacity-[0.06]"
            />
            <div className="relative z-10 max-w-[1520px] mx-auto w-full px-5 sm:px-8 lg:px-14 xl:px-20 pt-2 pb-10 sm:pb-12">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.48, ease: EDITORIAL_EASE }}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-[#F7E6C8]/90 tabular-nums pr-24 sm:pr-44 lg:pr-64 xl:pr-72"
              >
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span>
                    <strong className="font-mono text-[#D19A3A] mr-1.5">01</strong>La Plume (en ligne)
                  </span>
                  <span>
                    <strong className="font-mono text-[#D19A3A] mr-1.5">02</strong>La Connaissance (en ligne)
                  </span>
                  <span>
                    <strong className="font-mono text-[#D19A3A] mr-1.5">03</strong>L&apos;Éloquence (en présentiel)
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 text-[#F7E6C8]/90">
                  <Calendar className="w-3.5 h-3.5 text-[#D19A3A] shrink-0" aria-hidden="true" />
                  <span>Clôture des inscriptions · Vendredi 20 novembre 2026</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Plan 3 : ASSET SIGNATURE — LA PLUME (chevauche la transition ivoire/brun, disparaît derrière Section 2A z-30) */}
        <div
          aria-hidden="true"
          data-scenic-asset="plume"
          data-scenic-plan="3"
          className="pointer-events-none select-none absolute z-[25] right-4 sm:right-10 lg:right-14 bottom-2 sm:bottom-3 lg:bottom-4 w-36 sm:w-52 lg:w-[270px] xl:w-[300px] aspect-[3/2]"
        >
          <motion.img
            src={SCENIC_ASSETS.plume.src}
            alt=""
            loading="eager"
            decoding="async"
            style={{ x: plumeX, y: plumeY, rotate: plumeRotate }}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.72, delay: 0.25, ease: EDITORIAL_EASE }}
            className="scenic-object w-full h-full object-contain"
          />
        </div>
      </section>

      {/* ================================================================
          SECTION 2A · REPÈRES ESSENTIELS (Plan 4 opaque z-30 — masque la Plume)
          ================================================================ */}
      <section className="relative z-30 pt-20 pb-14 lg:pt-28 lg:pb-20 bg-ucaep-paper paper-fiber overflow-hidden">
        <BrandPatternSurface
          variant="gold"
          tileWidth={230}
          opacityClass="opacity-[0.045]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="brown"
          tileWidth={140}
          blendMultiply
          doubleRing
          orbit
          className="hidden lg:block -top-24 -left-24 w-64 h-64 opacity-[0.08]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-16">
          {candidateSession && (
            <EditorialReveal>
              <div className="p-5 sm:p-6 bg-white border border-ucaep-brown/18 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                    Mon dossier candidat · Code actif
                  </p>
                  <p className="font-serif text-xl sm:text-2xl font-semibold text-ucaep-brown tabular-nums">
                    {candidateSession.candidateName} ·{' '}
                    <span className="font-mono text-ucaep-gold">{candidateSession.referenceCode}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/parcours#atelier-video"
                    className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-[2px] border border-ucaep-brown/25 text-ucaep-brown hover:border-ucaep-gold transition-colors whitespace-nowrap"
                  >
                    Calculateur 5 min
                  </Link>
                  <Link
                    to="/depot"
                    className="btn-tactile group inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-[2px] bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] whitespace-nowrap"
                  >
                    <span>Suivre mon dossier</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </EditorialReveal>
          )}

          <div className="space-y-6">
            <EditorialReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                  Comment ça fonctionne
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown mt-1">
                  <EditorialTitleReveal>
                    L&apos;essentiel <em className="italic font-normal text-ucaep-ink">avant de commencer</em>
                  </EditorialTitleReveal>
                </h2>
              </div>
              <Link
                to="/concours"
                className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
              >
                <span className="editorial-underline">Lire l&apos;explication complète du concours</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </EditorialReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {MANIFESTO_CARDS.map((card, idx) => {
                const Icon = card.Icon;
                return (
                  <ParallaxDepthCard
                    key={card.index}
                    offset={idx % 2 === 0 ? -6 : 6}
                    delay={idx * 0.06}
                  >
                    <article className="art-card group relative h-full overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-white/95 paper-grain p-6 space-y-3">
                      <Icon
                        aria-hidden="true"
                        className="pointer-events-none select-none absolute -bottom-5 -right-4 w-28 h-28 text-ucaep-brown opacity-[0.055] -rotate-12 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6"
                        strokeWidth={1.3}
                      />
                      <div className="relative z-10 flex items-baseline justify-between border-b border-ucaep-brown/10 pb-2.5">
                        <span className="font-mono text-xs font-semibold text-ucaep-gold tabular-nums">
                          {card.index}
                        </span>
                        <span className="font-serif text-lg font-semibold text-ucaep-green tabular-nums">
                          {card.keyFigure}
                        </span>
                      </div>
                      <h3 className="relative z-10 font-serif text-xl font-semibold text-ucaep-brown leading-snug">
                        {card.title}
                      </h3>
                      <p className="relative z-10 text-sm text-ucaep-ink/75 leading-relaxed">
                        {card.detail}
                      </p>
                    </article>
                  </ParallaxDepthCard>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ================================================================
          SECTION 2B · PRÉSENTATION EXPLICATIVE (Plan 4 opaque)
          ================================================================ */}
      <section className="relative z-25 pt-12 pb-20 lg:pt-20 lg:pb-28 bg-ucaep-paper paper-fiber border-b border-ucaep-brown/12 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <EditorialHairline className="h-px bg-ucaep-brown/12 mb-14 lg:mb-16" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <EditorialReveal className="lg:col-span-6 space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                Pourquoi lire à voix haute à l&apos;ENSET ?
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-brown leading-[1.02]">
                <EditorialTitleReveal>
                  Passer de la réflexion écrite{' '}
                  <em className="italic font-normal text-ucaep-ink">
                    à une parole claire devant les autres.
                  </em>
                </EditorialTitleReveal>
              </h2>
              <div className="space-y-4 text-base sm:text-lg text-ucaep-ink/82 max-w-prose leading-relaxed">
                <p>
                  En tant qu&apos;étudiant en génie, en informatique ou en sciences de l&apos;éducation, vous passez l&apos;essentiel de votre temps sur des formules, des schémas ou des travaux pratiques. Mais le jour d&apos;une soutenance ou devant une future classe, tout repose sur votre capacité à formuler une idée simplement et à vous faire comprendre.
                </p>
                <p>
                  Ce parcours vous invite donc à prendre un cahier, à mettre vos propres idées au propre, puis à les tester à haute voix face caméra — avant de retrouver le jury et le campus en finale.{' '}
                  <strong className="font-semibold text-ucaep-brown">
                    Vous n&apos;avez pas besoin d&apos;avoir déjà fait du théâtre : chaque étape vous guide.
                  </strong>
                </p>
              </div>
              <div className="pt-4 border-t border-ucaep-brown/14 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-ucaep-brown/80 tabular-nums">
                <Link to="/concours" className="editorial-underline font-semibold text-ucaep-brown hover:text-ucaep-green">
                  Lire les objectifs et le règlement
                </Link>
                <span aria-hidden="true">·</span>
                <Link to="/faq" className="editorial-underline font-semibold text-ucaep-brown hover:text-ucaep-green">
                  Consulter les questions fréquentes
                </Link>
              </div>
            </EditorialReveal>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-8 items-center">
              <div className="sm:col-span-8">
                <PhotographicPlate
                  parallaxAmount={12}
                  className="aspect-[4/3] rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/12"
                >
                  <EditorialImage assetKey="writing" />
                </PhotographicPlate>
                <p className="mt-3 text-xs font-serif italic text-ucaep-brown/75">
                  Fig. 01 — Rédaction au stylo avant la lecture à haute voix et l&apos;enregistrement
                </p>
              </div>
              <EditorialReveal
                delay={0.1}
                className="sm:col-span-4 relative flex items-center justify-start sm:justify-center"
              >
                <BrandPatternArch
                  variant="brown"
                  tileWidth={130}
                  blendMultiply
                  className="hidden sm:block w-40 h-52 opacity-[0.09]"
                />
                <BrandPatternCircle
                  variant="gold"
                  tileWidth={120}
                  blendMultiply
                  doubleRing
                  orbit
                  className="hidden sm:block w-40 h-40 opacity-[0.14]"
                />
                <img
                  src="/assets/aistudio/LOGO_CONCOURS_8664fa5e.png"
                  alt="Logo officiel du concours Et si on lisait à haute voix ? 2026"
                  className="relative z-10 w-36 sm:w-full max-w-[155px] h-auto object-contain transition-transform duration-300 hover:scale-105"
                />
              </EditorialReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 3 · TROIS ÉTAPES + ZOOM PHASE 1 + MONSTERA À LA TRANSITION BASSE
          ================================================================ */}
      <section className="relative z-20 py-24 lg:py-32 bg-[#F4EDE1] paper-grain border-b border-ucaep-brown/12">
        {/* Plan 1 : Motifs contenus */}
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <BrandPatternBand
            variant="brown"
            tileWidth={145}
            blendMultiply
            className="h-2.5 opacity-45 border-b border-ucaep-brown/12 absolute top-0 inset-x-0"
          />
          <BrandPatternWave
            variant="brown"
            tileWidth={170}
            opacity={0.09}
            flip
            doubleWave
            className="absolute top-2 inset-x-0 h-20"
          />
          <BrandPatternCircle
            variant="gold"
            tileWidth={140}
            blendMultiply
            doubleRing
            orbit
            className="hidden lg:block -bottom-24 -right-20 w-72 h-72 opacity-[0.09]"
          />
        </div>

        {/* Plan 2 : Contenu éditorial des 3 phases + barème */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-20">
          <div>
            <EditorialReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-brown/75">
                  Progression étape par étape
                </p>
                <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-ink leading-none">
                  <EditorialTitleReveal>
                    Trois phases, <em className="italic font-normal text-ucaep-brown">six épreuves</em>
                  </EditorialTitleReveal>
                </h2>
              </div>
              <Link
                to="/parcours"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
              >
                <span className="editorial-underline">Voir le détail des 3 phases et l&apos;atelier vidéo</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </EditorialReveal>

            <ThreePhaseNarrativeArc activeStepIndex={0} className="mb-12" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
              {phases.map((phase, idx) => {
                const showRevealed = Boolean(phase.isRevealed);
                return (
                  <ParallaxDepthCard
                    key={phase.id}
                    offset={idx === 1 ? -8 : 8}
                    delay={idx * 0.08}
                  >
                    <Link to="/parcours" className="group block space-y-5">
                      <PhotographicPlate
                        parallaxAmount={10}
                        delay={idx * 0.06}
                        className="aspect-[4/3] rounded-[2px] bg-ucaep-brown/8 border border-ucaep-brown/12"
                      >
                        <EditorialImage
                          assetKey={phase.imageKey}
                          className="group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                        />
                      </PhotographicPlate>

                      <div className="space-y-3 pt-1">
                        <div className="flex items-baseline justify-between border-b border-ucaep-brown/18 pb-3 group-hover:border-ucaep-gold transition-colors duration-200">
                          <span className="font-serif text-4xl font-semibold text-ucaep-gold tabular-nums leading-none">
                            {phase.number}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-ucaep-brown/75 tabular-nums">
                            <span>{phase.format}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-ucaep-green">
                              {phase.isRevealed ? 'Consignes visibles' : phase.statusLabel}
                            </span>
                            {!showRevealed && (
                              <Lock
                                className="w-3.5 h-3.5 text-ucaep-brown/50"
                                aria-label="Consignes dévoilées plus tard"
                              />
                            )}
                          </div>
                        </div>
                        <h3 className="font-serif text-3xl font-semibold text-ucaep-ink group-hover:text-ucaep-brown transition-colors">
                          {phase.title}
                        </h3>
                        <p className="text-sm sm:text-base text-ucaep-ink/75 leading-relaxed">
                          {phase.shortDescription}
                        </p>
                      </div>
                    </Link>
                  </ParallaxDepthCard>
                );
              })}
            </div>
          </div>

          <EditorialReveal className="pt-12 border-t border-ucaep-brown/15 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                  Phase 01 · En ligne · Votre point de départ
                </p>
                <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown leading-tight">
                  Ce que vous préparez en <em className="italic font-normal text-ucaep-ink">Phase 1 (La Plume)</em>
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-medium text-ucaep-brown/80 tabular-nums">
                Deux créations écrites + deux lectures filmées (jusqu&apos;à 5 min)
              </p>
            </div>

            {(() => {
              const phase1 = phases.find((p) => p.id === 'phase-1' || p.number === '01');
              const phase1Revealed = Boolean(phase1?.isRevealed);
              return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {phase1Revealed ? (
                  <>
                    <ParallaxDepthCard offset={6} delay={0.04}>
                      <article className="art-card group relative h-full overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-paper p-7 space-y-4">
                        <Feather
                          aria-hidden="true"
                          className="pointer-events-none select-none absolute -bottom-6 -right-5 w-36 h-36 text-ucaep-brown opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-105"
                          strokeWidth={1.25}
                        />
                        <div className="relative z-10 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold tabular-nums">
                          <span>Épreuve 01</span>
                          <span className="text-ucaep-green">Autoportrait littéraire</span>
                        </div>
                        <h4 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown leading-tight">
                          « Je suis… »
                        </h4>
                        <p className="relative z-10 text-sm text-ucaep-ink/82 leading-relaxed">
                          Vous rédigez un texte personnel pour raconter qui vous êtes{' '}
                          <strong className="font-semibold text-ucaep-brown">
                            au-delà de votre nom, de votre filière ou de votre CV
                          </strong>
                          , puis vous vous filmez en train de le lire. Par exemple : un souvenir qui vous a construit, une contradiction ou une ambition qui oriente vos choix.
                        </p>
                        <p className="relative z-10 text-xs font-medium text-ucaep-brown/75 pt-3 border-t border-ucaep-brown/12">
                          Forme libre (récit, poème, lettre ou monologue) · Vidéo jusqu&apos;à 5 min.
                        </p>
                      </article>
                    </ParallaxDepthCard>

                    <ParallaxDepthCard offset={-6} delay={0.1}>
                      <article className="art-card group relative h-full overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-paper p-7 space-y-4">
                        <ScrollText
                          aria-hidden="true"
                          className="pointer-events-none select-none absolute -bottom-6 -right-5 w-36 h-36 text-ucaep-brown opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-105"
                          strokeWidth={1.25}
                        />
                        <div className="relative z-10 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold tabular-nums">
                          <span>Épreuve 02</span>
                          <span className="text-ucaep-green">Parole intérieure</span>
                        </div>
                        <h4 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown leading-tight">
                          « Les mots que l&apos;on n&apos;ose pas dire »
                        </h4>
                        <p className="relative z-10 text-sm text-ucaep-ink/82 leading-relaxed">
                          Vous écrivez un texte pour formuler{' '}
                          <strong className="font-semibold text-ucaep-brown">
                            un remerciement, un aveu, un constat ou une idée longtemps gardée pour vous
                          </strong>
                          , puis vous l&apos;interprétez en vidéo. Cherchez la justesse et la sincérité plutôt qu&apos;un ton artificiellement dramatique.
                        </p>
                        <p className="relative z-10 text-xs font-medium text-ucaep-brown/75 pt-3 border-t border-ucaep-brown/12">
                          En français (quelques mots en langues nationales possibles) · Jusqu&apos;à 5 min.
                        </p>
                      </article>
                    </ParallaxDepthCard>
                  </>
                ) : (
                  <>
                    <ParallaxDepthCard offset={6} delay={0.04}>
                      <article className="art-card group relative h-full overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-paper p-7 space-y-4">
                        <Lock
                          aria-hidden="true"
                          className="pointer-events-none select-none absolute -bottom-6 -right-5 w-36 h-36 text-ucaep-brown opacity-[0.06] -rotate-12"
                          strokeWidth={1.25}
                        />
                        <div className="relative z-10 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold tabular-nums">
                          <span>Épreuve 01</span>
                          <span className="text-ucaep-brown/75 inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" aria-hidden="true" /> Masquée
                          </span>
                        </div>
                        <h4 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown leading-tight">
                          Sujet dévoilé au lancement
                        </h4>
                        <p className="relative z-10 text-sm text-ucaep-ink/82 leading-relaxed">
                          La première épreuve consiste à rédiger un texte personnel en français puis à l&apos;interpréter en vidéo. L&apos;intitulé exact et les consignes seront affichés ici dès l&apos;ouverture de La Plume.
                        </p>
                        <p className="relative z-10 text-xs font-medium text-ucaep-brown/75 pt-3 border-t border-ucaep-brown/12">
                          En ligne · Jusqu&apos;à 5 minutes · Double lecture anonyme.
                        </p>
                      </article>
                    </ParallaxDepthCard>

                    <ParallaxDepthCard offset={-6} delay={0.1}>
                      <article className="art-card group relative h-full overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-paper p-7 space-y-4">
                        <Lock
                          aria-hidden="true"
                          className="pointer-events-none select-none absolute -bottom-6 -right-5 w-36 h-36 text-ucaep-brown opacity-[0.06] -rotate-12"
                          strokeWidth={1.25}
                        />
                        <div className="relative z-10 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold tabular-nums">
                          <span>Épreuve 02</span>
                          <span className="text-ucaep-brown/75 inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" aria-hidden="true" /> Masquée
                          </span>
                        </div>
                        <h4 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown leading-tight">
                          Sujet dévoilé au lancement
                        </h4>
                        <p className="relative z-10 text-sm text-ucaep-ink/82 leading-relaxed">
                          La seconde épreuve vous invite également à écrire une création personnelle et à la lire face caméra. Ses consignes resteront masquées jusqu&apos;à l&apos;activation de la phase.
                        </p>
                        <p className="relative z-10 text-xs font-medium text-ucaep-brown/75 pt-3 border-t border-ucaep-brown/12">
                          Français (touches de langues nationales possibles) · Jusqu&apos;à 5 minutes.
                        </p>
                      </article>
                    </ParallaxDepthCard>
                  </>
                )}
              </div>

              <InteractiveRubric phaseId="phase-1" compact />

              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 rounded-[2px] bg-ucaep-green text-ucaep-paper border border-ucaep-brown/16">
                <p className="text-xs sm:text-sm text-ucaep-ivory/90">
                  Vous voulez vérifier si votre brouillon tient sous la limite des 5 minutes avant de filmer ?
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    to="/parcours#atelier-video"
                    className="btn-tactile inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c]"
                  >
                    <span>Tester mon temps de lecture</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/parcours"
                    className="group/link inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ucaep-gold hover:text-ucaep-paper transition-colors"
                  >
                    <span>Explorer tout le parcours</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
              );
            })()}
          </EditorialReveal>
        </div>
      </section>

      {/* ================================================================
          SECTION 4 · ANNONCES (Section calme pour laisser respirer la Monstera & préparer la Lanterne)
          ================================================================ */}
      <section className="relative z-25 py-24 lg:py-32 bg-ucaep-paper paper-grain overflow-hidden">
        <BrandPatternSurface
          variant="gold"
          tileWidth={220}
          opacityClass="opacity-[0.04]"
          blendMultiply
        />
        <Megaphone
          aria-hidden="true"
          className="pointer-events-none select-none hidden md:block absolute bottom-6 left-8 w-52 h-52 text-ucaep-brown opacity-[0.04] -rotate-12"
          strokeWidth={1.1}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <EditorialReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                Informations officielles
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-ink leading-none">
                <EditorialTitleReveal>
                  Annonces et <em className="italic font-normal text-ucaep-brown">calendrier</em>
                </EditorialTitleReveal>
              </h2>
            </div>
            <Link
              to="/annonces"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
            >
              <span className="editorial-underline">Toutes les annonces</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </EditorialReveal>

          {!loaded ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-52 rounded-[2px] bg-ucaep-ivory/30 animate-pulse border border-ucaep-brown/10"
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-10 border border-ucaep-brown/14 rounded-[2px] bg-[#F4EDE1]/60 text-sm text-ucaep-ink/75">
              Aucune annonce n&apos;est encore publiée. Les avis officiels relatifs au calendrier et aux résultats paraîtront dans cette rubrique.
            </div>
          ) : (
            <div className="divide-y divide-ucaep-brown/14 border-t border-b border-ucaep-brown/14">
              {announcements.map((item, idx) => (
                <EditorialReveal key={item.id} delay={idx * 0.06}>
                  <article className="group py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    <div className="lg:col-span-2 flex lg:flex-col items-baseline gap-3 lg:gap-1.5">
                      <span className="font-serif text-4xl lg:text-5xl font-medium text-ucaep-gold tabular-nums leading-none">
                        0{idx + 1}
                      </span>
                      <time
                        dateTime={item.publishedAt}
                        className="text-xs text-ucaep-brown/65 tabular-nums"
                      >
                        {formatFrenchDate(item.publishedAt)}
                      </time>
                    </div>

                    <div className="lg:col-span-6 space-y-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-green">
                        {item.category}
                      </div>
                      <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-ink leading-tight">
                        <Link
                          to={`/annonces/${item.slug}`}
                          className="hover:text-ucaep-brown transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h3>
                      <p className="text-sm sm:text-base text-ucaep-ink/75 leading-relaxed max-w-xl">
                        {item.excerpt}
                      </p>
                      <div className="pt-1">
                        <Link
                          to={`/annonces/${item.slug}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors"
                        >
                          <span className="editorial-underline">Lire l&apos;annonce</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>

                    <div className="lg:col-span-4">
                      <Link to={`/annonces/${item.slug}`} className="block">
                        <PhotographicPlate
                          parallaxAmount={8}
                          delay={idx * 0.06}
                          className="aspect-[16/10] rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10"
                        >
                          <EditorialImage
                            assetKey={item.imageKey}
                            className="group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                          />
                        </PhotographicPlate>
                      </Link>
                    </div>
                  </article>
                </EditorialReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================================================================
          SECTION 5 · ANIMATION SIGNATURE 02 — LA LANTERNE & TRANSFORMATION CHROMATIQUE
          ================================================================ */}
      <LanterneSequence />

      {/* ================================================================
          SECTION 6 · CTA FINALE BRUN TERRE + ASSET 05 : HIBISCUS ROUGE
          ================================================================ */}
      <section
        data-scenic-stage="final-cta"
        className="relative z-30 pt-24 pb-32 sm:pb-36 lg:pt-28 lg:pb-48 bg-[radial-gradient(ellipse_at_top_right,#633728_0%,#4E2A1E_55%,#3B1E14_100%)] text-ucaep-ivory overflow-hidden"
      >
        <BrandPatternEdge
          variant="gold"
          side="left"
          className="w-3 sm:w-4 lg:w-6 opacity-85"
        />
        <BrandPatternSurface
          variant="gold"
          tileWidth={210}
          opacityClass="opacity-[0.06]"
        />
        <BrandPatternCircle
          variant="gold"
          tileWidth={130}
          doubleRing
          orbit
          className="hidden md:block -top-16 right-16 w-48 h-48 opacity-22"
        />
        <BrandPatternWave
          variant="gold"
          tileWidth={170}
          opacity={0.14}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-16"
        />
        <EditorialReveal className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="space-y-4 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-gold">
              Prêt à essayer l&apos;édition 2026 ?
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ucaep-paper leading-[1.08]">
              <EditorialTitleReveal>
                Inscrivez-vous en deux minutes{' '}
                <em className="italic font-normal text-ucaep-ivory">
                  pour recevoir votre code d&apos;anonymat et préparer vos premiers textes.
                </em>
              </EditorialTitleReveal>
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ivory/85 max-w-xl leading-relaxed">
              Les inscriptions gratuites ferment le vendredi 20 novembre 2026. Une fois votre dossier validé, vous accédez directement au canal d&apos;information et à votre espace de dépôt en ligne.
            </p>
          </div>
          {candidateSession ? (
            <Link
              to="/depot"
              className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-[#161210] hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
            >
              <span>Accéder à mon espace dépôt</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link
              to="/inscription"
              className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-[#161210] hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
            >
              <span>Commencer mon inscription</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </EditorialReveal>

        {/* ASSET 05 — HIBISCUS ROUGE : Bord inférieur droit, taille moyenne, zéro recouvrement du CTA */}
        <ScenicStageAsset
          assetKey="hibiscus"
          plan={2}
          motionId="hibiscus"
          className="absolute bottom-5 sm:bottom-8 right-4 sm:right-8 lg:right-12 w-28 sm:w-36 lg:w-44 opacity-95"
        />
      </section>

      {/* ================================================================
          SECTION 7 · ACTUALITÉS (Section calme & éditoriale)
          ================================================================ */}
      <section className="relative z-30 py-24 lg:py-32 bg-ucaep-paper paper-fiber overflow-hidden">
        <BrandPatternSurface
          variant="brown"
          tileWidth={210}
          opacityClass="opacity-[0.035]"
          blendMultiply
        />
        <BrandPatternWave
          variant="brown"
          tileWidth={175}
          opacity={0.075}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-20"
        />
        <Newspaper
          aria-hidden="true"
          className="pointer-events-none select-none hidden md:block absolute top-10 right-10 w-44 h-44 text-ucaep-brown opacity-[0.038] rotate-6"
          strokeWidth={1.1}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <EditorialReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-brown/75">
                Journal du concours
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-ink leading-none">
                <EditorialTitleReveal>
                  Actualités et <em className="italic font-normal text-ucaep-brown">repères</em>
                </EditorialTitleReveal>
              </h2>
            </div>
            <Link
              to="/actualites"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
            >
              <span className="editorial-underline">Consulter toutes les actualités</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </EditorialReveal>

          {leadNews && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              <EditorialReveal className="lg:col-span-7">
                <Link to={`/actualites/${leadNews.slug}`} className="group block space-y-5">
                  <PhotographicPlate
                    parallaxAmount={10}
                    className="aspect-[16/10] rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10"
                  >
                    <EditorialImage
                      assetKey={leadNews.imageKey}
                      className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    />
                  </PhotographicPlate>
                  <div className="space-y-3">
                    <div className="text-xs text-ucaep-brown/75 tabular-nums">
                      <span className="font-semibold text-ucaep-green">{leadNews.category}</span>
                      <span aria-hidden="true"> · </span>
                      <time dateTime={leadNews.publishedAt}>
                        {formatFrenchDate(leadNews.publishedAt)}
                      </time>
                      <span aria-hidden="true"> · </span>
                      <span>{leadNews.readTime}</span>
                    </div>
                    <h3 className="font-serif text-3xl sm:text-5xl font-semibold text-ucaep-ink group-hover:text-ucaep-brown transition-colors leading-[1.06]">
                      {leadNews.title}
                    </h3>
                    <p className="text-base text-ucaep-ink/75 leading-relaxed max-w-2xl">
                      {leadNews.excerpt}
                    </p>
                  </div>
                </Link>
              </EditorialReveal>

              <div className="lg:col-span-5 lg:border-l border-ucaep-brown/12 lg:pl-10 divide-y divide-ucaep-brown/12">
                {secondaryNews.map((article, idx) => (
                  <EditorialReveal
                    key={article.id}
                    delay={idx * 0.1}
                    className={idx === 0 ? 'pb-8' : 'pt-8'}
                  >
                    <Link to={`/actualites/${article.slug}`} className="group block">
                      <div className="grid grid-cols-12 gap-5 items-center">
                        <div className="col-span-5 aspect-[4/3] overflow-hidden rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10">
                          <EditorialImage
                            assetKey={article.imageKey}
                            className="group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                          />
                        </div>
                        <div className="col-span-7 space-y-2">
                          <div className="text-[11px] text-ucaep-brown/70 tabular-nums">
                            <span>{article.category}</span>
                            <span aria-hidden="true"> · </span>
                            <time dateTime={article.publishedAt}>
                              {formatFrenchDate(article.publishedAt)}
                            </time>
                          </div>
                          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ucaep-ink group-hover:text-ucaep-brown transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-ucaep-ink/70 line-clamp-2 leading-relaxed">
                            {article.excerpt}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </EditorialReveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
