import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { isDisposableEmail } from '../lib/authPolicy';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    authError,
    authNotice,
    clearAuthMessages
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  // Inline password validation checks
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthMessages();

    if (authModalMode === 'signup') {
      if (isDisposableEmail(email)) {
        setLocalError('Please use a permanent email address — temporary email services aren\'t supported.');
        return;
      }
      if (!hasMinLength || !hasLetter || !hasNumber) {
        setLocalError('Password must be at least 8 characters and include at least one letter and one number.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (authModalMode === 'signin') {
        await signInWithEmail(email, password);
      } else if (authModalMode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else if (authModalMode === 'forgot') {
        await resetPassword(email);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setLocalError(null);
    clearAuthMessages();
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0E1526] border border-slate-800 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6 relative">
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#00DF89]/10 border border-[#00DF89]/30 text-[#00DF89] mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {authModalMode === 'signin' && 'Welcome Back'}
            {authModalMode === 'signup' && 'Create Your Account'}
            {authModalMode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {authModalMode === 'signin' && 'Sign in to sync your resumes and job matches across devices.'}
            {authModalMode === 'signup' && 'Sign up to secure your data and access cloud sync.'}
            {authModalMode === 'forgot' && 'Enter your email and we\'ll send you a password reset link.'}
          </p>
        </div>

        {(localError || authError) && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{localError || authError}</span>
          </div>
        )}

        {authNotice && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-[#00DF89]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-[#00DF89]"
              />
            </div>
          </div>

          {authModalMode !== 'forgot' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-[#00DF89]"
                />
              </div>
              {authModalMode === 'signup' && password.length > 0 && (
                <div className="pt-2 space-y-1 text-xs">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                    <span>• At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLetter && hasNumber ? 'text-emerald-400' : 'text-slate-400'}`}>
                    <span>• Includes at least one letter and one number</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {authModalMode === 'signin' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => openAuthModal('forgot')}
                className="text-xs text-[#00DF89] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {authModalMode === 'signin' && 'Sign In'}
                  {authModalMode === 'signup' && 'Create Account'}
                  {authModalMode === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {authModalMode !== 'forgot' && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <span className="relative bg-[#0E1526] px-3 text-xs text-slate-400">or continue with</span>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.2v3.15C3.18 21.31 7.25 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.5-.38-2.27s.13-1.55.38-2.27V6.58H1.2C.44 8.12 0 9.87 0 12s.44 3.88 1.2 5.42l4.08-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.25 0 3.18 2.69 1.2 6.58l4.08 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}

        <div className="text-center text-xs text-slate-400">
          {authModalMode === 'signin' && (
            <p>
              Don't have an account?{' '}
              <button onClick={() => openAuthModal('signup')} className="text-[#00DF89] font-semibold hover:underline cursor-pointer">
                Sign up
              </button>
            </p>
          )}
          {authModalMode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button onClick={() => openAuthModal('signin')} className="text-[#00DF89] font-semibold hover:underline cursor-pointer">
                Sign in
              </button>
            </p>
          )}
          {authModalMode === 'forgot' && (
            <p>
              Remembered your password?{' '}
              <button onClick={() => openAuthModal('signin')} className="text-[#00DF89] font-semibold hover:underline cursor-pointer">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
