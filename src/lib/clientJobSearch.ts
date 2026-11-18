import type {
  CandidateExperienceLevel,
  CompanyMatchStatus,
  CompanyOpeningsSearchRequest,
  CompanyOpeningsSearchResponse,
  EmploymentTypeFilter,
  ExperienceMatchStatus,
  FilterSummary,
  NormalizedJobOpening,
  PostingFreshnessFilter,
  SourceErrorInfo,
} from '../types/companyOpenings.ts';

interface RawPublicJobRecord {
  id: string;
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  applyUrl: string;
  source: string;
  datePosted: string | null;
  employmentType: string;
  rawExperienceRange?: string;
  jobLevel?: string;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryInterval: string | null;
  salaryCurrency: string | null;
  isRemote: boolean | null;
  loadDetail?: (signal?: AbortSignal) => Promise<{
    description?: string;
    applyUrl?: string;
    employmentType?: string;
    jobLevel?: string;
  } | null>;
}

const LEGAL_SUFFIXES = new Set([
  'inc',
  'incorporated',
  'ltd',
  'limited',
  'pvt',
  'private',
  'llc',
  'llp',
  'corp',
  'corporation',
  'co',
  'company',
  'group',
  'india',
  'services',
  'technologies',
  'solutions',
  'consulting',
  'bank',
]);

const KNOWN_COMPANY_ALIASES: Record<string, string[]> = {
  mckinsey: ['mckinsey', 'mckinsey & company', 'mckinsey and company'],
  'boston consulting group': ['boston consulting group', 'bcg'],
  bain: ['bain', 'bain & company', 'bain and company'],
  'hindustan unilever': ['hindustan unilever', 'hul', 'unilever'],
  deloitte: ['deloitte', 'deloitte consulting', 'deloitte usi', 'deloitte india'],
  'zs associates': ['zs associates', 'zs'],
  'kotak mahindra': ['kotak mahindra', 'kotak', 'kotak bank'],
  itc: ['itc', 'itc limited'],
  'goldman sachs': ['goldman sachs'],
  amazon: ['amazon', 'amazon development centre', 'amazon india'],
  flipkart: ['flipkart', 'flipkart internet'],
  swiggy: ['swiggy', 'bundl technologies'],
  razorpay: ['razorpay', 'razorpay software'],
  bosch: ['bosch', 'bosch group', 'bosch india', 'robert bosch'],
};

const TITLE_STOPWORDS = new Set([
  'and',
  'or',
  'for',
  'of',
  'the',
  'in',
  'at',
  'to',
  'a',
  'an',
  'with',
  'on',
  'role',
]);

const ROLE_STEM_MAP: Record<string, string> = {
  products: 'product',
  managers: 'manager',
  analysts: 'analyst',
  analytics: 'analyst',
  associates: 'associate',
  consultants: 'consultant',
  consulting: 'consultant',
  engineers: 'engineer',
  engineering: 'engineer',
  developers: 'developer',
  specialists: 'specialist',
  coordinators: 'coordinator',
  strategists: 'strategist',
  operations: 'operation',
  operational: 'operation',
  financial: 'finance',
  marketing: 'market',
  interns: 'intern',
  internships: 'intern',
  trainees: 'trainee',
  sr: 'senior',
  jr: 'junior',
  asst: 'assistant',
  assoc: 'associate',
  mgr: 'manager',
};

const HIGHER_SENIORITY_TOKENS = new Set([
  'senior',
  'lead',
  'principal',
  'staff',
  'director',
  'vp',
  'head',
  'chief',
  'architect',
  'svp',
  'evp',
  'avp',
  'gm',
  'partner',
  'fellow',
  'distinguished',
  'master',
  'iii',
  'iv',
  'v',
  'cxo',
  'ceo',
  'cfo',
  'cto',
  'coo',
  'cpo',
  'cmo',
]);

const HIGHER_SENIORITY_PHRASES = [
  'tech lead',
  'team lead',
  'product lead',
  'engineering lead',
  'vice president',
  'general manager',
  'group product manager',
  'group manager',
  'head of',
];

const INTERN_ONLY_TOKENS = new Set(['intern', 'trainee', 'apprentice']);

const FRESHNESS_MAX_DAYS: Record<string, number> = {
  '24h': 1,
  '3d': 3,
  '7d': 7,
  '30d': 30,
};

const FRESHNESS_MAX_HOURS: Record<string, number> = {
  '24h': 24,
  '3d': 72,
  '7d': 168,
  '30d': 720,
};

const CANDIDATE_EXPERIENCE_BOUNDS: Record<CandidateExperienceLevel, [number, number | null] | null> = {
  internship: [0.0, 0.5],
  fresher: [0.0, 1.0],
  '1_3': [1.0, 3.0],
  '3_5': [3.0, 5.0],
  '5_8': [5.0, 8.0],
  '8_plus': [8.0, null],
  any: null,
};

const CANDIDATE_EXPERIENCE_LABELS: Record<CandidateExperienceLevel, string> = {
  internship: 'Internship / No professional experience',
  fresher: 'Fresher / 0–1 years',
  '1_3': '1–3 years',
  '3_5': '3–5 years',
  '5_8': '5–8 years',
  '8_plus': '8+ years',
  any: 'Any experience',
};

const MATCH_LABELS: Record<ExperienceMatchStatus, string> = {
  good_match: 'Good experience match',
  potential_match: 'Potential experience match',
  outside_range: 'Outside selected experience range',
  not_specified: 'Experience not specified',
  needs_review: 'Needs manual review',
};

const CURATED_GREENHOUSE_BOARDS: { slug: string; company: string }[] = [
  { slug: 'razorpaysoftwareprivatelimited', company: 'Razorpay' },
  { slug: 'groww', company: 'Groww' },
  { slug: 'inmobi', company: 'InMobi' },
  { slug: 'stripe', company: 'Stripe' },
  { slug: 'databricks', company: 'Databricks' },
  { slug: 'elastic', company: 'Elastic' },
  { slug: 'mongodb', company: 'MongoDB' },
  { slug: 'okta', company: 'Okta' },
  { slug: 'airbnb', company: 'Airbnb' },
  { slug: 'coursera', company: 'Coursera' },
  { slug: 'zscaler', company: 'Zscaler' },
  { slug: 'figma', company: 'Figma' },
  { slug: 'rubrik', company: 'Rubrik' },
  { slug: 'coinbase', company: 'Coinbase' },
  { slug: 'gitlab', company: 'GitLab' },
  { slug: 'dropbox', company: 'Dropbox' },
  { slug: 'reddit', company: 'Reddit' },
  { slug: 'flexport', company: 'Flexport' },
];

const CURATED_SMARTRECRUITERS_BOARDS: { slug: string; company: string; countryCode?: string }[] = [
  { slug: 'Swiggy', company: 'Swiggy', countryCode: 'in' },
  { slug: 'BoschGroup', company: 'Bosch India', countryCode: 'in' },
  { slug: 'Visa', company: 'Visa', countryCode: 'in' },
];

const CURATED_LEVER_BOARDS: { slug: string; company: string }[] = [
  { slug: 'cred', company: 'CRED' },
  { slug: 'meesho', company: 'Meesho' },
  { slug: 'paytm', company: 'Paytm' },
];

const INDIAN_CITIES = [
  'bengaluru',
  'bangalore',
  'mumbai',
  'bombay',
  'navi mumbai',
  'thane',
  'delhi',
  'new delhi',
  'ncr',
  'gurgaon',
  'gurugram',
  'noida',
  'faridabad',
  'ghaziabad',
  'hyderabad',
  'secunderabad',
  'pune',
  'chennai',
  'kolkata',
  'ahmedabad',
  'jaipur',
  'kochi',
  'cochin',
  'chandigarh',
  'mohali',
  'indore',
  'coimbatore',
  'surat',
  'nagpur',
  'lucknow',
  'bhopal',
  'vadodara',
  'visakhapatnam',
  'thiruvananthapuram',
  'trivandrum',
  'mysuru',
  'mysore',
  'mangaluru',
  'mangalore',
  'bhubaneswar',
  'guwahati',
  'nashik',
  'madurai',
  'vijayawada',
];

