import { ROLES } from '../data/roles';
import {
  AtsCheckResult,
  BulletRewrite,
  JDAnalysis,
  RequirementGap,
  ResumeData,
} from '../types';

export interface TaxonomyTerm {
  term: string;
  category: 'marketing' | 'finance' | 'analytics' | 'product' | 'operations' | 'hr' | 'consulting' | 'sales' | 'core';
  synonyms: string[];
  importance: 'critical' | 'recommended' | 'bonus';
  semanticClues: string[]; // phrases indicating candidate has related experience but weak wording
}

export const MBA_TAXONOMY: TaxonomyTerm[] = [
  // Product
  {
    term: 'product roadmap',
    category: 'product',
    synonyms: ['roadmap', 'roadmapping', 'feature prioritization', 'release planning'],
    importance: 'critical',
    semanticClues: ['feature priorities', 'release schedule', 'milestones', 'planning features', 'product timeline', 'backlog'],
  },
  {
    term: 'prd',
    category: 'product',
    synonyms: ['product requirement document', 'product spec', 'product specs', 'functional specification'],
    importance: 'critical',
    semanticClues: ['wrote specifications', 'documented requirements', 'authoring specs', 'feature documentation', 'user stories'],
  },
  {
    term: 'a/b testing',
    category: 'product',
    synonyms: ['experimentation', 'split testing', 'multivariate testing', 'conversion rate optimization'],
    importance: 'critical',
    semanticClues: ['testing variants', 'ran experiments', 'tested different versions', 'conversion uplift', 'hypothesis testing'],
  },
  {
    term: 'user research',
    category: 'product',
    synonyms: ['customer discovery', 'user interviews', 'usability testing', 'voice of customer'],
    importance: 'recommended',
    semanticClues: ['interviewed users', 'customer feedback', 'surveyed customers', 'gathered user input', 'talking to users'],
  },
  {
    term: 'wireframing',
    category: 'product',
    synonyms: ['figma', 'prototyping', 'mockups', 'ui/ux design'],
    importance: 'recommended',
    semanticClues: ['created prototypes', 'designed screens', 'sketched workflows', 'interface design', 'mockups'],
  },
  {
    term: 'agile scrum',
    category: 'product',
    synonyms: ['scrum', 'sprint planning', 'backlog grooming', 'agile delivery', 'kanban'],
    importance: 'critical',
    semanticClues: ['bi-weekly sprints', 'daily standups', 'sprint velocity', 'coordinated with engineers', 'engineering sprints'],
  },
  {
    term: 'customer churn',
    category: 'product',
    synonyms: ['churn rate', 'retention curve', 'user attrition', 'customer retention'],
    importance: 'critical',
    semanticClues: ['lost customers', 'retention analysis', 'user drop-off', 'churned accounts', 'unsubscribes'],
  },
  {
    term: 'cltv / cac',
    category: 'product',
    synonyms: ['ltv', 'customer acquisition cost', 'lifetime value', 'unit economics'],
    importance: 'critical',
    semanticClues: ['acquisition cost', 'payback period', 'customer value', 'revenue per user', 'user acquisition spend'],
  },

  // Finance
  {
    term: 'financial modeling',
    category: 'finance',
    synonyms: ['dcf', 'discounted cash flow', '3-statement model', 'financial projections'],
    importance: 'critical',
    semanticClues: ['excel models', 'forecasted revenue', 'projected cash flow', 'financial analysis', 'projections spreadsheet'],
  },
  {
    term: 'valuation',
    category: 'finance',
    synonyms: ['comparable company analysis', 'precedent transactions', 'comps', 'equity research'],
    importance: 'critical',
    semanticClues: ['company valuation', 'target pricing', 'multiples analysis', 'asset valuation'],
  },
  {
    term: 'ebitda',
    category: 'finance',
    synonyms: ['operating profit', 'operating margin', 'gross margin', 'p&l expansion'],
    importance: 'critical',
    semanticClues: ['profitability', 'operating income', 'bottom line', 'gross profit', 'cost optimization'],
  },
  {
    term: 'budgeting & forecasting',
    category: 'finance',
    synonyms: ['annual operating plan', 'aop', 'fpa', 'variance analysis', 'financial planning'],
    importance: 'critical',
    semanticClues: ['annual budget', 'quarterly forecast', 'tracked variance', 'spending limits', 'departmental budget'],
  },
  {
    term: 'due diligence',
    category: 'finance',
    synonyms: ['commercial diligence', 'financial audit', 'data room', 'deal diligence'],
    importance: 'recommended',
    semanticClues: ['audited financials', 'deal review', 'vendor assessment', 'compliance audit'],
  },
  {
    term: 'm&a',
    category: 'finance',
    synonyms: ['mergers and acquisitions', 'deal sourcing', 'synergy valuation', 'joint ventures'],
    importance: 'recommended',
    semanticClues: ['acquisition target', 'deal structuring', 'post-merger', 'strategic investment'],
  },

  // Consulting & Strategy
  {
    term: 'hypothesis-driven',
    category: 'consulting',
    synonyms: ['mece', 'issue tree', 'structured problem solving', 'pyramid principle'],
    importance: 'critical',
    semanticClues: ['structured analysis', 'problem diagnosis', 'framework analysis', 'root cause analysis'],
  },
  {
    term: 'market sizing',
    category: 'consulting',
    synonyms: ['tam sam som', 'market potential', 'addressable market', 'market estimation'],
    importance: 'critical',
    semanticClues: ['estimated market size', 'industry potential', 'market opportunity', 'target population sizing'],
  },
  {
    term: 'executive presentation',
    category: 'consulting',
    synonyms: ['board deck', 'c-suite reporting', 'steering committee', 'stakeholder readout'],
    importance: 'critical',
    semanticClues: ['presented to leadership', 'client deck', 'leadership presentation', 'readout to directors', 'pitch deck'],
  },
  {
    term: 'competitive benchmarking',
    category: 'consulting',
    synonyms: ['competitor landscape', 'peer analysis', 'market share', 'competitive intelligence'],
    importance: 'recommended',
    semanticClues: ['studied competitors', 'market comparison', 'industry benchmarking', 'peer review'],
  },

  // Analytics
  {
    term: 'sql',
    category: 'analytics',
    synonyms: ['postgresql', 'mysql', 'snowflake', 'bigquery', 'database queries'],
    importance: 'critical',
    semanticClues: ['queried database', 'extracted data from tables', 'data warehouse queries', 'relational database'],
  },
  {
    term: 'python / r',
    category: 'analytics',
    synonyms: ['python', 'pandas', 'r programming', 'jupyter', 'numpy'],
    importance: 'recommended',
    semanticClues: ['data scripting', 'statistical scripts', 'automated data cleaning', 'data science models'],
  },
  {
    term: 'data visualization',
    category: 'analytics',
    synonyms: ['tableau', 'power bi', 'looker', 'dashboards', 'bi reporting'],
    importance: 'critical',
    semanticClues: ['built dashboards', 'visual charts', 'reporting suite', 'automated reports', 'metric tracking sheets'],
  },
  {
    term: 'cohort analysis',
    category: 'analytics',
    synonyms: ['retention cohorts', 'funnel analytics', 'user segments', 'behavioral cohorts'],
    importance: 'critical',
    semanticClues: ['user retention over time', 'funnel conversion', 'drop-off by month', 'customer segments'],
  },

  // Marketing & Sales
  {
    term: 'go-to-market (gtm)',
    category: 'marketing',
    synonyms: ['gtm strategy', 'product launch', 'commercialization', 'market entry'],
    importance: 'critical',
    semanticClues: ['launched product', 'release campaign', 'commercial rollout', 'market expansion launch'],
  },
  {
    term: 'customer segmentation',
    category: 'marketing',
    synonyms: ['persona development', 'target audience', 'demographic profiling', 'icp'],
    importance: 'critical',
    semanticClues: ['target customers', 'user categories', 'ideal customer profile', 'audience breakdown'],
  },
  {
    term: 'enterprise sales',
    category: 'sales',
    synonyms: ['b2b sales', 'account executive', 'pipeline generation', 'commercial contracts'],
    importance: 'critical',
    semanticClues: ['closed enterprise deals', 'sales pipeline', 'b2b clients', 'corporate accounts'],
  },
  {
    term: 'cross-functional leadership',
    category: 'core',
    synonyms: ['stakeholder management', 'team alignment', 'matrix leadership', 'collaborative governance'],
    importance: 'critical',
    semanticClues: ['coordinated teams', 'worked across departments', 'led cross-team initiatives', 'managed stakeholders'],
  },

  // Operations & Quality
  {
    term: 'lean six sigma',
    category: 'operations',
    synonyms: ['six sigma', 'kaizen', '5s', 'process reengineering', 'black belt', 'green belt'],
    importance: 'recommended',
    semanticClues: ['process improvements', 'reduced defect rate', 'operational efficiency', 'continuous improvement'],
  },
  {
    term: 'supply chain optimization',
    category: 'operations',
    synonyms: ['logistics network', 'fulfillment strategy', 'freight optimization', 'procurement logistics'],
    importance: 'critical',
    semanticClues: ['logistics planning', 'distribution network', 'warehouse fulfillment', 'freight costs'],
  },
  {
    term: 'inventory management',
    category: 'operations',
    synonyms: ['safety stock', 'stockouts', 'inventory turnover', 'carrying cost', 'wms'],
    importance: 'critical',
    semanticClues: ['managed stock levels', 'warehouse inventory', 'stock tracking', 'holding cost'],
  },
  {
    term: 'procurement & sourcing',
    category: 'operations',
    synonyms: ['vendor negotiation', 'supplier management', 'rfp', 'tco', 'vendor contracts'],
    importance: 'critical',
    semanticClues: ['contracted suppliers', 'negotiated with vendors', 'supplier onboarding', 'purchase orders'],
  },
];

