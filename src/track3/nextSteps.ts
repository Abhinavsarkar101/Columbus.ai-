import {
  CompetencyKey,
  DomainId,
  ExperienceLevel,
  GroupScoreResult,
  MissedQuestionReviewItem,
} from './types';

export const NEXT_STEPS_BY_COMPETENCY: Record<
  CompetencyKey,
  Record<ExperienceLevel, string>
> = {
  analytical: {
    Fresher:
      '[Analytical Foundations] Build an end-to-end data teardown using SQL & Python: Take an open business dataset (e.g., Brazilian E-Commerce or Telco Churn), formulate 2 testable hypotheses, perform cohort retention / conversion funnel modeling, and summarize findings in a 5-bullet executive memo with exact quantitative deltas.',
    'Intern / Internship completed':
      '[Data Modeling & Attribution] Standardize your internship analytical work into a structured before-and-after case: Document the baseline metric, data extraction query, control vs. treatment methodology, and validate statistical significance (p-value, sample size) before recommending decisions.',
    '1+ year experience':
      '[Causal Inference & Experimentation] Lead experiment design (A/B testing, CUPED variance reduction, or synthetic controls): Formalize trade-off models balancing short-term churn against long-term LTV, establishing clear metric guardrails before initiating rollout.',
  },
  business: {
    Fresher:
      '[Commercial Acumen & Unit Economics] Conduct a comprehensive 1-page financial breakdown of a market leader: Map revenue streams, gross margins, CAC/LTV payback dynamics, and calculate the financial impact of a 5% price elasticity change on bottom-line EBITDA.',
    'Intern / Internship completed':
      '[Value Driver Mapping] Quantify the commercial impact of your deliverables: Translate operational tickets into revenue enablement, cost reduction, or risk mitigation dollars. Present findings using the "Impact on P&L" framing in team reviews.',
    '1+ year experience':
      '[Capital Allocation & Strategic Trade-offs] Formulate a business case with sensitivity tables (Base, Upside, Downside): Model cost of delay vs. engineering headcount, demonstrating how resource reallocation unlocks high-margin expansion revenue.',
  },
  communication: {
    Fresher:
      '[Minto Pyramid & Executive Brevity] Practice the Pyramid Principle: Structure project updates leading with the governing conclusion / decision required, supported by 3 mutually exclusive arguments and verified data points, avoiding chronological progress narratives.',
    'Intern / Internship completed':
      '[Cross-Functional Alignment] Standardize status communications: Draft cross-functional decision logs with a clear "Context → Options Evaluated → Trade-offs Accepted → Action Item with Owner & Deadline" format.',
    '1+ year experience':
      '[Executive Stakeholder Management] Prepare a 1-slide steering committee briefing: Frame technical constraints in terms of business exposure, customer risk, and financial return, successfully driving consensus among conflicting VP-level stakeholders.',
  },
  problemSolving: {
    Fresher:
      '[Structured Problem Decomposition] Practice MECE (Mutually Exclusive, Collectively Exhaustive) root cause analysis: For any operational failure or drop in metrics, build an issue tree down to 3 levels before brainstorming tactical solutions.',
    'Intern / Internship completed':
      '[Trade-Off Matrix Framework] Document complex problem decisions using a formal weighted criteria matrix: Explicitly score competing solutions across implementation effort, customer blast radius, reversibility (Type 1 vs. Type 2 decisions), and technical debt.',
    '1+ year experience':
      '[Systemic Failure Mode Analysis] Implement root cause corrective action protocols (5-Whys, Fishbone / Ishikawa diagram, FMEA): Shift your team from reactive firefighting to systemic process improvements that permanently eliminate failure classes.',
  },
  execution: {
    Fresher:
      '[Full Lifecycle Project Delivery] Execute and publish a complete portfolio artifact from spec to deployment: Write a mini-PRD / project brief, define weekly milestone sprints, track task burndown in JIRA/Linear, and publish the verified post-launch metrics.',
    'Intern / Internship completed':
      '[Autonomous Ownership & SLA Delivery] Own a feature or operational process end-to-end: Establish unambiguous definition-of-done criteria, create fallback runbooks for edge cases, and cut delivery cycle time by eliminating recurring handoff bottlenecks.',
    '1+ year experience':
      '[Process Scaling & Operational Throughput] Re-engineer a core workflow using lean delivery principles: Audit handoff latency across teams, introduce automated gate checks, and achieve measurable efficiency gains (e.g., 20%+ reduction in turnaround SLA).',
  },
  influence: {
    Fresher:
      '[Influence Without Authority] Secure buy-in for an initiative: Build alignment by identifying the primary incentives of teammates (engineering velocity, design elegance, business goals) and crafting a shared proposal addressing each perspective.',
    'Intern / Internship completed':
      '[Data-Grounded Consensus Building] Overcome cross-functional skepticism: When facing pushback on priority or scope, gather customer verbatim transcripts and quantitative conversion telemetry to demonstrate why your proposed approach minimizes overall risk.',
    '1+ year experience':
      '[Strategic Coalition & Stakeholder Alignment] Map organizational stakeholders on an Influence-Interest grid: Conduct pre-alignment 1-on-1s prior to major roadmap presentations to eliminate surprises and secure key sponsor buy-in in advance.',
  },
  learning: {
    Fresher:
      '[Reflective Practice & Growth Cadence] Maintain a structured retrospective log: Document weekly learnings, technical misconceptions debunked, and explicit action items adopted based on code/PR reviews or mentor critique.',
    'Intern / Internship completed':
      '[Proactive Feedback Loops] Establish a bi-weekly capability review cadence: Solicit targeted feedback on high-leverage growth areas from your lead, design deliberate practice sessions, and track demonstrable progress against the feedback within 30 days.',
    '1+ year experience':
      '[Domain Mastery & Mentorship Multiplier] Conduct internal knowledge-sharing teardowns: Synthesize emerging industry best practices into actionable playbooks for your peers, accelerating team-wide domain capability and onboarding velocity.',
  },
};

