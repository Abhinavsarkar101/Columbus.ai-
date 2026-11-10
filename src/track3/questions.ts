import { CompetencyKey, DomainId, Track3Question } from './types';
import { TAG_MAP } from './tags';

interface RawQuestionDef {
  id: string;
  competencies: CompetencyKey[];
  domain: DomainId | 'shared';
  tags: string[];
  text: string;
  options: { text: string; score: 1 | 2 | 3 | 4 }[];
}

const RAW_SHARED_QUESTIONS: RawQuestionDef[] = [
  {
    id: 'sh_1',
    competencies: ['analytical', 'problemSolving'],
    domain: 'shared',
    tags: [],
    text: 'A vendor decision is due Friday. Data on the two vendors is incomplete and partly conflicting. What do you do?',
    options: [
      { text: 'Choose the cheaper vendor because cost is the most trusted number', score: 2 },
      { text: 'List knowns and unknowns, state assumptions, pick the option that holds under most of them, and set a review date', score: 4 },
      { text: 'Request the one missing data point that matters most, then decide by Friday', score: 3 },
      { text: 'Go with the vendor the most senior person prefers', score: 1 },
    ],
  },
  {
    id: 'sh_2',
    competencies: ['execution', 'business'],
    domain: 'shared',
    tags: [],
    text: "Your manager asks you to cut a project's cost by 10% without moving the launch date. What do you do first?",
    options: [
      { text: 'Remove the items that are quickest to cut', score: 2 },
      { text: 'Break costs into drivers, rank savings against launch impact, and propose cuts with their trade-offs', score: 4 },
      { text: 'Ask the team where they see waste and review their suggestions', score: 3 },
      { text: 'Say 10% is not possible', score: 1 },
    ],
  },
  {
    id: 'sh_3',
    competencies: ['communication', 'influence'],
    domain: 'shared',
    tags: [],
    text: 'A senior colleague publicly disagrees with your recommendation in a meeting. What do you do?',
    options: [
      { text: 'Keep adding detail until they agree', score: 2 },
      { text: 'Ask what concerns them most, address it with evidence, and agree a next step', score: 4 },
      { text: 'Offer a short comparison of both views after the meeting', score: 3 },
      { text: 'Drop your recommendation to avoid conflict', score: 1 },
    ],
  },
  {
    id: 'sh_4',
    competencies: ['learning', 'execution'],
    domain: 'shared',
    tags: [],
    text: 'A client noticed errors in your last report. What do you do?',
    options: [
      { text: 'Explain the circumstances that led to the errors', score: 2 },
      { text: 'Correct the errors and carry on', score: 3 },
      { text: 'Correct them, find the root cause, add a check, and tell your manager what changed', score: 4 },
      { text: 'Check whether others got similar feedback', score: 1 },
    ],
  },
];

