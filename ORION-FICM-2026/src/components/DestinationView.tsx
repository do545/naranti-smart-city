import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { NavigationMode } from '../config/orion.config';
import { BRAND } from '../content/brand';
import type { Destination } from '../content/destinations';
import { logger } from '../integration/logger';
import { Decorations } from './Decorations';
import { ArrowLeftIcon, HomeIcon, iconFor, QrIcon, WifiOffIcon } from './Icons';
import { KioskNavigation } from './KioskNavigation';
import { NarantiFooter } from './NarantiFooter';
import { CinepolisMark } from './OfficialLinks';
import { QrCode } from './QrCode';
import { press, rise, spring, stagger } from './motionPresets';

interface Props {
  destination: Destination;
  url: string | null;
  mode: NavigationMode;
  online: boolean;
  iframeTimeoutSeconds: number;
  iframeZoom: number;
  onBack: () => void;
  onHome: () => void;
}

const MODE_LABEL: Record<NavigationMode, string> = {
  preview: 'Vista previa de diseño',
  iframe: 'Dentro del kiosco',
  qr: 'Código QR para el teléfono',
};

/**
 * Pantalla de cada destino. En la etapa de diseño (modo "preview") no carga
 * ningún sitio externo: muestra cómo se verá y a dónde llevará el botón.
 */
export function DestinationView({ destination: d, url, mode, online, iframeTimeoutSeconds, iframeZoom, onBack, onHome }: Props) {
  const [embedFailed, setEmbedFailed] = useState(false);
  useEffect(() => setEmbedFailed(false), [d.id, url, mode]);
  const failEmbed = useCallback(() => setEmbedFailed(true), []);

  if (mode === 'iframe' && url && online && !embedFailed) {
    return (
      <EmbeddedFrame
        destination={d}
        url={url}
        timeoutSeconds={iframeTimeoutSeconds}
        zoom={iframeZoom}
        onFail={failEmbed}
        onBack={onBack}
        onHome={onHome}
      />
    );
  }

  const effectiveMode: NavigationMode = mode === 'iframe' && embedFailed ? 'qr' : mode;

  return (
    <div className={`screen destination destination--${d.id}`}>
      <Hero destination={d} />
      <div className="destination__glass-top">
        <KioskNavigation variant="pill" onBack={onBack} onHome={onHome} />
      </div>

      <motion.div className="destination__body" variants={stagger} initial="hidden" animate="shown">
        <motion.p className="destination__kicker" variants={rise}>
          24.º Festival Internacional de Cine de Morelia
        </motion.p>
        <motion.h1 className="destination__title" variants={rise}>
          {d.title}
        </motion.h1>
        <motion.div className="destination__accent" variants={rise} aria-hidden="true" />
        <motion.p className="destination__description" variants={rise}>
          {d.description}
        </motion.p>

        <motion.div variants={rise}>
          {!url ? (
            <PendingPanel />
          ) : mode === 'iframe' && !online ? (
            <OfflinePanel />
          ) : effectiveMode === 'qr' ? (
            <QrPanel url={url} fallback={embedFailed} />
          ) : (
            <PreviewPanel url={url} />
          )}
        </motion.div>
      </motion.div>

      <div className="destination__footer">
        <KioskNavigation onBack={onBack} onHome={onHome} />
        <NarantiFooter compact />
      </div>
      <Decorations header={false} />
    </div>
  );
}

