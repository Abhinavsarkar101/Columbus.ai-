import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ResumeData, ResumeTemplateId, ResumeFontFamily, AtsCheckResult } from '../types';

export interface TemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  tagline: string;
  description: string;
  atsSafetyScore: number;
  badge?: string;
}

export const RESUME_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'clean',
    name: 'Clean',
    tagline: 'Single-column with crisp horizontal rule & clean dates',
    description: 'Crisp typography and uniform spacing so recruiters can scan core credentials effortlessly.',
    atsSafetyScore: 100,
    badge: 'Most Popular',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Centered header, generous margins, ultra-clean typography',
    description: 'Strips away non-essential design elements to focus heavily on readability and content hierarchy.',
    atsSafetyScore: 100,
  },
  {
    id: 'modern',
    name: 'Modern',
    tagline: 'Prominent accent header, colored section titles & bars',
    description: 'Contemporary look with accent divider rules and bold section titles while maintaining 100% ATS safety.',
    atsSafetyScore: 100,
  },
  {
    id: 'fresher',
    name: 'Fresher',
    tagline: 'Education-first, project tech-stack pill tags & CGPA prominence',
    description: 'Purpose-built for students & recent grads: puts Education, CGPA, and Projects with pill tags at the top.',
    atsSafetyScore: 95,
    badge: 'India Fresher',
  },
  {
    id: 'executive',
    name: 'Executive',
    tagline: 'Contrast top header banner bar, high-impact leadership layout',
    description: 'Prominent dark header banner with inverted contact info, engineered for experienced managers.',
    atsSafetyScore: 98,
  },
  {
    id: 'academic',
    name: 'Academic',
    tagline: 'Structured formal table matrix & two-tier dividers',
    description: 'Premier B-school placement committee standard format with compact qualifications and honors matrix.',
    atsSafetyScore: 100,
  },
];

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
}

export const RESUME_ACCENT_COLORS: ColorPreset[] = [
  { id: 'blue', name: 'Royal Blue', hex: '#2563EB' },
  { id: 'teal', name: 'Teal', hex: '#0D9488' },
  { id: 'purple', name: 'Violet', hex: '#7C3AED' },
  { id: 'green', name: 'Emerald', hex: '#059669' },
  { id: 'red', name: 'Crimson', hex: '#DC2626' },
  { id: 'orange', name: 'Amber', hex: '#EA580C' },
  { id: 'charcoal', name: 'Dark Slate', hex: '#334155' },
  { id: 'black', name: 'Pitch Black', hex: '#0F172A' },
];

export interface FontPreset {
  id: ResumeFontFamily;
  name: string;
  headingFamily: string;
  bodyFamily: string;
  cssStyle: string;
  previewLabel: string;
}

export const RESUME_FONTS: FontPreset[] = [
  {
    id: 'sans',
    name: 'Modern Sans',
    headingFamily: 'system-ui, -apple-system, sans-serif',
    bodyFamily: 'system-ui, -apple-system, sans-serif',
    cssStyle: 'font-sans',
    previewLabel: 'Ag',
  },
  {
    id: 'serif',
    name: 'Editorial Serif',
    headingFamily: 'Georgia, Cambria, serif',
    bodyFamily: 'Georgia, Cambria, serif',
    cssStyle: 'font-serif',
    previewLabel: 'Ag',
  },
  {
    id: 'slab',
    name: 'Corporate Slab',
    headingFamily: 'ui-serif, Georgia, serif',
    bodyFamily: 'ui-serif, Georgia, serif',
    cssStyle: 'font-serif',
    previewLabel: 'Ag',
  },
  {
    id: 'clean',
    name: 'Clean Geometric',
    headingFamily: 'system-ui, sans-serif',
    bodyFamily: 'system-ui, sans-serif',
    cssStyle: 'font-sans',
    previewLabel: 'Ag',
  },
  {
    id: 'modern',
    name: 'Contemporary',
    headingFamily: 'system-ui, sans-serif',
    bodyFamily: 'system-ui, sans-serif',
    cssStyle: 'font-sans',
    previewLabel: 'Ag',
  },
];

export interface PowerVerbCategory {
  category: string;
  description: string;
  verbs: string[];
}

