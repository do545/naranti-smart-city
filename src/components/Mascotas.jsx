import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Scissors, Trees, Stethoscope, Search, Clock, Phone, Info } from 'lucide-react';
import { useTotem } from '@/contexts/TotemContext';
import FullscreenIdleAd from '@/components/FullscreenIdleAd';
import HeaderAd from "@/components/HeaderAd";

// --- DATOS ---
const placesData = [
  {
    id: 1,
    name: "Hospital Vet. Especialidades",
    type: "Salud",
    address: "Av. Camelinas 2300",
    rating: 4.8,
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
    color: "bg-blue-100 text-blue-600",
    icon: <Stethoscope size={14} />,
    featured: true,
    description: "Atención especializada 24/7. Contamos con quirófano equipado, rayos X, y laboratorio clínico para tu mascota.",
    phone: "443 123 4567",
    hours: "Abierto 24 hrs"
  },
  {
    id: 2,
    name: "Bosque Cuauhtémoc",
    type: "Parque",
    address: "Centro Histórico",
    rating: 4.7,
    distance: "800 m",
    image: "https://images.unsplash.com/photo-1597633425046-08f5110420b5?auto=format&fit=crop&w=800&q=80",
    color: "bg-green-100 text-green-600",
    icon: <Trees size={14} />,
    featured: true,
    description: "Amplias áreas verdes ideales para pasear con tu perro. Zona pet-friendly delimitada para que corran seguros.",
    phone: "N/A",
    hours: "06:00 - 18:00"
  },
  {
    id: 3,
    name: "Spa Canino Huellitas",
    type: "Estética",
    address: "Blvd. García de León",
    rating: 4.9,
    distance: "2.5 km",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80",
    color: "bg-pink-100 text-pink-600",
    icon: <Scissors size={14} />,
    featured: false,
    description: "Servicio completo de baño, corte de pelo, limpieza dental y masajes relajantes para perros y gatos.",
    phone: "443 987 6543",
    hours: "09:00 - 19:00"
  },
  {
    id: 4,
    name: "Parque Lineal",
    type: "Parque",
    address: "Av. Solidaridad",
    rating: 4.5,
    distance: "1.8 km",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80",
    color: "bg-green-100 text-green-600",
    icon: <Trees size={14} />,
    featured: false,
    description: "Sendero largo para caminar o trotar con tu mascota. Excelente opción para rutinas diarias.",
    phone: "N/A",
    hours: "Abierto 24 hrs"
  }
];

