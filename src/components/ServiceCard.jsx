import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronRight, Droplets } from 'lucide-react';

const ServiceCard = ({ title, description, image, rating, cta = "Abrir servicio", onClick }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <motion.div
      onClick={onClick}
      
      className="flex items-center gap-4 p-4 bg-white rounded-3xl shadow-sm border border-gray-100 transition-all cursor-pointer active:scale-[0.98]"
      whileHover={{ scale: 1.01, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
      whileTap={{ scale: 0.98 }}
    >
      {imageFailed || !image ? (
        <div className="w-24 h-24 rounded-2xl shrink-0 bg-[radial-gradient(circle_at_top_left,#0EA5E9_0%,#22C55E_42%,#F36F21_100%)] text-white flex items-center justify-center shadow-sm">
          <div className="text-center">
            <Droplets size={28} className="mx-auto mb-1" />
            <span className="text-[10px] font-black tracking-widest">OOAPAS</span>
          </div>
        </div>
      ) : (
        <img
          src={image}
          alt={title}
          className="w-24 h-24 object-cover rounded-2xl shrink-0 bg-gray-50 shadow-sm"
          onError={() => setImageFailed(true)}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-[#F36F21] leading-tight mb-1 truncate pr-2">
            {title}
          </h3>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </div>
        
        <p className="text-gray-500 text-sm leading-snug line-clamp-2">
          {description}
        </p>
        
        {rating && (
          <div className="flex items-center gap-1 mt-2 bg-yellow-50 w-fit px-2 py-1 rounded-lg">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-yellow-700">
              {rating}
            </span>
          </div>
        )}
        <span className="mt-3 text-[10px] font-bold text-[#F36F21] bg-orange-50 px-2 py-1 rounded-full w-fit">
          {cta}
        </span>
      </div>
    </motion.div>
  );
};

export default ServiceCard;