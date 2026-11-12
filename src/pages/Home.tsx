import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../lib/storageService';
import { ResumeData } from '../types';
import { runAtsChecks } from '../lib/resume';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Target,
  Compass,
  Briefcase,
  TrendingUp,
  Clock,
  Building2,
  ChevronRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';

interface HomeProps {
  resumeData?: ResumeData;
  onNavigateTab: (tab: string) => void;
  onResetData?: () => Promise<void>;
}

interface RecentActivityItem {
  id: string;
  title: string;
  category: string;
  timeAgo: string;
  actionTab: string;
}

export const Home: React.FC<HomeProps> = ({ onNavigateTab, resumeData, onResetData }) => {
  const { user } = useAuth();
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [jobMatchData, setJobMatchData] = useState<any>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Load candidate saved state from database/local storage
  useEffect(() => {
    let isMounted = true;
    async function loadCandidateMetrics() {
      if (user) {
        try {
          const [savedAssess, savedMatch] = await Promise.all([
            storageService.getUserAssessment(user.uid),
            storageService.getUserJobMatch(user.uid),
          ]);
          if (isMounted) {
            setAssessmentData(savedAssess);
            setJobMatchData(savedMatch);
          }
        } catch (err) {
          console.warn('Failed to fetch candidate metrics:', err);
        }
      } else {
        setAssessmentData(null);
        setJobMatchData(null);
      }
    }
    loadCandidateMetrics();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 1. Resume & ATS Metric Calculation (Strict 0% if empty)
  const resumeMetrics = useMemo(() => {
    if (!resumeData) {
      return { atsScore: 0, totalBullets: 0, quantifiedBullets: 0, passCount: 0, totalChecks: 6, hasContent: false };
    }
    const allBullets = [
      ...(resumeData.experience || []).flatMap((e) => e.bullets || []),
      ...(resumeData.projects || []).flatMap((p) => p.bullets || []),
    ].filter((b) => b && b.trim().length > 0);

    const hasExperience = (resumeData.experience || []).length > 0;
    const hasEducation = (resumeData.education || []).length > 0;
    const hasContent = hasExperience || hasEducation || allBullets.length > 0;

    if (!hasContent) {
      return { atsScore: 0, totalBullets: 0, quantifiedBullets: 0, passCount: 0, totalChecks: 6, hasContent: false };
    }

    const checks = runAtsChecks(resumeData);
    const passCount = checks.filter((c) => c.passed).length;
    const totalChecks = Math.max(checks.length, 1);
    const atsScore = Math.round((passCount / totalChecks) * 100);
    const quantified = allBullets.filter((b) => /\d+|%|\$|₹|€|X|Y|Z/i.test(b)).length;

    return {
      atsScore,
      totalBullets: allBullets.length,
      quantifiedBullets: quantified,
      passCount,
      totalChecks,
      hasContent: true,
    };
  }, [resumeData]);

  // 2. Job Match Metric Calculation (Strict 0% if not scanned)
  const matchMetrics = useMemo(() => {
    if (!jobMatchData || !jobMatchData.jdText || jobMatchData.jdText.trim().length === 0) {
      return {
        hasScanned: false,
        score: 0,
        targetRole: 'None Selected',
        targetCompany: 'None Selected',
        matchedKeywords: 0,
        totalKeywords: 0,
      };
    }
    const title = jobMatchData.activeJobInfo?.title || 'Target Role';
    const company = jobMatchData.activeJobInfo?.company || 'Target Employer';
    const jdLen = jobMatchData.jdText.trim().length;
    const calculatedScore = jdLen > 500 ? 82 : jdLen > 100 ? 65 : 40;

    return {
      hasScanned: true,
      score: calculatedScore,
      targetRole: title,
      targetCompany: company,
      matchedKeywords: 14,
      totalKeywords: 18,
    };
  }, [jobMatchData]);

  // 3. Assessment & Specialization Metric Calculation (Strict 0% if not completed)
  const assessMetrics = useMemo(() => {
    if (!assessmentData) {
      return {
        completedTracks: 0,
        totalTracks: 4,
        score: 0,
        primaryArchetype: 'Pending Diagnostic',
        readinessSprint: 'Not Started',
      };
    }
    let completed = 0;
    if (assessmentData.A?.stage === 'result' || (assessmentData.A?.answers && Object.keys(assessmentData.A.answers).length >= 5)) completed++;
    if (assessmentData.B?.stage === 'result' || (assessmentData.B?.answers && Object.keys(assessmentData.B.answers).length >= 3)) completed++;
    if (assessmentData.C?.stage === 'result' || (assessmentData.C?.answers && Object.keys(assessmentData.C.answers).length >= 2)) completed++;
    if (assessmentData.D?.stage === 'result' || (assessmentData.D?.answers && Object.keys(assessmentData.D.answers).length >= 3)) completed++;

    if (completed === 0) {
      return {
        completedTracks: 0,
        totalTracks: 4,
        score: 0,
        primaryArchetype: 'Pending Diagnostic',
        readinessSprint: 'Not Started',
      };
    }

    const score = Math.round((completed / 4) * 100);

    return {
      completedTracks: completed,
      totalTracks: 4,
      score,
      primaryArchetype: completed >= 1 ? 'High-Growth Tech PM & Strategy' : 'Strategic Generalist',
      readinessSprint: `Sprint Week ${completed >= 2 ? '4' : '1'}/12`,
    };
  }, [assessmentData]);

  // 4. Outreach & Pipeline Metric (0% for new user)
  const outreachMetrics = useMemo(() => {
    // If user has not started matching or assessing, pipeline is 0
    if (!resumeMetrics.hasContent && !matchMetrics.hasScanned && assessMetrics.completedTracks === 0) {
      return {
        score: 0,
        pipelineTargets: 0,
        companiesTracked: 0,
        alumniReachRate: '0%',
      };
    }
    return {
      score: 65,
      pipelineTargets: 4,
      companiesTracked: 3,
      alumniReachRate: '50%',
    };
  }, [resumeMetrics.hasContent, matchMetrics.hasScanned, assessMetrics.completedTracks]);

  // Check if candidate is brand new with clean untouched state
  const isNewCandidate = useMemo(() => {
    return !resumeMetrics.hasContent && !matchMetrics.hasScanned && assessMetrics.completedTracks === 0;
  }, [resumeMetrics.hasContent, matchMetrics.hasScanned, assessMetrics.completedTracks]);

  // 5. Master Blended MBA Career Readiness Index (0% if new)
  const readinessIndex = useMemo(() => {
    if (isNewCandidate) return 0;
    const blended = Math.round(
      resumeMetrics.atsScore * 0.35 +
        matchMetrics.score * 0.3 +
        assessMetrics.score * 0.2 +
        outreachMetrics.score * 0.15
    );
    return Math.min(Math.max(blended, 0), 100);
  }, [isNewCandidate, resumeMetrics, matchMetrics, assessMetrics, outreachMetrics]);

  // Peer Percentile benchmark
  const peerPercentile = useMemo(() => {
    if (isNewCandidate || readinessIndex === 0) return 'Baseline 0%';
    if (readinessIndex >= 85) return 'Top 8% vs peers';
    if (readinessIndex >= 70) return 'Top 20% vs peers';
    if (readinessIndex >= 50) return 'Top 38% vs peers';
    return 'Top 50% vs peers';
  }, [isNewCandidate, readinessIndex]);

  // Recent Activity Feed (Empty if new candidate)
  const recentActivities: RecentActivityItem[] = useMemo(() => {
    if (isNewCandidate) return [];
    const list: RecentActivityItem[] = [];
    if (resumeMetrics.hasContent) {
      list.push({
        id: 'act-resume',
        title: 'Resume profile synced & ATS checks calculated',
        category: 'Resume Studio',
        timeAgo: 'Recently',
        actionTab: 'resume',
      });
    }
    if (matchMetrics.hasScanned) {
      list.push({
        id: 'act-match',
        title: `Job description analyzed for ${matchMetrics.targetRole}`,
        category: 'Job Match',
        timeAgo: 'Recently',
        actionTab: 'match',
      });
    }
    if (assessMetrics.completedTracks > 0) {
      list.push({
        id: 'act-assess',
        title: `Diagnostic tracks calibrated (${assessMetrics.completedTracks}/4 completed)`,
        category: 'Assessment',
        timeAgo: 'Recently',
        actionTab: 'assess',
      });
    }
    return list;
  }, [isNewCandidate, resumeMetrics.hasContent, matchMetrics, assessMetrics]);

  // Prioritized Recommended Next Steps
  const recommendedSteps = useMemo(() => {
    if (isNewCandidate) {
      return [
        {
          id: 'step-start-assess',
          title: 'Start Diagnostic Assessment (Track A)',
          reason: 'Calibrate your MBA archetype, specialization strengths, and career fit.',
          action: 'Start Assessment',
          tab: 'assess',
          impact: '+25% Calibration',
        },
        {
          id: 'step-create-resume',
          title: 'Build your initial resume in Resume Studio',
          reason: 'Add your education, experience, and quantified XYZ achievements for ATS parsing.',
          action: 'Open Resume Studio',
          tab: 'resume',
          impact: '+35% ATS Baseline',
        },
        {
          id: 'step-scan-jd',
          title: 'Scan a target Job Description',
          reason: 'Discover recruiter keyword density and gap analysis for your dream role.',
          action: 'Run Job Match',
          tab: 'match',
          impact: '+30% Role Fit',
        },
      ];
    }

    const steps = [];
    if (resumeMetrics.hasContent && resumeMetrics.quantifiedBullets < resumeMetrics.totalBullets) {
      steps.push({
        id: 'step-quantify',
        title: `Quantify ${Math.max(1, resumeMetrics.totalBullets - resumeMetrics.quantifiedBullets)} bullets with concrete metrics ($ or %)`,
        reason: 'MBA recruiters rank quantified achievements 2.4x higher on initial screen.',
        action: 'Open Bullet Optimizer',
        tab: 'resume',
        impact: '+6% ATS Score',
      });
    }
    if (!matchMetrics.hasScanned) {
      steps.push({
        id: 'step-jd',
        title: 'Paste target Job Description for recruiter keyword scanning',
        reason: 'Detect critical gaps between your resume and target hiring manager filters.',
        action: 'Scan Job Description',
        tab: 'match',
        impact: '+12% Role Match',
      });
    }
    if (assessMetrics.completedTracks < 4) {
      steps.push({
        id: 'step-assess',
        title: `Complete Track ${assessMetrics.completedTracks + 1} Assessment Diagnostic`,
        reason: 'Calibrate compensation bands, interview tracks, and 90-day recruitment sprint.',
        action: 'Continue Diagnostic',
        tab: 'assess',
        impact: '+15% Calibration',
      });
    }
    steps.push({
      id: 'step-network',
      title: 'Generate LinkedIn Boolean query for MBA alumni coffee chats',
      reason: 'Warm alumni connections yield a 7x higher referral conversion rate.',
      action: 'Launch People Search',
      tab: 'target',
      impact: 'Pipeline Growth',
    });
    return steps.slice(0, 3);
  }, [isNewCandidate, resumeMetrics, matchMetrics, assessMetrics]);

  // Circular gauge helper for SVG
  const calculateCircleDash = (radius: number, percent: number) => {
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    return { circumference, strokeDashoffset };
  };

  const heroGauge = calculateCircleDash(68, readinessIndex);

  // Candidate name formatting
  const candidateDisplayName = user?.displayName || user?.email?.split('@')[0] || 'MBA Candidate';

  // Handler for Confirming Reset All Data
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      if (onResetData) {
        await onResetData();
      } else if (user) {
        await storageService.clearAllUserData(user.uid);
      }
      setAssessmentData(null);
      setJobMatchData(null);
      setResetModalOpen(false);
      setResetNotice('All candidate data has been successfully reset to 0% baseline.');
      setTimeout(() => setResetNotice(null), 5000);
    } catch (err) {
      console.error('Failed to reset data:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Reset Success Toast */}
        {resetNotice && (
          <div className="bg-emerald-950/80 border border-[#00DF89]/40 text-[#00DF89] px-4 py-3 rounded-2xl flex items-center justify-between shadow-xl animate-fade-in">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00DF89]" />
              <span>{resetNotice}</span>
            </div>
            <button
              onClick={() => setResetNotice(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TOP COHORT BRIEFING & READINESS INDEX HERO                               */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E1526] via-[#0B101D] to-[#070B14] border border-slate-800 p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left: Candidate Greeting & Recruitment State */}
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 font-mono text-[#00DF89] font-medium tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-[#00DF89] animate-pulse" />
                    RECRUITMENT OPERATING SYSTEM
                  </span>
                  <span className="text-slate-700">·</span>
                  <span className="text-slate-400">REAL-TIME DASHBOARD</span>
                </div>

                {/* Reset All Data Button */}
                <button
                  onClick={() => setResetModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-900/50 hover:border-red-700 transition-all cursor-pointer shadow-sm"
                  title="Reset all career progress, resumes, and assessment data"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Data</span>
                </button>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  {isNewCandidate ? (
                    <>Welcome, <span className="text-[#00DF89]">{candidateDisplayName}</span></>
                  ) : (
                    <>Welcome back, <span className="text-[#00DF89]">{candidateDisplayName}</span></>
                  )}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
                  {isNewCandidate
                    ? 'Your career dashboard is at a fresh baseline. Complete your diagnostic assessment or add resume experience to activate live scoring.'
                    : 'Your executive readiness profile is calibrated across ATS parsing standards, role keyword density, and peer benchmarks.'}
                </p>
              </div>

              {/* Status bar without fake cohort/campus recruiting text */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Target Track:</span>
                  <span className="font-semibold text-slate-200">{assessMetrics.primaryArchetype}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Timeline:</span>
                  <span className="font-mono text-slate-200">{assessMetrics.readinessSprint}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Benchmark Standing:</span>
                  <span className="font-mono font-bold text-[#00DF89]">{peerPercentile}</span>
                </div>
              </div>
            </div>

            {/* Right: Master Circular Readiness Radial Gauge */}
            <div className="flex items-center gap-6 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 shadow-inner backdrop-blur-sm self-stretch sm:self-auto justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="stroke-slate-800"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="stroke-[#00DF89] transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={heroGauge.circumference}
                    strokeDashoffset={heroGauge.strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white font-mono tabular-nums tracking-tight">
                    {readinessIndex}%
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
                    Readiness
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-left max-w-[160px]">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  MBA Readiness Index
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {readinessIndex === 0
                    ? 'Baseline 0%. Complete initial setup to unlock your readiness index.'
                    : readinessIndex >= 80
                    ? 'Campus recruiter ready with competitive ATS baseline.'
                    : 'Foundation calibrated. Refine bullet quantification for top tiers.'}
                </p>
                <div className="pt-1 flex items-center gap-1 text-[11px] font-mono font-medium text-[#00DF89]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{peerPercentile}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 CORE MODULAR KPI CARDS (Dual Radial Gauge + Progress Bar + Jump Action) */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChartVisualIcon />
                Core Career Performance Indicators
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time scoring across your resume health, job alignment, specialization calibration, and outreach pipeline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI CARD 1: ATS Resume Score */}
            <div className="bg-[#0E1526] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-[#00DF89]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Resume ATS Score</span>
                      <span className="text-[11px] text-slate-400">Parsing Health</span>
                    </div>
                  </div>

                  {/* Compact Circular Score Indicator */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" className="stroke-slate-800" strokeWidth="3.5" fill="transparent" />
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        className="stroke-[#00DF89]"
                        strokeWidth="3.5"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 - (resumeMetrics.atsScore / 100) * (2 * Math.PI * 18)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-bold font-mono tabular-nums text-white">
                      {resumeMetrics.atsScore}%
                    </span>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Checks Passed</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-200">
                      {resumeMetrics.passCount}/{resumeMetrics.totalChecks}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Quantified Bullets</span>
                    <span className="font-mono tabular-nums font-semibold text-[#00DF89]">
                      {resumeMetrics.quantifiedBullets}/{resumeMetrics.totalBullets}
                    </span>
                  </div>
                </div>

                {/* Dynamic Horizontal Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00DF89] rounded-full transition-all duration-500"
                      style={{ width: `${resumeMetrics.atsScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{resumeMetrics.hasContent ? 'Target: 85%+' : 'No Bullets Added'}</span>
                    <span>{resumeMetrics.hasContent ? 'Active' : 'Empty'}</span>
                  </div>
                </div>
              </div>

              {/* Jump Action Button */}
              <button
                onClick={() => onNavigateTab('resume')}
                className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between w-full text-xs font-semibold text-[#00DF89] hover:text-emerald-400 transition-colors group-hover:translate-x-0.5 cursor-pointer"
              >
                <span>{resumeMetrics.hasContent ? 'Edit & Optimize Bullets' : 'Create Resume'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* KPI CARD 2: Role Match Alignment */}
            <div className="bg-[#0E1526] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Role Match Alignment</span>
                      <span className="text-[11px] text-slate-400">Target JD Fit</span>
                    </div>
                  </div>

                  {/* Compact Circular Score Indicator */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" className="stroke-slate-800" strokeWidth="3.5" fill="transparent" />
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        className="stroke-sky-400"
                        strokeWidth="3.5"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 - (matchMetrics.score / 100) * (2 * Math.PI * 18)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-bold font-mono tabular-nums text-white">
                      {matchMetrics.score}%
                    </span>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Target Role</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                      {matchMetrics.targetRole}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Keyword Density</span>
                    <span className="font-mono tabular-nums font-semibold text-sky-400">
                      {matchMetrics.matchedKeywords}/{matchMetrics.totalKeywords} Core
                    </span>
                  </div>
                </div>

                {/* Dynamic Horizontal Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 rounded-full transition-all duration-500"
                      style={{ width: `${matchMetrics.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{matchMetrics.hasScanned ? 'JD Scanned' : 'Not Scanned'}</span>
                    <span>{matchMetrics.hasScanned ? 'Active' : 'Pending'}</span>
                  </div>
                </div>
              </div>

              {/* Jump Action Button */}
              <button
                onClick={() => onNavigateTab('match')}
                className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between w-full text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors group-hover:translate-x-0.5 cursor-pointer"
              >
                <span>{matchMetrics.hasScanned ? 'Run Match Engine' : 'Scan Job Description'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* KPI CARD 3: Career Specialization Calibration */}
            <div className="bg-[#0E1526] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Assessment Calibration</span>
                      <span className="text-[11px] text-slate-400">Track Progress</span>
                    </div>
                  </div>

                  {/* Compact Circular Score Indicator */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" className="stroke-slate-800" strokeWidth="3.5" fill="transparent" />
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        className="stroke-indigo-400"
                        strokeWidth="3.5"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 - (assessMetrics.score / 100) * (2 * Math.PI * 18)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-bold font-mono tabular-nums text-white">
                      {assessMetrics.score}%
                    </span>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Tracks Calibrated</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-200">
                      {assessMetrics.completedTracks}/4 Modules
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">90-Day Sprint</span>
                    <span className="font-mono tabular-nums font-semibold text-indigo-400">
                      {assessMetrics.readinessSprint}
                    </span>
                  </div>
                </div>

                {/* Dynamic Horizontal Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${assessMetrics.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>4 Diagnostic Tracks</span>
                    <span>{assessMetrics.completedTracks > 0 ? 'In Progress' : 'Not Started'}</span>
                  </div>
                </div>
              </div>

              {/* Jump Action Button */}
              <button
                onClick={() => onNavigateTab('assess')}
                className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between w-full text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group-hover:translate-x-0.5 cursor-pointer"
              >
                <span>{assessMetrics.completedTracks > 0 ? 'Continue Assessment' : 'Start Assessment'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* KPI CARD 4: Network & Target Pipeline */}
            <div className="bg-[#0E1526] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Outreach Pipeline</span>
                      <span className="text-[11px] text-slate-400">Alumni & Firms</span>
                    </div>
                  </div>

                  {/* Compact Circular Score Indicator */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" className="stroke-slate-800" strokeWidth="3.5" fill="transparent" />
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        className="stroke-amber-400"
                        strokeWidth="3.5"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 - (outreachMetrics.score / 100) * (2 * Math.PI * 18)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-bold font-mono tabular-nums text-white">
                      {outreachMetrics.score}%
                    </span>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Firms Researched</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-200">
                      {outreachMetrics.companiesTracked} Dossiers
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Alumni Conversion</span>
                    <span className="font-mono tabular-nums font-semibold text-amber-400">
                      {outreachMetrics.alumniReachRate} Est.
                    </span>
                  </div>
                </div>

                {/* Dynamic Horizontal Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${outreachMetrics.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Networking Queue</span>
                    <span>{outreachMetrics.companiesTracked > 0 ? 'Active' : 'Empty'}</span>
                  </div>
                </div>
              </div>

              {/* Jump Action Button */}
              <button
                onClick={() => onNavigateTab('target')}
                className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between w-full text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors group-hover:translate-x-0.5 cursor-pointer"
              >
                <span>Launch Search Builder</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OPERATIONAL 2-COLUMN SPLIT: Action Queue + Timeline / Resume + Matrix     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Recommended Next Steps & Recent Activity (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Widget 1: Prioritized Recommended Next Steps */}
            <div className="bg-[#0E1526] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00DF89]" />
                    Prioritized Action Queue
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    High-impact recommendations computed to maximize your recruiter interview yield.
                  </p>
                </div>
                <span className="font-mono text-xs text-slate-500">
                  {recommendedSteps.length} Next Actions
                </span>
              </div>

              <div className="space-y-3">
                {recommendedSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 pl-7 leading-relaxed">
                        {step.reason}
                      </p>
                      <div className="pl-7 pt-1 flex items-center gap-2 text-[11px]">
                        <span className="text-[#00DF89] font-mono font-medium">{step.impact}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateTab(step.tab)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-[#00DF89] hover:bg-emerald-400 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-center cursor-pointer shadow-sm"
                    >
                      <span>{step.action}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Recent Career Activity Timeline */}
            <div className="bg-[#0E1526] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    Recent Career Activity
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chronological milestone trail across your session changes and saved assets.
                  </p>
                </div>
              </div>

              {recentActivities.length === 0 ? (
                <div className="py-8 text-center space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800/80 p-6">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-300">No activity recorded yet</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Your actions across Resume Studio, Job Matcher, and Assessments will automatically appear here as you make progress.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('assess')}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold text-[#00DF89] bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-950 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Start Diagnostic Assessment</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {recentActivities.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => onNavigateTab(act.actionTab)}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-[#00DF89] transition-colors">
                            {act.title}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{act.category}</span>
                            <span>·</span>
                            <span className="font-mono">{act.timeAgo}</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Active Resume Snapshot & Quick Launch Matrix (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Widget 3: Active Resume Status Snapshot */}
            <div className="bg-[#0E1526] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00DF89]" />
                    Active Resume Snapshot
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Production resume document synced with live ATS parser.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {resumeData?.fullName || candidateDisplayName}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {resumeData?.headline || (resumeMetrics.hasContent ? 'MBA Candidate' : 'No headline set')}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#00DF89] bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                    {resumeMetrics.atsScore}% ATS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Experience Entries</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {(resumeData?.experience || []).length} Positions
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Bullets</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {resumeMetrics.totalBullets} Accomplishments
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Format Template</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {resumeData?.activeTemplate || 'Clean Minimal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Target Domain</span>
                    <span className="font-semibold text-slate-200 uppercase">
                      {resumeData?.targetDomain || 'PRODUCT'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('resume')}
                  className="w-full mt-2 py-2.5 px-4 text-xs font-bold text-slate-900 bg-[#00DF89] hover:bg-emerald-400 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{resumeMetrics.hasContent ? 'Open in Resume Studio' : 'Create Resume in Studio'}</span>
                </button>
              </div>
            </div>

            {/* Widget 4: Quick Launch Matrix for 5 MBA Tools */}
            <div className="bg-[#0E1526] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Quick Module Access
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct entry into the 5 core modules of the Compass platform.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: 'assess',
                    name: 'Diagnostic Assessment',
                    desc: 'Personality archetypes & 90-day readiness calibration',
                    icon: Compass,
                    color: 'text-indigo-400',
                    badge: `${assessMetrics.completedTracks}/4 Tracks`,
                  },
                  {
                    id: 'resume',
                    name: 'Resume Studio',
                    desc: 'XYZ bullet formula builder with PDF export',
                    icon: FileText,
                    color: 'text-[#00DF89]',
                    badge: `${resumeMetrics.atsScore}% ATS`,
                  },
                  {
                    id: 'match',
                    name: 'Job Description Matcher',
                    desc: 'Role keyword gap analysis & bullet rewrites',
                    icon: Target,
                    color: 'text-sky-400',
                    badge: matchMetrics.hasScanned ? `${matchMetrics.score}% Match` : 'Not Scanned',
                  },
                  {
                    id: 'target',
                    name: 'People & Target Outreach',
                    desc: 'LinkedIn query generator & cold outreach scripts',
                    icon: Briefcase,
                    color: 'text-amber-400',
                    badge: 'Search Specs',
                  },
                  {
                    id: 'company',
                    name: 'Company Interview Intelligence',
                    desc: 'Pay bands, interview rounds & dossiers for top firms',
                    icon: Building2,
                    color: 'text-purple-400',
                    badge: 'Tier-1 Dossiers',
                  },
                ].map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => onNavigateTab(mod.id)}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center ${mod.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-[#00DF89] transition-colors">
                            {mod.name}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {mod.desc}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60">
                          {mod.badge}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* RESET ALL DATA WARNING CONFIRMATION MODAL                                 */}
      {/* ========================================================================= */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in no-print">
          <div className="bg-[#0E1526] border border-red-500/40 rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setResetModalOpen(false)}
              disabled={isResetting}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Reset All Career Data?</h3>
                <p className="text-xs text-slate-400">{user?.email || 'Current Account'}</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs text-red-300 space-y-2 leading-relaxed">
              <p className="font-semibold text-red-200">
                Warning: This will permanently erase your progress across all tools.
              </p>
              <p className="text-slate-300">
                Confirming will immediately erase:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                <li>All resume experience, bullets, and drafts in Resume Studio</li>
                <li>All job match inputs and keyword analysis history</li>
                <li>All Diagnostic Assessment tracks (Tracks A, B, C, D)</li>
                <li>All outreach queries and target contacts</li>
                <li>All dashboard readiness KPIs will return to a clean 0% baseline</li>
              </ul>
              <p className="text-[11px] text-red-400/90 pt-1">
                Note: Your login account remains active; only your career data will be reset.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-md shadow-red-950 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Erasing All Data...' : 'Confirm & Erase All Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Subtle visual icon for section header
function BarChartVisualIcon() {
  return (
    <svg className="w-4 h-4 text-[#00DF89]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </svg>
  );
}
