from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional, Tuple

CANDIDATE_EXPERIENCE_BOUNDS: dict[str, Optional[Tuple[float, Optional[float]]]] = {
    "internship": (0.0, 0.5),
    "fresher": (0.0, 1.0),
    "1_3": (1.0, 3.0),
    "3_5": (3.0, 5.0),
    "5_8": (5.0, 8.0),
    "8_plus": (8.0, None),
    "any": None,
}

CANDIDATE_EXPERIENCE_LABELS: dict[str, str] = {
    "internship": "Internship / No professional experience",
    "fresher": "Fresher / 0–1 years",
    "1_3": "1–3 years",
    "3_5": "3–5 years",
    "5_8": "5–8 years",
    "8_plus": "8+ years",
    "any": "Any experience",
}

FRESHER_PATTERNS = [
    re.compile(r"\bfreshers?\s+(?:welcome|can\s+apply|are\s+welcome|preferred|eligible)\b", re.IGNORECASE),
    re.compile(r"\bno\s+prior\s+experience\s+(?:required|needed)\b", re.IGNORECASE),
    re.compile(r"\bno\s+experience\s+(?:required|needed)\b", re.IGNORECASE),
    re.compile(r"\bentry[\s-]+level\b", re.IGNORECASE),
]

RANGE_PATTERN = re.compile(
    r"(?<!\d)(?:between\s+)?(\d{1,2}(?:\.\d+)?)\s*(?:-|–|—|to|and)\s*(\d{1,2}(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b",
    re.IGNORECASE,
)

# For structured metadata like experience_range="1-3" or "0 - 2 Yrs"
METADATA_RANGE_PATTERN = re.compile(
    r"^\s*(\d{1,2}(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d{1,2}(?:\.\d+)?)\s*(?:years?|yrs?)?\s*$",
    re.IGNORECASE,
)

PLUS_PATTERN = re.compile(
    r"(?:(?:minimum|min\.?|at\s+least)\s+(?:of\s+)?)?(\d{1,2}(?:\.\d+)?)\s*\+\s*(?:years?|yrs?)\b",
    re.IGNORECASE,
)

MIN_PATTERN = re.compile(
    r"\b(?:minimum|min\.?|at\s+least)\s+(?:of\s+)?(\d{1,2}(?:\.\d+)?)\s*(?:years?|yrs?)\b",
    re.IGNORECASE,
)

UP_TO_PATTERN = re.compile(
    r"\b(?:up\s+to|max(?:imum)?)\s+(\d{1,2}(?:\.\d+)?)\s*(?:years?|yrs?)\b",
    re.IGNORECASE,
)

SINGLE_EXPERIENCE_PATTERN = re.compile(
    r"(?<!\d)(\d{1,2}(?:\.\d+)?)\s*(?:years?|yrs?)\s+(?:of\s+)?(?:[a-z/&-]+\s+){0,4}?experience\b",
    re.IGNORECASE,
)

VERB_EXPERIENCE_PATTERN = re.compile(
    r"\b(?:requires?|requiring|with|having|needs?)\s+(\d{1,2}(?:\.\d+)?)\s*(?:years?|yrs?)\b",
    re.IGNORECASE,
)

VAGUE_EXPERIENCE_PATTERNS = [
    re.compile(r"\brelevant\s+experience\s+(?:required|preferred|is\s+a\s+plus)\b", re.IGNORECASE),
    re.compile(r"\bprior\s+(?:[a-z]+\s+){0,2}?experience\s+(?:in|with|is|required|preferred)\b", re.IGNORECASE),
    re.compile(r"\bproven\s+(?:[a-z]+\s+){0,2}?experience\b", re.IGNORECASE),
    re.compile(r"\bextensive\s+experience\b", re.IGNORECASE),
]


@dataclass
class ExperienceEvaluation:
    experience_range: str
    match_status: str  # good_match | potential_match | outside_range | not_specified | needs_review
    match_label: str
    reason: str


MATCH_LABELS = {
    "good_match": "Good experience match",
    "potential_match": "Potential experience match",
    "outside_range": "Outside selected experience range",
    "not_specified": "Experience not specified",
    "needs_review": "Needs manual review",
}


