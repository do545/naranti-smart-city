import { motion } from 'motion/react';
import { ART } from '../content/brand';

/**
 * Arte decorativo (rosas, rollo, película, catedral). Siempre por debajo del
 * contenido y sin eventos táctiles: nunca intercepta un toque.
 */
export function Decorations({ header = true, corners = true }: { header?: boolean; corners?: boolean }) {
  return (
    <div className="decor" aria-hidden="true">
      {header && (
        <motion.img
          className="decor__header"
          src={ART.headerArt}
          alt=""
          draggable={false}
          initial={{ opacity: 0, x: 40, scale: 1.03 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      {corners && (
        <>
          <motion.img
            className="decor__corner decor__corner--left"
            src={ART.cornerLeft}
            alt=""
            draggable={false}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.img
            className="decor__corner decor__corner--right"
            src={ART.cornerRight}
            alt=""
            draggable={false}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </>
      )}
    </div>
  );
}
