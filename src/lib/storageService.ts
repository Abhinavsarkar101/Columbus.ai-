import { db, auth } from './firebaseClient';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { authPolicy } from './authPolicy';

// Rate limit tracker for expensive actions (e.g., Job Match analysis)
let actionTimestamps: number[] = [];
export function checkAndIncrementRateLimit(maxPerMinute = 15): boolean {
  const now = Date.now();
  actionTimestamps = actionTimestamps.filter(t => now - t < 60000);
  if (actionTimestamps.length >= maxPerMinute) {
    return false; // Rate limit exceeded
  }
  actionTimestamps.push(now);
  return true;
}

export function isUserSynced(): boolean {
  const user = auth.currentUser;
  if (!user) return false;
  if (!authPolicy.requireEmailVerificationToSync) return true;
  // Google sign-in users are automatically verified or providerData contains google.com
  const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
  return user.emailVerified || isGoogle;
}

// Generic Storage Service with Firestore + localStorage fallback
export const storageService = {
  async getCollection<T>(collectionName: string, localKey: string): Promise<T[]> {
    if (isUserSynced()) {
      try {
        const uid = auth.currentUser!.uid;
        const colRef = collection(db, 'users', uid, collectionName);
        const snapshot = await getDocs(colRef);
        const items: T[] = [];
        snapshot.forEach(docSnap => {
          items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
        });
        return items;
      } catch (err) {
        console.warn(`Firestore read failed for ${collectionName}, falling back to localStorage:`, err);
      }
    }
    // Fallback to localStorage
    try {
      const data = localStorage.getItem(localKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`localStorage read failed for ${localKey}:`, e);
      return [];
    }
  },

  async saveItem<T extends { id?: string }>(collectionName: string, localKey: string, item: T): Promise<T> {
    const id = item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const itemWithId = { ...item, id, updatedAt: new Date().toISOString() };

    // Always update localStorage first for instant responsiveness and offline caching
    try {
      const existing = await storageService.getCollection<T>(collectionName, localKey);
      const idx = existing.findIndex((x: any) => x.id === id);
      let updated: T[];
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = itemWithId;
      } else {
        updated = [itemWithId, ...existing];
      }
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {
      console.warn(`localStorage save failed for ${localKey}:`, e);
    }

    if (isUserSynced()) {
      try {
        const uid = auth.currentUser!.uid;
        const docRef = doc(db, 'users', uid, collectionName, id);
        await setDoc(docRef, itemWithId, { merge: true });
      } catch (err) {
        console.warn(`Firestore save failed for ${collectionName}/${id}, running offline on localStorage:`, err);
      }
    }

    return itemWithId;
  },

  async deleteItem(collectionName: string, localKey: string, id: string): Promise<void> {
    try {
      const existing = await storageService.getCollection<any>(collectionName, localKey);
      const updated = existing.filter(x => x.id !== id);
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {
      console.warn(`localStorage delete failed for ${localKey}:`, e);
    }

    if (isUserSynced()) {
      try {
        const uid = auth.currentUser!.uid;
        const docRef = doc(db, 'users', uid, collectionName, id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn(`Firestore delete failed for ${collectionName}/${id}:`, err);
      }
    }
  },

  async getPreferences<T>(localKey = 'compass_preferences'): Promise<T | null> {
    if (isUserSynced()) {
      try {
        const uid = auth.currentUser!.uid;
        const docRef = doc(db, 'users', uid, 'preferences', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as T;
        }
      } catch (err) {
        console.warn('Firestore preferences read failed:', err);
      }
    }
    try {
      const data = localStorage.getItem(localKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async savePreferences<T>(prefs: T, localKey = 'compass_preferences'): Promise<void> {
    try {
      localStorage.setItem(localKey, JSON.stringify(prefs));
    } catch (e) {}

    if (isUserSynced()) {
      try {
        const uid = auth.currentUser!.uid;
        const docRef = doc(db, 'users', uid, 'preferences', 'main');
        await setDoc(docRef, { ...prefs, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Firestore preferences save failed:', err);
      }
    }
  }
};
