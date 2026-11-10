import { CATALOG_ITEMS, CATALOG_GROUPS, CatalogItem, ArchetypeCode } from '../data/catalog';
import { ARCHETYPES, ArchetypeDef } from '../data/archetypes';
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

// ==========================================
// PURE SCORING FUNCTIONS
// ==========================================

export interface ScoreAResult {
  typeScores: Record<string, number>;
  digCount: number;
  archetype: ArchetypeDef;
  secondaryArchetype?: ArchetypeDef;
  isBlend: boolean;
  primarySpec: CatalogItem;
  alternativeSpec: CatalogItem;
  stretchSpec: CatalogItem;
  specScores: Record<string, number>;
  confidenceLabel: 'High confidence' | 'Medium confidence' | 'Lower confidence';
  confidenceNote: string;
  mbaTimingNote: string;
  readinessNote: string;
  patternRanks: { code: string; name: string; score: number; label: 'Strong' | 'Moderate' | 'Light' }[];
  keyAnswers: { question: string; answer: string }[];
}

export function scoreA(answers: Record<string, string | string[]>): ScoreAResult {
  const typeScores: Record<string, number> = { AN: 0, ST: 0, BU: 0, PE: 0, CO: 0, OP: 0 };
  let rawDig = 0;
  let notSureCount = 0;
  const keyAnswers: { question: string; answer: string }[] = [];

  for (const q of TRACK_A_CORE) {
    const rawVal = answers[q.id];
    if (!rawVal || rawVal === 'NOT_SURE') {
      notSureCount++;
      continue;
    }

    const selectedIds = Array.isArray(rawVal) ? rawVal : [rawVal];
    if (selectedIds.length === 0) {
      notSureCount++;
      continue;
    }

    const share = q.weight / selectedIds.length;
    for (const optId of selectedIds) {
      const opt = q.options.find((o) => o.id === optId);
      if (opt && opt.tags) {
        for (const tag of opt.tags) {
          if (tag === 'DIG') {
            rawDig += share;
          } else if (typeScores[tag] !== undefined) {
            typeScores[tag] += share;
          }
        }
      }
    }
  }

  const digCount = Math.min(rawDig, 3);

  // Top archetype
  const archetypesOrder = ['AN', 'ST', 'BU', 'PE', 'CO', 'OP'] as const;
  const sortedTypes = [...archetypesOrder].sort((a, b) => {
    if (typeScores[b] !== typeScores[a]) {
      return typeScores[b] - typeScores[a];
    }
    return archetypesOrder.indexOf(a) - archetypesOrder.indexOf(b);
  });

  const topArchetypeCode = sortedTypes[0];
  const secondArchetypeCode = sortedTypes[1];
  const isBlend = Math.abs(typeScores[topArchetypeCode] - typeScores[secondArchetypeCode]) <= 2;

  // Follow-up points (+3 per selected follow-up option)
  const followupPoints: Record<string, number> = {};
  const followups = TRACK_A_FOLLOWUPS[topArchetypeCode] || [];
  for (const fq of followups) {
    const val = answers[fq.id];
    if (val && val !== 'NOT_SURE') {
      const opt = fq.options.find((o) => o.id === val);
      if (opt && opt.tags) {
        for (const t of opt.tags) {
          followupPoints[t] = (followupPoints[t] || 0) + 3;
        }
      }
    }
  }

  // Spec scores
  const specScores: Record<string, number> = {};
  for (const item of CATALOG_ITEMS) {
    const primaryPoints = typeScores[item.primaryType] || 0;
    const secondaryPoints = typeScores[item.secondaryType] || 0;
    const digBonus = item.digital ? digCount : 0;
    const fuBonus = followupPoints[item.code] || 0;
    specScores[item.code] = 2 * primaryPoints + secondaryPoints + digBonus + fuBonus;
  }

  // Rank specializations
  const rankedSpecs = [...CATALOG_ITEMS].sort((a, b) => {
    if (specScores[b.code] !== specScores[a.code]) {
      return specScores[b.code] - specScores[a.code];
    }
    return CATALOG_ITEMS.indexOf(a) - CATALOG_ITEMS.indexOf(b);
  });

  const primarySpec = rankedSpecs[0];
  const alternativeSpec = rankedSpecs.find((s) => s.primaryType !== primarySpec.primaryType) || rankedSpecs[1];
  const stretchSpec =
    rankedSpecs.find((s) => s.primaryType !== primarySpec.primaryType && s.primaryType !== alternativeSpec.primaryType) ||
    rankedSpecs[2];

  // Confidence label
  let confidenceLabel: 'High confidence' | 'Medium confidence' | 'Lower confidence' = 'High confidence';
  let confidenceNote = 'Your preferences are distinct across case scenarios.';
  if (notSureCount >= 4) {
    confidenceLabel = 'Lower confidence';
    confidenceNote = "You chose 'Not sure' several times, so treat this as a starting point. A talk with someone in the field would help.";
  } else if (notSureCount >= 2) {
    confidenceLabel = 'Medium confidence';
    confidenceNote = 'You had a few uncertain scenarios; consider exploring day-in-the-life walkthroughs.';
  }

  // Pattern ranks (Strong, Moderate, Light)
  const patternRanks = sortedTypes.map((code, index) => {
    let label: 'Strong' | 'Moderate' | 'Light' = 'Light';
    if (index === 0 || index === 1) label = 'Strong';
    else if (index === 2 || index === 3) label = 'Moderate';
    return {
      code,
      name: ARCHETYPES[code].name,
      score: typeScores[code],
      label,
    };
  });

  // MBA timing note
  const rawC1 = answers['A-C1'];
  const reasons: string[] = Array.isArray(rawC1) ? rawC1 : rawC1 ? [rawC1] : [];
  const reasonTags: string[] = [];
  const c1q = TRACK_A_CONTEXT.find((q) => q.id === 'A-C1');
  for (const r of reasons) {
    const opt = c1q?.options.find((o) => o.id === r);
    if (opt?.tags) reasonTags.push(...opt.tags);
  }

  const rawC2 = answers['A-C2'];
  const c2q = TRACK_A_CONTEXT.find((q) => q.id === 'A-C2');
  const c2opt = c2q?.options.find((o) => o.id === rawC2);
  const xpTag = c2opt?.tags?.[0] || '';

  let mbaTimingNote = 'Your reasons fit an MBA. Compare programs on the specializations you saw here.';
  if (
    reasonTags.length > 0 &&
    reasonTags.every((t) => t === 'EXPECT' || t === 'UNSURE')
  ) {
    mbaTimingNote = 'Your reasons are still forming. Talk to three MBA graduates before you commit.';
  } else if (xpTag === 'XP0') {
    mbaTimingNote = 'Programs differ: some are built for freshers and others prefer work experience. Check the class profile of your target colleges.';
  } else if (reasonTags.includes('SWITCH')) {
    mbaTimingNote = 'Career switchers do best with an internship or project in the new field. Plan one early.';
  } else if (reasonTags.includes('BIZ')) {
    mbaTimingNote = 'Check whether the program has an incubator or a venture track.';
  }

  // Readiness
  const rawR = answers['A-R'] || 'C';
  const rq = TRACK_A_CONTEXT.find((q) => q.id === 'A-R');
  let rTag = rq?.options.find((o) => o.id === rawR)?.tags?.[0] || 'READY_INFO';
  if (rawR === 'NOT_SURE') rTag = 'READY_INFO';

  let readinessNote = '';
  if (rTag === 'READY_INFO') {
    readinessNote = 'Talk to two alumni in your top two areas and book a career-services session before deciding.';
  } else if (rTag === 'READY_CONF') {
    readinessNote = `Trust your natural leanings. Complete one small test project in ${primarySpec.name} to confirm your capabilities.`;
  }

  // Collect key answers
  for (const q of TRACK_A_CORE) {
    const ans = answers[q.id];
    if (ans && ans !== 'NOT_SURE') {
      const optId = Array.isArray(ans) ? ans[0] : ans;
      const opt = q.options.find((o) => o.id === optId);
      if (opt && opt.tags?.includes(topArchetypeCode)) {
        keyAnswers.push({ question: q.text, answer: opt.text });
        if (keyAnswers.length >= 3) break;
      }
    }
  }

  return {
    typeScores,
    digCount,
    archetype: ARCHETYPES[topArchetypeCode],
    secondaryArchetype: ARCHETYPES[secondArchetypeCode],
    isBlend,
    primarySpec,
    alternativeSpec,
    stretchSpec,
    specScores,
    confidenceLabel,
    confidenceNote,
    mbaTimingNote,
    readinessNote,
    patternRanks,
    keyAnswers,
  };
}

