import type { Transition, Variants } from 'motion/react';

/** Animaciones compartidas: solo `opacity` y `transform` (aceleradas por GPU). */

export const spring: Transition = { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 };
export const softSpring: Transition = { type: 'spring', stiffness: 220, damping: 28 };

export const stagger: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

/** Respuesta táctil: escala sutil al presionar. */
export const press = { scale: 0.97 };
