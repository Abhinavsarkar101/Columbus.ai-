import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  Search,
  ShieldAlert,
} from 'lucide-react';
import {
  CandidateExperienceLevel,
  CompanyOpeningsSearchResponse,
  EmploymentTypeFilter,
  ExperienceMatchStatus,
  FilterSummary,
  NormalizedJobOpening,
  PostingFreshnessFilter,
} from '../types/companyOpenings';
import {
  OpeningsApiError,
  resolveCompanyOpeningsEndpoint,
  searchCompanyOpenings,
} from '../lib/companyOpeningsApi';

interface JobSearchProps {
  onNavigateTab: (tab: string) => void;
}

interface SearchedCriteria {
  role: string;
  location: string;
  companyName: string;
  candidateExperience: CandidateExperienceLevel;
  postingFreshness: PostingFreshnessFilter;
}

const EXPERIENCE_OPTIONS: { value: CandidateExperienceLevel; label: string }[] = [
  { value: 'internship', label: 'Internship / No professional experience' },
  { value: 'fresher', label: 'Fresher / 0–1 years' },
  { value: '1_3', label: '1–3 years' },
  { value: '3_5', label: '3–5 years' },
  { value: '5_8', label: '5–8 years' },
  { value: '8_plus', label: '8+ years' },
  { value: 'any', label: 'Any experience' },
];

const EMPLOYMENT_OPTIONS: { value: EmploymentTypeFilter; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'fulltime', label: 'Full-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'parttime', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
];

const FRESHNESS_OPTIONS: { value: PostingFreshnessFilter; label: string }[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'any', label: 'Any available date' },
];

function getFreshnessLabel(val: PostingFreshnessFilter): string {
  return FRESHNESS_OPTIONS.find((opt) => opt.value === val)?.label || val;
}

function getExperienceLabel(val: CandidateExperienceLevel): string {
  return EXPERIENCE_OPTIONS.find((opt) => opt.value === val)?.label || val;
}

