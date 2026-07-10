import React, { useState } from 'react';
import { useTotem } from '@/contexts/TotemContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Monitor, Lock, AlertTriangle, CheckCircle,
  Eye, EyeOff, Utensils, Building2, Landmark, Heart,
  Bus, Drama, Dog, Newspaper, Dumbbell, Briefcase,
  Gamepad2, Camera, Palette, Settings, Image as ImageIcon, Loader2, Tv2
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

// --- Switch Component ---
const Switch = ({ label, checked, onChange, icon: Icon, color = "bg-[#F36F21]" }) => (
  <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 mb-3 hover:bg-white/10 transition-all cursor-pointer group" onClick={onChange}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg transition-colors ${checked ? 'bg-white text-black' : 'bg-black/40 text-gray-500'}`}>
        <Icon size={20} />
      </div>
      <span className="font-medium text-gray-300 text-sm group-hover:text-white transition-colors">{label}</span>
    </div>
    <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out ${checked ? color : 'bg-gray-800'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  </div>
);

// --- Shared Screen Content Component ---
const ScreenContent = ({ config, modules, isLandscape = false }) => {
  // Styles Helper
  const getBackgroundStyle = () => {
    const bg = config?.backgroundColor;
    if (bg && typeof bg === 'string' && bg.includes('gradient')) {
      return { backgroundImage: bg };
    }
    if (bg && typeof bg === 'string') {
      return { backgroundColor: bg };
    }
    return { backgroundColor: "#FFFBF5" };
  };

  if (config?.isEmergency) {
    return (
      <div className="w-full h-full bg-red-600 flex flex-col items-center justify-center text-white p-6 animate-pulse z-50">
        <AlertTriangle size={isLandscape ? 120 : 90} className="mb-6" />
        <h1 className={`${isLandscape ? 'text-7xl' : 'text-5xl'} font-black text-center uppercase`}>EMERGENCIA</h1>
        <p className={`${isLandscape ? 'text-2xl' : 'text-lg'} text-center mt-4 font-bold bg-black/40 px-6 py-3 rounded-xl`}>
          {config.emergencyMessage || "Alerta General"}
        </p>
      </div>
    );
  }

  if (config?.isMaintenance) {
    return (
      <div className="w-full h-full bg-[#121212] flex flex-col items-center justify-center p-6 z-50">
        <Lock size={isLandscape ? 120 : 90} className="mb-6 animate-bounce text-[#F36F21]" />
        <h1 className={`${isLandscape ? 'text-5xl' : 'text-3xl'} font-bold text-center text-white`}>En Mantenimiento</h1>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative overflow-y-auto pt-6 scrollbar-hide transition-all duration-500" style={getBackgroundStyle()}>
      {config?.showBanner && (
        <div className={`${isLandscape ? 'h-64' : 'h-36'} mx-4 mb-4 rounded-2xl bg-white overflow-hidden relative shrink-0 shadow-lg border border-black/5`}>
          <img 
            src={config.bannerUrl || ""} 
            className="w-full h-full object-cover" 
            alt="Ads" 
            onError={(e) => e.target.src = 'https://via.placeholder.com/800x400?text=Banner'} 
          />
        </div>
      )}
      <div className={`p-4 grid ${isLandscape ? 'grid-cols-4 gap-4' : 'grid-cols-2 gap-3'} pb-10`}>
        {modules.map((item, i) => (
          <div key={i} className="aspect-square bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform duration-300">
            <div className="p-3 bg-gray-50 rounded-2xl">{item.icon}</div>
            <span className="text-[11px] font-bold text-gray-700 uppercase text-center leading-tight">{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const KioskModeView = () => {
  const { config, toggleMaintenance, toggleEmergency, updateConfig } = useTotem() || {};
  const [activeTab, setActiveTab] = useState('system');
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-[#09090b] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#F36F21] mb-4" />
        <p className="text-gray-400 text-sm">Cargando configuración del sistema...</p>
      </div>
    );
  }

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await setDoc(doc(db, "settings", "kiosk_config"), config);
      toast({
        title: "✅ Red Sincronizada",
        description: "La configuración se ha desplegado en todos los kioscos y pantallas activas.",
        style: { backgroundColor: '#10B981', color: 'white', border: 'none' }
      });
    } catch (error) {
      console.error("Error publishing config:", error);
      toast({
        variant: "destructive",
        title: "Error de Publicación",
        description: "No se pudo sincronizar con la red."
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const modules = [
    { title: "Restaurantes", icon: <Utensils size={20} className="text-orange-500" /> },
    { title: "Servicios", icon: <Building2 size={20} className="text-blue-500" /> },
    { title: "Turismo", icon: <Landmark size={20} className="text-cyan-500" /> },
    { title: "Salud", icon: <Heart size={20} className="text-green-500" /> },
    { title: "Transporte", icon: <Bus size={20} className="text-indigo-500" /> },
    { title: "Cultura", icon: <Drama size={20} className="text-purple-500" /> },
    { title: "Mascotas", icon: <Dog size={20} className="text-pink-400" /> },
    { title: "Noticias", icon: <Newspaper size={20} className="text-red-500" /> },
    { title: "Fitness", icon: <Dumbbell size={20} className="text-yellow-500" /> },
    { title: "Empleo", icon: <Briefcase size={20} className="text-teal-500" /> },
    { title: "Arcade", icon: <Gamepad2 size={20} className="text-purple-600" /> },
    { title: "Spotlight", icon: <Camera size={20} className="text-pink-600" /> },
  ];

  const safeColor = (config?.backgroundColor && typeof config.backgroundColor === 'string' && config.backgroundColor.startsWith('#'))
    ? config.backgroundColor
    : '#ffffff';

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] bg-[#09090b] overflow-hidden">

      {/* IZQUIERDA: PREVIEW SCROLLABLE AREA */}
      <div className="flex-1 relative flex flex-col items-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {/* SECTION 1: KIOSK (PORTRAIT) */}
        <div className="w-full flex flex-col items-center justify-center py-12 min-h-min shrink-0">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <Monitor className="text-[#F36F21]" size={20} /> Hardware Live - Kiosko
            </h2>
            <p className="text-gray-500 text-xs">Vista gemela del kiosco físico.</p>
          </div>

          <div className="relative w-[380px] h-[760px] bg-gray-900 rounded-[40px] p-6 shadow-2xl border border-white/10 flex flex-col items-center justify-start transform scale-90 lg:scale-100 transition-all duration-500 shrink-0">
            <div className="absolute inset-0 rounded-[40px] border-2 border-white/5 pointer-events-none"></div>
            <div className="w-full flex-1 bg-black rounded-[24px] overflow-hidden relative shadow-inner border-4 border-black">
              <ScreenContent config={config} modules={modules} isLandscape={false} />
            </div>
          </div>
        </div>

        {/* SECTION 2: DISPLAY (LANDSCAPE) */}
        <div className="w-full flex flex-col items-center justify-center py-12 min-h-min shrink-0 border-t border-white/5 bg-black/20">
           <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <Tv2 className="text-blue-500" size={20} /> Hardware Live - Vista gemela de pantallas físicas
            </h2>
            <p className="text-gray-500 text-xs">Resolución: 1920x1080px (16:9)</p>
          </div>

          <div className="relative w-[90%] max-w-[800px] aspect-video bg-gray-900 rounded-xl p-3 shadow-2xl border border-white/10 flex flex-col items-center justify-start transform transition-all duration-500 shrink-0">
            {/* Bezel */}
            <div className="absolute inset-0 rounded-xl border border-white/5 pointer-events-none z-20"></div>
            {/* Screen Area */}
            <div className="w-full h-full bg-black overflow-hidden relative shadow-inner rounded-md">
              <ScreenContent config={config} modules={modules} isLandscape={true} />
            </div>
            {/* Brand Logo Hint */}
            <div className="absolute bottom-1 w-full flex justify-center opacity-30">
              <div className="w-8 h-1 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>

      </div>

      {/* DERECHA: CONTROLES */}
      <div className="w-full lg:w-96 bg-[#0f0f10] border-l border-gray-800 flex flex-col shrink-0 h-full z-20 shadow-xl">
        <div className="p-4 border-b border-white/5">
          <div className="bg-gray-900 rounded-xl flex p-1">
            <button onClick={() => setActiveTab('system')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'system' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>
              <Settings size={16} /> Sistema
            </button>
            <button onClick={() => setActiveTab('visual')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'visual' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>
              <Palette size={16} /> Visual
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <Switch label="Modo Mantenimiento" checked={config?.isMaintenance || false} onChange={toggleMaintenance} icon={Lock} color="bg-orange-500" />
              <Switch label="Alerta de Emergencia" checked={config?.isEmergency || false} onChange={toggleEmergency} icon={AlertTriangle} color="bg-red-600" />
              <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                <label className="text-red-400 text-xs font-bold uppercase block mb-2">Mensaje de Alerta</label>
                <input type="text" value={config?.emergencyMessage || ""} onChange={(e) => updateConfig('emergencyMessage', e.target.value)} className="w-full bg-black/50 border border-red-500/30 rounded-lg p-2 text-white text-sm focus:border-red-500 outline-none" />
              </div>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-4">
                <h4 className="text-xs uppercase text-gray-500 font-bold flex gap-2 items-center pl-1"><ImageIcon size={14} className="text-[#F36F21]" /> Banner Principal</h4>
                <Switch label="Mostrar Banner" checked={config?.showBanner || false} onChange={() => updateConfig('showBanner', !config.showBanner)} icon={config?.showBanner ? Eye : EyeOff} />
                <input type="text" value={config?.bannerUrl || ""} onChange={(e) => updateConfig('bannerUrl', e.target.value)} className="w-full bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-gray-300 text-xs focus:border-[#F36F21] outline-none font-mono" placeholder="URL Imagen" />
              </div>
              <div className="space-y-4">
                <h4 className="text-xs uppercase text-gray-500 font-bold flex gap-2 items-center pl-1"><Palette size={14} className="text-blue-500" /> Fondo</h4>
                <div className="grid grid-cols-4 gap-2">
                  {["#FFFBF5", "linear-gradient(to bottom, #FFFBF5, #FFE4D6)", "linear-gradient(to bottom, #e0f2fe, #f0f9ff)", "linear-gradient(135deg, #1a1a1a, #2d2d2d)"].map((grad, i) => (
                    <button key={i} onClick={() => updateConfig('backgroundColor', grad)} className={`w-full aspect-square rounded-lg border-2 ${config?.backgroundColor === grad ? 'border-white' : 'border-transparent'}`} style={{ background: grad }} />
                  ))}
                </div>
                <div className="flex items-center justify-between bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <span className="text-sm text-gray-400">Color Personalizado</span>
                  <input type="color" value={safeColor} onChange={(e) => updateConfig('backgroundColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-800 bg-[#0f0f10] z-30">
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full bg-gradient-to-r from-[#F36F21] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPublishing ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
            {isPublishing ? "Sincronizando..." : "Publicar en la Red"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KioskModeView;