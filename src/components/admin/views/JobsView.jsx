import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Trash2, Pencil, RefreshCw, MapPin, Star, Globe, CheckCircle2, XCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, functions } from '@/firebase/config';
import { saveLocalJob, deleteLocalJob } from '@/services/jobsService';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const EMPTY_FORM = {
  title: '',
  company: '',
  city: '',
  cityId: '',
  type: 'Tiempo Completo',
  salary: '',
  description: '',
  link: '',
  active: true
};

const JobsView = () => {
  const { toast } = useToast();
  const [feeds, setFeeds] = useState([]);
  const [localJobs, setLocalJobs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalJob, setModalJob] = useState(null); // null = cerrado, {} = nuevo, {id} = editar
  const [isSaving, setIsSaving] = useState(false);

  // Feed real por ciudad (solo lectura — lo escribe el backend).
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      setFeeds(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (e) => console.error('Error leyendo feed de empleos:', e));
    return () => unsub();
  }, []);

  // Vacantes locales curadas (tiempo real).
  useEffect(() => {
    const q = query(collection(db, 'jobs_local'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setLocalJobs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (e) => console.error('Error leyendo vacantes locales:', e));
    return () => unsub();
  }, []);

  const handleRefreshNow = async () => {
    setIsRefreshing(true);
    try {
      const refreshJobsNow = httpsCallable(functions, 'refreshJobsNow');
      const { data } = await refreshJobsNow();
      if (data?.keyConfigured === false) {
        toast({
          title: '⚠️ Falta la clave de Jooble',
          description: 'Se detectaron las ciudades, pero falta configurar JOOBLE_API_KEY en el backend.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: '✅ Vacantes actualizadas',
          description: `${data.jobsWritten} vacantes en ${data.cities} ciudad(es).`,
          style: { backgroundColor: '#10B981', color: 'white' }
        });
      }
    } catch (e) {
      console.error('Error refrescando vacantes:', e);
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo refrescar. ¿El backend está desplegado?',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!modalJob.title || !modalJob.company) {
      toast({ title: 'Campos incompletos', description: 'Título y empresa son obligatorios.', variant: 'destructive' });
      return;
    }
    if (modalJob.cityId !== 'all' && !modalJob.city) {
      toast({ title: 'Falta la ciudad', description: 'Indica la ciudad o marca "Todas las ciudades".', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const { id, ...data } = modalJob;
      await saveLocalJob(id, data);
      toast({
        title: '✅ Vacante guardada',
        description: `"${modalJob.title}" ya está visible en los kioscos.`,
        style: { backgroundColor: '#10B981', color: 'white' }
      });
      setModalJob(null);
    } catch (err) {
      console.error('Error guardando vacante local:', err);
      toast({ title: 'Error', description: 'No se pudo guardar la vacante.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`¿Eliminar la vacante "${job.title}"?`)) return;
    try {
      await deleteLocalJob(job.id);
      toast({ title: '🗑️ Vacante eliminada' });
    } catch (e) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
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
            <Briefcase className="text-[#F36F21]" />
            Bolsa de Trabajo
          </h1>
          <p className="text-gray-400 mt-1">Vacantes reales por ciudad + empleos locales destacados.</p>
        </div>
        <div className="flex gap-3">
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
          <button
            onClick={() => setModalJob({ ...EMPTY_FORM })}
            className="bg-[#F36F21] hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Plus size={18} /> Vacante Local
          </button>
        </div>
      </div>

      {/* ESTADO DEL FEED POR CIUDAD */}
      <div className="bg-[#121212] rounded-3xl border border-white/10 p-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
          <Globe className="text-blue-400" size={20} /> Feed automático (Jooble) por ciudad
        </h2>
        {feeds.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no hay vacantes descargadas. Asigna una ciudad a tus dispositivos (Kioscos y Pantallas → campo Ciudad)
            y pulsa "Actualizar Ahora", o espera al refresco automático (cada 12 horas).
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeds.map((feed) => (
              <div key={feed.id} className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-white mb-1">
                  <MapPin size={16} className="text-[#F36F21]" /> {feed.city}
                </div>
                <p className="text-2xl font-black text-[#F36F21]">{feed.jobs?.length || 0} <span className="text-xs font-medium text-gray-400">vacantes activas</span></p>
                <p className="text-[11px] text-gray-500 mt-2">Última actualización: {formatDate(feed.updatedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VACANTES LOCALES */}
      <div className="bg-[#121212] rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="font-bold text-lg flex items-center gap-2 text-white">
            <Star className="text-[#F36F21]" size={20} /> Empleos locales destacados
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            Se muestran ARRIBA del feed automático en los kioscos de su ciudad. Producto vendible a negocios locales.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-3">Vacante</th>
                <th className="px-6 py-3">Ciudad</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {localJobs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Sin vacantes locales. Crea la primera con "Vacante Local".</td></tr>
              ) : (
                localJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{job.title}</div>
                      <div className="text-xs text-gray-500">{job.company}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {job.cityId === 'all' ? 'Todas' : job.city}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{job.type}</td>
                    <td className="px-6 py-4">
                      {job.active ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400"><CheckCircle2 size={14} /> Activa</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><XCircle size={14} /> Pausada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setModalJob({ ...EMPTY_FORM, ...job })}
                        className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(job)}
                        className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR/EDITAR VACANTE LOCAL */}
      {modalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] w-full max-w-lg rounded-3xl border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-white">
              {modalJob.id ? 'Editar Vacante Local' : 'Nueva Vacante Local'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-gray-400 ml-1">Puesto *</label>
                  <input required value={modalJob.title} onChange={(e) => setModalJob({ ...modalJob, title: e.target.value })}
                    placeholder="Ej. Barista y Atención"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 ml-1">Empresa *</label>
                  <input required value={modalJob.company} onChange={(e) => setModalJob({ ...modalJob, company: e.target.value })}
                    placeholder="Ej. Café Europa"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 ml-1">Salario</label>
                  <input value={modalJob.salary} onChange={(e) => setModalJob({ ...modalJob, salary: e.target.value })}
                    placeholder="Ej. $8,000 + propinas"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 ml-1">Ciudad</label>
                  <input
                    value={modalJob.cityId === 'all' ? '' : modalJob.city}
                    disabled={modalJob.cityId === 'all'}
                    onChange={(e) => setModalJob({ ...modalJob, city: e.target.value, cityId: '' })}
                    placeholder="Ej. Morelia"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none disabled:opacity-40" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 ml-1">Tipo</label>
                  <select value={modalJob.type} onChange={(e) => setModalJob({ ...modalJob, type: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none">
                    <option>Tiempo Completo</option>
                    <option>Medio Tiempo</option>
                    <option>Remoto</option>
                    <option>Temporal</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-gray-400 ml-1">Descripción</label>
                  <textarea rows={3} value={modalJob.description} onChange={(e) => setModalJob({ ...modalJob, description: e.target.value })}
                    placeholder="Describe la vacante, requisitos y cómo aplicar…"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none resize-none" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-gray-400 ml-1">Link para postularse (se convierte en QR en el kiosco)</label>
                  <input type="url" value={modalJob.link} onChange={(e) => setModalJob({ ...modalJob, link: e.target.value })}
                    placeholder="https://…  (WhatsApp, formulario, sitio del negocio)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none" />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={modalJob.active}
                    onChange={(e) => setModalJob({ ...modalJob, active: e.target.checked })}
                    className="accent-[#F36F21] w-4 h-4" />
                  Vacante activa
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={modalJob.cityId === 'all'}
                    onChange={(e) => setModalJob({ ...modalJob, cityId: e.target.checked ? 'all' : '' })}
                    className="accent-[#F36F21] w-4 h-4" />
                  Todas las ciudades
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalJob(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl transition-colors font-medium text-sm text-white">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-sm shadow-lg transition-all text-white",
                    isSaving ? "bg-[#F36F21]/60 cursor-not-allowed" : "bg-[#F36F21] hover:bg-orange-600"
                  )}>
                  {isSaving ? 'Guardando…' : 'Guardar Vacante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default JobsView;
