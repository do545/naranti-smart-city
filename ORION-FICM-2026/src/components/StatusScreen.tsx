import { motion } from 'motion/react';
import { BRAND } from '../content/brand';
import { Decorations } from './Decorations';
import { NarantiFooter } from './NarantiFooter';

/**
 * Pantalla de estado a página completa: experiencia desactivada, fuera de
 * fechas o recuperación tras un error. Mantiene la identidad FICM.
 */
export function StatusScreen({ title, message, detail }: { title: string; message: string; detail?: string }) {
  return (
    <div className="screen status-screen">
      <div className="home__column">
        <Decorations />
        <motion.div
          className="status-screen__content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <img className="status-screen__logo" src={BRAND.ficmLogo} alt="FICM" draggable={false} />
          <h1 className="status-screen__title">{title}</h1>
          <div className="welcome__accent" aria-hidden="true" />
          <p className="status-screen__message">{message}</p>
          {detail && <p className="status-screen__detail">{detail}</p>}
        </motion.div>
        <div className="status-screen__footer">
          <NarantiFooter />
        </div>
      </div>
    </div>
  );
}
