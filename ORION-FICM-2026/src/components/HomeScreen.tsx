import { motion } from 'motion/react';
import type { DestinationId } from '../config/orion.config';
import { Decorations } from './Decorations';
import { FestivalHeader } from './FestivalHeader';
import { NarantiFooter } from './NarantiFooter';
import { NavigationCards } from './NavigationCards';
import { OfficialLinks } from './OfficialLinks';
import { WelcomeSection } from './WelcomeSection';
import { stagger } from './motionPresets';

interface Props {
  datesLabel: string;
  onOpen: (id: DestinationId) => void;
  /** Cambia en cada regreso por inactividad para repetir la animación de entrada. */
  sessionKey: number;
  animatedHeader?: boolean;
}

/** Pantalla principal: composición fiel a la interfaz FICM aprobada. */
export function HomeScreen({ datesLabel, onOpen, sessionKey, animatedHeader = false }: Props) {
  return (
    <div className="screen home">
      <div className="home__column">
        <Decorations key={`decor-${sessionKey}`} header={false} />
        <motion.main
          key={`home-${sessionKey}`}
          className="home__content"
          variants={stagger}
          initial="hidden"
          animate="shown"
        >
          <span className="flex-spacer flex-spacer--top" />
          <FestivalHeader datesLabel={datesLabel} />
          <span className="flex-spacer flex-spacer--header" />
          <WelcomeSection animatedHeader={animatedHeader} />
          <span className="flex-spacer flex-spacer--welcome" />
          <NavigationCards onOpen={onOpen} />
          <span className="flex-spacer flex-spacer--cards" />
          <OfficialLinks onOpen={onOpen} />
          <span className="flex-spacer flex-spacer--links" />
          <NarantiFooter />
          <span className="flex-spacer flex-spacer--bottom" />
        </motion.main>
      </div>
    </div>
  );
}
