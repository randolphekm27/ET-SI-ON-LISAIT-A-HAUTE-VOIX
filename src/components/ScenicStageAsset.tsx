import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { SCENIC_ASSETS, type ScenicAssetKey } from '../lib/scenic-assets';

export type ScenicMotionKind =
  | 'monstera'
  | 'palmier'
  | 'hibiscus'
  | 'tamtam'
  | 'livres';

const PLAN_Z_CLASSES: Record<1 | 2 | 3 | 4, string> = {
  1: 'z-[1]',
  2: 'z-[10]',
  3: 'z-[20]',
  4: 'z-[30]',
};

interface ScenicStageAssetProps {
  assetKey: ScenicAssetKey;
  /** Plan visuel strict (1 = fond, 2 = contenu, 3 = objet scénographique, 4 = masque) */
  plan?: 1 | 2 | 3 | 4;
  /** Mouvement parallaxe Motion piloté par le défilement */
  motionId?: ScenicMotionKind;
  /** Retourne horizontalement l'illustration pour l'orienter vers l'intérieur de la composition */
  flipX?: boolean;
  /** Classes de positionnement et de gabarit max relatives à la section hôte */
  className?: string;
  /** Classes appliquées directement à l'image (rotation initiale, opacité, etc.) */
  imgClassName?: string;
  priority?: boolean;
}

const MOTION_PRESETS: Record<
  ScenicMotionKind,
  {
    x: [number, number];
    y: [number, number];
    rotate: [number, number];
    opacity: [number, number];
  }
> = {
  monstera: { x: [-10, 24], y: [8, -12], rotate: [-2, 3], opacity: [0.9, 1] },
  palmier: { x: [0, 0], y: [12, -16], rotate: [-2.5, 2.5], opacity: [0.95, 0.7] },
  hibiscus: { x: [0, 0], y: [10, -14], rotate: [-2, 2.5], opacity: [0.95, 1] },
  tamtam: { x: [26, 0], y: [10, -4], rotate: [2, 0], opacity: [0.55, 1] },
  livres: { x: [0, 0], y: [16, -20], rotate: [-1.5, 1.5], opacity: [0.95, 1] },
};

/**
 * Conteneur Motion pour les assets PNG scénographiques.
 * Garantit : aspect-ratio intact, object-fit: contain, z-index documenté,
 * parallaxe fluide accélérée GPU et respect de prefers-reduced-motion.
 */
export function ScenicStageAsset({
  assetKey,
  plan = 3,
  motionId,
  flipX = false,
  className = '',
  imgClassName = '',
  priority = false,
}: ScenicStageAssetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const meta = SCENIC_ASSETS[assetKey];
  const planClass = PLAN_Z_CLASSES[plan];

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 28,
    mass: 0.45,
  });

  const preset = motionId ? MOTION_PRESETS[motionId] : null;
  const x = useTransform(
    smooth,
    [0, 1],
    preset && !shouldReduce ? preset.x : [0, 0],
  );
  const y = useTransform(
    smooth,
    [0, 1],
    preset && !shouldReduce ? preset.y : [0, 0],
  );
  const rotate = useTransform(
    smooth,
    [0, 1],
    preset && !shouldReduce ? preset.rotate : [0, 0],
  );
  const opacity = useTransform(
    smooth,
    [0, 0.55],
    preset && !shouldReduce ? preset.opacity : [1, 1],
  );

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      data-scenic-asset={assetKey}
      data-scenic-plan={plan}
      style={preset ? { x, y, rotate, opacity } : undefined}
      className={`pointer-events-none select-none ${planClass} ${meta.aspect} ${className}`}
    >
      <div className={`w-full h-full ${flipX ? '-scale-x-100' : ''}`}>
        <img
          src={meta.src}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`scenic-object w-full h-full object-contain ${imgClassName}`}
        />
      </div>
    </motion.div>
  );
}
