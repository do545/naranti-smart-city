import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMap, Marker, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- ÍCONOS PERSONALIZADOS (Start/End estilo iOS) ---
const startIcon = (color) =>
  new L.DivIcon({
    className: "bg-transparent",
    html: `<div style="width: 14px; height: 14px; background: white; border: 4px solid ${color}; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const endIcon = (color) =>
  new L.DivIcon({
    className: "bg-transparent",
    html: `<div style="width: 18px; height: 18px; background: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.4); position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
           </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

// --- CONTROLADOR DE CÁMARA (Auto-Zoom suave iOS) ---
const MapController = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (!coords || coords.length === 0) return;

    const bounds = L.latLngBounds(coords);

    map.flyToBounds(bounds, {
      padding: [40, 40],
      duration: 1.2,
      easeLinearity: 0.25,
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [coords, map]);

  return null;
};

export default function TransportMap({ selectedRoute }) {
  if (!selectedRoute || !selectedRoute.coordinates || selectedRoute.coordinates.length === 0) {
    return (
      <div className="w-full h-72 rounded-3xl overflow-hidden bg-gray-100 flex flex-col items-center justify-center text-gray-400 border border-gray-200 shadow-inner">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-3 opacity-50"
        >
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
        <p className="font-medium text-sm">Selecciona una ruta para ver su recorrido</p>
      </div>
    );
  }

  const routeColor = selectedRoute.hex || "#3B82F6";
  const coords = selectedRoute.coordinates;

  return (
    <div className="w-full h-72 rounded-[32px] overflow-hidden shadow-lg border border-gray-100 relative z-0 group">
      <MapContainer
        center={coords[0]}
        zoom={13}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full bg-gray-50"
      >
        {/* Mapa base estilo Apple Maps Light */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        {/* Glow grueso */}
        <Polyline
          positions={coords}
          pathOptions={{
            color: routeColor,
            weight: 12,
            opacity: 0.3,
            lineCap: "round",
            lineJoin: "round",
            className: "blur-effect",
          }}
        />

        {/* Línea sólida */}
        <Polyline
          positions={coords}
          pathOptions={{
            color: routeColor,
            weight: 5,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Línea animada dash */}
        <Polyline
          positions={coords}
          pathOptions={{
            color: "white",
            weight: 3,
            opacity: 0.5,
            dashArray: "0, 12",
            className: "animate-dash",
          }}
        />

        {/* Puntos intermedios */}
        {coords.slice(1, -1).map((coord, index) => (
          <CircleMarker
            key={`${selectedRoute.id}-stop-${index}`}
            center={coord}
            radius={5}
            pathOptions={{
              color: routeColor,
              fillColor: "#ffffff",
              fillOpacity: 1,
              weight: 3,
            }}
          />
        ))}

        {/* Marcadores de Inicio y Fin */}
        <Marker position={coords[0]} icon={startIcon(routeColor)} />
        <Marker position={coords[coords.length - 1]} icon={endIcon(routeColor)} />

        <MapController coords={coords} />
      </MapContainer>

      {/* Badge flotante */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-gray-200/50 flex items-center gap-2 z-[500]">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">En vivo</span>
      </div>

      {/* Estilos para animaciones */}
      <style>{`
        .animate-dash {
          animation: dashMove 1s linear infinite;
        }
        .blur-effect {
          filter: blur(4px);
        }
        @keyframes dashMove {
          to {
            stroke-dashoffset: -12;
          }
        }
        .leaflet-container {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}