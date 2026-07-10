import React from "react";
import { MapPin, Star } from "lucide-react";

export default function TouristCard({ title, address, rating, image, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white rounded-3xl shadow-sm border border-gray-100 transition-all cursor-pointer active:scale-[0.98]"
    >
      {/* Imagen Cuadrada Redondeada */}
      <img
        src={image}
        alt={title}
        className="w-24 h-24 object-cover rounded-2xl shrink-0 shadow-sm bg-gray-100"
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Título */}
        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate">
          {title}
        </h3>

        {/* Dirección con Icono */}
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2 truncate">
          <MapPin size={12} className="text-gray-400 shrink-0" />
          {address}
        </p>

        {/* Rating Estilo Pill */}
        <div className="flex items-center gap-1 bg-yellow-50 w-fit px-2 py-1 rounded-lg border border-yellow-100">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-yellow-700">
            {rating}
          </span>
        </div>
      </div>
    </div>
  );
}