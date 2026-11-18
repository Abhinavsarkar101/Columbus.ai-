import {
  CompanyOpeningsSearchRequest,
  CompanyOpeningsSearchResponse,
} from '../types/companyOpenings';
import { searchPublicJobsInBrowser } from './clientJobSearch';

const SEARCH_PATH = '/api/company-interview/openings/search';
const REQUEST_TIMEOUT_MS = 65000; // Accounts for Render Free cold start (~50-60s)
const COLD_START_HINT_DELAY_MS = 4500;
const CLIENT_CACHE_TTL_MS = 60000;

const clientSearchCache = new Map<
  string,
  { expiresAt: number; data: CompanyOpeningsSearchResponse }
>();

export class OpeningsApiError extends Error {
  code: 'missing_config' | 'timeout' | 'rate_limited' | 'network' | 'validation' | 'server_error';

  constructor(
    message: string,
    code: 'missing_config' | 'timeout' | 'rate_limited' | 'network' | 'validation' | 'server_error'
  ) {
    super(message);
    this.name = 'OpeningsApiError';
    this.code = code;
  }
}

export function resolveCompanyOpeningsEndpoint(
  configuredBaseUrl = import.meta.env.VITE_COMPANY_OPENINGS_API_URL || '',
  hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
): string | null {
  const cleaned = String(configuredBaseUrl).trim().replace(/\/+$/, '');
  if (cleaned) {
    return `${cleaned}${SEARCH_PATH}`;
  }

  const lowerHost = hostname.toLowerCase();
  const isLocalOrPreview =
    lowerHost === 'localhost' ||
    lowerHost === '127.0.0.1' ||
    lowerHost.endsWith('.run.app') ||
    lowerHost.includes('onrender.com') ||
    lowerHost.includes('github.io');

  // Full-stack Node Express server or local dev always serves /api/company-interview/openings/search
  return SEARCH_PATH;
}

function buildCacheKey(endpoint: string | null, payload: CompanyOpeningsSearchRequest): string {
  return JSON.stringify({
    endpoint: endpoint || 'direct-browser',
    role: payload.role.trim().toLowerCase(),
    location: payload.location.trim().toLowerCase(),
    companyName: (payload.companyName || '').trim().toLowerCase(),
    candidateExperience: payload.candidateExperience,
    employmentType: payload.employmentType,
    postingFreshness: payload.postingFreshness,
    resultsPerSource: payload.resultsPerSource,
  });
}

async function runDirectBrowserSearch(
  payload: CompanyOpeningsSearchRequest,
  signal?: AbortSignal,
  fallbackNotice?: string
): Promise<CompanyOpeningsSearchResponse> {
  const cacheKey = buildCacheKey(null, payload);
  const now = Date.now();
  const cached = clientSearchCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return {
      ...cached.data,
      cached: true,
      warnings: fallbackNotice ? [fallbackNotice, ...cached.data.warnings] : cached.data.warnings,
    };
  }

  const data = await searchPublicJobsInBrowser(payload, { signal });
  if (data.success) {
    clientSearchCache.set(cacheKey, {
      expiresAt: now + CLIENT_CACHE_TTL_MS,
      data,
    });
  }

  return fallbackNotice
    ? { ...data, warnings: [fallbackNotice, ...data.warnings] }
    : data;
}

export async function searchCompanyOpenings(
  payload: CompanyOpeningsSearchRequest,
  options?: {
    signal?: AbortSignal;
    onColdStartHint?: () => void;
    endpointOverride?: string | null;
    fallbackToPublicFeeds?: boolean;
  }
): Promise<CompanyOpeningsSearchResponse> {
  const endpoint =
    options && 'endpointOverride' in options
      ? options.endpointOverride
      : resolveCompanyOpeningsEndpoint();

  const allowPublicFallback = options?.fallbackToPublicFeeds !== false;

  if (!endpoint) {
    if (!allowPublicFallback) {
      throw new OpeningsApiError(
        'Live job search backend URL (VITE_COMPANY_OPENINGS_API_URL) is not configured for this static deployment yet.',
        'missing_config'
      );
    }
    return runDirectBrowserSearch(payload, options?.signal);
  }

  const controller = new AbortController();
  const externalSignal = options?.signal;

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const coldStartId = setTimeout(() => {
    options?.onColdStartHint?.();
  }, COLD_START_HINT_DELAY_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new OpeningsApiError(
        'Search service is temporarily rate-limited. Please wait a moment and try again.',
        'rate_limited'
      );
    }

    if (response.status === 400 || response.status === 422) {
      const errBody = await response.json().catch(() => null);
      const detail = errBody?.detail?.[0]?.msg || errBody?.detail || errBody?.error;
      throw new OpeningsApiError(
        detail || 'Invalid search criteria. Please check your target job role and location inputs.',
        'validation'
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      if (allowPublicFallback && (response.status >= 500 || response.status === 404 || response.status === 503 || !contentType.includes('application/json'))) {
        return await runDirectBrowserSearch(
          payload,
          externalSignal,
          'Connected via live direct company ATS & public job boards.'
        );
      }
      const errBody = await response.json().catch(() => null);
      throw new OpeningsApiError(
        errBody?.error || `Job search service returned HTTP ${response.status}.`,
        'server_error'
      );
    }

    const data = (await response.json()) as CompanyOpeningsSearchResponse;
    return data;
  } catch (err: any) {
    if (err instanceof OpeningsApiError) {
      throw err;
    }
    if (err?.name === 'AbortError') {
      if (timedOut) {
        if (allowPublicFallback) {
          return await runDirectBrowserSearch(
            payload,
            externalSignal,
            'Primary backend timed out; switched seamlessly to live direct company ATS & public job boards.'
          );
        }
        throw new OpeningsApiError(
          'The search request timed out. If the backend is hosted on Render Free, it may still be waking up from sleep—please retry in a few seconds.',
          'timeout'
        );
      }
      throw err;
    }
    if (allowPublicFallback) {
      return await runDirectBrowserSearch(
        payload,
        externalSignal,
        'Connected via live direct company ATS & public job boards.'
      );
    }
    throw new OpeningsApiError(
      'Unable to reach the job search service right now. Please verify the backend service is running or try again shortly.',
      'network'
    );
  } finally {
    clearTimeout(timeoutId);
    clearTimeout(coldStartId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}
