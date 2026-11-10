export type Track1ArchetypeCode = 'AN' | 'ST' | 'BU' | 'PE' | 'CO' | 'OP';

export interface DiagnosticOption {
  id: string;
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  // Hidden tags used purely in scoring calculations, never displayed to user
  archetypeTag?: Track1ArchetypeCode;
  readinessTag?: 'READY_HIGH' | 'READY_MED' | 'READY_INFO' | 'READY_CONF';
  specTags?: string[];
  pairQuality?: 'PAIR_STRONG' | 'PAIR_WEAK';
  creditTag?: 'CREDIT_DUAL_OK' | 'CREDIT_SINGLE' | 'CREDIT_SINGLE_TIGHT' | 'READY_LOW';
  shortAnswerSummary: string; // Used for "answers that drove it"
}

export interface DiagnosticQuestion {
  id: number;
  weight: number;
  scenarioPrompt: string;
  options: DiagnosticOption[];
}

export const TRACK_1_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 1,
    weight: 2,
    scenarioPrompt: 'You are organizing a trip for 10 people with a fixed budget. What do you do first?',
    options: [
      {
        id: 't1_q1_a',
        label: 'A',
        text: 'Build a cost sheet and set a limit for each item',
        archetypeTag: 'AN',
        shortAnswerSummary: 'building a cost sheet and item limits (Q1)',
      },
      {
        id: 't1_q1_b',
        label: 'B',
        text: 'Plan the route, timing, and bookings in order',
        archetypeTag: 'OP',
        shortAnswerSummary: 'planning route, timing, and bookings in order (Q1)',
      },
      {
        id: 't1_q1_c',
        label: 'C',
        text: 'Ask everyone what they want and find a plan all of them like',
        archetypeTag: 'CO',
        shortAnswerSummary: 'asking everyone what they want to find consensus (Q1)',
      },
      {
        id: 't1_q1_d',
        label: 'D',
        text: 'Try a cheap first version and adjust as you go',
        archetypeTag: 'BU',
        shortAnswerSummary: 'testing a cheap first version and adjusting (Q1)',
      },
    ],
  },
  {
    id: 2,
    weight: 2,
    scenarioPrompt: 'Which problem would you most like to spend a week solving?',
    options: [
      {
        id: 't1_q2_a',
        label: 'A',
        text: 'Why sales dropped in one region',
        archetypeTag: 'AN',
        shortAnswerSummary: 'analyzing why regional sales dropped (Q2)',
      },
      {
        id: 't1_q2_b',
        label: 'B',
        text: 'How to build loyal fans for a brand',
        archetypeTag: 'PE',
        shortAnswerSummary: 'building loyal brand fans (Q2)',
      },
      {
        id: 't1_q2_c',
        label: 'C',
        text: 'How to make deliveries faster and cheaper',
        archetypeTag: 'OP',
        shortAnswerSummary: 'making deliveries faster and cheaper (Q2)',
      },
      {
        id: 't1_q2_d',
        label: 'D',
        text: 'Which new market to enter in the next three years',
        archetypeTag: 'ST',
        shortAnswerSummary: 'deciding new markets to enter over three years (Q2)',
      },
    ],
  },
  {
    id: 3,
    weight: 1,
    scenarioPrompt: 'Which sentence sounds most like you?',
    options: [
      {
        id: 't1_q3_a',
        label: 'A',
        text: '"I need the numbers before I decide."',
        archetypeTag: 'AN',
        shortAnswerSummary: 'needing numbers before deciding (Q3)',
      },
      {
        id: 't1_q3_b',
        label: 'B',
        text: '"I want to hear what the people involved think."',
        archetypeTag: 'CO',
        shortAnswerSummary: 'prioritizing what involved people think (Q3)',
      },
      {
        id: 't1_q3_c',
        label: 'C',
        text: '"Let\'s test it small and see what happens."',
        archetypeTag: 'BU',
        shortAnswerSummary: 'testing small to see what happens (Q3)',
      },
      {
        id: 't1_q3_d',
        label: 'D',
        text: '"What does the long-term picture look like?"',
        archetypeTag: 'ST',
        shortAnswerSummary: 'focusing on the long-term picture (Q3)',
      },
    ],
  },
  {
    id: 4,
    weight: 1,
    scenarioPrompt: 'Your ideal workday looks most like:',
    options: [
      {
        id: 't1_q4_a',
        label: 'A',
        text: 'Clear targets and results you can measure',
        archetypeTag: 'OP',
        shortAnswerSummary: 'pursuing clear, measurable targets (Q4)',
      },
      {
        id: 't1_q4_b',
        label: 'B',
        text: 'Pitching ideas, meeting clients, and closing deals',
        archetypeTag: 'PE',
        shortAnswerSummary: 'pitching ideas and closing client deals (Q4)',
      },
      {
        id: 't1_q4_c',
        label: 'C',
        text: 'Deep, focused work on analysis, alone',
        archetypeTag: 'AN',
        shortAnswerSummary: 'deep, focused analytical work (Q4)',
      },
      {
        id: 't1_q4_d',
        label: 'D',
        text: 'Big-picture meetings mixed with fast decisions',
        archetypeTag: 'ST',
        shortAnswerSummary: 'big-picture strategy meetings with fast decisions (Q4)',
      },
    ],
  },
  {
    id: 5,
    weight: 2,
    scenarioPrompt: 'Which job would excite you most?',
    options: [
      {
        id: 't1_q5_a',
        label: 'A',
        text: 'Running processes at a large company, keeping everything on track',
        archetypeTag: 'OP',
        shortAnswerSummary: 'running large company processes on track (Q5)',
      },
      {
        id: 't1_q5_b',
        label: 'B',
        text: 'Building a new product from zero at a startup',
        archetypeTag: 'BU',
        shortAnswerSummary: 'building a product from zero at a startup (Q5)',
      },
      {
        id: 't1_q5_c',
        label: 'C',
        text: 'Improving people\'s lives at a hospital or nonprofit',
        archetypeTag: 'CO',
        shortAnswerSummary: 'improving lives at a hospital or nonprofit (Q5)',
      },
      {
        id: 't1_q5_d',
        label: 'D',
        text: 'Advising different clients on hard problems every few months',
        archetypeTag: 'ST',
        shortAnswerSummary: 'advising clients on hard problems across industries (Q5)',
      },
    ],
  },
  {
    id: 6,
    weight: 1,
    scenarioPrompt: 'In a group project, people usually ask you to:',
    options: [
      {
        id: 't1_q6_a',
        label: 'A',
        text: 'Keep the timeline and track who does what',
        archetypeTag: 'OP',
        shortAnswerSummary: 'keeping timelines and tracking project tasks (Q6)',
      },
      {
        id: 't1_q6_b',
        label: 'B',
        text: 'Check the logic and the numbers',
        archetypeTag: 'AN',
        shortAnswerSummary: 'checking logic and numbers (Q6)',
      },
      {
        id: 't1_q6_c',
        label: 'C',
        text: 'Make sure everyone feels heard',
        archetypeTag: 'CO',
        shortAnswerSummary: 'making sure all team members feel heard (Q6)',
      },
      {
        id: 't1_q6_d',
        label: 'D',
        text: 'Present the idea to the room',
        archetypeTag: 'PE',
        shortAnswerSummary: 'presenting and pitching the idea to the room (Q6)',
      },
    ],
  },
  {
    id: 7,
    weight: 1,
    scenarioPrompt: 'Which headline would you click first?',
    options: [
      {
        id: 't1_q7_a',
        label: 'A',
        text: '"Interest rates shift as markets react"',
        archetypeTag: 'AN',
        shortAnswerSummary: 'interest rate and market shifts (Q7)',
      },
      {
        id: 't1_q7_b',
        label: 'B',
        text: '"Brand wins new fans with a viral campaign"',
        archetypeTag: 'PE',
        shortAnswerSummary: 'viral brand campaigns and fan building (Q7)',
      },
      {
        id: 't1_q7_c',
        label: 'C',
        text: '"Startup raises funds to build a new product"',
        archetypeTag: 'BU',
        shortAnswerSummary: 'startups raising funds for new products (Q7)',
      },
      {
        id: 't1_q7_d',
        label: 'D',
        text: '"Hospitals test a new model of patient care"',
        archetypeTag: 'CO',
        shortAnswerSummary: 'testing new models of healthcare and community care (Q7)',
      },
    ],
  },
  {
    id: 8,
    weight: 2,
    scenarioPrompt: 'Your manager gives you a vague goal: "Make us more relevant to younger customers." You would first:',
    options: [
      {
        id: 't1_q8_a',
        label: 'A',
        text: 'Study customer data to find the gap',
        archetypeTag: 'AN',
        shortAnswerSummary: 'studying customer data to find the gap (Q8)',
      },
      {
        id: 't1_q8_b',
        label: 'B',
        text: 'Run a quick test with a small group of customers',
        archetypeTag: 'BU',
        shortAnswerSummary: 'running quick tests with a small customer group (Q8)',
      },
      {
        id: 't1_q8_c',
        label: 'C',
        text: 'Map the options and pick the best long-term bet',
        archetypeTag: 'ST',
        shortAnswerSummary: 'mapping options and picking the best long-term bet (Q8)',
      },
      {
        id: 't1_q8_d',
        label: 'D',
        text: 'Create a campaign concept and sell it to leadership',
        archetypeTag: 'PE',
        shortAnswerSummary: 'creating a campaign concept and selling it to leadership (Q8)',
      },
    ],
  },
  {
    id: 9,
    weight: 1,
    scenarioPrompt: 'Five years from now, you\'d most like to be known as:',
    options: [
      {
        id: 't1_q9_a',
        label: 'A',
        text: 'The person who makes the numbers trustworthy',
        archetypeTag: 'AN',
        shortAnswerSummary: 'making company numbers trustworthy (Q9)',
      },
      {
        id: 't1_q9_b',
        label: 'B',
        text: 'The person whose operations never break down',
        archetypeTag: 'OP',
        shortAnswerSummary: 'building operations that never break down (Q9)',
      },
      {
        id: 't1_q9_c',
        label: 'C',
        text: 'The person who built something from nothing',
        archetypeTag: 'BU',
        shortAnswerSummary: 'building something impactful from nothing (Q9)',
      },
      {
        id: 't1_q9_d',
        label: 'D',
        text: 'The person who helped people and communities thrive',
        archetypeTag: 'CO',
        shortAnswerSummary: 'helping people and communities thrive (Q9)',
      },
    ],
  },
  {
    id: 10,
    weight: 0, // Readiness, not scored for archetype points
    scenarioPrompt: 'How clear are you about which specialization fits you?',
    options: [
      {
        id: 't1_q10_a',
        label: 'A',
        text: 'Very clear, I have one area in mind',
        readinessTag: 'READY_HIGH',
        shortAnswerSummary: 'very clear on target area (Q10)',
      },
      {
        id: 't1_q10_b',
        label: 'B',
        text: 'Somewhat clear, I have two or three options',
        readinessTag: 'READY_MED',
        shortAnswerSummary: 'exploring 2-3 target options (Q10)',
      },
      {
        id: 't1_q10_c',
        label: 'C',
        text: 'Not clear, I need more information about the options',
        readinessTag: 'READY_INFO',
        shortAnswerSummary: 'seeking more information on curriculum options (Q10)',
      },
      {
        id: 't1_q10_d',
        label: 'D',
        text: 'I know my interests but doubt I can do the work',
        readinessTag: 'READY_CONF',
        shortAnswerSummary: 'interested but seeking confidence on readiness (Q10)',
      },
    ],
  },
];

