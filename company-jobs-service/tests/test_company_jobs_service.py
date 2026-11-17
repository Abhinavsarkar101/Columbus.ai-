from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import pandas as pd
from fastapi.testclient import TestClient

SERVICE_DIR = Path(__file__).resolve().parents[1]
if str(SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICE_DIR))

from experience_matcher import classify_experience
from main import _search_cache, app
from normalizer import (
    is_within_freshness_window,
    matches_target_role_title,
    normalize_job_records,
)


client = TestClient(app)


def setup_function() -> None:
    _search_cache.clear()


def test_health_endpoint() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert set(data["sources"]) == {"indeed", "naukri", "linkedin"}


def test_deterministic_experience_matching_rules() -> None:
    res = classify_experience("fresher", None, None, "Freshers welcome. Strong analytical skills.")
    assert res.match_status == "good_match"
    assert res.match_label == "Good experience match"

    res2 = classify_experience("fresher", "3-5 Yrs", None, "Strategy role.")
    assert res2.match_status == "outside_range"

    res3 = classify_experience("1_3", None, None, "Requires 2+ years of experience in product analytics.")
    assert res3.match_status == "good_match"

    res4 = classify_experience("1_3", "3-5 years", None, "")
    assert res4.match_status == "potential_match"

    res5 = classify_experience("fresher", None, None, "Own product roadmap for enterprise users.")
    assert res5.experience_range == "Not specified"
    assert res5.match_status == "not_specified"

    res6 = classify_experience("1_3", None, None, "Relevant experience required for this program.")
    assert res6.match_status == "needs_review"

    res7 = classify_experience("internship", None, "Internship", "Summer MBA internship.")
    assert res7.match_status == "good_match"

    res8 = classify_experience("fresher", None, "Mid-Senior level", "")
    assert res8.match_status == "outside_range"

    res9 = classify_experience("fresher", None, "Associate", "")
    assert res9.match_status == "not_specified"


def test_generic_strict_title_and_seniority_matching() -> None:
    # 1. Associate Product Manager: excludes Tech Lead, Senior PM, plain Product Manager, unrelated roles
    assert matches_target_role_title("Associate Product Manager", "Associate Product Manager") is True
    assert matches_target_role_title("Associate Product Manager", "Associate Product Manager – Payments") is True
    assert matches_target_role_title("Associate Product Manager", "APM - Growth") is True
    assert matches_target_role_title("Associate Product Manager", "Associate PM (Consumer Tech)") is True
    assert matches_target_role_title("Associate Product Manager", "Tech Lead") is False
    assert matches_target_role_title("Associate Product Manager", "Senior Product Manager") is False
    assert matches_target_role_title("Associate Product Manager", "Lead Associate Product Manager") is False
    assert matches_target_role_title("Associate Product Manager", "Product Manager") is False
    assert matches_target_role_title("Associate Product Manager", "Senior .Net Developer") is False
    assert matches_target_role_title("Associate Product Manager", "Business Development Associate") is False

    # 2. Works generically across arbitrary roles (e.g. Financial Analyst, Management Trainee, Product Manager)
    assert matches_target_role_title("Financial Analyst", "Financial Analyst - FP&A") is True
    assert matches_target_role_title("Financial Analyst", "Finance Analyst") is True
    assert matches_target_role_title("Financial Analyst", "Senior Financial Analyst") is False
    assert matches_target_role_title("Financial Analyst", "VP Finance") is False
    assert matches_target_role_title("Financial Analyst", "Financial Analyst Manager") is False

    assert matches_target_role_title("Management Trainee", "Management Trainee - Marketing") is True
    assert matches_target_role_title("Management Trainee", "Sales Executive") is False

    assert matches_target_role_title("Product Manager", "Product Manager - Fintech") is True
    assert matches_target_role_title("Product Manager", "Sr. Product Manager") is False
    assert matches_target_role_title("Product Manager", "Group Product Manager") is False
    assert matches_target_role_title("Product Manager", "Director of Product Management") is False
    assert matches_target_role_title("Product Manager", "Product Management Intern") is False
    assert matches_target_role_title(
        "Product Manager",
        "Product Management Intern",
        employment_type="internship",
    ) is True

    # 3. Respects when candidate explicitly searches for Senior role
    assert matches_target_role_title("Senior Product Manager", "Senior Product Manager - Core") is True
    assert matches_target_role_title("Senior Product Manager", "Sr. Product Manager") is True
    assert matches_target_role_title("Senior Product Manager", "Principal Product Manager") is False


