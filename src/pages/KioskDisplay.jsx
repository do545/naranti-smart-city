import { useRef, useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useTotem } from '@/contexts/TotemContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { updateHeartbeat, uploadScreenCapture } from '@/services/deviceService';
import { db } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import MainInterface from '@/components/MainInterface';
import FullscreenIdleAd from '@/components/FullscreenIdleAd';
import DynamicBackground from '@/components/DynamicBackground';
import { AlertTriangle, Construction, Maximize2 } from 'lucide-react';
import { clearAppCache } from '@/lib/clearAppCache';
import { clearOfflineMediaCache } from '@/utils/serviceWorker';
import { getScheduledBrightness, normalizeBrightnessSchedule } from '@/lib/brightnessSchedule';

// El prompt de pantalla completa solo debe aparecer al ENCENDER el kiosco
// (el navegador exige un gesto del usuario) o si la activación falla — NO cada
// vez que se regresa de un módulo (la página se re-monta pero el fullscreen
// del navegador sigue activo). Persistimos el arranque en sessionStorage:
// sobrevive a la navegación entre módulos, pero se reinicia al reiniciar el
// navegador del tótem (donde el gesto vuelve a ser necesario).
const FS_DONE_KEY = 'naranti_fullscreen_boot_done_v1';

const getIsDocumentFullscreen = () => !!(
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.msFullscreenElement
);

