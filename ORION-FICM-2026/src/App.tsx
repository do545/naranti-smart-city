import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DestinationId, OrionConfig } from './config/orion.config';
import { mergeKnown, sanitize } from './config/loadConfig';
import { DESTINATIONS } from './content/destinations';
import { CrashProbe, DebugPanel, initialSimulation, type Simulation } from './components/DebugPanel';
import { DestinationView } from './components/DestinationView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomeScreen } from './components/HomeScreen';
import { SeccionesView } from './components/SeccionesView';
import { SedesView } from './components/SedesView';
import { IdleOverlay, OfflineBanner } from './components/Overlays';
import { StatusScreen } from './components/StatusScreen';
import { createAdapter, type OrionCommand, type OrionStatus } from './integration';
import { logger } from './integration/logger';
import { exposeOrionApi } from './integration/orionApi';
import { armFullscreenOnFirstTouch } from './kiosk/fullscreen';
import { KioskStage, type StageMetrics } from './kiosk/KioskStage';
import { isWithinSchedule } from './kiosk/schedule';
import { useIdleReset } from './kiosk/useIdleReset';
import { useKioskGuards } from './kiosk/useKioskGuards';
import { useNetworkStatus } from './kiosk/useNetworkStatus';

type View = 'home' | DestinationId;

const STARTED_AT = new Date();

