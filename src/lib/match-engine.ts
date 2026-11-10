import { check, AtsReport, AtsRequirement } from '@veriworkly/ats-engine';
import {
  ThreeBlockResultCard,
  EngineAnalysisResult,
  ScoreBreakdown,
  ResumeFacts,
  ResumeEvidenceUnit,
  MatchClassification,
  RequirementType,
  RequirementPriority,
  SeniorityLevel,
} from './match-engine-types';

export interface RunAnalysisOptions {
  jobCompany?: string;
  onProgress?: (stage: number, stageLabel: string, detail?: string) => void;
}

/**
 * Normalizes input text by trimming whitespace, normalizing CRLF to LF,
 * and stripping non-printable characters.
 */
function cleanInputText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

/**
 * Maps @veriworkly/ats-engine requirement kind to our RequirementType
 */
function mapRequirementKind(kind: string): RequirementType {
  switch (kind) {
    case 'experience':
      return 'years_experience';
    case 'seniority':
      return 'seniority';
    case 'education':
      return 'education';
    case 'skills':
      return 'tool_skill';
    case 'certification':
    case 'clearance':
    case 'authorization':
      return 'certification';
    default:
      return 'domain_experience';
  }
}

/**
 * Maps @veriworkly/ats-engine requirement status to our MatchClassification
 */
function mapRequirementStatus(status: AtsRequirement['status']): MatchClassification {
  switch (status) {
    case 'met':
      return 'matched';
    case 'partial':
      return 'can_improve';
    case 'missing':
      return 'missing';
    case 'unverifiable':
      return 'uncertain';
    default:
      return 'missing';
  }
}

import { ResumeData } from '../types';
import { generateAtsPlainText } from './resume';

/**
 * Executes deterministic Job Match analysis using open-source @veriworkly/ats-engine.
 * Zero AI/LLM calls in the analysis path.
 */
