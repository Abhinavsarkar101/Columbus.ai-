export const ARCHETYPE_LEXICON: Record<string, string[]> = {
  AN: [
    'number', 'data', 'analy', 'spreadsheet', 'excel', 'cost', 'budget', 'calculat',
    'statistic', 'financ', 'account', 'audit', 'research', 'invest', 'risk', 'forecast',
    'figures', 'math'
  ],
  ST: [
    'strateg', 'long-term', 'long term', 'vision', 'direction', 'advis', 'consult',
    'market entry', 'big picture', 'policy', 'global', 'competitive', 'trade-off'
  ],
  BU: [
    'startup', 'start-up', 'build', 'prototype', 'launch', 'invent', 'innovat',
    'founder', 'experiment', 'test small', 'mvp', 'from scratch', 'create something'
  ],
  PE: [
    'marketing', 'brand', 'sell', 'sales', 'pitch', 'persuad', 'campaign',
    'advertis', 'negotiat', 'influenc', 'promote', 'storytell', 'audience', 'client meeting'
  ],
  CO: [
    'people', 'team', 'listen', 'help', 'support', 'mentor', 'train', 'counsel',
    'health', 'hospital', 'community', 'ngo', 'teach', 'culture', 'empath', 'hiring'
  ],
  OP: [
    'process', 'operation', 'logistic', 'supply', 'warehouse', 'efficien',
    'schedule', 'organi', 'timeline', 'checklist', 'quality', 'deliver',
    'workflow', 'system', 'step by step'
  ],
};

export const DIGITAL_LEXICON: string[] = [
  'online', 'digital', 'social media', 'instagram', 'youtube', 'seo',
  'influencer', 'website', 'app', 'e-commerce', 'ecommerce', 'viral',
  'content', 'reels'
];

export const SPECIALIZATION_ALIAS_LEXICON: Record<string, string[]> = {
  FIN: ['finance', 'valuation', 'investment', 'equity', 'stock', 'accounting', 'audit', 'tax', 'treasury', 'm&a', 'ipo', 'portfolio', 'cfa'],
  BNK: ['bank', 'banking', 'insurance', 'bfsi', 'loan', 'credit', 'underwriting', 'actuarial', 'wealth'],
  FTC: ['fintech', 'payments', 'upi', 'wallet', 'neobank', 'lending app', 'blockchain', 'crypto'],
  ANA: ['analytics', 'statistics', 'dashboard', 'power bi', 'tableau', 'sql', 'excel', 'forecasting', 'business intelligence'],
  DSA: ['data science', 'machine learning', 'ml', 'ai', 'artificial intelligence', 'python', 'deep learning', 'nlp', 'genai'],
  STR: ['strategy', 'consulting', 'consultant', 'advisory', 'market entry', 'transformation'],
  INT: ['international', 'global business', 'export', 'import', 'trade', 'cross-border', 'exim'],
  GEN: ['general management', 'generalist', 'management trainee', 'p&l'],
  PM: ['product management', 'product manager', 'roadmap', 'user research', 'ux', 'apm', 'feature'],
  ENT: ['startup', 'entrepreneur', 'founder', 'venture', 'innovation', 'incubator'],
  FAM: ['family business', 'family firm', 'succession'],
  MKT: ['marketing', 'brand', 'consumer', 'advertising', 'market research', 'positioning', 'fmcg'],
  DM: ['digital marketing', 'seo', 'sem', 'social media', 'performance marketing', 'influencer', 'content marketing', 'ppc', 'growth marketing'],
  SAL: ['sales', 'business development', 'key account', 'client acquisition', 'negotiation', 'b2b'],
  MED: ['media', 'entertainment', 'film', 'journalism', 'public relations', 'publishing', 'sports'],
  HR: ['hr', 'human resource', 'talent', 'recruitment', 'hiring', 'l&d', 'payroll', 'organizational behavior', 'culture'],
  HCM: ['hospital', 'healthcare', 'health care', 'patient', 'clinic', 'public health'],
  PHA: ['pharma', 'pharmaceutical', 'biotech', 'drug', 'clinical', 'life sciences'],
  ESG: ['sustainability', 'esg', 'climate', 'carbon', 'csr', 'green', 'renewable'],
  HOS: ['hospitality', 'hotel', 'tourism', 'travel', 'airline', 'aviation', 'airport', 'restaurant', 'event'],
  PPN: ['policy', 'public policy', 'government', 'ngo', 'nonprofit', 'social enterprise', 'development sector'],
  OPS: ['operations', 'lean', 'six sigma', 'quality', 'manufacturing', 'production', 'plant'],
  SCM: ['supply chain', 'logistics', 'warehouse', 'procurement', 'inventory', 'sourcing', 'distribution'],
  ITM: ['it management', 'information systems', 'erp', 'sap', 'technology management', 'cloud', 'cybersecurity', 'digital transformation'],
  PRJ: ['project management', 'pmp', 'agile', 'scrum', 'pmo', 'program management'],
  RET: ['retail', 'e-commerce', 'ecommerce', 'merchandising', 'category', 'store', 'marketplace'],
  AGR: ['agri', 'agriculture', 'farm', 'rural', 'agribusiness', 'food processing', 'commodity'],
  REI: ['real estate', 'property', 'construction', 'infrastructure', 'housing', 'realty'],
};

