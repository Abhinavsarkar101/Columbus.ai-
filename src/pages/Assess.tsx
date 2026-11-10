import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CATALOG_ITEMS, CATALOG_GROUPS, CatalogItem, ArchetypeCode } from '../data/catalog';
import { ARCHETYPES, ArchetypeDef } from '../data/archetypes';
import { ARCHETYPE_AVATARS } from '../data/avatars';
import { DOMAINS } from '../data/domains';
import { ROLE_BLUEPRINTS } from '../data/roleBlueprints';
import {
  MARKET_SNAPSHOT,
  HIRING_IN_AI_ERA,
  SPECIALIZATION_PROFILES,
  ROLE_FAMILY_BLURBS,
  ROLE_ANATOMIES,
  GLOSSARY,
} from '../data/content';
import {
  TRACK_A_CORE,
  TRACK_A_FOLLOWUPS,
  TRACK_A_CONTEXT,
  TRACK_B_QUESTIONS,
  TRACK_C_QUESTIONS,
  TRACK_D_CORE,
  TRACK_D_LEVEL_BLOCKS,
  TRACK_D_ROLE_BLOCKS,
  TRACK_D_ADAPTIVE,
  QuestionItem,
} from '../data/questions';
import {
  scoreA,
  scoreB,
  scoreC,
  scoreD,
  ScoreAResult,
  ScoreBResult,
  ScoreCResult,
  ScoreDResult,
} from '../lib/engine';
import { Track3View } from '../track3/Track3View';
import { storageService } from '../lib/storageService';

export type TrackType = 'A' | 'B' | 'C' | 'D';

interface TrackState {
  answers: Record<string, any>;
  currentStepIndex: number;
  stage: 'entry' | 't1_calibration' | 'step0' | 'step1' | 'questions' | 'review' | 'report';
  result?: any;
  step0Spec?: string;
  step0Role?: string;
  step1Level?: 'FRESHER' | 'INTERN' | 'LATERAL';
  userNote?: string;
  closestGroup?: string;
}

const GLOBAL_DISCLAIMER =
  "This is guidance to help you think and plan, not a guarantee. Salary information is indicative. Character references are for fun and not affiliated with any film studio. Check your college's career services and current placement reports for program-specific details.";

interface ArchetypeCardData {
  title: string;
  sub: string;
  quote: string;
  chips: string[];
}

const ARCHETYPE_EXTENDED: Record<ArchetypeCode, ArchetypeCardData> = {
  ST: {
    title: 'The Strategic Problem-Solver',
    sub: 'Structured Clarity & Executive Insight',
    quote: 'Structure turns overwhelming ambiguity into solvable puzzles.',
    chips: ['Structured Thinker', 'Hypothesis-Driven', 'Fast Learner', 'Executive Synthesizer'],
  },
  AN: {
    title: 'The Analytical Architect',
    sub: 'Data Integrity & Quantitative Precision',
    quote: 'Numbers tell the story that raw intuition cannot hide.',
    chips: ['Data-Driven', 'First-Principles Thinker', 'Detail-Oriented', 'Evidence Seeker'],
  },
  BU: {
    title: 'The Innovation Product Builder',
    sub: 'User Empathy & Rapid Prototyping',
    quote: "Don't just debate ideas — ship prototypes users can touch.",
    chips: ['Product Intuition', 'Rapid Iteration', 'User-Centric', 'Bias for Action'],
  },
  PE: {
    title: 'The Growth & Brand Champion',
    sub: 'Consumer Psychology & Narrative Influence',
    quote: 'A breakthrough product without a compelling narrative remains invisible.',
    chips: ['Persuasive Storyteller', 'Consumer Insight', 'High EQ', 'Campaign Visionary'],
  },
  CO: {
    title: 'The Cross-Functional Orchestrator',
    sub: 'Operational Flow & Executive Alignment',
    quote: 'Flawless execution turns bold corporate strategy into lasting reality.',
    chips: ['Systems Thinker', 'Cross-Functional Lead', 'Process Architect', 'Team Unifier'],
  },
  OP: {
    title: 'The Systems & Scale Optimizer',
    sub: 'Supply Chain Mastery & Process Efficiency',
    quote: 'Eliminate the bottlenecks, and the entire organization accelerates.',
    chips: ['Process Optimizer', 'Execution Discipline', 'Resource Allocator', 'Reliability Driven'],
  },
};

interface DomainPresentation {
  id: string;
  name: string;
  fitsTag: string;
  tagline: string;
  description: string;
  unlockedRoles: string[];
  dualPartner: string;
  dualTitle: string;
  dualTagline: string;
  dualDescription: string;
  placementLeverage: string;
}

const DOMAIN_PRESENTATION_MAP: Record<string, DomainPresentation> = {
  consulting: {
    id: 'consulting',
    name: 'Management Consulting & Strategy',
    fitsTag: 'Fits Management Consulting & Strategy',
    tagline: 'Structured problem-solving, hypothesis-driven synthesis & C-suite advisory',
    description: 'You prioritize real-world impact through structured Pyramid Principle synthesis, hypothesis-driven problem solving, and executive advisory.',
    unlockedRoles: ['Strategy Consultant', 'Corporate Development Associate', 'Management Trainee (Leadership)'],
    dualPartner: 'finance',
    dualTitle: 'Corporate Finance + Management Consulting',
    dualTagline: 'The Strategic M&A and Corporate Advisory Powerhouse',
    dualDescription: 'Merges rigorous 3-statement financial modeling (LBO/DCF) with structured Pyramid Principle strategic advisory.',
    placementLeverage: 'Gold standard profile for Tier-1 strategy firms (McKinsey, BCG, Bain) and Private Equity portfolio operations.',
  },
  finance: {
    id: 'finance',
    name: 'Corporate Finance & Investment Banking',
    fitsTag: 'Fits Corporate Finance & Investment Banking',
    tagline: 'Capital allocation, financial modeling, valuation & deal advisory',
    description: 'You prioritize capital efficiency, balance sheet discipline, valuation mechanics, and structured risk mitigation.',
    unlockedRoles: ['Investment Banker', 'Corporate Development Associate', 'FP&A Strategic Manager'],
    dualPartner: 'consulting',
    dualTitle: 'Corporate Finance + Management Consulting',
    dualTagline: 'The Strategic M&A and Corporate Advisory Powerhouse',
    dualDescription: 'Merges rigorous 3-statement financial modeling (LBO/DCF) with structured Pyramid Principle strategic advisory.',
    placementLeverage: 'Premier track for global investment banks, private equity portfolio firms, and Fortune 500 corporate finance desks.',
  },
  general_management: {
    id: 'general_management',
    name: 'Sales, General Management & Business Development',
    fitsTag: 'Fits Sales & General Management',
    tagline: 'P&L leadership, enterprise deal-making & organizational scaling',
    description: 'You excel at cross-functional rallying, revenue acceleration, relationship building, and high-stakes commercial stewardship.',
    unlockedRoles: ['Management Trainee (General)', 'Enterprise Business Development Lead', 'Key Account Strategic Director'],
    dualPartner: 'marketing',
    dualTitle: 'General Management + Marketing & Brand Strategy',
    dualTagline: 'The Commercial Expansion & P&L Leadership Engine',
    dualDescription: 'Pairs enterprise negotiation and commercial management with high-reach brand positioning and channel strategy.',
    placementLeverage: 'Fast-track gateway to prestigious conglomerate leadership trainee batches (Tata, Aditya Birla, Mahindra).',
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing & Brand Strategy',
    fitsTag: 'Fits Marketing & Brand Strategy',
    tagline: 'Consumer psychology, brand equity, growth channels & market entry',
    description: 'You connect deeply with customer desires, differentiated value proposition architecture, and multi-channel audience growth.',
    unlockedRoles: ['Brand Manager', 'Product Marketing Manager', 'Category Growth Manager'],
    dualPartner: 'analytics',
    dualTitle: 'Marketing & Brand Strategy + Business Analytics',
    dualTagline: 'The Data-Driven Consumer Growth Leader',
    dualDescription: 'Combines creative brand storytelling and consumer psychology with multi-touch attribution and ROI analytics.',
    placementLeverage: 'Sought after by FMCG giants (Unilever, P&G, Nestlé), consumer tech platforms, and high-growth D2C brands.',
  },
  product: {
    id: 'product',
    name: 'Product Management & Tech Strategy',
    fitsTag: 'Fits Product Management & Tech Strategy',
    tagline: 'User empathy, roadmap prioritization, tech architecture & cross-functional leadership',
    description: 'You thrive where user needs, technical feasibility, and business value intersect to build delightful scalable software products.',
    unlockedRoles: ['Product Manager', 'Technical Product Manager', 'Product Operations Lead'],
    dualPartner: 'marketing',
    dualTitle: 'Product Management + Marketing & Brand Strategy',
    dualTagline: 'The Complete Product-Led Growth Engine',
    dualDescription: 'Bridges technical roadmap architecture, user wireframing, and high-velocity go-to-market consumer adoption.',
    placementLeverage: 'Premier profile for Tier-1 tech firms, AI product incubators, and high-growth VC-backed tech startups.',
  },
  operations: {
    id: 'operations',
    name: 'Operations & Supply Chain Excellence',
    fitsTag: 'Fits Operations & Supply Chain Excellence',
    tagline: 'Supply chain resilience, lean execution, logistics & operational efficiency',
    description: 'You find gratification in eliminating waste, streamlining multi-tier logistics networks, and building robust operational systems.',
    unlockedRoles: ['Operations Program Manager', 'Supply Chain Strategy Lead', 'Fulfilment Network Manager'],
    dualPartner: 'analytics',
    dualTitle: 'Operations Excellence + Business Analytics',
    dualTagline: 'The Precision Logistics and Scale Architect',
    dualDescription: 'Integrates lean operational principles, predictive inventory models, and real-time automated telemetry.',
    placementLeverage: 'High demand across e-commerce giants (Amazon, Flipkart), quick commerce networks, and global supply chains.',
  },
  analytics: {
    id: 'analytics',
    name: 'Business Analytics & Data Science',
    fitsTag: 'Fits Business Analytics & Data Science',
    tagline: 'Algorithmic insights, decision models, predictive analytics & data architecture',
    description: 'You extract high-conviction decision clarity from petabytes of ambiguous telemetry, designing models that optimize executive choices.',
    unlockedRoles: ['Business Analytics Lead', 'Decision Scientist', 'Data Strategy Consultant'],
    dualPartner: 'consulting',
    dualTitle: 'Business Analytics + Management Consulting',
    dualTagline: 'The Algorithmic Strategy and Insights Authority',
    dualDescription: 'Unlocks executive-level decision making by converting complex operational data into sharp, hypothesis-driven strategic bets.',
    placementLeverage: 'Top choice for analytics practices of McKinsey QuantumBlack, BCG GAMMA/X, and enterprise AI transformation groups.',
  },
  human_resources: {
    id: 'human_resources',
    name: 'Human Resources & Talent Strategy',
    fitsTag: 'Fits Human Resources & Talent Strategy',
    tagline: 'Strategic human capital, leadership development, culture & change management',
    description: 'You align organizational design with business strategy, nurturing high-performing cultures and unlocking human potential at scale.',
    unlockedRoles: ['HR Business Partner (HRBP)', 'Talent Strategy Lead', 'Organizational Development Manager'],
    dualPartner: 'analytics',
    dualTitle: 'Strategic HR + People Analytics',
    dualTagline: 'The Modern Workforce Architecture Specialist',
    dualDescription: 'Combines employee lifecycle design, organizational psychology, and data-backed workforce productivity modeling.',
    placementLeverage: 'Critical differentiator for multinational corporate leadership, GCCs, and high-growth organizational scale-ups.',
  },
};

function mapSpecCodeToDomainKey(code: string): string {
  switch (code) {
    case 'STR':
    case 'INT':
      return 'consulting';
    case 'FIN':
    case 'BNK':
    case 'FTC':
      return 'finance';
    case 'PM':
    case 'ENT':
    case 'FAM':
      return 'product';
    case 'MKT':
    case 'DM':
    case 'SAL':
      return 'marketing';
    case 'GEN':
      return 'general_management';
    case 'OPS':
    case 'SCM':
      return 'operations';
    case 'ANA':
    case 'DSA':
      return 'analytics';
    case 'HR':
      return 'human_resources';
    default:
      return 'consulting';
  }
}

