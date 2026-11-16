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
import { InteractiveRubric } from '../components/InteractiveRubric';
import { SectionAnchorRail } from '../components/SectionAnchorRail';
import { VideoPrepWorkshop } from '../components/VideoPrepWorkshop';
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

function buildCalendarWeeks(phase1Revealed: boolean, phase2Revealed: boolean) {
  return [
    {
      step: 'Semaine 0',
      span: 'Jours -7 à -1',
      title: 'Inscriptions et information sur le campus',
      items: [
        'Présentation du concours sur le campus de l’ENSET de Lokossa et dans les amphithéâtres.',
        'Inscription gratuite en ligne ouverte à tous les étudiants de l’ENSET de Lokossa.',
        'Attribution du code d’anonymat UCAEP et publication de la liste des participants.',
      ],
      Icon: Calendar,
    },
    {
      step: 'Semaine 1',
      span: 'Jours 1 à 6',
      title: 'Phase 01 « La Plume » (en ligne) & ouverture Phase 02',
      items: [
        phase1Revealed
          ? 'Jours 1 à 3 : rédaction des textes originaux (« Je suis… » et « Les mots que l’on n’ose pas dire ») et dépôt avec interprétation vidéo.'
          : 'Jours 1 à 3 : rédaction des deux textes originaux de la Phase 01 et dépôt avec interprétation vidéo (sujets dévoilés au lancement).',
        'Jours 4 à 5 : double correction anonyme par le jury et publication de la liste des qualifiés.',
        'Jour 6 : lancement en ligne de la Phase 02 « La Connaissance » pour les candidats retenus.',
      ],
      Icon: Feather,
    },
    {
      step: 'Semaine 2',
      span: 'Jours 7 à 14',
      title: 'Phase 02 « La Connaissance », ateliers & Finale en présentiel',
      items: [
        phase2Revealed
          ? 'Jours 7 à 9 : préparation des contenus explicatifs et prestations vidéo (« La science dans notre quotidien » et « L’école, le savoir et l’avenir »).'
          : 'Jours 7 à 9 : préparation et dépôt en ligne des deux contenus explicatifs et prestations vidéo de la Phase 02 (sujets dévoilés au Jour 6).',
        'Jours 10 à 11 : évaluation et désignation des finalistes de la Phase 03.',
        'Jours 12 à 13 : ateliers de diction et répétitions · Jour 14 : Phase 03 « L’Éloquence » en présentiel.',
      ],
      Icon: Mic2,
    },
  ];
}

