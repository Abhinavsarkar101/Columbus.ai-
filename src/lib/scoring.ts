import { QUESTIONS } from '../data/questions';
import { ROLES } from '../data/roles';
import {
  AssessmentReport,
  AssessmentState,
  DomainId,
  FreeTextSignal,
  RoleDefinition,
  TraitId,
} from '../types';
import { parseFreeText } from './freeText';

export function calculateMaxDomainWeights(answeredQuestionIds: number[]): Record<DomainId, number> {
  const maxWeights: Record<DomainId, number> = {
    marketing: 0,
    finance: 0,
    product: 0,
    consulting: 0,
    operations: 0,
    analytics: 0,
    hr: 0,
    sales_gm: 0,
  };

  for (const q of QUESTIONS) {
    if (!answeredQuestionIds.includes(q.id)) continue;

    // Find max potential points for each domain in this question
    const qMax: Partial<Record<DomainId, number>> = {};
    for (const opt of q.options) {
      for (const [dom, weight] of Object.entries(opt.domainWeights)) {
        const d = dom as DomainId;
        qMax[d] = Math.max(qMax[d] || 0, weight || 0);
      }
    }

    for (const [dom, weight] of Object.entries(qMax)) {
      const d = dom as DomainId;
      maxWeights[d] += weight || 0;
    }
  }

  return maxWeights;
}

