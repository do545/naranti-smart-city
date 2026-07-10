import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useTotem } from '@/contexts/TotemContext';
import { useAuth } from '@/contexts/AuthContext';
import { updateHeartbeat, uploadScreenCapture } from '@/services/deviceService';
import { db } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Construction, Monitor, MousePointerClick } from 'lucide-react';
import { clearAppCache } from '@/lib/clearAppCache';
import { clearOfflineMediaCache } from '@/utils/serviceWorker';
import { getScheduledBrightness, normalizeBrightnessSchedule } from '@/lib/brightnessSchedule';
import { isVideoMedia } from '@/lib/media';

const ScreenMode = () => {
    const containerRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [mediaError, setMediaError] = useState(false);
    const [brightnessSchedule, setBrightnessSchedule] = useState([]);
    const [effectiveBrightness, setEffectiveBrightness] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
    const [fullscreenError, setFullscreenError] = useState(false);
    const {
        config,
        globalAds,
        adRotationMs,
    } = useTotem();

    const { currentUser } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);

    // --- FULLSCREEN MANAGEMENT ---
    const enterFullscreen = useCallback(async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen(); // Safari
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen(); // IE/Edge legacy
            }
            setIsFullscreen(true);
            setFullscreenError(false);
            setShowFullscreenPrompt(false);
        } catch (err) {
            console.warn('Fullscreen request failed:', err);
            setIsFullscreen(false);
            setFullscreenError(true);
            setShowFullscreenPrompt(true);
        }
    }, []);

    // Listen for fullscreen changes (user pressing Escape, F11, etc.)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
            setIsFullscreen(isFull);
            if (!isFull && !showFullscreenPrompt) {
                // User exited fullscreen — show re-entry prompt after a brief delay
                setTimeout(() => setShowFullscreenPrompt(true), 500);
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
    }, [showFullscreenPrompt]);

    // Handle F11 key to enter fullscreen
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                if (!isFullscreen) {
                    enterFullscreen();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen, enterFullscreen]);

    // --- WAKE LOCK (prevent screen sleep) ---
    useEffect(() => {
        let wakeLock = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('🔒 Wake Lock activo — pantalla no se suspenderá');
                    wakeLock.addEventListener('release', () => {
                        console.log('🔓 Wake Lock liberado');
                    });
                }
            } catch (err) {
                console.warn('Wake Lock no disponible:', err);
            }
        };

        requestWakeLock();

        // Re-acquire wake lock when tab becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLock) wakeLock.release().catch(() => {});
        };
    }, []);

    // Safely get current ad
    const currentAd = globalAds && globalAds.length > 0 ? globalAds[currentIndex] : null;

    // Fallback ad if none exist
    const fallbackAd = {
        id: 'fallback-default',
        mediaType: 'image',
        imageUrl: '/offline-fallback.svg',
        name: 'Modo Offline'
    };

    const adToDisplay = currentAd || fallbackAd;
    const displayAd = mediaError ? fallbackAd : adToDisplay;
    const mediaSrc = displayAd.screenUrl || displayAd.mediaUrl || displayAd.verticalUrl || displayAd.imageUrl;
    // El tipo se decide por el ARCHIVO a mostrar, no por el campo global de la campaña.
    const isVideo = isVideoMedia(mediaSrc, displayAd.mediaType);

    useEffect(() => {
        setMediaError(false);
    }, [currentIndex, adToDisplay?.id]);

    // --- HEARTBEAT LOGIC ---
    useEffect(() => {
        if (!currentUser) return;

        const sendPulse = async () => {
            // If the device is offline, don't queue Firestore writes or run expensive geolocation.
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
                console.warn("Geolocation for screen not available:", err);
            }

            await updateHeartbeat(deviceId, {
                name: currentUser.displayName || deviceId,
                type: 'screen',
                resolution: resolution,
                currentAd: currentAd?.name || 'Ninguno',
                lastUpdate: new Date().toISOString(),
                ...locationData
            });
        };

        sendPulse(); // Initial pulse
        const interval = setInterval(sendPulse, 30000); // Pulse every 30s
        return () => clearInterval(interval);
    }, [currentUser, currentAd]);

    // --- REMOTE COMMANDS LISTENER ---
    useEffect(() => {
        if (!currentUser) return;

        const deviceId = currentUser.email.toLowerCase();
        // Load last known schedule (useful if the first load happens offline).
        try {
            const raw = localStorage.getItem(`brightness_schedule_${deviceId}`);
            if (raw) setBrightnessSchedule(normalizeBrightnessSchedule(JSON.parse(raw)));
        } catch {
            // ignore
        }

        console.log("🎮 Escuchando comandos remotos para:", deviceId);
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
                    // Evitamos ejecutar el mismo comando dos veces usando su ID único
                    const lastExecutedId = localStorage.getItem('last_command_id');
                    if (command.id !== lastExecutedId) {
                        localStorage.setItem('last_command_id', command.id);
                        console.log("🚀 Comando recibido:", command.type);

                        if (command.type === 'RELOAD') {
                            window.location.reload();
                        } else if (command.type === 'CLEAR_CACHE') {
                            clearAppCache();
                            window.location.reload();
                        } else if (command.type === 'FACTORY_RESET') {
                            clearAppCache({ includeAdsCache: true, includeKioskConfig: true });
                            await clearOfflineMediaCache();
                            // Damos un pequeño margen para que el mensaje llegue al SW antes de recargar.
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
            console.log("📸 Tomando captura...");
            const canvas = await window.html2canvas(containerRef.current, {
                useCORS: true,
                allowTaint: false, // CLAVE: Debe ser false para que toBlob funcione con CORS
                backgroundColor: '#000000',
                scale: 0.5 // Reducimos escala para ahorrar ancho de banda
            });

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const res = await fetch(dataUrl);
            const blob = await res.blob();

            if (blob) {
                const campaignName = adToDisplay?.name || 'Inactivo/Fallback';
                await uploadScreenCapture(currentUser.email.toLowerCase(), blob, {
                    campaignName,
                    time: new Date().toLocaleTimeString()
                });
                console.log(`✅ Captura de [${campaignName}] enviada.`);
            }
            setIsCapturing(false);
        } catch (error) {
            console.error("Error en captura:", error);
            setIsCapturing(false);
        }
    };

    // --- ROTATION LOGIC ---
    const handleNext = useCallback(() => {
        if (globalAds && globalAds.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % globalAds.length);
            console.log("⏭️ Rotando al siguiente anuncio...");
        }
    }, [globalAds]);

    const handleMediaError = useCallback((errorEvent) => {
        console.error("Error loading media:", errorEvent);

        if (globalAds && globalAds.length > 1) {
            handleNext();
        } else {
            setMediaError(true);
        }
    }, [globalAds, handleNext]);

    useEffect(() => {
        // Si no hay anuncios aún, o solo hay uno, no iniciamos timer
        if (!globalAds || globalAds.length <= 1) return;

        const timer = setTimeout(handleNext, adRotationMs);
        return () => clearTimeout(timer);
    }, [adRotationMs, currentIndex, globalAds, handleNext]);


    // --- EMERGENCY MODE ---
    if (config?.isEmergency) {
        return (
            <div className="min-h-screen w-full bg-red-600 flex flex-col items-center justify-center text-white p-10 z-[9999] relative animate-pulse" style={{ cursor: 'none' }} onClick={enterFullscreen}>
                <AlertTriangle size={140} className="mb-8" />
                <h1 className="text-6xl font-black text-center">EMERGENCIA</h1>
                <p className="text-3xl font-bold text-center mt-4">{config.emergencyMessage || "Alerta en curso"}</p>
            </div>
        );
    }

    // --- MAINTENANCE MODE ---
    if (config?.isMaintenance) {
        return (
            <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-center text-[#F36F21] p-10 z-[9999]" style={{ cursor: 'none' }} onClick={enterFullscreen}>
                <Construction size={120} className="mb-6 animate-bounce" />
                <h1 className="text-5xl font-black text-white">En Mantenimiento</h1>
            </div>
        );
    }

    return (
        <main ref={containerRef} className="min-h-screen relative overflow-hidden bg-black" style={{ cursor: isFullscreen ? 'none' : 'default' }}>
            <Helmet>
                <title>Naranti Screen Player</title>
                <meta name="robots" content="noindex" />
            </Helmet>

            {/* FULLSCREEN ENTRY PROMPT */}
            {showFullscreenPrompt && (
                <div
                    className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center cursor-pointer select-none"
                    onClick={enterFullscreen}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center gap-6 text-center px-8"
                    >
                        <img
                            src="https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/bf2a316b2876820b965e2c11cb65cc5c.png"
                            alt="Naranti Logo"
                            className="w-32 opacity-80"
                        />
                        <Monitor size={80} className="text-[#F36F21]" />
                        <h1 className="text-3xl font-bold text-white">Naranti Screen Player</h1>
                        <p className="text-white/60 text-lg max-w-md">
                            {currentUser?.email && (
                                <span className="block text-sm text-white/40 mb-2 font-mono">
                                    Dispositivo: {currentUser.email}
                                </span>
                            )}
                        </p>
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="flex flex-col items-center gap-3 mt-4"
                        >
                            <MousePointerClick size={40} className="text-[#F36F21]" />
                            <span className="text-[#F36F21] text-xl font-semibold">
                                {fullscreenError ? 'Haz clic para reintentar pantalla completa' : 'Haz clic en cualquier lugar para iniciar'}
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            )}

            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={displayAd.id + currentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 w-full h-full"
                    >
                        {isVideo ? (
                            <video
                                key={mediaSrc}
                                src={mediaSrc}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                playsInline
                                crossOrigin="anonymous"
                                loop={!globalAds || globalAds.length <= 1}
                                onEnded={handleNext}
                                onError={handleMediaError}
                            />
                        ) : (
                            <img
                                key={mediaSrc}
                                src={mediaSrc}
                                alt={displayAd.name || "Screen Content"}
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                                onError={handleMediaError}
                            />
                        )}

                        <div className="absolute bottom-2 right-2 text-white/10 text-[10px] uppercase font-mono tracking-widest pointer-events-none">
                            Device: {currentUser?.email}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {effectiveBrightness < 100 && (
                <div
                    className="fixed inset-0 z-[9999] bg-black pointer-events-none transition-opacity duration-500"
                    style={{ opacity: Math.min(1, Math.max(0, 1 - effectiveBrightness / 100)) }}
                />
            )}
        </main>
    );
};

export default ScreenMode;