function getMatchBadgeClasses(status: ExperienceMatchStatus): string {
  switch (status) {
    case 'good_match':
      return 'bg-emerald-950/80 text-[#00DF89] border-emerald-800/70';
    case 'potential_match':
      return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
    case 'outside_range':
      return 'bg-rose-950/60 text-rose-300 border-rose-800/60';
    case 'needs_review':
      return 'bg-sky-950/60 text-sky-300 border-sky-800/60';
    case 'not_specified':
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

function formatSourceLabel(source: string): string {
  switch (source.toLowerCase()) {
    case 'indeed':
      return 'Indeed India';
    case 'naukri':
      return 'Naukri';
    case 'linkedin':
      return 'LinkedIn';
    case 'greenhouse':
      return 'Greenhouse ATS';
    case 'smartrecruiters':
      return 'SmartRecruiters';
    case 'lever':
      return 'Lever ATS';
    case 'remotive':
      return 'Remotive';
    case 'jobicy':
      return 'Jobicy';
    case 'remoteok':
      return 'RemoteOK';
    case 'arbeitnow':
      return 'Arbeitnow';
    default:
      return source;
  }
}

function formatFetchedTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function filterOpeningsByUnspecified(
  jobs: NormalizedJobOpening[],
  includeUnspecified: boolean
): NormalizedJobOpening[] {
  if (includeUnspecified) return jobs;
  return jobs.filter((job) => job.experienceMatch !== 'not_specified');
}

function buildFilterBreakdownText(summary?: FilterSummary): string | null {
  if (!summary || summary.rawFetched === 0) return null;
  const parts: string[] = [];
  if (summary.excludedByTitleOrSeniority > 0) {
    parts.push(`${summary.excludedByTitleOrSeniority} off-target or higher-seniority title(s)`);
  }
  if (summary.excludedByFreshness > 0) {
    parts.push(`${summary.excludedByFreshness} older post(s) outside your date window`);
  }
  if (summary.excludedByExperience > 0) {
    parts.push(`${summary.excludedByExperience} post(s) outside your experience level`);
  }
  if (summary.excludedByCompany > 0) {
    parts.push(`${summary.excludedByCompany} post(s) at other employers`);
  }
  if (parts.length === 0) return null;
  return `Checked ${summary.rawFetched} upstream listing(s) and filtered out ${parts.join(', ')}.`;
}

export const JobSearch: React.FC<JobSearchProps> = ({ onNavigateTab }) => {
  const [role, setRole] = useState<string>('');
  const [location, setLocation] = useState<string>('India');
  const [companyName, setCompanyName] = useState<string>('');
  const [candidateExperience, setCandidateExperience] = useState<CandidateExperienceLevel>('any');
  const [employmentType, setEmploymentType] = useState<EmploymentTypeFilter>('any');
  const [postingFreshness, setPostingFreshness] = useState<PostingFreshnessFilter>('7d');
  const [includeUnspecifiedExp, setIncludeUnspecifiedExp] = useState<boolean>(true);

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [coldStartNotice, setColdStartNotice] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<CompanyOpeningsSearchResponse | null>(null);
  const [searchedCriteria, setSearchedCriteria] = useState<SearchedCriteria | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setRequestError(null);

    const trimmedRole = role.trim();
    if (trimmedRole.length < 2) {
      setValidationError(
        'Please enter a target job role (at least 2 characters), e.g., Associate Product Manager.'
      );
      return;
    }

    const trimmedLocation = location.trim() || 'India';
    const trimmedCompany = companyName.trim();

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setColdStartNotice(false);

    try {
      const data = await searchCompanyOpenings(
        {
          role: trimmedRole,
          location: trimmedLocation,
          ...(trimmedCompany ? { companyName: trimmedCompany } : {}),
          candidateExperience,
          employmentType,
          postingFreshness,
          resultsPerSource: 10,
        },
        {
          signal: controller.signal,
          onColdStartHint: () => setColdStartNotice(true),
        }
      );

      if (controller.signal.aborted) return;

      setSearchResponse(data);
      setSearchedCriteria({
        role: trimmedRole,
        location: trimmedLocation,
        companyName: trimmedCompany,
        candidateExperience,
        postingFreshness,
      });
      setExpandedDescriptions({});
    } catch (err: any) {
      if (err?.name === 'AbortError' && controller.signal.aborted && !(err instanceof OpeningsApiError)) {
        return;
      }
      if (err instanceof OpeningsApiError) {
        setRequestError(err.message);
      } else {
        setRequestError('Failed to fetch live job openings. Please try again.');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsSearching(false);
        setColdStartNotice(false);
      }
    }
  };

  const toggleDescription = (jobId: string) => {
    setExpandedDescriptions((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const visibleJobs = searchResponse
    ? filterOpeningsByUnspecified(searchResponse.jobs, includeUnspecifiedExp)
    : [];

  const filterBreakdown = buildFilterBreakdownText(searchResponse?.filterSummary);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Briefcase className="w-6 h-6 text-[#00DF89]" />
              <span>Job Search</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Search live openings across Indeed India, Naukri, LinkedIn, and direct company ATS &amp; job boards, filtered strictly by target role, seniority, experience band, and posting freshness.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('match')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Job Match →
            </button>
          </div>
        </div>

        {/* Role-First Search Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="p-5 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4"
        >
          {/* Row 1: Target Job Role (First!), Location, Optional Company */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="job-search-role-input" className="text-[11px] font-semibold uppercase text-slate-400">
                Target Job Role <span className="text-rose-400">*</span>
              </label>
              <input
                id="job-search-role-input"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Associate Product Manager, Business Analyst"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00DF89]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="job-search-location-input" className="text-[11px] font-semibold uppercase text-slate-400">
                Location
              </label>
              <input
                id="job-search-location-input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="India, Bengaluru, Mumbai, Delhi NCR, Remote..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00DF89]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="job-search-company-input"
                className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1"
              >
                <Building2 className="w-3 h-3 text-slate-500" />
                <span>Company (Optional)</span>
              </label>
              <input
                id="job-search-company-input"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Leave blank for all companies"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00DF89]"
              />
            </div>
          </div>

          {/* Row 2: Experience, Employment Type, Freshness */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="job-search-exp-select" className="text-[11px] font-semibold uppercase text-slate-400">
                Candidate Experience
              </label>
              <select
                id="job-search-exp-select"
                value={candidateExperience}
                onChange={(e) => setCandidateExperience(e.target.value as CandidateExperienceLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00DF89]"
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="job-search-type-select" className="text-[11px] font-semibold uppercase text-slate-400">
                Employment Type
              </label>
              <select
                id="job-search-type-select"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentTypeFilter)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00DF89]"
              >
                {EMPLOYMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="job-search-freshness-select"
                className="text-[11px] font-semibold uppercase text-slate-400"
              >
                Posting Freshness
              </label>
              <select
                id="job-search-freshness-select"
                value={postingFreshness}
                onChange={(e) => setPostingFreshness(e.target.value as PostingFreshnessFilter)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00DF89]"
              >
                {FRESHNESS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle + Submit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeUnspecifiedExp}
                onChange={(e) => setIncludeUnspecifiedExp(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 accent-[#00DF89]"
              />
              <span>Include jobs with unspecified experience requirements</span>
            </label>

            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-[#00DF89] hover:bg-[#00c97b] disabled:opacity-60 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching Live Sources...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Live Jobs</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Strict deterministic matching hides unrelated/higher-seniority titles (such as Tech Lead or Senior levels when not requested), older dates outside your freshness window, and roles requiring more experience than selected.
            </span>
          </p>
        </form>

        {/* Validation / Request Error States */}
        {validationError && (
          <div className="p-3.5 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {isSearching && coldStartNotice && (
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2">
            <Clock className="w-4 h-4 text-[#00DF89] shrink-0 mt-0.5 animate-pulse" />
            <span>
              Waking up the search service and querying job boards. Free-tier instances can take up to ~60 seconds on a cold start after inactivity.
            </span>
          </div>
        )}

        {requestError && (
          <div className="p-4 bg-rose-950/25 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{requestError}</span>
          </div>
        )}

        {/* Results Section */}
        {searchResponse && !isSearching && (
          <div className="space-y-3.5">
            {/* Metadata & Retrieval Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">
                  {visibleJobs.length} {visibleJobs.length === 1 ? 'opening' : 'openings'} shown
                </span>
                {visibleJobs.length !== searchResponse.totalResults && (
                  <span className="text-slate-500">
                    ({searchResponse.totalResults - visibleJobs.length} hidden with unspecified experience)
                  </span>
                )}
                {searchedCriteria?.companyName && (
                  <span className="text-slate-500">· Filtered by company: {searchedCriteria.companyName}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                <span>Retrieved: {formatFetchedTime(searchResponse.fetchedAt)}</span>
                {searchResponse.cached && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Short-lived cache</span>
                )}
              </div>
            </div>

            {filterBreakdown && visibleJobs.length > 0 && (
              <div className="px-3.5 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                {filterBreakdown}
              </div>
            )}

            {/* Warnings / Source Errors */}
            {searchResponse.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="p-3 bg-amber-950/25 border border-amber-800/50 rounded-xl text-xs text-amber-300 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}

            {searchResponse.sourceErrors.length > 0 && (
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-amber-400">
                  Source Status ({searchResponse.sourcesSucceeded.length} succeeded, {searchResponse.sourceErrors.length} unavailable)
                </div>
                {searchResponse.sourceErrors.map((err, idx) => (
                  <div key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* All sources unavailable */}
            {!searchResponse.success && searchResponse.sourcesSucceeded.length === 0 && (
              <div className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl text-xs text-rose-200 space-y-1">
                <div className="font-bold">All job-board sources are currently unavailable</div>
                <p className="text-rose-300/90">
                  Upstream job boards temporarily blocked or timed out on this request. No jobs were fabricated—please retry shortly or refine your search filters.
                </p>
              </div>
            )}

            {/* Succeeded but 0 matching jobs */}
            {searchResponse.sourcesSucceeded.length > 0 && visibleJobs.length === 0 && searchedCriteria && (
              <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2">
                {searchResponse.totalResults > 0 && !includeUnspecifiedExp ? (
                  <>
                    <div className="font-bold text-white text-sm">
                      All matched openings had unspecified experience requirements
                    </div>
                    <p className="text-slate-400">
                      Found {searchResponse.totalResults} recent &ldquo;{searchedCriteria.role}&rdquo; posting(s), but none stated numeric years of experience. Enable &ldquo;Include jobs with unspecified experience requirements&rdquo; above to view them.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-white text-sm">
                      {searchedCriteria.postingFreshness !== 'any'
                        ? `No latest posts found for "${searchedCriteria.role}" within ${getFreshnessLabel(
                            searchedCriteria.postingFreshness
                          )}`
                        : `No matching openings found for "${searchedCriteria.role}"`}
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {searchResponse.filterSummary && searchResponse.filterSummary.rawFetched === 0
                        ? `The live job boards had no postings for "${searchedCriteria.role}"${
                            searchedCriteria.companyName ? ` at ${searchedCriteria.companyName}` : ''
                          } in ${searchedCriteria.location} for ${getFreshnessLabel(
                            searchedCriteria.postingFreshness
                          )}.`
                        : `There are currently no qualifying "${searchedCriteria.role}" openings in ${
                            searchedCriteria.location
                          }${
                            searchedCriteria.companyName ? ` at ${searchedCriteria.companyName}` : ''
                          } matching ${getExperienceLabel(
                            searchedCriteria.candidateExperience
                          )} and ${getFreshnessLabel(searchedCriteria.postingFreshness)}.`}
                    </p>
                    {filterBreakdown && (
                      <p className="text-slate-400">{filterBreakdown}</p>
                    )}
                    <p className="text-slate-500 pt-1">
                      Tip: Try expanding Posting Freshness (e.g., to Last 3 days or Last 7 days), broadening your location to &ldquo;India&rdquo;, or clearing the optional Company filter.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Job Cards */}
            <div className="space-y-3">
              {visibleJobs.map((job) => {
                const isExpanded = !!expandedDescriptions[job.id];
                const hasFullDescription =
                  job.description && job.description.length > job.descriptionPreview.length;

                return (
                  <div
                    key={job.id}
                    className="p-4 sm:p-5 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-bold text-white leading-snug">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span className="font-semibold">{job.company}</span>
                          {job.companyMatchStatus === 'unverified' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                              Unverified company match
                            </span>
                          )}
                          <span className="text-slate-600">•</span>
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3" />
                            <span>{job.location}</span>
                          </span>
                          {job.isRemote && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                              Remote
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-950 border border-slate-700 text-slate-300">
                          {formatSourceLabel(job.source)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getMatchBadgeClasses(
                            job.experienceMatch
                          )}`}
                        >
                          {job.experienceMatchLabel}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
                      <div>
                        <span className="text-slate-500 block">Employment Type</span>
                        <span className="text-slate-200 font-medium capitalize">{job.employmentType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Posted Experience</span>
                        <span className="text-slate-200 font-medium">{job.experienceRange}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Salary</span>
                        <span className="text-slate-200 font-medium">{job.salaryDisplay}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Date Posted</span>
                        <span className="text-slate-200 font-medium inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{job.datePosted || 'Date not provided'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Deterministic Experience Explanation */}
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500 font-semibold">Experience check:</span> {job.experienceReason}
                    </div>

                    {/* Description Preview + Expand */}
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {isExpanded && job.description ? job.description : job.descriptionPreview}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {hasFullDescription ? (
                        <button
                          type="button"
                          onClick={() => toggleDescription(job.id)}
                          className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Collapse Description</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Expand Description</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span />
                      )}

                      <a
                        href={job.applyUrl || job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-[#00DF89]/10 hover:bg-[#00DF89]/20 border border-[#00DF89]/40 text-[#00DF89] font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>View Job / Apply</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
