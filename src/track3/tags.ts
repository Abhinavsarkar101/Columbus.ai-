import { DomainId, TagDef, TagDomain, TagKind } from './types';

export const TOOL_NAMES_SET = new Set([
  'Power BI',
  'Tableau',
  'Looker Studio',
  'Figma',
  'Jira',
  'Salesforce/CRM',
  'CRM [Salesforce, HubSpot]',
  'HubSpot',
  'Bloomberg Terminal',
  'Sales Navigator',
  'LinkedIn Recruiter',
  'HRIS',
  'HRIS [Workday, SuccessFactors]',
  'Google Analytics',
  'ERP systems',
  'ERP systems [SAP, Oracle]',
  'Python for data',
  'R',
  'Advanced Excel',
  'Excel for HR',
  'ChatGPT',
  'Claude',
  'Gemini',
  'Microsoft Copilot',
  'Perplexity',
  'NotebookLM',
  'GitHub Copilot',
]);

function toKebab(str: string): string {
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function parseRawItem(raw: string, domain: TagDomain, groupName: string): TagDef {
  // Pattern: "id=Label [alias, alias]" or "Label [alias, alias]" or "Label"
  let id = '';
  let label = '';
  let aliases: string[] = [];

  let text = raw.trim();

  // Extract explicit id if "id=..."
  if (text.includes('=')) {
    const eqIdx = text.indexOf('=');
    id = text.substring(0, eqIdx).trim();
    text = text.substring(eqIdx + 1).trim();
  }

  // Extract aliases inside [...]
  const bracketMatch = text.match(/^(.*?)\s*\[(.*?)\]$/);
  if (bracketMatch) {
    label = bracketMatch[1].trim();
    aliases = bracketMatch[2].split(',').map((a) => a.trim()).filter(Boolean);
  } else {
    label = text.trim();
  }

  if (!id) {
    id = toKebab(label);
  }

  const groupId = `${domain}-${toKebab(groupName)}`;

  // Determine kind: tool or skill
  const isTool =
    TOOL_NAMES_SET.has(label) ||
    TOOL_NAMES_SET.has(raw.trim()) ||
    aliases.some((a) => TOOL_NAMES_SET.has(a));

  return {
    id,
    label,
    domain,
    group: groupName,
    groupId,
    aliases,
    kind: isTool ? 'tool' : 'skill',
  };
}

const RAW_DOMAIN_DATA: Record<DomainId, Record<string, string[]>> = {
  'product-tech': {
    'Product discovery & research': [
      'discovery=Product discovery',
      'User research [user interviews, customer interviews]',
      'Customer journey mapping',
      'Jobs to be done [JTBD]',
      'Persona development',
      'Usability testing',
      'Survey design',
      'Voice of customer',
    ],
    'Strategy & roadmap': [
      'product-strategy=Product strategy',
      'Product vision',
      'Roadmapping',
      'prioritisation=Prioritisation [RICE, MoSCoW]',
      'OKRs',
      'Business case development',
      'Build vs buy',
      'Product-market fit',
    ],
    'Metrics & experimentation': [
      'metrics=Product metrics [KPIs]',
      'North star metric',
      'experiments=A/B testing [experimentation]',
      'Funnel analysis',
      'Cohort analysis',
      'Product analytics [Amplitude, Mixpanel]',
      'Event tracking',
      'growth-retention=Growth and retention',
      'Activation and onboarding',
    ],
    'Delivery & execution': [
      'agile-delivery=Agile delivery [Scrum, Kanban]',
      'Sprint planning',
      'Backlog management',
      'User stories',
      'PRD writing',
      'Release management',
      'Jira',
    ],
    'Technical fluency': [
      'tech-literacy=Technical literacy',
      'APIs',
      'System design basics',
      'Databases and SQL',
      'Technical debt',
      'eng-collab=Engineering collaboration',
      'Cloud basics',
      'Data privacy basics',
    ],
    'Design & UX': [
      'ux-design=UX design',
      'Wireframing',
      'Prototyping [Figma]',
      'Design systems',
      'Accessibility',
      'Information architecture',
    ],
    'Go-to-market & commercial': [
      'go-to-market=Go-to-market [GTM]',
      'Product positioning',
      'pricing=Pricing and monetisation',
      'competitive-analysis=Competitive analysis',
      'Market research',
      'Product launches',
      'B2B SaaS',
      'B2C products',
      'Marketplace products',
      'Platform products',
    ],
    'Leadership & collaboration': [
      'stakeholders=Stakeholder management',
      'Cross-functional leadership',
      'Executive communication',
      'Conflict resolution',
      'Mentoring',
    ],
  },

  'finance-consulting': {
    'Problem solving & analysis': [
      'problem-structuring=Problem structuring [issue tree, MECE]',
      'Hypothesis-driven analysis',
      'Case interviews',
      'Root-cause analysis',
      'Business diagnostics',
      'Synthesis and storylining',
    ],
    'Strategy & markets': [
      'market-sizing=Market sizing',
      'competitive-strategy=Competitive strategy',
      'market-entry=Market entry',
      'Growth strategy',
      'Corporate strategy',
      "Industry analysis [Porter's five forces]",
      'Pricing strategy',
      'Operating model design',
      'Digital transformation',
      'Post-merger integration',
    ],
    'Client delivery': [
      'client-recommendations=Client recommendations',
      'Executive presentations',
      'Engagement management',
      'Workshop facilitation',
      'PowerPoint storytelling',
      'Stakeholder interviews',
    ],
    'Accounting & financial statements': [
      'financial-statements=Financial statement analysis',
      'Accounting fundamentals',
      'Three-statement modelling',
      'Working capital',
      'Cash flow analysis',
      'Ratio analysis',
      'IFRS and Ind AS [Ind AS]',
      'Revenue recognition',
    ],
    'Valuation & corporate finance': [
      'valuation=Valuation',
      'Discounted cash flow [DCF]',
      'Comparable company analysis [comps]',
      'Precedent transactions',
      'LBO modelling',
      'capital-structure=Capital structure',
      'Cost of capital [WACC]',
      'Capital budgeting',
    ],
    'Modelling & planning': [
      'financial-modelling=Financial modelling',
      'forecasting=Forecasting',
      'variance-budgeting=Variance and budgeting',
      'Scenario and sensitivity analysis',
      'FP&A',
      'Unit economics',
      'Advanced Excel',
      'Business partnering',
    ],
    'Deals & investing': [
      'deal-execution=Deal execution',
      'due-diligence=Due diligence',
      'Mergers and acquisitions [M&A]',
      'IPO and equity capital markets [ECM]',
      'Debt capital markets [DCM]',
      'Private equity',
      'Venture capital',
      'Pitch books',
    ],
    'Markets & research': [
      'equity-research=Equity research',
      'Sector analysis',
      'Earnings analysis',
      'Portfolio management',
      'Fixed income',
      'Derivatives',
      'Macroeconomics',
      'Bloomberg Terminal',
    ],
    'Risk & compliance': [
      'risk-assessment=Risk assessment',
      'Credit analysis',
      'Market risk',
      'Operational risk',
      'Regulatory compliance',
      'Internal audit',
      'ESG and sustainability',
      'AML and KYC',
      'Treasury management',
    ],
  },

  'marketing-growth': {
    'Brand & communications': [
      'brand-positioning=Brand positioning',
      'Brand strategy',
      'brand-measurement=Brand measurement',
      'Brand identity',
      'Storytelling',
      'Public relations [PR]',
      'Corporate communications',
      'Crisis communication',
      'Influencer marketing',
    ],
    'Consumer & market insight': [
      'consumer-insight=Consumer insight',
      'Market research',
      'segmentation-targeting=Segmentation and targeting',
      'Customer personas',
      'Consumer behaviour',
      'Competitive intelligence',
      'Social listening',
      'Survey design',
    ],
    'Planning & campaigns': [
      'campaign-planning=Campaign planning',
      'Integrated marketing communications [IMC]',
      'media-planning=Media planning',
      'Marketing strategy',
      'Event marketing',
      'Trade marketing',
      'budget-allocation=Budget allocation',
      'Retail marketing',
    ],
    'Paid & performance': [
      'paid-search=Paid search [Google Ads, SEM]',
      'paid-social=Paid social [Meta Ads, LinkedIn Ads]',
      'Programmatic advertising',
      'Display advertising',
      'Affiliate marketing',
      'Retargeting',
      'Landing page optimisation',
    ],
    'Organic & content': [
      'seo=SEO',
      'Technical SEO',
      'content-strategy=Content strategy',
      'Content marketing',
      'social-media=Social media marketing',
      'Copywriting',
      'Video marketing',
      'Community management',
    ],
    'Lifecycle & CRM': [
      'email-crm=Email marketing and CRM',
      'Marketing automation [HubSpot, Mailchimp]',
      'Lifecycle marketing',
      'Retention and loyalty',
      'WhatsApp marketing',
      'Account-based marketing [ABM]',
    ],
    'Analytics & experimentation': [
      'marketing-analytics=Marketing analytics',
      'Google Analytics',
      'Attribution modelling',
      'Marketing mix modelling [MMM]',
      'conversion-funnel=Conversion funnel optimisation [CRO]',
      'experimentation=Experimentation',
      'Customer lifetime value [CLV]',
      'CAC and ROAS',
    ],
    'Product marketing & growth': [
      'product-marketing=Product marketing',
      'Go-to-market launches',
      'Messaging and positioning',
      'Sales enablement',
      'Growth marketing',
      'Pricing and packaging',
      'Competitive battlecards',
    ],
  },

  'operations-analytics': {
    'Data foundations': [
      'data-cleaning=Data cleaning',
      'sql=SQL',
      'Advanced Excel',
      'Python for data',
      'R',
      'Data modelling',
      'ETL and data pipelines',
      'Data warehousing',
      'Data governance',
    ],
    'Analysis & statistics': [
      'statistics=Statistics',
      'Hypothesis testing',
      'Regression analysis',
      'Time series analysis',
      'A/B test analysis',
      'Segmentation analysis',
      'Root-cause analysis',
      'Predictive modelling',
      'Optimisation and linear programming',
    ],
    'Reporting & visualisation': [
      'dashboards-visualisation=Dashboards and visualisation',
      'Power BI',
      'Tableau',
      'Looker Studio',
      'kpi-definition=KPI definition',
      'Data storytelling',
      'insight-communication=Insight communication',
      'MIS reporting',
    ],
    'Planning & inventory': [
      'demand-forecasting=Demand forecasting',
      'Sales and operations planning [S&OP]',
      'inventory-management=Inventory management',
      'Safety stock',
      'Warehouse management',
      'Production planning',
      'capacity-planning=Capacity planning',
      'Material requirements planning [MRP]',
    ],
    'Sourcing & suppliers': [
      'supplier-management=Supplier management',
      'procurement-negotiation=Procurement and negotiation',
      'Strategic sourcing',
      'Category management',
      'Contract management',
      'Vendor evaluation',
      'Total cost of ownership',
    ],
    'Logistics & distribution': [
      'logistics-transport=Logistics and transportation',
      'Last-mile delivery',
      'Freight and 3PL',
      'Cold chain',
      'Reverse logistics',
      'Import-export and customs',
      'Distribution network design',
      'Order fulfilment',
    ],
    'Process & quality': [
      'process-improvement=Process improvement',
      'Lean',
      'Six Sigma',
      'quality-management=Quality management',
      'Kaizen',
      'Process mapping',
      'Standard operating procedures',
      'ISO standards',
      'Cost reduction',
    ],
    'Projects & systems': [
      'project-management=Project management [PMP]',
      'Scheduling and Gantt',
      'ERP systems [SAP, Oracle]',
      'Business process management [BPM]',
      'Change management',
      'PMO',
      'Digital operations',
    ],
  },

  'sales-bd': {
    'Prospecting & lead generation': [
      'prospecting=Prospecting',
      'Cold outreach',
      'Lead generation',
      'Sales Navigator',
      'Ideal customer profile [ICP]',
      'Social selling',
      'Outbound sales',
      'Inbound sales',
      'Lead scoring',
    ],
    'Qualification & discovery': [
      'qualification=Lead qualification [BANT, MEDDIC]',
      'discovery-calls=Discovery calls',
      'Needs analysis',
      'Consultative selling',
      'Solution selling',
      'Product demos',
      'Proposal writing',
      'RFP responses',
    ],
    'Pipeline & forecasting': [
      'pipeline-management=Pipeline management',
      'sales-forecasting=Sales forecasting',
      'CRM [Salesforce, HubSpot]',
      'Sales analytics',
      'territory-planning=Territory planning',
      'Quota and target planning',
      'Sales operations',
      'Win-loss analysis',
    ],
    'Negotiation & closing': [
      'negotiation=Negotiation',
      'objection-handling=Objection handling',
      'closing=Closing deals',
      'pricing-discounting=Pricing and discounting',
      'Contract negotiation',
      'Deal desk',
      'Value selling',
      'Competitive selling',
    ],
    'Stakeholders & enterprise sales': [
      'stakeholder-mapping=Stakeholder mapping',
      'Enterprise sales',
      'Key account planning',
      'B2B sales',
      'B2C sales',
      'Channel sales',
      'Government and tender sales',
    ],
    'Accounts & retention': [
      'account-management=Account management',
      'customer-success-renewals=Customer success and renewals',
      'Upselling and cross-selling',
      'Churn reduction',
      'Customer onboarding',
      'Net revenue retention',
      'Quarterly business reviews',
    ],
    'Business development & partnerships': [
      'partnerships=Partnerships',
      'Business development',
      'Strategic alliances',
      'Distributor management',
      'Market expansion',
      'Deal structuring',
      'Co-selling',
    ],
  },

  people: {
    'Talent acquisition': [
      'sourcing=Sourcing',
      'Boolean search',
      'LinkedIn Recruiter',
      'Job boards [Naukri]',
      'screening-shortlisting=Screening and shortlisting',
      'structured-interviewing=Structured interviewing',
      'Campus hiring',
      'Executive search',
      'Bulk hiring',
      'Applicant tracking systems [ATS]',
      'Referral programmes',
    ],
    'Candidate & employer brand': [
      'candidate-experience=Candidate experience',
      'employer-branding=Employer branding',
      'offer-negotiation=Offer negotiation',
      'Offer management',
      'Pre-boarding',
      'hiring-manager-partnering=Hiring manager partnering',
      'Workforce planning',
      'Recruitment marketing',
    ],
    'HR operations & analytics': [
      'hr-analytics=HR analytics',
      'HRIS [Workday, SuccessFactors]',
      'HR dashboards',
      'Attrition analysis',
      'HR operations',
      'Payroll processing',
      'HR policy design',
      'Excel for HR',
    ],
    'Onboarding & development': [
      'onboarding=Onboarding',
      'learning-development=Learning and development [L&D]',
      'Training needs analysis',
      'Instructional design',
      'Leadership development',
      'Succession planning',
      'Talent management',
      'Competency frameworks',
      'Coaching and mentoring',
    ],
    'Performance & rewards': [
      'performance-management=Performance management',
      'Goal setting [OKRs]',
      '360-degree feedback',
      'Performance calibration',
      'compensation-benefits=Compensation and benefits',
      'Job evaluation and grading',
      'Salary benchmarking',
      'Rewards and recognition',
      'ESOPs',
    ],
    'Employee relations & compliance': [
      'employee-relations=Employee relations',
      'Grievance handling',
      'Disciplinary process',
      'Conflict mediation',
      'labour-law-compliance=Labour law compliance',
      'POSH compliance',
      'Industrial relations',
      'Statutory compliance [PF, ESI, gratuity]',
      'Exit management',
      'Workplace investigations',
    ],
    'Culture & inclusion': [
      'diversity-inclusion=Diversity and inclusion',
      'Employee engagement',
      'Organisation culture',
      'Change management',
      'Organisation design',
      'Employee wellbeing',
      'Internal communication',
      'HR business partnering',
      'People strategy',
    ],
  },

  'general-management': {
    'Leadership & self-management': [
      'team-leadership=Team leadership',
      'delegation=Delegation',
      'Coaching and mentoring',
      'Motivating teams',
      'Leading without authority',
      'Building high-performing teams',
      'Performance feedback',
      'Time management',
      'Adaptability',
      'Ownership mindset',
      'Ethics and integrity',
    ],
    'Decision-making & strategy': [
      'decision-making=Decision making',
      'prioritisation=Prioritisation',
      'Strategic thinking',
      'Business case development',
      'Problem solving',
      'Critical thinking',
      'Data-driven decision making',
      'Scenario planning',
    ],
    'Execution & projects': [
      'project-recovery=Project recovery',
      'Project planning',
      'process-ownership=Process ownership',
      'Operational excellence',
      'Resource planning',
      'Milestone tracking',
      'risk-management=Risk management',
      'Vendor management',
      'Quality assurance',
    ],
    'People & influence': [
      'stakeholder-management=Stakeholder management',
      'conflict-resolution=Conflict resolution',
      'negotiation-influence=Negotiation and influence',
      'cross-functional-collaboration=Cross-functional collaboration',
      'Relationship building',
      'Managing up',
      'Emotional intelligence',
      'Cultural awareness',
    ],
    Communication: [
      'business-communication=Business communication',
      'Presentation skills',
      'Executive communication',
      'Business writing',
      'Storytelling',
      'Meeting facilitation',
      'Public speaking',
    ],
    'Business & finance basics': [
      'budgeting-basics=Budgeting basics',
      'P&L understanding',
      'Unit economics',
      'Financial literacy',
      'Cost management',
      'Business metrics and KPIs',
      'Market awareness',
    ],
    'Customer & change': [
      'customer-focus=Customer focus',
      'change-management=Change management',
      'Customer service excellence',
      'Complaint resolution',
      'Digital transformation',
      'Innovation management',
      'Entrepreneurial mindset',
      'Sustainability and ESG',
    ],
  },
};

const RAW_AI_DATA: Record<string, string[]> = {
  'AI foundations': [
    'AI literacy',
    'Machine learning [ML]',
    'Supervised and unsupervised learning',
    'Model evaluation metrics [precision, recall, accuracy]',
    'Overfitting and bias-variance',
    'Training data quality',
    'Neural networks',
    'Natural language processing [NLP]',
    'Computer vision',
    'Predictive analytics',
  ],
  'Generative AI & LLMs': [
    'Generative AI [GenAI]',
    'Large language models [LLM]',
    'Tokens and context windows',
    'Hallucinations and limitations',
    'Fine-tuning vs prompting',
    'Embeddings',
    'Multimodal AI',
    'Model selection and cost trade-offs',
    'Small language models',
    'Reasoning models',
  ],
  Prompting: [
    'Prompt engineering',
    'Few-shot prompting',
    'Chain-of-thought prompting',
    'System prompts and instructions',
    'Structured outputs [JSON]',
    'Prompt evaluation and testing',
  ],
  'RAG & knowledge': [
    'Retrieval-augmented generation [RAG]',
    'Vector databases',
    'Chunking and indexing',
    'Knowledge bases',
    'Semantic search',
    'Grounding and citations',
  ],
  'Agentic AI': [
    'Agentic AI',
    'AI agents',
    'Tool use and function calling',
    'Model Context Protocol [MCP]',
    'Multi-agent systems',
    'Agent workflows and orchestration',
    'Human-in-the-loop',
    'Agent evaluation and guardrails',
  ],
  'AI tools & automation': [
    'ChatGPT',
    'Claude',
    'Gemini',
    'Microsoft Copilot',
    'Perplexity',
    'NotebookLM',
    'GitHub Copilot',
    'Workflow automation [Zapier, Make, n8n]',
    'No-code AI apps',
    'AI for Excel and Sheets',
    'Robotic process automation [RPA]',
    'AI meeting and note tools',
  ],
  'AI strategy & product': [
    'AI strategy',
    'AI use-case prioritisation',
    'AI business case and ROI',
    'Build vs buy for AI',
    'AI product management',
    'AI vendor evaluation',
    'Change management for AI adoption',
    'AI roadmap',
  ],
  'Responsible AI & governance': [
    'Responsible AI',
    'AI ethics',
    'Bias and fairness in AI',
    'AI privacy and data protection',
    'AI governance and risk',
    'AI regulation and compliance [EU AI Act, DPDP Act]',
    'Explainability',
    'AI security [prompt injection]',
    'Copyright and IP in AI',
  ],
  'AI in business functions': [
    'AI in marketing',
    'AI in sales',
    'AI in finance',
    'AI in HR',
    'AI in supply chain',
    'AI in customer support',
    'AI in consulting and research',
    'AI in product development',
  ],
};

// Build all TagDef objects
export const TRACK3_TAGS: TagDef[] = [];

// Populate domain tags
for (const [dom, groups] of Object.entries(RAW_DOMAIN_DATA)) {
  const domainId = dom as DomainId;
  for (const [groupName, items] of Object.entries(groups)) {
    for (const item of items) {
      TRACK3_TAGS.push(parseRawItem(item, domainId, groupName));
    }
  }
}

// Populate AI tags
export const AI_TAGS: TagDef[] = [];
for (const [groupName, items] of Object.entries(RAW_AI_DATA)) {
  for (const item of items) {
    const parsed = parseRawItem(item, 'ai', groupName);
    // For AI tags, also ensure label can be directly indexed
    AI_TAGS.push(parsed);
    TRACK3_TAGS.push(parsed);
  }
}

// Map by tag id
export const TAG_MAP: Record<string, TagDef> = Object.fromEntries(
  TRACK3_TAGS.map((t) => [t.id, t])
);

// Also index AI tags by label for AI question tag matching
export const AI_TAG_BY_LABEL_MAP: Record<string, TagDef> = Object.fromEntries(
  AI_TAGS.map((t) => [t.label, t])
);

// Map of domain -> list of skill groups
export interface SkillGroup {
  groupId: string;
  groupName: string;
  tags: TagDef[];
}

export function getDomainGroups(domain: TagDomain): SkillGroup[] {
  const tagsInDomain = domain === 'ai' ? AI_TAGS : TRACK3_TAGS.filter((t) => t.domain === domain);
  const groupsMap = new Map<string, { groupName: string; tags: TagDef[] }>();

  for (const tag of tagsInDomain) {
    if (!groupsMap.has(tag.groupId)) {
      groupsMap.set(tag.groupId, { groupName: tag.group, tags: [] });
    }
    groupsMap.get(tag.groupId)!.tags.push(tag);
  }

  return Array.from(groupsMap.entries()).map(([groupId, data]) => ({
    groupId,
    groupName: data.groupName,
    tags: data.tags,
  }));
}
