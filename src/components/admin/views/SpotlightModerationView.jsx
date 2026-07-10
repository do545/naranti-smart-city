import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Camera, User, MapPin, Calendar, Clock, Quote, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const SpotlightModerationView = () => {
  const { toast } = useToast();
  const [pendingPhotos, setPendingPhotos] = useState([
    {
      id: 1,
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80',
      user: 'Sofia Martinez',
      date: '26 Oct 2023',
      time: '14:30',
      location: 'Plaza de Armas',
      message: '¡Qué hermoso día en el centro! 🌞 #Naranti'
    },
    {
      id: 2,
      imageUrl: 'https://images.unsplash.com/photo-1518182170546-0766aa2f6d15?auto=format&fit=crop&w=1000&q=80',
      user: 'Carlos Ruiz',
      date: '26 Oct 2023',
      time: '15:15',
      location: 'Catedral',
      message: 'Visitando la historia de nuestra ciudad.'
    },
    {
      id: 3,
      imageUrl: 'https://images.unsplash.com/photo-1569388330292-7a6a8412a2c3?auto=format&fit=crop&w=1000&q=80',
      user: 'Ana Perez',
      date: '26 Oct 2023',
      time: '16:00',
      location: 'Acueducto',
      message: 'Increíble arquitectura. 📸'
    },
    {
      id: 4,
      imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1000&q=80',
      user: 'Miguel Angel',
      date: '26 Oct 2023',
      time: '16:45',
      location: 'Parque Central',
      message: 'Disfrutando del atardecer con amigos.'
    }
  ]);

  const handleApprove = (id) => {
    setPendingPhotos(prev => prev.filter(photo => photo.id !== id));
    toast({
      title: "Foto Aprobada",
      description: "La publicación ahora es visible en el Spotlight público.",
      className: "bg-green-600 border-green-700 text-white",
    });
  };

  const handleReject = (id) => {
    setPendingPhotos(prev => prev.filter(photo => photo.id !== id));
    toast({
      title: "Foto Rechazada",
      description: "La publicación ha sido eliminada.",
      variant: "destructive",
    });
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Camera className="w-8 h-8 text-naranti-orange" />
            Moderación de Spotlight
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Revisa el contenido generado por usuarios antes de que sea público.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-gray-800/50 border border-gray-700 px-4 py-2 rounded-full">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-sm font-medium text-green-400">Sistema en Vivo</span>
            </div>
            <div className="bg-naranti-orange px-4 py-2 rounded-full shadow-lg shadow-naranti-orange/20 flex items-center gap-2">
                <span className="text-white font-bold text-xl">{pendingPhotos.length}</span>
                <span className="text-white/90 text-sm font-medium uppercase tracking-wider">Pendientes</span>
            </div>
        </div>
      </div>

      {/* Content Grid */}
      <AnimatePresence mode="popLayout">
        {pendingPhotos.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9 }}
             className="flex flex-col items-center justify-center py-24 text-center"
           >
             <div className="bg-green-500/10 p-8 rounded-full mb-6 border border-green-500/20 animate-in fade-in zoom-in duration-500">
               <CheckCircle2 className="w-20 h-20 text-green-500" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">¡Todo al día!</h3>
             <p className="text-gray-400 max-w-md text-lg">
               No hay fotos pendientes de revisión. Buen trabajo manteniendo la comunidad segura.
             </p>
           </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pendingPhotos.map((photo) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-xl flex flex-col group hover:border-gray-600 transition-colors duration-300"
              >
                {/* Image Area */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-900">
                  <img 
                    src={photo.imageUrl} 
                    alt={`Foto de ${photo.user}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent opacity-90" />
                  
                  <div className="absolute bottom-0 left-0 w-full p-4">
                     <div className="flex items-center gap-2 text-white font-semibold text-lg mb-2 shadow-sm">
                        <div className="bg-naranti-orange/20 p-1 rounded-full">
                            <User className="w-3 h-3 text-naranti-orange" />
                        </div>
                        {photo.user}
                     </div>
                     <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                        <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded backdrop-blur-md border border-white/5">
                            <Calendar className="w-3 h-3 text-gray-400" /> {photo.date}
                        </span>
                        <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded backdrop-blur-md border border-white/5">
                            <Clock className="w-3 h-3 text-gray-400" /> {photo.time}
                        </span>
                     </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-5 space-y-4 flex-1">
                        <div className="flex items-start gap-3 text-gray-300 bg-gray-700/30 p-3 rounded-xl border border-gray-700/50">
                            <Quote className="w-4 h-4 text-naranti-orange shrink-0 mt-1 fill-naranti-orange/20" />
                            <p className="text-sm italic leading-relaxed text-gray-200">"{photo.message}"</p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-400 px-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {photo.location}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-700/50">
                        <Button 
                            onClick={() => handleReject(photo.id)}
                            variant="outline" 
                            className="h-11 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 w-full transition-all"
                        >
                            <X className="w-4 h-4 mr-2" /> Rechazar
                        </Button>
                        <Button 
                            onClick={() => handleApprove(photo.id)}
                            className="h-11 bg-green-600 hover:bg-green-500 text-white w-full shadow-lg shadow-green-900/20 border border-transparent hover:border-green-400 transition-all"
                        >
                            <Check className="w-4 h-4 mr-2" /> Aprobar
                        </Button>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpotlightModerationView;