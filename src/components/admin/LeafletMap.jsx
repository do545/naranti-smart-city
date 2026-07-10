import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getDevices } from '@/services/deviceService';

export function LeafletMap() {
  const [devices, setDevices] = useState([]);
  const [center, setCenter] = useState([19.7028169, -101.1923186]); // Morelia default

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const data = await getDevices();
        // Filtramos dispositivos que tengan coordenadas válidas
        const validDevices = (data || []).filter(d => d.latitude && d.longitude);
        setDevices(validDevices);

        // Si hay dispositivos nuevos, podemos ajustar el centro (opcional)
        if (validDevices.length > 0 && center[0] === 19.7028169) {
          setCenter([validDevices[0].latitude, validDevices[0].longitude]);
        }
      } catch (error) {
        console.error("Error loading devices for map:", error);
      }
    };

    loadDevices();
    const interval = setInterval(loadDevices, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, [center]);

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '1rem', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {devices.map((device) => {
          // Calculamos si está online (basado en el latido de los últimos 2 minutos)
          let isOnline = false;
          if (device.lastSeen) {
            try {
              const lastSeenDate = device.lastSeen.toDate ? device.lastSeen.toDate() : new Date(device.lastSeen);
              isOnline = (Date.now() - lastSeenDate.getTime()) < 120000;
            } catch (e) {
              console.warn("Error parsing date for device:", device.id);
            }
          }

          return (
            <Marker key={device.id} position={[device.latitude, device.longitude]}>
              <Popup>
                <div className="p-1 min-w-[120px]">
                  <b className="text-[#F36F21] block mb-1">{device.name || 'Dispositivo'}</b>
                  <p className="text-[10px] text-gray-500 mb-2">{device.location || 'Sin ubicación'}</p>
                  <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[9px] uppercase font-black tracking-wider">
                      {isOnline ? 'En Línea' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default LeafletMap;