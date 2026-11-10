import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DOMAINS } from '../data/domains';
import { ROLES } from '../data/roles';
import { COMPANIES } from '../data/companies';

interface LandingProps {
  onNavigateTab: (tab: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigateTab }) => {
  const { user, openAuthModal } = useAuth();

  const handleModuleClick = (tab?: string) => {
    if (user && tab) {
      onNavigateTab(tab);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      openAuthModal('signin');
    }
  };

  // Simulator State
  const [activeSimTab, setActiveSimTab] = useState<'probe' | 'ats' | 'outreach'>('probe');
  const [probeStyle, setProbeStyle] = useState<'analytical' | 'commercial' | 'people' | 'execution'>('analytical');
  const [probeIndustry, setProbeIndustry] = useState<'tech' | 'fmcg' | 'finance' | 'consulting'>('tech');

  // Simulator: ATS Bullet
  const [bulletSampleIndex, setBulletSampleIndex] = useState(0);
  const sampleBullets = [
    {
      original: "Responsible for managing product launches and social media campaigns for the client.",
      status: "Weak",
      score: 38,
      critique: "Lacks metrics, action verb is passive ('Responsible for'), no business outcome or scale specified.",
      rewritten: "Spearheaded GTM strategy for 3 enterprise SaaS products, increasing quarterly trial conversion by 28% and driving $420K incremental ARR.",
    },
    {
      original: "Worked with cross-functional teams to improve supply chain inventory turnaround time.",
      status: "Average",
      score: 54,
      critique: "Shows team effort but does not quantify the reduction in days or working capital saved.",
      rewritten: "Orchestrated cross-functional inventory optimization across 4 regional hubs, slashing cycle time by 3.5 days and liberating ₹1.8 Cr in working capital.",
    },
    {
      original: "Helped finance team create quarterly financial models and budget variance reports.",
      status: "Weak",
      score: 42,
      critique: "Use strong ownership verbs ('Architected' / 'Streamlined') and specify portfolio size or forecast accuracy.",
      rewritten: "Engineered three-statement forecasting model for ₹120 Cr retail portfolio, reducing variance from 11% to 2.4% across 4 operating quarters.",
    },
  ];

  // Simulator: Outreach
  const [outreachTarget, setOutreachTarget] = useState<'alumni' | 'peer' | 'recruiter'>('alumni');
  const [outreachRole, setOutreachRole] = useState('Product Manager');
  const [outreachCompany, setOutreachCompany] = useState('Swiggy');
  const [copiedOutreach, setCopiedOutreach] = useState(false);

  const getOutreachTemplate = () => {
    if (outreachTarget === 'alumni') {
      return `Hi [First Name],

I noticed you also graduated from [Your B-School] and are now driving ${outreachRole} initiatives at ${outreachCompany}.

I am currently a second-year MBA candidate specializing in Product & Tech Strategy. I have been following ${outreachCompany}'s recent launch of [Recent Product/Feature] and found your team's approach to cross-dock efficiency fascinating.

Could I steal 10 minutes of your time next week for a brief informational chat on how the product culture has evolved at ${outreachCompany}? I would deeply appreciate your perspective.

Best regards,
[Your Name]`;
    } else if (outreachTarget === 'peer') {
      return `Hi [First Name],

I came across your profile while researching ${outreachCompany}'s ${outreachRole} team. Your work on [Specific Domain / Feature] really stood out.

I am preparing for upcoming post-MBA lateral hiring in this space. If your schedule allows, I'd love to ask two quick questions regarding the tech stack and day-to-day cross-functional dynamics on your team.

Thank you so much for your time!
[Your Name]`;
    } else {
      return `Hi [First Name],

I hope this week is treating you well. I am reaching out regarding the ${outreachRole} opening at ${outreachCompany} (Req ID: [Job ID]).

As an MBA candidate with [2-3 years] prior experience in technical project management and a track record of driving 25%+ adoption gains, I believe my background aligns well with your team's current quarterly objectives.

I have submitted my application via the portal and would welcome the opportunity to connect briefly if my profile matches your hiring priorities.

Warm regards,
[Your Name]`;
    }
  };

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSchool, setContactSchool] = useState('');
  const [contactIntent, setContactIntent] = useState('Student');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSaved, setContactSaved] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    const payload = {
      name: contactName,
      email: contactEmail,
      school: contactSchool,
      intent: contactIntent,
      message: contactMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('compass.contact.v1') || '[]');
      existing.push(payload);
      localStorage.setItem('compass.contact.v1', JSON.stringify(existing));
    } catch {
      // Local fallback
    }

    setContactSaved(true);

    const subject = encodeURIComponent(`Compass Enquiry from ${contactName} (${contactSchool || 'Candidate'})`);
    const body = encodeURIComponent(
      `Name: ${contactName}\nEmail: ${contactEmail}\nInstitution/School: ${contactSchool}\nRole: ${contactIntent}\n\nMessage:\n${contactMessage}`
    );
    window.location.href = `mailto:hello@compasscareer.org?subject=${subject}&body=${body}`;
  };

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does Cloud Sync work, and can I still use Compass without signing in?",
      a: "Compass provides a dual storage architecture. You can use every tool as a guest in offline mode using browser localStorage. When you sign in (via Google or Email/Password), Compass seamlessly connects to Firebase Firestore to securely persist your resumes, job descriptions, ATS match audits, and outreach pipelines across your phone, tablet, and laptop.",
    },
    {
      q: "Why does Compass use a Deterministic ATS Engine (@veriworkly/ats-engine) instead of generative AI?",
      a: "Generative LLMs hallucinate scores and give different advice every time you paste a resume. Compass uses the open-source @veriworkly/ats-engine deterministic model with a 70-term MBA taxonomy. It parses exact evidence units, measures required vs preferred qualifications, and calculates mathematical match probabilities exactly how real enterprise screening systems (Workday, Taleo, Greenhouse) behave.",
    },
    {
      q: "Will college placement cells and ATS systems accept resumes built in Compass?",
      a: "Yes, 100%. Resume Studio was built strictly to B-School placement committee standards: single-column ATS Classic, Executive, and Academic templates with clean typography and standard margins. It strictly prevents multi-column layouts, tables, and unreadable graphics that cause 75% of commercial resumes to fail ATS parsing.",
    },
    {
      q: "What email address can I use to create an account? Are university emails allowed?",
      a: "You can sign up with any permanent email address, including your official university domains (.edu, .ac.in, .edu.in), personal Gmail accounts, or corporate addresses. We bundle an open-source disposable email blocklist solely to prevent temporary throwaway spam services from abusing our sync engine.",
    },
    {
      q: "How does the Diagnostic Assessment compare to generic career tests or MBTI?",
      a: "General tests like MBTI or DISC give broad personality labels like 'INTJ' or 'Visionary' that tell you nothing about whether you should choose Corporate Finance over Product Management. Compass is engineered specifically for MBA career tracks (Marketing, Finance, Product, Consulting, Operations, HR, Sales, Analytics). It evaluates real workplace dilemmas, technical tool proficiency, case trade-offs, and outputs a concrete 90-day skill sprint.",
    },
    {
      q: "How does the LinkedIn People Map work without violating scraping policies?",
      a: "Compass never scrapes or automates requests against LinkedIn. Instead, we use deterministic search syntax (boolean operators, company IDs, seniority keywords, and school filters) to construct live LinkedIn query URLs. When you click, it opens LinkedIn in a new tab with the exact filtered talent pool ready for your outreach.",
    },
    {
      q: "Can I use Compass if I am still preparing for MBA entrances (CAT, GMAT, GRE)?",
      a: "Absolutely. Many aspirants use Compass during interview rounds (WAT/PI) to convincingly answer: 'Why this specialization?' and 'Where do you see yourself in 3 years?' Understanding specific roles and industry compensation gives you an immediate competitive edge over candidates with generic answers.",
    },
  ];

  return (
    <div className="bg-[#070B14] text-slate-100 min-h-screen selection:bg-[#00DF89] selection:text-slate-950 font-sans">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-800/80 bg-gradient-to-b from-[#0B111E] via-[#070B14] to-[#070B14]">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Pitch & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#00DF89]">
                <span className="w-2 h-2 rounded-full bg-[#00DF89] animate-pulse" />
                <span>THE CAREER OPERATING SYSTEM FOR MBAS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Stop guessing your MBA career. <br />
                <span className="bg-gradient-to-r from-emerald-400 via-[#00DF89] to-teal-300 bg-clip-text text-transparent">
                  Decide with empirical certainty.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Calibrate your specialization with 24 behavioral archetypes, audit your resume against placement committee ATS benchmarks using a deterministic engine, and sync your entire candidate pipeline across devices.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => handleModuleClick('assess')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] transition-all shadow-lg shadow-emerald-950/40 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Diagnostic Free</span>
                  <span className="text-base">→</span>
                </button>
                <button
                  onClick={() => handleModuleClick('home')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all hover:border-slate-600 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Enter Dashboard</span>
                </button>
              </div>

              {/* Proof badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#00DF89] font-bold">✓</span>
                  <span>Deterministic ATS Engine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#00DF89] font-bold">✓</span>
                  <span>Cloud Persistence & Sync</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#00DF89] font-bold">✓</span>
                  <span>B-School Approved Formats</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#00DF89] font-bold">✓</span>
                  <span>Zero AI Hallucinations</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live Product Mock */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl backdrop-blur-xl space-y-5">
                {/* Window header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">compass.preview.live</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                    Live Telemetry
                  </span>
                </div>

                {/* Mock Item 1: Domain Fit Bars */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200">Domain Calibration</span>
                    <span className="text-[#00DF89] font-mono">Top: Product & Tech</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-0.5">
                        <span>Product Management & Tech</span>
                        <span className="font-bold text-white">88%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-[#00DF89] rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-0.5">
                        <span>Management Consulting</span>
                        <span className="font-bold text-slate-300">79%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: '79%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-0.5">
                        <span>Marketing & Brand Growth</span>
                        <span className="font-bold text-slate-400">64%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-slate-600 rounded-full" style={{ width: '64%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Item 2: Readiness Ring & Target Role */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Target Role</div>
                    <div className="text-sm font-bold text-white">Product Manager (Tech)</div>
                    <div className="text-xs text-emerald-400 font-medium mt-0.5">₹25–45 LPA · 14 Recruiter Dossiers</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#00DF89]">82<span className="text-sm font-normal text-slate-400">/100</span></div>
                    <span className="text-[10px] font-bold text-emerald-300">
                      INTERVIEW READY
                    </span>
                  </div>
                </div>

                {/* Mock Item 3: ATS & Networking Chips */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Deterministic ATS Benchmark</span>
                    <span className="text-emerald-400 text-[11px] font-semibold">@veriworkly/ats-engine</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="text-emerald-300 font-medium">✓ PRD Roadmapping (Evidenced)</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-amber-300 font-medium">! SQL Cohort Retention (Can Improve)</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-rose-300 font-medium">✕ A/B Experimentation (Missing)</span>
                  </div>
                </div>

                {/* Mock Item 4: LinkedIn Outreach Card */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-900/60 text-blue-400 flex items-center justify-center font-bold text-xs">
                      in
                    </div>
                    <div>
                      <div className="font-semibold text-white">Siddharth N. · Sr. PM @ Swiggy</div>
                      <div className="text-[10px] text-slate-400">Alumni connection · 82% reply probability</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleModuleClick('target')}
                    className="text-[11px] font-bold text-[#00DF89] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Open Template →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS SECTION */}
      <section id="pain-points" className="py-20 border-b border-slate-800/80 bg-[#070B14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              The Reality Check
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Designed backwards from the 6 traps that derail MBA candidates
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Every feature in Compass was built to neutralize a specific, painful failure mode observed during summer and final placements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Trap 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 font-bold text-lg">
                1
              </div>
              <h3 className="text-base font-bold text-white">Specialization Doubts & Herd Mentality</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                First-year MBAs pick finance or marketing because their hostel wing is doing it, ignoring that their actual cognitive wiring thrives in product strategy or consulting operations.
              </p>
              <div className="pt-2 text-xs font-medium text-emerald-400">
                → Compass Solution: 4-track diagnostic with real-life scenario dilemmas.
              </div>
            </div>

            {/* Trap 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 font-bold text-lg">
                2
              </div>
              <h3 className="text-base font-bold text-white">The "Only 4 Job Titles" Blindspot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Most graduates only apply to 'Consultant', 'Product Manager', or 'Brand Manager'. Over 35 high-paying specialized roles (PMM, FP&A, Category Growth, BizOps) go unconsidered.
              </p>
              <div className="pt-2 text-xs font-medium text-emerald-400">
                → Compass Solution: 19+ curated MBA role profiles with exact skills and day-in-the-life specs.
              </div>
            </div>

            {/* Trap 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 font-bold text-lg">
                3
              </div>
              <h3 className="text-base font-bold text-white">The ATS Screening Black Hole</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                75% of applications are rejected before reaching a human recruiter. Two-column Canva graphics fail enterprise parsers like Workday and Taleo.
              </p>
              <div className="pt-2 text-xs font-medium text-emerald-400">
                → Compass Solution: Placement-committee approved single-column ATS Classic layout & @veriworkly/ats-engine checks.
              </div>
            </div>

            {/* Trap 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 font-bold text-lg">
                4
              </div>
              <h3 className="text-base font-bold text-white">Unquantified "Google XYZ" Bullet Failure</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Writing bullets like 'Managed social media campaigns' instead of 'Accomplished [X] as measured by [Y] by doing [Z]'. Placement committee reviewers reject passive bullets instantly.
              </p>
              <div className="pt-2 text-xs font-medium text-emerald-400">
                → Compass Solution: Live bullet quantification auditor with instant XYZ metric rewrites.
              </div>
            </div>

            {/* Trap 5 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 font-bold text-lg">
                5
              </div>
              <h3 className="text-base font-bold text-white">Cold Outreach Silence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Candidates spam recruiters on LinkedIn with generic pleas ('Please refer me'). Response rate is under 3%. Senior alumni ignore unfocused requests.
              </p>
              <div className="pt-2 text-xs font-medium text-emerald-400">
                → Compass Solution: Precision Boolean LinkedIn queries and 3-step calibrated message sequences for Alumni, Peers, and Hiring Managers.
              </div>
            </div>

            {/* Trap 6 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 font-bold text-lg">
                6
              </div>
              <h3 className="text-base font-bold text-white">Device Lock-In & Lost Placement Notes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drafting resumes and JD notes on hostel desktops only to find them inaccessible during campus interviews or when switching devices.
              </p>
              <div className="pt-2 text-xs font-medium text-emerald-400">
                → Compass Solution: Firebase Auth & Firestore cloud sync for seamless continuity across desktop, phone, and tablet.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REAL-WORLD MBA USECASES SECTION */}
      <section className="py-20 border-b border-slate-800/80 bg-[#0B111E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00DF89]">
              Real-World Scenarios
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Built for every stage of your MBA journey
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              See how candidates at premier business schools use Compass to navigate critical placement milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Case 1 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-emerald-400 uppercase tracking-wider">Usecase 01</span>
                <span>Term 1 Orientation</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                The Engineer Pivoting into Product Management
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Situation:</strong> Rohan had 3 years of backend engineering experience at an IT firm. He wanted to transition into Tech Product Management but was unsure whether his cognitive profile suited PM or Management Consulting.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>How Compass Delivered:</strong> Track A Diagnostic calibrated his trade-off wiring as 'Product & Tech' (88% fit). In Resume Studio, the Google XYZ bullet auditor transformed technical bug-fix bullets into commercial metrics (e.g. driving conversion and ARR). He verified his profile against Swiggy and Uber PM JDs with the deterministic ATS matcher before summer shortlisting.
              </p>
            </div>

            {/* Case 2 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-emerald-400 uppercase tracking-wider">Usecase 02</span>
                <span>Summer Placements</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                The Lateral Hire Targeting Strategy Consulting (MBB)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Situation:</strong> Ananya joined business school with prior analytics experience. She wanted a front-end strategy consulting role at McKinsey or BCG but worried about case structure readiness and recruiter fit.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>How Compass Delivered:</strong> Track D Role Readiness scored her problem-structuring and synthesis strengths, generating a concrete 90-day case sprint. In Company Prep, she explored McKinsey's exact round formats and PE/Strategy practice expectations. She then used People Map to connect with alumni Engagement Managers for mock case prep.
              </p>
            </div>

            {/* Case 3 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-emerald-400 uppercase tracking-wider">Usecase 03</span>
                <span>Pre-Placement Offers</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                The Dual-Specialization Conflict (Marketing vs Finance)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Situation:</strong> Kabir loved consumer brand psychology but also scored high in quantitative finance courses. He was torn on elective bidding and which corporate day-zero shortlists to pursue.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>How Compass Delivered:</strong> Track B Diagnostic stress-tested his conflict points through forced workplace dilemmas (analytical vs creative vs risk tolerance), confirming Brand Management and Category Growth as his strongest sustainable career trajectory.
              </p>
            </div>

            {/* Case 4 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-emerald-400 uppercase tracking-wider">Usecase 04</span>
                <span>Off-Campus & Lateral Hiring</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                The High-Conversion LinkedIn Cold Outreach Campaign
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Situation:</strong> Priya was targeting senior lateral positions at high-growth startups and wanted direct access to VP of Growth and Director of Operations leaders rather than waiting on job portals.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>How Compass Delivered:</strong> People Map generated Boolean LinkedIn queries targeting B-School alumni and hiring managers in Bangalore and Gurgaon. She used the 3-step cold sequence template to initiate informational conversations, achieving a 42% reply rate without triggering LinkedIn spam flags.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE INTERACTIVE SIMULATORS */}
      <section id="simulators" className="py-20 border-b border-slate-800/80 bg-[#070B14]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00DF89]">
              Experience It Now
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Test three core engines right in your browser
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Interactive simulators showcasing the empirical calibration powering our full application suite.
            </p>
          </div>

          {/* Simulator Tabs */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto">
            <button
              onClick={() => setActiveSimTab('probe')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeSimTab === 'probe' ? 'bg-[#00DF89] text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Behavioral Probe
            </button>
            <button
              onClick={() => setActiveSimTab('ats')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeSimTab === 'ats' ? 'bg-[#00DF89] text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              2. ATS Bullet Auditor
            </button>
            <button
              onClick={() => setActiveSimTab('outreach')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeSimTab === 'outreach' ? 'bg-[#00DF89] text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Cold Outreach
            </button>
          </div>

          {/* Simulator Card Window */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
            {/* TAB 1: Behavioral Probe */}
            {activeSimTab === 'probe' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Behavioral Specialization Matcher</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select your dominant cognitive preference and target industry sector to see empirical track recommendations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Style selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Your Working Style Preference</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'analytical', label: 'Quantitative & Analytical' },
                        { id: 'commercial', label: 'Commercial & Deal-driven' },
                        { id: 'people', label: 'Brand & Cross-functional' },
                        { id: 'execution', label: 'Product & Systems-focus' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setProbeStyle(item.id as any)}
                          className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                            probeStyle === item.id
                              ? 'bg-emerald-950/70 border-[#00DF89] text-white font-bold'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Industry selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Target Industry Sector</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'tech', label: 'Technology & SaaS' },
                        { id: 'consulting', label: 'Strategy Consulting' },
                        { id: 'finance', label: 'Corporate Finance & IB' },
                        { id: 'fmcg', label: 'Consumer & Retail (FMCG)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setProbeIndustry(item.id as any)}
                          className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                            probeIndustry === item.id
                              ? 'bg-emerald-950/70 border-[#00DF89] text-white font-bold'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Probe Output */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Recommended MBA Role Track
                    </span>
                    <div className="text-base font-bold text-[#00DF89] mt-0.5">
                      {probeStyle === 'execution' && probeIndustry === 'tech' && 'Product Management (Tech PM)'}
                      {probeStyle === 'analytical' && probeIndustry === 'consulting' && 'Strategy & Management Consulting'}
                      {probeStyle === 'commercial' && probeIndustry === 'finance' && 'Investment Banking / Corporate Finance'}
                      {probeStyle === 'people' && probeIndustry === 'fmcg' && 'Brand Management & Category Growth'}
                      {![
                        'execution-tech',
                        'analytical-consulting',
                        'commercial-finance',
                        'people-fmcg',
                      ].includes(`${probeStyle}-${probeIndustry}`) && `${probeIndustry.toUpperCase()} Specialized Track`}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Focus on building demonstrable proof in data synthesis, cross-functional execution, and commercial modeling.
                    </p>
                  </div>
                  <button
                    onClick={() => handleModuleClick('assess')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] whitespace-nowrap cursor-pointer"
                  >
                    Take Full Assessment →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ATS Bullet Tester */}
            {activeSimTab === 'ats' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Google XYZ Bullet Formula Validator</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    See how weak, passive resume bullets are audited and transformed into quantified impact statements.
                  </p>
                </div>

                {/* Sample selector */}
                <div className="flex flex-wrap gap-2">
                  {sampleBullets.map((b, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBulletSampleIndex(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        bulletSampleIndex === idx
                          ? 'bg-[#00DF89] text-slate-950 font-bold'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Sample Bullet #{idx + 1}
                    </button>
                  ))}
                </div>

                {/* Bullet Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400">Original Bullet (Passive)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        Score: {sampleBullets[bulletSampleIndex].score}/100
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic bg-slate-950/50 p-3 rounded-xl border border-rose-950">
                      "{sampleBullets[bulletSampleIndex].original}"
                    </p>
                    <p className="text-[11px] text-rose-300">
                      ⚠️ <span className="font-semibold">Critique:</span> {sampleBullets[bulletSampleIndex].critique}
                    </p>
                  </div>

                  {/* After */}
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#00DF89]">Quantified XYZ Formula</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Score: 94/100 · ATS Verified
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200 font-medium bg-slate-950/70 p-3 rounded-xl border border-emerald-950">
                      "{sampleBullets[bulletSampleIndex].rewritten}"
                    </p>
                    <p className="text-[11px] text-emerald-300">
                      ✓ <span className="font-semibold">Included:</span> Strong active verb, concrete metric (% & currency), clear business lever.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    onClick={() => handleModuleClick('resume')}
                    className="text-xs font-bold text-[#00DF89] hover:underline cursor-pointer"
                  >
                    Open Resume Studio & Audit All Bullets →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Cold Outreach */}
            {activeSimTab === 'outreach' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Calibrated LinkedIn Cold Outreach Sequence</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select your target connection tier to preview tested informational message sequences.
                  </p>
                </div>

                {/* Target selector */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                    {(['alumni', 'peer', 'recruiter'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setOutreachTarget(t)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                          outreachTarget === t
                            ? 'bg-[#00DF89] text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t === 'alumni' ? 'Campus Alumni' : t === 'peer' ? 'Domain Peer' : 'Hiring Leader'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Target Role:</span>
                    <input
                      type="text"
                      value={outreachRole}
                      onChange={(e) => setOutreachRole(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00DF89]"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Target Firm:</span>
                    <input
                      type="text"
                      value={outreachCompany}
                      onChange={(e) => setOutreachCompany(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00DF89]"
                    />
                  </div>
                </div>

                {/* Output message */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Generated LinkedIn Note:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getOutreachTemplate());
                        setCopiedOutreach(true);
                        setTimeout(() => setCopiedOutreach(false), 2000);
                      }}
                      className="text-xs font-bold text-[#00DF89] hover:underline cursor-pointer"
                    >
                      {copiedOutreach ? '✓ Copied to Clipboard!' : 'Copy Template'}
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                    {getOutreachTemplate()}
                  </pre>
                </div>

                <div className="text-right">
                  <button
                    onClick={() => handleModuleClick('target')}
                    className="text-xs font-bold text-[#00DF89] hover:underline cursor-pointer"
                  >
                    Open People & Target Outreach Map →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PRODUCT MODULES SECTION */}
      <section id="tools" className="py-20 border-b border-slate-800/80 bg-[#0B111E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00DF89]">
              The Modular Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Six synchronized modules for the complete placement cycle
            </h2>
            <p className="text-sm text-slate-400">
              Each module answers one high-stakes decision and securely persists its structured output across your devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tool 1 */}
            <div 
              onClick={() => handleModuleClick('assess')}
              className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-[#00DF89] transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                  🧭
                </div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Module 1</div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#00DF89] transition-colors">Diagnostic Assessment</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Four targeted tracks: 24 behavioral archetypes, dual specialization conflict checks, role ranking, and 90-day action plans.
                </p>
                <div className="pt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                  <strong className="text-white">What it does:</strong> Identifies your authentic cognitive wiring and resolves elective dilemma with real scenarios.
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModuleClick('assess');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] transition-all cursor-pointer"
              >
                Launch Assessment →
              </button>
            </div>

            {/* Tool 2 */}
            <div 
              onClick={() => handleModuleClick('resume')}
              className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-[#00DF89] transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                  📄
                </div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Module 2</div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#00DF89] transition-colors">Resume Studio & ATS Audit</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Three placement committee templates (ATS Classic, Modern, Minimal), Google XYZ bullet formula validator, live PDF rendering, and plain text export.
                </p>
                <div className="pt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                  <strong className="text-white">What it does:</strong> Audits each bullet for XYZ metrics and formats single-column layouts that never break ATS parsers.
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModuleClick('resume');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] transition-all cursor-pointer"
              >
                Open Resume Studio →
              </button>
            </div>

            {/* Tool 3 */}
            <div 
              onClick={() => handleModuleClick('match')}
              className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-[#00DF89] transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                  🎯
                </div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Module 3</div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#00DF89] transition-colors">Deterministic Job Matcher</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Powered by @veriworkly/ats-engine. Evaluates candidate evidence against required vs preferred qualifications using a 70-term MBA taxonomy.
                </p>
                <div className="pt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                  <strong className="text-white">What it does:</strong> Delivers reproducible pass probabilities and gap rewrites without generative AI hallucinations.
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModuleClick('match');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] transition-all cursor-pointer"
              >
                Scan Job Description →
              </button>
            </div>

            {/* Tool 4 */}
            <div 
              onClick={() => handleModuleClick('target')}
              className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-[#00DF89] transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                  👥
                </div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Module 4</div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#00DF89] transition-colors">People Map & Target Outreach</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generates 6 precision LinkedIn search queries for Alumni, Peers, and Hiring Managers. Writes cold outreach sequences with reply-stage tracker.
                </p>
                <div className="pt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                  <strong className="text-white">What it does:</strong> Converts broad networking into target boolean search links and calibrated follow-up drafts.
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModuleClick('target');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] transition-all cursor-pointer"
              >
                Build People Map →
              </button>
            </div>

            {/* Tool 5 */}
            <div 
              onClick={() => handleModuleClick('company')}
              className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-[#00DF89] transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                  🏢
                </div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Module 5</div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#00DF89] transition-colors">Company Intelligence & Prep</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dossiers on 12 top MBA recruiters (MBB, Big 4, Amazon, HUL, Swiggy). Hiring rounds, compensation bands, culture ratings, and review theme parser.
                </p>
                <div className="pt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                  <strong className="text-white">What it does:</strong> Eliminates Glassdoor noise by isolating team reality, travel frequency, and promotion timelines.
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModuleClick('company');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] transition-all cursor-pointer"
              >
                Explore Companies →
              </button>
            </div>

            {/* Tool 6: Integrated Dashboard & Cloud Sync */}
            <div 
              onClick={() => handleModuleClick('home')}
              className="p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 hover:border-[#00DF89] transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                  ☁️
                </div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Module 6</div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#00DF89] transition-colors">Cloud Sync & Candidate OS</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Powered by Firebase Authentication and Firestore. Access and edit all your resumes, reports, and target jobs across any device seamlessly.
                </p>
                <div className="pt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                  <strong className="text-white">What it does:</strong> Secures your candidate documents with user-level ABAC isolation while retaining instant offline local support.
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModuleClick('home');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] transition-all cursor-pointer"
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section id="comparison" className="py-20 border-b border-slate-800/80 bg-[#070B14]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00DF89]">
              Direct Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Why MBA candidates choose Compass
            </h2>
            <p className="text-sm text-slate-400">
              How Compass compares against standard job portals, commercial resume generators, and career influencers.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-300">
                  <th className="p-4 sm:p-5 font-bold">Feature / Dimension</th>
                  <th className="p-4 sm:p-5 font-black text-[#00DF89] bg-emerald-950/30">Compass OS</th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-400">Standard Job Boards</th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-400">Generic Resume Builders</th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-400">Career Influencers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">ATS Matching Engine</td>
                  <td className="p-4 sm:p-5 font-bold text-[#00DF89] bg-emerald-950/20">
                    Deterministic (@veriworkly/ats-engine) with 70-term MBA taxonomy & real evidence units
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">Basic keyword counter (unhelpful)</td>
                  <td className="p-4 sm:p-5 text-slate-400">Black-box LLM hallucinations</td>
                  <td className="p-4 sm:p-5 text-slate-400">None</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">Cloud Sync & Persistence</td>
                  <td className="p-4 sm:p-5 font-bold text-[#00DF89] bg-emerald-950/20">
                    Firebase Auth + Firestore cloud sync with full offline local fallback
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">Tied to corporate portal profile</td>
                  <td className="p-4 sm:p-5 text-slate-400">Locked behind paid subscription</td>
                  <td className="p-4 sm:p-5 text-slate-400">None</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">Resume Formatting</td>
                  <td className="p-4 sm:p-5 font-bold text-[#00DF89] bg-emerald-950/20">
                    B-School Placement Classic, Google XYZ bullet validator, single-column ATS export
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">None</td>
                  <td className="p-4 sm:p-5 text-slate-400">Two-column templates that fail ATS parsers</td>
                  <td className="p-4 sm:p-5 text-slate-400">Static PDF examples</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">Specialization Diagnostics</td>
                  <td className="p-4 sm:p-5 font-bold text-[#00DF89] bg-emerald-950/20">
                    4 Tracks, 24 Archetypes, Dual Conflict Checks, 90-day action plans
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">Keyword search only</td>
                  <td className="p-4 sm:p-5 text-slate-400">None</td>
                  <td className="p-4 sm:p-5 text-slate-400">Generic opinion videos</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">LinkedIn Outreach Strategy</td>
                  <td className="p-4 sm:p-5 font-bold text-[#00DF89] bg-emerald-950/20">
                    Boolean query formulas for Alumni/Hiring Mgrs + calibrated cold templates
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">Expensive InMail credits</td>
                  <td className="p-4 sm:p-5 text-slate-400">None</td>
                  <td className="p-4 sm:p-5 text-slate-400">Generic cold email advice</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">Student Cost & Privacy</td>
                  <td className="p-4 sm:p-5 font-bold text-[#00DF89] bg-emerald-950/20">
                    100% Student-First, strict per-user data isolation, no data selling
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">Ad tracking & data sharing</td>
                  <td className="p-4 sm:p-5 text-slate-400">$19–$30/mo surprise renewals</td>
                  <td className="p-4 sm:p-5 text-slate-400">₹15,000–₹50,000 bootcamps</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Three Core Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-emerald-400 font-bold text-sm">Principle 1: Mathematical Rigor</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every calculation is inspectable. You can verify the exact skill weights, evidence units, and rubrics in our open test suite.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-emerald-400 font-bold text-sm">Principle 2: Zero Scraping & Safety</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                We never scrape LinkedIn behind paywalls. We generate calibrated search URLs so you explore safely on official platforms.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-emerald-400 font-bold text-sm">Principle 3: Student-First Data Freedom</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Explore in full offline guest mode or sign in to sync across your devices. Your resumes and notes belong exclusively to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 border-b border-slate-800/80 bg-[#0B111E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-400">
              Clear, transparent answers about Compass, deterministic ATS matching, cloud sync, and data privacy.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-white text-sm hover:text-[#00DF89] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-lg text-slate-400 font-mono">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTACT / ENQUIRY SECTION */}
      <section id="contact" className="py-20 bg-[#070B14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00DF89]">
              Get In Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Institutional Enquiries & Candidate Support
            </h2>
            <p className="text-sm text-slate-400">
              Placement cell representative, B-School coordinator, or candidate with feedback? Send us a direct dispatch.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
            {contactSaved ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-800 text-[#00DF89] text-2xl flex items-center justify-center mx-auto">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white">Enquiry Saved & Dispatched</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your message has been loaded into your default email client. We respond to all MBA academic and candidate queries within 24 hours.
                </p>
                <button
                  onClick={() => setContactSaved(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-[#00DF89] cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00DF89]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Your Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya.sharma@iima.ac.in"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00DF89]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">B-School / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. IIM Ahmedabad / ISB / XLRI"
                      value={contactSchool}
                      onChange={(e) => setContactSchool(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00DF89]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">I am reaching out as a:</label>
                    <select
                      value={contactIntent}
                      onChange={(e) => setContactIntent(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00DF89]"
                    >
                      <option value="Student">Current MBA Candidate</option>
                      <option value="Aspirant">MBA Aspirant (CAT/GMAT prep)</option>
                      <option value="PlacementCell">Placement Committee / Career Cell</option>
                      <option value="Faculty">Faculty / Career Advisor</option>
                      <option value="Recruiter">Corporate Recruiter</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Your Message or Feedback *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your placement season timeline or institution requirements..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00DF89]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500">
                    🔒 Client-side validation. Generates a pre-filled email to hello@compasscareer.org.
                  </span>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] transition-all cursor-pointer shadow-md"
                  >
                    Submit Enquiry & Dispatch →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-800 bg-[#070B14] text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#00DF89] text-[#070B14] flex items-center justify-center font-black text-xs">
                  ◬
                </div>
                <span className="text-base font-black text-white">Compass</span>
              </div>
              <p className="text-xs text-slate-400">
                The Career Operating System for MBA Students, Aspirants & Placement Committees.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs">
              <button onClick={() => handleModuleClick('assess')} className="hover:text-white transition-colors cursor-pointer">
                Diagnostic Assessment
              </button>
              <button onClick={() => handleModuleClick('resume')} className="hover:text-white transition-colors cursor-pointer">
                Resume Studio
              </button>
              <button onClick={() => handleModuleClick('match')} className="hover:text-white transition-colors cursor-pointer">
                Job Matcher
              </button>
              <button onClick={() => handleModuleClick('target')} className="hover:text-white transition-colors cursor-pointer">
                People Map
              </button>
              <button onClick={() => handleModuleClick('company')} className="hover:text-white transition-colors cursor-pointer">
                Company Prep
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>© {new Date().getFullYear()} Compass Career Operating System. Built with full candidate privacy.</div>
            <div className="flex items-center gap-4">
              <span className="text-emerald-500 font-semibold">Deterministic Scoring Engine</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
