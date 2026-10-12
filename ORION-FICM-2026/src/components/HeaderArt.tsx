import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import layers from '../assets/art/header-layers.json';
import { ART } from '../content/brand';

/**
 * Arte del encabezado en capas (generadas por design/tools/extract_assets.py):
 *   1. Arte fijo: rosas, catedral y el rollo.
 *   2. Disco del rollo: gira en su propia perspectiva (matrix3d).
 *   3. Rosa delantera: fija, por encima del disco.
 *   4. Palomas: vuelan con un aleteo suave.
 * Solo se animan `transform` y `opacity`; sin animación si el visitante o la
 * configuración piden movimiento reducido.
 */

const birdUrls = import.meta.glob<string>('../assets/art/bird-*.webp', { eager: true, import: 'default' });
const birdUrl = (file: string) => birdUrls[`../assets/art/${file}`];

// Recorrido de vuelo de cada paloma (px) y ritmo, para que no vuelen al unísono.
const FLIGHT = [
  { dx: -10, dy: -26, dur: 7.5, delay: -1.2, flap: 0.62 },
  { dx: 14, dy: -20, dur: 8.6, delay: -4.1, flap: 0.7 },
  { dx: -16, dy: -14, dur: 6.8, delay: -2.6, flap: 0.58 },
  { dx: 8, dy: -24, dur: 9.2, delay: -6.3, flap: 0.66 },
];

export function HeaderArt({ className }: { className?: string }) {
  const { art, reel, birds } = layers;
  return (
    <motion.div
      className={`header-art ${className ?? ''}`}
      aria-hidden="true"
      style={{ width: art.width, height: art.height }}
      initial={{ opacity: 0, x: 40, scale: 1.03 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <img className="header-art__base" src={ART.headerArtBase} alt="" draggable={false} />

      <div
        className="header-art__reel"
        style={{ width: reel.size, height: reel.size, transform: `matrix3d(${reel.matrix.join(',')})` }}
      >
        <img className="header-art__reel-face" src={ART.reelFace} alt="" draggable={false} />
      </div>

      <img className="header-art__front" src={ART.reelFront} alt="" draggable={false} />

      {birds.map((b, i) => {
        const f = FLIGHT[i % FLIGHT.length];
        return (
          <span
            key={b.file}
            className="header-art__bird"
            style={
              {
                left: b.left,
                top: b.top,
                width: b.width,
                height: b.height,
                '--dx': `${f.dx}px`,
                '--dy': `${f.dy}px`,
                '--dur': `${f.dur}s`,
                '--delay': `${f.delay}s`,
                '--flap': `${f.flap}s`,
              } as CSSProperties
            }
          >
            <img src={birdUrl(b.file)} alt="" draggable={false} />
          </span>
        );
      })}
    </motion.div>
  );
}
