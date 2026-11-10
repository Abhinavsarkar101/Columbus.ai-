export interface OptionBankItem {
  id: string;
  label: string;
  text: string;
  tags: string[]; // hidden tags
  isOther?: boolean;
}

export interface QuestionBankItem {
  id: string; // e.g. "A_Q1", "B_Q3", "D_C1", "D_AD1"
  scenario: 'A' | 'B' | 'C' | 'D';
  weight: number;
  prompt: string;
  questionType: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'RATING' | 'MULTI' | 'PICK_TWO';
  options: OptionBankItem[];
  dimension?: 'ROLE' | 'EVID' | 'TECH' | 'PRACT' | 'NET' | 'POS';
  rubricKey?: string;
  routingSetKey?: string;
}

// ==========================================
// SCENARIO A QUESTIONS
// ==========================================
export const SCENARIO_A_QUESTIONS: QuestionBankItem[] = [
  {
    id: 'A_Q1',
    scenario: 'A',
    weight: 2,
    prompt: 'You are organizing a trip for 10 friends on a fixed budget. What do you do first?',
    questionType: 'T1',
    options: [
      { id: 'A_Q1_A', label: 'A', text: 'Build a cost sheet and set a limit for each item', tags: ['AN'] },
      { id: 'A_Q1_B', label: 'B', text: 'Plan the route, timings and bookings step by step', tags: ['OP'] },
      { id: 'A_Q1_C', label: 'C', text: 'Ask everyone what they want and find a plan all of them like', tags: ['CO'] },
      { id: 'A_Q1_D', label: 'D', text: 'Try a cheap first version and adjust as you go', tags: ['BU'] },
      { id: 'A_Q1_E', label: 'E', text: 'Pitch the destination so well that everyone gets excited', tags: ['PE'] },
      { id: 'A_Q1_F', label: 'F', text: 'Compare destinations on long-term value and pick the best one', tags: ['ST'] },
    ],
  },
  {
    id: 'A_Q2',
    scenario: 'A',
    weight: 2,
    prompt: 'Which problem would you most like to spend a week solving?',
    questionType: 'T1',
    options: [
      { id: 'A_Q2_A', label: 'A', text: 'Why sales dropped in one region', tags: ['AN'] },
      { id: 'A_Q2_B', label: 'B', text: "How to grow a brand's online following", tags: ['PE', 'DIG'] },
      { id: 'A_Q2_C', label: 'C', text: 'How to make deliveries faster and cheaper', tags: ['OP'] },
      { id: 'A_Q2_D', label: 'D', text: 'Which new market to enter in the next three years', tags: ['ST'] },
      { id: 'A_Q2_E', label: 'E', text: 'How to help a team that has lost motivation', tags: ['CO'] },
      { id: 'A_Q2_F', label: 'F', text: 'How to turn a rough idea into a working product', tags: ['BU'] },
    ],
  },
  {
    id: 'A_Q3',
    scenario: 'A',
    weight: 1,
    prompt: 'Which sentence sounds most like you?',
    questionType: 'T1',
    options: [
      { id: 'A_Q3_A', label: 'A', text: '"I need the numbers before I decide."', tags: ['AN'] },
      { id: 'A_Q3_B', label: 'B', text: '"I want to hear what the people involved think."', tags: ['CO'] },
      { id: 'A_Q3_C', label: 'C', text: '"Let\'s test it small and see what happens."', tags: ['BU'] },
      { id: 'A_Q3_D', label: 'D', text: '"What does the long-term picture look like?"', tags: ['ST'] },
      { id: 'A_Q3_E', label: 'E', text: '"If the process is right, the results will follow."', tags: ['OP'] },
      { id: 'A_Q3_F', label: 'F', text: '"People buy stories, so let\'s tell a good one."', tags: ['PE'] },
    ],
  },
  {
    id: 'A_Q4',
    scenario: 'A',
    weight: 1,
    prompt: 'Your ideal workday looks most like:',
    questionType: 'T1',
    options: [
      { id: 'A_Q4_A', label: 'A', text: 'Clear targets and results you can measure', tags: ['OP'] },
      { id: 'A_Q4_B', label: 'B', text: 'Pitching ideas, meeting clients and closing deals', tags: ['PE'] },
      { id: 'A_Q4_C', label: 'C', text: 'Deep, focused analysis, mostly alone', tags: ['AN'] },
      { id: 'A_Q4_D', label: 'D', text: 'Big-picture meetings mixed with fast decisions', tags: ['ST'] },
      { id: 'A_Q4_E', label: 'E', text: 'Talking with people, solving their problems and supporting them', tags: ['CO'] },
      { id: 'A_Q4_F', label: 'F', text: 'Building something new with a small, fast team', tags: ['BU'] },
    ],
  },
  {
    id: 'A_Q5',
    scenario: 'A',
    weight: 2,
    prompt: 'Which job would excite you most?',
    questionType: 'T1',
    options: [
      { id: 'A_Q5_A', label: 'A', text: 'Running processes at a large company and keeping everything on track', tags: ['OP'] },
      { id: 'A_Q5_B', label: 'B', text: 'Building a new product from zero at a startup', tags: ['BU'] },
      { id: 'A_Q5_C', label: 'C', text: "Improving people's lives at a hospital or nonprofit", tags: ['CO'] },
      { id: 'A_Q5_D', label: 'D', text: 'Advising different clients on hard problems every few months', tags: ['ST'] },
      { id: 'A_Q5_E', label: 'E', text: 'Managing a brand or a sales team that wins customers', tags: ['PE'] },
      { id: 'A_Q5_F', label: 'F', text: 'Studying markets and money to guide investment decisions', tags: ['AN'] },
    ],
  },
  {
    id: 'A_Q6',
    scenario: 'A',
    weight: 1,
    prompt: 'In a group project, people usually ask you to:',
    questionType: 'T1',
    options: [
      { id: 'A_Q6_A', label: 'A', text: 'Keep the timeline and track who does what', tags: ['OP'] },
      { id: 'A_Q6_B', label: 'B', text: 'Check the logic and the numbers', tags: ['AN'] },
      { id: 'A_Q6_C', label: 'C', text: 'Make sure everyone feels heard', tags: ['CO'] },
      { id: 'A_Q6_D', label: 'D', text: 'Present the idea to the room', tags: ['PE'] },
      { id: 'A_Q6_E', label: 'E', text: 'Come up with the big idea and the direction', tags: ['ST'] },
      { id: 'A_Q6_F', label: 'F', text: 'Start building the first version', tags: ['BU'] },
    ],
  },
  {
    id: 'A_Q7',
    scenario: 'A',
    weight: 1,
    prompt: 'Which headline would you click first?',
    questionType: 'T1',
    options: [
      { id: 'A_Q7_A', label: 'A', text: '"Interest rates shift as markets react"', tags: ['AN'] },
      { id: 'A_Q7_B', label: 'B', text: '"Brand wins new fans with a viral online campaign"', tags: ['PE', 'DIG'] },
      { id: 'A_Q7_C', label: 'C', text: '"Startup raises funds to build a new product"', tags: ['BU'] },
      { id: 'A_Q7_D', label: 'D', text: '"Hospitals test a new model of patient care"', tags: ['CO'] },
      { id: 'A_Q7_E', label: 'E', text: '"Supply chains reroute after a port shutdown"', tags: ['OP'] },
      { id: 'A_Q7_F', label: 'F', text: '"Two countries sign a major trade deal"', tags: ['ST'] },
    ],
  },
  {
    id: 'A_Q8',
    scenario: 'A',
    weight: 2,
    prompt: 'Your manager says: "Make us more relevant to younger customers." You first:',
    questionType: 'T1',
    options: [
      { id: 'A_Q8_A', label: 'A', text: 'Study customer data to find the gap', tags: ['AN'] },
      { id: 'A_Q8_B', label: 'B', text: 'Run a quick test with a small group of customers', tags: ['BU'] },
      { id: 'A_Q8_C', label: 'C', text: 'Map the options and pick the best long-term bet', tags: ['ST'] },
      { id: 'A_Q8_D', label: 'D', text: 'Create an online campaign idea and sell it to leadership', tags: ['PE', 'DIG'] },
      { id: 'A_Q8_E', label: 'E', text: 'Talk to a few young customers and staff to understand them', tags: ['CO'] },
      { id: 'A_Q8_F', label: 'F', text: 'Check how the product and delivery process could change', tags: ['OP'] },
    ],
  },
  {
    id: 'A_Q9',
    scenario: 'A',
    weight: 1,
    prompt: "Five years from now you'd most like to be known as:",
    questionType: 'T1',
    options: [
      { id: 'A_Q9_A', label: 'A', text: 'The person who makes the numbers trustworthy', tags: ['AN'] },
      { id: 'A_Q9_B', label: 'B', text: 'The person whose operations never break down', tags: ['OP'] },
      { id: 'A_Q9_C', label: 'C', text: 'The person who built something from nothing', tags: ['BU'] },
      { id: 'A_Q9_D', label: 'D', text: 'The person who helped people and communities thrive', tags: ['CO'] },
      { id: 'A_Q9_E', label: 'E', text: 'The person who made a brand or product famous', tags: ['PE'] },
      { id: 'A_Q9_F', label: 'F', text: 'The person who sets the direction for the company', tags: ['ST'] },
    ],
  },
  {
    id: 'A_Q10',
    scenario: 'A',
    weight: 0,
    prompt: 'How clear are you about which specialization fits you?',
    questionType: 'T2',
    routingSetKey: 'A_Q10',
    options: [
      { id: 'A_Q10_A', label: 'A', text: 'Very clear, I have one area in mind', tags: ['READY_HIGH'] },
      { id: 'A_Q10_B', label: 'B', text: 'Somewhat clear, I have two or three options', tags: ['READY_MED'] },
      { id: 'A_Q10_C', label: 'C', text: 'Not clear, I need more information about the options', tags: ['READY_INFO'] },
      { id: 'A_Q10_D', label: 'D', text: 'I know my interests but doubt I can do the work', tags: ['READY_CONF'] },
    ],
  },
];

