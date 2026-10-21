import React, { useState } from 'react';
import { COMPANIES } from '../data/companies';
import { DOMAINS } from '../data/domains';
import { QUESTIONS } from '../data/questions';
import { ROLES } from '../data/roles';
import { ResumeData } from '../types';

interface LandingProps {
  onStartAssessment: () => void;
  onNavigateTab: (tab: string) => void;
  onApplyParsedResume?: (resume: ResumeData) => void;
}

export const Landing: React.FC<LandingProps> = ({
  onStartAssessment,
  onNavigateTab,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Live Simulator state
  const [activeSimTool, setActiveSimTool] = useState<number>(0);
  const [simSelectedOption, setSimSelectedOption] = useState<string | null>('opt_a');
  const [simMetricSampleIndex, setSimMetricSampleIndex] = useState<number>(1);
  const [simJdIndex, setSimJdIndex] = useState<number>(0);
  const [simOutreachType, setSimOutreachType] = useState<'peer' | 'leader' | 'alumni'>('peer');
  const [simCompanyId, setSimCompanyId] = useState<string>('mckinsey');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSchool, setContactSchool] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    try {
      const existing = JSON.parse(localStorage.getItem('compass.contact.v1') || '[]');
      existing.push({
        name: contactName,
        email: contactEmail,
        schoolOrDomain: contactSchool,
        message: contactMessage,
        date: new Date().toISOString(),
      });
      localStorage.setItem('compass.contact.v1', JSON.stringify(existing));
    } catch {
      // ignore
    }

    setContactSubmitted(true);
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const faqs = [
    {
      q: 'How does uploading my resume auto-fill the fields?',
      a: 'Compass features a client-side parser that reads your PDF or text resume directly inside your browser. It automatically extracts your name, email, phone, work experience, bullet points, education, and skills into standard ATS fields. You can then edit any field and immediately benchmark it against job descriptions.',
    },
    {
      q: 'Is my uploaded resume or assessment data stored on any external server?',
      a: 'No. Compass is 100% client-side. All resume parsing, scoring formulas, and job description matching execute entirely on your device using localStorage. No accounts, no telemetry tracking, and zero cloud uploads.',
    },
    {
      q: 'How is Compass different from ChatGPT or generic career websites?',
      a: 'Generic AI tools produce vague, generic summaries without grounding in MBA recruiting rubrics. Compass uses an inspectable, deterministic model with a 70-term MBA taxonomy, 3× requirements weighting, and real placement benchmarks from top business schools.',
    },
    {
      q: 'Can I export my resume in ATS plain-text and high-res PDF?',
      a: 'Yes. You can export a clean plain-text ATS .txt file (designed for strict campus placement portals like Superset) as well as an A4 pixel-accurate PDF without watermarks or subscription walls.',
    },
    {
      q: 'Does Compass scrape LinkedIn or Glassdoor?',
      a: 'No. Scraping violates their Terms of Service. Instead, Compass generates pre-filtered, precision deep-search URLs that open live in your browser, then analyzes the text you paste back locally without storing private data.',
    },
    {
      q: 'Which companies are included in the Company Prep module?',
      a: 'Compass features in-depth recruiting rubrics, selection round breakdowns, and compensation benchmarks for 12 top MBA employers: McKinsey, BCG, Bain, Amazon, HUL, Goldman Sachs, Flipkart, Swiggy, Kotak Mahindra, ITC, Deloitte, and ZS Associates.',
    },
  ];

  const simSelectedCompany = COMPANIES.find((c) => c.id === simCompanyId) || COMPANIES[0];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans selection:bg-[#00DF89] selection:text-slate-950">
      {/* 1. HERO SECTION (FAITHFUL TO USER REFERENCE DESIGN) */}
      <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-800/80 bg-grid-pattern overflow-hidden">
        {/* Subtle radial emerald flare */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-[#00DF89]/5 blur-[140px] pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00DF89]/10 border border-[#00DF89]/30 text-[#00DF89] text-[11px] font-bold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00DF89] animate-pulse"></span>
                <span>BUILT FOR MBA STUDENTS, NOT GENERIC JOB SEEKERS</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Pick a lane you can <span className="text-[#00DF89]">defend.</span>
                <br />
                Then prove you belong in it.
              </h1>

              {/* Subhead */}
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
                Compass connects the five things MBA hiring actually tests — your specialization, your resume, the job description, the people who can refer you, and what employees say about the role. One platform, one continuous loop.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={onStartAssessment}
                  className="px-6 py-3.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-[#00DF89]/20 text-center flex items-center justify-center gap-2"
                >
                  <span>Start the 12-minute assessment</span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => {
                    document.getElementById('simulators')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all text-center"
                >
                  See the five tools
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-5 pt-3 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>No sign-up required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#00DF89]">✓</span>
                  <span>Runs 100% in your browser</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#00DF89]">✓</span>
                  <span>Free & private</span>
                </div>
              </div>
            </div>

            {/* Right Column: Reference Product Mock Card */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl border border-slate-800 bg-[#0E1526]/95 p-6 space-y-5 shadow-2xl backdrop-blur-md">
                {/* Domain Fit Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                      DOMAIN FIT
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                      after 14 questions
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 pb-1 text-[11px]">
                        <span>Marketing & Brand Strategy</span>
                        <span className="font-mono text-slate-300 font-bold">78</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00DF89] rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 pb-1 text-[11px]">
                        <span>Product Management</span>
                        <span className="font-mono text-slate-300 font-bold">64</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                        <div className="h-full bg-[#14B8A6] rounded-full" style={{ width: '64%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 pb-1 text-[11px]">
                        <span>Management Consulting</span>
                        <span className="font-mono text-slate-300 font-bold">57</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                        <div className="h-full bg-[#06B6D4] rounded-full" style={{ width: '57%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 pb-1 text-[11px]">
                        <span>Corporate Finance</span>
                        <span className="font-mono text-slate-300 font-bold">41</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-600 rounded-full" style={{ width: '41%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2-Column Split: Readiness & Best-Fit Roles */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  {/* Left: Readiness Gauge */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2 text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      READINESS
                    </span>
                    <div className="w-16 h-16 rounded-full border-4 border-amber-400 flex items-center justify-center bg-amber-400/5">
                      <span className="text-xl font-black text-white">72</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Target: Product Manager</span>
                  </div>

                  {/* Right: Best-Fit Roles */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2 text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      BEST-FIT ROLES
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-200">Product Manager</span>
                        <span className="font-bold text-[#00DF89] font-mono">78%</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-200">Growth Marketing</span>
                        <span className="font-bold text-[#14B8A6] font-mono">71%</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-200">Category Manager</span>
                        <span className="font-bold text-[#06B6D4] font-mono">66%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Pill Bar */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-700">
                      PS
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Priya Sharma</div>
                      <div className="text-[10px] text-slate-400">Senior Product Manager · Tecnotree</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-[#00DF89] border border-[#00DF89]/30 bg-[#00DF89]/10">
                    Message ready
                  </span>
                </div>

                {/* Floating Badge */}
                <div className="flex items-center justify-between pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#070B14] border border-slate-700 text-xs font-semibold text-slate-300 shadow-md">
                    <span>🛡</span>
                    <span>Role-level review lens</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('home')}
                    className="text-xs font-bold text-[#00DF89] hover:underline"
                  >
                    Open Live Cockpit →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 STATS COUNTERS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 mt-16 border-t border-slate-800/80">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">8</div>
              <div className="text-xs text-slate-400 mt-1">specialisation domains scored</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">19</div>
              <div className="text-xs text-slate-400 mt-1">MBA roles with weighted fit</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">70</div>
              <div className="text-xs text-slate-400 mt-1">JD terms with synonyms</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">12</div>
              <div className="text-xs text-slate-400 mt-1">companies with full briefs</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "IT ISN'T THE FEES. IT'S THE GUESSING." (STORY-DRIVEN JOURNEY) */}
      <section id="pain-points" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="space-y-3 mb-14">
          <div className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">
            THE EXPENSIVE PART OF AN MBA
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            It isn't the fees. It's the guessing.
          </h2>
          <p className="text-base text-slate-400 leading-relaxed max-w-2xl">
            Six failure points show up every placement season. Compass was built backwards from each one, with a scored answer instead of another generic listicle.
          </p>
        </div>

        {/* 6 Failure Point Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 01 */}
          <div className="p-6 rounded-2xl bg-[#0E1526] border border-slate-800 space-y-4 hover:border-[#00DF89]/50 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#00DF89]/10 text-[#00DF89] flex items-center justify-center font-bold text-sm border border-[#00DF89]/30">
                  ?
                </div>
                <span className="font-mono text-xs font-bold text-slate-500">01</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                “I don't know which specialization fits me.”
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Students guess their major based on peer hearsay or average placement packages. Compass uses 14 business scenarios to calculate normalized fit across all 8 disciplines with zero arbitrary weights.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-[#00DF89] font-semibold flex items-center justify-between">
              <span>Solution: 14-Scenario Diagnostic</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 02 */}
          <div className="p-6 rounded-2xl bg-[#0E1526] border border-slate-800 space-y-4 hover:border-[#00DF89]/50 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#00DF89]/10 text-[#00DF89] flex items-center justify-center font-bold text-sm border border-[#00DF89]/30">
                  ◎
                </div>
                <span className="font-mono text-xs font-bold text-slate-500">02</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                “I know the domain, not the job title.”
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Product marketing, category management, and strategy operations sound interchangeable. Compass ranks 19 distinct roles with skill coverage, trait alignment, and verified salary bands.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-[#00DF89] font-semibold flex items-center justify-between">
              <span>Solution: 19 MBA Role Library</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 03 */}
          <div className="p-6 rounded-2xl bg-[#0E1526] border border-slate-800 space-y-4 hover:border-[#00DF89]/50 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#00DF89]/10 text-[#00DF89] flex items-center justify-center font-bold text-sm border border-[#00DF89]/30">
                  📄
                </div>
                <span className="font-mono text-xs font-bold text-slate-500">03</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                “My resume never reaches a human.”
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recruiter screening software silently drops unquantified bullets. Compass calculates real-time metric density and exports Workday/Taleo-compliant ATS text and pixel-perfect PDFs.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-[#00DF89] font-semibold flex items-center justify-between">
              <span>Solution: Metric Density Auditor</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 04 */}
          <div className="p-6 rounded-2xl bg-[#0E1526] border border-slate-800 space-y-4 hover:border-[#00DF89]/50 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#00DF89]/10 text-[#00DF89] flex items-center justify-center font-bold text-sm border border-[#00DF89]/30">
                  ⚡
                </div>
                <span className="font-mono text-xs font-bold text-slate-500">04</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                “My resume doesn't match the JD.”
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submitting generic resumes fails because requirements carry 3× more weight than responsibilities. Compass audits 70 MBA terms and rewrites bullets in XYZ impact format.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-[#00DF89] font-semibold flex items-center justify-between">
              <span>Solution: 70-Term MBA Taxonomy</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 05 */}
          <div className="p-6 rounded-2xl bg-[#0E1526] border border-slate-800 space-y-4 hover:border-[#00DF89]/50 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#00DF89]/10 text-[#00DF89] flex items-center justify-center font-bold text-sm border border-[#00DF89]/30">
                  💬
                </div>
                <span className="font-mono text-xs font-bold text-slate-500">05</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                “My cold messages get ghosted.”
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sending 10-paragraph LinkedIn essays results in zero replies. Compass builds live filtered searches and generates 3-touch messages tailored for alumni, peers, and leaders.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-[#00DF89] font-semibold flex items-center justify-between">
              <span>Solution: 3-Touch Outreach Engine</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 06 */}
          <div className="p-6 rounded-2xl bg-[#0E1526] border border-slate-800 space-y-4 hover:border-[#00DF89]/50 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#00DF89]/10 text-[#00DF89] flex items-center justify-center font-bold text-sm border border-[#00DF89]/30">
                  ★
                </div>
                <span className="font-mono text-xs font-bold text-slate-500">06</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                “Company reviews don't tell me about the role.”
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Company-wide ratings blur the reality between sales and product. Compass extracts 8 role themes (crunch weeks, travel, meritocracy) and generates partner interview questions.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-[#00DF89] font-semibold flex items-center justify-between">
              <span>Solution: Role-Level Review Digest</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE 5-TOOL LIVE SIMULATOR SHOWCASE */}
      <section id="simulators" className="py-20 md:py-28 border-t border-slate-800/80 bg-[#0B111E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#00DF89] uppercase tracking-wider">
              <span>LIVE INTERACTIVE SIMULATORS</span>
              <span className="text-slate-600">·</span>
              <span>TEST THE FIVE TOOLS NOW</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Experience the tools before you launch the cockpit
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Test each module below with live sample data to see how Compass transforms MBA recruiting from guesswork into a deterministic system.
            </p>
          </div>

          {/* Interactive Tool Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-semibold">
            {[
              { id: 0, label: '01. Diagnostic Assessment', tab: 'assess' },
              { id: 1, label: '02. ATS Resume Studio', tab: 'resume' },
              { id: 2, label: '03. JD Matcher (3× Weight)', tab: 'match' },
              { id: 3, label: '04. People Map & Outreach', tab: 'target' },
              { id: 4, label: '05. Recruiter Dossiers', tab: 'company' },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveSimTool(tool.id)}
                className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeSimTool === tool.id
                    ? 'bg-[#00DF89] text-slate-950 font-bold shadow-md shadow-[#00DF89]/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Simulator Container */}
          <div className="bg-[#0E1526] rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
            {/* SIMULATOR 1: ASSESSMENT */}
            {activeSimTool === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-[#00DF89] font-bold">SAMPLE SCENARIO 01 OF 14</span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {QUESTIONS[0].scenario}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {QUESTIONS[0].options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSimSelectedOption(opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 ${
                          simSelectedOption === opt.id
                            ? 'border-[#00DF89] bg-[#00DF89]/10 text-white font-medium'
                            : 'border-slate-800 bg-[#070B14] hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                          {simSelectedOption === opt.id ? '✓' : ''}
                        </span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">14 total scenarios spanning 8 domains</span>
                    <button
                      onClick={onStartAssessment}
                      className="px-4 py-2 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span>Take Full 14-Scenario Diagnostic</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#070B14] p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Live Domain Scoring</span>
                    <span className="text-[10px] text-[#00DF89] font-mono">DETERMINISTIC</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 pb-1 text-[11px]">
                        <span>Product Management</span>
                        <span className="font-mono text-[#00DF89] font-bold">
                          {simSelectedOption === 'opt_a' ? '92%' : '65%'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00DF89] transition-all duration-300"
                          style={{ width: simSelectedOption === 'opt_a' ? '92%' : '65%' }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 pb-1 text-[11px]">
                        <span>Marketing Strategy</span>
                        <span className="font-mono text-[#14B8A6] font-bold">
                          {simSelectedOption === 'opt_b' ? '88%' : '54%'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#14B8A6] transition-all duration-300"
                          style={{ width: simSelectedOption === 'opt_b' ? '88%' : '54%' }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 pb-1 text-[11px]">
                        <span>Consulting & Advisory</span>
                        <span className="font-mono text-[#06B6D4] font-bold">
                          {simSelectedOption === 'opt_d' ? '90%' : '48%'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#06B6D4] transition-all duration-300"
                          style={{ width: simSelectedOption === 'opt_d' ? '90%' : '48%' }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    💡 Unlike generic personality tests, Compass normalizes only against answered business scenarios and generates a customized 90-day skill remediation plan.
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR 2: RESUME STUDIO */}
            {activeSimTool === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-[#00DF89] font-bold">BULLET METRIC DENSITY AUDITOR</span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Compare weak narrative bullets vs. quantified ATS bullets
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setSimMetricSampleIndex(0)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors ${
                        simMetricSampleIndex === 0
                          ? 'bg-rose-950/50 border-rose-700 text-rose-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Weak Bullet (0% Quantified)
                    </button>
                    <button
                      onClick={() => setSimMetricSampleIndex(1)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors ${
                        simMetricSampleIndex === 1
                          ? 'bg-[#00DF89]/10 border-[#00DF89] text-[#00DF89] font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Quantified XYZ Bullet (100% Metric)
                    </button>
                  </div>

                  <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-2">
                    <div className="text-[11px] text-slate-400 font-mono">RESUME BULLET TEST:</div>
                    <div className="text-sm font-medium text-slate-200 leading-relaxed">
                      {simMetricSampleIndex === 0
                        ? '• Worked with engineering team to launch new billing features and improve the user checkout experience.'
                        : '• Architected digital monetization roadmap across 4 Tier-1 telecom operators, slashing gateway drop-off from 8.4% to 2.9% and driving $3.2M incremental ARR.'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigateTab('resume')}
                      className="px-5 py-2.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      Open ATS Resume Studio →
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#070B14] p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">ATS Metric Score</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        simMetricSampleIndex === 1 ? 'bg-[#00DF89]/20 text-[#00DF89]' : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {simMetricSampleIndex === 1 ? 'RECRUITER READY' : 'ATS REJECT RISK'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`text-3xl font-black font-mono ${
                        simMetricSampleIndex === 1 ? 'text-[#00DF89]' : 'text-rose-400'
                      }`}
                    >
                      {simMetricSampleIndex === 1 ? '100%' : '0%'}
                    </div>
                    <div className="text-xs text-slate-400 leading-tight">
                      {simMetricSampleIndex === 1
                        ? 'Includes percentage drop, count of operators, and dollar ARR expansion.'
                        : 'Contains zero numeric indicators or measurable business outcomes.'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between text-[11px]">
                      <span>ATS Plain Text (.txt)</span>
                      <span className="text-[#00DF89] font-bold">Supported</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Pixel-Accurate A4 PDF</span>
                      <span className="text-[#00DF89] font-bold">Supported</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Workday / Taleo Clean</span>
                      <span className="text-[#00DF89] font-bold">100% Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR 3: JD MATCHER */}
            {activeSimTool === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-[#00DF89] font-bold">70-TERM MBA TAXONOMY</span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Requirements carrying 3× more weight than general responsibilities
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {['Stripe (Product)', 'McKinsey (Consulting)', 'HUL (Brand Marketing)'].map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSimJdIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg border transition-colors ${
                          simJdIndex === idx
                            ? 'bg-[#00DF89] text-slate-950 font-bold border-[#00DF89]'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="font-bold text-white">Extracted Key Deliverables:</div>
                    <div className="text-slate-400 font-mono text-[11px] leading-relaxed">
                      {simJdIndex === 0 && 'Requirements: A/B Testing, PRD specifications, cohort retention, SQL analytics, churn mitigation, multi-currency checkout.'}
                      {simJdIndex === 1 && 'Requirements: Commercial due diligence, DCF modeling, TAM SAM SOM market sizing, EBITDA expansion, MECE frameworks.'}
                      {simJdIndex === 2 && 'Requirements: ROAS ad spend, Nielsen retail share, brand equity, consumer segmentation, IMC campaigns, pricing elasticity.'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigateTab('match')}
                      className="px-4 py-2 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 text-xs font-bold rounded-lg transition-colors"
                    >
                      Match Any Live Job Description →
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#070B14] p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Benchmark Fit</span>
                    <span className="text-[10px] text-[#00DF89] font-mono">3× SECTION WEIGHT</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Keyword Alignment:</span>
                      <span className="font-mono text-white font-bold">{simJdIndex === 0 ? '78%' : simJdIndex === 1 ? '72%' : '84%'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Metric Density Match:</span>
                      <span className="font-mono text-emerald-400 font-bold">100%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">ATS Formatting Flags:</span>
                      <span className="font-mono text-[#00DF89] font-bold">0 Errors</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-[#00DF89] font-bold">Recommended XYZ Rewrite: </span>
                    "Led cross-functional sprint pods delivering multi-currency checkout, driving a 19% boost in checkout completion across 12,000 merchants."
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR 4: PEOPLE MAP */}
            {activeSimTool === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-[#00DF89] font-bold">ZERO SCRAPING OUTREACH</span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Targeted LinkedIn deep-search URLs & 3-step networking sequences
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {(['peer', 'leader', 'alumni'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSimOutreachType(type)}
                        className={`px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                          simOutreachType === type
                            ? 'bg-[#00DF89] text-slate-950 font-bold border-[#00DF89]'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {type === 'peer' ? 'Peer (PM Consultant)' : type === 'leader' ? 'Leader (Director)' : 'Alumni Network'}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>MESSAGE 1 (TOUCH 1 - CONNECTION NOTE):</span>
                      <button
                        onClick={() =>
                          handleCopy(
                            'sim_msg',
                            simOutreachType === 'peer'
                              ? 'Hi Priya, I came across your work on BSS monetization at Tecnotree. As an MBA candidate with a tech lead background, I’d love to connect and follow your journey.'
                              : simOutreachType === 'leader'
                              ? 'Hi Karan, impressive to see Tecnotree’s digital transformation roadmap across telecom operators. Would value staying connected with your perspective on B2B product strategy.'
                              : 'Hi Arjun, fellow alumnus from IIM here. Reaching out as I prepare for Product Consulting tracks at Tecnotree. Would love to stay connected!'
                          )
                        }
                        className="text-[#00DF89] hover:underline font-bold"
                      >
                        {copiedKey === 'sim_msg' ? '✓ Copied!' : 'Copy Template'}
                      </button>
                    </div>
                    <div className="text-slate-200 font-mono text-[11px] leading-relaxed">
                      {simOutreachType === 'peer' &&
                        '"Hi Priya, I came across your work on BSS monetization at Tecnotree. As an MBA candidate with a tech lead background, I’d love to connect and follow your journey."'}
                      {simOutreachType === 'leader' &&
                        '"Hi Karan, impressive to see Tecnotree’s digital transformation roadmap across telecom operators. Would value staying connected with your perspective on B2B product strategy."'}
                      {simOutreachType === 'alumni' &&
                        '"Hi Arjun, fellow alumnus from IIM here. Reaching out as I prepare for Product Consulting tracks at Tecnotree. Would love to stay connected!"'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigateTab('target')}
                      className="px-4 py-2 bg-[#00DF89] text-slate-950 text-xs font-bold rounded-lg hover:bg-[#00c97b] transition-colors"
                    >
                      Open Full People Map Cockpit →
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#070B14] p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Outreach Funnel</span>
                    <span className="text-[10px] text-[#00DF89] font-mono">HIGH REPLY RATE</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Expected Reply Rate:</span>
                      <span className="font-bold text-[#00DF89]">
                        {simOutreachType === 'peer' ? '45% – 60%' : simOutreachType === 'leader' ? '25% – 35%' : '65% – 80%'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Search Formula:</span>
                      <span className="font-mono text-slate-400">Pre-filtered Boolean URL</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Sequences Included:</span>
                      <span className="font-bold text-white">Touch 1, 2, and 3</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                    🔒 Legal & Compliant: Generates direct LinkedIn search links that execute locally in your browser. Zero scraping, zero account suspension risk.
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR 5: RECRUITER DOSSIERS */}
            {activeSimTool === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-[#00DF89] font-bold">12 TOP MBA EMPLOYERS</span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Curated dossiers, interview rounds, and Glassdoor review digests
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {COMPANIES.slice(0, 6).map((comp) => (
                      <button
                        key={comp.id}
                        onClick={() => setSimCompanyId(comp.id)}
                        className={`px-3 py-1.5 rounded-lg border transition-colors ${
                          simCompanyId === comp.id
                            ? 'bg-[#00DF89] text-slate-950 font-bold border-[#00DF89]'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {comp.name}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{simSelectedCompany.name}</span>
                      <span className="font-mono text-[#00DF89] font-bold">{simSelectedCompany.payBandINR}</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{simSelectedCompany.tagline}</p>
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px] text-slate-300">
                      <span className="font-bold text-white">Interview Process: </span>
                      <span>{simSelectedCompany.typicalRounds.map((r) => r.name).join(' → ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigateTab('company')}
                      className="px-4 py-2 bg-[#00DF89] text-slate-950 text-xs font-bold rounded-lg hover:bg-[#00c97b] transition-colors"
                    >
                      View All 12 Company Dossiers →
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#070B14] p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Insider Edge</span>
                    <span className="text-[10px] text-amber-400 font-mono">INTERVIEW ROUNDS</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-200">Key Advantage:</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">{simSelectedCompany.pros[0]}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-200">Culture Watch-Out:</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">{simSelectedCompany.cons[0]}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-200">Partner Interview Tip:</span>
                      <p className="text-[#00DF89] text-[11px] mt-0.5 font-medium">{simSelectedCompany.insiderTips[0]}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. FIVE INTEGRATED TOOLS GRID OVERVIEW */}
      <section id="tools" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl space-y-3 mb-14">
          <div className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">
            PRODUCT ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Five specialized modules. One connected loop.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Each tool hands its structured intelligence directly into the next stage of your preparation.
          </p>
        </div>

        <div className="space-y-6">
          {/* Tool 1 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0E1526] border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center hover:border-[#00DF89]/40 transition-colors">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-mono font-bold text-[#00DF89]">01. ASSESSMENT</span>
              <h3 className="text-xl font-bold text-white">14 Business Scenarios + Transparent Cue Lexicon</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Measures your problem-solving instinct across 8 domains and 6 work-style traits. Allows free-text "Other" input analyzed deterministically in your browser.
              </p>
              <div className="text-xs text-slate-400 pt-1">
                <span className="text-slate-200 font-semibold">Different because: </span>
                No arbitrary black box. Normalizes against answered scenarios and generates a customized 90-day remediation plan.
              </div>
            </div>
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <button
                onClick={onStartAssessment}
                className="px-5 py-2.5 bg-[#00DF89] text-slate-950 text-xs font-bold rounded-xl hover:bg-[#00c97b] transition-all"
              >
                Start Assessment →
              </button>
            </div>
          </div>

          {/* Tool 2 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0E1526] border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center hover:border-[#00DF89]/40 transition-colors">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-mono font-bold text-[#00DF89]">02. RESUME STUDIO</span>
              <h3 className="text-xl font-bold text-white">Auto-Fill from PDF & Live Metric Density</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Upload your existing PDF to parse all candidate fields instantly. Checks bullet quantification and exports plain-text ATS .txt and high-res A4 PDFs.
              </p>
              <div className="text-xs text-slate-400 pt-1">
                <span className="text-slate-200 font-semibold">Different because: </span>
                100% free and client-side. No watermark, no paywall, and no account required.
              </div>
            </div>
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <button
                onClick={() => onNavigateTab('resume')}
                className="px-5 py-2.5 bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
              >
                Open Resume Studio →
              </button>
            </div>
          </div>

          {/* Tool 3 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0E1526] border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center hover:border-[#00DF89]/40 transition-colors">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-mono font-bold text-[#00DF89]">03. JOB MATCH</span>
              <h3 className="text-xl font-bold text-white">70-Term MBA Taxonomy & XYZ Bullet Rewriter</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Weights requirements sections 3× over responsibilities, flags missing keywords, runs 6 ATS checks, and converts weak bullets to XYZ impact format.
              </p>
              <div className="text-xs text-slate-400 pt-1">
                <span className="text-slate-200 font-semibold">Different because: </span>
                Understands MBA-specific terms (MECE, LBO, CLTV, CAC, OTIF, PRD) rather than generic keywords.
              </div>
            </div>
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <button
                onClick={() => onNavigateTab('match')}
                className="px-5 py-2.5 bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
              >
                Match Job Description →
              </button>
            </div>
          </div>

          {/* Tool 4 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0E1526] border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center hover:border-[#00DF89]/40 transition-colors">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-mono font-bold text-[#00DF89]">04. PEOPLE & TARGET</span>
              <h3 className="text-xl font-bold text-white">6 Search Builders & 3-Step Outreach Sequences</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Pre-builds filtered LinkedIn searches for peers, hiring managers, alumni, and recruiters. Tracks contacts from Sent to Referral with customized message templates.
              </p>
              <div className="text-xs text-slate-400 pt-1">
                <span className="text-slate-200 font-semibold">Different because: </span>
                Zero illegal scraping. Gives you the exact live search link and high-converting message copy tailored by relationship type.
              </div>
            </div>
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <button
                onClick={() => onNavigateTab('target')}
                className="px-5 py-2.5 bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
              >
                Open People Map →
              </button>
            </div>
          </div>

          {/* Tool 5 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0E1526] border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center hover:border-[#00DF89]/40 transition-colors">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-mono font-bold text-[#00DF89]">05. COMPANY PREP</span>
              <h3 className="text-xl font-bold text-white">12 Curated Recruiter Dossiers & Role-Level Sentiment</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Detailed interview rounds (McKinsey Solve, Amazon Bar Raiser, HUL Discovery Center), pay benchmarks, and review parsing across 8 role themes.
              </p>
              <div className="text-xs text-slate-400 pt-1">
                <span className="text-slate-200 font-semibold">Different because: </span>
                Derives reverse interview questions from weak Glassdoor themes so you can probe real culture realities during partner rounds.
              </div>
            </div>
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <button
                onClick={() => onNavigateTab('company')}
                className="px-5 py-2.5 bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
              >
                Explore Companies →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT DIFFERENTIATION MATRIX */}
      <section id="comparison" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-800/80">
        <div className="max-w-3xl space-y-3 mb-14">
          <div className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">
            PRODUCT COMPARISON
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Why MBA candidates choose Compass
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            See how Compass compares against generic resume builders and unfocused AI chatbots.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0E1526]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-[#070B14]">
                <th className="py-4 px-6 font-bold text-white">Capability & Placement Feature</th>
                <th className="py-4 px-6 font-bold text-[#00DF89] bg-[#00DF89]/5 border-x border-[#00DF89]/20">
                  Compass Career OS
                </th>
                <th className="py-4 px-6 font-semibold text-slate-400">Generic Resume Builders</th>
                <th className="py-4 px-6 font-semibold text-slate-400">ChatGPT Prompts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              <tr>
                <td className="py-4 px-6 font-semibold text-white">Specialization & Domain Fit</td>
                <td className="py-4 px-6 text-[#00DF89] font-bold bg-[#00DF89]/5 border-x border-[#00DF89]/20">
                  ✓ 14 Scenarios (8 Domains Scored)
                </td>
                <td className="py-4 px-6 text-slate-500">✗ None (Assumes you know)</td>
                <td className="py-4 px-6 text-slate-500">✗ Uncalibrated text advice</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-white">ATS Bullet Metric Density</td>
                <td className="py-4 px-6 text-[#00DF89] font-bold bg-[#00DF89]/5 border-x border-[#00DF89]/20">
                  ✓ Live % Quantification Auditor
                </td>
                <td className="py-4 px-6 text-slate-500">✗ Visual styling only</td>
                <td className="py-4 px-6 text-slate-500">✗ Hallucinates percentages</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-white">JD Requirements Weighting</td>
                <td className="py-4 px-6 text-[#00DF89] font-bold bg-[#00DF89]/5 border-x border-[#00DF89]/20">
                  ✓ 3× Weight on Requirements
                </td>
                <td className="py-4 px-6 text-slate-500">✗ Basic keyword counter</td>
                <td className="py-4 px-6 text-slate-500">✗ Treats all lines equally</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-white">LinkedIn Outreach Strategy</td>
                <td className="py-4 px-6 text-[#00DF89] font-bold bg-[#00DF89]/5 border-x border-[#00DF89]/20">
                  ✓ 6 Deep URLs + 3-Touch Sequences
                </td>
                <td className="py-4 px-6 text-slate-500">✗ Not supported</td>
                <td className="py-4 px-6 text-slate-500">✗ Generic 1-off cold notes</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-white">Recruiter Dossiers & Pay</td>
                <td className="py-4 px-6 text-[#00DF89] font-bold bg-[#00DF89]/5 border-x border-[#00DF89]/20">
                  ✓ 12 Top Recruiter Breakdown
                </td>
                <td className="py-4 px-6 text-slate-500">✗ Not supported</td>
                <td className="py-4 px-6 text-slate-500">✗ Outdated training cutoff</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-white">Privacy & Client-Side Runtime</td>
                <td className="py-4 px-6 text-[#00DF89] font-bold bg-[#00DF89]/5 border-x border-[#00DF89]/20">
                  ✓ 100% Client-Side (No Accounts)
                </td>
                <td className="py-4 px-6 text-slate-500">✗ Email capture / paywall</td>
                <td className="py-4 px-6 text-slate-500">✗ Stores data for training</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. FAQS */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 border-t border-slate-800/80">
        <div className="space-y-3 mb-10">
          <div className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">FAQ</div>
          <h2 className="text-3xl font-black tracking-tight text-white">Frequently Asked Questions</h2>
        </div>

        <div className="divide-y divide-slate-800/80 border-y border-slate-800/80">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-4">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left font-semibold text-slate-200 text-sm sm:text-base hover:text-[#00DF89] transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-lg text-slate-500 font-mono ml-4">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <p className="text-xs sm:text-sm text-slate-400 pt-3 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. CONTACT US SECTION (CUSTOMIZED FOR USER: abhinavsarkar121@gmail.com) */}
      <section id="contact" className="py-20 bg-[#0E1526]/80 border-t border-slate-800/80">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#00DF89] uppercase tracking-wider">
              <span>GET IN TOUCH</span>
              <span className="text-slate-600">·</span>
              <span>DIRECT FOUNDER CONTACT</span>
            </div>
            <h3 className="text-3xl font-black text-white">Have questions, feedback, or role requests?</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              We read every message from MBA students and candidates. Reach out directly below or send an email to <span className="text-white font-mono font-bold">abhinavsarkar121@gmail.com</span>.
            </p>
          </div>

          {contactSubmitted ? (
            <div className="bg-[#00DF89]/10 border border-[#00DF89]/40 text-[#00DF89] rounded-2xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#00DF89]/20 text-[#00DF89] flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <div className="font-extrabold text-base text-white">Thank you, {contactName}!</div>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Your message has been captured. Click below to send directly to <span className="font-mono font-bold">abhinavsarkar121@gmail.com</span> with pre-filled details.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`mailto:abhinavsarkar121@gmail.com?subject=Compass%20Inquiry%20from%20${encodeURIComponent(contactName)}&body=${encodeURIComponent(`Hi Abhinav,\n\nName: ${contactName}\nEmail: ${contactEmail}\nSchool/Domain: ${contactSchool}\n\nMessage:\n${contactMessage}`)}`}
                  className="px-5 py-2.5 bg-[#00DF89] text-slate-950 text-xs font-bold rounded-xl hover:bg-[#00c97b] transition-colors"
                >
                  Send via Email Client →
                </a>
                <button
                  onClick={() => setContactSubmitted(false)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="bg-[#070B14] p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Abhinav Sarkar"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. abhinav@alumni.iim.ac.in"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Current Business School or Target Domain</label>
                <input
                  type="text"
                  value={contactSchool}
                  onChange={(e) => setContactSchool(e.target.value)}
                  placeholder="e.g. IIM Ahmedabad / Product Management"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message or Role Feedback *</label>
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Ask a question about your specialization, request new company dossiers, or share feedback..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89]"
                ></textarea>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-[#00DF89]/20 text-center"
                >
                  Submit Contact Message →
                </button>
                <a
                  href="mailto:abhinavsarkar121@gmail.com"
                  className="text-xs text-slate-400 hover:text-white text-center sm:text-right transition-colors"
                >
                  Direct Mail: <span className="font-mono text-[#00DF89]">abhinavsarkar121@gmail.com</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