const readFullscreenBootDone = () => {
  try {
    return sessionStorage.getItem(FS_DONE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeFullscreenBootDone = () => {
  try {
    sessionStorage.setItem(FS_DONE_KEY, '1');
  } catch {
    // ignore
  }
};

const KioskDisplay = () => {
  const containerRef = useRef(null);
  const hasCompletedInitialFullscreenRef = useRef(readFullscreenBootDone());
  const [isCapturing, setIsCapturing] = useState(false);
  const [brightnessSchedule, setBrightnessSchedule] = useState([]);
  const [effectiveBrightness, setEffectiveBrightness] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(getIsDocumentFullscreen);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(
    () => !getIsDocumentFullscreen() && !readFullscreenBootDone()
  );
  const [fullscreenError, setFullscreenError] = useState(false);
  const { currentUser } = useAuth();
  useTimeOfDay();

  const {
    showFullscreenAd,
    config,
    globalAds,
    currentAdIndex
  } = useTotem();

  // --- FULLSCREEN MANAGEMENT ---
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;

      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }

      hasCompletedInitialFullscreenRef.current = true;
      writeFullscreenBootDone();
      setIsFullscreen(true);
      setFullscreenError(false);
      setShowFullscreenPrompt(false);
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
      setIsFullscreen(false);
      setFullscreenError(true);
      setShowFullscreenPrompt(!hasCompletedInitialFullscreenRef.current);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      setIsFullscreen(isFull);

      if (!isFull) {
        setTimeout(() => setShowFullscreenPrompt(!hasCompletedInitialFullscreenRef.current), 500);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        if (!isFullscreen) enterFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enterFullscreen, isFullscreen]);

  const handleKioskPointerDown = useCallback(() => {
    if (!isFullscreen && hasCompletedInitialFullscreenRef.current) {
      enterFullscreen();
    }
  }, [enterFullscreen, isFullscreen]);

  // --- WAKE LOCK (prevent screen sleep) ---
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('🔒 Wake Lock activo (Kiosco)');
          wakeLock.addEventListener('release', () => {
            console.log('🔓 Wake Lock liberado (Kiosco)');
          });
        }
      } catch (err) {
        console.warn('Wake Lock no disponible:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release().catch(() => { });
    };
  }, []);

  // --- HEARTBEAT LOGIC ---
  useEffect(() => {
    if (!currentUser) return;

    const sendPulse = async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

      const deviceId = currentUser.email.toLowerCase();
      const resolution = `${window.innerWidth}x${window.innerHeight}`;

      let locationData = {};
      try {
        if ("geolocation" in navigator) {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          locationData = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
        }
      } catch (err) {
        console.warn("Geolocation not available or denied:", err);
      }

      await updateHeartbeat(deviceId, {
        name: currentUser.displayName || deviceId,
        type: 'kiosk',
        resolution: resolution,
        currentAd: globalAds[currentAdIndex]?.name || 'Ninguno',
        lastUpdate: new Date().toISOString(),
        ...locationData
      });
    };

    sendPulse(); // Initial pulse
    const interval = setInterval(sendPulse, 30000); // Pulse every 30s
    return () => clearInterval(interval);
  }, [currentUser, globalAds, currentAdIndex]);

  // --- REMOTE COMMANDS LISTENER ---
  useEffect(() => {
    if (!currentUser) return;

    const deviceId = currentUser.email.toLowerCase();
    try {
      const raw = localStorage.getItem(`brightness_schedule_${deviceId}`);
      if (raw) setBrightnessSchedule(normalizeBrightnessSchedule(JSON.parse(raw)));
    } catch {
      // ignore
    }

    console.log("🎮 Escuchando comandos remotos (Kiosco):", deviceId);
    const unsub = onSnapshot(doc(db, 'kiosks', deviceId), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const command = data.lastCommand;
        const nextSchedule = normalizeBrightnessSchedule(data.brightnessSchedule);
        setBrightnessSchedule(nextSchedule);
        try {
          localStorage.setItem(`brightness_schedule_${deviceId}`, JSON.stringify(nextSchedule));
        } catch {
          // ignore
        }

        if (command) {
          const lastExecutedId = localStorage.getItem('last_command_id');
          if (command.id !== lastExecutedId) {
            localStorage.setItem('last_command_id', command.id);
            console.log("🚀 Comando recibido en Kiosco:", command.type);

            if (command.type === 'RELOAD') {
              window.location.reload();
            } else if (command.type === 'CLEAR_CACHE') {
              clearAppCache();
              window.location.reload();
            } else if (command.type === 'FACTORY_RESET') {
              clearAppCache({ includeAdsCache: true, includeKioskConfig: true });
              await clearOfflineMediaCache();
              setTimeout(() => window.location.reload(), 500);
            } else if (command.type === 'SCREENSHOT' && !isCapturing) {
              await handleCapture();
            }
          }
        }
      }
    });

    return () => unsub();
  }, [currentUser, isCapturing]);

  // --- BRIGHTNESS SCHEDULE (VISUAL DIMMING) ---
  useEffect(() => {
    const update = () => {
      setEffectiveBrightness(getScheduledBrightness(brightnessSchedule, new Date(), 100));
    };

    update();
    const id = setInterval(update, 15000);
    return () => clearInterval(id);
  }, [brightnessSchedule]);

  const handleCapture = async () => {
    if (!containerRef.current || !window.html2canvas) return;
    setIsCapturing(true);
    try {
      console.log("📸 Tomando captura de Kiosco...");
      const canvas = await window.html2canvas(containerRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#000000',
        scale: 0.4,
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (blob) {
        const campaignName = currentAd?.name || 'Inactivo/Fallback';
        await uploadScreenCapture(currentUser.email.toLowerCase(), blob, {
          campaignName,
          time: new Date().toLocaleTimeString()
        });
        console.log(`✅ Captura de Kiosco [${campaignName}] enviada.`);
      }
      setIsCapturing(false);
    } catch (error) {
      console.error("Error en captura de Kiosco:", error);
      setIsCapturing(false);
    }
  };

  const fallbackAd = {
    id: 'fallback-default',
    mediaType: 'image',
    type: 'banner',
    mediaUrl: '/offline-fallback.svg',
    verticalUrl: '/offline-fallback.svg',
    imageUrl: '/offline-fallback.svg',
    name: 'Modo Offline'
  };

  const currentAd = globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : fallbackAd;
  const adsToDisplay = globalAds && globalAds.length > 0 ? globalAds : [fallbackAd];

  // --- EMERGENCY MODE ---
  if (config?.isEmergency) {
    return (
      <div
        className="min-h-screen w-full bg-red-600 flex flex-col items-center justify-center text-white p-10 z-[9999] relative animate-pulse"
        style={{ cursor: isFullscreen ? 'none' : 'default' }}
        onClick={enterFullscreen}
      >
        <AlertTriangle size={140} className="mb-8" />
        <h1 className="text-6xl font-black text-center">EMERGENCIA</h1>
        <p className="text-3xl font-bold text-center mt-4">{config.emergencyMessage || "Alerta en curso"}</p>
      </div>
    );
  }

  // --- MAINTENANCE MODE ---
  if (config?.isMaintenance) {
    return (
      <div
        className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-center text-[#F36F21] p-10 z-[9999]"
        style={{ cursor: isFullscreen ? 'none' : 'default' }}
        onClick={enterFullscreen}
      >
        <Construction size={120} className="mb-6 animate-bounce" />
        <h1 className="text-5xl font-black text-white">En Mantenimiento</h1>
      </div>
    );
  }

  return (
    <main
      ref={containerRef}
      onPointerDownCapture={handleKioskPointerDown}
      className="min-h-screen relative overflow-hidden"
      style={{ cursor: isFullscreen ? 'none' : 'default' }}
    >
      <DynamicBackground />
      <Helmet><title>Naranti Smart City</title></Helmet>

      {showFullscreenPrompt && (
        <div
          className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center cursor-pointer select-none text-center px-8"
          onClick={enterFullscreen}
          onTouchStart={enterFullscreen}
        >
          <img
            src="https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/bf2a316b2876820b965e2c11cb65cc5c.png"
            alt="Naranti Logo"
            className="w-32 opacity-80 mb-8"
          />
          <Maximize2 size={82} className="text-[#F36F21] mb-6" />
          <h1 className="text-4xl font-black text-white mb-3">Naranti Kiosco</h1>
          {currentUser?.email && (
            <p className="text-sm text-white/40 font-mono mb-8">
              Dispositivo: {currentUser.email}
            </p>
          )}
          <div className="text-[#F36F21] text-2xl font-bold animate-pulse">
            {fullscreenError ? 'Toca para reintentar pantalla completa' : 'Toca para iniciar pantalla completa'}
          </div>
        </div>
      )}

      {/* Main Interface with Ads */}
      <MainInterface ads={adsToDisplay} />

      {/* Screensaver / Idle Ad */}
      {showFullscreenAd && <FullscreenIdleAd ad={currentAd} />}

      {effectiveBrightness < 100 && (
        <div
          className="fixed inset-0 z-[9999] bg-black pointer-events-none transition-opacity duration-500"
          style={{ opacity: Math.min(1, Math.max(0, 1 - effectiveBrightness / 100)) }}
        />
      )}
    </main>
  );
};

export default KioskDisplay;