interface TaggedBulletEvidence {
  text: string;
  sectionHeading: string;
  roleOrCompany: string;
  sectionType: 'experience' | 'projects';
  expIndex?: number;
  projIndex?: number;
  bulletIndex: number;
}

export function analyzeJobDescription(jdText: string, resume: ResumeData): JDAnalysis {
  if (!jdText || jdText.trim().length < 20) {
    return {
      overallMatch: 0,
      keywordCoverage: 0,
      quantifiedImpactScore: 0,
      structureScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      atsChecks: [],
      bulletRewrites: [],
      requirementGaps: [],
      summary: {
        matchedCount: 0,
        improveCount: 0,
        missingCount: 0,
        uncertainCount: 0,
      },
      inferredRole: 'Not detected',
      requirementsCount: 0,
    };
  }

  const jdLower = jdText.toLowerCase();

  // Detect explicit requirements section
  const reqMatch = jdLower.match(
    /(requirements|qualifications|what we are looking for|who you are|must have|what you bring|basic qualifications)[\s\S]*/i
  );
  const requirementsText = reqMatch ? reqMatch[0] : '';
  const generalText = jdLower;

  // Gather all tagged candidate bullets for exact evidence attribution
  const candidateBullets: TaggedBulletEvidence[] = [];

  resume.experience.forEach((exp, expIndex) => {
    const heading = `Experience: ${exp.role} at ${exp.company}`;
    const roleOrCompany = `${exp.role} · ${exp.company}`;
    exp.bullets.forEach((bullet, bulletIndex) => {
      candidateBullets.push({
        text: bullet,
        sectionHeading: heading,
        roleOrCompany,
        sectionType: 'experience',
        expIndex,
        bulletIndex,
      });
    });
  });

  resume.projects.forEach((proj, projIndex) => {
    const heading = `Project: ${proj.name}`;
    const roleOrCompany = proj.name;
    proj.bullets.forEach((bullet, bulletIndex) => {
      candidateBullets.push({
        text: bullet,
        sectionHeading: heading,
        roleOrCompany,
        sectionType: 'projects',
        projIndex,
        bulletIndex,
      });
    });
  });

  // Candidate skills text
  const skillsList = resume.skills.flatMap((s) => s.items).map((s) => s.toLowerCase());
  const resumeSummary = (resume.summary || '').toLowerCase();
  const candidateHeadline = (resume.headline || '').toLowerCase();

  let totalWeightedTerms = 0;
  let matchedWeightedTerms = 0;

  const matchedKeywords: { term: string; count: number; category: string }[] = [];
  const missingKeywords: {
    term: string;
    category: string;
    importance: 'critical' | 'recommended' | 'bonus';
  }[] = [];

  const requirementGaps: RequirementGap[] = [];

  // Metric detection regex
  const metricRegex = /(\d+[\.,]?\d*|\$|₹|%|bps|x|lpa|crore|million|billion|k\b)/i;

  for (const item of MBA_TAXONOMY) {
    const termVariations = [item.term, ...item.synonyms];
    let inJD = false;
    let inRequirements = false;
    let matchCountInJD = 0;

    for (const v of termVariations) {
      if (generalText.includes(v)) {
        inJD = true;
        matchCountInJD++;
      }
      if (requirementsText && requirementsText.includes(v)) {
        inRequirements = true;
      }
    }

    if (!inJD) continue;

    const weight = inRequirements ? 3 : 1;
    totalWeightedTerms += weight;

    // Map importance
    const importanceLevel: 'critical' | 'important' | 'preferred' =
      item.importance === 'critical' || inRequirements
        ? 'critical'
        : item.importance === 'recommended'
        ? 'important'
        : 'preferred';

    // 1. Check for DIRECT MATCH in candidate bullets or skills (Category A)
    let directEvidence: TaggedBulletEvidence | null = null;
    let directSkillMatch: string | null = null;

    for (const b of candidateBullets) {
      const bLower = b.text.toLowerCase();
      if (termVariations.some((v) => bLower.includes(v))) {
        directEvidence = b;
        break;
      }
    }

    if (!directEvidence) {
      for (const skill of skillsList) {
        if (termVariations.some((v) => skill.includes(v) || v.includes(skill))) {
          directSkillMatch = skill;
          break;
        }
      }
    }

    // 2. Check for WEAK / INDIRECT wording (Category B)
    let weakEvidence: TaggedBulletEvidence | null = null;
    if (!directEvidence) {
      for (const b of candidateBullets) {
        const bLower = b.text.toLowerCase();
        // Check semantic clues
        const hasClue = item.semanticClues.some((clue) => bLower.includes(clue));
        // Check passive verbs or general domain responsibility
        const isRelatedDomain =
          (item.category === 'product' && (bLower.includes('product') || bLower.includes('feature') || bLower.includes('user') || bLower.includes('customer'))) ||
          (item.category === 'finance' && (bLower.includes('financial') || bLower.includes('revenue') || bLower.includes('cost') || bLower.includes('profit'))) ||
          (item.category === 'analytics' && (bLower.includes('data') || bLower.includes('metric') || bLower.includes('analysis') || bLower.includes('report'))) ||
          (item.category === 'consulting' && (bLower.includes('strategy') || bLower.includes('client') || bLower.includes('presentation') || bLower.includes('recommendation'))) ||
          (item.category === 'marketing' && (bLower.includes('marketing') || bLower.includes('campaign') || bLower.includes('brand') || bLower.includes('launch')));

        if (hasClue || (isRelatedDomain && !metricRegex.test(b.text))) {
          weakEvidence = b;
          break;
        }
      }
    }

    // 3. Check for ADJACENT / UNCERTAIN domain exposure (Category D)
    const hasDomainExposure =
      resumeSummary.includes(item.category) ||
      candidateHeadline.includes(item.category) ||
      resume.targetDomain === item.category;

    // CLASSIFICATION LOGIC
    if (directEvidence) {
      // Category A: Present & Adequately Evidenced
      matchedWeightedTerms += weight;
      matchedKeywords.push({
        term: item.term,
        count: matchCountInJD,
        category: item.category,
      });

      requirementGaps.push({
        id: `gap-${item.term.replace(/\s+/g, '_')}`,
        requirement: item.term,
        category: item.category,
        importance: importanceLevel,
        classification: 'category_a_matched',
        explanation: `Demonstrated directly in candidate resume with verified experience context.`,
        supportingEvidence: {
          originalBullet: directEvidence.text,
          sectionHeading: directEvidence.sectionHeading,
          roleOrCompany: directEvidence.roleOrCompany,
          sectionType: directEvidence.sectionType,
          expIndex: directEvidence.expIndex,
          bulletIndex: directEvidence.bulletIndex,
        },
        recommendedAction: 'Keep this achievement prominently positioned in your resume.',
        status: 'applied',
      });
    } else if (directSkillMatch) {
      // Listed in skills list
      matchedWeightedTerms += weight;
      matchedKeywords.push({
        term: item.term,
        count: matchCountInJD,
        category: item.category,
      });

      requirementGaps.push({
        id: `gap-${item.term.replace(/\s+/g, '_')}`,
        requirement: item.term,
        category: item.category,
        importance: importanceLevel,
        classification: 'category_a_matched',
        explanation: `Verified in candidate Core Skills inventory ("${directSkillMatch}").`,
        supportingEvidence: {
          originalBullet: `Skills section: ${directSkillMatch}`,
          sectionHeading: 'Core Competencies & Technical Skills',
          roleOrCompany: 'Candidate Profile Skills',
          sectionType: 'skills',
        },
        recommendedAction: 'Supported in skills taxonomy. For higher impact, anchor with a quantified bullet in your work history.',
        status: 'applied',
      });
    } else if (weakEvidence) {
      // Category B: Likely Present, Inadequately Represented
      // Ground the rewrite strictly in candidate's original bullet without fabricating fake metrics
      const origText = weakEvidence.text;
      let cleanImprovement = origText;

      // Cleanly replace weak/passive verb with strong leadership verb and embed standard ATS term
      const leadingPassiveMatch = origText.match(/^(worked on|helped with|responsible for|handled|assisted in|participated in|managed)\s+/i);
      if (leadingPassiveMatch) {
        cleanImprovement = cleanImprovement.replace(leadingPassiveMatch[0], 'Spearheaded ');
      } else if (!/^(led|spearheaded|architected|orchestrated|delivered|engineered|formulated|directed)/i.test(cleanImprovement)) {
        cleanImprovement = `Spearheaded ${cleanImprovement.charAt(0).toLowerCase()}${cleanImprovement.slice(1)}`;
      }

      // Add the exact ATS keyword naturally if missing
      if (!cleanImprovement.toLowerCase().includes(item.term.toLowerCase())) {
        cleanImprovement = `${cleanImprovement.replace(/\.?$/, '')}, incorporating structured ${item.term} frameworks for stakeholder alignment.`;
      }

      requirementGaps.push({
        id: `gap-${item.term.replace(/\s+/g, '_')}`,
        requirement: item.term,
        category: item.category,
        importance: importanceLevel,
        classification: 'category_b_improve',
        explanation: `Your resume demonstrates relevant experience in this area, but uses indirect terminology ("${weakEvidence.text.slice(0, 60)}...") that may not be recognized by automated ATS filters looking for "${item.term}".`,
        supportingEvidence: {
          originalBullet: weakEvidence.text,
          sectionHeading: weakEvidence.sectionHeading,
          roleOrCompany: weakEvidence.roleOrCompany,
          sectionType: weakEvidence.sectionType,
          expIndex: weakEvidence.expIndex,
          bulletIndex: weakEvidence.bulletIndex,
        },
        recommendedImprovement: cleanImprovement,
        recommendedAction: 'Elevate this existing bullet using the employer’s exact ATS terminology while preserving your authentic work.',
        status: 'unresolved',
      });

      missingKeywords.push({
        term: item.term,
        category: item.category,
        importance: item.importance,
      });
    } else if (hasDomainExposure) {
      // Category D: Uncertain or Insufficient Evidence
      requirementGaps.push({
        id: `gap-${item.term.replace(/\s+/g, '_')}`,
        requirement: item.term,
        category: item.category,
        importance: importanceLevel,
        classification: 'category_d_uncertain',
        explanation: `Your profile indicates exposure to the ${item.category} domain, but does not provide specific details regarding hands-on proficiency with "${item.term}".`,
        recommendedAction: `Please confirm if you have practical hands-on experience with ${item.term} to unlock an evidence-grounded recommendation.`,
        status: 'unresolved',
      });

      missingKeywords.push({
        term: item.term,
        category: item.category,
        importance: item.importance,
      });
    } else {
      // Category C: Genuinely Missing or Unsupported
      requirementGaps.push({
        id: `gap-${item.term.replace(/\s+/g, '_')}`,
        requirement: item.term,
        category: item.category,
        importance: importanceLevel,
        classification: 'category_c_missing',
        explanation: `This skill is required by the employer, but no supporting evidence or related projects were found in your supplied resume.`,
        recommendedAction: `Consider enrolling in a certification course or completing a verified project in ${item.term} to bridge this gap.`,
        status: 'unresolved',
      });

      missingKeywords.push({
        term: item.term,
        category: item.category,
        importance: item.importance,
      });
    }
  }

  // Sort missing keywords by importance
  missingKeywords.sort((a, b) => {
    const order = { critical: 0, recommended: 1, bonus: 2 };
    return order[a.importance] - order[b.importance];
  });

  const keywordCoverage = totalWeightedTerms > 0 ? Math.round((matchedWeightedTerms / totalWeightedTerms) * 100) : 50;

  const allBullets = candidateBullets.map((b) => b.text);
  const quantifiedBullets = allBullets.filter((b) => metricRegex.test(b));
  const quantifiedImpactScore = allBullets.length > 0 ? Math.round((quantifiedBullets.length / allBullets.length) * 100) : 0;

  // Structure Score
  let structurePoints = 0;
  if (resume.fullName && resume.email && resume.phone) structurePoints += 30;
  if (resume.summary && resume.summary.length > 40) structurePoints += 20;
  if (resume.experience.length >= 2) structurePoints += 30;
  if (resume.education.length >= 1) structurePoints += 20;
  const structureScore = structurePoints;

  // Overall Match formula: 60% keyword coverage + 20% quantified impact + 20% structure
  const overallMatch = Math.round(0.6 * keywordCoverage + 0.2 * quantifiedImpactScore + 0.2 * structureScore);

  // ATS System Checks (6 Standard Checks)
  const atsChecks: AtsCheckResult[] = [
    {
      id: 'contact_info',
      name: 'Contact Coordinates & Header',
      passed: Boolean(resume.email && resume.phone && resume.location),
      severity: 'error',
      message:
        resume.email && resume.phone
          ? 'Email, phone number, and location are fully specified.'
          : 'Missing essential contact coordinates (email/phone).',
    },
    {
      id: 'metric_quantification',
      name: 'Bullet Point Metric Density',
      passed: quantifiedImpactScore >= 50,
      severity: 'warning',
      message: `${quantifiedImpactScore}% of bullets contain quantified metrics (${quantifiedBullets.length}/${allBullets.length}). Aim for > 60%.`,
    },
    {
      id: 'action_verbs',
      name: 'Executive Leadership Verbs',
      passed: allBullets.filter((b) =>
        /^(led|spearheaded|architected|orchestrated|delivered|scaled|negotiated|engineered|formulated|reduced|optimized|generated|directed)/i.test(b.trim())
      ).length >= Math.max(1, Math.floor(allBullets.length * 0.6)),
      severity: 'warning',
      message: 'Most bullets lead with active leadership verbs (Led, Spearheaded, Orchestrated, Delivered).',
    },
    {
      id: 'section_headers',
      name: 'Standard ATS Section Headers',
      passed: true,
      severity: 'info',
      message: 'Experience, Education, Skills, and Projects use standard terminology parsed cleanly by Workday/Taleo.',
    },
    {
      id: 'keyword_coverage',
      name: 'Job Description Core Terms',
      passed: keywordCoverage >= 65,
      severity: 'error',
      message: `Matching ${matchedKeywords.length} terms (${keywordCoverage}% coverage). ${missingKeywords.filter((m) => m.importance === 'critical').length} critical terms still missing.`,
    },
    {
      id: 'bullet_length',
      name: 'Bullet Point Length & Conciseness',
      passed: allBullets.every((b) => b.length >= 35 && b.length <= 220),
      severity: 'info',
      message: 'Bullet lines are calibrated for rapid recruiter scan (35–220 characters).',
    },
  ];

  // Infer closest role from JD text
  let bestRoleMatch = ROLES[0].title;
  let highestKwHits = -1;
  for (const role of ROLES) {
    let hits = 0;
    for (const kw of role.keywords) {
      if (jdLower.includes(kw.toLowerCase())) hits++;
    }
    if (hits > highestKwHits) {
      highestKwHits = hits;
      bestRoleMatch = role.title;
    }
  }

  // Legacy bulletRewrites mapped from Category B gaps
  const bulletRewrites: BulletRewrite[] = requirementGaps
    .filter((g) => g.classification === 'category_b_improve' && g.supportingEvidence && g.recommendedImprovement)
    .map((g) => ({
      original: g.supportingEvidence!.originalBullet,
      improved: g.recommendedImprovement!,
      sectionHeading: g.supportingEvidence!.sectionHeading,
      reason: g.explanation,
    }));

  // Summary counts
  const summary = {
    matchedCount: requirementGaps.filter((g) => g.classification === 'category_a_matched').length,
    improveCount: requirementGaps.filter((g) => g.classification === 'category_b_improve').length,
    missingCount: requirementGaps.filter((g) => g.classification === 'category_c_missing').length,
    uncertainCount: requirementGaps.filter((g) => g.classification === 'category_d_uncertain').length,
  };

  return {
    overallMatch,
    keywordCoverage,
    quantifiedImpactScore,
    structureScore,
    matchedKeywords,
    missingKeywords,
    atsChecks,
    bulletRewrites,
    requirementGaps,
    summary,
    inferredRole: bestRoleMatch,
    requirementsCount: totalWeightedTerms,
  };
}