export const ROLE_FAMILY_LEXICON: Record<string, string[]> = {
  ANALYTIC: ['model', 'forecast', 'data', 'analy', 'dashboard', 'research', 'excel', 'sql', 'report', 'valuation', 'statistic'],
  CLIENT: ['client', 'customer', 'relationship', 'account', 'sales', 'stakeholder', 'negotiat', 'pitch', 'persuad', 'partner'],
  BUILD: ['launch', 'build', 'design', 'create', 'new product', 'campaign', 'ship', 'innovat', 'prototype', 'start'],
  OPS_PEOPLE: ['process', 'team', 'operations', 'manage', 'coordinate', 'improve', 'program', 'schedule', 'people', 'train', 'support'],
};

// Section 2.3: Ordinal keyword sets
export const ORDINAL_NONE_WORDS = [
  'nothing', 'none', 'no experience', 'not yet', 'never', "haven't", 'have not', 'zero'
];

export const ORDINAL_HIGH_WORDS = [
  'led', 'shipped', 'launched', 'closed', 'won', 'built', 'deployed', 'published',
  'owned', 'delivered', 'ranked', 'achieved', 'increased', 'reduced', 'saved', '%'
];

export const ORDINAL_MED_WORDS = [
  'project', 'internship', 'intern', 'competition', 'practice', 'some', 'partly',
  'couple', 'tried', 'workshop', 'mock', 'case'
];

export const ORDINAL_LOW_WORDS = [
  'course', 'reading', 'article', 'video', 'self-study', 'theory', 'plan to',
  'want to', 'thinking', 'learning'
];

