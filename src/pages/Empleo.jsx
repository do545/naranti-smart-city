import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, Building2, ChevronRight, X, QrCode, Star, WifiOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTotem } from '@/contexts/TotemContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceCity, getJobsForCity } from '@/services/jobsService';
import FullscreenIdleAd from '@/components/FullscreenIdleAd';
import HeaderAd from '@/components/HeaderAd';
import useIdleReturnHome from '@/hooks/useIdleReturnHome';

const BADGE_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700'
];

const badgeFor = (job, index) => job.badgeColor || BADGE_PALETTE[index % BADGE_PALETTE.length];

/** "2026-06-30T..." -> "Hace 2 días" (tolerante a fechas inválidas). */
const relativeDate = (isoDate) => {
  if (!isoDate) return '';
  const then = new Date(isoDate).getTime();
  if (!Number.isFinite(then)) return '';
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  return 'Hace más de un mes';
};

const JobLogo = ({ company, className = "w-full h-full" }) => {
  const text = company ? company.charAt(0).toUpperCase() : '?';
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-[#F36F21] to-[#D95A15] rounded-xl text-white font-bold ${className}`}>
      <span className="text-2xl">{text}</span>
    </div>
  );
};

const Empleo = () => {
  const navigate = useNavigate();
  useIdleReturnHome(); // vuelve al inicio tras 90s sin interaccion
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('Todo');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isIdle, setIsIdle] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const { globalAds, currentAdIndex, setIsHeaderAdVisible } = useTotem();

  const currentAd = globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null;
  const adsForHeader = currentAd ? [currentAd] : [];

  // --- CARGA DE VACANTES REALES (por ciudad del dispositivo) ---
  useEffect(() => {
    let cancelled = false;

    const loadJobs = async () => {
      setIsLoading(true);
      const deviceCity = await getDeviceCity(currentUser?.email);
      if (cancelled) return;
      setCity(deviceCity || '');

      if (deviceCity) {
        const result = await getJobsForCity(deviceCity);
        if (cancelled) return;
        setJobs(result.jobs);
        setFromCache(result.fromCache);
      } else {
        setJobs([]);
      }
      setIsLoading(false);
    };

    loadJobs();
    // Refrescar cada 30 min mientras el módulo esté abierto.
    const interval = setInterval(loadJobs, 30 * 60 * 1000);
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

  // --- MODAL DE DETALLE ---
  if (selectedJob) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FFFBF5] animate-in slide-in-from-bottom duration-300 flex flex-col font-sans">
        {/* Header Modal */}
        <div className="sticky top-0 bg-[#FFFBF5]/90 backdrop-blur-md px-4 py-4 flex justify-between items-center border-b border-orange-100">
          <button
            onClick={() => setSelectedJob(null)}
            className="p-2 -ml-2 rounded-full hover:bg-orange-100 text-[#F36F21] font-bold flex items-center gap-1"
          >
            <ChevronRight className="rotate-180" size={28} /> Atrás
          </button>
          <button onClick={() => setSelectedJob(null)} className="p-2 rounded-full hover:bg-orange-100 text-[#F36F21]"><X size={28} /></button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto pb-10 px-6 pt-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-6 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl mx-auto mb-4 flex items-center justify-center p-2 border border-gray-100">
              <JobLogo company={selectedJob.company} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{selectedJob.title}</h2>
            <p className="text-gray-500 font-medium">{selectedJob.company}</p>

            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {selectedJob.isLocal && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F36F21] text-white flex items-center gap-1">
                  <Star size={12} /> Empleo Local Destacado
                </span>
              )}
              {selectedJob.type && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${badgeFor(selectedJob, 0)}`}>
                  {selectedJob.type}
                </span>
              )}
              {selectedJob.salary && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 flex items-center gap-1">
                  <DollarSign size={12} /> {selectedJob.salary}
                </span>
              )}
            </div>
          </div>

          <h3 className="text-lg font-bold text-[#F36F21] mb-3">Sobre la vacante</h3>
          <div className="prose prose-sm text-gray-600 leading-relaxed mb-8">
            <p>{selectedJob.description || 'Consulta los detalles completos escaneando el código QR.'}</p>
          </div>

          {/* QR PARA POSTULARSE DESDE EL CELULAR */}
          {selectedJob.link && (
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-orange-100 mb-8 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-[#F36F21] font-bold mb-4">
                <QrCode size={22} />
                <span>Postúlate desde tu celular</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-100">
                <QRCodeSVG value={selectedJob.link} size={180} fgColor="#1a1a1a" />
              </div>
              <p className="text-xs text-gray-400 mt-4 max-w-xs">
                Escanea el código con la cámara de tu celular para ver la vacante completa y enviar tu solicitud.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {selectedJob.location && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                <MapPin className="text-gray-400" size={20} />
                <span className="text-sm font-medium text-gray-700">{selectedJob.location}</span>
              </div>
            )}
            {selectedJob.updated && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                <Clock className="text-gray-400" size={20} />
                <span className="text-sm font-medium text-gray-700">Publicado: {relativeDate(selectedJob.updated)}</span>
              </div>
            )}
            {selectedJob.source && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                <Briefcase className="text-gray-400" size={20} />
                <span className="text-sm font-medium text-gray-700">Fuente: {selectedJob.source}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL ---
  const categories = ['Todo', 'Tiempo Completo', 'Medio Tiempo', 'Remoto'];
  const normalizedFilter = filter.toLowerCase();
  const filteredData = filter === 'Todo'
    ? jobs
    : jobs.filter((job) => String(job.type || '').toLowerCase().includes(normalizedFilter.split(' ')[0]));

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
          <Briefcase size={24} /> Bolsa de Trabajo
        </h1>
      </div>

      <div className="px-4 pb-10 flex-1 overflow-y-auto">

        {/* HERO */}
        <div className="relative w-full h-40 rounded-[2rem] overflow-hidden mb-6 shadow-lg shadow-orange-100">
          <img
            src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80"
            alt="Empleo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F36F21]/90 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-white text-xl font-bold leading-tight">
              {city ? `Trabaja en ${city}` : 'Bolsa de Trabajo'}
            </h2>
            <p className="text-white/90 text-sm mt-1 font-medium">Vacantes reales cerca de ti.</p>
          </div>
        </div>

        {/* AVISO DE MODO OFFLINE */}
        {fromCache && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-2xl px-4 py-3 mb-4">
            <WifiOff size={16} />
            Mostrando las últimas vacantes guardadas (sin conexión).
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${filter === cat
                ? 'bg-[#F36F21] text-white shadow-orange-200'
                : 'bg-white text-gray-500 border border-gray-100'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* LISTA DE EMPLEOS */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Briefcase size={48} className="mb-4 animate-pulse text-[#F36F21]" />
            <p className="font-medium">Buscando vacantes cerca de ti...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center px-8">
            <Briefcase size={48} className="mb-4 text-gray-300" />
            <p className="font-bold text-gray-500 mb-1">No hay vacantes disponibles por ahora</p>
            <p className="text-sm">Vuelve pronto — la bolsa de trabajo se actualiza varias veces al día.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((job, index) => (
              <div
                key={job.id || index}
                onClick={() => setSelectedJob(job)}
                className={`bg-white p-4 rounded-3xl shadow-sm flex gap-4 active:scale-95 transition-transform duration-200 cursor-pointer ${job.isLocal ? 'border-2 border-[#F36F21]/40' : 'border border-gray-50'}`}
              >
                <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center p-2 shrink-0 border border-gray-100">
                  <JobLogo company={job.company} />
                </div>

                <div className="flex flex-col justify-center flex-1 min-w-0">
                  {job.isLocal && (
                    <span className="text-[9px] font-bold text-[#F36F21] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                      <Star size={10} /> Empleo Local
                    </span>
                  )}
                  <h3 className="text-gray-900 font-bold text-base leading-tight mb-1">{job.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <Building2 size={10} />
                    <span className="truncate">{job.company}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {job.type && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${badgeFor(job, index)}`}>
                        {job.type}
                      </span>
                    )}
                    {job.salary && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-green-50 text-green-700">
                        {job.salary}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">{relativeDate(job.updated)}</span>
                  </div>
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

export default Empleo;
