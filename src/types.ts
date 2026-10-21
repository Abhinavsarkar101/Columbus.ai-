export type DomainId =
  | 'marketing'
  | 'finance'
  | 'product'
  | 'consulting'
  | 'operations'
  | 'analytics'
  | 'hr'
  | 'sales_gm';

export type TraitId =
  | 'analytical'
  | 'people'
  | 'creative'
  | 'execution'
  | 'commercial'
  | 'structure';

export interface DomainInfo {
  id: DomainId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  typicalElectives: string[];
  primaryRoles: string[];
  marketOutlook: string;
  avgCompensation: string;
}

export interface TraitInfo {
  id: TraitId;
  name: string;
  description: string;
  highIndicator: string;
  lowIndicator: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  domainWeights: Partial<Record<DomainId, number>>;
  traitWeights: Partial<Record<TraitId, number>>;
  subtext?: string;
}

export interface AssessmentQuestion {
  id: number;
  scenario: string;
  category: string;
  prompt: string;
  options: QuestionOption[];
}

export interface RoleDefinition {
  id: string;
  title: string;
  domain: DomainId;
  seniority: string;
  description: string;
  salaryRangeINR: string;
  salaryRangeUSD: string;
  skills: { name: string; weight: number }[]; // 1-5 weight
  traits: Record<TraitId, number>; // 1-10
  keywords: string[];
  certifications: string[];
  sampleCompanies: string[];
  dayInTheLife: string;
}

export interface FreeTextSignal {
  rawText: string;
  questionId: number;
  detectedDomains: Partial<Record<DomainId, number>>;
  detectedTraits: Partial<Record<TraitId, number>>;
  extractedKeywords: string[];
  confidence: number; // 0-1
  explanation: string;
}

export interface AssessmentState {
  mode: 'domain' | 'role' | 'ready';
  targetRoleId: string | null;
  answers: Record<number, string>; // questionId -> optionId or 'other:<text>'
  skillRatings: Record<string, number>; // skillName -> 0-100
  experienceText: string;
  lastUpdated: string;
}

export interface AssessmentReport {
  domainScores: Record<DomainId, number>; // 0-100
  traitScores: Record<TraitId, number>; // 0-100
  topDomain: DomainId;
  topRoles: {
    role: RoleDefinition;
    fitScore: number; // 0-100
    skillCoverage: number;
    traitFit: number;
  }[];
  targetRoleReport: {
    role: RoleDefinition;
    readinessScore: number; // 0-100
    evidenceBonus: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    rankedGaps: { skill: string; weight: number; rating: number; gap: number }[];
    plan90Days: {
      days1_30: { title: string; items: string[] };
      days31_60: { title: string; items: string[] };
      days61_90: { title: string; items: string[] };
    };
  } | null;
  freeTextSignals: FreeTextSignal[];
  answersCount: number;
  hasSignal: boolean;
}

export interface ResumeWorkExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpaOrScore?: string;
  honors?: string;
}

export interface ResumeData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubOrPortfolio?: string;
  summary: string;
  education: ResumeEducation[];
  experience: ResumeWorkExperience[];
  skills: {
    category: string;
    items: string[];
  }[];
  projects: {
    id: string;
    name: string;
    context: string;
    bullets: string[];
  }[];
  certifications: string[];
  targetDomain: DomainId;
}

export interface AtsCheckResult {
  id: string;
  name: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface JDAnalysis {
  overallMatch: number; // 0-100
  keywordCoverage: number;
  quantifiedImpactScore: number;
  structureScore: number;
  matchedKeywords: { term: string; count: number; category: string }[];
  missingKeywords: { term: string; category: string; importance: 'critical' | 'recommended' | 'bonus' }[];
  atsChecks: AtsCheckResult[];
  bulletRewrites: { original: string; improved: string; reason: string }[];
  inferredRole: string;
  requirementsCount: number;
}

export interface OutreachContact {
  id: string;
  name: string;
  company: string;
  role: string;
  linkedinUrl: string;
  category: 'peer' | 'leader' | 'recruiter' | 'alumni';
  stage: 'not_contacted' | 'sent' | 'replied' | 'call' | 'referral';
  addedAt: string;
  notes: string;
  messages: {
    opener: string;
    followUp: string;
    referralAsk: string;
  };
}

export interface CompanyBrief {
  id: string;
  name: string;
  domain: DomainId;
  logoInitial: string;
  tagline: string;
  cultureRating: number; // out of 5
  selectivity: 'High' | 'Very High' | 'Ultra High';
  hiringTimeline: string;
  typicalRounds: { round: number; name: string; focus: string }[];
  payBandINR: string;
  payBandUSD: string;
  targetRoles: string[];
  insiderTips: string[];
  commonPitfalls: string[];
  pros: string[];
  cons: string[];
}

export interface ReviewThemeScore {
  theme: string;
  score: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative';
  sampleMentions: number;
}
