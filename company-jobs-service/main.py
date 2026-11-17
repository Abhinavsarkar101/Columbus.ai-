from __future__ import annotations

import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Literal, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from normalizer import build_company_search_token, normalize_job_records

try:
    from jobspy import scrape_jobs
except Exception as import_err:  # pragma: no cover
    scrape_jobs = None
    _JOBSPY_IMPORT_ERROR = str(import_err)
else:
    _JOBSPY_IMPORT_ERROR = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("company-jobs-service")

ENABLED_SOURCES = ["indeed", "naukri", "linkedin"]
PER_SOURCE_TIMEOUT_SECONDS = int(os.getenv("PER_SOURCE_TIMEOUT_SECONDS", "22"))
CACHE_TTL_SECONDS = int(os.getenv("SEARCH_CACHE_TTL_SECONDS", "120"))
MAX_CACHE_ENTRIES = 64

FRESHNESS_TO_HOURS: dict[str, Optional[int]] = {
    "24h": 24,
    "3d": 72,
    "7d": 168,
    "30d": 720,
    "any": None,
}

DEFAULT_ALLOWED_ORIGINS = [
    "https://abhinavsarkar101.github.io",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def _get_allowed_origins() -> list[str]:
    origins = list(DEFAULT_ALLOWED_ORIGINS)
    extra = os.getenv("ALLOWED_ORIGINS", "")
    for item in extra.split(","):
        cleaned = item.strip().rstrip("/")
        if cleaned and cleaned not in origins:
            origins.append(cleaned)
    return origins


class SearchOpeningsRequest(BaseModel):
    role: str = Field(..., min_length=2, max_length=120)
    location: str = Field(default="India", max_length=120)
    companyName: Optional[str] = Field(default=None, max_length=120)
    candidateExperience: Literal[
        "internship",
        "fresher",
        "1_3",
        "3_5",
        "5_8",
        "8_plus",
        "any",
    ] = "any"
    employmentType: Literal["fulltime", "internship", "parttime", "contract", "any"] = "any"
    postingFreshness: Literal["24h", "3d", "7d", "30d", "any"] = "7d"
    resultsPerSource: int = Field(default=10, ge=1, le=15)

    @field_validator("companyName", "role", "location", mode="before")
    @classmethod
    def strip_text(cls, v: Any) -> str:
        if v is None:
            return ""
        return str(v).strip()

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if len(v) < 2:
            raise ValueError("Please enter a target job role (at least 2 characters).")
        return v


class SourceErrorItem(BaseModel):
    source: str
    code: str
    message: str


class FilterSummary(BaseModel):
    rawFetched: int = 0
    excludedByTitleOrSeniority: int = 0
    excludedByCompany: int = 0
    excludedByFreshness: int = 0
    excludedByExperience: int = 0
    matchedCount: int = 0


class SearchOpeningsResponse(BaseModel):
    success: bool
    jobs: list[dict[str, Any]]
    totalResults: int
    fetchedAt: str
    cached: bool = False
    sourcesSucceeded: list[str]
    sourceErrors: list[SourceErrorItem]
    warnings: list[str]
    filterSummary: FilterSummary = Field(default_factory=FilterSummary)


_cache_lock = Lock()
_search_cache: dict[tuple[Any, ...], tuple[float, dict[str, Any]]] = {}


def _classify_source_error(source: str, exc: Exception) -> SourceErrorItem:
    msg = str(exc)
    lower = msg.lower()
    if "429" in lower or "too many requests" in lower or "rate limit" in lower:
        return SourceErrorItem(
            source=source,
            code="rate_limited",
            message=f"{source.title()} temporarily rate-limited automated requests (HTTP 429).",
        )
    if "403" in lower or "forbidden" in lower or "captcha" in lower or "blocked" in lower:
        return SourceErrorItem(
            source=source,
            code="blocked",
            message=f"{source.title()} blocked this automated query without authentication.",
        )
    if "timeout" in lower or "timed out" in lower:
        return SourceErrorItem(
            source=source,
            code="timeout",
            message=f"{source.title()} took too long to respond and timed out.",
        )
    return SourceErrorItem(
        source=source,
        code="source_error",
        message=f"{source.title()} returned an error while fetching openings.",
    )


def _build_scrape_kwargs(source: str, req: SearchOpeningsRequest) -> dict[str, Any]:
    location_clean = req.location.strip() or "India"
    is_remote_query = location_clean.lower() == "remote"

    company_clean = (req.companyName or "").strip()
    if company_clean:
        company_token = build_company_search_token(company_clean)
        search_term = f"{req.role} {company_token}".strip()
    else:
        search_term = req.role

    # Naukri expects an Indian city or "India" for location parameter
    effective_location = "India" if (source == "naukri" and is_remote_query) else location_clean

    kwargs: dict[str, Any] = {
        "site_name": [source],
        "search_term": search_term,
        "location": effective_location,
        "results_wanted": req.resultsPerSource,
        "verbose": 0,
    }

    if is_remote_query:
        kwargs["is_remote"] = True

    if source == "indeed":
        kwargs["country_indeed"] = "India"

    hours_old = FRESHNESS_TO_HOURS.get(req.postingFreshness)
    if hours_old is not None:
        kwargs["hours_old"] = hours_old

    if req.employmentType != "any":
        kwargs["job_type"] = req.employmentType

    # Keep LinkedIn on summary scrape to avoid per-job HTTP bursts and 429 rate-limits
    if source == "indeed":
        kwargs["fetch_description"] = True

    return kwargs


def _scrape_single_source(
    source: str, req: SearchOpeningsRequest
) -> tuple[str, list[dict[str, Any]], Optional[SourceErrorItem]]:
    if scrape_jobs is None:
        return (
            source,
            [],
            SourceErrorItem(
                source=source,
                code="dependency_missing",
                message=f"JobSpy library is unavailable: {_JOBSPY_IMPORT_ERROR}",
            ),
        )

    kwargs = _build_scrape_kwargs(source, req)
    try:
        df = scrape_jobs(**kwargs)
        if df is None or df.empty:
            return (source, [], None)
        records = df.to_dict(orient="records")
        return (source, records, None)
    except Exception as exc:
        logger.warning("JobSpy scrape error on source=%s: %s", source, exc)
        return (source, [], _classify_source_error(source, exc))


def execute_openings_search(req: SearchOpeningsRequest) -> SearchOpeningsResponse:
    company_clean = (req.companyName or "").strip()
    cache_key = (
        "v2_strict",
        company_clean.lower(),
        req.role.lower(),
        (req.location or "India").lower(),
        req.candidateExperience,
        req.employmentType,
        req.postingFreshness,
        req.resultsPerSource,
    )

    now_mono = time.monotonic()
    with _cache_lock:
        cached_entry = _search_cache.get(cache_key)
        if cached_entry and (now_mono - cached_entry[0]) <= CACHE_TTL_SECONDS:
            payload = dict(cached_entry[1])
            payload["cached"] = True
            return SearchOpeningsResponse(**payload)

    now_utc = datetime.now(timezone.utc)
    fetched_at = now_utc.isoformat()
    raw_rows: list[dict[str, Any]] = []
    sources_succeeded: list[str] = []
    source_errors: list[SourceErrorItem] = []
    warnings: list[str] = []

    executor = ThreadPoolExecutor(max_workers=len(ENABLED_SOURCES))
    future_map = {
        executor.submit(_scrape_single_source, source, req): source
        for source in ENABLED_SOURCES
    }

    try:
        for future, source in future_map.items():
            try:
                src_name, rows, err = future.result(timeout=PER_SOURCE_TIMEOUT_SECONDS)
                if err is not None:
                    source_errors.append(err)
                else:
                    sources_succeeded.append(src_name)
                    raw_rows.extend(rows)
            except FuturesTimeout:
                future.cancel()
                source_errors.append(
                    SourceErrorItem(
                        source=source,
                        code="timeout",
                        message=f"{source.title()} exceeded the {PER_SOURCE_TIMEOUT_SECONDS}s request timeout.",
                    )
                )
            except Exception as exc:
                source_errors.append(_classify_source_error(source, exc))
    finally:
        executor.shutdown(wait=False, cancel_futures=True)

    normalized_jobs, filter_summary = normalize_job_records(
        rows=raw_rows,
        requested_role=req.role,
        company_filter=company_clean,
        candidate_experience=req.candidateExperience,
        employment_type=req.employmentType,
        posting_freshness=req.postingFreshness,
        fetched_at=fetched_at,
        now_utc=now_utc,
    )

    if source_errors and sources_succeeded:
        failed_names = ", ".join(e.source.title() for e in source_errors)
        warnings.append(
            f"Partial results: {failed_names} could not be queried right now; showing results from {', '.join(s.title() for s in sources_succeeded)}."
        )

    all_failed = len(sources_succeeded) == 0 and len(source_errors) > 0

    response_dict = {
        "success": not all_failed,
        "jobs": normalized_jobs,
        "totalResults": len(normalized_jobs),
        "fetchedAt": fetched_at,
        "cached": False,
        "sourcesSucceeded": sources_succeeded,
        "sourceErrors": [e.model_dump() for e in source_errors],
        "warnings": warnings,
        "filterSummary": filter_summary,
    }

    # Cache only when at least one source succeeded so transient full outages are never cached
    if sources_succeeded:
        with _cache_lock:
            if len(_search_cache) >= MAX_CACHE_ENTRIES:
                oldest_key = min(_search_cache.keys(), key=lambda k: _search_cache[k][0])
                _search_cache.pop(oldest_key, None)
            _search_cache[cache_key] = (time.monotonic(), response_dict)

    return SearchOpeningsResponse(**response_dict)


app = FastAPI(
    title="Compass AI — Live Job Search Service",
    version="2.0.0",
    description="Live JobSpy-powered job discovery microservice for Compass AI Job Search.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_origin_regex=r"^https://ais-(dev|pre)-[a-z0-9-]+\.[a-z0-9.-]+\.run\.app$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "company-jobs-service",
        "jobspyAvailable": scrape_jobs is not None,
        "sources": ENABLED_SOURCES,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/company-interview/openings/search", response_model=SearchOpeningsResponse)
def search_openings(payload: SearchOpeningsRequest) -> SearchOpeningsResponse:
    return execute_openings_search(payload)