def _extract_numeric_ranges(text: str, is_metadata: bool = False) -> list[tuple[float, Optional[float], str]]:
    found: list[tuple[float, Optional[float], str]] = []
    if not text:
        return found

    if is_metadata:
        m = METADATA_RANGE_PATTERN.match(text.strip())
        if m:
            low, high = float(m.group(1)), float(m.group(2))
            if 0 <= low <= high <= 35:
                return [(low, high, f"{m.group(1)}–{m.group(2)} years")]

    for m in RANGE_PATTERN.finditer(text):
        low, high = float(m.group(1)), float(m.group(2))
        if 0 <= low <= high <= 35:
            found.append((low, high, f"{m.group(1)}–{m.group(2)} years"))

    for m in MIN_PATTERN.finditer(text):
        low = float(m.group(1))
        if 0 <= low <= 35:
            found.append((low, None, f"Minimum {m.group(1)} years"))

    for m in PLUS_PATTERN.finditer(text):
        low = float(m.group(1))
        if 0 <= low <= 35:
            found.append((low, None, f"{m.group(1)}+ years"))

    for m in UP_TO_PATTERN.finditer(text):
        high = float(m.group(1))
        if 0 <= high <= 35:
            found.append((0.0, high, f"Up to {m.group(1)} years"))

    if not found:
        for m in SINGLE_EXPERIENCE_PATTERN.finditer(text):
            val = float(m.group(1))
            if 0 <= val <= 35:
                found.append((val, val, f"{m.group(1)} years"))

    if not found:
        for m in VERB_EXPERIENCE_PATTERN.finditer(text):
            val = float(m.group(1))
            if 0 <= val <= 35:
                found.append((val, val, f"{m.group(1)} years"))

    return found


def _compare_ranges(
    cand_bounds: Optional[Tuple[float, Optional[float]]],
    cand_key: str,
    req_min: float,
    req_max: Optional[float],
    extracted_label: str,
) -> Tuple[str, str]:
    if cand_bounds is None or cand_key == "any":
        return (
            "good_match",
            f"Candidate selected 'Any experience'; posting states {extracted_label}.",
        )

    c_min, c_max = cand_bounds
    c_upper = c_max if c_max is not None else 35.0
    r_upper = req_max if req_max is not None else 35.0

    # Strict overlap check
    if c_min <= r_upper and req_min <= c_upper:
        # Boundary touch (e.g., candidate 1-3 vs posting 3-5, or fresher 0-1 vs posting 1-3) -> potential match
        if c_upper == req_min and req_min > c_min:
            return (
                "potential_match",
                f"Borderline overlap: candidate ({CANDIDATE_EXPERIENCE_LABELS[cand_key]}) meets minimum of posting ({extracted_label}).",
            )
        if req_max is not None and c_min == r_upper and r_upper > req_min:
            return (
                "potential_match",
                f"Borderline overlap: posting ({extracted_label}) meets lower end of candidate ({CANDIDATE_EXPERIENCE_LABELS[cand_key]}).",
            )
        return (
            "good_match",
            f"Candidate experience ({CANDIDATE_EXPERIENCE_LABELS[cand_key]}) overlaps posting requirement ({extracted_label}).",
        )

    # Check within 1 year tolerance for Potential match
    if req_min > c_upper and (req_min - c_upper) <= 1.0:
        return (
            "potential_match",
            f"Posting asks for {extracted_label}, slightly above {CANDIDATE_EXPERIENCE_LABELS[cand_key]}.",
        )
    if c_min > r_upper and (c_min - r_upper) <= 1.5:
        return (
            "potential_match",
            f"Posting states {extracted_label}, slightly below {CANDIDATE_EXPERIENCE_LABELS[cand_key]}.",
        )

    return (
        "outside_range",
        f"Posting specifies {extracted_label}, outside {CANDIDATE_EXPERIENCE_LABELS[cand_key]}.",
    )


