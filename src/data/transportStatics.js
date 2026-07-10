export const transportColors = {
  "Ruta 1": { base: "#9CA3AF", shadow: "#6B7280", glow: "#E5E7EB" }, // Gris
  "Ruta 2": { base: "#EF4444", shadow: "#DC2626", glow: "#F87171" }, // Rojo
  "Ruta 3": { base: "#FBBF24", shadow: "#F59E0B", glow: "#FCD34D" }, // Amarillo (Taxi)
  "Ruta 4": { base: "#F97316", shadow: "#EA580C", glow: "#FB923C" }, // Naranja
  "Ruta 5": { base: "#10B981", shadow: "#059669", glow: "#34D399" }, // Verde (Tranvía)
  "Ruta 6": { base: "#3B82F6", shadow: "#2563EB", glow: "#60A5FA" }, // Azul
  "Ruta 7": { base: "#22C55E", shadow: "#16A34A", glow: "#4ADE80" }, // Verde
  "Ruta 8": { base: "#8B5CF6", shadow: "#7C3AED", glow: "#A78BFA" }, // Morado
  "Ruta 9": { base: "#EAB308", shadow: "#D97706", glow: "#FACC15" }, // Amarillo
  "Ruta 10": { base: "#EC4899", shadow: "#DB2777", glow: "#F472B6" }, // Rosa
  "Ruta 11": { base: "#8D6E63", shadow: "#6D4C41", glow: "#A1887F" }, // Café
  "Ruta 12": { base: "#FFFFFF", shadow: "#E5E7EB", glow: "#FFFFFF" }, // Blanco
  "Ruta 13": { base: "#FB923C", shadow: "#F97316", glow: "#FDBA74" }, // Naranja
  "Ruta 14": { base: "#1F2937", shadow: "#111827", glow: "#4B5563" }, // Negro
  "Ruta 15": { base: "#A855F7", shadow: "#9333EA", glow: "#C084FC" }, // Morado
  "Ruta 16": { base: "#DC2626", shadow: "#B91C1C", glow: "#F87171" }, // Rojo
  "Ruta 17": { base: "#16A34A", shadow: "#15803D", glow: "#4ADE80" }, // Verde
  "Ruta 18": { base: "#2563EB", shadow: "#1D4ED8", glow: "#60A5FA" }, // Azul
  "Ruta 19": { base: "#D97706", shadow: "#B45309", glow: "#FBBF24" }, // Amarillo
  "Ruta 20": { base: "#DB2777", shadow: "#BE185D", glow: "#F472B6" }, // Rosa
  "Ruta 21": { base: "#78350F", shadow: "#522209", glow: "#92400E" }, // Café
  "Ruta 22": { base: "#F9FAFB", shadow: "#F3F4F6", glow: "#FFFFFF" }, // Blanco
  "Ruta 23": { base: "#F59E0B", shadow: "#D97706", glow: "#FBBF24" }, // Naranja
  "Ruta 24": { base: "#111827", shadow: "#000000", glow: "#374151" }, // Negro
  "Ruta 25": { base: "#9333EA", shadow: "#7E22CE", glow: "#A78BFA" } // Morado
};

export const transportImages = {
  "Ruta 1": "/transport/photos/ruta-gris-1.png",
  "Ruta 2": "/transport/photos/ruta-roja-2.png",
  "Ruta 3": "/transport/photos/taxi-morelia.png",
  "Ruta 4": "/transport/photos/colectivo-naranja.png",
  "Ruta 5": "/transport/photos/tranvia-turistico.png",
  "Ruta 6": "/transport/photos/ruta-azul-7.png",
  "Ruta 7": "/transport/photos/ruta-verde-8.png",
  "Ruta 8": "/transport/photos/ruta-morada-9.png",
  "Ruta 9": "/transport/photos/ruta-amarilla-10.png",
  "Ruta 10": "/transport/photos/ruta-rosa-11.png",
  "Ruta 11": "/transport/photos/ruta-cafe-12.png",
  "Ruta 12": "/transport/photos/ruta-blanca-13.png",
  "Ruta 13": "/transport/photos/ruta-naranja-14.png",
  "Ruta 14": "/transport/photos/ruta-negra-15.png",
  "Ruta 15": "/transport/photos/ruta-morada-16.png",
  "Ruta 16": "/transport/photos/ruta-roja-17.png",
  "Ruta 17": "/transport/photos/ruta-verde-18.png",
  "Ruta 18": "/transport/photos/ruta-azul-19.png",
  "Ruta 19": "/transport/photos/ruta-amarilla-20.png",
  "Ruta 20": "/transport/photos/ruta-rosa-21.png",
  "Ruta 21": "/transport/photos/ruta-cafe-22.png",
  "Ruta 22": "/transport/photos/ruta-blanca-23.png",
  "Ruta 23": "/transport/photos/ruta-naranja-24.png",
  "Ruta 24": "/transport/photos/ruta-negra-25.png",
  "Ruta 25": "/transport/photos/ruta-morada-16.png"
};

export const transportGlow = {
  default: "drop-shadow(0 0 5px rgba(255, 255, 255, 0.7))",
  "Ruta 1": `drop-shadow(0 0 8px ${transportColors["Ruta 1"].glow})`,
  "Ruta 2": `drop-shadow(0 0 8px ${transportColors["Ruta 2"].glow})`,
  "Ruta 3": `drop-shadow(0 0 8px ${transportColors["Ruta 3"].glow})`,
  "Ruta 4": `drop-shadow(0 0 8px ${transportColors["Ruta 4"].glow})`,
  "Ruta 5": `drop-shadow(0 0 8px ${transportColors["Ruta 5"].glow})`,
};

export const transportLineStyles = {
  default: { stroke: "#FFFFFF", opacity: 0.85, weight: 5, zIndex: 1 },
  "Ruta 1": { stroke: transportColors["Ruta 1"].base, opacity: 0.85, weight: 5, zIndex: 2 },
  "Ruta 2": { stroke: transportColors["Ruta 2"].base, opacity: 0.85, weight: 5, zIndex: 3 },
  "Ruta 3": { stroke: transportColors["Ruta 3"].base, opacity: 0.85, weight: 5, zIndex: 4 },
  "Ruta 4": { stroke: transportColors["Ruta 4"].base, opacity: 0.85, weight: 5, zIndex: 5 },
  "Ruta 5": { stroke: transportColors["Ruta 5"].base, opacity: 0.85, weight: 5, zIndex: 2 },
};