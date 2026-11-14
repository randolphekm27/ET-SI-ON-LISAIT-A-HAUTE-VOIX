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
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BrandPatternArch,
  BrandPatternBand,
  BrandPatternCircle,
  BrandPatternEdge,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialImage } from '../components/EditorialImage';
import { LanterneSequence } from '../components/LanterneSequence';
import { ScenicStageAsset } from '../components/ScenicStageAsset';
import { fetchApiJson } from '../lib/api';
import { useCandidateSession } from '../lib/candidate-session';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { prefersReducedMotion, useEditorialScrollMotion } from '../lib/motion';
import { SCENIC_ASSETS } from '../lib/scenic-assets';
import type {
  CompetitionPhase,
  PublicAnnouncement,
  PublicNewsArticle,
} from '../types/competition';

gsap.registerPlugin(ScrollTrigger);

const MANIFESTO_CARDS = [
  {
    index: '01',
    keyFigure: 'ENSET · Gratuit',
    title: 'Réservé aux étudiants de l’ENSET de Lokossa',
    detail:
      'La participation est entièrement gratuite et ouverte à tous les étudiants de l’ENSET de Lokossa, sans condition de filière.',
    Icon: Users,
  },
  {
    index: '02',
    keyFigure: '2 en ligne · 1 scène',
    title: 'Deux phases en ligne, une finale en présentiel',
    detail:
      'La Plume et La Connaissance se préparent à distance avec des prestations vidéo ; L’Éloquence se déroule en présentiel devant le jury.',
    Icon: Clock,
  },
  {
    index: '03',
    keyFigure: '6 épreuves · / 20 pts',
    title: 'Trois phases progressives notées sur 20',
    detail:
      'Chaque phase évalue deux épreuves précises (jusqu’à 5 minutes par présentation) pour passer de l’écrit à la vulgarisation puis à l’oral.',
    Icon: Scale,
  },
  {
    index: '04',
    keyFigure: 'Double lecture',
    title: 'Anonymat et évaluation pluridisciplinaire',
    detail:
      'Les productions sont corrigées sous code candidat UCAEP par un jury composé d’enseignants de l’ENSET et de membres culturels.',
    Icon: ShieldCheck,
  },
];

