import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Feather,
  Lock,
  MessageSquareQuote,
  Mic2,
  Scale,
  Unlock,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BrandPatternCircle,
  BrandPatternEdge,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialImage } from '../components/EditorialImage';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { fetchApiJson } from '../lib/api';
import { useCandidateSession } from '../lib/candidate-session';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { useEditorialScrollMotion } from '../lib/motion';
import type { CompetitionPhase } from '../types/competition';

const PHASE_ATMOSPHERES = [
  {
    bg: 'bg-ucaep-paper',
    text: 'text-ucaep-ink',
    heading: 'text-ucaep-brown',
    muted: 'text-ucaep-brown/75',
    border: 'border-ucaep-brown/18',
    sealBg: 'bg-ucaep-linen/70',
    accent: 'text-ucaep-gold',
    markTone: 'brown' as const,
    patternVariant: 'brown' as const,
  },
  {
    bg: 'bg-ucaep-green',
    text: 'text-ucaep-ivory/90',
    heading: 'text-ucaep-paper',
    muted: 'text-ucaep-ivory/75',
    border: 'border-ucaep-ivory/22',
    sealBg: 'bg-[#1f3622]',
    accent: 'text-ucaep-gold',
    markTone: 'gold' as const,
    patternVariant: 'green' as const,
  },
  {
    bg: 'bg-ucaep-brown',
    text: 'text-ucaep-ivory/90',
    heading: 'text-ucaep-paper',
    muted: 'text-ucaep-ivory/75',
    border: 'border-ucaep-ivory/22',
    sealBg: 'bg-[#381d14]',
    accent: 'text-ucaep-gold',
    markTone: 'gold' as const,
    patternVariant: 'gold' as const,
  },
];

const PHASE_1_RUBRIC = [
  { label: 'Sincérité et profondeur du propos', points: '6 pts' },
  { label: 'Qualité de la langue et de l’écriture', points: '6 pts' },
  { label: 'Originalité et créativité', points: '5 pts' },
  { label: 'Cohérence et construction du texte', points: '3 pts' },
];

const CALENDAR_WEEKS = [
  {
    step: 'Semaine 0',
    span: 'Jours -7 à -1',
    title: 'Communication & inscriptions',
    items: [
      'Affiches sur le campus, passage dans les amphithéâtres et relais par les délégués.',
      'Inscription gratuite ouverte à tous les étudiants en ligne ou auprès des relais.',
      'Remise de votre code d’anonymat personnel et publication de la liste des inscrits.',
    ],
    Icon: Calendar,
  },
  {
    step: 'Semaine 1',
    span: 'Jours 1 à 6',
    title: 'Phase 01 « La Plume » & lancement Phase 02',
    items: [
      'Jours 1 à 3 : rédaction des épreuves 1 et 2 chez vous (jusqu’à 5 min de présentation) et dépôt anonyme.',
      'Jours 4 à 5 : double correction par le jury et annonce des candidats qualifiés pour la suite.',
      'Jour 6 : ouverture de la Phase 2 et dévoilement progressif des sujets aux candidats qualifiés.',
    ],
    Icon: Feather,
  },
  {
    step: 'Semaine 2',
    span: 'Jours 7 à 14',
    title: 'Phase 02, ateliers & Grande Finale',
    items: [
      'Jours 7 à 9 : rédaction Phase 2 et dépôt limite en fin de Jour 9.',
      'Jours 10 à 11 : sélection et annonce des finalistes puis dévoilement progressif de la suite.',
      'Jours 12 à 13 : ateliers de diction & répétitions · Jour 14 : Grande Finale publique.',
    ],
    Icon: Mic2,
  },
];

