import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Dumbbell, Activity, Timer, Footprints, Star } from 'lucide-react';
// 1. IMPORTACIONES ESTÁNDAR
import { useTotem } from '@/contexts/TotemContext';
import FullscreenIdleAd from '@/components/FullscreenIdleAd';
import HeaderAd from '@/components/HeaderAd';
import useIdleReturnHome from '@/hooks/useIdleReturnHome';

// --- DATOS FITNESS MORELIA ---
const placesData = [
  {
    id: 1,
    name: "Centro Deportivo (El Venus)",
    category: "Aire Libre",
    address: "Av. Acueducto, Vasco de Quiroga",
    rating: 4.9,
    status: "Abierto hoy • 6:00 - 21:00",
    distance: "1.5 km",
    image: "https://images.unsplash.com/photo-1533561052604-c3beb6d55760?auto=format&fit=crop&w=800&q=80",
    badgeColor: "bg-green-100 text-green-700",
    icon: <Footprints size={14} />
  },
  {
    id: 2,
    name: "Smart Fit Espacio Las Américas",
    category: "Gimnasio",
    address: "Av. Enrique Ramírez Miguel 1000",
    rating: 4.6,
    status: "Concurrido ahora",
    distance: "3.2 km",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    badgeColor: "bg-orange-100 text-orange-700",
    icon: <Dumbbell size={14} />
  },
  {
    id: 3,
    name: "Ruta Running Acueducto",
    category: "Ruta",
    address: "Acueducto de Morelia",
    rating: 4.8,
    status: "Ideal para tarde/noche",
    distance: "500 m",
    image: "https://images.unsplash.com/photo-1552674605-4695231af3d7?auto=format&fit=crop&w=800&q=80",
    badgeColor: "bg-blue-100 text-blue-700",
    icon: <Activity size={14} />
  },
  {
    id: 4,
    name: "CrossFit Morelia Centro",
    category: "Clases",
    address: "Calle Santiago Tapia 450",
    rating: 4.7,
    status: "Clase inicia en 20 min",
    distance: "1.0 km",
    image: "https://images.unsplash.com/photo-1517963879466-cd110ea92736?auto=format&fit=crop&w=800&q=80",
    badgeColor: "bg-purple-100 text-purple-700",
    icon: <Timer size={14} />
  }
];

const Fitness = () => {
  const navigate = useNavigate();
  useIdleReturnHome(); // vuelve al inicio tras 90s sin interaccion
  const [filter, setFilter] = useState('Todo');
  const [isIdle, setIsIdle] = useState(false);

  // 2. CONEXIÓN AL CEREBRO
  // FIX: Added setIsHeaderAdVisible to destructuring
  const { globalAds, currentAdIndex, setIsHeaderAdVisible } = useTotem();

  // Logic for synced ad (similar to RestaurantModule but without 'ad' prop since it's a page)
  const currentAd = globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null;
  const adsForHeader = currentAd ? [currentAd] : [];

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

  // --- PROTECTOR DE PANTALLA (20 SEGUNDOS) ---
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsIdle(true), 20000);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, []);

  const handleWake = () => setIsIdle(false);

  // --- VISTA PRINCIPAL ---
  const categories = ['Todo', 'Gimnasio', 'Aire Libre', 'Ruta', 'Clases'];
  const filteredData = filter === 'Todo' ? placesData : placesData.filter(item => item.category === filter);

  return (
    <div
      className="min-h-screen bg-[#FFFBF5] font-sans flex flex-col relative"
      onClick={handleWake}
      onTouchStart={handleWake}
    >

      {/* 3. PUBLICIDAD BANNER ESTANDARIZADA */}
      <div className="px-4 pt-4 shrink-0">
        <HeaderAd ads={adsForHeader} />
      </div>

      {/* 4. HEADER */}
      <div className="sticky top-0 bg-[#FFFBF5]/95 backdrop-blur-md z-40 px-4 py-4 flex items-center">
        <button
          onClick={() => navigate('/smartcity/display')}
          className="p-2 -ml-2 rounded-full hover:bg-orange-100 text-gray-800 active:scale-95 transition-transform"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="ml-2 text-2xl font-bold text-[#F36F21]">Fitness & Deporte</h1>
      </div>

      <div className="px-4 pb-10 flex-1 overflow-y-auto">

        {/* 5. HERO (Motivación) */}
        <div className="relative w-full h-48 rounded-[2rem] overflow-hidden mb-6 shadow-lg shadow-orange-100">
          <img
            src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=80"
            alt="Gym Motivation"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F36F21]/90 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-white text-xl font-bold leading-tight">Muévete en Morelia</h2>
            <p className="text-white/90 text-sm mt-1 font-medium">Encuentra tu lugar ideal para entrenar hoy.</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${filter === cat
                ? 'bg-[#F36F21] text-white shadow-orange-200 scale-105'
                : 'bg-white text-gray-500 border border-gray-100'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* LISTA DE LUGARES */}
        <div className="space-y-4">
          {filteredData.map((place) => (
            <div
              key={place.id}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex gap-4 active:scale-95 transition-transform duration-200 cursor-pointer"
            >
              <img src={place.image} alt={place.name} className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm" />

              <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${place.badgeColor}`}>
                      {place.icon} {place.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#F36F21] bg-orange-50 px-2 py-1 rounded-full">
                      <MapPin size={10} /> {place.distance}
                    </span>
                  </div>
                  <h3 className="text-gray-900 font-bold text-lg leading-tight line-clamp-1">{place.name}</h3>
                  <p className="text-gray-400 text-xs mt-1 truncate">{place.address}</p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-gray-700">{place.rating}</span>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-lg truncate max-w-[120px]">
                    {place.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. SCREENSAVER REAL */}
      {isIdle && globalAds && globalAds.length > 0 && (
        <FullscreenIdleAd ads={globalAds} />
      )}
    </div>
  );
};

export default Fitness;