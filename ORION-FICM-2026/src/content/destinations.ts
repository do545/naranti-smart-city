import type { DestinationId } from '../config/orion.config';
import sedesPhoto from '../assets/photos/sedes.webp';
import seccionesPhoto from '../assets/photos/secciones.webp';

/**
 * Textos de la interfaz para cada destino. El contenido de Secciones y Sedes
 * vive en `seleccion-oficial.json` y `sedes.json`; aquí no se inventa ningún dato.
 */
export interface Destination {
  id: DestinationId;
  title: string;
  /** Línea breve bajo el título en la pantalla del destino. */
  description: string;
  icon: 'pin' | 'film' | 'cinepolis' | 'ficm';
  photo?: string;
  /** Texto accesible del botón. */
  label: string;
}

export const DESTINATIONS: Record<DestinationId, Destination> = {
  sedes: {
    id: 'sedes',
    title: 'Sedes',
    description: 'Sedes oficiales del festival.',
    icon: 'pin',
    photo: sedesPhoto,
    label: 'Ver las sedes del festival',
  },
  secciones: {
    id: 'secciones',
    title: 'Secciones',
    description: 'Secciones oficiales del festival.',
    icon: 'film',
    photo: seccionesPhoto,
    label: 'Ver las secciones del festival',
  },
  cinepolis: {
    id: 'cinepolis',
    title: 'Cinépolis',
    description: 'Sitio oficial de Cinépolis.',
    icon: 'cinepolis',
    label: 'Ir al sitio oficial de Cinépolis',
  },
  ficm: {
    id: 'ficm',
    title: 'Sitio oficial FICM',
    description: 'Festival Internacional de Cine de Morelia.',
    icon: 'ficm',
    label: 'Ir al sitio oficial del Festival Internacional de Cine de Morelia',
  },
};

export const MAIN_CARDS: DestinationId[] = ['secciones', 'sedes'];
export const OFFICIAL_LINKS: DestinationId[] = ['cinepolis', 'ficm'];
