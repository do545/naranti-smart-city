// ✅ Búsqueda fija (Morelia)
export function fetchNearbyPlaces({ lat, lng, radius }) {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return reject(new Error("Google Maps Places API not loaded"));
    }

    const location = new window.google.maps.LatLng(lat, lng);
    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );

    service.nearbySearch(
      {
        location,
        radius,
        type: "restaurant",
      },
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve(results);
        } else {
          reject(new Error(`Google Places failed: ${status}`));
        }
      }
    );
  });
}

// ✅ Nueva versión automática (usa ubicación del kiosko)
export function fetchNearbyPlacesAuto({ radius = 1000 }) {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return reject(new Error("Google Maps Places API not loaded"));
    }

    // Verificar si hay datos en caché del último mes
    const cached = localStorage.getItem("lastPlacesFetch");
    const now = Date.now();

    if (cached) {
      const parsed = JSON.parse(cached);
      if (now - parsed.timestamp < 30 * 24 * 60 * 60 * 1000) {
        console.log("📦 Usando resultados en caché");
        return resolve(parsed.data);
      }
    }

    // Obtener ubicación actual
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const location = new window.google.maps.LatLng(latitude, longitude);
        const service = new window.google.maps.places.PlacesService(
          document.createElement("div")
        );

        service.nearbySearch(
          {
            location,
            radius,
            type: "restaurant",
          },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              // Guardar resultados por 30 días
              localStorage.setItem(
                "lastPlacesFetch",
                JSON.stringify({ timestamp: now, data: results })
              );
              resolve(results);
            } else {
              reject(new Error(`Google Places failed: ${status}`));
            }
          }
        );
      },
      (err) => {
        console.error("❌ Error al obtener ubicación:", err);
        reject(err);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  });
}