const NON_INDIA_GEO_REGEX =
  /\b(?:us|u\.s\.|usa|united states|canada|toronto|vancouver|montreal|new york|nyc|san francisco|bay area|silicon valley|seattle|austin|boston|chicago|los angeles|denver|atlanta|miami|dallas|houston|washington|california|texas|uk|u\.k\.|united kingdom|england|london|ireland|dublin|germany|berlin|hamburg|munich|france|paris|spain|madrid|barcelona|netherlands|amsterdam|italy|milan|rome|poland|warsaw|romania|estonia|austria|vienna|switzerland|zurich|sweden|stockholm|norway|denmark|finland|portugal|lisbon|australia|sydney|melbourne|new zealand|singapore|malaysia|indonesia|philippines|manila|vietnam|thailand|bangkok|japan|tokyo|korea|seoul|china|taiwan|hong kong|uae|dubai|abu dhabi|qatar|saudi|israel|tel aviv|brazil|sao paulo|mexico|argentina|colombia|chile|latam|latin america|emea|europe|eu|north america|americas|africa|nigeria|kenya|south africa|egypt)\b/i;

const CITY_SYNONYMS: Record<string, string[]> = {
  bengaluru: ['bengaluru', 'bangalore'],
  bangalore: ['bengaluru', 'bangalore'],
  gurugram: ['gurugram', 'gurgaon', 'ncr', 'delhi'],
  gurgaon: ['gurugram', 'gurgaon', 'ncr', 'delhi'],
  delhi: ['delhi', 'new delhi', 'ncr', 'gurgaon', 'gurugram', 'noida'],
  ncr: ['delhi', 'new delhi', 'ncr', 'gurgaon', 'gurugram', 'noida'],
  mumbai: ['mumbai', 'bombay', 'navi mumbai', 'thane'],
  hyderabad: ['hyderabad', 'secunderabad'],
  chennai: ['chennai', 'madras'],
  kolkata: ['kolkata', 'calcutta'],
};

