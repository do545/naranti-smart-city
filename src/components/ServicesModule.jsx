import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { visibleServicesList } from "@/data/servicesList";
import ServiceCard from "@/components/ServiceCard";
import { useTotem } from "@/contexts/TotemContext";
import FullscreenIdleAd from "@/components/FullscreenIdleAd";
import HeaderAd from "@/components/HeaderAd";

// Sub-component for OOAPAS (or general iframe view)
const OoapasPaymentView = ({ service, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#FFFBF5] flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center shadow-sm z-10">
        <button
          onClick={onClose}
          className="p-3 mr-3 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
        >
          <ArrowLeft size={28} className="text-gray-700" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[#F36F21] leading-tight truncate">{service.title}</h2>
          <p className="text-xs text-gray-500 truncate">{service.url}</p>
        </div>
        <button
          onClick={() => {
            const iframe = document.getElementById('service-iframe');
            if (iframe) iframe.src = iframe.src;
            setIsLoading(true);
          }}
          className="p-3 ml-2 bg-orange-50 rounded-full hover:bg-orange-100 active:scale-95 transition-all text-[#F36F21] shrink-0"
        >
          <RefreshCw size={24} />
        </button>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 relative bg-gray-50">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-[#F36F21] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium animate-pulse">Cargando portal...</p>
          </div>
        )}
        <iframe
          id="service-iframe"
          src={service.url}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-same-origin allow-scripts allow-forms"
          title={service.title}
        />
      </div>
    </motion.div>
  );
};

export default function ServicesModule({ onBack, ad }) {
  const navigate = useNavigate();
  const [isIdle, setIsIdle] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // CONEXIÓN AL CEREBRO (TotemContext)
  const { globalAds, currentAdIndex } = useTotem();

  // Determine the active ad to display.
  const displayAd = ad || (globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null);
  const adsForHeader = displayAd ? [displayAd] : [];

  // --- PROTECTOR DE PANTALLA (20 SEGUNDOS) ---
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsIdle(true), 20000);
    };
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("click", resetTimer);
    resetTimer();
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, []);

  const handleBack = () => {
    navigate('/smartcity/display');
    if (onBack) {
      onBack();
    }
  };

  // Función para despertar al tocar
  const handleWake = () => {
    setIsIdle(false);
  };

  const handleServiceClick = (item) => {
    setSelectedService(item);
  };

  return (
    <div
      className="min-h-screen w-full bg-[#FFFBF5] text-gray-900 font-sans flex flex-col transition-colors duration-300 relative overflow-hidden"
      onClick={handleWake}
      onTouchStart={handleWake}
    >
      {/* PUBLICIDAD BANNER ESTANDARIZADA */}
      <div className="px-4 pt-4 shrink-0">
        <HeaderAd ads={adsForHeader} />
      </div>

      {/* HEADER */}
      <div className="sticky top-0 bg-[#FFFBF5]/95 backdrop-blur-md z-40 px-4 py-4 flex items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-orange-100 transition-colors text-gray-800"
        >
          <ArrowLeft size={32} />
        </motion.button>
        <h1 className="ml-2 text-2xl font-bold text-[#F36F21]">
          Servicios Disponibles
        </h1>
      </div>

      {/* LISTA DE SERVICIOS */}
      <div className="w-full px-4 pb-12 flex-1 overflow-y-auto">
        <div className="space-y-8">
          {visibleServicesList.map((serviceSection, sectionIndex) => (
            <motion.div
              key={sectionIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <h2 className="text-lg font-bold text-[#F36F21] mb-4 pl-3 border-l-4 border-[#F36F21] uppercase tracking-wide">
                {serviceSection.section}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {serviceSection.items.map((item, itemIndex) => (
                  <motion.div
                    key={itemIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <ServiceCard
                      title={item.title}
                      description={item.description}
                      image={item.image}
                      rating={item.rating}
                      onClick={() => handleServiceClick(item)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* VISTA DEL SERVICIO (IFRAME) */}
      <AnimatePresence>
        {selectedService && (
          <OoapasPaymentView
            service={selectedService}
            onClose={() => setSelectedService(null)}
          />
        )}
      </AnimatePresence>

      {/* SCREENSAVER (Protector de Pantalla Real) */}
      {isIdle && globalAds && globalAds.length > 0 && !selectedService && (
        <FullscreenIdleAd ads={globalAds} />
      )}
    </div>
  );
}