import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Cloud, 
  Clock, 
  MapPin, 
  Utensils, 
  Landmark, 
  HeartPulse, 
  Bus, 
  Drama, 
  Siren as AlarmLight, 
  PawPrint, 
  Newspaper, 
  Dumbbell, 
  Briefcase, 
  Building, 
  Gamepad2, 
  SwitchCamera as Camera,
  X
} from 'lucide-react';

import { useTotem } from '@/contexts/TotemContext';
import HeaderAd from '@/components/HeaderAd';
import RestaurantModule from "@/components/RestaurantModule";
import ServicesModule from "@/components/ServicesModule";
import TouristModule from "@/components/TouristModule";
import HealthModule from "@/components/HealthModule";
import TransportationModule from "./TransportationModule";
import CultureModule from "./CultureModule";
import Mascotas from "./Mascotas";

const InfoChip = ({ icon: Icon, text, onClick, isEmergency = false }) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      className={`flex items-center justify-center py-3 px-5 text-lg font-semibold whitespace-nowrap cursor-pointer
        ${isEmergency ? 'emergency-chip' : `glass-chip text-muted-foreground`}`}
    >
      <Icon className="w-6 h-6 mr-3" />
      <span>{text}</span>
    </div>
  );
};

const MainInterface = ({ ads, mockAds }) => {
  const { currentWeather, isIdle, currentAdIndex } = useTotem(); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeModule, setActiveModule] = useState(null);
  const [activeChip, setActiveChip] = useState(null);
  const navigate = useNavigate();

  const activeAd = (ads && ads.length > 0) ? ads[currentAdIndex] : null;
  const adsForHeader = activeAd ? [activeAd] : (mockAds || []); 

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleMenuClick = (moduleName) => {
    if (moduleName === "Restaurantes") {
      setActiveModule("restaurants");
    } else if (moduleName === "Servicios") {
      setActiveModule("services");
    } else if (moduleName === "Turismo") {
      setActiveModule("tourism");
    } else if (moduleName === "Salud") {
      setActiveModule("health");
    } else if (moduleName === "Transporte") {
      setActiveModule("transport");
    } else if (moduleName === "Cultura") {
      setActiveModule("culture");
    } else if (moduleName === "Mascotas") {
      setActiveModule("mascotas");
    } else if (moduleName === "Noticias") {
      navigate('/noticias');
    } else if (moduleName === "Fitness") {
      navigate('/fitness');
    } else if (moduleName === "Empleo") {
      navigate('/empleo');
    } else if (moduleName === "Arcade") {
      navigate('/arcade');
    } else if (moduleName === "Spotlight") {
      navigate('/spotlight');
    }
  };

  const chipDetails = {
    weather: { 
      title: "Clima Actual", 
      value: `${currentWeather?.temperature ?? '--'}°C · ${currentWeather?.condition ?? 'N/A'}`, 
      description: "El clima se actualiza automáticamente según la ubicación de este kiosco interactivo.", 
      icon: Cloud 
    },
    location: { 
      title: "Ubicación", 
      value: "Morelia, Mich.", 
      description: "Te encuentras usando un kiosco interactivo inteligente de la ciudad.", 
      icon: MapPin 
    },
    emergency: { 
      title: "Emergencias", 
      value: "Policía de Morelia", 
      description: "En caso de emergencia, comunícate inmediatamente al 911 o acércate al oficial más cercano a tu ubicación.", 
      icon: AlarmLight 
    }
  };

  const handleChipClick = (chipName) => {
    setActiveChip(chipDetails[chipName] || null);
  };

  const services = [
    { title: 'Restaurantes', icon: Utensils, category: 'gastronomia', color: 'var(--icon-restaurantes)' },
    { title: 'Servicios', icon: Building, category: 'servicios', color: 'var(--icon-servicios)' },
    { title: 'Turismo', icon: Landmark, category: 'turismo', color: 'var(--icon-turismo)' },
    { title: 'Salud', icon: HeartPulse, category: 'salud', color: 'var(--icon-salud)' },
    { title: 'Transporte', icon: Bus, category: 'transporte', color: 'var(--icon-transporte)' },
    { title: 'Cultura', icon: Drama, category: 'cultura', color: 'var(--icon-cultura)' },
    { title: 'Mascotas', icon: PawPrint, category: 'ecologia', color: 'var(--icon-mascotas)' },
    { title: 'Noticias', icon: Newspaper, category: 'noticias', color: 'var(--icon-noticias)' },
    { title: 'Fitness', icon: Dumbbell, category: 'fitness', color: 'var(--icon-fitness)' },
    { title: 'Empleo', icon: Briefcase, category: 'trabajo', color: 'var(--icon-trabajo)' },
    { title: 'Arcade', icon: Gamepad2, category: 'arcade', color: '#9333ea' },
    { title: 'Spotlight', icon: Camera, category: 'spotlight', color: '#ec4899' },
  ];

  if (activeModule === "restaurants") {
    return <RestaurantModule onBack={() => setActiveModule(null)} ad={activeAd} />;
  }

  if (activeModule === "services") {
    return <ServicesModule onBack={() => setActiveModule(null)} ad={activeAd} />;
  }

  if (activeModule === "tourism") {
    return <TouristModule onBack={() => setActiveModule(null)} ad={activeAd} />;
  }

  if (activeModule === "health") {
    return <HealthModule onBack={() => setActiveModule(null)} ad={activeAd} />;
  }

  if (activeModule === "transport") {
    return <TransportationModule onBack={() => setActiveModule(null)} ad={activeAd} />;
  }

  if (activeModule === "culture") {
    return <CultureModule onBack={() => setActiveModule(null)} ad={activeAd} />;
  }

  if (activeModule === "mascotas") { 
    return <Mascotas onBack={() => setActiveModule(null)} ad={activeAd} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 sm:p-8 md:p-12 flex flex-col relative"
    >
      <header className="w-full max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-3 w-full grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoChip
            icon={Clock}
            text={currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          />
          <InfoChip
            icon={Cloud}
            text={`${currentWeather?.temperature ?? '--'}°C · ${currentWeather?.condition ?? 'N/A'}`}
            onClick={() => handleChipClick('weather')}
          />
          <InfoChip
            icon={MapPin}
            text="Morelia, Mich."
            onClick={() => handleChipClick('location')}
          />
          <InfoChip
            icon={AlarmLight}
            text="Emergencias"
            isEmergency
            onClick={() => handleChipClick('emergency')}
          />
        </div>
      </header>
      
      <div className="w-full max-w-7xl mx-auto">
        <HeaderAd ads={adsForHeader} /> 
      </div>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-7xl mx-auto mt-8">
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 kiosk:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05, type: 'spring', stiffness: 100 }}
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(service.title);
              }}
              className="glass-card aspect-square p-4 flex flex-col items-center justify-center cursor-pointer text-center group"
            >
              <div className="w-20 h-20 flex items-center justify-center mb-2">
                <service.icon
                  className="h-14 w-14 md:h-16 md:w-16 transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={1.5}
                  style={{ color: service.color }}
                />
              </div>
              <h3 className="font-bold text-base md:text-lg text-foreground/90">{service.title}</h3>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="w-full text-center py-4 mt-auto flex flex-col items-center">
        <p className="font-extrabold text-lg" style={{ color: 'var(--naranti-orange)' }}>Naranti</p>
        <p className="font-bold text-sm tracking-widest text-muted-foreground">SMART CITY</p>
      </footer>

      {/* Internal Modal for Chip Details */}
      <AnimatePresence>
        {activeChip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveChip(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 flex flex-col items-center text-center relative">
                <button 
                  onClick={() => setActiveChip(null)}
                  className="absolute top-4 right-4 p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  {activeChip.icon && <activeChip.icon className="w-8 h-8" />}
                </div>
                
                <h3 className="text-2xl font-bold mb-1">{activeChip.title}</h3>
                <p className="text-xl font-semibold text-primary mb-4">{activeChip.value}</p>
                <p className="text-muted-foreground mb-6">{activeChip.description}</p>
                
                <button
                  onClick={() => setActiveChip(null)}
                  className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MainInterface;