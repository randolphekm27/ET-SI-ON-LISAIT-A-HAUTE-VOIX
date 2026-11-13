import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Orchestrates masked kinetic line reveals and restrained scroll entrances inside a container.
 * Cleans up automatically on unmount and skips hidden states if prefers-reduced-motion is active.
 */
export function useEditorialScrollMotion(
  scopeRef: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const revealBlocks = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      revealBlocks.forEach((el) => {
        const delay = Number(el.dataset.revealDelay || 0);
        gsap.from(el, {
          y: 24,
          opacity: 0,
          duration: 0.72,
          delay,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            once: true,
          },
        });
      });

      const clipFrames = gsap.utils.toArray<HTMLElement>('[data-clip-reveal]');
      clipFrames.forEach((frame) => {
        gsap.from(frame, {
          clipPath: 'inset(10% 0% 0% 0%)',
          opacity: 0,
          duration: 0.85,
          ease: 'power3.out',
          clearProps: 'clipPath,opacity',
          scrollTrigger: {
            trigger: frame,
            start: 'top 85%',
            once: true,
          },
        });
      });

      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        const parallaxNodes = gsap.utils.toArray<HTMLElement>('[data-parallax]');
        parallaxNodes.forEach((node) => {
          const distance = Number(node.dataset.parallax || 8);
          gsap.to(node, {
            yPercent: distance,
            ease: 'none',
            scrollTrigger: {
              trigger: node,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          });
        });
      });
    }, scope);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
