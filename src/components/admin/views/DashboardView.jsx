import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Target, Wifi, Users, BarChart, Activity, Camera, ExternalLink } from 'lucide-react';
import { getWeeklyStats, getDashboardCounts } from '@/services/statsService';
import { getCampaigns } from '@/services/campaignService'; // Vamos a usar getCampaigns (admin) para ver todas
import { getFleetStatus } from '@/services/deviceService';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { LeafletMap } from '@/components/admin/LeafletMap';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  }
};

const StatCard = ({ icon, label, value, color }) => (
  <motion.div variants={itemVariants} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 flex items-center gap-4 hover:bg-gray-800/80 transition-colors duration-300">
    <div className={`p-3 rounded-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  </motion.div>
);

const DashboardView = () => {
  // ESTADO REAL
  const [counts, setCounts] = useState({ users: '-', activeCampaigns: '-' });
  const [fleet, setFleet] = useState({ total: 0, online: 0, offline: 0, latestEvidences: [] });
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("Cargando...");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // 1. Cargar Conteos
        const countsData = await getDashboardCounts();
        setCounts(countsData);

        // 2. Cargar Estado de Flota (VNNOX Data)
        const fleetData = await getFleetStatus();
        setFleet(fleetData);

        // 3. Cargar Gráfica
        const statsData = await getWeeklyStats();
        setWeeklyStats(statsData);

        // 4. Cargar Lista de Campañas Recientes (Aumentamos para mostrar todas con scroll)
        const allCampaigns = await getCampaigns();
        setRecentCampaigns(allCampaigns.slice(0, 50));

        // 5. Última Actualización
        setLastUpdate(`Hace 0m`);
      } catch (error) {
        console.error("Dashboard load failed:", error);
      }
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // 30s refresh for live feel
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-8 space-y-8"
    >
      {/* 🚀 NUEVO: ESTADO DE LA RED NARANTI SMART CITY (ARRIBA) */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} className="text-[#F36F21]" /> Estado de la Red Naranti Smart City
        </h2>
        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Monitor className="w-7 h-7 text-white" />} label="Dispositivos Online" value={fleet.online} color="bg-emerald-500/80" />
          <StatCard icon={<Activity className="w-7 h-7 text-white" />} label="Salud Global" value={fleet.total > 0 ? `${Math.round((fleet.online / fleet.total) * 100)}%` : "100%"} color="bg-[#F36F21]/80" />
          <StatCard icon={<Target className="w-7 h-7 text-white" />} label="Campañas Vigentes" value={counts.activeCampaigns} color="bg-purple-500/80" />
          <StatCard icon={<Wifi className="w-7 h-7 text-white" />} label="Última Actualización" value={lastUpdate} color="bg-yellow-500/80" />
        </motion.div>
      </div>


      {/* 📊 ORIGINAL: RENDIMIENTO Y CAMPAÑAS (ABAJO) */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><BarChart /> Rendimiento Semanal (Interacciones)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F36F21" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#F36F21" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                    borderColor: '#4b5563',
                    color: '#fff',
                    borderRadius: '12px',
                    backdropFilter: 'blur(5px)',
                  }}
                />
                <Area type="monotone" dataKey="Interacciones" stroke="#F36F21" fillOpacity={1} fill="url(#colorUv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Campañas Actuales</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {recentCampaigns.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay campañas recientes.</p>
            ) : (
              recentCampaigns.map(campaign => (
                <div key={campaign.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-900 border border-white/5 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                      {campaign.mediaType === 'video' ? (
                        <div className="w-full h-full bg-[#F36F21]/10 flex items-center justify-center">
                          <Activity size={16} className="text-[#F36F21] animate-pulse" />
                        </div>
                      ) : (
                        <img
                          src={campaign.verticalUrl || campaign.screenUrl || campaign.horizontalUrl || campaign.mediaUrl}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="font-bold text-gray-200 truncate text-xs">
                        {campaign.name || "Campaña"}
                      </p>
                      {campaign.endDate && (
                        <p className="text-[10px] text-gray-500 font-mono">
                          Expira: {new Date(campaign.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${campaign.status === 'active' ? 'bg-green-500/20 text-green-300' :
                    campaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                    {campaign.status === 'active' ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* 🗺️ MAPA DE FLOTA */}
      <motion.div variants={itemVariants} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Wifi className="text-blue-400" size={20} /> Geoposicionamiento de flota</h2>
        <div className="h-96 rounded-lg overflow-hidden relative z-0">
          <LeafletMap />
        </div>
      </motion.div>

      {/* 🚀 EVIDENCIAS RECIENTES (FONDO ABSOLUTO) */}
      {fleet.latestEvidences.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-white/5">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} className="text-emerald-400" /> Histórico de Evidencias Recientes
              </h2>
              <p className="text-[10px] text-gray-600 uppercase mt-1">Verificación visual de pauta publicitaria</p>
            </div>
            <Link to="/smartcity/admin/devices" className="text-[10px] font-bold text-[#F36F21] hover:underline uppercase tracking-wider">Ver todos los dispositivos</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {fleet.latestEvidences.map(ev => (
              <motion.div key={ev.id} variants={itemVariants} className="relative group rounded-2xl overflow-hidden border border-white/5 aspect-video bg-black shadow-xl">
                <img src={ev.url} alt={ev.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-[10px] font-black text-[#F36F21] uppercase tracking-tighter mb-1 truncate">
                      📺 {ev.lastScreenshotCampaign || 'Campaña Desconocida'}
                    </p>
                    <p className="text-xs font-bold text-white mb-1 line-clamp-1">{ev.name}</p>
                    <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[9px] text-gray-400 uppercase font-mono">
                        {new Date(ev.timestamp).toLocaleDateString()} - {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <a href={ev.url} target="_blank" rel="noreferrer" className="text-white bg-white/10 hover:bg-[#F36F21] p-1.5 rounded-lg transition-colors">
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DashboardView;