import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
  isFirebaseConfigError
} from '../lib/firebaseClient';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { isDisposableEmail } from '../lib/authPolicy';
import { storageService } from '../lib/storageService';
import { EMPTY_RESUME_DATA } from '../lib/resume';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  providerData?: any[];
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isVerified: boolean;
  isCloudAccount: boolean;
  firebaseReady: boolean;
  authModalOpen: boolean;
  authModalMode: 'signin' | 'signup' | 'forgot';
  openAuthModal: (mode?: 'signin' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string, newPassword?: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  verificationCooldown: number;
  migrationPromptOpen: boolean;
  confirmMigration: () => void;
  dismissMigration: () => void;
  authError: string | null;
  authNotice: string | null;
  clearAuthMessages: () => void;
  deleteModalOpen: boolean;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password + '_compass_salt_2026');
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function readLocalAccounts(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem('compass_accounts') || '{}') || {};
  } catch {
    return {};
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [verificationCooldown, setVerificationCooldown] = useState<number>(0);
  const [migrationPromptOpen, setMigrationPromptOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    const restoreLocalSession = () => {
      const storedLocal = localStorage.getItem('compass_active_user');
      if (storedLocal) {
        try {
          setUser(JSON.parse(storedLocal));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    if (!isFirebaseConfigured || !auth) {
      restoreLocalSession();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified,
          providerData: firebaseUser.providerData,
        });
        setLoading(false);

        // Check if first sign-in and local data exists for migration prompt
        if (!localStorage.getItem('compass_migrated_to_cloud')) {
          const hasLocalData = localStorage.getItem('compass_resumes') || localStorage.getItem('compass_jobs');
          if (hasLocalData) {
            setMigrationPromptOpen(true);
          }
        }
      } else {
        restoreLocalSession();
      }
    });
    return () => unsubscribe();
  }, []);

  // Cooldown timer for resend verification
  useEffect(() => {
    if (verificationCooldown > 0) {
      const timer = setTimeout(() => setVerificationCooldown(verificationCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [verificationCooldown]);

  const clearAuthMessages = () => {
    setAuthError(null);
    setAuthNotice(null);
  };

  const openAuthModal = (mode: 'signin' | 'signup' | 'forgot' = 'signin') => {
    clearAuthMessages();
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    clearAuthMessages();
  };

  const openDeleteModal = () => {
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  const formatFirebaseError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try signing in or resetting your password.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect password or email. Please check your credentials.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts — try again later.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled.';
      case 'auth/popup-blocked':
        return 'Popup was blocked by your browser. Please allow popups or sign in with Email & Password.';
      case 'auth/unauthorized-domain':
        return `This domain (${window.location.hostname}) is not authorized for Google Sign-In in Firebase Console. You can sign in using Email & Password above.`;
      case 'auth/network-request-failed':
        return 'Network error — please check your internet connection and try again.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 8 characters with letters and numbers.';
      default:
        return err?.message || 'An authentication error occurred. Please try again.';
    }
  };

  const localSignUp = async (cleanEmail: string, pass: string, name?: string) => {
    const existingAccounts = readLocalAccounts();
    if (existingAccounts[cleanEmail]) {
      const msg = 'This email is already registered. Try signing in or resetting your password.';
      setAuthError(msg);
      throw new Error(msg);
    }

    const pwdHash = await hashPassword(pass);
    const uid = 'usr_' + Math.random().toString(36).substring(2, 10);
    const localUser: AppUser = {
      uid,
      email: cleanEmail,
      displayName: name?.trim() || cleanEmail.split('@')[0],
      emailVerified: true,
      providerData: [{ providerId: 'password', email: cleanEmail }],
    };

    existingAccounts[cleanEmail] = {
      ...localUser,
      passwordHash: pwdHash,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('compass_accounts', JSON.stringify(existingAccounts));
    localStorage.setItem('compass_active_user', JSON.stringify(localUser));
    setUser(localUser);

    await storageService.resetUserDataOnSignup(uid, {
      ...EMPTY_RESUME_DATA,
      fullName: localUser.displayName || '',
      email: cleanEmail,
    });

    setAuthNotice('Account created successfully! Welcome to Compass.');
    closeAuthModal();
    window.location.hash = '#home';
  };

  const localSignIn = async (cleanEmail: string, pass: string) => {
    const existingAccounts = readLocalAccounts();
    const account = existingAccounts[cleanEmail];
    if (!account) {
      const msg = 'No account found with this email address. Please sign up.';
      setAuthError(msg);
      throw new Error(msg);
    }

    const pwdHash = await hashPassword(pass);
    if (account.passwordHash !== pwdHash) {
      const msg = 'Incorrect password or email. Please check your credentials.';
      setAuthError(msg);
      throw new Error(msg);
    }

    const localUser: AppUser = {
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      emailVerified: true,
      providerData: [{ providerId: 'password', email: account.email }],
    };

    localStorage.setItem('compass_active_user', JSON.stringify(localUser));
    setUser(localUser);
    closeAuthModal();
    window.location.hash = '#home';
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    clearAuthMessages();
    const cleanEmail = email.trim().toLowerCase();
    if (isDisposableEmail(cleanEmail)) {
      throw new Error('Please use a permanent email address — temporary email services aren\'t supported.');
    }
    if (pass.length < 8 || !/[a-zA-Z]/.test(pass) || !/[0-9]/.test(pass)) {
      throw new Error('Password must be at least 8 characters and include at least one letter and one number.');
    }

    if (!isFirebaseConfigured || !auth) {
      await localSignUp(cleanEmail, pass, name);
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
      if (cred.user) {
        try {
          await sendEmailVerification(cred.user);
        } catch {}
      }
      await storageService.resetUserDataOnSignup(cred.user.uid, {
        ...EMPTY_RESUME_DATA,
        fullName: name || cleanEmail.split('@')[0],
        email: cleanEmail,
      });

      setAuthNotice('Account created successfully! Verification email sent.');
      closeAuthModal();
      window.location.hash = '#home';
    } catch (err: any) {
      if (isFirebaseConfigError(err)) {
        await localSignUp(cleanEmail, pass, name);
        return;
      }

      const msg = formatFirebaseError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    clearAuthMessages();
    const cleanEmail = email.trim().toLowerCase();

    if (!isFirebaseConfigured || !auth) {
      await localSignIn(cleanEmail, pass);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
      closeAuthModal();
      window.location.hash = '#home';
    } catch (err: any) {
      if (isFirebaseConfigError(err)) {
        await localSignIn(cleanEmail, pass);
        return;
      }

      // If user previously registered a local fallback account, allow signing in with it
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        const existingAccounts = readLocalAccounts();
        if (existingAccounts[cleanEmail]) {
          await localSignIn(cleanEmail, pass);
          return;
        }
      }

      const msg = formatFirebaseError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signInWithGoogle = async () => {
    clearAuthMessages();
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      const msg = 'Google Sign-In requires Firebase cloud configuration on this host. Please sign up or sign in using your Email & Password above.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const uid = cred.user.uid;
      const existingResume = await storageService.getUserResume(uid);
      if (!existingResume) {
        await storageService.resetUserDataOnSignup(uid, {
          ...EMPTY_RESUME_DATA,
          fullName: cred.user.displayName || cred.user.email?.split('@')[0] || '',
          email: cred.user.email || '',
        });
      }
      closeAuthModal();
      window.location.hash = '#home';
    } catch (err: any) {
      const msg = isFirebaseConfigError(err)
        ? 'Google Sign-In is unavailable with the current Firebase configuration. Please use Email & Password above.'
        : formatFirebaseError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    clearAuthMessages();
    localStorage.removeItem('compass_active_user');
    setUser(null);
    if (auth) {
      try {
        await signOut(auth);
      } catch {}
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    const uid = user.uid;
    const cleanEmail = user.email?.toLowerCase().trim();

    await storageService.clearAllUserData(uid);

    if (cleanEmail) {
      try {
        const existingAccounts = readLocalAccounts();
        delete existingAccounts[cleanEmail];
        localStorage.setItem('compass_accounts', JSON.stringify(existingAccounts));
      } catch {}
    }

    if (auth?.currentUser && auth.currentUser.uid === uid) {
      try {
        await deleteUser(auth.currentUser);
      } catch (err) {
        console.warn('Firebase deleteUser error (may require recent login):', err);
        try {
          await signOut(auth);
        } catch {}
      }
    }

    localStorage.removeItem('compass_active_user');
    setUser(null);
    setDeleteModalOpen(false);

    window.location.hash = '';
    window.location.href = '#landing';
    setAuthNotice('Your profile and all data have been permanently deleted.');
  };

  const resetPassword = async (email: string, newPassword?: string) => {
    clearAuthMessages();
    const cleanEmail = email.trim().toLowerCase();
    const existingAccounts = readLocalAccounts();
    const localAccount = existingAccounts[cleanEmail];

    if (!isFirebaseConfigured || !auth || localAccount) {
      if (!localAccount) {
        const msg = 'No account found with this email address.';
        setAuthError(msg);
        throw new Error(msg);
      }
      if (!newPassword) {
        const msg = 'Please enter a new password to reset your local account.';
        setAuthError(msg);
        throw new Error(msg);
      }
      if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        const msg = 'Password must be at least 8 characters and include at least one letter and one number.';
        setAuthError(msg);
        throw new Error(msg);
      }
      existingAccounts[cleanEmail] = {
        ...localAccount,
        passwordHash: await hashPassword(newPassword),
      };
      localStorage.setItem('compass_accounts', JSON.stringify(existingAccounts));
      setAuthNotice('Password updated! You can now sign in with your new password.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setAuthNotice('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      const msg = isFirebaseConfigError(err)
        ? 'Email password reset is unavailable without Firebase cloud email configuration.'
        : formatFirebaseError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const resendVerification = async () => {
    if (!auth?.currentUser || verificationCooldown > 0) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationCooldown(60);
      setAuthNotice('Verification email resent successfully.');
    } catch (err: any) {
      setAuthError(formatFirebaseError(err));
    }
  };

  const confirmMigration = () => {
    localStorage.setItem('compass_migrated_to_cloud', 'true');
    setMigrationPromptOpen(false);
  };

  const dismissMigration = () => {
    localStorage.setItem('compass_migrated_to_cloud', 'true');
    setMigrationPromptOpen(false);
  };

  const isGoogle = user?.providerData?.some(p => p.providerId === 'google.com') || false;
  const isVerified = !!user && (user.emailVerified || isGoogle);
  const isCloudAccount = isFirebaseConfigured && !!user && !user.uid.startsWith('usr_');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isVerified,
        isCloudAccount,
        firebaseReady: isFirebaseConfigured,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        resetPassword,
        resendVerification,
        verificationCooldown,
        migrationPromptOpen,
        confirmMigration,
        dismissMigration,
        authError,
        authNotice,
        clearAuthMessages,
        deleteModalOpen,
        openDeleteModal,
        closeDeleteModal,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
