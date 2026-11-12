# Compass — MBA Career Operating System

> **The executive career preparation platform engineered specifically for MBA students, alumni, and candidates targeting top-tier consulting (MBB), high-growth product management, corporate finance, and executive operations.**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-00DF89?style=flat-square)](#license)

---

## 🧭 Executive Overview

MBA recruiting differs fundamentally from standard undergraduate or lateral job hunting. Campus recruiting cycles at premier business schools operate in compressed 60–90 day recruitment windows with extreme competition for high-paying roles across Management Consulting, Big Tech PM, and Investment Banking.

**Compass** bridges the gap between candidate background and recruiter expectations by combining structured diagnostic assessments, ATS-compliant resume engineering, semantic job description matching, and targeted networking tools into a unified operating system.

---

## 🚀 Key Modules & Architecture

### 1. 📊 Executive Candidate Dashboard
* **Blended MBA Readiness Index (0–100%)**: A composite mathematical readiness score aggregating resume ATS compliance (35%), role match keyword density (30%), diagnostic specialization calibration (20%), and networking pipeline (15%).
* **Peer Percentile Benchmarking**: Real-time standing benchmarked against top-tier MBA applicant cohorts.
* **4 Modular KPI Cards**: Dual visualization (SVG circular radial progress rings + dynamic horizontal progress bars) with direct one-click workflow actions.
* **Prioritized Action Queue**: Dynamically computed recommendations identifying immediate, high-impact fixes (e.g., quantifying unmeasured resume bullets, missing JD keywords).
* **Reset All Data**: Secure, confirmed in-app data wipe capability allowing candidates to reset progress back to a pristine baseline.

### 2. 🧭 Diagnostic Assessment
* **Track A — Personality & Leadership Archetypes**: Identifies core executive styles (*Strategic Generalist, Product Builder, Commercial Rainmaker, Operational Scaler*).
* **Track B — Dual Specialization Check**: Validates post-MBA focus across Marketing, Finance, Product, and Strategy.
* **Track C — Post-MBA Role Shortlist**: Maps career tracks with compensation bands, typical interview hurdles, and day-in-the-life benchmarks.
* **Track D — 90-Day Sprint & Readiness Calibration**: Step-by-step recruitment roadmap tailored to candidate timeline and experience level.

### 3. 📄 Resume Studio
* **Quantified XYZ Bullet Optimizer**: Enforces Google-style bullet discipline: *"Accomplished [X] as measured by [Y] by doing [Z]"*.
* **Live ATS Diagnostics**: Validates essential coordinates, action verbs, LinkedIn presence, and metric density against standard applicant tracking parser heuristics.
* **Instant Customization & PDF Export**: Executive layout themes, font scaling, accent selection, and clean one-page PDF generation.

### 4. 🎯 Job Description Matcher
* **Recruiter Keyword Gap Engine**: Compares candidate resume text against target job descriptions to surface critical keyword matches and missing domain proficiencies.
* **Recommended Bullet Rewrites**: Offers tailored phrasing adjustments to elevate resume visibility in recruiter screening tools.

### 5. 👥 People & Target Outreach
* **Boolean LinkedIn Search Specs**: Automatically constructs precision search queries for Alumni, Peers, and Hiring Managers.
* **High-Conversion Message Scripts**: Tested cold messaging templates calibrated for warm alumni coffee chats and lateral informational interviews.

### 6. 🏢 Company Interview Intelligence
* **Corporate Dossiers**: In-depth intelligence for top employers including McKinsey, BCG, Bain, Google, Amazon, Microsoft, and high-growth unicorns.
* **Recruiter Insights**: Compensation breakdowns, culture notes, interview formats (case study vs. behavioral), and common preparation pitfalls.

---

## 🔒 Security, Authentication & Access Control

* **Zero-Leakage Route Protection**: In-app features and dashboard are strictly accessible to authenticated candidates. Unauthenticated requests on any device viewport are automatically redirected to the secure landing page.
* **Dual-Mode Persistence**: Seamlessly transitions between Firebase Cloud Firestore (for synced sessions) and local storage caching for offline resilience.
* **Credential Hygiene**: Sensitive cloud credentials and configuration files are securely masked and excluded via `.gitignore`.
* **GDPR & Privacy Compliance**: Self-service permanent profile and data deletion (`Delete Account` modal) removes credentials and records from Firestore.

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [React 18](https://react.dev/) · Functional Components · Hooks |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict typing) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) · Custom Dark Palette (`#070B14`, `#0E1526`, `#00DF89`) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Authentication** | [Firebase Auth](https://firebase.google.com/products/auth) (Google OAuth & Email/Password) |
| **Database** | [Firebase Cloud Firestore](https://firebase.google.com/products/firestore) |
| **PDF Generation** | [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/) |

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/compass-mba-career-os.git
   cd compass-mba-career-os
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy the example configuration to initialize your environment variables:
   ```bash
   cp firebase-applet-config.example.json firebase-applet-config.json
   ```
   *(Optional)* Populate with your Firebase Project credentials if cloud synchronization is desired.

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be running locally at `http://localhost:3000`.

5. **Build for Production**:
   ```bash
   npm run build
   ```

6. **Validate Type Checking & Linting**:
   ```bash
   npm run lint
   ```

---

## 📁 Project Structure

```
├── public/                 # Static assets & public images
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AccountMenu.tsx           # User profile menu & sign-out
│   │   ├── AuthModal.tsx             # Sign in & registration modal
│   │   ├── DeleteAccountModal.tsx    # GDPR account & data deletion
│   │   ├── Navigation.tsx            # Responsive desktop/mobile header
│   │   └── ...
│   ├── context/            # React context providers
│   │   └── AuthContext.tsx           # Firebase Auth state & fallbacks
│   ├── data/               # Reference datasets (companies, roles, domains)
│   ├── lib/                # Business logic & utilities
│   │   ├── firebaseClient.ts         # Firebase initialization
│   │   ├── storageService.ts         # Dual-mode cloud/local storage
│   │   ├── resume.ts                 # ATS validation rules & sample data
│   │   ├── jd.ts                     # Job Match keyword engine
│   │   └── target.ts                 # LinkedIn boolean query generator
│   ├── pages/              # Routed view controllers
│   │   ├── Landing.tsx               # Public landing page with simulators
│   │   ├── Home.tsx                  # Executive Candidate Dashboard
│   │   ├── Assess.tsx                # 4-track diagnostic assessment
│   │   ├── ResumePage.tsx            # Resume Studio & PDF generator
│   │   ├── Match.tsx                 # Job Description Matcher
│   │   ├── Target.tsx                # Networking & Outreach tools
│   │   └── Company.tsx               # Company Intelligence dossiers
│   ├── App.tsx             # Root router with strict auth gating
│   ├── main.tsx            # Vite DOM entry point
│   └── types.ts            # Master TypeScript interfaces
├── package.json            # Project dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
└── README.md               # Product documentation
```

---

## 📄 License

This software and its core intellectual property (including scoring algorithms, XYZ formulas, and assessment logic) are proprietary. All rights reserved.
