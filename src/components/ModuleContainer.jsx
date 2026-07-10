import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Cloud, Clock, MapPin, AlarmClock as AlarmLight } from 'lucide-react';
import { useTotem } from '@/contexts/TotemContext';
import CultureModule from './CultureModule'; 

const ModuleContainer = ({ children, onClose, adCategory, activeModule, setActiveModule }) => {
  // Safe destructuring to ensure UI works even if context is missing isHeaderAdVisible
  const { ads, isHeaderAdVisible: ctxVisible, currentWeather, isIdle } = useTotem();
  const isHeaderAdVisible = ctxVisible !== undefined ? ctxVisible : true;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const activeAds = useMemo(() => {
    const categoryAds = ads.filter(ad => ad.category === adCategory && ad.active);
    if (categoryAds.length > 0) return categoryAds;
    return ads.filter(ad => ad.category === 'general' && ad.active);
  }, [ads, adCategory]);

  useEffect(() => {
    setCurrentAdIndex(0);
    const adInterval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % (activeAds.length || 1));
    }, 20000); // ⏱️ rotación 20s
    return () => clearInterval(adInterval);
  }, [adCategory, activeAds.length]);

  const currentAd = activeAds[currentAdIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 h-full flex flex-col relative"
    >
      {/* Header con InfoChips o Publicidad */}
      <header className="w-full max-w-7xl mx-auto h-[45vh] mb-6 relative">
        <AnimatePresence>
          {isHeaderAdVisible && currentAd && !isIdle ? (
            <motion.div
              key="header-ad"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-xl bg-black/40 backdrop-blur"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentAd.id || currentAd.imageUrl}
                  src={currentAd.imageUrl}
                  alt={currentAd.title || 'Ad'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </AnimatePresence>
              <div className="absolute inset-0 ring-1 ring-white/10 rounded-3xl pointer-events-none" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute top-3 right-4 bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold pointer-events-auto shadow-md">
                Publicidad
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="info-chips"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full grid grid-cols-3 gap-4 absolute top-0"
            >
              <div className="glass-chip flex items-center justify-center py-3 px-5 text-lg font-semibold text-cyan-300">
                <Clock className="w-6 h-6 mr-3" />
                <span>{currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="glass-chip flex items-center justify-center py-3 px-5 text-lg font-semibold text-cyan-300">
                <Cloud className="w-6 h-6 mr-3" />
                <span>{`${currentWeather.temperature}°C · ${currentWeather.condition}`}</span>
              </div>
              <div className="glass-chip flex items-center justify-center py-3 px-5 text-lg font-semibold text-cyan-300">
                <MapPin className="w-6 h-6 mr-3" />
                <span>Morelia, Mich.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Botón Volver */}
      <motion.button
        onClick={onClose}
        className="mb-6 self-start glass-chip rounded-full flex items-center py-2 pl-3 pr-4 z-20 backdrop-blur-md hover:shadow-lg hover:shadow-cyan-500/10"
        whileHover={{ scale: 1.05, opacity: 1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 mr-2">
          <ArrowLeft className="h-4 w-4" />
        </span>
        <span className="font-semibold">Volver</span>
      </motion.button>

      {/* Contenido del Módulo */}
      <main className="flex-grow overflow-hidden h-[calc(55vh - 10rem)]">
        {/* Conditional rendering for different modules */}
        {activeModule === 'culture' ? (
          <CultureModule onBack={() => setActiveModule(null)} />
        ) : (
          children
        )}
      </main>

      {/* Botón de Emergencia Flotante */}
      <AnimatePresence>
        {isHeaderAdVisible && !isIdle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div
              onClick={() => (window.location.href = 'tel:911')}
              className="glass-chip flex items-center justify-center py-2 px-4 text-md font-semibold whitespace-nowrap text-fuchsia-300 emergency-pulse cursor-pointer rounded-full"
            >
              <AlarmLight className="w-5 h-5 mr-2" />
              <span>Emergencia</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔥 Overlay de Publicidad Full-Screen cuando está idle */}
      <AnimatePresence>
        {isIdle && currentAd && (
          <motion.div
            key="idle-fullscreen-ad"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[9999] bg-black"
          >
            <img
              src={currentAd.imageUrl}
              alt={currentAd.title || 'Publicidad'}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute top-4 right-4 bg-white/15 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur">
              Publicidad
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ModuleContainer;