import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTotem } from '@/contexts/TotemContext';

const AdDisplay = ({ ad, isOpen, onClose }) => {
  const { trackInteraction } = useTotem();

  const handleAdClick = () => {
    if (ad?.actionUrl) {
      trackInteraction('adClicks');
      window.open(ad.actionUrl, '_blank');
    }
  };

  if (!ad) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass-effect rounded-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Ad Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-4 left-4 bg-cyan-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                Publicidad
              </div>
            </div>

            {/* Ad Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">{ad.title}</h3>
              <p className="text-gray-300 mb-6">{ad.description}</p>

              <Button
                onClick={handleAdClick}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {ad.actionText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdDisplay;