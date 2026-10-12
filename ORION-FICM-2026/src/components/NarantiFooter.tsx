import { motion } from 'motion/react';
import { BRAND } from '../content/brand';
import { fade } from './motionPresets';

/** Firma de la experiencia con el logotipo ORIGINAL de Naranti (archivo sin alterar). */
export function NarantiFooter({ compact = false }: { compact?: boolean }) {
  return (
    <motion.footer className={`naranti${compact ? ' naranti--compact' : ''}`} variants={fade}>
      <div className="naranti__label">
        <span className="naranti__rule" aria-hidden="true" />
        <span>Una experiencia de</span>
        <span className="naranti__rule" aria-hidden="true" />
      </div>
      <img
        className="naranti__logo"
        src={BRAND.narantiLogo}
        alt="Naranti"
        width={2000}
        height={568}
        draggable={false}
      />
    </motion.footer>
  );
}
