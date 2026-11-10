import {
  ResumeData,
  ResumeEducation,
  ResumeWorkExperience,
  CustomSection,
  CustomSectionEntry,
  CustomSectionKeyValue,
} from '../types';
import { EMPTY_RESUME_DATA } from './resume';
import { ingestResumeFile, IngestionResult } from './resumeIngestion';

export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'additional'
  | 'custom'
  | 'unknown';

export interface ParsedSection {
  type: SectionType;
  title: string;
  rawText: string;
}

export interface SectionConfidence {
  name: 'high' | 'low';
  contact: 'high' | 'low';
  summary: 'high' | 'low';
  experience: 'high' | 'low';
  education: 'high' | 'low';
  skills: 'high' | 'low';
  projects: 'high' | 'low';
  certifications: 'high' | 'low';
  custom?: 'high' | 'low';
}

export interface ParseResult {
  data: ResumeData;
  confidence: SectionConfidence;
  warnings: string[];
  counts: {
    summaryCount: number;
    experienceCount: number;
    bulletCount: number;
    educationCount: number;
    skillCount: number;
    projectCount: number;
    certificationCount: number;
    customSectionCount?: number;
  };
  tokenCoverage?: number;
  missingSections: string[];
}

// Canonical Synonym mapping for section headers
const SECTION_SYNONYMS: Record<SectionType, string[]> = {
  summary: [
    'professional summary',
    'executive summary',
    'career summary',
    'summary of qualifications',
    'summary',
    'profile',
    'professional profile',
    'personal profile',
    'about me',
    'career objective',
    'objective',
    'overview',
  ],
  experience: [
    'professional experience',
    'work experience',
    'employment history',
    'work history',
    'relevant experience',
    'experience',
    'internships',
    'internship experience',
    'employment',
    "where i've worked",
    "where ive worked",
    'career history',
    'professional background',
  ],
  education: [
    'academic background',
    'academic qualifications',
    'education and credentials',
    'education & credentials',
    'educational background',
    'education',
    'academics',
    'qualifications',
    'degrees',
  ],
  skills: [
    'core competencies',
    'core skills',
    'technical skills',
    'key skills',
    'skills & competencies',
    'skills and competencies',
    'technical proficiency',
    'tools and technologies',
    'tools & technologies',
    'top skills',
    'areas of expertise',
    'skills',
    'technologies',
    'competencies',
    'skillset',
    'skill set',
    'hard skills',
    'soft skills',
    'professional skills',
  ],
  projects: [
    'academic projects',
    'key projects',
    'selected projects',
    'capstone projects',
    'personal projects',
    'projects & capstones',
    'projects and capstones',
    'projects',
  ],
  certifications: [
    'certifications & honors',
    'certifications and honors',
    'licenses & certifications',
    'licenses and certifications',
    'certifications & licenses',
    'certifications',
    'certificates',
    'accreditations',
    'courses & training',
    'courses',
    'training',
  ],
  achievements: [
    'honors & awards',
    'honors and awards',
    'awards & honors',
    'awards and honors',
    'achievements & awards',
    'key achievements',
    'achievements',
    'awards',
    'honors',
    'positions of responsibility',
    'extracurricular activities',
    'extracurriculars',
    'leadership activities',
  ],
  additional: [
    'languages',
    'interests',
    'publications',
    'volunteer experience',
    'volunteering',
    'patents',
    'additional information',
    'additional',
  ],
  custom: [],
  unknown: [],
};

/**
 * Determine if a phrase matches any section synonym
 */
function matchHeadingSynonym(phrase: string): { type: SectionType; title: string } | null {
  const clean = phrase.toLowerCase().replace(/[:\-_|•]/g, '').trim();
  if (!clean || clean.length < 3) return null;

  for (const [type, synonyms] of Object.entries(SECTION_SYNONYMS) as [SectionType, string[]][]) {
    for (const syn of synonyms) {
      if (clean === syn || clean === `${syn}s` || clean.startsWith(`${syn}:`) || clean.endsWith(` ${syn}`)) {
        return { type, title: phrase.trim() };
      }
    }
  }
  return null;
}

/**
 * Regex-based heuristic classifier that specifically detects resume section boundaries 
 * (Education, Experience, Skills, etc.) by analyzing vertical spacing and font-weight changes.
 */
export function classifySectionBoundaryHeuristic(
  line: string,
  prevLine?: string,
  nextLine?: string
): { type: SectionType; title: string; confidence: 'high' | 'low' } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 50 || trimmed.split(/\s+/).length > 6) {
    return null;
  }

  const hasVerticalIsolation = (!prevLine || prevLine.trim() === '') || (!nextLine || nextLine.trim() === '');
  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  const endsWithColon = trimmed.endsWith(':');
  const isTitleCase = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:?$/.test(trimmed);
  const isShortHeading = trimmed.split(/\s+/).length <= 4;

  // 1. Match against known section synonyms
  const match = matchHeadingSynonym(trimmed);
  if (match) {
    let confidence: 'high' | 'low' = 'low';
    if (isAllCaps || endsWithColon || isTitleCase || hasVerticalIsolation || isShortHeading) {
      confidence = 'high';
    }
    return {
      type: match.type,
      title: trimmed.replace(/:$/, '').trim(),
      confidence,
    };
  }

  // 2. Tier 2: Heuristic detection for custom/arbitrary headings based on font-weight & vertical spacing
  const isBullet = /^[-•*–—·●▪▫◦‣⁃➢✓✔]|\d+[.)]/.test(trimmed);
  const hasUrlOrEmail = /@|https?:|\.com\b|\.org\b|\.edu\b|\.io\b|\.ai\b/i.test(trimmed);
  const hasSentenceEnd = /[.!?]\s+[A-Z]/.test(trimmed);
  const isStandaloneDate = /^\(?\d{4}(?:\s*[-–—]\s*(?:\d{4}|Present))?\)?$/i.test(trimmed);

  if (isBullet || hasUrlOrEmail || hasSentenceEnd || isStandaloneDate || trimmed.length < 3) {
    return null;
  }

  const isCustomAllCaps = isAllCaps && trimmed.replace(/[^A-Z]/g, '').length >= 3;
  if ((isCustomAllCaps || endsWithColon) && (hasVerticalIsolation || trimmed.length < 30)) {
    return { type: 'custom', title: trimmed.replace(/:$/, '').trim(), confidence: 'low' };
  }

  return null;
}

/**
 * Section Segmentation:
 * Detects headings whether on their own line or inline (e.g. "... PROFESSIONAL SUMMARY ... WORK EXPERIENCE ...")
 */