const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'refid',
  'trackingid',
  'trk',
  'trkinfo',
  'vjs',
  'from',
  'tk',
]);

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&bull;/g, '•')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function makePreview(description: string, maxLen = 240): string {
  if (!description) {
    return 'Full job description is available on the source job posting.';
  }
  const compact = description.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLen) return compact;
  const sliced = compact.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced}...`;
}

function tokenizeTitle(text: string): string[] {
  const raw = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  const normalized: string[] = [];
  for (const tok of raw) {
    if (TITLE_STOPWORDS.has(tok)) continue;
    normalized.push(ROLE_STEM_MAP[tok] || tok);
  }
  return normalized;
}

export function matchesTargetRoleTitle(
  requestedRole: string,
  jobTitle: string,
  employmentType: EmploymentTypeFilter = 'any',
  candidateExperience: CandidateExperienceLevel = 'any'
): boolean {
  const reqClean = (requestedRole || '').trim();
  const titleClean = (jobTitle || '').trim();
  if (!reqClean || !titleClean) return false;

  const reqLower = reqClean.toLowerCase().replace(/\s+/g, ' ').trim();
  const titleLower = titleClean.toLowerCase().replace(/\s+/g, ' ').trim();

  const reqTokens = tokenizeTitle(reqClean);
  const titleTokens = tokenizeTitle(jobTitle);
  if (reqTokens.length === 0 || titleTokens.length === 0) return false;

  const reqSet = new Set(reqTokens);
  const titleSet = new Set(titleTokens);

  for (const phrase of HIGHER_SENIORITY_PHRASES) {
    if (titleLower.includes(phrase) && !reqLower.includes(phrase)) {
      return false;
    }
  }

  for (const senTok of HIGHER_SENIORITY_TOKENS) {
    if (titleSet.has(senTok) && !reqSet.has(senTok)) {
      return false;
    }
  }

  const isApmShorthand = reqSet.size === 1 && reqSet.has('apm');
  if (titleSet.has('manager') && !reqSet.has('manager') && !isApmShorthand) {
    return false;
  }

  const wantsInternship =
    [...reqSet].some((t) => INTERN_ONLY_TOKENS.has(t)) ||
    employmentType === 'internship' ||
    candidateExperience === 'internship';

  if (!wantsInternship && [...titleSet].some((t) => INTERN_ONLY_TOKENS.has(t))) {
    return false;
  }

  const effectiveTitleSet = new Set(titleSet);
  if (
    wantsInternship &&
    [...titleSet].some((t) => INTERN_ONLY_TOKENS.has(t)) &&
    effectiveTitleSet.has('management')
  ) {
    effectiveTitleSet.add('manager');
  }

  if (reqTokens.every((t) => effectiveTitleSet.has(t))) {
    return true;
  }

  if (
    reqTokens.length === 3 &&
    reqTokens[0] === 'associate' &&
    reqTokens[1] === 'product' &&
    reqTokens[2] === 'manager'
  ) {
    if (effectiveTitleSet.has('apm')) return true;
    if (effectiveTitleSet.has('associate') && effectiveTitleSet.has('pm')) return true;
    return false;
  }

  if (reqTokens.length === 1 && reqTokens[0] === 'apm') {
    if (
      effectiveTitleSet.has('associate') &&
      effectiveTitleSet.has('product') &&
      effectiveTitleSet.has('manager')
    ) {
      return true;
    }
    if (effectiveTitleSet.has('associate') && effectiveTitleSet.has('pm')) return true;
    return false;
  }

  if ((reqSet.has('human') && reqSet.has('resource')) || reqLower.includes('resources')) {
    const expandedReq = reqTokens.filter((t) => t !== 'human' && t !== 'resource' && t !== 'resources');
    const hasHr =
      effectiveTitleSet.has('hr') ||
      (effectiveTitleSet.has('human') &&
        (effectiveTitleSet.has('resource') || titleLower.includes('resources')));
    if (hasHr && expandedReq.every((t) => effectiveTitleSet.has(t))) {
      return true;
    }
  }

  if (reqSet.has('hr')) {
    const expandedReq = reqTokens.filter((t) => t !== 'hr');
    const hasHr =
      effectiveTitleSet.has('hr') ||
      (effectiveTitleSet.has('human') &&
        (effectiveTitleSet.has('resource') || titleLower.includes('resources')));
    if (hasHr && expandedReq.every((t) => effectiveTitleSet.has(t))) {
      return true;
    }
  }

  return false;
}

function normalizeCompanyTokens(name: string): string[] {
  const raw = name.toLowerCase();
  const variants = [raw.replace(/\([^)]*\)/g, ' ')];
  const parenRegex = /\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = parenRegex.exec(raw)) !== null) {
    variants.push(match[1]);
  }

  const tokens: string[] = [];
  for (const variant of variants) {
    for (const part of variant.split(/[/|,&]+/)) {
      const words = (part.match(/[a-z0-9]+/g) || []).filter((w) => !LEGAL_SUFFIXES.has(w));
      if (words.length > 0) {
        tokens.push(words.join(' '));
      }
    }
  }
  return tokens;
}

export function verifyCompanyMatch(
  companyFilter: string,
  returnedCompany: string
): [CompanyMatchStatus | 'mismatch', boolean] {
  const filterClean = (companyFilter || '').trim();
  if (!filterClean) return ['cross_company', true];

  const retClean = (returnedCompany || '').trim();
  if (
    !retClean ||
    ['confidential', 'undisclosed', 'company confidential', 'unknown'].includes(retClean.toLowerCase())
  ) {
    return ['unverified', true];
  }

  const activeVariants = normalizeCompanyTokens(filterClean);
  const retVariants = normalizeCompanyTokens(retClean);
  if (retVariants.length === 0) return ['unverified', true];

  const expandedActive = new Set<string>(activeVariants);
  for (const av of activeVariants) {
    for (const [baseKey, aliases] of Object.entries(KNOWN_COMPANY_ALIASES)) {
      if (av.includes(baseKey) || aliases.includes(av)) {
        aliases.forEach((a) => expandedActive.add(a));
      }
    }
  }

  for (const rv of retVariants) {
    for (const av of expandedActive) {
      if (!av || !rv) continue;
      if (rv === av || rv.includes(av) || av.includes(rv)) {
        return ['confirmed', true];
      }
      const avWords = av.split(' ').filter(Boolean);
      const rvWordSet = new Set(rv.split(' ').filter(Boolean));
      if (avWords.length > 0 && avWords.every((w) => rvWordSet.has(w))) {
        return ['confirmed', true];
      }
    }
  }

  return ['mismatch', false];
}

export function matchesRequestedLocation(
  requestedLocation: string,
  jobLocation: string,
  isRemote: boolean | null = null
): boolean {
  const req = (requestedLocation || '').trim().toLowerCase();
  if (!req || req === 'any' || req === 'all' || req === 'worldwide' || req === 'global') {
    return true;
  }

  const locLower = (jobLocation || '').toLowerCase().trim();
  if (!locLower) return req === 'remote' && isRemote === true;

  const hasIndianGeo =
    /\bindia\b/i.test(locLower) ||
    /,\s*in\b/i.test(locLower) ||
    INDIAN_CITIES.some((city) => locLower.includes(city));

  const hasExplicitNonIndiaGeo =
    !hasIndianGeo && NON_INDIA_GEO_REGEX.test(locLower);

  const isGlobalOpenRemote =
    (/\bworldwide\b/i.test(locLower) ||
      /\banywhere\b/i.test(locLower) ||
      /\bglobal\b/i.test(locLower) ||
      (/\bremote\b/i.test(locLower) && !hasExplicitNonIndiaGeo)) &&
    !hasExplicitNonIndiaGeo;

  if (req === 'remote' || req === 'wfh' || req === 'work from home') {
    if (isRemote === true) return true;
    return /\bremote\b|\banywhere\b|\bworldwide\b|\bhybrid\b/i.test(locLower);
  }

  if (req === 'india' || req === 'pan india') {
    if (hasIndianGeo) return true;
    if (isGlobalOpenRemote) return true;
    return false;
  }

  const reqTokens = req.split(/[,/\s]+/).filter((t) => t.length >= 2 && t !== 'india');
  const candidateMatchers = new Set<string>(reqTokens);
  for (const tok of reqTokens) {
    const syns = CITY_SYNONYMS[tok];
    if (syns) syns.forEach((s) => candidateMatchers.add(s));
  }

  if ([...candidateMatchers].some((m) => locLower.includes(m))) {
    return true;
  }

  if (
    /\bpan[\s-]*india\b|\banywhere\s+in\s+india\b|\bremote[\s,\-]*india\b/i.test(locLower) ||
    isGlobalOpenRemote
  ) {
    return true;
  }

  return false;
}

export function isWithinFreshnessWindow(
  rawDateVal: string | number | Date | null | undefined,
  postingFreshness: PostingFreshnessFilter,
  nowUtc: Date = new Date()
): boolean {
  if (postingFreshness === 'any') return true;
  const maxDays = FRESHNESS_MAX_DAYS[postingFreshness];
  const maxHours = FRESHNESS_MAX_HOURS[postingFreshness];
  if (maxDays === undefined || maxHours === undefined) return true;

  if (rawDateVal === null || rawDateVal === undefined || rawDateVal === '') {
    return false;
  }

  if (typeof rawDateVal === 'number' && Number.isFinite(rawDateVal)) {
    const ms = rawDateVal > 1e12 ? rawDateVal : rawDateVal * 1000;
    const ageHours = (nowUtc.getTime() - ms) / 3600000;
    return ageHours <= maxHours;
  }

  if (rawDateVal instanceof Date && !Number.isNaN(rawDateVal.getTime())) {
    const ageHours = (nowUtc.getTime() - rawDateVal.getTime()) / 3600000;
    return ageHours <= maxHours;
  }

  const text = String(rawDateVal).trim();
  if (!text) return false;
  const lower = text.toLowerCase();

  if (
    ['just now', 'today', 'few hours', 'moments ago', 'seconds ago'].some((tok) =>
      lower.includes(tok)
    )
  ) {
    return true;
  }
  if (/(\d+)\s*(?:min|mins|minute|minutes)\s*ago/.test(lower)) {
    return true;
  }
  const mHours = lower.match(/(\d+)\s*(?:hr|hrs|hour|hours)\s*ago/);
  if (mHours) {
    return parseInt(mHours[1], 10) <= maxHours;
  }
  if (lower.includes('hour ago')) {
    return 1 <= maxHours;
  }
  if (lower.includes('yesterday')) {
    return 1 <= maxDays;
  }
  const mDays = lower.match(/(\d+)\s*\+?\s*days?\s*ago/);
  if (mDays) {
    if (mDays[0].includes('+')) return false;
    return parseInt(mDays[1], 10) <= maxDays;
  }
  const mWeeks = lower.match(/(\d+)\s*\+?\s*weeks?\s*ago/);
  if (mWeeks) {
    if (mWeeks[0].includes('+')) return false;
    return parseInt(mWeeks[1], 10) * 7 <= maxDays;
  }
  const mMonths = lower.match(/(\d+)\s*\+?\s*months?\s*ago/);
  if (mMonths) {
    if (mMonths[0].includes('+')) return false;
    return parseInt(mMonths[1], 10) * 30 <= maxDays;
  }

  const pureDateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (pureDateMatch) {
    const parsedUtcMidnight = Date.UTC(
      Number(pureDateMatch[1]),
      Number(pureDateMatch[2]) - 1,
      Number(pureDateMatch[3])
    );
    const istNow = new Date(nowUtc.getTime() + 5.5 * 3600000);
    const todayIstUtcMidnight = Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate()
    );
    const ageDays = Math.max(0, Math.round((todayIstUtcMidnight - parsedUtcMidnight) / 86400000));
    return ageDays <= maxDays;
  }

  const parsedMs = Date.parse(text);
  if (!Number.isNaN(parsedMs)) {
    const ageHours = (nowUtc.getTime() - parsedMs) / 3600000;
    return ageHours <= maxHours;
  }

  return false;
}

function toIsoDateOnly(raw: string | number | Date | null | undefined): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const ms = raw > 1e12 ? raw : raw * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  const isoPrefix = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return s;
}

function extractNumericRanges(
  text: string,
  isMetadata = false
): [number, number | null, string][] {
  const found: [number, number | null, string][] = [];
  if (!text) return found;

  if (isMetadata) {
    const metaMatch = text
      .trim()
      .match(/^(\d{1,2}(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d{1,2}(?:\.\d+)?)\s*(?:years?|yrs?)?$/i);
    if (metaMatch) {
      const low = parseFloat(metaMatch[1]);
      const high = parseFloat(metaMatch[2]);
      if (low >= 0 && low <= high && high <= 35) {
        return [[low, high, `${metaMatch[1]}–${metaMatch[2]} years`]];
      }
    }
  }

  const rangeRe =
    /(?<!\d)(?:between\s+)?(\d{1,2}(?:\.\d+)?)\s*(?:-|–|—|to|and)\s*(\d{1,2}(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = rangeRe.exec(text)) !== null) {
    const low = parseFloat(m[1]);
    const high = parseFloat(m[2]);
    if (low >= 0 && low <= high && high <= 35) {
      found.push([low, high, `${m[1]}–${m[2]} years`]);
    }
  }

  const minRe = /\b(?:minimum|min\.?|at\s+least)\s+(?:of\s+)?(\d{1,2}(?:\.\d+)?)\s*(?:years?|yrs?)\b/gi;
  while ((m = minRe.exec(text)) !== null) {
    const low = parseFloat(m[1]);
    if (low >= 0 && low <= 35) {
      found.push([low, null, `Minimum ${m[1]} years`]);
    }
  }

  const plusRe = /(?:(?:minimum|min\.?|at\s+least)\s+(?:of\s+)?)?(\d{1,2}(?:\.\d+)?)\s*\+\s*(?:years?|yrs?)\b/gi;
  while ((m = plusRe.exec(text)) !== null) {
    const low = parseFloat(m[1]);
    if (low >= 0 && low <= 35) {
      found.push([low, null, `${m[1]}+ years`]);
    }
  }

  const upToRe = /\b(?:up\s+to|max(?:imum)?)\s+(\d{1,2}(?:\.\d+)?)\s*(?:years?|yrs?)\b/gi;
  while ((m = upToRe.exec(text)) !== null) {
    const high = parseFloat(m[1]);
    if (high >= 0 && high <= 35) {
      found.push([0.0, high, `Up to ${m[1]} years`]);
    }
  }

  if (found.length === 0) {
    const singleRe =
      /(?<!\d)(\d{1,2}(?:\.\d+)?)\s*(?:years?|yrs?)\s+(?:of\s+)?(?:[a-z/&-]+\s+){0,4}?experience\b/gi;
    while ((m = singleRe.exec(text)) !== null) {
      const val = parseFloat(m[1]);
      if (val >= 0 && val <= 35) {
        found.push([val, val, `${m[1]} years`]);
      }
    }
  }

  if (found.length === 0) {
    const verbExpRe =
      /\b(?:requires?|requiring|with|having|needs?)\s+(\d{1,2}(?:\.\d+)?)\s*(?:years?|yrs?)\b/gi;
    while ((m = verbExpRe.exec(text)) !== null) {
      const val = parseFloat(m[1]);
      if (val >= 0 && val <= 35) {
        found.push([val, val, `${m[1]} years`]);
      }
    }
  }

  return found;
}

function compareRanges(
  candBounds: [number, number | null] | null,
  candKey: CandidateExperienceLevel,
  reqMin: number,
  reqMax: number | null,
  extractedLabel: string
): [ExperienceMatchStatus, string] {
  if (!candBounds || candKey === 'any') {
    return [
      'good_match',
      `Candidate selected 'Any experience'; posting states ${extractedLabel}.`,
    ];
  }

  const [cMin, cMax] = candBounds;
  const cUpper = cMax !== null ? cMax : 35.0;
  const rUpper = reqMax !== null ? reqMax : 35.0;

  if (cMin <= rUpper && reqMin <= cUpper) {
    if (cUpper === reqMin && reqMin > cMin) {
      return [
        'potential_match',
        `Borderline overlap: candidate (${CANDIDATE_EXPERIENCE_LABELS[candKey]}) meets minimum of posting (${extractedLabel}).`,
      ];
    }
    if (reqMax !== null && cMin === rUpper && rUpper > reqMin) {
      return [
        'potential_match',
        `Borderline overlap: posting (${extractedLabel}) meets lower end of candidate (${CANDIDATE_EXPERIENCE_LABELS[candKey]}).`,
      ];
    }
    return [
      'good_match',
      `Candidate experience (${CANDIDATE_EXPERIENCE_LABELS[candKey]}) overlaps posting requirement (${extractedLabel}).`,
    ];
  }

  if (reqMin > cUpper && reqMin - cUpper <= 1.0) {
    return [
      'potential_match',
      `Posting asks for ${extractedLabel}, slightly above ${CANDIDATE_EXPERIENCE_LABELS[candKey]}.`,
    ];
  }
  if (cMin > rUpper && cMin - rUpper <= 1.5) {
    return [
      'potential_match',
      `Posting states ${extractedLabel}, slightly below ${CANDIDATE_EXPERIENCE_LABELS[candKey]}.`,
    ];
  }

  return [
    'outside_range',
    `Posting specifies ${extractedLabel}, outside ${CANDIDATE_EXPERIENCE_LABELS[candKey]}.`,
  ];
}

export function classifyExperience(
  candidateExperience: CandidateExperienceLevel,
  rawExperienceRange: string | undefined,
  rawJobLevel: string | undefined,
  description: string,
  rawEmploymentType?: string
): {
  experienceRange: string;
  matchStatus: ExperienceMatchStatus;
  matchLabel: string;
  reason: string;
} {
  const candKey: CandidateExperienceLevel =
    candidateExperience in CANDIDATE_EXPERIENCE_BOUNDS ? candidateExperience : 'any';
  const candBounds = CANDIDATE_EXPERIENCE_BOUNDS[candKey];

  const expMeta = (rawExperienceRange || '').trim();
  const jobLevel = (rawJobLevel || '').trim();
  const descText = (description || '').trim();
  const empType = (rawEmploymentType || '').trim().toLowerCase();

  const metaRanges = extractNumericRanges(expMeta, true);
  if (metaRanges.length > 0) {
    const [reqMin, reqMax, label] = metaRanges[0];
    const [status, reason] = compareRanges(candBounds, candKey, reqMin, reqMax, label);
    return {
      experienceRange: expMeta || label,
      matchStatus: status,
      matchLabel: MATCH_LABELS[status],
      reason,
    };
  }

  const hasFresherPhrase = [
    /\bfreshers?\s+(?:welcome|can\s+apply|are\s+welcome|preferred|eligible)\b/i,
    /\bno\s+prior\s+experience\s+(?:required|needed)\b/i,
    /\bno\s+experience\s+(?:required|needed)\b/i,
    /\bentry[\s-]+level\b/i,
  ].some((p) => p.test(descText));

  const descRanges = extractNumericRanges(descText, false);
  const uniqueBounds: [number, number | null, string][] = [];
  const seenBounds = new Set<string>();
  for (const [low, high, label] of descRanges) {
    const key = `${low}|${high ?? 'null'}`;
    if (!seenBounds.has(key)) {
      seenBounds.add(key);
      uniqueBounds.push([low, high, label]);
    }
  }

  if (uniqueBounds.length === 1) {
    const [reqMin, reqMax, label] = uniqueBounds[0];
    const [status, reason] = compareRanges(candBounds, candKey, reqMin, reqMax, label);
    return {
      experienceRange: label,
      matchStatus: status,
      matchLabel: MATCH_LABELS[status],
      reason,
    };
  }

  if (uniqueBounds.length > 1) {
    const labelsJoined = uniqueBounds
      .slice(0, 3)
      .map((item) => item[2])
      .join('; ');
    return {
      experienceRange: labelsJoined,
      matchStatus: 'needs_review',
      matchLabel: MATCH_LABELS.needs_review,
      reason: `Multiple experience statements detected in description (${labelsJoined}). Please review posting details.`,
    };
  }

  if (hasFresherPhrase) {
    const [status, reason] = compareRanges(candBounds, candKey, 0.0, 1.0, 'Freshers / 0–1 years');
    return {
      experienceRange: 'Freshers welcome / 0–1 years',
      matchStatus: status,
      matchLabel: MATCH_LABELS[status],
      reason,
    };
  }

  if (
    [
      /\brelevant\s+experience\s+(?:required|preferred|is\s+a\s+plus)\b/i,
      /\bprior\s+(?:[a-z]+\s+){0,2}?experience\s+(?:in|with|is|required|preferred)\b/i,
      /\bproven\s+(?:[a-z]+\s+){0,2}?experience\b/i,
      /\bextensive\s+experience\b/i,
    ].some((p) => p.test(descText))
  ) {
    return {
      experienceRange: 'Relevant experience required (years not stated)',
      matchStatus: 'needs_review',
      matchLabel: MATCH_LABELS.needs_review,
      reason: 'Posting requests relevant experience without specifying exact years.',
    };
  }

  if (jobLevel && jobLevel.toLowerCase() !== 'not applicable') {
    const jlLower = jobLevel.toLowerCase();
    if (jlLower.includes('intern')) {
      const [status, reason] = compareRanges(candBounds, candKey, 0.0, 0.5, 'Internship level');
      return {
        experienceRange: `Job level: ${jobLevel}`,
        matchStatus: status,
        matchLabel: MATCH_LABELS[status],
        reason,
      };
    }
    if (jlLower.includes('entry')) {
      const [status, reason] = compareRanges(candBounds, candKey, 0.0, 1.5, 'Entry level');
      return {
        experienceRange: `Job level: ${jobLevel}`,
        matchStatus: status,
        matchLabel: MATCH_LABELS[status],
        reason,
      };
    }
    if (jlLower.includes('mid-senior') || jlLower.includes('director') || jlLower.includes('executive')) {
      const seniorMin = jlLower.includes('director') || jlLower.includes('executive') ? 8.0 : 3.5;
      let [status, reason] = compareRanges(candBounds, candKey, seniorMin, null, `Job level: ${jobLevel}`);
      if (candKey !== 'any' && candKey !== 'internship' && candKey !== 'fresher' && candKey !== '1_3') {
        status = 'needs_review';
        reason = `Source lists seniority '${jobLevel}' without numeric years of experience.`;
      }
      return {
        experienceRange: `Job level: ${jobLevel}`,
        matchStatus: status,
        matchLabel: MATCH_LABELS[status],
        reason,
      };
    }
    if (jlLower.includes('associate')) {
      return {
        experienceRange: `Job level: ${jobLevel} (years not specified)`,
        matchStatus: 'not_specified',
        matchLabel: MATCH_LABELS.not_specified,
        reason: `Source lists '${jobLevel}' without stating exact years of experience.`,
      };
    }
  }

  if (empType.includes('internship')) {
    const [status, reason] = compareRanges(candBounds, candKey, 0.0, 0.5, 'Internship');
    return {
      experienceRange: 'Internship (0–1 years)',
      matchStatus: status,
      matchLabel: MATCH_LABELS[status],
      reason,
    };
  }

  return {
    experienceRange: 'Not specified',
    matchStatus: 'not_specified',
    matchLabel: MATCH_LABELS.not_specified,
    reason: 'No explicit experience requirement found in posting metadata or description.',
  };
}

function normalizeEmploymentType(raw: string): string {
  const s = (raw || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (!s || s === 'notapplicable' || s === 'notspecified') return 'Not specified';
  if (s.includes('full')) return 'fulltime';
  if (s.includes('intern')) return 'internship';
  if (s.includes('part')) return 'parttime';
  if (s.includes('contract') || s.includes('freelance') || s.includes('temp')) return 'contract';
  return raw;
}

function matchesEmploymentFilter(
  requested: EmploymentTypeFilter,
  rowEmpType: string,
  title: string
): boolean {
  if (requested === 'any') return true;
  const norm = normalizeEmploymentType(rowEmpType).toLowerCase();
  const titleLower = title.toLowerCase();
  if (requested === 'internship') {
    if (norm === 'internship' || /\bintern\b|\binternship\b|\btrainee\b/.test(titleLower)) return true;
    return norm === 'not specified';
  }
  if (norm === 'not specified') return true;
  return norm === requested;
}

function normalizeUrlForDedup(url: string): string {
  try {
    const u = new URL(url.trim());
    const kept: [string, string][] = [];
    u.searchParams.forEach((v, k) => {
      if (!TRACKING_QUERY_PARAMS.has(k.toLowerCase())) {
        kept.push([k, v]);
      }
    });
    kept.sort((a, b) => a[0].localeCompare(b[0]));
    const params = new URLSearchParams(kept).toString();
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '')}${params ? `?${params}` : ''}`;
  } catch {
    return '';
  }
}

