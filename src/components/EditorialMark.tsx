import type { ReactNode } from 'react';

interface EditorialMarkProps {
  label?: string;
  folio?: string;
  tone?: 'brown' | 'gold' | 'ivory' | 'green';
  className?: string;
}

const TONE_TEXT = {
  brown: 'text-[#4E2A1E]/75',
  gold: 'text-[#D19A3A]',
  ivory: 'text-[#F7E6C8]/80',
  green: 'text-[#2E4D32]',
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
}: {
  folio?: string;
  section: string;
  title: string;
  italicWord?: string;
  subtitle: string;
  aside?: ReactNode;
}) {
  return (
    <section className="relative py-20 lg:py-28 border-b border-[#4E2A1E]/12 bg-[#FBF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          <div className="lg:col-span-8 space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2E4D32]">
              {section}
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[4.5rem] font-medium text-[#4E2A1E] leading-[0.96] tracking-tight">
              {title}
              {italicWord && (
                <>
                  {' '}
                  <em className="italic font-normal text-[#1A1A1A]">{italicWord}</em>
                </>
              )}
            </h1>
            <p className="text-base sm:text-lg text-[#1A1A1A]/75 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>
          {aside && <div className="lg:col-span-4">{aside}</div>}
        </div>
      </div>
    </section>
  );
}
