import { motion } from 'motion/react';
import { ART } from '../content/brand';
import { HeaderArt } from './HeaderArt';
import { rise, stagger } from './motionPresets';

export function WelcomeSection({ animatedHeader = false }: { animatedHeader?: boolean }) {
  return (
    <motion.section className="welcome" variants={stagger} aria-labelledby="welcome-title">
      {/* Rollo, rosas, catedral y palomas: anclados al titular para que nunca
          lo pisen, sea cual sea la altura real de la pantalla. */}
      {animatedHeader ? (
        <HeaderArt className="welcome__art" />
      ) : (
        <motion.img
          className="welcome__art welcome__art--static"
          src={ART.headerArt}
          alt=""
          aria-hidden="true"
          draggable={false}
          initial={{ opacity: 0, x: 40, scale: 1.03 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      <motion.h1 id="welcome-title" className="welcome__title" variants={rise}>
        Bienvenido
        <br />
        al FICM
      </motion.h1>
      <motion.div
        className="welcome__accent"
        aria-hidden="true"
        variants={{
          hidden: { scaleX: 0 },
          shown: { scaleX: 1, transition: { duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] } },
        }}
      />
      <motion.p className="welcome__subtitle" variants={rise}>
        Descubre todo lo que vive
        <br />
        el festival
      </motion.p>
    </motion.section>
  );
}