function formatSalaryDisplay(
  minAmt: number | null,
  maxAmt: number | null,
  interval: string | null,
  currency: string | null
): string {
  if ((!minAmt || minAmt <= 0) && (!maxAmt || maxAmt <= 0)) {
    return 'Not disclosed';
  }
  const cur = currency ? `${currency.toUpperCase()} ` : '';
  const fmt = (n: number) => Math.round(n).toLocaleString();
  let span = '';
  if (minAmt && maxAmt && minAmt > 0 && maxAmt > 0) {
    span = Math.abs(minAmt - maxAmt) < 1 ? fmt(minAmt) : `${fmt(minAmt)} – ${fmt(maxAmt)}`;
  } else if (minAmt && minAmt > 0) {
    span = `From ${fmt(minAmt)}`;
  } else if (maxAmt && maxAmt > 0) {
    span = `Up to ${fmt(maxAmt)}`;
  } else {
    return 'Not disclosed';
  }
  return `${cur}${span}${interval ? ` / ${interval}` : ''}`.trim();
}

function stableShortHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(12, '0');
}

interface RawPublicJobRecordWithFreshness extends RawPublicJobRecord {
  freshnessHint?: string | null;
}

const LINKEDIN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

const linkedInDetailCache = new Map<
  string,
  {
    expiresAt: number;
    detail: {
      description?: string;
      applyUrl?: string;
      employmentType?: string;
      jobLevel?: string;
    };
  }
