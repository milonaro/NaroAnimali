import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (firebaseAppletConfig as any).apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseAppletConfig as any).authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (firebaseAppletConfig as any).projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseAppletConfig as any).storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseAppletConfig as any).messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (firebaseAppletConfig as any).appId,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Determina il database ID: in sandbox AI Studio usa quello custom, su Vercel/Produzione usa default (undefined) a meno che non sia specificato
let dbId: string | undefined = import.meta.env.VITE_FIREBASE_DATABASE_ID;
if (!dbId) {
  const isSandbox = typeof window !== 'undefined' && (
    window.location.hostname.includes('europe-west2.run.app') || 
    window.location.hostname.includes('localhost') || 
    window.location.hostname.includes('127.0.0.1')
  );
  if (isSandbox) {
    dbId = (firebaseAppletConfig as any).firestoreDatabaseId;
  } else {
    // Su Vercel o domini esterni, usa il database (default) a meno che l'utente non lo imposti in VITE_FIREBASE_DATABASE_ID
    dbId = undefined;
  }
}

export const db = getFirestore(app, dbId || undefined);
export const auth = getAuth(app);
export const storage = getStorage(app);
