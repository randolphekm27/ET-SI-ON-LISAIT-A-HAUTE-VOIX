import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Clock, Feather } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { BrandPatternCircle, BrandPatternSurface, BrandPatternWave } from './BrandPattern';
import { EDITORIAL_EASE } from '../lib/motion';
import { SCENIC_ASSETS } from '../lib/scenic-assets';

const JOURNEY_GUARANTEES = [
  {
    number: '01',
    kicker: 'Pas de matériel studio',
    title: 'Vous enregistrez simplement depuis chez vous',
    text: 'Pendant les deux phases en ligne, un téléphone portable dans une pièce calme suffit. Le jury note la justesse de vos idées et de votre diction, jamais la qualité d’un montage vidéo.',
    Icon: Clock,
  },
  {
    number: '02',
    kicker: 'Anonymat garanti',
    title: 'Vos copies sont lues sous code UCAEP',
    text: 'Chaque production transmise porte uniquement votre code candidat. Ni votre nom, ni votre filière, ni votre niveau d’études ne sont communiqués aux correcteurs.',
    Icon: Feather,
  },
  {
    number: '03',
    kicker: 'Reconnaissance sur le campus',
    title: 'Une attestation pour chaque participant',
    text: 'Tout étudiant inscrit reçoit une attestation officielle de la Session Théâtre de l’UCAEP et une invitation à la Grande Finale en présentiel à l’ENSET de Lokossa.',
    Icon: Award,
  },
];

/**
 * ANIMATION SIGNATURE 02 — LA LANTERNE ET LA TRANSFORMATION CHROMATIQUE (MOTION)
 *
 * Scène sticky pilotée par Motion (useScroll + useSpring + useTransform) :
 * 1. Entrée latérale fluide de la lanterne depuis la gauche
 * 2. Transformation chromatique coordonnée (#F7E6C8 / #4E2A1E -> #2A140E / #F7E6C8 / #D19A3A)
 * 3. Halo ambré localisé autour de la flamme
 * 4. Immersion stable sur bureau (sticky lg:h-[210vh]) et déroulé naturel sur mobile
 * 5. Sortie progressive vers la section finale
 */
