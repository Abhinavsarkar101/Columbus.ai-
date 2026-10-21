import React, { useMemo } from 'react';
import { DOMAINS } from '../data/domains';
import { calculateBulletMetrics } from '../lib/resume';
import { buildReport } from '../lib/scoring';
import { AssessmentState, ResumeData } from '../types';

interface HomeProps {
  assessmentState: AssessmentState;
  resumeData: ResumeData;
  onNavigateTab: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  assessmentState,
  resumeData,
  onNavigateTab,
}) => {
  const answeredCount = Object.keys(assessmentState.answers).length;
  const isAssessmentComplete = answeredCount >= 14;

  const report = useMemo(() => {
    return buildReport(assessmentState);
  }, [assessmentState]);

  const bulletMetrics = useMemo(() => {
    return calculateBulletMetrics(resumeData);
  }, [resumeData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 bg-[#070B14] text-slate-100">
      {/* Welcome Banner */}
      <div className="bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00DF89] uppercase tracking-wider">
            <span>Career Operating System</span>
            <span aria-hidden="true">·</span>
            <span>MBA Placement Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {resumeData.fullName ? resumeData.fullName.split(' ')[0] : 'Candidate'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Your career cockpit: audit role readiness, calibrate ATS resume bullets, match live job descriptions, and map alumni networks for referrals.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('assess')}
            className="px-5 py-2.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow text-center"
          >
            {answeredCount === 0 ? 'Start Diagnostic →' : 'Resume Assessment →'}
          </button>
          <button
            onClick={() => onNavigateTab('match')}
            className="px-5 py-2.5 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors text-center"
          >
            Match Job Description
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Dominant Domain */}
        <div className="p-5 bg-[#0E1526] rounded-2xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Specialization</div>
          <div className="text-lg font-bold text-white truncate">
            {answeredCount > 0 ? DOMAINS[report.topDomain]?.shortName : 'Pending Diagnostic'}
          </div>
          <div className="text-xs text-slate-400">
            {answeredCount > 0
              ? `${report.domainScores[report.topDomain]}% normalized fit`
              : 'Complete 14 questions to unlock'}
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#00DF89] rounded-full"
              style={{ width: `${answeredCount > 0 ? report.domainScores[report.topDomain] : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Role Readiness Index */}
        <div className="p-5 bg-[#0E1526] rounded-2xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role Readiness</div>
          <div className="text-2xl font-black text-white tabular-nums">
            {report.targetRoleReport ? `${report.targetRoleReport.readinessScore} / 100` : '—'}
          </div>
          <div className="text-xs text-slate-400 truncate">
            Target: {report.targetRoleReport?.role.title || 'Choose a target role'}
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#14B8A6] rounded-full"
              style={{ width: `${report.targetRoleReport?.readinessScore || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Resume Metric Density */}
        <div className="p-5 bg-[#0E1526] rounded-2xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bullet Metrics</div>
          <div className="text-2xl font-black text-white tabular-nums">
            {bulletMetrics.percentage}%
          </div>
          <div className="text-xs text-slate-400">
            {bulletMetrics.quantifiedCount} of {bulletMetrics.totalBullets} bullets quantified
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#06B6D4] rounded-full"
              style={{ width: `${bulletMetrics.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Assessment Diagnostic */}
        <div className="p-5 bg-[#0E1526] rounded-2xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Placement Diagnostics</div>
          <div className="text-xl font-bold text-white truncate">
            {answeredCount > 0 ? `${answeredCount} Answers Logged` : '3 Flow Tracks Ready'}
          </div>
          <div className="text-xs text-slate-400">
            {answeredCount > 0 ? 'Diagnostic in progress' : 'Domain Fit · Role Fit · Readiness'}
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#00DF89] rounded-full"
              style={{ width: `${answeredCount > 0 ? Math.min(100, Math.round((answeredCount / 10) * 100)) : 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 5 TOOL MODULES CARDS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Compass Toolkit Modules</h2>
          <p className="text-xs text-slate-400">Direct access to the five career OS tools.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tool 1 */}
          <div
            onClick={() => onNavigateTab('assess')}
            className="p-6 bg-[#0E1526] rounded-2xl border border-slate-800 hover:border-[#00DF89]/50 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#00DF89]">01. ASSESSMENT</span>
              <h3 className="text-base font-bold text-white">3-Track Diagnostic & Flow</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose your stage: Find Specialization + Dual Major Pairing, Role Selection with Campus Fallbacks, or Role Readiness Check with a 90-Day Execution Plan.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">{answeredCount > 0 ? `${answeredCount} Logged` : 'Select Your Journey'}</span>
              <span className="text-[#00DF89]">Open Diagnostic →</span>
            </div>
          </div>

          {/* Tool 2 */}
          <div
            onClick={() => onNavigateTab('resume')}
            className="p-6 bg-[#0E1526] rounded-2xl border border-slate-800 hover:border-[#00DF89]/50 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#00DF89]">02. RESUME STUDIO</span>
              <h3 className="text-base font-bold text-white">ATS Resume Studio & PDF Exporter</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your existing PDF to auto-fill. Switch between ATS Classic, Modern Split, or Minimal Serif. Download A4 PDFs and plain text.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">{bulletMetrics.percentage}% Quantified</span>
              <span className="text-[#00DF89]">Open Studio →</span>
            </div>
          </div>

          {/* Tool 3 */}
          <div
            onClick={() => onNavigateTab('match')}
            className="p-6 bg-[#0E1526] rounded-2xl border border-slate-800 hover:border-[#00DF89]/50 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#00DF89]">03. JOB MATCH</span>
              <h3 className="text-base font-bold text-white">JD Parsing & ATS Checks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                70-term MBA taxonomy that weights requirements 3× more, flags critical keyword gaps, and rewrites bullets in XYZ format.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">3 Sample JDs</span>
              <span className="text-[#00DF89]">Match JD →</span>
            </div>
          </div>

          {/* Tool 4 */}
          <div
            onClick={() => onNavigateTab('target')}
            className="p-6 bg-[#0E1526] rounded-2xl border border-slate-800 hover:border-[#00DF89]/50 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#00DF89]">04. PEOPLE & TARGET</span>
              <h3 className="text-base font-bold text-white">People Mapping & Outreach</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                6 precision LinkedIn search deep-links, 3-touch personalized message templates, and role-level Glassdoor review analysis with 8 themes.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Tecnotree Demo Active</span>
              <span className="text-[#00DF89]">Open People Map →</span>
            </div>
          </div>

          {/* Tool 5 */}
          <div
            onClick={() => onNavigateTab('company')}
            className="p-6 bg-[#0E1526] rounded-2xl border border-slate-800 hover:border-[#00DF89]/50 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#00DF89]">05. COMPANY PREP</span>
              <h3 className="text-base font-bold text-white">12 Top Recruiter Dossiers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interview rounds (McKinsey Solve, Amazon Bar Raiser), pay benchmarks, culture pros & cons, and an interactive review digest tool.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">12 Employers</span>
              <span className="text-[#00DF89]">Explore Companies →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
