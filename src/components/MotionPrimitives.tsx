import { useId, useRef, type ReactNode } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  EDITORIAL_EASE,
  EDITORIAL_SPRING,
  EDITORIAL_VIEWPORT,
} from '../lib/motion';

/* ============================================================================
   1. RÉVÉLATIONS ÉDITORIALES AU DÉFILEMENT
   ============================================================================ */

interface EditorialRevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

/**
 * Apparition progressive maîtrisée d'un bloc éditorial à l'entrée dans le champ de vision.
 */
export function EditorialReveal({
  children,
  delay = 0,
  y = 18,
  className = '',
}: EditorialRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={EDITORIAL_VIEWPORT}
      transition={{
        duration: 0.56,
        delay,
        ease: EDITORIAL_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface EditorialTitleRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Révélation typographique masquée : le titre glisse hors d'une ligne d'horizon nette.
 */
export function EditorialTitleReveal({
  children,
  delay = 0,
  className = '',
}: EditorialTitleRevealProps) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        initial={{ y: '102%', opacity: 0 }}
        whileInView={{ y: '0%', opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{
          duration: 0.64,
          delay,
          ease: EDITORIAL_EASE,
        }}
        className="block"
      >
        {children}
      </motion.span>
    </span>
  );
}

/**
 * Filet séparateur horizontal dessiné de gauche à droite au défilement.
 */
export function EditorialHairline({
  className = '',
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.68, delay, ease: EDITORIAL_EASE }}
      className={`origin-left ${className}`}
    />
  );
}

/* ============================================================================
   2. RÉVÉLATION PHOTOGRAPHIQUE & PROFONDEUR PARALLAXE
   ============================================================================ */

interface PhotographicPlateProps {
  children: ReactNode;
  className?: string;
  parallaxAmount?: number;
  delay?: number;
  immediate?: boolean;
}

/**
 * Cadre photographique éditorial : rideau clip-path + mise au point douce +
 * parallaxe verticale discrète synchronisée au défilement.
 */
export function PhotographicPlate({
  children,
  className = '',
  parallaxAmount = 14,
  delay = 0,
  immediate = false,
}: PhotographicPlateProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    mass: 0.4,
  });

  const y = useTransform(
    smoothProgress,
    [0, 1],
    shouldReduce ? [0, 0] : [-parallaxAmount, parallaxAmount],
  );

  return (
    <motion.div
      ref={frameRef}
      initial={
        immediate
          ? { opacity: 0, clipPath: 'inset(8% 0% 0% 0%)' }
          : { opacity: 0, clipPath: 'inset(10% 0% 0% 0%)' }
      }
      {...(immediate
        ? { animate: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' } }
        : {
            whileInView: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' },
            viewport: { once: true, amount: 0.16 },
          })}
      transition={{ duration: 0.72, delay, ease: EDITORIAL_EASE }}
      className={`overflow-hidden ${className}`}
    >
      <motion.div
        style={{ y }}
        initial={{ scale: 1.05 }}
        {...(immediate
          ? { animate: { scale: 1.02 } }
          : {
              whileInView: { scale: 1.02 },
              viewport: { once: true, amount: 0.16 },
            })}
        transition={{ duration: 0.85, delay, ease: EDITORIAL_EASE }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ============================================================================
   3. PROFONDEUR DE CARTE AU DÉFILEMENT (ASYNCHRONE / SUBTIL)
   ============================================================================ */

interface ParallaxDepthCardProps {
  children: ReactNode;
  offset?: number;
  delay?: number;
  className?: string;
}

/**
 * Associe apparition décalée et léger glissement de profondeur au scroll
 * pour créer un rythme asymétrique entre colonnes voisines.
 */
export function ParallaxDepthCard({
  children,
  offset = 8,
  delay = 0,
  className = '',
}: ParallaxDepthCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduce ? [0, 0] : [offset, -offset],
  );

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={EDITORIAL_VIEWPORT}
      transition={{ duration: 0.56, delay, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================================
   4. PROGRESSION NARRATIVE DES 3 PHASES (ÉCRITURE -> CONNAISSANCE -> ÉLOQUENCE)
   ============================================================================ */

interface PhaseArcStep {
  number: string;
  title: string;
  verb: string;
  format: string;
}

const DEFAULT_PHASE_ARC: PhaseArcStep[] = [
  {
    number: '01',
    title: 'La Plume',
    verb: 'Écrire & lire',
    format: 'En ligne',
  },
  {
    number: '02',
    title: 'La Connaissance',
    verb: 'Expliquer & argumenter',
    format: 'En ligne',
  },
  {
    number: '03',
    title: "L'Éloquence",
    verb: 'Convaincre sur scène',
    format: 'En présentiel',
  },
];

/**
 * Ruban de continuité narrative illustrant la montée en puissance des 3 phases :
 * de l'écriture intime à la transmission du savoir, jusqu'à la scène finale.
 */
export function ThreePhaseNarrativeArc({
  activeStepIndex = 0,
  steps = DEFAULT_PHASE_ARC,
  className = '',
}: {
  activeStepIndex?: number;
  steps?: PhaseArcStep[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 88%', 'center 52%'],
  });
  const lineScale = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 32,
  });

  return (
    <div
      ref={containerRef}
      className={`relative rounded-[2px] border border-ucaep-brown/14 bg-white/80 paper-grain p-5 sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-ucaep-brown/12">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
          Fil conducteur du concours
        </span>
        <span className="text-xs text-ucaep-brown/75 font-serif italic">
          De la feuille écrite à la prise de parole en public
        </span>
      </div>

      <div className="relative pt-5">
        {/* Ligne de continuité animée au défilement */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-[33px] left-6 right-6 h-px bg-ucaep-brown/14 overflow-hidden"
        >
          <motion.div
            style={{ scaleX: shouldReduce ? 1 : lineScale }}
            className="h-full w-full bg-ucaep-gold origin-left"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          {steps.map((step, idx) => {
            const isHighlighted = idx <= activeStepIndex;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.08,
                  ease: EDITORIAL_EASE,
                }}
                className="flex md:flex-col items-start gap-3 md:gap-2"
              >
                <div
                  className={`w-7 h-7 rounded-full border flex items-center justify-center font-mono text-[11px] font-bold shrink-0 tabular-nums transition-colors ${
                    isHighlighted
                      ? 'bg-ucaep-brown text-ucaep-gold border-ucaep-brown'
                      : 'bg-ucaep-paper text-ucaep-brown border-ucaep-gold/60'
                  }`}
                >
                  {step.number}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ucaep-gold">
                    {step.verb} · {step.format}
                  </p>
                  <p className="font-serif text-xl font-semibold text-ucaep-brown">
                    {step.title}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   5. ACCORDÉONS ET CONTENUS DÉPLIABLES (FAQ, NOTES, DÉTAILS)
   ============================================================================ */

export function EditorialExpandable({
  isOpen,
  children,
  className = '',
}: {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="expandable"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
          style={{ overflow: 'hidden' }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================================
   6. INDICATEUR D'ONGLET PARTAGÉ (SCOPE UNIQUE PAR COMPOSANT)
   ============================================================================ */

export function EditorialTabPill({
  groupId,
  className = '',
}: {
  groupId?: string;
  className?: string;
}) {
  const autoId = useId();
  const id = groupId || `tab-pill-${autoId}`;
  return (
    <motion.span
      layoutId={id}
      aria-hidden="true"
      transition={EDITORIAL_SPRING}
      className={className}
    />
  );
}