/**
 * Domain-specific research-backed project blueprints & study priorities
 */
export const DOMAIN_STUDY_BLUEPRINTS: Record<
  DomainId,
  Record<ExperienceLevel, { title: string; guidance: string }>
> = {
  'product-tech': {
    Fresher: {
      title: 'Product Requirements Document (PRD) & Backlog Teardown',
      guidance:
        'Author a comprehensive PRD for an existing high-growth product (e.g. Notion, Swiggy, or Stripe). Include a North Star metric decomposition tree, 3 user personas with validated problem statements, edge-case user stories with acceptance criteria, and a prioritized feature backlog using the RICE framework (Reach, Impact, Confidence, Effort).',
    },
    'Intern / Internship completed': {
      title: 'Feature Telemetry, Funnel Optimization & Sprint Retrospective',
      guidance:
        'Audit a product feature by constructing a complete behavioral telemetry funnel: measure sign-up, activation, daily active usage (DAU/MAU), and feature drop-off. Document trade-offs made between technical debt and roadmap features, and write a data-driven launch retrospective with clear iteration targets.',
    },
    '1+ year experience': {
      title: 'Quarterly Strategic Roadmap & P&L Impact Modeling',
      guidance:
        'Develop a quarterly strategic product roadmap balancing core customer retention, technical debt paydown, and enterprise feature requests. Model unit economics impact (reducing churn by X bps vs. new user ARR), present a defensible trade-off matrix, and construct an executive pitch deck for leadership alignment.',
    },
  },
  'finance-consulting': {
    Fresher: {
      title: 'Dynamic 3-Statement Financial Model & Valuation Teardown',
      guidance:
        'Construct a fully dynamic, integrated 3-Statement financial model (Income Statement, Balance Sheet, Cash Flow) in Excel/Google Sheets. Include historical CAGR trend analysis, working capital schedules, debt amortization, and scenario toggles (Base, Bull, Bear) calculating enterprise value via Discounted Cash Flow (DCF).',
    },
    'Intern / Internship completed': {
      title: 'Budget vs. Actuals (BvA) Variance & Unit Economics Analysis',
      guidance:
        'Conduct monthly departmental budget-vs-actuals (BvA) variance reconciliations: break down price vs. volume variances, calculate unit economics (CAC payback period, LTV/CAC ratio, gross contribution margin), and author monthly executive variance summaries with remediation proposals.',
    },
    '1+ year experience': {
      title: 'Strategic Capital Allocation, Sensitivity & Board Deck Preparation',
      guidance:
        'Develop a multi-year corporate capital allocation model: evaluate debt vs. equity financing structures, run Monte Carlo and sensitivity tables on interest rate and margin fluctuations, and design board-ready financial presentations outlining return on invested capital (ROIC) across competing business units.',
    },
  },
  'marketing-growth': {
    Fresher: {
      title: 'Full-Funnel Acquisition Strategy & Multi-Channel Campaign Teardown',
      guidance:
        'Design a comprehensive multi-channel customer acquisition plan: define audience ICPs (Ideal Customer Profiles), craft messaging hooks across organic social, SEO, and paid search, estimate blended CAC and ROAS targets, and execute a live pilot test measuring click-through rate (CTR) and conversion drop-offs.',
    },
    'Intern / Internship completed': {
      title: 'Multi-Touch Attribution Modeling & Landing Page CRO Experiments',
      guidance:
        'Implement an attribution model comparing first-touch, last-touch, and data-driven multi-touch channel contributions. Run systematic Conversion Rate Optimization (CRO) A/B tests on high-traffic landing pages, analyzing bounce rates, heatmaps, and form completion rates with statistical confidence.',
    },
    '1+ year experience': {
      title: 'Lifecycle Retention Loops, LTV Optimization & Brand Architecture',
      guidance:
        'Architect an automated customer lifecycle marketing engine: establish behavioral trigger sequences, churn prevention win-back campaigns, and cohort-specific onboarding flows. Optimize customer lifetime value (LTV) to support aggressive, profitable paid channel scaling with lowered blended acquisition costs.',
    },
  },
  'operations-analytics': {
    Fresher: {
      title: 'Value Stream Mapping (VSM) & End-to-End Analytics Pipeline',
      guidance:
        'Map an operational fulfillment workflow using Value Stream Mapping and build a companion SQL analytics dashboard. Calculate cycle times, identify handoff bottlenecks, compute rolling 30-day cohort retention, and propose a DMAIC Six Sigma remediation plan to eliminate operational waste.',
    },
    'Intern / Internship completed': {
      title: 'SLA Dashboard Architecture, dbt Modeling & Vendor Auditing',
      guidance:
        'Develop an operational dashboard tracking Service Level Agreements (SLAs), On-Time In-Full (OTIF) delivery, and vendor defect rates using production dbt transformations. Conduct weekly 5-Whys root cause audits on SLA breaches, and establish formal standard operating procedures (SOPs).',
    },
    '1+ year experience': {
      title: 'Capacity Modeling, A/B Testing & Working Capital Optimization',
      guidance:
        'Model operational inventory turnover and safety stock thresholds using probabilistic demand curves. Formulate an experimentation framework (power calculations, CUPED variance reduction) to test logistics routing improvements, and establish cross-functional contingency risk registers.',
    },
  },
  'sales-bd': {
    Fresher: {
      title: 'Target Account Territory Mapping & B2B Discovery Playbook',
      guidance:
        'Build a comprehensive B2B outbound prospecting territory plan for 20 enterprise accounts: conduct stakeholder org-chart mapping, identify business pain points using annual filings, write 3 personalized multi-touch outreach sequences, and design a MEDDIC qualification scorecard for initial discovery calls.',
    },
    'Intern / Internship completed': {
      title: 'Sales Pipeline Velocity & Win/Loss Conversion Analysis',
      guidance:
        'Analyze full-cycle sales CRM telemetry: calculate stage conversion rates from Discovery to Closed-Won, isolate sales cycle velocity bottlenecks, conduct win/loss post-mortems, and develop objection-handling playbooks for common competitive alternatives.',
    },
    '1+ year experience': {
      title: 'Enterprise Deal Architecture & Executive Contract Negotiation',
      guidance:
        'Structure a complex enterprise software agreement: coordinate technical proof-of-concept (PoC) success criteria, model multi-year ACV/TCV pricing tiers with clear commercial covenants, and deliver an executive business case demonstrating quantifiable customer ROI.',
    },
  },
  people: {
    Fresher: {
      title: 'Competency-Based Hiring Rubrics & Structured Onboarding Playbook',
      guidance:
        'Design an end-to-end recruitment toolkit for high-priority business roles: draft unbiased, skill-focused job descriptions, create structured interview rubrics with behavioral scoring anchors, and write a 30-60-90 day onboarding playbook with measurable ramp-up milestones.',
    },
    'Intern / Internship completed': {
      title: 'Employee Engagement (eNPS) Analytics & Retention Action Plans',
      guidance:
        'Analyze company-wide employee engagement and pulse survey data (eNPS). Segment satisfaction metrics by department, tenure, and role tier; conduct focus groups to isolate turnover drivers; and deliver an actionable employee retention initiative to executive leadership.',
    },
    '1+ year experience': {
      title: '9-Box Talent Calibration, Compensation Banding & HR Architecture',
      guidance:
        'Facilitate organizational talent calibration using the 9-Box performance-potential grid. Benchmark salary bands and equity incentives against market compensation surveys, model promotion budget impact, and formalize succession planning pipelines for mission-critical engineering and business roles.',
    },
  },
  'general-management': {
    Fresher: {
      title: 'Strategic Market Entry Teardown & MECE Decision Tree',
      guidance:
        'Author an executive strategy memo assessing market entry into an adjacent category using Porter’s Five Forces and PESTEL frameworks. Build a MECE issue tree evaluating market size (TAM/SAM/SOM), competitive moats, and operational feasibility with clear go/no-go recommendations.',
    },
    'Intern / Internship completed': {
      title: 'Quarterly OKR Cascade & RACI Governance Implementation',
      guidance:
        'Lead the cross-functional rollout of quarterly Objectives and Key Results (OKRs). Formulate RACI matrices (Responsible, Accountable, Consulted, Informed) for multi-departmental deliverables, establish weekly operating rhythm dashboards, and resolve resource conflicts through objective trade-off evaluation.',
    },
    '1+ year experience': {
      title: 'Enterprise Risk Management & Cross-Functional Transformation',
      guidance:
        'Construct a comprehensive enterprise risk register mapping operational, regulatory, and financial vulnerabilities with probability-impact scoring. Lead cross-functional steering committee meetings, establish risk mitigation contingency plans, and oversee systemic operational change management programs.',
    },
  },
};

