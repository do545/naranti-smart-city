# Publicación (para el equipo de Naranti)

> Esta entrega **no** publica, despliega ni crea URLs. Este documento solo describe cómo podría hacerlo el equipo de Naranti cuando lo decida.

## Qué publicar

Después de `npm run build`, se publica **únicamente el contenido de `dist/`**:

```
dist/index.html
dist/orion.config.json
dist/assets/*
```

- Es un sitio 100 % estático, sin servidor, base de datos ni variables de entorno.
- Las rutas son relativas (`base: './'`): sirve en `https://dominio/` o en `https://dominio/cualquier/subruta/`.
- No hay enrutado del lado del cliente, así que no hacen falta reglas de reescritura.

## Cabeceras recomendadas

| Ruta | Cache-Control |
|---|---|
| `/assets/*` | `public, max-age=31536000, immutable` (los nombres llevan hash) |
| `/index.html` | `no-cache` |
| `/orion.config.json` | `no-cache` (para que los cambios de enlaces se vean al recargar) |

## Opciones habituales (referencia)

- **Netlify**: carpeta de publicación `dist`, comando `npm run build`.
- **Vercel**: framework "Vite", salida `dist`.
- **Hosting estático o servidor propio** (Nginx, Apache, IIS, S3 + CDN…): copiar `dist/` tal cual.

## Abrir en el kiosco ORION

La URL que configure el equipo puede llevar parámetros, por ejemplo:

```
https://<dominio-de-naranti>/orion-ficm/?idle=60
```

En el kiosco se recomienda el navegador en modo kiosco o pantalla completa, configurado por el equipo de Naranti. Esta interfaz **no** ejecuta comandos sobre el hardware.

## Comprobación tras publicar

1. Abrir la URL a 1080 × 1920 y comparar con `docs/vista-previa-1080x1920.png`.
2. Revisar en la consola `window.ORION.status()`.
3. Tocar cada tarjeta y volver con **Regresar** e **Inicio**.
4. Editar `orion.config.json` en el servidor, recargar y confirmar el cambio.
