import { motion } from 'motion/react';
import { BRAND } from '../content/brand';
import { rise } from './motionPresets';

/** Logotipo oficial FICM + fechas del festival. El arte del rollo vive en Decorations. */
export function FestivalHeader({ datesLabel }: { datesLabel: string }) {
  return (
    <motion.header className="festival-header" variants={rise}>
      <img
        className="festival-header__logo"
        src={BRAND.ficmLogo}
        alt="24.º Festival Internacional de Cine de Morelia — FICM"
        width={400}
        height={233}
        draggable={false}
      />
      <div className="festival-header__rule" aria-hidden="true" />
      <p className="festival-header__dates">{datesLabel}</p>
    </motion.header>
  );
}
