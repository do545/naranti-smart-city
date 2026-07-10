import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Clock, ChevronRight, Newspaper, QrCode, WifiOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTotem } from '@/contexts/TotemContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceCity } from '@/services/jobsService';
import { getNewsForCity } from '@/services/newsService';
import FullscreenIdleAd from '@/components/FullscreenIdleAd';
import HeaderAd from '@/components/HeaderAd';
import useIdleReturnHome from '@/hooks/useIdleReturnHome';

const BADGE_PALETTE = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-50 text-purple-800',
  'bg-green-100 text-green-700',
  'bg-red-100 text-red-700',
  'bg-teal-100 text-teal-700'
];

/** Color estable por categoría (misma categoría = mismo color). */
const badgeFor = (category) => {
  const text = String(category || 'Local');
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return BADGE_PALETTE[hash % BADGE_PALETTE.length];
};

const relativeTime = (isoDate) => {
  if (!isoDate) return '';
  const then = new Date(isoDate).getTime();
  if (!Number.isFinite(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 60) return mins <= 1 ? 'Ahora' : `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Ayer' : `Hace ${days} días`;
};

const NewsImage = ({ src, alt, className }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-[#F36F21] to-[#D95A15]`}>
        <Newspaper className="text-white/70" size={32} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
};

