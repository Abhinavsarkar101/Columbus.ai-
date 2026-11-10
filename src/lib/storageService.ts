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
  },

  // Per-User Resume Persistence
  async getUserResume(uid: string): Promise<any | null> {
    if (isUserSynced() && auth.currentUser?.uid === uid) {
      try {
        const docRef = doc(db, 'users', uid, 'resumes', 'current');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data().data;
        }
      } catch (err) {
        console.warn('Firestore resume read failed:', err);
      }
    }
    try {
      const data = localStorage.getItem(`compass_user_resume_${uid}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveUserResume(uid: string, resume: any): Promise<void> {
    try {
      localStorage.setItem(`compass_user_resume_${uid}`, JSON.stringify(resume));
    } catch {}

    if (isUserSynced() && auth.currentUser?.uid === uid) {
      try {
        const docRef = doc(db, 'users', uid, 'resumes', 'current');
        await setDoc(docRef, { data: resume, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Firestore resume save failed:', err);
      }
    }
  },

  // Per-User Job Match Persistence
  async getUserJobMatch(uid: string): Promise<any | null> {
    if (isUserSynced() && auth.currentUser?.uid === uid) {
      try {
        const docRef = doc(db, 'users', uid, 'jobs', 'current_match');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data();
        }
      } catch (err) {
        console.warn('Firestore job match read failed:', err);
      }
    }
    try {
      const data = localStorage.getItem(`compass_jobmatch_${uid}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveUserJobMatch(uid: string, matchData: any): Promise<void> {
    try {
      localStorage.setItem(`compass_jobmatch_${uid}`, JSON.stringify(matchData));
    } catch {}

    if (isUserSynced() && auth.currentUser?.uid === uid) {
      try {
        const docRef = doc(db, 'users', uid, 'jobs', 'current_match');
        await setDoc(docRef, { ...matchData, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Firestore job match save failed:', err);
      }
    }
  },

  // Per-User Assessment Persistence
  async getUserAssessment(uid: string): Promise<any | null> {
    if (isUserSynced() && auth.currentUser?.uid === uid) {
      try {
        const docRef = doc(db, 'users', uid, 'assessment', 'current');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data().tracksState;
        }
      } catch (err) {
        console.warn('Firestore assessment read failed:', err);
      }
    }
    try {
      const data = localStorage.getItem(`compass_assessment_${uid}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveUserAssessment(uid: string, tracksState: any): Promise<void> {
    try {
      localStorage.setItem(`compass_assessment_${uid}`, JSON.stringify(tracksState));
    } catch {}

    if (isUserSynced() && auth.currentUser?.uid === uid) {
      try {
        const docRef = doc(db, 'users', uid, 'assessment', 'current');
        await setDoc(docRef, { tracksState, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Firestore assessment save failed:', err);
      }
    }
  },

  // Reset all module data for a newly registered user
  async resetUserDataOnSignup(uid: string, initialResume: any): Promise<void> {
    try {
      // 1. Set clean resume
      localStorage.setItem(`compass_user_resume_${uid}`, JSON.stringify(initialResume));
      // 2. Clear job match
      localStorage.removeItem(`compass_jobmatch_${uid}`);
      localStorage.removeItem('compass_previously_viewed_jobs');
      // 3. Clear assessment
      localStorage.removeItem(`compass_assessment_${uid}`);
      localStorage.removeItem('compass_assessment_responses');
      localStorage.removeItem('compass_assessment_results');
    } catch {}

    if (isUserSynced() && auth.currentUser?.uid === uid) {
      try {
        const resumeRef = doc(db, 'users', uid, 'resumes', 'current');
        await setDoc(resumeRef, { data: initialResume, updatedAt: new Date().toISOString() });
        const jobRef = doc(db, 'users', uid, 'jobs', 'current_match');
        await deleteDoc(jobRef);
        const assessRef = doc(db, 'users', uid, 'assessment', 'current');
        await deleteDoc(assessRef);
      } catch (err) {
        console.warn('Firestore reset on signup failed:', err);
      }
    }
  },

  // Permanently delete all user data across cloud database and browser storage
  async clearAllUserData(uid: string): Promise<void> {
    // 1. Delete from Firestore if synced
    if (auth.currentUser && auth.currentUser.uid === uid) {
      const subcollections = ['resumes', 'jobs', 'assessment', 'preferences'];
      for (const colName of subcollections) {
        try {
          const colRef = collection(db, 'users', uid, colName);
          const snap = await getDocs(colRef);
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
          }
        } catch (err) {
          console.warn(`Error deleting Firestore collection ${colName}:`, err);
        }
      }
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (e) {}
    }

    // 2. Delete all local storage records for this user
    try {
      localStorage.removeItem(`compass_user_resume_${uid}`);
      localStorage.removeItem(`compass_jobmatch_${uid}`);
      localStorage.removeItem(`compass_assessment_${uid}`);
      localStorage.removeItem('compass_user_resume');
      localStorage.removeItem('compass_previously_viewed_jobs');
      localStorage.removeItem('compass_resumes');
      localStorage.removeItem('compass_jobs');
      localStorage.removeItem('compass_assessment_responses');
      localStorage.removeItem('compass_assessment_results');
      localStorage.removeItem('compass_migrated_to_cloud');
      localStorage.removeItem('compass_preferences');
      localStorage.removeItem('uprezr_resume_data');
      localStorage.removeItem('user_resume');
    } catch (e) {
      console.warn('Error clearing local storage:', e);
    }
  }
};
