from __future__ import annotations

import hashlib
import math
import re
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from experience_matcher import classify_experience

LEGAL_SUFFIXES = {
    "inc",
    "incorporated",
    "ltd",
    "limited",
    "pvt",
    "private",
    "llc",
    "llp",
    "corp",
    "corporation",
    "co",
    "company",
    "group",
    "india",
    "services",
    "technologies",
    "solutions",
    "consulting",
    "bank",
}

KNOWN_COMPANY_ALIASES: dict[str, list[str]] = {
    "mckinsey": ["mckinsey", "mckinsey & company", "mckinsey and company"],
    "boston consulting group": ["boston consulting group", "bcg"],
    "bain": ["bain", "bain & company", "bain and company"],
    "hindustan unilever": ["hindustan unilever", "hul", "unilever"],
    "deloitte": ["deloitte", "deloitte consulting", "deloitte usi", "deloitte india"],
    "zs associates": ["zs associates", "zs"],
    "kotak mahindra": ["kotak mahindra", "kotak", "kotak bank"],
    "itc": ["itc", "itc limited"],
    "goldman sachs": ["goldman sachs"],
    "amazon": ["amazon", "amazon development centre", "amazon india"],
    "flipkart": ["flipkart", "flipkart internet"],
    "swiggy": ["swiggy", "bundl technologies"],
}

TRACKING_QUERY_PARAMS = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "ref",
    "refId",
    "trackingId",
    "trk",
    "trkInfo",
    "vjs",
    "from",
    "tk",
    "advn",
    "fccid",
}

TITLE_STOPWORDS = {
    "and",
    "or",
    "for",
    "of",
    "the",
    "in",
    "at",
    "to",
    "a",
    "an",
    "with",
    "on",
    "role",
}

ROLE_STEM_MAP = {
    "products": "product",
    "managers": "manager",
    "analysts": "analyst",
    "analytics": "analyst",
    "associates": "associate",
    "consultants": "consultant",
    "consulting": "consultant",
    "engineers": "engineer",
    "engineering": "engineer",
    "developers": "developer",
    "specialists": "specialist",
    "coordinators": "coordinator",
    "strategists": "strategist",
    "operations": "operation",
    "operational": "operation",
    "financial": "finance",
    "marketing": "market",
    "interns": "intern",
    "internships": "intern",
    "trainees": "trainee",
    "sr": "senior",
    "jr": "junior",
    "asst": "assistant",
    "assoc": "associate",
    "mgr": "manager",
}

HIGHER_SENIORITY_TOKENS = {
    "senior",
    "lead",
    "principal",
    "staff",
    "director",
    "vp",
    "head",
    "chief",
    "architect",
    "svp",
    "evp",
    "avp",
    "gm",
    "partner",
    "fellow",
    "distinguished",
    "master",
    "iii",
    "iv",
    "v",
    "cxo",
    "ceo",
    "cfo",
    "cto",
    "coo",
    "cpo",
    "cmo",
}

HIGHER_SENIORITY_PHRASES = (
    "tech lead",
    "team lead",
    "product lead",
    "engineering lead",
    "vice president",
    "general manager",
    "group product manager",
    "group manager",
    "head of",
)

INTERN_ONLY_TOKENS = {"intern", "trainee", "apprentice"}

FRESHNESS_MAX_DAYS: dict[str, int] = {
    "24h": 1,  # Job boards report YYYY-MM-DD dates; 1 calendar day covers the trailing 24h across timezones
    "3d": 3,
    "7d": 7,
    "30d": 30,
}

FRESHNESS_MAX_HOURS: dict[str, int] = {
    "24h": 24,
    "3d": 72,
    "7d": 168,
    "30d": 720,
}


def safe_str(val: Any) -> str:
    if val is None:
        return ""
    if isinstance(val, float) and math.isnan(val):
        return ""
    text = str(val).strip()
    if text.lower() in ("nan", "none", "nat", "<na>"):
        return ""
    return text


def safe_float(val: Any) -> Optional[float]:
    if val is None:
        return None
    try:
        num = float(val)
        if math.isnan(num) or math.isinf(num):
            return None
        return num
    except (TypeError, ValueError):
        return None