def test_strict_freshness_window_cutoff() -> None:
    now_ref = datetime(2026, 11, 17, 6, 30, 0, tzinfo=timezone.utc)  # 12:00 PM IST on 2026-11-17

    assert is_within_freshness_window("2026-11-17", "24h", now_utc=now_ref) is True
    assert is_within_freshness_window("2026-11-16", "24h", now_utc=now_ref) is True
    assert is_within_freshness_window("2026-11-15", "24h", now_utc=now_ref) is False
    assert is_within_freshness_window("2026-11-10", "24h", now_utc=now_ref) is False
    assert is_within_freshness_window(None, "24h", now_utc=now_ref) is False

    assert is_within_freshness_window("2026-11-14", "3d", now_utc=now_ref) is True
    assert is_within_freshness_window("2026-11-13", "3d", now_utc=now_ref) is False

    assert is_within_freshness_window("2026-11-10", "7d", now_utc=now_ref) is True
    assert is_within_freshness_window("2026-11-08", "7d", now_utc=now_ref) is False
    assert is_within_freshness_window("2026-09-01", "any", now_utc=now_ref) is True


def test_strict_filtering_pipeline_and_diagnostics() -> None:
    now_ref = datetime(2026, 11, 17, 6, 30, 0, tzinfo=timezone.utc)
    raw_rows = [
        # Valid strict match
        {
            "id": "1",
            "site": "indeed",
            "title": "Associate Product Manager",
            "company": "Swiggy",
            "location": "Bengaluru, Karnataka",
            "job_url": "https://in.indeed.com/viewjob?jk=apm1&utm_source=test",
            "job_url_direct": float("nan"),
            "date_posted": "2026-11-17",
            "job_type": "fulltime",
            "experience_range": None,
            "job_level": None,
            "description": "Looking for Associate Product Manager with 0-1 years of experience.",
            "min_amount": float("nan"),
            "max_amount": float("nan"),
            "is_remote": False,
        },
        # Unrelated role / senior title -> excludedByTitleOrSeniority
        {
            "id": "2",
            "site": "naukri",
            "title": "Tech Lead",
            "company": "Other Co",
            "location": "Bengaluru",
            "job_url": "https://www.naukri.com/job-listings-999",
            "date_posted": "2026-11-17",
            "description": "0-1 years",
        },
        # Older than 24h -> excludedByFreshness
        {
            "id": "3",
            "site": "linkedin",
            "title": "Associate Product Manager",
            "company": "Razorpay",
            "location": "Bengaluru",
            "job_url": "https://www.linkedin.com/jobs/view/55555/?trk=abc",
            "date_posted": "2026-11-10",
            "description": "0-1 years",
        },
        # Higher experience (3-5 years for fresher 0-1 candidate) -> excludedByExperience
        {
            "id": "4",
            "site": "indeed",
            "title": "Associate Product Manager",
            "company": "Flipkart",
            "location": "Bengaluru",
            "job_url": "https://in.indeed.com/viewjob?jk=apm_exp_high",
            "date_posted": "2026-11-17",
            "experience_range": "3-5 Yrs",
            "description": "Requires 3-5 years of experience.",
        },
        # Borderline potential match (1-3 years for 0-1 candidate) -> excludedByExperience (strict good only)
        {
            "id": "5",
            "site": "indeed",
            "title": "Associate Product Manager",
            "company": "Meesho",
            "location": "Bengaluru",
            "job_url": "https://in.indeed.com/viewjob?jk=apm_borderline",
            "date_posted": "2026-11-17",
            "experience_range": "1-3 Yrs",
            "description": "Requires 1-3 years of experience.",
        },
    ]

    jobs, summary = normalize_job_records(
        rows=raw_rows,
        requested_role="Associate Product Manager",
        company_filter="",
        candidate_experience="fresher",
        employment_type="fulltime",
        posting_freshness="24h",
        fetched_at="2026-11-17T06:30:00Z",
        now_utc=now_ref,
    )

    assert summary["rawFetched"] == 5
    assert summary["excludedByTitleOrSeniority"] == 1
    assert summary["excludedByFreshness"] == 1
    assert summary["excludedByExperience"] == 2
    assert summary["matchedCount"] == 1
    assert len(jobs) == 1
    assert jobs[0]["company"] == "Swiggy"
    assert jobs[0]["experienceMatch"] == "good_match"