>();

async function fetchTextWithTimeout(
  url: string,
  timeoutMs: number,
  externalSignal?: AbortSignal,
  headers?: Record<string, string>
): Promise<{ status: number; text: string }> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers });
    const text = await res.text();
    return { status: res.status, text };
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onAbort);
    }
  }
}

async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<any> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onAbort);
    }
  }
}

async function fetchGreenhouseBoard(
  slug: string,
  companyLabel: string,
  signal?: AbortSignal
): Promise<RawPublicJobRecord[]> {
  const data = await fetchJsonWithTimeout(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=false`,
    8500,
    signal
  );
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
  return jobs
    .filter((j: any) => j?.title && j?.absolute_url)
    .map((j: any): RawPublicJobRecord => {
      const jobId = String(j.id ?? '');
      const locName = j.location?.name ? String(j.location.name) : 'Location not specified';
      const rawDate = j.first_published || j.updated_at || null;
      const compName = j.company_name ? String(j.company_name) : companyLabel;
      return {
        id: `gh-${slug}-${jobId}`,
        title: String(j.title).trim(),
        company: compName,
        location: locName,
        jobUrl: String(j.absolute_url),
        applyUrl: String(j.absolute_url),
        source: 'greenhouse',
        datePosted: rawDate,
        employmentType: j.employment ? String(j.employment) : 'Not specified',
        description: '',
        salaryMin: null,
        salaryMax: null,
        salaryInterval: null,
        salaryCurrency: null,
        isRemote: /\bremote\b/i.test(locName) ? true : null,
        loadDetail: async (sig?: AbortSignal) => {
          const det = await fetchJsonWithTimeout(
            `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs/${encodeURIComponent(jobId)}`,
            6500,
            sig
          );
          return {
            description: htmlToPlainText(det?.content || ''),
            applyUrl: det?.absolute_url ? String(det.absolute_url) : undefined,
          };
        },
      };
    });
}

async function fetchSmartRecruitersBoard(
  slug: string,
  companyLabel: string,
  roleQuery: string,
  countryCode?: string,
  signal?: AbortSignal
): Promise<RawPublicJobRecord[]> {
  const params = new URLSearchParams({ limit: '50' });
  if (roleQuery) params.set('q', roleQuery);
  if (countryCode) params.set('country', countryCode);

  const data = await fetchJsonWithTimeout(
    `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings?${params.toString()}`,
    8500,
    signal
  );
  const postings = Array.isArray(data?.content) ? data.content : [];
  return postings
    .filter((p: any) => p?.id && p?.name)
    .map((p: any): RawPublicJobRecord => {
      const pid = String(p.id);
      const city = p.location?.city ? String(p.location.city) : '';
      const country = p.location?.country ? String(p.location.country).toUpperCase() : '';
      const locStr =
        [city, country === 'IN' ? 'India' : country].filter(Boolean).join(', ') ||
        p.location?.fullLocation ||
        'Location not specified';
      const postingUrl = `https://jobs.smartrecruiters.com/${encodeURIComponent(slug)}/${encodeURIComponent(pid)}`;
      return {
        id: `sr-${slug}-${pid}`,
        title: String(p.name).trim(),
        company: p.company?.name ? String(p.company.name) : companyLabel,
        location: locStr,
        jobUrl: postingUrl,
        applyUrl: postingUrl,
        source: 'smartrecruiters',
        datePosted: p.releasedDate ? String(p.releasedDate) : null,
        employmentType: p.typeOfEmployment?.label ? String(p.typeOfEmployment.label) : 'Not specified',
        jobLevel: p.experienceLevel?.label ? String(p.experienceLevel.label) : undefined,
        description: '',
        salaryMin: null,
        salaryMax: null,
        salaryInterval: null,
        salaryCurrency: null,
        isRemote: typeof p.location?.remote === 'boolean' ? p.location.remote : null,
        loadDetail: async (sig?: AbortSignal) => {
          const det = await fetchJsonWithTimeout(
            `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings/${encodeURIComponent(pid)}`,
            6500,
            sig
          );
          const sections = det?.jobAd?.sections || {};
          const htmlParts = [
            sections.jobDescription?.text,
            sections.qualifications?.text,
            sections.additionalInformation?.text,
          ].filter(Boolean);
          return {
            description: htmlToPlainText(htmlParts.join('\n\n')),
            applyUrl: det?.applyUrl ? String(det.applyUrl) : det?.postingUrl ? String(det.postingUrl) : undefined,
            employmentType: det?.typeOfEmployment?.label ? String(det.typeOfEmployment.label) : undefined,
            jobLevel: det?.experienceLevel?.label ? String(det.experienceLevel.label) : undefined,
          };
        },
      };
    });
}