const RAW_DOMAIN_QUESTIONS: RawQuestionDef[] = [
  // PRODUCT & TECH
  {
    id: 'pt_1',
    competencies: ['analytical', 'problemSolving'],
    domain: 'product-tech',
    tags: ['metrics', 'growth-retention'],
    text: 'Daily active users fell 12% week over week. What do you do first?',
    options: [
      { text: 'Send a win-back push notification', score: 1 },
      { text: 'Validate tracking, then segment by platform, version and cohort', score: 4 },
      { text: 'Review recent releases and incidents, then pick hypotheses', score: 3 },
      { text: 'Wait another week in case it is noise', score: 2 },
    ],
  },
  {
    id: 'pt_2',
    competencies: ['business', 'problemSolving'],
    domain: 'product-tech',
    tags: ['prioritisation', 'product-strategy'],
    text: 'You have one engineering slot. Feature A is requested by your biggest customer (15% of revenue); Feature B modestly helps 60% of users. What do you do?',
    options: [
      { text: 'Build A because the biggest customer matters most', score: 2 },
      { text: 'Build B because it reaches more users', score: 3 },
      { text: 'Ask leadership to choose', score: 1 },
      { text: 'Compare reach, impact, effort and fit, test whether A can be scoped down, then explain the trade-off', score: 4 },
    ],
  },
  {
    id: 'pt_3',
    competencies: ['analytical', 'learning'],
    domain: 'product-tech',
    tags: ['experiments', 'metrics'],
    text: 'An A/B test planned for two weeks shows the variant up 8% after three days. What do you do?',
    options: [
      { text: 'Ship it now since the result is positive', score: 1 },
      { text: 'Ship to 50% of users and keep testing', score: 2 },
      { text: 'Keep running to the planned sample size, then decide while checking guardrail metrics', score: 4 },
      { text: 'Check guardrail metrics now but let the test continue', score: 3 },
    ],
  },
  {
    id: 'pt_4',
    competencies: ['communication', 'influence'],
    domain: 'product-tech',
    tags: ['stakeholders', 'eng-collab'],
    text: 'Engineering estimates six weeks for a feature sales promised in two. What do you do first?',
    options: [
      { text: 'Ask engineers to find a way to do it in two weeks', score: 2 },
      { text: 'Tell sales to renegotiate with the customer', score: 1 },
      { text: 'Accept six weeks and inform the customer', score: 3 },
      { text: 'Understand the estimate drivers, find a smaller scope for two weeks, and reset expectations with sales', score: 4 },
    ],
  },
  {
    id: 'pt_5',
    competencies: ['analytical', 'communication'],
    domain: 'product-tech',
    tags: ['discovery', 'ux-design'],
    text: 'Five interviewed users ask for a feature, but few use a similar existing one. What do you do?',
    options: [
      { text: 'Build it because users asked', score: 1 },
      { text: 'Drop the idea because usage data says no', score: 2 },
      { text: 'Survey more users to confirm demand', score: 3 },
      { text: 'Find out why the existing feature is unused, define the user need, and test a prototype', score: 4 },
    ],
  },
  {
    id: 'pt_6',
    competencies: ['business', 'analytical'],
    domain: 'product-tech',
    tags: ['pricing', 'product-strategy'],
    text: 'You want to raise a subscription price by 15%. How do you test it?',
    options: [
      { text: 'Test on a new-customer cohort against a control, measuring conversion, churn and revenue per user', score: 4 },
      { text: 'Raise it for everyone and watch churn', score: 1 },
      { text: 'Survey users on willingness to pay', score: 3 },
      { text: "Match the nearest competitor's price", score: 2 },
    ],
  },
  {
    id: 'pt_7',
    competencies: ['business', 'execution'],
    domain: 'product-tech',
    tags: ['go-to-market', 'competitive-analysis'],
    text: 'Three weeks before launch, a competitor announces a similar feature. What do you do?',
    options: [
      { text: 'Launch unchanged', score: 2 },
      { text: 'Delay and add features to match theirs', score: 2 },
      { text: 'Call a few customers to learn if it changes their needs, then adjust', score: 3 },
      { text: 'Revisit positioning, adjust messaging, and keep the date unless the gap is critical', score: 4 },
    ],
  },
  {
    id: 'pt_8',
    competencies: ['execution', 'problemSolving'],
    domain: 'product-tech',
    tags: ['agile-delivery', 'eng-collab'],
    text: 'Three of eight sprint stories will not finish. What do you do?',
    options: [
      { text: 'Ask the team to work weekends', score: 1 },
      { text: 'Quietly extend the sprint by two days', score: 2 },
      { text: 'Carry them over and note it in the retro', score: 3 },
      { text: 'Re-rank by value, split or drop the lowest, tell stakeholders what slips, and review in the retro', score: 4 },
    ],
  },
  {
    id: 'pt_9',
    competencies: ['analytical', 'communication'],
    domain: 'product-tech',
    tags: ['tech-literacy', 'metrics'],
    text: 'A feature needs data your system does not store, and engineers say it needs a risky database change. What do you do?',
    options: [
      { text: 'Insist the change is simple', score: 1 },
      { text: 'Drop the feature', score: 2 },
      { text: 'Leave the decision to engineering', score: 2 },
      { text: 'Ask for cost, risk and alternatives such as approximate data or a phased rollout, then weigh against value', score: 4 },
    ],
  },
  {
    id: 'pt_10',
    competencies: ['business', 'influence'],
    domain: 'product-tech',
    tags: ['product-strategy', 'stakeholders'],
    text: 'Your CEO wants an AI feature because competitors have one, but you see weak user need. What do you do?',
    options: [
      { text: 'Build it as asked', score: 2 },
      { text: 'Add it to the roadmap and run user research alongside', score: 3 },
      { text: 'Ask what outcome the CEO wants, share evidence on user need, and propose a small validation test', score: 4 },
      { text: 'Refuse to build it', score: 1 },
    ],
  },

  // FINANCE & CONSULTING
  {
    id: 'fc_1',
    competencies: ['analytical', 'problemSolving'],
    domain: 'finance-consulting',
    tags: ['problem-structuring', 'competitive-strategy'],
    text: "A client's market share fell from 20% to 14% in three years. How do you structure the problem?",
    options: [
      { text: 'Recommend a price cut', score: 1 },
      { text: 'Separate market change from share loss, then split share loss by segment, competitor and product', score: 4 },
      { text: 'List everything that could have gone wrong', score: 2 },
      { text: 'Interview customers first', score: 3 },
    ],
  },
  {
    id: 'fc_2',
    competencies: ['analytical', 'business'],
    domain: 'finance-consulting',
    tags: ['market-sizing'],
    text: 'Estimate annual demand for electric scooters in a city of 10 million. What is your approach?',
    options: [
      { text: 'Take 1% of the population', score: 1 },
      { text: 'Start from population, narrow to likely users, apply adoption and purchase cycle, then sanity-check bottom-up', score: 4 },
      { text: "Scale a global report's figure by population", score: 3 },
      { text: 'Guess from a similar city', score: 2 },
    ],
  },
  {
    id: 'fc_3',
    competencies: ['communication', 'influence'],
    domain: 'finance-consulting',
    tags: ['client-recommendations'],
    text: 'You must tell a client its favourite project should not proceed. How do you present it?',
    options: [
      { text: 'Walk through all the analysis first and conclude last', score: 3 },
      { text: 'Soften it so it does not sound like a no', score: 1 },
      { text: 'Lead with the answer, show evidence, address likely objections, and offer an alternative', score: 4 },
      { text: 'Email the report without a meeting', score: 2 },
    ],
  },
  {
    id: 'fc_4',
    competencies: ['analytical', 'business'],
    domain: 'finance-consulting',
    tags: ['valuation', 'capital-structure'],
    text: "Interest rates rise. All else equal, what happens to a company's DCF value?",
    options: [
      { text: 'It rises because inflation lifts revenue', score: 1 },
      { text: 'It falls only if the company has debt', score: 3 },
      { text: 'No change because operating cash flows are unchanged', score: 2 },
      { text: 'It falls, as a higher discount rate lowers present value, especially of terminal value', score: 4 },
    ],
  },
  {
    id: 'fc_5',
    competencies: ['analytical', 'problemSolving'],
    domain: 'finance-consulting',
    tags: ['financial-statements', 'financial-modelling'],
    text: "A company's EBITDA margin fell three points. What do you check first?",
    options: [
      { text: 'Cash balance', score: 1 },
      { text: "Competitors' margins only", score: 2 },
      { text: 'Ask management to explain', score: 3 },
      { text: 'Revenue, then gross margin, then operating costs, separating one-offs from trends', score: 4 },
    ],
  },
  {
    id: 'fc_6',
    competencies: ['execution', 'communication'],
    domain: 'finance-consulting',
    tags: ['deal-execution', 'financial-modelling'],
    text: "At 11 pm before a deadline you find an inconsistency in the model's outputs. What do you do?",
    options: [
      { text: 'Fix it quietly and send', score: 2 },
      { text: 'Send as is with a note that you will check later', score: 1 },
      { text: 'Tell your lead and ask for more time without investigating', score: 3 },
      { text: 'Trace the source, fix it, rerun checks, and tell your lead what changed', score: 4 },
    ],
  },
  {
    id: 'fc_7',
    competencies: ['analytical', 'business'],
    domain: 'finance-consulting',
    tags: ['forecasting'],
    text: 'How do you forecast two years of revenue for a subscription business?',
    options: [
      { text: "Apply last year's growth rate", score: 2 },
      { text: "Use management's target", score: 1 },
      { text: 'Use the industry average growth rate', score: 2 },
      { text: 'Model customers, new adds, churn and price, with base, upside and downside scenarios', score: 4 },
    ],
  },
  {
    id: 'fc_8',
    competencies: ['problemSolving', 'business'],
    domain: 'finance-consulting',
    tags: ['variance-budgeting'],
    text: 'A department is 15% over budget at quarter end. What do you do first?',
    options: [
      { text: 'Ask the department to cut spending', score: 1 },
      { text: 'Reforecast the budget to match actuals', score: 2 },
      { text: 'Report the variance with a first cut by category and a plan to investigate', score: 3 },
      { text: 'Split the variance into timing, volume, price and one-offs, find causes with owners, then recommend', score: 4 },
    ],
  },
  {
    id: 'fc_9',
    competencies: ['analytical', 'problemSolving'],
    domain: 'finance-consulting',
    tags: ['risk-assessment', 'due-diligence'],
    text: "In due diligence you find the target's largest customer (30% of revenue) has a contract expiring in six months. What do you do?",
    options: [
      { text: 'Assume customers usually renew', score: 1 },
      { text: 'Recommend walking away', score: 2 },
      { text: 'Request the contract and history from management and include it in the report', score: 3 },
      { text: 'Flag it as a key risk, assess renewal likelihood, model the downside, and propose protections such as an earn-out', score: 4 },
    ],
  },
  {
    id: 'fc_10',
    competencies: ['business', 'analytical'],
    domain: 'finance-consulting',
    tags: ['market-entry', 'competitive-strategy'],
    text: 'A client wants to enter a new country. What do you answer first?',
    options: [
      { text: 'What is the market size?', score: 3 },
      { text: 'Is the market attractive, and can we win given our capabilities and cost to enter?', score: 4 },
      { text: 'Which city should the office be in?', score: 1 },
      { text: 'Can we find a local partner?', score: 2 },
    ],
  },
  {
    id: 'fc_11',
    competencies: ['analytical', 'execution'],
    domain: 'finance-consulting',
    tags: ['equity-research', 'financial-statements'],
    text: 'You must quickly form a view on a listed company. What sequence do you follow?',
    options: [
      { text: 'Read the latest news and form a view', score: 2 },
      { text: 'Check the P/E ratio and decide', score: 2 },
      { text: "Copy a broker's target price", score: 1 },
      { text: 'Understand the business model, check statement trends, compare peers and valuation, then state the view and key risks', score: 4 },
    ],
  },

  // MARKETING & GROWTH
  {
    id: 'mg_1',
    competencies: ['analytical', 'business'],
    domain: 'marketing-growth',
    tags: ['brand-positioning', 'brand-measurement'],
    text: 'A campaign lifted awareness by 20 points but purchase intent is flat. What do you do?',
    options: [
      { text: 'Increase spend to lift awareness further', score: 1 },
      { text: 'Declare success on awareness', score: 2 },
      { text: 'Change the creative message straight away', score: 3 },
      { text: 'Diagnose the funnel for message relevance, audience and friction at consideration, and test before changing', score: 4 },
    ],
  },
  {
    id: 'mg_2',
    competencies: ['analytical', 'communication'],
    domain: 'marketing-growth',
    tags: ['brand-measurement', 'marketing-analytics'],
    text: 'You cannot run a clean A/B test on a TV campaign. How do you measure impact?',
    options: [
      { text: 'Compare sales before and after', score: 2 },
      { text: 'Use matched markets or a geo holdout with a brand-lift survey, and state the limits', score: 4 },
      { text: 'Count social media mentions', score: 1 },
      { text: 'Compare with last year, adjusting for seasonality and other activity', score: 3 },
    ],
  },
  {
    id: 'mg_3',
    competencies: ['analytical', 'influence'],
    domain: 'marketing-growth',
    tags: ['consumer-insight', 'segmentation-targeting'],
    text: 'You launch a product with a small budget. How do you choose the target audience?',
    options: [
      { text: 'Target everyone', score: 1 },
      { text: 'Pick the largest segment', score: 2 },
      { text: 'Pick the segment where early customer interviews show the strongest need', score: 3 },
      { text: 'Segment by need, size and reachability, choose the best fit, and validate with small tests', score: 4 },
    ],
  },
  {
    id: 'mg_4',
    competencies: ['analytical', 'execution'],
    domain: 'marketing-growth',
    tags: ['paid-search', 'marketing-analytics'],
    text: 'Paid search cost per acquisition rose 30% this month. What do you check, in what order?',
    options: [
      { text: 'Raise bids', score: 1 },
      { text: 'Pause all campaigns', score: 2 },
      { text: 'Look at keyword-level changes', score: 3 },
      { text: 'Verify tracking, then auction and quality score, then landing-page conversion and audience shifts', score: 4 },
    ],
  },
  {
    id: 'mg_5',
    competencies: ['business', 'problemSolving'],
    domain: 'marketing-growth',
    tags: ['budget-allocation', 'media-planning'],
    text: 'How do you split a fixed monthly budget across search, social and email?',
    options: [
      { text: 'Equal split', score: 1 },
      { text: "Use last year's split", score: 2 },
      { text: 'Put it all on the channel with the highest ROAS today', score: 3 },
      { text: 'Allocate by marginal return and incrementality, and keep a test budget', score: 4 },
    ],
  },
  {
    id: 'mg_6',
    competencies: ['learning', 'execution'],
    domain: 'marketing-growth',
    tags: ['experimentation'],
    text: 'Your A/B test shows no significant difference. What do you do?',
    options: [
      { text: 'Declare the variant the winner because the trend is positive', score: 1 },
      { text: 'Run it until it turns significant', score: 2 },
      { text: 'Report no effect and move on', score: 3 },
      { text: 'Check power and sample size, revisit the hypothesis, record the learning, and decide the next test', score: 4 },
    ],
  },
  {
    id: 'mg_7',
    competencies: ['communication', 'execution'],
    domain: 'marketing-growth',
    tags: ['content-strategy', 'seo'],
    text: 'How do you choose content topics for the quarter?',
    options: [
      { text: 'Whatever the team likes', score: 1 },
      { text: 'Post trending topics', score: 2 },
      { text: 'Benchmark competitors and fill gaps', score: 3 },
      { text: 'Start from search demand and funnel stage, map to goals, set metrics, and review at six weeks', score: 4 },
    ],
  },
  {
    id: 'mg_8',
    competencies: ['influence', 'execution'],
    domain: 'marketing-growth',
    tags: ['product-marketing', 'campaign-planning'],
    text: 'Sales says your messaging does not match what customers ask. What do you do?',
    options: [
      { text: 'Defend the messaging', score: 1 },
      { text: 'Let sales write their own', score: 2 },
      { text: 'Share more training slides', score: 3 },
      { text: 'Review call recordings and win-loss data, test revised messaging with sales, and measure results', score: 4 },
    ],
  },
  {
    id: 'mg_9',
    competencies: ['analytical', 'execution'],
    domain: 'marketing-growth',
    tags: ['conversion-funnel', 'email-crm'],
    text: 'Signups are steady but activation has fallen. Where do you look first?',
    options: [
      { text: 'Increase top-of-funnel spend', score: 1 },
      { text: 'Email all users a discount', score: 2 },
      { text: 'Interview users who dropped off', score: 3 },
      { text: 'Compare cohorts and onboarding steps to find the drop, check recent changes, then test fixes', score: 4 },
    ],
  },
  {
    id: 'mg_10',
    competencies: ['communication', 'business'],
    domain: 'marketing-growth',
    tags: ['social-media', 'paid-social'],
    text: 'A brand post gets heavy negative backlash on social media. What do you do first?',
    options: [
      { text: 'Delete negative comments', score: 1 },
      { text: 'Issue a quick apology without checking facts', score: 2 },
      { text: 'Pause scheduled posts and wait', score: 3 },
      { text: 'Assess scale and validity, pause posts, respond openly, fix it if wrong, and align internally', score: 4 },
    ],
  },

  // OPERATIONS & ANALYTICS
  {
    id: 'oa_1',
    competencies: ['analytical', 'execution'],
    domain: 'operations-analytics',
    tags: ['data-cleaning'],
    text: 'A key column has 8% missing values and some duplicate rows. What do you do?',
    options: [
      { text: 'Delete all rows with missing values', score: 1 },
      { text: 'Proceed and mention a caveat', score: 2 },
      { text: 'Fill the gaps with averages', score: 3 },
      { text: 'Find why values are missing, dedupe on a defined key, choose to impute, flag or exclude, and document it', score: 4 },
    ],
  },
  {
    id: 'oa_2',
    competencies: ['analytical', 'business'],
    domain: 'operations-analytics',
    tags: ['kpi-definition'],
    text: 'Sales rose 8% but profit fell. How do you explain the gap?',
    options: [
      { text: 'Say it is unusual and report both', score: 1 },
      { text: 'Blame cost inflation', score: 2 },
      { text: 'Check only the biggest product', score: 3 },
      { text: 'Break it into volume, price, mix, discount and cost effects by segment', score: 4 },
    ],
  },
  {
    id: 'oa_3',
    competencies: ['analytical', 'execution'],
    domain: 'operations-analytics',
    tags: ['sql'],
    text: 'You need customers who bought in January but not February. Which approach is right?',
    options: [
      { text: 'Inner join the January and February tables', score: 1 },
      { text: 'Count January buyers minus February buyers', score: 2 },
      { text: 'Export both and compare manually', score: 3 },
      { text: 'Take January buyers and left join February buyers, keeping rows with no match', score: 4 },
    ],
  },
  {
    id: 'oa_4',
    competencies: ['influence', 'communication'],
    domain: 'operations-analytics',
    tags: ['insight-communication', 'dashboards-visualisation'],
    text: 'Your analysis shows a popular initiative is not working. How do you present it?',
    options: [
      { text: 'Lead with the finding and recommendation, one clear chart, and method and confidence stated', score: 4 },
      { text: 'Share a 30-slide deck with all findings', score: 2 },
      { text: 'Soften the conclusion', score: 1 },
      { text: 'Share with the owner privately first, then with leadership including their input', score: 3 },
    ],
  },
  {
    id: 'oa_5',
    competencies: ['analytical', 'communication'],
    domain: 'operations-analytics',
    tags: ['dashboards-visualisation'],
    text: 'Which chart best shows monthly revenue over two years for three regions?',
    options: [
      { text: 'A pie chart per month', score: 1 },
      { text: 'A line chart with one line per region', score: 4 },
      { text: 'A 3D stacked column chart', score: 2 },
      { text: 'A table of numbers', score: 3 },
    ],
  },
  {
    id: 'oa_6',
    competencies: ['execution', 'problemSolving'],
    domain: 'operations-analytics',
    tags: ['inventory-management'],
    text: 'How do you reduce inventory holding cost without more stockouts?',
    options: [
      { text: 'Cut order quantities across the board', score: 1 },
      { text: 'Raise safety stock on everything', score: 2 },
      { text: 'Cut stock on slow movers and keep fast movers', score: 3 },
      { text: 'Segment items (ABC/XYZ), set safety stock by demand variability and service level, and improve forecasts and lead times', score: 4 },
    ],
  },
  {
    id: 'oa_7',
    competencies: ['execution', 'problemSolving'],
    domain: 'operations-analytics',
    tags: ['supplier-management', 'logistics-transport'],
    text: 'A key supplier is two weeks late and your line is at risk. What do you do in the first 48 hours?',
    options: [
      { text: 'Wait for supplier updates', score: 1 },
      { text: 'Switch supplier permanently', score: 2 },
      { text: 'Reschedule production to items with stock and inform sales', score: 3 },
      { text: 'Confirm impact and stock cover, get a firm date, expedite or find alternates, prioritise orders, and update stakeholders', score: 4 },
    ],
  },
  {
    id: 'oa_8',
    competencies: ['analytical', 'business'],
    domain: 'operations-analytics',
    tags: ['procurement-negotiation'],
    text: 'A supplier offers 5% off for a three-year contract. How do you evaluate it?',
    options: [
      { text: 'Accept, since a saving is a saving', score: 1 },
      { text: 'Reject because three years is too long', score: 2 },
      { text: 'Ask for the same discount on a shorter term', score: 3 },
      { text: 'Compare total cost against demand forecasts, flexibility, quality, supplier risk and alternatives, then negotiate terms', score: 4 },
    ],
  },
  {
    id: 'oa_9',
    competencies: ['execution', 'learning'],
    domain: 'operations-analytics',
    tags: ['process-improvement', 'quality-management', 'capacity-planning'],
    text: 'A delivery process misses its service level 20% of the time. How do you improve it?',
    options: [
      { text: 'Change the service level target', score: 1 },
      { text: 'Add more staff', score: 2 },
      { text: 'Retrain staff', score: 3 },
      { text: 'Map the process, measure a baseline, find bottlenecks and causes, pilot a fix, and remeasure', score: 4 },
    ],
  },
  {
    id: 'oa_10',
    competencies: ['analytical', 'execution'],
    domain: 'operations-analytics',
    tags: ['demand-forecasting', 'statistics'],
    text: 'Demand forecasts are consistently 25% too high. What do you do?',
    options: [
      { text: 'Cut all forecasts by 25%', score: 2 },
      { text: 'Ask sales to resubmit', score: 2 },
      { text: "Use last year's sales", score: 3 },
      { text: 'Separate bias from random error, find the source (promotions, new products, data), adjust the method, and track accuracy', score: 4 },
    ],
  },
  {
    id: 'oa_11',
    competencies: ['execution', 'influence'],
    domain: 'operations-analytics',
    tags: ['project-management', 'logistics-transport'],
    text: 'A warehouse move is slipping and teams blame each other. What do you do?',
    options: [
      { text: 'Take over tasks yourself', score: 1 },
      { text: 'Escalate to management', score: 2 },
      { text: 'Add buffer to the deadline', score: 3 },
      { text: 'Reset on the critical path with clear owners and dependencies, hold short daily check-ins, and communicate the plan', score: 4 },
    ],
  },

  // SALES & BUSINESS DEVELOPMENT
  {
    id: 'sb_1',
    competencies: ['influence', 'problemSolving'],
    domain: 'sales-bd',
    tags: ['stakeholder-mapping', 'closing'],
    text: 'A large deal has stalled at procurement. What do you do?',
    options: [
      { text: 'Offer a big discount', score: 1 },
      { text: 'Follow up weekly', score: 2 },
      { text: 'Ask your champion to involve an executive sponsor', score: 3 },
      { text: 'Map decision-makers and blockers, arm your champion with a business case, and agree a mutual action plan', score: 4 },
    ],
  },
  {
    id: 'sb_2',
    competencies: ['analytical', 'business'],
    domain: 'sales-bd',
    tags: ['sales-forecasting', 'pipeline-management'],
    text: 'How do you build a sales forecast you can trust?',
    options: [
      { text: 'Sum all deal values', score: 1 },
      { text: 'Use last quarter plus 10%', score: 2 },
      { text: 'Weight the pipeline by rep-assigned probabilities', score: 3 },
      { text: 'Use historical stage conversion, check pipeline coverage and deal age, enforce stage criteria, and track accuracy', score: 4 },
    ],
  },
  {
    id: 'sb_3',
    competencies: ['influence', 'business'],
    domain: 'sales-bd',
    tags: ['negotiation', 'pricing-discounting'],
    text: 'A customer asks for a 25% discount. What do you do?',
    options: [
      { text: 'Agree to close the deal', score: 1 },
      { text: 'Offer 10% straight away', score: 2 },
      { text: 'Say you cannot go that low and ask about their budget', score: 3 },
      { text: 'Learn the reason, trade any concession for volume, term or payment, and know your floor', score: 4 },
    ],
  },
  {
    id: 'sb_4',
    competencies: ['execution', 'business'],
    domain: 'sales-bd',
    tags: ['prospecting', 'territory-planning'],
    text: 'You inherit a territory you have never worked. How do you start?',
    options: [
      { text: 'Cold-call everyone', score: 2 },
      { text: 'Wait for marketing leads', score: 1 },
      { text: 'Start with accounts you know', score: 3 },
      { text: 'Define the ideal customer, size the territory, tier accounts, plan outreach by tier, and track conversion', score: 4 },
    ],
  },
  {
    id: 'sb_5',
    competencies: ['communication', 'analytical'],
    domain: 'sales-bd',
    tags: ['discovery-calls', 'qualification'],
    text: 'On a first call, a prospect says "just send pricing". What do you do?',
    options: [
      { text: 'Send pricing and follow up later', score: 2 },
      { text: 'Send a brochure', score: 1 },
      { text: 'Send pricing with a question about their timeline and budget', score: 3 },
      { text: 'Ask about need, timeline, budget and decision process so a tailored proposal fits', score: 4 },
    ],
  },
  {
    id: 'sb_6',
    competencies: ['influence', 'learning'],
    domain: 'sales-bd',
    tags: ['objection-handling'],
    text: 'A customer says a competitor is cheaper. What do you do?',
    options: [
      { text: 'Match the price', score: 1 },
      { text: 'State that the price is fixed', score: 2 },
      { text: 'Offer a pilot to prove value', score: 3 },
      { text: 'Ask what they are comparing, show value on what matters to them, and back it with references', score: 4 },
    ],
  },
  {
    id: 'sb_7',
    competencies: ['execution', 'learning'],
    domain: 'sales-bd',
    tags: ['pipeline-management'],
    text: 'You missed quota by 20%. What do you do?',
    options: [
      { text: 'Blame the market', score: 1 },
      { text: 'Work longer hours', score: 2 },
      { text: 'Focus only on bigger deals', score: 3 },
      { text: 'Analyse the funnel by stage for volume, conversion, deal size and cycle, find the cause, plan changes, and seek coaching', score: 4 },
    ],
  },
  {
    id: 'sb_8',
    competencies: ['business', 'influence'],
    domain: 'sales-bd',
    tags: ['account-management', 'customer-success-renewals'],
    text: 'A key account\'s renewal is at risk because usage is low. What do you do?',
    options: [
      { text: 'Wait for the renewal date and offer a discount', score: 1 },
      { text: 'Send more training emails', score: 2 },
      { text: 'Ask customer success for an adoption review', score: 3 },
      { text: 'Meet users and sponsor, find blockers, build an adoption plan, show realised value, then discuss renewal', score: 4 },
    ],
  },
  {
    id: 'sb_9',
    competencies: ['influence', 'business'],
    domain: 'sales-bd',
    tags: ['partnerships'],
    text: 'You are assessing a potential channel partner. What matters most?',
    options: [
      { text: 'Their brand name', score: 1 },
      { text: 'Their size alone', score: 2 },
      { text: 'Start with a limited pilot', score: 3 },
      { text: 'Strategic fit, access to target customers, capacity, economics for both sides, and clear success metrics', score: 4 },
    ],
  },

  // PEOPLE (HR & TALENT)
  {
    id: 'pe_1',
    competencies: ['problemSolving', 'business'],
    domain: 'people',
    tags: ['screening-shortlisting', 'structured-interviewing'],
    text: 'You have 30 applicants and three interview slots. How do you shortlist?',
    options: [
      { text: 'Pick the first three received', score: 1 },
      { text: 'Pick candidates from top colleges', score: 2 },
      { text: 'Ask the hiring manager to choose from CVs', score: 3 },
      { text: 'Set criteria first, score every CV on the same scorecard, shortlist the top three, and record why', score: 4 },
    ],
  },
  {
    id: 'pe_2',
    competencies: ['communication', 'influence'],
    domain: 'people',
    tags: ['candidate-experience'],
    text: 'A finalist is rejected. How do you communicate it?',
    options: [
      { text: 'Send a generic rejection email', score: 2 },
      { text: 'Do not respond', score: 1 },
      { text: 'Email a brief, specific, job-related reason', score: 3 },
      { text: 'Call promptly, thank them, give job-related reasons, and keep the door open', score: 4 },
    ],
  },
  {
    id: 'pe_3',
    competencies: ['influence', 'learning'],
    domain: 'people',
    tags: ['hiring-manager-partnering'],
    text: 'A hiring manager rejects every candidate you send. What do you do?',
    options: [
      { text: 'Send more candidates', score: 1 },
      { text: 'Say their expectations are unrealistic', score: 2 },
      { text: 'Review the job description with them', score: 3 },
      { text: 'Hold an intake conversation, separate must-haves from nice-to-haves, review rejection patterns, and adjust sourcing', score: 4 },
    ],
  },
  {
    id: 'pe_4',
    competencies: ['analytical', 'execution'],
    domain: 'people',
    tags: ['hr-analytics'],
    text: 'How do you measure whether your hiring process is improving?',
    options: [
      { text: 'Count applications received', score: 1 },
      { text: 'Count hires only', score: 2 },
      { text: 'Track manager satisfaction only', score: 3 },
      { text: 'Track time-to-fill, offer acceptance, quality of hire, source effectiveness and candidate satisfaction', score: 4 },
    ],
  },
  {
    id: 'pe_5',
    competencies: ['influence', 'business'],
    domain: 'people',
    tags: ['offer-negotiation', 'compensation-benefits'],
    text: 'A top candidate wants 20% above the salary band. What do you do?',
    options: [
      { text: 'Offer what they ask', score: 1 },
      { text: 'Reject the request', score: 2 },
      { text: 'Offer the top of the band and explain why', score: 3 },
      { text: 'Understand their motivations, check market and internal equity, use non-cash levers, and seek approval for any exception', score: 4 },
    ],
  },
  {
    id: 'pe_6',
    competencies: ['communication', 'problemSolving'],
    domain: 'people',
    tags: ['employee-relations'],
    text: "An employee privately complains about their manager's behaviour. What do you do?",
    options: [
      { text: 'Tell the manager straight away', score: 1 },
      { text: 'Advise the employee to resolve it themselves', score: 2 },
      { text: 'Ask the employee to put it in writing', score: 3 },
      { text: 'Listen, explain the process and confidentiality limits, document facts, follow policy, and investigate fairly', score: 4 },
    ],
  },
  {
    id: 'pe_7',
    competencies: ['analytical', 'learning'],
    domain: 'people',
    tags: ['diversity-inclusion', 'hr-analytics'],
    text: 'Data shows women drop out at a higher rate at the shortlist stage. What do you do?',
    options: [
      { text: 'Ignore it because the numbers are small', score: 1 },
      { text: 'Introduce a quota', score: 2 },
      { text: 'Train recruiters on bias', score: 3 },
      { text: 'Investigate the stage (job ad wording, screening criteria, shortlist makeup), structure criteria, and track changes', score: 4 },
    ],
  },
  {
    id: 'pe_8',
    competencies: ['execution', 'business'],
    domain: 'people',
    tags: ['onboarding', 'learning-development'],
    text: 'New hires are leaving within 90 days. What do you do?',
    options: [
      { text: 'Add a longer probation period', score: 1 },
      { text: 'Raise salaries', score: 2 },
      { text: 'Check attrition by source and manager before changing anything', score: 3 },
      { text: 'Run stay and exit interviews, compare job preview to reality, and add a 30-60-90 plan with check-ins', score: 4 },
    ],
  },
  {
    id: 'pe_9',
    competencies: ['influence', 'execution'],
    domain: 'people',
    tags: ['performance-management'],
    text: 'A manager gives everyone the highest rating. What do you do?',
    options: [
      { text: 'Accept it', score: 1 },
      { text: 'Lower the ratings yourself', score: 2 },
      { text: 'Send a reminder email on guidelines', score: 3 },
      { text: 'Show distribution data, share rating guidelines, and run a calibration session with examples', score: 4 },
    ],
  },
  {
    id: 'pe_10',
    competencies: ['communication', 'business'],
    domain: 'people',
    tags: ['sourcing', 'employer-branding'],
    text: 'You need a niche skill and few people apply. What do you do first?',
    options: [
      { text: 'Lower the requirements', score: 2 },
      { text: 'Raise the salary', score: 2 },
      { text: 'Post on more job boards', score: 3 },
      { text: 'Map where this talent works, use direct sourcing and referrals, refine the pitch, and consider adjacent skills', score: 4 },
    ],
  },
  {
    id: 'pe_11',
    competencies: ['problemSolving', 'communication'],
    domain: 'people',
    tags: ['labour-law-compliance', 'structured-interviewing'],
    text: 'A hiring manager wants to ask a candidate about marriage and family plans. What do you do?',
    options: [
      { text: 'Let them ask', score: 1 },
      { text: 'Let the manager decide and stay out of it', score: 2 },
      { text: 'Check with your HR head before the interview', score: 3 },
      { text: 'Decline politely, explain job-related questions and the legal risk, and offer alternative questions', score: 4 },
    ],
  },

  // GENERAL MANAGEMENT
  {
    id: 'gm_1',
    competencies: ['problemSolving', 'execution'],
    domain: 'general-management',
    tags: ['project-recovery', 'risk-management'],
    text: 'You inherit a project that is behind schedule and over budget. What do you do?',
    options: [
      { text: 'Quietly cut scope', score: 1 },
      { text: 'Add more people', score: 2 },
      { text: 'Escalate with the problem and options', score: 3 },
      { text: 'Assess status and causes, re-baseline scope, schedule and cost with the sponsor, and communicate the plan', score: 4 },
    ],
  },
  {
    id: 'gm_2',
    competencies: ['influence', 'learning'],
    domain: 'general-management',
    tags: ['team-leadership', 'delegation'],
    text: 'You need two peers from other teams to deliver parts of your project. What do you do?',
    options: [
      { text: 'Do their parts yourself', score: 1 },
      { text: 'Ask your manager to instruct them', score: 2 },
      { text: 'Agree responsibilities in writing and escalate only if missed', score: 3 },
      { text: 'Explain goals and what is in it for them, agree owners and dates, check in, and recognise contributions', score: 4 },
    ],
  },
  {
    id: 'gm_3',
    competencies: ['business', 'problemSolving'],
    domain: 'general-management',
    tags: ['prioritisation', 'decision-making'],
    text: 'Two urgent requests are due Friday and you can do only one well. What do you do?',
    options: [
      { text: 'Do both partly', score: 1 },
      { text: 'Do whichever came first', score: 2 },
      { text: "Do your boss's request", score: 3 },
      { text: 'Clarify impact and deadlines with each, prioritise by value, tell the other what to expect, and ask for help', score: 4 },
    ],
  },
  {
    id: 'gm_4',
    competencies: ['influence', 'communication'],
    domain: 'general-management',
    tags: ['conflict-resolution'],
    text: 'Two team members argue over credit for work. What do you do?',
    options: [
      { text: 'Ignore it', score: 1 },
      { text: 'Pick a side', score: 2 },
      { text: 'Separate their work to avoid contact', score: 3 },
      { text: 'Speak to each privately, then together with facts, and agree how credit is shared', score: 4 },
    ],
  },
  {
    id: 'gm_5',
    competencies: ['execution', 'influence'],
    domain: 'general-management',
    tags: ['change-management'],
    text: 'A new process meets resistance from users. What do you do?',
    options: [
      { text: 'Wait for it to settle', score: 1 },
      { text: 'Mandate it with a deadline', score: 2 },
      { text: 'Pilot with a willing team first', score: 3 },
      { text: 'Find the reasons for resistance, involve users, pilot, train, communicate benefits, and track adoption', score: 4 },
    ],
  },
  {
    id: 'gm_6',
    competencies: ['business', 'analytical'],
    domain: 'general-management',
    tags: ['budgeting-basics', 'decision-making'],
    text: 'Your budget allows either one hire or one tool. How do you decide?',
    options: [
      { text: 'Hire, since people are better', score: 2 },
      { text: 'Buy the tool because it is cheaper', score: 2 },
      { text: 'Ask your manager to decide', score: 3 },
      { text: 'Estimate cost, benefit and time to value of each against goals, and check risks and alternatives', score: 4 },
    ],
  },
  {
    id: 'gm_7',
    competencies: ['communication', 'influence'],
    domain: 'general-management',
    tags: ['cross-functional-collaboration', 'negotiation-influence'],
    text: 'Another department will not share data you need. What do you do?',
    options: [
      { text: 'Use unofficial data', score: 1 },
      { text: 'Escalate immediately', score: 2 },
      { text: 'Find an alternative source', score: 3 },
      { text: 'Understand their concern, explain the purpose, agree scope and security, offer something back, and escalate if needed', score: 4 },
    ],
  },
  {
    id: 'gm_8',
    competencies: ['business', 'execution'],
    domain: 'general-management',
    tags: ['customer-focus', 'process-ownership'],
    text: 'An important customer is angry about a late delivery caused by another team\'s error. What do you do?',
    options: [
      { text: 'Blame the other team', score: 1 },
      { text: 'Promise anything to calm them', score: 2 },
      { text: 'Offer a refund', score: 3 },
      { text: 'Apologise, give a firm recovery date, fix it, then address the root cause internally', score: 4 },
    ],
  },
  {
    id: 'gm_9',
    competencies: ['learning', 'communication'],
    domain: 'general-management',
    tags: ['business-communication', 'risk-management'],
    text: 'You discover your own mistake already reached a client. What do you do?',
    options: [
      { text: 'Hope nobody notices', score: 1 },
      { text: 'Fix and resend quietly', score: 2 },
      { text: 'Resend with a brief note to the client and tell your manager afterwards', score: 3 },
      { text: 'Tell your manager now, quantify the impact, propose a fix, inform the client, and add a safeguard', score: 4 },
    ],
  },
];

