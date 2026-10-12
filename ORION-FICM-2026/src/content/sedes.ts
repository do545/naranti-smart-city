import data from './sedes.json';

/**
 * Sedes oficiales. Las fotos son opcionales: si existe
 * `src/assets/sedes/<foto>.(webp|jpg|png)` se muestra; si no, la tarjeta se
 * resuelve solo con tipografía (nunca con una imagen inventada).
 */

export interface Sede {
  nombre: string;
  ciudad: string;
  foto: string | null;
}

const fotos = import.meta.glob<string>('../assets/sedes/*.{webp,jpg,jpeg,png}', { eager: true, import: 'default' });

function fotoPara(nombre: unknown): string | null {
  if (typeof nombre !== 'string' || !nombre) return null;
  const hit = Object.entries(fotos).find(([path]) => path.replace(/^.*\//, '').replace(/\.[a-z]+$/i, '') === nombre);
  return hit ? hit[1] : null;
}

export const SEDES: Sede[] = ((data as { sedes?: unknown }).sedes as Record<string, unknown>[] | undefined ?? [])
  .filter((s) => typeof s?.nombre === 'string' && (s.nombre as string).trim())
  .map((s) => ({
    nombre: (s.nombre as string).trim(),
    ciudad: typeof s.ciudad === 'string' ? s.ciudad.trim() : '',
    foto: fotoPara(s.foto),
  }));

/** Ciudades en el orden en que aparecen. */
export const CIUDADES = [...new Set(SEDES.map((s) => s.ciudad).filter(Boolean))];