async function fetchRemotiveJobs(roleQuery: string, signal?: AbortSignal): Promise<RawPublicJobRecord[]> {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(roleQuery)}&limit=60`;
  const data = await fetchJsonWithTimeout(url, 8500, signal);
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
  return jobs
    .filter((j: any) => j?.title && j?.url)
    .map((j: any): RawPublicJobRecord => ({
      id: `remotive-${j.id ?? stableShortHash(String(j.url))}`,
      title: String(j.title).trim(),
      company: j.company_name ? String(j.company_name).trim() : 'Company not specified',
      location: j.candidate_required_location ? String(j.candidate_required_location).trim() : 'Remote',
      jobUrl: String(j.url),
      applyUrl: String(j.url),
      source: 'remotive',
      datePosted: j.publication_date ? String(j.publication_date) : null,
      employmentType: j.job_type ? String(j.job_type) : 'Not specified',
      description: htmlToPlainText(String(j.description || '')),
      salaryMin: null,
      salaryMax: null,
      salaryInterval: null,
      salaryCurrency: null,
      isRemote: true,
    }));
}

async function fetchJobicyJobs(roleQuery: string, signal?: AbortSignal): Promise<RawPublicJobRecord[]> {
  const url = `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(roleQuery)}`;
  const data = await fetchJsonWithTimeout(url, 8500, signal);
  let jobs = Array.isArray(data?.jobs) ? data.jobs : [];
  if (jobs.length === 0) {
    const broad = await fetchJsonWithTimeout('https://jobicy.com/api/v2/remote-jobs?count=50', 7000, signal);
    jobs = Array.isArray(broad?.jobs) ? broad.jobs : [];
  }
  return jobs
    .filter((j: any) => j?.jobTitle && j?.url)
    .map((j: any): RawPublicJobRecord => {
      const emp = Array.isArray(j.jobType) ? j.jobType.join(', ') : String(j.jobType || 'Not specified');
      return {
        id: `jobicy-${j.id ?? stableShortHash(String(j.url))}`,
        title: htmlToPlainText(String(j.jobTitle)),
        company: j.companyName ? htmlToPlainText(String(j.companyName)) : 'Company not specified',
        location: j.jobGeo ? String(j.jobGeo) : 'Remote',
        jobUrl: String(j.url),
        applyUrl: String(j.url),
        source: 'jobicy',
        datePosted: j.pubDate ? String(j.pubDate) : null,
        employmentType: emp,
        jobLevel: j.jobLevel ? String(j.jobLevel) : undefined,
        description: htmlToPlainText(String(j.jobDescription || j.jobExcerpt || '')),
        salaryMin: typeof j.annualSalaryMin === 'number' ? j.annualSalaryMin : null,
        salaryMax: typeof j.annualSalaryMax === 'number' ? j.annualSalaryMax : null,
        salaryInterval: j.annualSalaryMin || j.annualSalaryMax ? 'yearly' : null,
        salaryCurrency: j.salaryCurrency ? String(j.salaryCurrency) : null,
        isRemote: true,
      };
    });
}

async function fetchRemoteOkJobs(signal?: AbortSignal): Promise<RawPublicJobRecord[]> {
  const data = await fetchJsonWithTimeout('https://remoteok.com/api', 8500, signal);
  const rows = Array.isArray(data) ? data.filter((r: any) => r && r.position && (r.url || r.apply_url)) : [];
  return rows.map((r: any): RawPublicJobRecord => {
    const url = String(r.apply_url || r.url);
    return {
      id: `remoteok-${r.id ?? stableShortHash(url)}`,
      title: String(r.position).trim(),
      company: r.company ? String(r.company).trim() : 'Company not specified',
      location: r.location ? String(r.location).trim() : 'Remote',
      jobUrl: String(r.url || url),
      applyUrl: url,
      source: 'remoteok',
      datePosted: r.date ? String(r.date) : typeof r.epoch === 'number' ? new Date(r.epoch * 1000).toISOString() : null,
      employmentType: 'fulltime',
      description: htmlToPlainText(String(r.description || '')),
      salaryMin: typeof r.salary_min === 'number' && r.salary_min > 0 ? r.salary_min : null,
      salaryMax: typeof r.salary_max === 'number' && r.salary_max > 0 ? r.salary_max : null,
      salaryInterval: r.salary_min || r.salary_max ? 'yearly' : null,
      salaryCurrency: r.salary_min || r.salary_max ? 'USD' : null,
      isRemote: true,
    };
  });
}

async function fetchArbeitnowJobs(signal?: AbortSignal): Promise<RawPublicJobRecord[]> {
  const data = await fetchJsonWithTimeout('https://www.arbeitnow.com/api/job-board-api?page=1', 8500, signal);
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows
    .filter((r: any) => r?.title && r?.url)
    .map((r: any): RawPublicJobRecord => {
      const emp = Array.isArray(r.job_types) && r.job_types.length > 0 ? String(r.job_types[0]) : 'Not specified';
      const createdIso =
        typeof r.created_at === 'number' && Number.isFinite(r.created_at)
          ? new Date(r.created_at * 1000).toISOString()
          : null;
      return {
        id: `arbeitnow-${r.slug ?? stableShortHash(String(r.url))}`,
        title: String(r.title).trim(),
        company: r.company_name ? String(r.company_name).trim() : 'Company not specified',
        location: r.location ? String(r.location).trim() : r.remote ? 'Remote' : 'Location not specified',
        jobUrl: String(r.url),
        applyUrl: String(r.url),
        source: 'arbeitnow',
        datePosted: createdIso,
        employmentType: emp,
        description: htmlToPlainText(String(r.description || '')),
        salaryMin: null,
        salaryMax: null,
        salaryInterval: null,
        salaryCurrency: null,
        isRemote: typeof r.remote === 'boolean' ? r.remote : null,
      };
    });
}

async function fetchLeverBoard(
  slug: string,
  companyLabel: string,
  signal?: AbortSignal
): Promise<RawPublicJobRecord[]> {
  const rows = await fetchJsonWithTimeout(
    `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`,
    8000,
    signal
  );
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r: any) => r?.text && r?.hostedUrl)
    .map((r: any): RawPublicJobRecord => ({
      id: `lever-${slug}-${r.id}`,
      title: String(r.text).trim(),
      company: companyLabel,
      location: r.categories?.location ? String(r.categories.location) : 'Location not specified',
      jobUrl: String(r.hostedUrl),
      applyUrl: String(r.applyUrl || r.hostedUrl),
      source: 'lever',
      datePosted: typeof r.createdAt === 'number' ? new Date(r.createdAt).toISOString() : null,
      employmentType: r.categories?.commitment ? String(r.categories.commitment) : 'Not specified',
      description: htmlToPlainText(
        [r.descriptionPlain || r.description || '', r.additionalPlain || r.additional || ''].join('\n\n')
      ),
      salaryMin: null,
      salaryMax: null,
      salaryInterval: null,
      salaryCurrency: null,
      isRemote: r.workplaceType === 'remote' ? true : null,
    }));
}

async function fetchHimalayasJobs(signal?: AbortSignal): Promise<RawPublicJobRecord[]> {
  const data = await fetchJsonWithTimeout('https://himalayas.app/jobs/api?limit=50', 8500, signal);
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
  return jobs
    .filter((j: any) => j?.title && (j?.applicationLink || j?.guid))
    .map((j: any): RawPublicJobRecord => {
      const locs = Array.isArray(j.locationRestrictions) && j.locationRestrictions.length > 0
        ? j.locationRestrictions.join(', ')
        : 'Remote / Worldwide';
      const emp = j.employmentType ? String(j.employmentType) : 'Not specified';
      const seniority = Array.isArray(j.seniority) && j.seniority.length > 0
        ? String(j.seniority[0])
        : undefined;
      const pubIso = typeof j.pubDate === 'number' && Number.isFinite(j.pubDate)
        ? new Date(j.pubDate * 1000).toISOString()
        : null;
      return {
        id: `himalayas-${j.guid ? stableShortHash(String(j.guid)) : stableShortHash(String(j.applicationLink))}`,
        title: String(j.title).trim(),
        company: j.companyName ? String(j.companyName).trim() : 'Company not specified',
        location: locs,
        jobUrl: String(j.guid || j.applicationLink),
        applyUrl: String(j.applicationLink || j.guid),
        source: 'himalayas',
        datePosted: pubIso,
        employmentType: emp,
        jobLevel: seniority,
        description: htmlToPlainText(String(j.description || j.excerpt || '')),
        salaryMin: typeof j.minSalary === 'number' && j.minSalary > 0 ? j.minSalary : null,
        salaryMax: typeof j.maxSalary === 'number' && j.maxSalary > 0 ? j.maxSalary : null,
        salaryInterval: j.minSalary || j.maxSalary ? 'yearly' : null,
        salaryCurrency: j.currency ? String(j.currency) : null,
        isRemote: true,
      };
    });
}

async function fetchLinkedInGuestJobs(
  roleQuery: string,
  requestedLocation: string,
  companyFilter: string,
  postingFreshness: PostingFreshnessFilter,
  employmentType: EmploymentTypeFilter,
  signal?: AbortSignal
): Promise<RawPublicJobRecordWithFreshness[]> {
  const keywords = companyFilter ? `${roleQuery} ${companyFilter}`.trim() : roleQuery;
  const locLower = requestedLocation.toLowerCase();
  const isRemoteQuery = locLower === 'remote' || locLower === 'wfh' || locLower === 'work from home';
  const effectiveLocation = isRemoteQuery ? 'India' : requestedLocation || 'India';

  const tprMap: Record<PostingFreshnessFilter, string> = {
    '24h': 'r86400',
    '3d': 'r259200',
    '7d': 'r604800',
    '30d': 'r2592000',
    any: '',
  };
  const jtMap: Record<EmploymentTypeFilter, string> = {
    fulltime: 'F',
    parttime: 'P',
    contract: 'C',
    internship: 'I',
    any: '',
  };

  const baseParams = new URLSearchParams({
    keywords,
    location: effectiveLocation,
  });
  if (tprMap[postingFreshness]) baseParams.set('f_TPR', tprMap[postingFreshness]);
  if (jtMap[employmentType]) baseParams.set('f_JT', jtMap[employmentType]);
  if (isRemoteQuery) baseParams.set('f_WT', '2');

  const pageOffsets = [0, 10, 20];
  const pageResponses = await Promise.allSettled(
    pageOffsets.map(async (start) => {
      const p = new URLSearchParams(baseParams);
      p.set('start', String(start));
      const { status, text } = await fetchTextWithTimeout(
        `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${p.toString()}`,
        8500,
        signal,
        LINKEDIN_HEADERS
      );
      if (status !== 200) {
        throw new Error(`LinkedIn returned HTTP ${status}`);
      }
      return text;
    })
  );

  let okPages = 0;
  const records: RawPublicJobRecordWithFreshness[] = [];
  const seenLiIds = new Set<string>();

  for (const pageRes of pageResponses) {
    if (pageRes.status !== 'fulfilled') continue;
    okPages++;
    const blocks = pageRes.value.split('<li>').slice(1);
    for (const block of blocks) {
      const jobId = block.match(/jobPosting:(\d+)/)?.[1];
      const rawTitle = block.match(/base-search-card__title[^>]*>([\s\S]*?)<\/h3>/)?.[1];
      const title = htmlToPlainText(rawTitle || '').replace(/\s+/g, ' ').trim();
      const rawUrl = block.match(/base-card__full-link[^>]*href="([^"]+)"/)?.[1];
      if (!title || !rawUrl) continue;

      const cleanUrl = rawUrl.split('?')[0].trim();
      const dedupKey = jobId || cleanUrl;
      if (seenLiIds.has(dedupKey)) continue;
      seenLiIds.add(dedupKey);

      const rawCompany =
        block.match(/base-search-card__subtitle[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/)?.[1] ||
        block.match(/base-search-card__subtitle[^>]*>([\s\S]*?)<\/h4>/)?.[1] ||
        '';
      const company = htmlToPlainText(rawCompany).replace(/\s+/g, ' ').trim() || 'Company not specified';

      const rawLoc = block.match(/job-search-card__location[^>]*>([\s\S]*?)<\/span>/)?.[1] || '';
      const location = htmlToPlainText(rawLoc).replace(/\s+/g, ' ').trim() || effectiveLocation;

      const timeDateMatch = block.match(/<time[^>]*datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/);
      const isoDate = timeDateMatch?.[1]?.trim() || null;
      const relativeText = timeDateMatch?.[2]
        ? htmlToPlainText(timeDateMatch[2]).replace(/\s+/g, ' ').trim()
        : null;

      records.push({
        id: `linkedin-${jobId || stableShortHash(cleanUrl)}`,
        title,
        company,
        location,
        jobUrl: cleanUrl,
        applyUrl: cleanUrl,
        source: 'linkedin',
        datePosted: isoDate,
        freshnessHint: relativeText || isoDate,
        employmentType: employmentType !== 'any' ? employmentType : 'Not specified',
        description: '',
        salaryMin: null,
        salaryMax: null,
        salaryInterval: null,
        salaryCurrency: null,
        isRemote: isRemoteQuery || /\bremote\b/i.test(location) ? true : null,
        loadDetail: jobId
          ? async (sig?: AbortSignal) => {
              const now = Date.now();
              const cached = linkedInDetailCache.get(jobId);
              if (cached && cached.expiresAt > now) {
                return cached.detail;
              }
              const { status, text } = await fetchTextWithTimeout(
                `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${encodeURIComponent(jobId)}`,
                6500,
                sig,
                LINKEDIN_HEADERS
              );
              if (status === 429) {
                const err: any = new Error('LinkedIn detail rate limited');
                err.status = 429;
                throw err;
              }
              if (status !== 200 || !text) return null;

              const descHtml = text.match(/show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/)?.[1] || '';
              const description = htmlToPlainText(descHtml);
              let jobLevel: string | undefined;
              let empType: string | undefined;

              const criteriaMatches = text.matchAll(
                /description__job-criteria-subheader[^>]*>([\s\S]*?)<\/h3>[\s\S]*?description__job-criteria-text[^>]*>([\s\S]*?)<\/span>/g
              );
              for (const m of criteriaMatches) {
                const label = htmlToPlainText(m[1]).toLowerCase();
                const val = htmlToPlainText(m[2]).replace(/\s+/g, ' ').trim();
                if (label.includes('seniority') && val) jobLevel = val;
                if (label.includes('employment type') && val) empType = val;
              }

              const detail = { description, jobLevel, employmentType: empType };
              if (linkedInDetailCache.size >= 250) {
                const firstKey = linkedInDetailCache.keys().next().value;
                if (firstKey) linkedInDetailCache.delete(firstKey);
              }
              linkedInDetailCache.set(jobId, { expiresAt: now + 30 * 60 * 1000, detail });
              return detail;
            }
          : undefined,
      });
    }
  }

  if (okPages === 0) {
    throw new Error('LinkedIn public job search did not respond');
  }
  return records;
}

async function fetchCustomCompanyBoardCandidates(
  companyName: string,
  roleQuery: string,
  signal?: AbortSignal
): Promise<RawPublicJobRecord[]> {
  const cleanTokens = normalizeCompanyTokens(companyName);
  const slugBase = (cleanTokens[0] || companyName)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!slugBase || slugBase.length < 2) return [];

  const titleCaseSlug = slugBase.charAt(0).toUpperCase() + slugBase.slice(1);
  const results: RawPublicJobRecord[] = [];

  const ghAlreadyCovered = CURATED_GREENHOUSE_BOARDS.some(
    (b) => b.slug === slugBase || b.company.toLowerCase() === companyName.trim().toLowerCase()
  );
  const srAlreadyCovered = CURATED_SMARTRECRUITERS_BOARDS.some(
    (b) => b.slug.toLowerCase() === slugBase || b.company.toLowerCase() === companyName.trim().toLowerCase()
  );
  const leverAlreadyCovered = CURATED_LEVER_BOARDS.some(
    (b) => b.slug.toLowerCase() === slugBase || b.company.toLowerCase() === companyName.trim().toLowerCase()
  );

  const probes: Promise<RawPublicJobRecord[]>[] = [];
  if (!ghAlreadyCovered) {
    probes.push(fetchGreenhouseBoard(slugBase, companyName.trim(), signal).catch(() => []));
  }
  if (!srAlreadyCovered) {
    probes.push(
      fetchSmartRecruitersBoard(titleCaseSlug, companyName.trim(), roleQuery, undefined, signal).catch(() => [])
    );
  }
  if (!leverAlreadyCovered) {
    probes.push(fetchLeverBoard(slugBase, companyName.trim(), signal).catch(() => []));
  }

  const settled = await Promise.all(probes);
  settled.forEach((arr) => results.push(...arr));
  return results;
}

export async function searchPublicJobsInBrowser(
  request: CompanyOpeningsSearchRequest,
  options?: { signal?: AbortSignal }
): Promise<CompanyOpeningsSearchResponse> {
  const signal = options?.signal;
  const nowUtc = new Date();
  const fetchedAt = nowUtc.toISOString();
  const requestedRole = request.role.trim();
  const requestedLocation = (request.location || 'India').trim() || 'India';
  const companyFilter = (request.companyName || '').trim();
  const useIndiaCountry = /\bindia\b/i.test(requestedLocation) || INDIAN_CITIES.some((c) => requestedLocation.toLowerCase().includes(c));
  const isServerRuntime = typeof window === 'undefined';

  const tasks: { source: string; promise: Promise<RawPublicJobRecordWithFreshness[]> }[] = [
    ...(isServerRuntime
      ? [
          {
            source: 'linkedin',
            promise: fetchLinkedInGuestJobs(
              requestedRole,
              requestedLocation,
              companyFilter,
              request.postingFreshness,
              request.employmentType,
              signal
            ),
          },
        ]
      : []),
    { source: 'himalayas', promise: fetchHimalayasJobs(signal) },
    { source: 'remotive', promise: fetchRemotiveJobs(requestedRole, signal) },
    { source: 'jobicy', promise: fetchJobicyJobs(requestedRole, signal) },
    { source: 'remoteok', promise: fetchRemoteOkJobs(signal) },
    { source: 'arbeitnow', promise: fetchArbeitnowJobs(signal) },
    {
      source: 'greenhouse',
      promise: (async () => {
        const boardsToQuery = companyFilter
          ? CURATED_GREENHOUSE_BOARDS.filter(
              (b) => verifyCompanyMatch(companyFilter, b.company)[1]
            )
          : CURATED_GREENHOUSE_BOARDS;

        const settled = await Promise.allSettled(
          boardsToQuery.map((b) => fetchGreenhouseBoard(b.slug, b.company, signal))
        );
        const out: RawPublicJobRecord[] = [];
        let okCount = 0;
        for (const res of settled) {
          if (res.status === 'fulfilled') {
            okCount++;
            out.push(...res.value);
          }
        }
        if (boardsToQuery.length > 0 && okCount === 0) {
          throw new Error('Greenhouse public feeds did not respond');
        }
        return out;
      })(),
    },
    {
      source: 'smartrecruiters',
      promise: (async () => {
        const boardsToQuery = companyFilter
          ? CURATED_SMARTRECRUITERS_BOARDS.filter(
              (b) => verifyCompanyMatch(companyFilter, b.company)[1]
            )
          : CURATED_SMARTRECRUITERS_BOARDS;

        const settled = await Promise.allSettled(
          boardsToQuery.map((b) =>
            fetchSmartRecruitersBoard(
              b.slug,
              b.company,
              requestedRole,
              useIndiaCountry ? b.countryCode : undefined,
              signal
            )
          )
        );
        const out: RawPublicJobRecord[] = [];
        let okCount = 0;
        for (const res of settled) {
          if (res.status === 'fulfilled') {
            okCount++;
            out.push(...res.value);
          }
        }
        if (boardsToQuery.length > 0 && okCount === 0) {
          throw new Error('SmartRecruiters public feeds did not respond');
        }
        return out;
      })(),
    },
    {
      source: 'lever',
      promise: (async () => {
        const boardsToQuery = companyFilter
          ? CURATED_LEVER_BOARDS.filter((b) => verifyCompanyMatch(companyFilter, b.company)[1])
          : CURATED_LEVER_BOARDS;

        const probes = boardsToQuery.map((b) => fetchLeverBoard(b.slug, b.company, signal));
        const customProbe = companyFilter
          ? [fetchCustomCompanyBoardCandidates(companyFilter, requestedRole, signal)]
          : [];

        const settled = await Promise.allSettled([...probes, ...customProbe]);
        const out: RawPublicJobRecord[] = [];
        let okCount = 0;
        for (const res of settled) {
          if (res.status === 'fulfilled') {
            okCount++;
            out.push(...res.value);
          }
        }
        if (boardsToQuery.length + customProbe.length > 0 && okCount === 0) {
          throw new Error('Lever public feeds did not respond');
        }
        return out;
      })(),
    },
  ];

  const settledTasks = await Promise.allSettled(tasks.map((t) => t.promise));
  if (signal?.aborted) {
    const abortErr = new Error('Aborted');
    abortErr.name = 'AbortError';
    throw abortErr;
  }

  const sourcesSucceeded: string[] = [];
  const sourceErrors: SourceErrorInfo[] = [];
  const allRawRecords: RawPublicJobRecordWithFreshness[] = [];

  settledTasks.forEach((result, idx) => {
    const srcName = tasks[idx].source;
    if (result.status === 'fulfilled') {
      sourcesSucceeded.push(srcName);
      allRawRecords.push(...result.value);
    } else {
      sourceErrors.push({
        source: srcName,
        code: 'fetch_error',
        message: `${srcName} public feed temporarily unavailable.`,
      });
    }
  });

  let rawFetched = 0;
  let excludedByTitleOrSeniority = 0;
  let excludedByCompany = 0;
  let excludedByFreshness = 0;
  let excludedByExperience = 0;

  const preQualified: {
    record: RawPublicJobRecordWithFreshness;
    companyStatus: CompanyMatchStatus;
    companyDisplay: string;
  }[] = [];

  for (const row of allRawRecords) {
    if (!row.title || (!row.jobUrl && !row.applyUrl)) continue;
    rawFetched++;

    if (
      !matchesTargetRoleTitle(
        requestedRole,
        row.title,
        request.employmentType,
        request.candidateExperience
      )
    ) {
      excludedByTitleOrSeniority++;
      continue;
    }

    const [matchStatus, companyOk] = verifyCompanyMatch(companyFilter, row.company);
    if (!companyOk) {
      excludedByCompany++;
      continue;
    }

    if (!matchesRequestedLocation(requestedLocation, row.location, row.isRemote)) {
      continue;
    }

    if (!matchesEmploymentFilter(request.employmentType, row.employmentType, row.title)) {
      continue;
    }

    const freshnessVal = row.freshnessHint || row.datePosted;
    if (!isWithinFreshnessWindow(freshnessVal, request.postingFreshness, nowUtc)) {
      excludedByFreshness++;
      continue;
    }

    preQualified.push({
      record: row,
      companyStatus: matchStatus === 'mismatch' ? 'cross_company' : matchStatus,
      companyDisplay: row.company || 'Company not specified',
    });
  }

  const needsDetailAts = preQualified
    .filter((item) => !item.record.description && item.record.loadDetail && item.record.source !== 'linkedin')
    .slice(0, 16);
  const needsDetailLi = preQualified
    .filter((item) => !item.record.description && item.record.loadDetail && item.record.source === 'linkedin')
    .slice(0, 12);

  await Promise.allSettled([
    ...needsDetailAts.map(async (item) => {
      if (!item.record.loadDetail) return;
      const det = await item.record.loadDetail(signal);
      if (det?.description) item.record.description = det.description;
      if (det?.applyUrl) item.record.applyUrl = det.applyUrl;
      if (det?.employmentType) item.record.employmentType = det.employmentType;
      if (det?.jobLevel) item.record.jobLevel = det.jobLevel;
    }),
    (async () => {
      for (let i = 0; i < needsDetailLi.length; i += 2) {
        if (signal?.aborted) break;
        const chunk = needsDetailLi.slice(i, i + 2);
        let hitRateLimit = false;
        await Promise.allSettled(
          chunk.map(async (item) => {
            if (!item.record.loadDetail) return;
            try {
              const det = await item.record.loadDetail(signal);
              if (det?.description) item.record.description = det.description;
              if (det?.applyUrl) item.record.applyUrl = det.applyUrl;
              if (det?.employmentType) item.record.employmentType = det.employmentType;
              if (det?.jobLevel) item.record.jobLevel = det.jobLevel;
            } catch (err: any) {
              if (err?.status === 429) hitRateLimit = true;
            }
          })
        );
        if (hitRateLimit) break;
      }
    })(),
  ]);

  const normalizedJobs: NormalizedJobOpening[] = [];
  const seenKeys = new Set<string>();

  for (const item of preQualified) {
    const { record: row, companyStatus, companyDisplay } = item;
    const empDisplay = normalizeEmploymentType(row.employmentType);

    const expEval = classifyExperience(
      request.candidateExperience,
      row.rawExperienceRange,
      row.jobLevel,
      row.description,
      empDisplay
    );

    if (
      request.candidateExperience !== 'any' &&
      expEval.matchStatus !== 'good_match' &&
      expEval.matchStatus !== 'not_specified'
    ) {
      excludedByExperience++;
      continue;
    }

    const normUrl = normalizeUrlForDedup(row.jobUrl || row.applyUrl);
    const dedupKey = normUrl
      ? `url:${normUrl}`
      : `comp:${row.source}|${row.title.toLowerCase()}|${companyDisplay.toLowerCase()}|${row.location.toLowerCase()}|${row.datePosted || ''}`;

    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);

    normalizedJobs.push({
      id: stableShortHash(dedupKey),
      title: row.title,
      company: companyDisplay,
      companyMatchStatus: companyStatus,
      location: row.location,
      jobUrl: row.jobUrl || row.applyUrl,
      applyUrl: row.applyUrl || row.jobUrl,
      source: row.source,
      datePosted: toIsoDateOnly(row.datePosted),
      employmentType: empDisplay,
      experienceRange: expEval.experienceRange,
      jobLevel: row.jobLevel || 'Not specified',
      experienceMatch: expEval.matchStatus,
      experienceMatchLabel: expEval.matchLabel,
      experienceReason: expEval.reason,
      description: row.description,
      descriptionPreview: makePreview(row.description),
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      salaryInterval: row.salaryInterval,
      salaryCurrency: row.salaryCurrency,
      salaryDisplay: formatSalaryDisplay(
        row.salaryMin,
        row.salaryMax,
        row.salaryInterval,
        row.salaryCurrency
      ),
      isRemote: row.isRemote,
      fetchedAt,
    });
  }

  normalizedJobs.sort((a, b) => {
    const da = a.datePosted ? Date.parse(a.datePosted) : 0;
    const db = b.datePosted ? Date.parse(b.datePosted) : 0;
    return db - da;
  });

  const maxTotal = Math.max(10, Math.min(60, (request.resultsPerSource || 10) * 4));
  const slicedJobs = normalizedJobs.slice(0, maxTotal);

  const filterSummary: FilterSummary = {
    rawFetched,
    excludedByTitleOrSeniority,
    excludedByCompany,
    excludedByFreshness,
    excludedByExperience,
    matchedCount: slicedJobs.length,
  };

  return {
    success: sourcesSucceeded.length > 0,
    jobs: slicedJobs,
    totalResults: slicedJobs.length,
    fetchedAt,
    cached: false,
    sourcesSucceeded,
    sourceErrors: sourcesSucceeded.length === 0 ? sourceErrors : [],
    warnings: [],
    filterSummary,
  };
}