// ==========================================
// TRACK B: DUAL SPECIALIZATION
// ==========================================

const STRONG_PAIRS = new Set([
  'FIN+ANA', 'FIN+FTC', 'FIN+STR', 'BNK+FTC', 'DM+ANA', 'DM+ENT',
  'MKT+ENT', 'MKT+SAL', 'OPS+ANA', 'OPS+ITM', 'SCM+ANA', 'SCM+INT',
  'STR+INT', 'STR+ENT', 'HR+STR', 'HR+ANA', 'PM+DSA', 'PM+ENT',
  'PM+ITM', 'HCM+PHA', 'ESG+STR', 'ENT+FAM',
]);

const OVERLAP_PAIRS = new Set([
  'MKT+DM', 'OPS+SCM', 'ANA+DSA', 'FIN+BNK',
]);

function pairKey(c1: string, c2: string): string {
  return [c1, c2].sort().join('+');
}

export function getPairRelationship(c1: string, c2: string): 'STRONG' | 'OVERLAP' | 'STRETCH' {
  const k1 = `${c1}+${c2}`;
  const k2 = `${c2}+${c1}`;
  if (STRONG_PAIRS.has(k1) || STRONG_PAIRS.has(k2)) return 'STRONG';
  if (OVERLAP_PAIRS.has(k1) || OVERLAP_PAIRS.has(k2)) return 'OVERLAP';
  return 'STRETCH';
}

export interface ScoreBResult {
  scores: Record<string, number>;
  primary: CatalogItem;
  secondary: CatalogItem;
  ranked: { item: CatalogItem; score: number; rank: number }[];
  pairChosen?: { code1: string; code2: string; relationship: 'STRONG' | 'OVERLAP' | 'STRETCH' };
  bestPartner: CatalogItem;
  verdict: string;
  verdictType: 'DUAL_NOT_OFFERED' | 'READY_LOW' | 'CREDIT_SINGLE' | 'STRONG' | 'STRONG_CAUTION' | 'STRETCH' | 'NO_PAIR';
  primaryArchetype: ArchetypeDef;
  secondaryArchetype?: ArchetypeDef;
  isBlend: boolean;
  confidenceLabel: 'High confidence' | 'Medium confidence' | 'Lower confidence';
}

export function scoreB(answers: Record<string, string | string[]>): ScoreBResult {
  const scores: Record<string, number> = {};
  for (const item of CATALOG_ITEMS) {
    scores[item.code] = 0;
  }

  let notSureCount = 0;

  for (let i = 1; i <= 8; i++) {
    const qId = `B-Q${i}`;
    const q = TRACK_B_QUESTIONS.find((item) => item.id === qId);
    if (!q) continue;

    const rawVal = answers[qId];
    if (!rawVal || rawVal === 'NOT_SURE') {
      notSureCount++;
      continue;
    }

    const selectedIds = Array.isArray(rawVal) ? rawVal : [rawVal];
    if (selectedIds.length === 0) {
      notSureCount++;
      continue;
    }

    const share = q.weight / selectedIds.length;
    for (const optId of selectedIds) {
      const opt = q.options.find((o) => o.id === optId);
      if (opt && opt.tags) {
        for (const code of opt.tags) {
          if (scores[code] !== undefined) {
            scores[code] += share;
          }
        }
      }
    }
  }

  // Q9: Pair choice adds +3 to each pair code
  const q9Val = answers['B-Q9'];
  let chosenPairCodes: [string, string] | null = null;
  if (q9Val && q9Val !== 'NOT_SURE') {
    const q9 = TRACK_B_QUESTIONS.find((item) => item.id === 'B-Q9');
    const opt = q9?.options.find((o) => o.id === q9Val);
    if (opt?.tags && opt.tags.length === 2) {
      chosenPairCodes = [opt.tags[0], opt.tags[1]];
      scores[opt.tags[0]] = (scores[opt.tags[0]] || 0) + 3;
      scores[opt.tags[1]] = (scores[opt.tags[1]] || 0) + 3;
    }
  } else {
    notSureCount++;
  }

  // Q10 credit planning
  const rawQ10 = answers['B-Q10'] || 'D';
  const q10 = TRACK_B_QUESTIONS.find((item) => item.id === 'B-Q10');
  const q10Opt = q10?.options.find((o) => o.id === rawQ10);
  let q10Tag = q10Opt?.tags?.[0] || 'READY_LOW';
  if (rawQ10 === 'NOT_SURE') q10Tag = 'READY_LOW';

  // Ranking by score descending; ties by catalog order
  const rankedItems = [...CATALOG_ITEMS].sort((a, b) => {
    if (scores[b.code] !== scores[a.code]) {
      return scores[b.code] - scores[a.code];
    }
    return CATALOG_ITEMS.indexOf(a) - CATALOG_ITEMS.indexOf(b);
  });

  const ranked = rankedItems.map((item, idx) => ({
    item,
    score: scores[item.code],
    rank: idx + 1,
  }));

  const primary = rankedItems[0];
  const secondary = rankedItems[1];

  // Best partner for Primary
  // The highest-ranked code among top 5 (excluding Primary) whose pair with Primary is STRONG; if none, the Secondary
  const top5ExcludingPrimary = rankedItems.slice(1, 6);
  const strongCandidate = top5ExcludingPrimary.find(
    (cand) => getPairRelationship(primary.code, cand.code) === 'STRONG'
  );
  const bestPartner = strongCandidate || secondary;

  // Verdict logic
  let verdict = '';
  let verdictType: ScoreBResult['verdictType'] = 'NO_PAIR';

  if (q10Tag === 'DUAL_NOT_OFFERED') {
    verdictType = 'DUAL_NOT_OFFERED';
    verdict = `Your college doesn't offer dual specialization. Take ${primary.name} as your major and use electives for ${secondary.name}.`;
  } else if (q10Tag === 'READY_LOW') {
    verdictType = 'READY_LOW';
    verdict =
      'No firm verdict yet. Take a short project in each shortlisted area, talk with alumni, or book a career-services session before committing your credits.';
  } else if (q10Tag === 'CREDIT_SINGLE' || q10Tag === 'CREDIT_SINGLE_TIGHT') {
    verdictType = 'CREDIT_SINGLE';
    verdict = `Take ${primary.name} and add an elective track related to ${secondary.name}.`;
  } else {
    // CREDIT_DUAL_OK
    if (chosenPairCodes) {
      const rel = getPairRelationship(chosenPairCodes[0], chosenPairCodes[1]);
      if (rel === 'STRONG') {
        const rank1 = ranked.find((r) => r.item.code === chosenPairCodes[0])?.rank || 99;
        const rank2 = ranked.find((r) => r.item.code === chosenPairCodes[1])?.rank || 99;
        if (rank1 > 3 || rank2 > 3) {
          verdictType = 'STRONG_CAUTION';
          const outsideCode = rank1 > 3 ? chosenPairCodes[0] : chosenPairCodes[1];
          verdict = `Workable with caution: ${outsideCode} ranks outside your top 3, so check that you really want it.`;
        } else {
          verdictType = 'STRONG';
          verdict = 'Workable. This pairing provides strong functional complementarity.';
        }
      } else {
        // STRETCH or OVERLAP
        verdictType = 'STRETCH';
        verdict = `Workable, but the skill sets differ, so you will need a clear story for recruiters. A stronger fit with your answers is ${primary.code} + ${bestPartner.code}.`;
      }
    } else {
      verdictType = 'NO_PAIR';
      verdict = `A strong pairing for you: ${primary.code} + ${bestPartner.code}.`;
    }
  }

  // Archetypes for Track B: Primary specialization's primary type (blend with Secondary's primary type if different)
  const primaryArch = ARCHETYPES[primary.primaryType as ArchetypeCode];
  const secArch = ARCHETYPES[secondary.primaryType as ArchetypeCode];
  const isBlend = primary.primaryType !== secondary.primaryType;

  let confidenceLabel: 'High confidence' | 'Medium confidence' | 'Lower confidence' = 'High confidence';
  if (notSureCount >= 4) confidenceLabel = 'Lower confidence';
  else if (notSureCount >= 2) confidenceLabel = 'Medium confidence';

  return {
    scores,
    primary,
    secondary,
    ranked,
    pairChosen: chosenPairCodes
      ? {
          code1: chosenPairCodes[0],
          code2: chosenPairCodes[1],
          relationship: getPairRelationship(chosenPairCodes[0], chosenPairCodes[1]),
        }
      : undefined,
    bestPartner,
    verdict,
    verdictType,
    primaryArchetype: primaryArch,
    secondaryArchetype: isBlend ? secArch : undefined,
    isBlend,
    confidenceLabel,
  };
}

