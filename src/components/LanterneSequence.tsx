import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Clock, Feather } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BrandPatternCircle, BrandPatternSurface, BrandPatternWave } from './BrandPattern';
import { ScenicStageAsset } from './ScenicStageAsset';
import { prefersReducedMotion } from '../lib/motion';
import { SCENIC_ASSETS } from '../lib/scenic-assets';

gsap.registerPlugin(ScrollTrigger);

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

/**
 * ANIMATION SIGNATURE 02 — LA LANTERNE ET LA TRANSFORMATION CHROMATIQUE
 *
 * Timeline GSAP ScrollTrigger unifiée synchronisant en 5 phases :
 * 1. Entrée latérale de la lanterne depuis la gauche
 * 2. Transformation chromatique coordonnée (#F7E6C8 / #4E2A1E -> #2A140E / #F7E6C8 / #D19A3A)
 * 3. Halo ambré localisé autour de la flamme
 * 4. Immersion stable
 * 5. Sortie progressive de la lanterne vers la gauche
 */
export function LanterneSequence() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      const buildTimeline = (isDesktop: boolean) => {
        const tl = gsap.timeline({
          scrollTrigger: isDesktop
            ? {
                trigger: section,
                start: 'top top',
                end: '+=1600',
                pin: true,
                scrub: 0.75,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              }
            : {
                trigger: section,
                start: 'top 76%',
                end: 'bottom 35%',
                scrub: 0.7,
                invalidateOnRefresh: true,
              },
        });

        // PHASE 0/1 — ENTRÉE SUBTILE DU PALMIER + ENTRÉE DE LA LANTERNE
        tl.fromTo(
          '.lantern-palmier',
          { y: -12, rotate: -3, opacity: 0.94 },
          {
            y: 10,
            rotate: 2,
            opacity: 0.32,
            duration: 0.45,
            ease: 'sine.inOut',
          },
          0,
        );

        // PHASE 1 — ENTRÉE DE LA LANTERNE (0.00 -> 0.26)
        tl.fromTo(
          '.lantern-carrier',
          {
            xPercent: isDesktop ? -115 : -35,
            y: isDesktop ? 16 : 10,
            opacity: 0,
            scale: 0.94,
          },
          {
            xPercent: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.26,
            ease: 'power2.out',
          },
          0,
        );

        // PHASE 2 — TRANSFORMATION CHROMATIQUE SYNCHRONISÉE (0.14 -> 0.56)
        tl.to(
          section,
          {
            backgroundColor: '#2A140E',
            borderColor: 'rgba(247, 230, 200, 0.22)',
            duration: 0.42,
            ease: 'none',
          },
          0.14,
        )
          .to(
            '.lantern-eyebrow',
            {
              color: '#D19A3A',
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-heading',
            {
              color: '#F7E6C8',
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-heading-italic',
            {
              color: '#D19A3A',
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-cta-link',
            {
              color: '#F7E6C8',
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-divider',
            {
              borderColor: 'rgba(247, 230, 200, 0.2)',
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-card',
            {
              backgroundColor: '#3A1D14',
              borderColor: 'rgba(209, 154, 58, 0.34)',
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-card-header',
            {
              borderColor: 'rgba(247, 230, 200, 0.16)',
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-card-kicker',
            {
              color: '#D19A3A',
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-card-title',
            {
              color: '#F7E6C8',
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-card-body',
            {
              color: '#F3EBDD',
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-card-icon',
            {
              color: '#D19A3A',
              opacity: 0.11,
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          )
          .to(
            '.lantern-ambient-veil',
            {
              opacity: 1,
              duration: 0.42,
              ease: 'none',
            },
            0.14,
          );

        // PHASE 3 — LUMIÈRE LOCALISÉE AUTOUR DE LA FLAMME (0.42 -> 0.68)
        tl.fromTo(
          '.lantern-halo',
          { opacity: 0, scale: 0.72 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.26,
            ease: 'power2.out',
          },
          0.42,
        );

        // PHASE 4 — IMMERSION MAINTENUE (0.68 -> 0.86)
        tl.to({}, { duration: 0.18 }, 0.68);

        // PHASE 5 — SORTIE PROGRESSIVE DE LA LANTERNE ET DU PALMIER (0.86 -> 1.00)
        tl.to(
          '.lantern-palmier',
          {
            y: -16,
            rotate: -1,
            opacity: 0.16,
            duration: 0.14,
            ease: 'power1.out',
          },
          0.86,
        );

        if (isDesktop) {
          tl.to(
            '.lantern-carrier',
            {
              xPercent: -48,
              opacity: 0.2,
              duration: 0.14,
              ease: 'power1.in',
            },
            0.86,
          ).to(
            '.lantern-halo',
            {
              opacity: 0.2,
              duration: 0.14,
              ease: 'power1.in',
            },
            0.86,
          );
        }
      };

      mm.add('(min-width: 1024px)', () => {
        buildTimeline(true);
      });

      mm.add('(max-width: 1023px)', () => {
        buildTimeline(false);
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-scenic-stage
      style={{ backgroundColor: '#F7E6C8' }}
      className="relative z-30 min-h-[78vh] lg:min-h-screen pt-28 pb-20 sm:pt-32 lg:pt-32 lg:pb-24 border-y border-[#4E2A1E]/18 flex items-center overflow-hidden"
    >
      {/* ASSET 04 — PALMIER : Bord supérieur gauche, fronde orientée vers l'intérieur, zéro coupure */}
      <ScenicStageAsset
        assetKey="palmier"
        plan={3}
        className="lantern-palmier absolute top-6 sm:top-8 left-4 sm:left-8 lg:left-10 w-36 sm:w-48 lg:w-64 opacity-95"
      />

      {/* Plan 1 : Texture & motifs géométriques en arrière-plan */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <BrandPatternSurface
          variant="brown"
          tileWidth={200}
          opacityClass="opacity-[0.04]"
          blendMultiply
        />
        {/* Voile chaud progressif lors de la phase sombre */}
        <div
          aria-hidden="true"
          className="lantern-ambient-veil opacity-0 absolute inset-0 bg-[radial-gradient(ellipse_at_24%_52%,rgba(209,154,58,0.14)_0%,rgba(42,20,14,0)_62%)]"
        />
        <BrandPatternCircle
          variant="gold"
          tileWidth={130}
          doubleRing
          orbit
          className="hidden lg:block -top-20 -right-16 w-56 h-56 opacity-[0.14]"
        />
        <BrandPatternWave
          variant="gold"
          tileWidth={175}
          opacity={0.14}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-20"
        />
      </div>

      {/* Plan 2 & Plan 3 : Scène unifiée Lanterne (gauche) + Cartes garanties (droite) */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 space-y-12">
        {/* En-tête éditorial (marge gauche dédiée sur sm+ pour laisser respirer la fronde) */}
        <div className="lantern-divider border-b border-[#4E2A1E]/18 pb-7 sm:pl-44 lg:pl-56 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <p className="lantern-eyebrow text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A5810]">
              Esprit du concours
            </p>
            <h2 className="lantern-heading font-serif text-4xl sm:text-5xl font-semibold text-[#4E2A1E] leading-tight">
              Une aventure ouverte{' '}
              <em className="lantern-heading-italic italic font-normal text-[#4E2A1E]">
                et bienveillante
              </em>
            </h2>
          </div>
          <Link
            to="/concours"
            className="lantern-cta-link group inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E] hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
          >
            <span className="editorial-underline">Lire le dossier complet</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Composition asymétrique : Plan 3 Lanterne à gauche | Plan 2 Cartes à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Colonne gauche dédiée à la Lanterne + Halo ambré localisé */}
          <div className="lg:col-span-4 flex items-center justify-center">
            <div className="lantern-carrier relative w-48 sm:w-60 lg:w-72 aspect-[2/3] mx-auto select-none pointer-events-none">
              {/* Halo ambré très subtil centré sur le cœur de la flamme */}
              <div
                aria-hidden="true"
                className="lantern-halo opacity-0 motion-reduce:opacity-90 absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(244, 186, 82, 0.42) 0%, rgba(209, 154, 58, 0.16) 42%, rgba(209, 154, 58, 0) 72%)',
                }}
              >
                <div className="animate-lantern-flicker w-full h-full rounded-full bg-[radial-gradient(circle,rgba(255,214,132,0.34)_0%,transparent_55%)]" />
              </div>

              <img
                src={SCENIC_ASSETS.lanterne.src}
                alt={SCENIC_ASSETS.lanterne.alt}
                loading="lazy"
                className="scenic-object relative z-10 w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Colonne droite : Les 3 cartes garanties lisibles en permanence */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {JOURNEY_GUARANTEES.map((item) => {
              const Icon = item.Icon;
              return (
                <article
                  key={item.number}
                  style={{
                    backgroundColor: '#FBF9F5',
                    borderColor: 'rgba(78, 42, 30, 0.16)',
                  }}
                  className="lantern-card art-card group relative overflow-hidden rounded-[2px] border p-6 space-y-3"
                >
                  <Icon
                    aria-hidden="true"
                    className="lantern-card-icon pointer-events-none select-none absolute -bottom-5 -right-5 w-28 h-28 text-[#4E2A1E] opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6"
                    strokeWidth={1.3}
                  />
                  <div className="lantern-card-header relative z-10 flex items-baseline justify-between border-b border-[#4E2A1E]/12 pb-2.5">
                    <span className="font-serif text-3xl font-semibold text-[#D19A3A] tabular-nums leading-none">
                      {item.number}
                    </span>
                    <span className="lantern-card-kicker text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2E4D32]">
                      {item.kicker}
                    </span>
                  </div>
                  <h3 className="lantern-card-title relative z-10 font-serif text-xl font-semibold text-[#4E2A1E] leading-snug">
                    {item.title}
                  </h3>
                  <p className="lantern-card-body relative z-10 text-sm text-[#3D2117] leading-relaxed">
                    {item.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
