import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Unlock } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EditorialImage } from '../components/EditorialImage';
import { fetchApiJson } from '../lib/api';
import { usePageSeo } from '../lib/format';
import type { CompetitionPhase } from '../types/competition';

gsap.registerPlugin(ScrollTrigger);

export function ParcoursPage() {
  usePageSeo(
    'Le parcours',
    "Les trois phases progressives du concours : La Plume, La Connaissance et L'Éloquence.",
  );

  const [phases, setPhases] = useState<CompetitionPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!phases.length) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.from('.timeline-chapter', {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.16,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: timelineRef.current,
          start: 'top 80%',
          once: true,
        },
      });
    }, timelineRef);

    return () => ctx.revert();
  }, [phases]);

  return (
    <div className="bg-[#FBF9F5]">
      <section className="py-16 lg:py-24 border-b border-[#4E2A1E]/12 paper-grain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
            Le parcours
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#4E2A1E] max-w-3xl leading-[1.06]">
            Trois chapitres, révélés étape par étape.
          </h1>
          <p className="text-base sm:text-lg text-[#1A1A1A]/80 max-w-2xl leading-relaxed">
            Les épreuves, thèmes et consignes détaillées restent confidentiels jusqu&apos;à
            leur publication officielle par l&apos;UCAEP.
          </p>
        </div>
      </section>

      <section ref={timelineRef} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-12">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-72 rounded-sm bg-[#F7E6C8]/30 animate-pulse border border-[#4E2A1E]/10"
                />
              ))}
            </div>
          ) : (
            <div className="relative space-y-16 lg:space-y-24">
              {phases.map((phase, idx) => {
                const isEven = idx % 2 === 1;
                return (
                  <article
                    key={phase.id}
                    className="timeline-chapter grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
                  >
                    <div
                      className={`lg:col-span-6 ${
                        isEven ? 'lg:order-2' : 'lg:order-1'
                      }`}
                    >
                      <div className="aspect-[4/3] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
                        <EditorialImage assetKey={phase.imageKey} />
                      </div>
                    </div>

                    <div
                      className={`lg:col-span-6 space-y-5 ${
                        isEven ? 'lg:order-1' : 'lg:order-2'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-xs font-medium text-[#4E2A1E]/75 tabular-nums">
                        <span>Phase {phase.number}</span>
                        <span aria-hidden="true">·</span>
                        <span>{phase.format}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#2E4D32] font-semibold">
                          {phase.statusLabel}
                        </span>
                      </div>

                      <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#1A1A1A]">
                        <span className="tabular-nums text-[#D19A3A] mr-2">
                          {phase.number}.
                        </span>
                        {phase.title}
                      </h2>

                      <p className="text-base text-[#1A1A1A]/80 leading-relaxed max-w-xl">
                        {phase.shortDescription}
                      </p>

                      {phase.isRevealed && phase.testDetails ? (
                        <div className="p-6 bg-[#F7E6C8]/45 border border-[#D19A3A]/50 rounded-sm space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2E4D32]">
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Épreuve publiée</span>
                          </div>
                          <h3 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
                            {phase.testDetails.instructionsTitle}
                          </h3>
                          <p className="text-sm font-medium text-[#1A1A1A]">
                            Thème : {phase.testDetails.theme}
                          </p>
                          <p className="text-sm text-[#1A1A1A]/80 leading-relaxed">
                            {phase.testDetails.instructions}
                          </p>
                          <p className="text-xs text-[#4E2A1E]/75 pt-1">
                            {phase.testDetails.submissionNote}
                          </p>
                        </div>
                      ) : (
                        <div className="p-5 bg-[#F7E6C8]/25 border border-[#4E2A1E]/15 rounded-sm flex items-start gap-3.5">
                          <Lock
                            className="w-4 h-4 text-[#4E2A1E]/65 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[#4E2A1E]">
                              Détails de l&apos;épreuve non encore dévoilés
                            </p>
                            <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
                              L&apos;intitulé et les consignes seront publiés sur la page
                              Annonces selon le calendrier officiel.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-[#F7E6C8]/35 border-t border-[#4E2A1E]/12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#4E2A1E]">
              Suivre les prochaines révélations
            </h2>
            <p className="text-sm text-[#1A1A1A]/75">
              Consultez les annonces officielles ou déposez dès maintenant votre
              candidature.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/annonces"
              className="px-5 py-3 text-sm font-medium rounded-sm border border-[#4E2A1E]/30 text-[#4E2A1E] hover:bg-[#4E2A1E]/5 transition-colors whitespace-nowrap shrink-0"
            >
              Voir les annonces
            </Link>
            <Link
              to="/inscription"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors whitespace-nowrap shrink-0"
            >
              <span>S&apos;inscrire</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
