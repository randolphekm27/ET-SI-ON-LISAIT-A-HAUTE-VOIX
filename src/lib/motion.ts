import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Orchestrates masked kinetic line reveals, hairline sweeps, numeric counters,
 * clip-path image reveals, and parallax depth across sections.
 * Cleans up automatically on unmount and skips motion if prefers-reduced-motion is active.
 */
export function useEditorialScrollMotion(
  scopeRef: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 1. Staggered editorial card & text reveals
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
            start: 'top 88%',
            once: true,
          },
        });
      });

      // 2. Vertical masked title reveals (for headings wrapped in overflow-hidden line wrappers)
      const maskTitles = gsap.utils.toArray<HTMLElement>('[data-mask-title]');
      maskTitles.forEach((el) => {
        gsap.from(el, {
          yPercent: 105,
          opacity: 0,
          duration: 0.76,
          ease: 'power4.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
        });
      });

      // 3. Animated editorial hairline dividers
      const hairlines = gsap.utils.toArray<HTMLElement>('[data-hairline-reveal]');
      hairlines.forEach((line) => {
        gsap.from(line, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.74,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: line,
            start: 'top 90%',
            once: true,
          },
        });
      });

      // 4. Photographic clip-path + gentle zoom reveals
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
            start: 'top 86%',
            once: true,
          },
        });
      });

      // 5. Justified numeric counters (e.g. rubric points, 20 points, 5 min)
      const counters = gsap.utils.toArray<HTMLElement>('[data-counter]');
      counters.forEach((el) => {
        const target = Number(el.dataset.counter || 0);
        const suffix = el.dataset.counterSuffix || '';
        const pad = Number(el.dataset.counterPad || 0);
        if (!Number.isFinite(target) || target <= 0) return;

        const state = { value: 0 };
        gsap.to(state, {
          value: target,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
          onUpdate: () => {
            const rounded = Math.round(state.value);
            const str = pad > 0 ? String(rounded).padStart(pad, '0') : String(rounded);
            el.textContent = `${str}${suffix}`;
          },
          onComplete: () => {
            const finalStr = pad > 0 ? String(target).padStart(pad, '0') : String(target);
            el.textContent = `${finalStr}${suffix}`;
          },
        });
      });

      // 6. Responsive multi-plane parallax & subtle scenic object motion
      const mm = gsap.matchMedia();
      mm.add(
        {
          isDesktop: '(min-width: 1024px)',
          isMobile: '(max-width: 1023px)',
        },
        (context) => {
          const isDesktop = Boolean(context.conditions?.isDesktop);

          const parallaxNodes = gsap.utils.toArray<HTMLElement>('[data-parallax]');
          parallaxNodes.forEach((node) => {
            const rawDist = Number(node.dataset.parallax || 8);
            const distance = isDesktop ? rawDist : rawDist * 0.4;
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

          const parallaxCards = gsap.utils.toArray<HTMLElement>('[data-parallax-card]');
          parallaxCards.forEach((card) => {
            const rawY = Number(card.dataset.parallaxCard || 16);
            const yShift = isDesktop ? rawY : rawY * 0.35;
            gsap.fromTo(
              card,
              { y: yShift },
              {
                y: -yShift,
                ease: 'none',
                scrollTrigger: {
                  trigger: card,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 0.75,
                },
              },
            );
          });

          const scenicNodes = gsap.utils.toArray<HTMLElement>('[data-scenic-motion]');
          scenicNodes.forEach((node) => {
            const kind = node.dataset.scenicMotion;
            const amp = isDesktop ? 1 : 0.4;
            const hostSection = node.closest('[data-scenic-stage]') || node.closest('section') || node;

            if (kind === 'monstera') {
              gsap.fromTo(
                node,
                { x: -12 * amp, y: 8 * amp },
                {
                  x: 34 * amp,
                  y: -12 * amp,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: hostSection,
                    start: 'top 80%',
                    end: 'bottom 15%',
                    scrub: 0.8,
                  },
                },
              );
            } else if (kind === 'palmier') {
              gsap.fromTo(
                node,
                { y: 14 * amp, rotate: -2.5 },
                {
                  y: -18 * amp,
                  rotate: 2.5,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: hostSection,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.9,
                  },
                },
              );
            } else if (kind === 'hibiscus') {
              gsap.fromTo(
                node,
                { y: 10 * amp, rotate: -2 },
                {
                  y: -12 * amp,
                  rotate: 2.5,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: hostSection,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1,
                  },
                },
              );
            } else if (kind === 'tamtam') {
              gsap.fromTo(
                node,
                { x: 34 * amp, y: 10 * amp, opacity: 0.35 },
                {
                  x: 0,
                  y: 0,
                  opacity: 1,
                  ease: 'power2.out',
                  scrollTrigger: {
                    trigger: hostSection,
                    start: 'top 90%',
                    end: 'center 56%',
                    scrub: 0.75,
                  },
                },
              );
            } else if (kind === 'livres') {
              gsap.fromTo(
                node,
                { y: 18 * amp },
                {
                  y: -24 * amp,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: hostSection,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.85,
                  },
                },
              );
            }
          });
        },
      );
    }, scope);

    let cancelled = false;
    const rafId = window.requestAnimationFrame(() => {
      if (!cancelled) {
        ScrollTrigger.refresh();
      }
    });

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) {
          ScrollTrigger.refresh();
        }
      });
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
