import { DomainId } from '../types';

export type AssessmentTrackId = 'domain_fit' | 'know_specialization' | 'know_role';
export type ExperienceLevel = 'fresher' | 'intern' | 'lateral';
export type EnrollmentStatus = 'aspiring' | 'enrolled';

export interface PersonalityArchetype {
  domain: DomainId;
  title: string;
  tagline: string;
  traits: string[];
  description: string;
  quote: string;
}

export const PERSONALITY_ARCHETYPES: Record<DomainId, PersonalityArchetype> = {
  marketing: {
    domain: 'marketing',
    title: 'The Market Storyteller',
    tagline: 'Consumer Resonance & Creative Influence',
    traits: ['Empathetic', 'Intuitive Communicator', 'Culturally Aware', 'Creative Visionary'],
    description: 'You are naturally attuned to human emotions, consumer desires, and what makes people fall in love with a product or idea. You thrive on turning ideas into compelling stories.',
    quote: 'People don’t just buy products; they buy better versions of themselves.',
  },
  product: {
    domain: 'product',
    title: 'The Product Visionary',
    tagline: 'Customer-Centric Problem Solver',
    traits: ['User-Obsessed', 'Pragmatic Builder', 'Systems Thinker', 'Curious Experimenter'],
    description: 'You get excited about crafting seamless experiences that remove daily friction for people. You naturally bridge technical possibilities with genuine human needs.',
    quote: 'Fall in love with the problem, not your solution.',
  },
  finance: {
    domain: 'finance',
    title: 'The Capital Architect',
    tagline: 'Disciplined Numbers & Risk-Adjusted Value',
    traits: ['Pragmatic', 'Mathematically Rigorous', 'Risk-Conscious', 'Long-term Steward'],
    description: 'You find clarity in numbers, profit margins, and economic trade-offs. You believe every ambitious dream must make commercial sense and yield sustainable, compounding returns.',
    quote: 'In business, cash flow is reality; everything else is an opinion.',
  },
  consulting: {
    domain: 'consulting',
    title: 'The Strategic Problem-Solver',
    tagline: 'Structured Clarity & Executive Insight',
    traits: ['Structured Thinker', 'Hypothesis-Driven', 'Fast Learner', 'Executive Synthesizer'],
    description: 'You love breaking down complex, chaotic messes into clean, structured logical buckets. You thrive when advising decision-makers on what to do next.',
    quote: 'Structure turns overwhelming ambiguity into solvable puzzles.',
  },
  hr: {
    domain: 'hr',
    title: 'The People & Culture Catalyst',
    tagline: 'Organizational Harmony & Talent Growth',
    traits: ['Empathetic Mediator', 'Culture Champion', 'Deep Listener', 'Talent Developer'],
    description: 'You believe a company is only as extraordinary as the people inside it. You naturally excel at resolving interpersonal conflicts, mentoring others, and building high-trust teams.',
    quote: 'Train people well enough so they can leave; treat them well enough so they don’t want to.',
  },
  operations: {
    domain: 'operations',
    title: 'The Execution Mastermind',
    tagline: 'Process Precision & Real-World Reliability',
    traits: ['Process-Driven', 'Relentless Problem Solver', 'Efficiency Seeker', 'Hands-on Operator'],
    description: 'You love seeing real things move smoothly in the real world. You hate wasted steps, bottlenecks, and delays, and you naturally find faster, cleaner ways to get things done.',
    quote: 'Vision without execution is hallucination.',
  },
  analytics: {
    domain: 'analytics',
    title: 'The Data Sleuth',
    tagline: 'Empirical Truth & Pattern Discovery',
    traits: ['Fact-Finder', 'Pattern Spotter', 'Skeptical of Guesses', 'Methodical Investigator'],
    description: 'You prefer cold, hard facts over loud opinions. You love uncovering hidden insights buried in data trends and testing assumptions before making big bets.',
    quote: 'Without data, you’re just another person with an opinion.',
  },
  sales_gm: {
    domain: 'sales_gm',
    title: 'The Commercial Dealmaker',
    tagline: 'Persuasive Energy & Enterprise Growth',
    traits: ['Persuasive', 'Relationship Builder', 'Goal-Driven', 'Natural Leader'],
    description: 'You have high social energy and an instinct for winning people over. You love pitching big ideas, negotiating win-win deals, and taking personal ownership of business revenue.',
    quote: 'Nothing happens in business until someone sells something.',
  },
};

export interface TrackQuestionOption {
  id: string;
  text: string;
  domainWeights?: Partial<Record<DomainId, number>>;
  roleWeights?: Record<string, number>;
  readinessPoints?: number; // 0 - 25
  traitTag?: string;
  rationale?: string;
}

export interface TrackQuestion {
  id: number;
  track: AssessmentTrackId;
  category: string;
  scenario: string;
  options: TrackQuestionOption[];
  roleIdFilter?: string; // For role-specific questions
  experienceFilter?: ExperienceLevel; // For experience level
}

