import React, { useState, useMemo } from 'react';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { analyzeJobDescription } from '../lib/jd';
import { SAMPLE_MBA_RESUME } from '../lib/resume';
import { BulletRewrite, ResumeData } from '../types';

interface MatchProps {
  resumeData: ResumeData;
  onUpdateResume?: (data: ResumeData) => void;
  onNavigateTab: (tab: string) => void;
}

export interface ViewedJob {
  id: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  sourceUrl: string;
  importedAt: number;
}

export interface MbaRolePreset {
  id: string;
  title: string;
  company: string;
  category: string;
  text: string;
}

export const MBA_ROLES_CATALOG: MbaRolePreset[] = [
  {
    id: 'pm',
    title: 'Senior Product Manager',
    company: 'Stripe / Tier-1 FinTech',
    category: 'Product & Tech',
    text: `About the Role:
We are looking for an experienced Senior Product Manager to lead our Core Monetization and Billing Platform. You will define the multi-year product roadmap, drive A/B testing experimentation, and optimize pricing packaging models across enterprise merchants.

Key Responsibilities:
- Lead sprint planning and agile scrum delivery with dedicated engineering and design pods.
- Define customer churn mitigation strategies and analyze cohort retention curves.
- Author comprehensive PRD specifications for multi-currency automated checkout workflows.
- Partner with finance and sales to evaluate customer acquisition cost (CAC) and customer lifetime value (CLTV).

Requirements & Qualifications:
- MBA from a top-tier business school or equivalent practical experience.
- 3+ years of product management experience managing technical SaaS or payments platforms.
- Deep hands-on proficiency in SQL, user research, wireframing in Figma, and data analytics.
- Proven track record leading cross-functional teams and executive presentations to C-suite leaders.
- Strong grounding in unit economics, go-to-market (GTM) launches, and contract negotiation.`,
  },
  {
    id: 'consulting',
    title: 'Management Consultant / Strategy Associate',
    company: 'McKinsey / BCG / Bain',
    category: 'Strategy & Consulting',
    text: `Position Overview:
Join our Strategy & Corporate Finance practice to advise C-suite executives on critical business transformations, market entry sizing, and commercial due diligence.

Responsibilities:
- Structure ambiguous business dilemmas into MECE hypothesis trees and issue hierarchies.
- Conduct commercial due diligence on acquisition targets for top-tier private equity sponsors.
- Synthesize quantitative data into compelling executive presentation decks for client partners.
- Build granular financial valuation models (DCF, LBO, EBITDA multiple expansion).

Requirements:
- Master of Business Administration (MBA) with strong academic distinction.
- Fluency in financial modeling, valuation multiples, DCF, and EBITDA margin expansion.
- Demonstrated competitive benchmarking, market sizing (TAM SAM SOM), and cost reduction frameworks.
- Exceptional stakeholder management, change management, and verbal executive communication.`,
  },
  {
    id: 'brand',
    title: 'Brand / Marketing Manager',
    company: 'Hindustan Unilever / P&G (FMCG)',
    category: 'Marketing',
    text: `Job Description:
Own the brand equity, advertising campaigns, and P&L growth for our leading personal care brand across General Trade and E-commerce channels.

Key Deliverables:
- Formulate annual brand positioning and integrated marketing communication (IMC) campaigns.
- Direct creative agency partners on packaging redesign and OOH / digital media plans.
- Track Nielsen market share, consumer segmentation, and category gross margin profitability.
- Oversee trade marketing, promotional spend ROI, and distributor network alignment.

Qualifications & Requirements:
- MBA in Marketing or General Management.
- Experience managing return on ad spend (ROAS), customer segmentation, and trade promotions.
- Strong analytical skills in cohort analysis, pricing elasticity, and go-to-market (GTM) strategy.
- Proven leadership across cross-functional supply chain, vendor negotiation, and sales teams.`,
  },
  {
    id: 'ib_finance',
    title: 'Investment Banking & Corporate Finance Associate',
    company: 'Morgan Stanley / Goldman Sachs',
    category: 'Finance',
    text: `Role Summary:
Seeking an ambitious post-MBA Associate to join our Mergers & Acquisitions (M&A) and Capital Markets team advising high-growth corporate clients on multi-million dollar transactions.

Key Responsibilities:
- Build dynamic financial projection models, discounted cash flow (DCF), merger consequences, and debt capacity analyses.
- Author Confidential Information Memorandums (CIM) and pitch presentations for sponsor and strategic buy-side mandates.
- Coordinate due diligence workstreams across accounting, legal, and operational advisory teams.

Qualifications:
- MBA in Finance, Economics, or Accounting from a premier business school.
- Advanced modeling in Excel, pitch book design, and Bloomberg/Capital IQ proficiency.
- Rigorous grasp of corporate finance unit economics, capital structure, and liquidity metrics.`,
  },
  {
    id: 'ops_supply',
    title: 'Operations & Supply Chain Program Lead',
    company: 'Amazon / Global Logistics',
    category: 'Operations',
    text: `Position Overview:
Drive end-to-end fulfillment network optimization, inventory turns, and warehouse automation across regional fulfillment hubs.

Key Responsibilities:
- Optimize last-mile delivery route algorithms, slashing cost-per-package and vehicle transit delays.
- Lead Kaizen and Six Sigma lean operational audits across 8 automated sortation distribution centers.
- Spearhead strategic vendor supplier negotiations, mitigating lead time volatility and stockouts.

Requirements:
- MBA in Operations, Supply Chain Management, or Industrial Systems.
- Proven background in inventory forecasting, ERP/WMS systems, and logistics optimization.
- Strong cross-functional leadership driving labor efficiency and safety compliance standards.`,
  },
  {
    id: 'tech_sales',
    title: 'Enterprise Tech Sales & BD Director',
    company: 'Salesforce / Microsoft Cloud',
    category: 'Sales & Growth',
    text: `Role Overview:
Lead strategic enterprise commercial client acquisitions, pipeline generation, and annual contract value (ACV) quota achievement across Fortune 500 accounts.

Key Responsibilities:
- Execute consultative solution sales cycles with CIOs, CTOs, and VP of Engineering buyers.
- Architect custom commercial pricing structures, Master Service Agreements (MSA), and Statements of Work (SOW).
- Partner with solutions architects and customer success leads to secure 125% Net Retention Rate (NRR).

Requirements:
- MBA graduate with proven enterprise software sales, business development, or consulting acumen.
- Demonstrated quota overachievement ($2M+ ARR quota target).
- Deep expertise in pipeline velocity, CRM management, and executive contract negotiations.`,
  },
  {
    id: 'chief_of_staff',
    title: 'Chief of Staff / Strategy & BizOps',
    company: 'High-Growth Tech Unicorn',
    category: 'General Management',
    text: `About the Role:
Act as the right-hand strategic partner to the CEO and Executive Leadership Team, translating overarching board objectives into tactical company-wide execution.

Key Responsibilities:
- Orchestrate quarterly OKR setting, executive staff meetings, and board presentation decks.
- Spearhead special strategic incubation projects, international expansion feasibility, and strategic partnerships.
- Monitor company health metrics, operational headcount modeling, and burn rate runway.

Requirements:
- MBA from a top-tier business school.
- Background in management consulting, investment banking, or high-growth venture operations.
- Exceptional executive presence, intellectual agility, and cross-functional diplomatic leadership.`,
  },
];

