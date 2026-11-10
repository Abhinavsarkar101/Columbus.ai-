import {
  ARCHETYPE_PROFILES,
  ArchetypeProfile,
  SPECIALIZATION_NAMES,
  TRACK_1_APPEARANCE_ORDER,
  TRACK_1_QUESTIONS,
  TRACK_2_QUESTIONS,
  Track1ArchetypeCode,
} from '../data/diagnosticData';

export interface Track1Result {
  topArchetype: ArchetypeProfile;
  secondArchetype: ArchetypeProfile;
  thirdArchetype: ArchetypeProfile;
  scores: Record<Track1ArchetypeCode, number>;
  primarySpecialization: string;
  primaryReason: string;
  alternativeSpecialization: string;
  alternativeReason: string;
  stretchSpecialization: string;
  stretchReason: string;
  risk: string;
  nextStep: string;
  readinessTag?: string;
  readinessNotice?: {
    type: 'info' | 'confidence';
    title: string;
    message: string;
  };
}

export function calculateTrack1Results(answers: Record<number, string>): Track1Result {
  const scores: Record<Track1ArchetypeCode, number> = {
    AN: 0,
    ST: 0,
    BU: 0,
    PE: 0,
    CO: 0,
    OP: 0,
  };

  const chosenAnswerSummariesByArchetype: Record<Track1ArchetypeCode, string[]> = {
    AN: [],
    ST: [],
    BU: [],
    PE: [],
    CO: [],
    OP: [],
  };

  let q10Readiness: string | undefined;

  // Process answers
  TRACK_1_QUESTIONS.forEach((q) => {
    const chosenOptId = answers[q.id];
    if (!chosenOptId) return;

    const opt = q.options.find((o) => o.id === chosenOptId);
    if (!opt) return;

    if (q.id === 10) {
      q10Readiness = opt.readinessTag;
      return;
    }

    if (opt.archetypeTag) {
      scores[opt.archetypeTag] += q.weight;
      chosenAnswerSummariesByArchetype[opt.archetypeTag].push(opt.shortAnswerSummary);
    }
  });

  // Sort archetypes: highest score first; ties broken by appearance order in question list
  const sortedCodes = ([...TRACK_1_APPEARANCE_ORDER] as Track1ArchetypeCode[]).sort((a, b) => {
    if (scores[b] !== scores[a]) {
      return scores[b] - scores[a];
    }
    return TRACK_1_APPEARANCE_ORDER.indexOf(a) - TRACK_1_APPEARANCE_ORDER.indexOf(b);
  });

  const topCode = sortedCodes[0];
  const secondCode = sortedCodes[1];
  const thirdCode = sortedCodes[2];

  const topProfile = ARCHETYPE_PROFILES[topCode];
  const secondProfile = ARCHETYPE_PROFILES[secondCode];
  const thirdProfile = ARCHETYPE_PROFILES[thirdCode];

  // Result Specializations:
  // Primary = first specialization of top archetype
  const primarySpecialization = topProfile.specializations[0];

  // Alternative = first specialization of second-highest archetype
  const alternativeSpecialization = secondProfile.specializations[0];

  // Stretch = second specialization of top archetype (or first of 3rd if top only has one)
  let stretchSpecialization = '';
  if (topProfile.specializations.length >= 2) {
    stretchSpecialization = topProfile.specializations[1];
  } else {
    stretchSpecialization = thirdProfile.specializations[0];
  }

  // Generate crisp 1-line reasons naming 2 or 3 answers that drove it
  const formatAnswersSummary = (summaries: string[]): string => {
    if (summaries.length === 0) return 'Aligned with your core decision-making preferences.';
    const picked = summaries.slice(0, 3);
    if (picked.length === 1) {
      return `Driven by your choice on ${picked[0]}.`;
    }
    if (picked.length === 2) {
      return `Driven by your choices on ${picked[0]} and ${picked[1]}.`;
    }
    return `Driven by your choices on ${picked[0]}, ${picked[1]}, and ${picked[2]}.`;
  };

  const primaryReason = formatAnswersSummary(chosenAnswerSummariesByArchetype[topCode]);
  const alternativeReason = formatAnswersSummary(chosenAnswerSummariesByArchetype[secondCode]);

  let stretchReason = '';
  if (topProfile.specializations.length >= 2) {
    stretchReason = `Builds on your ${topProfile.name} profile with additional analytical & market breadth.`;
  } else {
    stretchReason = formatAnswersSummary(chosenAnswerSummariesByArchetype[thirdCode]);
  }

  // Risk from top archetype
  const risk = topProfile.risk;

  // Next step handling based on Q10
  let nextStep = topProfile.defaultNextStep;
  let readinessNotice: Track1Result['readinessNotice'] = undefined;

  if (q10Readiness === 'READY_INFO') {
    nextStep =
      'Suggested Next Step: Book an informational interview with an alumnus in your top two areas (Finance or Analytics), or schedule an exploratory session with your school’s career-services office.';
    readinessNotice = {
      type: 'info',
      title: 'Exploration Recommended Before Committing',
      message:
        'Because you noted you need more information about curriculum options, we recommend booking an informational interview with an alumnus in your top two areas or scheduling a career-services appointment before locking in your electives.',
    };
  } else if (q10Readiness === 'READY_CONF') {
    nextStep =
      'Suggested Next Step: Undertake a small 1-week test project or case study in your primary area before committing, to build confidence and practical familiarity.';
    readinessNotice = {
      type: 'confidence',
      title: 'Confidence Builder: First-Principles Growth',
      message:
        'Remember that MBA programs are specifically structured to teach skills from the ground up—you do not need prior mastery to excel. We suggest completing one small test project in your primary area before committing.',
    };
  }

  return {
    topArchetype: topProfile,
    secondArchetype: secondProfile,
    thirdArchetype: thirdProfile,
    scores,
    primarySpecialization,
    primaryReason,
    alternativeSpecialization,
    alternativeReason,
    stretchSpecialization,
    stretchReason,
    risk,
    nextStep,
    readinessTag: q10Readiness,
    readinessNotice,
  };
}