def test_dedup_preserves_distinct_vacancies_same_title_and_company() -> None:
    now_ref = datetime(2026, 11, 16, 10, 0, 0, tzinfo=timezone.utc)
    raw_rows = [
        {
            "site": "indeed",
            "title": "Business Analyst",
            "company": "McKinsey & Company",
            "location": "Bengaluru",
            "job_url": "https://in.indeed.com/viewjob?jk=job1",
            "date_posted": "2026-11-16",
            "description": "0-1 years",
        },
        {
            "site": "indeed",
            "title": "Business Analyst",
            "company": "McKinsey & Company",
            "location": "Gurugram",
            "job_url": "https://in.indeed.com/viewjob?jk=job2",
            "date_posted": "2026-11-16",
            "description": "0-1 years",
        },
    ]
    jobs, summary = normalize_job_records(
        rows=raw_rows,
        requested_role="Business Analyst",
        company_filter="McKinsey & Company",
        candidate_experience="fresher",
        employment_type="any",
        posting_freshness="7d",
        fetched_at="2026-11-16T10:00:00Z",
        now_utc=now_ref,
    )
    assert len(jobs) == 2
    assert summary["matchedCount"] == 2


def test_search_endpoint_works_without_company_name_and_with_optional_company() -> None:
    captured_calls: list[dict] = []
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def fake_scrape_jobs(**kwargs):
        captured_calls.append(kwargs)
        site = kwargs["site_name"][0]
        if site == "indeed":
            return pd.DataFrame(
                [
                    {
                        "site": "indeed",
                        "title": "Associate Product Manager",
                        "company": "Swiggy",
                        "location": "Bengaluru, Karnataka",
                        "job_url": "https://in.indeed.com/viewjob?jk=swg1",
                        "date_posted": today_str,
                        "job_type": "fulltime",
                        "description": "Looking for 1-3 years experience in consumer tech.",
                        "min_amount": None,
                        "max_amount": None,
                        "is_remote": False,
                    },
                    {
                        "site": "indeed",
                        "title": "Tech Lead - Mobile",
                        "company": "Other Co",
                        "location": "Bengaluru, Karnataka",
                        "job_url": "https://in.indeed.com/viewjob?jk=lead1",
                        "date_posted": today_str,
                        "job_type": "fulltime",
                        "description": "1-3 years",
                    },
                ]
            )
        return pd.DataFrame()

    with patch("main.scrape_jobs", side_effect=fake_scrape_jobs):
        resp = client.post(
            "/api/company-interview/openings/search",
            json={
                "role": "Associate Product Manager",
                "location": "Bengaluru",
                "candidateExperience": "1_3",
                "employmentType": "fulltime",
                "postingFreshness": "24h",
                "resultsPerSource": 10,
            },
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["totalResults"] == 1
    assert data["jobs"][0]["title"] == "Associate Product Manager"
    assert data["jobs"][0]["company"] == "Swiggy"
    assert data["filterSummary"]["rawFetched"] == 2
    assert data["filterSummary"]["excludedByTitleOrSeniority"] == 1
    assert len(captured_calls) == 3

    indeed_call = next(c for c in captured_calls if c["site_name"] == ["indeed"])
    assert indeed_call["search_term"] == "Associate Product Manager"
    assert indeed_call["hours_old"] == 24


def test_partial_source_failure_and_empty_latest_posts_summary() -> None:
    def fake_partial(**kwargs):
        site = kwargs["site_name"][0]
        if site == "linkedin":
            raise RuntimeError("429 Too Many Requests from LinkedIn")
        if site == "naukri":
            return pd.DataFrame(
                [
                    {
                        "site": "naukri",
                        "title": "Senior Developer",
                        "company": "Some Corp",
                        "location": "Mumbai",
                        "job_url": "https://www.naukri.com/job-1",
                        "date_posted": "2020-01-01",
                        "experience_range": "5-8 Yrs",
                        "description": "Unrelated role.",
                    }
                ]
            )
        return pd.DataFrame()

    with patch("main.scrape_jobs", side_effect=fake_partial):
        resp = client.post(
            "/api/company-interview/openings/search",
            json={
                "role": "Strategy Associate",
                "location": "Mumbai",
                "candidateExperience": "1_3",
                "employmentType": "any",
                "postingFreshness": "24h",
            },
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["totalResults"] == 0
    assert body["filterSummary"]["rawFetched"] == 1
    assert body["filterSummary"]["excludedByTitleOrSeniority"] == 1
    assert "naukri" in body["sourcesSucceeded"]
    assert body["sourceErrors"][0]["source"] == "linkedin"
    assert body["sourceErrors"][0]["code"] == "rate_limited"


def test_invalid_input_rejected_with_422() -> None:
    resp = client.post(
        "/api/company-interview/openings/search",
        json={
            "role": " ",
            "location": "India",
            "candidateExperience": "any",
            "employmentType": "any",
            "postingFreshness": "7d",
        },
    )
    assert resp.status_code == 422
