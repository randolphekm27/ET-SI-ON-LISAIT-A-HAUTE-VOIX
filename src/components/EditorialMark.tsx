import type { ReactNode } from 'react';

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
}: {
  folio?: string;
  section: string;
  title: string;
  italicWord?: string;
  subtitle: string;
  aside?: ReactNode;
}) {
  return (
    <section className="relative py-20 lg:py-28 border-b border-ucaep-brown/12 bg-ucaep-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