// ==========================================
// TRACK 2 SCORING & LOGIC
// ==========================================

export interface Track2Result {
  primaryCode: string;
  primaryName: string;
  primaryReason: string;
  secondaryCode: string;
  secondaryName: string;
  secondaryReason: string;
  dualVerdict: {
    title: string;
    body: string;
    status: 'workable' | 'warning' | 'single' | 'exploratory';
  };
  risk: string;
  nextStep: string;
  q9PairQuality?: 'PAIR_STRONG' | 'PAIR_WEAK';
  q10CreditTag?: string;
  chosenPairLabel?: string;
  scores: Record<string, number>;
}

const SPEC_ORDER_TIEBREAK = [
  'FIN',
  'MKT',
  'OPS',
  'ANA',
  'HR',
  'PM',
  'STR',
  'ENT',
  'INT',
  'ESG',
  'HCM',
  'ITM',
];

export function calculateTrack2Results(answers: Record<number, string>): Track2Result {
  const scores: Record<string, number> = {
    FIN: 0,
    MKT: 0,
    HR: 0,
    OPS: 0,
    ANA: 0,
    ENT: 0,
    STR: 0,
    ITM: 0,
    INT: 0,
    HCM: 0,
    ESG: 0,
    PM: 0,
  };

  const answerSummariesBySpec: Record<string, string[]> = {
    FIN: [],
    MKT: [],
    HR: [],
    OPS: [],
    ANA: [],
    ENT: [],
    STR: [],
    ITM: [],
    INT: [],
    HCM: [],
    ESG: [],
    PM: [],
  };

  let q9PairQuality: 'PAIR_STRONG' | 'PAIR_WEAK' | undefined;
  let q10CreditTag: string | undefined;
  let chosenPairLabel = '';

  TRACK_2_QUESTIONS.forEach((q) => {
    const chosenOptId = answers[q.id];
    if (!chosenOptId) return;

    const opt = q.options.find((o) => o.id === chosenOptId);
    if (!opt) return;

    if (q.id === 9) {
      q9PairQuality = opt.pairQuality;
      chosenPairLabel = opt.text;
      // Q9 pair tags add 3 points to each specialization in the chosen pair
      if (opt.specTags) {
        opt.specTags.forEach((code) => {
          scores[code] = (scores[code] || 0) + 3;
          answerSummariesBySpec[code]?.push(opt.shortAnswerSummary);
        });
      }
      return;
    }

    if (q.id === 10) {
      q10CreditTag = opt.creditTag;
      return;
    }

    // Questions 1 - 8: add question weight to each tagged specialization
    if (opt.specTags) {
      opt.specTags.forEach((code) => {
        scores[code] = (scores[code] || 0) + q.weight;
        answerSummariesBySpec[code]?.push(opt.shortAnswerSummary);
      });
    }
  });

  // Sort specializations by score descending, with deterministic tie-breaking
  const sortedCodes = Object.keys(scores).sort((a, b) => {
    if (scores[b] !== scores[a]) {
      return scores[b] - scores[a];
    }
    return SPEC_ORDER_TIEBREAK.indexOf(a) - SPEC_ORDER_TIEBREAK.indexOf(b);
  });

  const primaryCode = sortedCodes[0];
  const secondaryCode = sortedCodes[1];

  const primaryName = SPECIALIZATION_NAMES[primaryCode] || primaryCode;
  const secondaryName = SPECIALIZATION_NAMES[secondaryCode] || secondaryCode;

  // Answers that drove them
  const formatAnswers = (summaries: string[]): string => {
    if (summaries.length === 0) return 'Aligned with your scenario trade-offs.';
    const picked = summaries.slice(0, 3);
    if (picked.length === 1) return `Driven by your answer on ${picked[0]}.`;
    if (picked.length === 2) return `Driven by your answers on ${picked[0]} and ${picked[1]}.`;
    return `Driven by your answers on ${picked[0]}, ${picked[1]}, and ${picked[2]}.`;
  };

  const primaryReason = formatAnswers(answerSummariesBySpec[primaryCode] || []);
  const secondaryReason = formatAnswers(answerSummariesBySpec[secondaryCode] || []);

  // Dual Verdict Logic:
  // - If Q9 is PAIR_STRONG AND Q10 is CREDIT_DUAL_OK:
  //   "Dual specialization looks workable. Confirm the credit count with your school."
  //   Show the pair and say why it complements each other.
  // - If Q9 is PAIR_WEAK:
  //   warn that the pair covers quite different skill sets, and suggest either a single specialization
  //   with a related elective or a pair closer to the top two scores.
  // - If Q10 is CREDIT_SINGLE or CREDIT_SINGLE_TIGHT:
  //   recommend one specialization and suggest a related elective track instead of a second specialization.
  // - If Q10 is READY_LOW:
  //   replace the firm verdict with a next step: a short project in each shortlisted area, an alumni conversation, or a career-services appointment.

  let dualVerdict: Track2Result['dualVerdict'] = {
    title: 'Dual Specialization Strategy',
    body: 'Evaluate the academic workload and recruiting schedule before finalizing your course registration.',
    status: 'workable',
  };

  const getPairSynergyExplanation = (pairText: string): string => {
    if (pairText.includes('Finance') && pairText.includes('Analytics')) {
      return 'Combining Finance with Business Analytics gives you a sharp quantitative advantage: valuation and capital allocation backed by SQL telemetry and predictive modeling.';
    }
    if (pairText.includes('Marketing') && pairText.includes('Entrepreneurship')) {
      return 'Combining Marketing with Entrepreneurship pairs brand storytelling and customer acquisition with rapid 0-to-1 venture execution.';
    }
    if (pairText.includes('Operations') && pairText.includes('Information Systems')) {
      return 'Combining Operations with Information Systems prepares you to lead digital supply chains, ERP transformation, and cloud-enabled process modernization.';
    }
    return `Combining ${primaryName} with ${secondaryName} provides complementary business depth and expands your campus placement shortlist opportunities.`;
  };

  if (q10CreditTag === 'READY_LOW') {
    dualVerdict = {
      title: 'Exploratory Next Step Needed',
      body: 'Before locking in a dual specialization, complete a short 1-week project in each shortlisted area, have an alumni conversation, or schedule an appointment with your campus career services.',
      status: 'exploratory',
    };
  } else if (q9PairQuality === 'PAIR_WEAK') {
    dualVerdict = {
      title: 'Caution: Divergent Skill Sets',
      body: `Warning: ${chosenPairLabel || 'This combination'} covers quite different skill sets and recruiting tracks. We suggest either choosing a single specialization with a related elective, or a pairing closer to your top two evaluated scores (${primaryName} + ${secondaryName}) to avoid splitting interview preparation.`,
      status: 'warning',
    };
  } else if (q10CreditTag === 'CREDIT_SINGLE' || q10CreditTag === 'CREDIT_SINGLE_TIGHT') {
    dualVerdict = {
      title: 'Single Specialization with Focused Electives Recommended',
      body: `Given your remaining course credit limit, we recommend dedicating your primary specialization to ${primaryName}, and choosing 1–2 related electives in ${secondaryName} instead of attempting a formal second specialization.`,
      status: 'single',
    };
  } else if (q9PairQuality === 'PAIR_STRONG' && q10CreditTag === 'CREDIT_DUAL_OK') {
    dualVerdict = {
      title: 'Dual Specialization Looks Workable',
      body: `Dual specialization looks workable. Confirm the credit count with your school. Chosen pair: ${chosenPairLabel || `${primaryName} + ${secondaryName}`}. ${getPairSynergyExplanation(chosenPairLabel)}`,
      status: 'workable',
    };
  } else {
    dualVerdict = {
      title: 'Dual Specialization Strategy',
      body: `Your top evaluated disciplines are ${primaryName} and ${secondaryName}. Verify course scheduling and credit counts with your academic advisor.`,
      status: 'workable',
    };
  }

  const risk =
    'Pursuing two distinct specializations can divide your case preparation time during placement season if companies recruit for specialized vertical skills.';

  let nextStep =
    'Audit your degree audit worksheet with your academic advisor and cross-check course prerequisites for both disciplines.';

  if (q10CreditTag === 'READY_LOW') {
    nextStep =
      'Schedule a 20-minute chat with 2nd-year student club heads in both fields to compare the day-to-day elective project workload.';
  }

  return {
    primaryCode,
    primaryName,
    primaryReason,
    secondaryCode,
    secondaryName,
    secondaryReason,
    dualVerdict,
    risk,
    nextStep,
    q9PairQuality,
    q10CreditTag,
    chosenPairLabel,
    scores,
  };
}