export function segmentSections(text: string): {
  header: string;
  sections: ParsedSection[];
} {
  if (!text || !text.trim()) {
    return { header: '', sections: [] };
  }

  // Pre-process: Handle inline headings where newlines were lost
  let preprocessed = text;

  const allSynonymsList: string[] = [];
  for (const syns of Object.values(SECTION_SYNONYMS)) {
    allSynonymsList.push(...syns);
  }
  allSynonymsList.sort((a, b) => b.length - a.length);

  const escapedSyns = allSynonymsList.map((s) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  );
  const combinedPattern = escapedSyns.join('|');

  const inlineHeadingRegex = new RegExp(`(?:\\s+|^|[.;!?|])(${combinedPattern})\\b(?=[\\s:]|$)`, 'gi');

  preprocessed = preprocessed.replace(inlineHeadingRegex, (match, heading) => {
    const isAllCaps = heading === heading.toUpperCase() && /[A-Z]/.test(heading);
    const isMultiWord = heading.trim().split(/\s+/).length >= 2;
    const endsWithColon = match.includes(':');

    if (isAllCaps || isMultiWord || endsWithColon) {
      return `\n\n${heading.trim()}\n`;
    }
    return match;
  });

  const rawLines = preprocessed.split('\n').map((l) => l.trim());
  const lines: string[] = [];
  for (const line of rawLines) {
    if (line.length > 0) lines.push(line);
  }

  let currentType: SectionType | 'header' = 'header';
  let currentTitle = 'HEADER';
  let headerLines: string[] = [];
  const sectionBuckets: Array<{ type: SectionType; title: string; lines: string[] }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Use regex-based heuristic classifier analyzing vertical spacing and font-weight changes
    const prevLine = i > 0 ? lines[i - 1] : undefined;
    const nextLine = i < lines.length - 1 ? lines[i + 1] : undefined;
    const isTopHeaderCandidate = sectionBuckets.length === 0 && i === 0 && !line.endsWith(':');

    let headingMatch: { type: SectionType; title: string; confidence: 'high' | 'low' } | null = null;
    if (!isTopHeaderCandidate) {
      headingMatch = classifySectionBoundaryHeuristic(line, prevLine, nextLine);
    }

    const isHeading = headingMatch !== null;

    if (isHeading && headingMatch) {
      currentType = headingMatch.type;
      currentTitle = headingMatch.title;
      sectionBuckets.push({
        type: headingMatch.type,
        title: headingMatch.title,
        lines: [],
      });
    } else {
      if (currentType === 'header') {
        headerLines.push(line);
      } else {
        const lastSection = sectionBuckets[sectionBuckets.length - 1];
        if (lastSection) {
          lastSection.lines.push(line);
        }
      }
    }
  }

  const sections: ParsedSection[] = sectionBuckets.map((b) => ({
    type: b.type,
    title: b.title,
    rawText: b.lines.join('\n'),
  }));

  return {
    header: headerLines.join('\n'),
    sections,
  };
}

/**
 * Extract Name, Contact, and Header information
 */
