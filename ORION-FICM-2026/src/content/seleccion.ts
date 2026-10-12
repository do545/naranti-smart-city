import data from './seleccion-oficial.json';

/**
 * Selección oficial por sección (fuente: sitio oficial del FICM).
 * Los datos viven en `seleccion-oficial.json` y se incluyen en la compilación,
 * así que se muestran aunque el kiosco pierda la conexión.
 */

export interface Pelicula {
  titulo: string;
  direccion?: string;
  pais?: string;
  anio?: string;
  duracion?: string;
  formato?: string;
  nota?: string;
  /** Subgrupo dentro de la sección (p. ej. Documental / Ficción). */
  grupo?: string;
}

export interface Seccion {
  id: string;
  nombre: string;
  descripcion?: string;
  peliculas: Pelicula[];
  /** Nombres de los subgrupos, en orden; vacío si la sección no tiene. */
  grupos: string[];
}

interface RawSeccion {
  nombre?: unknown;
  descripcion?: unknown;
  peliculas?: unknown;
  grupos?: unknown;
}

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function normalize(raw: unknown): Seccion[] {
  if (!Array.isArray(raw)) return [];
  const used = new Set<string>();
  return raw
    .map((r: RawSeccion) => {
      const nombre = text(r?.nombre);
      if (!nombre) return null;
      let id = slug(nombre) || 'seccion';
      while (used.has(id)) id += '-2';
      used.add(id);
      // Películas sueltas y/o agrupadas ("grupos": [{ nombre, peliculas }]).
      const sueltas = (Array.isArray(r.peliculas) ? r.peliculas : []).map((p) => ({ p, grupo: undefined as string | undefined }));
      const agrupadas = (Array.isArray(r.grupos) ? r.grupos : []).flatMap((g: { nombre?: unknown; peliculas?: unknown }) =>
        (Array.isArray(g?.peliculas) ? g.peliculas : []).map((p) => ({ p, grupo: text(g?.nombre) })),
      );
      const peliculas = [...sueltas, ...agrupadas]
        .map(({ p, grupo }: { p: Record<string, unknown>; grupo?: string }) => {
          const titulo = text(p?.titulo);
          if (!titulo) return null;
          return {
            titulo,
            direccion: text(p.direccion),
            pais: text(p.pais),
            anio: text(p.anio) ?? (typeof p.anio === 'number' ? String(p.anio) : undefined),
            duracion: text(p.duracion),
            formato: text(p.formato),
            nota: text(p.nota),
            grupo,
          } as Pelicula;
        })
        .filter((p): p is Pelicula => p !== null);
      const grupos = [...new Set(peliculas.map((p) => p.grupo).filter((g): g is string => !!g))];
      return { id, nombre, descripcion: text(r.descripcion), peliculas, grupos } as Seccion;
    })
    .filter((s): s is Seccion => s !== null);
}

export const SELECCION = {
  fuente: text((data as { fuente?: unknown }).fuente) ?? null,
  secciones: normalize((data as { secciones?: unknown }).secciones),
};

export const totalPeliculas = SELECCION.secciones.reduce((n, s) => n + s.peliculas.length, 0);

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
