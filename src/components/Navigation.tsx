import React, { useState } from 'react';

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  hasAssessment: boolean;
  onOpenUploadModal?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  hasAssessment,
  onOpenUploadModal,
}) => {
  const isLanding = activeTab === 'landing';
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

  return (
    <header className="sticky top-0 z-40 bg-[#070B14]/95 backdrop-blur-md border-b border-slate-800/80 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
        {/* Logo Zone */}
        <button
          onClick={() => {
            onSelectTab('landing');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 text-left focus:outline-none group shrink-0"
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
                className="hover:text-[#00DF89] transition-colors"
              >
                Why Compass
              </button>
              <button
                onClick={() => scrollToSection('simulators')}
                className="hover:text-[#00DF89] transition-colors"
              >
                Live Simulators
              </button>
              <button
                onClick={() => scrollToSection('tools')}
                className="hover:text-[#00DF89] transition-colors"
              >
                Product
              </button>
              <button
                onClick={() => scrollToSection('comparison')}
                className="hover:text-[#00DF89] transition-colors"
              >
                Comparison
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="hover:text-[#00DF89] transition-colors"
              >
                FAQ
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="hover:text-[#00DF89] transition-colors"
              >
                Contact
              </button>
            </nav>

            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => onSelectTab('home')}
                className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
              >
                Open the app
              </button>
              <button
                onClick={() => onSelectTab('assess')}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] rounded-lg transition-all shadow-sm whitespace-nowrap flex items-center gap-1"
              >
                <span>Start free</span>
                <span>→</span>
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => onSelectTab('home')}
                className="px-3 py-1.5 text-[11px] font-bold text-slate-950 bg-[#00DF89] rounded-lg"
              >
                Open App
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-900 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </>
        ) : (
          /* IN-APP HEADER NAVIGATION (Desktop) */
          <>
            <nav className="hidden lg:flex items-center gap-1 text-xs font-medium bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => onSelectTab('home')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'home' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onSelectTab('assess')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'assess' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Assessment
              </button>
              <button
                onClick={() => onSelectTab('resume')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'resume' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Resume Studio
              </button>
              <button
                onClick={() => onSelectTab('match')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'match' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Job Match
              </button>
              <button
                onClick={() => onSelectTab('target')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'target' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                People & Target
              </button>
              <button
                onClick={() => onSelectTab('company')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'company' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Company Prep
              </button>
            </nav>

            {/* In-app action buttons can go here, like 'Save' or 'Export' */}
          </>
        )}
      </div>

      {/* Mobile Drawer Dropdown for Landing Page */}
      {isLanding && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#070B14] px-4 py-4 space-y-3 animate-fade-in text-xs font-medium text-slate-300">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => scrollToSection('pain-points')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200"
            >
              Why Compass
            </button>
            <button
              onClick={() => scrollToSection('simulators')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200"
            >
              Live Simulators
            </button>
            <button
              onClick={() => scrollToSection('tools')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('comparison')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200"
            >
              Comparison
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-900 text-slate-200"
            >
              Contact
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSelectTab('home');
              }}
              className="w-full py-2.5 text-center font-bold text-slate-200 bg-slate-900 border border-slate-700 rounded-xl"
            >
              Enter Dashboard
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSelectTab('assess');
              }}
              className="w-full py-2.5 text-center font-bold text-slate-950 bg-[#00DF89] rounded-xl"
            >
              Start Diagnostic Free →
            </button>
          </div>
        </div>
      )}

      {/* In-app Mobile Tab Bar */}
      {!isLanding && (
        <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-800/80 overflow-x-auto text-xs font-medium text-slate-400 scrollbar-none bg-[#070B14]">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'home' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('assess')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'assess' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Assess
          </button>
          <button
            onClick={() => onSelectTab('resume')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'resume' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Resume
          </button>
          <button
            onClick={() => onSelectTab('match')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'match' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Match
          </button>
          <button
            onClick={() => onSelectTab('target')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'target' ? 'bg-[#00DF89] text-slate-950 font-bold' : ''
            }`}
          >
            Target
          </button>
          <button
            onClick={() => onSelectTab('company')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
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