const Mascotas = ({ onBack, ad }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isIdle, setIsIdle] = useState(false);

  // 2. CONEXIÓN AL CEREBRO
  const { globalAds, currentAdIndex, setIsHeaderAdVisible } = useTotem();

  // Determine the active ad to display.
  const displayAd = ad || (globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null);
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

  const handleBack = () => {
    navigate('/smartcity/display');
    if (onBack) onBack();
  };

  const handleBackToList = () => setSelectedItem(null);
  const currentOnBack = selectedItem ? handleBackToList : handleBack;

  const categories = ['Todos', 'Salud', 'Parque', 'Estética'];
  
  const filteredPlaces = placesData.filter(place => {
    const matchesFilter = filter === 'Todos' || place.type === filter;
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          place.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const featuredPlaces = placesData.filter(place => place.featured);

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

      <AnimatePresence mode="wait">
        {selectedItem ? (
          /* --- VISTA DETALLE --- */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex-1 flex flex-col"
          >
            {/* Header Detalle */}
            <div className="sticky top-0 bg-[#FFFBF5]/95 backdrop-blur-md z-50 px-4 py-4 flex items-center shadow-sm">
              <button
                onClick={currentOnBack}
                className="p-2 -ml-2 rounded-full hover:bg-orange-100 transition-colors text-gray-800 active:scale-95 cursor-pointer"
              >
                <ArrowLeft size={32} />
              </button>
              <h2 className="ml-2 text-xl font-bold text-gray-800 line-clamp-1">{selectedItem.name}</h2>
            </div>

            <div className="px-4 pb-12 flex-1 overflow-y-auto">
              <img 
                src={selectedItem.image} 
                className="w-full h-64 object-cover rounded-[2rem] shadow-lg mb-6" 
                alt={selectedItem.name} 
              />

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedItem.color}`}>
                    {selectedItem.icon} {selectedItem.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-gray-800">{selectedItem.rating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Clock size={20} className="text-orange-500 mb-1" />
                    <p className="text-xs text-gray-400 mb-1">Horario</p>
                    <p className="font-bold text-gray-800 text-sm">{selectedItem.hours}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Phone size={20} className="text-orange-500 mb-1" />
                    <p className="text-xs text-gray-400 mb-1">Contacto</p>
                    <p className="font-bold text-gray-800 text-sm">{selectedItem.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-6 bg-orange-50 p-4 rounded-2xl">
                  <MapPin className="text-orange-600 shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-orange-400 font-bold uppercase mb-1">Ubicación</p>
                    <p className="text-orange-900 font-medium">{selectedItem.address}</p>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Info size={18} className="text-gray-500" /> 
                  Descripción
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {selectedItem.description}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* --- VISTA LISTA --- */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Header Lista */}
            <div className="sticky top-0 bg-[#FFFBF5]/95 backdrop-blur-md z-50 px-4 py-4">
              <div className="flex items-center mb-4">
                <button
                  onClick={currentOnBack}
                  className="p-2 -ml-2 rounded-full hover:bg-orange-100 transition-colors text-gray-800 active:scale-95 cursor-pointer"
                >
                  <ArrowLeft size={32} />
                </button>
                <h1 className="ml-2 text-2xl font-bold text-orange-600">Mascotas en Morelia</h1>
              </div>

              {/* Búsqueda */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar parques, clínicas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-sm text-gray-900"
                />
              </div>
            </div>

            <div className="px-4 pb-10 flex-1 overflow-y-auto">
              
              {/* Filtros */}
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-2 mt-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === cat
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'bg-white text-gray-500 border border-gray-200'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Lugares Destacados */}
              {!searchQuery && filter === 'Todos' && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Destacados</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {featuredPlaces.map((place) => (
                      <div 
                        key={`featured-${place.id}`}
                        onClick={() => setSelectedItem(place)}
                        className="min-w-[240px] bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer"
                      >
                        <div className="h-32 relative">
                          <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-bold text-gray-700">{place.rating}</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 ${place.color}`}>
                            {place.icon} {place.type}
                          </span>
                          <h4 className="font-bold text-gray-900 truncate">{place.name}</h4>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin size={12} /> {place.distance}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de Tarjetas */}
              <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">
                {searchQuery ? 'Resultados de búsqueda' : 'Todos los lugares'}
              </h3>
              
              {filteredPlaces.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-gray-100">
                  <p className="text-gray-500">No se encontraron lugares.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPlaces.map((place) => (
                    <div 
                      key={place.id} 
                      onClick={() => setSelectedItem(place)}
                      className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex items-center gap-4 active:scale-95 transition-transform duration-200 cursor-pointer"
                    >
                      <img
                        src={place.image}
                        alt={place.name}
                        className="w-24 h-24 rounded-2xl object-cover shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${place.color}`}>
                            {place.icon} {place.type}
                          </span>
                          <span className="text-xs font-semibold text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
                            <MapPin size={10} /> {place.distance}
                          </span>
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg leading-tight truncate">{place.name}</h3>
                        <p className="text-gray-400 text-sm mt-1 truncate">{place.address}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Star size={14} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-bold text-gray-600 ml-1">{place.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SCREENSAVER REAL */}
      {isIdle && globalAds && globalAds.length > 0 && (
        <FullscreenIdleAd ads={globalAds} />
      )}
    </div>
  );
};

export default Mascotas;