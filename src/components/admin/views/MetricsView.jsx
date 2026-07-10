import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, PieChart as PieIcon, Calendar, BarChart2 } from 'lucide-react';
import { getMonthlyStats, getCampaignSummary } from '@/services/statsService';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const KPICard = ({ title, value, subtext, icon: Icon, color }) => (
  <motion.div
    variants={itemVariants}
    className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 flex flex-col justify-between hover:bg-gray-800/80 transition-all duration-300"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      {subtext && <span className="text-xs font-medium text-gray-400 bg-gray-700 px-2 py-1 rounded-full">{subtext}</span>}
    </div>
    <div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  </motion.div>
);

const MetricsView = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [campaignData, setCampaignData] = useState([]);
  const [kpis, setKpis] = useState({ totalInteractions: 0, totalTaps: 0, bestDay: '-', avgDaily: 0 });

  useEffect(() => {
    const loadData = async () => {
      // 1. Cargar Historial Mensual
      const history = await getMonthlyStats();
      setMonthlyData(history);

      // Calcular KPIs
      const total = history.reduce((acc, curr) => acc + curr.Interacciones, 0);
      const totalTaps = history.reduce((acc, curr) => acc + (curr.Toques || 0), 0);
      const max = Math.max(...history.map(d => d.Interacciones));
      const bestDayObj = history.find(d => d.Interacciones === max);
      const avg = total / (history.length || 1);

      setKpis({
        totalInteractions: total,
        totalTaps,
        bestDay: bestDayObj ? `${bestDayObj.date} (${max})` : '-',
        avgDaily: Math.round(avg * 10) / 10
      });

      // 2. Cargar Distribución de Campañas
      const pieData = await getCampaignSummary();
      setCampaignData(pieData);
    };
    loadData();
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analíticas Avanzadas</h1>
          <p className="text-gray-400">Rendimiento en tiempo real de tu red de kioscos.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-700 hover:bg-gray-700 transition">Esta Semana</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">Este Mes</button>
        </div>
      </div>

      {/* KPI Section */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title="Interacciones (30 días)"
          value={kpis.totalInteractions}
          subtext="Contactos reales"
          icon={Activity}
          color="text-blue-400"
        />
        <KPICard
          title="Toques en Pantalla (30 días)"
          value={kpis.totalTaps}
          subtext="Profundidad de uso"
          icon={BarChart2}
          color="text-orange-400"
        />
        <KPICard
          title="Promedio Diario"
          value={kpis.avgDaily}
          subtext="Contactos por día"
          icon={BarChart2}
          color="text-purple-400"
        />
        <KPICard
          title="Mejor Día"
          value={kpis.bestDay}
          subtext="Pico de contactos"
          icon={Calendar}
          color="text-green-400"
        />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Line Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-500" />
            Tendencia de Interacciones
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInteraction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="Interacciones"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorInteraction)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={itemVariants} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <PieIcon className="text-purple-500" />
            Estado de Campañas
          </h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={campaignData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {campaignData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1F2937', borderRadius: '8px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
            {/* Stats Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">
                {campaignData.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <span className="text-xs text-gray-400">Total</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MetricsView;