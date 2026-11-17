import {
  CompanyOpeningsSearchRequest,
  CompanyOpeningsSearchResponse,
} from '../types/companyOpenings';

const SEARCH_PATH = '/api/company-interview/openings/search';
const REQUEST_TIMEOUT_MS = 65000; // Accounts for Render Free cold start (~50-60s)
const COLD_START_HINT_DELAY_MS = 4500;

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
    lowerHost.endsWith('.run.app');

  if (isLocalOrPreview) {
    return SEARCH_PATH;
  }

  // Static hosts like github.io cannot serve Express/Python routes without VITE_COMPANY_OPENINGS_API_URL
  return null;
}

export async function searchCompanyOpenings(
  payload: CompanyOpeningsSearchRequest,
  options?: {
    signal?: AbortSignal;
    onColdStartHint?: () => void;
    endpointOverride?: string | null;
  }
): Promise<CompanyOpeningsSearchResponse> {
  const endpoint =
    options && 'endpointOverride' in options
      ? options.endpointOverride
      : resolveCompanyOpeningsEndpoint();

  if (!endpoint) {
    throw new OpeningsApiError(
      'Live job search backend URL (VITE_COMPANY_OPENINGS_API_URL) is not configured for this static deployment yet.',
      'missing_config'
    );
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

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      throw new OpeningsApiError(
        errBody?.error || `Job search service returned HTTP ${response.status}.`,
        'server_error'
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new OpeningsApiError(
        'Job search service returned an unexpected non-JSON response. Please check VITE_COMPANY_OPENINGS_API_URL.',
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
        throw new OpeningsApiError(
          'The search request timed out. If the backend is hosted on Render Free, it may still be waking up from sleep—please retry in a few seconds.',
          'timeout'
        );
      }
      throw err;
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
