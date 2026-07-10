import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Clock, ArrowLeft, Tag, Info } from 'lucide-react';
import HeaderAd from '@/components/HeaderAd';
import { useTotem } from '@/contexts/TotemContext';
import FullscreenIdleAd from '@/components/FullscreenIdleAd';

// --- DATOS CULTURALES SIMULADOS (CON FOTOS COOL) ---
const cultureData = [
  {
    id: 1,
    title: "Noche de Muertos en Pátzcuaro",
    location: "Lago de Pátzcuaro",
    date: "1 y 2 Nov",
    time: "18:00 - 06:00",
    description: "La tradición más emblemática de Michoacán. Vive la magia de las velas y el cempasúchil en la isla de Janitzio.",
    type: "Tradición",
    image: "https://images.unsplash.com/photo-1605218427360-363936931449?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    title: "Festival de Música de Morelia",
    location: "Palacio Clavijero",
    date: "15 - 24 Nov",
    time: "Varios Horarios",
    description: "Conciertos de talla internacional en los recintos más bellos de la ciudad.",
    type: "Música",
    image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    title: "Exposición: Arte Barroco",
    location: "Centro Cultural Clavijero",
    date: "Todo el mes",
    time: "10:00 - 18:00",
    description: "Una muestra impresionante del arte virreinal michoacano.",
    type: "Arte",
    image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    title: "Danza de los Viejitos",
    location: "Plaza de Armas",
    date: "Sábados y Domingos",
    time: "12:00 PM",
    description: "Disfruta de la danza folklórica más representativa del estado al aire libre.",
    type: "Folklore",
    image: "https://images.unsplash.com/photo-1629814122784-06772740733d?auto=format&fit=crop&w=800&q=80"
  }
];

const CultureModule = ({ onBack, ad }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isIdle, setIsIdle] = useState(false);

  // 1. CONEXIÓN AL CEREBRO
  const { globalAds, currentAdIndex, setIsHeaderAdVisible } = useTotem();

  // Determine the active ad to display.
  const displayAd = ad || (globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null);

  // Wrap in array for HeaderAd component
  const adsForHeader = displayAd ? [displayAd] : [];

  // --- SCROLL EFFECT ---
  useEffect(() => {
    const handleScroll = () => {
      if (typeof setIsHeaderAdVisible === 'function') {
        setIsHeaderAdVisible(window.scrollY < 20);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setIsHeaderAdVisible]);

  // --- PROTECTOR DE PANTALLA (20s) ---
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

  const handleWake = () => setIsIdle(false);

  const handleItemClick = (item) => setSelectedItem(item);
  const handleBackToList = () => setSelectedItem(null);
  const currentOnBack = selectedItem ? handleBackToList : onBack;

  return (
    <div
      className="min-h-screen bg-[#FFFBF5] text-gray-900 font-sans flex flex-col relative transition-colors duration-300"
      onClick={handleWake}
      onTouchStart={handleWake}
    >

      {/* 2. PUBLICIDAD BANNER ESTANDARIZADA */}
      <div className="px-4 pt-4 shrink-0">
        <HeaderAd ads={adsForHeader} />
      </div>

      <AnimatePresence mode="wait">
        {selectedItem ? (
          // --- VISTA DETALLE ---
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            {/* Header Detalle */}
            <div className="sticky top-0 bg-[#FFFBF5]/95 backdrop-blur-md z-40 px-4 py-4 flex items-center">
              <button
                onClick={currentOnBack}
                className="p-2 -ml-2 rounded-full hover:bg-purple-100 text-purple-800 active:scale-95 transition-transform"
              >
                <ArrowLeft size={32} />
              </button>
              <h2 className="ml-2 text-xl font-bold text-gray-800 line-clamp-1">{selectedItem.title}</h2>
            </div>

            <div className="px-4 pb-12 flex-1 overflow-y-auto">
              <img src={selectedItem.image} className="w-full h-64 object-cover rounded-[2rem] shadow-lg mb-6" alt={selectedItem.title} />

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Tag size={12} /> {selectedItem.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> Fecha</p>
                    <p className="font-bold text-gray-800">{selectedItem.date}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock size={12} /> Horario</p>
                    <p className="font-bold text-gray-800">{selectedItem.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-6 bg-purple-50 p-4 rounded-2xl">
                  <MapPin className="text-purple-600 shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-purple-400 font-bold uppercase mb-1">Ubicación</p>
                    <p className="text-purple-900 font-medium">{selectedItem.location}</p>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Info size={18} /> Descripción</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {selectedItem.description}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          // --- VISTA LISTA ---
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Header Lista */}
            <div className="sticky top-0 bg-[#FFFBF5]/95 backdrop-blur-md z-40 px-4 py-4 flex items-center">
              <button
                onClick={currentOnBack}
                className="p-2 -ml-2 rounded-full hover:bg-purple-100 text-gray-800 active:scale-95 transition-transform"
              >
                <ArrowLeft size={32} />
              </button>
              <h1 className="ml-2 text-2xl font-bold text-purple-700">Agenda Cultural</h1>
            </div>

            <div className="px-4 pb-10 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                {cultureData.map((item) => (
                  <motion.div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex gap-4 active:scale-95 transition-transform duration-200 cursor-pointer"
                    whileHover={{ y: -2 }}
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-sm relative">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/10"></div>
                    </div>

                    <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                      <div>
                        <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md uppercase tracking-wider mb-1 inline-block">
                          {item.type}
                        </span>
                        <h2 className="text-gray-900 font-bold text-base leading-tight line-clamp-2">{item.title}</h2>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                          <Calendar size={10} /> {item.date}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={10} /> {item.location}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SCREENSAVER */}
      {isIdle && globalAds && globalAds.length > 0 && (
        <FullscreenIdleAd ads={globalAds} />
      )}
    </div>
  );
};

export default CultureModule;