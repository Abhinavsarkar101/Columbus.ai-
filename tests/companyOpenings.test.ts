import { resolveCompanyOpeningsEndpoint, searchCompanyOpenings, OpeningsApiError } from '../src/lib/companyOpeningsApi';
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

  // 1. Endpoint resolution for GitHub Pages vs local dev vs configured VITE_COMPANY_OPENINGS_API_URL
  assert(
    resolveCompanyOpeningsEndpoint('', 'abhinavsarkar101.github.io') === null,
    'Static GitHub Pages host without VITE_COMPANY_OPENINGS_API_URL must return null'
  );
  assert(
    resolveCompanyOpeningsEndpoint('https://compass-jobs.onrender.com/', 'abhinavsarkar101.github.io') ===
      'https://compass-jobs.onrender.com/api/company-interview/openings/search',
    'Configured API URL should resolve cleanly without double slashes'
  );
  assert(
    resolveCompanyOpeningsEndpoint('', 'localhost') === '/api/company-interview/openings/search',
    'Localhost dev should fall back to local proxy endpoint'
  );
  console.log('✅ Endpoint resolution passed');

  // 2. Missing config error handling on static deployment (works without companyName!)
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
      { endpointOverride: null }
    );
  } catch (err: any) {
    caughtMissingConfig = err instanceof OpeningsApiError && err.code === 'missing_config';
  }
  assert(caughtMissingConfig, 'Missing endpointOverride should throw OpeningsApiError(missing_config)');
  console.log('✅ Missing config handling passed');

  // 3. Unspecified experience toggle filtering
  const sampleJobs: NormalizedJobOpening[] = [
    {
      id: '1',
      title: 'Associate Product Manager',
      company: 'Swiggy',
      companyMatchStatus: 'cross_company',
      location: 'Bengaluru',
      jobUrl: 'https://example.com/1',
      applyUrl: 'https://example.com/1',
      source: 'indeed',
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
      source: 'linkedin',
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

  // 4. Existing COMPANIES data integrity preserved
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
