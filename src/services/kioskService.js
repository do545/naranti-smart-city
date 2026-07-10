import { db } from '@/firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'kiosks';

export const getKiosks = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

export const addKiosk = async (data) => {
  await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    status: 'active',
    createdAt: serverTimestamp()
  });
};

export const deleteKiosk = async (id) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};