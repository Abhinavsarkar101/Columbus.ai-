import React, { useState } from 'react';
import {
  RotateCcw,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  FileDown,
  Download,
  Info,
  ShieldCheck,
  Search,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ThreeBlockResultCard,
  EngineAnalysisResult,
  MatchClassification,
  RequirementPriority,
} from '../lib/match-engine-types';

interface AtsEngineResultsViewProps {
  jdText: string;
  activeJobInfo: {
    title: string;
    company: string;
    source: string;
  };
  engineResult: EngineAnalysisResult | null;
  isAnalyzing: boolean;
  onResetAll: () => void;
  onLoadSampleJd: () => void;
  onQuickDownloadPdf: () => void;
  onOpenExportModal: () => void;
  onRetry: () => void;
}

export const AtsEngineResultsView: React.FC<AtsEngineResultsViewProps> = ({
  jdText,
  activeJobInfo,
  engineResult,
  isAnalyzing,
  onResetAll,
  onLoadSampleJd,
  onQuickDownloadPdf,
  onOpenExportModal,
  onRetry,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | MatchClassification>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | RequirementPriority>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // When no JD is loaded
  if (!jdText.trim()) {
    return (
      <div className="bg-[#0E1526] p-10 rounded-2xl border border-dashed border-slate-800 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-[#00DF89]">
          <FileText className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-semibold text-white">No Job Description Loaded</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Paste a job description on the left, import a job link, or click below to load an example job to see deterministic ATS requirement matching against your resume.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onLoadSampleJd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00DF89] hover:bg-[#00c576] text-black text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-[#00DF89]/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Sample Job Posting
          </button>
        </div>
      </div>
    );
  }

  // When analyzing
  if (isAnalyzing && !engineResult) {
    return (
      <div className="bg-[#0E1526] p-12 rounded-2xl border border-slate-800 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#00DF89] border-t-transparent animate-spin" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">Auditing JD & Resume with ATS Engine...</h3>
          <p className="text-xs text-slate-400">
            Running deterministic @veriworkly/ats-engine checks across requirements, evidence units, and qualifications.
          </p>
        </div>
      </div>
    );
  }

  // When extraction failed or 0 requirements found
  if (!engineResult || engineResult.cards.length === 0) {
    return (
      <div className="bg-[#0E1526] p-8 rounded-2xl border border-rose-900/40 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <XCircle className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-sm font-bold text-white">Extraction Incomplete</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The ATS engine could not extract structured requirements from this posting. The text may be too short, missing standard sections, or contain unstructured formatting.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Analysis
          </button>
          <button
            type="button"
            onClick={onResetAll}
            className="px-4 py-2 bg-[#00DF89] hover:bg-[#00c576] text-black text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Reset Workspace
          </button>
        </div>
      </div>
    );
  }

  const { cards, scoreBreakdown } = engineResult;
  const { roleFitScore, counts } = scoreBreakdown;

  // Filter cards strictly
  let displayedCards = cards;
  if (activeFilter !== 'all') {
    displayedCards = displayedCards.filter((c) => c.classification === activeFilter);
  }
  if (priorityFilter !== 'all') {
    displayedCards = displayedCards.filter((c) => c.jobAsks.priority === priorityFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    displayedCards = displayedCards.filter(
      (c) =>
        c.requirement.verbatimQuote.toLowerCase().includes(q) ||
        c.requirement.canonicalTerm.toLowerCase().includes(q) ||
        (c.yourResume.evidencePhrase && c.yourResume.evidencePhrase.toLowerCase().includes(q))
    );
  }

  const fitTierLabel =
    roleFitScore >= 75
      ? 'Strong Role Fit'
      : roleFitScore >= 50
      ? 'Competitive with Gaps'
      : 'Substantial Gaps';

  const fitTierStyle =
    roleFitScore >= 75
      ? 'bg-emerald-950/80 text-[#00DF89] border-[#00DF89]/40'
      : roleFitScore >= 50
      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
      : 'bg-rose-950/80 text-rose-300 border-rose-500/40';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">
                Overall Role Fit
              </span>
              <span className="text-[10px] bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#00DF89]" />
                @veriworkly/ats-engine (Deterministic)
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {roleFitScore}%
              </h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${fitTierStyle}`}>
                {fitTierLabel}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                — {counts.matched + counts.canImprove} of {counts.total} requirements evidenced
              </span>
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Target: <span className="text-white font-semibold">{activeJobInfo.title || 'Target Role'}</span>
              {activeJobInfo.company ? ` @ ${activeJobInfo.company}` : ''}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={onResetAll}
              className="bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/40 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Reset both JD and match results back to fresh state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={onQuickDownloadPdf}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Download instant PDF Job Match Audit report"
            >
              <FileDown className="w-3.5 h-3.5 text-[#00DF89]" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onOpenExportModal}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl p-1.5 text-xs transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              title="Export Full Report (PDF, Markdown, JSON)"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Honest Framing Banner */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-emerald-950/60 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
          <Info className="w-4 h-4 text-[#00DF89] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Honest Framing: </span>
            {scoreBreakdown.honestSummary}
          </div>
        </div>

        {/* 4 Summary Category Filter Cards (Counters equal to rendered cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'all' ? 'all' : 'all')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 border-slate-600 ring-1 ring-slate-500'
                : 'bg-slate-950 border-slate-800 hover:bg-slate-900/50'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400">Total Evaluated</div>
            <div className="text-xl font-bold text-white mt-1">{counts.total}</div>
            <div className="text-[10px] text-slate-500">All requirements</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'matched' ? 'all' : 'matched')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === 'matched'
                ? 'bg-emerald-950/90 border-[#00DF89] ring-1 ring-[#00DF89]'
                : 'bg-emerald-950/30 border-emerald-900/40 hover:bg-emerald-950/50'
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00DF89]" />
              Directly Matched
            </div>
            <div className="text-xl font-bold text-[#00DF89] mt-1">{counts.matched}</div>
            <div className="text-[10px] text-emerald-400/70">Found in resume</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'can_improve' ? 'all' : 'can_improve')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === 'can_improve'
                ? 'bg-amber-950/90 border-amber-500 ring-1 ring-amber-500'
                : 'bg-amber-950/30 border-amber-900/40 hover:bg-amber-950/50'
            }`}
          >
            <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Can Sharpen
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">{counts.canImprove}</div>
            <div className="text-[10px] text-amber-400/70">Partial / Needs metrics</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'missing' ? 'all' : 'missing')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === 'missing'
                ? 'bg-rose-950/90 border-rose-500 ring-1 ring-rose-500'
                : 'bg-rose-950/30 border-rose-900/40 hover:bg-rose-950/50'
            }`}
          >
            <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              Missing Gaps
            </div>
            <div className="text-xl font-bold text-rose-400 mt-1">{counts.missing}</div>
            <div className="text-[10px] text-rose-400/70">Not evidenced</div>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0E1526] p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold">Priority:</span>
          {(['all', 'critical', 'preferred'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer capitalize ${
                priorityFilter === p
                  ? 'bg-[#00DF89] text-black border-[#00DF89] font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Priorities' : p}
            </button>
          ))}
          {activeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="text-xs text-[#00DF89] font-bold hover:underline ml-2 cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filter
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requirements..."
            className="w-full sm:w-56 text-xs px-3 py-1.5 pl-8 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00DF89]"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1.5 text-slate-500 hover:text-white text-xs cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* THREE-BLOCK RESULT CARDS LIST (Counters equal cards) */}
      <div className="space-y-4">
        {displayedCards.length > 0 ? (
          displayedCards.map((card, idx) => {
            const isMatched = card.classification === 'matched';
            const isCanImprove = card.classification === 'can_improve';
            const isMissing = card.classification === 'missing';

            return (
              <div
                key={card.id || idx}
                className={`bg-[#0E1526] rounded-2xl border transition-all shadow-md overflow-hidden ${
                  isMatched
                    ? 'border-emerald-900/60 hover:border-emerald-700/80'
                    : isCanImprove
                    ? 'border-amber-900/60 hover:border-amber-700/80'
                    : isMissing
                    ? 'border-rose-900/60 hover:border-rose-700/80'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-5 space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                            card.jobAsks.priority === 'critical'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-600/40'
                              : 'bg-slate-900 text-slate-300 border-slate-700'
                          }`}
                        >
                          {card.jobAsks.priority === 'critical' ? 'Required' : 'Preferred'}
                        </span>

                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 capitalize">
                          {card.jobAsks.type.replace('_', ' ')}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1 ${
                            isMatched
                              ? 'bg-emerald-950/80 text-[#00DF89] border-[#00DF89]/40'
                              : isCanImprove
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                              : isMissing
                              ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                              : 'bg-slate-900 text-slate-300 border-slate-700'
                          }`}
                        >
                          {isMatched ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-[#00DF89]" />
                              <span>Direct Match</span>
                            </>
                          ) : isCanImprove ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Needs Sharpening</span>
                            </>
                          ) : isMissing ? (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>Missing Gap</span>
                            </>
                          ) : (
                            <>
                              <HelpCircle className="w-3 h-3 text-slate-400" />
                              <span>Candidate Verification</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* (a) The JD requirement text */}
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {card.jobAsks.verbatimQuote}
                      </h4>
                    </div>
                  </div>

                  {/* (b) Found / Not-Found in Resume with Matching Resume Text */}
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-400">
                      <span>Resume Evidence:</span>
                      {isMatched && (
                        <span className="text-[#00DF89] font-semibold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Evidenced in document
                        </span>
                      )}
                    </div>

                    {card.yourResume.evidencePhrase ? (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          "{card.yourResume.evidencePhrase}"
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-rose-300/90 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40">
                        {card.yourResume.missingExplanation || 'No direct evidence found in candidate resume text.'}
                      </div>
                    )}
                  </div>

                  {/* (c) Next Step */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Next Step:
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed">
                      {card.whatToDo.adviceText}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-slate-400 text-xs">No requirements match the selected filters.</div>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setPriorityFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-[#00DF89] font-bold hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
