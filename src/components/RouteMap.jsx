import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* --------------------------
   🔵 ÍCONOS DE INICIO Y FIN
--------------------------- */
const startIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    width: 12px; height: 12px;
    background: white;
    border: 3px solid #10B981;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,.3);
  "></div>`,
});

const endIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    width: 12px; height: 12px;
    background: white;
    border: 3px solid #EF4444;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,.3);
  "></div>`,
});

/* --------------------------
   🔵 AUTO-ZOOM CINEMÁTICO
--------------------------- */
function MapEffect({ coords }) {
  const map = useMap();

  useEffect(() => {
    if (!coords || coords.length === 0) return;

    const bounds = L.latLngBounds(coords);

    map.flyToBounds(bounds, {
      padding: [30, 30],
      duration: 1.4,
      easeLinearity: 0.25,
    });
  }, [coords]);

  return null;
}

/* --------------------------
   🔵 TRAYECTORIA ANIMADA
--------------------------- */
function AnimatedRoute({ coords, color }) {
  const [animatedCoords, setAnimatedCoords] = useState([]);

  useEffect(() => {
    if (!coords) return;

    setAnimatedCoords([]);
    let index = 0;

    const interval = setInterval(() => {
      index++;
      setAnimatedCoords(coords.slice(0, index));

      if (index >= coords.length) clearInterval(interval);
    }, 90);

    return () => clearInterval(interval);
  }, [coords]);

  return (
    <>
      {/* Glow */}
      <Polyline
        positions={animatedCoords}
        pathOptions={{
          color,
          weight: 14,
          opacity: 0.25,
          lineCap: "round",
          lineJoin: "round",
          className: "blur-sm",
        }}
      />

      {/* Línea sólida */}
      <Polyline
        positions={animatedCoords}
        pathOptions={{
          color,
          weight: 5,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        }}
      />

      {/* Flow dots */}
      <Polyline
        positions={animatedCoords}
        pathOptions={{
          color: "white",
          weight: 3,
          opacity: 0.7,
          dashArray: "0, 14",
          className: "animate-dash-flow",
        }}
      />
    </>
  );
}

/* --------------------------
   🔵 MAPA COMPLETO
--------------------------- */
const RouteMap = ({ route }) => {
  if (!route || !route.coordinates) return null;

  return (
    <div className="relative w-full h-64 rounded-[28px] overflow-hidden bg-gray-100 shadow-inner">

      <MapContainer
        center={route.coordinates[0]}
        zoom={13}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        {/* AUTO ZOOM */}
        <MapEffect coords={route.coordinates} />

        {/* TRAZO ANIMADO */}
        <AnimatedRoute coords={route.coordinates} color={route.hex} />

        {/* MARCADORES */}
        <Marker position={route.coordinates[0]} icon={startIcon} />
        <Marker
          position={route.coordinates[route.coordinates.length - 1]}
          icon={endIcon}
        />
      </MapContainer>

      {/* CHIPS: RUTA */}
      <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-white/50 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-600 z-50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Ruta Activa
      </div>

      {/* CSS PARA ANIMACIÓN */}
      <style>{`
        .animate-dash-flow {
          animation: dashMove 1s linear infinite;
        }
        .blur-sm { filter: blur(4px); }
        @keyframes dashMove {
          to { stroke-dashoffset: -14; }
        }
      `}</style>
    </div>
  );
};

export default RouteMap;