// ==========================================
// TRACK C: SPECIALIZED CANDIDATE
// ==========================================

export const TRACK_C_ROLE_TITLES: Record<string, { ANALYTIC: string; CLIENT: string; BUILD: string; OPS_PEOPLE: string }> = {
  FIN: {
    ANALYTIC: 'FP&A or Financial Analyst',
    CLIENT: 'Investment Banking Analyst',
    BUILD: 'Corporate Finance or Treasury Associate',
    OPS_PEOPLE: 'Credit and Risk Operations Associate',
  },
  BNK: {
    ANALYTIC: 'Credit or Risk Analyst',
    CLIENT: 'Relationship Manager (Banking)',
    BUILD: 'Product Associate (Banking or Insurance)',
    OPS_PEOPLE: 'Banking Operations or Underwriting Associate',
  },
  FTC: {
    ANALYTIC: 'Fintech Data or Risk Analyst',
    CLIENT: 'Partnerships or Business Development (Fintech)',
    BUILD: 'Product Associate (Fintech)',
    OPS_PEOPLE: 'Payments Operations Associate',
  },
  ANA: {
    ANALYTIC: 'Data Analyst',
    CLIENT: 'Analytics Consultant',
    BUILD: 'Data Product Analyst',
    OPS_PEOPLE: 'BI or Reporting Analyst',
  },
  DSA: {
    ANALYTIC: 'Associate Data Scientist',
    CLIENT: 'AI or Analytics Solutions Consultant',
    BUILD: 'AI Product Associate',
    OPS_PEOPLE: 'Analytics Delivery Associate',
  },
  STR: {
    ANALYTIC: 'Consulting Analyst',
    CLIENT: 'Associate Consultant',
    BUILD: 'Business Development Associate',
    OPS_PEOPLE: 'Transformation or PMO Associate',
  },
  INT: {
    ANALYTIC: 'Export-Import Analyst',
    CLIENT: 'Global Account Manager',
    BUILD: 'International Market Entry Associate',
    OPS_PEOPLE: 'Trade Operations Executive',
  },
  GEN: {
    ANALYTIC: 'Business Analyst',
    CLIENT: 'Client Relationship Manager',
    BUILD: 'Business Development Associate',
    OPS_PEOPLE: 'Management Trainee (Operations)',
  },
  PM: {
    ANALYTIC: 'Product Analyst',
    CLIENT: 'Customer Success or Partner Manager',
    BUILD: 'Associate Product Manager',
    OPS_PEOPLE: 'Product Operations Associate',
  },
  ENT: {
    ANALYTIC: 'Business Development Analyst',
    CLIENT: 'Partnerships Manager',
    BUILD: 'Founding-team Associate (Startup)',
    OPS_PEOPLE: 'Growth or Operations Associate',
  },
  FAM: {
    ANALYTIC: 'Business Planning Analyst',
    CLIENT: 'Dealer or Key Customer Relations Manager',
    BUILD: 'New Business or Expansion Associate',
    OPS_PEOPLE: 'Family-business Operations Trainee',
  },
  MKT: {
    ANALYTIC: 'Marketing Analyst',
    CLIENT: 'Key Account or Brand Executive',
    BUILD: 'Brand or Product Marketing Associate',
    OPS_PEOPLE: 'Marketing Operations Executive',
  },
  DM: {
    ANALYTIC: 'Digital Analytics or SEO/SEM Analyst',
    CLIENT: 'Performance Marketing or Social Media Account Manager',
    BUILD: 'Content and Growth Marketing Associate',
    OPS_PEOPLE: 'Marketing Automation or Campaign Operations Executive',
  },
  SAL: {
    ANALYTIC: 'Sales Analyst or Sales Operations Analyst',
    CLIENT: 'Business Development Executive or Key Account Manager',
    BUILD: 'New Market or Channel Development Associate',
    OPS_PEOPLE: 'Sales Operations Executive',
  },
  MED: {
    ANALYTIC: 'Audience or Media Analyst',
    CLIENT: 'Media Planning or Brand Partnerships Executive',
    BUILD: 'Content Strategy or Production Associate',
    OPS_PEOPLE: 'Media Operations Coordinator',
  },
  HR: {
    ANALYTIC: 'HR Analytics Associate',
    CLIENT: 'Talent Acquisition Partner',
    BUILD: 'L&D Program Designer',
    OPS_PEOPLE: 'HR Business Partner Trainee',
  },
  HCM: {
    ANALYTIC: 'Healthcare Data Analyst',
    CLIENT: 'Hospital or Pharma Account Executive',
    BUILD: 'Healthcare Program Manager',
    OPS_PEOPLE: 'Hospital Operations Associate',
  },
  PHA: {
    ANALYTIC: 'Pharma Commercial Analyst',
    CLIENT: 'Medical Sales or Key Account Executive',
    BUILD: 'Product or Brand Associate (Pharma)',
    OPS_PEOPLE: 'Pharma Supply and Regulatory Operations Associate',
  },
  ESG: {
    ANALYTIC: 'ESG Analyst',
    CLIENT: 'Sustainability Consultant',
    BUILD: 'ESG Reporting or Program Lead',
    OPS_PEOPLE: 'Compliance and CSR Associate',
  },
  HOS: {
    ANALYTIC: 'Revenue or Yield Analyst',
    CLIENT: 'Guest or Corporate Sales Executive',
    BUILD: 'Experience or Product Development Associate',
    OPS_PEOPLE: 'Hospitality or Airline Operations Executive',
  },
  PPN: {
    ANALYTIC: 'Policy or Research Analyst',
    CLIENT: 'Partnerships and Fundraising Associate',
    BUILD: 'Program Design Associate',
    OPS_PEOPLE: 'Monitoring and Evaluation or Program Operations Associate',
  },
  OPS: {
    ANALYTIC: 'Operations Analyst',
    CLIENT: 'Vendor or Account Manager',
    BUILD: 'Process Improvement Associate',
    OPS_PEOPLE: 'Operations Executive Trainee',
  },
  SCM: {
    ANALYTIC: 'Supply Chain or Demand Planning Analyst',
    CLIENT: 'Procurement or Vendor Manager',
    BUILD: 'Network or Logistics Design Associate',
    OPS_PEOPLE: 'Logistics or Warehouse Operations Executive',
  },
  ITM: {
    ANALYTIC: 'IT Business Analyst',
    CLIENT: 'Functional Technology Consultant',
    BUILD: 'Digital Transformation Associate',
    OPS_PEOPLE: 'IT Service or Delivery Trainee',
  },
  PRJ: {
    ANALYTIC: 'Project or PMO Analyst',
    CLIENT: 'Client and Stakeholder Coordinator',
    BUILD: 'Project Planner or Associate Project Manager',
    OPS_PEOPLE: 'Project Coordinator',
  },
  RET: {
    ANALYTIC: 'Category or Merchandising Analyst',
    CLIENT: 'Key Account or Marketplace Account Manager',
    BUILD: 'E-commerce Category or Growth Associate',
    OPS_PEOPLE: 'Retail or E-commerce Operations Executive',
  },
  AGR: {
    ANALYTIC: 'Agri-commodity or Market Analyst',
    CLIENT: 'Agri-input Sales or Channel Manager',
    BUILD: 'Agri-product Development Associate',
    OPS_PEOPLE: 'Procurement and Farm-linkage Operations Executive',
  },
  REI: {
    ANALYTIC: 'Real Estate or Investment Analyst',
    CLIENT: 'Property Sales or Leasing Manager',
    BUILD: 'Project Development Associate',
    OPS_PEOPLE: 'Property or Facility Management Executive',
  },
};

