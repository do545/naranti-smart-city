import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Tipografías autoalojadas (sin peticiones a servicios externos).
import '@fontsource/playfair-display/latin-800.css';
import '@fontsource/playfair-display/latin-900.css';
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';

import './styles/tokens.css';
import './styles/global.css';
import './styles/home.css';
import './styles/destination.css';
import './styles/secciones.css';
import './styles/overlays.css';

import { App } from './App';
import { defaultConfig } from './config/orion.config';
import { loadConfig } from './config/loadConfig';
import { logger, serializeError } from './integration/logger';

// Kiosco: cargar desde el inicio todos los pesos tipográficos usados, para que
// sigan disponibles aunque la conexión se pierda más tarde.
const FONT_FACES = ['800 1em "Playfair Display"', '900 1em "Playfair Display"', '400 1em Montserrat', '500 1em Montserrat', '600 1em Montserrat'];
if ('fonts' in document) {
  Promise.all(FONT_FACES.map((f) => document.fonts.load(f))).catch((err) => logger.warn('fonts-preload', serializeError(err)));
}

const root = createRoot(document.getElementById('root')!);

loadConfig()
  .then(({ config, source }) => {
    logger.info('config-loaded', { source });
    root.render(
      <StrictMode>
        <App initialConfig={config} />
      </StrictMode>,
    );
  })
  .catch((err) => {
    logger.error('config-failed', serializeError(err));
    root.render(<App initialConfig={defaultConfig} />);
  });