/**
 * Scenario-specific insights derived from missed questions
 */
function analyzeMissedScenarios(missedQuestions: MissedQuestionReviewItem[]): string[] {
  const recommendations: string[] = [];

  const hasRootCauseIssue = missedQuestions.some(
    (m) =>
      m.questionText.toLowerCase().includes('budget') ||
      m.questionText.toLowerCase().includes('delayed') ||
      m.questionText.toLowerCase().includes('over budget') ||
      m.questionText.toLowerCase().includes('churn') ||
      m.questionText.toLowerCase().includes('drop') ||
      m.questionText.toLowerCase().includes('error') ||
      m.questionText.toLowerCase().includes('bug')
  );

  if (hasRootCauseIssue) {
    recommendations.push(
      '[Scenario Alignment • Root Cause vs. Quick Patch] In your assessment scenarios, some decisions favored immediate symptomatic patches over diagnostic investigation. Study the 5-Whys and Ishikawa (Fishbone) frameworks: when metrics drop or budgets deviate, isolate the structural driver before committing resources to superficial fixes.'
    );
  }

  const hasTradeoffIssue = missedQuestions.some(
    (m) =>
      m.questionText.toLowerCase().includes('trade-off') ||
      m.questionText.toLowerCase().includes('feature a') ||
      m.questionText.toLowerCase().includes('revenue') ||
      m.questionText.toLowerCase().includes('priority') ||
      m.questionText.toLowerCase().includes('price') ||
      m.questionText.toLowerCase().includes('slot')
  );

  if (hasTradeoffIssue) {
    recommendations.push(
      '[Scenario Alignment • Opportunity Cost & Prioritization] Several scenario choices showed hesitation when balancing high-value enterprise requests against broad user utility. Practice Expected Monetary Value (EMV) and RICE trade-off scoring to defend why selecting one initiative over another maximizes net long-term enterprise return.'
    );
  }

  const hasStakeholderIssue = missedQuestions.some(
    (m) =>
      m.questionText.toLowerCase().includes('stakeholder') ||
      m.questionText.toLowerCase().includes('push back') ||
      m.questionText.toLowerCase().includes('engineer') ||
      m.questionText.toLowerCase().includes('manager') ||
      m.questionText.toLowerCase().includes('client') ||
      m.questionText.toLowerCase().includes('team')
  );

  if (hasStakeholderIssue) {
    recommendations.push(
      '[Scenario Alignment • Stakeholder Influence & Consensus] Decision scenarios with cross-functional friction require pre-alignment and shared objective criteria. Implement pre-wire 1-on-1 conversations and structured decision matrices to resolve divergence before public escalations.'
    );
  }

  return recommendations;
}

