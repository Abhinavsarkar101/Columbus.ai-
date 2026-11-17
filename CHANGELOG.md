# Changelog & Release Announcements

All notable product releases and platform improvements for **Compass — MBA Career Operating System** are documented here.

---

## [Latest Release] — Precision Live Job Search & Resilient Auth (November 2026)

### 📢 Major Highlights

#### 1. Dedicated **Job Search** Module (`#jobs`)
- **Promoted Standalone Experience**: Added a dedicated **Job Search** tab immediately after **Resume Studio** across both desktop and mobile navigation, while keeping **Company Interview Prep** cleanly focused on corporate dossiers and interview preparation.
- **Role-First Discovery Workflow**: Removed company-scope radio toggles so searches start directly with **Target Job Role**, **Location** (defaulting to `India`), and an optional **Company** filter, alongside **Candidate Experience**, **Employment Type**, **Posting Freshness**, and an unspecified-experience toggle.
- **Live Multi-Source Aggregation**: Queries **Indeed India**, **Naukri**, and **public LinkedIn** concurrently via the FastAPI + `python-jobspy` microservice (`company-jobs-service/`) with Render Free deployment support.

#### 2. Strict Role, Seniority, Experience & Freshness Filtering
- **Generic Title & Seniority Matching**: Dynamically matches any user-entered Target Job Role by core domain keywords and standard abbreviations while rejecting unrequested higher-seniority titles (`Tech Lead`, `Lead`, `Senior`, `Sr.`, `Principal`, `Staff`, `Director`, `VP`, `Head`, `Group`) and unrequested intern/manager levels.
- **Strict Good-Experience Filtering**: Excludes borderline (`potential_match`), ambiguous (`needs_review`), and out-of-range higher-experience listings whenever a candidate selects a specific experience level.
- **Backend Posting Freshness Cutoffs**: Verifies `datePosted` against the chosen freshness window (`24h`, `3d`, `7d`, `30d`) on the server to block older reposts.
- **Clear No-Latest-Posts Empty States**: Displays tailored empty-state messaging naming the exact role and freshness window when no recent openings match, paired with filter exclusion telemetry (`filterSummary`).

#### 3. Resilient GitHub Pages Authentication & Deployment
- **Hardened Firebase + Local Fallback**: Automatically handles missing, placeholder, invalid-API-key, or HTTP-referrer-blocked Firebase configs with a seamless SHA-256 browser-local account fallback across Sign Up, Sign In, and Password Reset.
- **Automated CI/CD & Cache Hygiene**: Configured `.github/workflows/deploy.yml` with Vite environment variable injection (`VITE_FIREBASE_*` and `VITE_COMPANY_OPENINGS_API_URL`), relative asset base paths (`./`), and `no-cache` headers in `index.html`.
