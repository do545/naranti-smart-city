// Detección de tipo de media POR ARCHIVO (no por campaña).
//
// Una campaña tiene un solo campo `mediaType`, pero hasta 3 archivos distintos
// (vertical / horizontal / pantalla) que pueden ser mezcla de imagen y video.
// Decidir por el campo global provoca videos dentro de <img> (ícono roto) o
// imágenes dentro de <video> (pantalla negra). Aquí decidimos por la extensión
// del archivo que realmente se va a pintar, con `mediaType` solo como respaldo
// para URLs sin extensión reconocible (p. ej. blob: en previews).

const VIDEO_EXT_RE = /\.(mp4|webm|ogg|ogv|mov|m4v|avi|mkv)([?#]|$)/i;
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|avif|svg|bmp)([?#]|$)/i;

export function isVideoMedia(url, mediaTypeHint) {
  let decoded = String(url || '');
  try {
    // Las URLs de Firebase Storage codifican la ruta (campaigns%2F..._video.mp4)
    decoded = decodeURIComponent(decoded);
  } catch {
    // URL malformada: seguimos con la cruda.
  }

  if (VIDEO_EXT_RE.test(decoded)) return true;
  if (IMAGE_EXT_RE.test(decoded)) return false;
  return mediaTypeHint === 'video';
}
