import React, { useState, useMemo } from 'react';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { analyzeJobDescription } from '../lib/jd';
import { SAMPLE_MBA_RESUME } from '../lib/resume';
import { ResumeData } from '../types';

interface MatchProps {
  resumeData: ResumeData;
  onUpdateResume?: (data: ResumeData) => void;
  onNavigateTab: (tab: string) => void;
}

const SAMPLE_JDS = [
  {
    title: 'Senior Product Manager — FinTech & Monetization',
    company: 'Stripe / Global FinTech',
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
    title: 'Management Consultant / Strategy Associate',
    company: 'McKinsey / BCG / Bain',
    text: `Position Overview:
Join our Strategy & Corporate Finance practice to advise C-suite executives on critical business transformations, market entry sizing, and commercial due diligence.

Responsibilities:
- Structure ambiguous business dilemmas into MECE hypothesis trees and issue hierarchies.
- Conduct commercial due diligence on acquisition targets for top-tier private equity sponsors.
- Synthesize quantitative data into compelling executive presentation decks for client partners.

Requirements:
- Master of Business Administration (MBA) with strong academic distinction.
- Fluency in financial modeling, valuation multiples, DCF, and EBITDA margin expansion.
- Demonstrated competitive benchmarking, market sizing (TAM SAM SOM), and cost reduction frameworks.
- Exceptional stakeholder management, change management, and verbal executive communication.`,
  },
  {
    title: 'Brand Manager — Flagship Consumer Portfolio',
    company: 'Hindustan Unilever / FMCG',
    text: `Job Description:
Own the brand equity, advertising campaigns, and P&L growth for our leading personal care brand across General Trade and E-commerce channels.

Key Deliverables:
- Formulate annual brand positioning and integrated marketing communication (IMC) campaigns.
- Direct creative agency partners on packaging redesign and OOH / digital media plans.
- Track Nielsen market share, consumer segmentation, and category gross margin profitability.

Qualifications & Requirements:
- MBA in Marketing or General Management.
- Experience managing return on ad spend (ROAS), customer segmentation, and trade promotions.
- Strong analytical skills in cohort analysis, pricing elasticity, and go-to-market (GTM) strategy.
- Proven leadership across cross-functional supply chain, vendor negotiation, and sales teams.`,
  },
];

export const Match: React.FC<MatchProps> = ({
  resumeData,
  onUpdateResume,
  onNavigateTab,
}) => {
  const [selectedSampleIdx, setSelectedSampleIdx] = useState(0);
  const [jdInputText, setJdInputText] = useState(SAMPLE_JDS[0].text);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const analysis = useMemo(() => {
    return analyzeJobDescription(jdInputText, resumeData);
  }, [jdInputText, resumeData]);

  const handleSelectSample = (idx: number) => {
    setSelectedSampleIdx(idx);
    setJdInputText(SAMPLE_JDS[idx].text);
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
            className="px-4 py-2 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 text-xs font-bold rounded-xl transition-all"
          >
            Edit Bullets in Studio →
          </button>
        </div>
      </div>

      {/* Empty Resume Prompt Banner */}
      {(!resumeData.fullName && resumeData.experience.length === 0) && (
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
        {/* Left Column: JD Input & Sample Selector */}
        <div className="lg:col-span-5 bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Job Description Source</h3>
            <span className="text-[11px] text-[#00DF89] font-bold bg-[#00DF89]/10 px-2.5 py-0.5 rounded border border-[#00DF89]/30">
              Requirements 3× Weight
            </span>
          </div>

          {/* Sample Pills */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-400">Load Curated MBA Sample JD:</div>
            <div className="flex flex-col gap-1.5">
              {SAMPLE_JDS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(idx)}
                  className={`text-left p-3 rounded-xl border text-xs transition-colors ${
                    selectedSampleIdx === idx
                      ? 'border-[#00DF89] bg-[#00DF89]/10 font-bold text-white'
                      : 'border-slate-800 hover:bg-slate-900/80 text-slate-300'
                  }`}
                >
                  <div className="truncate font-semibold">{sample.title}</div>
                  <div className="text-[11px] text-slate-500 font-normal">{sample.company}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Raw Textarea */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-semibold text-slate-300">Or Paste Custom Job Description:</label>
            <textarea
              rows={12}
              value={jdInputText}
              onChange={(e) => {
                setJdInputText(e.target.value);
                setSelectedSampleIdx(-1);
              }}
              placeholder="Paste any company job posting text here..."
              className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89] font-mono"
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

          {/* Smart Bullet Rewriter (XYZ Formula) */}
          <div className="bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div>
              <span className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">Optimization Engine</span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Targeted Bullet Point Rewrites (XYZ Framework)
              </h3>
              <p className="text-xs text-slate-400">
                Transforms unquantified resume lines into high-agency executive achievement statements.
              </p>
            </div>

            <div className="space-y-3">
              {analysis.bulletRewrites.map((rw, i) => (
                <div key={i} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Original: </span>
                    <span className="text-slate-400 italic">"{rw.original}"</span>
                  </div>
                  <div className="p-2.5 bg-[#070B14] rounded-lg border border-[#00DF89]/30 text-slate-200 font-medium">
                    <span className="font-bold text-[#00DF89]">Improved: </span>
                    {rw.improved}
                  </div>
                  <div className="text-[11px] text-slate-500">{rw.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
