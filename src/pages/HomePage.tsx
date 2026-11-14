import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
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
import {
  BrandPatternArch,
  BrandPatternBand,
  BrandPatternCircle,
  BrandPatternEdge,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialImage } from '../components/EditorialImage';
import { fetchApiJson } from '../lib/api';
import { useCandidateSession } from '../lib/candidate-session';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { prefersReducedMotion, useEditorialScrollMotion } from '../lib/motion';
import type {
  CompetitionPhase,
  PublicAnnouncement,
  PublicNewsArticle,
} from '../types/competition';

const MANIFESTO_CARDS = [
  {
    index: '01',
    keyFigure: '100 % gratuit',
    title: 'Ouvert à tous les étudiants',
    detail:
      'Accessible à tout étudiant, sans condition de filière ni d’expérience préalable sur scène.',
    Icon: Users,
  },
  {
    index: '02',
    keyFigure: '5 min max',
    title: 'Jusqu’à 5 min de présentation',
    detail:
      'Pour présenter vos idées ou défendre votre texte devant le jury, chacun dispose de jusqu’à 5 minutes.',
    Icon: Clock,
  },
  {
    index: '03',
    keyFigure: 'Sur 20 pts',
    title: 'Chaque phase notée sur 20',
    detail:
      'Les deux premières phases qualificatives sélectionnent les finalistes avant le verdict sur scène.',
    Icon: Scale,
  },
  {
    index: '04',
    keyFigure: 'Double lecture',
    title: 'Anonymat & jury bienveillant',
    detail:
      'Copies corrigées à l’aveugle sous votre code candidat par un jury mixte ENSET et UCAEP.',
    Icon: ShieldCheck,
  },
];

const JOURNEY_GUARANTEES = [
  {
    number: '01',
    kicker: 'Rythme personnel',
    title: 'Jusqu’à 5 minutes pour convaincre',
    text: 'Chaque candidat dispose de jusqu’à 5 minutes pour sa présentation : prenez le temps de poser votre voix, votre rythme et vos idées.',
    Icon: Clock,
  },
  {
    number: '02',
    kicker: 'Progression douce',
    title: 'Des phases simples et progressives',
    text: 'On commence chez soi à l’écrit (Phases 1 et 2, avec sélection des meilleurs à chaque étape) avant de rejoindre la scène en finale.',
    Icon: Feather,
  },
  {
    number: '03',
    kicker: 'Reconnaissance',
    title: 'Une attestation pour chaque participant',
    text: 'Quelle que soit l’issue du parcours, chacun repart avec son attestation officielle et une place pour vivre la Grande Finale sur le campus.',
    Icon: Award,
  },
];