export const POWER_VERBS_CATALOG: PowerVerbCategory[] = [
  {
    category: 'Leadership & Strategy',
    description: 'Lead initiatives, direct teams, and govern vision',
    verbs: ['Spearheaded', 'Orchestrated', 'Architected', 'Championed', 'Directed', 'Mobilized', 'Formulated', 'Piloted', 'Pioneered', 'Restructured', 'Overhauled', 'Steered'],
  },
  {
    category: 'Commercial Growth & Revenue',
    description: 'Grow sales, capture market share, and monetize',
    verbs: ['Accelerated', 'Maximized', 'Captured', 'Generated', 'Expanded', 'Negotiated', 'Outpaced', 'Monetized', 'Cultivated', 'Boosted', 'Elevated', 'Delivered'],
  },
  {
    category: 'Quantitative & Analytical',
    description: 'Model data, diagnose root causes, and evaluate ROI',
    verbs: ['Engineered', 'Modeled', 'Quantified', 'Audited', 'Diagnosed', 'Synthesized', 'Forecasted', 'Benchmarked', 'Decoded', 'Calculated', 'Validated', 'Pinpointed'],
  },
  {
    category: 'Process & Operational Efficiency',
    description: 'Slash costs, eliminate waste, and scale capacity',
    verbs: ['Streamlined', 'Standardized', 'Automated', 'Consolidated', 'Slashed', 'Optimized', 'Eliminated', 'Expedited', 'Restructured', 'Re-engineered', 'Unified', 'Trimmed'],
  },
  {
    category: 'Product & Execution',
    description: 'Design products, ship roadmaps, and delight users',
    verbs: ['Launched', 'Deployed', 'Iterated', 'Defined', 'Prototyped', 'Shipped', 'Synthesized', 'Prioritized', 'Deconstructed', 'Scaled', 'Institutionalized'],
  },
  {
    category: 'Cross-Functional & Partnering',
    description: 'Build consensus, resolve friction, and align stakeholders',
    verbs: ['Partnered', 'Aligned', 'Mentored', 'Facilitated', 'Brokered', 'Coordinated', 'Influenced', 'Co-developed', 'Unified', 'Advised'],
  },
];

export interface XyzTemplate {
  id: string;
  title: string;
  category: string;
  formula: string;
  example: string;
  snippet: string;
}

export const GOOGLE_XYZ_TEMPLATES: XyzTemplate[] = [
  {
    id: 'xyz_growth',
    title: 'Revenue & Metric Growth',
    category: 'Commercial',
    formula: 'Accomplished [X: Business Goal] as measured by [Y: Quantitative Growth Metric], by doing [Z: Strategic Action].',
    example: 'Accelerated quarterly enterprise SaaS ARR by $1.4M (28% YoY growth) by restructuring enterprise sales territory assignment and discounting guidelines.',
    snippet: 'Accelerated [Business Outcome] by [Metric / $ / %], through [Specific Strategy or Implementation].',
  },
  {
    id: 'xyz_efficiency',
    title: 'Cost & Operational Reduction',
    category: 'Operations',
    formula: 'Reduced [X: Inefficiency / Cost] by [Y: %, Time or $ Saved], by designing and executing [Z: Process Overhaul].',
    example: 'Decreased customer checkout latency by 42% (slashing drop-offs from 7.1% to 3.2%) by engineering an asynchronous payment tokenization flow.',
    snippet: 'Reduced [Bottleneck / Overhead] by [Metric / %], by implementing [Process Automation / Workflow Overhaul].',
  },
  {
    id: 'xyz_scale',
    title: 'Team & Program Leadership',
    category: 'Leadership',
    formula: 'Led cross-functional team of [X: Size / Scope] to deliver [Y: Measurable Milestone] ahead of [Z: Target Timeline].',
    example: 'Orchestrated 14-engineer sprint pod delivering Tier-1 telecom core billing integration 3 weeks ahead of schedule with 99.99% migration integrity.',
    snippet: 'Orchestrated [Team / Workstream of N] to launch [Milestone / Product], achieving [Outcome Metric] across [Scope].',
  },
  {
    id: 'xyz_customer',
    title: 'User Retention & NPS Impact',
    category: 'Product',
    formula: 'Boosted [X: User Engagement / Adoption] from [A] to [B], by deploying [Z: Feature / Discovery Research].',
    example: 'Boosted 90-day B2B merchant retention from 68% to 84% by launching automated onboarding walkthroughs and milestone celebration nudges.',
    snippet: 'Boosted [Adoption / Retention] by [Metric %], by deconstructing user churn feedback and deploying [Key Solution].',
  },
];

