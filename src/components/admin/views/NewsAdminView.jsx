import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, RefreshCw, MapPin, Plus, Trash2, Rss, Save } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, functions } from '@/firebase/config';
import { toCityId } from '@/services/jobsService';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const NewsAdminView = () => {
  const { toast } = useToast();
  const [feeds, setFeeds] = useState([]); // docs de `news` (estado por ciudad)
  const [config, setConfig] = useState({}); // settings/news_feeds -> cities
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'news'), (snapshot) => {
      setFeeds(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (e) => console.error('Error leyendo estado de noticias:', e));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'news_feeds'), (snap) => {
      if (snap.exists()) setConfig(snap.data().cities || {});
    }, (e) => console.error('Error leyendo config de medios:', e));
    return () => unsub();
  }, []);

  const handleRefreshNow = async () => {
    setIsRefreshing(true);
    try {
      const refreshNewsNow = httpsCallable(functions, 'refreshNewsNow');
      const { data } = await refreshNewsNow();
      toast({
        title: '✅ Noticias actualizadas',
        description: `${data.itemsWritten} noticias en ${data.cities} ciudad(es)${data.feedErrors?.length ? ` — feeds con error: ${data.feedErrors.join(', ')}` : ''}.`,
        style: { backgroundColor: '#10B981', color: 'white' }
      });
    } catch (e) {
      console.error('Error refrescando noticias:', e);
      toast({ title: 'Error', description: e?.message || 'No se pudo refrescar.', variant: 'destructive' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveConfig = async (nextConfig) => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'news_feeds'), {
        cities: nextConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: '✅ Medios guardados', style: { backgroundColor: '#10B981', color: 'white' } });
    } catch (e) {
      console.error('Error guardando medios:', e);
      toast({ title: 'Error', description: 'No se pudo guardar la configuración.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFeed = (cityId, index, field, value) => {
    setConfig((prev) => {
      const next = structuredClone(prev);
      next[cityId].feeds[index][field] = value;
      return next;
    });
  };

  const addFeedRow = (cityId) => {
    setConfig((prev) => {
      const next = structuredClone(prev);
      next[cityId].feeds.push({ name: '', url: '' });
      return next;
    });
  };

  const removeFeedRow = (cityId, index) => {
    setConfig((prev) => {
      const next = structuredClone(prev);
      next[cityId].feeds.splice(index, 1);
      return next;
    });
  };

  const addCity = () => {
    const name = newCity.trim();
    const cityId = toCityId(name);
    if (!cityId) return;
    if (config[cityId]) {
      toast({ title: 'Esa ciudad ya existe', variant: 'destructive' });
      return;
    }
    setConfig((prev) => ({ ...prev, [cityId]: { city: name, feeds: [{ name: '', url: '' }] } }));
    setNewCity('');
  };

  const cleanedConfig = () => {
    const next = structuredClone(config);
    for (const cityId of Object.keys(next)) {
      next[cityId].feeds = (next[cityId].feeds || []).filter((f) => f.name.trim() && f.url.trim());
      if (next[cityId].feeds.length === 0) delete next[cityId];
    }
    return next;
  };

  const formatDate = (ts) => {
    const d = ts?.toDate?.();
    return d ? d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8 space-y-8"
    >
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Newspaper className="text-[#F36F21]" />
            Noticias
          </h1>
          <p className="text-gray-400 mt-1">Noticias reales del día desde los medios locales de cada ciudad (RSS).</p>
        </div>
        <button
          onClick={handleRefreshNow}
          disabled={isRefreshing}
          className={cn(
            "px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border",
            isRefreshing
              ? "bg-gray-800 text-gray-500 border-white/5 cursor-not-allowed"
              : "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
          )}
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar Ahora'}
        </button>
      </div>

      {/* ESTADO POR CIUDAD */}
      <div className="bg-[#121212] rounded-3xl border border-white/10 p-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
          <MapPin className="text-blue-400" size={20} /> Estado del feed por ciudad
        </h2>
        {feeds.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no hay noticias descargadas. Pulsa "Actualizar Ahora" o espera al refresco automático (cada 3 horas).
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeds.map((feed) => (
              <div key={feed.id} className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-white mb-1">
                  <MapPin size={16} className="text-[#F36F21]" /> {feed.city}
                </div>
                <p className="text-2xl font-black text-[#F36F21]">{feed.items?.length || 0} <span className="text-xs font-medium text-gray-400">noticias del día</span></p>
                <p className="text-[11px] text-gray-500 mt-2">Última actualización: {formatDate(feed.updatedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIGURACIÓN DE MEDIOS POR CIUDAD */}
      <div className="bg-[#121212] rounded-3xl border border-white/10 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2 text-white">
              <Rss className="text-[#F36F21]" size={20} /> Medios por ciudad
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Agrega el RSS de los medios locales de cada ciudad donde tengas tótems. Formato usual: https://elmedio.com/feed/
            </p>
          </div>
          <button
            onClick={() => saveConfig(cleanedConfig())}
            disabled={isSaving}
            className={cn(
              "px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all",
              isSaving ? "bg-[#F36F21]/60 cursor-not-allowed" : "bg-[#F36F21] hover:bg-orange-600"
            )}
          >
            <Save size={16} /> {isSaving ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </div>

        {Object.entries(config).map(([cityId, cityConfig]) => (
          <div key={cityId} className="bg-black/30 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 font-bold text-white mb-4">
              <MapPin size={16} className="text-[#F36F21]" /> {cityConfig.city}
              <span className="text-[10px] text-gray-500 font-mono font-normal">({cityId})</span>
            </div>
            <div className="space-y-2">
              {(cityConfig.feeds || []).map((feed, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    value={feed.name}
                    onChange={(e) => updateFeed(cityId, idx, 'name', e.target.value)}
                    placeholder="Nombre del medio"
                    className="w-56 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#F36F21] outline-none"
                  />
                  <input
                    value={feed.url}
                    onChange={(e) => updateFeed(cityId, idx, 'url', e.target.value)}
                    placeholder="https://medio.com/feed/"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-[#F36F21] outline-none"
                  />
                  <button
                    onClick={() => removeFeedRow(cityId, idx)}
                    className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                    title="Quitar medio"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addFeedRow(cityId)}
              className="mt-3 text-xs font-bold text-[#F36F21] hover:bg-[#F36F21]/10 px-3 py-2 rounded-lg transition-all flex items-center gap-1"
            >
              <Plus size={14} /> Agregar medio
            </button>
          </div>
        ))}

        <div className="flex gap-2 items-center pt-2">
          <input
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="Nueva ciudad (Ej. Uruapan)"
            className="w-64 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#F36F21] outline-none"
          />
          <button
            onClick={addCity}
            className="text-xs font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl transition-all flex items-center gap-1"
          >
            <Plus size={14} /> Agregar ciudad
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NewsAdminView;