def safe_bool(val: Any) -> Optional[bool]:
    if val is None:
        return None
    if isinstance(val, bool):
        return val
    if isinstance(val, float) and math.isnan(val):
        return None
    s = str(val).strip().lower()
    if s in ("true", "1", "yes"):
        return True
    if s in ("false", "0", "no"):
        return False
    return None


def safe_date_str(val: Any) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    if isinstance(val, (datetime, date)):
        return val.strftime("%Y-%m-%d")
    s = safe_str(val)
    if not s:
        return None
    return s[:10] if len(s) >= 10 and s[4] == "-" and s[7] == "-" else s


def is_valid_http_url(url: str) -> bool:
    if not url:
        return False
    try:
        parsed = urlparse(url.strip())
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def normalize_url_for_dedup(url: str) -> str:
    if not is_valid_http_url(url):
        return ""
    parsed = urlparse(url.strip())
    kept_params = [
        (k, v)
        for k, v in parse_qsl(parsed.query, keep_blank_values=False)
        if k not in TRACKING_QUERY_PARAMS
    ]
    cleaned_query = urlencode(sorted(kept_params))
    return urlunparse(
        (
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            parsed.path.rstrip("/"),
            "",
            cleaned_query,
            "",
        )
    )


def build_company_search_token(company_name: str) -> str:
    """Extracts a clean search-friendly company name without parenthetical aliases."""
    cleaned = re.sub(r"\([^)]*\)", "", company_name).split("/")[0].strip()
    cleaned = re.sub(r"\b(?:limited|ltd\.?|inc\.?|pvt\.?)\b", "", cleaned, flags=re.IGNORECASE).strip()
    return cleaned or company_name.strip()


def _normalize_company_tokens(name: str) -> list[str]:
    raw = name.lower()
    variants = [re.sub(r"\([^)]*\)", " ", raw)]
    paren_matches = re.findall(r"\(([^)]+)\)", raw)
    variants.extend(paren_matches)

    tokens: list[str] = []
    for variant in variants:
        for part in re.split(r"[/|,&]+", variant):
            words = [w for w in re.findall(r"[a-z0-9]+", part) if w not in LEGAL_SUFFIXES]
            if words:
                tokens.append(" ".join(words))
    return tokens


def verify_company_match(
    company_filter: str,
    returned_company: str,
) -> tuple[str, bool]:
    """
    Returns (company_match_status, should_include_result).
    When no company_filter is provided -> ('cross_company', True).
    When company_filter is provided:
      - 'confirmed' if returned company matches company_filter or known alias
      - 'unverified' if returned company is missing/confidential
      - ('mismatch', False) if clearly a different employer
    """
    filter_clean = safe_str(company_filter)
    if not filter_clean:
        return ("cross_company", True)

    ret_clean = safe_str(returned_company)
    if not ret_clean or ret_clean.lower() in ("confidential", "undisclosed", "company confidential", "unknown"):
        return ("unverified", True)

    active_variants = _normalize_company_tokens(filter_clean)
    ret_variants = _normalize_company_tokens(ret_clean)
    if not ret_variants:
        return ("unverified", True)

    expanded_active: set[str] = set(active_variants)
    for av in active_variants:
        for base_key, aliases in KNOWN_COMPANY_ALIASES.items():
            if base_key in av or av in aliases:
                expanded_active.update(aliases)

    for rv in ret_variants:
        for av in expanded_active:
            if not av or not rv:
                continue
            if rv == av or av in rv or rv in av:
                return ("confirmed", True)
            av_words = set(av.split())
            rv_words = set(rv.split())
            if av_words and av_words.issubset(rv_words):
                return ("confirmed", True)

    return ("mismatch", False)


def _tokenize_title(text: str) -> list[str]:
    raw_tokens = re.findall(r"[a-z0-9]+", text.lower())
    normalized: list[str] = []
    for tok in raw_tokens:
        if tok in TITLE_STOPWORDS:
            continue
        normalized.append(ROLE_STEM_MAP.get(tok, tok))
    return normalized