// ==========================================
// SCENARIO B QUESTIONS
// ==========================================
export const SCENARIO_B_QUESTIONS: QuestionBankItem[] = [
  {
    id: 'B_Q1',
    scenario: 'B',
    weight: 1,
    prompt: 'Which core course made you lose track of time?',
    questionType: 'T1',
    options: [
      { id: 'B_Q1_A', label: 'A', text: 'Corporate Finance or Accounting', tags: ['FIN', 'BNK'] },
      { id: 'B_Q1_B', label: 'B', text: 'Marketing or Consumer Behavior', tags: ['MKT', 'DM'] },
      { id: 'B_Q1_C', label: 'C', text: 'Operations or Supply Chain', tags: ['OPS', 'SCM'] },
      { id: 'B_Q1_D', label: 'D', text: 'Data Analytics or Statistics', tags: ['ANA', 'DSA'] },
      { id: 'B_Q1_E', label: 'E', text: 'Organizational Behavior or HR', tags: ['HR'] },
      { id: 'B_Q1_F', label: 'F', text: 'Strategy or Entrepreneurship', tags: ['STR', 'ENT'] },
      { id: 'B_Q1_G', label: 'G', text: 'Product or technology courses', tags: ['PM', 'ITM'] },
    ],
  },
  {
    id: 'B_Q2',
    scenario: 'B',
    weight: 2,
    prompt: 'A professor offers you a project. Which would you pick?',
    questionType: 'T1',
    options: [
      { id: 'B_Q2_A', label: 'A', text: 'Valuing a company that is being acquired', tags: ['FIN'] },
      { id: 'B_Q2_B', label: 'B', text: 'Planning a social media and search campaign for a new product', tags: ['DM', 'MKT'] },
      { id: 'B_Q2_C', label: 'C', text: "Redesigning a company's hiring and onboarding", tags: ['HR'] },
      { id: 'B_Q2_D', label: 'D', text: 'Building a dashboard that predicts customer churn', tags: ['ANA', 'DSA'] },
      { id: 'B_Q2_E', label: 'E', text: 'Mapping and fixing a delivery network', tags: ['SCM', 'OPS'] },
      { id: 'B_Q2_F', label: 'F', text: 'Writing a launch plan for a startup idea', tags: ['ENT', 'PM'] },
      { id: 'B_Q2_G', label: 'G', text: 'Designing a patient-flow plan for a hospital', tags: ['HCM'] },
    ],
  },
  {
    id: 'B_Q3',
    scenario: 'B',
    weight: 2,
    prompt: 'Two internship offers, pick one:',
    questionType: 'T1',
    options: [
      { id: 'B_Q3_A', label: 'A', text: 'Product intern at a software company', tags: ['PM', 'ITM'] },
      { id: 'B_Q3_B', label: 'B', text: 'Credit or risk intern at a bank or insurer', tags: ['BNK', 'FIN'] },
      { id: 'B_Q3_C', label: 'C', text: 'Strategy intern on a consulting team', tags: ['STR', 'GEN'] },
      { id: 'B_Q3_D', label: 'D', text: 'Sales or business development intern at a fast-growing company', tags: ['SAL', 'MKT'] },
      { id: 'B_Q3_E', label: 'E', text: 'Operations intern at a manufacturer or e-commerce firm', tags: ['OPS', 'RET'] },
      { id: 'B_Q3_F', label: 'F', text: 'Sustainability or CSR intern at a large company', tags: ['ESG', 'PPN'] },
      { id: 'B_Q3_G', label: 'G', text: 'HR intern in talent acquisition', tags: ['HR'] },
    ],
  },
  {
    id: 'B_Q4',
    scenario: 'B',
    weight: 1,
    prompt: 'In a case competition you naturally take:',
    questionType: 'T1',
    options: [
      { id: 'B_Q4_A', label: 'A', text: 'The numbers and valuation', tags: ['FIN', 'BNK', 'FTC'] },
      { id: 'B_Q4_B', label: 'B', text: 'The customer story and pitch', tags: ['MKT', 'DM', 'SAL'] },
      { id: 'B_Q4_C', label: 'C', text: 'Vendor, timeline and execution planning', tags: ['OPS', 'SCM', 'PRJ'] },
      { id: 'B_Q4_D', label: 'D', text: 'The data crunching and insight', tags: ['ANA', 'DSA'] },
      { id: 'B_Q4_E', label: 'E', text: 'The people and culture plan', tags: ['HR', 'PPN'] },
      { id: 'B_Q4_F', label: 'F', text: 'The big-picture recommendation', tags: ['STR', 'GEN', 'INT'] },
      { id: 'B_Q4_G', label: 'G', text: 'The market-entry or new-product idea', tags: ['ENT', 'PM', 'FAM'] },
    ],
  },
  {
    id: 'B_Q5',
    scenario: 'B',
    weight: 2,
    prompt: 'A friend is starting a company and asks for help. You offer to:',
    questionType: 'T1',
    options: [
      { id: 'B_Q5_A', label: 'A', text: 'Build the first version and test it with users', tags: ['ENT', 'PM'] },
      { id: 'B_Q5_B', label: 'B', text: 'Build the pricing and fundraising model', tags: ['FIN', 'FTC'] },
      { id: 'B_Q5_C', label: 'C', text: 'Build their brand and online presence', tags: ['DM', 'MKT'] },
      { id: 'B_Q5_D', label: 'D', text: 'Plan expansion into new countries', tags: ['INT'] },
      { id: 'B_Q5_E', label: 'E', text: 'Set up operations and suppliers', tags: ['OPS', 'SCM'] },
      { id: 'B_Q5_F', label: 'F', text: 'Hire and train the first team', tags: ['HR'] },
      { id: 'B_Q5_G', label: 'G', text: 'Set up dashboards to track growth', tags: ['ANA', 'DSA'] },
    ],
  },
  {
    id: 'B_Q6',
    scenario: 'B',
    weight: 2,
    prompt: 'A client sends you a messy spreadsheet. Your first step:',
    questionType: 'T1',
    options: [
      { id: 'B_Q6_A', label: 'A', text: 'Clean the data and test trends', tags: ['ANA', 'DSA'] },
      { id: 'B_Q6_B', label: 'B', text: 'Check costs and reconcile totals', tags: ['FIN', 'BNK'] },
      { id: 'B_Q6_C', label: 'C', text: 'Work out the real business question', tags: ['STR', 'GEN'] },
      { id: 'B_Q6_D', label: 'D', text: 'Trace where the data comes from and fix the process', tags: ['OPS', 'ITM'] },
      { id: 'B_Q6_E', label: 'E', text: 'Turn it into a quick story for the client meeting', tags: ['SAL', 'MKT'] },
      { id: 'B_Q6_F', label: 'F', text: 'Ask the people who use it what they need', tags: ['PM', 'HR'] },
    ],
  },
  {
    id: 'B_Q7',
    scenario: 'B',
    weight: 2,
    prompt: 'You are asked to lead a review in a sector you care about. Which one?',
    questionType: 'T1',
    options: [
      { id: 'B_Q7_A', label: 'A', text: 'Climate and social impact of a company', tags: ['ESG'] },
      { id: 'B_Q7_B', label: 'B', text: 'Patient outcomes across a hospital network', tags: ['HCM'] },
      { id: 'B_Q7_C', label: 'C', text: 'Cross-border rules and suppliers', tags: ['INT', 'SCM'] },
      { id: 'B_Q7_D', label: 'D', text: 'Medicine launch and distribution for a pharma company', tags: ['PHA'] },
      { id: 'B_Q7_E', label: 'E', text: 'Farm-to-market supply chain', tags: ['AGR'] },
      { id: 'B_Q7_F', label: 'F', text: 'Guest experience and revenue for hotels or an airline', tags: ['HOS'] },
      { id: 'B_Q7_G', label: 'G', text: 'Cost and timeline of a property or infrastructure project', tags: ['REI', 'PRJ'] },
      { id: 'B_Q7_H', label: 'H', text: 'Audience growth for a media or sports brand', tags: ['MED', 'DM'] },
    ],
  },
  {
    id: 'B_Q8',
    scenario: 'B',
    weight: 1,
    prompt: 'What do you most enjoy explaining to a friend?',
    questionType: 'T1',
    options: [
      { id: 'B_Q8_A', label: 'A', text: 'How a company makes money and where its risks are', tags: ['FIN', 'BNK'] },
      { id: 'B_Q8_B', label: 'B', text: 'Why people pick one brand over another', tags: ['MKT', 'DM'] },
      { id: 'B_Q8_C', label: 'C', text: 'How technology systems fit together', tags: ['ITM', 'DSA'] },
      { id: 'B_Q8_D', label: 'D', text: 'How to lead a team through change', tags: ['HR', 'GEN'] },
      { id: 'B_Q8_E', label: 'E', text: 'How a product gets to your door', tags: ['SCM', 'RET'] },
      { id: 'B_Q8_F', label: 'F', text: 'How a startup finds its first customers', tags: ['ENT', 'SAL'] },
      { id: 'B_Q8_G', label: 'G', text: 'How a government or nonprofit scheme helps people', tags: ['PPN', 'ESG', 'HCM'] },
    ],
  },
  {
    id: 'B_Q9',
    scenario: 'B',
    weight: 1,
    prompt: 'Your advisor says you can add a second area. Which pair appeals most?',
    questionType: 'T5',
    options: [
      { id: 'B_Q9_A', label: 'A', text: 'Finance + Business Analytics', tags: ['FIN', 'ANA'] },
      { id: 'B_Q9_B', label: 'B', text: 'Marketing + Entrepreneurship', tags: ['MKT', 'ENT'] },
      { id: 'B_Q9_C', label: 'C', text: 'Operations + IT and Systems', tags: ['OPS', 'ITM'] },
      { id: 'B_Q9_D', label: 'D', text: 'Digital Marketing + Business Analytics', tags: ['DM', 'ANA'] },
      { id: 'B_Q9_E', label: 'E', text: 'Strategy + International Business', tags: ['STR', 'INT'] },
      { id: 'B_Q9_F', label: 'F', text: 'Finance + Marketing', tags: ['FIN', 'MKT'] },
    ],
  },
  {
    id: 'B_Q10',
    scenario: 'B',
    weight: 0,
    prompt: 'You have about four courses left. Which plan feels right?',
    questionType: 'T2',
    routingSetKey: 'B_Q10',
    options: [
      { id: 'B_Q10_A', label: 'A', text: 'Enough room for two focused areas', tags: ['CREDIT_DUAL_OK'] },
      { id: 'B_Q10_B', label: 'B', text: 'One area plus electives in a related field', tags: ['CREDIT_SINGLE'] },
      { id: 'B_Q10_C', label: 'C', text: 'Only room for one area', tags: ['CREDIT_SINGLE_TIGHT'] },
      { id: 'B_Q10_D', label: 'D', text: "I'm not sure yet and want to test my interest first", tags: ['READY_LOW'] },
      { id: 'B_Q10_E', label: 'E', text: 'My college does not offer dual specialization', tags: ['DUAL_NOT_OFFERED'] },
    ],
  },
];

