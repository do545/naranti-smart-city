import React, { useState, useEffect } from 'react';
import { getKiosks, addKiosk, deleteKiosk } from '@/services/kioskService';
import { Monitor, Plus, MapPin, Wifi, Trash2, Search, X, Server, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const KiosksView = () => {
  const [kiosks, setKiosks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', location: '', ip: '', email: '' });

  const loadData = async () => {
    setLoading(true);
    const data = await getKiosks();
    // Datos demo si está vacío
    if (data.length === 0) setKiosks([{ id: 'demo', name: 'Kiosco Demo', location: 'Morelia', ip: '127.0.0.1', status: 'active' }]);
    else setKiosks(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await addKiosk(formData);
      toast({ title: "✅ Guardado", description: "Kiosco registrado en la nube.", style: { backgroundColor: '#10B981', color: 'white' } });
      setIsModalOpen(false);
      setFormData({ name: '', location: '', ip: '', email: '' });
      loadData();
    } catch (e) { toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" }); }
  };

  const handleDelete = async (id) => {
    if (id === 'demo') return;
    if (window.confirm("¿Borrar kiosco?")) {
        await deleteKiosk(id);
        loadData();
    }
  };

  return (
    <div className="p-8 min-h-screen bg-[#09090b] text-white font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Server className="text-[#F36F21]" /> Gestión de Flota</h1>
            <p className="text-gray-400">Inventario en tiempo real.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#F36F21] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95"><Plus size={20} /> Nuevo Kiosco</button>
      </div>

      <div className="bg-[#121212] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex justify-between">
            <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} /><input className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-[#F36F21] outline-none" placeholder="Buscar..." /></div>
            <button onClick={loadData} className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-black/40 text-gray-500 uppercase text-[10px] font-bold"><tr><th className="px-6 py-4">Nombre</th><th className="px-6 py-4">Ubicación</th><th className="px-6 py-4">IP</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                    {kiosks.map(k => (
                        <tr key={k.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-bold flex items-center gap-3"><Monitor className="text-[#F36F21]" size={18}/> {k.name}</td>
                            <td className="px-6 py-4 text-gray-300">{k.location}</td>
                            <td className="px-6 py-4 text-gray-500 font-mono">{k.ip || "DHCP"}</td>
                            <td className="px-6 py-4"><span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-full text-xs border border-green-500/20">ONLINE</span></td>
                            <td className="px-6 py-4 text-right"><button onClick={() => handleDelete(k.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={18}/></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] w-full max-w-md rounded-3xl border border-white/10 p-6 shadow-2xl">
                <h2 className="text-xl font-bold mb-6">Nuevo Kiosco</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <input required placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none"/>
                    <input required placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none"/>
                    <input required placeholder="Ubicación" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none"/>
                    <input placeholder="IP (Opcional)" value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F36F21] outline-none"/>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-800 py-3 rounded-xl">Cancelar</button>
                        <button type="submit" className="flex-1 bg-[#F36F21] py-3 rounded-xl font-bold">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default KiosksView;