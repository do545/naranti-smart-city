import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useTotem } from '@/contexts/TotemContext';

const AdminPanel = ({ onViewChange }) => {
  const [activeTab, setActiveTab] = useState('ads');
  const [editingAd, setEditingAd] = useState(null);
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    category: 'gastronomia',
    imageUrl: '',
    actionText: '',
    actionUrl: '',
    startDate: '',
    endDate: '',
    active: true
  });

  const { ads, metrics, addAd, updateAd, deleteAd } = useTotem();

  const categories = [
    { value: 'gastronomia', label: 'Gastronomía' },
    { value: 'turismo', label: 'Turismo' },
    { value: 'salud', label: 'Salud' },
    { value: 'cultura', label: 'Cultura' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'conectividad', label: 'Conectividad' }
  ];

  const handleSaveAd = () => {
    if (!newAd.title || !newAd.description) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios"
      });
      return;
    }

    if (editingAd) {
      updateAd(editingAd.id, newAd);
      toast({
        title: "✅ Anuncio actualizado",
        description: "El anuncio se ha actualizado correctamente"
      });
      setEditingAd(null);
    } else {
      // Si es nuevo, aseguramos que active sea true por defecto
      addAd({ ...newAd, active: true });
      toast({
        title: "✅ Anuncio creado",
        description: "El anuncio se ha creado correctamente"
      });
    }

    setNewAd({
      title: '',
      description: '',
      category: 'gastronomia',
      imageUrl: '',
      actionText: '',
      actionUrl: '',
      actionText: '',
      actionUrl: '',
      startDate: '',
      endDate: '',
      active: true
    });
  };

  const handleEditAd = (ad) => {
    setEditingAd(ad);
    setNewAd({ ...ad });
  };

  const handleDeleteAd = (id) => {
    deleteAd(id);
    toast({
      title: "🗑️ Anuncio eliminado",
      description: "El anuncio se ha eliminado correctamente"
    });
  };

  const handleToggleAdStatus = (ad) => {
    updateAd(ad.id, { ...ad, active: !ad.active });
    toast({
      title: ad.active ? "⏸️ Anuncio pausado" : "▶️ Anuncio activado",
      description: `El anuncio está ahora ${ad.active ? 'inactivo' : 'activo'}`
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-6"
    >
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange('main')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Panel de Administración</h1>
            <p className="text-cyan-300">Gestión de contenido y publicidad</p>
          </div>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <Button
          variant={activeTab === 'ads' ? 'default' : 'outline'}
          onClick={() => setActiveTab('ads')}
          className={activeTab === 'ads'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
            : 'glass-effect border-white/20 text-white hover:bg-white/10'
          }
        >
          <Settings className="h-4 w-4 mr-2" />
          Gestión de Anuncios
        </Button>
        <Button
          variant={activeTab === 'metrics' ? 'default' : 'outline'}
          onClick={() => setActiveTab('metrics')}
          className={activeTab === 'metrics'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
            : 'glass-effect border-white/20 text-white hover:bg-white/10'
          }
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Métricas
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'ads' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Ad Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">
              {editingAd ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Título del anuncio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 h-20 resize-none"
                  placeholder="Descripción del anuncio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={newAd.category}
                  onChange={(e) => setNewAd({ ...newAd, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value} className="bg-slate-800">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL de Imagen
                </label>
                <input
                  type="url"
                  value={newAd.imageUrl}
                  onChange={(e) => setNewAd({ ...newAd, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Texto del Botón
                </label>
                <input
                  type="text"
                  value={newAd.actionText}
                  onChange={(e) => setNewAd({ ...newAd, actionText: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Ver más"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL de Acción
                </label>
                <input
                  type="url"
                  value={newAd.actionUrl}
                  onChange={(e) => setNewAd({ ...newAd, actionUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="https://ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha Inicio (Opcional)
                  </label>
                  <input
                    type="date"
                    value={newAd.startDate || ''}
                    onChange={(e) => setNewAd({ ...newAd, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha Fin (Opcional)
                  </label>
                  <input
                    type="date"
                    value={newAd.endDate || ''}
                    onChange={(e) => setNewAd({ ...newAd, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveAd}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingAd ? 'Actualizar Anuncio' : 'Crear Anuncio'}
              </Button>

              {editingAd && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingAd(null);
                    setNewAd({
                      title: '',
                      description: '',
                      category: 'gastronomia',
                      imageUrl: '',
                      actionText: '',
                      actionUrl: '',
                      startDate: '',
                      endDate: '',
                      active: true
                    });
                  }}
                  className="w-full glass-effect border-white/20 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </motion.div>

          {/* Ads List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">
              Anuncios Existentes ({ads.length})
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-white">{ad.title}</h4>
                    <div className="flex space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleAdStatus(ad)}
                        className="text-white hover:bg-white/10 h-8 w-8"
                      >
                        {ad.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditAd(ad)}
                        className="text-white hover:bg-white/10 h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteAd(ad.id)}
                        className="text-red-400 hover:bg-red-500/20 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{ad.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-cyan-400 bg-cyan-400/20 px-2 py-1 rounded">
                      {categories.find(cat => cat.value === ad.category)?.label}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${ad.active
                      ? 'text-green-400 bg-green-400/20'
                      : 'text-gray-400 bg-gray-400/20'
                      }`}>
                      {ad.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Metrics Cards */}
          {Object.entries(metrics).map(([key, value], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-effect rounded-2xl p-6 text-center"
            >
              <div className="text-3xl font-bold gradient-text mb-2">
                {value.toLocaleString()}
              </div>
              <div className="text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminPanel;