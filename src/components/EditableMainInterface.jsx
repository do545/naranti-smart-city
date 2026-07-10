import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, ShoppingBag, Wind, HeartPulse, Bus, Sun, Moon, Map } from 'lucide-react';
import { useKioskTheme } from '@/contexts/KioskThemeContext';

const serviceButtons = [
  { id: 'restaurantes', label: 'Restaurantes', icon: Utensils, color: 'from-red-500 to-orange-500' },
  { id: 'servicios', label: 'Servicios', icon: ShoppingBag, color: 'from-blue-500 to-cyan-500' },
  { id: 'turismo', label: 'Turismo', icon: Map, color: 'from-green-500 to-lime-500' },
  { id: 'salud', label: 'Salud', icon: HeartPulse, color: 'from-pink-500 to-rose-500' },
  { id: 'transporte', label: 'Transporte', icon: Bus, color: 'from-yellow-500 to-amber-500' },
  { id: 'cultura', label: 'Cultura', icon: Wind, color: 'from-purple-500 to-violet-500' },
];

const EditableMainInterface = () => {
    const { theme } = useKioskTheme();

    const backgroundStyle = {
        background: `linear-gradient(135deg, ${theme.gradientColor1}, ${theme.gradientColor2})`,
    };

    const buttonStyle = {
        borderRadius: `${theme.buttonBorderRadius}px`,
        padding: `${theme.buttonPadding}px`,
    };

    return (
        <div style={backgroundStyle} className="relative w-full h-full flex flex-col transition-colors duration-500">
            {theme.showAdBanner && (
                 <div className="w-full h-16 bg-black/30 flex-shrink-0 flex items-center justify-center text-white text-lg font-semibold">
                    Banner Publicitario
                </div>
            )}

            <div className="flex-1 grid grid-cols-2 gap-3 p-3 overflow-y-auto">
                {serviceButtons.map((item, index) => (
                    <motion.div
                        key={item.id}
                        style={buttonStyle}
                        className={`relative overflow-hidden cursor-pointer flex flex-col items-center justify-center text-white text-center bg-black/20 backdrop-blur-sm border border-white/10`}
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <div className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br ${item.color} rounded-full opacity-30 blur-lg`} />
                        <item.icon className="w-8 h-8 mb-2" />
                        <span className="font-bold text-base leading-tight">{item.label}</span>
                    </motion.div>
                ))}
            </div>

            <div className="w-full h-14 bg-black/30 flex-shrink-0 flex items-center justify-between px-4 text-white">
                <div className="font-semibold text-2xl">10:30 AM</div>
                <div className="flex items-center gap-2">
                    <Sun className="text-yellow-400" />
                    <span className="font-medium">24°C</span>
                </div>
            </div>
        </div>
    );
};

export default EditableMainInterface;