export const EMPTY_RESUME_DATA: ResumeData = {
  fullName: '',
  headline: '',
  email: '',
  phone: '',
  location: '',
  linkedinUrl: '',
  githubOrPortfolio: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  customSections: [],
  targetDomain: 'product',
  activeTemplate: 'clean',
  accentColor: '#2563EB',
  fontFamily: 'sans',
  fontSize: 'base',
  sectionOrder: ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'],
  sectionVisibility: {
    summary: true,
    experience: true,
    education: true,
    projects: true,
    skills: true,
    certifications: true,
  },
};

export const SAMPLE_MBA_RESUME: ResumeData = {
  fullName: 'Alex Rivera',
  headline: 'MBA Candidate | Product & Strategy | Ex-Tech Lead',
  email: 'alex.rivera@alumni.mba.edu',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA',
  linkedinUrl: 'https://linkedin.com/in/alex-rivera-mba',
  githubOrPortfolio: 'https://github.com/alex-rivera',
  summary:
    'MBA candidate with 4+ years of cross-functional experience across software engineering, business analysis, and product strategy. Proven track record leading enterprise data platforms, defining roadmaps, and optimizing monetization unit economics. Seeking post-MBA Product Management or Strategy roles.',
  education: [
    {
      id: 'edu_1',
      institution: 'Premier Indian Institute of Management (IIM)',
      degree: 'Master of Business Administration (MBA)',
      field: 'Strategy, Product Management & Corporate Finance',
      location: 'Bengaluru, India',
      startDate: '2025',
      endDate: '2027',
      gpaOrScore: 'GPA: 3.84 / 4.00 (Top 10% Dean’s Merit List)',
      honors: 'National Finalist — Inter-B-School Case Competition; President, Product & Tech Club',
    },
    {
      id: 'edu_2',
      institution: 'National Institute of Technology (NIT)',
      degree: 'Bachelor of Technology (B.Tech)',
      field: 'Computer Science and Engineering',
      location: 'India',
      startDate: '2019',
      endDate: '2023',
      gpaOrScore: 'CGPA: 8.94 / 10.0',
      honors: 'Institute Merit Scholarship; Technical Symposium Lead',
    },
  ],
  experience: [
    {
      id: 'exp_1',
      company: 'Enterprise Digital Platforms',
      role: 'Senior Product Management Consultant (Intern / Associate)',
      location: 'Bengaluru / Dubai',
      startDate: 'May 2026',
      endDate: 'July 2026',
      current: false,
      bullets: [
        'Architected BSS/OSS digital monetization roadmap across 4 Tier-1 telecom operators in MEA, driving a projected $3.2M incremental ARR.',
        'Led discovery sprints with 18 enterprise client stakeholders, transforming legacy billing specifications into 24 streamlined PRD user epics.',
        'Partnered with engineering and QA to achieve 99.98% platform SLA compliance during live multi-tenant billing platform migration.',
      ],
    },
    {
      id: 'exp_2',
      company: 'FinTech Software Solutions',
      role: 'Product Engineer & Technical Lead',
      location: 'Bengaluru, India',
      startDate: 'Aug 2023',
      endDate: 'May 2025',
      current: false,
      bullets: [
        'Spearheaded checkout reliability initiatives across 12,000+ e-commerce merchants, decreasing gateway drop-off rates from 8.4% to 2.9%.',
        'Built automated fraud anomaly detection scoring model handling 450+ TPS, saving an estimated $420K in monthly unauthorized chargebacks.',
        'Mentored 6 junior engineers and managed weekly sprint retrospectives, improving engineering release velocity by 34%.',
      ],
    },
  ],
  skills: [
    {
      category: 'Product & Strategy',
      items: ['Product Roadmapping', 'PRD Authoring', 'A/B Testing & Experimentation', 'Figma Wireframing', 'Go-To-Market (GTM) Strategy', 'Competitive Benchmarking'],
    },
    {
      category: 'Technical & Analytics',
      items: ['SQL & Data Warehousing', 'Python for Business Analytics', 'Tableau Dashboards', 'API Architecture', 'AWS Cloud Infrastructure'],
    },
    {
      category: 'Business & Finance',
      items: ['Discounted Cash Flow (DCF) Modeling', 'Unit Economics (CAC / LTV)', 'SaaS Pricing & Packaging', 'Vendor Contract Negotiation'],
    },
  ],
  projects: [
    {
      id: 'proj_1',
      name: 'Quick Commerce Dark Store Stockout Optimization',
      context: 'Operations Capstone in partnership with On-Demand Retailer',
      bullets: [
        'Modeled probabilistic inventory replenishment using Monte Carlo simulations, slashing perishables stockout frequency by 19% across 14 dark stores.',
        'Formulated dynamic delivery batching algorithm that improved delivery fleet rider utilization by 1.4x during peak lunch/dinner windows.',
      ],
    },
    {
      id: 'proj_2',
      name: 'B2B FinTech Valuation & Synergies Model',
      context: 'Corporate Valuation Competition (National Finalist)',
      bullets: [
        'Constructed complete 3-statement LBO and DCF financial model evaluating a $1.2B cross-border payment infrastructure acquisition.',
        'Identified $38M in cost synergies and presented strategic recommendations to an executive jury of investment banking partners.',
      ],
    },
  ],
  certifications: [
    'Certified Scrum Product Owner (CSPO) — Scrum Alliance',
    'Financial Modeling & Valuation Analyst (FMVA) — CFI',
    'Google Data Analytics Professional Certificate',
  ],
  targetDomain: 'product',
  // upRezr customizer defaults
  activeTemplate: 'clean',
  accentColor: '#2563EB',
  fontFamily: 'sans',
  fontSize: 'base',
  sectionOrder: ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'],
  sectionVisibility: {
    summary: true,
    experience: true,
    education: true,
    projects: true,
    skills: true,
    certifications: true,
  },
};

