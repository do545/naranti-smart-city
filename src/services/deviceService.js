import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';

// We continue using the 'kiosks' collection to preserve existing data, 
// effectively treating it as a 'devices' collection now.
const COLLECTION_NAME = 'kiosks';

export const getDevices = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching devices:", error);
    return [];
  }
};

export const addDevice = async (data) => {
  await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    status: 'active', // Default status
    createdAt: serverTimestamp()
  });
};

export const deleteDevice = async (id) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

export const updateHeartbeat = async (deviceId, extraData = {}) => {
  try {
    const deviceRef = doc(db, COLLECTION_NAME, deviceId);

    // Connection quality info
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const networkInfo = connection ? {
      connectionType: connection.effectiveType || connection.type || 'unknown', // 4g, 3g, 2g, slow-2g
      downlink: connection.downlink || null, // Mbps
      rtt: connection.rtt || null, // ms round-trip
    } : {};

    await setDoc(deviceRef, {
      ...extraData,
      ...networkInfo,
      online: navigator.onLine,
      lastSeen: serverTimestamp(),
      status: 'online'
    }, { merge: true });
  } catch (error) {
    console.error("Error updating heartbeat:", error);
  }
};

export const sendDeviceCommand = async (deviceId, commandType) => {
  try {
    const deviceRef = doc(db, COLLECTION_NAME, deviceId);
    await setDoc(deviceRef, {
      lastCommand: {
        type: commandType,
        id: Math.random().toString(36).substr(2, 9), // ID único para que el listener detecte el cambio
        timestamp: serverTimestamp()
      }
    }, { merge: true });
  } catch (error) {
    console.error("Error sending command:", error);
    throw error;
  }
};

export const uploadScreenCapture = async (deviceId, blob, extraMetadata = {}) => {
  try {
    const storageRef = ref(storage, `screenshots/${deviceId}_${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(storageRef);

    // Actualizamos el documento del dispositivo con la última captura y sus metadatos
    const deviceRef = doc(db, COLLECTION_NAME, deviceId);
    await setDoc(deviceRef, {
      lastScreenshotUrl: url,
      lastScreenshotTime: serverTimestamp(),
      lastScreenshotCampaign: extraMetadata.campaignName || 'Desconocida',
      lastScreenshotMeta: extraMetadata // Guardamos todo por si acaso
    }, { merge: true });

    return url;
  } catch (error) {
    console.error("Error uploading capture:", error);
    throw error;
  }
};

// 6. OBTENER RESUMEN DE FLOTA (Para Admin Dashboard)
export const getFleetStatus = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    let online = 0;
    let offline = 0;
    const latestEvidences = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const lastSeen = data.lastSeen ? data.lastSeen.toDate() : null;
      const isOnline = lastSeen ? (Date.now() - lastSeen) < 120000 : false;

      if (isOnline) online++;
      else offline++;

      if (data.lastScreenshotUrl) {
        latestEvidences.push({
          id: doc.id,
          name: data.name,
          url: data.lastScreenshotUrl,
          lastScreenshotCampaign: data.lastScreenshotCampaign || 'Campaña Desconocida',
          timestamp: data.lastScreenshotTime?.toDate() || new Date(0)
        });
      }
    });

    return {
      total: snapshot.size,
      online,
      offline,
      latestEvidences: latestEvidences.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3)
    };
  } catch (e) {
    console.error("Error fetching fleet status:", e);
    return { total: 0, online: 0, offline: 0, latestEvidences: [] };
  }
};