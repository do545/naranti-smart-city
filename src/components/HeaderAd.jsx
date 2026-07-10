import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isVideoMedia } from '@/lib/media';

const HeaderAd = ({ ads }) => {
  // Prioritize horizontalUrl for the header banner aspect ratio
  const currentAd = ads && ads.length > 0 ? ads[0] : null;
  // Si el archivo del anuncio actual falla, ocultamos el banner (en vez de
  // dejar un ícono de imagen rota). Al rotar al siguiente anuncio se reintenta.
  const [failedSrc, setFailedSrc] = React.useState(null);

  if (!currentAd) return null;

  const mediaSrc = currentAd.horizontalUrl || currentAd.mediaUrl || currentAd.imageUrl || currentAd.url;

  if (!mediaSrc || failedSrc === mediaSrc) return null;

  const isVideo = isVideoMedia(mediaSrc, currentAd.mediaType);
  const handleMediaError = () => {
    console.error("Error al cargar media del banner:", mediaSrc);
    setFailedSrc(mediaSrc);
  };

  return (
    <div className="w-full h-48 md:h-60 lg:h-64 kiosk:h-[460px] rounded-3xl overflow-hidden relative shadow-xl my-6 kiosk:my-8 bg-black/5 border border-white/10 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {isVideo ? (
            <video
              key={mediaSrc}
              src={mediaSrc}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              onError={handleMediaError}
            />
          ) : (
            <img
              src={mediaSrc}
              alt={currentAd.name || "Publicidad"}
              className="w-full h-full object-cover"
              onError={handleMediaError}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 pointer-events-none" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HeaderAd;
