import { motion } from 'motion/react';
import { ArrowLeftIcon, HomeIcon } from './Icons';
import { press, spring } from './motionPresets';

interface Props {
  onBack: () => void;
  onHome: () => void;
  /** "bar": barra inferior con dos botones grandes. "pill": botón flotante superior. */
  variant?: 'bar' | 'pill';
  title?: string;
}

/** Controles de regreso siempre visibles (Liquid Glass discreto). */
export function KioskNavigation({ onBack, onHome, variant = 'bar', title }: Props) {
  if (variant === 'pill') {
    return (
      <div className="kiosk-nav kiosk-nav--pill">
        <motion.button type="button" className="kiosk-nav__pill-btn glass-dark" data-touch whileTap={press} transition={spring} onClick={onBack}>
          <ArrowLeftIcon size={40} />
          <span>Regresar</span>
        </motion.button>
        {title && <span className="kiosk-nav__title">{title}</span>}
        <motion.button
          type="button"
          className="kiosk-nav__pill-btn kiosk-nav__pill-btn--icon glass"
          aria-label="Ir al inicio"
          data-touch
          whileTap={press}
          transition={spring}
          onClick={onHome}
        >
          <HomeIcon size={40} />
        </motion.button>
      </div>
    );
  }

  return (
    <nav className="kiosk-nav kiosk-nav--bar" aria-label="Navegación del kiosco">
      <motion.button type="button" className="kiosk-nav__btn kiosk-nav__btn--back" data-touch whileTap={press} transition={spring} onClick={onBack}>
        <ArrowLeftIcon size={44} />
        <span>Regresar</span>
      </motion.button>
      <motion.button type="button" className="kiosk-nav__btn kiosk-nav__btn--home" data-touch whileTap={press} transition={spring} onClick={onHome}>
        <HomeIcon size={44} />
        <span>Inicio</span>
      </motion.button>
    </nav>
  );
}
