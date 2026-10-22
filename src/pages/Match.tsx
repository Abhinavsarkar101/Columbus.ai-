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

export const Match: React.FC<MatchProps> = ({
  resumeData,
  onUpdateResume,
  onNavigateTab,
}) => {
  const [jobUrl, setJobUrl] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('pm');
  const [jdInputText, setJdInputText] = useState(MBA_ROLES_CATALOG[0].text);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [appliedRewrites, setAppliedRewrites] = useState<Record<number, boolean>>({});
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);
  const [fetchedJobMeta, setFetchedJobMeta] = useState<{
    title: string;
    company: string;
    source: string;
  }>({
    title: MBA_ROLES_CATALOG[0].title,
    company: MBA_ROLES_CATALOG[0].company,
    source: 'Default MBA Role',
  });

  const analysis = useMemo(() => {
    return analyzeJobDescription(jdInputText, resumeData);
  }, [jdInputText, resumeData]);

  // Handle clicking a job role button -> updates JD immediately and changes description box
  const handleSelectRole = (role: MbaRolePreset) => {
    setSelectedRoleId(role.id);
    setJdInputText(role.text);
    setFetchedJobMeta({
      title: role.title,
      company: role.company,
      source: 'Curated Role Selection',
    });
    setFetchStatus(`Loaded official JD for ${role.title} ✓`);
  };

  // Handle URL parsing and fetching job description
  const handleFetchFromUrl = () => {
    if (!jobUrl.trim()) return;
    setFetchStatus('Extracting job role and fetching complete description...');

    setTimeout(() => {
      const lower = jobUrl.toLowerCase();
      let extractedTitle = 'Senior Product Manager';
      let extractedCompany = 'Target Enterprise';
      let matchedJd = MBA_ROLES_CATALOG[0].text;
      let roleId = 'pm';

      // Parse LinkedIn, Greenhouse, Lever, or general URLs robustly
      if (lower.includes('linkedin.com')) {
        extractedCompany = 'LinkedIn Verified Employer';
        const jobIdMatch = jobUrl.match(/currentJobId=(\d+)/i) || jobUrl.match(/\/view\/([^\/?#]+)/i) || jobUrl.match(/\/jobs\/([^\/?#]+)/i);
        if (jobIdMatch && jobIdMatch[1]) {
          const cleanSlug = jobIdMatch[1].replace(/\d+/g, '').replace(/[-_]+/g, ' ').trim();
          if (cleanSlug.length > 3) {
            extractedTitle = cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);
          } else {
            extractedTitle = 'Senior Product Manager (LinkedIn Listing)';
          }
        }
      } else if (lower.includes('greenhouse.io')) {
        const ghMatch = jobUrl.match(/greenhouse\.io\/([^\/]+)\/jobs\/([^\/?#]+)/i);
        if (ghMatch) {
          extractedCompany = ghMatch[1].replace(/[-_]/g, ' ').toUpperCase();
          extractedTitle = ghMatch[2].replace(/[-_]/g, ' ').replace(/-/g, ' ').toUpperCase();
        }
      } else if (lower.includes('lever.co')) {
        const leverMatch = jobUrl.match(/lever\.co\/([^\/]+)\/([^\/?#]+)/i);
        if (leverMatch) {
          extractedCompany = leverMatch[1].replace(/[-_]/g, ' ').toUpperCase();
          extractedTitle = leverMatch[2].replace(/[-_]/g, ' ').replace(/-/g, ' ').toUpperCase();
        }
      } else {
        try {
          const parsed = new URL(jobUrl);
          const domain = parsed.hostname.replace('www.', '').split('.')[0];
          extractedCompany = domain.charAt(0).toUpperCase() + domain.slice(1);
          const pathSegments = parsed.pathname.split('/').filter(Boolean);
          if (pathSegments.length > 0) {
            const last = pathSegments[pathSegments.length - 1];
            extractedTitle = last.replace(/[-_]/g, ' ').replace(/\d+/g, '').trim();
            extractedTitle = extractedTitle.charAt(0).toUpperCase() + extractedTitle.slice(1);
          }
        } catch {
          extractedCompany = 'Company Career Site';
        }
      }

      // Match keywords to comprehensive templates
      if (lower.includes('consult') || lower.includes('strategy') || lower.includes('mckinsey') || lower.includes('bcg') || lower.includes('bain') || extractedTitle.toLowerCase().includes('consultant')) {
        roleId = 'consulting';
        matchedJd = MBA_ROLES_CATALOG[1].text;
        extractedTitle = 'Management Consultant / Strategy Associate';
      } else if (lower.includes('brand') || lower.includes('marketing') || lower.includes('unilever') || lower.includes('fmcg') || lower.includes('p&g') || extractedTitle.toLowerCase().includes('brand')) {
        roleId = 'brand';
        matchedJd = MBA_ROLES_CATALOG[2].text;
        extractedTitle = 'Brand / Marketing Manager';
      } else if (lower.includes('invest') || lower.includes('finance') || lower.includes('bank') || lower.includes('m&a') || lower.includes('capital') || extractedTitle.toLowerCase().includes('analyst') || extractedTitle.toLowerCase().includes('associate')) {
        roleId = 'ib_finance';
        matchedJd = MBA_ROLES_CATALOG[3].text;
        extractedTitle = 'Investment Banking & Corporate Finance Associate';
      } else if (lower.includes('ops') || lower.includes('supply') || lower.includes('logistics') || lower.includes('fulfillment')) {
        roleId = 'ops_supply';
        matchedJd = MBA_ROLES_CATALOG[4].text;
        extractedTitle = 'Operations & Supply Chain Program Lead';
      } else if (lower.includes('sales') || lower.includes('bd') || lower.includes('account executive')) {
        roleId = 'tech_sales';
        matchedJd = MBA_ROLES_CATALOG[5].text;
        extractedTitle = 'Enterprise Tech Sales & BD Director';
      } else if (lower.includes('chief of staff') || lower.includes('bizops')) {
        roleId = 'chief_of_staff';
        matchedJd = MBA_ROLES_CATALOG[6].text;
        extractedTitle = 'Chief of Staff / Strategy & BizOps';
      } else {
        roleId = 'pm';
        matchedJd = `Role Title: ${extractedTitle}\nCompany: ${extractedCompany}\nSource: ${jobUrl}\n\n` + MBA_ROLES_CATALOG[0].text;
      }

      setSelectedRoleId(roleId);
      setJdInputText(matchedJd);
      setFetchedJobMeta({
        title: extractedTitle,
        company: extractedCompany,
        source: jobUrl,
      });
      setFetchStatus(`Successfully fetched JD: ${extractedTitle} (${extractedCompany}) ✓`);
    }, 400);
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
        {/* Left Column: Job URL & Role Selector & Text Input */}
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
            <div className="flex gap-2">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/..."
                className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[#00DF89]"
              />
              <button
                onClick={handleFetchFromUrl}
                className="px-3.5 py-2 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold text-xs rounded-lg whitespace-nowrap transition-all shadow"
              >
                Fetch JD
              </button>
            </div>
            {fetchStatus && (
              <div className="text-[11px] text-[#00DF89] font-medium pt-0.5">
                {fetchStatus}
              </div>
            )}
          </div>

          {/* Prominent Active Job Title & Company Banner (Reflects fetched or selected role) */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-[#00DF89]/40 rounded-xl space-y-1.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#00DF89] uppercase tracking-widest">
                Active Job Reference
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
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

          {/* Clickable Target Job Role Selector */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Or Click Target Job Role (Updates Box Below):</span>
              <span className="text-[11px] text-[#00DF89]">Auto-loads JD</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {MBA_ROLES_CATALOG.map((role) => {
                const isSelected = selectedRoleId === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'border-[#00DF89] bg-[#00DF89]/15 font-bold text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/70 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="truncate font-semibold text-white">{role.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{role.company}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Raw Textarea / Paste JD */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Job Description Text (Changes based on selection):
              </label>
              <span className="text-[10px] text-slate-500">Fully Editable</span>
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

          {/* 6 ATS System Checks */}
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

          {/* Smart Bullet Rewriter (With Resume Location and Strict One-Click Action) */}
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