export function HomePage() {
  usePageSeo(
    'Accueil',
    "Concours culturel gratuit organisé par la Session Théâtre de l'UCAEP pour tous les étudiants de l'ENSET de Lokossa : écriture originale, vulgarisation scientifique et éloquence en public.",
  );

  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const candidateSession = useCandidateSession();
  const [phases, setPhases] = useState<CompetitionPhase[]>([]);
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [news, setNews] = useState<PublicNewsArticle[]>([]);
  const [loaded, setLoaded] = useState(false);

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

  // Séquence d'ouverture du Hero + Animations ScrollTrigger (Plume, Monstera, Portrait)
  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-portrait-frame', {
        clipPath: 'inset(10% 0% 0% 0%)',
        opacity: 0,
        duration: 0.9,
        clearProps: 'clipPath,opacity',
      })
        .from(
          '.hero-portrait-img',
          {
            scale: 1.07,
            duration: 1.05,
            ease: 'power2.out',
            clearProps: 'transform',
          },
          '<',
        )
        .from(
          '.hero-line-inner',
          {
            yPercent: 108,
            duration: 0.76,
            stagger: 0.1,
            ease: 'power4.out',
            clearProps: 'transform',
          },
          '-=0.72',
        )
        .from(
          '.hero-rule-draw',
          {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 0.7,
            ease: 'power3.out',
            clearProps: 'transform',
          },
          '-=0.45',
        )
        .from(
          '.hero-meta-fade',
          {
            y: 14,
            opacity: 0,
            duration: 0.52,
            stagger: 0.07,
            clearProps: 'transform,opacity',
          },
          '-=0.5',
        );

      const mm = gsap.matchMedia();

      // ANIMATION SIGNATURE — PLUME AU SCROLL + MONSTERA + PARALLAX PORTRAIT
      mm.add('(min-width: 1024px)', () => {
        gsap.fromTo(
          '.hero-plume-img',
          { x: 0, y: 0, rotate: -4 },
          {
            x: 24,
            y: 165,
            rotate: -13,
            ease: 'none',
            scrollTrigger: {
              trigger: heroEl,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.65,
            },
          },
        );

        gsap.fromTo(
          '.hero-monstera',
          { x: 0, y: 0, rotate: 6, opacity: 1 },
          {
            x: -24,
            y: -32,
            rotate: 1,
            opacity: 0.15,
            ease: 'none',
            scrollTrigger: {
              trigger: heroEl,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.8,
            },
          },
        );

        gsap.fromTo(
          '.hero-portrait-parallax',
          { yPercent: 0, scale: 1 },
          {
            yPercent: -6,
            scale: 1.035,
            ease: 'none',
            scrollTrigger: {
              trigger: heroEl,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      });

      mm.add('(max-width: 1023px)', () => {
        gsap.fromTo(
          '.hero-plume-img',
          { x: 0, y: 0, rotate: -3 },
          {
            x: 8,
            y: 78,
            rotate: -9,
            ease: 'none',
            scrollTrigger: {
              trigger: heroEl,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.65,
            },
          },
        );

        gsap.fromTo(
          '.hero-monstera',
          { x: 0, y: 0, rotate: 5, opacity: 0.9 },
          {
            x: -10,
            y: -14,
            rotate: 1,
            opacity: 0.2,
            ease: 'none',
            scrollTrigger: {
              trigger: heroEl,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.8,
            },
          },
        );

        gsap.fromTo(
          '.hero-portrait-parallax',
          { yPercent: 0 },
          {
            yPercent: -2.5,
            ease: 'none',
            scrollTrigger: {
              trigger: heroEl,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      });
    }, heroEl);

    return () => ctx.revert();
  }, []);

  useEditorialScrollMotion(pageRef, [loaded, phases.length, announcements.length, news.length]);

  const hasOpenSubmissions = phases.some((p) => Boolean(p.submissionsOpen));
  const leadNews = news[0];
  const secondaryNews = news.slice(1, 3);

  return (
    <div ref={pageRef} className="bg-ucaep-paper">
      {/* ================================================================
          SECTION 1 · HERO IVOIRE ÉDITORIAL + MONSTERA + ONDE BRUNE + PLUME
          ================================================================ */}
      <section
        ref={heroRef}
        className="relative z-20 w-full min-h-[92vh] lg:min-h-screen bg-[radial-gradient(ellipse_at_72%_30%,#FCF5E6_0%,#F7E6C8_58%,#EDD6AF_100%)] text-[#4E2A1E] pt-[148px] sm:pt-[118px] lg:pt-[108px] flex flex-col justify-between paper-grain"
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
        <div
          aria-hidden="true"
          data-scenic-asset="monstera"
          data-scenic-plan="2"
          className="hero-monstera pointer-events-none select-none absolute z-[5] top-[70px] sm:top-[76px] left-3 sm:left-5 lg:left-6 w-24 sm:w-32 lg:w-40 xl:w-44 aspect-[1392/1130]"
        >
          <img
            src={SCENIC_ASSETS.monstera.src}
            alt=""
            loading="eager"
            decoding="async"
            className="scenic-object w-full h-full object-contain"
          />
        </div>

        {/* Plan 2 : Composition principale 54% gauche / 46% droite dans un conteneur 1380px */}
        <div className="relative z-20 max-w-[1380px] mx-auto w-full px-5 sm:px-8 lg:px-14 my-auto py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,54fr)_minmax(0,46fr)] gap-10 lg:gap-12 xl:gap-16 items-center">
            {/* COLONNE GAUCHE — Contenu éditorial (ordre strict & copywriting intact) */}
            <div className="lg:pl-8 xl:pl-12 space-y-6 sm:space-y-7">
              {/* 1. Contexte du concours */}
              <div className="hero-meta-fade flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8C5A0D]">
                <span>Session Théâtre · UCAEP</span>
                <span aria-hidden="true" className="h-3 w-px bg-[#4E2A1E]/25" />
                <span className="text-[#4E2A1E]/85">ENSET de Lokossa — UNSTIM</span>
                <span
                  aria-hidden="true"
                  className="hidden sm:block h-px flex-1 max-w-[110px] bg-[#4E2A1E]/22 ml-2"
                />
              </div>

              {/* 2. Titre monumental (76px–100px desktop) */}
              <h1 className="font-serif text-[#4E2A1E] tracking-tight">
                <span className="block overflow-hidden">
                  <span className="hero-line-inner block text-[2.85rem] sm:text-[4.2rem] lg:text-[4.75rem] xl:text-[5.5rem] 2xl:text-[6rem] font-semibold leading-[0.96]">
                    Et si on lisait
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span className="hero-line-inner block text-[2.85rem] sm:text-[4.2rem] lg:text-[4.75rem] xl:text-[5.5rem] 2xl:text-[6rem] italic font-normal text-[#4E2A1E] leading-[1.03] pr-2">
                    à haute voix ?
                  </span>
                </span>
              </h1>

              {/* 3. Description (max 570px) */}
              <p className="hero-meta-fade text-base sm:text-lg text-[#4E2A1E]/90 max-w-[570px] leading-relaxed font-normal">
                Un concours gratuit ouvert à{' '}
                <strong className="text-[#4E2A1E] font-semibold">
                  tous les étudiants de l&apos;ENSET de Lokossa
                </strong>{' '}
                pour développer l&apos;écriture personnelle, la vulgarisation des savoirs et la prise de parole en public — deux phases en ligne en vidéo et une finale en présentiel.
              </p>

              {/* 4. Trois informations clés avec séparateurs verticaux fins */}
              <dl className="hero-meta-fade grid grid-cols-3 gap-3 sm:gap-6 max-w-[560px] pt-1 pb-2 text-xs">
                <div>
                  <dt className="uppercase tracking-[0.18em] text-[#8C5A0D] text-[10px] sm:text-[11px] font-semibold">
                    Public &amp; tarif
                  </dt>
                  <dd className="font-serif text-[15px] sm:text-xl text-[#4E2A1E] font-semibold mt-1">
                    ENSET · Gratuit
                  </dd>
                </div>
                <div className="border-l border-[#4E2A1E]/18 pl-3 sm:pl-6">
                  <dt className="uppercase tracking-[0.18em] text-[#8C5A0D] text-[10px] sm:text-[11px] font-semibold">
                    Format
                  </dt>
                  <dd className="font-serif text-[15px] sm:text-xl text-[#4E2A1E] font-semibold mt-1 tabular-nums">
                    2 en ligne · 1 scène
                  </dd>
                </div>
                <div className="border-l border-[#4E2A1E]/18 pl-3 sm:pl-6">
                  <dt className="uppercase tracking-[0.18em] text-[#8C5A0D] text-[10px] sm:text-[11px] font-semibold">
                    Présentation
                  </dt>
                  <dd className="font-serif text-[15px] sm:text-xl text-[#4E2A1E] font-semibold mt-1 tabular-nums">
                    Jusqu&apos;à 5 min
                  </dd>
                </div>
              </dl>

              <div className="hero-rule-draw h-px max-w-[560px] bg-[#4E2A1E]/14" />

              {/* 5. CTA existants et ordre conservé */}
              <div className="hero-meta-fade pt-1 flex flex-wrap items-center gap-4 sm:gap-5">
                {candidateSession ? (
                  <Link
                    to="/depot"
                    className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold rounded-[4px] bg-[#D19A3A] text-[#2B160E] hover:bg-[#c58d2e] whitespace-nowrap shrink-0"
                  >
                    <span>Mon espace dépôt ({candidateSession.referenceCode})</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link
                    to="/inscription"
                    className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold rounded-[4px] bg-[#D19A3A] text-[#2B160E] hover:bg-[#c58d2e] whitespace-nowrap shrink-0"
                  >
                    <span>Je m&apos;inscris</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                )}

                {!candidateSession && hasOpenSubmissions && (
                  <Link
                    to="/depot"
                    className="btn-tactile inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-[4px] border border-[#D19A3A] bg-transparent text-[#4E2A1E] hover:bg-[#D19A3A]/12 whitespace-nowrap shrink-0"
                  >
                    <span>Déposer ma production</span>
                  </Link>
                )}

                <Link
                  to="/parcours"
                  className="editorial-underline py-2 text-sm font-semibold text-[#4E2A1E] hover:text-[#8C5A0D] transition-colors whitespace-nowrap shrink-0"
                >
                  Consulter les 3 phases et 6 épreuves
                </Link>
              </div>
            </div>

            {/* COLONNE DROITE — Photographie principale encadrée (style cartouche brun + double filet doré) */}
            <div className="relative z-10 flex justify-center lg:justify-end">
              <div className="hero-portrait-frame relative w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[450px] xl:max-w-[480px] p-2">
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
                    <EditorialImage
                      assetKey="portrait"
                      priority
                      className="hero-portrait-img hero-portrait-parallax object-cover object-top"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2E160E]/40 via-transparent to-transparent"
                    />
                  </div>
                  <figcaption className="hero-meta-fade pt-3.5 pb-1 px-1.5 flex items-center justify-between text-xs text-[#F7E6C8]">
                    <span className="font-serif italic text-sm text-[#F7E6C8]">
                      Créer · Transmettre · Rayonner
                    </span>
                    <span className="font-mono uppercase tracking-[0.2em] text-[10px] text-[#D19A3A] tabular-nums">
                      Édition 2026
                    </span>
                  </figcaption>
                </figure>
              </div>
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
            <div className="relative z-10 max-w-[1380px] mx-auto w-full px-5 sm:px-8 lg:px-14 pt-2 pb-10 sm:pb-12">
              <div className="hero-meta-fade flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-[#F7E6C8]/90 tabular-nums pr-24 sm:pr-44 lg:pr-64 xl:pr-72">
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
              </div>
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
          <img
            src={SCENIC_ASSETS.plume.src}
            alt=""
            loading="eager"
            decoding="async"
            className="hero-plume-img scenic-object w-full h-full object-contain -rotate-[4deg]"
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4" data-reveal>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                  Repères du concours
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown mt-1 overflow-hidden">
                  <span data-mask-title className="block">
                    Quatre repères <em className="italic font-normal text-ucaep-ink">pour comprendre l&apos;organisation</em>
                  </span>
                </h2>
              </div>
              <Link
                to="/concours"
                className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
              >
                <span className="editorial-underline">Consulter la présentation complète</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {MANIFESTO_CARDS.map((card, idx) => {
                const Icon = card.Icon;
                return (
                  <article
                    key={card.index}
                    data-reveal
                    data-reveal-delay={String(idx * 0.06)}
                    className="art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-white/95 paper-grain p-6 space-y-3"
                  >
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
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ================================================================
          SECTION 2B · PRÉSENTATION « TROIS ÉTAPES, DU CAHIER JUSQU'À LA SCÈNE »
          ================================================================ */}
      <section className="relative z-25 pt-12 pb-20 lg:pt-20 lg:pb-28 bg-ucaep-paper paper-fiber border-b border-ucaep-brown/12 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="h-px bg-ucaep-brown/12 mb-14 lg:mb-16" data-hairline-reveal />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6" data-reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                Présentation &amp; démarche pédagogique
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-brown leading-[1.02] overflow-hidden">
                <span data-mask-title className="block">
                  Trois phases pour développer{' '}
                  <em className="italic font-normal text-ucaep-ink">
                    ses capacités d&apos;écriture, de transmission des connaissances et de prise de parole.
                  </em>
                </span>
              </h2>
              <p className="text-base sm:text-lg text-ucaep-ink/80 max-w-xl leading-relaxed">
                Imaginé par la Session Théâtre de l&apos;UCAEP pour les étudiants de l&apos;ENSET de Lokossa, ce concours complète la formation technique et scientifique.{' '}
                <strong className="font-semibold text-ucaep-brown">
                  Aucune expérience scénique préalable n&apos;est exigée
                </strong>{' '}
                : les deux premières phases se déroulent en ligne (textes et prestations vidéo) avant une finale en présentiel devant le jury et le campus.
              </p>
              <div className="pt-4 border-t border-ucaep-brown/14 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-ucaep-brown/80 tabular-nums">
                <span>Gratuit · ENSET de Lokossa</span>
                <span aria-hidden="true">·</span>
                <span>Phases 1 &amp; 2 en ligne · Phase 3 en présentiel</span>
                <span aria-hidden="true">·</span>
                <span>Session Théâtre UCAEP</span>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-8 items-center">
              <div className="sm:col-span-8" data-clip-reveal>
                <div className="aspect-[4/3] overflow-hidden rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/12">
                  <EditorialImage assetKey="writing" data-parallax="-5" />
                </div>
                <p className="mt-3 text-xs font-serif italic text-ucaep-brown/75">
                  Fig. 01 — Rédaction des textes originaux avant l&apos;interprétation vidéo
                </p>
              </div>
              <div
                className="sm:col-span-4 relative flex items-center justify-start sm:justify-center"
                data-reveal
                data-reveal-delay="0.1"
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
              </div>
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14" data-reveal>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-brown/75">
                  Les trois phases du concours
                </p>
                <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-ink leading-none overflow-hidden">
                  <span data-mask-title className="block">
                    Trois phases, <em className="italic font-normal text-ucaep-brown">six épreuves</em>
                  </span>
                </h2>
              </div>
              <Link
                to="/parcours"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
              >
                <span className="editorial-underline">Consulter les 6 épreuves en détail</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
              {phases.map((phase, idx) => {
                const isPhaseOne = phase.id === 'phase-1' || phase.number === '01';
                const showRevealed = isPhaseOne || phase.isRevealed;
                return (
                  <Link
                    key={phase.id}
                    to="/parcours"
                    data-reveal
                    data-reveal-delay={String(idx * 0.08)}
                    className="group block space-y-5"
                  >
                    <div
                      data-clip-reveal
                      className="aspect-[4/3] overflow-hidden rounded-[2px] bg-ucaep-brown/8 border border-ucaep-brown/12"
                    >
                      <EditorialImage
                        assetKey={phase.imageKey}
                        className="group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                      />
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="flex items-baseline justify-between border-b border-ucaep-brown/18 pb-3 group-hover:border-ucaep-gold transition-colors duration-200">
                        <span className="font-serif text-4xl font-semibold text-ucaep-gold tabular-nums leading-none">
                          {phase.number}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-ucaep-brown/75 tabular-nums">
                          <span>{phase.format}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-ucaep-green">
                            {isPhaseOne ? 'Consignes visibles' : phase.statusLabel}
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
                );
              })}
            </div>
          </div>

          <div className="pt-12 border-t border-ucaep-brown/15 space-y-8" data-reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                  Phase 01 · En ligne · Textes originaux et vidéo
                </p>
                <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown leading-tight">
                  Zoom sur <em className="italic font-normal text-ucaep-ink">La Plume</em> : les deux premières épreuves
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-medium text-ucaep-brown/80 tabular-nums">
                Phase 1 en ligne · Production écrite + interprétation vidéo · Jusqu&apos;à 5 min
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <article className="lg:col-span-4 art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-paper p-7 space-y-4">
                <Feather
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute -bottom-6 -right-5 w-36 h-36 text-ucaep-brown opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-105"
                  strokeWidth={1.25}
                />
                <div className="relative z-10 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold tabular-nums">
                  <span>Épreuve 01</span>
                  <span className="text-ucaep-green">Texte + vidéo</span>
                </div>
                <h4 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown leading-tight">
                  « Je suis… »
                </h4>
                <p className="relative z-10 text-sm text-ucaep-ink/82 leading-relaxed">
                  Les candidats rédigent un texte original pour se présenter{' '}
                  <strong className="font-semibold text-ucaep-brown">
                    au-delà de leur état civil ou de leur filière
                  </strong>
                  , puis l&apos;interprètent en vidéo : parcours personnel, interrogations, aspirations et regard sur le monde.
                </p>
                <p className="relative z-10 text-xs font-medium text-ucaep-brown/75 pt-3 border-t border-ucaep-brown/12">
                  Poème, prose, monologue ou récit · Interprétation vidéo (jusqu&apos;à 5 min).
                </p>
              </article>

              <article className="lg:col-span-4 art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-paper p-7 space-y-4">
                <ScrollText
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute -bottom-6 -right-5 w-36 h-36 text-ucaep-brown opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-105"
                  strokeWidth={1.25}
                />
                <div className="relative z-10 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold tabular-nums">
                  <span>Épreuve 02</span>
                  <span className="text-ucaep-green">Texte + vidéo</span>
                </div>
                <h4 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown leading-tight">
                  « Les mots que l&apos;on n&apos;ose pas dire »
                </h4>
                <p className="relative z-10 text-sm text-ucaep-ink/82 leading-relaxed">
                  Les candidats produisent un texte original consacré à{' '}
                  <strong className="font-semibold text-ucaep-brown">
                    une pensée, une gratitude ou une vérité retenue par pudeur
                  </strong>
                  , puis en livrent une interprétation filmée en vidéo.
                </p>
                <p className="relative z-10 text-xs font-medium text-ucaep-brown/75 pt-3 border-t border-ucaep-brown/12">
                  Français (touches de langues nationales possibles) · Jusqu&apos;à 5 minutes.
                </p>
              </article>

              <article className="lg:col-span-4 art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-green text-ucaep-paper p-7 space-y-4">
                <BrandPatternSurface
                  variant="green"
                  tileWidth={180}
                  opacityClass="opacity-[0.12]"
                />
                <BrandPatternCircle
                  variant="gold"
                  tileWidth={110}
                  ring={false}
                  orbit
                  className="absolute -top-10 -right-10 w-32 h-32 opacity-20"
                />
                <Scale
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute -bottom-6 -right-5 w-36 h-36 text-ucaep-gold opacity-[0.1] -rotate-12 transition-transform duration-500 group-hover:scale-105"
                  strokeWidth={1.25}
                />
                <div className="relative z-10 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold tabular-nums">
                  <span>Barème officiel</span>
                  <span>/ 20 points</span>
                </div>
                <h4 className="relative z-10 font-serif text-2xl font-semibold text-ucaep-paper leading-snug">
                  Critères d&apos;évaluation
                </h4>
                <ul className="relative z-10 divide-y divide-ucaep-ivory/14 text-sm text-ucaep-ivory/90 tabular-nums">
                  <li className="py-1.5 flex justify-between gap-2">
                    <span>Sincérité &amp; profondeur</span>
                    <span
                      data-counter="6"
                      data-counter-suffix=" pts"
                      className="font-mono font-semibold text-ucaep-gold"
                    >
                      6 pts
                    </span>
                  </li>
                  <li className="py-1.5 flex justify-between gap-2">
                    <span>Qualité de la langue</span>
                    <span
                      data-counter="6"
                      data-counter-suffix=" pts"
                      className="font-mono font-semibold text-ucaep-gold"
                    >
                      6 pts
                    </span>
                  </li>
                  <li className="py-1.5 flex justify-between gap-2">
                    <span>Originalité &amp; créativité</span>
                    <span
                      data-counter="5"
                      data-counter-suffix=" pts"
                      className="font-mono font-semibold text-ucaep-gold"
                    >
                      5 pts
                    </span>
                  </li>
                  <li className="py-1.5 flex justify-between gap-2">
                    <span>Cohérence &amp; construction</span>
                    <span
                      data-counter="3"
                      data-counter-suffix=" pts"
                      className="font-mono font-semibold text-ucaep-gold"
                    >
                      3 pts
                    </span>
                  </li>
                </ul>
                <p className="relative z-10 text-xs text-ucaep-ivory/82 leading-relaxed pt-1">
                  Les retenus accèdent à La Connaissance (en ligne), puis les finalistes à L&apos;Éloquence (en présentiel).
                </p>
                <div className="relative z-10 pt-1">
                  <Link
                    to="/parcours"
                    className="group/link inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ucaep-gold hover:text-ucaep-paper transition-colors"
                  >
                    <span>Voir les 6 épreuves du parcours</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </article>
            </div>
          </div>
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14" data-reveal>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                Informations officielles
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-ink leading-none overflow-hidden">
                <span data-mask-title className="block">
                  Annonces et <em className="italic font-normal text-ucaep-brown">calendrier</em>
                </span>
              </h2>
            </div>
            <Link
              to="/annonces"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
            >
              <span className="editorial-underline">Toutes les annonces</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

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
                <article
                  key={item.id}
                  data-reveal
                  className="group py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
                >
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
                    <Link
                      to={`/annonces/${item.slug}`}
                      data-clip-reveal
                      className="block aspect-[16/10] overflow-hidden rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10"
                    >
                      <EditorialImage
                        assetKey={item.imageKey}
                        className="group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                      />
                    </Link>
                  </div>
                </article>
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
        <div
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10"
          data-reveal
        >
          <div className="space-y-4 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-gold">
              Participation étudiante · ENSET de Lokossa
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ucaep-paper leading-[1.08] overflow-hidden">
              <span data-mask-title className="block">
                Un concours ouvert aux étudiants de l&apos;ENSET{' '}
                <em className="italic font-normal text-ucaep-ivory">
                  pour mettre en pratique leurs compétences en écriture, en vulgarisation scientifique et en expression orale.
                </em>
              </span>
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ivory/85 max-w-xl leading-relaxed">
              L&apos;inscription est gratuite et ouverte à tous les étudiants de l&apos;ENSET de Lokossa jusqu&apos;au vendredi 20 novembre 2026. Chaque candidat reçoit un code d&apos;anonymat dès validation du formulaire.
            </p>
          </div>
          {candidateSession ? (
            <Link
              to="/depot"
              className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-[#161210] hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
            >
              <span>Accéder à mon dossier</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link
              to="/inscription"
              className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-[#161210] hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
            >
              <span>Je m&apos;inscris</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </div>

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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14" data-reveal>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-brown/75">
                Journal du concours
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-ink leading-none overflow-hidden">
                <span data-mask-title className="block">
                  Actualités et <em className="italic font-normal text-ucaep-brown">repères</em>
                </span>
              </h2>
            </div>
            <Link
              to="/actualites"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
            >
              <span className="editorial-underline">Consulter toutes les actualités</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {leadNews && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              <Link
                to={`/actualites/${leadNews.slug}`}
                data-reveal
                className="lg:col-span-7 group block space-y-5"
              >
                <div
                  data-clip-reveal
                  className="aspect-[16/10] overflow-hidden rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10"
                >
                  <EditorialImage
                    assetKey={leadNews.imageKey}
                    className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  />
                </div>
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

              <div className="lg:col-span-5 lg:border-l border-ucaep-brown/12 lg:pl-10 divide-y divide-ucaep-brown/12">
                {secondaryNews.map((article, idx) => (
                  <Link
                    key={article.id}
                    to={`/actualites/${article.slug}`}
                    data-reveal
                    data-reveal-delay={String(idx * 0.1)}
                    className={`group block ${idx === 0 ? 'pb-8' : 'pt-8'}`}
                  >
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
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
