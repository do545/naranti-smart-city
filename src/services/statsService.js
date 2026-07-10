import { db } from '@/firebase/config';
import {
    collection, doc, getDoc, setDoc, updateDoc,
    increment, getCountFromServer, query, where, getDocs
} from 'firebase/firestore';

const ANALYTICS_COLLECTION = 'analytics';

// 1. Registrar Interacción (CONTACTO REAL) segmentada por dispositivo.
// Una "interacción" = una persona que llegó y usó el kiosco (sesión de
// contacto), NO cada toque individual. Quién decide cuándo abrir una sesión
// es TotemContext (primer toque tras el periodo sin actividad).
export const recordInteraction = async (deviceId = 'unknown') => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const docRef = doc(db, ANALYTICS_COLLECTION, today);

        // Estructura: documento por día
        // Campos:
        // - interactions: contactos reales del día (global)
        // - devices: { deviceId: conteo }  (mapa anidado real)
        const safeDeviceId = deviceId.replace(/\./g, '_');
        await setDoc(docRef, {
            date: today,
            interactions: increment(1),
            devices: { [safeDeviceId]: increment(1) }
        }, { merge: true });

    } catch (error) {
        console.error("Error recording interaction:", error);
    }
};

// 1b. Registrar TOQUES (profundidad de uso) en lote.
// Los toques individuales de una misma sesión se acumulan en el cliente y se
// escriben aquí de a montones (no 1 write por tap) para no disparar costos.
export const recordTaps = async (deviceId = 'unknown', count = 1) => {
    const clamped = Math.max(0, Math.floor(Number(count) || 0));
    if (clamped === 0) return;
    try {
        const today = new Date().toISOString().split('T')[0];
        const docRef = doc(db, ANALYTICS_COLLECTION, today);
        const safeDeviceId = deviceId.replace(/\./g, '_');
        await setDoc(docRef, {
            date: today,
            taps: increment(clamped),
            devicesTaps: { [safeDeviceId]: increment(clamped) }
        }, { merge: true });
    } catch (error) {
        console.error("Error recording taps:", error);
    }
};

// 2. Obtener estadísticas de la semana (Gráfica)
export const getWeeklyStats = async () => {
    try {
        const stats = [];
        const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

        // Iteramos los últimos 7 días (incluyendo hoy)
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = i === 0 ? 'Hoy' : days[d.getDay()];

            const docRef = doc(db, ANALYTICS_COLLECTION, dateStr);
            const docSnap = await getDoc(docRef);

            stats.push({
                name: dayName,
                'Interacciones': docSnap.exists() ? docSnap.data().interactions || 0 : 0,
                'Toques': docSnap.exists() ? docSnap.data().taps || 0 : 0
            });
        }
        return stats;

    } catch (error) {
        console.error("Error fetching weekly stats:", error);
        // Retornar estructura vacía para evitar crasheos
        return Array(7).fill({ name: '-', 'Interacciones': 0 });
    }
};

// 3. Obtener conteos para tarjetas (KPIs)
export const getDashboardCounts = async () => {
    try {
        // Usuarios
        const usersColl = collection(db, 'users');
        const usersSnapshot = await getCountFromServer(usersColl);

        // Campañas Activas (Requiere query, getCountFromServer soporta querys en versiones recientes, 
        // pero por seguridad haremos getDocs ya que son pocas)
        const campaignsColl = collection(db, 'campaigns');
        const q = query(campaignsColl, where('status', '==', 'active'));
        const campaignsSnapshot = await getCountFromServer(q);

        return {
            users: usersSnapshot.data().count,
            activeCampaigns: campaignsSnapshot.data().count
        };

    } catch (error) {
        console.error("Error fetching dashboard counts:", error);
        return { users: 0, activeCampaigns: 0 };
    }
};

// 4. Obtener estadísticas Mensuales (30 días)
export const getMonthlyStats = async () => {
    try {
        const stats = [];
        const now = new Date();

        // Iteramos los últimos 30 días
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // Formato corto para la fecha en el eje X (ej: "08 Dic")
            const dayStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

            const docRef = doc(db, ANALYTICS_COLLECTION, dateStr);
            const docSnap = await getDoc(docRef);

            stats.push({
                date: dayStr,
                fullDate: dateStr,
                'Interacciones': docSnap.exists() ? docSnap.data().interactions || 0 : 0,
                'Toques': docSnap.exists() ? docSnap.data().taps || 0 : 0
            });
        }
        return stats;
    } catch (error) {
        console.error("Error fetching monthly stats:", error);
        return [];
    }
};

// 5. Resumen de Campañas (Estado)
export const getCampaignSummary = async () => {
    try {
        const campaignsColl = collection(db, 'campaigns');
        const snapshot = await getDocs(campaignsColl);

        let active = 0;
        let paused = 0;
        let inactive = 0;

        snapshot.forEach(doc => {
            const status = doc.data().status;
            if (status === 'active') active++;
            else if (status === 'paused') paused++;
            else inactive++;
        });

        return [
            { name: 'Activas', value: active, color: '#10B981' }, // Green
            { name: 'Pausadas', value: paused, color: '#F59E0B' }, // Yellow
            { name: 'Inactivas', value: inactive, color: '#EF4444' }, // Red
        ];

    } catch (error) {
        console.error("Error fetching campaign summary:", error);
        return [];
    }
};