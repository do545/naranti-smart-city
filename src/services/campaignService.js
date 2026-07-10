import { db } from '@/firebase/config';
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc, doc,
  query, orderBy, serverTimestamp, where
} from 'firebase/firestore';
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "firebase/storage";

const COLLECTION_NAME = 'campaigns';
const storage = getStorage();

// 1. OBTENER TODAS (Admin)
export const getCampaigns = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];

    const campaigns = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let status = data.status;

      // 🧹 AUTOLIMPIEZA: Si ya venció y sigue activa/pausada, la marcamos como expirada
      if (data.endDate && data.endDate < currentDate && status !== 'expired') {
        status = 'expired';
        await updateDoc(doc(db, COLLECTION_NAME, docSnap.id), { status: 'expired' });
        console.log(`🧹 Campaña expirada y archivada: ${data.name}`);
      }

      return { id: docSnap.id, ...data, status };
    }));

    return campaigns;
  } catch (error) {
    console.error("Error admin fetching campaigns:", error);
    return [];
  }
};

// 2. OBTENER ACTIVAS (FILTRO DE CALIDAD, SEGMENTACIÓN Y HORARIOS)
export const getActiveCampaigns = async (deviceIdentifier, deviceType = 'kiosk') => {
  try {
    // ⚡️ Optimización: solo traemos campañas activas (reduce lecturas/costo)
    const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'active'));
    const snapshot = await getDocs(q);

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // ej: 'monday'
    const currentTime = now.getHours() * 100 + now.getMinutes(); // ej: 1430 para 2:30 PM

    const allCampaigns = snapshot.docs.map(doc => {
      const data = doc.data();

      // 🎯 ASIGNACIÓN INTELIGENTE DE MEDIA SEGÚN EL DISPOSITIVO
      let foundImage = "";
      if (deviceType === 'screen') {
        foundImage = data.screenUrl || data.verticalUrl || data.horizontalUrl || data.mediaUrl || "";
      } else {
        foundImage = data.verticalUrl || data.mediaUrl || data.horizontalUrl || "";
      }

      return {
        id: doc.id,
        ...data,
        mediaUrl: foundImage
      };
    });

    // --- LÓGICA DE FILTRADO AVANZADO ---
    const filtered = allCampaigns.filter(camp => {
      // 1. Debe estar activa
      if (camp.status !== 'active') return false;

      // 2. SEGMENTACIÓN POR TIPO DE DISPOSITIVO
      if (camp.targetDeviceType && camp.targetDeviceType !== 'all' && camp.targetDeviceType !== deviceType) {
        return false;
      }

      // 3. SEGMENTACIÓN POR ID ESPECÍFICO
      if (camp.targetKiosk && camp.targetKiosk !== 'all' && camp.targetKiosk !== deviceIdentifier) {
        return false;
      }

      // 4. ARCHIVO INVÁLIDO
      if (!camp.mediaUrl || camp.mediaUrl.length < 10) return false;

      // 5. FILTRO POR RANGO DE FECHAS (Calendario Base)
      if (camp.startDate && camp.startDate > currentDate) return false;
      if (camp.endDate && camp.endDate < currentDate) return false;

      // 6. PAUTA PROGRAMÁTICA: DÍAS DE LA SEMANA (Intermitencia)
      // Si camp.scheduledDays existe y no está vacío, el día actual debe estar incluido
      if (camp.scheduledDays && camp.scheduledDays.length > 0) {
        if (!camp.scheduledDays.includes(currentDay)) return false;
      }

      // 7. PAUTA PROGRAMÁTICA: HORARIOS (Slots)
      // Si camp.scheduledHours existe, la hora actual debe caer en alguno de los rangos
      if (camp.scheduledHours && camp.scheduledHours.length > 0) {
        const isInRange = camp.scheduledHours.some(slot => {
          const start = parseInt(slot.start.replace(':', ''));
          const end = parseInt(slot.end.replace(':', ''));
          return currentTime >= start && currentTime <= end;
        });
        if (!isInRange) return false;
      }

      return true;
    });

    const clampSteps = (value) => {
      const parsed = Number.parseInt(value ?? 1, 10);
      if (!Number.isFinite(parsed)) return 1;
      return Math.min(4, Math.max(1, parsed));
    };

    const getOrderValue = (camp) => {
      if (typeof camp.order === 'number' && Number.isFinite(camp.order)) return camp.order;
      if (typeof camp.createdAt?.seconds === 'number') return camp.createdAt.seconds * 1000;
      return 0;
    };

    const sorted = filtered.sort((a, b) => {
      const diff = getOrderValue(b) - getOrderValue(a);
      if (diff !== 0) return diff;
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    // 🎛️ PASOS (1–4): ponderación simple estilo playlist.
    // Para evitar repeticiones consecutivas extremas, intercalamos en rondas según el orden base.
    const remaining = sorted.map((camp) => ({
      camp,
      left: clampSteps(camp.steps)
    }));
    const expanded = [];
    while (remaining.some((r) => r.left > 0)) {
      for (const r of remaining) {
        if (r.left <= 0) continue;
        expanded.push(r.camp);
        r.left -= 1;
      }
    }

    console.log(`✅ ${expanded.length} campañas activas para ${deviceIdentifier} (${deviceType})`);
    return expanded;

  } catch (error) {
    console.error("Error fetching ads:", error);
    return [];
  }
};

// --- OTRAS FUNCIONES (sin cambios) ---
export const createCampaign = async (data) => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
    status: 'active',
    order: Date.now(),
    steps: data?.steps ?? 1
  });
  return docRef.id;
};
export const deleteCampaign = async (id) => await deleteDoc(doc(db, COLLECTION_NAME, id));
export const toggleCampaignStatus = async (id, currentStatus) => {
  const ref = doc(db, COLLECTION_NAME, id);
  await updateDoc(ref, { status: currentStatus === 'active' ? 'paused' : 'active' });
};
export const updateCampaign = async (id, data) => {
  const ref = doc(db, COLLECTION_NAME, id);
  await updateDoc(ref, data);
};
export const uploadCampaignMedia = async (file) => {
  if (!file) return null;
  // Nombre limpio para evitar errores de URL
  const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const storageRef = ref(storage, `campaigns/${Date.now()}_${safeName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};