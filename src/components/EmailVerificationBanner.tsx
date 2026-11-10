import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MailWarning, RefreshCw, X } from 'lucide-react';

export const EmailVerificationBanner: React.FC = () => {
  const { user, isVerified, resendVerification, verificationCooldown } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || isVerified || dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between gap-4 z-40 relative">
      <div className="flex items-center gap-2.5">
        <MailWarning className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Verify your email</strong> ({user.email}) to save your work across devices. Cloud sync is paused until verified.
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={resendVerification}
          disabled={verificationCooldown > 0}
          className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${verificationCooldown > 0 ? 'animate-spin' : ''}`} />
          <span>{verificationCooldown > 0 ? `Resend in ${verificationCooldown}s` : 'Resend Verification'}</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-white cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
