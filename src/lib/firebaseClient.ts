import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

// Safely discover local firebase config if present (ignored in git)
const localConfigs = import.meta.glob('../../firebase-applet-config.json', { eager: true }) as Record<string, any>;
const localFileConfig = Object.values(localConfigs)[0]?.default || Object.values(localConfigs)[0] || {};

const rawApiKey = String(import.meta.env.VITE_FIREBASE_API_KEY || localFileConfig.apiKey || '').trim();
const rawAuthDomain = String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localFileConfig.authDomain || '').trim();
const rawProjectId = String(import.meta.env.VITE_FIREBASE_PROJECT_ID || localFileConfig.projectId || '').trim();
const rawStorageBucket = String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localFileConfig.storageBucket || '').trim();
const rawMessagingSenderId = String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localFileConfig.messagingSenderId || '').trim();
const rawAppId = String(import.meta.env.VITE_FIREBASE_APP_ID || localFileConfig.appId || '').trim();

function isPlaceholderValue(val: string): boolean {
  if (!val) return true;
  const upper = val.toUpperCase();
  return (
    upper.includes('MASKED') ||
    upper.startsWith('YOUR_') ||
    upper === 'COMPASS-APP' ||
    val === '1234567890' ||
    val === '1:1234567890:web:abcdef123456'
  );
}

export const isFirebaseConfigured: boolean =
  !isPlaceholderValue(rawApiKey) &&
  rawApiKey.startsWith('AIza') &&
  !isPlaceholderValue(rawProjectId) &&
  !isPlaceholderValue(rawAppId);

const databaseId =
  String(
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    localFileConfig.firestoreDatabaseId ||
    ''
  ).trim() || undefined;

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey: rawApiKey,
    authDomain: rawAuthDomain || `${rawProjectId}.firebaseapp.com`,
    projectId: rawProjectId,
    storageBucket: rawStorageBucket || `${rawProjectId}.firebasestorage.app`,
    messagingSenderId: rawMessagingSenderId,
    appId: rawAppId,
  };

  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  authInstance = getAuth(appInstance);
  dbInstance = databaseId ? getFirestore(appInstance, databaseId) : getFirestore(appInstance);
  googleProviderInstance = new GoogleAuthProvider();

  // Validate Firestore connection on startup when configured
  (async () => {
    try {
      if (dbInstance) {
        await getDocFromServer(doc(dbInstance, 'test', 'connection'));
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('Firestore client is offline. Local storage fallback remains active.');
      }
    }
  })();
}

export function isFirebaseConfigError(err: any): boolean {
  const code = String(err?.code || '').toLowerCase();
  const message = String(err?.message || '').toLowerCase();
  return (
    code.includes('api-key-not-valid') ||
    code.includes('invalid-api-key') ||
    code.includes('operation-not-allowed') ||
    code.includes('configuration-not-found') ||
    code.includes('app-not-authorized') ||
    code.includes('project-not-found') ||
    message.includes('api-key-not-valid') ||
    message.includes('invalid-api-key') ||
    message.includes('operation-not-allowed') ||
    message.includes('configuration-not-found')
  );
}

export const app: FirebaseApp | null = appInstance;
export const auth: Auth | null = authInstance;
export const db: Firestore | null = dbInstance;
export const googleProvider: GoogleAuthProvider | null = googleProviderInstance;
