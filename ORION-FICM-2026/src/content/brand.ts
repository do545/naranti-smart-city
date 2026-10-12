import narantiLogo from '../assets/brand/naranti-logo.webp';
import ficmLogo from '../assets/brand/ficm-logo.webp';
import headerArt from '../assets/art/header-art.webp';
import headerArtBase from '../assets/art/header-art-base.webp';
import reelFace from '../assets/art/reel-face.webp';
import reelFront from '../assets/art/reel-front.webp';
import cornerLeft from '../assets/art/corner-left.webp';
import cornerRight from '../assets/art/corner-right.webp';
import paperTile from '../assets/art/paper-tile.webp';

/**
 * Logotipo de Cinépolis para fondo negro.
 * Basta con colocar el archivo oficial en `src/assets/brand/` con el nombre
 * `cinepolis-logo-white` (.svg, .webp o .png) y recompilar: el botón lo usa
 * automáticamente. Si no existe, el botón muestra un espacio marcado como
 * pendiente (no se redibuja la marca).
 */
const cinepolisCandidates = import.meta.glob<string>('../assets/brand/cinepolis-logo-white.{svg,webp,png}', {
  eager: true,
  import: 'default',
  query: '?url',
});
const cinepolisLogo: string | null = Object.values(cinepolisCandidates)[0] ?? null;

export const BRAND = {
  narantiLogo,
  ficmLogo,
  cinepolisLogo,
};

export const ART = {
  headerArt,
  headerArtBase,
  reelFace,
  reelFront,
  cornerLeft,
  cornerRight,
  paperTile,
};
