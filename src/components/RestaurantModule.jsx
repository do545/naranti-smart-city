import React, { useEffect, useState } from "react";
import { fetchNearbyPlaces } from "../services/googlePlaces";
import { ArrowLeft, Star, MapPin, Search } from "lucide-react";
import { useTotem } from "@/contexts/TotemContext";
import HeaderAd from "@/components/HeaderAd";
import FullscreenIdleAd from "@/components/FullscreenIdleAd";

export default function RestaurantModule({ onBack, ad }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNight, setIsNight] = useState(false);
  
  // Destructure context values for fallback and other needs
  const { globalAds, currentAdIndex } = useTotem();
  
  const [isIdle, setIsIdle] = useState(false);

  const LAT = 19.7033;
  const LNG = -101.19;
  const RADIUS = 1500;

  // Determine the active ad to display.
  // We prioritize the 'ad' prop passed from MainInterface (which is synchronized).
  // As a fallback, we grab the current ad directly from the context.
  const displayAd = ad || (globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null);
  
  // Wrap in array for HeaderAd component
  const adsForHeader = displayAd ? [displayAd] : [];

  useEffect(() => {
    const hour = new Date().getHours();
    setIsNight(hour >= 19 || hour < 6);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchNearbyPlaces({ lat: LAT, lng: LNG, radius: RADIUS })
      .then((results) => setRestaurants(results))
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

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

  const theme = {
    bg: isNight ? "bg-[#1a1a1a]" : "bg-[#FFFBF5]",
    textMain: isNight ? "text-white" : "text-gray-900",
    textSub: isNight ? "text-gray-400" : "text-gray-500",
    cardBg: isNight ? "bg-[#2a2a2a] border-gray-700" : "bg-white border-gray-100",
    headerBg: isNight ? "bg-[#1a1a1a]/95" : "bg-[#FFFBF5]/95",
    iconBg: isNight ? "bg-white/10 text-white" : "hover:bg-orange-100 text-gray-800"
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${theme.bg}`}
      onClick={handleWake}
      onTouchStart={handleWake}
    >
      <div className="px-4 pt-4 shrink-0">
        {/* 1. PUBLICIDAD BANNER RESTAURADA */}
        {/* Usamos adsForHeader para asegurar que HeaderAd reciba el formato correcto */}
        <HeaderAd ads={adsForHeader} />
      </div>

      <div className={`sticky top-0 backdrop-blur-md z-40 px-4 py-4 flex items-center ${theme.headerBg}`}>
        <button
          onClick={onBack}
          className={`p-2 -ml-2 rounded-full transition-colors active:scale-95 ${theme.iconBg}`}
        >
          <ArrowLeft size={32} />
        </button>
        <h2 className="ml-2 text-2xl font-bold text-[#F36F21]">Restaurantes Cercanos</h2>
      </div>

      <div className="px-4 pb-10 flex-1 overflow-y-auto">
        {/* Renderizado de contenido original */}
        <div className="relative w-full h-40 rounded-[2rem] overflow-hidden mb-6 shadow-lg shadow-orange-100/50">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"
            alt="Comida Morelia"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-white text-xl font-bold leading-tight">Sabor Moreliano</h2>
            <p className="text-white/90 text-sm mt-1 font-medium">Descubre la gastronomía local cerca de ti.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F36F21]"></div>
            <p className="text-sm">Buscando lugares deliciosos...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Search size={48} className="mx-auto mb-2 opacity-20" />
            <p>No encontramos restaurantes cerca :(</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {restaurants.map((r) => (
              <div
                key={r.place_id}
                className={`${theme.cardBg} p-4 rounded-3xl shadow-sm border flex gap-4 active:scale-95 transition-transform duration-200 cursor-pointer`}
              >
                {r.photos?.length > 0 ? (
                  <img
                    src={r.photos[0].getUrl({ maxWidth: 160, maxHeight: 160 })}
                    alt={r.name}
                    className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-2xl shrink-0 flex items-center justify-center text-gray-400">
                    <span className="text-xs">Sin foto</span>
                  </div>
                )}

                <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                  <div>
                    <h3 className={`font-bold text-lg leading-tight line-clamp-1 mb-1 ${theme.textMain}`}>
                      {r.name}
                    </h3>
                    <p className={`text-xs mt-1 truncate flex items-start gap-1 ${theme.textSub}`}>
                      <MapPin size={12} className="shrink-0 mt-0.5" />
                      {r.vicinity || "Dirección no disponible"}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-yellow-700">
                        {r.rating || "N/A"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#F36F21] bg-orange-50 px-2 py-1 rounded-full">
                      📍 {Math.round(Math.random() * 2 + 0.5)} km
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SCREENSAVER REAL (publicidad del sistema, igual que los demás módulos) */}
      {isIdle && globalAds && globalAds.length > 0 && (
        <FullscreenIdleAd ads={globalAds} />
      )}
    </div>
  );
}