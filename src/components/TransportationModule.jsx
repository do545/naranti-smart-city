import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
// 1. IMPORTACIONES NUEVAS
import { useTotem } from "@/contexts/TotemContext";
import FullscreenIdleAd from "@/components/FullscreenIdleAd";
import HeaderAd from "@/components/HeaderAd";
import { transportRoutes } from "@/data/transportRoutes";
import TransportMap from "./TransportMap";
import { ArrowLeft, Bus, Clock, DollarSign, MapPin, X, Info, ChevronRight, Search, Navigation2, Route as RouteIcon } from "lucide-react";

// --- FIX LEAFLET ICON (INTACTO) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function TransportationModule({ onBack, ad }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [isIdle, setIsIdle] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewRoute, setPreviewRoute] = useState(transportRoutes[0]);

  // 2. CONEXIÓN AL CEREBRO
  // ✅ CORRECCIÓN: Agregamos setIsHeaderAdVisible al destructuring
  const { globalAds, currentAdIndex, setIsHeaderAdVisible } = useTotem();

  // Determine the active ad to display.
  // We prioritize the 'ad' prop passed from MainInterface (which is synchronized).
  // As a fallback, we grab the current ad directly from the context.
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

  const handleBackGlobal = () => {
    navigate('/smartcity/display');
    if (onBack) onBack();
  };

  const getRouteStops = (route) => {
    if (Array.isArray(route?.stops) && route.stops.length > 0) {
      return route.stops.map((stop) => typeof stop === 'string' ? stop : stop?.name).filter(Boolean);
    }

    if (!route?.route) return [];
    return route.route.split(" - ").map((stop) => stop.trim()).filter(Boolean);
  };

  const filteredRoutes = transportRoutes.filter((route) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [
      route.name,
      route.shortName,
      route.colorName,
      route.route,
      route.frequency,
      route.schedule
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  const getStopsTitle = (route, stops) => {
    if (!route?.verifiedStopsCount) return 'Pasa por';
    return stops.length < route.verifiedStopsCount ? 'Paradas principales verificadas' : 'Paradas verificadas';
  };

  // --- VISTA DETALLE (MODAL CON MAPA) ---
  if (selected) {
    const routeStops = getRouteStops(selected);

    return (
      <div className="fixed inset-0 z-50 bg-[#FFFBF5] animate-in slide-in-from-bottom duration-300 flex flex-col font-sans">
        {/* Header Modal */}
        <div className="sticky top-0 bg-[#FFFBF5]/90 backdrop-blur-md px-4 py-4 flex justify-between items-center border-b border-indigo-100 z-10">
          <button
            onClick={() => setSelected(null)}
            className="p-2 -ml-2 rounded-full hover:bg-indigo-50 text-indigo-700 font-bold flex items-center gap-1"
          >
            <ChevronRight className="rotate-180" size={28} /> Volver a lista
          </button>
          <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-indigo-50 text-indigo-700"><X size={28} /></button>
        </div>

        {/* Contenido Detalle */}
        <div className="flex-1 overflow-y-auto pb-10">
          {/* Imagen de Cabecera */}
          <div className="relative h-48 w-full">
            <img
              src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop"
              className="w-full h-full object-cover"
              alt="Transporte Morelia"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFFBF5] to-transparent"></div>
          </div>

          <div className="px-6 relative -mt-10">
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                    {selected.verifiedStopsCount ? `${selected.verifiedStopsCount} paradas verificadas` : 'Ruta Urbana'}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight">{selected.name || 'Ruta sin nombre'}</h1>
                  {selected.dataStatus && (
                    <p className="text-xs text-gray-400 mt-2">{selected.dataStatus}</p>
                  )}
                </div>
                <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-indigo-200 shadow-md">
                  <Bus size={24} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><DollarSign size={10} /> Tarifa</p>
                  <p className="font-bold text-gray-800">{selected.fare || '$10.00'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock size={10} /> Frecuencia</p>
                  <p className="font-bold text-gray-800">{selected.frequency || '15 min'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><RouteIcon size={10} /> Puntos</p>
                  <p className="font-bold text-gray-800">{selected.verifiedStopsCount || selected.coordinates?.length || routeStops.length}</p>
                </div>
              </div>

              {selected.duration && (
                <div className="bg-[#F36F21]/10 border border-[#F36F21]/10 rounded-xl p-3 mb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#F36F21] font-bold uppercase tracking-widest">Duración estimada</p>
                    <p className="text-sm font-bold text-gray-800">{selected.duration}</p>
                  </div>
                  {selected.sourceName && (
                    <span className="text-[10px] text-gray-500 bg-white/70 px-2 py-1 rounded-full">
                      Fuente: {selected.sourceName}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <MapPin className="text-gray-400 shrink-0 mt-1" size={18} />
                  <div>
                    <p className="font-bold text-sm text-gray-700">Recorrido Principal</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{selected.route || 'Información de ruta no disponible.'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Info className="text-gray-400 shrink-0 mt-1" size={18} />
                  <div>
                    <p className="font-bold text-sm text-gray-700">Horario de Servicio</p>
                    <p className="text-sm text-gray-500">{selected.schedule || '6:00 AM - 10:00 PM'}</p>
                  </div>
                </div>
              </div>

              {/* --- AQUÍ ESTÁ TU MAPA INTACTO --- */}
              <div className="h-80 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative z-0">
                <TransportMap selectedRoute={selected} />
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">Mapa interactivo de la ruta</p>

              {routeStops.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    {getStopsTitle(selected, routeStops)}
                  </p>
                  <div className="relative pl-5 space-y-3">
                    <div
                      className="absolute left-[9px] top-2 bottom-2 w-0.5 rounded-full"
                      style={{ backgroundColor: selected.hex || '#4f46e5' }}
                    />
                    {routeStops.map((stop, index) => (
                      <div key={`${selected.id}-${stop}`} className="relative flex items-center gap-3">
                        <span
                          className="absolute -left-5 w-5 h-5 rounded-full border-4 border-white shadow-sm"
                          style={{ backgroundColor: index === 0 || index === routeStops.length - 1 ? selected.hex : '#ffffff', borderColor: index === 0 || index === routeStops.length - 1 ? '#ffffff' : selected.hex }}
                        />
                        <span className="text-sm font-semibold text-gray-700">{stop}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL (LISTA) ---
  return (
    <div
      className="min-h-screen bg-[#FFFBF5] font-sans flex flex-col relative transition-colors duration-300"
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
          onClick={handleBackGlobal}
          className="p-2 -ml-2 rounded-full hover:bg-indigo-50 text-gray-800 active:scale-95 transition-transform"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="ml-2 text-2xl font-bold text-[#F36F21]">Transporte Público</h1>
      </div>

      {/* 5. LISTA DE RUTAS */}
      <div className="px-4 pb-10 flex-1 overflow-y-auto">
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden mb-5">
          <div className="p-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-[#F36F21] uppercase tracking-widest mb-1">Explora en mapa</p>
              <h2 className="text-xl font-black text-gray-900 leading-tight">{previewRoute?.name || 'Rutas de Morelia'}</h2>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{previewRoute?.route}</p>
              {previewRoute?.verifiedStopsCount && (
                <p className="text-[10px] text-gray-400 mt-2">
                  {previewRoute.verifiedStopsCount} paradas verificadas · {previewRoute.duration}
                </p>
              )}
            </div>
            <div className="p-3 rounded-2xl bg-[#F36F21]/10 text-[#F36F21]">
              <Navigation2 size={24} />
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="h-56 rounded-2xl overflow-hidden border border-gray-100">
              <TransportMap selectedRoute={previewRoute} />
            </div>
          </div>
          <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
            {transportRoutes.map((route) => (
              <button
                key={`chip-${route.id}`}
                onClick={() => setPreviewRoute(route)}
                className={`shrink-0 px-3 py-2 rounded-full border text-xs font-bold transition-all ${previewRoute?.id === route.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-100'}`}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: route.hex }} />
                {route.shortName || route.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar ruta, color o destino..."
            className="w-full bg-white border border-orange-100 shadow-sm rounded-2xl py-4 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#F36F21] focus:ring-2 focus:ring-[#F36F21]/10"
          />
        </div>

        <div className="space-y-4">
          {filteredRoutes.map((p) => {
            const stops = getRouteStops(p);
            const firstStop = stops[0];
            const lastStop = stops[stops.length - 1];

            return (
            <div
              key={p.id}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex gap-4 active:scale-95 transition-transform duration-200 cursor-pointer relative overflow-hidden"
              onClick={() => setSelected(p)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: p.hex || '#F36F21' }} />
              {/* Icono o Imagen pequeña */}
              <div className="w-24 h-24 rounded-2xl shrink-0 flex items-center justify-center" style={{ backgroundColor: `${p.hex}18`, color: p.hex || '#4f46e5' }}>
                <Bus size={42} />
              </div>

              <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-gray-900 font-bold text-lg leading-tight line-clamp-1">{p.name || 'Ruta sin nombre'}</h3>
                  <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full" style={{ backgroundColor: `${p.hex}18`, color: p.hex || '#4f46e5' }}>{p.colorName}</span>
                  </div>
                  {p.verifiedStopsCount && (
                    <span className="inline-block text-[10px] font-bold text-[#F36F21] bg-[#F36F21]/10 px-2 py-1 rounded-full mb-2">
                      {p.verifiedStopsCount} paradas verificadas
                    </span>
                  )}
                  <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                    {p.route || 'Recorrido no disponible...'}
                  </p>
                  {firstStop && lastStop && (
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-2">
                      <MapPin size={12} style={{ color: p.hex || '#F36F21' }} />
                      <span className="truncate">{firstStop}</span>
                      <ChevronRight size={12} />
                      <span className="truncate">{lastStop}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock size={10} /> {p.frequency || 'N/A'}
                  </span>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <DollarSign size={10} /> {p.fare || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )})}
        </div>

        {filteredRoutes.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400">
            <Search className="mx-auto mb-3 opacity-50" size={36} />
            <p className="font-bold text-gray-600">No encontramos esa ruta</p>
            <p className="text-sm">Prueba con otro color, destino o nombre.</p>
          </div>
        )}
      </div>

      {/* 6. SCREENSAVER */}
      {isIdle && globalAds && globalAds.length > 0 && (
        <FullscreenIdleAd ads={globalAds} />
      )}
    </div>
  );
}