import React, { useState, useMemo } from 'react';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { analyzeJobDescription } from '../lib/jd';
import { SAMPLE_MBA_RESUME } from '../lib/resume';
import {
  GapClassification,
  RequirementGap,
  ResumeData,
} from '../types';

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

function isHttpUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  return urlString.startsWith('http://') || urlString.startsWith('https://');
}

function formatShortUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const pathPart = parsed.pathname.length > 22 ? parsed.pathname.slice(0, 20) + '…' : parsed.pathname;
    return `${parsed.hostname}${pathPart !== '/' ? pathPart : ''}`;
  } catch {
    return rawUrl.length > 35 ? rawUrl.slice(0, 32) + '…' : rawUrl;
  }
}

export const Match: React.FC<MatchProps> = ({
  resumeData,
  onUpdateResume,
  onNavigateTab,
}) => {
  const [jobUrl, setJobUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
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
      source: first ? first.sourceUrl : 'Curated MBA Role',
    };
  });

  // Controlled textarea bound directly to jdInputText
  const [jdInputText, setJdInputText] = useState<string>(() => {
    return previouslyViewedJobs[0]?.jobDescription || MBA_ROLES_CATALOG[0].text;
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [appliedGaps, setAppliedGaps] = useState<Record<string, boolean>>({});
  const [editedSuggestions, setEditedSuggestions] = useState<Record<string, string>>({});
  const [confirmedGaps, setConfirmedGaps] = useState<Record<string, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState<'all' | GapClassification>('all');

  // Real-time analysis reactive to jdInputText and resumeData
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
    setJdInputText(job.jobDescription);
    setFetchStatus({
      type: 'success',
      message: `Loaded job description for "${job.jobTitle}" ✓`,
    });
  };

  // PART 2: Remove single job from history with complete state consistency
  const handleRemoveViewedJob = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation(); // Stop propagation to prevent selecting the job on delete

    const updatedList = previouslyViewedJobs.filter((j) => j.id !== idToRemove);
    saveViewedJobs(updatedList);

    // If the deleted job was currently active:
    if (activeJobId === idToRemove) {
      if (updatedList.length > 0) {
        // Select next remaining history item and sync title, company, URL, and description
        const nextJob = updatedList[0];
        setActiveJobId(nextJob.id);
        setFetchedJobMeta({
          title: nextJob.jobTitle,
          company: nextJob.companyName,
          source: nextJob.sourceUrl,
        });
        setJdInputText(nextJob.jobDescription);
        setFetchStatus({
          type: 'success',
          message: `Active job switched to "${nextJob.jobTitle}" after deletion ✓`,
        });
      } else {
        // No history items remain: clear active job reference gracefully, leave JD editable
        setActiveJobId('');
        setFetchedJobMeta({
          title: 'Custom Job Description',
          company: 'Manual Input',
          source: 'User Draft',
        });
        setFetchStatus({
          type: 'idle',
          message: 'Job removed from history. The description text area remains open for manual editing.',
        });
      }
    } else {
      // Non-active job deleted: leave active job and its description unchanged!
      setFetchStatus({
        type: 'idle',
        message: 'Removed job from history.',
      });
    }
  };

  // Copy active job URL action
  const handleCopyActiveJobUrl = async () => {
    if (!fetchedJobMeta.source || !isHttpUrl(fetchedJobMeta.source)) return;
    try {
      await navigator.clipboard.writeText(fetchedJobMeta.source);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // fallback
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

      // Check if server endpoint returned 404 (static hosting fallback e.g. GitHub Pages)
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

      // Set active job reference and update URL display
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
      // Preserve existing text in text area on error
      setFetchStatus({
        type: 'error',
        message: err.message || 'Could not fetch job posting. You can paste the job description directly below.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // PART 5: Apply to Resume handler — strictly evidence-based
  const handleApplyGapImprovement = (gap: RequirementGap) => {
    if (!onUpdateResume || !gap.supportingEvidence) return;

    const originalText = gap.supportingEvidence.originalBullet;
    const finalImprovedText = (editedSuggestions[gap.id] || gap.recommendedImprovement || '').trim();
    if (!finalImprovedText) return;

    // Deep clone resume data
    const updated: ResumeData = JSON.parse(JSON.stringify(resumeData));
    let replaced = false;

    // Search experience bullets
    for (const exp of updated.experience) {
      for (let b = 0; b < exp.bullets.length; b++) {
        if (
          exp.bullets[b].trim().toLowerCase() === originalText.trim().toLowerCase() ||
          exp.bullets[b].includes(originalText.slice(0, 25))
        ) {
          exp.bullets[b] = finalImprovedText;
          replaced = true;
          break;
        }
      }
      if (replaced) break;
    }

    // Search projects if not found in experience
    if (!replaced) {
      for (const proj of updated.projects) {
        for (let b = 0; b < proj.bullets.length; b++) {
          if (
            proj.bullets[b].trim().toLowerCase() === originalText.trim().toLowerCase() ||
            proj.bullets[b].includes(originalText.slice(0, 25))
          ) {
            proj.bullets[b] = finalImprovedText;
            replaced = true;
            break;
          }
        }
        if (replaced) break;
      }
    }

    if (replaced) {
      // Track newly optimized bullet for highlight in Resume Studio
      const currentOptimized = updated.optimizedBullets ? [...updated.optimizedBullets] : [];
      if (!currentOptimized.includes(finalImprovedText)) {
        currentOptimized.push(finalImprovedText);
      }
      updated.optimizedBullets = currentOptimized;

      onUpdateResume(updated);
      setAppliedGaps((prev) => ({ ...prev, [gap.id]: true }));
    }
  };

  // Candidate confirmation for Category D (Uncertain)
  const handleConfirmCandidateExperience = (gapId: string, confirmed: boolean) => {
    setConfirmedGaps((prev) => ({ ...prev, [gapId]: confirmed }));
  };

  // Filtered requirement gaps
  const displayedGaps = useMemo(() => {
    if (categoryFilter === 'all') return analysis.requirementGaps;
    return analysis.requirementGaps.filter((g) => g.classification === categoryFilter);
  }, [analysis.requirementGaps, categoryFilter]);

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
        {/* Left Column: Job URL & Active Job Reference & Previously Viewed Jobs & Text Input */}
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
                placeholder="https://www.linkedin.com/jobs/view/... or any job link"
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

          {/* PART 1: Improved Active Job Reference Section */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-[#00DF89]/40 rounded-xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#00DF89] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00DF89] animate-pulse"></span>
                Active Job Reference
              </span>
              {isHttpUrl(fetchedJobMeta.source) && (
                <button
                  type="button"
                  onClick={handleCopyActiveJobUrl}
                  className="text-[11px] text-slate-400 hover:text-[#00DF89] flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 transition-colors"
                  title="Copy original job posting link"
                  aria-label="Copy job posting URL"
                >
                  <span>{copiedUrl ? 'Copied ✓' : 'Copy Link'}</span>
                </button>
              )}
            </div>

            {/* Display Order: Job Title prominent, followed by Company Name · Original Job Posting URL */}
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span className="text-emerald-400">🎯</span>
                <span>{fetchedJobMeta.title || 'Target Job Role'}</span>
              </h2>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300">
                <span className="font-semibold text-white flex items-center gap-1">
                  <span>🏢</span>
                  <span>{fetchedJobMeta.company || 'Target Employer'}</span>
                </span>

                <span className="text-slate-600 font-bold" aria-hidden="true">·</span>

                {isHttpUrl(fetchedJobMeta.source) ? (
                  <a
                    href={fetchedJobMeta.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#00DF89] hover:underline hover:text-[#38ef9e] font-medium transition-colors break-all group max-w-full sm:max-w-md"
                    title={`Open original job posting: ${fetchedJobMeta.source}`}
                    aria-label={`Open job posting URL in new tab: ${fetchedJobMeta.source}`}
                  >
                    <span className="truncate max-w-[220px] sm:max-w-[320px]">
                      {formatShortUrl(fetchedJobMeta.source)}
                    </span>
                    <span className="text-[10px] opacity-80 group-hover:opacity-100 shrink-0 font-bold">↗</span>
                  </a>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">
                    {fetchedJobMeta.source || 'Curated Reference Role'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PART 2: Previously Viewed Jobs Section with Clear Delete Control */}
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
              <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto pr-1">
                {previouslyViewedJobs.map((job) => {
                  const isSelected = activeJobId === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => handleSelectViewedJob(job)}
                      className={`group relative text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-[#00DF89] bg-[#00DF89]/15 shadow-sm text-white ring-1 ring-[#00DF89]/40'
                          : 'border-slate-800 bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate font-bold text-white text-xs leading-tight">
                            {job.jobTitle}
                          </span>
                          {isSelected && (
                            <span className="shrink-0 text-[9px] bg-[#00DF89] text-slate-950 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                          {job.companyName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate mt-1">
                          {isHttpUrl(job.sourceUrl) ? formatShortUrl(job.sourceUrl) : job.sourceUrl}
                        </div>
                      </div>

                      {/* PART 2: Delete Control (Visible, adequate clickable area, accessible, stopPropagation) */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveViewedJob(e, job.id)}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:text-rose-400 hover:bg-rose-950/60 hover:border-rose-800 active:scale-95 transition-all focus:outline-none focus:ring-1 focus:ring-rose-500"
                        title="Delete job from history"
                        aria-label={`Delete ${job.jobTitle} from history`}
                      >
                        <span className="text-sm font-bold leading-none">✕</span>
                      </button>
                    </div>
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

        {/* Right Column: Score Breakdown & Evidence-Based Gap Optimization */}
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
          </div>

          {/* PART 4 & 6: Evidence-Based Resume Optimization Engine */}
          <div className="bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">
                    Optimization Engine
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Evidence-Based Requirement & Gap Analysis
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {analysis.requirementGaps.length} Total Requirements
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Differentiates between skills already supported by your experience versus genuine skill gaps. Apply to Resume is strictly restricted to evidence-backed rewrites.
              </p>
            </div>

            {/* Overall 4-Category Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter('category_a_matched')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  categoryFilter === 'category_a_matched'
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-900/80 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Matched</div>
                <div className="text-lg font-black text-white tabular-nums">{analysis.summary.matchedCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Fully Evidenced</div>
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter('category_b_improve')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  categoryFilter === 'category_b_improve'
                    ? 'border-[#00DF89] bg-[#00DF89]/15 text-[#00DF89] ring-1 ring-[#00DF89]/50'
                    : 'border-slate-800 bg-slate-900/80 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="text-[10px] text-[#00DF89] font-bold uppercase tracking-wider">Can Improve</div>
                <div className="text-lg font-black text-white tabular-nums">{analysis.summary.improveCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Apply Eligible</div>
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter('category_c_missing')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  categoryFilter === 'category_c_missing'
                    ? 'border-rose-500 bg-rose-950/40 text-rose-300 ring-1 ring-rose-500/50'
                    : 'border-slate-800 bg-slate-900/80 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Missing Gaps</div>
                <div className="text-lg font-black text-white tabular-nums">{analysis.summary.missingCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">No Fake Bullets</div>
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter('category_d_uncertain')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  categoryFilter === 'category_d_uncertain'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/50'
                    : 'border-slate-800 bg-slate-900/80 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Uncertain</div>
                <div className="text-lg font-black text-white tabular-nums">{analysis.summary.uncertainCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Confirm Details</div>
              </button>
            </div>

            {/* Filter Tabs Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-800">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-[#00DF89] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                All Requirements ({analysis.requirementGaps.length})
              </button>
              <button
                onClick={() => setCategoryFilter('category_b_improve')}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  categoryFilter === 'category_b_improve'
                    ? 'bg-[#00DF89] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>⚡ Can Improve</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300">
                  {analysis.summary.improveCount}
                </span>
              </button>
              <button
                onClick={() => setCategoryFilter('category_c_missing')}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  categoryFilter === 'category_c_missing'
                    ? 'bg-rose-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>✕ Missing Skills</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300">
                  {analysis.summary.missingCount}
                </span>
              </button>
              <button
                onClick={() => setCategoryFilter('category_d_uncertain')}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  categoryFilter === 'category_d_uncertain'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>❓ Needs Confirmation</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300">
                  {analysis.summary.uncertainCount}
                </span>
              </button>
              <button
                onClick={() => setCategoryFilter('category_a_matched')}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  categoryFilter === 'category_a_matched'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>✓ Matched</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300">
                  {analysis.summary.matchedCount}
                </span>
              </button>
            </div>

            {/* List of Requirement Gaps */}
            <div className="space-y-4">
              {displayedGaps.length === 0 ? (
                <div className="p-6 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
                  No requirements found in this filter category.
                </div>
              ) : (
                displayedGaps.map((gap) => {
                  const isApplied = appliedGaps[gap.id];
                  const isConfirmed = confirmedGaps[gap.id];

                  return (
                    <div
                      key={gap.id}
                      className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs"
                    >
                      {/* Header row with Requirement Name, Category, Priority, and Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm tracking-tight capitalize">
                            {gap.requirement}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                            {gap.category}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              gap.importance === 'critical'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                                : gap.importance === 'important'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {gap.importance} Priority
                          </span>
                        </div>

                        {/* Classification Badge */}
                        <div>
                          {gap.classification === 'category_a_matched' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-800/50">
                              ✓ Verified in Resume
                            </span>
                          )}
                          {gap.classification === 'category_b_improve' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00DF89] bg-[#00DF89]/10 px-2.5 py-0.5 rounded border border-[#00DF89]/30">
                              ⚡ Can Improve Representation
                            </span>
                          )}
                          {gap.classification === 'category_c_missing' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/40 px-2.5 py-0.5 rounded border border-rose-800/50">
                              ✕ Missing Skill Gap
                            </span>
                          )}
                          {gap.classification === 'category_d_uncertain' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-800/50">
                              ❓ Needs Confirmation
                            </span>
                          )}
                        </div>
                      </div>

                      {/* PART 3: Fixed Clean Resume Section & Location Context Header */}
                      {gap.supportingEvidence && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-[#070B14] rounded-lg border border-slate-800 flex items-center gap-2">
                            <span className="text-[#00DF89] font-bold shrink-0">📍 Resume Section:</span>
                            <span className="text-white font-semibold truncate capitalize">
                              {gap.supportingEvidence.sectionType}
                            </span>
                          </div>
                          <div className="p-2.5 bg-[#070B14] rounded-lg border border-slate-800 flex items-center gap-2 min-w-0">
                            <span className="text-slate-400 font-bold shrink-0">Role / Context:</span>
                            <span className="text-slate-200 font-medium truncate">
                              {gap.supportingEvidence.roleOrCompany || gap.supportingEvidence.sectionHeading}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Explanation of Gap */}
                      <p className="text-slate-300 leading-relaxed text-xs">
                        {gap.explanation}
                      </p>

                      {/* CATEGORY A: Display supporting evidence bullet directly */}
                      {gap.classification === 'category_a_matched' && gap.supportingEvidence && (
                        <div className="p-3 bg-[#070B14] rounded-lg border border-emerald-900/40 text-slate-300 space-y-1">
                          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            Supporting Resume Evidence:
                          </div>
                          <div className="italic text-slate-200">
                            "{gap.supportingEvidence.originalBullet}"
                          </div>
                        </div>
                      )}

                      {/* CATEGORY B: Evidence-backed improvement with editable field and Apply to Resume */}
                      {gap.classification === 'category_b_improve' && gap.supportingEvidence && (
                        <div className="space-y-3 pt-1">
                          {/* Original wording */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Original Bullet in Resume:
                            </span>
                            <div className="p-2.5 bg-[#070B14] rounded-lg border border-slate-800 text-slate-400 italic mt-1">
                              "{gap.supportingEvidence.originalBullet}"
                            </div>
                          </div>

                          {/* Editable proposed improvement */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-[#00DF89] uppercase tracking-wider">
                                Proposed Truthful Enhancement (Editable):
                              </span>
                              <span className="text-[10px] text-slate-400">Review before applying</span>
                            </div>
                            <textarea
                              rows={3}
                              value={
                                editedSuggestions[gap.id] !== undefined
                                  ? editedSuggestions[gap.id]
                                  : gap.recommendedImprovement || ''
                              }
                              onChange={(e) =>
                                setEditedSuggestions({ ...editedSuggestions, [gap.id]: e.target.value })
                              }
                              disabled={isApplied}
                              className="w-full p-2.5 bg-[#070B14] border border-[#00DF89]/40 rounded-lg text-white font-medium text-xs focus:outline-none focus:border-[#00DF89] leading-relaxed disabled:opacity-70"
                            ></textarea>
                          </div>

                          {/* Apply Action (Strictly Evidence-Backed) */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] text-slate-400">
                              Replaces the original bullet in your resume and highlights it in Resume Studio.
                            </span>

                            {onUpdateResume && (
                              <button
                                type="button"
                                onClick={() => handleApplyGapImprovement(gap)}
                                disabled={isApplied}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${
                                  isApplied
                                    ? 'bg-[#00DF89]/20 text-[#00DF89] border border-[#00DF89]/40 cursor-default'
                                    : 'bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 shadow-md hover:scale-[1.01]'
                                }`}
                              >
                                {isApplied ? 'Applied to Resume ✓' : 'Apply to Resume →'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CATEGORY C: Genuinely missing skill (NO Apply to Resume button!) */}
                      {gap.classification === 'category_c_missing' && (
                        <div className="p-3.5 bg-rose-950/20 rounded-xl border border-rose-900/40 space-y-2">
                          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                            <span>🛡️ Integrity Check: Genuinely Unsupported Requirement</span>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">
                            {gap.recommendedAction}
                          </p>
                          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800">
                            <strong>Note:</strong> In accordance with resume integrity standards, an "Apply to Resume" action is not offered for skills not demonstrated in your experience history.
                          </div>
                        </div>
                      )}

                      {/* CATEGORY D: Uncertain / Needs confirmation */}
                      {gap.classification === 'category_d_uncertain' && (
                        <div className="p-3.5 bg-amber-950/20 rounded-xl border border-amber-900/40 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300 text-xs">
                              Candidate Confirmation Required:
                            </span>
                            {isConfirmed && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
                                Verified by Candidate ✓
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 text-xs">
                            {gap.recommendedAction}
                          </p>

                          {!isConfirmed ? (
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleConfirmCandidateExperience(gap.id, true)}
                                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                              >
                                I have hands-on experience with {gap.requirement}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmCandidateExperience(gap.id, false)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-colors"
                              >
                                I do not have this skill
                              </button>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-emerald-950/30 rounded-lg border border-emerald-800 text-emerald-200 text-xs">
                              Experience confirmed! You can now add verified details directly into your work experience in Resume Studio.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
        </div>
      </div>
    </div>
  );
};