export function App({ initialConfig }: { initialConfig: OrionConfig }) {
  const [config, setConfig] = useState(initialConfig);
  const [view, setView] = useState<View>('home');
  const [sessionKey, setSessionKey] = useState(0);
  const [sim, setSim] = useState<Simulation>(initialSimulation);
  const [now, setNow] = useState(() => new Date());
  const metrics = useRef<StageMetrics | null>(null);
  const lastInteraction = useRef<string | null>(null);

  const online = useNetworkStatus(sim.offline);
  const enabled = config.experience.enabled && !sim.disabled;
  const withinSchedule = isWithinSchedule(config.schedule, now) && !sim.outOfSchedule;

  // Revisión de la ventana de fechas cada minuto.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const goHome = useCallback(() => {
    setView((v) => {
      if (v !== 'home') logger.info('go-home', { from: v });
      return 'home';
    });
  }, []);

  const resetSession = useCallback(() => {
    logger.info('idle-reset');
    setView('home');
    setSessionKey((k) => k + 1);
  }, []);

  const open = useCallback((id: DestinationId) => {
    logger.info('open-destination', { id });
    setView(id);
  }, []);

  useKioskGuards(config.kiosk.guards, goHome);

  const idle = useIdleReset({
    enabled: config.idle.enabled,
    active: view !== 'home',
    timeoutSeconds: sim.idleSeconds ?? config.idle.timeoutSeconds,
    warningSeconds: sim.idleSeconds ? 3 : config.idle.warningSeconds,
    onReset: resetSession,
    onInteraction: () => {
      lastInteraction.current = new Date().toISOString();
    },
  });

  useEffect(() => {
    if (!config.kiosk.requestFullscreenOnTouch) return;
    return armFullscreenOnFirstTouch();
  }, [config.kiosk.requestFullscreenOnTouch]);

  // Estado para el centro de control (futuro) y para window.ORION.
  const getStatus = useCallback(
    (): OrionStatus => ({
      app: 'orion-ficm-2026',
      version: config.version,
      view,
      online,
      enabled,
      withinSchedule,
      startedAt: STARTED_AT.toISOString(),
      uptimeSeconds: Math.round((Date.now() - STARTED_AT.getTime()) / 1000),
      lastInteractionAt: lastInteraction.current,
      lastError: logger.lastError(),
      viewport: {
        width: Math.round(metrics.current?.screen.width ?? window.innerWidth),
        height: Math.round(metrics.current?.screen.height ?? window.innerHeight),
        scale: Number((metrics.current?.scale ?? 1).toFixed(4)),
      },
    }),
    [config.version, view, online, enabled, withinSchedule],
  );

  const adapter = useMemo(() => createAdapter(initialConfig), [initialConfig]);

  const handleCommand = useCallback(
    (cmd: OrionCommand) => {
      logger.info('command', cmd);
      switch (cmd.type) {
        case 'goHome':
          resetSession();
          break;
        case 'reload':
          window.location.reload();
          break;
        case 'setEnabled':
          setConfig((c) => ({ ...c, experience: { ...c.experience, enabled: Boolean(cmd.enabled) } }));
          break;
        case 'setIdleTimeout':
          setConfig((c) => sanitize({ ...c, idle: { ...c.idle, timeoutSeconds: Number(cmd.seconds) } }));
          break;
        case 'setConfig':
          setConfig((c) => sanitize(mergeKnown(c, cmd.patch)));
          break;
      }
    },
    [resetSession],
  );

  useEffect(() => {
    void adapter.init(initialConfig);
    const off = adapter.onCommand(handleCommand);
    const unsub = logger.subscribe((e) => e.level !== 'info' && adapter.logError(e));
    return () => {
      off();
      unsub();
      adapter.dispose?.();
    };
  }, [adapter, initialConfig, handleCommand]);

  useEffect(() => {
    adapter.reportStatus(getStatus());
    const id = window.setInterval(() => adapter.reportStatus(getStatus()), 30_000);
    return () => window.clearInterval(id);
  }, [adapter, getStatus]);

  useEffect(() => exposeOrionApi({ status: getStatus, command: handleCommand }), [getStatus, handleCommand]);

  // Errores no capturados: se registran (la interfaz sigue en pie).
  useEffect(() => {
    const onError = (e: ErrorEvent) => logger.error('window-error', { message: e.message, source: e.filename, line: e.lineno });
    const onRejection = (e: PromiseRejectionEvent) => logger.error('unhandled-rejection', { reason: String(e.reason) });
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const mode = sim.mode ?? (view !== 'home' ? config.navigation.overrides[view] : null) ?? config.navigation.mode;
  const reducedMotion = config.performance.lowPower ? 'always' : 'user';

  let content;
  if (!enabled) {
    content = <StatusScreen key="disabled" title="Muy pronto" message="Esta experiencia no está disponible por el momento." />;
  } else if (!withinSchedule) {
    content = (
      <StatusScreen
        key="schedule"
        title="Te esperamos"
        message="Esta experiencia estará disponible durante el festival."
        detail={config.festival.datesLabel}
      />
    );
  } else {
    content = (
      <>
        <HomeScreen
          key="home"
          datesLabel={config.festival.datesLabel}
          onOpen={open}
          sessionKey={sessionKey}
          animatedHeader={config.experience.animatedHeader}
        />
        <AnimatePresence>
          {view !== 'home' && (
            <motion.div
              key={view}
              className="layer"
              initial={{ opacity: 0, scale: 0.97, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 30 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              {view === 'secciones' ? (
                <SeccionesView onExit={goHome} onHome={goHome} />
              ) : view === 'sedes' ? (
                <SedesView onExit={goHome} onHome={goHome} />
              ) : (
              <DestinationView
                destination={DESTINATIONS[view]}
                url={config.links[view]}
                mode={mode}
                online={online}
                iframeTimeoutSeconds={config.navigation.iframeTimeoutSeconds}
                iframeZoom={config.navigation.iframeZoom}
                onBack={goHome}
                onHome={goHome}
              />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <MotionConfig reducedMotion={reducedMotion}>
      <div
        className={[
          'orion',
          config.performance.lowPower ? 'is-low-power' : '',
          sim.showTouch ? 'show-touch' : '',
        ].join(' ')}
      >
        <KioskStage
          designWidth={config.display.width}
          designHeight={config.display.height}
          screenOverride={sim.screen}
          onMetrics={(m) => (metrics.current = m)}
        >
          {() => (
            <ErrorBoundary reloadSeconds={config.kiosk.errorReloadSeconds}>
              <CrashProbe crash={sim.crash} />
              {content}
              <OfflineBanner online={online} />
              <IdleOverlay remaining={idle.remaining} onContinue={idle.dismiss} />
            </ErrorBoundary>
          )}
        </KioskStage>
        {config.debug.panel && <DebugPanel sim={sim} setSim={setSim} status={getStatus} onHome={resetSession} />}
      </div>
    </MotionConfig>
  );
}
