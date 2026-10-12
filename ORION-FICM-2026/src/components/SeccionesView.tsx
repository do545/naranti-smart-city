import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { DESTINATIONS } from '../content/destinations';
import { plural, SELECCION, totalPeliculas, type Pelicula, type Seccion } from '../content/seleccion';
import { Decorations } from './Decorations';
import { ArrowRightIcon, FilmIcon } from './Icons';
import { KioskNavigation } from './KioskNavigation';
import { NarantiFooter } from './NarantiFooter';
import { press, rise, spring, stagger } from './motionPresets';

/**
 * Secciones de la selección oficial y sus películas, dentro del kiosco.
 * Dos niveles: índice de secciones → películas de la sección elegida.
 * No hay enlaces externos: el visitante nunca sale de la experiencia.
 */
export function SeccionesView({ onExit, onHome }: { onExit: () => void; onHome: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = SELECCION.secciones.find((s) => s.id === selectedId) ?? null;
  const back = () => (selected ? setSelectedId(null) : onExit());
  const photo = DESTINATIONS.secciones.photo;

  return (
    <div className="screen secciones">
      <Decorations header={false} />

      <motion.div
        className="secciones__hero"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <img className="destination__hero-photo" src={photo} alt="" draggable={false} />
        <span className="secciones__hero-shade" aria-hidden="true" />
        <FilmIcon className="secciones__hero-icon" size={84} stroke={1.8} />
      </motion.div>

      <div className="destination__glass-top">
        <KioskNavigation variant="pill" onBack={back} onHome={onHome} />
      </div>

      <div className="secciones__main">
        <AnimatePresence mode="wait" initial={false}>
          {selected ? (
            <SectionFilms key={selected.id} seccion={selected} />
          ) : (
            <SectionIndex key="index" onOpen={setSelectedId} />
          )}
        </AnimatePresence>
      </div>

      <div className="destination__footer">
        <KioskNavigation onBack={back} onHome={onHome} />
        <NarantiFooter compact />
      </div>
    </div>
  );
}

function SectionIndex({ onOpen }: { onOpen: (id: string) => void }) {
  const secciones = SELECCION.secciones;
  return (
    <motion.div
      className="secciones__level"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="secciones__head">
        <p className="destination__kicker">Selección oficial · 24.º FICM</p>
        <h1 className="secciones__title">Secciones</h1>
        {secciones.length > 0 && (
          <p className="secciones__meta">
            {plural(secciones.length, 'sección', 'secciones')} · {plural(totalPeliculas, 'película', 'películas')}
          </p>
        )}
      </header>

      {secciones.length === 0 ? (
        <div className="panel secciones__empty">
          <p className="panel__lead">La selección oficial de la 24.ª edición se mostrará aquí muy pronto.</p>
        </div>
      ) : (
        <motion.div className="secciones__scroll" variants={stagger} initial="hidden" animate="shown">
          {secciones.map((s) => (
            <SectionRow key={s.id} seccion={s} onOpen={onOpen} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function SectionRow({ seccion: s, onOpen }: { seccion: Seccion; onOpen: (id: string) => void }) {
  return (
    <motion.button
      type="button"
      className="seccion-row"
      data-touch
      variants={rise}
      whileTap={press}
      transition={spring}
      onClick={() => onOpen(s.id)}
      aria-label={`${s.nombre}: ${plural(s.peliculas.length, 'película', 'películas')}`}
    >
      <span className="seccion-row__text">
        <span className="seccion-row__name">{s.nombre}</span>
        <span className="seccion-row__count">
          {plural(s.peliculas.length, 'película', 'películas')}
          {s.grupos.length > 0 && <span className="seccion-row__groups"> · {s.grupos.join(' · ')}</span>}
        </span>
      </span>
      <span className="seccion-row__arrow" aria-hidden="true">
        <ArrowRightIcon size={34} stroke={2.4} />
      </span>
    </motion.button>
  );
}

function SectionFilms({ seccion: s }: { seccion: Seccion }) {
  const scroller = useRef<HTMLDivElement>(null);
  // Salto a un subgrupo dentro de la lista (sin mover el resto de la pantalla).
  const jump = (grupo: string) => {
    const box = scroller.current;
    const target = box?.querySelector<HTMLElement>(`[data-grupo="${CSS.escape(grupo)}"]`);
    if (box && target) box.scrollTo({ top: target.offsetTop - 12, behavior: "smooth" });
  };
  let lastGroup: string | undefined;
  return (
    <motion.div
      className="secciones__level"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="secciones__head">
        <p className="destination__kicker">Secciones · {plural(s.peliculas.length, 'película', 'películas')}</p>
        <h1 className="secciones__title secciones__title--section">{s.nombre}</h1>
        {s.descripcion && <p className="secciones__description">{s.descripcion}</p>}
        {s.grupos.length > 1 && (
          <div className="secciones__chips" role="group" aria-label="Ir a">
            {s.grupos.map((g) => (
              <motion.button key={g} type="button" className="secciones__chip" data-touch whileTap={press} transition={spring} onClick={() => jump(g)}>
                {g}
                <span className="secciones__chip-count">{s.peliculas.filter((p) => p.grupo === g).length}</span>
              </motion.button>
            ))}
          </div>
        )}
      </header>

      <div className="secciones__scroll" ref={scroller}>
        {s.peliculas.map((p, i) => {
          const header = p.grupo && p.grupo !== lastGroup ? p.grupo : null;
          lastGroup = p.grupo;
          return (
            <div key={`${p.titulo}-${i}`} className="film-block">
              {header && (
                <h2 className="film-group" data-grupo={header}>
                  {header}
                </h2>
              )}
              <FilmRow pelicula={p} />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function FilmRow({ pelicula: p }: { pelicula: Pelicula }) {
  const meta = [p.pais, p.anio, p.duracion].filter(Boolean).join(' · ');
  return (
    <article className="film-row">
      {p.formato && <span className="film-row__format">{p.formato}</span>}
      <h3 className="film-row__title">{p.titulo}</h3>
      {p.direccion && <p className="film-row__director">{p.direccion}</p>}
      {meta && <p className="film-row__meta">{meta}</p>}
      {p.nota && <p className="film-row__note">{p.nota}</p>}
    </article>
  );
}