// ==========================================
// SCENARIO C QUESTIONS
// ==========================================
export const SCENARIO_C_QUESTIONS: QuestionBankItem[] = [
  {
    id: 'C_Q1',
    scenario: 'C',
    weight: 2,
    prompt: 'What kind of day-to-day work sounds best to you?',
    questionType: 'T1',
    options: [
      { id: 'C_Q1_A', label: 'A', text: 'Building models, analyzing data and finding the answer', tags: ['ANALYTIC'] },
      { id: 'C_Q1_B', label: 'B', text: 'Talking to clients, customers or stakeholders and convincing them', tags: ['CLIENT'] },
      { id: 'C_Q1_C', label: 'C', text: 'Designing and shipping something new', tags: ['BUILD'] },
      { id: 'C_Q1_D', label: 'D', text: 'Running systems, programs or teams so they work well', tags: ['OPS_PEOPLE'] },
    ],
  },
  {
    id: 'C_Q2',
    scenario: 'C',
    weight: 0,
    prompt: 'Which of these have you done before?',
    questionType: 'MULTI',
    options: [
      { id: 'C_Q2_internship', label: 'A', text: 'Internship or part-time work in this field', tags: ['EVID'] },
      { id: 'C_Q2_live_project', label: 'B', text: 'Live project, case competition or hackathon', tags: ['EVID'] },
      { id: 'C_Q2_certification', label: 'C', text: 'Certification', tags: ['EVID'] },
      { id: 'C_Q2_freelance', label: 'D', text: 'Freelance or side project with real users or clients', tags: ['EVID'] },
      { id: 'C_Q2_none', label: 'E', text: 'None yet', tags: ['NO_EVID'] },
    ],
  },
  {
    id: 'C_Q3',
    scenario: 'C',
    weight: 2,
    prompt: 'Two offers are on the table in your specialization. Which is more appealing?',
    questionType: 'T1',
    options: [
      { id: 'C_Q3_A', label: 'A', text: 'Own the analysis, forecast or report', tags: ['ANALYTIC'] },
      { id: 'C_Q3_B', label: 'B', text: 'Manage relationships with key clients or accounts', tags: ['CLIENT'] },
      { id: 'C_Q3_C', label: 'C', text: 'Launch a new product, campaign or program', tags: ['BUILD'] },
      { id: 'C_Q3_D', label: 'D', text: 'Improve how a process or team runs', tags: ['OPS_PEOPLE'] },
    ],
  },
  {
    id: 'C_Q4',
    scenario: 'C',
    weight: 0,
    prompt: 'Rate your comfort 1 (not yet) to 5 (strong):',
    questionType: 'RATING',
    options: [
      { id: 'C_Q4_data', label: '1', text: 'working with data or spreadsheets', tags: [] },
      { id: 'C_Q4_pres', label: '2', text: 'presenting to a group', tags: [] },
      { id: 'C_Q4_docs', label: '3', text: 'writing short business documents', tags: [] },
      { id: 'C_Q4_nums', label: '4', text: 'explaining numbers to non-experts', tags: [] },
      { id: 'C_Q4_deadlines', label: '5', text: 'working under tight deadlines', tags: [] },
    ],
  },
  {
    id: 'C_Q5',
    scenario: 'C',
    weight: 0,
    prompt: 'Where are you in the placement cycle?',
    questionType: 'T2',
    routingSetKey: 'C_Q5',
    options: [
      { id: 'C_Q5_A', label: 'A', text: 'Campus drive open and shortlisted for some roles', tags: ['CAMPUS_ACTIVE'] },
      { id: 'C_Q5_B', label: 'B', text: 'Campus drive coming up soon', tags: ['CAMPUS_SOON'] },
      { id: 'C_Q5_C', label: 'C', text: 'Mostly off-campus applications', tags: ['OFF_CAMPUS'] },
      { id: 'C_Q5_D', label: 'D', text: "Not sure how my college's process works", tags: ['CAMPUS_UNKNOWN'] },
    ],
  },
  {
    id: 'C_Q6',
    scenario: 'C',
    weight: 0,
    prompt: 'Which company types are you targeting?',
    questionType: 'T2',
    routingSetKey: 'C_Q6',
    options: [
      { id: 'C_Q6_A', label: 'A', text: 'Large corporates or MNCs', tags: ['TIER_LARGE'] },
      { id: 'C_Q6_B', label: 'B', text: 'Mid-size or fast-growing companies', tags: ['TIER_MID'] },
      { id: 'C_Q6_C', label: 'C', text: 'Startups', tags: ['TIER_STARTUP'] },
      { id: 'C_Q6_D', label: 'D', text: 'Consulting or financial firms', tags: ['TIER_FIRM'] },
      { id: 'C_Q6_E', label: 'E', text: 'Open to all', tags: ['TIER_ANY'] },
    ],
  },
  {
    id: 'C_Q7',
    scenario: 'C',
    weight: 0,
    prompt: 'What matters most in your first job? (Pick top two)',
    questionType: 'PICK_TWO',
    options: [
      { id: 'C_Q7_salary', label: 'A', text: 'Starting salary', tags: [] },
      { id: 'C_Q7_growth', label: 'B', text: 'Learning and growth', tags: [] },
      { id: 'C_Q7_brand', label: 'C', text: 'Brand name', tags: [] },
      { id: 'C_Q7_wlb', label: 'D', text: 'Work-life balance', tags: [] },
      { id: 'C_Q7_loc', label: 'E', text: 'Location', tags: [] },
      { id: 'C_Q7_path', label: 'F', text: 'Long-term path', tags: [] },
    ],
  },
  {
    id: 'C_Q8',
    scenario: 'C',
    weight: 0,
    prompt: 'How many mock interviews have you done in your specialization?',
    questionType: 'T2',
    routingSetKey: 'C_Q8',
    options: [
      { id: 'C_Q8_A', label: 'A', text: '0', tags: ['MOCK_0'] },
      { id: 'C_Q8_B', label: 'B', text: '1 to 2', tags: ['MOCK_1'] },
      { id: 'C_Q8_C', label: 'C', text: '3 to 5', tags: ['MOCK_3'] },
      { id: 'C_Q8_D', label: 'D', text: '6 or more', tags: ['MOCK_5'] },
    ],
  },
  {
    id: 'C_Q9',
    scenario: 'C',
    weight: 0,
    prompt: 'Which interview format worries you most?',
    questionType: 'T2',
    routingSetKey: 'C_Q9',
    options: [
      { id: 'C_Q9_A', label: 'A', text: 'Case or problem-solving', tags: ['GAP_CASE'] },
      { id: 'C_Q9_B', label: 'B', text: 'Technical or functional questions', tags: ['GAP_TECH'] },
      { id: 'C_Q9_C', label: 'C', text: 'Behavioral ("tell me about a time")', tags: ['GAP_BEHAV'] },
      { id: 'C_Q9_D', label: 'D', text: 'Group discussion', tags: ['GAP_GD'] },
      { id: 'C_Q9_E', label: 'E', text: 'No particular worry', tags: ['GAP_NONE'] },
    ],
  },
  {
    id: 'C_Q10',
    scenario: 'C',
    weight: 0,
    prompt: 'How many months until you need an offer?',
    questionType: 'T2',
    routingSetKey: 'C_Q10',
    options: [
      { id: 'C_Q10_A', label: 'A', text: 'Under 3', tags: ['URG_HIGH'] },
      { id: 'C_Q10_B', label: 'B', text: '3 to 6', tags: ['URG_MED'] },
      { id: 'C_Q10_C', label: 'C', text: 'More than 6', tags: ['URG_LOW'] },
    ],
  },
];