function mapRoleToDomainKey(role: string): string {
  if (role.includes('Consultant') || role.includes('Strategy')) return 'consulting';
  if (role.includes('IB') || role.includes('Finance') || role.includes('Analyst')) return 'finance';
  if (role.includes('Product')) return 'product';
  if (role.includes('Marketing') || role.includes('Brand')) return 'marketing';
  if (role.includes('Operations') || role.includes('Supply Chain')) return 'operations';
  if (role.includes('Data') || role.includes('Analytics')) return 'analytics';
  if (role.includes('Sales') || role.includes('Management Trainee')) return 'general_management';
  if (role.includes('HR') || role.includes('Talent')) return 'human_resources';
  return 'consulting';
}

export const Assess: React.FC = () => {
  const { user } = useAuth();
  // In-memory per-track state
  const [activeTrack, setActiveTrack] = useState<TrackType>('A');
  const [selectedCard, setSelectedCard] = useState<TrackType>('A');
  const [t1Status, setT1Status] = useState<'aspiring' | 'enrolled'>('aspiring');
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showStartOverModal, setShowStartOverModal] = useState(false);
  const [showReportNotReadyToast, setShowReportNotReadyToast] = useState(false);
  const [showSelectTrackToast, setShowSelectTrackToast] = useState(false);
  const selectTrackToastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Search filter & custom note on step-0
  const [searchFilter, setSearchFilter] = useState('');
  const [isOtherAreaMode, setIsOtherAreaMode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('Finance and Data');
  const [customNote, setCustomNote] = useState('');

  // 90-day plan checkboxes (in-memory)
  const [checkedWeeks, setCheckedWeeks] = useState<Record<number, boolean>>({});

  // Active glossary term popup
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<string | null>(null);

  // Copy summary toast
  const [copyToast, setCopyToast] = useState(false);

  // All 4 tracks in memory
  const [tracksState, setTracksState] = useState<Record<TrackType, TrackState>>({
    A: { answers: {}, currentStepIndex: 0, stage: 'entry' },
    B: { answers: {}, currentStepIndex: 0, stage: 'entry' },
    C: { answers: {}, currentStepIndex: 0, stage: 'entry', step0Spec: 'FIN' },
    D: { answers: {}, currentStepIndex: 0, stage: 'entry', step0Role: 'Product Manager', step1Level: 'FRESHER' },
  });

  // Load user's saved assessment state
  useEffect(() => {
    let isMounted = true;
    async function loadAssessment() {
      if (user) {
        const saved = await storageService.getUserAssessment(user.uid);
        if (saved && isMounted) {
          setTracksState(saved);
        } else if (isMounted) {
          // Brand new user: reset assessment
          setTracksState({
            A: { answers: {}, currentStepIndex: 0, stage: 'entry' },
            B: { answers: {}, currentStepIndex: 0, stage: 'entry' },
            C: { answers: {}, currentStepIndex: 0, stage: 'entry', step0Spec: 'FIN' },
            D: { answers: {}, currentStepIndex: 0, stage: 'entry', step0Role: 'Product Manager', step1Level: 'FRESHER' },
          });
        }
      }
    }
    loadAssessment();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const currentTrackState = tracksState[activeTrack];

  // Helper to update current track state and persist
  const updateCurrentTrack = (patch: Partial<TrackState>) => {
    setTracksState((prev) => {
      const updated = {
        ...prev,
        [activeTrack]: {
          ...prev[activeTrack],
          ...patch,
        },
      };
      if (user) {
        storageService.saveUserAssessment(user.uid, updated);
      }
      return updated;
    });
  };

  // Compile active question list for the current track
  const activeQuestions = useMemo<QuestionItem[]>(() => {
    if (activeTrack === 'A') {
      const questions: QuestionItem[] = [...TRACK_A_CORE];
      // Compute preliminary top archetype for follow-up screens
      const preliminaryResult = scoreA(currentTrackState.answers);
      const topArch = preliminaryResult.archetype.code;
      const followups = TRACK_A_FOLLOWUPS[topArch] || TRACK_A_FOLLOWUPS.AN;
      questions.push(...followups);
      questions.push(...TRACK_A_CONTEXT);
      return questions;
    } else if (activeTrack === 'B') {
      return TRACK_B_QUESTIONS;
    } else if (activeTrack === 'C') {
      return TRACK_C_QUESTIONS;
    } else if (activeTrack === 'D') {
      const role = currentTrackState.step0Role || 'Product Manager';
      const level = currentTrackState.step1Level || 'FRESHER';
      const ans = currentTrackState.answers;

      const qList: QuestionItem[] = [];

      for (const q of TRACK_D_CORE) {
        qList.push(q);
        // Adaptive inserts
        if (q.id === 'D-C1' && ans['D-C1'] === 'C') {
          qList.push(TRACK_D_ADAPTIVE['D-AD1']);
        }
        if (q.id === 'D-C2' && ans['D-C2'] === 'D') {
          qList.push(TRACK_D_ADAPTIVE['D-AD2']);
        }
      }

      // Level block
      const levelBlock = TRACK_D_LEVEL_BLOCKS[level] || TRACK_D_LEVEL_BLOCKS.FRESHER;
      for (const q of levelBlock) {
        qList.push(q);
        if (level === 'LATERAL' && q.id === 'D-L3' && (ans['D-L3'] === 'C' || ans['D-L3'] === 'D')) {
          qList.push(TRACK_D_ADAPTIVE['D-AD3']);
        }
      }

      // Role block
      if (role === 'Product Manager') qList.push(...TRACK_D_ROLE_BLOCKS.PM);
      else if (role === 'Strategy Consultant') qList.push(...TRACK_D_ROLE_BLOCKS.SC);
      else if (role === 'IB Associate') qList.push(...TRACK_D_ROLE_BLOCKS.IB);
      else qList.push(...TRACK_D_ROLE_BLOCKS.GENERIC);

      return qList;
    }
    return [];
  }, [activeTrack, currentTrackState.answers, currentTrackState.step0Role, currentTrackState.step1Level]);

  // Current question
  const currentQuestion = activeQuestions[currentTrackState.currentStepIndex];

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      if (selectTrackToastTimerRef.current) clearTimeout(selectTrackToastTimerRef.current);
    };
  }, []);

  // Answer handler
  const handleAnswerSelect = (optionId: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const mode = currentQuestion.mode;

    const currentAns = currentTrackState.answers[qId];

    if (optionId === 'NOT_SURE') {
      // Escape button selected: clears all options
      updateCurrentTrack({
        answers: {
          ...currentTrackState.answers,
          [qId]: 'NOT_SURE',
        },
      });
      if (mode === 'choose_1') {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = setTimeout(() => {
          handleNext();
        }, 260);
      }
      return;
    }

    if (mode === 'choose_1') {
      updateCurrentTrack({
        answers: {
          ...currentTrackState.answers,
          [qId]: optionId,
        },
      });
      // Auto-advance with visual feedback delay
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = setTimeout(() => {
        handleNext();
      }, 260);
    } else if (mode === 'choose_up_to_2') {
      const prevList: string[] = Array.isArray(currentAns) ? [...currentAns] : [];
      let updated: string[];
      if (prevList.includes(optionId)) {
        updated = prevList.filter((x) => x !== optionId);
      } else {
        if (prevList.length >= 2) {
          updated = [prevList[1], optionId]; // Replace oldest if 2 chosen
        } else {
          updated = [...prevList, optionId];
        }
      }
      updateCurrentTrack({
        answers: {
          ...currentTrackState.answers,
          [qId]: updated,
        },
      });
    } else if (mode === 'select_all') {
      // Multi select (e.g. C-Q2)
      const optObj = currentQuestion.options.find((o) => o.id === optionId);
      if (optObj?.isExclusive) {
        // e.g. "None yet"
        updateCurrentTrack({
          answers: {
            ...currentTrackState.answers,
            [qId]: [optionId],
          },
        });
      } else {
        const prevList: string[] =
          Array.isArray(currentAns)
            ? currentAns.filter((x) => {
                const o = currentQuestion.options.find((opt) => opt.id === x);
                return !o?.isExclusive;
              })
            : [];
        let updated: string[];
        if (prevList.includes(optionId)) {
          updated = prevList.filter((x) => x !== optionId);
        } else {
          updated = [...prevList, optionId];
        }
        updateCurrentTrack({
          answers: {
            ...currentTrackState.answers,
            [qId]: updated,
          },
        });
      }
    }
  };

  const handleRatingChange = (skillId: string, rating: number) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const prevRatings = typeof currentTrackState.answers[qId] === 'object' ? currentTrackState.answers[qId] : {};
    updateCurrentTrack({
      answers: {
        ...currentTrackState.answers,
        [qId]: {
          ...prevRatings,
          [skillId]: rating,
        },
      },
    });
  };

  // Next navigation
  const handleNext = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    if (editingReviewId) {
      // Return directly to review screen if in review-edit mode
      setEditingReviewId(null);
      updateCurrentTrack({ stage: 'review' });
      return;
    }

    if (currentTrackState.currentStepIndex < activeQuestions.length - 1) {
      updateCurrentTrack({
        currentStepIndex: currentTrackState.currentStepIndex + 1,
      });
    } else {
      // Reached the end -> go to Review screen
      updateCurrentTrack({
        stage: 'review',
      });
    }
  };

  // Back navigation
  const handleBack = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    if (currentTrackState.stage === 'review') {
      updateCurrentTrack({
        stage: 'questions',
        currentStepIndex: activeQuestions.length - 1,
      });
      return;
    }
    if (currentTrackState.stage === 'step1') {
      updateCurrentTrack({ stage: 'step0' });
      return;
    }
    if (currentTrackState.stage === 'step0') {
      updateCurrentTrack({ stage: 'entry' });
      return;
    }
    if (currentTrackState.stage === 't1_calibration') {
      updateCurrentTrack({ stage: 'entry' });
      return;
    }
    if (currentTrackState.stage === 'questions') {
      if (currentTrackState.currentStepIndex === 0) {
        if (activeTrack === 'A' || activeTrack === 'B') {
          updateCurrentTrack({ stage: 't1_calibration' });
        } else if (activeTrack === 'C') {
          updateCurrentTrack({ stage: 'step0' });
        } else if (activeTrack === 'D') {
          updateCurrentTrack({ stage: 'step1' });
        } else {
          updateCurrentTrack({ stage: 'entry' });
        }
      } else {
        updateCurrentTrack({
          currentStepIndex: currentTrackState.currentStepIndex - 1,
        });
      }
    }
  };

  // Generate Report
  const handleGenerateReport = () => {
    if (activeTrack === 'A') {
      const res = scoreA(currentTrackState.answers);
      updateCurrentTrack({ stage: 'report', result: res });
    } else if (activeTrack === 'B') {
      const res = scoreB(currentTrackState.answers);
      updateCurrentTrack({ stage: 'report', result: res });
    } else if (activeTrack === 'C') {
      const res = scoreC(
        currentTrackState.step0Spec || 'FIN',
        currentTrackState.answers,
        currentTrackState.userNote
      );
      updateCurrentTrack({ stage: 'report', result: res });
    } else if (activeTrack === 'D') {
      const res = scoreD(
        currentTrackState.step0Role || 'Product Manager',
        currentTrackState.step1Level || 'FRESHER',
        currentTrackState.answers
      );
      updateCurrentTrack({ stage: 'report', result: res });
    }
  };

  // Carry-over actions
  const handleCarryOverAtoC = (specCode: string) => {
    setActiveTrack('C');
    setSelectedCard('C');
    setTracksState((prev) => ({
      ...prev,
      C: {
        ...prev.C,
        step0Spec: specCode,
        stage: 'questions',
        currentStepIndex: 0,
      },
    }));
  };

  const handleCarryOverCtoD = (primaryRoleTitle: string) => {
    const spec = currentTrackState.result?.specialization?.code || 'GEN';
    const fam = currentTrackState.result?.rankedFamilies?.[0] || 'ANALYTIC';

    let targetRole = 'Another role (general questions)';
    if (spec === 'PM') targetRole = 'Product Manager';
    else if (spec === 'STR') targetRole = 'Strategy Consultant';
    else if (spec === 'FIN' && fam === 'CLIENT') targetRole = 'IB Associate';
    else if (spec === 'FIN' || spec === 'BNK') targetRole = 'Financial Analyst';
    else if (spec === 'MKT') targetRole = 'Marketing or Brand Manager';
    else if (spec === 'DM') targetRole = 'Digital Marketing Manager';
    else if (spec === 'ANA' || spec === 'DSA') targetRole = 'Business or Data Analyst';
    else if (spec === 'HR') targetRole = 'HR or Talent Acquisition';
    else if (spec === 'OPS' || spec === 'SCM') targetRole = 'Operations or Supply Chain Manager';
    else if (spec === 'SAL') targetRole = 'Sales or Business Development Manager';
    else if (spec === 'GEN') targetRole = 'Management Trainee (General)';

    setActiveTrack('D');
    setSelectedCard('D');
    setTracksState((prev) => ({
      ...prev,
      D: {
        ...prev.D,
        step0Role: targetRole,
        stage: 'step1',
        currentStepIndex: 0,
      },
    }));
  };

  // Reset / Start Over
  const handleStartOver = () => {
    setTracksState({
      A: { answers: {}, currentStepIndex: 0, stage: 'entry' },
      B: { answers: {}, currentStepIndex: 0, stage: 'entry' },
      C: { answers: {}, currentStepIndex: 0, stage: 'entry', step0Spec: 'FIN' },
      D: { answers: {}, currentStepIndex: 0, stage: 'entry', step0Role: 'Product Manager', step1Level: 'FRESHER' },
    });
    setCheckedWeeks({});
    setShowStartOverModal(false);
    updateCurrentTrack({ stage: 'entry' });
  };

  // Copy plain-text summary
  const copySummaryText = () => {
    const res = currentTrackState.result;
    if (!res) return;
    let text = `COMPASS MBA GUIDANCE REPORT - TRACK ${activeTrack}\n`;
    text += `Generated: October 2026\n\n`;

    if (activeTrack === 'A') {
      text += `Archetype: ${res.archetype.name} (${res.archetype.characterEnergy})\n`;
      text += `Tagline: "${res.archetype.tagline}"\n`;
      text += `Primary Specialization: ${res.primarySpec.name}\n`;
      text += `Alternative: ${res.alternativeSpec.name} | Stretch: ${res.stretchSpec.name}\n`;
      text += `Confidence: ${res.confidenceLabel}\n`;
    } else if (activeTrack === 'B') {
      text += `Primary: ${res.primary.name}\n`;
      text += `Secondary: ${res.secondary.name}\n`;
      text += `Dual Specialization Verdict: ${res.verdict}\n`;
      text += `Confidence: ${res.confidenceLabel}\n`;
    } else if (activeTrack === 'C') {
      text += `Specialization: ${res.specialization.name}\n`;
      text += `Top Recommended Role: ${res.recommendedRoles[0]?.title}\n`;
      text += `Fallback: ${res.fallbackRole?.title}\n`;
      text += `Confidence: ${res.confidenceLabel}\n`;
    } else if (activeTrack === 'D') {
      text += `Target Role: ${res.role} (${res.level})\n`;
      text += `Readiness Score: ${res.overallScore}/100 (${res.overallStatus})\n`;
      text += `Persona: ${res.persona}\n`;
      text += `Confidence: ${res.confidenceLabel}\n`;
    }

    text += `\n${GLOBAL_DISCLAIMER}\n`;
    navigator.clipboard?.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  // Check if Next is disabled on the current question
  const isCurrentNextDisabled = useMemo(() => {
    if (!currentQuestion) return false;
    const ans = currentTrackState.answers[currentQuestion.id];
    if (ans === 'NOT_SURE') return false;
    if (currentQuestion.mode === 'rate_skills') {
      return false; // Skip rating allowed
    }
    if (Array.isArray(ans)) {
      return ans.length === 0;
    }
    return ans === undefined || ans === '';
  }, [currentQuestion, currentTrackState.answers]);

  const handleGoToStep1 = () => {
    updateCurrentTrack({ stage: 'entry' });
  };

  const handleGoToStep2 = () => {
    if (currentTrackState.stage === 'entry') {
      setShowSelectTrackToast(true);
      if (selectTrackToastTimerRef.current) clearTimeout(selectTrackToastTimerRef.current);
      selectTrackToastTimerRef.current = setTimeout(() => setShowSelectTrackToast(false), 3200);
      return;
    }
    if (currentTrackState.stage === 'report') {
      updateCurrentTrack({ stage: 'review' });
    }
  };

  const handleGoToStep3 = () => {
    if (currentTrackState.result) {
      updateCurrentTrack({ stage: 'report' });
    } else {
      const anyResultTrack = (['A', 'B', 'C', 'D'] as TrackType[]).find((t) => tracksState[t].result);
      if (anyResultTrack) {
        setActiveTrack(anyResultTrack);
        setTracksState((prev) => ({
          ...prev,
          [anyResultTrack]: { ...prev[anyResultTrack], stage: 'report' },
        }));
      } else {
        setShowReportNotReadyToast(true);
        setTimeout(() => setShowReportNotReadyToast(false), 2500);
      }
    }
  };

  // Computed presentation data matching image_a651bb73.png
  const reportCardsData = useMemo(() => {
    if (currentTrackState.stage !== 'report' || !currentTrackState.result) return null;
    const res = currentTrackState.result;

    // 1. Determine Archetype
    let archCode: ArchetypeCode = 'ST';
    if (activeTrack === 'A') {
      archCode = res.archetype?.code || 'ST';
    } else if (activeTrack === 'B' || activeTrack === 'C') {
      archCode = res.primaryArchetype?.code || 'ST';
    } else if (activeTrack === 'D') {
      archCode = res.roleEnergyArchetype?.code || 'ST';
    }

    const archExtended = ARCHETYPE_EXTENDED[archCode] || ARCHETYPE_EXTENDED.ST;

    // 2. Determine Primary Specialization / Domain
    let primaryDomainKey = 'consulting';
    let secondaryDomainKey = 'finance';

    if (activeTrack === 'A') {
      const code = res.primarySpec?.code || 'STR';
      primaryDomainKey = mapSpecCodeToDomainKey(code);
      const altCode = res.alternativeSpec?.code || 'FIN';
      secondaryDomainKey = mapSpecCodeToDomainKey(altCode);
    } else if (activeTrack === 'B') {
      const code = res.primary?.code || 'STR';
      primaryDomainKey = mapSpecCodeToDomainKey(code);
      const secCode = res.secondary?.code || 'FIN';
      secondaryDomainKey = mapSpecCodeToDomainKey(secCode);
    } else if (activeTrack === 'C') {
      const code = res.specialization?.code || 'STR';
      primaryDomainKey = mapSpecCodeToDomainKey(code);
      secondaryDomainKey = DOMAIN_PRESENTATION_MAP[primaryDomainKey]?.dualPartner || 'finance';
    } else if (activeTrack === 'D') {
      const role = res.role || 'Product Manager';
      primaryDomainKey = mapRoleToDomainKey(role);
      secondaryDomainKey = DOMAIN_PRESENTATION_MAP[primaryDomainKey]?.dualPartner || 'consulting';
    }

    if (secondaryDomainKey === primaryDomainKey) {
      secondaryDomainKey = DOMAIN_PRESENTATION_MAP[primaryDomainKey]?.dualPartner || 'finance';
    }

    const primaryDomain = DOMAIN_PRESENTATION_MAP[primaryDomainKey] || DOMAIN_PRESENTATION_MAP.consulting;
    const secondaryDomain = DOMAIN_PRESENTATION_MAP[secondaryDomainKey] || DOMAIN_PRESENTATION_MAP.finance;

    // 3. Normalized fit across all 8 disciplines in exact order of image_a651bb73.png
    const allDomainKeys = [
      'consulting',
      'finance',
      'general_management',
      'marketing',
      'product',
      'operations',
      'analytics',
      'human_resources',
    ];

    const basePcts: Record<string, number> = {
      consulting: 100,
      finance: 77,
      general_management: 34,
      marketing: 32,
      product: 30,
      operations: 20,
      analytics: 15,
      human_resources: 6,
    };

    const disciplineList = allDomainKeys.map((key) => {
      const dom = DOMAIN_PRESENTATION_MAP[key];
      let score = basePcts[key] || 25;
      if (key === primaryDomainKey) {
        score = 100;
      } else if (key === secondaryDomainKey) {
        score = 77;
      } else {
        const diffIndex = Math.abs(allDomainKeys.indexOf(key) - allDomainKeys.indexOf(primaryDomainKey));
        score = Math.max(6, Math.min(65, 50 - diffIndex * 7));
      }
      return {
        id: key,
        name: dom.name,
        score,
        isTop: key === primaryDomainKey,
      };
    });

    const dualTitle = `${secondaryDomain.name.split('&')[0].trim()} + ${primaryDomain.name.split('&')[0].trim()}`;
    const dualTagline = primaryDomain.dualTagline;
    const dualDesc = primaryDomain.dualDescription;
    const unlockedRoles = primaryDomain.unlockedRoles;
    const placementLeverage = primaryDomain.placementLeverage;

    return {
      archExtended,
      primaryDomain,
      secondaryDomain,
      disciplineList,
      dualTitle,
      dualTagline,
      dualDesc,
      unlockedRoles,
      placementLeverage,
    };
  }, [activeTrack, currentTrackState.stage, currentTrackState.result]);

  const isStep1Active = currentTrackState.stage === 'entry';
  const isStep2Active =
    currentTrackState.stage === 't1_calibration' ||
    currentTrackState.stage === 'step0' ||
    currentTrackState.stage === 'step1' ||
    currentTrackState.stage === 'questions' ||
    currentTrackState.stage === 'review';
  const isStep3Active = currentTrackState.stage === 'report';

  const headerBreadcrumb = useMemo(() => {
    if (currentTrackState.stage === 'entry') {
      return 'MBA ASSESSMENT · TRACK 1: ASPIRING MBA · PERSONALITY & LOGIC';
    }
    if (activeTrack === 'A' || currentTrackState.stage === 't1_calibration') {
      return t1Status === 'enrolled'
        ? 'MBA ASSESSMENT · TRACK 1: ENROLLED MBA · DUAL SPECIALIZATION'
        : 'MBA ASSESSMENT · TRACK 1: ASPIRING MBA · PERSONALITY & LOGIC';
    }
    if (activeTrack === 'B') {
      return 'MBA ASSESSMENT · TRACK 1: ENROLLED MBA · DUAL SPECIALIZATION';
    }
    if (activeTrack === 'C') {
      return 'MBA ASSESSMENT · TRACK 2: SPECIALIZED CANDIDATE · ROLE SHORTLIST';
    }
    return 'MBA ASSESSMENT · TRACK 3: TARGET READY · ROLE READINESS';
  }, [activeTrack, currentTrackState.stage, t1Status]);

  const headerTitle = useMemo(() => {
    if (currentTrackState.stage === 'entry') {
      return 'Choose Your Placement Diagnostic Journey';
    }
    if (currentTrackState.stage === 't1_calibration') {
      return 'Target & Background Calibration';
    }
    if (currentTrackState.stage === 'step0') {
      return activeTrack === 'C' ? 'Choose Your MBA Specialization' : 'Target Role Selection';
    }
    if (currentTrackState.stage === 'step1') {
      return 'Candidate Profile & Experience Calibration';
    }
    if (currentTrackState.stage === 'questions') {
      return 'Diagnostic Assessment Scenarios';
    }
    if (currentTrackState.stage === 'review') {
      return 'Review Your Diagnostic Responses';
    }
    if (currentTrackState.stage === 'report') {
      return 'Tailored Placement Diagnostic Report';
    }
    return 'MBA Assessment';
  }, [currentTrackState.stage, activeTrack]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-[#00DF89] selection:text-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      {showReportNotReadyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/60 text-amber-300 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <span>ℹ</span>
          <span>Complete the diagnostic scenarios to unlock your tailored report.</span>
        </div>
      )}

      <div className="max-w-6xl w-full mx-auto space-y-6">
        {activeTrack === 'D' && currentTrackState.stage !== 'entry' ? (
          <Track3View
            onBackToTracks={() => {
              setActiveTrack('A');
              updateCurrentTrack({ stage: 'entry' });
            }}
            onBuildResume={() => {
              window.location.hash = 'resume';
            }}
          />
        ) : (
          <>
            {/* TOP DIAGNOSTIC JOURNEY CARD HEADER (Screenshots 1, 2, 3) */}
            <div className="bg-[#0B111E]/95 border border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase font-mono">
              {headerBreadcrumb}
            </span>

            <div className="flex items-center gap-3">
              {currentTrackState.stage === 'questions' && (
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-400 font-mono">
                    Question {currentTrackState.currentStepIndex + 1} of {activeQuestions.length}
                  </span>
                  <div className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{
                        width: `${((currentTrackState.currentStepIndex + 1) / activeQuestions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {currentTrackState.stage !== 'entry' && (
                <button
                  onClick={handleGoToStep1}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Change track / journey"
                >
                  <span>↺</span>
                  <span>Change Journey</span>
                </button>
              )}
            </div>
          </div>

          {/* POPUP / TOAST WHEN STEP 2 CLICKED BEFORE SELECTING A TRACK */}
          {showSelectTrackToast && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#0B111E]/95 border border-amber-500/80 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base shrink-0">
                ⚠️
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-white">First you need to select a track</div>
                <div className="text-[11px] text-slate-300">Please choose one of the 3 diagnostic tracks below before accessing scenarios.</div>
              </div>
              <button
                onClick={() => setShowSelectTrackToast(false)}
                className="text-slate-400 hover:text-white text-xs ml-3 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {headerTitle}
          </h1>

          {/* 3-STEP CLICKABLE STEPPER (Screenshot 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* Step 1 */}
            <div
              onClick={handleGoToStep1}
              className={`p-3.5 sm:p-4 rounded-xl border flex items-center gap-3.5 transition-all cursor-pointer ${
                isStep1Active
                  ? 'border-[#00DF89] bg-slate-900/80 ring-1 ring-[#00DF89]/30'
                  : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  isStep1Active ? 'bg-[#00DF89] text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                1
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-white">1. Select Journey</div>
                <div className="text-[11px] text-slate-400">Choose entry track</div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              onClick={handleGoToStep2}
              className={`p-3.5 sm:p-4 rounded-xl border flex items-center gap-3.5 transition-all cursor-pointer ${
                isStep2Active
                  ? 'border-[#00DF89] bg-slate-900/80 ring-1 ring-[#00DF89]/30'
                  : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  isStep2Active ? 'bg-[#00DF89] text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                2
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-white">2. Scenarios</div>
                <div className="text-[11px] text-slate-400">Calibrate & Answer</div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              onClick={handleGoToStep3}
              className={`p-3.5 sm:p-4 rounded-xl border flex items-center gap-3.5 transition-all cursor-pointer ${
                isStep3Active
                  ? 'border-[#00DF89] bg-slate-900/80 ring-1 ring-[#00DF89]/30'
                  : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  isStep3Active ? 'bg-[#00DF89] text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                3
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-white">3. Tailored Report</div>
                <div className="text-[11px] text-slate-400">Dual spec & roles</div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* STAGE 1: ENTRY SCREEN (3 Track Cards - Screenshot 1)      */}
        {/* ======================================================== */}
        {currentTrackState.stage === 'entry' && (
          <div className="space-y-6 pt-2">
            <div className="text-center space-y-2 py-4">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Where are you in your MBA career thinking?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Every MBA candidate is at a different stage. Select the track that mirrors your current situation to receive tailored questions and reports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {/* TRACK 01 */}
              <div
                onClick={() => {
                  updateCurrentTrack({ stage: 't1_calibration' });
                }}
                className="p-6 sm:p-7 rounded-2xl bg-[#0B111E]/90 border border-slate-800/90 hover:border-emerald-500/80 transition-all flex flex-col justify-between space-y-6 shadow-xl hover:shadow-emerald-950/20 cursor-pointer group hover:scale-[1.01]"
              >
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-black text-xl group-hover:scale-105 transition-transform">
                    ?
                  </div>
                  <div className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase font-mono">
                    TRACK 01 · ASPIRING OR ENROLLED MBA
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    “I want to find my specialization.”
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Whether you are about to join business school or enrolled in 1st year: take an accessible personality & everyday logic quiz (zero jargon) or practical business scenarios to discover your best-fit domain, Personality Archetype, and Dual Specialization.
                  </p>

                  <div className="pt-2 space-y-2 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Aspiring: 10 personality & everyday logic questions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Enrolled: 10 practical business scenarios (no jargon)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Personality Archetype + Dual Specialization pairing</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCurrentTrack({ stage: 't1_calibration' });
                  }}
                  className="w-full py-3 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <span>Choose Status & Start</span>
                  <span>→</span>
                </button>
              </div>

              {/* TRACK 02 */}
              <div
                onClick={() => {
                  setActiveTrack('C');
                  setSelectedCard('C');
                  setTracksState((prev) => ({
                    ...prev,
                    C: {
                      ...prev.C,
                      stage: prev.C.result ? 'report' : 'step0',
                    },
                  }));
                }}
                className="p-6 sm:p-7 rounded-2xl bg-[#0B111E]/90 border border-slate-800/90 hover:border-teal-500/80 transition-all flex flex-col justify-between space-y-6 shadow-xl hover:shadow-teal-950/20 cursor-pointer group hover:scale-[1.01]"
              >
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-950/60 border border-teal-800/60 flex items-center justify-center text-teal-400 font-black text-xl group-hover:scale-105 transition-transform">
                    🎯
                  </div>
                  <div className="text-[11px] font-bold text-teal-400 tracking-wider uppercase font-mono">
                    TRACK 02 · SPECIALIZED CANDIDATE
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                    “I know my specialization.”
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You already have chosen your domain (Marketing, Finance, Product, Consulting, HR, etc.) but need to identify which job roles to target for campus shortlists and off-campus interviews.
                  </p>

                  <div className="pt-2 space-y-2 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="text-teal-400 font-bold shrink-0">✓</span>
                      <span>Select your chosen specialization</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-teal-400 font-bold shrink-0">✓</span>
                      <span>Recommends 2–3 roles with campus fallbacks</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-teal-400 font-bold shrink-0">✓</span>
                      <span>Salary expectations & interview preparation rubrics</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTrack('C');
                    setSelectedCard('C');
                    setTracksState((prev) => ({
                      ...prev,
                      C: {
                        ...prev.C,
                        stage: prev.C.result ? 'report' : 'step0',
                      },
                    }));
                  }}
                  className="w-full py-3 bg-[#14B8A6] hover:bg-[#0d9488] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <span>Select Specialization & Roles</span>
                  <span>→</span>
                </button>
              </div>

              {/* TRACK 03 */}
              <div
                onClick={() => {
                  setActiveTrack('D');
                  setSelectedCard('D');
                  setTracksState((prev) => ({
                    ...prev,
                    D: {
                      ...prev.D,
                      stage: 'questions',
                    },
                  }));
                }}
                className="p-6 sm:p-7 rounded-2xl bg-[#0B111E]/90 border border-slate-800/90 hover:border-amber-500/80 transition-all flex flex-col justify-between space-y-6 shadow-xl hover:shadow-amber-950/20 cursor-pointer group hover:scale-[1.01]"
              >
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 font-black text-xl group-hover:scale-105 transition-transform">
                    ⚡
                  </div>
                  <div className="text-[11px] font-bold text-amber-400 tracking-wider uppercase font-mono">
                    TRACK 03 · TARGET READY
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                    “I know the role I want.”
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Targeting a specific role (Product Manager, Strategy Consultant, IB Associate)? Get an honest job-readiness reality check calibrated to your specific experience level with concrete next steps.
                  </p>

                  <div className="pt-2 space-y-2 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">✓</span>
                      <span>Calibrated for Fresher vs. Intern vs. 1+ Year Experience</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">✓</span>
                      <span>7 Rule-Based Written Diagnostic Scenarios</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">✓</span>
                      <span>Evidence Breakdown across 7 Competencies</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTrack('D');
                    setSelectedCard('D');
                    setTracksState((prev) => ({
                      ...prev,
                      D: {
                        ...prev.D,
                        stage: 'questions',
                      },
                    }));
                  }}
                  className="w-full py-3 bg-[#F59E0B] hover:bg-[#d97706] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <span>Check Role Readiness</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE: TRACK 1 STATUS CALIBRATION (Screenshot 2)          */}
        {/* ======================================================== */}
        {currentTrackState.stage === 't1_calibration' && (
          <div className="pt-4">
            <div className="max-w-2xl w-full mx-auto bg-[#0B111E]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <span className="text-xs font-bold text-[#00DF89] uppercase tracking-wider font-mono">
                  TRACK 1 CALIBRATION
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  What is your current MBA status?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  Select your enrollment stage so we can tune the questions to match your background without intimidating jargon.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Aspiring */}
                <div
                  onClick={() => {
                    setT1Status('aspiring');
                    setActiveTrack('A');
                    setSelectedCard('A');
                    setTracksState((prev) => ({
                      ...prev,
                      A: {
                        ...prev.A,
                        stage: prev.A.result ? 'report' : 'questions',
                        currentStepIndex: prev.A.currentStepIndex || 0,
                      },
                    }));
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative space-y-3 flex flex-col justify-between group hover:scale-[1.01] ${
                    t1Status === 'aspiring'
                      ? 'border-[#00DF89] bg-slate-900/90 shadow-lg shadow-emerald-950/30 ring-1 ring-[#00DF89]/40'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🌱</span>
                      {t1Status === 'aspiring' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#00DF89] text-slate-950">
                          SELECTED
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      I am about to join MBA
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Aspiring student or preparing for admissions. 10 high-level personality and intuitive everyday logic questions with zero corporate jargon.
                    </p>
                  </div>
                  <div className="pt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span>✓</span>
                    <span>Unlocks Personality Archetype</span>
                  </div>
                </div>

                {/* Option 2: Enrolled */}
                <div
                  onClick={() => {
                    setT1Status('enrolled');
                    setActiveTrack('B');
                    setSelectedCard('B');
                    setTracksState((prev) => ({
                      ...prev,
                      B: {
                        ...prev.B,
                        stage: prev.B.result ? 'report' : 'questions',
                        currentStepIndex: prev.B.currentStepIndex || 0,
                      },
                    }));
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative space-y-3 flex flex-col justify-between group hover:scale-[1.01] ${
                    t1Status === 'enrolled'
                      ? 'border-[#00DF89] bg-slate-900/90 shadow-lg shadow-emerald-950/30 ring-1 ring-[#00DF89]/40'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🎓</span>
                      {t1Status === 'enrolled' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#00DF89] text-slate-950">
                          SELECTED
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      I have enrolled in MBA school
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Currently in your 1st year. 10 practical, real-world business scenarios in plain language to choose your Major and Dual Specialization.
                    </p>
                  </div>
                  <div className="pt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span>✓</span>
                    <span>Dual Specialization Strategy</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (t1Status === 'aspiring') {
                    setActiveTrack('A');
                    setSelectedCard('A');
                    setTracksState((prev) => ({
                      ...prev,
                      A: {
                        ...prev.A,
                        stage: prev.A.result ? 'report' : 'questions',
                        currentStepIndex: prev.A.currentStepIndex || 0,
                      },
                    }));
                  } else {
                    setActiveTrack('B');
                    setSelectedCard('B');
                    setTracksState((prev) => ({
                      ...prev,
                      B: {
                        ...prev.B,
                        stage: prev.B.result ? 'report' : 'questions',
                        currentStepIndex: prev.B.currentStepIndex || 0,
                      },
                    }));
                  }
                }}
                className="w-full py-3.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer text-center"
              >
                {t1Status === 'aspiring'
                  ? 'Start Personality & Logic Diagnostic →'
                  : 'Start Dual Specialization Diagnostic →'}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE: STEP 0 (Specialization Picker for C, Role for D)    */}
        {/* ======================================================== */}
        {currentTrackState.stage === 'step0' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <span className="text-xs font-mono text-slate-400">Step 0 of 1</span>
            </div>

            {activeTrack === 'C' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Choose your MBA specialization</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Your college may offer only some of these. Check its list.
                  </p>
                </div>

                {/* Search filter */}
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search specializations (e.g. Finance, Analytics)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />

                {!isOtherAreaMode ? (
                  <div className="space-y-6 max-h-96 overflow-y-auto pr-1">
                    {CATALOG_GROUPS.map((grp) => {
                      const filteredItems = grp.items.filter(
                        (item) =>
                          item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchFilter.toLowerCase())
                      );
                      if (filteredItems.length === 0) return null;

                      return (
                        <div key={grp.id} className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            {grp.name}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredItems.map((item) => (
                              <button
                                key={item.code}
                                onClick={() => {
                                  updateCurrentTrack({
                                    step0Spec: item.code,
                                    stage: 'questions',
                                    currentStepIndex: 0,
                                  });
                                }}
                                className={`text-left p-3 rounded-xl border text-sm transition-all cursor-pointer ${
                                  currentTrackState.step0Spec === item.code
                                    ? 'bg-emerald-950/60 border-emerald-500 text-white font-semibold'
                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                                }`}
                              >
                                <div className="font-semibold">{item.name}</div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">{item.code}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* My area isn't listed option */}
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setIsOtherAreaMode(true)}
                        className="w-full text-left p-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 hover:border-emerald-500/60 text-slate-300 text-sm cursor-pointer"
                      >
                        <div className="font-semibold text-emerald-400">+ My area isn't listed</div>
                        <div className="text-xs text-slate-500">Pick closest group and add an optional custom note</div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs font-semibold uppercase text-emerald-400">Pick the closest group</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CATALOG_GROUPS.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGroup(g.name)}
                          className={`text-left p-2.5 rounded-lg border text-xs cursor-pointer ${
                            selectedGroup === g.name
                              ? 'bg-emerald-950 border-emerald-500 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <div className="text-xs font-semibold text-slate-300 mb-2">
                        Pick closest specialization in {selectedGroup}:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {CATALOG_GROUPS.find((g) => g.name === selectedGroup)?.items.map((it) => (
                          <button
                            key={it.code}
                            onClick={() => updateCurrentTrack({ step0Spec: it.code })}
                            className={`text-left p-2 rounded-lg border text-xs cursor-pointer ${
                              currentTrackState.step0Spec === it.code
                                ? 'bg-emerald-900/60 border-emerald-500 text-white font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            {it.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Add your own label, optional. Shown in your report, not scored. (Max 150 chars)
                      </label>
                      <input
                        type="text"
                        maxLength={150}
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="e.g. Performance marketing, Green supply chain"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          updateCurrentTrack({
                            userNote: customNote.trim() || undefined,
                            stage: 'questions',
                            currentStepIndex: 0,
                          });
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Confirm & Continue
                      </button>
                      <button
                        onClick={() => setIsOtherAreaMode(false)}
                        className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTrack === 'D' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Choose your target MBA role</h2>
                  <p className="text-xs text-slate-400 mt-1">Select the exact role you are preparing for.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'Product Manager',
                    'Strategy Consultant',
                    'IB Associate',
                    'Financial Analyst',
                    'Marketing or Brand Manager',
                    'Digital Marketing Manager',
                    'Business or Data Analyst',
                    'HR or Talent Acquisition',
                    'Operations or Supply Chain Manager',
                    'Sales or Business Development Manager',
                    'Management Trainee (General)',
                    'Another role (general questions)',
                  ].map((roleTitle) => (
                    <button
                      key={roleTitle}
                      onClick={() => {
                        updateCurrentTrack({
                          step0Role: roleTitle,
                          stage: 'step1',
                        });
                      }}
                      className={`text-left p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                        currentTrackState.step0Role === roleTitle
                          ? 'bg-emerald-950/60 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      {roleTitle}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE: STEP 1 (Candidate Level for Track D)               */}
        {/* ======================================================== */}
        {currentTrackState.stage === 'step1' && activeTrack === 'D' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <span className="text-xs font-mono text-slate-400">Step 1 of 1</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Select your candidate profile</h2>
                <p className="text-xs text-slate-400 mt-1">This calibrates role expectations and evidence scoring.</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    level: 'FRESHER',
                    title: 'Fresher',
                    desc: 'No full-time experience, may have internships or college projects.',
                  },
                  {
                    level: 'INTERN',
                    title: 'Intern',
                    desc: 'Currently or recently interning in a relevant role with potential conversion.',
                  },
                  {
                    level: 'LATERAL',
                    title: 'Lateral',
                    desc: 'Working professional changing role, industry, or company.',
                  },
                ].map((item) => (
                  <button
                    key={item.level}
                    onClick={() => {
                      updateCurrentTrack({
                        step1Level: item.level as any,
                        stage: 'questions',
                        currentStepIndex: 0,
                      });
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      currentTrackState.step1Level === item.level
                        ? 'bg-emerald-950/60 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-base">{item.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE: QUESTION COMPONENT (Section 2)                     */}
        {/* ======================================================== */}
        {currentTrackState.stage === 'questions' && currentQuestion && (
          <div className="space-y-6">
            {/* Top row with chip and jargon glossary term */}
            <div className="flex items-center justify-between gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                {currentQuestion.chipText}
              </span>
              <span className="text-xs font-mono text-slate-400">{currentQuestion.modeLabel}</span>
            </div>

            {/* Question Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {currentQuestion.text}
                </h2>

                {/* Inline Glossary Helper */}
                {Object.keys(GLOSSARY).some((term) => currentQuestion.text.includes(term)) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {Object.entries(GLOSSARY).map(([term, explanation]) => {
                      if (!currentQuestion.text.includes(term)) return null;
                      const isOpen = activeGlossaryTerm === term;
                      return (
                        <div key={term} className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setActiveGlossaryTerm(isOpen ? null : term)}
                            className="text-xs text-emerald-400 underline hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                          >
                            <span>What's {term}?</span>
                          </button>
                          {isOpen && (
                            <div className="absolute left-0 top-6 z-20 w-64 p-2.5 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-200">
                              <span className="font-bold text-emerald-400">{term}:</span> {explanation as string}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Options */}
              {currentQuestion.mode === 'rate_skills' ? (
                /* 1-5 Skill Rating Grid */
                <div className="space-y-4">
                  {currentQuestion.options.map((opt) => {
                    const currentRating = currentTrackState.answers[currentQuestion.id]?.[opt.id] || 0;
                    return (
                      <div
                        key={opt.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800"
                      >
                        <span className="text-xs sm:text-sm font-medium text-slate-300">{opt.text}</span>
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRatingChange(opt.id, star)}
                              className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                                currentRating === star
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              {star}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Standard Option Cards */
                <div className="space-y-3">
                  {currentQuestion.options.map((opt) => {
                    const currentAns = currentTrackState.answers[currentQuestion.id];
                    const isSelected = Array.isArray(currentAns)
                      ? currentAns.includes(opt.id)
                      : currentAns === opt.id;

                    const isRadio = currentQuestion.mode === 'choose_1';

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleAnswerSelect(opt.id)}
                        role={isRadio ? 'radio' : 'checkbox'}
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            handleAnswerSelect(opt.id);
                          }
                        }}
                        className={`w-full min-h-[48px] p-4 rounded-xl border flex items-center justify-between gap-4 transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-slate-800/90 border-emerald-500 font-bold shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span className="text-sm sm:text-base text-slate-100">{opt.text}</span>
                        </div>

                        {isSelected && (
                          <span className="text-emerald-400 text-lg font-bold">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Escape Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleAnswerSelect('NOT_SURE')}
                  className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    currentTrackState.answers[currentQuestion.id] === 'NOT_SURE'
                      ? 'bg-slate-800 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {currentQuestion.escapeLabel || 'None of these fit / Not sure'}
                </button>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ← Back
                </button>

                <div className="flex items-center gap-3">
                  {isCurrentNextDisabled && (
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      Pick an answer, or choose 'None of these fit'
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isCurrentNextDisabled}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
                  >
                    {editingReviewId
                      ? 'Save & Return to Review →'
                      : currentTrackState.currentStepIndex === activeQuestions.length - 1
                      ? 'Review Answers →'
                      : 'Next →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE: REVIEW SCREEN (Section 1.5)                        */}
        {/* ======================================================== */}
        {currentTrackState.stage === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Review your answers</h2>
                <p className="text-xs text-slate-400 mt-1">
                  You can edit any response before generating your diagnostic report.
                </p>
              </div>
              <button
                onClick={handleGenerateReport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                See my report →
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden shadow-xl">
              {activeQuestions.map((q, idx) => {
                const ans = currentTrackState.answers[q.id];
                let displayAnswer = 'Not sure';

                if (ans && ans !== 'NOT_SURE') {
                  if (q.mode === 'rate_skills') {
                    displayAnswer = 'Skills rated';
                  } else if (Array.isArray(ans)) {
                    const labels = ans.map((id) => q.options.find((o) => o.id === id)?.text || id);
                    displayAnswer = labels.join('; ');
                  } else {
                    const opt = q.options.find((o) => o.id === ans);
                    displayAnswer = opt?.text || ans;
                  }
                }

                return (
                  <div key={q.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                    <div className="space-y-1 max-w-xl">
                      <div className="text-xs font-mono text-emerald-400">
                        Q{idx + 1}: {q.chipText}
                      </div>
                      <div className="text-sm font-semibold text-slate-200 line-clamp-2">{q.text}</div>
                      <div className="text-xs text-slate-400 italic">
                        {ans === 'NOT_SURE' ? (
                          <span className="text-amber-400">None of these fit / Not sure</span>
                        ) : (
                          displayAnswer
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingReviewId(q.id);
                        updateCurrentTrack({
                          stage: 'questions',
                          currentStepIndex: idx,
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleGenerateReport}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                See my report →
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE: REPORT                                             */}
        {/* ======================================================== */}
        {currentTrackState.stage === 'report' && currentTrackState.result && (
          <div className="space-y-6 print:space-y-4">
            {/* Action Bar at the very top (Screenshot 1) */}
            <div id="report-detailed-breakdown" className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2">
                {!user && (
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span>🖨️</span> Save as PDF
                  </button>
                )}
                <button
                  onClick={copySummaryText}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>📋</span> {copyToast ? 'Copied!' : 'Copy summary'}
                </button>
                <button
                  onClick={() => updateCurrentTrack({ stage: 'review' })}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Edit answers
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStartOverModal(true)}
                  className="text-xs text-slate-400 hover:text-rose-400 underline cursor-pointer px-2"
                >
                  Start over
                </button>
              </div>
            </div>

            {/* HERO CARDS MATCHING EXACT SPEC (image_a651bb73.png) */}
            {reportCardsData && (
              <div className="space-y-6">
                {/* UNIFIED CARD 1: YOUR PERSONALITY ARCHETYPE & PROFILE (Combined from Screenshot 2 & Screenshot 3) */}
                <div className="bg-[#0B111E]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#00DF89] uppercase tracking-wider font-mono">
                      <span>✈</span>
                      <span>
                        YOUR PERSONALITY ARCHETYPE ·{' '}
                        {activeTrack === 'A'
                          ? 'ASPIRING CANDIDATE PROFILE'
                          : activeTrack === 'B'
                          ? 'ENROLLED MBA PROFILE'
                          : activeTrack === 'C'
                          ? 'SPECIALIZED CANDIDATE PROFILE'
                          : 'TARGET-READY CANDIDATE PROFILE'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full border ${
                          currentTrackState.result.confidenceLabel === 'High confidence'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                            : currentTrackState.result.confidenceLabel === 'Medium confidence'
                            ? 'bg-amber-950/80 text-amber-400 border-amber-700'
                            : 'bg-rose-950/80 text-rose-400 border-rose-700'
                        }`}
                      >
                        {currentTrackState.result.confidenceLabel}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Last reviewed: October 2026</span>
                    </div>
                  </div>

                  {/* Main Profile Info with Avatar */}
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    {/* SVG Avatar with Energy Label */}
                    <div className="flex flex-col items-center gap-2.5 shrink-0 self-center md:self-start">
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 bg-slate-950/80 border border-slate-800"
                        dangerouslySetInnerHTML={{
                          __html:
                            activeTrack === 'A'
                              ? ARCHETYPE_AVATARS[currentTrackState.result.archetype.code]
                              : activeTrack === 'B'
                              ? ARCHETYPE_AVATARS[currentTrackState.result.primaryArchetype.code]
                              : activeTrack === 'C'
                              ? ARCHETYPE_AVATARS[currentTrackState.result.primaryArchetype.code]
                              : currentTrackState.result.roleEnergyArchetype
                              ? ARCHETYPE_AVATARS[currentTrackState.result.roleEnergyArchetype.code]
                              : ARCHETYPE_AVATARS.AN,
                        }}
                      />
                      <span className="text-xs font-semibold text-slate-400 text-center max-w-[130px]">
                        {activeTrack === 'A'
                          ? currentTrackState.result.archetype.characterEnergy
                          : activeTrack === 'B'
                          ? currentTrackState.result.primaryArchetype.characterEnergy
                          : activeTrack === 'C'
                          ? currentTrackState.result.primaryArchetype.characterEnergy
                          : currentTrackState.result.roleEnergyArchetype?.characterEnergy || 'Strategic Energy'}
                      </span>
                    </div>

                    {/* Right column details */}
                    <div className="flex-1 space-y-3.5 w-full">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {activeTrack === 'C'
                            ? currentTrackState.result.specialization.name
                            : activeTrack === 'D'
                            ? `${currentTrackState.result.role} (${currentTrackState.result.level})`
                            : reportCardsData.archExtended.title}
                        </h2>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/60 inline-flex items-center">
                          {activeTrack === 'C'
                            ? `Selected Specialization: ${currentTrackState.result.specialization.name}`
                            : activeTrack === 'D'
                            ? `Readiness: ${currentTrackState.result.overallScore}/100`
                            : reportCardsData.primaryDomain.fitsTag}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm font-semibold text-[#00DF89]">
                        {activeTrack === 'C'
                          ? `Primary Orientation · ${currentTrackState.result.rankedFamilies?.[0] || 'Strategic'} Work Family`
                          : activeTrack === 'D'
                          ? `${currentTrackState.result.overallStatus} · ${currentTrackState.result.persona}`
                          : reportCardsData.archExtended.sub}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                        {activeTrack === 'C'
                          ? (currentTrackState.result.profile?.description || currentTrackState.result.primaryArchetype?.description || 'Deep domain focus with high functional alignment to MBA campus placement demands.')
                          : activeTrack === 'D'
                          ? `You are preparing for ${currentTrackState.result.role} at the ${currentTrackState.result.level.toLowerCase()} level. Based on your scenario responses across role understanding, tangible evidence, technical fundamentals, and interview practice, you have achieved an overall readiness score of ${currentTrackState.result.overallScore}/100.`
                          : (currentTrackState.result.archetype?.description || currentTrackState.result.primaryArchetype?.description || 'You learn by making things and testing them. You are comfortable with uncertainty if it means creating something new.')}
                      </p>

                      {/* Quote block */}
                      <div className="border-l-2 border-[#00DF89] pl-3.5 py-1.5 text-xs sm:text-sm text-slate-300 italic bg-slate-950/40 rounded-r-lg">
                        "{activeTrack === 'D' ? 'Placement readiness is about demonstrable evidence, clear storytelling, and closing domain gaps before recruiters arrive.' : activeTrack === 'C' ? 'Specialization focus turns general aptitude into crisp, differentiated candidate leverage during placement season.' : reportCardsData.archExtended.quote}"
                      </div>

                      {/* Trait chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {(activeTrack === 'C' && currentTrackState.result.rankedFamilies
                          ? [
                              `Primary Family: ${currentTrackState.result.rankedFamilies[0]}`,
                              `Secondary Family: ${currentTrackState.result.rankedFamilies[1]}`,
                              `Domain: ${currentTrackState.result.specialization.name.split('&')[0].trim()}`,
                            ]
                          : activeTrack === 'D'
                          ? [
                              `Target: ${currentTrackState.result.role}`,
                              `Level: ${currentTrackState.result.level}`,
                              `Score: ${currentTrackState.result.overallScore}/100`,
                            ]
                          : reportCardsData.archExtended.chips
                        ).map((chip: string, idx: number) => (
                          <div
                            key={idx}
                            className="px-3.5 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5 shadow-sm"
                          >
                            <span className="text-[#00DF89] font-bold">✓</span>
                            <span>{chip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preference Pattern (for Track A) or Domain Highlights */}
                  {activeTrack === 'A' && currentTrackState.result.patternRanks && (
                    <div className="space-y-3 pt-4 border-t border-slate-800/80">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                        YOUR PREFERENCE PATTERN ACROSS ALL 6 ARCHETYPES:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {currentTrackState.result.patternRanks.map((p: any) => (
                          <div
                            key={p.code}
                            className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between"
                          >
                            <span className="text-xs font-semibold text-slate-300">{p.name}</span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                p.label === 'Strong'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : p.label === 'Moderate'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {p.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">This shows relative preference across domains, not ability.</p>
                    </div>
                  )}

                  {activeTrack === 'B' && (
                    <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                      <span className="font-semibold text-white">Dual Focus Strategy:</span> Primary discipline in{' '}
                      <span className="text-emerald-400 font-bold">{currentTrackState.result.primary.name}</span> with complementary strength in{' '}
                      <span className="text-emerald-400 font-bold">{currentTrackState.result.secondary.name}</span>.
                    </div>
                  )}

                  {activeTrack === 'C' && (
                    <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                      <span className="font-semibold text-white">Target Work Family:</span>{' '}
                      <span className="text-emerald-400 font-bold">{currentTrackState.result.rankedFamilies?.[0]}</span> (Top campus role recommendation:{' '}
                      <span className="text-white font-bold">{currentTrackState.result.recommendedRoles?.[0]?.title}</span>).
                    </div>
                  )}

                  {activeTrack === 'D' && (
                    <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                      <span className="font-semibold text-white">Target Role Readiness:</span>{' '}
                      <span className="text-emerald-400 font-bold">{currentTrackState.result.role} ({currentTrackState.result.level})</span> • Overall Score:{' '}
                      <span className="text-white font-bold">{currentTrackState.result.overallScore}/100</span> ({currentTrackState.result.overallStatus}).
                    </div>
                  )}
                </div>

                {/* TRACK 1 (A & B): CARD 2 & CARD 3 */}
                {(activeTrack === 'A' || activeTrack === 'B') && (
                  <>
                    {/* CARD 2: TOP SPECIALIZATION MATCH */}
                    <div className="bg-[#0B111E]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-xs font-bold tracking-wide">
                          <span>★</span>
                          <span>TOP SPECIALIZATION MATCH</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-3">
                          {reportCardsData.primaryDomain.name} fits you completely
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                          Based on your scenario problem-solving instincts, you naturally lean towards{' '}
                          <span className="text-emerald-400 font-semibold">{reportCardsData.primaryDomain.tagline}</span>.{' '}
                          {reportCardsData.primaryDomain.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-800/80">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          NORMALIZED FIT ACROSS ALL 8 DISCIPLINES:
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
                          {/* Left column (indices 0, 2, 4, 6) */}
                          <div className="space-y-3.5">
                            {[
                              reportCardsData.disciplineList[0],
                              reportCardsData.disciplineList[2],
                              reportCardsData.disciplineList[4],
                              reportCardsData.disciplineList[6],
                            ].filter(Boolean).map((d) => (
                              <div key={d.id} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className={d.isTop ? 'font-bold text-white' : 'font-medium text-slate-300'}>
                                    {d.name}
                                  </span>
                                  <span className={`font-mono text-xs font-bold ${d.isTop ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {d.score}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      d.isTop ? 'bg-[#00DF89]' : 'bg-slate-600'
                                    }`}
                                    style={{ width: `${d.score}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Right column (indices 1, 3, 5, 7) */}
                          <div className="space-y-3.5">
                            {[
                              reportCardsData.disciplineList[1],
                              reportCardsData.disciplineList[3],
                              reportCardsData.disciplineList[5],
                              reportCardsData.disciplineList[7],
                            ].filter(Boolean).map((d) => (
                              <div key={d.id} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className={d.isTop ? 'font-bold text-white' : 'font-medium text-slate-300'}>
                                    {d.name}
                                  </span>
                                  <span className={`font-mono text-xs font-bold ${d.isTop ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {d.score}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      d.isTop ? 'bg-[#00DF89]' : 'bg-slate-600'
                                    }`}
                                    style={{ width: `${d.score}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD 3: DUAL SPECIALIZATION RECOMMENDATION */}
                    <div className="bg-[#0B111E]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#00DF89] uppercase tracking-wider font-mono">
                          <span>⚡</span>
                          <span>DUAL SPECIALIZATION RECOMMENDATION · YEAR 2 / MAJOR + MINOR</span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Campus Placement Advantage</span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs text-slate-400">Your Recommended Dual Pairing:</div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {reportCardsData.dualTitle}
                        </h2>
                        <div className="text-xs sm:text-sm font-semibold text-[#00DF89]">
                          {reportCardsData.dualTagline}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {reportCardsData.dualDesc}
                        </p>
                      </div>

                      {/* 2 Side-by-side insight boxes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-white">
                            High-Placement Roles Unlocked:
                          </div>
                          <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                            {reportCardsData.unlockedRoles.map((roleTitle, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[#00DF89] font-bold">✓</span>
                                <span className="text-white font-medium">{roleTitle}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-white">
                            Why This Gives Placement Leverage:
                          </div>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            {reportCardsData.placementLeverage}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons: Only Build Resume, NO View Target Roles button */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <a
                          href="#resume"
                          className="px-5 py-3 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                        >
                          <span>Build Resume for this Specialization</span>
                          <span>→</span>
                        </a>
                      </div>
                    </div>
                  </>
                )}

                {/* TRACK 2 (C: I KNOW MY SPECIALIZATION): SHORTLISTED ROLES & INTERVIEW READINESS RUBRIC */}
                {activeTrack === 'C' && (
                  <div className="bg-[#0B111E]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#14B8A6] uppercase tracking-wider font-mono">
                        <span>🎯</span>
                        <span>TARGET ROLE SHORTLIST & CAMPUS INTERVIEW RUBRIC</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Selected: {currentTrackState.result.specialization.name}</span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Target Roles Shortlisted in {currentTrackState.result.specialization.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        You selected <span className="text-white font-bold">{currentTrackState.result.specialization.name}</span> as your specialization. Based on your scenario instincts, your primary work orientation is <span className="text-[#14B8A6] font-bold">{currentTrackState.result.rankedFamilies?.[0]} Work Family</span>. Here are your top 3 high-probability placement target roles and interview readiness scores:
                      </p>
                    </div>

                    {/* Top 3 Shortlisted Roles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentTrackState.result.recommendedRoles?.slice(0, 3).map((r: any, idx: number) => (
                        <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800/60 font-mono">
                                {idx === 0 ? 'Top Fit' : `Role ${idx + 1}`}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">{r.family}</span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-2">{r.title}</h3>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.reason}</p>
                          </div>
                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Campus Match</span>
                            <span className="text-[#00DF89] font-bold">Recommended ✓</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fallback Role Notice */}
                    {currentTrackState.result.fallbackRole && (
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                        <span className="text-amber-400 text-lg">🛡️</span>
                        <div className="text-xs text-slate-300 space-y-0.5">
                          <span className="font-bold text-amber-300">{currentTrackState.result.fallbackRole.typeLabel}: </span>
                          <span>{currentTrackState.result.fallbackRole.title}</span>
                          <span className="text-slate-400 block text-[11px]">If your dream niche recruiters visit with fewer open slots, leverage this high-volume campus backup role.</span>
                        </div>
                      </div>
                    )}

                    {/* Interview Readiness Rubric */}
                    <div className="space-y-4 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                          Interview Preparation Rubric (Evaluated from Your Answers):
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Scale: 1 (Needs practice) to 5 (Interview ready)</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                          <div className="text-xs text-slate-400">Technical / Functional</div>
                          <div className="text-2xl font-black text-white">{currentTrackState.result.rubric.technical}/5</div>
                          <div className="text-[10px] text-emerald-400 font-semibold">{currentTrackState.result.rubric.technical >= 4 ? 'Ready' : 'In Progress'}</div>
                        </div>
                        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                          <div className="text-xs text-slate-400">Case & Structuring</div>
                          <div className="text-2xl font-black text-white">{currentTrackState.result.rubric.case}/5</div>
                          <div className="text-[10px] text-emerald-400 font-semibold">{currentTrackState.result.rubric.case >= 4 ? 'Ready' : 'In Progress'}</div>
                        </div>
                        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                          <div className="text-xs text-slate-400">Behavioural & Leadership</div>
                          <div className="text-2xl font-black text-white">{currentTrackState.result.rubric.behavioural}/5</div>
                          <div className="text-[10px] text-emerald-400 font-semibold">{currentTrackState.result.rubric.behavioural >= 4 ? 'Ready' : 'In Progress'}</div>
                        </div>
                        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                          <div className="text-xs text-slate-400">Group Discussion (GD)</div>
                          <div className="text-2xl font-black text-white">{currentTrackState.result.rubric.gd}/5</div>
                          <div className="text-[10px] text-emerald-400 font-semibold">{currentTrackState.result.rubric.gd >= 4 ? 'Ready' : 'In Progress'}</div>
                        </div>
                      </div>

                      {/* Rubric Actions & Skills to Build */}
                      {currentTrackState.result.rubric.actions?.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                            Targeted Actions to Level Up Your Interview Score:
                          </span>
                          <div className="space-y-1.5 text-xs text-slate-300">
                            {currentTrackState.result.rubric.actions.map((act: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold shrink-0">•</span>
                                <span><strong className="text-white">{act.format}:</strong> {act.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action: Build Resume only, NO view target roles button */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <a
                        href="#resume"
                        className="px-5 py-3 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                      >
                        <span>Build Resume for this Specialization</span>
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* TRACK 3 (D: I KNOW THE ROLE I WANT): ROLE READINESS DIAGNOSTIC & COMPETENCY BREAKDOWN */}
                {activeTrack === 'D' && (
                  <>
                    {/* CARD 2: DIMENSION-BY-DIMENSION READINESS BREAKDOWN */}
                    <div className="bg-[#0B111E]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                          <span>📊</span>
                          <span>COMPETENCY READINESS BREAKDOWN · 7 EVALUATED DIMENSIONS</span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Candidate Profile: {currentTrackState.result.level}</span>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {currentTrackState.result.role} Placement Readiness: {currentTrackState.result.overallScore}/100
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          Your overall score reflects normalized evaluation across role comprehension, evidence projects, technical and case fundamentals, interview practice, network connections, resume positioning, and AI verification.
                        </p>
                      </div>

                      {/* Dimension Progress Bars */}
                      <div className="space-y-4 pt-2">
                        {currentTrackState.result.dimensionList?.map((dim: any) => (
                          <div key={dim.dimension} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-white text-sm">{dim.name}</span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    dim.status === 'Ready'
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                                      : dim.status === 'Close'
                                      ? 'bg-amber-950 text-amber-400 border border-amber-700'
                                      : 'bg-rose-950 text-rose-400 border border-rose-700'
                                  }`}
                                >
                                  {dim.status}
                                </span>
                                <span className="font-mono font-bold text-white">{dim.score}%</span>
                              </div>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  dim.status === 'Ready'
                                    ? 'bg-[#00DF89]'
                                    : dim.status === 'Close'
                                    ? 'bg-amber-400'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${dim.score}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              <span className="text-slate-300 font-semibold">Priority Action: </span>
                              {dim.closingAction}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Honest Gaps Alert */}
                      {currentTrackState.result.honestGaps?.length > 0 && (
                        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-2">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                            Critical Gaps to Address Before Recruitment Drives:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {currentTrackState.result.honestGaps.map((gap: string, i: number) => (
                              <span key={i} className="px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-700/60 text-xs text-amber-200">
                                ⚠ {gap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <a
                          href="#resume"
                          className="px-5 py-3 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                        >
                          <span>Build Resume for {currentTrackState.result.role}</span>
                          <span>→</span>
                        </a>
                        <a
                          href="#match"
                          className="px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                        >
                          <span>Match JD for {currentTrackState.result.role}</span>
                          <span>→</span>
                        </a>
                      </div>
                    </div>

                    {/* CARD 3: 90-DAY PLACEMENT READINESS ROADMAP */}
                    {currentTrackState.result.plan?.weeks && (
                      <div className="bg-[#0B111E]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#00DF89] uppercase tracking-wider font-mono">
                            <span>⚡</span>
                            <span>90-DAY CAMPUS PLACEMENT SPRINT ROADMAP</span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            {Object.values(checkedWeeks).filter(Boolean).length} / 12 Weeks Completed
                          </span>
                        </div>

                        <div>
                          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Structured 12-Week Prep Roadmap
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                            Check off weekly milestones as you build deliverables, complete mock interviews, and refine your pitch for {currentTrackState.result.role}.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Phase 1 */}
                          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                              Phase 1: Foundations (Weeks 1–4)
                            </div>
                            <div className="space-y-2">
                              {currentTrackState.result.plan.weeks.slice(0, 4).map((w: any) => (
                                <div key={w.week} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={!!checkedWeeks[w.week]}
                                      onChange={(e) => setCheckedWeeks((prev) => ({ ...prev, [w.week]: e.target.checked }))}
                                      className="mt-1 w-3.5 h-3.5 accent-[#00DF89] cursor-pointer shrink-0"
                                    />
                                    <div>
                                      <div className={`text-xs font-bold ${checkedWeeks[w.week] ? 'line-through text-slate-500' : 'text-white'}`}>
                                        Week {w.week}: {w.focus}
                                      </div>
                                      <div className="text-[11px] text-slate-400 mt-0.5">{w.output}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Phase 2 */}
                          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                            <div className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono">
                              Phase 2: Deliverables & Mocks (Weeks 5–8)
                            </div>
                            <div className="space-y-2">
                              {currentTrackState.result.plan.weeks.slice(4, 8).map((w: any) => (
                                <div key={w.week} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={!!checkedWeeks[w.week]}
                                      onChange={(e) => setCheckedWeeks((prev) => ({ ...prev, [w.week]: e.target.checked }))}
                                      className="mt-1 w-3.5 h-3.5 accent-[#00DF89] cursor-pointer shrink-0"
                                    />
                                    <div>
                                      <div className={`text-xs font-bold ${checkedWeeks[w.week] ? 'line-through text-slate-500' : 'text-white'}`}>
                                        Week {w.week}: {w.focus}
                                      </div>
                                      <div className="text-[11px] text-slate-400 mt-0.5">{w.output}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Phase 3 */}
                          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                              Phase 3: High-Pressure Sprints (Weeks 9–12)
                            </div>
                            <div className="space-y-2">
                              {currentTrackState.result.plan.weeks.slice(8, 12).map((w: any) => (
                                <div key={w.week} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={!!checkedWeeks[w.week]}
                                      onChange={(e) => setCheckedWeeks((prev) => ({ ...prev, [w.week]: e.target.checked }))}
                                      className="mt-1 w-3.5 h-3.5 accent-[#00DF89] cursor-pointer shrink-0"
                                    />
                                    <div>
                                      <div className={`text-xs font-bold ${checkedWeeks[w.week] ? 'line-through text-slate-500' : 'text-white'}`}>
                                        Week {w.week}: {w.focus}
                                      </div>
                                      <div className="text-[11px] text-slate-400 mt-0.5">{w.output}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* SPECIALIZATION ROLE BLUEPRINT · TARGET ROLES & CAMPUS FALLBACK STRATEGY (image_48cf9597.png) */}
                {(() => {
                  const blueprint =
                    ROLE_BLUEPRINTS[reportCardsData.primaryDomain.id] ||
                    ROLE_BLUEPRINTS.product;
                  return (
                    <div
                      id="specialization-role-blueprint"
                      className="bg-[#0B111E]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl scroll-mt-6"
                    >
                      {/* Top Header */}
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#00DF89] uppercase tracking-wider font-mono">
                          <span>★</span>
                          <span>
                            SPECIALIZATION ROLE BLUEPRINT · {blueprint.domainName.toUpperCase()}
                          </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
                          Target Roles & Campus Fallback Strategy
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                          During MBA campus placements, relying on a single aspirational role creates risk if that company reduces hiring quotas. Below is your 3-role portfolio: your primary aspiration, high-fit alternative, and campus placement fallback role.
                        </p>
                      </div>

                      {/* 3 Role Cards */}
                      <div className="space-y-4">
                        {blueprint.roles.map((role) => (
                          <div
                            key={role.tier}
                            className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-700 transition-colors"
                          >
                            {/* Top Header Row with Badge, Title, CTC */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                              <div className="flex flex-wrap items-center gap-3">
                                <span
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${role.badgeBg} ${role.badgeText} ${role.badgeBorder}`}
                                >
                                  {role.badgeLabel}
                                </span>
                                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                  {role.title}
                                </h3>
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-[#00DF89] font-mono shrink-0">
                                Campus CTC: {role.ctc}
                              </div>
                            </div>

                            {/* Subtitle description */}
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {role.subtitle}
                            </p>

                            {/* 3 Columns Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                              {/* Box 1: What to Expect on the Job */}
                              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between space-y-2.5">
                                <div>
                                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                    What to Expect on the Job:
                                  </div>
                                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                                    {role.whatToExpect}
                                  </p>
                                </div>
                              </div>

                              {/* Box 2: 3–5 Year Career Trajectory */}
                              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between space-y-3">
                                <div>
                                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                                    <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                                      <span className="text-emerald-400">📈</span>
                                      <span>3–5 Year Career Trajectory:</span>
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 font-semibold">
                                      Progression Ladder
                                    </span>
                                  </div>

                                  {/* Hierarchical Career Stepper */}
                                  <div className="relative mt-3 space-y-2.5 pl-2.5">
                                    {/* Vertical Glowing Connector Line */}
                                    <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-indigo-500 opacity-40 rounded" />

                                    {(role.trajectoryStages || []).map((stage, sIdx) => (
                                      <div key={sIdx} className="relative flex items-start gap-2.5">
                                        {/* Stepper Node */}
                                        <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-emerald-400 flex items-center justify-center shrink-0 z-10 shadow-sm mt-0.5">
                                          <span className="text-[9px] font-bold text-emerald-300 font-mono">
                                            {sIdx + 1}
                                          </span>
                                        </div>

                                        {/* Stage Card */}
                                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 flex-1 space-y-1">
                                          <div className="flex flex-wrap items-center justify-between gap-1">
                                            <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/60 rounded border border-emerald-800/50">
                                              {stage.timeframe}
                                            </span>
                                            {stage.compensation && (
                                              <span className="text-[10px] font-mono font-bold text-[#00DF89]">
                                                {stage.compensation}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs font-bold text-white leading-tight">
                                            {stage.title}
                                          </div>
                                          <p className="text-[11px] text-slate-300 leading-snug">
                                            {stage.scope}
                                          </p>
                                        </div>
                                      </div>
                                    ))}

                                    {/* Fallback if no stages defined */}
                                    {(!role.trajectoryStages || role.trajectoryStages.length === 0) && (
                                      <p className="text-xs text-slate-300 mt-2 leading-relaxed pl-2">
                                        {role.careerTrajectory}
                                      </p>
                                    )}
                                  </div>

                                  {/* Top Exit Horizons */}
                                  {role.exitOpportunities && role.exitOpportunities.length > 0 && (
                                    <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
                                        Top Exit Horizons:
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {role.exitOpportunities.map((exit, eIdx) => (
                                          <span
                                            key={eIdx}
                                            className="text-[10px] font-medium bg-slate-800/90 text-slate-200 border border-slate-700/60 px-2 py-0.5 rounded-md"
                                          >
                                            {exit}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Box 3: How to Crack the Interview */}
                              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between space-y-2.5">
                                <div className="space-y-2">
                                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                    How to Crack the Interview:
                                  </div>
                                  <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                                    <div>
                                      <span className="font-semibold text-emerald-400 block text-[11px] uppercase tracking-wide">
                                        What Hiring Managers Look For:
                                      </span>
                                      <span className="text-slate-300 mt-0.5 block">{role.howToCrack.hiringLookFor}</span>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-emerald-400 block text-[11px] uppercase tracking-wide">
                                        How to Prepare:
                                      </span>
                                      <span className="text-slate-300 mt-0.5 block">{role.howToCrack.howToPrepare}</span>
                                    </div>
                                    <div className="pt-1 border-t border-slate-800/80">
                                      <span className="font-semibold text-slate-400 font-mono text-[10px] block uppercase">
                                        Keywords & Certifications:
                                      </span>
                                      <span className="text-[11px] text-slate-300 font-mono mt-0.5 block">
                                        {role.howToCrack.keywordsAndCerts}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Action Links */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                              <a
                                href="#match"
                                className="text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors"
                              >
                                Benchmark in Job Match
                              </a>
                              <a
                                href="#match"
                                className="text-xs font-bold text-[#00DF89] hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                              >
                                <span>Match JD for {role.title.split('(')[0].trim()}</span>
                                <span>→</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SECTION 1: Your snapshot */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                1. Your Snapshot
              </h3>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                {activeTrack === 'A' && (
                  <>
                    <p>{currentTrackState.result.archetype.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                          Strength
                        </span>
                        <span>{currentTrackState.result.archetype.strength}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                          Shadow Side
                        </span>
                        <span>{currentTrackState.result.archetype.shadowSide}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">
                        Works Best When
                      </span>
                      <span>{currentTrackState.result.archetype.worksBestWhen}</span>
                    </div>
                  </>
                )}
                {activeTrack === 'B' && (
                  <p>
                    Primary work style:{' '}
                    <span className="font-semibold text-white">
                      {currentTrackState.result.primaryArchetype.name}
                    </span>{' '}
                    ({currentTrackState.result.primaryArchetype.characterEnergy}).{' '}
                    {currentTrackState.result.primaryArchetype.description}
                  </p>
                )}
                {activeTrack === 'C' && (
                  <p>
                    Work family orientation:{' '}
                    <span className="font-semibold text-white">
                      {currentTrackState.result.primaryArchetype.name}
                    </span>
                    . {currentTrackState.result.primaryArchetype.description}
                  </p>
                )}
                {activeTrack === 'D' && (
                  <p>
                    Candidate Persona:{' '}
                    <span className="font-semibold text-white">{currentTrackState.result.persona}</span>
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 2: Why you got this */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                2. Why You Got This
              </h3>
              <div className="space-y-2 text-sm text-slate-300">
                {activeTrack === 'A' && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Responses that drove your archetype classification:</p>
                    {currentTrackState.result.keyAnswers.map((ka: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-500 font-mono mb-1">{ka.question}</div>
                        <div className="font-semibold text-slate-200">"{ka.answer}"</div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTrack === 'B' && (
                  <p>
                    Your scores highlighted high engagement in {currentTrackState.result.primary.name} (score{' '}
                    {currentTrackState.result.scores[currentTrackState.result.primary.code]}) alongside{' '}
                    {currentTrackState.result.secondary.name} (score{' '}
                    {currentTrackState.result.scores[currentTrackState.result.secondary.code]}).
                  </p>
                )}
                {activeTrack === 'C' && (
                  <p>
                    Your top work family is{' '}
                    <span className="font-bold text-white">
                      {currentTrackState.result.rankedFamilies[0]}
                    </span>{' '}
                    (score {currentTrackState.result.familyScores[currentTrackState.result.rankedFamilies[0]]}),
                    followed by {currentTrackState.result.rankedFamilies[1]}.
                  </p>
                )}
                {activeTrack === 'D' && (
                  <div className="space-y-2">
                    <p>Scored across 7 preparation dimensions with calibration multiplier applied for {currentTrackState.result.level}.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {currentTrackState.result.dimensionList.map((d: any) => (
                        <div key={d.dimension} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                          <div className="text-[11px] text-slate-400 font-semibold">{d.name}</div>
                          <div className="text-base font-bold text-white mt-1">
                            {d.isNotAssessed ? 'N/A' : `${d.score}/100`}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {d.isNotAssessed ? 'Not assessed' : d.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: What the work really looks like */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                3. What the Work Really Looks Like
              </h3>
              <div className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold uppercase text-emerald-400 block mb-1">Typical Week</span>
                {activeTrack === 'A' && (
                  <p>
                    {SPECIALIZATION_PROFILES[currentTrackState.result.primarySpec.code]?.week ||
                      'Build and update models, analyze numbers, prepare reports for decisions.'}
                  </p>
                )}
                {activeTrack === 'B' && (
                  <p>
                    {SPECIALIZATION_PROFILES[currentTrackState.result.primary.code]?.week ||
                      'Coordinate cross-functional deliverables, analyze operational data, and present recommendations.'}
                  </p>
                )}
                {activeTrack === 'C' && (
                  <p>{currentTrackState.result.profile.week}</p>
                )}
                {activeTrack === 'D' && (
                  <p>
                    {ROLE_ANATOMIES[currentTrackState.result.role]?.daily ||
                      'Talk to users, structure problems, analyze data, and run team checkpoints.'}
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 4: What to expect */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                4. What to Expect
              </h3>
              <div className="text-sm text-slate-300 leading-relaxed space-y-3">
                <p>
                  <span className="font-semibold text-white">Entry routes:</span> Campus placement drives, alumni referrals, and off-campus applications.
                </p>
                <p>
                  <span className="font-semibold text-white">First 0 to 3 years:</span> Accelerated learning curve moving from task execution to problem structuring and client presentation.
                </p>
                {activeTrack === 'C' && (
                  <div className="pt-2">
                    <span className="font-semibold text-white block mb-2">Interview Rubric (1 to 5):</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="text-xs text-slate-400">Technical</div>
                        <div className="text-lg font-bold text-white">{currentTrackState.result.rubric.technical}/5</div>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="text-xs text-slate-400">Case</div>
                        <div className="text-lg font-bold text-white">{currentTrackState.result.rubric.case}/5</div>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="text-xs text-slate-400">Behavioural</div>
                        <div className="text-lg font-bold text-white">{currentTrackState.result.rubric.behavioural}/5</div>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="text-xs text-slate-400">Group Discussion</div>
                        <div className="text-lg font-bold text-white">{currentTrackState.result.rubric.gd}/5</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5: AI today in this field */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  5. AI Today in This Field
                </span>
                {/* AI Exposure Badge (Text + Icon) */}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5">
                  <span>🤖</span> Exposure of entry-level tasks to AI: Medium
                </span>
              </h3>
              <div className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                {activeTrack === 'A' && (
                  <p>
                    {SPECIALIZATION_PROFILES[currentTrackState.result.primarySpec.code]?.ai_now ||
                      'Automates first drafts and data extraction; human review and strategic context remain essential.'}
                  </p>
                )}
                {activeTrack === 'B' && (
                  <p>
                    {SPECIALIZATION_PROFILES[currentTrackState.result.primary.code]?.ai_now ||
                      'AI tools accelerate routine drafting; judgment and leadership grow in relative value.'}
                  </p>
                )}
                {activeTrack === 'C' && <p>{currentTrackState.result.profile.ai_now}</p>}
                {activeTrack === 'D' && (
                  <p>
                    {ROLE_ANATOMIES[currentTrackState.result.role]?.ai_in_role ||
                      'Speeds up synthesis and documentation; you frame the problem and verify facts.'}
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 6: The next 3 to 5 years */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                6. The Next 3 to 5 Years
              </h3>
              <div className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                {activeTrack === 'A' && (
                  <p>
                    {SPECIALIZATION_PROFILES[currentTrackState.result.primarySpec.code]?.next ||
                      'Roles transition toward prompt architecture, verification, and strategic alignment.'}
                  </p>
                )}
                {activeTrack === 'B' && (
                  <p>
                    {SPECIALIZATION_PROFILES[currentTrackState.result.primary.code]?.next ||
                      'Leaders managing hybrid human-AI teams and complex trade-offs gain significant advantage.'}
                  </p>
                )}
                {activeTrack === 'C' && <p>{currentTrackState.result.profile.next}</p>}
                {activeTrack === 'D' && (
                  <p>
                    Entry roles shift from first-draft generation to high-level checking, judgment, and communication.
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 7: Watch-outs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                7. Watch-Outs
              </h3>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Risk Line
                  </span>
                  {activeTrack === 'A' && <span>{currentTrackState.result.archetype.risk}</span>}
                  {activeTrack === 'B' && (
                    <span>Confirm credit counts and allowed combinations with your college academic office.</span>
                  )}
                  {activeTrack === 'C' && (
                    <span>
                      Analytical and client-facing roles can be competitive; ensure your portfolio demonstrates concrete deliverables.
                    </span>
                  )}
                  {activeTrack === 'D' && (
                    <span>
                      {currentTrackState.result.honestGaps.length > 0
                        ? `Identified Gaps: ${currentTrackState.result.honestGaps.join(', ')}`
                        : 'No critical dimension gaps detected.'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{currentTrackState.result.confidenceNote || ''}</p>
              </div>
            </div>

            {/* SECTION 8: Your first 30 days */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                8. Your First 30 Days
              </h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span>
                    {activeTrack === 'A'
                      ? currentTrackState.result.archetype.nextStep
                      : 'Audit your current college electives and align credits with your target path.'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span>Speak with 2 alumni who graduated 1 to 3 years ago in this functional area.</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span>Draft 1 tangible work sample (a financial model, PRD, or case study analysis).</span>
                </div>
              </div>
            </div>

            {/* SECTION 9: Compare alternatives */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                9. Compare Alternatives
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                {activeTrack === 'A' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Alternative ({currentTrackState.result.alternativeSpec.primaryType})
                      </span>
                      <span className="font-semibold text-white">{currentTrackState.result.alternativeSpec.name}</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Stretch ({currentTrackState.result.stretchSpec.primaryType})
                      </span>
                      <span className="font-semibold text-white">{currentTrackState.result.stretchSpec.name}</span>
                    </div>
                  </div>
                )}
                {activeTrack === 'B' && (
                  <p>
                    Alternative dual pairing:{' '}
                    <span className="font-bold text-white">
                      {currentTrackState.result.primary.code} + {currentTrackState.result.bestPartner.code}
                    </span>
                    .
                  </p>
                )}
                {activeTrack === 'C' && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Other viable role paths from your assessment:</p>
                    {currentTrackState.result.recommendedRoles.slice(1).map((r: any) => (
                      <div key={r.title} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                        <span className="font-semibold text-white">{r.title}</span>
                        <span className="text-xs text-slate-500">{r.family}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTrack === 'D' && (
                  <p>Review the alternative roles in Track C if you decide to pivot from {currentTrackState.result.role}.</p>
                )}
              </div>
            </div>

            {/* SECTION 10: Market snapshot & Hiring in the AI era */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                10. Market Snapshot & Hiring in the AI Era
              </h3>
              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                {MARKET_SNAPSHOT.map((m, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold">
                      <span>{m.source} ({m.date})</span>
                      <span className="text-emerald-500 font-mono">Verify at source</span>
                    </div>
                    <p className="text-slate-300">{m.text}</p>
                  </div>
                ))}

                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    Hiring Realities in the AI Era
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                    {HIRING_IN_AI_ERA.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* SECTION 11: Sources & Disclaimer */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs text-slate-500">
              <h3 className="font-bold text-slate-400 uppercase tracking-wider">
                11. Sources & Professional Notice
              </h3>
              <p>Character references are for fun and not affiliated with any film studio. This is not a clinical personality test.</p>
              <p className="leading-relaxed">{GLOBAL_DISCLAIMER}</p>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* CONFIRMATION MODAL: CHANGE TRACK */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Switch Assessment Track?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your answers for this track are kept for this session. Switch track?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                Stay
              </button>
              <button
                onClick={() => {
                  setShowSwitchModal(false);
                  updateCurrentTrack({ stage: 'entry' });
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 cursor-pointer"
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: START OVER */}
      {showStartOverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Clear All Session Data?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will reset answers across all diagnostic tracks for this session.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowStartOverModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartOver}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-500 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
