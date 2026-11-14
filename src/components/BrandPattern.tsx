import { useId } from 'react';

export type PatternVariant = 'obsidian' | 'brown' | 'green' | 'gold';

const PATTERN_SRC: Record<PatternVariant, string> = {
  obsidian: '/assets/aistudio/Pattern_1_bd340c5f.png',
  brown: '/assets/aistudio/Pattern_2_077a95dc.png',
  green: '/assets/aistudio/Pattern_3_3e0fa047.png',
  gold: '/assets/aistudio/Pattern_4_9c3a93fd.png',
};

export function BrandPatternBand({
  variant = 'gold',
  className = '',
  tileWidth = 170,
  blendMultiply = false,
}: {
  variant?: PatternVariant;
  className?: string;
  tileWidth?: number;
  blendMultiply?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`w-full pointer-events-none select-none ${blendMultiply ? 'mix-blend-multiply' : ''} ${className}`}
      style={{
        backgroundImage: `url(${PATTERN_SRC[variant]})`,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center center',
        backgroundSize: `${tileWidth}px auto`,
      }}
    />
  );
}

export function BrandPatternEdge({
  variant = 'obsidian',
  side = 'right',
  className = '',
}: {
  variant?: PatternVariant;
  side?: 'left' | 'right';
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-y-0 ${
        side === 'left' ? 'left-0' : 'right-0'
      } ${className}`}
      style={{
        backgroundImage: `url(${PATTERN_SRC[variant]})`,
        backgroundRepeat: 'repeat-y',
        backgroundPosition: 'top center',
        backgroundSize: '180px auto',
      }}
    />
  );
}

/**
 * Fond texturé ambiant avec dégradé doux pour donner du relief sans gêner la lecture.
 */
export function BrandPatternSurface({
  variant = 'brown',
  tileWidth = 220,
  opacityClass = 'opacity-[0.045]',
  blendMultiply = false,
  className = '',
}: {
  variant?: PatternVariant;
  tileWidth?: number;
  opacityClass?: string;
  blendMultiply?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 ${opacityClass} ${
        blendMultiply ? 'mix-blend-multiply' : ''
      } ${className}`}
      style={{
        backgroundImage: `url(${PATTERN_SRC[variant]})`,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center center',
        backgroundSize: `${tileWidth}px auto`,
        maskImage:
          'radial-gradient(ellipse 85% 75% at 80% 35%, black 25%, transparent 100%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 85% 75% at 80% 35%, black 25%, transparent 100%)',
      }}
    />
  );
}

/**
 * Médaillon circulaire décoratif rempli avec le motif officiel et cerné d'un fin anneau doré.
 */
export function BrandPatternCircle({
  variant = 'gold',
  tileWidth = 140,
  blendMultiply = false,
  ring = true,
  doubleRing = false,
  className = '',
}: {
  variant?: PatternVariant;
  tileWidth?: number;
  blendMultiply?: boolean;
  ring?: boolean;
  doubleRing?: boolean;
  className?: string;
}) {
  const hasExplicitPosition =
    /\b(relative|fixed|sticky|static)\b/.test(className);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none rounded-full ${
        hasExplicitPosition ? '' : 'absolute'
      } ${className}`}
    >
      <div
        className={`w-full h-full rounded-full ${blendMultiply ? 'mix-blend-multiply' : ''}`}
        style={{
          backgroundImage: `url(${PATTERN_SRC[variant]})`,
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center center',
          backgroundSize: `${tileWidth}px auto`,
        }}
      />
      {ring && (
        <span className="absolute -inset-2.5 rounded-full border border-ucaep-gold/30 pointer-events-none" />
      )}
      {ring && doubleRing && (
        <span className="absolute -inset-5 rounded-full border border-dashed border-ucaep-gold/25 pointer-events-none" />
      )}
    </div>
  );
}

/**
 * Arche éditoriale décorative remplie de motif (pour cadres et mises en scène).
 */
export function BrandPatternArch({
  variant = 'brown',
  tileWidth = 150,
  blendMultiply = false,
  className = '',
}: {
  variant?: PatternVariant;
  tileWidth?: number;
  blendMultiply?: boolean;
  className?: string;
}) {
  const hasExplicitPosition =
    /\b(relative|fixed|sticky|static)\b/.test(className);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none rounded-t-full border border-ucaep-gold/25 ${
        hasExplicitPosition ? '' : 'absolute'
      } ${blendMultiply ? 'mix-blend-multiply' : ''} ${className}`}
      style={{
        backgroundImage: `url(${PATTERN_SRC[variant]})`,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center center',
        backgroundSize: `${tileWidth}px auto`,
      }}
    />
  );
}

/**
 * Bandeau organique en vague remplie par le motif UCAEP avec un filet d'or sur la crête.
 */
export function BrandPatternWave({
  variant = 'gold',
  tileWidth = 175,
  opacity = 0.22,
  flip = false,
  doubleWave = false,
  className = '',
}: {
  variant?: PatternVariant;
  tileWidth?: number;
  opacity?: number;
  flip?: boolean;
  doubleWave?: boolean;
  className?: string;
}) {
  const rawId = useId().replace(/:/g, '');
  const patternId = `ucaep-wave-pat-${rawId}`;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      className={`w-full pointer-events-none select-none ${flip ? 'rotate-180' : ''} ${className}`}
    >
      <defs>
        <pattern
          id={patternId}
          width={tileWidth}
          height={tileWidth * 1.35}
          patternUnits="userSpaceOnUse"
        >
          <image
            href={PATTERN_SRC[variant]}
            x="0"
            y="0"
            width={tileWidth}
            height={tileWidth * 1.35}
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      </defs>
      {doubleWave && (
        <>
          <path
            d="M0,122 C310,48 620,146 940,86 C1160,44 1330,114 1440,84 L1440,160 L0,160 Z"
            fill={`url(#${patternId})`}
            fillOpacity={Math.max(0.05, opacity * 0.6)}
          />
          <path
            d="M0,122 C310,48 620,146 940,86 C1160,44 1330,114 1440,84"
            fill="none"
            stroke="#D19A3A"
            strokeOpacity="0.28"
            strokeWidth="1"
          />
        </>
      )}
      <path
        d="M0,96 C260,152 520,24 840,78 C1100,122 1290,46 1440,68 L1440,160 L0,160 Z"
        fill={`url(#${patternId})`}
        fillOpacity={opacity}
      />
      <path
        d="M0,96 C260,152 520,24 840,78 C1100,122 1290,46 1440,68"
        fill="none"
        stroke="#D19A3A"
        strokeOpacity="0.48"
        strokeWidth="1.5"
      />
    </svg>
  );
}
