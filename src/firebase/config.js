import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { enableMultiTabIndexedDbPersistence, getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyA_Gq-IioC2xongFM6-slUSXa5dMRdzwbY",
  authDomain: "naranti-smartcity.firebaseapp.com",
  projectId: "naranti-smartcity",
  storageBucket: "naranti-smartcity.firebasestorage.app",
  messagingSenderId: "519679400877",
  appId: "1:519679400877:web:75dfb09f094de251e0df24"
};

// 1. Inicializar
const app = initializeApp(firebaseConfig);

// 1.1 App Check (recomendado en producción)
if (typeof window !== 'undefined' && !window.__NARANTI_APPCHECK_INITIALIZED__) {
  window.__NARANTI_APPCHECK_INITIALIZED__ = true;

  // Debug token (solo DEV). Útil para localhost/staging.
  const debugToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
  if (import.meta.env.DEV && debugToken) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken === 'true' ? true : debugToken;
  }

  const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
  if (siteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log('✅ Firebase App Check inicializado');
    } catch (error) {
      console.warn('⚠️ Firebase App Check no se pudo inicializar:', error);
    }
  } else if (import.meta.env.DEV) {
    console.warn('ℹ️ App Check no configurado (falta VITE_FIREBASE_APPCHECK_SITE_KEY).');
  }
}

// 2. Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// ✅ Firestore multi-tab offline persistence
// This helps keep role/config data available after a reload when the device loses internet
// across multiple tabs.
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((error) => {
    console.warn('⚠️ Firestore multi-tab persistence not enabled:', error?.code || error);
  });
}

// 3. Exportar app por defecto
export default app;

console.log("✅ Firebase Conectado (Limpio)");