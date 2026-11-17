export type CandidateExperienceLevel =
  | 'internship'
  | 'fresher'
  | '1_3'
  | '3_5'
  | '5_8'
  | '8_plus'
  | 'any';

export type EmploymentTypeFilter =
  | 'fulltime'
  | 'internship'
  | 'parttime'
  | 'contract'
  | 'any';

export type PostingFreshnessFilter = '24h' | '3d' | '7d' | '30d' | 'any';

export type ExperienceMatchStatus =
  | 'good_match'
  | 'potential_match'
  | 'outside_range'
  | 'not_specified'
  | 'needs_review';

export type CompanyMatchStatus = 'confirmed' | 'unverified' | 'cross_company';

export interface CompanyOpeningsSearchRequest {
  role: string;
  location: string;
  companyName?: string;
  candidateExperience: CandidateExperienceLevel;
  employmentType: EmploymentTypeFilter;
  postingFreshness: PostingFreshnessFilter;
  resultsPerSource: number;
}

export interface NormalizedJobOpening {
  id: string;
  title: string;
  company: string;
  companyMatchStatus: CompanyMatchStatus;
  location: string;
  jobUrl: string;
  applyUrl: string;
  source: string;
  datePosted: string | null;
  employmentType: string;
  experienceRange: string;
  jobLevel: string;
  experienceMatch: ExperienceMatchStatus;
  experienceMatchLabel: string;
  experienceReason: string;
  description: string;
  descriptionPreview: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryInterval: string | null;
  salaryCurrency: string | null;
  salaryDisplay: string;
  isRemote: boolean | null;
  fetchedAt: string;
}

export interface SourceErrorInfo {
  source: string;
  code: string;
  message: string;
}

export interface FilterSummary {
  rawFetched: number;
  excludedByTitleOrSeniority: number;
  excludedByCompany: number;
  excludedByFreshness: number;
  excludedByExperience: number;
  matchedCount: number;
}

export interface CompanyOpeningsSearchResponse {
  success: boolean;
  jobs: NormalizedJobOpening[];
  totalResults: number;
  fetchedAt: string;
  cached?: boolean;
  sourcesSucceeded: string[];
  sourceErrors: SourceErrorInfo[];
  warnings: string[];
  filterSummary?: FilterSummary;
}
