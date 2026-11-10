import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DomainId,
  ExperienceLevel,
  Track3Question,
  Track3Report,
  TagDef,
  ResolvedRole,
} from './types';
import { TRACK3_DOMAINS, DOMAIN_MAP, PRESET_ROLES } from './presets';
import {
  TRACK3_TAGS,
  AI_TAGS,
  TAG_MAP,
  getDomainGroups,
  SkillGroup,
} from './tags';
import { SHARED_QUESTIONS, selectModuleQuestions } from './questions';
import { selectAIQuestions } from './aiQuestions';
import { resolveTargetRole } from './resolveRole';
import { scoreTrack3Session } from './scoring';

interface Track3ViewProps {
  onBackToTracks?: () => void;
  onBuildResume?: (targetRole: string) => void;
}

type SubScreen = '2a' | '2b' | '2c' | '2d';

// Fisher-Yates shuffle that returns a new array with randomly ordered options
function shuffleOptions<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const Track3View: React.FC<Track3ViewProps> = ({
  onBackToTracks,
  onBuildResume,
}) => {
  // Navigation state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [subScreen, setSubScreen] = useState<SubScreen>('2a');

  // Step 1: Journey / Experience level
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>('Fresher');

  // Step 2a: Domain selection & search
  const [domainSearchQuery, setDomainSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<DomainId | null>(null);

  // Step 2b: Role selection
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isTypingRole, setIsTypingRole] = useState(false);
  const [typedRoleText, setTypedRoleText] = useState('');
  const [resolvedTypedRole, setResolvedTypedRole] =
    useState<ResolvedRole | null>(null);

  // Step 2c: Skill & AI tag picker
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedAITagLabels, setSelectedAITagLabels] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [isAIFamilyOpen, setIsAIFamilyOpen] = useState(false);

  // Step 2d: Questions player
  const [sessionQuestions, setSessionQuestions] = useState<Track3Question[]>(
    []
  );
  // Store displayed shuffled options per question id: questionId -> shuffled option array
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<
    Record<string, Track3Question['options']>
  >({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}); // questionId -> optionId ('o1'|'o2'|'o3'|'o4')
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Step 3: Generated Report
  const [report, setReport] = useState<Track3Report | null>(null);

  // Filtered domains based on domainSearchQuery (matches domain labels, preset labels/aliases, tag labels/aliases)
  const filteredDomains = useMemo(() => {
    const q = domainSearchQuery.trim().toLowerCase();
    if (!q) return TRACK3_DOMAINS;

    return TRACK3_DOMAINS.filter((domain) => {
      // Domain label match
      if (domain.label.toLowerCase().includes(q)) return true;

      // Presets in this domain
      const presets = PRESET_ROLES.filter((p) => p.domain === domain.id);
      for (const p of presets) {
        if (p.title.toLowerCase().includes(q)) return true;
        if (p.aliases.some((a) => a.toLowerCase().includes(q))) return true;
      }

      // Tags in this domain
      const tags = TRACK3_TAGS.filter((t) => t.domain === domain.id);
      for (const t of tags) {
        if (t.label.toLowerCase().includes(q)) return true;
        if (t.aliases.some((a) => a.toLowerCase().includes(q))) return true;
      }

      return false;
    });
  }, [domainSearchQuery]);

  // Presets in selected domain
  const presetsInDomain = useMemo(() => {
    if (!selectedDomain) return [];
    const q = roleSearchQuery.trim().toLowerCase();
    const presets = PRESET_ROLES.filter((p) => p.domain === selectedDomain);
    if (!q) return presets;
    return presets.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }, [selectedDomain, roleSearchQuery]);

  // Skill groups for selected domain
  const domainGroups: SkillGroup[] = useMemo(() => {
    if (!selectedDomain) return [];
    return getDomainGroups(selectedDomain);
  }, [selectedDomain]);

  // AI Skill groups
  const aiGroups: SkillGroup[] = useMemo(() => {
    return getDomainGroups('ai');
  }, []);

  // Initialize group collapse state when domain changes (first two open)
  useEffect(() => {
    if (domainGroups.length > 0) {
      const initial: Record<string, boolean> = {};
      domainGroups.forEach((g, idx) => {
        initial[g.groupId] = idx < 2;
      });
      setOpenGroups(initial);
    }
  }, [domainGroups]);

  // Auto-expand group if search query matches tags within it
  useEffect(() => {
    const q = tagSearchQuery.trim().toLowerCase();
    if (!q) return;

    const updated = { ...openGroups };
    for (const group of domainGroups) {
      const hasMatch = group.tags.some(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          t.aliases.some((a) => a.toLowerCase().includes(q))
      );
      if (hasMatch) {
        updated[group.groupId] = true;
      }
    }

    const hasAIMatch = AI_TAGS.some(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.aliases.some((a) => a.toLowerCase().includes(q))
    );
    if (hasAIMatch) {
      setIsAIFamilyOpen(true);
    }

    setOpenGroups(updated);
  }, [tagSearchQuery, domainGroups]);

  // Handlers
  const handleSelectDomain = (domainId: DomainId) => {
    setSelectedDomain(domainId);
    setSelectedPresetId(null);
    setIsTypingRole(false);
    setRoleSearchQuery('');
    setSubScreen('2b');
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_ROLES.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setIsTypingRole(false);
    setResolvedTypedRole(null);

    // Pre-fill tags
    setSelectedTagIds([...preset.tags]);
    setSelectedAITagLabels(preset.aiTags ? [...preset.aiTags] : []);
    setSubScreen('2c');
  };

  const handleApplyTypedRole = (customInput: string) => {
    const resolved = resolveTargetRole(customInput, selectedDomain || undefined);
    setResolvedTypedRole(resolved);
    setSelectedPresetId(resolved.presetId || null);
    setSelectedDomain(resolved.domainId);
    setSelectedTagIds([...resolved.tags]);
    setSelectedAITagLabels(resolved.aiTags ? [...resolved.aiTags] : []);
    setSubScreen('2c');
  };

  const toggleDomainTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const toggleAITag = (tagLabel: string) => {
    if (selectedAITagLabels.includes(tagLabel)) {
      setSelectedAITagLabels(
        selectedAITagLabels.filter((label) => label !== tagLabel)
      );
    } else {
      if (selectedAITagLabels.length >= 8) return;
      setSelectedAITagLabels([...selectedAITagLabels, tagLabel]);
    }
  };

  // Start question assessment
  const handleStartQuestions = () => {
    if (selectedTagIds.length < 3) return;
    if (selectedAITagLabels.length > 8) return;
    if (!selectedDomain) return;

    // 1. Shared questions (4)
    const shared = [...SHARED_QUESTIONS];

    // 2. Module questions (6)
    const modulePicked = selectModuleQuestions(selectedDomain, selectedTagIds);

    // 3. AI questions (3 if any AI tag selected)
    const aiPicked =
      selectedAITagLabels.length > 0
        ? selectAIQuestions(selectedAITagLabels)
        : [];

    const allSessionQ = [...shared, ...modulePicked, ...aiPicked];
    setSessionQuestions(allSessionQ);

    // Prepare shuffled options for display (random display order, labels A-D assigned AFTER shuffle)
    const optMap: Record<string, Track3Question['options']> = {};
    for (const q of allSessionQ) {
      optMap[q.id] = shuffleOptions(q.options);
    }
    setShuffledOptionsMap(optMap);

    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSubScreen('2d');
  };

  const handleSelectAnswer = (optionId: string) => {
    const currentQ = sessionQuestions[currentQuestionIndex];
    if (!currentQ) return;

    const updatedAnswers = {
      ...userAnswers,
      [currentQ.id]: optionId,
    };
    setUserAnswers(updatedAnswers);

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    // Auto-advance directly to the next question smoothly after a brief 260ms visual feedback
    autoAdvanceTimerRef.current = setTimeout(() => {
      if (currentQuestionIndex < sessionQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        handleSubmitAssessment(updatedAnswers);
      }
    }, 260);
  };

  const handleNextQuestion = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (currentQuestionIndex < sessionQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmitAssessment();
    }
  };

  const handlePrevQuestion = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitAssessment = (answersOverride?: Record<string, string>) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (!selectedDomain) return;

    const answersToUse = answersOverride || userAnswers;

    const roleTitle =
      resolvedTypedRole?.roleTitle ||
      PRESET_ROLES.find((p) => p.id === selectedPresetId)?.title ||
      DOMAIN_MAP[selectedDomain].label;

    const confidence = resolvedTypedRole?.confidence || 'high';

    const reportResult = scoreTrack3Session({
      roleTitle,
      domainId: selectedDomain,
      level: experienceLevel,
      confidence,
      presetId: selectedPresetId || undefined,
      selectedTagIds,
      selectedAITags: selectedAITagLabels,
      questions: sessionQuestions,
      answers: answersToUse,
      isTypedRole: Boolean(resolvedTypedRole?.isTyped),
    });

    setReport(reportResult);
    setCurrentStep(3);
  };

  const handleRetakeAssessment = () => {
    // Retake with same role, tags, level
    if (sessionQuestions.length > 0) {
      // Re-shuffle option display order
      const optMap: Record<string, Track3Question['options']> = {};
      for (const q of sessionQuestions) {
        optMap[q.id] = shuffleOptions(q.options);
      }
      setShuffledOptionsMap(optMap);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setCurrentStep(2);
      setSubScreen('2d');
    } else {
      handleStartQuestions();
    }
  };

  const handleChooseDifferentRole = () => {
    setCurrentStep(2);
    setSubScreen('2a');
    setSelectedPresetId(null);
    setResolvedTypedRole(null);
  };

  // Helper colors
  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (score >= 55) return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    if (score >= 35) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === 'Above strong bar')
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (status === 'Meets expected bar')
      return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-slate-100">
      {/* Top Header Card */}
      <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase font-mono">
              Track 3 • Targeted Role Readiness
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
              Step {currentStep} of 3
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            {currentStep === 1 && 'Select Your Career Journey'}
            {currentStep === 2 && 'Calibrate Role, Skills & Scenarios'}
            {currentStep === 3 && 'Your Tailored Role Readiness Report'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {currentStep === 1 &&
              'Choose your experience level. This calibrates the expected performance benchmarks without altering the questions.'}
            {currentStep === 2 &&
              'Search and pick your target role, refine required skills, and answer calibrated decision scenarios.'}
            {currentStep === 3 &&
              'Rule-based evaluation of your competencies, assessed skill groups, strengths, and next actions.'}
          </p>
        </div>

        {onBackToTracks && (
          <button
            onClick={onBackToTracks}
            className="self-start sm:self-center px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-lg transition"
          >
            ← Back to Compass
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* STEP 1: SELECT JOURNEY                                      */}
      {/* ============================================================ */}
      {currentStep === 1 && (
        <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              What is your current career stage?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(
              [
                {
                  id: 'Fresher',
                  title: 'Fresher',
                  subtitle: 'Final-year student or recent graduate (< 1 year)',
                },
                {
                  id: 'Intern / Internship completed',
                  title: 'Intern / Post-Intern',
                  subtitle: 'Completed 1+ formal internships with practical delivery',
                },
                {
                  id: '1+ year experience',
                  title: '1+ Year Experience',
                  subtitle: 'Working professional or lateral entry with industry tenure',
                },
              ] as const
            ).map((item) => {
              const isSelected = experienceLevel === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setExperienceLevel(item.id);
                    setCurrentStep(2);
                    setSubScreen('2a');
                  }}
                  className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-lg ring-1 ring-emerald-500/50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-base">
                        {item.title}
                      </span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500 text-black'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                setCurrentStep(2);
                setSubScreen('2a');
              }}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              Continue to Step 2: Choose Target Role →
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: SCENARIOS (CALIBRATE & ANSWER)                       */}
      {/* ============================================================ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Subscreen 2a: Domain Picker */}
          {subScreen === '2a' && (
            <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    Step 2a • Functional Domain
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    Select your specialization or career area
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="self-start text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg transition"
                >
                  ← Change Journey ({experienceLevel})
                </button>
              </div>

              {/* Search box */}
              <div className="relative">
                <input
                  type="text"
                  value={domainSearchQuery}
                  onChange={(e) => setDomainSearchQuery(e.target.value)}
                  placeholder="Search domains, roles (e.g. 'PM', 'Consultant', 'Supply Chain'), or skills (e.g. 'SQL', 'MECE')..."
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                {domainSearchQuery && (
                  <button
                    onClick={() => setDomainSearchQuery('')}
                    className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* 7 Domain Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDomains.map((domain) => (
                  <div
                    key={domain.id}
                    onClick={() => handleSelectDomain(domain.id)}
                    className="cursor-pointer group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-5 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-base group-hover:text-emerald-400 transition">
                        {domain.label}
                      </span>
                      <span className="text-slate-500 group-hover:text-emerald-400 transition text-sm">
                        →
                      </span>
                    </div>

                    {/* Presets preview */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_ROLES.filter((p) => p.domain === domain.id)
                        .slice(0, 4)
                        .map((p) => (
                          <span
                            key={p.id}
                            className="text-[11px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/40"
                          >
                            {p.title}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {filteredDomains.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No matching domains found. Try searching for specific roles or choose "General Management".
                </div>
              )}
            </div>
          )}

          {/* Subscreen 2b: Role Picker */}
          {subScreen === '2b' && selectedDomain && (
            <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    Step 2b • Select Preset Role in {DOMAIN_MAP[selectedDomain].label}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    Which target role describes what you are pursuing?
                  </h2>
                </div>
                <button
                  onClick={() => setSubScreen('2a')}
                  className="self-start text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg transition"
                >
                  ← Choose Different Domain
                </button>
              </div>

              {/* Search box for roles */}
              <div className="relative">
                <input
                  type="text"
                  value={roleSearchQuery}
                  onChange={(e) => setRoleSearchQuery(e.target.value)}
                  placeholder={`Search roles in ${DOMAIN_MAP[selectedDomain].label}...`}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Roles list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presetsInDomain.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className="cursor-pointer group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-5 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-base group-hover:text-emerald-400 transition">
                        {preset.title}
                      </span>
                      <span className="text-xs text-emerald-400 font-mono">
                        {preset.tags.length} skills pre-selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[11px] text-slate-400">
                      {preset.tags.slice(0, 4).map((tId) => (
                        <span
                          key={tId}
                          className="bg-slate-800 px-2 py-0.5 rounded text-slate-300"
                        >
                          {TAG_MAP[tId]?.label || tId}
                        </span>
                      ))}
                      {preset.tags.length > 4 && (
                        <span className="text-slate-500 self-center">
                          +{preset.tags.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Final Card: "My role isn't listed" */}
                <div
                  onClick={() => setIsTypingRole(true)}
                  className={`cursor-pointer rounded-xl p-5 border transition space-y-2 ${
                    isTypingRole
                      ? 'border-emerald-500 bg-emerald-950/20'
                      : 'border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-base">
                      ✏️ My role isn't listed
                    </span>
                    <span className="text-xs text-slate-400">Custom match</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Type your specific role title (e.g. "DevOps PM", "Pricing Specialist", "Growth Associate"). We will match it rule-based.
                  </p>
                </div>
              </div>

              {/* Typed Role Box */}
              {isTypingRole && (
                <div className="mt-4 p-5 bg-slate-900 border border-slate-700 rounded-xl space-y-3">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Type your target role:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={typedRoleText}
                      onChange={(e) => setTypedRoleText(e.target.value)}
                      placeholder="e.g. SCM manager, UX researcher, FinOps Analyst, Talent Partner..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && typedRoleText.trim()) {
                          handleApplyTypedRole(typedRoleText);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleApplyTypedRole(typedRoleText)}
                      disabled={!typedRoleText.trim()}
                      className="px-4 py-2.5 bg-emerald-500 disabled:opacity-50 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition"
                    >
                      Calibrate Skills →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subscreen 2c: Hierarchical Tag Picker */}
          {subScreen === '2c' && selectedDomain && (
            <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
              {/* Header & Sticky Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    Step 2c • Skill Verification
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    Review and tailor your required skills
                  </h2>
                  {resolvedTypedRole && (
                    <div className="mt-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg">
                      {resolvedTypedRole.confidence === 'low'
                        ? 'We could not match this role, so we started with General Management skills. Pick the skills that fit your role.'
                        : `We understood this as: ${resolvedTypedRole.roleTitle}. Adjust the skills below so they match what you will actually do.`}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSubScreen('2b')}
                  className="self-start text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg transition"
                >
                  ← Change Role
                </button>
              </div>

              {/* Counters & Note */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-semibold px-2.5 py-1 rounded-md border ${
                        selectedTagIds.length >= 3
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      Domain Skills: {selectedTagIds.length} selected (min 3)
                    </span>
                    <span className="font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/40">
                      AI & Automation: {selectedAITagLabels.length} of 8 (optional)
                    </span>
                  </div>

                  <button
                    onClick={handleStartQuestions}
                    disabled={selectedTagIds.length < 3}
                    className="px-5 py-2 bg-emerald-500 disabled:opacity-40 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-md shadow-emerald-500/20"
                  >
                    Start Assessment ({selectedAITagLabels.length > 0 ? '13' : '10'} Questions) →
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 Your questions are chosen from the skill groups of your selected skills. One session can assess up to 6 skill groups, so choose the ones that matter most for your role.
                </p>

                {/* Sticky Active Selected Tag Badges */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                  {selectedTagIds.map((tId) => {
                    const tag = TAG_MAP[tId];
                    return (
                      <span
                        key={tId}
                        className="inline-flex items-center gap-1.5 text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 px-2.5 py-1 rounded-md"
                      >
                        {tag?.label || tId}
                        {tag?.kind === 'tool' && (
                          <span className="text-[9px] uppercase font-mono px-1 bg-emerald-900/80 text-emerald-400 rounded">
                            tool
                          </span>
                        )}
                        <button
                          onClick={() => toggleDomainTag(tId)}
                          className="hover:text-white ml-0.5 text-xs"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}

                  {selectedAITagLabels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 text-xs bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 px-2.5 py-1 rounded-md"
                    >
                      🤖 {label}
                      <button
                        onClick={() => toggleAITag(label)}
                        className="hover:text-white ml-0.5 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tag Search Box */}
              <div className="relative">
                <input
                  type="text"
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  placeholder="Filter skills by keyword (e.g. 'Power BI', 'SQL', 'Prompt engineering', 'MECE')..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Domain Skill Groups (Collapsible) */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  {DOMAIN_MAP[selectedDomain].label} Skill Groups
                </h3>

                {domainGroups.map((group) => {
                  const isOpen = Boolean(openGroups[group.groupId]);
                  const q = tagSearchQuery.trim().toLowerCase();
                  const filteredTags = q
                    ? group.tags.filter(
                        (t) =>
                          t.label.toLowerCase().includes(q) ||
                          t.aliases.some((a) => a.toLowerCase().includes(q))
                      )
                    : group.tags;

                  if (filteredTags.length === 0 && q) return null;

                  return (
                    <div
                      key={group.groupId}
                      className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setOpenGroups((prev) => ({
                            ...prev,
                            [group.groupId]: !isOpen,
                          }))
                        }
                        className="w-full px-4 py-3 bg-slate-900/80 hover:bg-slate-800/80 flex items-center justify-between text-left transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {group.groupName}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({group.tags.length} skills)
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {isOpen ? '▲ Collapse' : '▼ Expand'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="p-4 flex flex-wrap gap-2 bg-slate-950/40">
                          {filteredTags.map((tag) => {
                            const isSelected = selectedTagIds.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                onClick={() => toggleDomainTag(tag.id)}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-emerald-500 text-slate-950 font-semibold border-emerald-400 shadow-sm'
                                    : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:border-slate-600 hover:text-white'
                                }`}
                              >
                                {tag.label}
                                {tag.kind === 'tool' && (
                                  <span
                                    className={`text-[9px] uppercase px-1 rounded font-mono ${
                                      isSelected
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    tool
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Extra Accordion: AI & Automation Family */}
              <div className="border border-indigo-900/50 bg-indigo-950/20 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsAIFamilyOpen(!isAIFamilyOpen)}
                  className="w-full px-4 py-3.5 bg-indigo-950/40 hover:bg-indigo-900/40 flex items-center justify-between text-left transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                      🤖 AI & Automation Skills (Optional Module)
                    </span>
                    <span className="text-xs text-indigo-400 font-mono">
                      {selectedAITagLabels.length} of 8 selected
                    </span>
                  </div>
                  <span className="text-xs text-indigo-300">
                    {isAIFamilyOpen ? '▲ Collapse' : '▼ Expand'}
                  </span>
                </button>

                {isAIFamilyOpen && (
                  <div className="p-4 space-y-4 bg-slate-950/60">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Selecting AI tags will append 3 targeted AI scenarios to your assessment. AI score measures tool-agnostic automation readiness and does not alter your core domain readiness score.
                    </p>

                    {aiGroups.map((group) => {
                      const q = tagSearchQuery.trim().toLowerCase();
                      const filteredTags = q
                        ? group.tags.filter(
                            (t) =>
                              t.label.toLowerCase().includes(q) ||
                              t.aliases.some((a) => a.toLowerCase().includes(q))
                          )
                        : group.tags;

                      if (filteredTags.length === 0 && q) return null;

                      return (
                        <div key={group.groupId} className="space-y-2">
                          <span className="text-xs font-semibold text-slate-300 block">
                            {group.groupName}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {filteredTags.map((tag) => {
                              const isSelected = selectedAITagLabels.includes(
                                tag.label
                              );
                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => toggleAITag(tag.label)}
                                  className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                                    isSelected
                                      ? 'bg-indigo-500 text-white font-semibold border-indigo-400 shadow-sm'
                                      : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:border-slate-600 hover:text-white'
                                  }`}
                                >
                                  {tag.label}
                                  {tag.kind === 'tool' && (
                                    <span
                                      className={`text-[9px] uppercase px-1 rounded font-mono ${
                                        isSelected
                                          ? 'bg-indigo-700 text-white'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      tool
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subscreen 2d: Questions Player */}
          {subScreen === '2d' && sessionQuestions.length > 0 && (
            <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              {/* Progress Bar & Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider">
                    Question {currentQuestionIndex + 1} of{' '}
                    {sessionQuestions.length}
                  </span>
                  <span>
                    {sessionQuestions[currentQuestionIndex].domain === 'shared' &&
                      'Shared Foundations Scenario'}
                    {sessionQuestions[currentQuestionIndex].domain ===
                      selectedDomain &&
                      `${DOMAIN_MAP[selectedDomain].label} Specialized Scenario`}
                    {sessionQuestions[currentQuestionIndex].domain === 'ai' &&
                      'AI & Automation Scenario'}
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentQuestionIndex + 1) /
                          sessionQuestions.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="p-5 sm:p-6 bg-slate-900/80 border border-slate-800 rounded-xl">
                <h3 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                  {sessionQuestions[currentQuestionIndex].text}
                </h3>
              </div>

              {/* Options List (Shuffled at display time, labeled A to D AFTER shuffle) */}
              <div className="space-y-3">
                {(
                  shuffledOptionsMap[
                    sessionQuestions[currentQuestionIndex].id
                  ] || sessionQuestions[currentQuestionIndex].options
                ).map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D'
                  const isSelected =
                    userAnswers[
                      sessionQuestions[currentQuestionIndex].id
                    ] === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectAnswer(opt.id)}
                      className={`cursor-pointer rounded-xl p-4 border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/25 ring-1 ring-emerald-500/50 shadow-md'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {letter}
                      </span>
                      <p className="text-sm text-slate-200 leading-relaxed pt-0.5">
                        {opt.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 bg-slate-900 border border-slate-800 rounded-lg transition"
                >
                  ← Previous
                </button>

                <div className="text-xs text-slate-500 font-mono">
                  {Object.keys(userAnswers).length} of {sessionQuestions.length}{' '}
                  answered
                </div>

                <button
                  onClick={handleNextQuestion}
                  disabled={
                    !userAnswers[sessionQuestions[currentQuestionIndex].id]
                  }
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20"
                >
                  {currentQuestionIndex === sessionQuestions.length - 1
                    ? 'Submit & View Report →'
                    : 'Next Scenario →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: TAILORED REPORT                                     */}
      {/* ============================================================ */}
      {currentStep === 3 && report && (
        <div className="space-y-6">
          {/* 1. Header Card */}
          <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Official Readiness Evaluation
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {report.roleTitle}
                </h2>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-mono">
                  <span>Journey: {report.level}</span>
                  <span>•</span>
                  <span>Domain: {DOMAIN_MAP[report.domainId].label}</span>
                </div>
              </div>

              {/* Overall Readiness Badge */}
              <div
                className={`self-start sm:self-center border rounded-2xl p-5 text-center min-w-[140px] ${getScoreBadgeColor(
                  report.overallScore
                )}`}
              >
                <div className="text-3xl sm:text-4xl font-black font-mono">
                  {report.overallScore}
                  <span className="text-sm font-normal text-slate-400">/100</span>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider mt-1">
                  {report.overallLabel}
                </div>
              </div>
            </div>

            {/* 2. Scope Line */}
            <div className="pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400">
              <span className="text-slate-300 font-semibold">Assessment Scope:</span>{' '}
              {report.scopeLine}
            </div>

            {/* Warnings near top */}
            {report.lowEvidenceWarning && (
              <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-800/50 p-3 rounded-xl">
                ⚠️ Some areas were covered by only one question, so this estimate is less reliable there.
              </div>
            )}
            {report.tooManyGroupsWarning && (
              <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-800/50 p-3 rounded-xl">
                ⚠️ Your selected skills span more groups than one session can assess. Groups without questions are marked 'Not assessed'.
              </div>
            )}
          </div>

          {/* 3. Core Competency Breakdown */}
          <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Core Competency Breakdown (1.0 to 4.0 scale)
            </h3>
            <p className="text-xs text-slate-400">
              Weighted by {DOMAIN_MAP[report.domainId].label} base weights. Benchmarked against {report.level} expectations (Expected: {report.competencies[0]?.expectedBar}, Strong: {report.competencies[0]?.strongBar}).
            </p>

            <div className="space-y-3 pt-2">
              {report.competencies.map((comp) => (
                <div
                  key={comp.competency}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-semibold text-sm text-white">
                      {comp.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-300">
                        Score: <strong className="text-white">{comp.score}</strong> / 4.0
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getStatusBadgeColor(
                          comp.status
                        )}`}
                      >
                        {comp.status}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                        {comp.evidenceStrength} evidence
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar (1.0 to 4.0 normalized) */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        comp.score >= comp.strongBar
                          ? 'bg-emerald-500'
                          : comp.score >= comp.expectedBar
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, ((comp.score - 1) / 3) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Skill Groups Breakdown */}
          <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Assessed Skill Groups
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.groupScores.map((g) => (
                <div
                  key={g.groupId}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {g.groupName}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {g.score} / 4.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded border text-[10px] ${getStatusBadgeColor(
                        g.status
                      )}`}
                    >
                      {g.status}
                    </span>
                    <span>{g.evidenceStrength} evidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Your Selected Skills Status */}
          <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Your Selected Skills Assessment Status
            </h3>
            <div className="space-y-2">
              {report.selectedTags.map((t) => (
                <div
                  key={t.tagId}
                  className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800/80 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">
                      {t.label}
                    </span>
                    {t.kind === 'tool' && (
                      <span className="text-[9px] uppercase font-mono px-1 bg-slate-800 text-slate-400 rounded">
                        tool
                      </span>
                    )}
                    <span className="text-slate-500 font-mono text-[11px]">
                      ({t.groupName})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    {t.status === 'Assessed directly' && (
                      <span className="text-emerald-400 font-bold">
                        Score: {t.score} / 4.0 (Direct)
                      </span>
                    )}
                    {t.status === 'Assessed at group level' && (
                      <span className="text-blue-400">
                        {t.score} / 4.0 (group score)
                      </span>
                    )}
                    {t.status === 'Not assessed' && (
                      <span className="text-slate-500">Not assessed</span>
                    )}
                    {t.status === 'Listed (tool), assessed through group' && (
                      <span className="text-indigo-400">
                        Assessed through {t.groupName}
                      </span>
                    )}
                    {t.status === 'Listed (tool), not assessed' && (
                      <span className="text-slate-500">
                        Listed (tool), not assessed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. AI Skills (only if AI tags selected) */}
          {report.aiResult && (
            <div className="bg-[#0B111E]/95 border border-indigo-900/60 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                    Specialized Module
                  </span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🤖 AI & Automation Readiness
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluated from 3 dedicated AI scenarios. Does not alter your primary domain readiness score.
                  </p>
                </div>

                <div className="border border-indigo-500/40 bg-indigo-950/30 rounded-xl p-3 text-center min-w-[120px]">
                  <div className="text-2xl font-black font-mono text-indigo-300">
                    {report.aiResult.aiReadiness}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">
                    {report.aiResult.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {report.aiResult.groupsAssessed.map((g) => (
                  <div
                    key={g.groupId}
                    className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-3 flex justify-between items-center text-xs"
                  >
                    <span className="text-slate-200 font-semibold">
                      {g.groupName}
                    </span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {g.score} / 4.0
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Strengths and Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2">
                ✓ Validated Strengths
              </h4>
              {report.strengths.length > 0 ? (
                <div className="space-y-2">
                  {report.strengths.map((s) => (
                    <div
                      key={s.competency}
                      className="p-3 bg-slate-900/80 border border-emerald-900/30 rounded-xl flex items-center justify-between"
                    >
                      <span className="text-sm font-semibold text-white">
                        {s.label}
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {s.score} / 4.0
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No competencies met the strong bar ({report.competencies[0]?.strongBar}+) yet. Keep practising!
                </p>
              )}
            </div>

            {/* Gaps / Next to build */}
            <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-2">
                ⚡ Development Focus Areas
              </h4>
              <div className="space-y-2">
                {report.gaps.map((g) => (
                  <div
                    key={g.competency}
                    className="p-3 bg-slate-900/80 border border-amber-900/30 rounded-xl flex items-center justify-between"
                  >
                    <span className="text-sm font-semibold text-white">
                      {g.label}
                    </span>
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      {g.score} / 4.0
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 8. Missed-Question Review */}
          {report.missedQuestions.length > 0 && (
            <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">
                Missed-Scenario Review
              </h3>
              <p className="text-xs text-slate-400">
                Actionable analysis for decisions where a stronger approach exists.
              </p>

              <div className="space-y-4 pt-1">
                {report.missedQuestions.map((item, idx) => (
                  <div
                    key={item.questionId}
                    className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2.5 text-xs"
                  >
                    <div className="font-semibold text-white leading-relaxed">
                      {idx + 1}. {item.questionText}
                    </div>

                    <div className="p-2.5 bg-rose-950/20 border border-rose-900/40 rounded-lg text-rose-300">
                      <span className="font-bold text-rose-400 font-mono block mb-0.5">
                        Your Choice:
                      </span>
                      {item.userAnswerText}
                    </div>

                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-emerald-300">
                      <span className="font-bold text-emerald-400 font-mono block mb-0.5">
                        A stronger approach:
                      </span>
                      {item.strongerApproachText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Next Steps Library */}
          <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🎯</span> Recommended Next Steps
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Researched industry blueprints, framework studies, and scenario-aligned interventions tailored to your role and answers.
                </p>
              </div>
              <span className="self-start sm:self-auto text-[11px] font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                {report.nextSteps.length} Priority Milestones
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {report.nextSteps.map((step, idx) => {
                const match = step.match(/^\[(.*?)\]\s*(.*)$/);
                const tag = match ? match[1] : null;
                const text = match ? match[2] : step;

                return (
                  <div
                    key={idx}
                    className="p-4 bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl space-y-2 transition shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        {idx + 1}
                      </span>
                      {tag && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700 font-mono">
                          {tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-0 sm:pl-7">
                      {text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 10. Disclaimer */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl text-[11px] text-slate-500 leading-relaxed font-mono">
            {report.disclaimer}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleRetakeAssessment}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition"
              >
                ↻ Retake Assessment
              </button>
              <button
                onClick={handleChooseDifferentRole}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition"
              >
                ⇄ Choose Different Role
              </button>
            </div>

            {onBuildResume && (
              <button
                onClick={() => onBuildResume(report.roleTitle)}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20"
              >
                Build Resume for this Role →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