def classify_experience(
    candidate_experience: str,
    raw_experience_range: Optional[str],
    raw_job_level: Optional[str],
    description: Optional[str],
    raw_employment_type: Optional[str] = None,
) -> ExperienceEvaluation:
    """
    Deterministic rule-based experience classifier.
    Never infers experience solely from job title and never fabricates unknown ranges.
    """
    cand_key = candidate_experience if candidate_experience in CANDIDATE_EXPERIENCE_BOUNDS else "any"
    cand_bounds = CANDIDATE_EXPERIENCE_BOUNDS[cand_key]

    exp_meta = (raw_experience_range or "").strip()
    job_level = (raw_job_level or "").strip()
    desc_text = (description or "").strip()
    emp_type = (raw_employment_type or "").strip().lower()

    # 1. Check structured experience_range metadata first (e.g. Naukri)
    meta_ranges = _extract_numeric_ranges(exp_meta, is_metadata=True)
    if meta_ranges:
        req_min, req_max, label = meta_ranges[0]
        status, reason = _compare_ranges(cand_bounds, cand_key, req_min, req_max, label)
        return ExperienceEvaluation(
            experience_range=exp_meta if exp_meta else label,
            match_status=status,
            match_label=MATCH_LABELS[status],
            reason=reason,
        )

    # 2. Check explicit statements inside description
    has_fresher_phrase = any(p.search(desc_text) for p in FRESHER_PATTERNS)
    desc_ranges = _extract_numeric_ranges(desc_text, is_metadata=False)

    # Deduplicate identical extracted bounds from description
    unique_bounds = []
    seen_bounds = set()
    for low, high, label in desc_ranges:
        key = (low, high)
        if key not in seen_bounds:
            seen_bounds.add(key)
            unique_bounds.append((low, high, label))

    if len(unique_bounds) == 1:
        req_min, req_max, label = unique_bounds[0]
        status, reason = _compare_ranges(cand_bounds, cand_key, req_min, req_max, label)
        return ExperienceEvaluation(
            experience_range=label,
            match_status=status,
            match_label=MATCH_LABELS[status],
            reason=reason,
        )

    if len(unique_bounds) > 1:
        # Conflicting / multiple numeric experience statements in description -> needs manual review
        labels_joined = "; ".join(item[2] for item in unique_bounds[:3])
        return ExperienceEvaluation(
            experience_range=labels_joined,
            match_status="needs_review",
            match_label=MATCH_LABELS["needs_review"],
            reason=f"Multiple experience statements detected in description ({labels_joined}). Please review posting details.",
        )

    if has_fresher_phrase:
        status, reason = _compare_ranges(cand_bounds, cand_key, 0.0, 1.0, "Freshers / 0–1 years")
        return ExperienceEvaluation(
            experience_range="Freshers welcome / 0–1 years",
            match_status=status,
            match_label=MATCH_LABELS[status],
            reason=reason,
        )

    # 3. Check vague experience wording in description (e.g. "Relevant experience required")
    if any(p.search(desc_text) for p in VAGUE_EXPERIENCE_PATTERNS):
        return ExperienceEvaluation(
            experience_range="Relevant experience required (years not stated)",
            match_status="needs_review",
            match_label=MATCH_LABELS["needs_review"],
            reason="Posting requests relevant experience without specifying exact years.",
        )

    # 4. Check job_level metadata (e.g. LinkedIn job_level) or explicit internship metadata
    if job_level:
        jl_lower = job_level.lower()
        if "intern" in jl_lower:
            status, reason = _compare_ranges(cand_bounds, cand_key, 0.0, 0.5, "Internship level")
            return ExperienceEvaluation(
                experience_range=f"Job level: {job_level}",
                match_status=status,
                match_label=MATCH_LABELS[status],
                reason=reason,
            )
        if "entry" in jl_lower:
            status, reason = _compare_ranges(cand_bounds, cand_key, 0.0, 1.5, "Entry level")
            return ExperienceEvaluation(
                experience_range=f"Job level: {job_level}",
                match_status=status,
                match_label=MATCH_LABELS[status],
                reason=reason,
            )
        if "mid-senior" in jl_lower or "director" in jl_lower or "executive" in jl_lower:
            senior_min = 8.0 if ("director" in jl_lower or "executive" in jl_lower) else 3.5
            status, reason = _compare_ranges(
                cand_bounds,
                cand_key,
                senior_min,
                None,
                f"Job level: {job_level}",
            )
            if cand_key not in ("any", "internship", "fresher", "1_3"):
                status = "needs_review"
                reason = f"Source lists seniority '{job_level}' without numeric years of experience."
            return ExperienceEvaluation(
                experience_range=f"Job level: {job_level}",
                match_status=status,
                match_label=MATCH_LABELS[status],
                reason=reason,
            )
        if "associate" in jl_lower:
            return ExperienceEvaluation(
                experience_range=f"Job level: {job_level} (years not specified)",
                match_status="not_specified",
                match_label=MATCH_LABELS["not_specified"],
                reason=f"Source lists '{job_level}' without stating exact years of experience.",
            )

    if "internship" in emp_type:
        status, reason = _compare_ranges(cand_bounds, cand_key, 0.0, 0.5, "Internship")
        return ExperienceEvaluation(
            experience_range="Internship (0–1 years)",
            match_status=status,
            match_label=MATCH_LABELS[status],
            reason=reason,
        )

    # 5. Unknown / missing experience specification — never fabricate a range
    return ExperienceEvaluation(
        experience_range="Not specified",
        match_status="not_specified",
        match_label=MATCH_LABELS["not_specified"],
        reason="No explicit experience requirement found in posting metadata or description.",
    )
