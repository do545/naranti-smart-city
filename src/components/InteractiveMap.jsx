// src/components/InteractiveMap.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';

const MORELIA_CENTER = [19.7042, -101.1948];

// Iconos Leaflet por defecto
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Ruta DEMO (combi)
const RUTA_COMBI_DEMO = [
  [19.7065, -101.1978],
  [19.7053, -101.1952],
  [19.7042, -101.1948],
  [19.7018, -101.1912],
];

// Fuerza recálculo de tamaño en varios momentos
function MapSizeFix() {
  const map = useMap();
  useEffect(() => {
    const kick = () => map.invalidateSize(true);
    // cuando el mapa esté listo
    map.whenReady(() => {
      kick();
      setTimeout(kick, 150);
      setTimeout(kick, 600);
      setTimeout(kick, 1200);
    });
    // al redimensionar
    const onResize = () => requestAnimationFrame(kick);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [map]);
  return null;
}

export default function InteractiveMap() {
  const [center, setCenter] = useState(MORELIA_CENTER);
  const [userAllowed, setUserAllowed] = useState(false);

  // Geo real (si hay permiso)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setCenter(c);
        setUserAllowed(true);
      },
      () => {
        setUserAllowed(false);
        setCenter(MORELIA_CENTER);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // Para re-montar MapContainer cuando cambie el centro (evita “corte”)
  const mapKey = `${center[0].toFixed(4)},${center[1].toFixed(4)}`;

  const markers = useMemo(
    () => [
      {
        pos: center,
        title: userAllowed ? 'Tu ubicación' : 'Tótem Órbita — Punto central',
        desc: userAllowed
          ? 'Ubicación detectada por tu dispositivo.'
          : 'Catedral de Morelia (referencia).',
      },
      {
        pos: [19.7042, -101.1948],
        title: 'Catedral de Morelia',
        desc: 'Patrimonio de la Humanidad. Historia y datos curiosos.',
      },
      {
        pos: [19.7059, -101.1968],
        title: 'Parada Combi — Av. Madero',
        desc: 'Conecta con zona centro y oriente (demo).',
      },
      {
        pos: [19.7026, -101.1922],
        title: 'Parada Camión — Centro',
        desc: 'Rutas troncales (demo).',
      },
      {
        pos: [19.7036, -101.1956],
        title: 'Restaurante Local',
        desc: 'Promoción Coca-Cola disponible.',
      },
    ],
    [center, userAllowed]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full flex items-center justify-center"
    >
      {/* Wrapper vertical con altura fija y pos:relative */}
      <div
        className="relative w-[92vw] md:w-full rounded-2xl overflow-hidden shadow-xl border border-white/10"
        style={{
          height: '68vh',     // prueba 66–70vh si lo necesitas
          minHeight: 520,
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <MapContainer
          key={mapKey}                 // fuerza remount cuando cambia el centro
          center={center}
          zoom={15}
          scrollWheelZoom={false}
          zoomAnimation={false}       // reduce glitches en contenedores con transform
          fadeAnimation={false}       // idem
          preferCanvas={true}         // opcional: mejora estabilidad
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Ruta DEMO */}
          <Polyline positions={RUTA_COMBI_DEMO} color="#60a5fa" weight={4} opacity={0.9} />

          {/* Marcadores */}
          {markers.map((m, i) => (
            <Marker key={i} position={m.pos}>
              <Popup>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.title}</div>
                <div style={{ opacity: 0.85 }}>{m.desc}</div>
              </Popup>
            </Marker>
          ))}

          <MapSizeFix />
        </MapContainer>
      </div>
    </motion.div>
  );
}