const Noticias = () => {
  const navigate = useNavigate();
  useIdleReturnHome(); // vuelve al inicio tras 90s sin interaccion
  const { currentUser } = useAuth();
  const [selectedNews, setSelectedNews] = useState(null);
  const [filter, setFilter] = useState('Todo');
  const [isIdle, setIsIdle] = useState(false);
  const [news, setNews] = useState([]);
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const { globalAds, currentAdIndex, setIsHeaderAdVisible } = useTotem();

  const currentAd = globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null;
  const adsForHeader = currentAd ? [currentAd] : [];

  // --- CARGA DE NOTICIAS REALES (por ciudad del dispositivo) ---
  useEffect(() => {
    let cancelled = false;

    const loadNews = async () => {
      setIsLoading(true);
      const deviceCity = await getDeviceCity(currentUser?.email);
      if (cancelled) return;
      setCity(deviceCity || '');

      if (deviceCity) {
        const result = await getNewsForCity(deviceCity);
        if (cancelled) return;
        setNews(result.items);
        setFromCache(result.fromCache);
      } else {
        setNews([]);
      }
      setIsLoading(false);
    };

    loadNews();
    // Refrescar cada 15 min mientras el módulo esté abierto.
    const interval = setInterval(loadNews, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser]);

  // --- SCROLL EFFECT ---
  useEffect(() => {
    const handleScroll = () => {
      if (typeof setIsHeaderAdVisible === 'function') {
        setIsHeaderAdVisible(window.scrollY < 20);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setIsHeaderAdVisible]);

  // --- PROTECTOR DE PANTALLA (20 SEGUNDOS) ---
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsIdle(true), 20000);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, []);

  const handleWake = () => setIsIdle(false);

  // --- MODAL DE LECTURA ---
  if (selectedNews) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FFFBF5] animate-in slide-in-from-bottom duration-300 flex flex-col font-sans">
        <div className="sticky top-0 bg-[#FFFBF5]/90 backdrop-blur-md px-4 py-4 flex justify-between items-center border-b border-orange-100">
          <button
            onClick={() => setSelectedNews(null)}
            className="p-2 -ml-2 rounded-full hover:bg-orange-100 text-[#F36F21] font-bold flex items-center gap-1"
          >
            <ChevronRight className="rotate-180" size={28} /> Atrás
          </button>
          <button onClick={() => setSelectedNews(null)} className="p-2 rounded-full hover:bg-orange-100 text-[#F36F21]"><X size={28} /></button>
        </div>
        <div className="flex-1 overflow-y-auto pb-10">
          <NewsImage src={selectedNews.image} alt="News" className="w-full h-72 object-cover rounded-b-[2rem] shadow-sm mb-4" />
          <div className="px-6 py-2 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${badgeFor(selectedNews.category)}`}>
                {selectedNews.category}
              </span>
              <span className="text-gray-400 text-xs flex items-center gap-1 font-medium">
                <Clock size={12} /> {relativeTime(selectedNews.time)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">{selectedNews.title}</h1>
            <p className="text-xs text-gray-400 font-bold mb-6 uppercase tracking-widest">Fuente: {selectedNews.source}</p>
            <div className="prose prose-orange">
              <p className="text-gray-700 text-lg leading-relaxed">{selectedNews.content}</p>
            </div>

            {/* QR PARA LEER LA NOTA COMPLETA */}
            {selectedNews.link && (
              <div className="mt-8 bg-white p-6 rounded-[2rem] shadow-sm border border-orange-100 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 text-[#F36F21] font-bold mb-4">
                  <QrCode size={22} />
                  <span>Lee la nota completa en tu celular</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-100">
                  <QRCodeSVG value={selectedNews.link} size={160} fgColor="#1a1a1a" />
                </div>
                <p className="text-xs text-gray-400 mt-4 max-w-xs">
                  Escanea el código para abrir el artículo original de {selectedNews.source}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL ---
  // Categorías dinámicas: las más frecuentes en las noticias del día.
  const categoryCounts = news.reduce((acc, n) => {
    const cat = n.category || 'Local';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categories = ['Todo', ...Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat)];

  const filteredData = filter === 'Todo' ? news : news.filter(n => n.category === filter);

  return (
    <div
      className="min-h-screen bg-[#FFFBF5] font-sans flex flex-col relative"
      onClick={handleWake}
      onTouchStart={handleWake}
    >

      {/* PUBLICIDAD BANNER ESTANDARIZADA */}
      <div className="px-4 pt-4 shrink-0">
        <HeaderAd ads={adsForHeader} />
      </div>

      {/* HEADER */}
      <div className="sticky top-0 bg-[#FFFBF5]/95 backdrop-blur-md z-40 px-4 py-4 flex items-center">
        <button
          onClick={() => navigate('/smartcity/display')}
          className="p-2 -ml-2 rounded-full hover:bg-orange-100 text-gray-800 active:scale-95 transition-transform"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="ml-2 text-2xl font-bold text-[#F36F21] flex items-center gap-2">
          <Newspaper size={24} /> {city ? `Noticias ${city}` : 'Noticias'}
        </h1>
      </div>

      <div className="px-4 pb-10 flex-1 overflow-y-auto">

        {/* AVISO DE MODO OFFLINE */}
        {fromCache && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-2xl px-4 py-3 mb-4">
            <WifiOff size={16} />
            Mostrando las últimas noticias guardadas (sin conexión).
          </div>
        )}

        {/* Filtros */}
        {news.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${filter === cat
                  ? 'bg-[#F36F21] text-white shadow-orange-200'
                  : 'bg-white text-gray-500 border border-gray-100'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* LISTA DE NOTICIAS */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Newspaper size={48} className="mb-4 animate-pulse text-[#F36F21]" />
            <p className="font-medium">Cargando noticias del día...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center px-8">
            <Newspaper size={48} className="mb-4 text-gray-300" />
            <p className="font-bold text-gray-500 mb-1">No hay noticias disponibles por ahora</p>
            <p className="text-sm">Las noticias se actualizan automáticamente varias veces al día.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex gap-4 active:scale-95 transition-transform duration-200 cursor-pointer h-36"
              >
                <NewsImage src={item.image} alt={item.title} className="w-28 h-full rounded-2xl object-cover shrink-0" />
                <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${badgeFor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">{relativeTime(item.time)}</span>
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg leading-tight line-clamp-2">{item.title}</h3>
                  </div>
                  <p className="text-[10px] font-bold text-gray-300 uppercase mt-auto tracking-wider">{item.source}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SCREENSAVER REAL */}
      {isIdle && globalAds && globalAds.length > 0 && (
        <FullscreenIdleAd ads={globalAds} />
      )}
    </div>
  );
};

export default Noticias;
