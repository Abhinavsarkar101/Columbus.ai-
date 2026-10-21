import { DomainId, FreeTextSignal, TraitId } from '../types';

interface LexiconEntry {
  keywords: string[];
  domains: Partial<Record<DomainId, number>>;
  traits: Partial<Record<TraitId, number>>;
  description: string;
}

const DOMAIN_LEXICON: LexiconEntry[] = [
  {
    keywords: ['product', 'prd', 'wireframe', 'figma', 'user story', 'backlog', 'sprint', 'feature', 'user experience', 'ux', 'roadmap', 'churn', 'retention', 'a/b test', 'onboarding'],
    domains: { product: 4 },
    traits: { creative: 2, execution: 2, analytical: 1 },
    description: 'Product management & discovery cues',
  },
  {
    keywords: ['valuation', 'dcf', 'lbo', 'm&a', 'merger', 'acquisition', 'financial model', 'equity', 'ebitda', 'capital structure', 'pitch book', 'due diligence', 'budget', 'forecast', 'cash flow', 'balance sheet', 'working capital', 'private equity', 'venture capital'],
    domains: { finance: 4 },
    traits: { analytical: 3, commercial: 2, structure: 2 },
    description: 'Corporate finance & deal advisory cues',
  },
  {
    keywords: ['consulting', 'mece', 'hypothesis', 'framework', 'slide deck', 'c-suite', 'executive presentation', 'market sizing', 'strategic problem', 'restructuring', 'benchmarking', 'turnaround', 'stakeholder alignment'],
    domains: { consulting: 4 },
    traits: { structure: 3, people: 2, commercial: 2 },
    description: 'Management consulting & strategic advisory cues',
  },
  {
    keywords: ['brand', 'campaign', 'advertising', 'consumer', 'fmcg', 'media plan', 'roas', 'positioning', 'packaging', 'social media', 'creative agency', 'content', 'market share', 'influencer'],
    domains: { marketing: 4 },
    traits: { creative: 3, commercial: 2, people: 2 },
    description: 'Brand marketing & consumer campaign cues',
  },
  {
    keywords: ['supply chain', 'logistics', 'warehouse', 'inventory', 'procurement', 'vendor', 'lead time', 'fulfillment', 'freight', 'six sigma', 'lean', 'bottleneck', 'kaizen', 'safety stock', 'otif'],
    domains: { operations: 4 },
    traits: { execution: 3, structure: 3 },
    description: 'Operations, logistics & procurement cues',
  },
  {
    keywords: ['sql', 'python', 'analytics', 'tableau', 'powerbi', 'dashboard', 'regression', 'cohort', 'data science', 'metric', 'cltv', 'causal inference', 'ab test', 'telemetry', 'snowflake'],
    domains: { analytics: 4 },
    traits: { analytical: 4, structure: 2 },
    description: 'Business analytics & data modeling cues',
  },
  {
    keywords: ['talent', 'hiring', 'recruiting', 'hrbp', 'compensation', 'benefits', 'performance review', 'attrition', 'enps', 'culture', 'employee relations', 'succession', 'people ops', 'training'],
    domains: { hr: 4 },
    traits: { people: 4, structure: 2 },
    description: 'People operations & human resources cues',
  },
  {
    keywords: ['sales', 'deal', 'enterprise', 'contract', 'pipeline', 'quota', 'b2b', 'revenue', 'commission', 'account executive', 'chief of staff', 'gmv', 'p&l', 'founder office', 'client relationship'],
    domains: { sales_gm: 4 },
    traits: { commercial: 4, execution: 2, people: 2 },
    description: 'Enterprise sales, P&L & general management cues',
  },
];

const INTENSITY_MODIFIERS: Record<string, number> = {
  deep: 1.3,
  deeply: 1.3,
  very: 1.25,
  extensive: 1.3,
  obsessed: 1.4,
  heavily: 1.3,
  expert: 1.35,
  strong: 1.2,
  primary: 1.2,
  lead: 1.2,
  only: 1.1,
  somewhat: 0.7,
  basic: 0.6,
  slight: 0.5,
};

const NEGATION_WORDS = ['not', 'never', 'avoid', 'hate', 'dislike', 'without', "don't", 'no'];

export function parseFreeText(text: string, questionId: number): FreeTextSignal | null {
  if (!text || text.trim().length < 3) return null;

  const clean = text.toLowerCase().trim();
  const words = clean.split(/\s+/);
  
  // Check for gibberish or extremely short unhelpful text
  if (words.length === 1 && words[0].length < 4) return null;

  const detectedDomains: Partial<Record<DomainId, number>> = {};
  const detectedTraits: Partial<Record<TraitId, number>> = {};
  const matchedKeywords: string[] = [];
  const explanations: string[] = [];

  let isNegating = false;
  let currentIntensity = 1.0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-z0-9]/g, '');
    
    if (NEGATION_WORDS.includes(word)) {
      isNegating = true;
      continue;
    }

    if (INTENSITY_MODIFIERS[word]) {
      currentIntensity = INTENSITY_MODIFIERS[word];
      continue;
    }

    // Look for single word or bigram match
    const bigram = i < words.length - 1 ? `${word} ${words[i + 1].replace(/[^a-z0-9]/g, '')}` : '';

    for (const entry of DOMAIN_LEXICON) {
      for (const kw of entry.keywords) {
        if (kw === bigram || kw === word) {
          matchedKeywords.push(kw);
          const weightMultiplier = (isNegating ? -0.5 : 1.0) * currentIntensity;

          for (const [dom, weight] of Object.entries(entry.domains)) {
            const domainKey = dom as DomainId;
            const current = detectedDomains[domainKey] || 0;
            detectedDomains[domainKey] = Math.max(0, current + (weight as number) * weightMultiplier);
          }

          for (const [trait, weight] of Object.entries(entry.traits)) {
            const traitKey = trait as TraitId;
            const current = detectedTraits[traitKey] || 0;
            detectedTraits[traitKey] = Math.max(0, current + (weight as number) * weightMultiplier);
          }

          explanations.push(`Identified "${kw}" indicating ${entry.description}`);
        }
      }
    }

    // Reset modifier window
    if (isNegating && i % 3 === 0) isNegating = false;
    currentIntensity = 1.0;
  }

  if (matchedKeywords.length === 0) {
    return {
      rawText: text,
      questionId,
      detectedDomains: {},
      detectedTraits: {},
      extractedKeywords: [],
      confidence: 0.1,
      explanation: 'No specific MBA domain terms recognized in note. Preserving as qualitative commentary.',
    };
  }

  // Calculate confidence based on keyword count and text length
  const confidence = Math.min(0.95, 0.4 + matchedKeywords.length * 0.15);

  return {
    rawText: text,
    questionId,
    detectedDomains,
    detectedTraits,
    extractedKeywords: Array.from(new Set(matchedKeywords)),
    confidence,
    explanation: explanations.slice(0, 3).join('. '),
  };
}
