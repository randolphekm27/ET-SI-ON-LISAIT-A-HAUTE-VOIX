import { useEffect, useState } from 'react';

export interface AnchorSectionItem {
  id: string;
  num: string;
  label: string;
}

interface SectionAnchorRailProps {
  items: AnchorSectionItem[];
}

/**
 * Barre de sommaire éditorial légère placée sous l'en-tête de page
 * (non collante sur mobile afin de respecter le plafond <= 15% de surface fixe).
 */
export function SectionAnchorRail({ items }: SectionAnchorRailProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || '');

  useEffect(() => {
    if (typeof window === 'undefined' || items.length === 0) return;

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0.05 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  function jumpTo(id: string) {
    setActiveId(id);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <nav
      aria-label="Sommaire de la page"
      className="border-b border-ucaep-brown/14 bg-ucaep-linen/70 paper-grain"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-4 overflow-x-auto">
        <span className="hidden md:inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-brown/65 whitespace-nowrap shrink-0">
          Sommaire rapide
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => jumpTo(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[2px] border transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-ucaep-brown text-ucaep-paper border-ucaep-brown'
                    : 'bg-white/75 text-ucaep-brown border-ucaep-brown/14 hover:border-ucaep-gold'
                }`}
              >
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    isActive ? 'text-ucaep-gold' : 'text-ucaep-gold'
                  }`}
                >
                  {item.num}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
