import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Monitor, Target, Users, BarChart2, Settings, ChevronLeft, ChevronRight, Tv2, Camera, Briefcase, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '', icon: Home, label: 'Inicio' },
  { to: 'users', icon: Users, label: 'Usuarios' },
  { to: 'kiosks', icon: Monitor, label: 'Kioscos y Pantallas' },
  { to: 'kiosk-mode', icon: Tv2, label: 'Modo Kiosko y Pantalla' }, // Renamed here
  { to: 'campaigns', icon: Target, label: 'Campañas' },
  { to: 'spotlight', icon: Camera, label: 'Spotlight' },
  { to: 'jobs', icon: Briefcase, label: 'Bolsa de Trabajo' },
  { to: 'news', icon: Newspaper, label: 'Noticias' },
  { to: 'metrics', icon: BarChart2, label: 'Métricas' },
  { to: 'settings', icon: Settings, label: 'Configuración' },
];

const AdminSidebar = ({ isCollapsed, toggleCollapse }) => {
  return (
    <aside className={cn(
      "bg-gray-900 text-gray-300 flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex items-center justify-center h-20 border-b border-gray-800 relative">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.img 
              src="https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/bf2a316b2876820b965e2c11cb65cc5c.png" 
              alt="Naranti Logo" 
              className="h-10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
        <button onClick={toggleCollapse} className="absolute -right-4 top-1/2 -translate-y-1/2 bg-naranti-orange text-white rounded-full p-1.5 z-10 hidden lg:block">
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(item => (
          <NavLink
            key={item.label}
            to={`/smartcity/admin/${item.to}`}
            end={item.to === ''}
            className={({ isActive }) => cn(
              "flex items-center p-3 rounded-lg transition-colors duration-200 hover:bg-gray-800 hover:text-white",
              isActive ? "bg-naranti-orange/20 text-naranti-orange font-semibold" : "text-gray-400",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon className="h-6 w-6" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span 
                  className="ml-4"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;