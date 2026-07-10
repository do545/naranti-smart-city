import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { doc, setDoc } from 'firebase/firestore';
import { Clock3, Loader2, Save, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTotem } from '@/contexts/TotemContext';
import { db } from '@/firebase/config';
import {
  DEFAULT_AD_ROTATION_SECONDS,
  MAX_AD_ROTATION_SECONDS,
  MIN_AD_ROTATION_SECONDS,
  normalizeAdRotationSeconds
} from '@/lib/adRotation';

const SettingsView = () => {
  const { toast } = useToast();
  const { config, setConfig } = useTotem();
  const [isSaving, setIsSaving] = useState(false);
  const [rotationSeconds, setRotationSeconds] = useState(DEFAULT_AD_ROTATION_SECONDS);

  useEffect(() => {
    setRotationSeconds(normalizeAdRotationSeconds(config?.adRotationSeconds));
  }, [config?.adRotationSeconds]);

  const handleSave = async () => {
    const normalizedRotation = normalizeAdRotationSeconds(rotationSeconds);
    const nextConfig = {
      ...config,
      adRotationSeconds: normalizedRotation
    };

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'kiosk_config'), nextConfig, { merge: true });
      setConfig(nextConfig);
      setRotationSeconds(normalizedRotation);

      toast({
        title: 'Configuracion aplicada',
        description: `Los spots ahora rotan cada ${normalizedRotation} segundo${normalizedRotation === 1 ? '' : 's'}.`,
        style: { backgroundColor: '#10B981', color: 'white' }
      });
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuracion del sistema.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8 min-h-screen bg-[#09090b] text-white font-sans"
    >
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuracion del Sistema</h1>
          <p className="mt-2 text-gray-400">
            Ajusta parametros globales de reproduccion para kioscos y pantallas.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="rounded-3xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-400">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Publicidad</h2>
                <p className="text-sm text-gray-500">Control maestro para la rotacion de spots.</p>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <Label htmlFor="ad-rotation" className="text-sm font-semibold text-gray-200">
                      Tiempo de rotacion de anuncios (segundos)
                    </Label>
                    <p className="text-sm text-gray-500">
                      Este valor se aplica al carrusel principal, fullscreen y pantallas.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      id="ad-rotation"
                      min={MIN_AD_ROTATION_SECONDS}
                      max={MAX_AD_ROTATION_SECONDS}
                      value={rotationSeconds}
                      onChange={(e) => setRotationSeconds(e.target.value)}
                      className="w-24 rounded-2xl border border-white/10 bg-[#0f0f10] px-4 py-3 text-center text-lg font-bold text-white outline-none transition-colors focus:border-[#F36F21]"
                    />
                    <span className="text-sm font-medium text-gray-500">seg</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5">
                <div className="flex items-start gap-3">
                  <Clock3 size={18} className="mt-0.5 text-emerald-400" />
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>
                      El tiempo efectivo actual es de{' '}
                      <span className="font-bold text-white">
                        {normalizeAdRotationSeconds(rotationSeconds)} segundo{normalizeAdRotationSeconds(rotationSeconds) === 1 ? '' : 's'}
                      </span>.
                    </p>
                    <p className="text-gray-500">
                      Si un video dura menos, avanza al terminar. Si dura mas, se corta al tiempo configurado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Resumen</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Aplica a</div>
                <div className="mt-2 text-sm text-gray-300">
                  Banner principal, spots fullscreen del kiosco y reproductor de pantallas.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Rango permitido</div>
                <div className="mt-2 text-sm text-gray-300">
                  Entre {MIN_AD_ROTATION_SECONDS} y {MAX_AD_ROTATION_SECONDS} segundos por spot.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Configuracion actual</div>
                <div className="mt-2 text-2xl font-black text-white">
                  {normalizeAdRotationSeconds(rotationSeconds)}s
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-2xl bg-[#F36F21] px-8 py-6 text-white hover:bg-orange-600 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="mr-2 animate-spin" size={18} /> : <Save className="mr-2" size={18} />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsView;