import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
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
  brown: 'text-ucaep-brown/80',
  gold: 'text-ucaep-gold',
  ivory: 'text-ucaep-ivory/85',
  green: 'text-ucaep-green',
};

/**
 * Repère typographique épuré avec filet décoratif discret (zéro pilule).
 */
export function EditorialMark({
  label,
  folio,
  tone = 'brown',
  className = '',
}: EditorialMarkProps) {
  if (!label && !folio) return null;

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${TONE_TEXT[tone]} ${className}`}
    >
      {folio && <span>{folio}</span>}
      {folio && label && (
        <span aria-hidden="true" className="opacity-45">
          ·
        </span>
      )}
      {label && <span>{label}</span>}
    </div>
  );
}

export interface QuickFactItem {
  label: string;
  value: string;
}

export function PageFolioHeader({
  folio,
  section,
  title,
  italicWord,
  subtitle,
  aside,
  quickFacts,
  patternVariant = 'gold',
}: {
  folio?: string;
  section: string;
  title: string;
  italicWord?: string;
  subtitle: string;
  aside?: ReactNode;
  quickFacts?: QuickFactItem[];
  patternVariant?: 'brown' | 'green' | 'gold';
}) {
  return (
    <section className="relative pt-10 pb-12 sm:pt-12 sm:pb-14 lg:pt-14 lg:pb-16 border-b border-ucaep-brown/14 bg-ucaep-paper paper-grain overflow-hidden">
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
        orbit
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
        className="pointer-events-none select-none hidden md:block absolute bottom-4 right-8 w-40 h-40 text-ucaep-brown opacity-[0.035] -rotate-12"
        strokeWidth={1.1}
      />
      <BrandPatternWave
        variant={patternVariant}
        tileWidth={165}
        opacity={0.11}
        doubleWave
        className="absolute bottom-0 inset-x-0 h-16 sm:h-20"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8 space-y-5"
          >
            <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              {folio && (
                <>
                  <span className="font-mono text-ucaep-gold">{folio}</span>
                  <span aria-hidden="true" className="text-ucaep-brown/35">
                    ·
                  </span>
                </>
              )}
              <span>{section}</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[4.5rem] font-semibold text-ucaep-brown leading-[0.98] tracking-tight">
              {title}
              {italicWord && (
                <>
                  {' '}
                  <em className="italic font-normal text-ucaep-ink">{italicWord}</em>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-ucaep-ink/78 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </motion.div>

          {aside && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-4"
            >
              {aside}
            </motion.div>
          )}
        </div>

        {quickFacts && quickFacts.length > 0 && (
          <motion.dl
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 lg:grid-cols-4 border-t border-ucaep-brown/16 pt-5 gap-6 sm:gap-8"
          >
            {quickFacts.map((fact) => (
              <div key={fact.label} className="space-y-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-brown/65">
                  {fact.label}
                </dt>
                <dd className="font-serif text-lg sm:text-xl font-semibold text-ucaep-ink tabular-nums">
                  {fact.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        )}
      </div>
    </section>
  );
}
