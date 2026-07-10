import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Music, Palette, Film, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const CulturalAgenda = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const events = [
    {
      id: 1,
      title: 'Festival Internacional de Música de Morelia',
      category: 'music',
      date: '15-22 Noviembre 2024',
      time: '19:00',
      location: 'Teatro Ocampo',
      description: 'El festival más importante de música clásica en México con artistas internacionales.',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      price: 'Desde $350',
      featured: true
    },
    {
      id: 2,
      title: 'Exposición: Arte Contemporáneo Michoacano',
      category: 'art',
      date: '1-30 Diciembre 2024',
      time: '10:00 - 18:00',
      location: 'Museo de Arte Contemporáneo',
      description: 'Muestra colectiva de artistas emergentes de Michoacán.',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
      price: 'Entrada libre'
    },
    {
      id: 3,
      title: 'Ciclo de Cine Mexicano',
      category: 'cinema',
      date: '5-12 Diciembre 2024',
      time: '20:00',
      location: 'Cinépolis Centro Histórico',
      description: 'Retrospectiva del cine mexicano contemporáneo.',
      image: 'https://images.unsplash.com/photo-1489599904472-af35ff2c7c3f?w=400',
      price: '$80'
    },
    {
      id: 4,
      title: 'Concierto de la Orquesta Sinfónica de Michoacán',
      category: 'music',
      date: '18 Noviembre 2024',
      time: '20:30',
      location: 'Centro de Convenciones',
      description: 'Programa especial con obras de compositores mexicanos.',
      image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400',
      price: 'Desde $200'
    },
    {
      id: 5,
      title: 'Taller de Cerámica Tradicional',
      category: 'workshop',
      date: '25 Noviembre 2024',
      time: '16:00',
      location: 'Casa de las Artesanías',
      description: 'Aprende técnicas ancestrales de cerámica michoacana.',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      price: '$150'
    },
    {
      id: 6,
      title: 'Festival Gastronómico Michoacano',
      category: 'gastronomy',
      date: '2-10 Diciembre 2024',
      time: '12:00 - 22:00',
      location: 'Plaza de Armas',
      description: 'Degusta lo mejor de la gastronomía tradicional michoacana.',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
      price: 'Consumo por platillo'
    }
  ];

  const categories = [
    { id: 'all', name: 'Todos', icon: Calendar },
    { id: 'music', name: 'Música', icon: Music },
    { id: 'art', name: 'Arte', icon: Palette },
    { id: 'cinema', name: 'Cine', icon: Film },
    { id: 'workshop', name: 'Talleres', icon: Users }
  ];

  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(event => event.category === selectedCategory);

  const handleEventClick = (event) => {
    toast({
      title: `🎭 ${event.title}`,
      description: `${event.date} - ${event.location}`
    });
  };

  const handleBooking = (event) => {
    toast({
      title: "🎫 Reserva de Boletos",
      description: "🚧 Esta función aún no está implementada—¡pero puedes solicitarla en tu próximo mensaje! 🚀"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-bold gradient-text text-center mb-8"
      >
        Agenda Cultural de Morelia
      </motion.h2>

      {/* Category Filter */}
      <div className="flex justify-center mb-8 space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                flex items-center space-x-2 whitespace-nowrap
                ${selectedCategory === category.id 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'glass-effect text-white border-white/20 hover:bg-white/10'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{category.name}</span>
            </Button>
          );
        })}
      </div>

      {/* Events Grid */}
      <motion.div
        layout
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className={`
              glass-effect rounded-2xl overflow-hidden hover-lift cursor-pointer
              ${event.featured ? 'ring-2 ring-yellow-400/50' : ''}
            `}
            onClick={() => handleEventClick(event)}
          >
            {/* Event Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {event.featured && (
                <div className="absolute top-4 right-4 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                  Destacado
                </div>
              )}
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm opacity-90">{event.category}</p>
              </div>
            </div>

            {/* Event Info */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                {event.title}
              </h3>
              
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                {event.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-cyan-300">
                  <Calendar className="h-4 w-4 mr-2" />
                  {event.date}
                </div>
                <div className="flex items-center text-sm text-cyan-300">
                  <Clock className="h-4 w-4 mr-2" />
                  {event.time}
                </div>
                <div className="flex items-center text-sm text-cyan-300">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">{event.price}</span>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBooking(event);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Reservar
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredEvents.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-gray-400 text-lg">
            No hay eventos disponibles en esta categoría
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CulturalAgenda;