function transformRaw(raw: RawQuestionDef): Track3Question {
  // Compute distinct groups from tags
  const distinctGroups = Array.from(
    new Set(raw.tags.map((t) => TAG_MAP[t]?.group).filter(Boolean))
  );

  return {
    id: raw.id,
    competencies: raw.competencies,
    domain: raw.domain,
    tags: raw.tags,
    text: raw.text,
    options: raw.options.map((o, idx) => ({
      id: `o${idx + 1}` as 'o1' | 'o2' | 'o3' | 'o4',
      text: o.text,
      score: o.score,
    })),
    groups: distinctGroups,
  };
}

export const SHARED_QUESTIONS: Track3Question[] = RAW_SHARED_QUESTIONS.map(transformRaw);
export const MODULE_QUESTIONS: Track3Question[] = RAW_DOMAIN_QUESTIONS.map(transformRaw);
export const ALL_DOMAIN_QUESTIONS: Track3Question[] = [...SHARED_QUESTIONS, ...MODULE_QUESTIONS];

export const QUESTION_BY_ID_MAP: Record<string, Track3Question> = Object.fromEntries(
  ALL_DOMAIN_QUESTIONS.map((q) => [q.id, q])
);

/**
 * MODULE SELECTION RULE (deterministic):
 * 1. selectedGroups = the groups of the user's selected domain tags. Candidates = module questions whose domain equals the selected domain.
 * 2. For each candidate:
 *    directHits = number of its tags that are selected;
 *    groupHits = number of its groups that are in selectedGroups;
 *    priority = 3 x directHits + groupHits.
 * 3. Pick 6 greedily. At each step choose candidate that:
 *    (a) covers the most selected groups not yet covered by earlier picks, then
 *    (b) has highest priority, then
 *    (c) covers competencies that are least covered so far (counting 4 shared + earlier picks), then
 *    (d) has alphabetically first id.
 *    Never repeat a question.
 * 4. If fewer than 6 candidates have priority above 0, fill rest in same sorted order.
 */