export const BLANK_RESUME: ResumeData = {
  fullName: '',
  headline: '',
  email: '',
  phone: '',
  location: '',
  linkedinUrl: '',
  githubOrPortfolio: '',
  summary: '',
  education: [],
  experience: [],
  skills: [
    { category: 'Core Competencies', items: [] },
    { category: 'Tools & Technologies', items: [] },
  ],
  projects: [],
  certifications: [],
  targetDomain: 'product',
  activeTemplate: 'clean',
  accentColor: '#2563EB',
  fontFamily: 'sans',
  fontSize: 'base',
  sectionOrder: ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'],
  sectionVisibility: {
    summary: true,
    experience: true,
    education: true,
    projects: true,
    skills: true,
    certifications: true,
  },
};

export const DEFAULT_RESUME: ResumeData = SAMPLE_MBA_RESUME;

export function hasMetric(text: string): boolean {
  if (!text) return false;
  const metricRegex = /(\d+[\.,]?\d*|\$|₹|%|bps|x|lpa|crore|cr\b|million|billion|k\b)/i;
  return metricRegex.test(text);
}

export function startsWithActionVerb(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  const firstWord = trimmed.split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, '') || '';
  if (!firstWord) return false;

  const allVerbs = new Set(
    POWER_VERBS_CATALOG.flatMap((c) => c.verbs.map((v) => v.toLowerCase()))
  );
  // Add common verbs
  allVerbs.add('led');
  allVerbs.add('managed');
  allVerbs.add('built');
  allVerbs.add('created');
  allVerbs.add('delivered');
  allVerbs.add('designed');
  allVerbs.add('developed');
  allVerbs.add('drove');
  allVerbs.add('implemented');
  allVerbs.add('improved');
  allVerbs.add('increased');
  allVerbs.add('reduced');
  allVerbs.add('saved');
  allVerbs.add('scaled');

  return allVerbs.has(firstWord.toLowerCase());
}

export function calculateBulletMetrics(resume: ResumeData): {
  totalBullets: number;
  quantifiedCount: number;
  percentage: number;
} {
  const bullets = [
    ...resume.experience.flatMap((e) => e.bullets),
    ...resume.projects.flatMap((p) => p.bullets),
  ];

  if (bullets.length === 0) {
    return { totalBullets: 0, quantifiedCount: 0, percentage: 0 };
  }

  const quantified = bullets.filter((b) => hasMetric(b));

  return {
    totalBullets: bullets.length,
    quantifiedCount: quantified.length,
    percentage: Math.round((quantified.length / bullets.length) * 100),
  };
}

