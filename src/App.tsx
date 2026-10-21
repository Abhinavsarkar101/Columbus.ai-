import React, { useState, useEffect } from 'react';
import { ConsentBar } from './components/ConsentBar';
import { Navigation } from './components/Navigation';
import { ResumeUploadModal } from './components/ResumeUploadModal';
import { DEFAULT_RESUME } from './lib/resume';
import { Assess } from './pages/Assess';
import { Company } from './pages/Company';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { Match } from './pages/Match';
import { ResumePage } from './pages/ResumePage';
import { Target } from './pages/Target';
import { AssessmentState, ResumeData } from './types';

const STORAGE_KEY_ASSESSMENT = 'compass.assessment.v1';
const STORAGE_KEY_RESUME = 'compass.resume.v1';
const CONSENT_STORAGE_KEY = 'compass.analytics.consent.v1';

const INITIAL_ASSESSMENT_STATE: AssessmentState = {
  mode: 'domain',
  targetRoleId: 'product_manager',
  answers: {},
  skillRatings: {
    'Product Roadmapping & Prioritization': 75,
    'User Research & Wireframing': 65,
    'Data Analytics & SQL': 80,
    'Cross-functional Team Leadership': 70,
    'Go-to-Market & Launch Strategy': 60,
    'Technical Architecture Literacy': 85,
  },
  experienceText: `Architected digital monetization roadmaps across enterprise client engagements. Built SQL queries and A/B testing models. Defined PRD specifications and backlog grooming in agile sprints. Reduced churn by 5.5% and improved checkout conversion rate.`,
  lastUpdated: new Date().toISOString(),
};

export default function App() {
  // Hash routing - always default to landing unless a hash is explicitly specified
  const getRouteFromHash = (): string => {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (['home', 'assess', 'resume', 'match', 'target', 'company'].includes(hash)) {
      return hash;
    }
    return 'landing';
  };

  const [currentTab, setCurrentTab] = useState<string>(getRouteFromHash());
  const [isGlobalUploadOpen, setIsGlobalUploadOpen] = useState(false);

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

  // Assessment State
  const [assessmentState, setAssessmentState] = useState<AssessmentState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ASSESSMENT);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_ASSESSMENT_STATE;
  });

  const handleUpdateAssessment = (newState: AssessmentState) => {
    setAssessmentState(newState);
    try {
      localStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(newState));
    } catch {
      // ignore
    }
  };

  // Resume State - default to empty/blank if user has not stored or uploaded one yet
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RESUME);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    // If no stored resume, start with clean blank template so no foreign name like Arjun is shown
    return {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      linkedinUrl: '',
      githubOrPortfolio: '',
      summary: '',
      education: [],
      experience: [],
      skills: [
        { category: 'Core Competencies', items: [] },
        { category: 'Tools & Technologies', items: [] },
      ],
      projects: [],
      certifications: [],
      targetDomain: 'product',
    };
  });

  const handleUpdateResume = (newResume: ResumeData) => {
    setResumeData(newResume);
    try {
      localStorage.setItem(STORAGE_KEY_RESUME, JSON.stringify(newResume));
    } catch {
      // ignore
    }
  };

  // Consent toggle state in footer
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CONSENT_STORAGE_KEY) === 'granted';
    } catch {
      return false;
    }
  });

  const toggleAnalyticsConsent = () => {
    const nextVal = !analyticsConsent;
    setAnalyticsConsent(nextVal);
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, nextVal ? 'granted' : 'denied');
    } catch {
      // ignore
    }
  };

  const hasAssessment = Object.keys(assessmentState.answers).length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 font-sans selection:bg-[#00DF89] selection:text-slate-950">
      {/* Global Upload Resume Modal */}
      <ResumeUploadModal
        isOpen={isGlobalUploadOpen}
        onClose={() => setIsGlobalUploadOpen(false)}
        onApplyParsedResume={(parsed) => {
          handleUpdateResume(parsed);
          handleNavigate('resume');
        }}
      />

      {/* Privacy Consent Banner */}
      <ConsentBar />

      {/* Top Bar Header */}
      <Navigation
        activeTab={currentTab}
        onSelectTab={handleNavigate}
        hasAssessment={hasAssessment}
        onOpenUploadModal={() => setIsGlobalUploadOpen(true)}
      />

      {/* Main Routed Page Content */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <Landing
            onStartAssessment={() => handleNavigate('assess')}
            onNavigateTab={handleNavigate}
            onApplyParsedResume={handleUpdateResume}
          />
        )}

        {currentTab === 'home' && (
          <Home
            assessmentState={assessmentState}
            resumeData={resumeData}
            onNavigateTab={handleNavigate}
          />
        )}

        {currentTab === 'assess' && (
          <Assess
            assessmentState={assessmentState}
            onUpdateState={handleUpdateAssessment}
            onNavigateTab={handleNavigate}
          />
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

      {/* Global Footer (Quiet, Minimal, Dark Theme) */}
      <footer className="py-6 border-t border-slate-800/80 bg-[#070B14] text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Compass</span>
            <span className="text-slate-600">·</span>
            <span>MBA Career Operating System</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400/90 font-medium">100% Client-side runtime</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={toggleAnalyticsConsent}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {analyticsConsent ? 'Analytics on · turn off' : 'Analytics off · turn on'}
            </button>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <button
              onClick={() => {
                if (window.confirm('Reset all assessment and resume local storage?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="text-slate-500 hover:text-rose-400 transition-colors"
            >
              Reset local data
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
