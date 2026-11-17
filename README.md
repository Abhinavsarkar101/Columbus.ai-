# Compass — MBA Career Operating System

> **The executive career preparation platform engineered specifically for MBA students, alumni, and candidates targeting top-tier consulting (MBB), high-growth product management, corporate finance, and executive operations.**

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.10+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-00DF89?style=flat-square)](#license)

---

## 📢 Latest Announcement — November 2026 Release

> **Introducing Precision Live Job Search & Resilient GitHub Pages Auth!**
>
> We have shipped a dedicated **Job Search** module (`#jobs`) positioned right after **Resume Studio**, engineered to eliminate irrelevant listings and stale reposts from your placement workflow.

### What's New in This Release
- **Dedicated Live Job Search Module (`#jobs`)**: Queries **Indeed India**, **Naukri**, and **public LinkedIn** in real time starting directly with **Target Job Role**, **Location** (defaulting to `India`), and an **Optional Company** filter.
- **Generic Strict Title & Seniority Filtering**: Works across any target role you enter (e.g., *Associate Product Manager*, *Financial Analyst*, *Management Trainee*)—verifying core role keywords and automatically blocking unrequested higher-seniority titles (such as `Tech Lead`, `Lead`, `Senior`, `Principal`, `Staff`, `Director`, or `VP`).
- **Strict Experience Band Matching**: When you select an experience level (e.g., `Fresher / 0–1 years` or `1–3 years`), higher-experience and borderline mismatches are excluded automatically so only strict **Good Experience Matches** appear (with an optional toggle for unspecified postings).
- **Strict Posting Freshness Cutoffs & Empty-State Clarity**: Verifies listing posted dates on the backend against your selected **Posting Freshness** window (`Last 24 hours`, `Last 3 days`, `Last 7 days`, `Last 30 days`) and reports clearly whenever no latest posts exist for that role and timeframe.
- **Resilient GitHub Pages Authentication**: Seamless Firebase Authentication + Cloud Firestore sync backed by an automatic browser-local account fallback (including Sign Up, Sign In, and Password Reset) so static deployments never fail on missing or misconfigured keys.

See full details in [`CHANGELOG.md`](./CHANGELOG.md).

---

## 🧭 Executive Overview

MBA recruiting differs fundamentally from standard undergraduate or lateral job hunting. Campus recruiting cycles at premier business schools operate in compressed 60–90 day recruitment windows with extreme competition for high-paying roles across Management Consulting, Big Tech PM, and Investment Banking.

**Compass** bridges the gap between candidate background and recruiter expectations by combining structured diagnostic assessments, ATS-compliant resume engineering, precision multi-board job discovery, deterministic job description matching, and targeted networking tools into a unified operating system.

---

## 🚀 Key Modules & Architecture

### 1. 📊 Executive Candidate Dashboard
* **Blended MBA Readiness Index (0–100%)**: A composite mathematical readiness score aggregating resume ATS compliance (35%), role match keyword density (30%), diagnostic specialization calibration (20%), and networking pipeline (15%).
* **Peer Percentile Benchmarking**: Real-time standing benchmarked against top-tier MBA applicant cohorts.
* **4 Modular KPI Cards**: Dual visualization (SVG circular radial progress rings + dynamic horizontal progress bars) with direct one-click workflow actions.
* **Reset All Data**: Secure, confirmed in-app data wipe capability allowing candidates to reset progress back to a pristine baseline.

### 2. 🧭 Diagnostic Assessment
* **Track A — Personality & Leadership Archetypes**: Identifies core executive styles (*Strategic Generalist, Product Builder, Commercial Rainmaker, Operational Scaler*).
* **Track B — Dual Specialization Check**: Validates post-MBA focus across Marketing, Finance, Product, and Strategy.
* **Track C — Post-MBA Role Shortlist**: Maps career tracks with compensation bands, typical interview hurdles, and day-in-the-life benchmarks.
* **Track D — 90-Day Sprint & Readiness Calibration**: Step-by-step recruitment roadmap tailored to candidate timeline and experience level.

### 3. 📄 Resume Studio
* **Quantified XYZ Bullet Optimizer**: Enforces Google-style bullet discipline: *"Accomplished [X] as measured by [Y] by doing [Z]"*.
* **Live ATS Diagnostics**: Validates essential coordinates, action verbs, LinkedIn presence, and metric density against standard applicant tracking parser heuristics.
* **Instant Customization & PDF Export**: Executive single-column layout themes (`Classic`, `Modern`, `Minimal`), font scaling, and clean one-page PDF generation.

### 4. 🔍 Precision Live Job Search *(New)*
* **Role-First Multi-Board Discovery**: Searches Indeed India, Naukri, and public LinkedIn simultaneously with optional company scoping.
* **Deterministic Three-Gate Filtering**: Applies generic role-keyword & seniority guards, strict candidate experience verification, and backend `datePosted` freshness cutoffs (`24h`, `3d`, `7d`, `30d`, `any`).
* **Transparent Filter Diagnostics**: Summarizes exact exclusion counts by reason and explicitly informs candidates when no latest posts exist within a tight duration window.

### 5. 🎯 Job Description Matcher
* **Deterministic ATS Engine (`@veriworkly/ats-engine`)**: Compares candidate resume text against target job descriptions using a 70-term MBA taxonomy without generative AI hallucinations.
* **Actionable Gap Rewrites**: Surfaces required vs. preferred qualification matches and tailored phrasing adjustments.

### 6. 👥 People & Target Outreach
* **Boolean LinkedIn Search Specs**: Automatically constructs precision search queries for Alumni, Peers, and Hiring Managers.
* **High-Conversion Message Scripts**: Tested cold messaging templates calibrated for warm alumni coffee chats and lateral informational interviews.

### 7. 🏢 Company Interview Prep
* **Corporate Dossiers**: In-depth intelligence for 12 top MBA recruiters including McKinsey, BCG, Bain, Amazon, Flipkart, Swiggy, Goldman Sachs, HUL, and Deloitte.
* **Recruiter Insights**: Pay bands, typical interview rounds, culture ratings, insider tips, and common pitfalls to avoid.

---

## 🔒 Security, Authentication & Access Control

* **Zero-Leakage Route Protection**: In-app features and dashboard are strictly accessible to authenticated candidates. Unauthenticated requests on any device viewport are automatically redirected to the landing page.
* **Dual-Mode Auth & Persistence**: Seamlessly integrates Firebase Auth & Cloud Firestore for synced cloud sessions while falling back gracefully to browser-local SHA-256 accounts and `localStorage` caching on offline or static hosts.
* **Credential Hygiene**: Sensitive cloud credentials and configuration files are securely masked and excluded via `.gitignore`.
* **GDPR & Privacy Compliance**: Self-service permanent profile and data deletion (`Delete Account` modal) removes credentials and records cleanly.

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) · TypeScript · Functional Components · Hooks |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) · Custom Dark Palette (`#070B14`, `#0E1526`, `#00DF89`) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **ATS Matching Engine** | `@veriworkly/ats-engine` (Deterministic Rule-Based Scoring) |
| **Live Job Search API** | Python [FastAPI](https://fastapi.tiangolo.com/) · `python-jobspy` (Render Free ready) |
| **Authentication & DB** | [Firebase Auth](https://firebase.google.com/products/auth) & [Cloud Firestore](https://firebase.google.com/products/firestore) |
| **PDF Generation** | [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/) |

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js**: v20.0.0 or higher
* **Python**: 3.10+ (for the `company-jobs-service` Job Search microservice)

### Installation & Running Locally

1. **Install frontend/backend Node dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start the Python Live Job Search Microservice** (in terminal 1):
   ```bash
   cd company-jobs-service
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --host 127.0.0.1 --port 8001
   ```

3. **Start the Express + Vite Application Server** (in terminal 2):
   ```bash
   npm run dev
   ```
   The application runs at `http://localhost:3000` and proxies `/api/company-interview/openings/search` to the local Python service.

4. **Build & Type-Check for Production**:
   ```bash
   npm run build
   npm run lint
   ```

### GitHub Pages & Render Deployment
- **Static Frontend (`.github/workflows/deploy.yml`)**: Automatically builds and deploys `./dist` to GitHub Pages on pushes to `main`.
  - Add `VITE_FIREBASE_*` repository secrets/variables to enable Firebase Cloud Sync & Google Sign-In on GitHub Pages.
  - Deploy `company-jobs-service/` to **Render Free** (using `company-jobs-service/render.yaml`) and set `VITE_COMPANY_OPENINGS_API_URL` in GitHub Actions secrets/variables to enable live job search on the GitHub Pages URL.

---

## 📁 Project Structure

```text
├── .github/workflows/deploy.yml    # GitHub Pages automated CI/CD workflow
├── CHANGELOG.md                    # Release announcements & version history
├── company-jobs-service/           # Python FastAPI + JobSpy microservice (Render Free)
│   ├── main.py                     # Search API endpoints, timeouts & TTL cache
│   ├── normalizer.py               # Strict title/seniority, freshness & company gates
│   ├── experience_matcher.py       # Deterministic experience-band classifier
│   ├── render.yaml                 # Render Free deployment configuration
│   └── tests/                      # Python pytest verification suite
├── public/                         # Static assets & .nojekyll for GitHub Pages
├── src/
│   ├── components/                 # AuthModal, AccountMenu, Navigation, UI modals
│   ├── context/                    # AuthContext with Firebase + local fallback
│   ├── data/                       # MBA domains, roles, and 12 company dossiers
│   ├── lib/                        # Firebase client, storageService, ATS & Job Search APIs
│   ├── pages/                      # Landing, Home, Assess, ResumePage, JobSearch, Match, Target, Company
│   └── types/                      # TypeScript domain & Job Search contracts
├── tests/                          # Unit, parser & 18-pair ATS acceptance tests
├── server.ts                       # Express server & local Vite/JobSpy proxy
└── vite.config.ts                  # Vite build config (relative base for GitHub Pages)
```

---

## 📄 License

This software and its core intellectual property (including scoring algorithms, XYZ formulas, and assessment logic) are proprietary. All rights reserved.