export interface ScoreCResult {
  specialization: CatalogItem;
  familyScores: Record<string, number>;
  rankedFamilies: ('ANALYTIC' | 'CLIENT' | 'BUILD' | 'OPS_PEOPLE')[];
  recommendedRoles: { title: string; family: 'ANALYTIC' | 'CLIENT' | 'BUILD' | 'OPS_PEOPLE'; reason: string }[];
  fallbackRole: { title: string; family: 'ANALYTIC' | 'CLIENT' | 'BUILD' | 'OPS_PEOPLE'; typeLabel: string };
  rubric: {
    technical: number;
    case: number;
    behavioural: number;
    gd: number;
    actions: { format: string; action: string }[];
    placementNote?: string;
  };
  evidenceCount: number;
  skillsToBuild: string[];
  salaryGuidance: string;
  primaryArchetype: ArchetypeDef;
  secondaryArchetype?: ArchetypeDef;
  isBlend: boolean;
  confidenceLabel: 'High confidence' | 'Medium confidence' | 'Lower confidence';
  profile: typeof SPECIALIZATION_PROFILES[string];
  userNote?: string;
}

export function scoreC(specCode: string, answers: Record<string, any>, userNote?: string): ScoreCResult {
  const spec = CATALOG_ITEMS.find((s: CatalogItem) => s.code === specCode) || CATALOG_ITEMS[0];
  let notSureCount = 0;

  // C-Q1 and C-Q3 for family scores (weight 2 each)
  const familyScores: Record<'ANALYTIC' | 'CLIENT' | 'BUILD' | 'OPS_PEOPLE', number> = {
    ANALYTIC: 0,
    CLIENT: 0,
    BUILD: 0,
    OPS_PEOPLE: 0,
  };

  for (const qId of ['C-Q1', 'C-Q3']) {
    const val = answers[qId];
    if (!val || val === 'NOT_SURE') {
      notSureCount++;
      continue;
    }
    const q = TRACK_C_QUESTIONS.find((item) => item.id === qId);
    const opt = q?.options.find((o) => o.id === val);
    const fam = opt?.tags?.[0] as 'ANALYTIC' | 'CLIENT' | 'BUILD' | 'OPS_PEOPLE';
    if (fam && familyScores[fam] !== undefined) {
      familyScores[fam] += 2;
    }
  }

  // Family order with ties resolved by: ANALYTIC, CLIENT, BUILD, OPS_PEOPLE
  const familyTieOrder: ('ANALYTIC' | 'CLIENT' | 'BUILD' | 'OPS_PEOPLE')[] = [
    'ANALYTIC',
    'CLIENT',
    'BUILD',
    'OPS_PEOPLE',
  ];
  const rankedFamilies = [...familyTieOrder].sort((a, b) => {
    if (familyScores[b] !== familyScores[a]) {
      return familyScores[b] - familyScores[a];
    }
    return familyTieOrder.indexOf(a) - familyTieOrder.indexOf(b);
  });

  // Evidence count from C-Q2
  const rawQ2 = answers['C-Q2'];
  let evidenceCount = 0;
  if (Array.isArray(rawQ2)) {
    const valid = rawQ2.filter((id) => id !== 'E' && id !== 'NOT_SURE');
    evidenceCount = Math.min(valid.length, 3);
  }

  // Role titles lookup
  const roleTitles = TRACK_C_ROLE_TITLES[spec.code] || TRACK_C_ROLE_TITLES.GEN;
  const recommendedRoles = rankedFamilies.slice(0, 3).map((fam) => ({
    title: roleTitles[fam],
    family: fam,
    reason: `Aligned with your preference for ${fam.toLowerCase().replace('_', ' ')} daily work.`,
  }));

  // Fallback role
  const fallbackFam = rankedFamilies[3];
  const rawQ5 = answers['C-Q5'] || 'D';
  const isCampus = rawQ5 === 'A' || rawQ5 === 'B'; // CAMPUS_ACTIVE or CAMPUS_SOON
  const rawQ6 = answers['C-Q6'] || 'E';
  const q6 = TRACK_C_QUESTIONS.find((q) => q.id === 'C-Q6');
  const targetTierText = q6?.options.find((o) => o.id === rawQ6)?.text || 'your target company tier';

  const fallbackRole = {
    title: `${roleTitles[fallbackFam]}, plus Management Trainee or generalist roles at ${targetTierText}`,
    family: fallbackFam,
    typeLabel: isCampus ? 'Campus fallback' : 'Off-campus fallback',
  };

  // Rubric: base from C-Q8
  const rawQ8 = answers['C-Q8'] || 'A';
  let baseScore = 1;
  if (rawQ8 === 'B') baseScore = 2; // MOCK_1
  else if (rawQ8 === 'C') baseScore = 3; // MOCK_3
  else if (rawQ8 === 'D') baseScore = 4; // MOCK_5

  // C-Q9 gaps subtract 1 (min 1)
  const rawQ9 = answers['C-Q9'];
  const gaps: string[] = Array.isArray(rawQ9) ? rawQ9 : rawQ9 ? [rawQ9] : [];
  const q9 = TRACK_C_QUESTIONS.find((q) => q.id === 'C-Q9');
  const gapTags: string[] = [];
  for (const g of gaps) {
    const opt = q9?.options.find((o) => o.id === g);
    if (opt?.tags) gapTags.push(...opt.tags);
  }

  let technical = baseScore;
  let caseScore = baseScore;
  let behavioural = baseScore;
  let gd = baseScore;

  if (gapTags.includes('GAP_TECH')) technical -= 1;
  if (gapTags.includes('GAP_CASE')) caseScore -= 1;
  if (gapTags.includes('GAP_BEHAV')) behavioural -= 1;
  if (gapTags.includes('GAP_GD')) gd -= 1;

  if (evidenceCount >= 2) technical += 1;

  // Clamp 1..5
  technical = Math.max(1, Math.min(5, technical));
  caseScore = Math.max(1, Math.min(5, caseScore));
  behavioural = Math.max(1, Math.min(5, behavioural));
  gd = Math.max(1, Math.min(5, gd));

  const rubricActions: { format: string; action: string }[] = [];
  if (technical <= 2) {
    rubricActions.push({
      format: 'Technical or functional',
      action: 'Revise 20 core questions for the role and answer them aloud, timed.',
    });
  }
  if (caseScore <= 2) {
    rubricActions.push({
      format: 'Case or problem-solving',
      action: 'Solve 2 cases a week and explain your structure aloud.',
    });
  }
  if (behavioural <= 2) {
    rubricActions.push({
      format: 'Behavioural',
      action: 'Write 5 stories in situation, action, result form and rehearse them with a friend.',
    });
  }
  if (gd <= 2) {
    rubricActions.push({
      format: 'Group discussion',
      action: 'Join 2 practice discussions a week and aim for 2 structured points each.',
    });
  }

  let placementNote: string | undefined;
  if (rawQ8 === 'A' || rawQ5 === 'D') {
    placementNote = 'Book one mock interview and ask your placement cell how shortlisting works.';
  }

  // Skills to build from C-Q4
  const rawQ4 = answers['C-Q4'] || {};
  const skillsToBuild: string[] = [];
  const skillNames: Record<string, string> = {
    S1: 'Working with data or spreadsheets',
    S2: 'Presenting to a group',
    S3: 'Writing short business documents',
    S4: 'Explaining numbers to non-experts',
    S5: 'Working under tight deadlines',
    S6: 'Using AI tools for work tasks',
  };
  for (const [sKey, rating] of Object.entries(rawQ4)) {
    if (rating === 1 || rating === 2) {
      if (skillNames[sKey]) skillsToBuild.push(skillNames[sKey]);
    }
  }

  // Salary guidance
  const rawQ7 = answers['C-Q7'];
  const prios: string[] = Array.isArray(rawQ7) ? rawQ7 : rawQ7 ? [rawQ7] : [];
  let salaryGuidance =
    "Indicative only. Not a promise. Compare your college's last two placement reports for this role family, plus 3 to 5 current job posts that list pay. Pay varies by city, company tier and your college.";
  if (prios.includes('A')) {
    salaryGuidance += ' You rank pay high, so prioritise roles and employers with published pay bands.';
  }

  // Personality for Track C
  const familyToArch: Record<string, 'AN' | 'PE' | 'BU' | 'OP'> = {
    ANALYTIC: 'AN',
    CLIENT: 'PE',
    BUILD: 'BU',
    OPS_PEOPLE: 'OP',
  };
  const primaryFamArch = familyToArch[rankedFamilies[0]];
  const primaryArch = ARCHETYPES[primaryFamArch];
  const specArch = ARCHETYPES[spec.primaryType as ArchetypeCode];
  const isBlend = primaryFamArch !== spec.primaryType;

  const profile = SPECIALIZATION_PROFILES[spec.code] || SPECIALIZATION_PROFILES.GEN;

  if (notSureCount >= 3) notSureCount = 3;
  const confidenceLabel =
    notSureCount >= 4 ? 'Lower confidence' : notSureCount >= 2 ? 'Medium confidence' : 'High confidence';

  return {
    specialization: spec,
    familyScores,
    rankedFamilies,
    recommendedRoles,
    fallbackRole,
    rubric: {
      technical,
      case: caseScore,
      behavioural,
      gd,
      actions: rubricActions,
      placementNote,
    },
    evidenceCount,
    skillsToBuild,
    salaryGuidance,
    primaryArchetype: primaryArch,
    secondaryArchetype: isBlend ? specArch : undefined,
    isBlend,
    confidenceLabel,
    profile,
    userNote,
  };
}

