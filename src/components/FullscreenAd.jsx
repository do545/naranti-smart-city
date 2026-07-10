import React from 'react';
import { useTotem } from '@/contexts/TotemContext';
import { motion, AnimatePresence } from 'framer-motion';

// El ad es el 'currentAd' del TotemContext
const FullscreenIdleAd = ({ ad }) => {
  // 1. Conexión al Contexto (Obtenemos el estado global de publicidad)
  const {
    showFullscreenAd,
    globalAds,
    currentAdIndex,
    handleNextAd,
    adRotationMs
  } = useTotem();

  // Definición del Anuncio a Mostrar (Usamos el prop o el fallback del context)
  const currentAd = ad || globalAds[currentAdIndex];

  const handleAdMediaError = React.useCallback((e) => {
    console.error("Error al cargar media del anuncio:", e?.target?.src || e);
    if (globalAds && globalAds.length > 1) handleNextAd();
  }, [globalAds, handleNextAd]);

  // Respetamos el tiempo de rotación configurado para cualquier spot.
  React.useEffect(() => {
    if (showFullscreenAd && currentAd && globalAds.length > 1) {
      const timer = setTimeout(() => {
        handleNextAd();
      }, adRotationMs);
      return () => clearTimeout(timer);
    }
  }, [adRotationMs, currentAd, globalAds.length, handleNextAd, showFullscreenAd]);

  // Si el modo Fullscreen no está activo O no hay anuncio, no renderizar
  if (!showFullscreenAd || !currentAd) return null;

  // Prefer verticalUrl para fullscreen
  const mediaSrc = currentAd.verticalUrl || currentAd.mediaUrl || currentAd.imageUrl;

  if (!mediaSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      // 🚨 CORRECCIÓN CRÍTICA: Detener la propagación del clic para que la animación no active el resetTimer
      onClick={(e) => e.stopPropagation()}
    >
      <AnimatePresence mode='wait'>
        <motion.div
          // Usamos el ID + el ÍNDICE para asegurar que Framer Motion detecte el cambio cada 10s.
          key={currentAd.id + currentAdIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Contenido Media */}
          {currentAd.mediaType === 'video' ? (
            <video
              // ✅ CLAVE: Key único para forzar la recarga correcta del video al rotar
              key={mediaSrc}
              src={mediaSrc}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              crossOrigin="anonymous" // Permite captura CORS
              onEnded={handleNextAd}
              onError={handleAdMediaError}
            />
          ) : (
            <img
              // ✅ CLAVE: Key único para forzar el montaje/desmontaje de la imagen
              key={mediaSrc}
              src={mediaSrc}
              alt={currentAd.name || "Advertisement"}
              className="w-full h-full object-cover"
              crossOrigin="anonymous" // Permite captura CORS
              // ✅ AGREGADO: Manejador de error para imágenes
              onError={handleAdMediaError}
            />
          )}

          {/* 4. OVERLAY INTERACTIVO Y MENSAJE DISCRETO */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20">
            {/* ✅ MENSAJE DISCRETO: Ya está en la esquina inferior izquierda y más pequeño */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute bottom-4 left-4"
            >
              <div className="text-white text-sm font-semibold animate-pulse bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                Toca para interactuar 👆
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FullscreenIdleAd;