// Routing sets (with at least 5 synonyms/phrases including common Indian-English phrasing)
export const ROUTING_SYNONYMS: Record<string, Record<string, string[]>> = {
  // Scenario A Q10
  A_Q10: {
    READY_INFO: ['no idea', 'confused', "don't know", 'not sure', 'need information', 'tell me more', 'explore options', 'clueless'],
    READY_CONF: ['doubt', 'worried', 'scared', "can't", 'not confident', 'fear', 'afraid', 'can i do it', 'underconfident'],
    READY_HIGH: ['clear', 'sure', 'decided', 'fixed', 'know what i want', 'certain', 'one area'],
    READY_MED: ['two', 'few', 'shortlist', 'somewhat clear', '2 or 3', 'confused between two', 'narrowed down'],
  },
  // Scenario B Q10
  B_Q10: {
    CREDIT_DUAL_OK: ['enough room', 'two areas', 'plenty credits', 'can do both', 'dual ok', 'full room'],
    CREDIT_SINGLE: ['one area plus electives', 'electives only', 'minor only', 'related field', 'single major'],
    CREDIT_SINGLE_TIGHT: ['only room for one', 'tight', 'no extra credits', 'strictly one', 'one specialization only'],
    READY_LOW: ['not sure yet', 'test interest', 'undecided', 'still thinking', 'explore first'],
    DUAL_NOT_OFFERED: ['not offered', 'college does not offer', 'no dual option', 'single track only', 'prohibited by college', 'not allowed'],
  },
  // Scenario C Q5
  C_Q5: {
    CAMPUS_ACTIVE: ['campus drive open', 'shortlisted', 'interviews ongoing', 'placement drive', 'pool campus', 'day 1', 'day zero'],
    CAMPUS_SOON: ['campus drive coming up', 'coming soon', 'next month', 'starting soon', 'placement season begins', 'in a few weeks'],
    OFF_CAMPUS: ['off campus', 'off-campus', 'naukri', 'linkedin job', 'direct application', 'applying outside', 'external'],
    CAMPUS_UNKNOWN: ['not sure how my college works', 'placement cell unknown', 'confused about process', 'dont know process', 'unclear guidelines'],
  },
  // Scenario C Q6
  C_Q6: {
    TIER_LARGE: ['large corporate', 'mnc', 'multinational', 'fortune 500', 'conglomerate', 'tata', 'reliance', 'big company'],
    TIER_MID: ['mid-size', 'midsize', 'fast growing', 'scaleup', 'scale up', 'growth stage'],
    TIER_STARTUP: ['startup', 'start-up', 'early stage', 'seed funded', 'series a', 'founder led'],
    TIER_FIRM: ['consulting firm', 'financial firm', 'mbb', 'big 4', 'boutique', 'investment bank'],
    TIER_ANY: ['open to all', 'any company', 'no preference', 'wherever i get', 'all tiers'],
  },
  // Scenario C Q8
  C_Q8: {
    MOCK_0: ['0', 'zero', 'none', 'never', 'not yet', 'nil', 'haven’t done any'],
    MOCK_1: ['1', '2', 'one', 'two', '1 to 2', 'a couple', 'just one'],
    MOCK_3: ['3', '4', '5', 'three', 'four', 'five', '3 to 5', 'few mocks'],
    MOCK_5: ['6', '7', '8', 'more than five', '6 or more', 'many', 'plenty of mocks', 'several'],
  },
  // Scenario C Q9
  C_Q9: {
    GAP_CASE: ['case', 'problem solving', 'guesstimate', 'market sizing', 'business case', 'case round'],
    GAP_TECH: ['technical', 'domain', 'functional', 'finance concepts', 'formulas', 'theory'],
    GAP_BEHAV: ['behavioral', 'tell me about a time', 'hr round', 'fit round', 'strengths weaknesses'],
    GAP_GD: ['group discussion', 'gd', 'extempore', 'speaking in crowd', 'debate'],
    GAP_NONE: ['no particular worry', 'confident', 'no worry', 'prepared', 'fine with all'],
  },
  // Scenario C Q10
  C_Q10: {
    URG_HIGH: ['under 3', '1 month', '2 months', 'immediately', 'urgent', 'asap', 'within 3 months', 'right now'],
    URG_MED: ['3 to 6', '4 months', '5 months', '6 months', 'next quarter', 'half year'],
    URG_LOW: ['more than 6', 'next year', 'over 6 months', 'later', 'no rush', 'relaxed'],
  },
  // Scenario D C7
  D_C7: {
    URG_HIGH: ['under 4', '1 week', '2 weeks', '3 weeks', '4 weeks', 'this month', 'immediately'],
    URG_MED: ['4 to 8', '5 weeks', '6 weeks', '7 weeks', '8 weeks', '1 to 2 months'],
    URG_LOW: ['9 to 12', '10 weeks', '11 weeks', '12 weeks', '3 months'],
    URG_NONE: ['more than 12', 'over 3 months', 'plenty of time', 'next semester', 'not applying soon'],
  },
  // Scenario D C8
  D_C8: {
    GAP_RESUME: ['resume screening', 'shortlisting', 'ats', 'cv', 'resume shortlisting'],
    GAP_TECH: ['technical test', 'functional test', 'domain exam', 'coding', 'finance test'],
    GAP_CASE: ['case round', 'problem solving', 'case study', 'guesstimates'],
    GAP_BEHAV: ['behavioral', 'fit round', 'hr questions', 'culture fit'],
    GAP_NET: ['networking', 'referrals', 'alumni reachout', 'linkedin messages', 'finding contacts'],
  },
  // Scenario D Step 1 Level
  D_LEVEL: {
    FRESHER: ['break', 'gap', 'student', 'graduate', 'fresh', 'fresher', 'no experience', 'college student'],
    INTERN: ['intern', 'trainee', 'apprentice', 'internship', 'summer intern'],
    LATERAL: ['work', 'job', 'employed', 'professional', 'years', 'experienced', 'lateral', 'prior full-time'],
  },
};
