import { useEffect, useId, useState } from 'react';
import { motion } from 'motion/react';
import { EDITORIAL_SPRING } from '../lib/motion';

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
 * avec indicateur actif fluide partagé (Motion layoutId).
 */
export function SectionAnchorRail({ items }: SectionAnchorRailProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || '');
  const railGroupId = useId();

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
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => jumpTo(item.id)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[2px] border transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-ucaep-paper border-ucaep-brown'
                    : 'bg-white/75 text-ucaep-brown border-ucaep-brown/14 hover:border-ucaep-gold'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={`anchor-active-${railGroupId}`}
                    aria-hidden="true"
                    transition={EDITORIAL_SPRING}
                    className="absolute inset-0 bg-ucaep-brown rounded-[1px]"
                  />
                )}
                <span className="relative z-10 font-mono text-[10px] tabular-nums text-ucaep-gold">
                  {item.num}
                </span>
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
