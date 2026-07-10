import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Zap, Smartphone, CheckCircle, Sparkles } from 'lucide-react';

// 1. IMPORTACIONES ESTÁNDAR
import { useTotem } from '@/contexts/TotemContext';
import FullscreenIdleAd from '@/components/FullscreenIdleAd';
import HeaderAd from '@/components/HeaderAd';
import useIdleReturnHome from '@/hooks/useIdleReturnHome';

const Spotlight = () => {
  const navigate = useNavigate();
  useIdleReturnHome(); // vuelve al inicio tras 90s sin interaccion

  // ESTADO NUEVO: Para saber si estamos mostrando una foto de usuario
  const [showUserContent, setShowUserContent] = useState(false);

  // 2. CONEXIÓN AL CEREBRO (Obtenemos los datos globales)
  const {
    showFullscreenAd,
    globalAds,
    currentAdIndex 
  } = useTotem();

  // El anuncio a mostrar en el banner es el primero de la lista
  const bannerAd = globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null;
  const adsForHeader = bannerAd ? [bannerAd] : [];

  // --- 🚨 PROTECTOR DE PANTALLA ESTANDARIZADO ---
  if (showFullscreenAd && globalAds.length > 0 && !showUserContent) {
    return (
      <FullscreenIdleAd
        ads={globalAds}
        currentAdIndex={currentAdIndex}
      />
    );
  }

  // --- 🌟 MODO LIVE: CUANDO LLEGA UNA FOTO ---
  if (showUserContent) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in zoom-in duration-500">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F36F21] via-purple-600 to-blue-900 animate-pulse"></div>
        <div className="relative z-10 w-full h-full p-8 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md aspect-[9/16] md:aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white rotate-1">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop"
              alt="Usuario en vivo"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 text-center">
              <h2 className="text-white font-bold text-2xl flex items-center justify-center gap-2">
                <Sparkles className="text-yellow-400" /> ¡En Vivo!
              </h2>
              <p className="text-white/80 text-sm">Gracias por compartir tu momento</p>
            </div>
          </div>
          <button
            onClick={() => setShowUserContent(false)}
            className="mt-8 bg-white/20 text-white px-6 py-2 rounded-full backdrop-blur hover:bg-white/30"
          >
            Cerrar ahora
          </button>
        </div>
      </div>
    );
  }

  // --- URL DEL DESTINO y Lógica de Demo ---
  const targetUrl = "https://orbitasmartcities.com.mx";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}&color=F36F21&bgcolor=FFFFFF&margin=10`;

  const triggerDemo = () => {
    setShowUserContent(true);
    setTimeout(() => setShowUserContent(false), 10000);
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] font-sans flex flex-col">
      {/* 1. PUBLICIDAD BANNER ESTANDARIZADA */}
      <div className="px-4 pt-4 shrink-0">
        <HeaderAd ads={adsForHeader} />
      </div>

      {/* 2. HEADER */}
      <div className="sticky top-0 bg-[#FFFBF5]/95 backdrop-blur-md z-40 px-4 py-4 flex items-center">
        <button
          onClick={() => navigate('/smartcity/display')}
          className="p-2 -ml-2 rounded-full hover:bg-orange-100 text-gray-800 active:scale-95 transition-transform"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="ml-2 text-2xl font-bold text-[#F36F21]">Tu Momento</h1>
      </div>

      {/* 3. CONTENIDO PRINCIPAL */}
      <div className="px-4 pb-10 flex-1 overflow-y-auto flex flex-col items-center">
        {/* TARJETA DEL QR (HERO) */}
        <div className="bg-white w-full rounded-[2.5rem] p-8 shadow-xl shadow-orange-100/50 border border-orange-50 text-center mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#F36F21] to-yellow-400"></div>
          <div className="mb-6 relative z-10">
            <h2 className="text-3xl font-black text-gray-900 leading-tight mb-2">
              ¡Brilla en Morelia! ✨
            </h2>
            <p className="text-gray-500 font-medium text-sm px-2">
              Escanea para subir tu publicidad, arte, foto o selfie a esta pantalla.
            </p>
          </div>

          {/* EL CÓDIGO QR */}
          <div className="relative inline-block group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#F36F21] to-pink-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white p-2 rounded-[1.8rem] shadow-inner">
              <img
                src={qrImageUrl}
                alt="Escanea el QR"
                className="w-48 h-48 object-contain rounded-2xl"
              />
            </div>
            {/* BOTÓN SECRETO DE DEMO */}
            <div
              onClick={triggerDemo}
              className="absolute -bottom-3 -right-3 bg-[#F36F21] text-white p-3 rounded-full shadow-lg border-4 border-white animate-bounce cursor-pointer active:scale-90 hover:bg-purple-600 transition-colors"
            >
              <Camera size={20} />
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-bold border border-green-100">
            <Zap size={14} className="fill-current" /> Activación Inmediata
          </div>
        </div>

        {/* PASOS */}
        <div className="w-full space-y-3">
          <h3 className="text-sm font-bold text-gray-400 ml-4 uppercase tracking-widest">Pasos sencillos</h3>
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-50">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#F36F21] shrink-0">
              <Smartphone size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">1. Escanea el QR</h4>
              <p className="text-xs text-gray-500 leading-snug">Abre la cámara de tu celular y apunta al código.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-50">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
              <Camera size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">2. Sube tu Publicidad</h4>
              <p className="text-xs text-gray-500 leading-snug">Elige tu mejor selfie, un mensaje o arte.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-50">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">3. ¡Aparece en vivo!</h4>
              <p className="text-xs text-gray-500 leading-snug">Tu contenido saldrá en pantalla gigante por 15s.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spotlight;