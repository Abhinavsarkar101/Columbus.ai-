import React from 'react';
import { AssessmentState, ResumeData } from '../types';

interface HomeProps {
  assessmentState?: AssessmentState;
  resumeData?: ResumeData;
  onNavigateTab: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigateTab, resumeData }) => {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-10 shadow-2xl">
          <div className="max-w-2xl space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#00DF89]/10 text-[#00DF89] border border-[#00DF89]/30">
              MBA Career Operating System
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Welcome to Compass
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Plan your specialization, calibrate role readiness, optimize your resume for ATS screening, and prepare for top-tier company interviews.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Assessment */}
          <div
            onClick={() => onNavigateTab('assess')}
            className="group bg-slate-900/90 border border-slate-800 hover:border-[#00DF89] rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/20"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-lg font-bold text-[#00DF89] group-hover:scale-110 transition-transform">
                🧭
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00DF89] transition-colors">
                Diagnostic Assessment
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Four targeted tracks: personality archetypes, dual specialization check, role shortlist, and 90-day readiness calibration.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-[#00DF89] flex items-center gap-1">
              <span>Start Assessment</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 2: Resume Studio */}
          <div
            onClick={() => onNavigateTab('resume')}
            className="group bg-slate-900/90 border border-slate-800 hover:border-[#00DF89] rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/20"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-lg font-bold text-[#00DF89] group-hover:scale-110 transition-transform">
                📄
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00DF89] transition-colors">
                Resume Studio
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Build ATS-ready resumes with quantified XYZ bullet formulas, live PDF export, and parsing compliance checks.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-[#00DF89] flex items-center gap-1">
              <span>Open Resume Studio</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 3: Job Match */}
          <div
            onClick={() => onNavigateTab('match')}
            className="group bg-slate-900/90 border border-slate-800 hover:border-[#00DF89] rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/20"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-lg font-bold text-[#00DF89] group-hover:scale-110 transition-transform">
                🎯
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00DF89] transition-colors">
                Job Description Matcher
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste any job description to discover matched keywords, weak phrasing, missing requirements, and recommended rewrites.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-[#00DF89] flex items-center gap-1">
              <span>Analyze Match</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 4: People & Target */}
          <div
            onClick={() => onNavigateTab('target')}
            className="group bg-slate-900/90 border border-slate-800 hover:border-[#00DF89] rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/20"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-lg font-bold text-[#00DF89] group-hover:scale-110 transition-transform">
                👥
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00DF89] transition-colors">
                People & Target Outreach
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate high-conversion LinkedIn search filters for peers, hiring managers, and alumni with proven cold message templates.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-[#00DF89] flex items-center gap-1">
              <span>Plan Outreach</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 5: Company Prep */}
          <div
            onClick={() => onNavigateTab('company')}
            className="group bg-slate-900/90 border border-slate-800 hover:border-[#00DF89] rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/20"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-lg font-bold text-[#00DF89] group-hover:scale-110 transition-transform">
                🏢
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00DF89] transition-colors">
                Company Interview Prep
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interview rounds, pay bands, culture ratings, insider tips, and common pitfalls for McKinsey, BCG, Google, Amazon, and more.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-[#00DF89] flex items-center gap-1">
              <span>View Dossiers</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