// ==========================================
// TRACK D: TARGET READY
// ==========================================

export interface DimensionResult {
  dimension: 'ROLE' | 'EVID' | 'TECH' | 'PRACT' | 'NET' | 'POS' | 'AIF';
  name: string;
  score: number;
  status: 'Ready' | 'Close' | 'Gap';
  isPartlyAssessed: boolean;
  isNotAssessed: boolean;
  closingAction: string;
}

export interface ScoreDResult {
  role: string;
  level: 'FRESHER' | 'INTERN' | 'LATERAL';
  overallScore: number;
  overallStatus: 'Interview-ready' | 'Close: targeted prep needed' | 'Not yet: build the foundation first';
  persona: string;
  dimensions: Record<string, DimensionResult>;
  dimensionList: DimensionResult[];
  adaptiveNotes: string[];
  isSprint: boolean;
  roleEnergyArchetype?: ArchetypeDef;
  honestGaps: string[];
  plan: any;
  confidenceLabel: 'High confidence' | 'Medium confidence' | 'Lower confidence';
}

export function scoreD(
  role: string,
  level: 'FRESHER' | 'INTERN' | 'LATERAL',
  answers: Record<string, any>
): ScoreDResult {
  const isPM = role === 'Product Manager';
  const isSC = role === 'Strategy Consultant';
  const isIB = role === 'IB Associate';
  const isGeneric = !isPM && !isSC && !isIB;

  const questions: QuestionItem[] = [...TRACK_D_CORE];
  if (level === 'FRESHER') questions.push(...TRACK_D_LEVEL_BLOCKS.FRESHER);
  else if (level === 'INTERN') questions.push(...TRACK_D_LEVEL_BLOCKS.INTERN);
  else if (level === 'LATERAL') questions.push(...TRACK_D_LEVEL_BLOCKS.LATERAL);

  if (isPM) questions.push(...TRACK_D_ROLE_BLOCKS.PM);
  else if (isSC) questions.push(...TRACK_D_ROLE_BLOCKS.SC);
  else if (isIB) questions.push(...TRACK_D_ROLE_BLOCKS.IB);
  else questions.push(...TRACK_D_ROLE_BLOCKS.GENERIC);

  const dimData: Record<
    string,
    {
      totalWeighted: number;
      totalWeight: number;
      answeredCount: number;
      totalScoredQuestions: number;
      notSureCount: number;
    }
  > = {
    ROLE: { totalWeighted: 0, totalWeight: 0, answeredCount: 0, totalScoredQuestions: 0, notSureCount: 0 },
    EVID: { totalWeighted: 0, totalWeight: 0, answeredCount: 0, totalScoredQuestions: 0, notSureCount: 0 },
    TECH: { totalWeighted: 0, totalWeight: 0, answeredCount: 0, totalScoredQuestions: 0, notSureCount: 0 },
    PRACT: { totalWeighted: 0, totalWeight: 0, answeredCount: 0, totalScoredQuestions: 0, notSureCount: 0 },
    NET: { totalWeighted: 0, totalWeight: 0, answeredCount: 0, totalScoredQuestions: 0, notSureCount: 0 },
    POS: { totalWeighted: 0, totalWeight: 0, answeredCount: 0, totalScoredQuestions: 0, notSureCount: 0 },
    AIF: { totalWeighted: 0, totalWeight: 0, answeredCount: 0, totalScoredQuestions: 0, notSureCount: 0 },
  };

  let totalNotSure = 0;

  for (const q of questions) {
    if (!q.dimension || q.weight <= 0) continue;
    const dim = q.dimension;
    dimData[dim].totalScoredQuestions++;

    const val = answers[q.id];
    let cal = 1.0;
    if (level === 'FRESHER' && (dim === 'ROLE' || dim === 'EVID')) cal = 1.5;
    else if ((level === 'INTERN' || level === 'LATERAL') && dim === 'EVID') cal = 1.5;

    const wCal = q.weight * cal;

    if (!val || val === 'NOT_SURE') {
      totalNotSure++;
      dimData[dim].notSureCount++;
      if (q.isKnowledgeCheck) {
        // Knowledge check: "Not sure" scores as LOW (30)
        dimData[dim].totalWeighted += 30 * wCal;
        dimData[dim].totalWeight += wCal;
        dimData[dim].answeredCount++;
      }
      continue;
    }

    const opt = q.options.find((o) => o.id === val);
    if (opt && opt.points !== undefined) {
      dimData[dim].totalWeighted += opt.points * wCal;
      dimData[dim].totalWeight += wCal;
      dimData[dim].answeredCount++;
    }
  }

  // Dimension results
  const dimensionNames: Record<string, string> = {
    ROLE: 'Role understanding',
    EVID: 'Role evidence & projects',
    TECH: 'Technical & case readiness',
    PRACT: 'Interview practice',
    NET: 'Network connection',
    POS: 'Resume & positioning',
    AIF: 'AI fluency & verification',
  };

  const actionLibrary: Record<string, string> = {
    ROLE: 'Read 3 real job descriptions and list the 5 most repeated tasks; talk to 1 person in the role; write a one-page "a week in this role" note.',
    EVID: isPM
      ? 'Write a mini product requirement document for an app you use.'
      : isSC
      ? 'Solve and write up one full case.'
      : isIB
      ? 'Build a simple DCF and comparables sheet for a listed company.'
      : 'Complete one work sample for the role.',
    TECH: isPM
      ? '3 product-sense drills and 2 metrics drills a week.'
      : isSC
      ? '3 cases a week plus 15 minutes of daily mental math.'
      : isIB
      ? '4 accounting and valuation sessions a week plus one deal summary a week.'
      : "We can't test role-specific technical knowledge for this role. Ask a mentor or alumnus to run a technical check.",
    PRACT: '1 mock interview a week (Foundation), 2 a week (Practice and Apply); record, review, log one fix per mock.',
    NET: 'Send 5 outreach messages a week; book 2 calls a week; ask each person for one referral or next contact.',
    POS: 'Tailor resume with 3 quantified bullets; write a 60-second pitch; write a "why this role, why now" story.',
    AIF: 'Use an AI tool on one real task a week and write down what you checked and what it got wrong; build one small piece using AI and explain verification.',
  };

  const dimensions: Record<string, DimensionResult> = {};
  const dimensionList: DimensionResult[] = [];
  const honestGaps: string[] = [];

  for (const [dKey, dVal] of Object.entries(dimData)) {
    const isNotAssessed = (isGeneric && dKey === 'TECH') || dVal.answeredCount === 0;
    const isPartlyAssessed = !isNotAssessed && dVal.notSureCount > 0;
    const score = isNotAssessed ? 0 : Math.round(dVal.totalWeighted / dVal.totalWeight);

    let status: 'Ready' | 'Close' | 'Gap' = 'Gap';
    if (score >= 70) status = 'Ready';
    else if (score >= 50) status = 'Close';

    if (!isNotAssessed && status !== 'Ready') {
      honestGaps.push(`${dimensionNames[dKey]} (${status}: ${score}/100)`);
    }

    const dRes: DimensionResult = {
      dimension: dKey as any,
      name: dimensionNames[dKey],
      score,
      status,
      isPartlyAssessed,
      isNotAssessed,
      closingAction: actionLibrary[dKey],
    };
    dimensions[dKey] = dRes;
    dimensionList.push(dRes);
  }

  // Overall Score Calculation with normalized weights
  const defaultWeights: Record<string, Record<string, number>> = {
    FRESHER: { ROLE: 18, EVID: 18, TECH: 18, PRACT: 14, NET: 8, POS: 14, AIF: 10 },
    INTERN: { ROLE: 10, EVID: 24, TECH: 18, PRACT: 14, NET: 8, POS: 16, AIF: 10 },
    LATERAL: { ROLE: 8, EVID: 28, TECH: 18, PRACT: 14, NET: 8, POS: 14, AIF: 10 },
  };

  const levelWeights = defaultWeights[level];
  let assessedWeightSum = 0;
  let weightedScoreSum = 0;

  for (const [dKey, w] of Object.entries(levelWeights)) {
    if (!dimensions[dKey].isNotAssessed) {
      assessedWeightSum += w;
      weightedScoreSum += dimensions[dKey].score * w;
    }
  }

  const overallScore = assessedWeightSum > 0 ? Math.round(weightedScoreSum / assessedWeightSum) : 0;

  let overallStatus: ScoreDResult['overallStatus'] = 'Not yet: build the foundation first';
  let persona = 'The Underdog in Training: not there yet, and that\'s fine. This plan builds the foundation.';
  if (overallScore >= 70) {
    overallStatus = 'Interview-ready';
    persona = 'The Prepared Pro: you have done the work, now sharpen and apply.';
  } else if (overallScore >= 50) {
    overallStatus = 'Close: targeted prep needed';
    persona = 'The Contender: close, and a focused few weeks changes the outcome.';
  }

  // Adaptive notes
  const adaptiveNotes: string[] = [];
  const c1Ans = answers['D-C1'];
  if (c1Ans === 'C') {
    const ad1Ans = answers['D-AD1'];
    if (ad1Ans === 'C') {
      adaptiveNotes.push(
        'Consider the Specialization or Role Shortlist tracks to compare other roles before investing 90 days.'
      );
    }
  }

  const c2Ans = answers['D-C2'];
  if (c2Ans === 'D') {
    const ad2Ans = answers['D-AD2'];
    if (ad2Ans === 'B') {
      adaptiveNotes.push('Plan includes 3 targeted project ideas to build your role proof.');
    } else if (ad2Ans === 'C') {
      adaptiveNotes.push('Evidence gap noted: the prep plan will require approximately 5 hours per week.');
    }
  }

  if (level === 'LATERAL') {
    const l3Ans = answers['D-L3'];
    if (l3Ans === 'C' || l3Ans === 'D') {
      const ad3Ans = answers['D-AD3'];
      if (ad3Ans === 'B' || ad3Ans === 'C') {
        adaptiveNotes.push('Re-check your motivation before you start applying.');
      }
    }
  }

  // Urgency & Sprint mode
  const isSprint = answers['D-C7'] === 'A'; // Under 4 weeks

  // Role energy archetype
  const roleToArch: Record<string, string> = {
    'Product Manager': 'BU',
    'Strategy Consultant': 'ST',
    'IB Associate': 'AN',
    'Financial Analyst': 'AN',
    'Marketing or Brand Manager': 'PE',
    'Digital Marketing Manager': 'PE',
    'Business or Data Analyst': 'AN',
    'HR or Talent Acquisition': 'CO',
    'Operations or Supply Chain Manager': 'OP',
    'Sales or Business Development Manager': 'PE',
    'Management Trainee (General)': 'ST',
  };
  const roleArchCode = roleToArch[role];
  const roleEnergyArchetype = roleArchCode ? ARCHETYPES[roleArchCode as ArchetypeCode] : undefined;

  // Build 90-day plan
  const plan = buildPlan(role, level, dimensionList, answers, isSprint);

  let confidenceLabel: 'High confidence' | 'Medium confidence' | 'Lower confidence' = 'High confidence';
  if (totalNotSure >= 4) confidenceLabel = 'Lower confidence';
  else if (totalNotSure >= 2) confidenceLabel = 'Medium confidence';

  return {
    role,
    level,
    overallScore,
    overallStatus,
    persona,
    dimensions,
    dimensionList,
    adaptiveNotes,
    isSprint,
    roleEnergyArchetype,
    honestGaps,
    plan,
    confidenceLabel,
  };
}

