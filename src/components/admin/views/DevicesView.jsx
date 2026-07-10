import React, { useState, useEffect } from 'react';
import { getDevices, addDevice, deleteDevice, sendDeviceCommand } from '@/services/deviceService';
import { Monitor, Tablet, Plus, Trash2, Search, Server, RefreshCw, Tv, Smartphone, Eraser, Camera, Eye, RotateCcw, Sun } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/firebase/config';
import { collection, onSnapshot, query, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getScheduledBrightness, normalizeBrightnessSchedule } from '@/lib/brightnessSchedule';

const DevicesView = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // Para el visor de capturas
  const [brightnessModal, setBrightnessModal] = useState(null); // { id, name, type }
  const [brightnessScheduleDraft, setBrightnessScheduleDraft] = useState([]);
  const [savingBrightness, setSavingBrightness] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { toast } = useToast();

  const ONLINE_GRACE_MS = 120000; // 2 min (heartbeat cada 30s)

  // Form State with Type
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '', // Ciudad para la bolsa de trabajo (vacantes reales por zona)
    ip: '',
    email: '',
    type: 'kiosk' // default: 'kiosk' | 'screen'
  });

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'kiosks'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDevices(data);
      setLoading(false);
    }, (error) => {
      console.error("Error in real-time listener:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Re-render periodically so ONLINE/OFFLINE updates even when Firestore docs don't change.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!formData.email) {
        toast({ title: "Error", description: "El correo es obligatorio.", variant: "destructive" });
        return;
      }
      const docId = formData.email.toLowerCase();

      // Usamos setDoc con el email como ID para sincronizar con el latido
      await setDoc(doc(db, 'kiosks', docId), {
        ...formData,
        email: docId,
        status: 'offline',
        createdAt: serverTimestamp()
      }, { merge: true });

      toast({
        title: "✅ Dispositivo Sincronizado",
        description: `${formData.name} se ha vinculado correctamente.`,
        style: { backgroundColor: '#10B981', color: 'white' }
      });
      setIsModalOpen(false);
      setFormData({ name: '', location: '', city: '', ip: '', email: '', type: 'kiosk' });
    } catch (e) {
      console.error("Error saving device:", e);
      toast({ title: "Error", description: "No se pudo sincronizar el dispositivo.", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (id.startsWith('demo')) {
      toast({ title: "Modo Demo", description: "No puedes eliminar datos de demostración.", variant: "default" });
      return;
    }
    if (window.confirm("¿Estás seguro de eliminar este dispositivo?")) {
      await deleteDevice(id);
    }
  };

  const DeviceIcon = ({ type }) => {
    if (type === 'screen') return <Tv className="text-blue-400" size={18} />;
    return <Tablet className="text-[#F36F21]" size={18} />;
  };

  const openBrightnessEditor = (device) => {
    setBrightnessModal({ id: device.id, name: device.name, type: device.type });
    setBrightnessScheduleDraft(normalizeBrightnessSchedule(device.brightnessSchedule));
  };

  const saveBrightnessSchedule = async () => {
    if (!brightnessModal?.id) return;
    setSavingBrightness(true);

    try {
      const cleaned = normalizeBrightnessSchedule(brightnessScheduleDraft);

      await setDoc(
        doc(db, 'kiosks', brightnessModal.id),
        {
          brightnessSchedule: cleaned,
          brightnessUpdatedAt: serverTimestamp()
        },
        { merge: true }
      );

      toast({
        title: "✅ Brillo Programado",
        description: cleaned.length
          ? `Se guardaron ${cleaned.length} regla(s) para ${brightnessModal.name}.`
          : `Se limpió el horario de brillo para ${brightnessModal.name}.`,
        style: { backgroundColor: '#10B981', color: 'white' }
      });

      setBrightnessModal(null);
      setBrightnessScheduleDraft([]);
    } catch (e) {
      console.error("Error saving brightness schedule:", e);
      toast({ title: "Error", description: "No se pudo guardar el horario de brillo.", variant: "destructive" });
    } finally {
      setSavingBrightness(false);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-[#09090b] text-white font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Server className="text-[#F36F21]" />
            Kioscos y Pantallas
          </h1>
          <p className="text-gray-400">Gestión unificada de flota de dispositivos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#F36F21] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={20} /> Nuevo Dispositivo
        </button>
      </div>

      <div className="bg-[#121212] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-[#F36F21] outline-none transition-colors"
              placeholder="Buscar dispositivo..."
            />
          </div>
          <button onClick={() => window.location.reload()} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4">Dispositivo</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Resolución</th>
                <th className="px-6 py-4">Contenido Actual</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {devices.map(d => {
                const isOnline = d.lastSeen ? (now - d.lastSeen.toDate()) < ONLINE_GRACE_MS : false;

                return (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-bold flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors", d.type === 'screen' ? 'text-blue-400' : 'text-[#F36F21]')}>
                        {d.type === 'screen' ? <Tv size={20} /> : <Tablet size={20} />}
                      </div>
                      <div>
                        <div className="text-white">{d.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{d.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs uppercase tracking-wider font-bold px-2 py-1 rounded border",
                        d.type === 'screen'
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      )}>
                        {d.type === 'screen' ? 'Pantalla' : 'Kiosco'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      {d.resolution || "No detectada"}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {d.currentAd || "---"}
                    </td>
                    <td className="px-6 py-4">
                      {isOnline ? (
                        <span className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full w-fit border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-500/10 px-3 py-1 rounded-full w-fit border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          OFFLINE
                        </span>
                      )}
                    </td>
	                    <td className="px-6 py-4 text-right flex justify-end gap-2">
	                      <button
	                        onClick={() => openBrightnessEditor(d)}
	                        className="text-amber-400 hover:bg-amber-500/10 p-2 rounded-lg transition-all"
	                        title="Programar Brillo (Simulado)"
	                      >
	                        <Sun size={18} />
	                      </button>

	                      <button
	                        onClick={async () => {
	                          try {
	                            await sendDeviceCommand(d.id, 'RELOAD');
                            toast({ title: "Comando Enviado", description: "El dispositivo se recargará en breve." });
                          } catch (e) {
                            toast({ title: "Error", description: "No se pudo enviar el comando.", variant: "destructive" });
                          }
                        }}
                        className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-all"
                        title="Recargar Dispositivo"
                      >
                        <RefreshCw size={18} />
                      </button>

                      <button
                        onClick={async () => {
                          if (!window.confirm("¿Limpiar caché de este dispositivo? Se borrarán datos locales.")) return;
                          try {
                            await sendDeviceCommand(d.id, 'CLEAR_CACHE');
                            toast({ title: "Comando Enviado", description: "La caché se limpiará en breve." });
                          } catch (e) {
                            toast({ title: "Error", description: "No se pudo enviar el comando.", variant: "destructive" });
                          }
                        }}
                        className="text-yellow-400 hover:bg-yellow-500/10 p-2 rounded-lg transition-all"
                        title="Limpiar Caché"
                      >
                        <Eraser size={18} />
                      </button>

                      <button
                        onClick={async () => {
                          if (!window.confirm("⚠️ Reset duro: borrará la publicidad offline (archivos y lista) y configuración local. Requiere internet para recuperarse. ¿Continuar?")) return;
                          try {
                            await sendDeviceCommand(d.id, 'FACTORY_RESET');
                            toast({ title: "Comando Enviado", description: "El dispositivo se reiniciará a estado limpio." });
                          } catch (e) {
                            toast({ title: "Error", description: "No se pudo enviar el comando.", variant: "destructive" });
                          }
                        }}
                        className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                        title="Reset Duro (Factory)"
                      >
                        <RotateCcw size={18} />
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            await sendDeviceCommand(d.id, 'SCREENSHOT');
                            toast({ title: "Captura Solicitada", description: "El dispositivo está generando la evidencia." });
                          } catch (e) {
                            toast({ title: "Error", description: "No se pudo solicitar la captura.", variant: "destructive" });
                          }
                        }}
                        className="text-emerald-400 hover:bg-emerald-500/10 p-2 rounded-lg transition-all"
                        title="Tomar Captura"
                      >
                        <Camera size={18} />
                      </button>

                      {d.lastScreenshotUrl && (
                        <button
                          onClick={() => setPreviewImage({ url: d.lastScreenshotUrl, name: d.name })}
                          className="text-gray-300 hover:bg-white/10 p-2 rounded-lg transition-all"
                          title="Ver Última Evidencia"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(d.id)} className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
	                    </td>
	                  </tr>
	                );
	              })}
              {devices.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay dispositivos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

	      {/* Modal Visor de Capturas */}
	      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl bg-[#121212] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Camera className="text-[#F36F21]" />
                Evidencia: {previewImage.name}
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
              >
                <Trash2 className="rotate-45" size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center min-h-[50vh]">
              <img
                src={previewImage.url}
                alt="Screen Preview"
                className="max-w-full h-auto shadow-2xl animate-in zoom-in-95 duration-500"
              />
            </div>
            <div className="p-4 text-center bg-black/40 border-t border-white/5">
              <p className="text-xs text-gray-500 italic">Captura generada por el dispositivo remoto</p>
            </div>
          </div>
        </div>
	      )}

	      {/* Modal Horario de Brillo */}
	      {brightnessModal && (
	        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
	          <div className="bg-[#121212] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
	            <div className="p-5 border-b border-white/5 flex items-start justify-between bg-black/40">
	              <div>
	                <h3 className="text-lg font-bold flex items-center gap-2">
	                  <Sun className="text-amber-400" />
	                  Horario de Brillo
	                </h3>
	                <p className="text-xs text-gray-400 mt-1">
	                  {brightnessModal.name} · {brightnessModal.type === 'screen' ? 'Pantalla' : 'Kiosco'} · Brillo simulado (overlay)
	                </p>
	              </div>
	              <button
	                onClick={() => {
	                  if (savingBrightness) return;
	                  setBrightnessModal(null);
	                  setBrightnessScheduleDraft([]);
	                }}
	                className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
	                title="Cerrar"
	              >
	                <Trash2 className="rotate-45" size={22} />
	              </button>
	            </div>

	            <div className="p-5 space-y-4">
	              <div className="flex flex-wrap gap-2">
	                <button
	                  type="button"
	                  onClick={() => setBrightnessScheduleDraft([{ time: '06:00', brightness: 50 }, { time: '23:00', brightness: 0 }])}
	                  className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
	                >
	                  Preset 06:00→50% / 23:00→0%
	                </button>
	                <button
	                  type="button"
	                  onClick={() => setBrightnessScheduleDraft([])}
	                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
	                >
	                  Limpiar
	                </button>
	                <button
	                  type="button"
	                  onClick={() => setBrightnessScheduleDraft((prev) => [...prev, { time: '06:00', brightness: 100 }])}
	                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#F36F21]/10 text-[#F36F21] border border-[#F36F21]/20 hover:bg-[#F36F21]/20 transition-colors flex items-center gap-2"
	                >
	                  <Plus size={14} /> Agregar regla
	                </button>
	              </div>

	              <div className="space-y-3">
	                {brightnessScheduleDraft.length === 0 ? (
	                  <div className="text-sm text-gray-500 bg-black/30 border border-white/10 rounded-2xl p-4">
	                    Sin reglas. El brillo quedará al 100% (sin dimming).
	                  </div>
	                ) : (
	                  brightnessScheduleDraft.map((rule, idx) => (
	                    <div key={`${rule.time}-${idx}`} className="flex flex-col md:flex-row md:items-center gap-3 bg-black/30 border border-white/10 rounded-2xl p-4">
	                      <div className="flex items-center gap-3">
	                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Hora</label>
	                        <input
	                          type="time"
	                          value={rule.time}
	                          onChange={(e) => {
	                            const nextTime = e.target.value;
	                            setBrightnessScheduleDraft((prev) =>
	                              prev.map((r, i) => (i === idx ? { ...r, time: nextTime } : r))
	                            );
	                          }}
	                          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
	                        />
	                      </div>

	                      <div className="flex-1 flex items-center gap-3">
	                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Brillo</label>
	                        <input
	                          type="range"
	                          min={0}
	                          max={100}
	                          value={Number(rule.brightness) || 0}
	                          onChange={(e) => {
	                            const nextBrightness = Number(e.target.value);
	                            setBrightnessScheduleDraft((prev) =>
	                              prev.map((r, i) => (i === idx ? { ...r, brightness: nextBrightness } : r))
	                            );
	                          }}
	                          className="flex-1 accent-[#F36F21]"
	                        />
	                        <input
	                          type="number"
	                          min={0}
	                          max={100}
	                          value={Number(rule.brightness) || 0}
	                          onChange={(e) => {
	                            const nextBrightness = Number(e.target.value);
	                            setBrightnessScheduleDraft((prev) =>
	                              prev.map((r, i) => (i === idx ? { ...r, brightness: nextBrightness } : r))
	                            );
	                          }}
	                          className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
	                        />
	                        <span className="text-xs text-gray-400">%</span>
	                      </div>

	                      <div className="flex justify-end">
	                        <button
	                          type="button"
	                          onClick={() => setBrightnessScheduleDraft((prev) => prev.filter((_, i) => i !== idx))}
	                          className="text-gray-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition-all"
	                          title="Eliminar regla"
	                        >
	                          <Trash2 size={18} />
	                        </button>
	                      </div>
	                    </div>
	                  ))
	                )}
	              </div>

	              <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
	                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
	                  <span>Brillo efectivo ahora (preview)</span>
	                  <span className="font-mono">
	                    {getScheduledBrightness(brightnessScheduleDraft, new Date(), 100)}%
	                  </span>
	                </div>
	                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
	                  <div
	                    className="h-full bg-[#F36F21]"
	                    style={{ width: `${getScheduledBrightness(brightnessScheduleDraft, new Date(), 100)}%` }}
	                  />
	                </div>
	                <p className="mt-2 text-[11px] text-gray-500">
	                  Nota: esto oscurece el contenido (visual). Para brillo físico real se requiere un agente en Windows / integración con controlador.
	                </p>
	              </div>
	            </div>

	            <div className="p-5 border-t border-white/5 bg-black/40 flex gap-3">
	              <button
	                type="button"
	                onClick={() => {
	                  if (savingBrightness) return;
	                  setBrightnessModal(null);
	                  setBrightnessScheduleDraft([]);
	                }}
	                className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl transition-colors font-medium text-sm"
	              >
	                Cancelar
	              </button>
	              <button
	                type="button"
	                onClick={saveBrightnessSchedule}
	                disabled={savingBrightness}
	                className={cn(
	                  "flex-1 py-3 rounded-xl font-bold text-sm shadow-lg transition-all",
	                  savingBrightness
	                    ? "bg-[#F36F21]/60 cursor-not-allowed"
	                    : "bg-[#F36F21] hover:bg-orange-600 shadow-orange-900/20"
	                )}
	              >
	                {savingBrightness ? "Guardando..." : "Guardar Horario"}
	              </button>
	            </div>
	          </div>
	        </div>
	      )}

	      {isModalOpen && (
	        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
	          <div className="bg-[#1a1a1a] w-full max-w-md rounded-3xl border border-white/10 p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <Trash2 className="rotate-45" size={20} /> {/* Using Trash2 rotated as close icon fallback or just generic close logic */}
            </button>

            <h2 className="text-xl font-bold mb-6">Registrar Dispositivo</h2>
            <form onSubmit={handleSave} className="space-y-4">

              {/* Type Selector */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'kiosk' })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    formData.type === 'kiosk'
                      ? "bg-[#F36F21]/20 border-[#F36F21] text-[#F36F21]"
                      : "bg-black/40 border-white/10 text-gray-400 hover:bg-white/5"
                  )}
                >
                  <Tablet size={24} />
                  <span className="text-xs font-bold uppercase">Kiosco</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'screen' })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    formData.type === 'screen'
                      ? "bg-blue-500/20 border-blue-500 text-blue-400"
                      : "bg-black/40 border-white/10 text-gray-400 hover:bg-white/5"
                  )}
                >
                  <Tv size={24} />
                  <span className="text-xs font-bold uppercase">Pantalla</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 ml-1">Nombre del dispositivo</label>
                  <input required placeholder="Ej. Kiosco Plaza Principal" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none transition-colors" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 ml-1">Ubicación física</label>
                  <input required placeholder="Ej. Entrada Norte" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none transition-colors" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 ml-1">Ciudad (para bolsa de trabajo)</label>
                  <input placeholder="Ej. Morelia — si se deja vacío, se autodetecta por GPS" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 ml-1">Email de contacto</label>
                    <input required placeholder="admin@..." value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 ml-1">Dirección IP</label>
                    <input placeholder="192.168.x.x" value={formData.ip} onChange={e => setFormData({ ...formData, ip: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none transition-colors" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl transition-colors font-medium text-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-[#F36F21] hover:bg-orange-600 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-900/20 transition-all">Guardar Dispositivo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesView;