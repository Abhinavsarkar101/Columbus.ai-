// Section 9: Report Content Data (single source of truth for text and facts)

export interface MarketFact {
  source: string;
  date: string;
  text: string;
}

export interface SpecializationProfile {
  code: string;
  week: string;
  ai_now: string;
  next: string;
  exposure: 'Low' | 'Medium' | 'High';
}

export interface RoleFamilyBlurb {
  family: 'ANALYTIC' | 'CLIENT' | 'BUILD' | 'OPS_PEOPLE';
  title: string;
  day: string;
  ai_now: string;
  next: string;
  humanEdge: string;
}

export interface RoleAnatomy {
  role: string;
  daily: string;
  rounds: string;
  ai_in_role: string;
  archetype?: 'AN' | 'ST' | 'BU' | 'PE' | 'CO' | 'OP';
}

// 9.1 Market Snapshot
export const MARKET_SNAPSHOT: MarketFact[] = [
  {
    source: 'World Economic Forum, Future of Jobs Report 2025',
    date: 'January 2025',
    text: 'Employers expect about 170 million new jobs and 92 million displaced by 2030, a net gain of about 78 million; about 22% of jobs are expected to be disrupted; AI and big data, networks and cybersecurity, and technological literacy are projected as the fastest-growing skills; analytical thinking, resilience, leadership and collaboration remain core.',
  },
  {
    source: 'Cornell research, working paper on AI and MBA hiring (Spring 2026), based on interviews at 30 organisations',
    date: 'Spring 2026',
    text: 'Employers are automating entry-level work once done by MBA graduates and expect new roles such as AI risk and compliance, AI transformation and AI product management.',
  },
  {
    source: 'PwC 2026 Global AI Jobs Barometer (as summarised by a business school, 2026)',
    date: '2026',
    text: 'Entry-level roles highly exposed to AI are far more likely to demand senior-style skills such as judgement, leadership and communication.',
  },
  {
    source: 'PwC survey of US financial services executives',
    date: 'August 2026',
    text: 'Most said AI training is more valuable than an MBA for many new hires, and most are raising pay for AI skills. US finance only.',
  },
];

// 9.3 Hiring in the AI Era
export const HIRING_IN_AI_ERA: string[] = [
  'Some employers screen CVs with software (ATS), so use the role\'s own words from the job post (truthfully), a simple layout and quantified results.',
  'Expect to be asked how you use AI tools and how you check their output.',
  'Entry-level work is shifting from producing first drafts to checking, judging and explaining, so practise explaining your reasoning aloud.',
  'Show proof of work (a case, model, campaign plan or dashboard) rather than only listing skills.',
];

// 9.2 Specialization Profiles
export const SPECIALIZATION_PROFILES: Record<string, SpecializationProfile> = {
  FIN: {
    code: 'FIN',
    week: 'Build and update financial models, review company numbers, prepare reports for decisions.',
    ai_now: 'Drafts models, summarises filings and flags errors; people check and decide.',
    next: 'Routine modelling shrinks; judgement, deal sense and AI-checking matter more.',
    exposure: 'High',
  },
  BNK: {
    code: 'BNK',
    week: 'Assess credit and insurance risk, support customers, check compliance, prepare approvals.',
    ai_now: 'Scores applications, spots fraud, automates paperwork; staff handle exceptions and relationships.',
    next: 'More automated underwriting; roles shift to risk oversight, AI governance and complex cases.',
    exposure: 'High',
  },
  FTC: {
    code: 'FTC',
    week: 'Work on payments, lending or wallet products with tech, risk and compliance teams.',
    ai_now: 'Fraud detection, credit scoring and support bots are common.',
    next: 'Growth in product, risk and regulation roles around AI-driven finance.',
    exposure: 'Medium',
  },
  ANA: {
    code: 'ANA',
    week: 'Clean data, build dashboards, answer business questions, present findings.',
    ai_now: 'Writes queries and code, drafts charts and summaries; analysts frame questions and check results.',
    next: 'Basic reporting is automated; value moves to framing questions, data quality and decisions.',
    exposure: 'High',
  },
  DSA: {
    code: 'DSA',
    week: 'Build and test models with data teams and explain results to managers.',
    ai_now: 'Code assistants speed up modelling; business context and evaluation still need people.',
    next: 'Demand for people who can deploy, test and govern AI in business stays strong; WEF lists AI and big data among the fastest-growing skills.',
    exposure: 'Medium',
  },
  STR: {
    code: 'STR',
    week: 'Structure client problems, analyse data, build slides, present options to leaders.',
    ai_now: 'Drafts slides, research summaries and first-pass analysis; juniors do more review and synthesis.',
    next: 'Entry work becomes more senior: judgement, communication and AI-supported analysis.',
    exposure: 'High',
  },
  INT: {
    code: 'INT',
    week: 'Plan market entry, work with partners and regulations across countries.',
    ai_now: 'Translation, trade-data analysis and compliance checks are automated; relationships and local judgement are not.',
    next: 'Rules and supply chains keep shifting, so adaptable cross-border specialists stay valuable.',
    exposure: 'Medium',
  },
  GEN: {
    code: 'GEN',
    week: 'Rotate across functions, coordinate teams, track budgets and results.',
    ai_now: 'Reports, meeting notes and dashboards are increasingly automated.',
    next: 'Leaders who manage people plus AI-enabled processes gain value.',
    exposure: 'Medium',
  },
  PM: {
    code: 'PM',
    week: 'Talk to users, decide what to build, work with engineers and designers, track metrics.',
    ai_now: 'Drafts specs, summarises feedback and analyses usage; prioritisation and trade-offs stay human.',
    next: 'AI product management is named among new MBA-level roles in recent research.',
    exposure: 'Medium',
  },
  ENT: {
    code: 'ENT',
    week: 'Test ideas with customers, sell, raise money, do whatever the business needs.',
    ai_now: 'Lowers the cost of prototypes, content and market analysis.',
    next: 'Easier to start and harder to stand out; customer insight and execution matter more.',
    exposure: 'Medium',
  },
  FAM: {
    code: 'FAM',
    week: 'Learn each part of the family firm, support expansion, professionalise processes.',
    ai_now: 'Accounting, inventory and marketing tools are cheaper to adopt.',
    next: 'Firms that modernise with data and AI gain an edge; succession and trust remain human issues.',
    exposure: 'Medium',
  },
  MKT: {
    code: 'MKT',
    week: 'Study customers, plan campaigns, manage the brand, work with agencies and sales.',
    ai_now: 'Drafts copy and visuals, tests variations, reads campaign data.',
    next: 'Brand judgement, strategy and AI-tool fluency rise; execution tasks shrink.',
    exposure: 'High',
  },
  DM: {
    code: 'DM',
    week: 'Run search, social and email campaigns, track results, adjust budgets.',
    ai_now: 'Optimises bids, generates content variants and reports automatically.',
    next: 'Roles shift to strategy, analytics and managing AI tools.',
    exposure: 'High',
  },
  SAL: {
    code: 'SAL',
    week: 'Find leads, meet clients, negotiate, close deals, report the pipeline.',
    ai_now: 'Drafts outreach, scores leads, logs calls.',
    next: 'Trust-based selling and complex deals stay human; routine prospecting is automated.',
    exposure: 'Medium',
  },
  MED: {
    code: 'MED',
    week: 'Plan content, audiences, partnerships and events for media or sports brands.',
    ai_now: 'Generates drafts, edits, recommendations and audience analytics.',
    next: 'Original ideas, rights and audience trust matter more as content becomes abundant.',
    exposure: 'High',
  },
  HR: {
    code: 'HR',
    week: 'Recruit, onboard, train, handle employee issues, run people reports.',
    ai_now: 'Screens CVs, schedules interviews, drafts job descriptions, answers policy questions.',
    next: 'Roles shift to people analytics, AI governance and change management; human conversations stay central.',
    exposure: 'High',
  },
  HCM: {
    code: 'HCM',
    week: 'Coordinate hospital operations, budgets, quality and patient flow.',
    ai_now: 'Scheduling, billing and records tools are increasingly automated.',
    next: 'Managers who combine healthcare knowledge with data are likely to stay in demand.',
    exposure: 'Medium',
  },
  PHA: {
    code: 'PHA',
    week: 'Support drug launches, regulatory submissions, supply and doctor engagement.',
    ai_now: 'Speeds literature review, data analysis and document drafting.',
    next: 'Strict regulation keeps human sign-off essential; AI skills add speed.',
    exposure: 'Medium',
  },
  ESG: {
    code: 'ESG',
    week: 'Collect sustainability data, prepare reports, advise teams on targets and rules.',
    ai_now: 'Automates data collection and report drafts.',
    next: "Environmental stewardship entered WEF's list of fastest-growing skills for the first time.",
    exposure: 'Medium',
  },
  HOS: {
    code: 'HOS',
    week: 'Manage guest experience, pricing, staff rosters and events.',
    ai_now: 'Dynamic pricing, booking bots and demand forecasting.',
    next: 'Personalised service gets AI support; human hospitality remains the product.',
    exposure: 'Medium',
  },
  PPN: {
    code: 'PPN',
    week: 'Design and monitor programmes, work with government and donors, write reports.',
    ai_now: 'Helps with research, translation, data analysis and grant drafts.',
    next: 'Impact measurement and responsible AI use become core skills.',
    exposure: 'Medium',
  },
  OPS: {
    code: 'OPS',
    week: 'Track production or service performance, fix bottlenecks, manage quality and vendors.',
    ai_now: 'Predicts breakdowns, optimises schedules, monitors quality.',
    next: 'Managers who can run data-driven, automated operations grow in value.',
    exposure: 'Medium',
  },
  SCM: {
    code: 'SCM',
    week: 'Plan demand, manage suppliers and logistics, solve delays.',
    ai_now: 'Forecasts demand, plans routes, flags disruption risks.',
    next: 'Resilience planning and supplier relationships stay human; planning tasks automate.',
    exposure: 'Medium',
  },
  ITM: {
    code: 'ITM',
    week: 'Choose and roll out systems, manage vendors, security and users.',
    ai_now: 'Code and support automation; security tools use AI.',
    next: 'WEF lists networks and cybersecurity and technological literacy among the top growing skills.',
    exposure: 'Medium',
  },
  PRJ: {
    code: 'PRJ',
    week: 'Plan scope, schedule, budget and risks; run meetings; keep stakeholders aligned.',
    ai_now: 'Drafts plans, status reports, risk logs and meeting notes.',
    next: 'Value moves to stakeholder handling and delivering AI-enabled projects.',
    exposure: 'Medium',
  },
  RET: {
    code: 'RET',
    week: 'Plan product ranges, pricing, stock, online listings and promotions.',
    ai_now: 'Demand forecasting, pricing, recommendations and chat support.',
    next: 'Roles blend merchandising with data and marketplace skills.',
    exposure: 'High',
  },
  AGR: {
    code: 'AGR',
    week: 'Link farmers to markets, manage procurement, storage, pricing and inputs.',
    ai_now: 'Weather, price and crop-monitoring tools are spreading.',
    next: 'Technology adoption varies widely by region; ground relationships stay essential.',
    exposure: 'Low',
  },
  REI: {
    code: 'REI',
    week: 'Evaluate sites, manage construction schedules and costs, deal with buyers and regulators.',
    ai_now: 'Valuation tools, design and scheduling software, document review.',
    next: 'Local knowledge, approvals and negotiation stay human; analysis tools improve.',
    exposure: 'Low',
  },
};

// 9.4 Role Family Blurbs
export const ROLE_FAMILY_BLURBS: Record<string, RoleFamilyBlurb> = {
  ANALYTIC: {
    family: 'ANALYTIC',
    title: 'Analytic Roles',
    day: 'You spend most time with data, models and reports.',
    ai_now: 'First-pass analysis and drafting are increasingly done by AI tools.',
    next: 'Value moves to asking the right question, checking AI output and explaining results.',
    humanEdge: 'Judgement and clear explanation.',
  },
  CLIENT: {
    family: 'CLIENT',
    title: 'Client-Facing Roles',
    day: 'You spend most time with clients, customers or partners.',
    ai_now: 'AI drafts outreach, logs calls and scores leads.',
    next: 'Trust and complex negotiation grow in value; routine contact is automated.',
    humanEdge: 'Relationships and trust.',
  },
  BUILD: {
    family: 'BUILD',
    title: 'Builder & Launch Roles',
    day: 'You spend most time launching new products, campaigns or programmes.',
    ai_now: 'AI speeds up prototypes, drafts and testing.',
    next: 'Taste, prioritisation and customer insight matter more than output volume.',
    humanEdge: 'Judgement about what is worth building.',
  },
  OPS_PEOPLE: {
    family: 'OPS_PEOPLE',
    title: 'Operations & People Roles',
    day: 'You spend most time keeping processes or teams running.',
    ai_now: 'AI helps with scheduling, monitoring and reporting.',
    next: 'People who can run AI-enabled processes and lead teams through change gain value.',
    humanEdge: 'Leadership and reliability.',
  },
};

