import { useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { EDITORIAL_EASE } from '../lib/motion';
import { getMediaAsset, type ExtendedMediaKey } from '../lib/images';

interface EditorialImageProps {
  assetKey: ExtendedMediaKey | string;
  altOverride?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Active la révélation photographique progressive (clip-path + mise au point douce) */
  reveal?: boolean;
  /** Ampleur du glissement parallaxe en pixels (0 pour désactiver) */
  parallax?: number;
}

export function EditorialImage({
  assetKey,
  altOverride,
  className = '',
  imgClassName = '',
  priority = false,
  reveal = false,
  parallax = 0,
}: EditorialImageProps) {
  const [hasError, setHasError] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const asset = getMediaAsset(assetKey);
  const alt = altOverride || asset.alt;

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start end', 'end start'],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    mass: 0.4,
  });
  const y = useTransform(
    smooth,
    [0, 1],
    parallax && !shouldReduce ? [-parallax, parallax] : [0, 0],
  );

  if (hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-ucaep-brown/10 text-ucaep-brown p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="font-serif text-xs uppercase tracking-[0.2em] text-ucaep-gold mb-2">
          UCAEP · Archives
        </span>
        <span className="font-serif text-base italic max-w-xs">{asset.caption}</span>
      </div>
    );
  }

  if (!reveal && !parallax) {
    return (
      <img
        src={asset.src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover ${imgClassName} ${className}`}
      />
    );
  }

  return (
    <motion.div
      ref={wrapperRef}
      initial={reveal ? { opacity: 0, clipPath: 'inset(8% 0% 0% 0%)' } : false}
      whileInView={reveal ? { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.7, ease: EDITORIAL_EASE }}
      className="relative w-full h-full overflow-hidden"
    >
      <motion.img
        src={asset.src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setHasError(true)}
        style={parallax ? { y, scale: 1.06 } : undefined}
        initial={reveal ? { scale: 1.08 } : false}
        whileInView={reveal ? { scale: parallax ? 1.06 : 1 } : undefined}
        viewport={{ once: true, amount: 0.14 }}
        transition={{ duration: 0.85, ease: EDITORIAL_EASE }}
        className={`w-full h-full object-cover ${imgClassName} ${className}`}
      />
    </motion.div>
  );
}