// ==========================================
// SCENARIO D QUESTIONS
// ==========================================
export const SCENARIO_D_CORE: QuestionBankItem[] = [
  {
    id: 'D_C1',
    scenario: 'D',
    dimension: 'ROLE',
    weight: 2,
    prompt: 'How well do you understand what this role does day to day?',
    questionType: 'T3',
    options: [
      { id: 'D_C1_A', label: 'A', text: 'I can describe the daily work and typical deliverables in detail', tags: ['HIGH'] },
      { id: 'D_C1_B', label: 'B', text: 'I know the general shape, not the details', tags: ['MED'] },
      { id: 'D_C1_C', label: 'C', text: 'I have a rough idea from articles or talks', tags: ['LOW'] },
    ],
  },
  {
    id: 'D_C2',
    scenario: 'D',
    dimension: 'EVID',
    weight: 2,
    prompt: 'Your strongest evidence for this role:',
    questionType: 'T3',
    options: [
      { id: 'D_C2_A', label: 'A', text: 'A shipped product, a closed deal or a case I analyzed end to end', tags: ['HIGH'] },
      { id: 'D_C2_B', label: 'B', text: 'A class project, competition or internship task related to the role', tags: ['MED'] },
      { id: 'D_C2_C', label: 'C', text: 'Coursework or self-study only', tags: ['LOW'] },
      { id: 'D_C2_D', label: 'D', text: 'Nothing concrete yet', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_C3',
    scenario: 'D',
    dimension: 'NET',
    weight: 1,
    prompt: 'Have you spoken with someone who holds this role now?',
    questionType: 'T3',
    options: [
      { id: 'D_C3_A', label: 'A', text: 'Yes, more than two conversations', tags: ['HIGH'] },
      { id: 'D_C3_B', label: 'B', text: 'Yes, one or two', tags: ['MED'] },
      { id: 'D_C3_C', label: 'C', text: 'No, but I can reach out', tags: ['LOW'] },
      { id: 'D_C3_D', label: 'D', text: "No, and I'm not sure how", tags: ['NONE'] },
    ],
  },
  {
    id: 'D_C4',
    scenario: 'D',
    dimension: 'PRACT',
    weight: 1,
    prompt: 'Mock interviews for this role in the last month?',
    questionType: 'T3',
    options: [
      { id: 'D_C4_A', label: 'A', text: 'Three or more', tags: ['HIGH'] },
      { id: 'D_C4_B', label: 'B', text: 'One or two', tags: ['MED'] },
      { id: 'D_C4_C', label: 'C', text: 'None', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_C5',
    scenario: 'D',
    dimension: 'PRACT',
    weight: 2,
    prompt: 'An interviewer gives you a problem outside your comfort zone. What do you do?',
    questionType: 'T3',
    options: [
      { id: 'D_C5_A', label: 'A', text: 'Break it into parts and state my assumptions before answering', tags: ['HIGH'] },
      { id: 'D_C5_B', label: 'B', text: 'Start with a best guess and adjust as I go', tags: ['MED'] },
      { id: 'D_C5_C', label: 'C', text: 'Ask for time to think before answering', tags: ['LOW'] },
    ],
  },
  {
    id: 'D_C6',
    scenario: 'D',
    dimension: 'POS',
    weight: 1,
    prompt: 'Your resume for this role is:',
    questionType: 'T3',
    options: [
      { id: 'D_C6_A', label: 'A', text: 'Tailored with quantified impact', tags: ['HIGH'] },
      { id: 'D_C6_B', label: 'B', text: 'Tailored, no numbers yet', tags: ['MED'] },
      { id: 'D_C6_C', label: 'C', text: 'Generic, needs work', tags: ['LOW'] },
      { id: 'D_C6_D', label: 'D', text: 'Not started', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_C7',
    scenario: 'D',
    weight: 0,
    prompt: 'Weeks until you start applying:',
    questionType: 'T2',
    routingSetKey: 'D_C7',
    options: [
      { id: 'D_C7_A', label: 'A', text: 'Under 4', tags: ['URG_HIGH'] },
      { id: 'D_C7_B', label: 'B', text: '4 to 8', tags: ['URG_MED'] },
      { id: 'D_C7_C', label: 'C', text: '9 to 12', tags: ['URG_LOW'] },
      { id: 'D_C7_D', label: 'D', text: 'More than 12', tags: ['URG_NONE'] },
    ],
  },
  {
    id: 'D_C8',
    scenario: 'D',
    weight: 0,
    prompt: 'Which part worries you most?',
    questionType: 'T2',
    routingSetKey: 'D_C8',
    options: [
      { id: 'D_C8_A', label: 'A', text: 'Resume screening', tags: ['GAP_RESUME'] },
      { id: 'D_C8_B', label: 'B', text: 'Technical or functional test', tags: ['GAP_TECH'] },
      { id: 'D_C8_C', label: 'C', text: 'Case or problem-solving rounds', tags: ['GAP_CASE'] },
      { id: 'D_C8_D', label: 'D', text: 'Behavioral or fit rounds', tags: ['GAP_BEHAV'] },
      { id: 'D_C8_E', label: 'E', text: 'Networking and referrals', tags: ['GAP_NET'] },
    ],
  },
];

// LEVEL BLOCKS
export const SCENARIO_D_FRESHER: QuestionBankItem[] = [
  {
    id: 'D_F1',
    scenario: 'D',
    dimension: 'EVID',
    weight: 2,
    prompt: 'Internships or live projects completed?',
    questionType: 'T3',
    options: [
      { id: 'D_F1_A', label: 'A', text: 'None', tags: ['NONE'] },
      { id: 'D_F1_B', label: 'B', text: 'One', tags: ['MED'] },
      { id: 'D_F1_C', label: 'C', text: 'Two or more', tags: ['HIGH'] },
    ],
  },
  {
    id: 'D_F2',
    scenario: 'D',
    dimension: 'EVID',
    weight: 1,
    prompt: 'Which fits your story best?',
    questionType: 'T3',
    options: [
      { id: 'D_F2_A', label: 'A', text: 'A project I led end to end', tags: ['HIGH'] },
      { id: 'D_F2_B', label: 'B', text: 'A team project with a clear personal contribution', tags: ['MED'] },
      { id: 'D_F2_C', label: 'C', text: 'Coursework only', tags: ['LOW'] },
    ],
  },
  {
    id: 'D_F3',
    scenario: 'D',
    dimension: 'POS',
    weight: 1,
    prompt: 'Are you clear on why you chose this role over others?',
    questionType: 'T3',
    options: [
      { id: 'D_F3_A', label: 'A', text: 'Yes, with specific reasons', tags: ['HIGH'] },
      { id: 'D_F3_B', label: 'B', text: 'Partly', tags: ['MED'] },
      { id: 'D_F3_C', label: 'C', text: 'Not yet', tags: ['LOW'] },
    ],
  },
];

export const SCENARIO_D_INTERN: QuestionBankItem[] = [
  {
    id: 'D_I1',
    scenario: 'D',
    dimension: 'EVID',
    weight: 2,
    prompt: 'Is your internship likely to convert to a full-time offer?',
    questionType: 'T3',
    options: [
      { id: 'D_I1_A', label: 'A', text: 'Yes, I was told so', tags: ['HIGH'] },
      { id: 'D_I1_B', label: 'B', text: 'Possibly', tags: ['MED'] },
      { id: 'D_I1_C', label: 'C', text: 'Unclear', tags: ['LOW'] },
      { id: 'D_I1_D', label: 'D', text: 'No', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_I2',
    scenario: 'D',
    dimension: 'EVID',
    weight: 2,
    prompt: 'How much have you owned?',
    questionType: 'T3',
    options: [
      { id: 'D_I2_A', label: 'A', text: 'A deliverable end to end', tags: ['HIGH'] },
      { id: 'D_I2_B', label: 'B', text: 'Supported a deliverable', tags: ['MED'] },
      { id: 'D_I2_C', label: 'C', text: 'Mostly observed', tags: ['LOW'] },
    ],
  },
  {
    id: 'D_I3',
    scenario: 'D',
    dimension: 'POS',
    weight: 1,
    prompt: 'Have you asked your manager for written feedback?',
    questionType: 'T3',
    options: [
      { id: 'D_I3_A', label: 'A', text: 'Yes, regularly', tags: ['HIGH'] },
      { id: 'D_I3_B', label: 'B', text: 'Once', tags: ['MED'] },
      { id: 'D_I3_C', label: 'C', text: 'Not yet', tags: ['LOW'] },
    ],
  },
];

export const SCENARIO_D_LATERAL: QuestionBankItem[] = [
  {
    id: 'D_L1',
    scenario: 'D',
    weight: 0,
    prompt: 'Years of relevant experience:',
    questionType: 'T2',
    options: [
      { id: 'D_L1_A', label: 'A', text: 'Under 2', tags: [] },
      { id: 'D_L1_B', label: 'B', text: '2 to 5', tags: [] },
      { id: 'D_L1_C', label: 'C', text: 'More than 5', tags: [] },
    ],
  },
  {
    id: 'D_L2',
    scenario: 'D',
    dimension: 'EVID',
    weight: 2,
    prompt: 'Your last major impact:',
    questionType: 'T3',
    options: [
      { id: 'D_L2_A', label: 'A', text: 'A measured result I drove', tags: ['HIGH'] },
      { id: 'D_L2_B', label: 'B', text: 'A contribution to a team result', tags: ['MED'] },
      { id: 'D_L2_C', label: 'C', text: "Supporting others' work", tags: ['LOW'] },
    ],
  },
  {
    id: 'D_L3',
    scenario: 'D',
    dimension: 'POS',
    weight: 1,
    prompt: 'Why this role now?',
    questionType: 'T3',
    options: [
      { id: 'D_L3_A', label: 'A', text: 'Clear growth path', tags: ['HIGH'] },
      { id: 'D_L3_B', label: 'B', text: 'Pay or title', tags: ['MED'] },
      { id: 'D_L3_C', label: 'C', text: 'Need to leave my current role', tags: ['LOW'] },
      { id: 'D_L3_D', label: 'D', text: 'Not sure yet', tags: ['NONE'] },
    ],
  },
];

// ROLE BLOCKS
export const SCENARIO_D_PM: QuestionBankItem[] = [
  {
    id: 'D_P1',
    scenario: 'D',
    dimension: 'TECH',
    weight: 2,
    prompt: 'A key product metric drops 15% in one week. First move?',
    questionType: 'T4',
    rubricKey: 'P1',
    options: [
      { id: 'D_P1_A', label: 'A', text: 'Check for tracking or data errors, then segment users', tags: ['HIGH'] },
      { id: 'D_P1_B', label: 'B', text: 'Call the team to discuss', tags: ['LOW'] },
      { id: 'D_P1_C', label: 'C', text: 'Launch a fix now', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_P2',
    scenario: 'D',
    dimension: 'TECH',
    weight: 2,
    prompt: 'A strong product-sense answer is:',
    questionType: 'T4',
    rubricKey: 'P2',
    options: [
      { id: 'D_P2_A', label: 'A', text: 'A clear user problem, options, trade-offs and a metric', tags: ['HIGH'] },
      { id: 'D_P2_B', label: 'B', text: 'A list of features', tags: ['LOW'] },
      { id: 'D_P2_C', label: 'C', text: 'A design sketch only', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_P3',
    scenario: 'D',
    dimension: 'EVID',
    weight: 1,
    prompt: 'Have you written or reviewed a product requirement document?',
    questionType: 'T3',
    options: [
      { id: 'D_P3_A', label: 'A', text: 'Yes, a full one', tags: ['HIGH'] },
      { id: 'D_P3_B', label: 'B', text: 'Partly', tags: ['MED'] },
      { id: 'D_P3_C', label: 'C', text: 'No', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_P4',
    scenario: 'D',
    dimension: 'ROLE',
    weight: 1,
    prompt: 'Can you name the metrics behind a product you use daily?',
    questionType: 'T3',
    options: [
      { id: 'D_P4_A', label: 'A', text: 'Yes, with reasons', tags: ['HIGH'] },
      { id: 'D_P4_B', label: 'B', text: 'Partly', tags: ['MED'] },
      { id: 'D_P4_C', label: 'C', text: 'No', tags: ['NONE'] },
    ],
  },
];

export const SCENARIO_D_SC: QuestionBankItem[] = [
  {
    id: 'D_S1',
    scenario: 'D',
    dimension: 'TECH',
    weight: 2,
    prompt: "A client's profit fell 20% last year. First step?",
    questionType: 'T4',
    rubricKey: 'S1',
    options: [
      { id: 'D_S1_A', label: 'A', text: 'Break profit into revenue and costs, then test each part', tags: ['HIGH'] },
      { id: 'D_S1_B', label: 'B', text: 'Look for competitor news', tags: ['LOW'] },
      { id: 'D_S1_C', label: 'C', text: 'Recommend cutting costs', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_S2',
    scenario: 'D',
    dimension: 'TECH',
    weight: 2,
    prompt: 'Quick mental math and stating assumptions aloud:',
    questionType: 'T3',
    options: [
      { id: 'D_S2_A', label: 'A', text: 'Comfortable', tags: ['HIGH'] },
      { id: 'D_S2_B', label: 'B', text: 'Practicing', tags: ['MED'] },
      { id: 'D_S2_C', label: 'C', text: 'Not yet', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_S3',
    scenario: 'D',
    dimension: 'PRACT',
    weight: 1,
    prompt: 'Structured cases practiced end to end:',
    questionType: 'T3',
    options: [
      { id: 'D_S3_A', label: 'A', text: 'Five or more', tags: ['HIGH'] },
      { id: 'D_S3_B', label: 'B', text: 'One to four', tags: ['MED'] },
      { id: 'D_S3_C', label: 'C', text: 'None', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_S4',
    scenario: 'D',
    dimension: 'POS',
    weight: 1,
    prompt: 'Can you summarize a recommendation in under 60 seconds?',
    questionType: 'T3',
    options: [
      { id: 'D_S4_A', label: 'A', text: 'Yes', tags: ['HIGH'] },
      { id: 'D_S4_B', label: 'B', text: 'With practice', tags: ['MED'] },
      { id: 'D_S4_C', label: 'C', text: 'No', tags: ['NONE'] },
    ],
  },
];

export const SCENARIO_D_IB: QuestionBankItem[] = [
  {
    id: 'D_B1',
    scenario: 'D',
    dimension: 'TECH',
    weight: 2,
    prompt: 'Which statement is correct about the three financial statements?',
    questionType: 'T4',
    rubricKey: 'B1',
    options: [
      { id: 'D_B1_A', label: 'A', text: 'Net income flows to retained earnings and cash ties to the balance sheet', tags: ['HIGH'] },
      { id: 'D_B1_B', label: 'B', text: 'They are independent', tags: ['NONE'] },
      { id: 'D_B1_C', label: 'C', text: 'Only the income statement matters', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_B2',
    scenario: 'D',
    dimension: 'TECH',
    weight: 2,
    prompt: 'EBITDA is 100 and the EBITDA multiple is 8. Enterprise value?',
    questionType: 'T4',
    rubricKey: 'B2',
    options: [
      { id: 'D_B2_A', label: 'A', text: '800', tags: ['HIGH'] },
      { id: 'D_B2_B', label: 'B', text: '80', tags: ['NONE'] },
      { id: 'D_B2_C', label: 'C', text: '1,000', tags: ['NONE'] },
      { id: 'D_B2_D', label: 'D', text: 'Not sure', tags: ['LOW'] },
    ],
  },
  {
    id: 'D_B3',
    scenario: 'D',
    dimension: 'EVID',
    weight: 1,
    prompt: 'Built a simple DCF or comparables model?',
    questionType: 'T3',
    options: [
      { id: 'D_B3_A', label: 'A', text: 'Yes, end to end', tags: ['HIGH'] },
      { id: 'D_B3_B', label: 'B', text: 'Partly', tags: ['MED'] },
      { id: 'D_B3_C', label: 'C', text: 'No', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_B4',
    scenario: 'D',
    dimension: 'ROLE',
    weight: 1,
    prompt: 'Can you name a recent deal in a sector you follow?',
    questionType: 'T3',
    options: [
      { id: 'D_B4_A', label: 'A', text: 'Yes, with key terms', tags: ['HIGH'] },
      { id: 'D_B4_B', label: 'B', text: 'Partly', tags: ['MED'] },
      { id: 'D_B4_C', label: 'C', text: 'No', tags: ['NONE'] },
    ],
  },
];

export const SCENARIO_D_GENERIC: QuestionBankItem[] = [
  {
    id: 'D_G1',
    scenario: 'D',
    weight: 0,
    prompt: "Which best describes your role's core work?",
    questionType: 'T1',
    options: [
      { id: 'D_G1_A', label: 'A', text: 'Analysis and models', tags: ['ANALYTIC'] },
      { id: 'D_G1_B', label: 'B', text: 'Clients and relationships', tags: ['CLIENT'] },
      { id: 'D_G1_C', label: 'C', text: 'Building or launching things', tags: ['BUILD'] },
      { id: 'D_G1_D', label: 'D', text: 'Running processes or teams', tags: ['OPS_PEOPLE'] },
    ],
  },
  {
    id: 'D_G2',
    scenario: 'D',
    dimension: 'EVID',
    weight: 1,
    prompt: 'Have you completed a real work sample for this role (model, campaign plan, dashboard, case, plan or code)?',
    questionType: 'T3',
    options: [
      { id: 'D_G2_A', label: 'A', text: 'Yes, complete', tags: ['HIGH'] },
      { id: 'D_G2_B', label: 'B', text: 'Partly', tags: ['MED'] },
      { id: 'D_G2_C', label: 'C', text: 'No', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_G3',
    scenario: 'D',
    dimension: 'ROLE',
    weight: 1,
    prompt: 'Can you name the 3 measures a person in this role is judged on, and why?',
    questionType: 'T3',
    options: [
      { id: 'D_G3_A', label: 'A', text: 'Yes, with reasons', tags: ['HIGH'] },
      { id: 'D_G3_B', label: 'B', text: 'Partly', tags: ['MED'] },
      { id: 'D_G3_C', label: 'C', text: 'No', tags: ['NONE'] },
    ],
  },
  {
    id: 'D_G4',
    scenario: 'D',
    dimension: 'PRACT',
    weight: 1,
    prompt: 'Role-specific interview or test practice rounds done:',
    questionType: 'T3',
    options: [
      { id: 'D_G4_A', label: 'A', text: 'Five or more', tags: ['HIGH'] },
      { id: 'D_G4_B', label: 'B', text: 'One to four', tags: ['MED'] },
      { id: 'D_G4_C', label: 'C', text: 'None', tags: ['NONE'] },
    ],
  },
];

// ADAPTIVE INSERTS (dynamic questions; each has Others; not scored)
export const ADAPTIVE_INSERTS: Record<string, QuestionBankItem> = {
  AD1: {
    id: 'D_AD1',
    scenario: 'D',
    weight: 0,
    prompt: 'What has stopped you from learning more about this role?',
    questionType: 'T2',
    options: [
      { id: 'D_AD1_A', label: 'A', text: 'Not enough time', tags: ['BLK_TIME'] },
      { id: 'D_AD1_B', label: 'B', text: "I don't know who to ask", tags: ['BLK_ACCESS'] },
      { id: 'D_AD1_C', label: 'C', text: "I'm not sure this role is right for me", tags: ['BLK_FIT'] },
      { id: 'D_AD1_D', label: 'D', text: "I don't know where to start", tags: ['BLK_START'] },
    ],
  },
  AD2: {
    id: 'D_AD2',
    scenario: 'D',
    weight: 0,
    prompt: 'Could you complete one role-related project in the next 30 days?',
    questionType: 'T2',
    options: [
      { id: 'D_AD2_A', label: 'A', text: "Yes, I know what I'd do", tags: ['PROJ_YES'] },
      { id: 'D_AD2_B', label: 'B', text: 'Yes, but I need ideas', tags: ['PROJ_IDEAS'] },
      { id: 'D_AD2_C', label: 'C', text: "No, I don't have time", tags: ['PROJ_NO'] },
    ],
  },
  AD3: {
    id: 'D_AD3',
    scenario: 'D',
    weight: 0,
    prompt: 'If your current role improved, would you still want to switch?',
    questionType: 'T2',
    options: [
      { id: 'D_AD3_A', label: 'A', text: 'Yes', tags: ['SWITCH_YES'] },
      { id: 'D_AD3_B', label: 'B', text: 'Maybe', tags: ['SWITCH_MAYBE'] },
      { id: 'D_AD3_C', label: 'C', text: 'No', tags: ['SWITCH_NO'] },
    ],
  },
};
