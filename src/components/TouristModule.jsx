import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, X, Info, ChevronRight, Camera, Landmark, Clock, Sparkles, Route as RouteIcon, BookOpen } from "lucide-react";
// 1. IMPORTACIONES DE CONEXIÓN
import { useTotem } from "@/contexts/TotemContext";
import FullscreenIdleAd from "@/components/FullscreenIdleAd";
import HeaderAd from "@/components/HeaderAd";

export default function TouristModule({ onBack, ad }) {
  const navigate = useNavigate();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isIdle, setIsIdle] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todos");

  const { globalAds, currentAdIndex, setIsHeaderAdVisible } = useTotem();

  const displayAd = ad || (globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null);

  const adsForHeader = displayAd ? [displayAd] : [];

  useEffect(() => {
    const handleScroll = () => {
      if (typeof setIsHeaderAdVisible === 'function') {
        setIsHeaderAdVisible(window.scrollY < 20);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setIsHeaderAdVisible]);

  const handleBack = () => {
    navigate('/smartcity/display');
    if (onBack) {
      onBack();
    }
  };

  const imageFallback = "bg-[radial-gradient(circle_at_top_left,#F36F21_0%,#F8B84E_36%,#0F172A_100%)]";

  function PlaceImage({ place, className }) {
    const [failed, setFailed] = useState(false);

    if (failed || !place.img) {
      return (
        <div className={`${className} ${imageFallback} flex items-center justify-center text-white overflow-hidden`}>
          <div className="text-center px-4">
            <Camera size={32} className="mx-auto mb-2 opacity-90" />
            <span className="text-xs font-black uppercase tracking-widest">{place.category}</span>
          </div>
        </div>
      );
    }

    return (
      <img
        src={place.img}
        className={className}
        alt={place.name}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  const touristPlaces = [
    {
      id: 1,
      category: "Patrimonio",
      name: "Catedral de Morelia",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/b99517ddbf71593d20b8855064ba1c79.png",
      rating: 4.9,
      address: "Av. Madero, Centro Histórico",
      distance: "Centro",
      short: "Catedral barroca de cantera rosa y principal postal del Centro Histórico.",
      detail: "Su construcción inició en el siglo XVII y hoy es el punto visual más reconocible de Morelia. Es ideal para iniciar una caminata por portales, plazas, museos y edificios de cantera.",
      history: "La Catedral concentra buena parte de la identidad virreinal de Morelia. Sus torres, fachada de cantera y ubicación frente a la plaza principal explican por qué el Centro Histórico fue reconocido como Patrimonio Mundial.",
      bestFor: "Arquitectura, fotografía, caminata",
      suggestedTime: "30-45 min",
      tip: "Al atardecer la cantera toma tonos más cálidos y la plaza tiene mejor ambiente peatonal."
    },
    {
      id: 2,
      category: "Patrimonio",
      name: "Acueducto de Morelia",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/f553aa5edd8baf4f5c0802471d152270.png",
      rating: 4.8,
      address: "Av. Acueducto y zona Villalongín",
      distance: "1 km",
      short: "Monumento urbano de cantera con 253 arcos, uno de los símbolos de la ciudad.",
      detail: "El acueducto histórico recorre una de las avenidas más fotogénicas de Morelia y conecta muy bien con la Fuente de las Tarascas y la Calzada de Guadalupe.",
      history: "El acueducto recuerda la ingeniería urbana que llevó agua a la antigua Valladolid. Hoy funciona como referencia histórica y como eje visual para entender el crecimiento de la ciudad hacia el oriente.",
      bestFor: "Fotos, paseo urbano, historia",
      suggestedTime: "20-35 min",
      tip: "Combínalo con Tarascas y Calzada de Guadalupe en una misma caminata."
    },
    {
      id: 3,
      category: "Cultura",
      name: "Teatro Ocampo",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/f6c5d05fe3663377240841ecff1ff2ed.png",
      rating: 4.7,
      address: "Centro histórico",
      distance: "0.8 km",
      short: "Recinto escénico tradicional para teatro, música y eventos culturales.",
      detail: "Es uno de los espacios culturales clásicos del centro. Conviene revisarlo como parada si hay programación activa durante la visita.",
      history: "Forma parte de la vida escénica de Morelia y conserva la tradición de los teatros históricos del centro, donde la ciudad mantiene una agenda de música, teatro y actividades públicas.",
      bestFor: "Agenda cultural, arquitectura interior",
      suggestedTime: "20-60 min",
      tip: "Si hay función, es una de las mejores formas de vivir la ciudad de noche."
    },
    {
      id: 4,
      category: "Cultura",
      name: "Teatro Matamoros",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/f8e6f9f363bd71c4c02401e770a29513.png",
      rating: 4.8,
      address: "Centro histórico",
      distance: "0.6 km",
      short: "Teatro restaurado y moderno para espectáculos en el corazón de Morelia.",
      detail: "Funciona como recinto cultural contemporáneo dentro del centro, útil para visitantes que buscan algo más que una caminata patrimonial.",
      history: "El Teatro Matamoros recupera una vocación cultural ligada al centro histórico. Su restauración lo integra a la oferta actual de espectáculos sin perder su relación con la arquitectura patrimonial.",
      bestFor: "Eventos, música, teatro",
      suggestedTime: "30-90 min",
      tip: "Vale la pena consultarlo en tardes y fines de semana."
    },
    {
      id: 5,
      category: "Imperdibles",
      name: "Fuente de las Tarascas",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/ee8b3f37fa917288d278973a1da46b7e.png",
      rating: 4.7,
      address: "Av. Madero y Acueducto",
      distance: "1.2 km",
      short: "Fuente monumental y punto de encuentro entre Centro, Acueducto y Calzada.",
      detail: "Es una referencia urbana inmediata para orientarse. Desde aquí se puede caminar hacia el Acueducto, el Callejón del Romance o la Calzada de Guadalupe.",
      history: "La Fuente de las Tarascas es un símbolo popular de Morelia. Representa una imagen muy reconocida de la ciudad y conecta con la identidad purépecha del estado.",
      bestFor: "Foto rápida, ruta caminable",
      suggestedTime: "10-20 min",
      tip: "Úsala como punto de partida para una ruta corta por el oriente del centro."
    },
    {
      id: 6,
      category: "Sabores",
      name: "Museo del Dulce",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/056f47a260e656223495f92c08480c76.png",
      rating: 4.6,
      address: "Centro histórico",
      distance: "0.9 km",
      short: "Dulces típicos, historia local y compras rápidas para llevar.",
      detail: "Una parada práctica para visitantes que quieren probar ate, morelianas, dulces tradicionales y llevar recuerdos gastronómicos.",
      history: "La dulcería tradicional michoacana forma parte de la memoria gastronómica de Morelia. Este tipo de espacios ayuda a explicar sabores locales como el ate, las morelianas y los dulces de leche.",
      bestFor: "Familias, compras, gastronomía",
      suggestedTime: "20-40 min",
      tip: "Buena parada entre Catedral, Tarascas y los portales."
    },
    {
      id: 7,
      category: "Naturaleza",
      name: "Bosque Cuauhtémoc",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/937b321b7c38eb79e9cfaf4cea8457ed.png",
      rating: 4.6,
      address: "Av. Acueducto",
      distance: "1.7 km",
      short: "Parque urbano con museos cercanos, sombra y espacios para caminar.",
      detail: "Es una pausa verde dentro de la ciudad. Funciona bien para familias, descanso y recorridos tranquilos cerca del acueducto.",
      history: "El Bosque Cuauhtémoc funciona como pulmón urbano y como conexión cultural por su cercanía con museos, el Acueducto y zonas de paseo tradicionales.",
      bestFor: "Familias, descanso, caminata",
      suggestedTime: "35-60 min",
      tip: "Mejor visitarlo de día para aprovechar áreas verdes y museos cercanos."
    },
    {
      id: 8,
      category: "Ciencia",
      name: "Planetario de Morelia",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/b6941caa109dae9f58ca17d4732cf33b.webp",
      rating: 4.5,
      address: "Av. Ventura Puente",
      distance: "2.3 km",
      short: "Espacio de divulgación científica con proyecciones y actividades educativas.",
      detail: "Una alternativa distinta al recorrido colonial. Es recomendable para familias, estudiantes y visitantes que buscan una experiencia bajo techo.",
      history: "El Planetario amplía la oferta cultural de Morelia hacia la ciencia y la educación. Complementa los recorridos patrimoniales con una experiencia de divulgación para familias y estudiantes.",
      bestFor: "Familias, ciencia, niños",
      suggestedTime: "45-90 min",
      tip: "Conviene revisar horarios de funciones antes de trasladarse."
    },
    {
      id: 9,
      category: "Historia",
      name: "Casa Natal de Morelos",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/0246771b4c260dcab23c5faa4c06c0ae.jpg",
      rating: 4.7,
      address: "Centro histórico",
      distance: "1 km",
      short: "Museo histórico dedicado a José María Morelos y Pavón.",
      detail: "Morelia debe su nombre a Morelos, y esta casa museo ayuda a conectar la ciudad con su papel en la historia de México.",
      history: "La Casa Natal de Morelos vincula directamente a la ciudad con José María Morelos y Pavón. Es una parada clave para entender el cambio de Valladolid a Morelia y su lugar en la historia nacional.",
      bestFor: "Historia, museos, estudiantes",
      suggestedTime: "30-50 min",
      tip: "Útil como parada cultural antes o después de caminar por Madero."
    },
    {
      id: 10,
      category: "Arte",
      name: "Centro Cultural Clavijero",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/82b4ebe740766bdb4177c6a87f807b94.webp",
      rating: 4.8,
      address: "Centro histórico",
      distance: "0.7 km",
      short: "Antiguo conjunto histórico convertido en centro de artes visuales.",
      detail: "El edificio y sus patios ya justifican la visita. Además suele alojar exposiciones temporales, por lo que puede cambiar la experiencia según la temporada.",
      history: "El Centro Cultural Clavijero ocupa un edificio histórico que hoy se usa para arte y exposiciones. Es un buen ejemplo de cómo Morelia reutiliza su patrimonio para vida cultural contemporánea.",
      bestFor: "Arte, arquitectura, exposiciones",
      suggestedTime: "40-70 min",
      tip: "Ideal si el visitante quiere una parada fresca y cultural cerca de la Catedral."
    },
    {
      id: 11,
      category: "Imperdibles",
      name: "Jardín de las Rosas",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/2747693cb949e5c3a340f868cf9f656c.png",
      rating: 4.6,
      address: "Centro histórico",
      distance: "0.8 km",
      short: "Plaza con cafés, arte, música y ambiente relajado.",
      detail: "Es uno de los rincones más agradables para sentarse, tomar café y bajar el ritmo después de recorrer el centro.",
      history: "El Jardín de las Rosas conserva un ambiente bohemio asociado con música, cafés y vida estudiantil. Su entorno ayuda a entender la Morelia cotidiana alrededor de plazas y portales.",
      bestFor: "Café, descanso, fotos",
      suggestedTime: "30-60 min",
      tip: "Funciona muy bien al final de una ruta por el Centro Histórico."
    },
    {
      id: 12,
      category: "Música",
      name: "Conservatorio de las Rosas",
      img: "https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/2747693cb949e5c3a340f868cf9f656c.png",
      rating: 4.7,
      address: "Centro histórico",
      distance: "0.9 km",
      short: "Institución musical histórica ligada a la identidad cultural de Morelia.",
      detail: "Morelia es Ciudad Creativa de la Música por UNESCO, y el Conservatorio ayuda a explicar esa vocación cultural de la ciudad.",
      history: "El Conservatorio de las Rosas es una referencia musical de gran peso para Morelia. Su historia fortalece la identidad de la ciudad como espacio de formación, recitales y tradición musical.",
      bestFor: "Música, historia, arquitectura",
      suggestedTime: "20-40 min",
      tip: "Combínalo con Jardín de las Rosas y Centro Cultural Clavijero."
    }
  ];

  const categories = ["Todos", ...Array.from(new Set(touristPlaces.map((place) => place.category)))];
  const filteredPlaces = activeCategory === "Todos"
    ? touristPlaces
    : touristPlaces.filter((place) => place.category === activeCategory);
  const featuredPlace = touristPlaces[0];

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

  // Función para despertar al tocar
  const handleWake = () => {
    setIsIdle(false);
  };

  // --- MODAL DE DETALLE DEL LUGAR ---
  if (selectedPlace) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FFFBF5] animate-in slide-in-from-bottom duration-300 flex flex-col font-sans">
        {/* Header Modal */}
        <div className="sticky top-0 bg-[#FFFBF5]/90 backdrop-blur-md px-4 py-4 flex justify-between items-center border-b border-orange-100">
          <button
            onClick={() => setSelectedPlace(null)}
            className="p-2 -ml-2 rounded-full hover:bg-orange-100 text-[#F36F21] font-bold flex items-center gap-1"
          >
            <ChevronRight className="rotate-180" size={28} /> Atrás
          </button>
          <button onClick={() => setSelectedPlace(null)} className="p-2 rounded-full hover:bg-orange-100 text-[#F36F21]"><X size={28} /></button>
        </div>

        {/* Contenido Modal */}
        <div className="flex-1 overflow-y-auto pb-10">
          <PlaceImage
            place={selectedPlace}
            className="w-full h-72 object-cover rounded-b-[2rem] shadow-sm mb-4"
          />

          <div className="px-6 py-2 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#F36F21] bg-orange-50 px-2 py-1 rounded-full uppercase tracking-widest mb-3">
              <Landmark size={12} /> {selectedPlace.category}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2">{selectedPlace.name}</h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg text-xs font-bold text-yellow-700 border border-yellow-100">
                <Star size={12} className="fill-yellow-500 text-yellow-500" /> {selectedPlace.rating}
              </span>
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <MapPin size={14} /> {selectedPlace.address}
              </span>
            </div>

            <div className="prose prose-orange">
              <p className="text-gray-700 text-lg leading-relaxed font-medium">
                {selectedPlace.short}
              </p>
              <p className="text-gray-600 mt-4 leading-relaxed">
                {selectedPlace.detail}
              </p>
            </div>

            {selectedPlace.history && (
              <div className="mt-6 bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                <h3 className="text-[#F36F21] font-bold mb-2 flex items-center gap-2">
                  <BookOpen size={18} /> Historia y cultura
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedPlace.history}</p>
              </div>
            )}

            {/* Información Extra */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <MapPin size={18} className="text-[#F36F21] mb-2" />
                <p className="text-[10px] text-gray-400 font-bold uppercase">Zona</p>
                <p className="text-xs font-bold text-gray-800">{selectedPlace.distance}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <Clock size={18} className="text-[#F36F21] mb-2" />
                <p className="text-[10px] text-gray-400 font-bold uppercase">Tiempo</p>
                <p className="text-xs font-bold text-gray-800">{selectedPlace.suggestedTime}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <Camera size={18} className="text-[#F36F21] mb-2" />
                <p className="text-[10px] text-gray-400 font-bold uppercase">Ideal</p>
                <p className="text-xs font-bold text-gray-800">{selectedPlace.bestFor}</p>
              </div>
            </div>

            <div className="mt-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-[#F36F21] font-bold mb-2 flex items-center gap-2">
                <Info size={18} /> Tip local
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedPlace.tip}</p>
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
          className="p-2 -ml-2 rounded-full hover:bg-orange-100 text-gray-800 active:scale-95 transition-transform"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="ml-2 text-2xl font-bold text-[#F36F21]">Lugares Turísticos</h1>
      </div>

      {/* 5. LISTA DE LUGARES */}
      <div className="px-4 pb-10 flex-1 overflow-y-auto">
        <div
          onClick={() => setSelectedPlace(featuredPlace)}
          className="relative h-56 rounded-3xl overflow-hidden mb-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
        >
          <PlaceImage place={featuredPlace} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute left-4 right-4 bottom-4 text-white">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/15 backdrop-blur px-2 py-1 rounded-full mb-2">
              <Sparkles size={12} /> Ruta esencial
            </span>
            <h2 className="text-2xl font-black leading-tight">Centro Histórico de Morelia</h2>
            <p className="text-xs text-white/80 mt-1 line-clamp-2">
              Patrimonio Mundial UNESCO, cantera rosa, plazas, museos y arquitectura monumental en una ruta caminable.
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-colors ${activeCategory === category ? 'bg-[#F36F21] text-white border-[#F36F21]' : 'bg-white text-gray-500 border-orange-100'}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              onClick={() => setSelectedPlace(place)}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex gap-4 active:scale-95 transition-transform duration-200 cursor-pointer"
            >
              <PlaceImage place={place} className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm" />

              <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#F36F21] bg-orange-50 px-2 py-1 rounded-full mb-1">
                    <RouteIcon size={10} /> {place.category}
                  </span>
                  <h3 className="text-gray-900 font-bold text-lg leading-tight line-clamp-1 mb-1">{place.name}</h3>
                  <p className="text-gray-400 text-xs truncate flex items-center gap-1">
                    <MapPin size={10} /> {place.address}
                  </p>
                  <p className="text-gray-500 text-xs line-clamp-2 mt-1">{place.short}</p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-gray-700">{place.rating}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#F36F21] bg-orange-50 px-2 py-1 rounded-full">
                    {place.distance}
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