const INITIAL_PRESET_JOBS: ViewedJob[] = MBA_ROLES_CATALOG.slice(0, 4).map((role) => ({
  id: `preset-${role.id}`,
  jobTitle: role.title,
  companyName: role.company,
  jobDescription: role.text,
  sourceUrl: 'Curated MBA Role',
  importedAt: Date.now() - 3600000,
}));

export const Match: React.FC<MatchProps> = ({
  resumeData,
  onUpdateResume,
  onNavigateTab,
}) => {
  const [jobUrl, setJobUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  } | null>(null);

  // Previously Viewed Jobs state initialized from localStorage
  const [previouslyViewedJobs, setPreviouslyViewedJobs] = useState<ViewedJob[]>(() => {
    try {
      const saved = localStorage.getItem('columbus_viewed_jobs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // safe fallback
    }
    return INITIAL_PRESET_JOBS;
  });

  const [activeJobId, setActiveJobId] = useState<string>(() => {
    return previouslyViewedJobs[0]?.id || 'preset-pm';
  });

  const [fetchedJobMeta, setFetchedJobMeta] = useState<{
    title: string;
    company: string;
    source: string;
  }>(() => {
    const first = previouslyViewedJobs[0];
    return {
      title: first ? first.jobTitle : MBA_ROLES_CATALOG[0].title,
      company: first ? first.companyName : MBA_ROLES_CATALOG[0].company,
      source: first ? first.sourceUrl : 'Default MBA Role',
    };
  });

  // Controlled textarea bound directly to jdInputText
  const [jdInputText, setJdInputText] = useState<string>(() => {
    return previouslyViewedJobs[0]?.jobDescription || MBA_ROLES_CATALOG[0].text;
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [appliedRewrites, setAppliedRewrites] = useState<Record<number, boolean>>({});

  // Analysis updates immediately whenever jdInputText or resumeData changes
  const analysis = useMemo(() => {
    return analyzeJobDescription(jdInputText, resumeData);
  }, [jdInputText, resumeData]);

  const saveViewedJobs = (jobs: ViewedJob[]) => {
    setPreviouslyViewedJobs(jobs);
    try {
      localStorage.setItem('columbus_viewed_jobs', JSON.stringify(jobs));
    } catch {
      // safe fallback
    }
  };

  // Switching active job from Previously Viewed Jobs
  const handleSelectViewedJob = (job: ViewedJob) => {
    setActiveJobId(job.id);
    setFetchedJobMeta({
      title: job.jobTitle,
      company: job.companyName,
      source: job.sourceUrl,
    });
    // Immediately populate textarea with saved description
    setJdInputText(job.jobDescription);
    setFetchStatus({
      type: 'success',
      message: `Loaded job description for "${job.jobTitle}" ✓`,
    });
  };

  // Remove single job from history
  const handleRemoveViewedJob = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const nextList = previouslyViewedJobs.filter((j) => j.id !== id);
    saveViewedJobs(nextList);
    if (activeJobId === id && nextList.length > 0) {
      handleSelectViewedJob(nextList[0]);
    }
  };

  // Handle URL import and extraction
  const handleFetchFromUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = jobUrl.trim();
    if (!trimmed) {
      setFetchStatus({
        type: 'error',
        message: 'Please paste a valid job posting URL first.',
      });
      return;
    }

    // Client-side URL validation
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setFetchStatus({
          type: 'error',
          message: 'URL must start with http:// or https://',
        });
        return;
      }
    } catch {
      setFetchStatus({
        type: 'error',
        message: 'The URL entered is invalid. Please verify the web address and try again.',
      });
      return;
    }

    setIsLoading(true);
    setFetchStatus({
      type: 'loading',
      message: 'Retrieving & extracting full job description from link...',
    });

    try {
      const res = await fetch('/api/fetch-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Non-JSON response
      }

      // Check if server endpoint returned 404 (e.g. GitHub Pages static hosting fallback)
      if (!res.ok || !data || !data.success) {
        if (res.status === 404) {
          try {
            const proxyRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(trimmed)}`);
            if (proxyRes.ok) {
              const html = await proxyRes.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              let title = doc.querySelector('title')?.textContent || 'Imported Job';
              let company = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || 'Target Employer';
              let description = '';

              const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
              for (let i = 0; i < scripts.length; i++) {
                try {
                  const j = JSON.parse(scripts[i].textContent || '{}');
                  const items = Array.isArray(j) ? j : j['@graph'] ? j['@graph'] : [j];
                  const posting = items.find((it: any) => it['@type'] === 'JobPosting');
                  if (posting && posting.description) {
                    title = posting.title || title;
                    company = posting.hiringOrganization?.name || company;
                    description = posting.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    break;
                  }
                } catch {
                  // continue
                }
              }

              if (!description) {
                const mainEl = doc.querySelector('main, article, [class*="description"]');
                if (mainEl && mainEl.textContent && mainEl.textContent.length > 100) {
                  description = mainEl.textContent.replace(/\s+/g, ' ').trim();
                }
              }

              if (description && description.length > 60) {
                data = {
                  success: true,
                  text: description.slice(0, 15000),
                  title: title.trim(),
                  company: company.trim(),
                  sourceUrl: trimmed,
                };
              }
            }
          } catch {
            // ignore proxy failure
          }
        }

        if (!data || !data.success) {
          throw new Error(
            data?.error ||
              `Unable to fetch job description (HTTP ${res.status}). The website may require login or block automated access. You can paste the text directly into the Job Description box below.`
          );
        }
      }

      const fetchedTitle = data.title || 'Job Role';
      const fetchedCompany = data.company || 'Target Employer';
      const fetchedText = data.text;
      const normalizedId = trimmed.toLowerCase().replace(/\/+$/, '');

      const newJob: ViewedJob = {
        id: normalizedId,
        jobTitle: fetchedTitle,
        companyName: fetchedCompany,
        jobDescription: fetchedText,
        sourceUrl: trimmed,
        importedAt: Date.now(),
      };

      // Add to Previously Viewed Jobs (deduplicate, move latest to top)
      const filtered = previouslyViewedJobs.filter(
        (j) => j.id !== normalizedId && j.sourceUrl.toLowerCase() !== trimmed.toLowerCase()
      );
      const nextList = [newJob, ...filtered];
      saveViewedJobs(nextList);

      // Set active job reference
      setActiveJobId(newJob.id);
      setFetchedJobMeta({
        title: fetchedTitle,
        company: fetchedCompany,
        source: trimmed,
      });

      // Automatically fill the Job Description text area
      setJdInputText(fetchedText);

      setFetchStatus({
        type: 'success',
        message: `Successfully imported "${fetchedTitle}" (${fetchedCompany}) ✓`,
      });
    } catch (err: any) {
      // Preserve existing text in text area on error!
      setFetchStatus({
        type: 'error',
        message: err.message || 'Could not fetch job posting. You can paste the job description directly below.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle applying improved bullet to resume (Strict User Action Only)
  const handleApplyRewrite = (originalText: string, improvedText: string, idx: number) => {
    if (!onUpdateResume) return;

    // Deep clone resume data
    const updated: ResumeData = JSON.parse(JSON.stringify(resumeData));
    let replaced = false;

    // Search through experience items and bullets
    for (const exp of updated.experience) {
      for (let b = 0; b < exp.bullets.length; b++) {
        if (
          exp.bullets[b].trim().toLowerCase() === originalText.trim().toLowerCase() ||
          exp.bullets[b].includes(originalText.slice(0, 20))
        ) {
          exp.bullets[b] = improvedText;
          replaced = true;
          break;
        }
      }
      if (replaced) break;
    }

    // If not found in experience, check projects
    if (!replaced) {
      for (const proj of updated.projects) {
        for (let b = 0; b < proj.bullets.length; b++) {
          if (
            proj.bullets[b].trim().toLowerCase() === originalText.trim().toLowerCase() ||
            proj.bullets[b].includes(originalText.slice(0, 20))
          ) {
            proj.bullets[b] = improvedText;
            replaced = true;
            break;
          }
        }
        if (replaced) break;
      }
    }

    // If still not matched, append to first experience
    if (!replaced && updated.experience.length > 0 && updated.experience[0].bullets.length > 0) {
      updated.experience[0].bullets[0] = improvedText;
      replaced = true;
    }

    if (replaced) {
      // Track newly optimized bullet for highlight in Resume Studio
      const currentOptimized = updated.optimizedBullets ? [...updated.optimizedBullets] : [];
      if (!currentOptimized.includes(improvedText)) {
        currentOptimized.push(improvedText);
      }
      updated.optimizedBullets = currentOptimized;

      onUpdateResume(updated);
      setAppliedRewrites((prev) => ({ ...prev, [idx]: true }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 bg-[#070B14] text-slate-100">
      {/* Upload Modal */}
      {onUpdateResume && (
        <ResumeUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onApplyParsedResume={(parsed) => {
            onUpdateResume(parsed);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00DF89] uppercase tracking-wider">
            <span>Module 3</span>
            <span aria-hidden="true">·</span>
            <span>Job Description Matcher</span>
            <span aria-hidden="true">·</span>
            <span>Candidate: {resumeData.fullName || 'Unset'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Job Description Parsing & ATS Keyword Alignment
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onUpdateResume && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 text-[#00DF89] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>↑ Upload Resume</span>
              <span className="text-[10px] bg-[#00DF89] text-slate-950 px-1.5 py-0.2 rounded font-black">Auto-fill</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('resume')}
            className="px-4 py-2 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md"
          >
            Open in Resume Studio →
          </button>
        </div>
      </div>

      {/* Empty Resume Prompt Banner */}
      {!resumeData.fullName && resumeData.experience.length === 0 && (
        <div className="bg-[#0E1526] border border-[#00DF89]/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00DF89]">
              <span>⚡ AUTO-BENCHMARK YOUR RESUME</span>
            </div>
            <h3 className="text-sm font-bold text-white">Compare your real resume against this Job Description</h3>
            <p className="text-xs text-slate-400">
              Upload your resume (PDF or TXT) to instantly calculate your keyword coverage, ATS checks, and tailored bullet rewrites.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
            >
              ↑ Upload Resume
            </button>
            {onUpdateResume && (
              <button
                onClick={() => onUpdateResume(SAMPLE_MBA_RESUME)}
                className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Use Sample Profile
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Input Column vs Analysis Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Job URL & Previously Viewed Jobs & Text Input */}
        <div className="lg:col-span-5 bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Job Description Source</h3>
            <span className="text-[11px] text-[#00DF89] font-bold bg-[#00DF89]/10 px-2.5 py-0.5 rounded border border-[#00DF89]/30">
              Requirements 3× Weight
            </span>
          </div>

          {/* Job URL Auto-Fetch Section */}
          <div className="space-y-2 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
            <label className="block text-xs font-bold text-[#00DF89]">
              Paste Job URL (LinkedIn, Greenhouse, Lever, etc.):
            </label>
            <form onSubmit={handleFetchFromUrl} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                disabled={isLoading}
                placeholder="https://www.linkedin.com/jobs/view/... or any job posting link"
                className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[#00DF89] disabled:opacity-60 font-mono"
              />
              <button
                type="submit"
                disabled={isLoading || !jobUrl.trim()}
                className="px-3.5 py-2 bg-[#00DF89] hover:bg-[#00c97b] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs rounded-lg whitespace-nowrap transition-all shadow flex items-center justify-center gap-1.5 shrink-0"
              >
                {isLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>Import Job Description</span>
                )}
              </button>
            </form>
            {fetchStatus && (
              <div
                className={`text-xs p-2.5 rounded-lg border flex items-start gap-2 ${
                  fetchStatus.type === 'error'
                    ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                    : fetchStatus.type === 'success'
                    ? 'bg-emerald-950/40 border-[#00DF89]/30 text-[#00DF89]'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                <span className="font-bold shrink-0 mt-0.5">
                  {fetchStatus.type === 'error' ? '⚠' : fetchStatus.type === 'success' ? '✓' : 'ℹ'}
                </span>
                <span className="leading-snug">{fetchStatus.message}</span>
              </div>
            )}
          </div>

          {/* Active Job Reference Section */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-[#00DF89]/40 rounded-xl space-y-1.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#00DF89] uppercase tracking-widest">
                Active Job Reference
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                {fetchedJobMeta.source}
              </span>
            </div>
            <div className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>🎯 {fetchedJobMeta.title}</span>
            </div>
            <div className="text-xs text-slate-300 font-medium">
              🏢 <span className="text-white font-semibold">{fetchedJobMeta.company}</span>
            </div>
          </div>

          {/* Previously Viewed Jobs Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Previously Viewed Jobs
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  {previouslyViewedJobs.length}
                </span>
              </div>
              <span className="text-[11px] text-[#00DF89]">Click to load</span>
            </div>

            {previouslyViewedJobs.length === 0 ? (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
                No previously viewed jobs yet. Paste any public job posting URL above to import a role.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {previouslyViewedJobs.map((job) => {
                  const isSelected = activeJobId === job.id;
                  return (
                    <button
                      key={job.id}
                      onClick={() => handleSelectViewedJob(job)}
                      className={`group relative text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#00DF89] bg-[#00DF89]/15 shadow-sm text-white ring-1 ring-[#00DF89]/40'
                          : 'border-slate-800 bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <span className="truncate font-semibold text-white leading-tight">
                            {job.jobTitle}
                          </span>
                          {isSelected && (
                            <span className="shrink-0 text-[9px] bg-[#00DF89] text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {job.companyName}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[10px] text-slate-500">
                        <span className="truncate max-w-[140px] font-mono">
                          {job.sourceUrl.startsWith('http')
                            ? new URL(job.sourceUrl).hostname.replace(/^www\./, '')
                            : job.sourceUrl}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveViewedJob(e, job.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
                          title="Remove from history"
                        >
                          ✕
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Job Description Text Section (Fully Editable) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Job Description Text (Fully Editable):
              </label>
              <span className="text-[10px] text-slate-500">Live ATS Alignment</span>
            </div>
            <textarea
              rows={11}
              value={jdInputText}
              onChange={(e) => {
                setJdInputText(e.target.value);
              }}
              placeholder="Paste any company job posting text here..."
              className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89] font-mono leading-relaxed"
            ></textarea>
          </div>
        </div>

        {/* Right Column: Score Breakdown & Recommendations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Match Score Card */}
          <div className="bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">Overall Match</span>
                <h3 className="text-xl font-bold text-white">
                  Target Role Inferred: {analysis.inferredRole}
                </h3>
                <div className="text-xs text-slate-400">
                  Formula: 60% Keyword Coverage + 20% Metrics + 20% Structure
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-black text-white tabular-nums">
                    {analysis.overallMatch}%
                  </div>
                  <div className="text-[11px] text-[#00DF89] font-medium">
                    {analysis.overallMatch >= 75 ? 'Strong ATS Pass' : 'Needs Optimization'}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-[#00DF89] flex items-center justify-center font-bold text-xs text-white">
                  {analysis.overallMatch}%
                </div>
              </div>
            </div>

            {/* Sub-Metric Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 font-medium">Keyword Coverage (60%)</div>
                <div className="text-lg font-bold text-white tabular-nums">{analysis.keywordCoverage}%</div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00DF89]" style={{ width: `${analysis.keywordCoverage}%` }}></div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 font-medium">Quantified Metrics (20%)</div>
                <div className="text-lg font-bold text-white tabular-nums">{analysis.quantifiedImpactScore}%</div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#14B8A6]" style={{ width: `${analysis.quantifiedImpactScore}%` }}></div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 font-medium">ATS Structure (20%)</div>
                <div className="text-lg font-bold text-white tabular-nums">{analysis.structureScore}%</div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-600" style={{ width: `${analysis.structureScore}%` }}></div>
                </div>
              </div>
            </div>

            {/* Keyword Analysis Chips */}
            <div className="space-y-4 pt-2">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Critical Missing Keywords (Add to Resume)
                </h4>
                {analysis.missingKeywords.length === 0 ? (
                  <div className="text-xs text-[#00DF89] bg-[#00DF89]/10 p-2.5 rounded-lg border border-[#00DF89]/30">
                    Zero critical keywords missing! Your resume reflects the core taxonomy terms in this posting.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.missingKeywords.slice(0, 10).map((m, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 text-xs rounded border font-medium ${
                          m.importance === 'critical'
                            ? 'bg-rose-950/80 text-rose-400 border-rose-800 font-bold'
                            : 'bg-amber-950/80 text-amber-400 border-amber-800'
                        }`}
                      >
                        + {m.term}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Matched JD Terms ({analysis.matchedKeywords.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.matchedKeywords.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#00DF89]/10 text-[#00DF89] text-xs rounded border border-[#00DF89]/30 font-medium">
                      ✓ {m.term}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6 ATS System Diagnostics */}
          <div className="bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Automated ATS System Diagnostics</h3>
            <div className="space-y-2">
              {analysis.atsChecks.map((check) => (
                <div
                  key={check.id}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                    check.passed ? 'bg-slate-900 border-slate-800' : 'bg-rose-950/40 border-rose-900/60'
                  }`}
                >
                  <span className={`font-bold mt-0.5 ${check.passed ? 'text-[#00DF89]' : 'text-rose-400'}`}>
                    {check.passed ? '✓' : '⚠'}
                  </span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-white">{check.name}</div>
                    <div className="text-slate-400 leading-relaxed">{check.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Bullet Rewriter (With Resume Location and Strict User Action) */}
          <div className="bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">Optimization Engine</span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Targeted Bullet Point Rewrites
                </h3>
                <p className="text-xs text-slate-400">
                  Transforms unquantified resume lines into high-agency executive achievement statements. Shows original resume section heading.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {analysis.bulletRewrites.map((rw: BulletRewrite, i: number) => {
                const isApplied = appliedRewrites[i];
                return (
                  <div key={i} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                    {/* Resume Location Heading */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#070B14] border border-slate-700 text-slate-300 text-[11px] font-medium">
                        <span className="text-[#00DF89] font-bold">📍 Resume Section Location:</span>
                        <span className="text-white font-semibold">{rw.sectionHeading || 'Work Experience'}</span>
                      </div>
                      {isApplied && (
                        <span className="text-[11px] font-bold text-[#00DF89] bg-[#00DF89]/10 px-2 py-0.5 rounded border border-[#00DF89]/30">
                          Updated in Resume Studio ✓
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Original: </span>
                      <span className="text-slate-400 italic">"{rw.original}"</span>
                    </div>

                    <div className="p-3 bg-[#070B14] rounded-lg border border-[#00DF89]/30 text-slate-200 font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="leading-relaxed">
                        <span className="font-bold text-[#00DF89]">Improved: </span>
                        {rw.improved}
                      </div>

                      {onUpdateResume && (
                        <button
                          onClick={() => handleApplyRewrite(rw.original, rw.improved, i)}
                          disabled={isApplied}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                            isApplied
                              ? 'bg-[#00DF89]/20 text-[#00DF89] border border-[#00DF89]/40 cursor-default'
                              : 'bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 shadow-md hover:scale-[1.02]'
                          }`}
                        >
                          {isApplied ? 'Applied to Resume ✓' : 'Apply to Resume →'}
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400">{rw.reason}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
