/**
 * Constantes et repères chorégraphiques éditoriaux pour Motion (motion/react).
 * Tous les timings privilégient la fluidité sans rebond excessif et
 * s'appuient uniquement sur les propriétés accélérées GPU (transform, opacity, clipPath).
 */

export const EDITORIAL_EASE = [0.16, 1, 0.3, 1] as const;

export const EDITORIAL_SPRING = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 32,
  mass: 0.9,
};

export const TACTILE_SPRING = {
  type: 'spring' as const,
  stiffness: 480,
  damping: 34,
  mass: 0.75,
};

export const EDITORIAL_VIEWPORT = {
  once: true,
  amount: 0.14 as const,
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
