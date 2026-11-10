import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider
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
  User,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { isDisposableEmail } from '../lib/authPolicy';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isVerified: boolean;
  authModalOpen: boolean;
  authModalMode: 'signin' | 'signup' | 'forgot';
  openAuthModal: (mode?: 'signin' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  verificationCooldown: number;
  migrationPromptOpen: boolean;
  confirmMigration: () => void;
  dismissMigration: () => void;
  authError: string | null;
  authNotice: string | null;
  clearAuthMessages: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [verificationCooldown, setVerificationCooldown] = useState<number>(0);
  const [migrationPromptOpen, setMigrationPromptOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Check if first sign-in and local data exists for migration prompt
      if (firebaseUser && !localStorage.getItem('compass_migrated_to_cloud')) {
        const hasLocalData = localStorage.getItem('compass_resumes') || localStorage.getItem('compass_jobs');
        if (hasLocalData) {
          setMigrationPromptOpen(true);
        }
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
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 8 characters with letters and numbers.';
      default:
        return err?.message || 'An authentication error occurred. Please try again.';
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    clearAuthMessages();
    if (isDisposableEmail(email)) {
      throw new Error('Please use a permanent email address — temporary email services aren\'t supported.');
    }
    // Password validation rule check
    if (pass.length < 8 || !/[a-zA-Z]/.test(pass) || !/[0-9]/.test(pass)) {
      throw new Error('Password must be at least 8 characters and include at least one letter and one number.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
      if (cred.user) {
        await sendEmailVerification(cred.user);
      }
      setAuthNotice('Account created successfully! Verification email sent. Please check your inbox.');
      closeAuthModal();
      window.location.hash = '#home';
    } catch (err: any) {
      const msg = formatFirebaseError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    clearAuthMessages();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      closeAuthModal();
      window.location.hash = '#home';
    } catch (err: any) {
      const msg = formatFirebaseError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signInWithGoogle = async () => {
    clearAuthMessages();
    try {
      await signInWithPopup(auth, googleProvider);
      closeAuthModal();
      window.location.hash = '#home';
    } catch (err: any) {
      const msg = formatFirebaseError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    clearAuthMessages();
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    clearAuthMessages();
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthNotice('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      const msg = formatFirebaseError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser || verificationCooldown > 0) return;
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
    // Data sync handled automatically by storageService
  };

  const dismissMigration = () => {
    localStorage.setItem('compass_migrated_to_cloud', 'true');
    setMigrationPromptOpen(false);
  };

  const isGoogle = user?.providerData.some(p => p.providerId === 'google.com') || false;
  const isVerified = !!user && (user.emailVerified || isGoogle);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isVerified,
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
        clearAuthMessages
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