export interface ArchetypeProfile {
  code: Track1ArchetypeCode;
  name: string;
  description: string;
  specializations: string[];
  risk: string;
  defaultNextStep: string;
}

// Archetype specializations in exact order as specified in requirements:
// AN: Finance, Business Analytics.
// ST: Strategy and Consulting, International Business.
// BU: Entrepreneurship, Product Management.
// PE: Marketing.
// CO: Human Resources, Healthcare Management, Sustainability and ESG.
// OP: Operations and Supply Chain, Information Systems and Technology Management.
export const ARCHETYPE_PROFILES: Record<Track1ArchetypeCode, ArchetypeProfile> = {
  AN: {
    code: 'AN',
    name: 'The Analytical Problem-Solver',
    description:
      'You make decisions with evidence, data, and rigorous financial logic. You bring clarity to complex numbers and ensure choices are grounded in objective reality.',
    specializations: ['Finance', 'Business Analytics'],
    risk: 'Over-indexing on quantitative data alone can cause you to overlook human factors, team emotions, or qualitative customer motivations.',
    defaultNextStep: 'Review core finance and analytics course syllabi and join the student investment or analytics club to start tracking recruiting timelines.',
  },
  ST: {
    code: 'ST',
    name: 'The Strategic Thinker',
    description:
      'You look at the big picture and anticipate long-term market trends before others see them. You excel at structuring ambiguous challenges into clear direction and competitive advantage.',
    specializations: ['Strategy and Consulting', 'International Business'],
    risk: 'Staying at the 30,000-foot strategic view can lead to analysis paralysis if you do not stay grounded in daily execution realities.',
    defaultNextStep: 'Begin practicing 45-minute hypothesis-driven case frameworks with peers and explore case competition entry dates.',
  },
  BU: {
    code: 'BU',
    name: 'The Pragmatic Builder',
    description:
      'You thrive on taking ideas from zero to one through rapid experimentation and tangible results. You are energized by creating new products, ventures, and practical solutions.',
    specializations: ['Entrepreneurship', 'Product Management'],
    risk: 'A natural bias for rapid testing can lead to spreading yourself too thin without enough depth in operational rigor or financial control.',
    defaultNextStep: 'Draft a one-page product or startup teardown and connect with incubator or entrepreneurship center mentors on campus.',
  },
  PE: {
    code: 'PE',
    name: 'The Persuasive Storyteller',
    description:
      'You connect with people, understand emotional motivations, and inspire action. You excel at championing ideas, closing commercial deals, and building brand resonance.',
    specializations: ['Marketing'],
    risk: 'High reliance on persuasion and intuition without enough quantitative data backing can make executive buy-in harder in numbers-driven organizations.',
    defaultNextStep: 'Study recent brand turnaround case studies and benchmark your digital storytelling and customer empathy portfolio.',
  },
  CO: {
    code: 'CO',
    name: 'The Collaborative Champion',
    description:
      'You focus on human dynamics, empathy, and collective well-being. You thrive when developing talent, fostering trust, and driving positive social or organizational impact.',
    specializations: ['Human Resources', 'Healthcare Management', 'Sustainability and ESG'],
    risk: 'Prioritizing complete consensus and emotional harmony can sometimes delay tough commercial decisions or urgent operational trade-offs.',
    defaultNextStep: 'Explore organizational behavior, healthcare operations, or ESG disclosure electives, and connect with leaders in people operations.',
  },
  OP: {
    code: 'OP',
    name: 'The Operational Mastermind',
    description:
      'You are obsessed with execution, reliable systems, and seamless workflows. You take pride in making complex operations run smoothly, on time, and without breakdowns.',
    specializations: ['Operations and Supply Chain', 'Information Systems and Technology Management'],
    risk: 'Optimizing for process efficiency and predictability can sometimes resist necessary, disruptive innovation or creative pivots.',
    defaultNextStep: 'Explore supply chain and tech systems certifications (like Six Sigma or ERP basics) and visit local logistics fulfillment hubs.',
  },
};