def matches_target_role_title(
    requested_role: str,
    job_title: str,
    employment_type: str = "any",
    candidate_experience: str = "any",
) -> bool:
    """
    Generic, role-agnostic strict title & seniority filter.
    Ensures every core keyword from requested_role (or exact unambiguous role shorthand)
    appears in job_title AND excludes mismatched higher seniority or unrequested intern/manager levels.
    """
    req_clean = safe_str(requested_role)
    title_clean = safe_str(job_title)
    if not req_clean or not title_clean:
        return False

    req_lower = re.sub(r"\s+", " ", req_clean.lower()).strip()
    title_lower = re.sub(r"\s+", " ", title_clean.lower()).strip()

    req_tokens = _tokenize_title(req_clean)
    title_tokens = _tokenize_title(title_clean)
    if not req_tokens or not title_tokens:
        return False

    req_set = set(req_tokens)
    title_set = set(title_tokens)

    # 1. Higher seniority phrase guard (unless user explicitly searched for it)
    for phrase in HIGHER_SENIORITY_PHRASES:
        if phrase in title_lower and phrase not in req_lower:
            return False

    # 2. Higher seniority token guard (unless user explicitly requested that seniority)
    for sen_tok in HIGHER_SENIORITY_TOKENS:
        if sen_tok in title_set and sen_tok not in req_set:
            return False

    # 3. Guard against "Manager" titles when user searched a non-managerial role (e.g., Analyst / Associate without Manager)
    is_apm_shorthand = req_set == {"apm"}
    if "manager" in title_set and "manager" not in req_set and not is_apm_shorthand:
        return False

    # 4. Guard against Intern / Trainee titles when user did not search for internship/trainee
    wants_internship = (
        bool(req_set & INTERN_ONLY_TOKENS)
        or employment_type == "internship"
        or candidate_experience == "internship"
    )
    if not wants_internship and (title_set & INTERN_ONLY_TOKENS):
        return False

    # 5. Core role keyword alignment (with clean unambiguous acronym expansion)
    effective_title_set = set(title_set)
    if wants_internship and (title_set & INTERN_ONLY_TOKENS) and "management" in effective_title_set:
        effective_title_set.add("manager")

    if req_set.issubset(effective_title_set):
        return True

    # Handle "Associate Product Manager" <-> "APM" / "Associate PM"
    if req_tokens == ["associate", "product", "manager"]:
        if "apm" in effective_title_set:
            return True
        if "associate" in effective_title_set and "pm" in effective_title_set:
            return True
        return False

    if req_tokens == ["apm"]:
        if {"associate", "product", "manager"}.issubset(effective_title_set):
            return True
        if "associate" in effective_title_set and "pm" in effective_title_set:
            return True
        return False

    # Handle "Human Resources" <-> "HR"
    if "human" in req_set and "resource" in req_set or "resources" in req_lower:
        expanded_req = [t for t in req_tokens if t not in ("human", "resource", "resources")]
        if ("hr" in effective_title_set or ("human" in effective_title_set and ("resource" in effective_title_set or "resources" in title_lower))) and all(
            t in effective_title_set for t in expanded_req
        ):
            return True

    if "hr" in req_set:
        expanded_req = [t for t in req_tokens if t != "hr"]
        if ("hr" in effective_title_set or ("human" in effective_title_set and ("resource" in effective_title_set or "resources" in title_lower))) and all(
            t in effective_title_set for t in expanded_req
        ):
            return True

    return False


