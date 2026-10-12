import { motion } from 'motion/react';
import { DESTINATIONS } from '../content/destinations';
import { CIUDADES, SEDES, type Sede } from '../content/sedes';
import { plural } from '../content/seleccion';
import { Decorations } from './Decorations';
import { PinIcon } from './Icons';
import { KioskNavigation } from './KioskNavigation';
import { NarantiFooter } from './NarantiFooter';
import { rise, stagger } from './motionPresets';

/** Sedes oficiales del festival, agrupadas por ciudad. Sin enlaces externos. */
export function SedesView({ onExit, onHome }: { onExit: () => void; onHome: () => void }) {
  const photo = DESTINATIONS.sedes.photo;
  const ciudades = CIUDADES.length ? CIUDADES : [''];

  return (
    <div className="screen secciones sedes">
      <Decorations header={false} />

      <motion.div
        className="secciones__hero"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <img className="destination__hero-photo" src={photo} alt="" draggable={false} />
        <span className="secciones__hero-shade" aria-hidden="true" />
        <PinIcon className="secciones__hero-icon" size={84} stroke={1.8} />
      </motion.div>

      <div className="destination__glass-top">
        <KioskNavigation variant="pill" onBack={onExit} onHome={onHome} />
      </div>

      <div className="secciones__main">
        <div className="secciones__level">
          <header className="secciones__head">
            <p className="destination__kicker">24.º FICM · 16 al 25 de octubre, 2026</p>
            <h1 className="secciones__title">Sedes</h1>
            {SEDES.length > 0 && (
              <p className="secciones__meta">
                {plural(SEDES.length, 'sede', 'sedes')} · {CIUDADES.join(' y ')}
              </p>
            )}
          </header>

          <motion.div className="secciones__scroll" variants={stagger} initial="hidden" animate="shown">
            {ciudades.map((ciudad) => (
              <section key={ciudad || 'sin-ciudad'} className="sedes__city" aria-label={ciudad || undefined}>
                {ciudad && (
                  <motion.h2 className="film-group" variants={rise}>
                    {ciudad}
                    <span className="sedes__city-count">{plural(SEDES.filter((s) => s.ciudad === ciudad).length, 'sede', 'sedes')}</span>
                  </motion.h2>
                )}
                {SEDES.filter((s) => s.ciudad === ciudad).map((s) => (
                  <SedeCard key={s.nombre} sede={s} />
                ))}
              </section>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="destination__footer">
        <KioskNavigation onBack={onExit} onHome={onHome} />
        <NarantiFooter compact />
      </div>
    </div>
  );
}

function SedeCard({ sede: s }: { sede: Sede }) {
  return (
    <motion.article className={`sede-card${s.foto ? ' sede-card--photo' : ''}`} variants={rise}>
      {s.foto ? (
        <img className="sede-card__photo" src={s.foto} alt="" draggable={false} />
      ) : (
        <span className="sede-card__mark" aria-hidden="true">
          <PinIcon size={40} stroke={2.2} />
        </span>
      )}
      <span className="sede-card__text">
        <span className="sede-card__name">{s.nombre}</span>
        {s.ciudad && <span className="sede-card__city">{s.ciudad}, Michoacán</span>}
      </span>
    </motion.article>
  );
}
