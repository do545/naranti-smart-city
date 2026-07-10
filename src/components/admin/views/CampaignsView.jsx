import React, { useMemo, useState, useEffect } from 'react';
// 1. IMPORTAMOS EL SERVICIO DE KIOSCOS
import { getKiosks } from '@/services/kioskService';
import { getCampaigns, createCampaign, deleteCampaign, toggleCampaignStatus, uploadCampaignMedia, updateCampaign } from '@/services/campaignService';
import { isVideoMedia } from '@/lib/media';
import { Megaphone, Plus, Calendar, Monitor, Trash2, Play, Pause, UploadCloud, X, Smartphone, Layout, Tv, Tablet, ChevronUp, ChevronDown, Minus, Activity, Loader2, ArrowLeft, Library, Pencil } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const CampaignsView = () => {
  const ONLINE_GRACE_MS = 120000; // 2 min (heartbeat cada 30s)
  const [campaigns, setCampaigns] = useState([]);
  // 2. ESTADO PARA LA LISTA DE KIOSCOS
  const [kiosksList, setKiosksList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // null = modo "crear"; con id = modo "editar" (mismo modal, precargado)
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [updatingCampaignId, setUpdatingCampaignId] = useState(null);
  const [campaignsScope, setCampaignsScope] = useState('devices'); // 'all' | 'devices'
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const { toast } = useToast();

  const getEmptyFormData = (overrides = {}) => ({
    name: '',
    executive: '',
    mediaType: 'image',
    startDate: '',
    endDate: '',
    targetKiosk: 'all',
    targetDeviceType: 'all', // 'all' | 'kiosk' | 'screen'
    // Días activos (debe seleccionar al menos 1).
    scheduledDays: [],
    scheduledHours: [{ start: '00:00', end: '23:59' }],
    verticalFile: null,
    verticalUrl: '',
    horizontalFile: null,
    horizontalUrl: '',
    screenFile: null,
    screenUrl: '',
    steps: 1,
    ...overrides
  });

  const [formData, setFormData] = useState(getEmptyFormData());

  const WEEK_DAYS = [
    { id: 'monday', label: 'L' },
    { id: 'tuesday', label: 'M' },
    { id: 'wednesday', label: 'M' },
    { id: 'thursday', label: 'J' },
    { id: 'friday', label: 'V' },
    { id: 'saturday', label: 'S' },
    { id: 'sunday', label: 'D' }
  ];

  // --- CARGAR DATOS (CAMPAÑAS Y KIOSCOS) ---
  const loadData = async () => {
    setLoading(true);
    try {
      // Cargamos ambas cosas en paralelo para que sea rápido
      const [campaignsData, kioskosData] = await Promise.all([
        getCampaigns(),
        getKiosks()
      ]);

      // Filtramos las campañas expiradas para que no se vean en el panel
      const activeOrScheduled = campaignsData.filter(c => c.status !== 'expired');
      setCampaigns(activeOrScheduled);
      setKiosksList(kioskosData); // Guardamos la flota real
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Re-render periodically (for ONLINE/OFFLINE chips in library)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video');
      const previewUrl = URL.createObjectURL(file);

      // Actualizamos mediaType siempre que se suba el archivo principal o cualquiera de los slots
      // para asegurar que la previsualización sepa qué renderizar
      setFormData(prev => ({
        ...prev,
        mediaType: isVideo ? 'video' : 'image',
        [`${type}File`]: file,
        [`${type}Url`]: previewUrl
      }));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCampaignId(null);
    setFormData(getEmptyFormData());
  };

  // Abre el mismo modal de creación pero precargado con la campaña existente.
  // Los archivos actuales se conservan salvo que el usuario suba un reemplazo.
  const openEditCampaignModal = (camp) => {
    setFormData(getEmptyFormData({
      name: camp.name || '',
      executive: camp.executive || '',
      mediaType: camp.mediaType || 'image',
      startDate: camp.startDate || '',
      endDate: camp.endDate || '',
      targetKiosk: camp.targetKiosk || 'all',
      targetDeviceType: camp.targetDeviceType || 'all',
      scheduledDays: Array.isArray(camp.scheduledDays) ? [...camp.scheduledDays] : [],
      scheduledHours: Array.isArray(camp.scheduledHours) && camp.scheduledHours.length > 0
        ? camp.scheduledHours.map((slot) => ({ ...slot }))
        : [{ start: '00:00', end: '23:59' }],
      verticalUrl: camp.verticalUrl || '',
      horizontalUrl: camp.horizontalUrl || '',
      screenUrl: camp.screenUrl || '',
      steps: clampSteps(camp.steps)
    }));
    setEditingCampaignId(camp.id);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validación básica: al menos un archivo vertical o de pantalla debe existir dependiendo del destino
    const needsVertical = formData.targetDeviceType === 'all' || formData.targetDeviceType === 'kiosk';
    const needsScreen = formData.targetDeviceType === 'screen';

    if (needsVertical && !formData.verticalFile && !formData.verticalUrl) {
      return toast({ title: "Falta archivo", description: "El formato vertical es obligatorio para Kioscos.", variant: "destructive" });
    }
    if (needsScreen && !formData.screenFile && !formData.screenUrl && !formData.verticalFile && !formData.verticalUrl) {
      return toast({ title: "Falta archivo", description: "Sube al menos un arte horizontal o vertical para la pantalla.", variant: "destructive" });
    }

    // Validación programática: al menos 1 día seleccionado
    if (!Array.isArray(formData.scheduledDays) || formData.scheduledDays.length === 0) {
      return toast({ title: "Falta pauta", description: "Selecciona al menos un día activo para la campaña.", variant: "destructive" });
    }

    setIsUploading(true);
    try {
      let vUrl = formData.verticalUrl;
      let hUrl = formData.horizontalUrl;
      let sUrl = formData.screenUrl;

      // Subida de archivos
      if (formData.verticalFile) vUrl = await uploadCampaignMedia(formData.verticalFile);
      if (formData.horizontalFile) hUrl = await uploadCampaignMedia(formData.horizontalFile);
      if (formData.screenFile) sUrl = await uploadCampaignMedia(formData.screenFile);

      // Si no hay horizontal especifico de kiosco, usamos el vertical
      if (!hUrl) hUrl = vUrl;
      // Si es para toda la red y no hay screenUrl específico, usamos el vertical como fallback (aunque se verá estirado)
      if (!sUrl && formData.targetDeviceType === 'all') sUrl = vUrl;

      const payload = {
        name: formData.name,
        executive: (formData.executive || '').trim(),
        verticalUrl: vUrl,
        horizontalUrl: hUrl,
        screenUrl: sUrl,
        mediaType: formData.mediaType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        targetKiosk: formData.targetKiosk,
        targetDeviceType: formData.targetDeviceType,
        scheduledDays: formData.scheduledDays,
        scheduledHours: formData.scheduledHours,
        steps: clampSteps(formData.steps)
      };

      if (editingCampaignId) {
        // Edición: solo tocamos los campos del formulario (status, orden y
        // fecha de creación se conservan). Si extendió la vigencia de una
        // campaña que ya había expirado, la reactivamos.
        const currentDate = new Date().toISOString().split('T')[0];
        if (payload.endDate && payload.endDate >= currentDate) {
          const editing = campaigns.find((c) => c.id === editingCampaignId);
          if (editing?.status === 'expired') payload.status = 'active';
        }
        await updateCampaign(editingCampaignId, payload);
        toast({ title: "✅ Campaña Actualizada", description: "Los cambios ya están en la red.", style: { backgroundColor: '#10B981', color: 'white' } });
      } else {
        await createCampaign(payload);
        toast({ title: "✅ Campaña Lista", description: "Formatos optimizados subidos a la red.", style: { backgroundColor: '#10B981', color: 'white' } });
      }

      closeModal();
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Falló la subida.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggle = async (camp) => { await toggleCampaignStatus(camp.id, camp.status); loadData(); };
  const handleDelete = async (id) => { if (window.confirm("¿Eliminar?")) { await deleteCampaign(id); loadData(); } };

  const clampSteps = (value) => {
    const parsed = Number.parseInt(value ?? 1, 10);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(4, Math.max(1, parsed));
  };

  const isEmailLike = (value) => {
    if (typeof value !== 'string') return false;
    return /\S+@\S+\.\S+/.test(value.trim());
  };

  const getDeviceDisplayName = (device, fallbackId = '') => {
    const candidates = [device?.name, device?.location];
    const readable = candidates.find((value) => (
      typeof value === 'string' &&
      value.trim() &&
      value !== fallbackId &&
      !isEmailLike(value)
    ));

    if (readable) return readable;
    if (device?.type === 'screen') return 'Pantalla seleccionada';
    if (device?.type === 'kiosk') return 'Kiosco seleccionado';
    return 'Dispositivo seleccionado';
  };

  // Función auxiliar para obtener el nombre del kiosco por su ID
  const getKioskName = (id) => {
    if (id === 'all') return 'Toda la Red';
    const k = kiosksList.find(k => k.id === id);
    if (!k) return 'Asignación directa';
    return getDeviceDisplayName(k, id);
  };

  const getOrderValue = (camp) => {
    if (typeof camp.order === 'number' && Number.isFinite(camp.order)) return camp.order;
    if (typeof camp.createdAt?.seconds === 'number') return camp.createdAt.seconds * 1000;
    return 0;
  };

  const sortedCampaigns = useMemo(() => {
    const list = [...campaigns];
    list.sort((a, b) => {
      const diff = getOrderValue(b) - getOrderValue(a);
      if (diff !== 0) return diff;
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
    return list;
  }, [campaigns]);

  const getExpiration = (endDate) => {
    if (!endDate) return { label: 'Permanente', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: 'bg-blue-400' };
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { label: 'Expirada', color: 'text-red-400', bg: 'bg-red-500/10', icon: 'bg-red-500' };
    if (diffDays <= 3) return { label: `Baja en ${diffDays}d`, color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: 'bg-yellow-400' };
    return { label: 'Vigente', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: 'bg-emerald-500' };
  };

  const isIntermittent = (camp) => {
    const days = Array.isArray(camp?.scheduledDays) ? camp.scheduledDays : [];
    const hours = Array.isArray(camp?.scheduledHours) ? camp.scheduledHours : [];

    const hasDayRestriction = days.length > 0 && days.length < 7;
    const hasHourRestriction = hours.length > 0 && (
      hours.length > 1 ||
      hours[0]?.start !== '00:00' ||
      hours[0]?.end !== '23:59'
    );

    return hasDayRestriction || hasHourRestriction;
  };

  const getCampaignThumb = (camp) => {
    if (camp.targetDeviceType === 'screen') return camp.screenUrl || camp.horizontalUrl || camp.verticalUrl;
    return camp.verticalUrl || camp.horizontalUrl || camp.screenUrl;
  };

  const getLastSeenMs = (device) => {
    const value = device?.lastSeen;
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate().getTime();
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const isDeviceOnline = (device) => {
    const lastSeenMs = getLastSeenMs(device);
    if (!lastSeenMs) return false;
    return (now - lastSeenMs) < ONLINE_GRACE_MS;
  };

  const devices = useMemo(() => {
    return (kiosksList || []).map((d) => ({
      ...d,
      type: d?.type === 'screen' ? 'screen' : 'kiosk'
    }));
  }, [kiosksList]);

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId) return null;
    return devices.find((d) => d.id === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  const campaignAppliesToDevice = (camp, deviceId, deviceType) => {
    const targetType = camp?.targetDeviceType || 'all';
    if (targetType !== 'all' && targetType !== deviceType) return false;

    const targetDevice = camp?.targetKiosk || 'all';
    if (targetDevice !== 'all' && targetDevice !== deviceId) return false;

    return true;
  };

  const deviceCampaignCounts = useMemo(() => {
    const counts = {};
    for (const d of devices) counts[d.id] = 0;

    for (const camp of sortedCampaigns) {
      if (!camp) continue;
      const targetType = camp.targetDeviceType || 'all'; // 'all' | 'kiosk' | 'screen'
      const targetDevice = camp.targetKiosk || 'all';

      if (targetDevice === 'all') {
        for (const d of devices) {
          const deviceType = d?.type === 'screen' ? 'screen' : 'kiosk';
          if (targetType !== 'all' && targetType !== deviceType) continue;
          counts[d.id] += 1;
        }
        continue;
      }

      const device = devices.find((d) => d.id === targetDevice);
      if (!device) continue;
      const deviceType = device?.type === 'screen' ? 'screen' : 'kiosk';
      if (targetType !== 'all' && targetType !== deviceType) continue;
      if (counts[targetDevice] != null) counts[targetDevice] += 1;
    }

    return counts;
  }, [devices, sortedCampaigns]);

  const playlistCampaigns = useMemo(() => {
    if (campaignsScope === 'devices' && selectedDeviceId) {
      const deviceType = selectedDevice?.type === 'screen' ? 'screen' : 'kiosk';
      return sortedCampaigns.filter((camp) => campaignAppliesToDevice(camp, selectedDeviceId, deviceType));
    }
    return sortedCampaigns;
  }, [campaignsScope, selectedDevice, selectedDeviceId, sortedCampaigns]);

  const showDestinationColumn = campaignsScope === 'all';

  const openNewCampaignModal = () => {
    setEditingCampaignId(null);
    if (campaignsScope === 'devices' && selectedDeviceId) {
      const deviceType = selectedDevice?.type === 'screen' ? 'screen' : 'kiosk';
      setFormData(getEmptyFormData({ targetDeviceType: deviceType, targetKiosk: selectedDeviceId }));
    } else {
      setFormData(getEmptyFormData());
    }
    setIsModalOpen(true);
  };

  const handleScopeChange = (scope) => {
    setCampaignsScope(scope);
    setSelectedDeviceId(null);
  };

  const handleMove = async (campId, direction) => {
    if (updatingCampaignId) return;
    const currentIndex = sortedCampaigns.findIndex((c) => c.id === campId);
    if (currentIndex === -1) return;
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= sortedCampaigns.length) return;

    const current = sortedCampaigns[currentIndex];
    const other = sortedCampaigns[nextIndex];
    const currentOrder = typeof current.order === 'number' ? current.order : getOrderValue(current);
    const otherOrder = typeof other.order === 'number' ? other.order : getOrderValue(other);

    setUpdatingCampaignId(campId);
    try {
      await Promise.all([
        updateCampaign(current.id, { order: otherOrder }),
        updateCampaign(other.id, { order: currentOrder })
      ]);
      setCampaigns((prev) => prev.map((c) => {
        if (c.id === current.id) return { ...c, order: otherOrder };
        if (c.id === other.id) return { ...c, order: currentOrder };
        return c;
      }));
    } catch (error) {
      console.error("Error reordenando campañas:", error);
      toast({ title: "Error", description: "No se pudo reordenar.", variant: "destructive" });
    } finally {
      setUpdatingCampaignId(null);
    }
  };

  const handleStepsChange = async (campId, nextSteps) => {
    if (updatingCampaignId) return;
    const clamped = clampSteps(nextSteps);
    setUpdatingCampaignId(campId);
    try {
      await updateCampaign(campId, { steps: clamped });
      setCampaigns((prev) => prev.map((c) => (c.id === campId ? { ...c, steps: clamped } : c)));
    } catch (error) {
      console.error("Error actualizando pasos:", error);
      toast({ title: "Error", description: "No se pudieron actualizar los pasos.", variant: "destructive" });
    } finally {
      setUpdatingCampaignId(null);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-[#09090b] text-white font-sans">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Megaphone className="text-[#F36F21]" size={32} /> Gestión de Campañas</h1>
          <p className="text-gray-400 mt-1">Publicidad adaptativa (Kioscos Portrait + Pantallas Landscape).</p>
        </div>
        <button onClick={openNewCampaignModal} className="bg-[#F36F21] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
          <Plus size={20} /> Nueva Campaña
        </button>
      </div>

      {/* Scope Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-2xl p-1 w-fit">
          <button
            type="button"
            onClick={() => handleScopeChange('devices')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
              campaignsScope === 'devices' ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
            )}
          >
            <Library size={16} className={campaignsScope === 'devices' ? "text-blue-400" : "text-gray-500"} />
            Dispositivos
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange('all')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
              campaignsScope === 'all' ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
            )}
          >
            <Megaphone size={16} className={campaignsScope === 'all' ? "text-[#F36F21]" : "text-gray-500"} />
            Todas
          </button>
        </div>

        {campaignsScope === 'devices' && selectedDeviceId && (
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedDeviceId(null)}
              className="px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={16} className="text-gray-400" />
              Dispositivos
            </button>
            <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-400">
              <span className="text-gray-500">Playlist:</span>
              <span className="max-w-full truncate font-bold text-white sm:max-w-[22rem]">
                {getDeviceDisplayName(selectedDevice, selectedDeviceId)}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase border",
                selectedDevice?.type === 'screen'
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-orange-500/10 text-orange-400 border-orange-500/20"
              )}>
                {selectedDevice?.type === 'screen' ? <Tv size={12} /> : <Tablet size={12} />}
                {selectedDevice?.type === 'screen' ? 'Pantalla' : 'Kiosco'}
              </span>
              {selectedDevice?.currentAd ? (
                <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-white/5 bg-black/20 px-3 py-1 text-gray-500">
                  <span className="shrink-0 hidden sm:inline">Reproduciendo:</span>
                  <span className="truncate text-gray-300 sm:max-w-[20rem]">{selectedDevice.currentAd}</span>
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Library (Dispositivos) */}
      {campaignsScope === 'devices' && !selectedDeviceId ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {devices.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl">
              No hay dispositivos registrados aún.
            </div>
          ) : (
            devices.map((device) => {
              const cover = device.lastScreenshotUrl;
              const isOnline = isDeviceOnline(device);
              const count = deviceCampaignCounts[device.id] ?? 0;

              return (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => setSelectedDeviceId(device.id)}
                  className="text-left bg-[#121212] rounded-3xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all active:scale-[0.99]"
                >
                  <div className="relative aspect-square bg-black/40 overflow-hidden">
                    {cover ? (
                      <>
                        {/* Background blur */}
                        <img
                          src={cover}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-25"
                          aria-hidden="true"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" aria-hidden="true" />

                        {/* Foreground framed preview (keeps aspect, no distortion) */}
                        <div className="relative z-10 w-full h-full p-4 flex items-center justify-center">
                          <div className={cn(
                            "rounded-2xl overflow-hidden border border-white/10 bg-black/30 shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
                            device.type === 'screen' ? "w-full aspect-video" : "h-full aspect-[9/16]"
                          )}>
                            <img
                              src={cover}
                              alt={device.name || device.id}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {device.type === 'screen' ? (
                          <Tv size={56} className="text-blue-500/40" />
                        ) : (
                          <Tablet size={56} className="text-orange-500/40" />
                        )}
                      </div>
                    )}

                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                      {isOnline ? (
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          OFFLINE
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 z-20">
                      <span className="text-[10px] font-black uppercase text-gray-200 bg-black/50 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                        {count} campaña{count === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-20">
                      <span className={cn(
                        "inline-flex items-center gap-2 text-[10px] font-black uppercase px-3 py-1 rounded-full border backdrop-blur-sm",
                        device.type === 'screen'
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      )}>
                        {device.type === 'screen' ? <Tv size={12} /> : <Tablet size={12} />}
                        {device.type === 'screen' ? 'Pantalla' : 'Kiosco'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-bold truncate">{device.name || (device.type === 'screen' ? 'Pantalla' : 'Kiosco')}</div>
                        <div className="text-[11px] text-gray-500 font-mono truncate">{device.id}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-1 rounded-lg font-mono">
                        {device.resolution || 'Sin resolución'}
                      </span>
                      {device.currentAd ? (
                        <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-1 rounded-lg truncate max-w-full">
                          Ahora: {device.currentAd}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
        /* Playlist (Estilo Spotify) */
        <div className="bg-[#121212] rounded-3xl overflow-hidden border border-gray-800">
          <div className="px-6 py-4 border-b border-white/10 flex items-center text-[11px] text-gray-400 uppercase tracking-widest">
            <div className={cn(campaignsScope === 'all' ? "w-12" : "w-10")}>#</div>
            <div className="flex-1">Campaña</div>
            {showDestinationColumn ? (
              <div className="hidden md:block w-52">Destino</div>
            ) : null}
            <div className="hidden lg:block w-32">Tipo</div>
            <div className="hidden lg:block w-32">Pasos</div>
            <div className="hidden xl:block w-48">Vigencia</div>
            <div className="w-48 text-right">Acciones</div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="text-center py-20 text-gray-500 animate-pulse">Cargando...</div>
            ) : playlistCampaigns.length === 0 ? (
              <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl m-6">
                {campaignsScope === 'devices' ? 'Este dispositivo no tiene campañas asignadas.' : 'Sin campañas activas.'}
              </div>
            ) : (
              playlistCampaigns.map((camp, index) => {
              const exp = getExpiration(camp.endDate);
              const steps = clampSteps(camp.steps);
              const thumb = getCampaignThumb(camp);
              const disabled = updatingCampaignId === camp.id;
              const showReorder = campaignsScope === 'all';

              return (
                <div
                  key={camp.id}
                  className={cn(
                    "group flex items-center gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors",
                    camp.status === 'active' ? "" : "opacity-70"
                  )}
                >
                  {showReorder ? (
                    <div className="w-12 flex items-center gap-2">
                      <span className="text-gray-600 font-mono text-sm w-6">{index + 1}</span>
                      <div className="flex flex-col -space-y-1">
                        <button
                          type="button"
                          disabled={disabled || index === 0}
                          onClick={() => handleMove(camp.id, 'up')}
                          className={cn(
                            "p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent",
                            "active:scale-95 transition-all"
                          )}
                          title="Subir"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={disabled || index === playlistCampaigns.length - 1}
                          onClick={() => handleMove(camp.id, 'down')}
                          className={cn(
                            "p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent",
                            "active:scale-95 transition-all"
                          )}
                          title="Bajar"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-10">
                      <span className="text-gray-600 font-mono text-sm">{index + 1}</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0">
                      {thumb ? (
                        isVideoMedia(thumb, camp.mediaType) ? (
                          <video src={thumb} className="w-full h-full object-cover" muted preload="metadata" />
                        ) : (
                          <img src={thumb} className="w-full h-full object-cover" alt={camp.name} loading="lazy" />
                        )
                      ) : (
                        <div className="text-[10px] text-gray-600 font-black uppercase">N/A</div>
                      )}
                    </div>

                    <div className="min-w-0 flex flex-col gap-2 justify-center">
                      {camp.name ? (
                        <div className="font-semibold text-white truncate leading-tight">{camp.name}</div>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className={cn("px-2 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-2", exp.bg, exp.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", exp.icon)} />
                          {exp.label}
                        </span>
                        {isIntermittent(camp) && (
                          <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase bg-purple-500/10 text-purple-400">
                            <Activity size={10} /> Intermitente
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-black/20 px-2 py-1 uppercase text-gray-500">
                          {camp.mediaType === 'video' ? 'Video' : 'Imagen'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {showDestinationColumn ? (
                    <div className="hidden md:block w-52">
                      <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/5 bg-black/20 px-3 py-1.5 text-[11px] text-gray-400">
                        <Monitor size={12} className="shrink-0 text-gray-500" />
                        <span className="truncate">{getKioskName(camp.targetKiosk)}</span>
                      </span>
                    </div>
                  ) : null}

                  <div className="hidden lg:block w-32">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase",
                      camp.targetDeviceType === 'screen' ? "bg-blue-500/10 text-blue-400" :
                        camp.targetDeviceType === 'kiosk' ? "bg-orange-500/10 text-orange-400" :
                          "bg-emerald-500/10 text-emerald-400"
                    )}>
                      {camp.targetDeviceType === 'screen' ? <Tv size={12} /> : <Tablet size={12} />}
                      {camp.targetDeviceType === 'screen' ? 'Pantalla' : camp.targetDeviceType === 'kiosk' ? 'Kiosco' : 'Red Dual'}
                    </span>
                  </div>

                  <div className="hidden lg:flex w-32 items-center gap-2">
                    <button
                      type="button"
                      disabled={disabled || steps <= 1}
                      onClick={() => handleStepsChange(camp.id, steps - 1)}
                      className="p-2 rounded-xl bg-black/30 border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-40"
                      title="Bajar pasos"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm font-mono text-white min-w-[3rem] text-center">
                      ×{steps}
                    </div>
                    <button
                      type="button"
                      disabled={disabled || steps >= 4}
                      onClick={() => handleStepsChange(camp.id, steps + 1)}
                      className="p-2 rounded-xl bg-black/30 border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-40"
                      title="Subir pasos"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="hidden xl:block w-48 text-[11px] text-gray-500 font-mono truncate">
                    <Calendar size={12} className="inline mr-2 text-gray-600" />
                    {camp.startDate || 'Ini'} → {camp.endDate || 'S.F'}
                  </div>

                  <div className="w-48 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditCampaignModal(camp)}
                      className="p-2.5 rounded-2xl border border-white/10 text-gray-400 hover:text-blue-400 hover:bg-blue-900/10 hover:border-blue-500/20 transition-all active:scale-90"
                      title="Editar campaña"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => handleToggle(camp)}
                      className={cn(
                        "p-2.5 rounded-2xl transition-all active:scale-90 border",
                        camp.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/15'
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/15'
                      )}
                      title={camp.status === 'active' ? 'Pausar' : 'Activar'}
                    >
                      {camp.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                    </button>

                    <button
                      onClick={() => handleDelete(camp.id)}
                      className="p-2.5 rounded-2xl border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-900/10 hover:border-red-500/20 transition-all active:scale-90"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      )}

      {/* MODAL CON KIOSCOS REALES */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#1a1a1a] w-full max-w-4xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 sticky top-0 z-10 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                {editingCampaignId ? 'Editar Campaña' : 'Nueva Campaña Multiformato'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-8">

              {/* 0. TIPO DE DISPOSITIVO DESTINO */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Destino de la Campaña</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'all', name: 'Toda la Red', icon: Megaphone, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                    { id: 'kiosk', name: 'Solo Kioscos', icon: Tablet, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                    { id: 'screen', name: 'Solo Pantallas', icon: Tv, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
                  ].map((dest) => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, targetDeviceType: dest.id })}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95",
                        formData.targetDeviceType === dest.id
                          ? `${dest.bg} ${dest.border} ${dest.color} border-opacity-100`
                          : "bg-black/40 border-white/5 text-gray-500 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                      )}
                    >
                      <dest.icon size={24} />
                      <span className="text-[10px] font-black uppercase">{dest.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. SECCIÓN DE ARCHIVOS DINÁMICA */}
              <div className="space-y-6 pt-4 border-t border-white/5">

                {/* A. FORMATOS KIOSCO (SOLO SI ES KIOSCO O ALL) */}
                {(formData.targetDeviceType === 'all' || formData.targetDeviceType === 'kiosk') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#F36F21] uppercase tracking-widest flex items-center gap-2"><Smartphone size={14} /> KIOSCO: IDLE (VERTICAL)</label>
                      <p className="text-[10px] text-gray-500 mb-2">Para el modo descanso del kiosco físico.</p>
                      <div className="relative w-full aspect-[9/16] bg-black/40 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center hover:border-[#F36F21] transition-all group cursor-pointer overflow-hidden">
                        <input type="file" accept="image/*,video/mp4" onChange={(e) => handleFileChange(e, 'vertical')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        {formData.verticalUrl ? (
                          (formData.verticalFile ? formData.verticalFile.type.startsWith('video') : isVideoMedia(formData.verticalUrl, formData.mediaType)) ? <video src={formData.verticalUrl} className="h-full w-full object-cover" muted /> : <img src={formData.verticalUrl} alt="Preview vertical" className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <UploadCloud size={32} className="text-gray-500 mx-auto mb-2" />
                            <span className="text-xs text-gray-400 uppercase font-bold">Subir Portrait</span>
                            <p className="text-[8px] text-gray-600 mt-1">1080x1920px</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2"><Layout size={14} /> KIOSCO: BANNER (DURANTE USO)</label>
                      <p className="text-[10px] text-gray-500 mb-2">Aparece arriba mientras navegan el kiosco.</p>
                      <div className="relative w-full h-40 bg-black/40 border-2 border-dashed border-gray-700 hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center transition-all group overflow-hidden">
                        <input type="file" accept="image/*,video/mp4" onChange={(e) => handleFileChange(e, 'horizontal')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        {formData.horizontalUrl ? (
                          (formData.horizontalFile ? formData.horizontalFile.type.startsWith('video') : isVideoMedia(formData.horizontalUrl, formData.mediaType)) ? <video src={formData.horizontalUrl} className="h-full w-full object-cover" muted /> : <img src={formData.horizontalUrl} alt="Preview banner" className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <UploadCloud size={32} className="text-gray-500 mx-auto mb-2" />
                            <span className="text-xs text-gray-400 uppercase font-bold">Subir Banner</span>
                            <p className="text-[8px] text-gray-600 mt-1">1080x300px</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* B. FORMATO PANTALLA (SOLO SI ES SCREEN O ALL) */}
                {(formData.targetDeviceType === 'all' || formData.targetDeviceType === 'screen') && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <label className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                      <Tv size={16} /> PANTALLA TV: ARTE HORIZONTAL (NATIVO)
                    </label>
                    <p className="text-[10px] text-gray-500 mb-2">Este arte se mostrará en las Pantallas de TV (Novastar / Pasivas).</p>
                    <div className="relative w-full aspect-video bg-black/40 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-3xl flex flex-col items-center justify-center transition-all group overflow-hidden">
                      <input type="file" accept="image/*,video/mp4" onChange={(e) => handleFileChange(e, 'screen')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      {formData.screenUrl ? (
                        (formData.screenFile ? formData.screenFile.type.startsWith('video') : isVideoMedia(formData.screenUrl, formData.mediaType)) ? <video src={formData.screenUrl} className="h-full w-full object-cover" muted /> : <img src={formData.screenUrl} alt="Preview pantalla" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center p-6 bg-black/20 rounded-full border border-white/5">
                          <UploadCloud size={48} className="text-blue-500/50 mx-auto mb-3" />
                          <span className="text-sm text-gray-400 uppercase font-black tracking-tighter">Subir Arte Pantalla 16:9</span>
                          <p className="text-[10px] text-gray-600 mt-1 uppercase font-bold tracking-widest">Resolución Recomendada: 1920x1080px</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

	              {/* 2. Datos y Selección de Kiosco */}
	              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-6">
	                <div className="space-y-2">
	                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre Campaña</label>
	                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-xl p-4 text-white focus:border-[#F36F21] outline-none transition-all" placeholder="Ej: Promo Navidad" />
	                </div>

                {/* 3. LISTA DE KIOSCOS REALES */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Ubicación Específica (Opcional)</label>
                  <select
                    value={formData.targetKiosk}
                    onChange={e => setFormData({ ...formData, targetKiosk: e.target.value })}
                    className="w-full bg-black/40 border border-gray-700 rounded-xl p-4 text-white focus:border-[#F36F21] outline-none transition-all"
                  >
                    <option value="all">✨ Todos los lugares</option>
                    {/* Aquí inyectamos los kioscos de la base de datos */}
                    {kiosksList.map(kiosk => (
                      <option key={kiosk.id} value={kiosk.id}>
                        📍 {kiosk.name} ({kiosk.location})
                      </option>
                    ))}
	                  </select>
	                </div>

	                <div className="space-y-2 md:col-span-2">
	                  <label className="text-xs font-bold text-gray-500 uppercase">Ejecutivo Responsable (Opcional)</label>
	                  <input
	                    value={formData.executive}
	                    onChange={e => setFormData({ ...formData, executive: e.target.value })}
	                    className="w-full bg-black/40 border border-gray-700 rounded-xl p-4 text-white focus:border-[#F36F21] outline-none transition-all"
	                    placeholder="Ej: Francisco / Juan Pérez"
	                  />
	                </div>
	              </div>

              {/* 4. Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Inicio</label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-xl p-4 text-white focus:border-[#F36F21] outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Fin</label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-xl p-4 text-white focus:border-[#F36F21] outline-none transition-all" />
                </div>
              </div>

	              {/* 5. PAUTA PROGRAMÁTICA: DÍAS Y HORAS */}
	              <div className="space-y-6 pt-6 border-t border-white/5">
	                <div className="space-y-4">
	                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex justify-between items-center">
	                    Pauta Semanal (Días Activos)
	                    <div className="flex items-center gap-3 text-[10px] font-bold normal-case tracking-normal">
	                      <button
	                        type="button"
	                        onClick={() => setFormData({ ...formData, scheduledDays: WEEK_DAYS.map(d => d.id) })}
	                        className="text-[#F36F21] hover:underline"
	                      >
	                        Todos
	                      </button>
	                      <button
	                        type="button"
	                        onClick={() => setFormData({ ...formData, scheduledDays: [] })}
	                        className="text-gray-400 hover:underline"
	                      >
	                        Limpiar
	                      </button>
	                    </div>
	                  </label>
	                  <p className="text-[10px] text-gray-500">Selecciona los días en los que la campaña estará activa.</p>
	                  <div className="flex flex-wrap gap-2">
	                    {WEEK_DAYS.map((day) => {
	                      const isActive = formData.scheduledDays.includes(day.id);
	                      return (
	                        <button
	                          key={day.id}
	                          type="button"
                          onClick={() => {
                            const newDays = isActive
                              ? formData.scheduledDays.filter(d => d !== day.id)
                              : [...formData.scheduledDays, day.id];
                            setFormData({ ...formData, scheduledDays: newDays });
                          }}
                          className={cn(
                            "w-10 h-10 rounded-full border font-bold text-xs transition-all",
                            isActive
                              ? "bg-[#F36F21] border-[#F36F21] text-white"
                              : "bg-black/40 border-white/10 text-gray-500 hover:border-gray-600"
                          )}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex justify-between items-center">
                    Rango Horario
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, scheduledHours: [...formData.scheduledHours, { start: '00:00', end: '23:59' }] })}
                      className="text-[10px] text-[#F36F21] hover:underline"
                    >
                      + Añadir Horario
                    </button>
                  </label>
                  {formData.scheduledHours.map((slot, index) => (
                    <div key={index} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => {
                          const newHours = [...formData.scheduledHours];
                          newHours[index].start = e.target.value;
                          setFormData({ ...formData, scheduledHours: newHours });
                        }}
                        className="bg-transparent text-white text-sm outline-none"
                      />
                      <span className="text-gray-600">a</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => {
                          const newHours = [...formData.scheduledHours];
                          newHours[index].end = e.target.value;
                          setFormData({ ...formData, scheduledHours: newHours });
                        }}
                        className="bg-transparent text-white text-sm outline-none"
                      />
                      {formData.scheduledHours.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newHours = formData.scheduledHours.filter((_, i) => i !== index);
                            setFormData({ ...formData, scheduledHours: newHours });
                          }}
                          className="ml-auto text-red-500/50 hover:text-red-500 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 flex gap-4 border-t border-white/10">
                <button type="button" onClick={closeModal} className="px-8 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={isUploading} className="flex-1 bg-[#F36F21] hover:bg-orange-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
                  {isUploading ? <Loader2 className="animate-spin" /> : null}
                  {isUploading ? "OPTIMIZANDO ARCHIVOS..." : (editingCampaignId ? "GUARDAR CAMBIOS" : "PUBLICAR CAMPAÑA")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsView;