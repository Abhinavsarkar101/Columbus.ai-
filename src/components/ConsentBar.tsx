import React, { useState, useEffect } from 'react';

const CONSENT_STORAGE_KEY = 'compass.analytics.consent.v1';

export const ConsentBar: React.FC = () => {
  const [consentState, setConsentState] = useState<'pending' | 'granted' | 'denied'>('granted');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) {
        setConsentState('pending');
      } else {
        setConsentState(stored === 'granted' ? 'granted' : 'denied');
      }
    } catch {
      setConsentState('denied');
    }
  }, []);

  const handleGrant = () => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    } catch {
      // ignore
    }
    setConsentState('granted');
  };

  const handleDeny = () => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    } catch {
      // ignore
    }
    setConsentState('denied');
  };

  if (consentState !== 'pending') {
    return null;
  }

  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex-1 pr-4">
          <span className="font-semibold text-white">Privacy & Analytics: </span>
          Compass collects zero personally identifiable data. We only track 3 funnel events (assessment started, report completed, and resume exported) to measure whether this tool genuinely helps MBA students. No cookies, no session recording, and no third-party ad trackers.
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGrant}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-500 transition-colors"
          >
            Allow analytics
          </button>
          <button
            onClick={handleDeny}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-medium hover:bg-slate-700 transition-colors"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
};