// ==========================================
// 90-DAY PLAN BUILDER
// ==========================================

export interface WeekPlan {
  week: number;
  phase: string;
  focus: string;
  output: string;
  completed: boolean;
}

export function buildPlan(
  role: string,
  level: 'FRESHER' | 'INTERN' | 'LATERAL',
  dimensionList: DimensionResult[],
  answers: Record<string, any>,
  isSprint: boolean
) {
  // Sort assessed dimensions by score ascending to identify top gap areas
  const sortedAssessed = [...dimensionList]
    .filter((d) => !d.isNotAssessed)
    .sort((a, b) => a.score - b.score);

  const dimLabels: Record<string, string> = {
    ROLE: 'Role Understanding & Workday Realities',
    EVID: 'Portfolio Deliverables & Project Evidence',
    TECH: 'Technical & Case Problem Solving',
    PRACT: 'Live Mock Interviews & Behavioral Delivery',
    NET: 'Alumni Outreach & Mentorship Conversations',
    POS: 'Resume Polish & Executive Positioning',
    AIF: 'AI Tool Fluency & Output Verification',
  };

  const dim1Key = sortedAssessed[0]?.dimension || 'ROLE';
  const dim2Key = sortedAssessed[1]?.dimension || 'EVID';
  const dim3Key = sortedAssessed[2]?.dimension || 'PRACT';

  const gapDim1 = dimLabels[dim1Key] || 'Foundational Competency';
  const gapDim2 = dimLabels[dim2Key] || 'Applied Evidence';
  const gapDim3 = dimLabels[dim3Key] || 'Interview Execution';

  const mult = isSprint ? 1.5 : 1.0;
  const appTarget = Math.ceil((level === 'FRESHER' ? 8 : level === 'INTERN' ? 5 : 6) * mult);
  const mockTarget = Math.ceil(2 * mult);

  const roleLower = role.toLowerCase();
  const isPM = roleLower.includes('product');
  const isSC = roleLower.includes('consult');
  const isIB = roleLower.includes('bank') || roleLower.includes('invest') || roleLower.includes('finance') || roleLower.includes('fin');
  const isOps = roleLower.includes('operat') || roleLower.includes('supply') || roleLower.includes('logist');
  const isMkt = roleLower.includes('market') || roleLower.includes('brand') || roleLower.includes('growth');

  const p1Name = isSprint ? 'Phase 1: Accelerated Foundations (Sprint)' : 'Phase 1: Foundations & Analytical Groundwork (Weeks 1–4)';
  const p2Name = isSprint ? 'Phase 2: High-Intensity Mock Drills (Sprint)' : 'Phase 2: Deliverables & Interview Mocks (Weeks 5–8)';
  const p3Name = isSprint ? 'Phase 3: Targeted Applications & Superday (Sprint)' : 'Phase 3: Targeted Outreach & Superday Readiness (Weeks 9–12)';

  let curriculum: Array<{ focus: string; output: string }> = [];

  if (isPM) {
    curriculum = [
      // Phase 1: Foundations
      {
        focus: 'Product Sense & Competitor Teardown',
        output: '1 written teardown deck of a marquee app (e.g., Swiggy, Uber, or Notion) analyzing UX frictions and monetization levers',
      },
      {
        focus: 'User Personas, Problem Scoping & PRD Drafting',
        output: 'Drafted complete 2-page Product Requirement Document (PRD) with user stories, edge cases, and acceptance criteria',
      },
      {
        focus: 'Metrics Hierarchy, North Star & Prioritization (RICE)',
        output: 'Built an end-to-end metrics tree (North Star, L1, L2) and prioritized a 6-feature backlog using the RICE framework',
      },
      {
        focus: 'Technical Literacy, System Architecture & Engineering Trade-offs',
        output: 'System flow diagram mapping client-server interaction, API payload boundaries, and database query considerations',
      },
      // Phase 2: Deliverables & Mocks
      {
        focus: 'CIRCLES Framework & Product Design Mock Drills',
        output: `Conducted ${mockTarget} recorded peer mock interviews on classic 'Design X for Y' prompts under strict 30-min caps`,
      },
      {
        focus: 'Root Cause Analysis (RCA) & Funnel Diagnostics',
        output: 'Solved 3 diagnostic RCA cases (e.g. cart checkout drop-off or DAU decline) using MECE hypothesis trees',
      },
      {
        focus: 'Product Strategy, Go-to-Market (GTM) & Monetization Models',
        output: 'Structured GTM launch plan analyzing pricing tiers, distribution channels, and competitive defensive moats',
      },
      {
        focus: 'Senior PM Behavioral Drills & Cross-Functional Conflict',
        output: 'Polished 5 STAR-format stories on roadmap trade-offs, engineering disagreements, and stakeholder alignment',
      },
      // Phase 3: Applications & Superday
      {
        focus: `Quantified PM Resume Alignment & Launch (${appTarget} applications)`,
        output: `Submitted ${appTarget} tailored applications with live portfolio links to your PRD and Figma wireframe samples`,
      },
      {
        focus: 'Alumni Coffee Chats & Product Leadership Networking',
        output: 'Conducted 4 informational calls with senior product managers; secured 2 direct internal employee referrals',
      },
      {
        focus: 'High-Intensity Speed Drills & Whiteboard Problem Solving',
        output: 'Completed 3 timed pressure drills handling ambiguous requirements, rapid metric changes, and unexpected curveballs',
      },
      {
        focus: 'Superday Final Rehearsal, Offer Evaluation & 30-60-90 Plan',
        output: 'Finalized personal 30-60-90 day product execution plan and curated high-conviction questions for hiring partners',
      },
    ];
  } else if (isSC) {
    curriculum = [
      // Phase 1: Foundations
      {
        focus: 'MECE Structuring & Hypothesis-Driven Issue Trees',
        output: 'Deconstructed 4 complex business scenarios into mutually exclusive, collectively exhaustive issue trees',
      },
      {
        focus: 'Mental Math, Market Sizing & Sanity-Check Estimations',
        output: 'Completed 20 timed market-sizing drills with documented mental math shortcuts and error sanity-checks',
      },
      {
        focus: 'Pyramid Principle & Executive Board Storyboard Decks',
        output: 'Authored a 5-slide executive board presentation synthesizing complex quantitative findings into actionable recommendations',
      },
      {
        focus: 'Value Chain Economics, Unit Economics & Margin Diagnostics',
        output: 'Solved 2 comprehensive operational cost-reduction cases modeling benchmark margin improvements and cost takeouts',
      },
      // Phase 2: Deliverables & Mocks
      {
        focus: 'Market Entry & Corporate Growth Strategy Live Cases',
        output: `Conducted ${mockTarget} live case drills on market entry and revenue expansion with timed chart synthesis`,
      },
      {
        focus: 'M&A, Synergies & Due Diligence Case Drills',
        output: 'Evaluated 2 cross-border acquisition targets calculating pre-merger synergies, deal risks, and post-merger integration',
      },
      {
        focus: 'Senior Engagement Manager Pressure Mock Drills',
        output: 'Recorded 2 pressure mocks defending strategic trade-offs under aggressive partner counter-arguments and pushback',
      },
      {
        focus: 'Personal Experience Interview (PEI) & Leadership Stories',
        output: 'Polished 6 PEI stories demonstrating entrepreneurial drive, inclusive team leadership, and crisis management',
      },
      // Phase 3: Applications & Superday
      {
        focus: `MBB-Calibrated Resume Calibration & Launch (${appTarget} applications)`,
        output: `Submitted ${appTarget} applications with audited quantitative impact bullets and zero formatting flaws`,
      },
      {
        focus: 'Consulting Prep Pod Inter-Campus Practice',
        output: 'Completed 4 cross-peer mock cases covering unfamiliar sectors (healthcare, aerospace, commodities)',
      },
      {
        focus: 'Endurance Drills & Full-Length Superday Simulation',
        output: 'Simulated a 3-case marathon day to build cognitive stamina and maintain crisp structure under interview fatigue',
      },
      {
        focus: 'Partner Rehearsal, Firm Culture Fit & Final Playbook Review',
        output: 'Reviewed personal case playbook and prepared high-conviction conversational questions for consulting partners',
      },
    ];
  } else if (isIB) {
    curriculum = [
      // Phase 1: Foundations
      {
        focus: '3-Statement Accounting Dynamics & Working Capital Walkthroughs',
        output: 'Built fully linked 3-statement financial model in Excel with dynamic debt schedules and circularity switches',
      },
      {
        focus: 'DCF Valuation, WACC Derivation & Sensitivity Tables',
        output: 'Completed DCF valuation model with Unlevered Free Cash Flow projections and football field valuation output',
      },
      {
        focus: 'Trading Comparables & Precedent Transactions Multiples',
        output: 'Built peer comparison sheet tracking EV/EBITDA, P/E multiples, and historical acquisition deal premiums',
      },
      {
        focus: 'LBO Mechanics, Debt Tranches & Accretion/Dilution Modeling',
        output: 'Drafted 1-page paper LBO model calculating sponsor IRR and MoIC across varied debt and exit multiple scenarios',
      },
      // Phase 2: Deliverables & Mocks
      {
        focus: '400 Technical IB Questions Rapid-Fire Drilling',
        output: 'Drilled 100+ technical accounting, valuation, and M&A questions to reach 95%+ rapid-fire accuracy',
      },
      {
        focus: 'Recent Marquee M&A Deal Deconstruction & Pitch',
        output: 'Crafted a 3-page CIM summary and investment pitch for a high-profile recent corporate transaction',
      },
      {
        focus: 'VP/Director Technical Simulation & Deal Stress-Testing',
        output: `Completed ${mockTarget} rigorous mock rounds defending valuation assumptions and transaction rationale`,
      },
      {
        focus: 'Macro Trends, Capital Markets & "Why Investment Banking?"',
        output: 'Perfected personal narrative linking academic and past work accomplishments to intense deal stamina',
      },
      // Phase 3: Applications & Superday
      {
        focus: `Investment Banking Resume Alignment (${appTarget} applications)`,
        output: `Submitted ${appTarget} applications customized to bulge-bracket, elite boutique, and middle-market banks`,
      },
      {
        focus: 'Alumni Networking & Front-Office Informational Calls',
        output: 'Conducted 5 informational calls with current analysts and associates to secure internal referrals',
      },
      {
        focus: 'Timed 60-Minute Blank-Sheet Modeling Test Under Pressure',
        output: 'Successfully built complete 3-statement model from blank sheet within strict 60-minute time cap',
      },
      {
        focus: 'Superday Final Readiness & Deal Knowledge Rehearsal',
        output: 'Mastered 3 personal deal stories and finalized mental arithmetic for rapid enterprise value calculations',
      },
    ];
  } else if (isOps) {
    curriculum = [
      // Phase 1: Foundations
      {
        focus: 'Supply Chain & Process Mapping Diagnostics',
        output: 'Mapped end-to-end fulfillment flow identifying throughput bottlenecks and cycle time constraints',
      },
      {
        focus: 'Lean Six Sigma, DMAIC & Root Cause Problem Solving',
        output: 'Completed 5-Why and Ishikawa fishbone diagram on a real manufacturing or logistics defect scenario',
      },
      {
        focus: 'Inventory Optimization & Working Capital Models',
        output: 'Built dynamic EOQ and safety stock simulation model calculating holding vs. stockout penalty trade-offs',
      },
      {
        focus: 'Vendor Management, Procurement & SLA Architecture',
        output: 'Drafted vendor scorecard and RFP negotiation strategy with cost-saving contract milestones',
      },
      // Phase 2: Deliverables & Mocks
      {
        focus: 'Operations Case Studies & Capacity Planning Drills',
        output: `Conducted ${mockTarget} mock case sessions on warehouse footprint optimization and bottleneck resolution`,
      },
      {
        focus: 'Cost-to-Serve Modeling & Logistics Network Design',
        output: 'Modeled freight route optimization comparing 3PL vs. dedicated fleet operational economics',
      },
      {
        focus: 'Cross-Functional Plant Floor Escalation Simulation',
        output: 'Solved 2 real-time plant escalation cases with clear crisis containment and corrective action plans',
      },
      {
        focus: 'Behavioral Leadership & Operations Management Stories',
        output: 'Crafted 5 STAR stories on shift management, safety culture enforcement, and measurable cost reductions',
      },
      // Phase 3: Applications & Superday
      {
        focus: `Targeted Operations Resume Calibration (${appTarget} applications)`,
        output: `Submitted ${appTarget} applications highlighting verified throughput gains, yield improvements, and cost savings`,
      },
      {
        focus: 'Operations Alumni Outreach & Plant Director Discussions',
        output: 'Conducted 4 informational chats with operations leaders and plant directors to uncover unlisted opportunities',
      },
      {
        focus: 'Timed Operational Crisis Drills Under Pressure',
        output: 'Completed 3 rapid-response operational scenario drills under tight decision constraints and supply disruptions',
      },
      {
        focus: 'Superday Readiness & Day-1 Operations Playbook',
        output: 'Finalized personal 30-60-90 day floor-readiness blueprint and plant onboarding goals',
      },
    ];
  } else if (isMkt) {
    curriculum = [
      // Phase 1: Foundations
      {
        focus: 'Customer Journey Mapping & Brand Positioning Diagnostic',
        output: 'Created comprehensive customer persona and journey funnel mapping stages from awareness to brand advocacy',
      },
      {
        focus: 'Consumer Insights, Quantitative Surveying & Cohort Segmentation',
        output: 'Synthesized survey data into 3 distinct buyer cohorts with validated unmet pain points',
      },
      {
        focus: 'Omnichannel Media Mix, CAC/LTV & Campaign Economics',
        output: 'Built campaign ROI model detailing channel attribution, blended CAC, and customer lifetime value',
      },
      {
        focus: 'Creative Brief Writing & Brand Architecture',
        output: 'Drafted end-to-end creative brief for a multi-channel product relaunch campaign across digital and retail',
      },
      // Phase 2: Deliverables & Mocks
      {
        focus: 'Brand Management Case Studies & Growth Strategies',
        output: `Conducted ${mockTarget} mock case interviews on brand revitalization and market share recovery`,
      },
      {
        focus: 'Digital Performance Marketing & Funnel Optimization Drills',
        output: 'Diagnosed a live ad campaign finding creative fatigue and modeling a 25% ROAS improvement',
      },
      {
        focus: 'Product Packaging, Pricing Strategy & Trade Marketing',
        output: 'Developed competitive shelf-placement and pricing strategy for modern trade and quick-commerce channels',
      },
      {
        focus: 'Marketing Leadership & Cross-Functional Agency Management',
        output: 'Crafted 5 STAR stories on agency management, creative debate resolution, and campaign KPI accountability',
      },
      // Phase 3: Applications & Superday
      {
        focus: `Brand & Marketing Resume Calibration (${appTarget} applications)`,
        output: `Submitted ${appTarget} applications with verified marketing campaign portfolio samples and quantified conversion gains`,
      },
      {
        focus: 'Alumni Brand Manager Coffee Chats & Networking',
        output: 'Conducted 4 informational coffee chats with senior brand managers at top FMCG and consumer tech firms',
      },
      {
        focus: 'Rapid Brand Crisis & PR Response Drills',
        output: 'Completed 3 timed simulations handling unexpected brand PR crises and viral social backlash',
      },
      {
        focus: 'Marketing Superday Readiness & 90-Day Brand Growth Plan',
        output: 'Finalized 30-60-90 day brand launch plan and compiled campaign portfolio presentation deck',
      },
    ];
  } else {
    // Dynamic Role Engine tailored to any chosen MBA role using lowest assessed gap dimensions
    curriculum = [
      // Phase 1: Foundations
      {
        focus: `Industry Landscape & Competency Diagnostic for ${role}`,
        output: `Audited 5 marquee job descriptions for ${role} and cataloged core industry benchmark expectations`,
      },
      {
        focus: `Closing Foundational Knowledge: Deep-Dive into ${gapDim1}`,
        output: `Completed a comprehensive structured study addressing primary domain gaps in ${gapDim1}`,
      },
      {
        focus: `Methodology & Framework Mastery: ${gapDim2}`,
        output: `Synthesized 3 industry-standard frameworks used daily by practicing ${role} leaders`,
      },
      {
        focus: `Hands-On Artifact & Proof of Competency Creation for ${role}`,
        output: `Built an authentic work sample or case analysis directly relevant to the ${role} domain`,
      },
      // Phase 2: Deliverables & Mocks
      {
        focus: `Structured Case & Scenario Problem Solving in ${role}`,
        output: `Solved 3 real-world business scenarios simulating day-to-day decisions and trade-offs in ${role}`,
      },
      {
        focus: `Technical & Functional Q&A Rapid Drilling`,
        output: `Completed 50+ domain-specific technical questions testing depth in ${role} principles`,
      },
      {
        focus: `Peer & Mentor Mock Interview Rounds (${gapDim3})`,
        output: `Conducted ${mockTarget} recorded mock interview drills focusing on ${gapDim3} and strategic articulation`,
      },
      {
        focus: `Executive Presence, Behavioral Stories & Value Proposition`,
        output: 'Crafted 5 STAR-format stories highlighting leadership, problem solving, and quantified business impact',
      },
      // Phase 3: Applications & Superday
      {
        focus: `Resume Calibration & Campaign Kickoff (${appTarget} applications)`,
        output: `Submitted ${appTarget} tailored applications showcasing verified deliverables and domain competencies`,
      },
      {
        focus: `Alumni & Industry Leader Outreach for ${role}`,
        output: `Held 4 informational discussions with practitioners in ${role} to secure referral recommendations`,
      },
      {
        focus: 'Speed Execution, Stress-Testing & Curveball Drills',
        output: 'Completed 3 timed pressure drills handling ambiguous requirements and cross-functional friction',
      },
      {
        focus: `Superday Placement Final Rehearsal & 30-60-90 Day Plan for ${role}`,
        output: 'Drafted a comprehensive 30-60-90 day onboarding blueprint demonstrating instant Day-1 value',
      },
    ];
  }

  const weeks: WeekPlan[] = [];

  for (let w = 1; w <= 12; w++) {
    const item = curriculum[w - 1] || {
      focus: `Week ${w} Milestone Execution for ${role}`,
      output: `Completed weekly structured deliverable for ${role}`,
    };

    let phase = p1Name;
    if (w > 4 && w <= 8) {
      phase = p2Name;
    } else if (w > 8) {
      phase = p3Name;
    }

    weeks.push({
      week: w,
      phase,
      focus: item.focus,
      output: item.output,
      completed: false,
    });
  }

  return {
    isSprint,
    weeks,
  };
}

// Attach engine to window for acceptance tests (#selftest)
if (typeof window !== 'undefined') {
  (window as any).Compass = {
    engine: {
      scoreA,
      scoreB,
      scoreC,
      scoreD,
      buildPlan,
    },
  };
}