// ==========================================
// TRACK 1A: ASPIRING MBA CANDIDATES ("I am about to join")
// 10 Personality & Intuitive Everyday Logic Questions (Zero Corporate Jargon)
// ==========================================
export const TRACK_1_ASPIRING_QUESTIONS: TrackQuestion[] = [
  {
    id: 1,
    track: 'domain_fit',
    category: 'Work Temperament & Energy',
    scenario: 'When you imagine your ideal workday, which of these activities gives you the biggest energy boost?',
    options: [
      {
        id: 'asp_1_mkt',
        text: 'Brainstorming creative brand campaigns, visual storytelling, or viral content that gets people talking.',
        domainWeights: { marketing: 5, sales_gm: 2 },
        traitTag: 'creative',
      },
      {
        id: 'asp_1_fin',
        text: 'Analyzing investment returns, planning financial budgets, and making smart risk-managed money bets.',
        domainWeights: { finance: 5, analytics: 2 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_1_prod',
        text: 'Designing a new digital app feature or product that solves an everyday frustration for users.',
        domainWeights: { product: 5, operations: 1 },
        traitTag: 'execution',
      },
      {
        id: 'asp_1_ops',
        text: 'Organizing a large event or logistical operation, managing schedules, and making sure everything runs like clockwork.',
        domainWeights: { operations: 5, hr: 2 },
        traitTag: 'execution',
      },
    ],
  },
  {
    id: 2,
    track: 'domain_fit',
    category: 'Group Dynamics & Crisis',
    scenario: 'A college project or team initiative is falling behind schedule and people are arguing. What is your natural instinct?',
    options: [
      {
        id: 'asp_2_hr',
        text: 'Talk with team members individually, calm personal tensions, and understand what is holding people back.',
        domainWeights: { hr: 5, consulting: 1 },
        traitTag: 'people',
      },
      {
        id: 'asp_2_cons',
        text: 'Step back, break the big problem into 3 simple milestones, cut unnecessary fluff, and structure a clear plan.',
        domainWeights: { consulting: 5, analytics: 2 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_2_sales',
        text: 'Step up as the team spokesperson, rally morale, and pitch our idea convincingly to the evaluators.',
        domainWeights: { sales_gm: 5, marketing: 2 },
        traitTag: 'commercial',
      },
      {
        id: 'asp_2_prod',
        text: 'Review the deliverable directly, prioritize what users or evaluators actually care about, and cut the rest.',
        domainWeights: { product: 4, operations: 2 },
        traitTag: 'execution',
      },
    ],
  },
  {
    id: 3,
    track: 'domain_fit',
    category: 'Curiosity & Interests',
    scenario: 'When browsing articles, YouTube videos, or podcasts, what topic catches your attention first?',
    options: [
      {
        id: 'asp_3_mkt',
        text: 'Brilliant marketing stunts, psychological tricks in advertising, and how brands build cult followings.',
        domainWeights: { marketing: 5 },
        traitTag: 'creative',
      },
      {
        id: 'asp_3_fin',
        text: 'Stock market trends, venture capital funding news, wealth building, and how companies are valued.',
        domainWeights: { finance: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_3_data',
        text: 'Fascinating data charts, infographics, statistical patterns, and uncovering hidden correlations.',
        domainWeights: { analytics: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_3_prod',
        text: 'Breakthrough tech innovations, smart smartphone app designs, and how new gadgets solve real problems.',
        domainWeights: { product: 5 },
        traitTag: 'execution',
      },
    ],
  },
  {
    id: 4,
    track: 'domain_fit',
    category: 'Startup Cafe Scenario',
    scenario: 'You and three close friends decide to start a trendy local cafe. Which responsibility would you naturally volunteer to run?',
    options: [
      {
        id: 'asp_4_mkt',
        text: 'Brand & Buzz: The name, Instagram aesthetic, opening day social campaigns, and customer community.',
        domainWeights: { marketing: 5 },
        traitTag: 'creative',
      },
      {
        id: 'asp_4_fin',
        text: 'Finance & Margins: Calculating ingredient costs, setting profitable prices, and managing monthly cash flow.',
        domainWeights: { finance: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_4_prod',
        text: 'Customer Experience: Testing menu recipes, observing customer dining feedback, and perfecting the experience.',
        domainWeights: { product: 5 },
        traitTag: 'execution',
      },
      {
        id: 'asp_4_ops',
        text: 'Supply & Kitchen Logistics: Negotiating with coffee suppliers, managing kitchen flow, and ensuring zero order delays.',
        domainWeights: { operations: 5 },
        traitTag: 'execution',
      },
    ],
  },
  {
    id: 5,
    track: 'domain_fit',
    category: 'Decision-Making Style',
    scenario: 'When facing an important personal decision with multiple options, what do you trust most?',
    options: [
      {
        id: 'asp_5_data',
        text: 'Cold, hard facts: spreadsheets, detailed comparison ratings, and pros/cons lists with weighted points.',
        domainWeights: { analytics: 4, finance: 3 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_5_cons',
        text: 'A structured decision tree: eliminating bad options first and pressure-testing the biggest risks.',
        domainWeights: { consulting: 5, operations: 2 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_5_mkt',
        text: 'My human intuition: what feels most inspiring and will create the most meaningful memories or impact.',
        domainWeights: { marketing: 4, product: 2 },
        traitTag: 'creative',
      },
      {
        id: 'asp_5_hr',
        text: 'Deep discussions with trusted mentors, friends, and family to understand how it affects everyone involved.',
        domainWeights: { hr: 5 },
        traitTag: 'people',
      },
    ],
  },
  {
    id: 6,
    track: 'domain_fit',
    category: 'Problem-Solving Satisfaction',
    scenario: 'Which of these personal achievements would give you the deepest sense of satisfaction?',
    options: [
      {
        id: 'asp_6_ops',
        text: 'Finding an ingenious shortcut that cuts a 2-hour tedious chore down to 20 smooth minutes.',
        domainWeights: { operations: 5, analytics: 2 },
        traitTag: 'execution',
      },
      {
        id: 'asp_6_sales',
        text: 'Pitching an idea to a skeptical group and convincing everyone to enthusiastically back you.',
        domainWeights: { sales_gm: 5 },
        traitTag: 'commercial',
      },
      {
        id: 'asp_6_hr',
        text: 'Mentoring someone through a difficult patch and watching their confidence soar.',
        domainWeights: { hr: 5 },
        traitTag: 'people',
      },
      {
        id: 'asp_6_prod',
        text: 'Creating something tangible that people love using every single day.',
        domainWeights: { product: 5 },
        traitTag: 'creative',
      },
    ],
  },
  {
    id: 7,
    track: 'domain_fit',
    category: 'Investment Logic',
    scenario: 'A friend asks you to invest ₹5 Lakhs ($6,000) in their new retail business. What question do you ask them first?',
    options: [
      {
        id: 'asp_7_fin',
        text: '“What are your profit margins, monthly expenses, and how quickly will I make my money back?”',
        domainWeights: { finance: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_7_mkt',
        text: '“Who is your customer, and what emotional reason will make them choose you over established competitors?”',
        domainWeights: { marketing: 5 },
        traitTag: 'creative',
      },
      {
        id: 'asp_7_cons',
        text: '“What is your unique unfair advantage, and how will you defend it once bigger players copy you?”',
        domainWeights: { consulting: 5, sales_gm: 2 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_7_prod',
        text: '“Show me your prototype or service in action—how simple and delightful is it for an ordinary user?”',
        domainWeights: { product: 5 },
        traitTag: 'execution',
      },
    ],
  },
  {
    id: 8,
    track: 'domain_fit',
    category: 'Data vs. People Preference',
    scenario: 'How do you feel about spending several hours exploring a large spreadsheet of information?',
    options: [
      {
        id: 'asp_8_data',
        text: 'I love it: finding hidden trends and answering questions with evidence feels like solving a puzzle.',
        domainWeights: { analytics: 5, finance: 2 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_8_cons',
        text: 'I enjoy it as long as I can turn the numbers into 3 clear recommendations for leadership.',
        domainWeights: { consulting: 5, sales_gm: 1 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_8_hr',
        text: 'I would much rather spend those hours talking directly with team members and solving interpersonal problems.',
        domainWeights: { hr: 5 },
        traitTag: 'people',
      },
      {
        id: 'asp_8_sales',
        text: 'I prefer using my time meeting clients, negotiating deals, and building commercial relationships.',
        domainWeights: { sales_gm: 5 },
        traitTag: 'commercial',
      },
    ],
  },
  {
    id: 9,
    track: 'domain_fit',
    category: 'Post-MBA Dream Role',
    scenario: 'Which of these post-MBA career experiences sounds most appealing to you?',
    options: [
      {
        id: 'asp_9_prod',
        text: 'Working at an innovative tech company, defining what features to build, and collaborating with designers.',
        domainWeights: { product: 5 },
        traitTag: 'execution',
      },
      {
        id: 'asp_9_cons',
        text: 'Working at a top strategy advisory firm, solving critical growth puzzles for diverse global companies.',
        domainWeights: { consulting: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_9_mkt',
        text: 'Leading brand campaigns at a consumer goods or media powerhouse that millions of people see daily.',
        domainWeights: { marketing: 5 },
        traitTag: 'creative',
      },
      {
        id: 'asp_9_fin',
        text: 'Working in high-stakes finance, evaluating corporate mergers, investment deals, and wealth growth.',
        domainWeights: { finance: 5 },
        traitTag: 'analytical',
      },
    ],
  },
  {
    id: 10,
    track: 'domain_fit',
    category: 'Long-Term Legacy',
    scenario: 'Looking back at your career 15 years from now, what would make you feel most fulfilled?',
    options: [
      {
        id: 'asp_10_prod',
        text: 'Having created products and experiences that genuinely improved the lives of millions of daily users.',
        domainWeights: { product: 5, marketing: 2 },
        traitTag: 'execution',
      },
      {
        id: 'asp_10_fin',
        text: 'Having managed immense financial capital wisely, generating strong sustainable wealth and stability.',
        domainWeights: { finance: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'asp_10_sales',
        text: 'Having built and scaled a commercial business empire from the ground up through great relationships.',
        domainWeights: { sales_gm: 5, operations: 2 },
        traitTag: 'commercial',
      },
      {
        id: 'asp_10_hr',
        text: 'Having built an inspiring, supportive company culture where thousands of employees loved coming to work.',
        domainWeights: { hr: 5 },
        traitTag: 'people',
      },
    ],
  },
];

// ==========================================
// TRACK 1B: ENROLLED MBA STUDENTS ("I have joined MBA school")
// 10 Practical, Jargon-Free Business Scenario Questions
// ==========================================
export const TRACK_1_ENROLLED_QUESTIONS: TrackQuestion[] = [
  {
    id: 101,
    track: 'domain_fit',
    category: 'Sales Slowdown & Quick Action',
    scenario: 'Your company’s sales drop unexpectedly by 15% this quarter, even though the economy is fine. What is your first reaction?',
    options: [
      {
        id: 'opt_101_mkt',
        text: 'Review customer reviews, check what competitors are advertising, and see if our messaging is missing the mark.',
        domainWeights: { marketing: 4, sales_gm: 2 },
        traitTag: 'creative',
      },
      {
        id: 'opt_101_fin',
        text: 'Examine sales numbers by product line, check profit margins, and calculate how this impacts our cash reserves.',
        domainWeights: { finance: 4, analytics: 2 },
        traitTag: 'analytical',
      },
      {
        id: 'opt_101_prod',
        text: 'Check user data to see where customers are dropping off in our purchase process and which features they are not using.',
        domainWeights: { product: 4, analytics: 2 },
        traitTag: 'execution',
      },
      {
        id: 'opt_101_cons',
        text: 'Break the problem into core drivers: is it pricing, distribution, customer churn, or product quality, and rank the causes.',
        domainWeights: { consulting: 4, operations: 1 },
        traitTag: 'analytical',
      },
    ],
  },
  {
    id: 102,
    track: 'domain_fit',
    category: 'Team Disagreements & Deadlines',
    scenario: 'The Engineering team and the Sales team are arguing over what features to launch first, and it’s stalling progress. How do you resolve this?',
    options: [
      {
        id: 'opt_102_hr',
        text: 'Host an honest discussion between the team leads to understand their personal motivations and align their goals.',
        domainWeights: { hr: 5, consulting: 1 },
        traitTag: 'people',
      },
      {
        id: 'opt_102_prod',
        text: 'Score each feature objectively based on customer demand, development effort, and business impact to decide fairly.',
        domainWeights: { product: 4, operations: 2 },
        traitTag: 'execution',
      },
      {
        id: 'opt_102_gm',
        text: 'Review which features are tied to immediate client revenue commitments and make an executive call.',
        domainWeights: { sales_gm: 4, finance: 2 },
        traitTag: 'commercial',
      },
      {
        id: 'opt_102_ops',
        text: 'Map out the delivery schedule and find ways to deliver essential parts for both teams in phases.',
        domainWeights: { operations: 4, analytics: 2 },
        traitTag: 'execution',
      },
    ],
  },
  {
    id: 103,
    track: 'domain_fit',
    category: 'Growth Budget Investment',
    scenario: 'Leadership gives your division a ₹10 Crore ($1.2M) growth budget for next year. Where would you most want to invest it?',
    options: [
      {
        id: 'opt_103_mkt',
        text: 'Major nationwide advertising, influencer storytelling, and creative customer acquisition campaigns.',
        domainWeights: { marketing: 5 },
        traitTag: 'creative',
      },
      {
        id: 'opt_103_fin',
        text: 'Acquiring a smaller profitable competitor or investing in high-yield strategic financial assets.',
        domainWeights: { finance: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'opt_103_prod',
        text: 'Hiring top software and design talent to build the next-generation version of our flagship product.',
        domainWeights: { product: 5 },
        traitTag: 'execution',
      },
      {
        id: 'opt_103_ops',
        text: 'Automating our warehouses, upgrading delivery speed, and modernizing our order tracking systems.',
        domainWeights: { operations: 5 },
        traitTag: 'execution',
      },
    ],
  },
  {
    id: 104,
    track: 'domain_fit',
    category: 'Competitor Price Cut',
    scenario: 'A major competitor cuts their price by 25% on a product similar to yours. How should your company respond?',
    options: [
      {
        id: 'opt_104_fin',
        text: 'Calculate whether we can afford to match the discount without ruining our profit margins and cash flow.',
        domainWeights: { finance: 5, analytics: 2 },
        traitTag: 'analytical',
      },
      {
        id: 'opt_104_mkt',
        text: 'Do not discount; instead, emphasize our superior quality, brand trust, and launch a customer loyalty perk.',
        domainWeights: { marketing: 5 },
        traitTag: 'creative',
      },
      {
        id: 'opt_104_prod',
        text: 'Launch a lighter, essential version of our product at an affordable price while keeping our premium product intact.',
        domainWeights: { product: 4, consulting: 2 },
        traitTag: 'execution',
      },
      {
        id: 'opt_104_gm',
        text: 'Reach out personally to our biggest corporate clients to offer dedicated customer service and multi-year contract perks.',
        domainWeights: { sales_gm: 5 },
        traitTag: 'commercial',
      },
    ],
  },
  {
    id: 105,
    track: 'domain_fit',
    category: 'Rapid Company Growth',
    scenario: 'Your company is quadrupling in team size over the next 12 months. What is the biggest danger you would watch out for?',
    options: [
      {
        id: 'opt_105_hr',
        text: 'Employee burnout, losing the original company culture, poor onboarding, and unfair pay gaps.',
        domainWeights: { hr: 5 },
        traitTag: 'people',
      },
      {
        id: 'opt_105_ops',
        text: 'Operational chaos: supplier delays, broken software tools, and missed delivery commitments.',
        domainWeights: { operations: 5 },
        traitTag: 'execution',
      },
      {
        id: 'opt_105_prod',
        text: 'Too many people debating and slowing down releases instead of quickly delivering improvements to customers.',
        domainWeights: { product: 4, analytics: 2 },
        traitTag: 'execution',
      },
      {
        id: 'opt_105_fin',
        text: 'Spending money faster than incoming sales and running out of cash before the business turns a profit.',
        domainWeights: { finance: 5 },
        traitTag: 'analytical',
      },
    ],
  },
  {
    id: 106,
    track: 'domain_fit',
    category: 'Executive Presentation Format',
    scenario: 'You are presenting your team’s recommendations to the CEO. What format do you feel most comfortable delivering?',
    options: [
      {
        id: 'opt_106_cons',
        text: 'A structured slide presentation summarizing 3 clear strategic options, pros & cons, and a recommended decision.',
        domainWeights: { consulting: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'opt_106_mkt',
        text: 'An inspiring presentation with genuine customer video feedback, emotional stories, and a vision for the future.',
        domainWeights: { marketing: 5 },
        traitTag: 'creative',
      },
      {
        id: 'opt_106_data',
        text: 'A clean interactive data dashboard showing trends, conversion rates, and evidence to prove our conclusion.',
        domainWeights: { analytics: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'opt_106_gm',
        text: 'A direct commercial summary focused on sales numbers, client deals in progress, and immediate revenue upside.',
        domainWeights: { sales_gm: 5 },
        traitTag: 'commercial',
      },
    ],
  },
  {
    id: 107,
    track: 'domain_fit',
    category: 'Supply Delay Crisis',
    scenario: 'A major transportation strike threatens to delay delivery of key products by 3 weeks before festival shopping season. What do you do?',
    options: [
      {
        id: 'opt_107_ops',
        text: 'Find alternative local suppliers immediately, arrange express freight, and re-organize warehouse shifts.',
        domainWeights: { operations: 5 },
        traitTag: 'execution',
      },
      {
        id: 'opt_107_gm',
        text: 'Communicate honestly with our top retail partners, prioritize stock for key stores, and offer solutions to avoid penalties.',
        domainWeights: { sales_gm: 4, marketing: 2 },
        traitTag: 'commercial',
      },
      {
        id: 'opt_107_fin',
        text: 'Estimate the cost of lost sales, review insurance policies, and adjust our budget to protect overall profit.',
        domainWeights: { finance: 4, analytics: 2 },
        traitTag: 'analytical',
      },
      {
        id: 'opt_107_prod',
        text: 'Update delivery dates clearly on our app/website and offer customers digital discount coupons to keep them happy.',
        domainWeights: { product: 4, analytics: 2 },
        traitTag: 'execution',
      },
    ],
  },
  {
    id: 108,
    track: 'domain_fit',
    category: 'Customer Loyalty & Retention',
    scenario: 'Customers try your product once but 40% do not come back for a second purchase. Where do you focus?',
    options: [
      {
        id: 'opt_108_prod',
        text: 'Find where the product experience feels confusing, interview customers who left, and improve the first-time setup.',
        domainWeights: { product: 5 },
        traitTag: 'execution',
      },
      {
        id: 'opt_108_mkt',
        text: 'Build an automated email and WhatsApp welcome journey with personalized tips and loyalty incentives.',
        domainWeights: { marketing: 5 },
        traitTag: 'creative',
      },
      {
        id: 'opt_108_data',
        text: 'Segment customers by demographics and purchase history to discover which specific customer groups stay vs churn.',
        domainWeights: { analytics: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'opt_108_ops',
        text: 'Check if delivery delays, packaging damage, or poor customer support response times are driving people away.',
        domainWeights: { operations: 4, hr: 2 },
        traitTag: 'execution',
      },
    ],
  },
  {
    id: 109,
    track: 'domain_fit',
    category: 'New Market Entry',
    scenario: 'Your company wants to expand into a new international region. What task would you personally love to lead?',
    options: [
      {
        id: 'opt_109_cons',
        text: 'Conducting market research on government regulations, customer spending habits, and competitor strengths.',
        domainWeights: { consulting: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'opt_109_mkt',
        text: 'Adapting the brand story, localized advertising, and social campaign to fit the new culture and humor.',
        domainWeights: { marketing: 5 },
        traitTag: 'creative',
      },
      {
        id: 'opt_109_gm',
        text: 'Flying to the region to meet potential local business partners, negotiate distribution deals, and hire the initial team.',
        domainWeights: { sales_gm: 5 },
        traitTag: 'commercial',
      },
      {
        id: 'opt_109_fin',
        text: 'Setting up foreign currency accounts, budgeting the rollout costs, and modeling when the expansion breaks even.',
        domainWeights: { finance: 5 },
        traitTag: 'analytical',
      },
    ],
  },
  {
    id: 110,
    track: 'domain_fit',
    category: 'Workplace Motivation',
    scenario: 'If you could introduce one major initiative at your company to improve performance, what would it be?',
    options: [
      {
        id: 'opt_110_hr',
        text: 'A structured mentorship and leadership development program with clear transparent promotion criteria.',
        domainWeights: { hr: 5 },
        traitTag: 'people',
      },
      {
        id: 'opt_110_prod',
        text: 'A weekly rapid experimentation hour where any employee can test a feature idea directly with real customers.',
        domainWeights: { product: 5 },
        traitTag: 'execution',
      },
      {
        id: 'opt_110_fin',
        text: 'A performance bonus and profit-sharing model that rewards teams whose projects directly increase business profitability.',
        domainWeights: { finance: 5 },
        traitTag: 'analytical',
      },
      {
        id: 'opt_110_ops',
        text: 'A streamlined workflow system that eliminates useless status meetings and automates daily repetitive reporting.',
        domainWeights: { operations: 5 },
        traitTag: 'execution',
      },
    ],
  },
];

export const TRACK_1_QUESTIONS: TrackQuestion[] = TRACK_1_ENROLLED_QUESTIONS;

// ==========================================
// TRACK 2: "I know my specialization"
// Domain-specific questionnaires to rank 2-3 target job roles
// ==========================================
export const TRACK_2_QUESTIONS: Record<DomainId, TrackQuestion[]> = {
  marketing: [
    {
      id: 201,
      track: 'know_specialization',
      category: 'Marketing Focus & Execution',
      scenario: 'Given complete creative and budget authority, which area of marketing excites you most?',
      options: [
        {
          id: 'opt_201_brand',
          text: 'Designing long-term emotional brand positioning, national television/digital campaigns, and packaging redesign.',
          roleWeights: { brand_manager: 5, category_manager: 2 },
          traitTag: 'creative',
        },
        {
          id: 'opt_201_growth',
          text: 'Running rapid A/B testing on CAC, ROAS ad spend, retargeting funnels, and viral referral loops.',
          roleWeights: { growth_marketing: 5, pmm: 2 },
          traitTag: 'analytical',
        },
        {
          id: 'opt_201_pmm',
          text: 'Collaborating with product managers on sales collateral, feature messaging, and competitive positioning.',
          roleWeights: { pmm: 5, brand_manager: 2 },
          traitTag: 'execution',
        },
        {
          id: 'opt_201_cat',
          text: 'Managing distributor margins, shelf-space share, vendor trade promotions, and retail category P&L.',
          roleWeights: { category_manager: 5, brand_manager: 1 },
          traitTag: 'commercial',
        },
      ],
    },
    {
      id: 202,
      track: 'know_specialization',
      category: 'Campaign Metrics & KPI',
      scenario: 'Your marketing budget is up for annual review. Which KPI do you insist on defending as your primary success metric?',
      options: [
        {
          id: 'opt_202_cat',
          text: 'Category Gross Margin and Nielsen offline market share across key modern trade accounts.',
          roleWeights: { category_manager: 5 },
          traitTag: 'commercial',
        },
        {
          id: 'opt_202_brand',
          text: 'Brand equity, aided/unaided consumer recall, and net brand favorability scores.',
          roleWeights: { brand_manager: 5 },
          traitTag: 'creative',
        },
        {
          id: 'opt_202_growth',
          text: 'Blended Customer Acquisition Cost (CAC), payback period in months, and LTV-to-CAC ratio.',
          roleWeights: { growth_marketing: 5 },
          traitTag: 'analytical',
        },
        {
          id: 'opt_202_pmm',
          text: 'Sales enablement win-rate, pipeline velocity for new product launches, and product feature adoption.',
          roleWeights: { pmm: 5 },
          traitTag: 'execution',
        },
      ],
    },
    {
      id: 203,
      track: 'know_specialization',
      category: 'Day-to-Day Stakeholder Dynamics',
      scenario: 'Which cross-functional partner group would you prefer spending 40% of your working hours collaborating with?',
      options: [
        {
          id: 'opt_203_brand',
          text: 'Creative advertising agencies, media buying houses, and consumer research focus groups.',
          roleWeights: { brand_manager: 5 },
          traitTag: 'creative',
        },
        {
          id: 'opt_203_pmm',
          text: 'Product managers, engineering leads, enterprise account executives, and industry analysts.',
          roleWeights: { pmm: 5 },
          traitTag: 'execution',
        },
        {
          id: 'opt_203_cat',
          text: 'Supply chain planners, regional distribution managers, FMCG retailers, and pricing teams.',
          roleWeights: { category_manager: 5 },
          traitTag: 'commercial',
        },
        {
          id: 'opt_203_growth',
          text: 'Data scientists, performance marketers, conversion rate optimization (CRO) engineers, and paid media buyers.',
          roleWeights: { growth_marketing: 5 },
          traitTag: 'analytical',
        },
      ],
    },
  ],
  product: [
    {
      id: 211,
      track: 'know_specialization',
      category: 'Product Problem Preference',
      scenario: 'Which type of product challenge sounds most fulfilling to tackle as your core responsibility?',
      options: [
        {
          id: 'opt_211_core',
          text: 'Owning the end-to-end user workflow, PRD feature specs, wireframes, and sprint backlog with engineering pods.',
          roleWeights: { product_manager: 5 },
          traitTag: 'execution',
        },
        {
          id: 'opt_211_growth',
          text: 'Optimizing checkout drop-offs, testing onboarding funnels, referral loops, and driving organic user acquisition.',
          roleWeights: { growth_marketing: 4, product_manager: 3 },
          traitTag: 'analytical',
        },
        {
          id: 'opt_211_pmm',
          text: 'Positioning complex technical software, defining tier pricing, and training sales teams on competitive differentiation.',
          roleWeights: { pmm: 5, product_manager: 2 },
          traitTag: 'commercial',
        },
        {
          id: 'opt_211_data',
          text: 'Designing algorithmic recommendations, automated decision models, and data pipelines for platform scale.',
          roleWeights: { data_analyst: 5, product_manager: 2 },
          traitTag: 'analytical',
        },
      ],
    },
    {
      id: 212,
      track: 'know_specialization',
      category: 'Product Roadmap Trade-Off',
      scenario: 'You have only enough developer bandwidth for one major initiative this quarter. Which do you champion?',
      options: [
        {
          id: 'opt_212_core',
          text: 'Fix core technical debt and redesign the navigation to make everyday workflows 35% faster for existing power users.',
          roleWeights: { product_manager: 5 },
          traitTag: 'execution',
        },
        {
          id: 'opt_212_pmm',
          text: 'Build an enterprise compliance and SSO integration requested by 3 prospective million-dollar annual contract clients.',
          roleWeights: { pmm: 4, product_manager: 3 },
          traitTag: 'commercial',
        },
        {
          id: 'opt_212_growth',
          text: 'Build a viral social invitation flow that can increase viral coefficient (K-factor) from 0.7 to 1.2.',
          roleWeights: { growth_marketing: 5 },
          traitTag: 'analytical',
        },
      ],
    },
  ],
  consulting: [
    {
      id: 221,
      track: 'know_specialization',
      category: 'Advisory Project Profile',
      scenario: 'Which client engagement would you prefer leading as an MBA consultant?',
      options: [
        {
          id: 'opt_221_strat',
          text: 'Corporate strategy: evaluating a multi-billion dollar M&A acquisition and defining the 5-year portfolio vision for the CEO.',
          roleWeights: { management_consultant: 5 },
          traitTag: 'analytical',
        },
        {
          id: 'opt_221_ops',
          text: 'Operational transformation: restructuring the procurement and shop-floor logistics of a heavy manufacturing client.',
          roleWeights: { operations_manager: 4, management_consultant: 3 },
          traitTag: 'execution',
        },
        {
          id: 'opt_221_corp',
          text: 'Internal corporate strategy: working directly under the Chief Strategy Officer of a Fortune 500 company on market entry.',
          roleWeights: { corporate_strategy: 5, management_consultant: 2 },
          traitTag: 'commercial',
        },
      ],
    },
    {
      id: 222,
      track: 'know_specialization',
      category: 'Consulting Lifestyle & Travel',
      scenario: 'How do you view intense client travel and high-pressure slide-deck deadlines?',
      options: [
        {
          id: 'opt_222_ext',
          text: 'Thrive on it: high variety across industries every 3-6 months and executive exposure is worth the demanding hours.',
          roleWeights: { management_consultant: 5 },
          traitTag: 'analytical',
        },
        {
          id: 'opt_222_in',
          text: 'Prefer internal corporate strategy: deep ownership of one industry where I can see strategic plans actually executed over years.',
          roleWeights: { corporate_strategy: 5 },
          traitTag: 'commercial',
        },
      ],
    },
  ],
  finance: [
    {
      id: 231,
      track: 'know_specialization',
      category: 'Finance Domain Inclination',
      scenario: 'Which financial environment aligns with your career ambition?',
      options: [
        {
          id: 'opt_231_ib',
          text: 'Fast-paced transaction dealmaking: financial modeling (LBO/DCF), pitch books, M&A due diligence, and capital market IPOs.',
          roleWeights: { investment_banker: 5 },
          traitTag: 'analytical',
        },
        {
          id: 'opt_231_fpa',
          text: 'Corporate operating finance: managing business unit budgets, annual operating plans (AOP), variance analysis, and cash forecasting.',
          roleWeights: { financial_analyst: 5 },
          traitTag: 'execution',
        },
        {
          id: 'opt_231_corp',
          text: 'Strategic investments: evaluating venture/startup investments, joint-venture partnerships, and long-term capital allocation.',
          roleWeights: { corporate_strategy: 4, investment_banker: 3 },
          traitTag: 'commercial',
        },
      ],
    },
  ],
  operations: [
    {
      id: 241,
      track: 'know_specialization',
      category: 'Operations Environment',
      scenario: 'Where do you see yourself delivering the highest operational impact?',
      options: [
        {
          id: 'opt_241_scm',
          text: 'E-commerce and quick commerce fulfilment: dark store throughput, delivery routing, and real-time inventory replenishment.',
          roleWeights: { operations_manager: 5, category_manager: 2 },
          traitTag: 'execution',
        },
        {
          id: 'opt_241_proc',
          text: 'Strategic sourcing & global procurement: vendor contract negotiation, hedging raw material costs, and supplier diversification.',
          roleWeights: { operations_manager: 4, category_manager: 3 },
          traitTag: 'commercial',
        },
      ],
    },
  ],
  analytics: [
    {
      id: 251,
      track: 'know_specialization',
      category: 'Analytics & Decision Engineering',
      scenario: 'Which analytical contribution best matches your day-to-day sweet spot?',
      options: [
        {
          id: 'opt_251_bi',
          text: 'Writing advanced SQL, building automated executive Tableau/PowerBI dashboards, and finding actionable revenue trends.',
          roleWeights: { data_analyst: 5 },
          traitTag: 'analytical',
        },
        {
          id: 'opt_251_growth',
          text: 'Designing multivariate statistical experiments, conversion funnel attribution models, and algorithmic personalization.',
          roleWeights: { growth_marketing: 4, data_analyst: 3 },
          traitTag: 'execution',
        },
      ],
    },
  ],
  hr: [
    {
      id: 261,
      track: 'know_specialization',
      category: 'Human Resources Specialization',
      scenario: 'Which people leadership domain would you be most passionate about leading?',
      options: [
        {
          id: 'opt_261_hrbp',
          text: 'Strategic HR Business Partner (HRBP): working directly with business unit executives on org design, talent retention, and leadership succession.',
          roleWeights: { hrbp: 5 },
          traitTag: 'people',
        },
        {
          id: 'opt_261_ta',
          text: 'Talent Acquisition & Employer Branding: scaling engineering/business hiring, campus placement relations, and executive search.',
          roleWeights: { talent_acquisition: 5 },
          traitTag: 'people',
        },
      ],
    },
  ],
  sales_gm: [
    {
      id: 271,
      track: 'know_specialization',
      category: 'Commercial Leadership Style',
      scenario: 'How do you prefer driving commercial business growth?',
      options: [
        {
          id: 'opt_271_b2b',
          text: 'High-value Enterprise B2B Sales: managing multi-million dollar annual contracts, complex RFP bids, and executive client relationships.',
          roleWeights: { b2b_sales_lead: 5 },
          traitTag: 'commercial',
        },
        {
          id: 'opt_271_gm',
          text: 'General Management / P&L Trainee: rotating across marketing, supply chain, and retail sales to lead a regional business territory.',
          roleWeights: { general_management: 5 },
          traitTag: 'execution',
        },
      ],
    },
  ],
};

// ==========================================
// TRACK 3: "I know the role I want"
// Role Readiness Reality Check (Adaptive by Experience Level)
// ==========================================
export const TRACK_3_QUESTIONS: Record<ExperienceLevel, TrackQuestion[]> = {
  fresher: [
    {
      id: 301,
      track: 'know_role',
      category: 'Foundational Aptitude (Fresher)',
      scenario: 'You are on your first week in this role and your manager hands you a messy, contradictory spreadsheet of client data with a 4-hour turnaround. How do you handle it?',
      options: [
        {
          id: 'opt_301_a',
          text: 'Quickly clean the data with sanity checks, document any assumptions explicitly in bullet points, and present a structured 80/20 summary with clear caveats.',
          readinessPoints: 25,
          rationale: 'Demonstrates strong 80/20 commercial prioritization and professional accountability.',
        },
        {
          id: 'opt_301_b',
          text: 'Spend the first 3 hours trying to manually reconcile every single anomaly before telling your manager you need more time.',
          readinessPoints: 10,
          rationale: 'Perfectionism without communication creates delivery risk on real campus projects.',
        },
        {
          id: 'opt_301_c',
          text: 'Immediately schedule a 30-minute meeting with your manager to ask them to explain every column before starting.',
          readinessPoints: 8,
          rationale: 'Shows low initiative; junior hires are expected to perform basic discovery first.',
        },
        {
          id: 'opt_301_d',
          text: 'Use standard formulas to calculate averages without checking for outliers or verifying data integrity.',
          readinessPoints: 5,
          rationale: 'Dangerous in finance and consulting cases where outliers distort conclusions.',
        },
      ],
    },
    {
      id: 302,
      track: 'know_role',
      category: 'Interview Case Communication (Fresher)',
      scenario: 'In a campus placement interview case round, the interviewer challenges your core assumption and states that your calculated market size is unrealistically high. How do you respond?',
      options: [
        {
          id: 'opt_302_a',
          text: 'Acknowledge the interviewer’s critique calmly, walk them transparently through the specific driver that inflated the estimate, and stress-test the number with a sensitivity range.',
          readinessPoints: 25,
          rationale: 'Coachability and structured sensitivity analysis are the exact traits interviewers look for.',
        },
        {
          id: 'opt_302_b',
          text: 'Defend your number aggressively by citing general industry stats from memory to prove you were correct.',
          readinessPoints: 5,
          rationale: 'Defensiveness is an immediate red flag in partner rounds.',
        },
        {
          id: 'opt_302_c',
          text: 'Immediately apologize, discard your entire framework, and ask the interviewer what number they would like you to use.',
          readinessPoints: 10,
          rationale: 'Shows lack of conviction and inability to think independently under stress.',
        },
      ],
    },
    {
      id: 303,
      track: 'know_role',
      category: 'Learning Velocity & Tool Literacy (Fresher)',
      scenario: 'The role requires working with a software tool or quantitative framework you have never used in college. How do you prepare?',
      options: [
        {
          id: 'opt_303_a',
          text: 'Complete an intensive hands-on sandbox project over the weekend, build a template for the team, and ask senior peers targeted questions on real edge cases.',
          readinessPoints: 25,
          rationale: 'Proactive hands-on velocity separates top 5% candidates from average applicants.',
        },
        {
          id: 'opt_303_b',
          text: 'Wait for formal HR company training to be scheduled after you join.',
          readinessPoints: 5,
          rationale: 'Slow adoption leads to early performance scrutiny during probation.',
        },
      ],
    },
  ],
  intern: [
    {
      id: 311,
      track: 'know_role',
      category: 'Cross-Functional Execution (Intern Experience)',
      scenario: 'During your summer internship, a client partner changes project specifications midway through the sprint. How do you manage the delivery timeline?',
      options: [
        {
          id: 'opt_311_a',
          text: 'Conduct rapid impact triage: assess scope delta on key milestones, communicate revised trade-offs to senior leadership, and propose a phased v1 deliverable.',
          readinessPoints: 25,
          rationale: 'Shows mature scope-management and executive expectation setting.',
        },
        {
          id: 'opt_311_b',
          text: 'Agree to all client changes verbally, work 18-hour days without telling anyone, and risk delivering a buggy end-product.',
          readinessPoints: 8,
          rationale: 'Hero culture without transparency leads to burnout and quality collapse.',
        },
        {
          id: 'opt_311_c',
          text: 'Refuse the change request outright and cite the original signed project charter.',
          readinessPoints: 10,
          rationale: 'Rigid bureaucracy damages client relationships in consultative roles.',
        },
      ],
    },
    {
      id: 312,
      track: 'know_role',
      category: 'Quantifiable Deliverable Ownership (Intern Experience)',
      scenario: 'You are preparing your final summer internship presentation for the leadership committee to secure a Pre-Placement Offer (PPO). What do you highlight?',
      options: [
        {
          id: 'opt_312_a',
          text: 'Lead with measurable business impact (cost saved, conversion % uplift, time reduced), followed by the framework built and long-term recommendations for the team.',
          readinessPoints: 25,
          rationale: 'PPO decisions are driven by proven ROI and long-term organizational value.',
        },
        {
          id: 'opt_312_b',
          text: 'List all the meetings attended, documents written, and books read during the two-month internship.',
          readinessPoints: 5,
          rationale: 'Activity is not impact; leadership committees judge quantifiable outcomes.',
        },
      ],
    },
    {
      id: 313,
      track: 'know_role',
      category: 'Stakeholder Influence (Intern Experience)',
      scenario: 'A senior cross-functional manager refuses to share data needed for your core deliverable. How do you resolve this?',
      options: [
        {
          id: 'opt_313_a',
          text: 'Understand their bandwidth constraints, explain how your deliverable directly solves one of their quarterly headaches, and offer a pre-formatted template to minimize their effort.',
          readinessPoints: 25,
          rationale: 'Empathy-driven influence without authority is the hallmark of effective MBA leaders.',
        },
        {
          id: 'opt_313_b',
          text: 'Escalate immediately to your vice president and complain about their lack of cooperation.',
          readinessPoints: 8,
          rationale: 'Damages interpersonal goodwill and reveals immature conflict resolution skills.',
        },
      ],
    },
  ],
  lateral: [
    {
      id: 321,
      track: 'know_role',
      category: 'Strategic Trade-offs & P&L (Lateral / Experienced)',
      scenario: 'As a post-MBA lateral hire leading a product or business territory, you must hit an aggressive quarterly EBITDA target while competitor venture capital is subsidizing pricing by 30%. What is your playbook?',
      options: [
        {
          id: 'opt_321_a',
          text: 'Segment customer tiers ruthlessly: double down on high-retention enterprise accounts with proprietary SLA features, sunset unprofitable low-margin cohorts, and protect cash margins.',
          readinessPoints: 25,
          rationale: 'Exhibits seasoned commercial maturity and unit-economic discipline under competitive pressure.',
        },
        {
          id: 'opt_321_b',
          text: 'Enter a price war by matching competitor discounts across the board to defend raw vanity user counts.',
          readinessPoints: 5,
          rationale: 'Burning margin in unsustainable price wars destroys enterprise value.',
        },
      ],
    },
    {
      id: 322,
      track: 'know_role',
      category: 'Organizational Leadership & Mentorship (Lateral)',
      scenario: 'You inherit an underperforming team with low morale and high attrition. What is your 30-day intervention?',
      options: [
        {
          id: 'opt_322_a',
          text: 'Conduct deep 1-on-1 discovery to diagnose friction points, eliminate bureaucratic blockers, set crystal-clear OKRs with transparent ownership, and deliver a quick symbolic win.',
          readinessPoints: 25,
          rationale: 'Rebuilds psychological safety, clarifies accountability, and generates immediate team momentum.',
        },
        {
          id: 'opt_322_b',
          text: 'Issue formal PIP performance warnings to the bottom 50% of the team within your first two weeks.',
          readinessPoints: 8,
          rationale: 'Aggressive punitive management accelerates key talent flight before diagnosing systemic issues.',
        },
      ],
    },
    {
      id: 323,
      track: 'know_role',
      category: 'Executive Sponsorship & Board Alignment (Lateral)',
      scenario: 'Your project experiences a critical failure that impacts client operations. How do you brief the executive sponsor?',
      options: [
        {
          id: 'opt_323_a',
          text: 'Deliver a concise 3-part debrief: root cause diagnosis without finger-pointing, immediate remediation actions deployed, and systemic prevention controls instituted with timelines.',
          readinessPoints: 25,
          rationale: 'Executive sponsors value radical accountability and preventive systemic solutions.',
        },
        {
          id: 'opt_323_b',
          text: 'Minimize the severity of the issue and hope client operations recover before the board meeting.',
          readinessPoints: 2,
          rationale: 'Hiding critical operational failure is fatal to an executive career.',
        },
      ],
    },
  ],
};

// ==========================================
// DUAL SPECIALIZATION SYNERGY MATRIX
// ==========================================
export interface DualSpecializationPairing {
  primary: DomainId;
  secondary: DomainId;
  title: string;
  tagline: string;
  synergyRationale: string;
  targetRoles: string[];
  campusAdvantage: string;
}

export function getDualSpecializationRecommendation(topDomain: DomainId, secondDomain: DomainId): DualSpecializationPairing {
  const key = `${topDomain}_${secondDomain}`;

  const PAIRINGS: Record<string, Partial<DualSpecializationPairing>> = {
    marketing_analytics: {
      title: 'Marketing & Brand Strategy + Business Analytics',
      tagline: 'The Modern MarTech & Quantitative Growth Leader',
      synergyRationale: 'Combines consumer psychology and brand storytelling with rigorous statistical experimentation, SQL modeling, and conversion optimization.',
      targetRoles: ['Growth Marketing Manager', 'Product Marketing Manager', 'Consumer Insights Lead'],
      campusAdvantage: 'High demand in tech unicorns, D2C retail, and FMCG digital verticals where CMOs demand ROI-driven accountability.',
    },
    marketing_product: {
      title: 'Marketing & Brand Strategy + Product Management',
      tagline: 'The Commercial Product & GTM Powerhouse',
      synergyRationale: 'Bridges deep user empathy and market positioning with product feature roadmapping and sprint execution.',
      targetRoles: ['Product Marketing Manager (PMM)', 'Product Manager', 'Category Manager'],
      campusAdvantage: 'Top recruiters seek candidates who can not only build software but also drive viral user adoption and enterprise sales enablement.',
    },
    finance_consulting: {
      title: 'Corporate Finance + Management Consulting',
      tagline: 'The Strategic M&A and Corporate Advisory Powerhouse',
      synergyRationale: 'Merges rigorous 3-statement financial modeling (LBO/DCF) with structured Pyramid Principle strategic advisory.',
      targetRoles: ['Strategy Consultant', 'Corporate Development Associate', 'Investment Banker'],
      campusAdvantage: 'Gold standard profile for Tier-1 strategy firms (McKinsey, BCG, Bain) and Private Equity portfolio operations.',
    },
    finance_analytics: {
      title: 'Corporate Finance + Business Analytics & FinTech',
      tagline: 'The Quantitative Finance & Algorithmic Strategist',
      synergyRationale: 'Unites balance-sheet acumen with large-scale data manipulation, risk modeling, and automated financial forecasting.',
      targetRoles: ['Financial Analyst / FP&A', 'Risk Modeling Associate', 'FinTech Product Lead'],
      campusAdvantage: 'Exceptional leverage in global investment banks, quant funds, and corporate treasury teams seeking automated reporting.',
    },
    product_analytics: {
      title: 'Product Management + Business Analytics',
      tagline: 'The Metric-Obsessed Technical Product Leader',
      synergyRationale: 'Enables PRD authoring grounded in real telemetry, cohort retention modeling, and predictive user behavior analysis.',
      targetRoles: ['Technical Product Manager', 'Data Product Manager', 'Growth Product Manager'],
      campusAdvantage: 'Commanding advantage in big-tech shortlists where candidates must ace technical architecture and SQL data rounds.',
    },
    operations_analytics: {
      title: 'Operations & Supply Chain + Business Analytics',
      tagline: 'The Supply Chain Digitization & Logistics Architect',
      synergyRationale: 'Integrates dark-store fulfillment, inventory turns, and warehouse logistics with predictive demand forecasting.',
      targetRoles: ['Operations Manager', 'Supply Chain Analytics Lead', 'Category Manager'],
      campusAdvantage: 'Critical requirement in quick commerce, Amazon supply chain networks, and manufacturing operations.',
    },
    hr_consulting: {
      title: 'Human Resources + Management Consulting',
      tagline: 'The Organizational Transformation & People Strategist',
      synergyRationale: 'Combines talent acquisition, executive compensation, and leadership development with enterprise change management.',
      targetRoles: ['HR Business Partner (HRBP)', 'Human Capital Consultant', 'Org Design Strategist'],
      campusAdvantage: 'Prized by Big-4 advisory practices (Deloitte Human Capital, Mercer) and high-growth scale-ups scaling from 200 to 1,000 headcount.',
    },
  };

  const found = PAIRINGS[key] || PAIRINGS[`${secondDomain}_${topDomain}`];
  if (found) {
    return {
      primary: topDomain,
      secondary: secondDomain,
      title: found.title || `${topDomain} + ${secondDomain}`,
      tagline: found.tagline || 'Strategic Cross-Functional Leadership',
      synergyRationale: found.synergyRationale || 'Combines strategic domain knowledge with complementary operational and analytical execution skills.',
      targetRoles: found.targetRoles || ['Specialized Functional Lead', 'Cross-Functional Strategy Associate'],
      campusAdvantage: found.campusAdvantage || 'Provides candidates with strong defensibility in campus shortlists across diverse company profiles.',
    };
  }

  return {
    primary: topDomain,
    secondary: secondDomain,
    title: `${topDomain.toUpperCase()} & ${secondDomain.toUpperCase()}`,
    tagline: 'Interdisciplinary Management Leadership',
    synergyRationale: `Combines core strengths in ${topDomain} with complementary capabilities in ${secondDomain}, giving you flexibility across both specialized functional and general management roles.`,
    targetRoles: ['Management Trainee / General Management', 'Functional Specialist', 'Strategic Project Lead'],
    campusAdvantage: 'Allows you to target two independent recruiter pools during campus placement season, doubling your interview shortlist odds.',
  };
}
