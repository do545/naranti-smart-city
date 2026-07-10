import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Sun, Moon, Menu, Bell, Search, User as UserIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '../ui/use-toast';

const AdminHeader = ({ toggleSidebar }) => {
  const { logout, currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleNotImplemented = () => {
    toast({
      title: '🚧 ¡En construcción!',
      description: 'Esta función aún no está disponible, ¡pero estará lista pronto! 🚀',
    });
  };

  return (
    <motion.header 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/70 backdrop-blur-lg border-b border-gray-700/50 h-20 px-4 lg:px-8 flex justify-between items-center sticky top-0 z-30"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden text-gray-300 hover:bg-gray-700 hover:text-white">
          <Menu />
        </Button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5"/>
          <input 
            type="text" 
            placeholder="Buscar campaña, kiosko..."
            className="bg-gray-800/60 border border-gray-700 rounded-full w-64 h-10 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-naranti-orange/50"
            onClick={handleNotImplemented}
          />
        </div>
      </div>
      
      <div className="text-center hidden xl:block">
        <h2 className="text-lg font-semibold text-white">Hola Francisco 👋 <span className="font-normal text-gray-400">Bienvenido al Centro de Control</span></h2>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={toggleTheme} variant="ghost" size="icon" className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-full">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <Button onClick={handleNotImplemented} variant="ghost" size="icon" className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-full">
          <Bell className="w-5 h-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-naranti-orange to-orange-400 flex items-center justify-center text-white font-bold">
                 <UserIcon size={20} />
               </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-white" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Francisco</p>
                <p className="text-xs leading-none text-gray-400">
                  {currentUser?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700"/>
            <DropdownMenuItem onClick={handleNotImplemented} className="cursor-pointer hover:!bg-gray-700">Perfil</DropdownMenuItem>
            <DropdownMenuItem onClick={handleNotImplemented} className="cursor-pointer hover:!bg-gray-700">Facturación</DropdownMenuItem>
            <DropdownMenuItem onClick={handleNotImplemented} className="cursor-pointer hover:!bg-gray-700">Ajustes</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700"/>
            <DropdownMenuItem onClick={logout} className="cursor-pointer hover:!bg-red-500/20 !text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};

export default AdminHeader;