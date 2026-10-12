import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ORION · FICM 2026
// `base: './'` genera rutas relativas: la carpeta `dist/` funciona en cualquier
// hosting estático (Netlify, Vercel, servidor propio) y en cualquier subruta,
// sin reglas de reescritura.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    assetsInlineLimit: 4096,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
  },
});