export function HomePage() {
  usePageSeo(
    'Accueil',
    "Un concours imaginé par la Session Théâtre de l'UCAEP, ouvert à tous les étudiants autour de l'écriture, de la connaissance et de la prise de parole.",
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

  // Controlled calligraphic GSAP opening sequence
  useEffect(() => {
    if (!heroRef.current || prefersReducedMotion()) return;

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
    }, heroRef);

    return () => ctx.revert();
  }, []);

  useEditorialScrollMotion(pageRef, [phases.length, announcements.length, news.length]);

  const hasOpenSubmissions = phases.some((p) => Boolean(p.submissionsOpen));
  const leadNews = news[0];
  const secondaryNews = news.slice(1, 3);

  return (
    <div ref={pageRef} className="bg-ucaep-paper">
      {/* 1. HERO: Warm Earth Brown Radial Atelier + Fraunces Art Display + Scannable Key Strip */}
      <section
        ref={heroRef}
        className="relative w-full bg-[radial-gradient(ellipse_at_top_right,#6B3B2B_0%,#4E2A1E_52%,#2E160E_100%)] text-ucaep-ivory pt-[88px] pb-14 sm:pt-[96px] sm:pb-16 lg:pt-[108px] lg:pb-20 flex flex-col justify-between overflow-hidden"
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

        {/* Orbiting cultural medallions */}
        <BrandPatternCircle
          variant="gold"
          tileWidth={135}
          doubleRing
          orbit
          className="hidden lg:block -top-20 -right-16 w-72 h-72 opacity-22"
        />
        <BrandPatternCircle
          variant="obsidian"
          tileWidth={120}
          ring={false}
          className="hidden md:block absolute bottom-24 left-12 w-36 h-36 opacity-15"
        />

        <Mic2
          aria-hidden="true"
          className="pointer-events-none select-none absolute bottom-12 right-6 w-72 h-72 text-ucaep-gold opacity-[0.055] -rotate-12"
          strokeWidth={1}
        />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
            {/* Left Typographic Composition */}
            <div className="lg:col-span-7 space-y-7">
              <div className="hero-meta-fade flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-ucaep-gold">
                <span>Session Théâtre · UCAEP</span>
                <span aria-hidden="true" className="text-ucaep-ivory/40">·</span>
                <span className="text-ucaep-ivory/85">ENSET de Lokossa — UNSTIM</span>
              </div>

              <h1 className="font-serif text-ucaep-paper tracking-tight">
                <span className="block overflow-hidden">
                  <span className="hero-line-inner block text-5xl sm:text-7xl lg:text-[5.2rem] xl:text-[5.8rem] font-semibold leading-[0.94]">
                    Et si on lisait
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span className="hero-line-inner block text-5xl sm:text-7xl lg:text-[5.45rem] xl:text-[6.05rem] italic font-normal text-ucaep-ivory leading-[1.02] pr-2">
                    à haute voix ?
                  </span>
                </span>
              </h1>

              {/* Instant-read 1-sentence focal summary */}
              <p className="hero-meta-fade text-base sm:text-lg text-ucaep-ivory/88 max-w-lg leading-relaxed font-normal">
                Un concours gratuit pour <strong className="text-ucaep-paper font-semibold">tous les étudiants</strong> autour de l&apos;écriture, de la lecture et de la parole — avec{' '}
                <strong className="text-ucaep-gold font-semibold">jusqu&apos;à 5 minutes</strong> pour présenter vos idées.
              </p>

              {/* Scannable mini-ledger directly in hero */}
              <dl className="hero-meta-fade grid grid-cols-3 gap-4 max-w-lg border-y border-ucaep-ivory/18 py-3.5 text-xs">
                <div>
                  <dt className="uppercase tracking-[0.16em] text-ucaep-gold/85 text-[10px]">Accès</dt>
                  <dd className="font-serif text-base sm:text-lg text-ucaep-paper font-semibold mt-0.5">
                    Tous étudiants
                  </dd>
                </div>
                <div className="border-l border-ucaep-ivory/16 pl-4">
                  <dt className="uppercase tracking-[0.16em] text-ucaep-gold/85 text-[10px]">Présentation</dt>
                  <dd className="font-serif text-base sm:text-lg text-ucaep-paper font-semibold mt-0.5 tabular-nums">
                    Jusqu&apos;à 5 min
                  </dd>
                </div>
                <div className="border-l border-ucaep-ivory/16 pl-4">
                  <dt className="uppercase tracking-[0.16em] text-ucaep-gold/85 text-[10px]">Barème</dt>
                  <dd className="font-serif text-base sm:text-lg text-ucaep-paper font-semibold mt-0.5 tabular-nums">
                    Sur 20 pts / phase
                  </dd>
                </div>
              </dl>

              <div className="hero-meta-fade pt-1 flex flex-wrap items-center gap-5">
                {candidateSession ? (
                  <Link
                    to="/depot"
                    className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-[#161210] hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
                  >
                    <span>Mon espace dépôt ({candidateSession.referenceCode})</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link
                    to="/inscription"
                    className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-[#161210] hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
                  >
                    <span>Je m&apos;inscris</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                )}

                {!candidateSession && hasOpenSubmissions && (
                  <Link
                    to="/depot"
                    className="btn-tactile inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-[2px] border border-ucaep-gold/70 text-ucaep-gold hover:bg-ucaep-gold/10 whitespace-nowrap shrink-0"
                  >
                    <span>Déposer ma production</span>
                  </Link>
                )}

                <Link
                  to="/parcours"
                  className="editorial-underline py-2 text-sm font-medium text-ucaep-ivory hover:text-ucaep-gold transition-colors whitespace-nowrap shrink-0"
                >
                  Découvrir la Phase 1
                </Link>
              </div>
            </div>

            {/* Right Framed Portrait + Orbiting Gold Medallion */}
            <div className="lg:col-span-5 relative">
              <BrandPatternCircle
                variant="gold"
                tileWidth={130}
                orbit
                className="absolute -bottom-8 -left-8 w-44 h-44 opacity-30 hidden sm:block"
              />
              <figure className="hero-portrait-frame relative z-10 bg-[#3B1E14]/90 border border-ucaep-gold/30 p-2.5 sm:p-3.5 rounded-[2px] shadow-[0_32px_72px_-20px_rgba(20,10,6,0.72)] transition-transform duration-500 hover:-translate-y-1">
                <div className="relative aspect-[3/4] max-h-[540px] w-full overflow-hidden bg-[#2A150E]">
                  <EditorialImage
                    assetKey="portrait"
                    priority
                    className="hero-portrait-img object-cover object-top"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2E160E]/55 via-transparent to-transparent"
                  />
                </div>
                <figcaption className="hero-meta-fade pt-3 pb-0.5 px-0.5 flex items-center justify-between text-xs text-ucaep-ivory/80">
                  <span className="font-serif italic text-sm">
                    Créer · Transmettre · Rayonner
                  </span>
                  <span className="font-mono uppercase tracking-[0.2em] text-[10px] text-ucaep-gold tabular-nums">
                    Édition 2026
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>

        {/* Bottom Architectural 3-Phase Index */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 mt-10 lg:mt-14">
          <div className="hero-rule-draw h-px bg-ucaep-ivory/22 mb-5" />
          <div className="hero-meta-fade flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ucaep-ivory/82 tabular-nums">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
              <span>
                <strong className="font-mono text-ucaep-gold mr-1.5">01</strong>La Plume (/20)
              </span>
              <span>
                <strong className="font-mono text-ucaep-gold mr-1.5">02</strong>Révélée au Jour 6 (/20)
              </span>
              <span>
                <strong className="font-mono text-ucaep-gold mr-1.5">03</strong>Grande Finale sur scène (/20)
              </span>
            </div>
            <div className="text-ucaep-ivory/85">
              Clôture des inscriptions · Vendredi 20 novembre 2026
            </div>
          </div>
        </div>

        <BrandPatternWave
          variant="gold"
          tileWidth={170}
          opacity={0.2}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-16 sm:h-24"
        />
      </section>

      {/* 2. SCANNABLE ESSENTIALS + MANIFESTO SPREAD */}
      <section className="relative py-20 lg:py-28 bg-ucaep-paper paper-fiber border-b border-ucaep-brown/12 overflow-hidden">
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
          {/* 4 Instant-Scan Cards Right Above the Manifesto */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4" data-reveal>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                  L&apos;essentiel en 10 secondes
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown mt-1">
                  Quatre repères <em className="italic font-normal text-ucaep-ink">pour décider tout de suite</em>
                </h2>
              </div>
              <Link
                to="/concours"
                className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
              >
                <span className="editorial-underline">Lire le dossier complet</span>
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

          <div className="h-px bg-ucaep-brown/12" data-hairline-reveal />

          {/* Editorial Manifesto Spread */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6" data-reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                Pourquoi on lance ce concours
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-brown leading-[1.02]">
                Trois étapes,{' '}
                <em className="italic font-normal text-ucaep-ink">
                  du cahier jusqu&apos;à la scène.
                </em>
              </h2>
              <p className="text-base sm:text-lg text-ucaep-ink/80 max-w-xl leading-relaxed">
                Les inscriptions sont ouvertes gratuitement à tous les étudiants.{' '}
                <strong className="font-semibold text-ucaep-brown">
                  Pas besoin d&apos;avoir déjà fait de la scène ou de la poésie
                </strong>{' '}
                : on avance pas à pas, de l&apos;écriture personnelle jusqu&apos;à la prise de parole devant le public.
              </p>
              <div className="pt-4 border-t border-ucaep-brown/14 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-ucaep-brown/80 tabular-nums">
                <span>Ouvert à tous les étudiants</span>
                <span aria-hidden="true">·</span>
                <span>Jusqu&apos;à 5 minutes par présentation</span>
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
                  Fig. 01 — Sur le papier, avant la prise de parole
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

      {/* 3. THREE-PHASE COLUMNS + VISIBLE PHASE 1 FOCUS */}
      <section className="relative py-24 lg:py-32 bg-[#F4EDE1] paper-grain border-b border-ucaep-brown/12 overflow-hidden">
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
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-20">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14" data-reveal>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-brown/75">
                  Comment ça va se passer
                </p>
                <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-ink leading-none">
                  Voici les <em className="italic font-normal text-ucaep-brown">trois étapes</em>
                </h2>
              </div>
              <Link
                to="/parcours"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
              >
                <span className="editorial-underline">Voir le parcours complet</span>
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
                    <div className="aspect-[4/3] overflow-hidden rounded-[2px] bg-ucaep-brown/8 border border-ucaep-brown/12">
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

          {/* Visible Focus Deck on Phase 1 — La Plume */}
          <div className="pt-12 border-t border-ucaep-brown/15 space-y-8" data-reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                  Phase 01 · Consignes déjà affichées
                </p>
                <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown leading-tight">
                  Zoom sur <em className="italic font-normal text-ucaep-ink">La Plume</em> : vos deux épreuves
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-medium text-ucaep-brown/80 tabular-nums">
                Jours 1 à 3 · À domicile · Jusqu&apos;à 5 minutes par présentation
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
                  <span className="text-ucaep-green">5 min max</span>
                </div>
                <h4 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown leading-tight">
                  « Je suis… »
                </h4>
                <p className="relative z-10 text-sm text-ucaep-ink/82 leading-relaxed">
                  Ici, vous êtes appelé(e) à vous présenter vraiment,{' '}
                  <strong className="font-semibold text-ucaep-brown">
                    au-delà de votre nom, de votre âge ou de votre filière
                  </strong>
                  . Racontez votre parcours, vos rêves, vos doutes et ce qui vous anime, dans la forme qui vous ressemble.
                </p>
                <p className="relative z-10 text-xs font-medium text-ucaep-brown/75 pt-3 border-t border-ucaep-brown/12">
                  Poème, prose, monologue ou récit · Jusqu&apos;à 5 minutes pour votre présentation.
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
                  <span className="text-ucaep-green">5 min max</span>
                </div>
                <h4 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown leading-tight">
                  « Les mots que l&apos;on n&apos;ose pas dire »
                </h4>
                <p className="relative z-10 text-sm text-ucaep-ink/82 leading-relaxed">
                  Ici, vous êtes invité(e) à confier au papier{' '}
                  <strong className="font-semibold text-ucaep-brown">
                    une pensée, une émotion ou une vérité gardée pour vous
                  </strong>
                  {' '}: lettre jamais envoyée, merci, regret ou confession adressée à quelqu&apos;un de réel ou d&apos;imaginaire.
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
                  Notes &amp; qualification
                </h4>
                <ul className="relative z-10 divide-y divide-ucaep-ivory/14 text-sm text-ucaep-ivory/90 tabular-nums">
                  <li className="py-1.5 flex justify-between gap-2">
                    <span>Sincérité &amp; profondeur</span>
                    <span className="font-mono font-semibold text-ucaep-gold">6 pts</span>
                  </li>
                  <li className="py-1.5 flex justify-between gap-2">
                    <span>Qualité de la langue</span>
                    <span className="font-mono font-semibold text-ucaep-gold">6 pts</span>
                  </li>
                  <li className="py-1.5 flex justify-between gap-2">
                    <span>Originalité &amp; créativité</span>
                    <span className="font-mono font-semibold text-ucaep-gold">5 pts</span>
                  </li>
                  <li className="py-1.5 flex justify-between gap-2">
                    <span>Cohérence &amp; construction</span>
                    <span className="font-mono font-semibold text-ucaep-gold">3 pts</span>
                  </li>
                </ul>
                <p className="relative z-10 text-xs text-ucaep-ivory/82 leading-relaxed pt-1">
                  Phase qualificative : les meilleures copies passent à la Phase 2.
                </p>
                <div className="relative z-10 pt-1">
                  <Link
                    to="/parcours"
                    className="group/link inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ucaep-gold hover:text-ucaep-paper transition-colors"
                  >
                    <span>Voir tout le détail Phase 1</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROGRESSIVE ANNOUNCEMENTS BROADSHEET */}
      <section className="relative py-24 lg:py-32 bg-ucaep-paper paper-grain overflow-hidden">
        <BrandPatternSurface
          variant="gold"
          tileWidth={220}
          opacityClass="opacity-[0.04]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="green"
          tileWidth={135}
          blendMultiply
          doubleRing
          orbit
          className="hidden lg:block -top-20 -right-16 w-60 h-60 opacity-[0.08]"
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
                En direct de l&apos;équipe
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-ink leading-none">
                On vous tient <em className="italic font-normal text-ucaep-brown">au courant</em>
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
              Il n&apos;y a pas encore d&apos;annonce publiée. La prochaine annonce arrive bientôt.
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

      {/* 5. ESPRIT & GARANTIES (SANS DÉTAIL DES PRIX) */}
      <section className="relative py-20 lg:py-28 bg-ucaep-linen/70 paper-fiber border-y border-ucaep-brown/12 overflow-hidden">
        <BrandPatternSurface
          variant="brown"
          tileWidth={200}
          opacityClass="opacity-[0.045]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="gold"
          tileWidth={130}
          blendMultiply
          doubleRing
          orbit
          className="hidden lg:block -top-20 -right-16 w-56 h-56 opacity-[0.1]"
        />
        <BrandPatternWave
          variant="brown"
          tileWidth={175}
          opacity={0.1}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-20"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6" data-reveal>
            <div className="space-y-3 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-brown/75">
                Esprit du concours
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-ucaep-ink leading-tight">
                Une aventure ouverte <em className="italic font-normal text-ucaep-brown">et bienveillante</em>
              </h2>
            </div>
            <Link
              to="/concours"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
            >
              <span className="editorial-underline">Lire le dossier complet</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {JOURNEY_GUARANTEES.map((item, idx) => {
              const Icon = item.Icon;
              return (
                <article
                  key={item.number}
                  data-reveal
                  data-reveal-delay={String(idx * 0.06)}
                  className="art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/15 bg-ucaep-paper p-7 space-y-3"
                >
                  <Icon
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute -bottom-5 -right-5 w-32 h-32 text-ucaep-brown opacity-[0.055] -rotate-12 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6"
                    strokeWidth={1.3}
                  />
                  <div className="relative z-10 flex items-baseline justify-between border-b border-ucaep-brown/10 pb-2.5">
                    <span className="font-serif text-3xl font-semibold text-ucaep-gold tabular-nums leading-none">
                      {item.number}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-green">
                      {item.kicker}
                    </span>
                  </div>
                  <h3 className="relative z-10 font-serif text-2xl font-semibold text-ucaep-brown leading-snug">
                    {item.title}
                  </h3>
                  <p className="relative z-10 text-sm text-ucaep-ink/78 leading-relaxed">
                    {item.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. DEEP EARTH BROWN INVITATION BAND */}
      <section className="relative py-24 lg:py-28 bg-[radial-gradient(ellipse_at_top_right,#633728_0%,#4E2A1E_55%,#3B1E14_100%)] text-ucaep-ivory overflow-hidden">
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
        <Mic2
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-10 right-8 w-64 h-64 text-ucaep-gold opacity-[0.07] -rotate-12"
          strokeWidth={1}
        />
        <div
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10"
          data-reveal
        >
          <div className="space-y-4 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-gold">
              Vous souhaitez participer ?
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-paper leading-[1.02]">
              C&apos;est l&apos;occasion d&apos;essayer{' '}
              <em className="italic font-normal text-ucaep-ivory">
                et de partager vos idées.
              </em>
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ivory/85 max-w-xl leading-relaxed">
              L&apos;inscription est gratuite, ouverte à tous les étudiants et prend deux minutes. Venez tenter l&apos;aventure.
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
      </section>

      {/* 7. LATEST NEWS — Magazine Cover Spread */}
      <section className="relative py-24 lg:py-32 bg-ucaep-paper paper-fiber overflow-hidden">
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
                Les nouvelles du concours
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ucaep-ink leading-none">
                Quoi de <em className="italic font-normal text-ucaep-brown">neuf ?</em>
              </h2>
            </div>
            <Link
              to="/actualites"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
            >
              <span className="editorial-underline">Voir toutes les actualités</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {leadNews && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Lead story (7 cols) */}
              <Link
                to={`/actualites/${leadNews.slug}`}
                data-reveal
                className="lg:col-span-7 group block space-y-5"
              >
                <div className="aspect-[16/10] overflow-hidden rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10">
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

              {/* Secondary editorial column (5 cols) */}
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
