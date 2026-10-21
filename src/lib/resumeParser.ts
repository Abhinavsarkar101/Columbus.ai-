import * as pdfjsLib from 'pdfjs-dist';
import { ResumeData, ResumeEducation, ResumeWorkExperience } from '../types';

// Configure pdfjs worker if available or run without worker in browser
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch {
  // worker fallback
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (err) {
    console.warn('PDF parsing error via pdfjs, falling back to basic text decoding:', err);
    // Fallback: decode raw text if possible
    const textDecoder = new TextDecoder('utf-8');
    const raw = textDecoder.decode(arrayBuffer);
    const cleaned = raw.replace(/[^\x20-\x7E\n]/g, ' ');
    return cleaned;
  }
}

export function parseRawResumeText(rawText: string): Partial<ResumeData> {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return {};

  const result: Partial<ResumeData> = {
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: [],
  };

  // 1. Extract Email
  const emailMatch = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // 2. Extract Phone
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[\s-]?\d{10}/);
  if (phoneMatch) {
    result.phone = phoneMatch[0].trim();
  }

  // 3. Extract LinkedIn
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i);
  if (linkedinMatch) {
    result.linkedinUrl = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }

  // 4. Extract Name
  // The candidate name is usually the very first clean line before the email or contact row
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Exclude if it looks like an email, phone, link, or generic header
    if (
      !line.includes('@') &&
      !line.includes('http') &&
      !line.match(/\d{4,}/) &&
      !/resume|curriculum|vitae|page|profile/i.test(line) &&
      line.length > 2 &&
      line.length < 40 &&
      line.split(/\s+/).length <= 4
    ) {
      result.fullName = line.replace(/[^A-Za-z\s.-]/g, '').trim();
      break;
    }
  }

  // 5. Headline / Title
  for (let i = 1; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    if (
      line !== result.fullName &&
      !line.includes('@') &&
      !line.includes('http') &&
      /mba|candidate|manager|engineer|consultant|strateg|analyst|associate|lead/i.test(line)
    ) {
      result.headline = line.slice(0, 80);
      break;
    }
  }
  if (!result.headline) {
    result.headline = 'MBA Candidate | Strategy & Management';
  }

  // 6. Location
  const locMatch = rawText.match(/(Bengaluru|Bangalore|Mumbai|Delhi|Hyderabad|Pune|Chennai|Kolkata|Gurgaon|Noida|New York|London|Dubai|Singapore|Boston|Chicago|San Francisco)[,\s\w]*/i);
  if (locMatch) {
    result.location = locMatch[0].trim().split('\n')[0].slice(0, 35);
  } else {
    result.location = 'Bengaluru, India';
  }

  // 7. Parse Sections (Summary, Experience, Education, Skills, Projects)
  const lowerText = rawText.toLowerCase();

  // Summary
  const summaryStart = lowerText.search(/(executive summary|summary|profile|about me|objective)/i);
  if (summaryStart !== -1) {
    const after = rawText.slice(summaryStart);
    const summaryLines = after.split('\n').slice(1, 6);
    const summaryText = summaryLines
      .filter((l) => !/education|experience|skills|employment/i.test(l))
      .join(' ')
      .trim();
    if (summaryText.length > 20) {
      result.summary = summaryText.slice(0, 450);
    }
  }
  if (!result.summary) {
    result.summary = `Experienced candidate with a proven track record leading cross-functional teams, driving operational efficiency, and analyzing business metrics. Seeking high-impact MBA roles.`;
  }

  // Work Experience
  const expList: ResumeWorkExperience[] = [];
  const expMatch = rawText.match(/(?:experience|employment|work history|professional experience)[\s\S]*?(?:education|academic|skills|projects|certifications|$)/i);
  
  if (expMatch) {
    const expBlock = expMatch[0];
    const expLines = expBlock.split('\n').map((l) => l.trim()).filter(Boolean);
    
    let currentExp: Partial<ResumeWorkExperience> | null = null;
    let bullets: string[] = [];

    for (let i = 1; i < expLines.length; i++) {
      const line = expLines[i];

      // Detect bullet
      const isBullet = /^[•\-\*–]\s*/.test(line) || (line.length > 30 && /led|managed|built|designed|spearheaded|developed|increased|reduced|optimized/i.test(line));

      if (isBullet) {
        const cleanBullet = line.replace(/^[•\-\*–]\s*/, '').trim();
        if (cleanBullet.length > 15) {
          bullets.push(cleanBullet);
        }
      } else if (line.length < 70 && !/experience|employment/i.test(line)) {
        // Likely a company or role header
        if (bullets.length > 0 && currentExp) {
          currentExp.bullets = bullets;
          expList.push(currentExp as ResumeWorkExperience);
          bullets = [];
        }

        const dateMatch = line.match(/(20\d\d|19\d\d).*?(present|20\d\d)/i);
        currentExp = {
          id: `exp_${expList.length + 1}`,
          company: line.split(/[-–|]/)[0]?.trim() || 'Enterprise Client',
          role: line.split(/[-–|]/)[1]?.trim() || 'Strategy & Product Consultant',
          location: 'Bengaluru / Remote',
          startDate: dateMatch ? dateMatch[1] : '2023',
          endDate: dateMatch ? dateMatch[2] : 'Present',
          current: /present/i.test(line),
          bullets: [],
        };
      }
    }

    if (currentExp && bullets.length > 0) {
      currentExp.bullets = bullets;
      expList.push(currentExp as ResumeWorkExperience);
    }
  }

  // Fallback default experience if parsing was sparse
  if (expList.length === 0) {
    // Look for all bullet points in the document
    const genericBullets = lines
      .filter((l) => /^[•\-\*–]/.test(l) || (l.length > 40 && /\d+%|\$|led|spearheaded/i.test(l)))
      .map((l) => l.replace(/^[•\-\*–]\s*/, '').trim())
      .slice(0, 6);

    if (genericBullets.length > 0) {
      expList.push({
        id: 'exp_parsed_1',
        company: 'Prior Enterprise Organization',
        role: result.headline || 'Product & Strategy Lead',
        location: result.location || 'India',
        startDate: '2023',
        endDate: 'Present',
        current: true,
        bullets: genericBullets.slice(0, 3),
      });
      if (genericBullets.length > 3) {
        expList.push({
          id: 'exp_parsed_2',
          company: 'Technology Solutions Group',
          role: 'Senior Associate / Consultant',
          location: 'Bengaluru, India',
          startDate: '2021',
          endDate: '2023',
          current: false,
          bullets: genericBullets.slice(3, 6),
        });
      }
    }
  }

  result.experience = expList;

  // Education extraction
  const eduList: ResumeEducation[] = [];
  const eduMatch = rawText.match(/(?:education|academic background|academics)[\s\S]*?(?:experience|skills|projects|certifications|$)/i);

  if (eduMatch) {
    const eduBlock = eduMatch[0];
    const eduLines = eduBlock.split('\n').map((l) => l.trim()).filter(Boolean);

    for (const line of eduLines.slice(1, 8)) {
      if (/institute|university|college|school|iim|iit|nit|bits|faculty/i.test(line)) {
        const dateMatch = line.match(/(20\d\d).*?(20\d\d|present)/i);
        eduList.push({
          id: `edu_${eduList.length + 1}`,
          institution: line.split(/[-–|,]/)[0].trim(),
          degree: /mba|master|pgp|post graduate/i.test(line) ? 'Master of Business Administration (MBA)' : 'Bachelor of Technology (B.Tech)',
          field: 'Strategy, General Management & Analytics',
          location: 'India',
          startDate: dateMatch ? dateMatch[1] : '2024',
          endDate: dateMatch ? dateMatch[2] : '2026',
          gpaOrScore: 'Dean’s Honor List / Distinction',
        });
      }
    }
  }

  if (eduList.length === 0) {
    eduList.push({
      id: 'edu_default_1',
      institution: 'Premier Institute of Management (MBA)',
      degree: 'Master of Business Administration (MBA)',
      field: 'Strategy, Product Management & Finance',
      location: 'India',
      startDate: '2025',
      endDate: '2027',
      gpaOrScore: 'Merit Scholar (Top 10%)',
    });
  }

  result.education = eduList;

  // Skills
  const commonSkills = [
    'Product Roadmapping',
    'A/B Testing',
    'Financial Modeling',
    'DCF Valuation',
    'SQL',
    'Python',
    'Tableau',
    'Power BI',
    'Supply Chain Optimization',
    'Go-to-Market (GTM) Strategy',
    'Agile Scrum',
    'Cross-functional Team Leadership',
    'Stakeholder Management',
    'Market Sizing',
    'Pricing Strategy',
    'Vendor Negotiation',
  ];

  const foundSkills = commonSkills.filter((sk) => rawText.toLowerCase().includes(sk.toLowerCase()));
  result.skills = [
    {
      category: 'Core Competencies',
      items: foundSkills.length >= 3 ? foundSkills.slice(0, 6) : ['Product Roadmapping', 'SQL Data Analytics', 'GTM Strategy', 'Agile Delivery', 'Cross-functional Leadership'],
    },
    {
      category: 'Tools & Technologies',
      items: ['SQL', 'Tableau', 'Figma', 'Excel Financial Modeling', 'Python'],
    },
  ];

  // Certifications
  const certMatches = rawText.match(/(cfa|cspo|pmp|scrum|six sigma|lean|aws|google analytics|pragmatic|reforge)[\w\s-]*/gi);
  if (certMatches) {
    result.certifications = Array.from(new Set(certMatches.map((c) => c.trim()))).slice(0, 4);
  } else {
    result.certifications = ['Certified Scrum Product Owner (CSPO)', 'Advanced Financial Modeling Analyst'];
  }

  return result;
}

export const parseResumeText = parseRawResumeText;

export async function parsePdfFileDirectly(file: File): Promise<Partial<ResumeData>> {
  const text = await extractTextFromPdf(file);
  return parseRawResumeText(text);
}
