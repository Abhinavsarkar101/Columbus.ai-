import { DomainDef, DomainId, PresetRoleDef } from './types';

export const TRACK3_DOMAINS: DomainDef[] = [
  {
    id: 'product-tech',
    label: 'Product & Tech',
    baseWeights: {
      analytical: 0.20,
      business: 0.20,
      communication: 0.15,
      problemSolving: 0.20,
      execution: 0.10,
      influence: 0.10,
      learning: 0.05,
    },
  },
  {
    id: 'finance-consulting',
    label: 'Finance & Consulting',
    baseWeights: {
      analytical: 0.25,
      business: 0.20,
      communication: 0.15,
      problemSolving: 0.15,
      execution: 0.10,
      influence: 0.10,
      learning: 0.05,
    },
  },
  {
    id: 'marketing-growth',
    label: 'Marketing & Growth',
    baseWeights: {
      analytical: 0.15,
      business: 0.20,
      communication: 0.20,
      problemSolving: 0.10,
      execution: 0.15,
      influence: 0.15,
      learning: 0.05,
    },
  },
  {
    id: 'operations-analytics',
    label: 'Operations & Analytics',
    baseWeights: {
      analytical: 0.25,
      business: 0.15,
      communication: 0.15,
      problemSolving: 0.15,
      execution: 0.20,
      influence: 0.05,
      learning: 0.05,
    },
  },
  {
    id: 'sales-bd',
    label: 'Sales & Business Development',
    baseWeights: {
      analytical: 0.10,
      business: 0.20,
      communication: 0.15,
      problemSolving: 0.10,
      execution: 0.20,
      influence: 0.20,
      learning: 0.05,
    },
  },
  {
    id: 'people',
    label: 'People (HR & Talent)',
    baseWeights: {
      analytical: 0.05,
      business: 0.10,
      communication: 0.20,
      problemSolving: 0.15,
      execution: 0.10,
      influence: 0.25,
      learning: 0.15,
    },
  },
  {
    id: 'general-management',
    label: 'General Management',
    baseWeights: {
      analytical: 0.15,
      business: 0.15,
      communication: 0.15,
      problemSolving: 0.15,
      execution: 0.15,
      influence: 0.15,
      learning: 0.10,
    },
  },
];

export const DOMAIN_MAP: Record<DomainId, DomainDef> = Object.fromEntries(
  TRACK3_DOMAINS.map((d) => [d.id, d])
) as Record<DomainId, DomainDef>;

