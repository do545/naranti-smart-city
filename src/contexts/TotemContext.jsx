import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getActiveCampaigns } from '@/services/campaignService';
import { recordInteraction, recordTaps } from '@/services/statsService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { precacheMediaUrls } from '@/utils/serviceWorker';
import { DEFAULT_AD_ROTATION_SECONDS, getAdRotationMs, normalizeAdRotationSeconds } from '@/lib/adRotation';

const TotemContext = createContext();

export const useTotem = () => {
  const context = useContext(TotemContext);
  if (!context) {
    throw new Error('useTotem must be used within a TotemProvider');
  }
  return context;
};

const DEFAULT_CONFIG = {
  isEmergency: false,
  isMaintenance: false,
  emergencyMessage: 'Emergencia en curso',
  showBanner: true,
  bannerUrl: '',
  backgroundColor: '#FFFBF5',
  adRotationSeconds: DEFAULT_AD_ROTATION_SECONDS
};

function getCachedAds(deviceId) {
  if (typeof window === 'undefined' || !deviceId) return [];

  try {
    const cached = localStorage.getItem(`ads_cache_${deviceId}`);
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const TotemProvider = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  const lastPrecacheKeyRef = useRef('');
  // Sesión/rol actuales legibles desde listeners montados una sola vez
  // (el efecto de idle usa deps [] a propósito para no reiniciar el timer).
  const authRef = useRef({ user: null, role: null });
  useEffect(() => {
    authRef.current = { user: currentUser, role: userRole };
  }, [currentUser, userRole]);
  const [isHeaderAdVisible, setIsHeaderAdVisible] = useState(true);
  const [currentWeather, setCurrentWeather] = useState({
    temperature: 24,
    condition: 'Soleado'
  });
  const [isIdle, setIsIdle] = useState(false);
  const [showFullscreenAd, setShowFullscreenAd] = useState(false);
  // 🚀 ESTADO UNIFICADO: Controla qué anuncio se muestra en cualquier modo.
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  // ESTADO GLOBAL DE PUBLICIDAD (La "Antena")
  const [globalAds, setGlobalAds] = useState([]);
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('kiosk_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch (e) {
      console.error("Error parsing config from local storage", e);
      return DEFAULT_CONFIG;
    }
  });
  const adRotationSeconds = normalizeAdRotationSeconds(config?.adRotationSeconds);
  const adRotationMs = getAdRotationMs(adRotationSeconds);

  // --- ANTENA: Descargar Publicidad Centralizada (Cada 30s) ---
  const fetchAds = useCallback(async () => {
    // 🔒 Sin autenticación no hacemos queries a Firestore (evita "Missing or insufficient permissions")
    if (!currentUser) {
      const cachedId = (localStorage.getItem('kiosk_id') || 'kisco_bodega').toLowerCase();
      const cached = getCachedAds(cachedId);
      if (cached.length > 0) setGlobalAds(cached);
      return;
    }

    // 🆔 IDENTIDAD DINÁMICA DEL KIOSCO
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id');

    if (urlId) {
      localStorage.setItem('kiosk_id', urlId);
      console.log("🆔 Kiosco configurado con nuevo ID URL:", urlId);
    }

    // PRIORIDAD DE IDENTIDAD:
    // 1. Usuario Autenticado (Email) -> ES LA CLAVE PARA CAMPAÑAS POR USUARIO
    // 2. ID en LocalStorage (Configuración manual)
    // 3. Fallback estático
    const DEVICE_ID = (currentUser?.email || localStorage.getItem('kiosk_id') || "Kisco Bodega").toLowerCase();

    // 🕵️ DETECCIÓN DE TIPO DE DISPOSITIVO DINÁMICO
    // Al estar fuera del Router, leemos el pathname directamente de la ventana
    const isScreenPath = window.location.pathname.includes('/screen');
    const deviceType = isScreenPath ? 'screen' : 'kiosk';
    const isAdminPath = window.location.pathname.startsWith('/smartcity/admin');
    const isLoginPath = window.location.pathname === '/login';
    const shouldPrecacheMedia = !isAdminPath && !isLoginPath;

    const collectMediaUrls = (campaigns) => {
      const urls = [];
      for (const camp of campaigns || []) {
        if (!camp) continue;
        if (camp.verticalUrl) urls.push(camp.verticalUrl);
        if (camp.horizontalUrl) urls.push(camp.horizontalUrl);
        if (camp.screenUrl) urls.push(camp.screenUrl);
        if (camp.mediaUrl) urls.push(camp.mediaUrl);
        if (camp.imageUrl) urls.push(camp.imageUrl);
      }
      return Array.from(new Set(urls.filter(Boolean))).sort();
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        const cached = getCachedAds(DEVICE_ID);
        if (cached.length > 0) {
          setGlobalAds(cached);
          return;
        }
      }

      console.log(`📡 Contexto buscando campañas para ${deviceType}:`, DEVICE_ID);
      const campaigns = await getActiveCampaigns(DEVICE_ID, deviceType);

      // Si estamos en pantalla, filtramos muy estrictamente o confiamos en el servicio
      const nextCampaigns = campaigns || [];
      const cached = getCachedAds(DEVICE_ID);
      setGlobalAds(nextCampaigns.length > 0 ? nextCampaigns : cached);

      if (nextCampaigns.length > 0) {
        localStorage.setItem(`ads_cache_${DEVICE_ID}`, JSON.stringify(nextCampaigns));
        // ✅ Offline real: precache de media (imágenes/videos) en Service Worker.
        // Esto permite seguir mostrando publicidad aunque se caiga el internet.
        if (shouldPrecacheMedia) {
          const urls = collectMediaUrls(nextCampaigns);
          const key = `${DEVICE_ID}:${urls.join('|')}`;
          if (urls.length > 0 && key !== lastPrecacheKeyRef.current) {
            lastPrecacheKeyRef.current = key;
            precacheMediaUrls(urls);
          }
        }
      }
    } catch (error) {
      console.error("Error cargando publicidad en contexto:", error);
      const cached = getCachedAds(DEVICE_ID);
      if (cached.length > 0) setGlobalAds(cached);
    }
  }, [currentUser]); // Dependemos de currentUser para re-disparar cuando loguea

  useEffect(() => {
    fetchAds();

    // 🕵️ OBSERVADOR DE RUTA: Disparar fetchAds si la ruta cambia (Login -> Screen)
    // Como estamos fuera del Router, escuchamos el evento popstate y comprobamos periódicamente
    const handleLocationChange = () => {
      console.log("🌐 Cambio de ruta detectado, actualizando publicidad...");
      fetchAds();
    };

    window.addEventListener('popstate', handleLocationChange);

    // Backup: Comprobar la ruta cada 2 segundos por si el Router no dispara popstate
    const pathCheckInterval = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== sessionStorage.getItem('last_path')) {
        sessionStorage.setItem('last_path', currentPath);
        fetchAds();
      }
    }, 2000);

    const interval = setInterval(fetchAds, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(pathCheckInterval);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [fetchAds]);

  // --- ANTENA CONFIG: Sincronizar Configuración Visual (Tiempo Real) ---
  useEffect(() => {
    // 🔒 Solo suscribirse cuando hay sesión activa (evita "Missing or insufficient permissions")
    if (!currentUser) return;
    
    const unsub = onSnapshot(doc(db, "settings", "kiosk_config"), (doc) => {
      if (doc.exists()) {
        const remoteConfig = doc.data();
        console.log("🎨 Configuración remota recibida:", remoteConfig);
        // Fusionamos con el estado actual para no perder valores locales temporales si fuera necesario,
        // pero aquí queremos que la red mande, así que sobrescribimos con seguridad.
        setConfig(prev => ({
          ...prev,
          ...remoteConfig
        }));
      }
    }, (error) => {
      console.error("Error syncing config:", error);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('kiosk_config', JSON.stringify(config));
  }, [config]);

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleMaintenance = () => {
    setConfig(prev => ({ ...prev, isMaintenance: !prev.isMaintenance }));
  };

  const toggleEmergency = () => {
    setConfig(prev => ({ ...prev, isEmergency: !prev.isEmergency }));
  };

  // 🚀 LÓGICA 1: ROTACIÓN DEL BANNER (Solo si NO está en Pantalla Completa)
  useEffect(() => {
    let rotationInterval;
    // Si estamos en Fullscreen, la rotación la controla el componente FullscreenIdleAd (videos/imágenes)
    // Si NO estamos en Fullscreen, rotamos automáticamente según la configuración del sistema.
    if (!showFullscreenAd && globalAds.length > 1) {
      rotationInterval = setInterval(() => {
        setCurrentAdIndex(prevIndex => (prevIndex + 1) % globalAds.length);
      }, adRotationMs);
    }
    return () => {
      if (rotationInterval) clearInterval(rotationInterval);
    };
  }, [adRotationMs, globalAds, showFullscreenAd]); // Añadimos showFullscreenAd como dependencia

  // Función para avanzar manualmente (Usada por el video cuando termina)
  const handleNextAd = useCallback(() => {
    if (globalAds.length > 1) {
      setCurrentAdIndex(prevIndex => (prevIndex + 1) % globalAds.length);
    }
  }, [globalAds]);

  // 🧘 LÓGICA 2: DETECCIÓN DE INACTIVIDAD (20 segundos)

  // Usamos una referencia para tener acceso a los ads actuales dentro del timeout
  // sin tener que reiniciar el timer cada vez que cambian los ads.
  const adsRef = useRef(globalAds);
  useEffect(() => {
    adsRef.current = globalAds;
  }, [globalAds]);

  useEffect(() => {
    let idleTimeout;

    const resetIdleTimer = () => {
      // Si ya estamos inactivos (fullscreen activado), NO reiniciamos el timer con interacciones simples
      // a menos que sea una interacción REAL (click, touch, etc).
      // Pero aquí simplificamos: cualquier input resetea.

      clearTimeout(idleTimeout);

      // SOLO si estamos "despiertos" o si esto viene de una interacción real, apagamos el fullscreen.
      // Pero cuidado: si esto corre al montar, apaga el fullscreen.

      // ESTRATEGIA:
      // Al detectar actividad, "despertamos" el kiosco.
      setShowFullscreenAd(false);
      setIsIdle(false);

      idleTimeout = setTimeout(function scheduleIdleCheck() {
        setIsIdle(true);
        if (adsRef.current.length > 0) {
          setShowFullscreenAd(true);
        } else {
          // Sin anuncios disponibles aún — reintentar en 20 s
          idleTimeout = setTimeout(scheduleIdleCheck, 20000);
        }
      }, 20000); // 20 segundos de inactividad
    };

    const resetOnlyEvents = ['mousemove', 'keypress', 'scroll', 'touchmove'];
    const recordEvents = ['mousedown', 'touchstart', 'click'];

    // ── 🧮 MÉTRICA DE CONTACTOS REALES ──────────────────────────────────
    // Una "interacción" = UNA persona que llegó y usó el kiosco, no cada
    // toque. El primer toque tras SESSION_GAP_MS sin toques abre una sesión
    // de contacto y suma 1; todo lo que esa persona siga tocando ya no
    // infla el conteo (se acumula aparte como 'taps' = profundidad de uso).
    //
    // Además:
    // - TAP_DEDUPE_MS colapsa los eventos sintetizados del navegador
    //   (un tap táctil dispara touchstart + mousedown + click: antes eso
    //   contaba 3 veces, ahora cuenta 1).
    // - Solo registran los dispositivos con rol 'kiosk' (el admin navegando
    //   el panel o probando en su laptop, el login y las pantallas pasivas
    //   ya no ensucian la métrica).
    // - El timestamp del último contacto se persiste en localStorage para
    //   que un RELOAD remoto no genere contactos fantasma.
    const SESSION_GAP_MS = 60000;   // 60s sin toques = la próxima persona es un contacto nuevo
    const TAP_DEDUPE_MS = 400;      // ventana para touchstart+mousedown+click del MISMO gesto
    const TAPS_FLUSH_AT = 20;       // escribir toques acumulados en lotes
    const LAST_CONTACT_KEY = 'naranti_last_contact_ts_v1';

    let lastGestureTs = 0;
    let lastContactTs = (() => {
      try {
        return Number(localStorage.getItem(LAST_CONTACT_KEY)) || 0;
      } catch {
        return 0;
      }
    })();
    let pendingTaps = 0;

    const getDeviceId = () => {
      const { user } = authRef.current;
      return (user?.email || localStorage.getItem('kiosk_id') || 'kisco_bodega').toLowerCase();
    };

    const flushTaps = () => {
      if (pendingTaps <= 0) return;
      const count = pendingTaps;
      pendingTaps = 0;
      recordTaps(getDeviceId(), count);
    };

    // Función wrapper para el evento que SOLO resetea el timer
    const onActivity = () => {
      resetIdleTimer();
    };

    // Función wrapper para el evento que resetea + mide contacto real
    const onRealInteraction = () => {
      resetIdleTimer();

      // Solo miden los kioscos físicos (rol 'kiosk') fuera del panel/login.
      const { role } = authRef.current;
      if (role !== 'kiosk') return;
      const path = window.location.pathname;
      if (path.startsWith('/smartcity/admin') || path === '/login') return;

      const now = Date.now();

      // Mismo gesto físico (tap = touchstart + mousedown + click): contar 1.
      if (now - lastGestureTs < TAP_DEDUPE_MS) return;
      lastGestureTs = now;

      // Profundidad de uso (se escribe en lotes, no por tap).
      pendingTaps += 1;
      if (pendingTaps >= TAPS_FLUSH_AT) flushTaps();

      // Contacto real: primer toque tras SESSION_GAP_MS sin toques.
      if (now - lastContactTs >= SESSION_GAP_MS) {
        recordInteraction(getDeviceId());
      }
      lastContactTs = now;
      try {
        localStorage.setItem(LAST_CONTACT_KEY, String(now));
      } catch {
        // ignore
      }
    };

    // Al quedar inactivo (protector de anuncios) cerramos el lote de toques.
    const flushInterval = setInterval(() => {
      flushTaps();
    }, 30000);

    resetOnlyEvents.forEach(event => window.addEventListener(event, onActivity));
    recordEvents.forEach(event => window.addEventListener(event, onRealInteraction));

    // Iniciamos el timer por primera vez
    resetIdleTimer();
    return () => {
      resetOnlyEvents.forEach(event => window.removeEventListener(event, onActivity));
      recordEvents.forEach(event => window.removeEventListener(event, onRealInteraction));
      clearTimeout(idleTimeout);
      clearInterval(flushInterval);
      flushTaps();
    };
    // 🚨 CLAVE: Quitamos [globalAds] de las dependencias.
    // Ahora el timer NO se reinicia cuando se actualizan los anuncios en segundo plano.
  }, []);

  const value = {
    isHeaderAdVisible,
    setIsHeaderAdVisible,
    currentWeather,
    setCurrentWeather,
    isIdle,
    setIsIdle,
    showFullscreenAd,
    setShowFullscreenAd,
    handleNextAd, // Exportamos el controlador manual
    // 🚨 ÚNICO ÍNDICE PARA SINCRONIZACIÓN
    currentAdIndex,
    adRotationSeconds,
    adRotationMs,
    config,
    setConfig,
    updateConfig,
    toggleMaintenance,
    toggleEmergency,
    globalAds // Exportamos los anuncios a toda la app
  };

  return (
    <TotemContext.Provider value={value}>
      {children}
    </TotemContext.Provider>
  );
};

export default TotemProvider;