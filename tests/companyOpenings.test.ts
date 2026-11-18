import { resolveCompanyOpeningsEndpoint, searchCompanyOpenings, OpeningsApiError } from '../src/lib/companyOpeningsApi';
import {
  classifyExperience,
  isWithinFreshnessWindow,
  matchesRequestedLocation,
  matchesTargetRoleTitle,
} from '../src/lib/clientJobSearch';
import { filterOpeningsByUnspecified } from '../src/pages/JobSearch';
import { COMPANIES } from '../src/data/companies';
import { NormalizedJobOpening } from '../src/types/companyOpenings';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTests() {
  console.log('--- RUNNING FRONTEND JOB SEARCH TESTS ---');

  // 1. Endpoint resolution for Render full-stack deployment vs local dev vs custom URL
  assert(
    resolveCompanyOpeningsEndpoint('', 'compass-ai.onrender.com') === '/api/company-interview/openings/search',
    'Full-stack Render deployment should resolve to Express /api route'
  );
  assert(
    resolveCompanyOpeningsEndpoint('https://compass-jobs.onrender.com/', 'compass-ai.onrender.com') ===
      'https://compass-jobs.onrender.com/api/company-interview/openings/search',
    'Configured API URL should resolve cleanly without double slashes'
  );
  assert(
    resolveCompanyOpeningsEndpoint('', 'localhost') === '/api/company-interview/openings/search',
    'Localhost dev should fall back to local proxy endpoint'
  );
  console.log('✅ Endpoint resolution passed');

  // 2. Explicit opt-out missing_config guard when fallbackToPublicFeeds is false
  let caughtMissingConfig = false;
  try {
    await searchCompanyOpenings(
      {
        role: 'Associate Product Manager',
        location: 'India',
        candidateExperience: '1_3',
        employmentType: 'fulltime',
        postingFreshness: '24h',
        resultsPerSource: 10,
      },
      { endpointOverride: null, fallbackToPublicFeeds: false }
    );
  } catch (err: any) {
    caughtMissingConfig = err instanceof OpeningsApiError && err.code === 'missing_config';
  }
  assert(caughtMissingConfig, 'Opting out of public fallback should throw OpeningsApiError(missing_config)');
  console.log('✅ Explicit missing_config guard passed');

  // 3. Strict deterministic filtering parity (Title/Seniority, Location, Freshness, Experience)
  assert(
    matchesTargetRoleTitle('Associate Product Manager', 'Associate Product Manager - Growth', 'any', 'fresher') &&
      matchesTargetRoleTitle('Associate Product Manager', 'APM - Fintech', 'any', 'fresher') &&
      !matchesTargetRoleTitle('Associate Product Manager', 'Tech Lead', 'any', 'fresher') &&
      !matchesTargetRoleTitle('Associate Product Manager', 'Senior Product Manager', 'any', 'fresher') &&
      !matchesTargetRoleTitle('Associate Product Manager', 'Product Manager', 'any', 'fresher') &&
      !matchesTargetRoleTitle('Business Analyst', 'Tech Lead - Data', 'any', '1_3'),
    'Generic role & seniority filter must block Tech Lead / Senior / unrequested titles for any role'
  );

  assert(
    matchesRequestedLocation('India', 'Bengaluru, India', false) &&
      !matchesRequestedLocation('Bengaluru', 'US-Remote', true) &&
      !matchesRequestedLocation('Bengaluru', 'Remote - Singapore', true),
    'Location filter must exclude US/EU/APAC-locked postings when searching India/Bengaluru'
  );

  const refNow = new Date('2026-11-17T10:00:00Z');
  assert(
    isWithinFreshnessWindow('2026-11-17T02:00:00Z', '24h', refNow) &&
      !isWithinFreshnessWindow('2026-11-15T02:00:00Z', '24h', refNow),
    '24h freshness filter must block older postings'
  );

  assert(
    classifyExperience('fresher', undefined, undefined, 'Looking for 0-1 years of experience.').matchStatus === 'good_match' &&
      classifyExperience('fresher', undefined, undefined, '5 years of product management experience required.').matchStatus === 'outside_range' &&
      classifyExperience('fresher', undefined, undefined, 'Minimum of 3 years building B2B SaaS products.').matchStatus === 'outside_range' &&
      classifyExperience('1_3', undefined, undefined, 'Extensive experience in enterprise sales.').matchStatus === 'needs_review',
    'Experience classifier must reject higher multi-word and minimum-of experience statements cleanly'
  );
  console.log('✅ Strict title/seniority, location, freshness, and experience rules passed');

  // 4. Unspecified experience toggle filtering
  const sampleJobs: NormalizedJobOpening[] = [
    {
      id: '1',
      title: 'Associate Product Manager',
      company: 'Swiggy',
      companyMatchStatus: 'cross_company',
      location: 'Bengaluru',
      jobUrl: 'https://example.com/1',
      applyUrl: 'https://example.com/1',
      source: 'smartrecruiters',
      datePosted: '2026-11-16',
      employmentType: 'fulltime',
      experienceRange: '1–3 years',
      jobLevel: 'Entry',
      experienceMatch: 'good_match',
      experienceMatchLabel: 'Good experience match',
      experienceReason: 'Matches 1-3 years',
      description: '1-3 years experience required',
      descriptionPreview: '1-3 years experience required',
      salaryMin: null,
      salaryMax: null,
      salaryInterval: null,
      salaryCurrency: null,
      salaryDisplay: 'Not disclosed',
      isRemote: false,
      fetchedAt: '2026-11-17T00:00:00Z',
    },
    {
      id: '2',
      title: 'Associate Product Manager',
      company: 'Razorpay',
      companyMatchStatus: 'cross_company',
      location: 'India',
      jobUrl: 'https://example.com/2',
      applyUrl: 'https://example.com/2',
      source: 'greenhouse',
      datePosted: '2026-11-16',
      employmentType: 'fulltime',
      experienceRange: 'Not specified',
      jobLevel: 'Not specified',
      experienceMatch: 'not_specified',
      experienceMatchLabel: 'Experience not specified',
      experienceReason: 'No explicit experience requirement found',
      description: '',
      descriptionPreview: 'Full job description is available on the source job posting.',
      salaryMin: null,
      salaryMax: null,
      salaryInterval: null,
      salaryCurrency: null,
      salaryDisplay: 'Not disclosed',
      isRemote: null,
      fetchedAt: '2026-11-17T00:00:00Z',
    },
  ];

  assert(
    filterOpeningsByUnspecified(sampleJobs, true).length === 2,
    'Default includeUnspecified=true should keep unspecified jobs'
  );
  assert(
    filterOpeningsByUnspecified(sampleJobs, false).length === 1,
    'Disabling includeUnspecified should hide not_specified jobs'
  );
  console.log('✅ Experience filter toggle passed');

  // 5. Existing COMPANIES data integrity preserved
  assert(COMPANIES.length >= 12, 'All existing companies preserved');
  assert(
    COMPANIES.every((c) => c.name && c.typicalRounds.length > 0 && c.insiderTips.length > 0 && c.commonPitfalls.length > 0),
    'All existing dossier fields intact'
  );
  console.log('✅ Existing Company Interview Prep dataset preserved');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
