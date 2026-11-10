import { RoleFamily, SPECIALIZED_ROLE_MAP } from '../data/track2Data';

export interface InterviewRubricItem {
  format: string;
  score: number; // 1 to 5
  isWeak: boolean;
  practiceAction?: string;
}

export interface Track2ReportResult {
  specialization: string;
  primaryRole: {
    title: string;
    family: RoleFamily;
    reason: string;
    campusFallback?: string;
  };
  alternativeRoles: {
    title: string;
    family: RoleFamily;
    reason: string;
    campusFallback?: string;
  }[];
  salaryBand: {
    band: 'Entry Band' | 'Mid Band' | 'Premium Band';
    explanation: string;
    disclaimer: string;
  };
  rubric: InterviewRubricItem[];
  preparationAlerts: string[];
  risk: string;
  nextStep: string;
}

export function calculateTrack2SpecializedReport(
  specialization: string,
  answers: Record<number, any>
): Track2ReportResult {
  const roleFamilyScores: Record<RoleFamily, number> = {
    ANALYTIC: 0,
    CLIENT: 0,
    BUILD: 0,
    OPS_PEOPLE: 0,
  };

  const familyChoiceReasons: Record<RoleFamily, string[]> = {
    ANALYTIC: [],
    CLIENT: [],
    BUILD: [],
    OPS_PEOPLE: [],
  };

  // Q1 (Weight 2)
  const q1Opt = answers[1];
  if (q1Opt === 'ANALYTIC') {
    roleFamilyScores.ANALYTIC += 2;
    familyChoiceReasons.ANALYTIC.push('enjoying data modeling, analysis, and problem-solving (Q1)');
  } else if (q1Opt === 'CLIENT') {
    roleFamilyScores.CLIENT += 2;
    familyChoiceReasons.CLIENT.push('enjoying client and stakeholder persuasion (Q1)');
  } else if (q1Opt === 'BUILD') {
    roleFamilyScores.BUILD += 2;
    familyChoiceReasons.BUILD.push('passion for designing and shipping new initiatives (Q1)');
  } else if (q1Opt === 'OPS_PEOPLE') {
    roleFamilyScores.OPS_PEOPLE += 2;
    familyChoiceReasons.OPS_PEOPLE.push('running systems, operations, and team execution (Q1)');
  }

  // Q3 (Weight 2)
  const q3Opt = answers[3];
  if (q3Opt === 'ANALYTIC') {
    roleFamilyScores.ANALYTIC += 2;
    familyChoiceReasons.ANALYTIC.push('valuing ownership of models and forecasts (Q3)');
  } else if (q3Opt === 'CLIENT') {
    roleFamilyScores.CLIENT += 2;
    familyChoiceReasons.CLIENT.push('valuing key account and relationship management (Q3)');
  } else if (q3Opt === 'BUILD') {
    roleFamilyScores.BUILD += 2;
    familyChoiceReasons.BUILD.push('valuing new product or campaign launches (Q3)');
  } else if (q3Opt === 'OPS_PEOPLE') {
    roleFamilyScores.OPS_PEOPLE += 2;
    familyChoiceReasons.OPS_PEOPLE.push('valuing process and team performance improvements (Q3)');
  }

  // Q2 Evidence (Multi-select)
  // adds +1 to primary role per evidence item selected, capped at +3
  const q2Evidence: string[] = Array.isArray(answers[2]) ? answers[2] : [];
  const validEvidCount = Math.min(3, q2Evidence.filter((e) => e !== 'NO_EVID').length);

  // Rank role families
  const familyTieBreak: RoleFamily[] = ['ANALYTIC', 'CLIENT', 'BUILD', 'OPS_PEOPLE'];
  const rankedFamilies = (Object.keys(roleFamilyScores) as RoleFamily[]).sort((a, b) => {
    if (roleFamilyScores[b] !== roleFamilyScores[a]) {
      return roleFamilyScores[b] - roleFamilyScores[a];
    }
    return familyTieBreak.indexOf(a) - familyTieBreak.indexOf(b);
  });

  const primaryFamily = rankedFamilies[0];
  const secondFamily = rankedFamilies[1];
  const thirdFamily = rankedFamilies[2];

  const specMap = SPECIALIZED_ROLE_MAP[specialization] || SPECIALIZED_ROLE_MAP['Finance'];

  // Q5 Placement status check for campus fallbacks
  const q5CampusStatus = answers[5];
  const isCampusActiveOrSoon =
    q5CampusStatus === 'CAMPUS_ACTIVE' || q5CampusStatus === 'CAMPUS_SOON';

  // Primary Role
  const primaryEvidenceBonus = validEvidCount > 0 ? ` +${validEvidCount} portfolio evidence bonus` : '';
  const primaryAnswersDriven =
    familyChoiceReasons[primaryFamily].length > 0
      ? `Driven by your choices on ${familyChoiceReasons[primaryFamily].join(' and ')}${primaryEvidenceBonus}.`
      : `Aligned with your analytical and functional strengths in ${specialization}.`;

  const primaryRoleTitle = specMap.roles[primaryFamily];
  const primaryFallback = isCampusActiveOrSoon ? specMap.campusFallbacks[primaryFamily] : undefined;

  // Alternative Roles (up to two)
  const alt1Family = secondFamily;
  const alt1AnswersDriven =
    familyChoiceReasons[alt1Family].length > 0
      ? `Driven by your answers on ${familyChoiceReasons[alt1Family].join(' and ')}.`
      : `High transferability matching your secondary orientation in ${alt1Family.toLowerCase().replace('_', ' ')}.`;

  const alt2Family = thirdFamily;
  const alt2AnswersDriven =
    familyChoiceReasons[alt2Family].length > 0
      ? `Driven by your answers on ${familyChoiceReasons[alt2Family].join(' and ')}.`
      : `Alternative placement track expanding recruiter shortlist reach.`;

  const alternativeRoles = [
    {
      title: specMap.roles[alt1Family],
      family: alt1Family,
      reason: alt1AnswersDriven,
      campusFallback: isCampusActiveOrSoon ? specMap.campusFallbacks[alt1Family] : undefined,
    },
    {
      title: specMap.roles[alt2Family],
      family: alt2Family,
      reason: alt2AnswersDriven,
      campusFallback: isCampusActiveOrSoon ? specMap.campusFallbacks[alt2Family] : undefined,
    },
  ];

  // Preparation alerts for Q5 CAMPUS_UNKNOWN or Q8 MOCK_0
  const preparationAlerts: string[] = [];
  if (answers[5] === 'CAMPUS_UNKNOWN') {
    preparationAlerts.push(
      'Placement Office Action: You noted uncertainty regarding your school’s recruitment rules. Schedule an exploratory session with your career services or student placement committee this week to verify registration tiers, resume lock dates, and shortlisting criteria.'
    );
  }
  if (answers[8] === 'MOCK_0') {
    preparationAlerts.push(
      'Interview Readiness Action: You have not yet completed a formal mock interview in this field. Book at least two timed peer mocks within the next 10 days before beginning live recruiter interactions.'
    );
  }

  // Q6 Company Tier & Q7 Salary Priorities -> Qualitative Band
  const q6Tier = answers[6];
  const q7Priorities: string[] = Array.isArray(answers[7]) ? answers[7] : [];

  let salaryBand: Track2ReportResult['salaryBand']['band'] = 'Mid Band';
  if (q6Tier === 'TIER_FIRM' || q6Tier === 'TIER_LARGE') {
    salaryBand = 'Premium Band';
  } else if (q6Tier === 'TIER_STARTUP') {
    salaryBand = 'Mid Band';
  } else if (q6Tier === 'TIER_MID') {
    salaryBand = 'Mid Band';
  }

  if (q7Priorities.includes('Starting salary') && salaryBand !== 'Premium Band') {
    salaryBand = 'Mid Band';
  }

  const salaryExplanation =
    'Compensation packages depend on recruitment channel tier (management consulting & global financial firms vs FMCG vs tech startups), domestic or global office location, previous full-time work experience, and institution placement committee covenants.';

  // Interview preparation rubric based on Q8 & Q9
  // Q8: MOCK_0, MOCK_1, MOCK_3, MOCK_5
  let baseScore = 2;
  if (answers[8] === 'MOCK_0') baseScore = 1;
  else if (answers[8] === 'MOCK_1') baseScore = 2;
  else if (answers[8] === 'MOCK_3') baseScore = 4;
  else if (answers[8] === 'MOCK_5') baseScore = 5;

  const q9Worry = answers[9]; // GAP_CASE, GAP_TECH, GAP_BEHAV, GAP_GD, GAP_NONE

  const rubric: InterviewRubricItem[] = [
    {
      format: 'Case & Problem-Solving Rounds',
      score: q9Worry === 'GAP_CASE' ? Math.max(1, baseScore - 1) : Math.min(5, baseScore + 1),
      isWeak: q9Worry === 'GAP_CASE' || baseScore <= 2,
      practiceAction:
        'Practice 3 market-sizing and profitability drills weekly using a timer and a paper notepad to explain trade-offs clearly.',
    },
    {
      format: 'Technical & Functional Competency',
      score: q9Worry === 'GAP_TECH' ? Math.max(1, baseScore - 1) : baseScore,
      isWeak: q9Worry === 'GAP_TECH' || baseScore <= 2,
      practiceAction:
        `Audit 20 foundational ${specialization} technical interview questions from past campus placement papers and rehearse 2-minute structured answers.`,
    },
    {
      format: 'Behavioral & Leadership Fit ("Tell me about a time...")',
      score: q9Worry === 'GAP_BEHAV' ? Math.max(1, baseScore - 1) : Math.min(5, baseScore + 1),
      isWeak: q9Worry === 'GAP_BEHAV' || baseScore <= 2,
      practiceAction:
        'Write out 5 distinct STAR stories (Situation, Task, Action, Result) covering team conflict, tight deadlines, ethical decisions, and recovery from failure.',
    },
    {
      format: 'Group Discussion & Case Presentations',
      score: q9Worry === 'GAP_GD' ? Math.max(1, baseScore - 1) : baseScore,
      isWeak: q9Worry === 'GAP_GD' || baseScore <= 2,
      practiceAction:
        'Focus on structuring the problem within the first 60 seconds with 2 clear logical dimensions rather than rushing to speak loudly first.',
    },
  ];

  // One risk to consider & one next step
  const risk =
    'Over-focusing on a single dream company in campus placements can leave you vulnerable if that recruiter trims batch hiring quotas. Always advance your campus fallback in parallel.';

  let nextStep =
    `Calibrate your resume with 3 quantified bullet points demonstrating ${primaryFamily.toLowerCase().replace('_', ' ')} business impact in ${specialization}.`;

  if (preparationAlerts.length > 0) {
    nextStep = preparationAlerts[0];
  }

  return {
    specialization,
    primaryRole: {
      title: primaryRoleTitle,
      family: primaryFamily,
      reason: primaryAnswersDriven,
      campusFallback: primaryFallback,
    },
    alternativeRoles,
    salaryBand: {
      band: salaryBand,
      explanation: salaryExplanation,
      disclaimer:
        'Indicative. Verify against current placement reports for your city and company tier.',
    },
    rubric,
    preparationAlerts,
    risk,
    nextStep,
  };
}