export const PRESET_ROLES: PresetRoleDef[] = [
  // product-tech
  {
    id: 'product-manager',
    title: 'Product Manager',
    domain: 'product-tech',
    tags: [
      'discovery',
      'prioritisation',
      'metrics',
      'experiments',
      'product-strategy',
      'stakeholders',
      'eng-collab',
    ],
    aliases: ['product manager', 'product owner', 'pm', 'apm', 'product'],
  },
  {
    id: 'product-analyst',
    title: 'Product Analyst',
    domain: 'product-tech',
    tags: ['metrics', 'experiments', 'discovery', 'tech-literacy', 'growth-retention'],
    aliases: ['product analyst', 'growth analyst', 'product analytics'],
  },
  {
    id: 'technical-pm',
    title: 'Technical Product / Program Manager',
    domain: 'product-tech',
    tags: ['eng-collab', 'tech-literacy', 'agile-delivery', 'prioritisation', 'stakeholders'],
    aliases: ['technical product manager', 'tpm', 'program manager', 'scrum master', 'delivery manager'],
  },
  {
    id: 'ai-product-manager',
    title: 'AI Product Manager',
    domain: 'product-tech',
    tags: ['product-strategy', 'discovery', 'metrics', 'prioritisation', 'stakeholders'],
    aiTags: [
      'AI product management',
      'Large language models',
      'Responsible AI',
      'AI use-case prioritisation',
    ],
    aliases: ['ai product manager', 'genai product manager', 'ai pm', 'llm product'],
  },

  // finance-consulting
  {
    id: 'strategy-consultant',
    title: 'Strategy Consultant',
    domain: 'finance-consulting',
    tags: [
      'problem-structuring',
      'market-sizing',
      'competitive-strategy',
      'market-entry',
      'client-recommendations',
    ],
    aliases: ['consultant', 'consulting', 'strategy consultant', 'management consultant', 'mckinsey', 'bcg', 'bain'],
  },
  {
    id: 'ib-associate',
    title: 'IB Associate',
    domain: 'finance-consulting',
    tags: [
      'valuation',
      'financial-statements',
      'financial-modelling',
      'deal-execution',
      'due-diligence',
      'capital-structure',
    ],
    aliases: ['investment banking', 'ib', 'banker', 'm&a', 'leveraged buyout', 'ecm', 'dcm'],
  },
  {
    id: 'financial-analyst',
    title: 'Financial Analyst',
    domain: 'finance-consulting',
    tags: [
      'financial-modelling',
      'forecasting',
      'variance-budgeting',
      'financial-statements',
      'risk-assessment',
    ],
    aliases: ['financial analyst', 'fp&a', 'finance analyst', 'budget analyst', 'corporate finance'],
  },
  {
    id: 'equity-research',
    title: 'Equity Research Analyst',
    domain: 'finance-consulting',
    tags: ['equity-research', 'valuation', 'financial-statements', 'forecasting', 'competitive-strategy'],
    aliases: ['equity research', 'research analyst', 'buy side', 'sell side', 'investment analyst'],
  },
  {
    id: 'ai-strategy-consultant',
    title: 'AI Strategy Consultant',
    domain: 'finance-consulting',
    tags: ['problem-structuring', 'client-recommendations', 'market-entry', 'competitive-strategy'],
    aiTags: ['AI strategy', 'AI business case and ROI', 'Responsible AI', 'Build vs buy for AI'],
    aliases: ['ai consultant', 'ai strategy', 'digital transformation consultant', 'ai transformation'],
  },

  // marketing-growth
  {
    id: 'marketing-brand-manager',
    title: 'Marketing or Brand Manager',
    domain: 'marketing-growth',
    tags: [
      'brand-positioning',
      'brand-measurement',
      'consumer-insight',
      'segmentation-targeting',
      'campaign-planning',
      'budget-allocation',
    ],
    aliases: ['brand manager', 'marketing manager', 'brand', 'advertising', 'communications'],
  },
  {
    id: 'digital-marketing-manager',
    title: 'Digital Marketing Manager',
    domain: 'marketing-growth',
    tags: [
      'paid-search',
      'paid-social',
      'conversion-funnel',
      'experimentation',
      'marketing-analytics',
      'budget-allocation',
      'email-crm',
    ],
    aliases: ['digital marketing', 'performance marketing', 'ppc', 'growth marketing', 'crm manager'],
  },
  {
    id: 'content-seo',
    title: 'Content, SEO or Social Media',
    domain: 'marketing-growth',
    tags: ['seo', 'content-strategy', 'social-media', 'marketing-analytics', 'conversion-funnel'],
    aliases: ['seo', 'content marketing', 'content manager', 'social media manager', 'copywriter'],
  },
  {
    id: 'product-marketing',
    title: 'Product Marketing Manager',
    domain: 'marketing-growth',
    tags: [
      'product-marketing',
      'consumer-insight',
      'segmentation-targeting',
      'campaign-planning',
      'brand-positioning',
    ],
    aliases: ['product marketing', 'pmm', 'go to market', 'gtm'],
  },
  {
    id: 'ai-marketing-specialist',
    title: 'AI-Enabled Marketing Specialist',
    domain: 'marketing-growth',
    tags: ['content-strategy', 'marketing-analytics', 'campaign-planning', 'experimentation'],
    aiTags: ['Generative AI', 'Prompt engineering', 'AI in marketing', 'Responsible AI'],
    aliases: ['ai marketing', 'genai marketing', 'marketing automation specialist'],
  },

  // operations-analytics
  {
    id: 'business-data-analyst',
    title: 'Business or Data Analyst',
    domain: 'operations-analytics',
    tags: [
      'data-cleaning',
      'sql',
      'dashboards-visualisation',
      'kpi-definition',
      'insight-communication',
      'statistics',
    ],
    aliases: ['business analyst', 'data analyst', 'analytics', 'bi analyst', 'data scientist', 'reporting analyst'],
  },
  {
    id: 'operations-supply-chain',
    title: 'Operations or Supply Chain Manager',
    domain: 'operations-analytics',
    tags: [
      'inventory-management',
      'supplier-management',
      'demand-forecasting',
      'process-improvement',
      'logistics-transport',
      'capacity-planning',
    ],
    aliases: ['operations manager', 'supply chain', 'logistics', 'warehouse', 'scm', 'scm manager', 'planning manager'],
  },
  {
    id: 'procurement-manager',
    title: 'Procurement or Sourcing Manager',
    domain: 'operations-analytics',
    tags: ['procurement-negotiation', 'supplier-management', 'kpi-definition', 'inventory-management'],
    aliases: ['procurement', 'sourcing', 'purchasing', 'category manager', 'vendor management'],
  },
  {
    id: 'ops-project-manager',
    title: 'Project or Process Manager',
    domain: 'operations-analytics',
    tags: ['project-management', 'process-improvement', 'quality-management', 'capacity-planning'],
    aliases: ['project manager', 'process excellence', 'lean', 'six sigma', 'pmo'],
  },
  {
    id: 'ai-automation-analyst',
    title: 'AI & Automation Analyst',
    domain: 'operations-analytics',
    tags: ['process-improvement', 'data-cleaning', 'kpi-definition', 'insight-communication'],
    aiTags: ['Workflow automation', 'Prompt engineering', 'Agentic AI', 'Robotic process automation'],
    aliases: ['automation analyst', 'ai analyst', 'rpa', 'process automation', 'prompt engineer', 'ai operations'],
  },

  // sales-bd
  {
    id: 'sales-bd-manager',
    title: 'Sales or Business Development Manager',
    domain: 'sales-bd',
    tags: [
      'prospecting',
      'qualification',
      'pipeline-management',
      'negotiation',
      'closing',
      'stakeholder-mapping',
    ],
    aliases: ['sales manager', 'business development', 'bd', 'account executive', 'sdr', 'inside sales'],
  },
  {
    id: 'key-account-manager',
    title: 'Key Account Manager',
    domain: 'sales-bd',
    tags: [
      'account-management',
      'customer-success-renewals',
      'stakeholder-mapping',
      'negotiation',
      'pricing-discounting',
    ],
    aliases: ['key account', 'account manager', 'customer success', 'client partner'],
  },
  {
    id: 'partnerships-manager',
    title: 'Partnerships or Channel Manager',
    domain: 'sales-bd',
    tags: ['partnerships', 'stakeholder-mapping', 'negotiation', 'territory-planning'],
    aliases: ['partnerships', 'channel manager', 'alliances', 'strategic partnerships'],
  },

  // people
  {
    id: 'hr-talent-acquisition',
    title: 'HR or Talent Acquisition',
    domain: 'people',
    tags: [
      'sourcing',
      'screening-shortlisting',
      'structured-interviewing',
      'candidate-experience',
      'hiring-manager-partnering',
      'offer-negotiation',
    ],
    aliases: ['hr', 'human resources', 'recruiter', 'recruiting', 'talent acquisition', 'hiring'],
  },
  {
    id: 'hr-business-partner',
    title: 'HR Business Partner',
    domain: 'people',
    tags: [
      'employee-relations',
      'performance-management',
      'hr-analytics',
      'labour-law-compliance',
      'hiring-manager-partnering',
      'diversity-inclusion',
    ],
    aliases: ['hrbp', 'hr business partner', 'people partner', 'employee relations'],
  },
  {
    id: 'learning-onboarding',
    title: 'L&D or Onboarding',
    domain: 'people',
    tags: ['learning-development', 'onboarding', 'performance-management', 'hr-analytics'],
    aliases: ['l&d', 'learning and development', 'training', 'onboarding', 'people operations'],
  },

  // general-management
  {
    id: 'management-trainee',
    title: 'Management Trainee (General)',
    domain: 'general-management',
    tags: [
      'prioritisation',
      'stakeholder-management',
      'team-leadership',
      'decision-making',
      'project-recovery',
      'business-communication',
    ],
    aliases: ['management trainee', 'graduate trainee', 'general management', 'rotational program', 'mt', 'leadership program'],
  },
  {
    id: 'business-operations',
    title: 'Business Operations / Chief of Staff',
    domain: 'general-management',
    tags: [
      'cross-functional-collaboration',
      'process-ownership',
      'decision-making',
      'change-management',
      'budgeting-basics',
    ],
    aliases: ['business operations', 'biz ops', 'chief of staff', 'strategy and operations'],
  },
];

export const PRESET_MAP: Record<string, PresetRoleDef> = Object.fromEntries(
  PRESET_ROLES.map((p) => [p.id, p])
);

export const DOMAIN_KEYWORD_HINTS: Record<DomainId, string[]> = {
  'product-tech': ['product', 'ux', 'ui', 'design', 'app', 'software', 'tech', 'engineering', 'saas', 'platform'],
  'finance-consulting': ['finance', 'banking', 'investment', 'consulting', 'strategy', 'equity', 'risk', 'treasury', 'valuation', 'credit'],
  'marketing-growth': ['marketing', 'brand', 'seo', 'social', 'content', 'advertising', 'growth', 'pr', 'media', 'campaign'],
  'operations-analytics': ['operations', 'supply', 'logistics', 'procurement', 'data', 'analytics', 'bi', 'warehouse', 'inventory', 'quality', 'project'],
  'sales-bd': ['sales', 'business development', 'account', 'partnerships', 'customer success', 'revenue', 'channel'],
  people: ['hr', 'human resources', 'recruit', 'talent', 'people', 'learning', 'compensation'],
  'general-management': ['management', 'trainee', 'general', 'chief of staff', 'leadership'],
};
