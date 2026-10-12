import { motion } from 'motion/react';
import type { DestinationId } from '../config/orion.config';
import { DESTINATIONS, MAIN_CARDS } from '../content/destinations';
import { ArrowRightIcon, iconFor } from './Icons';
import { press, rise, spring, stagger } from './motionPresets';

interface Props {
  onOpen: (id: DestinationId) => void;
}

/** Las dos categorías principales, lado a lado: Secciones y Sedes. */
export function NavigationCards({ onOpen }: Props) {
  return (
    <motion.nav className="nav-cards" aria-label="Categorías del festival" variants={stagger}>
      {MAIN_CARDS.map((id) => (
        <NavCard key={id} id={id} onOpen={onOpen} />
      ))}
    </motion.nav>
  );
}

function NavCard({ id, onOpen }: { id: DestinationId; onOpen: (id: DestinationId) => void }) {
  const d = DESTINATIONS[id];
  const Icon = iconFor(d.icon as 'pin' | 'film');
  return (
    <motion.button
      type="button"
      className={`nav-card nav-card--${id}`}
      aria-label={d.label}
      data-touch
      variants={rise}
      whileTap={press}
      transition={spring}
      onClick={() => onOpen(id)}
    >
      <img className="nav-card__photo" src={d.photo} alt="" draggable={false} />
      <span className="nav-card__shade" aria-hidden="true" />
      <span className="nav-card__press" aria-hidden="true" />
      <Icon className="nav-card__icon" size={76} stroke={2.1} />
      <span className="nav-card__title">{d.title}</span>
      <span className="nav-card__arrow" aria-hidden="true">
        <ArrowRightIcon size={40} stroke={2.4} />
      </span>
    </motion.button>
  );
}