def is_within_freshness_window(
    raw_date_val: Any,
    posting_freshness: str,
    now_utc: Optional[datetime] = None,
) -> bool:
    """
    Strictly verifies whether a listing's posted date falls within the selected freshness window.
    """
    if posting_freshness == "any":
        return True

    max_days = FRESHNESS_MAX_DAYS.get(posting_freshness)
    max_hours = FRESHNESS_MAX_HOURS.get(posting_freshness)
    if max_days is None or max_hours is None:
        return True

    if raw_date_val is None or (isinstance(raw_date_val, float) and math.isnan(raw_date_val)):
        return False

    ref_now = now_utc or datetime.now(timezone.utc)
    if ref_now.tzinfo is None:
        ref_now = ref_now.replace(tzinfo=timezone.utc)
    # Use IST date (+5:30) as local Indian job-board reference day
    ref_today_ist = (ref_now + timedelta(hours=5, minutes=30)).date()

    # Exact datetime value with time component
    if isinstance(raw_date_val, datetime):
        dt = raw_date_val if raw_date_val.tzinfo else raw_date_val.replace(tzinfo=timezone.utc)
        age_sec = (ref_now - dt).total_seconds()
        return age_sec <= max_hours * 3600

    if isinstance(raw_date_val, date):
        age_days = max(0, (ref_today_ist - raw_date_val).days)
        return age_days <= max_days

    text = safe_str(raw_date_val)
    if not text:
        return False

    lower = text.lower()
    if any(tok in lower for tok in ("just now", "today", "few hours", "hour ago", "hours ago", "min ago", "mins ago")):
        return True
    if "yesterday" in lower:
        return 1 <= max_days
    m_days = re.search(r"(\d+)\s*\+?\s*days?\s*ago", lower)
    if m_days:
        num_days = int(m_days.group(1))
        if "+" in m_days.group(0):
            return False
        return num_days <= max_days

    # Full ISO timestamp string (with 'T' and time)
    if "t" in lower and len(text) > 10:
        try:
            iso_candidate = text.replace("Z", "+00:00")
            parsed_dt = datetime.fromisoformat(iso_candidate)
            if parsed_dt.tzinfo is None:
                parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
            return (ref_now - parsed_dt).total_seconds() <= max_hours * 3600
        except ValueError:
            pass

    # Date-only YYYY-MM-DD prefix
    m_iso_date = re.match(r"^(\d{4})-(\d{2})-(\d{2})", text)
    if m_iso_date:
        try:
            parsed_date = date(
                int(m_iso_date.group(1)),
                int(m_iso_date.group(2)),
                int(m_iso_date.group(3)),
            )
            age_days = max(0, (ref_today_ist - parsed_date).days)
            return age_days <= max_days
        except ValueError:
            return False

    return False


def _format_salary_display(
    min_amt: Optional[float],
    max_amt: Optional[float],
    interval: str,
    currency: str,
) -> str:
    if min_amt is None and max_amt is None:
        return "Not disclosed"
    if (min_amt or 0) <= 0 and (max_amt or 0) <= 0:
        return "Not disclosed"

    cur = currency.upper() if currency else ""
    prefix = f"{cur} " if cur else ""

    def fmt_num(n: float) -> str:
        return f"{int(round(n)):,}"

    if min_amt is not None and max_amt is not None and min_amt > 0 and max_amt > 0:
        span = fmt_num(min_amt) if abs(min_amt - max_amt) < 1 else f"{fmt_num(min_amt)} – {fmt_num(max_amt)}"
    elif min_amt is not None and min_amt > 0:
        span = f"From {fmt_num(min_amt)}"
    elif max_amt is not None and max_amt > 0:
        span = f"Up to {fmt_num(max_amt)}"
    else:
        return "Not disclosed"

    suffix = f" / {interval}" if interval else ""
    return f"{prefix}{span}{suffix}".strip()


def _make_preview(description: str, max_len: int = 240) -> str:
    if not description:
        return "Full job description is available on the source job posting."
    compact = re.sub(r"\s+", " ", description).strip()
    if len(compact) <= max_len:
        return compact
    cut = compact[:max_len].rsplit(" ", 1)[0]
    return f"{cut}..."