export function buildReport(state: AssessmentState): AssessmentReport {
  const answeredIds = Object.keys(state.answers).map(Number);
  const rawDomainScores: Record<DomainId, number> = {
    marketing: 0,
    finance: 0,
    product: 0,
    consulting: 0,
    operations: 0,
    analytics: 0,
    hr: 0,
    sales_gm: 0,
  };

  const rawTraitScores: Record<TraitId, number> = {
    analytical: 0,
    people: 0,
    creative: 0,
    execution: 0,
    commercial: 0,
    structure: 0,
  };

  const freeTextSignals: FreeTextSignal[] = [];
  let signalCount = 0;

  for (const [qIdStr, answerVal] of Object.entries(state.answers)) {
    const qId = Number(qIdStr);
    const question = QUESTIONS.find((q) => q.id === qId);
    if (!question) continue;

    if (answerVal.startsWith('other:')) {
      const rawText = answerVal.replace(/^other:/, '').trim();
      const signal = parseFreeText(rawText, qId);
      if (signal) {
        freeTextSignals.push(signal);
        if (signal.extractedKeywords.length > 0) {
          signalCount++;
          // Add bounded weight from free-text
          for (const [dom, wt] of Object.entries(signal.detectedDomains)) {
            const d = dom as DomainId;
            rawDomainScores[d] += Math.min(3, (wt || 0) * signal.confidence);
          }
          for (const [tr, wt] of Object.entries(signal.detectedTraits)) {
            const t = tr as TraitId;
            rawTraitScores[t] += Math.min(3, (wt || 0) * signal.confidence);
          }
        }
      }
    } else {
      const option = question.options.find((o) => o.id === answerVal);
      if (option) {
        signalCount++;
        for (const [dom, wt] of Object.entries(option.domainWeights)) {
          const d = dom as DomainId;
          rawDomainScores[d] += wt || 0;
        }
        for (const [tr, wt] of Object.entries(option.traitWeights)) {
          const t = tr as TraitId;
          rawTraitScores[t] += wt || 0;
        }
      }
    }
  }

  // Normalize Domain Scores against maximum possible in answered questions
  const maxPossible = calculateMaxDomainWeights(answeredIds);
  const domainScores: Record<DomainId, number> = {
    marketing: 0,
    finance: 0,
    product: 0,
    consulting: 0,
    operations: 0,
    analytics: 0,
    hr: 0,
    sales_gm: 0,
  };

  for (const dom of Object.keys(rawDomainScores) as DomainId[]) {
    const max = maxPossible[dom] || 1;
    // Bounded between 0 and 100
    domainScores[dom] = Math.min(100, Math.round((rawDomainScores[dom] / Math.max(8, max)) * 100));
  }

  // Normalize Trait Scores (typical max trait per question is ~4, so 14 questions ~ 25)
  const traitScores: Record<TraitId, number> = {
    analytical: 0,
    people: 0,
    creative: 0,
    execution: 0,
    commercial: 0,
    structure: 0,
  };
  const traitNormDivisor = Math.max(10, answeredIds.length * 2.2);

  for (const tr of Object.keys(rawTraitScores) as TraitId[]) {
    traitScores[tr] = Math.min(100, Math.round((rawTraitScores[tr] / traitNormDivisor) * 100));
  }

  // Determine top domain
  let topDomain: DomainId = 'product';
  let highestScore = -1;
  for (const [dom, score] of Object.entries(domainScores)) {
    if (score > highestScore) {
      highestScore = score;
      topDomain = dom as DomainId;
    }
  }

  // Compute Role Fits across all 19 roles
  const rankedRoles = ROLES.map((role) => {
    // Skill coverage calculation
    let weightedSkillSum = 0;
    let totalSkillWeight = 0;

    for (const skill of role.skills) {
      // Look up candidate's self rating (0-100), default to 55 if not specified
      const rating = state.skillRatings[skill.name] ?? 55;
      weightedSkillSum += (rating / 100) * skill.weight;
      totalSkillWeight += skill.weight;
    }

    const skillCoverage = totalSkillWeight > 0 ? (weightedSkillSum / totalSkillWeight) * 100 : 50;

    // Trait fit calculation: compare role.traits (1-10) with user's traitScores (0-100)
    let traitDiffSum = 0;
    const traitKeys: TraitId[] = ['analytical', 'people', 'creative', 'execution', 'commercial', 'structure'];
    for (const t of traitKeys) {
      const targetVal = role.traits[t] * 10; // scale 1-10 to 10-100
      const userVal = traitScores[t] || 50;
      traitDiffSum += Math.abs(targetVal - userVal);
    }
    // Average trait divergence (0 to 100)
    const avgDivergence = traitDiffSum / traitKeys.length;
    const traitFit = Math.max(20, Math.round(100 - avgDivergence));

    // Role fit: 0.7 * skillCoverage + 0.3 * traitFit
    let fitScore = Math.round(0.7 * skillCoverage + 0.3 * traitFit);

    // If role domain matches top domain, give small alignment bonus (max 100)
    if (role.domain === topDomain) {
      fitScore = Math.min(100, fitScore + 4);
    }

    return {
      role,
      fitScore,
      skillCoverage: Math.round(skillCoverage),
      traitFit,
    };
  }).sort((a, b) => b.fitScore - a.fitScore);

  // Target role selection
  const targetRoleDef = state.targetRoleId
    ? ROLES.find((r) => r.id === state.targetRoleId)
    : (state.mode === 'role' || state.mode === 'ready'
        ? rankedRoles[0]?.role
        : (signalCount > 0 ? rankedRoles[0]?.role : null));

  let targetRoleReport = null;

  if (targetRoleDef) {
    // Keyword evidence check in experienceText
    const expTextClean = (state.experienceText || '').toLowerCase();
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const kw of targetRoleDef.keywords) {
      if (expTextClean.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    // Evidence bonus: up to 18 points based on fraction of keywords present
    const kwFraction = targetRoleDef.keywords.length > 0 ? matchedKeywords.length / targetRoleDef.keywords.length : 0;
    const evidenceBonus = Math.round(kwFraction * 18);

    // Skill coverage for target role
    let weightedSkillSum = 0;
    let totalSkillWeight = 0;
    const rankedGaps: { skill: string; weight: number; rating: number; gap: number }[] = [];

    for (const skill of targetRoleDef.skills) {
      const rating = state.skillRatings[skill.name] ?? 55;
      weightedSkillSum += (rating / 100) * skill.weight;
      totalSkillWeight += skill.weight;

      // Gap definition: weight >= 3 and rating < 65%
      if (skill.weight >= 3 && rating < 65) {
        rankedGaps.push({
          skill: skill.name,
          weight: skill.weight,
          rating,
          gap: 65 - rating,
        });
      }
    }

    // Sort gaps by role weight descending, then by gap size descending
    rankedGaps.sort((a, b) => b.weight - a.weight || b.gap - a.gap);

    const skillCoverage = totalSkillWeight > 0 ? (weightedSkillSum / totalSkillWeight) * 100 : 50;
    // Readiness: 0.82 * skill coverage + 0.18 * evidence bonus
    const readinessScore = Math.min(100, Math.round(0.82 * skillCoverage + evidenceBonus));

    // Generate 90-day Action Plan
    const topGap1 = rankedGaps[0]?.skill || targetRoleDef.skills[0]?.name || 'Core Domain Competency';
    const topGap2 = rankedGaps[1]?.skill || targetRoleDef.skills[1]?.name || 'Executive Stakeholder Influence';
    const topCert = targetRoleDef.certifications[0] || 'Domain Masterclass Certification';

    const plan90Days = {
      days1_30: {
        title: 'Month 1: Diagnostic & Foundation Mastery',
        items: [
          `Target primary gap "${topGap1}": Complete structured coursework and build foundational reference notes.`,
          `Study target role certification curriculum: Enroll or audit "${topCert}".`,
          `Analyze 10 real job descriptions for ${targetRoleDef.title} to benchmark required tools and frameworks.`,
          `Conduct 2 diagnostic coffee chats with alumni working as ${targetRoleDef.title} at ${targetRoleDef.sampleCompanies[0] || 'target companies'}.`,
        ],
      },
      days31_60: {
        title: 'Month 2: Artifact Creation & Practical Application',
        items: [
          `Build an ATS-optimized capstone project remediating "${topGap2}" (e.g. detailed PRD, financial model, or supply chain case).`,
          `Incorporate keywords: Embed "${targetRoleDef.keywords.slice(0, 4).join(', ')}" into your resume project bullets.`,
          `Complete at least 5 live case interview or functional take-home simulation practices with MBA peers.`,
          `Audit and quantify all previous experience bullets with metric impact, revenue numbers, and scale indicators.`,
        ],
      },
      days61_90: {
        title: 'Month 3: Targeted Outreach & Interview Execution',
        items: [
          `Map 15 key contacts across ${targetRoleDef.sampleCompanies.slice(0, 3).join(', ')} using the People & Target tool.`,
          `Initiate personalized 3-touch outreach sequences to alumni and hiring managers.`,
          `Run 4 timed mock interviews with senior mentors focusing on behavioural and case question mastery.`,
          `Finalize ATS resume tailored to specific job descriptions with match score target > 85%.`,
        ],
      },
    };

    targetRoleReport = {
      role: targetRoleDef,
      readinessScore,
      evidenceBonus,
      matchedKeywords,
      missingKeywords,
      rankedGaps,
      plan90Days,
    };
  }

  return {
    domainScores,
    traitScores,
    topDomain,
    topRoles: rankedRoles,
    targetRoleReport,
    freeTextSignals,
    answersCount: answeredIds.length,
    hasSignal: signalCount > 0,
  };
}
