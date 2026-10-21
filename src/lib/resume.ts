import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ResumeData } from '../types';

export const SAMPLE_MBA_RESUME: ResumeData = {
  fullName: 'Abhinav Sarkar',
  headline: 'MBA Candidate | Product & Strategy | Ex-Tech Lead',
  email: 'abhinav.sarkar@alumni.iim.ac.in',
  phone: '+91 98201 45678',
  location: 'Bengaluru, India',
  linkedinUrl: 'https://linkedin.com/in/abhinav-sarkar-mba',
  githubOrPortfolio: 'https://github.com/abhinav-sarkar',
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
};

export const DEFAULT_RESUME: ResumeData = SAMPLE_MBA_RESUME;

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

  const metricRegex = /(\d+[\.,]?\d*|\$|₹|%|bps|x|lpa|crore|million|billion|k\b)/i;
  const quantified = bullets.filter((b) => metricRegex.test(b));

  return {
    totalBullets: bullets.length,
    quantifiedCount: quantified.length,
    percentage: Math.round((quantified.length / bullets.length) * 100),
  };
}

export function generateAtsPlainText(resume: ResumeData): string {
  const lines: string[] = [];
  lines.push((resume.fullName || 'CANDIDATE NAME').toUpperCase());
  if (resume.headline) lines.push(resume.headline);
  lines.push(`Email: ${resume.email || 'N/A'} | Phone: ${resume.phone || 'N/A'} | Location: ${resume.location || 'N/A'}`);
  if (resume.linkedinUrl) lines.push(`LinkedIn: ${resume.linkedinUrl}`);
  if (resume.githubOrPortfolio) lines.push(`Portfolio: ${resume.githubOrPortfolio}`);
  lines.push('\n' + '='.repeat(60) + '\n');

  if (resume.summary) {
    lines.push('EXECUTIVE SUMMARY');
    lines.push(resume.summary);
    lines.push('\n' + '='.repeat(60) + '\n');
  }

  if (resume.education.length > 0) {
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

  if (resume.experience.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE');
    for (const exp of resume.experience) {
      lines.push(`${exp.role.toUpperCase()} | ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})`);
      lines.push(`Location: ${exp.location}`);
      for (const b of exp.bullets) {
        lines.push(`  • ${b}`);
      }
      lines.push('');
    }
    lines.push('='.repeat(60) + '\n');
  }

  if (resume.projects.length > 0) {
    lines.push('SELECTED PROJECTS & CAPSTONES');
    for (const proj of resume.projects) {
      lines.push(`${proj.name} — ${proj.context}`);
      for (const b of proj.bullets) {
        lines.push(`  • ${b}`);
      }
      lines.push('');
    }
    lines.push('='.repeat(60) + '\n');
  }

  if (resume.skills.length > 0) {
    lines.push('CORE SKILLS & COMPETENCIES');
    for (const s of resume.skills) {
      if (s.items.length > 0) {
        lines.push(`${s.category}: ${s.items.join(', ')}`);
      }
    }
    lines.push('\n' + '='.repeat(60) + '\n');
  }

  if (resume.certifications.length > 0) {
    lines.push('CERTIFICATIONS & HONORS');
    for (const c of resume.certifications) {
      lines.push(`  • ${c}`);
    }
  }

  return lines.join('\n');
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