export function extractHeaderCoordinates(headerText: string, fullDocText: string): {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubOrPortfolio: string;
  nameConfidence: 'high' | 'low';
} {
  const combined = `${headerText}\n${fullDocText}`;
  const headerLines = headerText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Email Extraction
  let email = '';
  const emailMatch = combined.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) {
    email = emailMatch[0].trim();
  }

  // 2. Phone Extraction (handles India +91, US/international, spaces, dashes)
  let phone = '';
  const phonePatterns = [
    /\+91[\s.-]?[6-9]\d{4}[\s.-]?\d{5}\b/,
    /\+91[\s.-]?\d{10}\b/,
    /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
    /\+(?:[0-9] ?){6,14}[0-9]\b/,
    /\b[6-9]\d{9}\b/, // standard 10-digit Indian mobile
  ];

  for (const pat of phonePatterns) {
    const pm = combined.match(pat);
    if (pm) {
      phone = pm[0].trim();
      break;
    }
  }

  // 3. LinkedIn Extraction (complete URL, NO dangling https)
  let linkedinUrl = '';
  // Check for full or partial LinkedIn URLs
  const linkedinMatch = combined.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_\-\.\/]+)/i);
  if (linkedinMatch) {
    const slug = linkedinMatch[1].replace(/[.,;:|)>]+$/, '').trim();
    linkedinUrl = `https://linkedin.com/in/${slug}`;
  }

  // 4. GitHub / Portfolio Extraction
  let githubOrPortfolio = '';
  const githubMatch = combined.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_\-]+)/i);
  if (githubMatch) {
    githubOrPortfolio = `https://github.com/${githubMatch[1].replace(/[.,;:|)>]+$/, '').trim()}`;
  } else {
    // Other portfolio links (e.g. behance, personal domain)
    const portfolioMatch = combined.match(/(?:https?:\/\/)?([A-Za-z0-9_\-]+\.(?:github\.io|vercel\.app|me|dev|portfolio))\b/i);
    if (portfolioMatch) {
      githubOrPortfolio = portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`;
    }
  }

  // 5. Location Extraction
  let location = '';
  const locationPatterns = [
    /\b(Bengaluru|Bangalore|Mumbai|Delhi|New Delhi|Hyderabad|Pune|Chennai|Kolkata|Gurgaon|Gurugram|Noida|Ahmedabad)(?:[,\s]+(?:India|Karnataka|Maharashtra|Tamil Nadu|Telangana|Haryana|UP|Uttar Pradesh))?\b/i,
    /\b(New York|San Francisco|Seattle|Austin|Boston|Chicago|Los Angeles|London|Singapore|Dubai|Toronto|Vancouver|Berlin|Paris|Sydney)(?:[,\s]+[A-Za-z]+)?\b/i,
    /\b([A-Z][a-zA-Z]+,\s*[A-Z]{2}\b)/, // City, ST format (e.g. Austin, TX)
    /\b([A-Z][a-zA-Z\s]+,\s*India)\b/i,
  ];

  for (const lp of locationPatterns) {
    const lm = combined.match(lp);
    if (lm) {
      // Ensure we don't accidentally capture URLs or "https"
      const cleanLoc = lm[0].replace(/https?.*$/i, '').replace(/[|•]/g, '').trim();
      if (cleanLoc.length > 2 && cleanLoc.length < 50 && !cleanLoc.includes('@')) {
        location = cleanLoc;
        break;
      }
    }
  }

  // 6. Full Name Extraction (Strict Heuristics - NEVER fabricate)
  let fullName = '';
  let nameConfidence: 'high' | 'low' = 'low';

  // Candidate lines priority:
  // 1. Header lines from top of document
  // 2. Lines immediately preceding the first major section (Summary / Experience), e.g. for LinkedIn exports
  let candidateLines: string[] = [];
  if (headerLines.length > 0) {
    candidateLines.push(...headerLines.slice(0, 6));
  }

  const summaryOrExpIdx = fullDocText.search(/\n\s*(?:summary|profile|work experience|professional experience|experience)\b/i);
  if (summaryOrExpIdx > 0) {
    const textBeforeMajor = fullDocText.slice(0, summaryOrExpIdx);
    const linesBefore = textBeforeMajor.split('\n').map((l) => l.trim()).filter(Boolean);
    // Grab the 4 lines immediately preceding the major section
    candidateLines.push(...linesBefore.slice(-4));
  }

  // Fallback to initial document lines
  if (candidateLines.length === 0) {
    candidateLines = fullDocText.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 8);
  }

  for (const line of candidateLines) {
    const trimmed = line.replace(/^[•\-\*|]+\s*/, '').trim();

    // Disqualify if it contains contact tokens or generic headers
    if (
      trimmed.includes('@') ||
      trimmed.includes('http') ||
      trimmed.includes('linkedin.com') ||
      trimmed.includes('github.com') ||
      /\d{4,}/.test(trimmed) ||
      /resume|curriculum|vitae|page\s*\d|profile|portfolio/i.test(trimmed) ||
      trimmed.length < 2 ||
      trimmed.length > 45
    ) {
      continue;
    }

    // Disqualify if it looks like a section heading, job title, or degrees only
    if (
      matchHeadingSynonym(trimmed) ||
      /\b(skills|contact|languages|education|experience|summary|projects|certifications|awards|interests)\b/i.test(
        trimmed
      ) ||
      /^(associate|senior|lead|manager|engineer|consultant|mba|b\.tech|product manager)/i.test(trimmed)
    ) {
      continue;
    }

    const words = trimmed.split(/\s+/);
    // Prefer 2 to 4 words where each word starts with a capital letter
    const isCapitalized = words.every((w) => /^[A-Z][A-Za-z.\-']*$/.test(w) || w === w.toUpperCase());

    if (words.length >= 2 && words.length <= 4 && isCapitalized) {
      fullName = trimmed.replace(/[^A-Za-z\s.\-']/g, '').trim();
      nameConfidence = 'high';
      break;
    }

    // Fallback: 2 to 4 capitalized words (disqualify single word or header synonyms)
    if (
      !fullName &&
      words.length >= 2 &&
      words.length <= 4 &&
      words.every(
        (w) =>
          /^[A-Za-z.\-']+$/.test(w) &&
          !/^(professional|summary|experience|education|skills|projects|certifications|contact|curriculum|vitae|resume|page)$/i.test(
            w
          )
      )
    ) {
      fullName = trimmed;
      nameConfidence = 'low';
    }
  }

  // Fallback for single-line header (where name, email, phone, linkedin are on the same line)
  if (!fullName) {
    for (const line of candidateLines) {
      if (line.includes('@') || line.includes('http') || line.includes('linkedin.com')) {
        // Method A: Check the prefix before the first email, phone, or URL
        const prefix = line.split(/\s+(?:[A-Za-z0-9._%+-]+@|\+?\d{1,4}[-\s]|\(?\d{3}\)?[-\s]|https?:\/\/|(?:www\.)?linkedin\.com)/)[0]?.trim();
        if (prefix) {
          const words = prefix.replace(/[|•·\-_,;]/g, ' ').trim().split(/\s+/).filter(Boolean);
          if (
            words.length >= 2 &&
            words.length <= 4 &&
            words.every((w) => /^[A-Z][A-Za-z.\-']*$/.test(w) || w === w.toUpperCase())
          ) {
            fullName = words.join(' ');
            nameConfidence = 'high';
            break;
          }
        }

        // Method B: Strip out tokens in careful order
        const stripped = line
          .replace(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|github\.com)[^\s]*/gi, '')
          .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '')
          .replace(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\+91[\s.-]?\d{10}/g, '')
          .replace(/\b(Bengaluru|Bangalore|Mumbai|Delhi|Hyderabad|Pune|Chennai|Kolkata|Gurgaon|Gurugram|Noida|New York|San Francisco|London|Singapore|India)\b(?:[,\s]+(?:India|[A-Za-z]+))?/gi, '')
          .replace(/[|•·\-_,;]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const words = stripped.split(/\s+/).filter(Boolean);
        if (
          words.length >= 2 &&
          words.length <= 4 &&
          words.every((w) => /^[A-Z][A-Za-z.\-']*$/.test(w) || w === w.toUpperCase())
        ) {
          fullName = words.join(' ');
          nameConfidence = 'high';
          break;
        }
      }
    }
  }

  // 7. Headline / Title Extraction
  let headline = '';
  for (const line of candidateLines) {
    const trimmed = line.trim();
    if (
      trimmed !== fullName &&
      !trimmed.includes('@') &&
      !trimmed.includes('http') &&
      !trimmed.includes('linkedin.com') &&
      trimmed.length > 5 &&
      trimmed.length < 90 &&
      /product|manager|engineer|consultant|mba|strategy|analyst|developer|lead|director|specialist/i.test(trimmed)
    ) {
      headline = trimmed.replace(/^[|•\-\s]+|[|•\-\s]+$/g, '').trim();
      break;
    }
  }

  return {
    fullName,
    headline,
    email,
    phone,
    location,
    linkedinUrl,
    githubOrPortfolio,
    nameConfidence,
  };
}

/**
 * Date Range Parser for Work Experience & Education
 */
const MONTH_NAMES_PATTERN = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|sept|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
export const DATE_RANGE_REGEX = new RegExp(
  '(?:\\b' + MONTH_NAMES_PATTERN + '\\b\\.?\\s*|\\b(?:q[1-4]|\\d{1,2}\\s*[/.-])\\s*)?(?:19\\d\\d|20\\d\\d|\'\\d{2})\\s*(?:[-–—~]|\\bto\\b)\\s*(?:present|current|till\\s*date|now|(?:\\b' + MONTH_NAMES_PATTERN + '\\b\\.?\\s*|\\b(?:q[1-4]|\\d{1,2}\\s*[/.-])\\s*)?(?:19\\d\\d|20\\d\\d|\'\\d{2}))',
  'i'
);

export function parseDateRange(text: string): {
  startDate: string;
  endDate: string;
  current: boolean;
  matchedText?: string;
} | null {
  const match = text.match(DATE_RANGE_REGEX);
  if (!match) {
    // Single year fallback: e.g. "2023"
    const singleYear = text.match(/\b(20\d\d|19\d\d)\b/);
    if (singleYear) {
      return {
        startDate: singleYear[1],
        endDate: singleYear[1],
        current: false,
        matchedText: singleYear[0],
      };
    }
    return null;
  }

  const rawMatch = match[0].trim();
  const current = /present|current|till\s*date|now/i.test(rawMatch);

  // Extract start and end year/months using proper boundary split (avoids splitting on 't' or 'o' in [-–—to~])
  const parts = rawMatch.split(/\s*(?:[-–—~]|\bto\b)\s*/i).map((p) => p.trim());
  let startDate = parts[0] || '2023';
  let endDate = current ? 'Present' : parts[1] || 'Present';

  // Clean dates
  startDate = startDate.replace(/[(),]/g, '').trim();
  endDate = endDate.replace(/[(),]/g, '').trim();

  return {
    startDate,
    endDate,
    current,
    matchedText: rawMatch,
  };
}

/**
 * Split section text into individual achievement bullets
 * Never puts a whole paragraph into one bullet; splits on bullet markers or sentence boundaries.
 */
export function splitIntoAchievementBullets(text: string): string[] {
  if (!text || !text.trim()) return [];

  // If bullets appear inline without newlines (e.g. "• Bullet 1 • Bullet 2"), split them onto new lines
  const preprocessed = text.replace(/(?<=[^\n])\s+([•●▪▫◦‣⁃➢✓✔])\s+/g, '\n$1 ');

  const rawLines = preprocessed
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const hasBulletMarkers = rawLines.some((l) => /^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/.test(l));
  const bullets: string[] = [];
  let currentBullet = '';

  if (hasBulletMarkers) {
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const isBulletStart = /^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/.test(line);

      if (isBulletStart) {
        if (currentBullet.trim()) {
          bullets.push(cleanBulletText(currentBullet));
        }
        currentBullet = line.replace(/^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/, '').trim();
      } else {
        // Soft-wrapped continuation line: belongs to previous bullet
        if (currentBullet) {
          currentBullet += ` ${line}`;
        } else {
          currentBullet = line;
        }
      }
    }
    if (currentBullet.trim()) {
      bullets.push(cleanBulletText(currentBullet));
    }
  } else {
    // No bullet markers: merge soft line-wraps and title-description pairs
    const mergedLines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (mergedLines.length === 0) {
        mergedLines.push(line);
      } else {
        const lastIdx = mergedLines.length - 1;
        const prev = mergedLines[lastIdx];

        // Check if prev is a short title line (< 60 chars, no sentence ending period)
        const isPrevTitle = prev.length < 60 && !/[.!?]$/.test(prev) && /^[A-Za-z0-9\s\-_–—&()/]+$/.test(prev);
        const isCurrentDescription = line.length > 20 || /^[A-Z][a-z]+/.test(line);

        if (isPrevTitle && isCurrentDescription) {
          mergedLines[lastIdx] = `${prev} — ${line}`;
        } else if (!/[.!?:]$/.test(prev)) {
          // Soft wrap continuation
          mergedLines[lastIdx] = `${prev} ${line}`;
        } else {
          mergedLines.push(line);
        }
      }
    }

    for (const line of mergedLines) {
      if (line.length > 80 && /[.!?]\s+[A-Z]/.test(line)) {
        const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
        for (const s of sentences) {
          if (s.length > 12) bullets.push(cleanBulletText(s));
        }
      } else if (line.length > 10) {
        bullets.push(cleanBulletText(line));
      }
    }
  }

  // Post-process: If a bullet is exceptionally long (> 350 chars) and contains multiple sentences,
  // split on sentence boundaries
  const finalBullets: string[] = [];
  for (const b of bullets) {
    if (b.length > 350 && /[.!?]\s+[A-Z]/.test(b)) {
      const sentences = b.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
      for (const s of sentences) {
        if (s.length > 20) {
          finalBullets.push(cleanBulletText(s));
        }
      }
    } else if (b.length > 15) {
      finalBullets.push(b);
    }
  }

  return Array.from(new Set(finalBullets));
}

function cleanBulletText(bullet: string): string {
  return bullet
    .replace(/^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse Work Experience Section
 */
export function parseExperienceSection(rawText: string): ResumeWorkExperience[] {
  if (!rawText || !rawText.trim()) return [];

  // Separate any inline bullets so they don't stick to date headers or other lines
  const preprocessed = rawText.replace(/(?<=[^\n])\s+([•●▪▫◦‣⁃➢✓✔])\s+/g, '\n$1 ');

  const lines = preprocessed
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  interface RawExpEntry {
    headerLines: string[];
    dateInfo: ReturnType<typeof parseDateRange>;
    bulletLines: string[];
  }

  const entries: RawExpEntry[] = [];
  let currentEntry: RawExpEntry | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateInfo = parseDateRange(line);
    const isBullet = /^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/.test(line);

    if (dateInfo && !isBullet && line.length < 120) {
      // Look back at preceding lines in lines array that were not bullets or dates
      const headerCandidates: string[] = [];
      for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
        const prevLine = lines[j];
        if (!parseDateRange(prevLine) && !/^[•●▪▫◦‣⁃➢✓✔\-\*]/.test(prevLine) && prevLine.length < 80 && !/[.!?]$/.test(prevLine)) {
          headerCandidates.unshift(prevLine);
        } else {
          break;
        }
      }
      headerCandidates.push(line);

      if (currentEntry && currentEntry.dateInfo !== null) {
        entries.push(currentEntry);
        currentEntry = {
          headerLines: headerCandidates,
          dateInfo,
          bulletLines: [],
        };
      } else if (currentEntry && currentEntry.dateInfo === null) {
        currentEntry.headerLines = [...headerCandidates];
        currentEntry.dateInfo = dateInfo;
      } else {
        currentEntry = {
          headerLines: headerCandidates,
          dateInfo,
          bulletLines: [],
        };
      }
    } else if (currentEntry) {
      // Check if this line is the start of a NEW job entry (non-bullet and next line has date)
      const nextLine = lines[i + 1] || '';
      const nextDate = parseDateRange(nextLine);

      if (!isBullet && nextDate && line.length < 100) {
        entries.push(currentEntry);
        currentEntry = {
          headerLines: [line],
          dateInfo: null,
          bulletLines: [],
        };
      } else if (isBullet) {
        currentEntry.bulletLines.push(line);
      } else if (
        currentEntry.bulletLines.length === 0 &&
        currentEntry.headerLines.length < 3 &&
        line.length < 60 &&
        !/[.!?]$/.test(line) &&
        !/\b(?:demonstrating|translating|managing|delivering|supported|assisted|collaborated|expectations)\b/i.test(line)
      ) {
        currentEntry.headerLines.push(line);
      } else {
        currentEntry.bulletLines.push(line);
      }
    } else {
      // Lines before first entry
      if (!isBullet && line.length < 60 && !/[.!?]$/.test(line)) {
        currentEntry = {
          headerLines: [line],
          dateInfo: null,
          bulletLines: [],
        };
      }
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  // Convert raw entries to ResumeWorkExperience
  const expList: ResumeWorkExperience[] = [];

  for (let idx = 0; idx < entries.length; idx++) {
    const entry = entries[idx];
    const fullHeader = entry.headerLines.join(' | ');

    // Extract company & role from header lines
    let company = '';
    let role = '';
    let location = '';

    // Remove the date string from the header text
    let cleanHeader = fullHeader;
    if (entry.dateInfo?.matchedText) {
      cleanHeader = cleanHeader.replace(entry.dateInfo.matchedText, '');
    }
    cleanHeader = cleanHeader.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();

    // Split on separators: | – — - ,
    const parts = cleanHeader.split(/\s*[|–—]\s*|\s+-\s+|\s+at\s+|\s*,\s*(?=[A-Z])/i).map((p) => p.trim()).filter(Boolean);

    if (parts.length >= 2) {
      let part0 = parts[0];
      let part1 = parts[1];

      // Disqualify parts that end with periods or look like sentence fragments
      if (part1.endsWith('.') || part1.length > 50 || /\b(?:expectations|delivery|demonstrating)\b/i.test(part1)) {
        entry.bulletLines.unshift(part1);
        part1 = '';
      }

      if (/consultant|manager|engineer|associate|lead|director|intern|analyst|developer|founder|trainee/i.test(part0)) {
        role = part0;
        company = part1;
        if (parts[2]) location = parts[2];
      } else {
        company = part0;
        role = part1;
        if (parts[2]) location = parts[2];
      }
    } else if (parts.length === 1) {
      if (/consultant|manager|engineer|associate|lead|director|intern|analyst|developer|founder|trainee/i.test(parts[0])) {
        role = parts[0];
        company = '';
      } else {
        company = parts[0];
        role = '';
      }
    }

    // Company inheritance fallback: If role exists but company is empty, inherit company from previous entry!
    if (!company && idx > 0 && expList[idx - 1]?.company) {
      company = expList[idx - 1].company;
    }

    const rawBullets = splitIntoAchievementBullets(entry.bulletLines.join('\n'));
    const cleanBullets: string[] = [];
    const extras: { label: string; value: string }[] = [];

    for (const b of rawBullets) {
      const extraMatch = b.match(/^(tech(?:nologies|nology)?(?:\s+stack)?|tools|environment|skills|client|team|impact):\s*(.+)$/i);
      if (extraMatch) {
        extras.push({ label: extraMatch[1].trim(), value: extraMatch[2].trim() });
      } else {
        cleanBullets.push(b);
      }
    }

    expList.push({
      id: `exp_${idx + 1}`,
      company: company || '',
      role: role || '',
      location: location || '',
      startDate: entry.dateInfo?.startDate || '',
      endDate: entry.dateInfo?.endDate || (entry.dateInfo?.current ? 'Present' : ''),
      current: entry.dateInfo?.current ?? false,
      bullets: cleanBullets,
      ...(extras.length > 0 ? { extras } : {}),
    });
  }

  // Fallback: If no date-delimited entries found, check if there are standard bullets
  if (expList.length === 0 && rawText.trim().length > 15) {
    const allBullets = splitIntoAchievementBullets(rawText);
    if (allBullets.length > 0) {
      expList.push({
        id: 'exp_1',
        company: '',
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: allBullets,
      });
    }
  }

  return expList;
}

/**
 * Parse Education Section
 */
export function parseEducationSection(rawText: string): ResumeEducation[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const eduList: ResumeEducation[] = [];
  let currentLines: string[] = [];
  const isInstRegex = /\b(?:institute|university|college|school|academy|faculty|iim|iit|nit|bits|iisc)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isInst = isInstRegex.test(line);
    const hasAlreadyInst = currentLines.some((l) => isInstRegex.test(l));

    if (isInst && hasAlreadyInst) {
      const parsedEdu = parseSingleEduBlock(currentLines, eduList.length + 1);
      if (parsedEdu) eduList.push(parsedEdu);
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    const parsedEdu = parseSingleEduBlock(currentLines, eduList.length + 1);
    if (parsedEdu) eduList.push(parsedEdu);
  }

  return eduList;
}

const KNOWN_DEGREE_MAP: Array<{ regex: RegExp; standardized: string }> = [
  { regex: /\b(?:master of business administration|mba|pgdm|pgp|mms)\b/i, standardized: 'Master of Business Administration (MBA)' },
  { regex: /\b(?:bachelor of technology|b\.tech|btech)\b/i, standardized: 'Bachelor of Technology (B.Tech)' },
  { regex: /\b(?:master of technology|m\.tech|mtech)\b/i, standardized: 'Master of Technology (M.Tech)' },
  { regex: /\b(?:bachelor of engineering|b\.e\b|b\.e\.|be\b)/i, standardized: 'Bachelor of Engineering (B.E.)' },
  { regex: /\b(?:master of engineering|m\.e\b|m\.e\.|me\b)/i, standardized: 'Master of Engineering (M.E.)' },
  { regex: /\b(?:bachelor of journalism(?:\s*and|\s*&)?\s*mass\s*comm[a-z]*|b\.j\.m\.c|bjmc)\b/i, standardized: 'Bachelor of Journalism and Mass Communication (BJMC)' },
  { regex: /\b(?:master of journalism(?:\s*and|\s*&)?\s*mass\s*comm[a-z]*|m\.j\.m\.c|mjmc)\b/i, standardized: 'Master of Journalism and Mass Communication (MJMC)' },
  { regex: /\b(?:bachelor of business administration|b\.b\.a|bba)\b/i, standardized: 'Bachelor of Business Administration (BBA)' },
  { regex: /\b(?:bachelor of computer applications|b\.c\.a|bca)\b/i, standardized: 'Bachelor of Computer Applications (BCA)' },
  { regex: /\b(?:master of computer applications|m\.c\.a|mca)\b/i, standardized: 'Master of Computer Applications (MCA)' },
  { regex: /\b(?:bachelor of commerce|b\.com|bcom)\b/i, standardized: 'Bachelor of Commerce (B.Com)' },
  { regex: /\b(?:master of commerce|m\.com|mcom)\b/i, standardized: 'Master of Commerce (M.Com)' },
  { regex: /\b(?:bachelor of science|b\.sc|bsc|b\.s\b|bs\b)/i, standardized: 'Bachelor of Science (B.S.)' },
  { regex: /\b(?:master of science|m\.sc|msc|m\.s\b|ms\b)/i, standardized: 'Master of Science (M.S.)' },
  { regex: /\b(?:bachelor of arts|b\.a\b|ba\b)/i, standardized: 'Bachelor of Arts (B.A.)' },
  { regex: /\b(?:master of arts|m\.a\b|ma\b)/i, standardized: 'Master of Arts (M.A.)' },
  { regex: /\b(?:bachelor of design|b\.des|bdes)\b/i, standardized: 'Bachelor of Design (B.Des)' },
  { regex: /\b(?:master of design|m\.des|mdes)\b/i, standardized: 'Master of Design (M.Des)' },
  { regex: /\b(?:doctor of philosophy|ph\.?d|doctorate)\b/i, standardized: 'Doctor of Philosophy (Ph.D.)' },
  { regex: /\b(?:bachelor of laws|ll\.?b|llb)\b/i, standardized: 'Bachelor of Laws (LL.B.)' },
  { regex: /\b(?:master of laws|ll\.?m|llm)\b/i, standardized: 'Master of Laws (LL.M.)' },
  { regex: /\b(?:high\s*school|higher\s*secondary|senior\s*secondary|class\s*xii|class\s*x|cbse|icse)\b/i, standardized: 'Higher Secondary School' },
  { regex: /\b(?:diploma)\b/i, standardized: 'Diploma' },
  { regex: /\b(?:associate\s*(?:of|in)?\s*degree|a\.a\.|a\.s\.)\b/i, standardized: 'Associate Degree' },
];

function parseSingleEduBlock(lines: string[], index: number): ResumeEducation | null {
  const fullText = lines.join(' ');
  const dateInfo = parseDateRange(fullText);
  const instPattern = /\b(?:institute|university|college|school|academy|faculty|polytechnic|campus|ecole|lycee|gymnasium|iim|iit|nit|bits|iisc)\b/i;
  const hasInst = instPattern.test(fullText);
  const hasDegree = /\b(?:bachelor|master|mba|b\.tech|b\.com|b\.sc|b\.e|m\.s|phd|doctorate|degree|diploma|bjmc|bba|bca|mca|bdes|mdes|llb|llm)\b/i.test(fullText);

  if (!hasInst && !hasDegree && !dateInfo) {
    return null;
  }

  let institution = '';
  let degree = '';
  let field = '';

  // 1. Identify institution line index
  let instLineIdx = lines.findIndex((l) => instPattern.test(l));
  if (instLineIdx === -1 && lines.length > 0) instLineIdx = 0;

  if (instLineIdx !== -1) {
    const instLine = lines[instLineIdx];
    // Check if institution line contains a separator for degree (e.g. 'Sri Balaji University — Master of Business Administration (MBA)')
    const parts = instLine.split(/[\u2010-\u2015\u2212\u2013\u2014|]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      institution = parts[0];
      const cand = parts.slice(1).join(' — ');
      for (const d of KNOWN_DEGREE_MAP) {
        if (d.regex.test(cand)) {
          degree = cand;
          break;
        }
      }
      if (!degree) degree = cand;
    } else {
      // Clean trailing city/state (e.g. "Sri Balaji University, Pune" -> "Sri Balaji University, Pune")
      institution = instLine;
    }
  }

  // 2. Identify remaining lines for Degree & Field of Study
  for (let i = 0; i < lines.length; i++) {
    if (i === instLineIdx) continue;
    const l = lines[i].trim();
    if (!l) continue;

    // Skip pure date lines e.g. "2019 - 2022" or "2022 - 2024"
    if (/^(?:19|20)\d{2}\s*[-–—~]/.test(l) || /^\(?\d{4}\)?$/.test(l)) continue;
    // Skip pure GPA lines e.g. "GPA: 3.8"
    if (/^(?:gpa|cgpa|percentage|score|marks|rank)[\s:]*[0-9.]+/i.test(l)) continue;

    // Check if line matches known degree map (e.g. "BJMC, Journalism and Mass Communication (Majors)" or "MBA, Marketing")
    for (const d of KNOWN_DEGREE_MAP) {
      if (d.regex.test(l)) {
        if (!degree) {
          degree = d.standardized;
        }
        // Extract field from line if present
        const afterDeg = l.replace(d.regex, '').replace(/^[,:\-—|\s]+|[,:\-—|\s]+$/g, '').trim();
        if (afterDeg && !field) {
          field = afterDeg.replace(/^\((?:majors?|minors?|honou?rs?)\)|\((?:majors?|minors?|honou?rs?)\)$/i, '').trim();
        }
        break;
      }
    }

    // Fallback: If degree is still empty and this line is informative, use it as degree / field
    if (!degree && l.length > 2) {
      // If line has comma or dash e.g. "BJMC, Journalism and Mass Communication"
      const subParts = l.split(/[,–—|-]/).map((p) => p.trim()).filter(Boolean);
      if (subParts.length >= 2) {
        degree = subParts[0];
        if (!field) field = subParts.slice(1).join(', ').trim();
      } else {
        degree = l;
      }
    }
  }

  // 3. Global Field of Study fallback if not yet found
  if (!field) {
    const fieldMatch = fullText.match(/(?:in|of|,|-|—)\s*(Computer Science|Engineering|Business|Finance|Strategy|Economics|Marketing|Management|Electronics|Information Technology|Journalism(?:\s*and|\s*&)?\s*Mass\s*Communication|Communications?|Design|Accounting|Data Science|Data Analytics)[a-zA-Z\s]*/i);
    if (fieldMatch) {
      field = fieldMatch[0].replace(/^(?:in|of|,|-|—)\s+/i, '').trim();
    }
  }

  // 4. GPA / Score
  let gpaOrScore = '';
  const gpaMatch = fullText.match(/(?:gpa|cgpa|percentage|score|marks|rank)[\s:]*([0-9.]+[\s\/]*[0-9.]*|top\s*\d+%?|\d+%)|\b([34]\.\d{1,2}\s*\/\s*4\.00?|[789]\.\d{1,2}\s*\/\s*10(?:\.00?)?)/i);
  if (gpaMatch) {
    gpaOrScore = gpaMatch[0].trim();
  }

  // 5. Location
  let location = '';
  for (const l of lines) {
    const locMatch = l.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\b|[A-Z][a-zA-Z\s]+,\s*(?:India|USA|UK|Canada|Germany|France|Singapore|UAE))/i);
    if (locMatch) {
      location = locMatch[0].trim();
      break;
    }
  }

  return {
    id: `edu_${index}`,
    institution: institution || '',
    degree: degree || '',
    field: field || '',
    location: location || '',
    startDate: dateInfo?.startDate || '',
    endDate: dateInfo?.endDate || '',
    gpaOrScore,
  };
}

/**
 * Parse Skills Section into Categorized Skill groups
 */
export function parseSkillsSection(rawText: string): Array<{ category: string; items: string[] }> {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const categories: Array<{ category: string; items: string[] }> = [];
  const unclassifiedItems: string[] = [];

  for (const line of lines) {
    // Check if line contains "Category Name: skill1, skill2, skill3"
    const colonMatch = line.match(/^([A-Za-z\s&/]{3,30}):\s*(.*)$/);
    if (colonMatch) {
      const catName = colonMatch[1].trim();
      const itemsStr = colonMatch[2];
      const items = itemsStr
        .split(/[,|;•·\t\u00B7\u2022]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 50);

      if (items.length > 0) {
        categories.push({
          category: catName,
          items: Array.from(new Set(items)),
        });
        continue;
      }
    }

    // Otherwise split line by commas, pipes, bullets, or middle dots
    const tokens = line
      .split(/[,|;•·\t\u00B7\u2022]+/)
      .map((s) => s.trim().replace(/^[•\-\*·]\s*/, ''))
      .filter((s) => s.length > 1 && s.length < 50);

    unclassifiedItems.push(...tokens);
  }

  if (unclassifiedItems.length > 0) {
    const unique = Array.from(new Set(unclassifiedItems));
    if (categories.length === 0) {
      // Split into two groups if large
      if (unique.length > 8) {
        categories.push({
          category: 'Core Competencies',
          items: unique.slice(0, Math.ceil(unique.length / 2)),
        });
        categories.push({
          category: 'Tools & Technologies',
          items: unique.slice(Math.ceil(unique.length / 2)),
        });
      } else {
        categories.push({
          category: 'Core Skills',
          items: unique,
        });
      }
    } else {
      categories.push({
        category: 'Additional Skills',
        items: unique,
      });
    }
  }

  return categories;
}

/**
 * Parse Projects Section
 */
export function parseProjectsSection(rawText: string): Array<{
  id: string;
  name: string;
  context: string;
  bullets: string[];
}> {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  interface RawProj {
    name: string;
    context: string;
    bulletLines: string[];
  }

  const projects: RawProj[] = [];
  let currentProj: RawProj | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBullet = /^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/.test(line);

    if (!isBullet && line.length < 90 && (currentProj === null || currentProj.bulletLines.length > 0)) {
      if (currentProj) projects.push(currentProj);
      const parts = line.split(/[-–|:]/).map((p) => p.trim());
      currentProj = {
        name: parts[0] || '',
        context: parts[1] || '',
        bulletLines: [],
      };
    } else if (currentProj) {
      currentProj.bulletLines.push(line);
    }
  }

  if (currentProj) projects.push(currentProj);

  return projects.map((p, idx) => ({
    id: `proj_${idx + 1}`,
    name: p.name,
    context: p.context,
    bullets: splitIntoAchievementBullets(p.bulletLines.join('\n')),
  }));
}

/**
 * Parse Certifications Section
 */
export function parseCertificationsSection(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const certs: string[] = [];

  // Specialized check to identify year-only tokens (e.g. '2024', '(2024)', ''24', 'Completion Date: 2024')
  const isYearOnlyToken = (str: string): { isYear: boolean; year: string } => {
    const cleaned = str.replace(/^[•●▪▫◦‣⁃➢✓✔\-\*·\s]+|[•●▪▫◦‣⁃➢✓✔\-\*·\s]+$/g, '').trim();
    const match = cleaned.match(/^(?:completed|completion(?:\s*date)?|issued|earned|obtained|year|date)?[\s:·•\-|]*\(?((?:19|20)\d{2}|'\d{2})\)?\.?$/i);
    if (match) {
      return { isYear: true, year: match[1] };
    }
    const rangeMatch = cleaned.match(/^(?:completed|completion(?:\s*date)?|issued|valid)?[\s:·•\-|]*\(?((?:19|20)\d{2}\s*[-–—]\s*(?:present|(?:19|20)\d{2}))\)?\.?$/i);
    if (rangeMatch) {
      return { isYear: true, year: rangeMatch[1] };
    }
    return { isYear: false, year: '' };
  };

  for (const line of lines) {
    const clean = line.replace(/^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/, '').trim();
    if (!clean) continue;

    const { isYear, year } = isYearOnlyToken(clean);

    if (isYear) {
      if (certs.length > 0) {
        // Re-categorize token as Completion Date for the previous certification
        const prev = certs[certs.length - 1];
        const cleanPrev = prev.replace(/[\s·•\-–—|,:.]+$/, '').trim();
        certs[certs.length - 1] = `${cleanPrev} · ${year}`;
      }
      // Never create an invalid certification entry from a year-only token
      continue;
    }

    if (clean.length > 2 && clean.length < 120) {
      certs.push(clean);
    }
  }

  return Array.from(new Set(certs));
}

/**
 * Main Text Parser: parseRawResumeText
 * Pure, rule-based, deterministic, unit-testable parser.
 * NO PLACEHOLDERS: If a field is not found in the input, leaves it EMPTY.
 */
/**
 * Parse an arbitrary/custom section into a structured CustomSection object
 */
export function parseCustomSection(title: string, rawText: string): CustomSection {
  const id = `custom_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.random().toString(36).slice(2, 7)}`;
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      id,
      title,
      kind: 'paragraph',
      paragraph: '',
      confidence: 'low',
    };
  }

  // 1. Check for Key-Value pattern: e.g. "Languages: English, French" or "Native: English"
  const kvMatches = lines.map((l) => l.match(/^([A-Za-z0-9\s&/-]{2,30}):\s*(.+)$/));
  const validKvs = kvMatches.filter((m): m is RegExpMatchArray => m !== null);
  if (validKvs.length >= 2 && validKvs.length >= lines.length * 0.5) {
    const keyValues = lines.map((l) => {
      const match = l.match(/^([A-Za-z0-9\s&/-]{2,30}):\s*(.+)$/);
      if (match) {
        return { label: match[1].trim(), value: match[2].trim() };
      }
      return { label: '', value: l };
    }).filter((kv) => kv.label || kv.value);

    return {
      id,
      title,
      kind: 'keyvalue',
      keyValues,
      confidence: 'high',
    };
  }

  // 2. Check for Bullets: starts with bullet markers or is a list of action items
  const bulletCount = lines.filter((l) => /^[-•*–—·●▪▫◦‣⁃➢✓✔]|\d+[.)]/.test(l)).length;
  if (bulletCount >= 2 || (lines.length <= 4 && bulletCount >= 1)) {
    const bullets = splitIntoAchievementBullets(rawText);
    return {
      id,
      title,
      kind: 'bullets',
      bullets: bullets.length > 0 ? bullets : lines,
      confidence: 'high',
    };
  }

  // 3. Check for Tag list: comma or dot-separated tokens
  const hasCommaDelimited = lines.some((l) => l.includes(',') && l.split(',').length >= 3);
  if (hasCommaDelimited && lines.length <= 4) {
    const tags = lines.flatMap((l) => l.split(/[,•|·]/)).map((t) => t.trim()).filter(Boolean);
    if (tags.length >= 3) {
      return {
        id,
        title,
        kind: 'tags',
        tags,
        confidence: 'high',
      };
    }
  }

  // 4. Check for Entries: subheadings with dates or roles
  const hasDateRanges = lines.some((l) => /(?:\b(?:19|20)\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b)/i.test(l));
  if (hasDateRanges && lines.length >= 2) {
    const entries: CustomSectionEntry[] = [];
    let currentEntry: CustomSectionEntry | null = null;

    for (const line of lines) {
      const isBullet = /^[-•*–—·●▪▫◦‣⁃➢✓✔]|\d+[.)]/.test(line);
      const cleanLine = line.replace(/^[-•*–—·●▪▫◦‣⁃➢✓✔\d+.)]\s*/, '').trim();

      if (!isBullet && (currentEntry === null || /(?:\b(?:19|20)\d{2}\b)/.test(line) || cleanLine.length <= 60)) {
        currentEntry = {
          id: `entry_${entries.length + 1}`,
          title: cleanLine,
          bullets: [],
        };
        entries.push(currentEntry);
      } else if (currentEntry) {
        currentEntry.bullets.push(cleanLine);
      } else {
        currentEntry = {
          id: `entry_${entries.length + 1}`,
          title: cleanLine,
          bullets: [],
        };
        entries.push(currentEntry);
      }
    }

    if (entries.length > 0) {
      return {
        id,
        title,
        kind: 'entries',
        entries,
        confidence: 'high',
      };
    }
  }

  // 5. Default to paragraph
  return {
    id,
    title,
    kind: 'paragraph',
    paragraph: lines.join('\n'),
    confidence: 'high',
  };
}

/**
 * Token Coverage Calculator
 * Verifies that >= 95% of informative tokens in raw text are accounted for in the structured output
 */
export function computeTokenCoverage(
  rawText: string,
  data: ResumeData
): { coveragePercent: number; unmappedLines: string[] } {
  const extractWords = (str: string) => (str.toLowerCase().match(/[a-z0-9]{2,}/g) || []);
  const rawWords = extractWords(rawText);
  if (rawWords.length === 0) return { coveragePercent: 100, unmappedLines: [] };

  const parsedTextParts: string[] = [
    data.fullName,
    data.headline,
    data.email,
    data.phone,
    data.location,
    data.linkedinUrl,
    data.githubOrPortfolio || '',
    data.summary,
    ...data.experience.flatMap((e) => [
      e.company,
      e.role,
      e.location,
      e.startDate,
      e.endDate,
      ...e.bullets,
      ...(e.extras ? e.extras.flatMap((x) => [x.label, x.value]) : []),
    ]),
    ...data.education.flatMap((e) => [
      e.institution,
      e.degree,
      e.field,
      e.location,
      e.startDate,
      e.endDate,
      e.gpaOrScore || '',
      e.honors || '',
    ]),
    ...data.skills.flatMap((s) => [s.category, ...s.items]),
    ...data.projects.flatMap((p) => [p.name, p.context, ...p.bullets]),
    ...data.certifications,
  ];

  if (data.customSections) {
    for (const cs of data.customSections) {
      parsedTextParts.push(cs.title);
      if (cs.paragraph) parsedTextParts.push(cs.paragraph);
      if (cs.bullets) parsedTextParts.push(...cs.bullets);
      if (cs.tags) parsedTextParts.push(...cs.tags);
      if (cs.keyValues) parsedTextParts.push(...cs.keyValues.flatMap((kv) => [kv.label, kv.value]));
      if (cs.entries) {
        for (const e of cs.entries) {
          parsedTextParts.push(
            e.title,
            e.subtitle || '',
            e.location || '',
            e.startDate || '',
            e.endDate || '',
            ...e.bullets,
            ...(e.extras ? e.extras.flatMap((x) => [x.label, x.value]) : [])
          );
        }
      }
    }
  }

  const parsedWordsSet = new Set(extractWords(parsedTextParts.join(' ')));
  let matchedCount = 0;
  for (const w of rawWords) {
    if (parsedWordsSet.has(w)) {
      matchedCount++;
    }
  }

  const coveragePercent = Math.min(100, Math.round((matchedCount / rawWords.length) * 100));

  // Determine which non-empty lines had low token match (< 35%)
  const rawLines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 5);

  const unmappedLines: string[] = [];
  for (const line of rawLines) {
    const lineWords = extractWords(line);
    if (lineWords.length <= 1) continue;
    const matchCount = lineWords.filter((w) => parsedWordsSet.has(w)).length;
    if (matchCount / lineWords.length < 0.35) {
      unmappedLines.push(line);
    }
  }

  return { coveragePercent, unmappedLines };
}

/**
 * Main Text Parser: parseRawResumeText
 * Pure, rule-based, deterministic, unit-testable parser.
 * NO PLACEHOLDERS: If a field is not found in the input, leaves it EMPTY.
 */
export function parseRawResumeText(rawText: string): ParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      data: { ...EMPTY_RESUME_DATA },
      confidence: {
        name: 'low',
        contact: 'low',
        summary: 'low',
        experience: 'low',
        education: 'low',
        skills: 'low',
        projects: 'low',
        certifications: 'low',
      },
      warnings: ['Empty resume content provided.'],
      counts: {
        summaryCount: 0,
        experienceCount: 0,
        bulletCount: 0,
        educationCount: 0,
        skillCount: 0,
        projectCount: 0,
        certificationCount: 0,
        customSectionCount: 0,
      },
      tokenCoverage: 100,
      missingSections: ['summary', 'experience', 'education', 'skills'],
    };
  }

  const warnings: string[] = [];

  // 1. Segment sections
  const { header, sections } = segmentSections(rawText);

  // 2. Extract Header & Contact Coordinates
  const coords = extractHeaderCoordinates(header, rawText);

  // 3. Locate standard sections
  const summarySec =
    sections.find((s) => s.type === 'summary') ||
    sections.find((s) => /^(?:professional\s+)?summary|profile|about\s*me|objective/i.test(s.title));
  const expSec =
    sections.find((s) => s.type === 'experience') ||
    sections.find((s) => /experience|employment|work\s*history|where\s+i/i.test(s.title));
  const eduSec =
    sections.find((s) => s.type === 'education') ||
    sections.find((s) => /education|academic|qualifications|degrees/i.test(s.title));
  const skillsSec =
    sections.find((s) => s.type === 'skills') ||
    sections.find((s) => /skill|competenc|technolog|tools/i.test(s.title));
  const projSec =
    sections.find((s) => s.type === 'projects') ||
    sections.find((s) => /project|capstone/i.test(s.title));
  const certSec =
    sections.find((s) => s.type === 'certifications' || s.type === 'achievements') ||
    sections.find((s) => /certificat|license|accredit|award|honor|achievement|responsibility|activity/i.test(s.title));

  // Summary: NO generic template fallback! If absent, empty string.
  let summary = '';
  if (summarySec && summarySec.rawText.trim()) {
    summary = summarySec.rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ')
      .slice(0, 1200);
  }

  // Work Experience
  const experience: ResumeWorkExperience[] = expSec ? parseExperienceSection(expSec.rawText) : [];

  // Education
  const education: ResumeEducation[] = eduSec ? parseEducationSection(eduSec.rawText) : [];

  // Skills
  const skills = skillsSec ? parseSkillsSection(skillsSec.rawText) : [];

  // Projects
  const projects = projSec ? parseProjectsSection(projSec.rawText) : [];

  // Certifications
  const certifications = certSec ? parseCertificationsSection(certSec.rawText) : [];

  // 4. Process Custom & Non-Standard Sections
  const standardSecs = new Set([summarySec, expSec, eduSec, skillsSec, projSec, certSec].filter(Boolean));
  const remainingSecs = sections.filter((s) => !standardSecs.has(s) && s.rawText.trim().length > 0);

  const customSections: CustomSection[] = [];
  for (const s of remainingSecs) {
    const normTitle = s.title.trim().toUpperCase();
    if (/^(CONTACT|CONTACT INFO|CONTACT DETAILS|PERSONAL DETAILS|PERSONAL INFORMATION|COORDINATES|HEADER)$/.test(normTitle)) {
      continue;
    }
    const cs = parseCustomSection(s.title, s.rawText);
    customSections.push(cs);
  }

  // 5. Build Initial Data for Coverage Calculation
  const initialData: ResumeData = {
    ...EMPTY_RESUME_DATA,
    fullName: coords.fullName || '',
    headline: coords.headline || '',
    email: coords.email || '',
    phone: coords.phone || '',
    location: coords.location || '',
    linkedinUrl: coords.linkedinUrl || '',
    githubOrPortfolio: coords.githubOrPortfolio || '',
    summary: summary || '',
    experience,
    education,
    skills,
    projects,
    certifications,
    customSections,
    activeTemplate: 'clean',
    accentColor: '#2563EB',
    fontFamily: 'sans',
    fontSize: 'base',
  };

  // 6. Token Coverage Check & Residual Text Recovery
  const { coveragePercent, unmappedLines } = computeTokenCoverage(rawText, initialData);

  if (coveragePercent < 95 && unmappedLines.length > 0) {
    const unsortedSection: CustomSection = {
      id: `custom_unsorted_${Date.now()}`,
      title: 'Unsorted Content',
      kind: 'bullets',
      bullets: unmappedLines,
      confidence: 'low',
    };
    customSections.push(unsortedSection);
    warnings.push(
      `Token coverage was ${coveragePercent}%. Unsorted content has been preserved in an editable custom section.`
    );
  }

  const finalCoverage = computeTokenCoverage(rawText, { ...initialData, customSections }).coveragePercent;

  // 7. Dynamic Section Order & Visibility
  const customSectionIds = customSections.map((cs) => cs.id);
  const sectionOrder = [
    ...(EMPTY_RESUME_DATA.sectionOrder || ['summary', 'experience', 'education', 'projects', 'skills', 'certifications']),
    ...customSectionIds,
  ];
  const sectionVisibility: Record<string, boolean> = {
    ...(EMPTY_RESUME_DATA.sectionVisibility || {}),
    ...Object.fromEntries(customSectionIds.map((id) => [id, true])),
  };

  const parsedData: ResumeData = {
    ...initialData,
    customSections,
    sectionOrder,
    sectionVisibility,
  };

  // Count totals
  const totalBullets =
    experience.flatMap((e) => e.bullets).length + projects.flatMap((p) => p.bullets).length;
  const totalSkills = skills.flatMap((s) => s.items).length;

  // Track missing sections
  const missingSections: string[] = [];
  if (!summary) missingSections.push('Summary');
  if (experience.length === 0) missingSections.push('Work Experience');
  if (education.length === 0) missingSections.push('Education');
  if (skills.length === 0) missingSections.push('Skills');

  // Calculate section confidence
  const confidence: SectionConfidence = {
    name: coords.nameConfidence,
    contact: coords.email && coords.phone ? 'high' : 'low',
    summary: summary.length > 40 ? 'high' : 'low',
    experience: experience.length > 0 && totalBullets >= 2 ? 'high' : 'low',
    education: education.length > 0 ? 'high' : 'low',
    skills: totalSkills >= 3 ? 'high' : 'low',
    projects: projects.length > 0 ? 'high' : 'low',
    certifications: certifications.length > 0 ? 'high' : 'low',
    custom: customSections.length > 0 ? 'high' : 'low',
  };

  return {
    data: parsedData,
    confidence,
    warnings,
    counts: {
      summaryCount: summary ? 1 : 0,
      experienceCount: experience.length,
      bulletCount: totalBullets,
      educationCount: education.length,
      skillCount: totalSkills,
      projectCount: projects.length,
      certificationCount: certifications.length,
      customSectionCount: customSections.length,
    },
    tokenCoverage: finalCoverage,
    missingSections,
  };
}

export const parseResumeText = (text: string) => parseRawResumeText(text).data;

export async function parsePdfFileDirectly(file: File): Promise<Partial<ResumeData>> {
  const ingestion = await ingestResumeFile(file);
  const result = parseRawResumeText(ingestion.text);
  return result.data;
}

export async function parseUploadedResumeFile(
  file: File,
  onProgress?: (msg: string) => void
): Promise<{ resume: ResumeData; parseResult: ParseResult; ingestion: IngestionResult }> {
  // 1. Ingest via format-aware router
  const ingestion = await ingestResumeFile(file, onProgress);

  // 2. Parse raw text via rule-based parser
  if (onProgress) onProgress('Extracting resume sections…');
  const parseResult = parseRawResumeText(ingestion.text);

  // Incorporate any ingestion warnings
  if (ingestion.warnings.length > 0) {
    parseResult.warnings.unshift(...ingestion.warnings);
  }

  return {
    resume: parseResult.data,
    parseResult,
    ingestion,
  };
}
