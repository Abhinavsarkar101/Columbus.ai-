import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { MigrationModal } from './components/MigrationModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { SAMPLE_MBA_RESUME, EMPTY_RESUME_DATA } from './lib/resume';
import { storageService } from './lib/storageService';
import { Assess } from './pages/Assess';
import { Company } from './pages/Company';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { Match } from './pages/Match';
import { ResumePage } from './pages/ResumePage';
import { SelfTestPage } from './pages/SelfTestPage';
import { Target } from './pages/Target';
import { useAuth } from './context/AuthContext';
import { ResumeData } from './types';

function AppContent() {
  const { user, loading } = useAuth();

  const getRouteFromHash = (): string => {
    const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (['landing', 'home', 'assess', 'resume', 'match', 'target', 'company', 'selftest'].includes(hash)) {
      return hash;
    }
    return 'landing';
  };

  const [currentTab, setCurrentTab] = useState<string>(getRouteFromHash());

  // In-memory candidate resume data (persisted per user)
  const [resumeData, setResumeData] = useState<ResumeData>(SAMPLE_MBA_RESUME);

  // Load user's saved resume when active user changes
  useEffect(() => {
    let isMounted = true;
    async function loadResume() {
      if (user) {
        const saved = await storageService.getUserResume(user.uid);
        if (saved && isMounted) {
          setResumeData(saved);
        } else if (isMounted) {
          // New user sign up: clean empty resume
          const cleanResume = {
            ...EMPTY_RESUME_DATA,
            fullName: user.displayName || user.email?.split('@')[0] || '',
            email: user.email || '',
          };
          setResumeData(cleanResume);
          await storageService.saveUserResume(user.uid, cleanResume);
        }
      } else {
        setResumeData(SAMPLE_MBA_RESUME);
      }
    }
    loadResume();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleUpdateResume = (updated: ResumeData) => {
    setResumeData(updated);
    if (user) {
      storageService.saveUserResume(user.uid, updated);
    }
  };

  // Listen to hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentTab(getRouteFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    window.location.hash = tab === 'landing' ? '' : `#${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentTab === 'selftest') {
    return <SelfTestPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 font-sans selection:bg-[#00DF89] selection:text-slate-950">
      <EmailVerificationBanner />
      {/* Top Bar Header Navigation */}
      <Navigation
        activeTab={currentTab}
        onSelectTab={handleNavigate}
        hasAssessment={true}
      />

      {/* Main Routed Page Content */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <Landing
            onNavigateTab={handleNavigate}
          />
        )}

        {currentTab === 'home' && (
          <Home
            resumeData={resumeData}
            onNavigateTab={handleNavigate}
          />
        )}

        {currentTab === 'assess' && (
          <Assess />
        )}

        {currentTab === 'resume' && (
          <ResumePage
            resumeData={resumeData}
            onUpdateResume={handleUpdateResume}
            onNavigateTab={handleNavigate}
          />
        )}

        {currentTab === 'match' && (
          <Match
            resumeData={resumeData}
            onUpdateResume={handleUpdateResume}
            onNavigateTab={handleNavigate}
          />
        )}

        {currentTab === 'target' && (
          <Target
            onNavigateTab={handleNavigate}
          />
        )}

        {currentTab === 'company' && (
          <Company
            onNavigateTab={handleNavigate}
          />
        )}
      </main>

      {/* Global Minimal In-App Footer (shown when inside tools) */}
      {currentTab !== 'landing' && (
        <footer className="py-4 border-t border-slate-800/80 bg-[#070B14] text-xs text-slate-500 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Compass</span>
              <span className="text-slate-700">·</span>
              <span>MBA Career Operating System</span>
            </div>
          </div>
        </footer>
      )}

      <AuthModal />
      <MigrationModal />
      <DeleteAccountModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