export function selectModuleQuestions(domainId: DomainId, selectedTagIds: string[]): Track3Question[] {
  // 1. selectedGroups
  const selectedTagSet = new Set(selectedTagIds);
  const selectedGroups = new Set<string>();
  for (const tid of selectedTagIds) {
    const t = TAG_MAP[tid];
    if (t) selectedGroups.add(t.group);
  }

  // Candidates = module questions with matching domain
  const candidates = MODULE_QUESTIONS.filter((q) => q.domain === domainId);

  // Initial competency counts from the 4 shared questions
  const competencyCounts: Record<CompetencyKey, number> = {
    analytical: 0,
    business: 0,
    communication: 0,
    problemSolving: 0,
    execution: 0,
    influence: 0,
    learning: 0,
  };
  for (const sq of SHARED_QUESTIONS) {
    for (const c of sq.competencies) {
      competencyCounts[c] = (competencyCounts[c] || 0) + 1;
    }
  }

  const picked: Track3Question[] = [];
  const pickedIds = new Set<string>();
  const coveredGroups = new Set<string>();

  // Helper to compute priority
  function getCandidatePriority(q: Track3Question): number {
    const directHits = q.tags.filter((t) => selectedTagSet.has(t)).length;
    const groupHits = q.groups.filter((g) => selectedGroups.has(g)).length;
    return 3 * directHits + groupHits;
  }

  while (picked.length < 6 && picked.length < candidates.length) {
    const remaining = candidates.filter((q) => !pickedIds.has(q.id));
    if (remaining.length === 0) break;

    // Rank candidates
    remaining.sort((a, b) => {
      // (a) covers most selected groups not yet covered by earlier picks
      const aNewGroups = a.groups.filter((g) => selectedGroups.has(g) && !coveredGroups.has(g)).length;
      const bNewGroups = b.groups.filter((g) => selectedGroups.has(g) && !coveredGroups.has(g)).length;
      if (bNewGroups !== aNewGroups) return bNewGroups - aNewGroups;

      // (b) highest priority
      const aPri = getCandidatePriority(a);
      const bPri = getCandidatePriority(b);
      if (bPri !== aPri) return bPri - aPri;

      // (c) covers competencies least covered so far
      // Sum the current coverage count of candidate's competencies (lower sum means least covered)
      const aCompSum = a.competencies.reduce((sum, c) => sum + (competencyCounts[c] || 0), 0);
      const bCompSum = b.competencies.reduce((sum, c) => sum + (competencyCounts[c] || 0), 0);
      if (aCompSum !== bCompSum) return aCompSum - bCompSum;

      // (d) alphabetically first id
      return a.id.localeCompare(b.id);
    });

    const chosen = remaining[0];
    picked.push(chosen);
    pickedIds.add(chosen.id);

    // Update covered groups
    for (const g of chosen.groups) {
      if (selectedGroups.has(g)) coveredGroups.add(g);
    }

    // Update competency counts
    for (const c of chosen.competencies) {
      competencyCounts[c] = (competencyCounts[c] || 0) + 1;
    }
  }

  return picked;
}
