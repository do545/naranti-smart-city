import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, X, Phone, Clock, ChevronRight, Activity } from "lucide-react";
// 1. CONEXIÓN ESTÁNDAR
// 1. CONEXIÓN ESTÁNDAR
import { useTotem } from "@/contexts/TotemContext";
import FullscreenIdleAd from "@/components/FullscreenIdleAd";
import HeaderAd from "@/components/HeaderAd";

export default function HealthModule({ onBack, ad }) {
  const navigate = useNavigate();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isIdle, setIsIdle] = useState(false);

  // 2. ANTENA DE PUBLICIDAD
  const { globalAds, currentAdIndex } = useTotem();

  // Determine the active ad to display.
  // We prioritize the 'ad' prop passed from MainInterface (which is synchronized).
  // As a fallback, we grab the current ad directly from the context.
  const displayAd = ad || (globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null);

  // Wrap in array for HeaderAd component
  const adsForHeader = displayAd ? [displayAd] : [];

  // --- DATOS SALUD (Fotos Actualizadas) ---
  const healthPlaces = [
    {
      id: 1,
      name: "Hospital Ángeles Morelia",
      img: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
      rating: 4.8,
      address: "Perif. Paseo de la República 3455",
      distance: "2.0 km",
      short: "Hospital privado con servicios de alta especialidad.",
      type: "Hospital Privado"
    },
    {
      id: 2,
      name: "Star Médica Morelia",
      img: "https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&w=800&q=80",
      rating: 4.7,
      address: "Av. Camelinas 770",
      distance: "1.4 km",
      short: "Centro médico con urgencias 24 horas.",
      type: "Hospital Privado"
    },
    {
      id: 3,
      name: "Hospital Infantil de Morelia",
      img: "https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?auto=format&fit=crop&w=800&q=80",
      rating: 4.4,
      address: "Calz. Juárez 1600",
      distance: "2.1 km",
      short: "Atención pediátrica especializada.",
      type: "Hospital Público"
    },
    {
      id: 4,
      name: "Hospital de la Mujer",
      img: "https://images.unsplash.com/photo-1579684385180-1ea678bc0caa?auto=format&fit=crop&w=800&q=80",
      rating: 4.5,
      address: "Av. Madero Ote. 1200",
      distance: "2.3 km",
      short: "Atención materno-infantil y ginecológica.",
      type: "Hospital Público"
    },
    {
      id: 5,
      name: "IMSS Clínica 75",
      img: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80",
      rating: 4.1,
      address: "Col. Industrial",
      distance: "1.1 km",
      short: "Atención médica familiar.",
      type: "Clínica IMSS"
    },
    {
      id: 6,
      name: "Salud Digna",
      img: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80",
      rating: 4.6,
      address: "Centro Histórico",
      distance: "0.8 km",
      short: "Laboratorio clínico y estudios de diagnóstico.",
      type: "Laboratorio"
    },
    {
      id: 7,
      name: "Farmacia Guadalajara (24h)",
      img: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80",
      rating: 4.7,
      address: "Madero Poniente 890",
      distance: "0.5 km",
      short: "Medicamentos, consultas y servicio 24 horas.",
      type: "Farmacia"
    },
    {
      id: 8,
      name: "Farmacia del Ahorro",
      img: "https://images.unsplash.com/photo-1631549916768-4119b2d3f92c?auto=format&fit=crop&w=800&q=80",
      rating: 4.6,
      address: "Av. Acueducto 45",
      distance: "0.7 km",
      short: "Medicamentos y consultas médicas.",
      type: "Farmacia"
    }
  ];

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

  const handleBack = () => {
    navigate('/smartcity/display');
    if (onBack) onBack();
  };

  // --- MODAL DETALLE ---
  if (selectedPlace) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FFFBF5] animate-in slide-in-from-bottom duration-300 flex flex-col font-sans">
        {/* Header Modal */}
        <div className="sticky top-0 bg-[#FFFBF5]/90 backdrop-blur-md px-4 py-4 flex justify-between items-center border-b border-green-100">
          <button
            onClick={() => setSelectedPlace(null)}
            className="p-2 -ml-2 rounded-full hover:bg-green-100 text-green-700 font-bold flex items-center gap-1"
          >
            <ChevronRight className="rotate-180" size={28} /> Atrás
          </button>
          <button onClick={() => setSelectedPlace(null)} className="p-2 rounded-full hover:bg-green-100 text-green-700"><X size={28} /></button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto pb-10">
          <img src={selectedPlace.img} className="w-full h-64 object-cover rounded-b-[2rem] shadow-sm mb-4" alt={selectedPlace.name} />

          <div className="px-6 py-2 max-w-2xl mx-auto">
            <span className="inline-block bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full uppercase font-bold mb-2 tracking-wider">
              {selectedPlace.type}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{selectedPlace.name}</h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg text-xs font-bold text-yellow-700 border border-yellow-100">
                <Star size={12} className="fill-yellow-500 text-yellow-500" /> {selectedPlace.rating}
              </span>
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <MapPin size={14} /> {selectedPlace.address}
              </span>
            </div>

            <p className="text-gray-700 text-lg leading-relaxed">{selectedPlace.short}</p>

            <div className="mt-8 space-y-3">
              <button className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 active:scale-95 transition-transform">
                <Phone size={20} /> Llamar ahora
              </button>
              <div className="flex items-center gap-2 justify-center text-gray-400 text-sm">
                <Clock size={14} /> <span>Abierto hoy • 24 Horas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL ---
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
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-green-100 text-gray-800 active:scale-95 transition-transform"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="ml-2 text-2xl font-bold text-green-700 flex items-center gap-2">
          <Activity size={24} className="text-green-600" /> Servicios de Salud
        </h1>
      </div>

      {/* 5. LISTA DE LUGARES */}
      <div className="px-4 pb-10 flex-1 overflow-y-auto">
        <div className="space-y-4">
          {healthPlaces.map((place) => (
            <div
              key={place.id}
              onClick={() => setSelectedPlace(place)}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex gap-4 active:scale-95 transition-transform duration-200 cursor-pointer"
            >
              <img
                src={place.img}
                alt={place.name}
                className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm bg-gray-100"
              />

              <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{place.type}</span>
                  </div>
                  <h3 className="text-gray-900 font-bold text-lg leading-tight line-clamp-1 mb-1">{place.name}</h3>
                  <p className="text-gray-400 text-xs truncate flex items-center gap-1">
                    <MapPin size={10} /> {place.address}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-gray-700">{place.rating}</span>
                  </div>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    📍 {place.distance}
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
}