function Hero({ destination: d }: { destination: Destination }) {
  if (d.photo) {
    const Icon = iconFor(d.icon as 'pin' | 'film');
    return (
      <motion.div
        className="destination__hero"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <img className="destination__hero-photo" src={d.photo} alt="" draggable={false} />
        <span className="destination__hero-shade" aria-hidden="true" />
        <Icon className="destination__hero-icon" size={96} stroke={1.8} />
      </motion.div>
    );
  }
  return (
    <motion.div
      className={`destination__hero destination__hero--brand destination__hero--${d.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      {d.id === 'cinepolis' ? (
        <CinepolisMark large />
      ) : (
        <img className="destination__hero-ficm" src={BRAND.ficmLogo} alt="FICM" draggable={false} />
      )}
    </motion.div>
  );
}

function PreviewPanel({ url }: { url: string }) {
  return (
    <div className="panel">
      <span className="panel__badge">{MODE_LABEL.preview}</span>
      <p className="panel__lead">En el kiosco, este botón abrirá el contenido oficial con el regreso siempre visible.</p>
      <dl className="panel__rows">
        <div>
          <dt>Destino configurado</dt>
          <dd className="panel__url">{url}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>Enlace listo · no se abre durante la revisión del diseño</dd>
        </div>
      </dl>
    </div>
  );
}

function PendingPanel() {
  return (
    <div className="panel panel--pending">
      <span className="panel__badge panel__badge--muted">{MODE_LABEL.preview}</span>
      <p className="panel__lead">Muy pronto podrás consultar aquí el contenido oficial del festival.</p>
      <dl className="panel__rows">
        <div>
          <dt>Destino</dt>
          <dd>Enlace oficial pendiente de verificar</dd>
        </div>
      </dl>
    </div>
  );
}

function QrPanel({ url, fallback }: { url: string; fallback: boolean }) {
  return (
    <div className="panel panel--qr">
      <QrCode value={url} size={300} />
      <div className="panel__qr-copy">
        <span className="panel__badge">
          <QrIcon size={26} /> {MODE_LABEL.qr}
        </span>
        <p className="panel__lead">
          {fallback
            ? 'Este contenido no puede mostrarse en la pantalla. Escanéalo para abrirlo en tu teléfono.'
            : 'Escanea el código para continuar en tu teléfono.'}
        </p>
        <p className="panel__url">{url}</p>
      </div>
    </div>
  );
}

function OfflinePanel() {
  return (
    <div className="panel panel--offline">
      <span className="panel__badge panel__badge--muted">
        <WifiOffIcon size={26} /> Sin conexión
      </span>
      <p className="panel__lead">No hay conexión en este momento. El contenido se mostrará en cuanto vuelva la red.</p>
    </div>
  );
}

/**
 * Carga controlada de un sitio oficial dentro del kiosco (modo "iframe").
 *  - Barra superior fija con Regresar, la marca del sitio, código QR e Inicio:
 *    el visitante siempre puede volver.
 *  - Sin ventanas emergentes ni navegación de la ventana principal (sandbox sin
 *    `allow-popups` ni `allow-top-navigation`): nunca se sale del kiosco.
 *  - `zoom` amplía el sitio para la pantalla vertical (texto y botones más grandes).
 *  - Si el sitio no se muestra a tiempo se pasa al respaldo con QR. No se intenta
 *    evadir las restricciones de los sitios que no permiten ser integrados.
 */
function EmbeddedFrame({
  destination: d,
  url,
  timeoutSeconds,
  zoom,
  onFail,
  onBack,
  onHome,
}: {
  destination: Destination;
  url: string;
  timeoutSeconds: number;
  zoom: number;
  onFail: () => void;
  onBack: () => void;
  onHome: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [showQr, setShowQr] = useState(false);
  useEffect(() => setLoaded(false), [url]);
  useEffect(() => {
    if (loaded) return;
    const t = window.setTimeout(() => {
      logger.warn('iframe-timeout', { url });
      onFail();
    }, timeoutSeconds * 1000);
    return () => window.clearTimeout(t);
  }, [loaded, url, timeoutSeconds, onFail]);

  const z = Math.min(2, Math.max(1, zoom || 1));

  return (
    <div className={`screen embedded embedded--${d.id}`}>
      <div className="embedded__bar">
        <motion.button type="button" className="kiosk-nav__pill-btn embedded__back" data-touch whileTap={press} transition={spring} onClick={onBack}>
          <ArrowLeftIcon size={40} />
          <span>Regresar</span>
        </motion.button>
        <span className="embedded__brand">
          {d.id === 'cinepolis' ? (
            <CinepolisMark />
          ) : (
            <img className="embedded__ficm" src={BRAND.ficmLogo} alt={d.title} draggable={false} />
          )}
        </span>
        <motion.button
          type="button"
          className="embedded__round"
          aria-label="Abrir en el teléfono con código QR"
          data-touch
          whileTap={press}
          transition={spring}
          onClick={() => setShowQr(true)}
        >
          <QrIcon size={40} />
        </motion.button>
        <motion.button type="button" className="embedded__round" aria-label="Ir al inicio" data-touch whileTap={press} transition={spring} onClick={onHome}>
          <HomeIcon size={40} />
        </motion.button>
      </div>

      <div className="embedded__viewport">
        {!loaded && (
          <div className="embedded__loading" role="status">
            <span className="reel-spinner" aria-hidden="true" />
            <span>Cargando contenido oficial…</span>
          </div>
        )}
        <iframe
          className="embedded__frame"
          title={d.title}
          src={url}
          sandbox="allow-scripts allow-same-origin allow-forms"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => {
            setLoaded(true);
            logger.info('iframe-loaded', { url });
          }}
          style={{
            opacity: loaded ? 1 : 0,
            width: `${100 / z}%`,
            height: `${100 / z}%`,
            transform: z === 1 ? undefined : `scale(${z})`,
          }}
        />
      </div>

      <div className="embedded__footer">
        <NarantiFooter compact />
      </div>

      {showQr && (
        <motion.div className="overlay overlay--qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <motion.div className="qr-card glass" initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} transition={spring}>
            <QrCode value={url} size={420} />
            <p className="qr-card__title">Continúa en tu teléfono</p>
            <p className="qr-card__url">{url}</p>
            <motion.button type="button" className="idle-card__button" data-touch whileTap={press} transition={spring} onClick={() => setShowQr(false)}>
              Volver al sitio
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
