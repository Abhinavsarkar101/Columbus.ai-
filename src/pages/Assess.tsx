import React, { useState, useMemo } from 'react';
import {
  AssessmentTrackId,
  DualSpecializationPairing,
  EnrollmentStatus,
  ExperienceLevel,
  getDualSpecializationRecommendation,
  PERSONALITY_ARCHETYPES,
  TRACK_1_ASPIRING_QUESTIONS,
  TRACK_1_ENROLLED_QUESTIONS,
  TRACK_1_QUESTIONS,
  TRACK_2_QUESTIONS,
  TRACK_3_QUESTIONS,
  TrackQuestion,
} from '../data/assessmentTracks';
import { DOMAINS } from '../data/domains';
import { ROLES } from '../data/roles';
import { AssessmentState, DomainId, RoleDefinition } from '../types';

interface AssessProps {
  assessmentState: AssessmentState;
  onUpdateState: (newState: AssessmentState) => void;
  onNavigateTab: (tab: string) => void;
}

export const Assess: React.FC<AssessProps> = ({
  assessmentState,
  onUpdateState,
  onNavigateTab,
}) => {
  // Navigation / Progress flow: 'journey_select' -> 'calibrate' -> 'questions' -> 'report'
  const [activeTrack, setActiveTrack] = useState<AssessmentTrackId>('domain_fit');
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('aspiring');
  const [selectedDomain, setSelectedDomain] = useState<DomainId>('marketing');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('product_manager');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('fresher');

  const [step, setStep] = useState<'journey_select' | 'calibrate' | 'questions' | 'report'>('journey_select');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [otherInput, setOtherInput] = useState<string>('');

  // Determine active questions based on track, domain, role, and experience level
  const activeQuestions: TrackQuestion[] = useMemo(() => {
    if (activeTrack === 'domain_fit') {
      return enrollmentStatus === 'aspiring' ? TRACK_1_ASPIRING_QUESTIONS : TRACK_1_ENROLLED_QUESTIONS;
    }
    if (activeTrack === 'know_specialization') {
      return TRACK_2_QUESTIONS[selectedDomain] || TRACK_2_QUESTIONS['marketing'];
    }
    if (activeTrack === 'know_role') {
      return TRACK_3_QUESTIONS[experienceLevel] || TRACK_3_QUESTIONS['fresher'];
    }
    return TRACK_1_ASPIRING_QUESTIONS;
  }, [activeTrack, enrollmentStatus, selectedDomain, experienceLevel]);

  const currentQ = activeQuestions[currentQuestionIdx] || activeQuestions[0];
  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = answeredCount >= activeQuestions.length;

  // Handlers for starting each journey
  const handleStartTrack1 = () => {
    setActiveTrack('domain_fit');
    setAnswers({});
    setCurrentQuestionIdx(0);
    setStep('calibrate');
  };

  const handleStartTrack2 = () => {
    setActiveTrack('know_specialization');
    setAnswers({});
    setCurrentQuestionIdx(0);
    setStep('calibrate');
  };

  const handleStartTrack3 = () => {
    setActiveTrack('know_role');
    setAnswers({});
    setCurrentQuestionIdx(0);
    setStep('calibrate');
  };

  const handleSelectOption = (questionId: number, optionId: string) => {
    const nextAnswers = { ...answers, [questionId]: optionId };
    setAnswers(nextAnswers);

    if (currentQuestionIdx < activeQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setOtherInput('');
    } else {
      setStep('report');
    }
  };

  const handleSaveOtherAnswer = (questionId: number) => {
    if (!otherInput.trim()) return;
    const nextAnswers = { ...answers, [questionId]: `other:${otherInput.trim()}` };
    setAnswers(nextAnswers);

    if (currentQuestionIdx < activeQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setOtherInput('');
    } else {
      setStep('report');
    }
  };

  // ==========================================
  // CALCULATE REPORT DATA PER TRACK
  // ==========================================
  // Track 1 Report: Domain Scores, Personality Archetype & Dual Specialization
  const track1Results = useMemo(() => {
    if (activeTrack !== 'domain_fit') return null;

    const scores: Record<DomainId, number> = {
      marketing: 0,
      finance: 0,
      product: 0,
      consulting: 0,
      operations: 0,
      analytics: 0,
      hr: 0,
      sales_gm: 0,
    };

    const questionsToScore = enrollmentStatus === 'aspiring' ? TRACK_1_ASPIRING_QUESTIONS : TRACK_1_ENROLLED_QUESTIONS;
    questionsToScore.forEach((q) => {
      const chosenOptId = answers[q.id];
      if (!chosenOptId) return;

      const opt = q.options.find((o) => o.id === chosenOptId);
      if (opt?.domainWeights) {
        Object.entries(opt.domainWeights).forEach(([dom, wt]) => {
          scores[dom as DomainId] += wt || 0;
        });
      }
    });

    // Normalize out of 100
    const sortedDomains = (Object.keys(scores) as DomainId[]).sort(
      (a, b) => scores[b] - scores[a]
    );

    const maxScore = Math.max(1, scores[sortedDomains[0]]);
    const normalizedScores: Record<DomainId, number> = {} as any;
    sortedDomains.forEach((d) => {
      normalizedScores[d] = Math.round((scores[d] / maxScore) * 94) + 6; // range 6 - 100
    });

    const topDomain = sortedDomains[0];
    const secondDomain = sortedDomains[1] || 'analytics';
    const dualSpec: DualSpecializationPairing = getDualSpecializationRecommendation(topDomain, secondDomain);
    const archetype = PERSONALITY_ARCHETYPES[topDomain];

    return {
      topDomain,
      secondDomain,
      normalizedScores,
      sortedDomains,
      dualSpec,
      archetype,
      enrollmentStatus,
    };
  }, [activeTrack, answers, enrollmentStatus]);

  // Track 2 Report: 2-3 Recommended Roles with Campus Backup
  const track2Results = useMemo(() => {
    if (activeTrack !== 'know_specialization') return null;

    // Filter all roles matching selected domain
    const domainRoles = ROLES.filter((r) => r.domain === selectedDomain);
    const primary = domainRoles[0] || ROLES[0];
    const secondary = domainRoles[1] || domainRoles[0] || ROLES[1];
    const fallback = domainRoles[2] || ROLES.find((r) => r.domain !== selectedDomain) || ROLES[2];

    return {
      domainInfo: DOMAINS[selectedDomain],
      recommendedRoles: [
        {
          tier: 'Primary Aspirational Role',
          role: primary,
          tag: 'Top Fit',
          reason: 'Direct match for your core functional instinct, high campus placement CTC, and strategic leadership trajectory.',
        },
        {
          tier: 'Secondary Alternative Role',
          role: secondary,
          tag: 'High Transferability',
          reason: 'Shares 80%+ identical interview case frameworks with high placement recruiting demand across tech and consumer sectors.',
        },
        {
          tier: 'Campus Placement Fallback Role',
          role: fallback,
          tag: 'High Volume Hiring',
          reason: 'Guaranteed high-volume hiring tier. If your dream recruiter does not visit campus this season, target this role with the exact same case preparation.',
        },
      ],
    };
  }, [activeTrack, selectedDomain]);

  // Track 3 Report: Readiness Reality Check & 90-Day Plan
  const track3Results = useMemo(() => {
    if (activeTrack !== 'know_role') return null;

    let points = 0;
    const questionsForLevel = TRACK_3_QUESTIONS[experienceLevel] || TRACK_3_QUESTIONS['fresher'];

    questionsForLevel.forEach((q) => {
      const chosenOptId = answers[q.id];
      if (!chosenOptId) return;
      const opt = q.options.find((o) => o.id === chosenOptId);
      points += opt?.readinessPoints || 10;
    });

    // Score out of 100
    const maxPoints = Math.max(1, questionsForLevel.length * 25);
    const readinessScore = Math.min(98, Math.round((points / maxPoints) * 100));

    const targetRole = ROLES.find((r) => r.id === selectedRoleId) || ROLES[0];

    return {
      targetRole,
      experienceLevel,
      readinessScore,
      strengths: [
        'Structured 80/20 commercial problem framing under ambiguity',
        'Demonstrated situational judgment on cross-functional alignment',
        'Familiarity with industry-standard deliverable metrics and KPIs',
      ],
      gaps: [
        'Nuanced sensitivity analysis when defending assumptions in partner rounds',
        'Translating qualitative narrative bullets into quantifiable XYZ business impact',
        'Pre-interview reverse questions targeted at team-level culture realities',
      ],
      plan90Days: {
        days1_30: {
          phase: 'Days 1–30: Core Knowledge & Tooling Mastery',
          items: [
            `Audit target JD taxonomy terms for ${targetRole.title} and identify top 5 missing technical keywords.`,
            'Master core financial modeling, unit economics (CAC, LTV, EBITDA), and SQL analytics sandboxes.',
            'Read 2 foundational industry books and benchmark recent recruiter interview rubrics.',
          ],
        },
        days31_60: {
          phase: 'Days 31–60: Project Bullets & Case Structuring',
          items: [
            'Rewrite all resume bullet points in XYZ format with a minimum of 60% quantifiable metric density.',
            'Solve 15 role-specific case studies using MECE frameworks and time-boxed 45-minute drills.',
            'Build 1 public portfolio teardown or strategy perspective document to share with hiring managers.',
          ],
        },
        days61_90: {
          phase: 'Days 61–90: Mock Interviews & Shortlist Defense',
          items: [
            'Conduct 6 live mock interview rounds with second-year MBA peers and working alumni.',
            'Execute 3-touch outreach sequences on LinkedIn to connect with 10 peers and hiring managers.',
            'Formulate 4 reverse-interview questions to probe culture reality during final partner rounds.',
          ],
        },
      },
    };
  }, [activeTrack, answers, selectedRoleId, experienceLevel]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 bg-[#070B14] text-slate-100">
      {/* 1. STEP-BY-STEP PROGRESS TIMELINE */}
      <div className="bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#00DF89] uppercase tracking-wider">
              <span>MBA Assessment</span>
              <span className="text-slate-600">·</span>
              <span>
                {activeTrack === 'domain_fit' &&
                  (enrollmentStatus === 'aspiring'
                    ? 'Track 1: Aspiring MBA · Personality & Logic'
                    : 'Track 1: Enrolled MBA · Specialization & Dual Major')}
                {activeTrack === 'know_specialization' && 'Track 2: I Know My Specialization'}
                {activeTrack === 'know_role' && 'Track 3: I Know The Role I Want'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              {step === 'journey_select' && 'Choose Your Placement Diagnostic Journey'}
              {step === 'calibrate' && 'Target & Background Calibration'}
              {step === 'questions' &&
                (activeTrack === 'domain_fit' && enrollmentStatus === 'aspiring'
                  ? `Question ${currentQuestionIdx + 1} of ${activeQuestions.length}`
                  : `Scenario ${currentQuestionIdx + 1} of ${activeQuestions.length}`)}
              {step === 'report' && 'Your Tailored Career Strategy Report'}
            </h1>
          </div>

          {step !== 'journey_select' && (
            <button
              onClick={() => {
                setStep('journey_select');
                setAnswers({});
                setCurrentQuestionIdx(0);
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ↺ Change Journey
            </button>
          )}
        </div>

        {/* The Sleek Flow Timeline Indicator */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center pt-1 text-xs">
          {/* Step 1 Node */}
          <div
            onClick={() => setStep('journey_select')}
            className={`cursor-pointer p-2.5 sm:p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
              step === 'journey_select'
                ? 'bg-[#00DF89]/10 border-[#00DF89] text-white font-bold'
                : 'bg-[#070B14] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                step === 'journey_select' ? 'bg-[#00DF89] text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              1
            </div>
            <div className="truncate">
              <div className="font-semibold text-white leading-none">1. Select Journey</div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">Choose entry track</div>
            </div>
          </div>

          {/* Step 2 Node */}
          <div
            className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
              step === 'calibrate' || step === 'questions'
                ? 'bg-[#00DF89]/10 border-[#00DF89] text-white font-bold'
                : 'bg-[#070B14] border-slate-800 text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                step === 'calibrate' || step === 'questions' ? 'bg-[#00DF89] text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              2
            </div>
            <div className="truncate">
              <div className="font-semibold text-white leading-none">2. Scenarios</div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                {step === 'questions' ? `${answeredCount} of ${activeQuestions.length} answered` : 'Calibrate & Answer'}
              </div>
            </div>
          </div>

          {/* Step 3 Node */}
          <div
            className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
              step === 'report'
                ? 'bg-[#00DF89]/10 border-[#00DF89] text-white font-bold'
                : 'bg-[#070B14] border-slate-800 text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                step === 'report' ? 'bg-[#00DF89] text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              3
            </div>
            <div className="truncate">
              <div className="font-semibold text-white leading-none">3. Tailored Report</div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">Dual spec & roles</div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          STAGE 1: CHOOSE YOUR JOURNEY
      ========================================== */}
      {step === 'journey_select' && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 pt-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Where are you in your MBA career thinking?</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every MBA candidate is at a different stage. Select the track that mirrors your current situation to receive tailored questions and reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Track 1 Card */}
            <div className="bg-[#0E1526] p-7 rounded-2xl border border-slate-800 hover:border-[#00DF89]/50 transition-all flex flex-col justify-between space-y-6 shadow-xl group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#00DF89]/10 text-[#00DF89] flex items-center justify-center text-xl font-bold border border-[#00DF89]/30 group-hover:scale-105 transition-transform">
                  ?
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-[#00DF89] font-bold uppercase tracking-wider">
                    TRACK 01 · ASPIRING OR ENROLLED MBA
                  </div>
                  <h3 className="text-xl font-bold text-white leading-snug">
                    “I want to find my specialization.”
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Whether you are about to join business school or enrolled in 1st year: take an accessible personality & everyday logic quiz (zero jargon) or practical business scenarios to discover your best-fit domain, Personality Archetype, and Dual Specialization.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <div>✓ Aspiring: 10 personality & everyday logic questions</div>
                  <div>✓ Enrolled: 10 practical business scenarios (no jargon)</div>
                  <div>✓ Personality Archetype + Dual Specialization pairing</div>
                </div>
              </div>

              <button
                onClick={handleStartTrack1}
                className="w-full py-3 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md text-center"
              >
                Choose Status & Start →
              </button>
            </div>

            {/* Track 2 Card */}
            <div className="bg-[#0E1526] p-7 rounded-2xl border border-slate-800 hover:border-[#00DF89]/50 transition-all flex flex-col justify-between space-y-6 shadow-xl group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center text-xl font-bold border border-[#14B8A6]/30 group-hover:scale-105 transition-transform">
                  🎯
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-[#14B8A6] font-bold uppercase tracking-wider">
                    TRACK 02 · SPECIALIZED CANDIDATE
                  </div>
                  <h3 className="text-xl font-bold text-white leading-snug">
                    “I know my specialization.”
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You already have chosen your domain (Marketing, Finance, Product, Consulting, HR, etc.) but need to identify which job roles to target for campus shortlists and off-campus interviews.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <div>✓ Select your chosen specialization</div>
                  <div>✓ Recommends 2–3 roles with campus fallbacks</div>
                  <div>✓ Salary expectations & interview preparation rubrics</div>
                </div>
              </div>

              <button
                onClick={handleStartTrack2}
                className="w-full py-3 bg-[#14B8A6] hover:bg-[#0ea5e9] text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md text-center"
              >
                Select Specialization & Roles →
              </button>
            </div>

            {/* Track 3 Card */}
            <div className="bg-[#0E1526] p-7 rounded-2xl border border-slate-800 hover:border-[#00DF89]/50 transition-all flex flex-col justify-between space-y-6 shadow-xl group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-400/30 group-hover:scale-105 transition-transform">
                  ⚡
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    TRACK 03 · TARGET READY
                  </div>
                  <h3 className="text-xl font-bold text-white leading-snug">
                    “I know the role I want.”
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Targeting a specific role (Product Manager, Strategy Consultant, IB Associate)? Get an honest job-readiness reality check calibrated to your specific experience level with a closing 90-day plan.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <div>✓ Calibrated for Fresher vs. Intern vs. Lateral</div>
                  <div>✓ Dynamic adaptive questionnaire</div>
                  <div>✓ Concrete 90-Day Plan to crack the interview</div>
                </div>
              </div>

              <button
                onClick={handleStartTrack3}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md text-center"
              >
                Check Role Readiness →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          STAGE 1.5: CALIBRATION (TRACKS 1, 2 & 3)
      ========================================== */}
      {step === 'calibrate' && (
        <div className="max-w-2xl mx-auto bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 shadow-2xl">
          {activeTrack === 'domain_fit' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">Track 1 Calibration</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">What is your current MBA status?</h2>
                <p className="text-xs text-slate-400">
                  Select your enrollment stage so we can tune the questions to match your background without intimidating jargon.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: About to join */}
                <button
                  type="button"
                  onClick={() => setEnrollmentStatus('aspiring')}
                  className={`p-5 rounded-2xl border text-left transition-all space-y-3 flex flex-col justify-between ${
                    enrollmentStatus === 'aspiring'
                      ? 'border-[#00DF89] bg-[#00DF89]/10 text-white font-medium shadow-md'
                      : 'border-slate-800 bg-[#070B14] text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🌱</span>
                      {enrollmentStatus === 'aspiring' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00DF89] text-slate-950">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white">I am about to join MBA</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Aspiring student or preparing for admissions. 10 high-level personality and intuitive everyday logic questions with zero corporate jargon.
                    </p>
                  </div>
                  <div className="text-[10px] text-[#00DF89] font-mono pt-1">
                    ✓ Unlocks Personality Archetype
                  </div>
                </button>

                {/* Option 2: Enrolled in MBA */}
                <button
                  type="button"
                  onClick={() => setEnrollmentStatus('enrolled')}
                  className={`p-5 rounded-2xl border text-left transition-all space-y-3 flex flex-col justify-between ${
                    enrollmentStatus === 'enrolled'
                      ? 'border-[#00DF89] bg-[#00DF89]/10 text-white font-medium shadow-md'
                      : 'border-slate-800 bg-[#070B14] text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🎓</span>
                      {enrollmentStatus === 'enrolled' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00DF89] text-slate-950">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white">I have enrolled in MBA school</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Currently in your 1st year. 10 practical, real-world business scenarios in plain language to choose your Major and Dual Specialization.
                    </p>
                  </div>
                  <div className="text-[10px] text-[#00DF89] font-mono pt-1">
                    ✓ Dual Specialization Strategy
                  </div>
                </button>
              </div>

              <button
                onClick={() => {
                  setStep('questions');
                  setCurrentQuestionIdx(0);
                  setAnswers({});
                }}
                className="w-full py-3.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md text-center"
              >
                Start {enrollmentStatus === 'aspiring' ? 'Personality & Logic Diagnostic' : 'Specialization Assessment'} →
              </button>
            </div>
          )}

          {activeTrack === 'know_specialization' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#14B8A6] uppercase tracking-wider">Track 2 Calibration</span>
                <h2 className="text-xl font-bold text-white">Select Your Chosen Specialization</h2>
                <p className="text-xs text-slate-400">
                  Choose the domain you have taken in your MBA. We will tailor the questions to identify your top 2-3 target roles.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(DOMAINS) as DomainId[]).map((dom) => (
                  <button
                    key={dom}
                    onClick={() => setSelectedDomain(dom)}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      selectedDomain === dom
                        ? 'border-[#00DF89] bg-[#00DF89]/10 text-white font-bold'
                        : 'border-slate-800 bg-[#070B14] text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span>{DOMAINS[dom].name}</span>
                    <span className="text-slate-500 font-normal">{DOMAINS[dom].shortName}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setStep('questions');
                  setCurrentQuestionIdx(0);
                  setAnswers({});
                }}
                className="w-full py-3 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold text-xs rounded-xl transition-all shadow"
              >
                Proceed to Role Alignment Questions →
              </button>
            </div>
          )}

          {activeTrack === 'know_role' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Track 3 Calibration</span>
                <h2 className="text-xl font-bold text-white">Select Your Target Role & Experience Level</h2>
                <p className="text-xs text-slate-400">
                  Questions will dynamically adapt based on the role and your prior background.
                </p>
              </div>

              {/* Target Role Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Target MBA Role:</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full p-3 bg-[#070B14] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#00DF89]"
                >
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title} ({DOMAINS[role.domain]?.shortName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience Level Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Your Current Experience Level in this Field:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {[
                    { id: 'fresher', label: 'Fresher / Yet to Start', desc: 'No prior formal experience' },
                    { id: 'intern', label: '1 Internship / Project', desc: 'Summer intern or capstone' },
                    { id: 'lateral', label: '1+ Year Relevant / Lateral', desc: 'Prior full-time work' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setExperienceLevel(lvl.id as ExperienceLevel)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        experienceLevel === lvl.id
                          ? 'border-amber-400 bg-amber-400/10 text-white font-bold'
                          : 'border-slate-800 bg-[#070B14] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-white">{lvl.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('questions');
                  setCurrentQuestionIdx(0);
                  setAnswers({});
                }}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow"
              >
                Start Calibrated Readiness Questions →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          STAGE 2: SCENARIOS / QUESTIONNAIRE
      ========================================== */}
      {step === 'questions' && currentQ && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
              <span className="font-mono text-[#00DF89] font-bold">
                QUESTION {currentQuestionIdx + 1} OF {activeQuestions.length}
              </span>
              <span className="text-slate-400">{currentQ.category}</span>
            </div>

            {/* Scenario prompt */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQ.scenario}
              </h3>
            </div>

            {/* Options list */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-[#00DF89] bg-[#00DF89]/10 text-white font-medium shadow-sm'
                        : 'border-slate-800 bg-[#070B14] hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center shrink-0 text-xs mt-0.5 font-bold">
                      {isSelected ? '✓' : ''}
                    </span>
                    <span className="leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Free Text / Other Custom Approach */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Have a custom or alternative business approach?</span>
                <span className="text-[10px] text-[#00DF89] font-mono">OPTIONAL</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otherInput}
                  onChange={(e) => setOtherInput(e.target.value)}
                  placeholder="Describe your reasoning or alternative trade-off..."
                  className="flex-1 px-3 py-2 bg-[#070B14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00DF89]"
                />
                <button
                  onClick={() => handleSaveOtherAnswer(currentQ.id)}
                  disabled={!otherInput.trim()}
                  className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl disabled:opacity-40"
                >
                  Submit Custom →
                </button>
              </div>
            </div>

            {/* Navigation back and skip controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
              >
                ← Previous Question
              </button>

              <div className="text-slate-500 font-mono text-[11px]">
                {answeredCount} of {activeQuestions.length} answered
              </div>

              {currentQuestionIdx < activeQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                >
                  Skip Question →
                </button>
              ) : (
                <button
                  onClick={() => setStep('report')}
                  className="px-4 py-1.5 rounded-lg bg-[#00DF89] text-slate-950 font-bold hover:bg-[#00c97b]"
                >
                  Calculate Report →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          STAGE 3: COMPREHENSIVE TAILORED REPORTS
      ========================================== */}
      {step === 'report' && (
        <div className="space-y-8 animate-fade-in">
          {/* TRACK 1 REPORT: DOMAIN FIT + DUAL SPECIALIZATION */}
          {activeTrack === 'domain_fit' && track1Results && (
            <div className="space-y-6">
              {/* Personality Archetype Card (Especially for Aspiring Candidates) */}
              {track1Results.archetype && (
                <div className="bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-[#00DF89]/60 shadow-2xl space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-[#00DF89]/5 blur-[90px] pointer-events-none"></div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-[#00DF89] uppercase tracking-wider">
                      <span>✨ YOUR PERSONALITY ARCHETYPE</span>
                      <span className="text-slate-600">·</span>
                      <span>{track1Results.enrollmentStatus === 'aspiring' ? 'Aspiring Candidate Profile' : 'Enrolled Student Profile'}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Natural Talent & Temperament</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        {track1Results.archetype.title}
                      </h2>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00DF89]/10 text-[#00DF89] border border-[#00DF89]/30">
                        Fits {DOMAINS[track1Results.topDomain].name}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#00DF89]">
                      {track1Results.archetype.tagline}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                      {track1Results.archetype.description}
                    </p>
                    <div className="italic text-xs text-slate-300 border-l-2 border-[#00DF89] pl-3 py-1">
                      “{track1Results.archetype.quote}”
                    </div>
                  </div>

                  {/* Core Strengths & Personality Badges */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {track1Results.archetype.traits.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#070B14] border border-slate-700/80 text-slate-200 flex items-center gap-1.5"
                      >
                        <span className="text-[#00DF89]">✓</span>
                        <span>{trait}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Winning Domain Card */}
              <div className="bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00DF89]/10 border border-[#00DF89]/30 text-[#00DF89] text-[11px] font-bold">
                  <span>★ TOP SPECIALIZATION MATCH</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {DOMAINS[track1Results.topDomain].name} fits you completely
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                    Based on your scenario problem-solving instincts, you naturally lean towards{' '}
                    <span className="text-[#00DF89] font-semibold">{DOMAINS[track1Results.topDomain].tagline}</span>.
                    You prioritize real-world impact through{' '}
                    {track1Results.topDomain === 'marketing' && 'creative consumer resonance, brand equity defense, and go-to-market storytelling'}
                    {track1Results.topDomain === 'product' && 'user empathy, data-driven feature prioritization, and pragmatic cross-functional execution'}
                    {track1Results.topDomain === 'finance' && 'rigorous balance-sheet discipline, financial modeling, and risk-adjusted capital allocation'}
                    {track1Results.topDomain === 'consulting' && 'structured Pyramid Principle synthesis, hypothesis-driven problem solving, and executive advisory'}
                    {track1Results.topDomain === 'hr' && 'empathetic stakeholder mediation, organizational design, and talent development'}
                    {track1Results.topDomain === 'operations' && 'supply chain reliability, process optimization, and inventory velocity'}
                    {track1Results.topDomain === 'analytics' && 'statistical hypothesis testing, SQL telemetry, and empirical decision engineering'}
                    {track1Results.topDomain === 'sales_gm' && 'commercial dealmaking, client account retention, and multi-functional P&L stewardship'}.
                  </p>
                </div>

                {/* Domain Fit Bars */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Normalized Fit Across All 8 Disciplines:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {track1Results.sortedDomains.map((dom) => (
                      <div key={dom} className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>{DOMAINS[dom].name}</span>
                          <span className="font-mono font-bold text-white">{track1Results.normalizedScores[dom]}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${dom === track1Results.topDomain ? 'bg-[#00DF89]' : 'bg-slate-700'}`}
                            style={{ width: `${track1Results.normalizedScores[dom]}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DUAL SPECIALIZATION RECOMMENDATION (USER USE-CASE) */}
              <div className="bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-[#00DF89]/40 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#00DF89] uppercase tracking-wider">
                    <span>⚡ DUAL SPECIALIZATION RECOMMENDATION</span>
                    <span className="text-slate-600">·</span>
                    <span>YEAR 2 / MAJOR + MINOR</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Campus Placement Advantage</span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">Your Recommended Dual Pairing:</div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {track1Results.dualSpec.title}
                  </h3>
                  <div className="text-xs font-semibold text-[#00DF89]">
                    {track1Results.dualSpec.tagline}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                    {track1Results.dualSpec.synergyRationale}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
                  <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-1.5">
                    <div className="font-bold text-white">High-Placement Roles Unlocked:</div>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {track1Results.dualSpec.targetRoles.map((r, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-[#00DF89]">✓</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-1.5">
                    <div className="font-bold text-white">Why This Gives Placement Leverage:</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {track1Results.dualSpec.campusAdvantage}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setSelectedDomain(track1Results.topDomain);
                      setActiveTrack('know_specialization');
                      setStep('report');
                    }}
                    className="px-5 py-2.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold text-xs rounded-xl transition-all"
                  >
                    View Target Roles for {DOMAINS[track1Results.topDomain].shortName} →
                  </button>
                  <button
                    onClick={() => onNavigateTab('resume')}
                    className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800"
                  >
                    Build Resume for this Specialization →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TRACK 2 REPORT: I KNOW MY SPECIALIZATION (2-3 ROLES + BACKUPS + DOSSIER) */}
          {activeTrack === 'know_specialization' && track2Results && (
            <div className="space-y-6">
              <div className="bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#14B8A6] uppercase tracking-wider">
                  <span>SPECIALIZATION ROLE BLUEPRINT</span>
                  <span className="text-slate-600">·</span>
                  <span>{track2Results.domainInfo.name}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Target Roles & Campus Fallback Strategy
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                  During MBA campus placements, relying on a single aspirational role creates risk if that company reduces hiring quotas. Below is your 3-role portfolio: your primary aspiration, high-fit alternative, and campus placement fallback role.
                </p>
              </div>

              {/* 2-3 Roles Dossiers */}
              <div className="space-y-5">
                {track2Results.recommendedRoles.map((item, idx) => (
                  <div
                    key={idx}
                    className={`bg-[#0E1526] rounded-2xl border p-6 space-y-4 shadow-xl transition-all ${
                      idx === 0 ? 'border-[#00DF89]/50' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            idx === 0
                              ? 'bg-[#00DF89]/10 text-[#00DF89] border border-[#00DF89]/30'
                              : idx === 1
                              ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30'
                              : 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                          }`}
                        >
                          {item.tier}
                        </span>
                        <h3 className="text-lg font-bold text-white">{item.role.title}</h3>
                      </div>
                      <div className="text-xs font-mono font-bold text-[#00DF89]">
                        Campus CTC: {item.role.salaryRangeINR}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{item.reason}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                      {/* Box 1: What to Expect */}
                      <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-1.5">
                        <div className="font-bold text-white">What to Expect on the Job:</div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{item.role.description}</p>
                      </div>

                      {/* Box 2: 3-5 Year Career Path */}
                      <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-1.5">
                        <div className="font-bold text-white">3–5 Year Career Trajectory:</div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Progression from Post-MBA Lead to Director / Head of {item.role.domain} in 4 years. High exit opportunities to strategy consulting or scale-up leadership.
                        </p>
                      </div>

                      {/* Box 3: Interview Prep */}
                      <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-1.5">
                        <div className="font-bold text-white">How to Crack the Interview:</div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Keywords: {item.role.keywords.slice(0, 4).join(', ')}. Certs: {item.role.certifications[0] || 'Standard Case Prep'}.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Benchmark in Job Match</span>
                      <button
                        onClick={() => {
                          onNavigateTab('match');
                        }}
                        className="text-[#00DF89] font-bold hover:underline"
                      >
                        Match JD for {item.role.title} →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRACK 3 REPORT: I KNOW THE ROLE I WANT (READINESS + 90-DAY PLAN) */}
          {activeTrack === 'know_role' && track3Results && (
            <div className="space-y-6">
              <div className="bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                      <span>ROLE READINESS REALITY CHECK</span>
                      <span className="text-slate-600">·</span>
                      <span className="capitalize">{track3Results.experienceLevel} Baseline</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {track3Results.targetRole.title}
                    </h2>
                  </div>

                  {/* Big Circular Score */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full border-4 border-[#00DF89] bg-[#00DF89]/10 flex items-center justify-center">
                      <span className="text-2xl font-black text-white tabular-nums">
                        {track3Results.readinessScore}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      <div className="font-bold text-white">Readiness Index</div>
                      <div>Out of 100</div>
                    </div>
                  </div>
                </div>

                {/* Strengths vs Gaps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-[#00DF89]">Key Strengths Demonstrated:</div>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {track3Results.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#00DF89]">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-rose-400">Critical Gaps to Close:</div>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {track3Results.gaps.map((g, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400">!</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* ACTIONABLE 90-DAY PLAN */}
              <div className="bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#00DF89] uppercase tracking-wider">
                    <span>CLOSING THE GAP</span>
                    <span className="text-slate-600">·</span>
                    <span>ACTIONABLE TIMELINE</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Your 90-Day Placement Execution Plan
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  {/* Days 1-30 */}
                  <div className="p-5 bg-[#070B14] rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="font-mono text-[#00DF89] font-bold text-xs">PHASE 1</span>
                      <h4 className="font-bold text-white">{track3Results.plan90Days.days1_30.phase}</h4>
                      <ul className="space-y-2 text-slate-400 text-[11px] pt-1">
                        {track3Results.plan90Days.days1_30.items.map((it, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#00DF89]">▸</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-500 font-mono">Focus: Foundations</div>
                  </div>

                  {/* Days 31-60 */}
                  <div className="p-5 bg-[#070B14] rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="font-mono text-[#14B8A6] font-bold text-xs">PHASE 2</span>
                      <h4 className="font-bold text-white">{track3Results.plan90Days.days31_60.phase}</h4>
                      <ul className="space-y-2 text-slate-400 text-[11px] pt-1">
                        {track3Results.plan90Days.days31_60.items.map((it, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#14B8A6]">▸</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-500 font-mono">Focus: Case & Bullets</div>
                  </div>

                  {/* Days 61-90 */}
                  <div className="p-5 bg-[#070B14] rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="font-mono text-amber-400 font-bold text-xs">PHASE 3</span>
                      <h4 className="font-bold text-white">{track3Results.plan90Days.days61_90.phase}</h4>
                      <ul className="space-y-2 text-slate-400 text-[11px] pt-1">
                        {track3Results.plan90Days.days61_90.items.map((it, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400">▸</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-500 font-mono">Focus: Live Mocks</div>
                  </div>
                </div>

                {/* Direct Action Bridges */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
                  <button
                    onClick={() => onNavigateTab('resume')}
                    className="px-5 py-2.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold text-xs rounded-xl transition-all shadow"
                  >
                    Calibrate Resume Bullets for {track3Results.targetRole.title} →
                  </button>
                  <button
                    onClick={() => onNavigateTab('match')}
                    className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800"
                  >
                    Match a Live Job Description →
                  </button>
                  <button
                    onClick={() => onNavigateTab('target')}
                    className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800"
                  >
                    Find Alumni in this Role on LinkedIn →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