export function ParcoursPage() {
  usePageSeo(
    'Le parcours',
    "Les 3 phases du concours UCAEP : toutes les consignes de la Phase 1 (La Plume), le dévoilement progressif des phases 2 et 3 et le calendrier en 3 semaines.",
  );

  const candidateSession = useCandidateSession();
  const [phases, setPhases] = useState<CompetitionPhase[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchApiJson<{ phases: CompetitionPhase[] }>('/api/phases')
      .then((data) => {
        if (!active) return;
        setPhases(data.phases || []);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEditorialScrollMotion(pageRef, [phases.length]);

  const activePhase = phases[activeIdx];
  const activeStyle = PHASE_ATMOSPHERES[activeIdx % PHASE_ATMOSPHERES.length];
  const hasOpenDeposits = phases.some((p) => Boolean(p.submissionsOpen));
  const phase2 = phases.find((p) => p.id === 'phase-2' || p.number === '02');
  const phase3 = phases.find((p) => p.id === 'phase-3' || p.number === '03');

  return (
    <div ref={pageRef} className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Itinéraire"
        section="3 semaines · 3 phases · 6 épreuves"
        title="Voici comment"
        italicWord="on va avancer."
        subtitle="Toutes les consignes et le barème de la Phase 1 (La Plume) sont déjà visibles ici pour vous préparer sereinement. Chaque candidat dispose de jusqu'à 5 minutes pour sa présentation."
      />

      {loading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
          <div className="h-24 rounded-sm bg-ucaep-ivory/30 animate-pulse" />
          <div className="h-96 rounded-sm bg-ucaep-ivory/30 animate-pulse" />
        </div>
      ) : (
        <>
          {/* DESKTOP: Horizontal 3-Chapter Progression Rail + Atmospheric Stage */}
          <section className="hidden lg:block py-16 lg:py-20 bg-ucaep-paper">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              {/* Horizontal progression selector */}
              <div
                role="tablist"
                aria-label="Chapitres du parcours"
                className="relative grid grid-cols-3 border-b border-ucaep-brown/18"
              >
                {phases.map((phase, idx) => {
                  const isActive = idx === activeIdx;
                  const isPhaseOne = phase.id === 'phase-1' || phase.number === '01';
                  return (
                    <button
                      key={phase.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveIdx(idx)}
                      className={`group relative pb-6 pt-2 pr-6 text-left transition-colors ${
                        isActive ? 'text-ucaep-ink' : 'text-ucaep-ink/50 hover:text-ucaep-brown'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span
                          className={`font-serif text-5xl font-semibold tabular-nums leading-none transition-colors ${
                            isActive ? 'text-ucaep-gold' : 'text-ucaep-brown/35 group-hover:text-ucaep-gold'
                          }`}
                        >
                          {phase.number}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ucaep-green">
                          {phase.format} · {isPhaseOne ? 'Consignes visibles' : phase.statusLabel}
                        </span>
                      </div>
                      <div className="mt-3 font-serif text-2xl font-semibold">
                        {phase.title}
                      </div>
                      {isActive && (
                        <motion.span
                          layoutId="parcours-chapter-bar"
                          aria-hidden="true"
                          className="absolute -bottom-px left-0 right-6 h-0.5 bg-ucaep-gold"
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Horizontal Atmospheric Stage */}
              {activePhase && (
                <AnimatePresence mode="wait">
                  <motion.article
                    key={activePhase.id}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative overflow-hidden rounded-sm border ${activeStyle.border} ${activeStyle.bg} ${activeStyle.text} p-10 lg:p-12 transition-colors`}
                  >
                    <BrandPatternEdge
                      variant={activeStyle.patternVariant}
                      side="right"
                      className="w-3 lg:w-4 opacity-80"
                    />
                    <div className="grid grid-cols-12 gap-12 items-center">
                      <div className="col-span-6">
                        <div className="aspect-4/3 overflow-hidden rounded-sm bg-black/15">
                          <EditorialImage assetKey={activePhase.imageKey} />
                        </div>
                      </div>

                      <div className="col-span-6 space-y-6">
                        <EditorialMark
                          folio={`Chapitre ${activePhase.number}`}
                          label={`${activePhase.format} · ${
                            activePhase.id === 'phase-1' || activePhase.number === '01'
                              ? 'Consignes visibles'
                              : activePhase.statusLabel
                          }`}
                          tone={activeStyle.markTone}
                        />

                        <h2
                          className={`font-serif text-5xl xl:text-6xl font-semibold leading-none ${activeStyle.heading}`}
                        >
                          {activePhase.title}
                        </h2>

                        <p className="text-lg leading-relaxed max-w-xl">
                          {activePhase.shortDescription}
                        </p>

                        <PhaseDetailsBlock
                          phase={activePhase}
                          sealBg={activeStyle.sealBg}
                          border={activeStyle.border}
                          headingColor={activeStyle.heading}
                          mutedColor={activeStyle.muted}
                        />

                        {/* Prev / Next chapter progression buttons */}
                        <div className={`pt-4 border-t ${activeStyle.border} flex items-center justify-between`}>
                          <button
                            type="button"
                            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                            disabled={activeIdx === 0}
                            className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest disabled:opacity-30 transition-opacity ${activeStyle.heading}`}
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Chapitre précédent</span>
                          </button>
                          <span className={`text-xs tabular-nums ${activeStyle.muted}`}>
                            0{activeIdx + 1} / 0{phases.length}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveIdx((i) => Math.min(phases.length - 1, i + 1))
                            }
                            disabled={activeIdx === phases.length - 1}
                            className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest disabled:opacity-30 transition-opacity ${activeStyle.heading}`}
                          >
                            <span>Chapitre suivant</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                </AnimatePresence>
              )}
            </div>
          </section>

          {/* MOBILE / TABLET: Deliberate Vertical Chapter Progression */}
          <section className="lg:hidden divide-y divide-ucaep-brown/15">
            {phases.map((phase, idx) => {
              const style = PHASE_ATMOSPHERES[idx % PHASE_ATMOSPHERES.length];
              const isPhaseOne = phase.id === 'phase-1' || phase.number === '01';
              return (
                <article
                  key={phase.id}
                  className={`py-14 px-4 sm:px-6 ${style.bg} ${style.text}`}
                >
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-baseline justify-between">
                      <span className="font-serif text-5xl font-semibold text-ucaep-gold tabular-nums leading-none">
                        {phase.number}
                      </span>
                      <span className={`text-xs font-semibold uppercase tracking-widest ${style.muted}`}>
                        {phase.format} · {isPhaseOne ? 'Consignes visibles' : phase.statusLabel}
                      </span>
                    </div>

                    <div className="aspect-4/3 overflow-hidden rounded-sm bg-black/15">
                      <EditorialImage assetKey={phase.imageKey} />
                    </div>

                    <h2 className={`font-serif text-4xl font-semibold ${style.heading}`}>
                      {phase.title}
                    </h2>

                    <p className="text-base leading-relaxed">{phase.shortDescription}</p>

                    <PhaseDetailsBlock
                      phase={phase}
                      sealBg={style.sealBg}
                      border={style.border}
                      headingColor={style.heading}
                      mutedColor={style.muted}
                    />
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {/* VISIBLE COMPLETE DOSSIER FOR PHASE 1 — LA PLUME */}
      <section className="relative py-20 lg:py-28 bg-[#F4EDE1] paper-grain border-t border-b border-ucaep-brown/14 overflow-hidden">
        <BrandPatternSurface
          variant="brown"
          tileWidth={220}
          opacityClass="opacity-[0.045]"
          blendMultiply
        />
        <BrandPatternWave
          variant="gold"
          tileWidth={170}
          opacity={0.14}
          flip
          doubleWave
          className="absolute top-0 inset-x-0 h-20"
        />
        <BrandPatternCircle
          variant="gold"
          tileWidth={130}
          blendMultiply
          doubleRing
          className="hidden lg:block -bottom-24 -right-16 w-64 h-64 opacity-[0.09]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6" data-reveal>
            <div className="space-y-3 max-w-2xl">
              <EditorialMark
                folio="Dossier complet · Phase 01"
                label="La Plume · Notée sur 20 points"
                tone="green"
              />
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-ucaep-ink leading-tight">
                Tout savoir sur <em className="italic font-medium text-ucaep-brown">la Phase 1 : La Plume</em>
              </h2>
            </div>
            <div className="text-xs sm:text-sm text-ucaep-brown/80 space-y-1 tabular-nums">
              <p className="font-semibold text-ucaep-brown">
                Jours 1 à 3 · À domicile · Jusqu&apos;à 5 minutes par présentation
              </p>
              <p>Phase qualificative · Double lecture anonyme en Jours 4–5</p>
            </div>
          </div>

          {/* Two large Épreuve Cards in direct, warm 2nd-person voice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article
              data-reveal
              className="group relative overflow-hidden rounded-sm border border-ucaep-brown/16 bg-ucaep-paper p-8 sm:p-10 space-y-5"
            >
              <Feather
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-8 -right-6 w-44 h-44 text-ucaep-brown opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6"
                strokeWidth={1.15}
              />
              <div className="relative z-10 flex items-baseline justify-between gap-4 border-b border-ucaep-brown/12 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-gold tabular-nums">
                  Épreuve 01 · Autoportrait littéraire
                </span>
                <span className="text-xs font-semibold text-ucaep-green tabular-nums">
                  Jusqu&apos;à 5 min de présentation
                </span>
              </div>
              <h3 className="relative z-10 font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                « Je suis… »
              </h3>
              <p className="relative z-10 text-sm sm:text-base text-ucaep-ink/82 leading-relaxed">
                Ici, vous êtes appelé(e) à vous présenter vraiment, au-delà de votre nom, de votre
                âge ou de votre filière. Racontez qui vous êtes au fond : votre parcours, vos rêves,
                vos contradictions, vos difficultés et la façon dont vous regardez le monde.
              </p>
              <div className="relative z-10 p-4 rounded-sm bg-ucaep-linen/75 border border-ucaep-brown/12 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ucaep-brown">
                  Question pour vous guider
                </p>
                <p className="font-serif italic text-lg text-ucaep-ink">
                  « Qui suis-je réellement, au-delà de ce que les autres voient de moi ? »
                </p>
              </div>
              <p className="relative z-10 text-xs text-ucaep-brown/75 leading-relaxed">
                <strong>Formes possibles :</strong> poème, prose poétique, monologue intérieur, récit
                autobiographique ou portrait littéraire.
              </p>
            </article>

            <article
              data-reveal
              data-reveal-delay="0.08"
              className="group relative overflow-hidden rounded-sm border border-ucaep-brown/16 bg-ucaep-paper p-8 sm:p-10 space-y-5"
            >
              <MessageSquareQuote
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-8 -right-6 w-44 h-44 text-ucaep-brown opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6"
                strokeWidth={1.15}
              />
              <div className="relative z-10 flex items-baseline justify-between gap-4 border-b border-ucaep-brown/12 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-gold tabular-nums">
                  Épreuve 02 · Expression intérieure
                </span>
                <span className="text-xs font-semibold text-ucaep-green tabular-nums">
                  Jusqu&apos;à 5 min de présentation
                </span>
              </div>
              <h3 className="relative z-10 font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                « Les mots que l&apos;on n&apos;ose pas dire »
              </h3>
              <p className="relative z-10 text-sm sm:text-base text-ucaep-ink/82 leading-relaxed">
                Ici, vous êtes invité(e) à poser sur papier une pensée, une émotion ou une vérité que
                vous gardez d&apos;habitude pour vous par pudeur, peur, fierté ou respect : un regret,
                une gratitude jamais dite, une blessure ou une question restée sans réponse.
              </p>
              <div className="relative z-10 p-4 rounded-sm bg-ucaep-linen/75 border border-ucaep-brown/12 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ucaep-brown">
                  Ce que le jury regarde
                </p>
                <p className="font-serif italic text-lg text-ucaep-ink">
                  Pas de phrases compliquées à tout prix : juste un texte vrai, sincère et bien construit.
                </p>
              </div>
              <p className="relative z-10 text-xs text-ucaep-brown/75 leading-relaxed">
                <strong>Formes possibles :</strong> lettre jamais envoyée, monologue, confession, poème,
                récit ou message adressé à une personne réelle ou imaginaire.
              </p>
            </article>
          </div>

          {/* Rubric + Modalities & Qualification */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <article
              data-reveal
              className="lg:col-span-5 group relative overflow-hidden rounded-sm border border-ucaep-brown/16 bg-white paper-fiber p-7 sm:p-8 space-y-5"
            >
              <Scale
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-6 -right-5 w-36 h-36 text-ucaep-brown opacity-[0.06] -rotate-12"
                strokeWidth={1.2}
              />
              <div className="relative z-10 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold tabular-nums">
                  Grille d&apos;évaluation · / 20 points par épreuve
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                  Comment chaque texte est noté
                </h3>
              </div>
              <dl className="relative z-10 divide-y divide-ucaep-brown/12 border-t border-b border-ucaep-brown/12 text-sm tabular-nums">
                {PHASE_1_RUBRIC.map((item) => (
                  <div key={item.label} className="py-3 flex items-center justify-between gap-4">
                    <dt className="text-ucaep-ink/85">{item.label}</dt>
                    <dd className="font-serif text-xl font-semibold text-ucaep-brown shrink-0">
                      {item.points}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="relative z-10 text-xs text-ucaep-brown/75 leading-relaxed">
                Chaque copie porte uniquement votre numéro de référence anonyme et passe entre
                les mains de deux correcteurs du jury.
              </p>
            </article>

            <article
              data-reveal
              data-reveal-delay="0.06"
              className="lg:col-span-7 group relative overflow-hidden rounded-sm border border-ucaep-brown/16 bg-ucaep-green text-ucaep-paper p-7 sm:p-8 space-y-5"
            >
              <BrandPatternSurface
                variant="green"
                tileWidth={190}
                opacityClass="opacity-[0.11]"
              />
              <BrandPatternCircle
                variant="gold"
                tileWidth={120}
                ring={false}
                className="hidden sm:block absolute -top-12 -right-12 w-36 h-36 opacity-20"
              />
              <Award
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-7 -right-6 w-40 h-40 text-ucaep-gold opacity-[0.1] -rotate-12"
                strokeWidth={1.2}
              />
              <div className="relative z-10 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold">
                  Temps de parole, règles &amp; qualification
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-paper">
                  Ce qu&apos;il faut retenir pour la suite
                </h3>
              </div>
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-ucaep-ivory/90 leading-relaxed">
                <div className="p-4 rounded-sm bg-[#1f3622]/85 border border-ucaep-ivory/15 space-y-1.5">
                  <p className="font-semibold text-ucaep-gold text-xs uppercase tracking-wider">
                    Votre présentation
                  </p>
                  <p>
                    Chaque candidat dispose de <strong>jusqu&apos;à 5 minutes</strong> pour sa
                    présentation. Rédigez en français (touches de langues nationales béninoises
                    possibles), de façon 100 % personnelle.
                  </p>
                </div>
                <div className="p-4 rounded-sm bg-[#1f3622]/85 border border-ucaep-ivory/15 space-y-1.5">
                  <p className="font-semibold text-ucaep-gold text-xs uppercase tracking-wider">
                    Suite &amp; attestation
                  </p>
                  <p>
                    La Phase 1 est <strong>qualificative</strong> : les candidats retenus poursuivent
                    en Phase 2. Chaque inscrit reçoit son attestation de participation et son invitation
                    à la Finale.
                  </p>
                </div>
              </div>
              <div className="relative z-10 pt-1 flex flex-wrap items-center gap-4">
                {candidateSession ? (
                  <Link
                    to="/depot"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#e1ae52] transition-colors"
                  >
                    <span>Accéder à mon dossier ({candidateSession.referenceCode})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/inscription"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#e1ae52] transition-colors"
                    >
                      <span>M&apos;inscrire pour recevoir mon code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    {hasOpenDeposits && (
                      <Link
                        to="/depot"
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ucaep-ivory hover:text-ucaep-gold transition-colors"
                      >
                        <span className="editorial-underline">Déposer mes productions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* OVERVIEW OF PHASES 2 & 3 (PROGRESSIVELY REVEALED) */}
      <section className="relative py-20 lg:py-24 bg-ucaep-paper paper-fiber border-b border-ucaep-brown/14 overflow-hidden">
        <BrandPatternSurface
          variant="brown"
          tileWidth={220}
          opacityClass="opacity-[0.035]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="green"
          tileWidth={135}
          blendMultiply
          doubleRing
          className="hidden lg:block -top-20 -right-16 w-56 h-56 opacity-[0.08]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-2 max-w-2xl" data-reveal>
            <EditorialMark folio="La suite du parcours" label="Phases 02 & 03" tone="brown" />
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-ucaep-ink leading-tight">
              Ce qui vous attend <em className="italic font-medium text-ucaep-brown">après La Plume</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PHASE 02 CARD */}
            <article
              data-reveal
              className="group relative overflow-hidden rounded-sm border border-ucaep-brown/15 bg-white p-8 space-y-4"
            >
              <BookOpen
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-6 -right-5 w-40 h-40 text-ucaep-brown opacity-[0.055] -rotate-12 transition-transform duration-500 group-hover:scale-105"
                strokeWidth={1.2}
              />
              <div className="relative z-10 flex items-baseline justify-between gap-4 border-b border-ucaep-brown/12 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-gold tabular-nums">
                  Phase 02 · {phase2?.title || 'La Connaissance'} · Notée / 20
                </span>
                <span className="text-xs text-ucaep-brown/70 tabular-nums">Qualificative · Jours 6 à 9</span>
              </div>

              {phase2?.isRevealed && phase2.testDetails ? (
                <>
                  <h3 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown">
                    {phase2.testDetails.instructionsTitle || phase2.title}
                  </h3>
                  {phase2.testDetails.theme && (
                    <p className="relative z-10 text-sm font-semibold text-ucaep-brown">
                      {phase2.testDetails.theme}
                    </p>
                  )}
                  <p className="relative z-10 text-sm text-ucaep-ink/80 leading-relaxed">
                    {phase2.testDetails.instructions}
                  </p>
                  {phase2.testDetails.submissionNote && (
                    <p className="relative z-10 text-xs text-ucaep-brown/75 pt-2 border-t border-ucaep-brown/10 leading-relaxed">
                      {phase2.testDetails.submissionNote}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown">
                    Deux épreuves dévoilées au Jour 6
                  </h3>
                  <ul className="relative z-10 space-y-2.5 text-sm text-ucaep-ink/80 leading-relaxed">
                    <li>
                      · <strong className="text-ucaep-brown">Format en ligne à domicile (Jours 6 à 9) :</strong>{' '}
                      deux productions écrites à réaliser par les candidats qualifiés après la Phase 1, avec jusqu&apos;à 5 minutes pour votre présentation.
                    </li>
                    <li>
                      · <strong className="text-ucaep-brown">Égalité des chances :</strong>{' '}
                      afin que tout le monde démarre en même temps, les titres et sujets exacts des deux épreuves restent scellés jusqu&apos;à l&apos;ouverture de la phase.
                    </li>
                  </ul>
                  <div className="relative z-10 flex items-start gap-2.5 text-xs text-ucaep-brown/80 pt-3 border-t border-ucaep-brown/10 leading-relaxed">
                    <Lock className="w-3.5 h-3.5 text-ucaep-gold shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Phase notée sur 20 points et qualificative : les meilleures notes accèdent à la Grande Finale.
                    </span>
                  </div>
                </>
              )}
            </article>

            {/* PHASE 03 CARD */}
            <article
              data-reveal
              data-reveal-delay="0.08"
              className="group relative overflow-hidden rounded-sm border border-ucaep-brown/15 bg-white p-8 space-y-4"
            >
              <Mic2
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-6 -right-5 w-40 h-40 text-ucaep-brown opacity-[0.055] -rotate-12 transition-transform duration-500 group-hover:scale-105"
                strokeWidth={1.2}
              />
              <div className="relative z-10 flex items-baseline justify-between gap-4 border-b border-ucaep-brown/12 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-gold tabular-nums">
                  Phase 03 · {phase3?.title || "L'Éloquence"} · Notée / 20
                </span>
                <span className="text-xs text-ucaep-brown/70 tabular-nums">Sans élimination · Finale J14</span>
              </div>

              {phase3?.isRevealed && phase3.testDetails ? (
                <>
                  <h3 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown">
                    {phase3.testDetails.instructionsTitle || phase3.title}
                  </h3>
                  {phase3.testDetails.theme && (
                    <p className="relative z-10 text-sm font-semibold text-ucaep-brown">
                      {phase3.testDetails.theme}
                    </p>
                  )}
                  <p className="relative z-10 text-sm text-ucaep-ink/80 leading-relaxed">
                    {phase3.testDetails.instructions}
                  </p>
                  {phase3.testDetails.submissionNote && (
                    <p className="relative z-10 text-xs text-ucaep-brown/75 pt-2 border-t border-ucaep-brown/10 leading-relaxed">
                      {phase3.testDetails.submissionNote}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="relative z-10 font-serif text-3xl font-semibold text-ucaep-brown">
                    La Grande Finale sur scène
                  </h3>
                  <ul className="relative z-10 space-y-2.5 text-sm text-ucaep-ink/80 leading-relaxed">
                    <li>
                      · <strong className="text-ucaep-brown">Ateliers de préparation (Jours 12 et 13) :</strong>{' '}
                      les finalistes bénéficient de deux jours d&apos;ateliers de diction, de souffle et de mise en scène avant de monter sur scène.
                    </li>
                    <li>
                      · <strong className="text-ucaep-brown">Jour 14 devant le jury et le public :</strong>{' '}
                      deux passages sur scène en présentiel (jusqu&apos;à 5 minutes par présentation). Les intitulés et modalités seront communiqués progressivement aux finalistes.
                    </li>
                  </ul>
                  <div className="relative z-10 flex items-start gap-2.5 text-xs text-ucaep-brown/80 pt-3 border-t border-ucaep-brown/10 leading-relaxed">
                    <Lock className="w-3.5 h-3.5 text-ucaep-gold shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Phase notée sur 20 points, sans élimination en cours de soirée · Épreuves dévoilées après la Phase 2.
                    </span>
                  </div>
                </>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* 3-WEEK CALENDAR CARDS */}
      <section className="relative py-20 lg:py-24 bg-ucaep-linen/70 paper-fiber border-b border-ucaep-brown/14 overflow-hidden">
        <BrandPatternSurface
          variant="gold"
          tileWidth={210}
          opacityClass="opacity-[0.045]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="brown"
          tileWidth={140}
          blendMultiply
          className="hidden lg:block absolute -bottom-24 -left-16 w-64 h-64 opacity-[0.07]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-2 max-w-2xl" data-reveal>
            <EditorialMark folio="Organisation" label="Calendrier en 3 semaines" tone="green" />
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-ucaep-ink leading-tight">
              Le rythme <em className="italic font-medium text-ucaep-brown">du concours</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CALENDAR_WEEKS.map((week, idx) => {
              const Icon = week.Icon;
              return (
                <article
                  key={week.step}
                  data-reveal
                  data-reveal-delay={String(idx * 0.06)}
                  className="group relative overflow-hidden rounded-sm border border-ucaep-brown/15 bg-ucaep-paper p-7 space-y-4"
                >
                  <Icon
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute -bottom-6 -right-5 w-32 h-32 text-ucaep-brown opacity-[0.055] -rotate-12"
                    strokeWidth={1.25}
                  />
                  <div className="relative z-10 flex items-baseline justify-between border-b border-ucaep-brown/12 pb-3">
                    <span className="font-serif text-2xl font-semibold text-ucaep-brown">
                      {week.step}
                    </span>
                    <span className="text-xs font-semibold text-ucaep-gold tabular-nums inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {week.span}
                    </span>
                  </div>
                  <h3 className="relative z-10 font-serif text-xl font-semibold text-ucaep-ink">
                    {week.title}
                  </h3>
                  <ul className="relative z-10 space-y-2 text-sm text-ucaep-ink/78 leading-relaxed">
                    {week.items.map((line) => (
                      <li key={line}>· {line}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing strip */}
      <section className="relative py-16 bg-ucaep-paper paper-grain overflow-hidden">
        <BrandPatternWave
          variant="gold"
          tileWidth={165}
          opacity={0.09}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-14"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
              Envie de suivre la suite ?
            </h2>
            <p className="text-sm text-ucaep-ink/75">
              Revenez sur les annonces de temps en temps ou inscrivez-vous dès maintenant.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {candidateSession ? (
              <Link
                to="/depot"
                className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Mon espace dépôt</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                {hasOpenDeposits && (
                  <Link
                    to="/depot"
                    className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Déposer ma production</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                )}
                <Link
                  to="/inscription"
                  className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Je m&apos;inscris</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </>
            )}
            <Link
              to="/annonces"
              className="px-5 py-3 text-sm font-medium rounded-sm border border-ucaep-brown/30 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors whitespace-nowrap shrink-0"
            >
              Voir les annonces
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PhaseDetailsBlock({
  phase,
  sealBg,
  border,
  headingColor,
  mutedColor,
}: {
  phase: CompetitionPhase;
  sealBg: string;
  border: string;
  headingColor: string;
  mutedColor: string;
}) {
  const isPhaseOne = phase.id === 'phase-1' || phase.number === '01';
  const revealed = isPhaseOne || (phase.isRevealed && Boolean(phase.testDetails));

  const title =
    phase.testDetails?.instructionsTitle ||
    (isPhaseOne
      ? 'Phase 01 — La Plume : deux textes personnels (jusqu’à 5 min de présentation)'
      : phase.title);
  const theme =
    phase.testDetails?.theme && !phase.testDetails.theme.includes('communiqué uniquement')
      ? phase.testDetails.theme
      : isPhaseOne
        ? 'Épreuve 1 : « Je suis… » · Épreuve 2 : « Les mots que l’on n’ose pas dire »'
        : '';
  const instructions =
    phase.testDetails?.instructions && !phase.testDetails.instructions.includes('seront publiés sur la page Annonces')
      ? phase.testDetails.instructions
      : isPhaseOne
        ? "Épreuve 1 : ici, vous êtes appelé(e) à vous présenter vraiment, au-delà de votre nom ou de votre filière. Épreuve 2 : ici, vous êtes invité(e) à confier au papier ce que l'on n'ose pas dire d'habitude. Chaque épreuve est notée sur 20 points avec jusqu'à 5 minutes pour votre présentation."
        : '';
  const note =
    phase.testDetails?.submissionNote ||
    (isPhaseOne
      ? 'Phase qualificative · Dépôt sous code anonyme UCAEP · Jusqu’à 5 minutes par présentation.'
      : '');

  return (
    <div className="space-y-4">
      {phase.submissionsOpen && (
        <div className={`p-5 ${sealBg} border border-ucaep-gold/60 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-ucaep-gold">
              Dépôts en ligne ouverts
            </p>
            {phase.submissionDeadline && (
              <p className={`text-xs ${mutedColor}`}>
                À envoyer avant le {formatFrenchDate(phase.submissionDeadline)}
              </p>
            )}
          </div>
          <Link
            to="/depot"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#e1ae52] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Déposer ma production</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {revealed ? (
        <div className={`p-6 ${sealBg} border border-ucaep-gold/60 rounded-sm space-y-2.5`}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ucaep-gold">
            <Unlock className="w-3.5 h-3.5" />
            <span>Consignes disponibles</span>
          </div>
          <h3 className={`font-serif text-2xl font-semibold ${headingColor}`}>
            {title}
          </h3>
          {theme && <p className="text-sm font-medium">{theme}</p>}
          {instructions && <p className="text-sm opacity-90 leading-relaxed">{instructions}</p>}
          {note && <p className={`text-xs pt-1 ${mutedColor}`}>{note}</p>}
        </div>
      ) : (
        <div className={`p-5 ${sealBg} border ${border} rounded-sm flex items-start gap-3.5`}>
          <Lock className="w-4 h-4 text-ucaep-gold shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className={`text-sm font-semibold ${headingColor}`}>
              Chapitre scellé · Sujets dévoilés au moment du lancement
            </p>
            <p className={`text-xs leading-relaxed ${mutedColor}`}>
              Les intitulés des épreuves et les sujets de cette étape restent confidentiels et seront publiés progressivement sur la page Annonces, afin que tout le monde démarre en même temps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
