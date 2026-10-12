import { AnimatePresence, motion } from 'motion/react';
import { WifiOffIcon } from './Icons';
import { press, spring } from './motionPresets';

/** Aviso de inactividad "¿Sigues ahí?" con cuenta atrás. */
export function IdleOverlay({ remaining, onContinue }: { remaining: number | null; onContinue: () => void }) {
  return (
    <AnimatePresence>
      {remaining !== null && (
        <motion.div
          className="overlay overlay--idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="alertdialog"
          aria-labelledby="idle-title"
        >
          <motion.div
            className="idle-card glass"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={spring}
          >
            <h2 id="idle-title" className="idle-card__title">
              ¿Sigues ahí?
            </h2>
            <p className="idle-card__text">
              Volveremos al inicio en <strong>{remaining}</strong> {remaining === 1 ? 'segundo' : 'segundos'}.
            </p>
            <motion.button type="button" className="idle-card__button" data-touch whileTap={press} transition={spring} onClick={onContinue}>
              Continuar
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Banner discreto cuando no hay conexión. La portada sigue funcionando. */
export function OfflineBanner({ online }: { online: boolean }) {
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          className="offline-banner glass"
          role="status"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={spring}
        >
          <WifiOffIcon size={34} />
          <span>Sin conexión a internet · La experiencia sigue disponible</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