export async function runJobMatchAnalysis(
  jdText: string,
  resumeInput: ResumeData | string,
  options?: RunAnalysisOptions
): Promise<EngineAnalysisResult> {
  const startTime = Date.now();
  const { jobCompany, onProgress } = options || {};

  onProgress?.(1, 'Reading Job Posting', 'Analyzing job description text and structure');
  const cleanJd = cleanInputText(jdText);
  const rawResumeText = typeof resumeInput === 'string'
    ? resumeInput
    : generateAtsPlainText(resumeInput);
  const cleanResume = cleanInputText(rawResumeText);

  if (!cleanJd || cleanJd.length < 20) {
    throw new Error('Insufficient job description text provided for analysis.');
  }

  onProgress?.(2, 'Running Deterministic ATS Engine', 'Evaluating requirements, evidence units, and keyword alignment');

  // Execute @veriworkly/ats-engine deterministic evaluation
  const report: AtsReport = check(cleanResume, undefined, {
    jobDescription: cleanJd,
    jobCompany: jobCompany || undefined,
  });

  onProgress?.(3, 'Structuring Audit Cards', 'Formatting evidenced requirements and gap bridging guidance');

  // Transform @veriworkly/ats-engine requirements into our ThreeBlockResultCard contracts
  const cards: ThreeBlockResultCard[] = (report.requirements || []).map((req, idx) => {
    const classification = mapRequirementStatus(req.status);
    const reqType = mapRequirementKind(req.kind);
    const priority: RequirementPriority = req.importance === 'required' ? 'critical' : 'preferred';
    const canonicalTerm = req.terms && req.terms.length > 0
      ? req.terms.map((t) => t.term).join(', ')
      : req.text.slice(0, 40);

    const evidenceList = req.evidence || [];
    // Only set evidencePhrase if genuine evidence was found by the engine
    const evidencePhrase = evidenceList.length > 0 ? evidenceList[0] : undefined;

    const citedUnits: ResumeEvidenceUnit[] = evidenceList.map((ev, evIdx) => ({
      index: evIdx,
      section: 'Work History',
      text: ev,
      containsMetric: /\d+/.test(ev),
    }));

    const missingExplanation = classification === 'missing'
      ? (req.detail || 'No direct evidence found in candidate resume text.')
      : undefined;

    const actionHeadline = classification === 'matched'
      ? 'Requirement Directly Evidenced'
      : classification === 'can_improve'
      ? 'Sharpen Resume Evidence'
      : classification === 'uncertain'
      ? 'Candidate Verification Required'
      : 'Bridge Requirement Gap';

    const adviceText = req.detail
      ? req.detail
      : classification === 'matched'
      ? 'Evidence is explicitly found in your resume. Keep this accomplishment prominent and quantified.'
      : classification === 'can_improve'
      ? 'Partial evidence or related terminology detected. Add explicit accomplishments and quantifiable metrics.'
      : 'Incorporate direct project accomplishments or explicit keywords to bridge this requirement gap.';

    return {
      id: `req-${idx + 1}`,
      requirement: {
        id: `req-${idx + 1}`,
        type: reqType,
        canonicalTerm,
        verbatimQuote: req.text,
        priority,
        zone: req.importance === 'required' ? 'Core Requirements' : 'Preferred Qualifications',
      },
      classification,
      scoreWeight: req.importance === 'required' ? 2 : 1,

      // Block 1: THE JOB ASKS
      jobAsks: {
        verbatimQuote: req.text,
        zone: req.importance === 'required' ? 'Core Requirements' : 'Preferred Qualifications',
        priority,
        type: reqType,
        canonicalTerm,
      },

      // Block 2: YOUR RESUME
      yourResume: {
        status: classification,
        citedUnit: citedUnits[0],
        allCitedUnits: citedUnits,
        evidencePhrase,
        missingExplanation,
      },

      // Block 3: WHAT TO DO
      whatToDo: {
        actionHeadline,
        adviceText,
        canRewrite: false, // Pure deterministic, zero AI hallucination
      },
    };
  });

  // Calculate counts strictly matching cards rendered
  const total = cards.length;
  const matched = cards.filter((c) => c.classification === 'matched').length;
  const canImprove = cards.filter((c) => c.classification === 'can_improve').length;
  const missing = cards.filter((c) => c.classification === 'missing').length;
  const uncertain = cards.filter((c) => c.classification === 'uncertain').length;
  const criticalTotal = cards.filter((c) => c.jobAsks.priority === 'critical').length;
  const criticalMatched = cards.filter((c) => c.jobAsks.priority === 'critical' && c.classification === 'matched').length;

  // Use engine's jobMatchScore or compute exact denominator-matched percentage
  const roleFitScore = report.jobMatchScore !== null && report.jobMatchScore !== undefined
    ? report.jobMatchScore
    : (total > 0 ? Math.round(((matched + canImprove * 0.5) / total) * 100) : 0);

  const contentCategory = report.categories?.find((c) => c.category === 'content');
  const structureCategory = report.categories?.find((c) => c.category === 'structure');

  const honestSummary = 'A missing keyword or requirement in this automated audit reflects phrasing variance in the document, not necessarily an absence of capability or real-world experience.';

  const scoreBreakdown: ScoreBreakdown = {
    roleFitScore,
    wordingScore: report.readinessScore || roleFitScore,
    quantifiedMetricsScore: contentCategory?.score || 0,
    atsStructureScore: structureCategory?.score || 0,
    honestSummary,
    weights: {
      critical: 3,
      important: 2,
      preferred: 1,
      bonus: 0.5,
    },
    counts: {
      total,
      matched,
      canImprove,
      missing,
      uncertain,
      criticalTotal,
      criticalMatched,
    },
  };

  // Structured facts from parsed resume
  const totalMonths = report.parsed?.monthsOfExperience || 0;
  const totalYears = Math.round(totalMonths / 12);
  const detectedSeniorityLevel: SeniorityLevel = totalYears >= 8 ? 'director' : totalYears >= 5 ? 'senior' : totalYears >= 2 ? 'manager' : 'associate';

  const resumeFacts: ResumeFacts = {
    evidenceUnits: [],
    rawText: cleanResume,
    totalExperienceMonths: totalMonths,
    totalExperienceYears: totalYears,
    detectedSeniorityLevel,
    highestSeniorityTitle: report.parsed?.roles?.[0]?.title || '',
    degrees: (report.parsed?.education || []).map((e) => e.credential || e.school).filter(Boolean),
    certifications: (report.parsed?.certifications || []).map((c) => c.name).filter(Boolean),
    skillsList: [...(report.matchedKeywords || []), ...(report.missingKeywords || [])],
    quantifiedMetricsPercent: contentCategory?.score || 0,
    totalExperienceBullets: report.parsed?.roles?.length || 0,
    metricsBulletsCount: Math.round(((report.parsed?.roles?.length || 0) * (contentCategory?.score || 0)) / 100),
  };

  const latencyMs = Date.now() - startTime;

  return {
    cards,
    resumeFacts,
    scoreBreakdown,
    modelUsed: `@veriworkly/ats-engine@0.22.0 (Deterministic)`,
    isAiAssisted: false,
    latencyMs,
  };
}
