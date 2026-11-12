import React, { useState } from 'react';
import { AccountMenu } from './AccountMenu';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  hasAssessment: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  hasAssessment,
}) => {
  const { user, openAuthModal } = useAuth();
  // If no user is logged in, ALWAYS enforce landing page mode in navigation
  const isLanding = activeTab === 'landing' || !user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (!isLanding) {
      onSelectTab('landing');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTabSelect = (tab: string) => {
    setMobileMenuOpen(false);
    if (tab !== 'landing' && !user) {
      openAuthModal('signin');
      return;
    }
    onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070B14]/95 backdrop-blur-md border-b border-slate-800/80 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
        {/* Logo Zone */}
        <button
          onClick={() => {
            onSelectTab(user ? 'home' : 'landing');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 text-left focus:outline-none group shrink-0 cursor-pointer"
          title="Compass Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#00DF89] text-[#070B14] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
            ◬
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white leading-none">
              Compass
            </span>
            <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
              CAREER OS FOR MBAS
            </span>
          </div>
        </button>

        {/* LANDING PAGE HEADER NAVIGATION (Desktop) */}
        {isLanding ? (
          <>
            <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-xs font-medium text-slate-300">
              <button
                onClick={() => scrollToSection('pain-points')}
                className="hover:text-[#00DF89] transition-colors cursor-pointer"
              >
                Why Compass
              </button>
              <button
                onClick={() => scrollToSection('simulators')}
                className="hover:text-[#00DF89] transition-colors cursor-pointer"
              >
                Live Simulators
              </button>
              <button
                onClick={() => scrollToSection('tools')}
                className="hover:text-[#00DF89] transition-colors cursor-pointer"
              >
                Product
              </button>
              <button
                onClick={() => scrollToSection('comparison')}
                className="hover:text-[#00DF89] transition-colors cursor-pointer"
              >
                Comparison
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="hover:text-[#00DF89] transition-colors cursor-pointer"
              >
                FAQ
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="hover:text-[#00DF89] transition-colors cursor-pointer"
              >
                Contact
              </button>
            </nav>

            <div className="hidden sm:flex items-center gap-3">
              {user && (
                <button
                  onClick={() => onSelectTab('home')}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span>Dashboard</span>
                  <span>→</span>
                </button>
              )}
              <AccountMenu onNavigateTab={handleTabSelect} />
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex sm:hidden items-center gap-2">
              {user && (
                <button
                  onClick={() => onSelectTab('home')}
                  className="px-2.5 py-1 text-xs font-bold text-slate-950 bg-[#00DF89] rounded-lg cursor-pointer"
                >
                  Dashboard
                </button>
              )}
              <AccountMenu onNavigateTab={handleTabSelect} />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-900 focus:outline-none cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </>
        ) : (
          /* IN-APP HEADER NAVIGATION (Desktop & Tablet) - ONLY SHOWN IF AUTHENTICATED */
          <>
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleTabSelect('home')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'home' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleTabSelect('assess')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'assess' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Assessment
              </button>
              <button
                onClick={() => handleTabSelect('resume')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'resume' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Resume Studio
              </button>
              <button
                onClick={() => handleTabSelect('match')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'match' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Job Match
              </button>
              <button
                onClick={() => handleTabSelect('target')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'target' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                People & Target
              </button>
              <button
                onClick={() => handleTabSelect('company')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'company' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Company Prep
              </button>
            </nav>

            {/* In-app action buttons */}
            <div className="flex items-center gap-2.5">
              <AccountMenu onNavigateTab={handleTabSelect} />
            </div>
          </>
        )}
      </div>

      {/* Mobile Drawer Dropdown for Landing Page */}
      {isLanding && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#070B14] px-4 py-4 space-y-3 animate-fade-in text-xs font-medium text-slate-300">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => scrollToSection('pain-points')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200 cursor-pointer"
            >
              Why Compass
            </button>
            <button
              onClick={() => scrollToSection('simulators')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200 cursor-pointer"
            >
              Live Simulators
            </button>
            <button
              onClick={() => scrollToSection('tools')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200 cursor-pointer"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('comparison')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200 cursor-pointer"
            >
              Comparison
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200 cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200 cursor-pointer"
            >
              Contact
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSelectTab('home');
                  }}
                  className="w-full py-2.5 text-center font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Go to Dashboard →
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signin');
                  }}
                  className="w-full py-2.5 text-center font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Start free
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signup');
                  }}
                  className="w-full py-2.5 text-center font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Sign Up Free →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* In-app Mobile Tab Bar - STRICTLY ONLY SHOWN IF AUTHENTICATED */}
      {!isLanding && user && (
        <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-800/80 overflow-x-auto text-xs font-medium text-slate-400 scrollbar-none bg-[#070B14]">
          <button
            onClick={() => handleTabSelect('home')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'home' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleTabSelect('assess')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'assess' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Assess
          </button>
          <button
            onClick={() => handleTabSelect('resume')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'resume' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Resume
          </button>
          <button
            onClick={() => handleTabSelect('match')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'match' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Match
          </button>
          <button
            onClick={() => handleTabSelect('target')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'target' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Target
          </button>
          <button
            onClick={() => handleTabSelect('company')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'company' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Companies
          </button>
        </div>
      )}
    </header>
  );
};