export function generateAtsPlainText(resume: ResumeData): string {
  const lines: string[] = [];
  if (resume.fullName) lines.push(resume.fullName.toUpperCase());
  if (resume.headline) lines.push(resume.headline);
  lines.push(`Email: ${resume.email || 'N/A'} | Phone: ${resume.phone || 'N/A'} | Location: ${resume.location || 'N/A'}`);
  if (resume.linkedinUrl) lines.push(`LinkedIn: ${resume.linkedinUrl}`);
  if (resume.githubOrPortfolio) lines.push(`Portfolio: ${resume.githubOrPortfolio}`);
  lines.push('\n' + '='.repeat(60) + '\n');

  const order = resume.sectionOrder || ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'];
  const vis = resume.sectionVisibility || {};

  for (const section of order) {
    if (vis[section] === false) continue;

    if (section === 'summary' && resume.summary) {
      lines.push('EXECUTIVE SUMMARY');
      lines.push(resume.summary);
      lines.push('\n' + '='.repeat(60) + '\n');
    }

    if (section === 'experience' && resume.experience.length > 0) {
      lines.push('PROFESSIONAL EXPERIENCE');
      for (const exp of resume.experience) {
        lines.push(`${exp.role.toUpperCase()} | ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})`);
        lines.push(`Location: ${exp.location}`);
        for (const b of exp.bullets) {
          if (b.trim()) lines.push(`  • ${b}`);
        }
        lines.push('');
      }
      lines.push('='.repeat(60) + '\n');
    }

    if (section === 'education' && resume.education.length > 0) {
      lines.push('EDUCATION');
      for (const edu of resume.education) {
        lines.push(`${edu.degree} — ${edu.institution} (${edu.startDate} - ${edu.endDate})`);
        lines.push(`Field: ${edu.field} | ${edu.location}`);
        if (edu.gpaOrScore) lines.push(edu.gpaOrScore);
        if (edu.honors) lines.push(`Honors: ${edu.honors}`);
        lines.push('');
      }
      lines.push('='.repeat(60) + '\n');
    }

    if (section === 'projects' && resume.projects.length > 0) {
      lines.push('SELECTED PROJECTS & CAPSTONES');
      for (const proj of resume.projects) {
        lines.push(`${proj.name} — ${proj.context}`);
        for (const b of proj.bullets) {
          if (b.trim()) lines.push(`  • ${b}`);
        }
        lines.push('');
      }
      lines.push('='.repeat(60) + '\n');
    }

    if (section === 'skills' && resume.skills.length > 0) {
      lines.push('CORE SKILLS & COMPETENCIES');
      for (const s of resume.skills) {
        if (s.items.length > 0) {
          lines.push(`${s.category}: ${s.items.join(', ')}`);
        }
      }
      lines.push('\n' + '='.repeat(60) + '\n');
    }

    if (section === 'certifications' && resume.certifications.length > 0) {
      lines.push('CERTIFICATIONS & HONORS');
      for (const c of resume.certifications) {
        lines.push(`  • ${c}`);
      }
      lines.push('\n' + '='.repeat(60) + '\n');
    }

    // Custom section matching current section id
    if (resume.customSections && resume.customSections.length > 0) {
      const matchCustom = resume.customSections.find((cs) => cs.id === section);
      if (matchCustom) {
        renderCustomSectionAts(matchCustom, lines);
      }
    }
  }

  // Any custom sections not explicitly ordered in sectionOrder
  if (resume.customSections && resume.customSections.length > 0) {
    for (const cs of resume.customSections) {
      if (!(resume.sectionOrder || []).includes(cs.id)) {
        renderCustomSectionAts(cs, lines);
      }
    }
  }

  return lines.join('\n');
}

function renderCustomSectionAts(cs: any, lines: string[]) {
  lines.push(cs.title.toUpperCase());
  if (cs.kind === 'entries' && cs.entries) {
    for (const entry of cs.entries) {
      const headerParts = [entry.title];
      if (entry.subtitle) headerParts.push(entry.subtitle);
      if (entry.location) headerParts.push(entry.location);
      const dates = entry.startDate ? `${entry.startDate} – ${entry.endDate || 'Present'}` : '';
      if (dates) headerParts.push(`(${dates})`);
      lines.push(headerParts.join(' — '));
      if (entry.bullets) {
        for (const b of entry.bullets) {
          if (b.trim()) lines.push(`  • ${b}`);
        }
      }
      lines.push('');
    }
  } else if (cs.kind === 'bullets' && cs.bullets) {
    for (const b of cs.bullets) {
      if (b.trim()) lines.push(`  • ${b}`);
    }
  } else if (cs.kind === 'paragraph' && cs.paragraph) {
    lines.push(cs.paragraph);
  } else if (cs.kind === 'tags' && cs.tags) {
    lines.push(cs.tags.join(' · '));
  } else if (cs.kind === 'keyvalue' && cs.keyValues) {
    for (const kv of cs.keyValues) {
      lines.push(`${kv.label}: ${kv.value}`);
    }
  }
  lines.push('\n' + '='.repeat(60) + '\n');
}

