import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import {
  BrandPatternArch,
  BrandPatternBand,
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from './BrandPattern';

interface EditorialMarkProps {
  label?: string;
  folio?: string;
  tone?: 'brown' | 'gold' | 'ivory' | 'green';
  className?: string;
}

const TONE_TEXT = {
  brown: 'text-ucaep-brown/75',
  gold: 'text-ucaep-gold',
  ivory: 'text-ucaep-ivory/80',
  green: 'text-ucaep-green',
};

/**
 * Repère typographique épuré (sans icône ni encadré) pour conserver une hiérarchie éditoriale sobre.
 */
export function EditorialMark({
  label,
  folio,
  tone = 'brown',
  className = '',
}: EditorialMarkProps) {
  const text = label || folio;
  if (!text) return null;

  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${TONE_TEXT[tone]} ${className}`}
    >
      {text}
    </p>
  );
}

export function PageFolioHeader({
  section,
  title,
  italicWord,
  subtitle,
  aside,
  patternVariant = 'gold',
}: {
  folio?: string;
  section: string;
  title: string;
  italicWord?: string;
  subtitle: string;
  aside?: ReactNode;
  patternVariant?: 'brown' | 'green' | 'gold';
}) {
  return (
    <section className="relative pt-8 pb-12 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16 border-b border-ucaep-brown/12 bg-ucaep-paper paper-grain overflow-hidden">
      <BrandPatternBand
        variant={patternVariant}
        tileWidth={135}
        blendMultiply
        className="h-2.5 opacity-65 border-b border-ucaep-brown/10 absolute top-0 inset-x-0"
      />
      <BrandPatternSurface
        variant={patternVariant}
        tileWidth={220}
        opacityClass="opacity-[0.045]"
        blendMultiply
      />
      <BrandPatternCircle
        variant={patternVariant}
        tileWidth={135}
        blendMultiply
        doubleRing
        className="hidden md:block -top-20 -right-14 w-56 h-56 opacity-[0.1]"
      />
      <BrandPatternArch
        variant={patternVariant}
        tileWidth={140}
        blendMultiply
        className="hidden lg:block -bottom-8 -left-10 w-36 h-44 opacity-[0.065]"
      />
      <BookOpen
        aria-hidden="true"
        className="pointer-events-none select-none hidden md:block absolute bottom-3 right-8 w-44 h-44 text-ucaep-brown opacity-[0.04] -rotate-12"
        strokeWidth={1.1}
      />
      <BrandPatternWave
        variant={patternVariant}
        tileWidth={165}
        opacity={0.11}
        doubleWave
        className="absolute bottom-0 inset-x-0 h-16 sm:h-20"
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          <div className="lg:col-span-8 space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              {section}
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[4.5rem] font-medium text-ucaep-brown leading-[0.96] tracking-tight">
              {title}
              {italicWord && (
                <>
                  {' '}
                  <em className="italic font-normal text-ucaep-ink">{italicWord}</em>
                </>
              )}
            </h1>
            <p className="text-base sm:text-lg text-ucaep-ink/75 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>
          {aside && <div className="lg:col-span-4">{aside}</div>}
        </div>
      </div>
    </section>
  );
}