// 9.5 Role Anatomy (Track D)
export const ROLE_ANATOMIES: Record<string, RoleAnatomy> = {
  'Product Manager': {
    role: 'Product Manager',
    daily: 'Talk to users, write requirements, prioritise, work with engineers and designers, check metrics.',
    rounds: 'Product sense, metrics, execution and prioritisation, behavioural, sometimes a case or take-home.',
    ai_in_role: 'Drafts specs and summarises feedback; you decide what to build and why.',
    archetype: 'BU',
  },
  'Strategy Consultant': {
    role: 'Strategy Consultant',
    daily: 'Structure problems, analyse data, build slides, present to clients.',
    rounds: 'Case interviews (market sizing, profitability, entry), fit and behavioural, a senior round.',
    ai_in_role: 'Drafts slides and research; you synthesise and persuade.',
    archetype: 'ST',
  },
  'IB Associate': {
    role: 'IB Associate',
    daily: 'Build models, value companies, prepare pitch books, manage analysts, talk to clients.',
    rounds: 'Technical (accounting, valuation, deals), fit, market awareness, sometimes a modelling test.',
    ai_in_role: 'Speeds up models and decks; you check numbers and manage clients.',
    archetype: 'AN',
  },
  'Financial Analyst': {
    role: 'Financial Analyst',
    daily: 'Budgets, forecasts, variance reports, business partnering.',
    rounds: 'Technical (accounting, spreadsheets), scenario questions, behavioural.',
    ai_in_role: 'Automates routine reports; you explain the numbers.',
    archetype: 'AN',
  },
  'Marketing or Brand Manager': {
    role: 'Marketing or Brand Manager',
    daily: 'Campaign plans, brand health, agencies, budgets.',
    rounds: 'A case on a brand problem, a review of past campaigns, behavioural.',
    ai_in_role: 'Drafts content and tests variations; you set the brand direction.',
    archetype: 'PE',
  },
  'Digital Marketing Manager': {
    role: 'Digital Marketing Manager',
    daily: 'Run channels, track performance, optimise budgets and content.',
    rounds: 'Channel and analytics questions, a campaign audit or tool test, behavioural.',
    ai_in_role: 'Automates bidding and reporting; you set strategy and check quality.',
    archetype: 'PE',
  },
  'Business or Data Analyst': {
    role: 'Business or Data Analyst',
    daily: 'Pull and clean data, build dashboards, give insights to managers.',
    rounds: 'A spreadsheet or SQL test, a business case, behavioural.',
    ai_in_role: 'Writes queries and drafts charts; you frame questions and check results.',
    archetype: 'AN',
  },
  'HR or Talent Acquisition': {
    role: 'HR or Talent Acquisition',
    daily: 'Source, screen, interview, onboard, answer employee questions.',
    rounds: 'Situational HR cases, behavioural, candidate-handling role-play.',
    ai_in_role: 'Screens CVs and schedules; you assess people and build trust.',
    archetype: 'CO',
  },
  'Operations or Supply Chain Manager': {
    role: 'Operations or Supply Chain Manager',
    daily: 'Plan, monitor, fix bottlenecks, manage vendors and quality.',
    rounds: 'Process and case problems, a quantitative test, behavioural.',
    ai_in_role: 'Forecasts and flags risks; you solve problems and manage people.',
    archetype: 'OP',
  },
  'Sales or Business Development Manager': {
    role: 'Sales or Business Development Manager',
    daily: 'Prospect, pitch, negotiate, report the pipeline.',
    rounds: 'Role-play, a target and pipeline discussion, behavioural.',
    ai_in_role: 'Drafts outreach and logs calls; you build trust and close.',
    archetype: 'PE',
  },
  'Management Trainee (General)': {
    role: 'Management Trainee (General)',
    daily: 'Rotate across functions, work on projects, prepare reports.',
    rounds: 'Aptitude test, group discussion, case or interview.',
    ai_in_role: 'Automates reports and notes; you show adaptability and communication.',
    archetype: 'ST',
  },
  'Another role': {
    role: 'Another role',
    daily: 'Check 3 real job descriptions for daily tasks and interview steps.',
    rounds: 'Ask the employer or alumni about the process.',
    ai_in_role: 'Ask how AI tools are used in this role today.',
  },
};

// 2.7 Jargon Glossary
export const JARGON_GLOSSARY: Record<string, string> = {
  'FP&A': 'Planning and budgeting inside a company',
  'DCF': 'Valuing a business from its future cash',
  'EBITDA': 'A measure of operating profit before some costs',
  'ESG': 'Environment, social and governance',
  'KPI': 'A number that shows how well something is going',
  'P&L': 'Profit and loss responsibility',
  'ATS': 'Software employers use to screen CVs',
  'MVP': 'The smallest working version of a product',
  'M&A': 'Mergers and acquisitions',
  'BFSI': 'Banking, financial services and insurance',
};
export const GLOSSARY = JARGON_GLOSSARY;