def normalize_job_records(
    rows: list[dict[str, Any]],
    requested_role: str,
    company_filter: str,
    candidate_experience: str,
    employment_type: str,
    posting_freshness: str,
    fetched_at: str,
    now_utc: Optional[datetime] = None,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """
    Normalizes raw JobSpy records into a consistent schema and enforces strict deterministic gates:
      1. Role keyword & seniority title match (rejecting e.g. Tech Lead for APM, Senior for non-Senior)
      2. Optional company verification (if company_filter is provided)
      3. Strict posting freshness window cutoff
      4. Strict experience match ('good_match' only when candidate_experience != 'any', plus 'not_specified' for UI toggle)
      5. Safe vacancy deduplication
    Returns (normalized_jobs, filter_summary).
    """
    normalized: list[dict[str, Any]] = []
    seen_keys: set[str] = set()

    raw_fetched = 0
    excluded_title = 0
    excluded_company = 0
    excluded_freshness = 0
    excluded_experience = 0

    for row in rows:
        title = safe_str(row.get("title"))
        if not title:
            continue

        job_url_raw = safe_str(row.get("job_url"))
        direct_url_raw = safe_str(row.get("job_url_direct"))
        job_url = job_url_raw if is_valid_http_url(job_url_raw) else ""
        apply_url = direct_url_raw if is_valid_http_url(direct_url_raw) else job_url

        if not job_url and not apply_url:
            continue

        raw_fetched += 1

        # 1. Strict Title & Seniority Match
        if not matches_target_role_title(
            requested_role=requested_role,
            job_title=title,
            employment_type=employment_type,
            candidate_experience=candidate_experience,
        ):
            excluded_title += 1
            continue

        # 2. Optional Company Filter
        raw_company = safe_str(row.get("company"))
        match_status, company_ok = verify_company_match(company_filter, raw_company)
        if not company_ok:
            excluded_company += 1
            continue

        company_display = raw_company if raw_company else (
            f"{company_filter} (Unverified)" if company_filter else "Company not specified"
        )

        # 3. Strict Posting Freshness Cutoff
        raw_date_val = row.get("date_posted")
        if not is_within_freshness_window(raw_date_val, posting_freshness, now_utc=now_utc):
            excluded_freshness += 1
            continue

        date_posted = safe_date_str(raw_date_val)
        source = safe_str(row.get("site")).lower() or "unknown"
        location = safe_str(row.get("location")) or "Location not specified"
        row_employment_type = safe_str(row.get("job_type")) or "Not specified"
        raw_exp_range = safe_str(row.get("experience_range"))
        job_level = safe_str(row.get("job_level")) or "Not specified"
        description = safe_str(row.get("description"))

        # 4. Deterministic Experience Evaluation & Strict Filter
        exp_eval = classify_experience(
            candidate_experience=candidate_experience,
            raw_experience_range=raw_exp_range,
            raw_job_level=None if job_level == "Not specified" else job_level,
            description=description,
            raw_employment_type=row_employment_type,
        )

        if candidate_experience != "any" and exp_eval.match_status not in ("good_match", "not_specified"):
            excluded_experience += 1
            continue

        # 5. Deduplicate using normalized URL first; fallback to composite including source + id/url + location + date
        norm_url = normalize_url_for_dedup(job_url or apply_url)
        raw_id = safe_str(row.get("id"))
        if norm_url:
            dedup_key = f"url:{norm_url}"
        else:
            dedup_key = (
                f"comp:{source}|{raw_id}|{title.lower()}|{company_display.lower()}|"
                f"{location.lower()}|{date_posted or ''}"
            )

        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        min_amt = safe_float(row.get("min_amount"))
        max_amt = safe_float(row.get("max_amount"))
        interval = safe_str(row.get("interval"))
        currency = safe_str(row.get("currency"))
        is_remote = safe_bool(row.get("is_remote"))
        if is_remote is None and "remote" in location.lower():
            is_remote = True

        record_id = hashlib.sha256(dedup_key.encode("utf-8")).hexdigest()[:16]

        normalized.append(
            {
                "id": record_id,
                "title": title,
                "company": company_display,
                "companyMatchStatus": match_status,
                "location": location,
                "jobUrl": job_url or apply_url,
                "applyUrl": apply_url or job_url,
                "source": source,
                "datePosted": date_posted,
                "employmentType": row_employment_type,
                "experienceRange": exp_eval.experience_range,
                "jobLevel": job_level,
                "experienceMatch": exp_eval.match_status,
                "experienceMatchLabel": exp_eval.match_label,
                "experienceReason": exp_eval.reason,
                "description": description,
                "descriptionPreview": _make_preview(description),
                "salaryMin": min_amt if (min_amt and min_amt > 0) else None,
                "salaryMax": max_amt if (max_amt and max_amt > 0) else None,
                "salaryInterval": interval or None,
                "salaryCurrency": currency or None,
                "salaryDisplay": _format_salary_display(min_amt, max_amt, interval, currency),
                "isRemote": is_remote,
                "fetchedAt": fetched_at,
            }
        )

    filter_summary = {
        "rawFetched": raw_fetched,
        "excludedByTitleOrSeniority": excluded_title,
        "excludedByCompany": excluded_company,
        "excludedByFreshness": excluded_freshness,
        "excludedByExperience": excluded_experience,
        "matchedCount": len(normalized),
    }

    return normalized, filter_summary