/**
 * Enhanced, deeply researched selection of next steps based on role, domain, stage, competencies, and answers
 */
export function selectNextSteps(options: {
  level: ExperienceLevel;
  roleTitle?: string;
  domainId?: DomainId;
  competencyScores: { competency: CompetencyKey; score: number }[];
  groupScores: GroupScoreResult[];
  aiMean?: number;
  aiGroupsAssessed?: GroupScoreResult[];
  missedQuestions?: MissedQuestionReviewItem[];
  selectedTagIds?: string[];
}): string[] {
  const steps: string[] = [];

  // 1. Domain & Role-Specific Research Blueprint (Always priority #1)
  const domain: DomainId = options.domainId || 'general-management';
  const domainBlueprint = DOMAIN_STUDY_BLUEPRINTS[domain]?.[options.level];
  if (domainBlueprint) {
    steps.push(
      `[Role Project • ${domainBlueprint.title}] ${domainBlueprint.guidance}`
    );
  }

  // 2. Scenario-Specific Alignment based on user's actual choices & missed questions
  if (options.missedQuestions && options.missedQuestions.length > 0) {
    const scenarioAdvice = analyzeMissedScenarios(options.missedQuestions);
    for (const advice of scenarioAdvice) {
      if (steps.length < 5 && !steps.includes(advice)) {
        steps.push(advice);
      }
    }
  }

  // 3. Address the 2 lowest-scoring competencies with stage-calibrated guidance
  const sortedCompetencies = [...options.competencyScores].sort(
    (a, b) => a.score - b.score
  );

  for (const item of sortedCompetencies) {
    if (steps.length >= 4) break;
    const stepText = NEXT_STEPS_BY_COMPETENCY[item.competency]?.[options.level];
    if (stepText && !steps.includes(stepText)) {
      steps.push(stepText);
    }
  }

  // 4. Low-scoring assessed group intervention (if below 2.8 / 4.0)
  const lowGroups = options.groupScores
    .filter((g) => g.domain !== 'ai' && g.score < 2.9)
    .sort((a, b) => a.score - b.score);

  for (const lg of lowGroups) {
    if (steps.length >= 5) break;
    const groupStep = `[Skill Group Deep Dive • ${lg.groupName}] Your score was ${lg.score} / 4.0 in ${lg.groupName}. Dedicate 3-5 hours to targeted practice: review standard industry benchmarks, solve 5 real-world case simulations in this area, and document a 1-page playbook of best practices to elevate your baseline.`;
    if (!steps.includes(groupStep)) {
      steps.push(groupStep);
    }
  }

  // 5. AI & Automation Leverage (if AI tags were assessed or low AI readiness)
  if (options.aiMean !== undefined && steps.length < 5) {
    const aiGroups = (options.aiGroupsAssessed || []).sort(
      (a, b) => a.score - b.score
    );
    const targetAIGroupName =
      aiGroups.length > 0 ? aiGroups[0].groupName : 'AI & Workflow Automation';

    const aiStep =
      options.aiMean < 2.8
        ? `[AI & Automation Intervention • ${targetAIGroupName}] Your AI readiness score was ${options.aiMean} / 4.0. Build a hands-on workflow automation: integrate an LLM via API for document classification or data extraction, engineer 3 few-shot prompt variants, test for hallucination edge cases, and measure process time saved.`
        : `[AI Leverage Multiplier • Advanced Workflows] Maintain your strong AI baseline (${options.aiMean} / 4.0): build a production-grade automated pipeline using structured JSON schema validation, automated retrieval-augmented verification (RAG), and deploy it as a workflow accelerator in your role.`;

    if (!steps.includes(aiStep)) {
      steps.push(aiStep);
    }
  }

  // Fallback to ensure at least 3 rich steps
  if (steps.length < 3) {
    for (const item of sortedCompetencies.slice(1)) {
      if (steps.length >= 3) break;
      const stepText = NEXT_STEPS_BY_COMPETENCY[item.competency]?.[options.level];
      if (stepText && !steps.includes(stepText)) {
        steps.push(stepText);
      }
    }
  }

  return steps.slice(0, 5);
}