export function LanterneSequence() {
  const trackRef = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 86%', 'end 88%'],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 26,
    mass: 0.5,
  });

  // 1. Transformation chromatique de la scène (#F7E6C8 -> #2A140E)
  const sectionBg = useTransform(
    progress,
    [0.14, 0.44],
    shouldReduce ? ['#F7E6C8', '#F7E6C8'] : ['#F7E6C8', '#2A140E'],
  );
  const sectionBorder = useTransform(
    progress,
    [0.14, 0.44],
    shouldReduce
      ? ['rgba(78, 42, 30, 0.18)', 'rgba(78, 42, 30, 0.18)']
      : ['rgba(78, 42, 30, 0.18)', 'rgba(247, 230, 200, 0.22)'],
  );
  const eyebrowColor = useTransform(
    progress,
    [0.16, 0.42],
    shouldReduce ? ['#8A5810', '#8A5810'] : ['#8A5810', '#D19A3A'],
  );
  const headingColor = useTransform(
    progress,
    [0.16, 0.42],
    shouldReduce ? ['#4E2A1E', '#4E2A1E'] : ['#4E2A1E', '#F7E6C8'],
  );
  const headingItalicColor = useTransform(
    progress,
    [0.16, 0.44],
    shouldReduce ? ['#4E2A1E', '#4E2A1E'] : ['#4E2A1E', '#D19A3A'],
  );
  const dividerColor = useTransform(
    progress,
    [0.16, 0.44],
    shouldReduce
      ? ['rgba(78, 42, 30, 0.18)', 'rgba(78, 42, 30, 0.18)']
      : ['rgba(78, 42, 30, 0.18)', 'rgba(247, 230, 200, 0.2)'],
  );
  const ambientVeilOpacity = useTransform(
    progress,
    [0.2, 0.48],
    shouldReduce ? [0.2, 0.2] : [0, 1],
  );

  // 2. Cartes garanties synchronisées avec l'ambiance lumineuse
  const cardBg = useTransform(
    progress,
    [0.16, 0.45],
    shouldReduce ? ['#FBF9F5', '#FBF9F5'] : ['#FBF9F5', '#3A1D14'],
  );
  const cardBorder = useTransform(
    progress,
    [0.16, 0.45],
    shouldReduce
      ? ['rgba(78, 42, 30, 0.16)', 'rgba(78, 42, 30, 0.16)']
      : ['rgba(78, 42, 30, 0.16)', 'rgba(209, 154, 58, 0.36)'],
  );
  const cardHeaderBorder = useTransform(
    progress,
    [0.16, 0.45],
    shouldReduce
      ? ['rgba(78, 42, 30, 0.12)', 'rgba(78, 42, 30, 0.12)']
      : ['rgba(78, 42, 30, 0.12)', 'rgba(247, 230, 200, 0.16)'],
  );
  const cardKickerColor = useTransform(
    progress,
    [0.18, 0.45],
    shouldReduce ? ['#2E4D32', '#2E4D32'] : ['#2E4D32', '#D19A3A'],
  );
  const cardTitleColor = useTransform(
    progress,
    [0.18, 0.45],
    shouldReduce ? ['#4E2A1E', '#4E2A1E'] : ['#4E2A1E', '#F7E6C8'],
  );
  const cardBodyColor = useTransform(
    progress,
    [0.18, 0.45],
    shouldReduce ? ['#3D2117', '#3D2117'] : ['#3D2117', '#F3EBDD'],
  );
  const cardIconColor = useTransform(
    progress,
    [0.18, 0.45],
    shouldReduce ? ['#4E2A1E', '#4E2A1E'] : ['#4E2A1E', '#D19A3A'],
  );

  // 3. Chorégraphie des objets scénographiques : Palmier + Lanterne + Halo
  const palmierY = useTransform(progress, [0, 0.55, 1], shouldReduce ? [0, 0, 0] : [-14, 10, -14]);
  const palmierRotate = useTransform(
    progress,
    [0, 0.55, 1],
    shouldReduce ? [0, 0, 0] : [-3.5, 2.5, -1],
  );
  const palmierOpacity = useTransform(
    progress,
    [0, 0.5, 0.92],
    shouldReduce ? [0.9, 0.9, 0.9] : [0.95, 0.42, 0.2],
  );

  const lanternX = useTransform(
    progress,
    [0, 0.28, 0.78, 1],
    shouldReduce ? ['0%', '0%', '0%', '0%'] : ['-38%', '0%', '0%', '-24%'],
  );
  const lanternY = useTransform(
    progress,
    [0, 0.28, 1],
    shouldReduce ? [0, 0, 0] : [18, 0, -12],
  );
  const lanternRotate = useTransform(
    progress,
    [0, 0.28, 1],
    shouldReduce ? [0, 0, 0] : [-5, 0, -2],
  );
  const lanternScale = useTransform(
    progress,
    [0, 0.28, 0.8, 1],
    shouldReduce ? [1, 1, 1, 1] : [0.92, 1, 1, 0.95],
  );
  const lanternOpacity = useTransform(
    progress,
    [0, 0.22, 0.8, 1],
    shouldReduce ? [1, 1, 1, 1] : [0.2, 1, 1, 0.3],
  );

  const haloOpacity = useTransform(
    progress,
    [0.24, 0.48, 0.82, 1],
    shouldReduce ? [0.5, 0.5, 0.5, 0.5] : [0, 1, 1, 0.25],
  );
  const haloScale = useTransform(
    progress,
    [0.24, 0.5, 1],
    shouldReduce ? [1, 1, 1] : [0.68, 1.05, 0.9],
  );

  return (
    <div ref={trackRef} className="relative z-30 lg:h-[205vh]">
      <motion.section
        data-scenic-stage
        style={{ backgroundColor: sectionBg, borderColor: sectionBorder }}
        className="relative lg:sticky lg:top-0 min-h-[82vh] lg:min-h-screen pt-24 pb-20 sm:pt-28 lg:py-20 border-y flex items-center overflow-hidden"
      >
        {/* ASSET 04 — PALMIER : Bord supérieur gauche, parallaxe douce */}
        <motion.div
          aria-hidden="true"
          data-scenic-asset="palmier"
          data-scenic-plan={3}
          style={{ y: palmierY, rotate: palmierRotate, opacity: palmierOpacity }}
          className="pointer-events-none select-none z-[20] aspect-[3/4] absolute top-5 sm:top-8 left-3 sm:left-8 lg:left-10 w-36 sm:w-48 lg:w-64"
        >
          <img
            src={SCENIC_ASSETS.palmier.src}
            alt=""
            loading="eager"
            decoding="async"
            className="scenic-object w-full h-full object-contain"
          />
        </motion.div>

        {/* Plan 1 : Texture & motifs géométriques en arrière-plan */}
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <BrandPatternSurface
            variant="brown"
            tileWidth={200}
            opacityClass="opacity-[0.04]"
            blendMultiply
          />
          {/* Voile chaud progressif lors de la phase sombre */}
          <motion.div
            aria-hidden="true"
            style={{ opacity: ambientVeilOpacity }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_52%,rgba(209,154,58,0.16)_0%,rgba(42,20,14,0)_64%)]"
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
        <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 space-y-10 lg:space-y-12">
          {/* En-tête éditorial */}
          <motion.div
            style={{ borderColor: dividerColor }}
            className="border-b pb-7 sm:pl-44 lg:pl-56 flex flex-col sm:flex-row sm:items-end justify-between gap-6"
          >
            <div className="space-y-2.5 max-w-2xl">
              <motion.p
                style={{ color: eyebrowColor }}
                className="text-[11px] font-semibold uppercase tracking-[0.22em]"
              >
                Ce qui rend ce parcours accessible
              </motion.p>
              <motion.h2
                style={{ color: headingColor }}
                className="font-serif text-4xl sm:text-5xl font-semibold leading-tight"
              >
                Des conditions simples{' '}
                <motion.em
                  style={{ color: headingItalicColor }}
                  className="italic font-normal"
                >
                  et équitables pour chacun
                </motion.em>
              </motion.h2>
            </div>
            <motion.div style={{ color: headingColor }}>
              <Link
                to="/concours"
                className="group inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
              >
                <span className="editorial-underline">
                  Comprendre le règlement et les objectifs
                </span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Composition asymétrique : Plan 3 Lanterne à gauche | Plan 2 Cartes à droite */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Colonne gauche dédiée à la Lanterne + Halo ambré localisé */}
            <div className="lg:col-span-4 flex items-center justify-center">
              <motion.div
                style={{
                  x: lanternX,
                  y: lanternY,
                  rotate: lanternRotate,
                  scale: lanternScale,
                  opacity: lanternOpacity,
                }}
                className="relative w-44 sm:w-60 lg:w-72 aspect-[2/3] mx-auto select-none pointer-events-none"
              >
                {/* Halo ambré centré sur le cœur de la flamme */}
                <motion.div
                  aria-hidden="true"
                  style={{
                    opacity: haloOpacity,
                    scale: haloScale,
                    background:
                      'radial-gradient(circle, rgba(244, 186, 82, 0.48) 0%, rgba(209, 154, 58, 0.2) 44%, rgba(209, 154, 58, 0) 74%)',
                  }}
                  className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square rounded-full pointer-events-none"
                >
                  <div className="animate-lantern-flicker w-full h-full rounded-full bg-[radial-gradient(circle,rgba(255,214,132,0.38)_0%,transparent_58%)]" />
                </motion.div>

                <img
                  src={SCENIC_ASSETS.lanterne.src}
                  alt={SCENIC_ASSETS.lanterne.alt}
                  loading="eager"
                  decoding="async"
                  className="scenic-object relative z-10 w-full h-auto object-contain"
                />
              </motion.div>
            </div>

            {/* Colonne droite : Les 3 cartes garanties */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-5">
              {JOURNEY_GUARANTEES.map((item, idx) => {
                const Icon = item.Icon;
                return (
                  <motion.div
                    key={item.number}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.16 }}
                    transition={{
                      duration: 0.5,
                      delay: idx * 0.08,
                      ease: EDITORIAL_EASE,
                    }}
                    className="h-full"
                  >
                    <motion.article
                      style={{
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                      }}
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
                      className="art-card group relative h-full overflow-hidden rounded-[2px] border p-6 space-y-3"
                    >
                      <motion.div
                        style={{ color: cardIconColor }}
                        aria-hidden="true"
                        className="pointer-events-none select-none absolute -bottom-5 -right-5 opacity-[0.09] -rotate-12 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6"
                      >
                        <Icon className="w-28 h-28" strokeWidth={1.3} />
                      </motion.div>
                      <motion.div
                        style={{ borderColor: cardHeaderBorder }}
                        className="relative z-10 flex items-baseline justify-between border-b pb-2.5"
                      >
                        <span className="font-serif text-3xl font-semibold text-[#D19A3A] tabular-nums leading-none">
                          {item.number}
                        </span>
                        <motion.span
                          style={{ color: cardKickerColor }}
                          className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                        >
                          {item.kicker}
                        </motion.span>
                      </motion.div>
                      <motion.h3
                        style={{ color: cardTitleColor }}
                        className="relative z-10 font-serif text-xl font-semibold leading-snug"
                      >
                        {item.title}
                      </motion.h3>
                      <motion.p
                        style={{ color: cardBodyColor }}
                        className="relative z-10 text-sm leading-relaxed"
                      >
                        {item.text}
                      </motion.p>
                    </motion.article>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