export async function exportResumeToPdf(elementId: string, filename: string = 'Resume.pdf'): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for PDF export.`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('PDF generation failed:', err);
    return false;
  }
}

export function runAtsChecks(resume: ResumeData): AtsCheckResult[] {
  const customBullets: string[] = [];
  if (resume.customSections) {
    for (const cs of resume.customSections) {
      if (cs.kind === 'entries' && cs.entries) {
        for (const e of cs.entries) {
          if (e.bullets) customBullets.push(...e.bullets);
        }
      } else if (cs.kind === 'bullets' && cs.bullets) {
        customBullets.push(...cs.bullets);
      }
    }
  }

  const allBullets = [
    ...resume.experience.flatMap((e) => e.bullets),
    ...resume.projects.flatMap((p) => p.bullets),
    ...customBullets,
  ].filter((b) => b.trim().length > 0);

  const quantified = allBullets.filter((b) => hasMetric(b));
  const quantifiedScore = allBullets.length > 0 ? Math.round((quantified.length / allBullets.length) * 100) : 0;

  const actionVerbCount = allBullets.filter((b) => startsWithActionVerb(b)).length;
  const actionVerbScore = allBullets.length > 0 ? Math.round((actionVerbCount / allBullets.length) * 100) : 0;

  const hasContact = Boolean(resume.email && resume.phone && resume.location);
  const hasLinkedIn = Boolean(resume.linkedinUrl && resume.linkedinUrl.includes('linkedin.com'));
  const hasSummary = Boolean(resume.summary && resume.summary.length > 50);
  const hasExperience = resume.experience.length > 0;
  const hasEducation = resume.education.length > 0;
  const hasSkills = resume.skills.some((s) => s.items.length > 0);

  return [
    {
      id: 'contact_coordinates',
      name: 'Essential Contact Coordinates',
      passed: hasContact,
      severity: 'error',
      message: hasContact
        ? 'Email, phone, and location are complete for recruitment outreach.'
        : 'Missing required contact fields (email, phone, or location). Recruiters need direct contact info.',
    },
    {
      id: 'linkedin_presence',
      name: 'LinkedIn Profile Integration',
      passed: hasLinkedIn,
      severity: 'warning',
      message: hasLinkedIn
        ? 'Valid LinkedIn profile attached for instant recruiter background verification.'
        : 'Include a verified LinkedIn profile URL to boost recruiter credibility and ATS match.',
    },
    {
      id: 'metric_quantification',
      name: 'Google XYZ Bullet Metric Density',
      passed: quantifiedScore >= 60,
      severity: 'warning',
      message: `${quantifiedScore}% of bullets contain quantified metrics (${quantified.length}/${allBullets.length}). Aim for 60%+ with numbers, percentages, or revenue figures.`,
    },
    {
      id: 'executive_action_verbs',
      name: 'Executive Leadership Verbs',
      passed: actionVerbScore >= 65,
      severity: 'warning',
      message: `${actionVerbScore}% of bullets start with active leadership verbs (${actionVerbCount}/${allBullets.length}). Avoid passive verbs like "Responsible for" or "Assisted with".`,
    },
    {
      id: 'core_sections',
      name: 'Standard ATS Section Architecture',
      passed: hasExperience && hasEducation && hasSkills,
      severity: 'error',
      message: hasExperience && hasEducation && hasSkills
        ? 'All essential ATS sections (Experience, Education, Skills) are present and structured.'
        : 'Ensure Experience, Education, and Skills sections are populated.',
    },
    {
      id: 'executive_summary',
      name: 'Executive Elevator Summary',
      passed: hasSummary,
      severity: 'info',
      message: hasSummary
        ? 'Concise 2–3 sentence executive summary sets candidate positioning.'
        : 'Add a 2–3 sentence executive summary highlighting pre-MBA tenure and post-MBA aspirations.',
    },
  ];
}

export async function downloadResumePdf(resume: ResumeData): Promise<boolean> {
  return exportResumeToPdf('resume-sheet-preview', `${(resume.fullName || 'MBA_Candidate').replace(/\s+/g, '_')}_Resume.pdf`);
}
