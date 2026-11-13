import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, Unlock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EditorialImage } from '../components/EditorialImage';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { fetchApiJson } from '../lib/api';
import { usePageSeo } from '../lib/format';
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
  },
];

export function ParcoursPage() {
  usePageSeo(
    'Le parcours',
    "Voici comment le concours va se dérouler en trois phases : La Plume, La Connaissance et L'Éloquence.",
  );

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

  return (
    <div ref={pageRef} className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Itinéraire"
        section="Le parcours"
        title="Voici comment"
        italicWord="on va avancer."
        subtitle="Le concours se déroule en trois temps. Pour que tout le monde ait les mêmes chances, nous gardons les sujets et les consignes confidentiels jusqu'au lancement de chaque phase."
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
                          {phase.format} · {phase.statusLabel}
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
                    className={`rounded-sm border ${activeStyle.border} ${activeStyle.bg} ${activeStyle.text} p-10 lg:p-12 transition-colors`}
                  >
                    <div className="grid grid-cols-12 gap-12 items-center">
                      <div className="col-span-6">
                        <div className="aspect-4/3 overflow-hidden rounded-sm bg-black/15">
                          <EditorialImage assetKey={activePhase.imageKey} />
                        </div>
                      </div>

                      <div className="col-span-6 space-y-6">
                        <EditorialMark
                          folio={`Chapitre ${activePhase.number}`}
                          label={`${activePhase.format} · ${activePhase.statusLabel}`}
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
                        {phase.format} · {phase.statusLabel}
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

      {/* Closing strip */}
      <section className="py-16 bg-ucaep-linen/75 border-t border-ucaep-brown/14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
              Envie de suivre la suite ?
            </h2>
            <p className="text-sm text-ucaep-ink/75">
              Revenez sur les annonces de temps en temps ou inscrivez-vous dès maintenant.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/annonces"
              className="px-5 py-3 text-sm font-medium rounded-sm border border-ucaep-brown/30 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors whitespace-nowrap shrink-0"
            >
              Voir les annonces
            </Link>
            <Link
              to="/inscription"
              className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Je m&apos;inscris</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
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
  if (phase.isRevealed && phase.testDetails) {
    return (
      <div className={`p-6 ${sealBg} border border-ucaep-gold/60 rounded-sm space-y-2.5`}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ucaep-gold">
          <Unlock className="w-3.5 h-3.5" />
          <span>Consignes disponibles</span>
        </div>
        <h3 className={`font-serif text-2xl font-semibold ${headingColor}`}>
          {phase.testDetails.instructionsTitle}
        </h3>
        <p className="text-sm font-medium">Thème : {phase.testDetails.theme}</p>
        <p className="text-sm opacity-90 leading-relaxed">
          {phase.testDetails.instructions}
        </p>
        <p className={`text-xs pt-1 ${mutedColor}`}>{phase.testDetails.submissionNote}</p>
      </div>
    );
  }

  return (
    <div className={`p-5 ${sealBg} border ${border} rounded-sm flex items-start gap-3.5`}>
      <Lock className="w-4 h-4 text-ucaep-gold shrink-0 mt-0.5" aria-hidden="true" />
      <div className="space-y-1">
        <p className={`text-sm font-semibold ${headingColor}`}>
          Chapitre scellé · On vous dévoile la suite bientôt
        </p>
        <p className={`text-xs leading-relaxed ${mutedColor}`}>
          Cette information sera bientôt disponible sur la page Annonces.
        </p>
      </div>
    </div>
  );
}
