import { z } from 'zod';

export type RequirementType =
  | 'years_experience'
  | 'seniority'
  | 'education'
  | 'certification'
  | 'tool_skill'
  | 'domain_experience'
  | 'responsibility'
  | 'soft_skill';

export type RequirementPriority = 'critical' | 'important' | 'preferred' | 'bonus';

export type SeniorityLevel = 'intern' | 'associate' | 'manager' | 'senior' | 'lead' | 'director';

export type MatchClassification = 'matched' | 'can_improve' | 'missing' | 'uncertain';

// Zod Schema for dynamic JD requirement extracted from text
export const ExtractedRequirementSchema = z.object({
  id: z.string(),
  type: z.enum([
    'years_experience',
    'seniority',
    'education',
    'certification',
    'tool_skill',
    'domain_experience',
    'responsibility',
    'soft_skill',
  ]),
  canonicalTerm: z.string(),
  verbatimQuote: z.string(),
  priority: z.enum(['critical', 'important', 'preferred', 'bonus']),
  zone: z.string(),
  minYears: z.number().optional(),
  targetLevel: z.enum(['intern', 'associate', 'manager', 'senior', 'lead', 'director']).optional(),
  targetDegree: z.string().optional(),
  targetCert: z.string().optional(),
});

export type ExtractedRequirement = z.infer<typeof ExtractedRequirementSchema>;

export const RequirementsExtractionResponseSchema = z.object({
  requirements: z.array(ExtractedRequirementSchema),
});

// Resume facts and segmentation
export interface ResumeEvidenceUnit {
  index: number;
  section: string; // e.g. "Experience", "Projects", "Education", "Skills"
  roleTitle?: string;
  company?: string;
  dateRange?: string;
  startYear?: number;
  endYear?: number;
  text: string; // Full bullet or sentence (no fragments)
  containsMetric: boolean;
}

export interface DateInterval {
  startMonth: number; // YYYY * 12 + month (0-11)
  endMonth: number;
  label: string;
}

export interface ResumeFacts {
  evidenceUnits: ResumeEvidenceUnit[];
  rawText: string;
  totalExperienceMonths: number;
  totalExperienceYears: number;
  detectedSeniorityLevel: SeniorityLevel;
  highestSeniorityTitle?: string;
  degrees: string[];
  certifications: string[];
  skillsList: string[];
  quantifiedMetricsPercent: number; // percentage of experience bullets with numbers/metrics
  totalExperienceBullets: number;
  metricsBulletsCount: number;
}

// Stage 4 AI Semantic Output Schema
export const SemanticMatchOutputItemSchema = z.object({
  requirementId: z.string(),
  classification: z.enum(['matched', 'can_improve', 'missing', 'uncertain']),
  evidenceUnitIndices: z.array(z.number()),
  evidencePhrase: z.string(), // Must be exact substring of cited unit
  reasoning: z.string(),
  relatedButNotEvidence: z
    .object({
      unitIndex: z.number(),
      explanation: z.string(),
    })
    .nullable()
    .optional(),
  rewrite: z
    .object({
      sourceUnitIndex: z.number(),
      text: z.string(),
    })
    .nullable()
    .optional(),
});

export type SemanticMatchOutputItem = z.infer<typeof SemanticMatchOutputItemSchema>;

export const SemanticMatchResponseSchema = z.object({
  results: z.array(SemanticMatchOutputItemSchema),
});

export type SemanticMatchResponse = z.infer<typeof SemanticMatchResponseSchema>;

// Unified 3-Block Result Card Data
export interface ThreeBlockResultCard {
  id: string;
  requirement: ExtractedRequirement;
  classification: MatchClassification;
  scoreWeight: number;

  // Block 1: THE JOB ASKS
  jobAsks: {
    verbatimQuote: string;
    zone: string;
    priority: RequirementPriority;
    type: RequirementType;
    canonicalTerm: string;
  };

  // Block 2: YOUR RESUME
  yourResume: {
    status: MatchClassification;
    citedUnit?: ResumeEvidenceUnit;
    allCitedUnits?: ResumeEvidenceUnit[];
    evidencePhrase?: string;
    breadcrumbs?: string; // e.g. "Senior Product Manager › Swiggy · Jan 2021 – Present · Experience"
    missingExplanation?: string;
    relatedEvidence?: {
      unit: ResumeEvidenceUnit;
      explanation: string;
    };
  };

  // Block 3: WHAT TO DO
  whatToDo: {
    actionHeadline: string;
    adviceText: string;
    canRewrite: boolean;
    sourceBulletText?: string;
    suggestedRewrite?: string;
    rewriteSourceUnitIndex?: number;
    userNote?: string; // from "I have this - describe it"
    isUserConfirmed?: boolean;
  };
}

export interface ScoreBreakdown {
  roleFitScore: number; // priority-weighted
  wordingScore: number; // keyword/exact ATS alignment
  quantifiedMetricsScore: number; // % experience bullets with numbers
  atsStructureScore: number; // formatting/bullet completeness
  honestSummary: string; // generated honest synthesis
  weights: {
    critical: number;
    important: number;
    preferred: number;
    bonus: number;
  };
  counts: {
    total: number;
    matched: number;
    canImprove: number;
    missing: number;
    uncertain: number;
    criticalTotal: number;
    criticalMatched: number;
  };
}

export interface EngineAnalysisResult {
  cards: ThreeBlockResultCard[];
  resumeFacts: ResumeFacts;
  scoreBreakdown: ScoreBreakdown;
  modelUsed: string;
  isAiAssisted: boolean;
  latencyMs: number;
  metadata?: {
    location?: string;
    experienceRange?: string;
    workplaceType?: string;
  };
}