export function ParcoursPage() {
  usePageSeo(
    'Le parcours',
    "Les 3 phases et les 6 épreuves du concours UCAEP à l'ENSET de Lokossa : La Plume (en ligne), La Connaissance (en ligne) et L'Éloquence (en présentiel).",
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
  const phase1 = phases.find((p) => p.id === 'phase-1' || p.number === '01');
  const phase2 = phases.find((p) => p.id === 'phase-2' || p.number === '02');
  const phase3 = phases.find((p) => p.id === 'phase-3' || p.number === '03');
  const calendarWeeks = buildCalendarWeeks(
    Boolean(phase1?.isRevealed),
    Boolean(phase2?.isRevealed),
  );

  return (
    <div ref={pageRef} className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Parcours"
        section="3 semaines · 3 phases · 6 épreuves"
        title="Trois phases et six épreuves"
        italicWord="de l'écrit au présentiel."
        subtitle="Les deux premières phases (La Plume et La Connaissance) se déroulent en ligne avec dépôt de textes, contenus explicatifs et prestations vidéo ; la troisième (L'Éloquence) réunit les finalistes en présentiel."
        quickFacts={[
          { label: 'Phases 1 & 2', value: 'En ligne · Vidéo' },
          { label: 'Phase 3', value: 'En présentiel' },
          { label: 'Présentation', value: "Jusqu'à 5 minutes" },
          { label: 'Notation', value: 'Sur 20 points / phase' },
        ]}
      />

      <SectionAnchorRail
        items={[
          { id: 'chapitres', num: '01', label: 'Les 3 phases' },
          { id: 'phase-1-dossier', num: '02', label: 'Phase 1 · La Plume' },
          { id: 'atelier-video', num: '03', label: 'Atelier vidéo 5 min' },
          { id: 'phases-suivantes', num: '04', label: 'Phases 2 & 3' },
          { id: 'calendrier', num: '05', label: 'Calendrier' },
        ]}
      />

      {loading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 space-y-8">
          <div className="h-24 rounded-[2px] bg-ucaep-ivory/30 animate-pulse" />
          <div className="h-96 rounded-[2px] bg-ucaep-ivory/30 animate-pulse" />
        </div>
      ) : (
        <div id="chapitres" className="scroll-mt-20">
          {/* DESKTOP: Horizontal 3-Chapter Progression Rail + Atmospheric Stage */}
          <section className="hidden lg:block py-16 lg:py-20 bg-ucaep-paper">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
              <div
                role="tablist"
                aria-label="Chapitres du parcours"
                className="relative grid grid-cols-3 border-b border-ucaep-brown/18"
              >
                {phases.map((phase, idx) => {
                  const isActive = idx === activeIdx;
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
                            isActive
                              ? 'text-ucaep-gold'
                              : 'text-ucaep-brown/35 group-hover:text-ucaep-gold'
                          }`}
                        >
                          {phase.number}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ucaep-green">
                          {phase.format} · {phase.isRevealed ? 'Consignes visibles' : phase.statusLabel}
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

              {activePhase && (
                <AnimatePresence mode="wait">
                  <motion.article
                    key={activePhase.id}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative overflow-hidden rounded-[2px] border ${activeStyle.border} ${activeStyle.bg} ${activeStyle.text} p-10 lg:p-12 transition-colors`}
                  >
                    <BrandPatternEdge
                      variant={activeStyle.patternVariant}
                      side="right"
                      className="w-3 lg:w-4 opacity-80"
                    />
                    <div className="grid grid-cols-12 gap-12 items-center">
                      <div className="col-span-6">
                        <div className="aspect-4/3 overflow-hidden rounded-[2px] bg-black/15 border border-ucaep-gold/20">
                          <EditorialImage assetKey={activePhase.imageKey} />
                        </div>
                      </div>

                      <div className="col-span-6 space-y-6">
                        <EditorialMark
                          folio={`Chapitre ${activePhase.number}`}
                          label={`${activePhase.format} · ${
                            activePhase.isRevealed
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

                        <div
                          className={`pt-4 border-t ${activeStyle.border} flex items-center justify-between`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                            disabled={activeIdx === 0}
                            className={`group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest disabled:opacity-30 transition-opacity ${activeStyle.heading}`}
                          >
                            <ArrowLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
                            <span>Chapitre précédent</span>
                          </button>
                          <span className={`font-mono text-xs tabular-nums ${activeStyle.muted}`}>
                            0{activeIdx + 1} / 0{phases.length}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveIdx((i) => Math.min(phases.length - 1, i + 1))
                            }
                            disabled={activeIdx === phases.length - 1}
                            className={`group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest disabled:opacity-30 transition-opacity ${activeStyle.heading}`}
                          >
                            <span>Chapitre suivant</span>
                            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                </AnimatePresence>
              )}
            </div>
          </section>

          {/* MOBILE / TABLET: Vertical Chapter Progression */}
          <section className="lg:hidden divide-y divide-ucaep-brown/15">
            {phases.map((phase, idx) => {
              const style = PHASE_ATMOSPHERES[idx % PHASE_ATMOSPHERES.length];
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
                      <span
                        className={`text-xs font-semibold uppercase tracking-widest ${style.muted}`}
                      >
                        {phase.format} · {phase.isRevealed ? 'Consignes visibles' : phase.statusLabel}
                      </span>
                    </div>

                    <div className="aspect-4/3 overflow-hidden rounded-[2px] bg-black/15">
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
        </div>
      )}

      {/* VISIBLE COMPLETE DOSSIER FOR PHASE 1 — LA PLUME */}
      <section
        id="phase-1-dossier"
        className="scroll-mt-20 relative py-20 lg:py-28 bg-[#F4EDE1] paper-grain border-t border-b border-ucaep-brown/14 overflow-hidden"
      >
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
          orbit
          className="hidden lg:block -bottom-24 -right-16 w-64 h-64 opacity-[0.09]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6" data-reveal>
            <div className="space-y-3 max-w-2xl">
              <EditorialMark
                folio="Phase 01 · En ligne"
                label="La Plume · Notée sur 20 points"
                tone="green"
              />
              <div className="overflow-hidden">
                <h2
                  data-mask-title
                  className="font-serif text-4xl sm:text-5xl font-semibold text-ucaep-ink leading-tight"
                >
                  Phase 1 — <em className="italic font-normal text-ucaep-brown">La Plume : textes originaux et vidéo</em>
                </h2>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-ucaep-brown/80 space-y-1 tabular-nums">
              <p className="font-semibold text-ucaep-brown">
                En ligne (Jours 1 à 3) · Textes + interprétation vidéo · Jusqu&apos;à 5 min
              </p>
              <p>Phase qualificative · Double lecture anonyme en Jours 4–5</p>
            </div>
          </div>

          {phase1?.isRevealed ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article
              data-reveal
              data-parallax-card="8"
              className="art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-paper p-8 sm:p-10 space-y-5"
            >
              <Feather
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-8 -right-6 w-44 h-44 text-ucaep-brown opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6"
                strokeWidth={1.15}
              />
              <div className="relative z-10 flex items-baseline justify-between gap-4 border-b border-ucaep-brown/12 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-gold tabular-nums">
                  Épreuve 01 · Texte original + vidéo
                </span>
                <span className="text-xs font-semibold text-ucaep-green tabular-nums">
                  Jusqu&apos;à 5 min de présentation
                </span>
              </div>
              <h3 className="relative z-10 font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                « Je suis… »
              </h3>
              <p className="relative z-10 text-sm sm:text-base text-ucaep-ink/82 leading-relaxed">
                Les candidats produisent un texte original pour se présenter{' '}
                <strong className="font-semibold text-ucaep-brown">
                  au-delà de leur nom, de leur âge ou de leur filière
                </strong>
                , puis l&apos;interprètent en vidéo : parcours, questions, aspirations et regard sur le monde.
              </p>
              <div className="relative z-10 p-4 rounded-[2px] bg-ucaep-linen/75 border border-ucaep-brown/14 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-brown">
                  Axe de réflexion
                </p>
                <p className="font-serif italic text-lg text-ucaep-ink">
                  « Qui suis-je réellement, au-delà de ce que l&apos;on perçoit au premier abord ? »
                </p>
              </div>
              <p className="relative z-10 text-xs text-ucaep-brown/80 leading-relaxed">
                <strong>Formes acceptées :</strong> poème, prose poétique, monologue intérieur, récit autobiographique ou portrait littéraire, interprété en vidéo.
              </p>
            </article>

            <article
              data-reveal
              data-reveal-delay="0.08"
              data-parallax-card="-8"
              className="art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-paper p-8 sm:p-10 space-y-5"
            >
              <MessageSquareQuote
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-8 -right-6 w-44 h-44 text-ucaep-brown opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6"
                strokeWidth={1.15}
              />
              <div className="relative z-10 flex items-baseline justify-between gap-4 border-b border-ucaep-brown/12 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-gold tabular-nums">
                  Épreuve 02 · Texte original + vidéo
                </span>
                <span className="text-xs font-semibold text-ucaep-green tabular-nums">
                  Jusqu&apos;à 5 min de présentation
                </span>
              </div>
              <h3 className="relative z-10 font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                « Les mots que l&apos;on n&apos;ose pas dire »
              </h3>
              <p className="relative z-10 text-sm sm:text-base text-ucaep-ink/82 leading-relaxed">
                Les candidats rédigent un texte original consacré à{' '}
                <strong className="font-semibold text-ucaep-brown">
                  une pensée, une gratitude ou une vérité longtemps tue
                </strong>{' '}
                par pudeur ou retenue, puis en présentent l&apos;interprétation en vidéo.
              </p>
              <div className="relative z-10 p-4 rounded-[2px] bg-ucaep-linen/75 border border-ucaep-brown/14 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-brown">
                  Attentes du jury
                </p>
                <p className="font-serif italic text-lg text-ucaep-ink">
                  Justesse de l&apos;écriture, sincérité du propos, articulation claire et maîtrise du rythme.
                </p>
              </div>
              <p className="relative z-10 text-xs text-ucaep-brown/80 leading-relaxed">
                <strong>Formes acceptées :</strong> lettre non envoyée, monologue, poème ou récit en français (touches de langues nationales possibles).
              </p>
            </article>
          </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article className="art-card relative overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-paper p-8 sm:p-10 space-y-4">
              <div className="flex items-baseline justify-between gap-4 border-b border-ucaep-brown/12 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-gold tabular-nums">
                  Épreuve 01 · Texte original + vidéo
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ucaep-brown/75">
                  <Lock className="w-3.5 h-3.5 text-ucaep-gold" aria-hidden="true" />
                  Masquée
                </span>
              </div>
              <h3 className="font-serif text-3xl font-semibold text-ucaep-brown">
                Sujet dévoilé à l&apos;ouverture de La Plume
              </h3>
              <p className="text-sm sm:text-base text-ucaep-ink/80 leading-relaxed">
                Les consignes et l&apos;intitulé précis de la première épreuve d&apos;écriture et d&apos;interprétation vidéo sont actuellement masqués. Ils seront publiés automatiquement dès l&apos;activation officielle de la Phase 01.
              </p>
            </article>

            <article className="art-card relative overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-paper p-8 sm:p-10 space-y-4">
              <div className="flex items-baseline justify-between gap-4 border-b border-ucaep-brown/12 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-gold tabular-nums">
                  Épreuve 02 · Texte original + vidéo
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ucaep-brown/75">
                  <Lock className="w-3.5 h-3.5 text-ucaep-gold" aria-hidden="true" />
                  Masquée
                </span>
              </div>
              <h3 className="font-serif text-3xl font-semibold text-ucaep-brown">
                Sujet dévoilé à l&apos;ouverture de La Plume
              </h3>
              <p className="text-sm sm:text-base text-ucaep-ink/80 leading-relaxed">
                La seconde épreuve invite également à rédiger une création originale en français et à l&apos;interpréter en vidéo (jusqu&apos;à 5 minutes). Son intitulé exact reste masqué jusqu&apos;au lancement de la phase.
              </p>
            </article>
          </div>
          )}

          <div className="space-y-8">
            <InteractiveRubric phaseId="phase-1" />

            <article
              data-reveal
              data-reveal-delay="0.06"
              className="art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/16 bg-ucaep-green text-ucaep-paper p-7 sm:p-9 space-y-6"
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
                orbit
                className="hidden sm:block absolute -top-12 -right-12 w-36 h-36 opacity-20"
              />
              <Award
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-7 -right-6 w-40 h-40 text-ucaep-gold opacity-[0.1] -rotate-12"
                strokeWidth={1.2}
              />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold">
                    Temps de parole, règles &amp; qualification
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-paper">
                    Modalités pratiques de la Phase 1
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {candidateSession ? (
                    <Link
                      to="/depot"
                      className="btn-tactile group/btn inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c]"
                    >
                      <span>Accéder à mon dossier ({candidateSession.referenceCode})</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/inscription"
                        className="btn-tactile group/btn inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c]"
                      >
                        <span>M&apos;inscrire pour recevoir mon code</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
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
              </div>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-ucaep-ivory/90 leading-relaxed">
                <div className="p-4 rounded-[2px] bg-[#1f3622]/85 border border-ucaep-ivory/15 space-y-1.5">
                  <p className="font-semibold text-ucaep-gold text-xs uppercase tracking-wider">
                    Production &amp; vidéo
                  </p>
                  <p>
                    Les textes originaux sont rédigés en français (touches de langues nationales possibles) et interprétés en vidéo dans la limite de <strong>jusqu&apos;à 5 minutes</strong> par épreuve.
                  </p>
                </div>
                <div className="p-4 rounded-[2px] bg-[#1f3622]/85 border border-ucaep-ivory/15 space-y-1.5">
                  <p className="font-semibold text-ucaep-gold text-xs uppercase tracking-wider">
                    Qualification &amp; attestation
                  </p>
                  <p>
                    La Phase 1 est <strong>qualificative</strong> : les candidats retenus accèdent à La Connaissance (en ligne). Chaque étudiant de l&apos;ENSET inscrit reçoit une attestation officielle.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ATELIER PRATIQUE DU TEXTE À LA VIDÉO (5 MIN) */}
      <section
        id="atelier-video"
        className="scroll-mt-20 relative py-20 lg:py-24 bg-ucaep-paper border-b border-ucaep-brown/14 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
          <div className="space-y-2 max-w-2xl" data-reveal>
            <EditorialMark
              folio="Accompagnement pas à pas"
              label="Du texte à la vidéo · Limite 05:00"
              tone="green"
            />
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-ucaep-ink leading-tight">
              Préparer son brouillon et{' '}
              <em className="italic font-normal text-ucaep-brown">son tournage</em>
            </h2>
          </div>

          <VideoPrepWorkshop />
        </div>
      </section>

      {/* OVERVIEW OF PHASES 2 & 3 */}
      <section
        id="phases-suivantes"
        className="scroll-mt-20 relative py-20 lg:py-24 bg-ucaep-paper paper-fiber border-b border-ucaep-brown/14 overflow-hidden"
      >
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
          orbit
          className="hidden lg:block -top-20 -right-16 w-56 h-56 opacity-[0.08]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
          <div className="space-y-2 max-w-2xl" data-reveal>
            <EditorialMark
              folio="Phases 02 & 03"
              label={
                phase2?.isRevealed || phase3?.isRevealed
                  ? 'Épreuves 03 à 06'
                  : 'Dévoilement progressif'
              }
              tone="brown"
            />
            <div className="overflow-hidden">
              <h2
                data-mask-title
                className="font-serif text-3xl sm:text-5xl font-semibold text-ucaep-ink leading-tight"
              >
                Vulgarisation et scène :{' '}
                <em className="italic font-normal text-ucaep-brown">
                  {phase2?.isRevealed || phase3?.isRevealed
                    ? 'les quatre épreuves suivantes'
                    : 'les prochaines étapes du concours'}
                </em>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PHASE 02 CARD */}
            <article
              data-reveal
              data-parallax-card="8"
              className="art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/15 bg-white p-8 space-y-4"
            >
              <BookOpen
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-6 -right-5 w-40 h-40 text-ucaep-brown opacity-[0.055] -rotate-12 transition-transform duration-500 group-hover:scale-105"
                strokeWidth={1.2}
              />
              <div className="relative z-10 flex items-baseline justify-between gap-4 border-b border-ucaep-brown/12 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-gold tabular-nums">
                  Phase 02 · {phase2?.title || 'La Connaissance'} · En ligne
                </span>
                <span className="text-xs text-ucaep-brown/70 tabular-nums">Qualificative · / 20 pts</span>
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
                    Épreuves 03 &amp; 04 masquées jusqu&apos;au lancement
                  </h3>
                  <p className="relative z-10 text-sm text-ucaep-ink/80 leading-relaxed">
                    La Phase 02 (« La Connaissance ») se déroule en ligne et comprend deux exercices de vulgarisation accompagnés de prestations vidéo (jusqu&apos;à 5 minutes). Pour préserver l&apos;équité entre les candidats, les sujets et consignes détaillées sont masqués jusqu&apos;à l&apos;ouverture officielle.
                  </p>
                  <div className="relative z-10 flex items-start gap-2.5 text-xs text-ucaep-brown/85 p-3.5 rounded-[2px] bg-ucaep-linen/70 border border-ucaep-brown/14 leading-relaxed">
                    <Lock className="w-3.5 h-3.5 text-ucaep-gold shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Consignes masquées · Déblocage prévu au Jour 6 pour les candidats qualifiés de La Plume.
                    </span>
                  </div>
                </>
              )}
            </article>

            {/* PHASE 03 CARD */}
            <article
              data-reveal
              data-reveal-delay="0.08"
              data-parallax-card="-8"
              className="art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/15 bg-white p-8 space-y-4"
            >
              <Mic2
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-6 -right-5 w-40 h-40 text-ucaep-brown opacity-[0.055] -rotate-12 transition-transform duration-500 group-hover:scale-105"
                strokeWidth={1.2}
              />
              <div className="relative z-10 flex items-baseline justify-between gap-4 border-b border-ucaep-brown/12 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-gold tabular-nums">
                  Phase 03 · {phase3?.title || "L'Éloquence"} · En présentiel
                </span>
                <span className="text-xs text-ucaep-brown/70 tabular-nums">Finale J14 · / 20 pts</span>
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
                    Épreuves 05 &amp; 06 masquées jusqu&apos;à la finale
                  </h3>
                  <p className="relative z-10 text-sm text-ucaep-ink/80 leading-relaxed">
                    La Grande Finale en présentiel à l&apos;ENSET de Lokossa réunit les finalistes après deux journées d&apos;ateliers de diction (Jours 12 et 13). Les intitulés et consignes des deux épreuves finales restent masqués jusqu&apos;à leur publication officielle.
                  </p>
                  <div className="relative z-10 flex items-start gap-2.5 text-xs text-ucaep-brown/85 p-3.5 rounded-[2px] bg-ucaep-linen/70 border border-ucaep-brown/14 leading-relaxed">
                    <Lock className="w-3.5 h-3.5 text-ucaep-gold shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Consignes masquées · Phase en présentiel (Jour 14), notée sur 20 points sans élimination en cours de soirée.
                    </span>
                  </div>
                </>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* 3-WEEK CALENDAR CARDS */}
      <section
        id="calendrier"
        className="scroll-mt-20 relative py-20 lg:py-24 bg-ucaep-linen/70 paper-fiber border-b border-ucaep-brown/14 overflow-hidden"
      >
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
          orbit
          className="hidden lg:block absolute -bottom-24 -left-16 w-64 h-64 opacity-[0.07]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
          <div className="space-y-2 max-w-2xl" data-reveal>
            <EditorialMark folio="Organisation" label="Calendrier en 3 semaines" tone="green" />
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-ucaep-ink leading-tight">
              Le rythme <em className="italic font-normal text-ucaep-brown">du concours</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {calendarWeeks.map((week, idx) => {
              const Icon = week.Icon;
              return (
                <article
                  key={week.step}
                  data-reveal
                  data-reveal-delay={String(idx * 0.06)}
                  className="art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/15 bg-ucaep-paper p-7 space-y-4"
                >
                  <Icon
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute -bottom-6 -right-5 w-32 h-32 text-ucaep-brown opacity-[0.055] -rotate-12 transition-transform duration-500 group-hover:scale-105"
                    strokeWidth={1.25}
                  />
                  <div className="relative z-10 flex items-baseline justify-between border-b border-ucaep-brown/12 pb-3">
                    <span className="font-serif text-2xl font-semibold text-ucaep-brown">
                      {week.step}
                    </span>
                    <span className="font-mono text-xs font-semibold text-ucaep-gold tabular-nums inline-flex items-center gap-1.5">
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
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
              Suivre les échéances ou déposer votre candidature
            </h2>
            <p className="text-sm text-ucaep-ink/75">
              Consultez les annonces officielles ou finalisez votre inscription en ligne avant le 20 novembre 2026.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {candidateSession ? (
              <Link
                to="/depot"
                className="btn-tactile group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-[2px] bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] whitespace-nowrap shrink-0"
              >
                <span>Mon espace dépôt</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                {hasOpenDeposits && (
                  <Link
                    to="/depot"
                    className="btn-tactile group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-[2px] bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] whitespace-nowrap shrink-0"
                  >
                    <span>Déposer ma production</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                )}
                <Link
                  to="/inscription"
                  className="btn-tactile group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
                >
                  <span>Je m&apos;inscris</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </>
            )}
            <Link
              to="/annonces"
              className="px-5 py-3 text-sm font-medium rounded-[2px] border border-ucaep-brown/30 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors whitespace-nowrap shrink-0"
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
  const revealed = Boolean(phase.isRevealed && phase.testDetails);

  const title = phase.testDetails?.instructionsTitle || phase.title;
  const theme =
    phase.testDetails?.theme && !phase.testDetails.theme.includes('communiqué uniquement')
      ? phase.testDetails.theme
      : '';
  const instructions =
    phase.testDetails?.instructions &&
    !phase.testDetails.instructions.includes('seront publiés sur la page Annonces')
      ? phase.testDetails.instructions
      : '';
  const note = phase.testDetails?.submissionNote || '';

  return (
    <div className="space-y-4">
      {phase.submissionsOpen && (
        <div
          className={`p-5 ${sealBg} border border-ucaep-gold/60 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-ucaep-gold">
              Dépôts en ligne ouverts
            </p>
            {phase.submissionDeadline && (
              <p className={`text-xs ${mutedColor}`}>
                À déposer avant le {formatFrenchDate(phase.submissionDeadline)}
              </p>
            )}
          </div>
          <Link
            to="/depot"
            className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
          >
            <span>Déposer ma production</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {revealed ? (
        <div className={`p-6 ${sealBg} border border-ucaep-gold/60 rounded-[2px] space-y-2.5`}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ucaep-gold">
            <Unlock className="w-3.5 h-3.5" />
            <span>Consignes ouvertes</span>
          </div>
          <h3 className={`font-serif text-2xl font-semibold ${headingColor}`}>{title}</h3>
          {theme && <p className="text-sm font-medium">{theme}</p>}
          {instructions && <p className="text-sm opacity-90 leading-relaxed">{instructions}</p>}
          {note && <p className={`text-xs pt-1 ${mutedColor}`}>{note}</p>}
        </div>
      ) : (
        <div className={`p-5 ${sealBg} border ${border} rounded-[2px] flex items-start gap-3.5`}>
          <Lock className="w-4 h-4 text-ucaep-gold shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className={`text-sm font-semibold ${headingColor}`}>
              Épreuves et consignes masquées pour le moment
            </p>
            <p className={`text-xs leading-relaxed ${mutedColor}`}>
              Les intitulés exacts des épreuves, les consignes détaillées et les liens de dépôt sont masqués jusqu&apos;à l&apos;ouverture officielle de cette phase par l&apos;équipe organisatrice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
