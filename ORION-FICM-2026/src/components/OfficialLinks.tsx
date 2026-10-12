import { motion } from 'motion/react';
import type { DestinationId } from '../config/orion.config';
import { BRAND } from '../content/brand';
import { DESTINATIONS } from '../content/destinations';
import { ArrowRightIcon } from './Icons';
import { press, rise, spring, stagger } from './motionPresets';

interface Props {
  onOpen: (id: DestinationId) => void;
}

/** Accesos oficiales: Cinépolis (negro) y FICM (marfil). Destinos en orion.config.json. */
export function OfficialLinks({ onOpen }: Props) {
  return (
    <motion.section className="official" aria-label="Accesos oficiales" variants={stagger}>
      <motion.button
        type="button"
        className="official__button official__button--cinepolis"
        aria-label={DESTINATIONS.cinepolis.label}
        data-touch
        variants={rise}
        whileTap={press}
        transition={spring}
        onClick={() => onOpen('cinepolis')}
      >
        <CinepolisMark />
        <span className="official__arrow official__arrow--light" aria-hidden="true">
          <ArrowRightIcon size={34} stroke={2.4} />
        </span>
      </motion.button>

      <motion.button
        type="button"
        className="official__button official__button--ficm"
        aria-label={DESTINATIONS.ficm.label}
        data-touch
        variants={rise}
        whileTap={press}
        transition={spring}
        onClick={() => onOpen('ficm')}
      >
        <img className="official__ficm-logo" src={BRAND.ficmLogo} alt="" draggable={false} />
        <span className="official__arrow official__arrow--dark" aria-hidden="true">
          <ArrowRightIcon size={34} stroke={2.4} />
        </span>
      </motion.button>
    </motion.section>
  );
}

/** Logotipo oficial de Cinépolis, o un espacio marcado como pendiente si aún no se ha colocado. */
export function CinepolisMark({ large = false }: { large?: boolean }) {
  if (BRAND.cinepolisLogo) {
    return (
      <img
        className={`cinepolis-logo${large ? ' cinepolis-logo--large' : ''}`}
        src={BRAND.cinepolisLogo}
        alt="Cinépolis"
        draggable={false}
      />
    );
  }
  return (
    <span className={`cinepolis-pending${large ? ' cinepolis-pending--large' : ''}`}>
      <span className="cinepolis-pending__name">Cinépolis</span>
      <span className="cinepolis-pending__note">Logotipo oficial pendiente</span>
    </span>
  );
}
