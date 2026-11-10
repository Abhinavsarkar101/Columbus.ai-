import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Safely discover local firebase config if present (ignored in git)
const localConfigs = import.meta.glob('../../firebase-applet-config.json', { eager: true }) as Record<string, any>;
const localFileConfig = Object.values(localConfigs)[0]?.default || Object.values(localConfigs)[0] || {};

// Prioritize environment variables (safe for GitHub/CI), fall back to local config file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localFileConfig.apiKey || 'AIzaSy_MASKED_FOR_GITHUB_PREVIEW',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localFileConfig.authDomain || 'compass-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localFileConfig.projectId || 'compass-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localFileConfig.storageBucket || 'compass-app.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localFileConfig.messagingSenderId || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localFileConfig.appId || '1:1234567890:web:abcdef123456',
};

const databaseId =
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  localFileConfig.firestoreDatabaseId ||
  undefined;

let appInstance: FirebaseApp;
if (getApps().length === 0) {
  appInstance = initializeApp(firebaseConfig);
} else {
  appInstance = getApps()[0];
}

export const app = appInstance;
export const auth: Auth = getAuth(app);
export const db: Firestore = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