// Appearance order in Track 1 questions for tie-breaking:
// Q1: AN, OP, CO, BU | Q2: PE, ST
export const TRACK_1_APPEARANCE_ORDER: Track1ArchetypeCode[] = ['AN', 'OP', 'CO', 'BU', 'PE', 'ST'];

// ==========================================
// TRACK 2: DUAL SPECIALIZATION STRATEGY
// ==========================================
export const SPECIALIZATION_NAMES: Record<string, string> = {
  FIN: 'Finance',
  MKT: 'Marketing',
  HR: 'Human Resources',
  OPS: 'Operations and Supply Chain',
  ANA: 'Business Analytics',
  ENT: 'Entrepreneurship',
  STR: 'Strategy and Consulting',
  ITM: 'Information Systems and Technology Management',
  INT: 'International Business',
  HCM: 'Healthcare Management',
  ESG: 'Sustainability and ESG',
  PM: 'Product Management',
};

export const TRACK_2_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 1,
    weight: 1,
    scenarioPrompt: 'Which course have you found yourself thinking about after class?',
    options: [
      {
        id: 't2_q1_a',
        label: 'A',
        text: 'Corporate Finance',
        specTags: ['FIN'],
        shortAnswerSummary: 'Corporate Finance coursework (Q1)',
      },
      {
        id: 't2_q1_b',
        label: 'B',
        text: 'Consumer Behavior',
        specTags: ['MKT'],
        shortAnswerSummary: 'Consumer Behavior coursework (Q1)',
      },
      {
        id: 't2_q1_c',
        label: 'C',
        text: 'Operations Management',
        specTags: ['OPS'],
        shortAnswerSummary: 'Operations Management coursework (Q1)',
      },
      {
        id: 't2_q1_d',
        label: 'D',
        text: 'Data Mining and Analytics',
        specTags: ['ANA'],
        shortAnswerSummary: 'Data Mining & Analytics coursework (Q1)',
      },
    ],
  },
  {
    id: 2,
    weight: 2,
    scenarioPrompt: 'Your professor offers you a project. Which would you pick?',
    options: [
      {
        id: 't2_q2_a',
        label: 'A',
        text: 'Valuing a company that is being acquired',
        specTags: ['FIN'],
        shortAnswerSummary: 'valuing a company during acquisition (Q2)',
      },
      {
        id: 't2_q2_b',
        label: 'B',
        text: 'Relaunching a brand for a new customer group',
        specTags: ['MKT'],
        shortAnswerSummary: 'relaunching a brand for a new demographic (Q2)',
      },
      {
        id: 't2_q2_c',
        label: 'C',
        text: 'Redesigning a company\'s hiring process',
        specTags: ['HR'],
        shortAnswerSummary: 'redesigning a company hiring process (Q2)',
      },
      {
        id: 't2_q2_d',
        label: 'D',
        text: 'Building a dashboard that predicts customer churn',
        specTags: ['ANA'],
        shortAnswerSummary: 'building a predictive customer churn dashboard (Q2)',
      },
    ],
  },
  {
    id: 3,
    weight: 2,
    scenarioPrompt: 'You get two internship offers and can pick one. Which is more appealing?',
    options: [
      {
        id: 't2_q3_a',
        label: 'A',
        text: 'Product manager intern at a software company',
        specTags: ['PM'],
        shortAnswerSummary: 'product management software internship (Q3)',
      },
      {
        id: 't2_q3_b',
        label: 'B',
        text: 'Supply chain planner at a manufacturer',
        specTags: ['OPS'],
        shortAnswerSummary: 'supply chain planner manufacturing internship (Q3)',
      },
      {
        id: 't2_q3_c',
        label: 'C',
        text: 'Strategy intern on a consulting team',
        specTags: ['STR'],
        shortAnswerSummary: 'consulting strategy team internship (Q3)',
      },
      {
        id: 't2_q3_d',
        label: 'D',
        text: 'Venture intern at a startup incubator',
        specTags: ['ENT'],
        shortAnswerSummary: 'venture startup incubator internship (Q3)',
      },
    ],
  },
  {
    id: 4,
    weight: 1,
    scenarioPrompt: 'In a case competition, your team needs someone for each job. You naturally take:',
    options: [
      {
        id: 't2_q4_a',
        label: 'A',
        text: 'The numbers and valuation',
        specTags: ['FIN'],
        shortAnswerSummary: 'case competition valuation and numbers (Q4)',
      },
      {
        id: 't2_q4_b',
        label: 'B',
        text: 'The customer story and the pitch',
        specTags: ['MKT'],
        shortAnswerSummary: 'customer story and presentation pitch (Q4)',
      },
      {
        id: 't2_q4_c',
        label: 'C',
        text: 'The vendor and timeline planning',
        specTags: ['OPS'],
        shortAnswerSummary: 'vendor and delivery timeline planning (Q4)',
      },
      {
        id: 't2_q4_d',
        label: 'D',
        text: 'The team and culture plan',
        specTags: ['HR'],
        shortAnswerSummary: 'team alignment and culture planning (Q4)',
      },
    ],
  },
  {
    id: 5,
    weight: 2,
    scenarioPrompt: 'A friend is starting a company and asks for help. You\'d offer to:',
    options: [
      {
        id: 't2_q5_a',
        label: 'A',
        text: 'Build the first version and test it with users',
        specTags: ['ENT'],
        shortAnswerSummary: 'building first product version and testing with users (Q5)',
      },
      {
        id: 't2_q5_b',
        label: 'B',
        text: 'Build the pricing and fundraising model',
        specTags: ['FIN'],
        shortAnswerSummary: 'building pricing and fundraising models (Q5)',
      },
      {
        id: 't2_q5_c',
        label: 'C',
        text: 'Run user research and plan the product roadmap',
        specTags: ['PM'],
        shortAnswerSummary: 'running user research and roadmap planning (Q5)',
      },
      {
        id: 't2_q5_d',
        label: 'D',
        text: 'Plan expansion into new countries',
        specTags: ['INT'],
        shortAnswerSummary: 'planning cross-border international expansion (Q5)',
      },
    ],
  },
  {
    id: 6,
    weight: 2,
    scenarioPrompt: 'A client sends you a messy spreadsheet. Your first step:',
    options: [
      {
        id: 't2_q6_a',
        label: 'A',
        text: 'Clean the data and test trends',
        specTags: ['ANA'],
        shortAnswerSummary: 'cleaning data and statistical trend testing (Q6)',
      },
      {
        id: 't2_q6_b',
        label: 'B',
        text: 'Check the costs and reconcile the totals',
        specTags: ['FIN'],
        shortAnswerSummary: 'checking costs and reconciling balance totals (Q6)',
      },
      {
        id: 't2_q6_c',
        label: 'C',
        text: 'Work out what business question the client is really asking',
        specTags: ['STR'],
        shortAnswerSummary: 'framing the true strategic business question (Q6)',
      },
      {
        id: 't2_q6_d',
        label: 'D',
        text: 'Trace where the data came from and fix the process at the source',
        specTags: ['OPS'],
        shortAnswerSummary: 'fixing underlying process bottlenecks at the source (Q6)',
      },
    ],
  },
  {
    id: 7,
    weight: 2,
    scenarioPrompt: 'A company asks you to lead a sustainability review. You\'d focus on:',
    options: [
      {
        id: 't2_q7_a',
        label: 'A',
        text: 'The climate and social impact figures',
        specTags: ['ESG'],
        shortAnswerSummary: 'climate and social impact figures (Q7)',
      },
      {
        id: 't2_q7_b',
        label: 'B',
        text: 'Patient outcomes across a hospital network',
        specTags: ['HCM'],
        shortAnswerSummary: 'patient healthcare outcomes across hospital networks (Q7)',
      },
      {
        id: 't2_q7_c',
        label: 'C',
        text: 'Cross-border regulations and suppliers',
        specTags: ['INT'],
        shortAnswerSummary: 'cross-border supplier regulations (Q7)',
      },
      {
        id: 't2_q7_d',
        label: 'D',
        text: 'Employee training and workplace culture',
        specTags: ['HR'],
        shortAnswerSummary: 'workplace culture and employee training (Q7)',
      },
    ],
  },
  {
    id: 8,
    weight: 1,
    scenarioPrompt: 'What do you most enjoy explaining to a friend?',
    options: [
      {
        id: 't2_q8_a',
        label: 'A',
        text: 'How a company makes money and where its risks are',
        specTags: ['FIN'],
        shortAnswerSummary: 'how companies generate money and manage risk (Q8)',
      },
      {
        id: 't2_q8_b',
        label: 'B',
        text: 'Why people choose one brand over another',
        specTags: ['MKT'],
        shortAnswerSummary: 'why customers choose one brand over another (Q8)',
      },
      {
        id: 't2_q8_c',
        label: 'C',
        text: 'How technology systems fit together',
        specTags: ['ITM'],
        shortAnswerSummary: 'how technology systems and software fit together (Q8)',
      },
      {
        id: 't2_q8_d',
        label: 'D',
        text: 'How to lead a team through change',
        specTags: ['HR'],
        shortAnswerSummary: 'leading team members through change (Q8)',
      },
    ],
  },
  {
    id: 9,
    weight: 1,
    scenarioPrompt: 'Your advisor says you can add a second area. Which pair appeals to you most?',
    options: [
      {
        id: 't2_q9_a',
        label: 'A',
        text: 'Finance + Business Analytics',
        specTags: ['FIN', 'ANA'],
        pairQuality: 'PAIR_STRONG',
        shortAnswerSummary: 'preference for Finance + Business Analytics pair (Q9)',
      },
      {
        id: 't2_q9_b',
        label: 'B',
        text: 'Marketing + Entrepreneurship',
        specTags: ['MKT', 'ENT'],
        pairQuality: 'PAIR_STRONG',
        shortAnswerSummary: 'preference for Marketing + Entrepreneurship pair (Q9)',
      },
      {
        id: 't2_q9_c',
        label: 'C',
        text: 'Operations + Information Systems',
        specTags: ['OPS', 'ITM'],
        pairQuality: 'PAIR_STRONG',
        shortAnswerSummary: 'preference for Operations + Information Systems pair (Q9)',
      },
      {
        id: 't2_q9_d',
        label: 'D',
        text: 'Finance + Marketing',
        specTags: ['FIN', 'MKT'],
        pairQuality: 'PAIR_WEAK',
        shortAnswerSummary: 'preference for Finance + Marketing pair (Q9)',
      },
    ],
  },
  {
    id: 10,
    weight: 0,
    scenarioPrompt: 'You have about four courses left. Which plan feels right?',
    options: [
      {
        id: 't2_q10_a',
        label: 'A',
        text: 'Enough room for two focused areas',
        creditTag: 'CREDIT_DUAL_OK',
        shortAnswerSummary: 'ample room for two focused areas (Q10)',
      },
      {
        id: 't2_q10_b',
        label: 'B',
        text: 'One area plus electives in a related field',
        creditTag: 'CREDIT_SINGLE',
        shortAnswerSummary: 'one area plus related electives (Q10)',
      },
      {
        id: 't2_q10_c',
        label: 'C',
        text: 'Only room for one area',
        creditTag: 'CREDIT_SINGLE_TIGHT',
        shortAnswerSummary: 'only room for a single area (Q10)',
      },
      {
        id: 't2_q10_d',
        label: 'D',
        text: 'I\'m not sure yet and want to test my interest first',
        creditTag: 'READY_LOW',
        shortAnswerSummary: 'testing interest before committing (Q10)',
      },
    ],
  },
];
