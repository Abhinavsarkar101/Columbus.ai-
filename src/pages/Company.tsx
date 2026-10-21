import React, { useState, useMemo } from 'react';
import { COMPANIES } from '../data/companies';
import { DOMAINS } from '../data/domains';
import { CompanyBrief, DomainId } from '../types';

interface CompanyProps {
  onNavigateTab: (tab: string) => void;
}

export const Company: React.FC<CompanyProps> = ({ onNavigateTab }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(COMPANIES[0].id);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [digestInput, setDigestInput] = useState('');
  const [digestResult, setDigestResult] = useState<{
    pros: string[];
    cons: string[];
    redFlags: string[];
    sentiment: number;
  } | null>(null);

  const selectedCompany: CompanyBrief = useMemo(() => {
    return COMPANIES.find((c) => c.id === selectedCompanyId) || COMPANIES[0];
  }, [selectedCompanyId]);

  const filteredCompanies = useMemo(() => {
    if (domainFilter === 'all') return COMPANIES;
    return COMPANIES.filter((c) => c.domain === domainFilter);
  }, [domainFilter]);

  const handleDigestReviews = () => {
    if (!digestInput.trim()) return;
    const clean = digestInput.toLowerCase();

    const pros: string[] = [];
    const cons: string[] = [];
    const redFlags: string[] = [];

    if (clean.includes('culture') || clean.includes('people') || clean.includes('supportive')) {
      pros.push('Collaborative internal team camaraderie highlighted');
    }
    if (clean.includes('brand') || clean.includes('pedigree') || clean.includes('learning')) {
      pros.push('Exceptional resume pedigree and steep learning curve');
    }
    if (clean.includes('pay') || clean.includes('compensation') || clean.includes('bonus')) {
      pros.push('Competitive compensation benchmarks with strong variable upside');
    }

    if (clean.includes('hours') || clean.includes('weekend') || clean.includes('overtime') || clean.includes('late')) {
      cons.push('Demanding hours with occasional weekend deliverable requirements');
    }
    if (clean.includes('travel') || clean.includes('onsite') || clean.includes('client')) {
      cons.push('Frequent client travel schedule impacting domestic routine');
    }
    if (clean.includes('politics') || clean.includes('hierarchy') || clean.includes('bureaucracy')) {
      cons.push('Multi-layered corporate approvals and slower promotion gates');
    }

    if (clean.includes('burnout') || clean.includes('attrition') || clean.includes('toxic') || clean.includes('fire')) {
      redFlags.push('Reviewers mention high attrition rates in specific regional workstreams');
    }
    if (clean.includes('freeze') || clean.includes('delay') || clean.includes('severance')) {
      redFlags.push('Headcount sensitivity or bonus adjustments reported in recent cycles');
    }

    if (pros.length === 0) pros.push('High autonomy and recognized brand market leadership');
    if (cons.length === 0) cons.push('High performance expectations under tight client deadlines');

    const sentiment = Math.min(95, Math.max(35, 70 + (pros.length - cons.length - redFlags.length * 2) * 8));

    setDigestResult({
      pros,
      cons,
      redFlags,
      sentiment,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 bg-[#070B14] text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00DF89] uppercase tracking-wider">
            <span>Module 5</span>
            <span aria-hidden="true">·</span>
            <span>Company Intelligence</span>
            <span aria-hidden="true">·</span>
            <span>12 Flagship MBA Recruiters</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Recruiter Dossiers, Pay Bands & Review Digest
          </h1>
        </div>

        <button
          onClick={() => onNavigateTab('target')}
          className="px-4 py-2 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 text-xs font-bold rounded-xl transition-all self-start sm:self-auto"
        >
          Build Outreach Pipeline →
        </button>
      </div>

      {/* Domain Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-slate-400 whitespace-nowrap">Filter Industry:</span>
        <button
          onClick={() => setDomainFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            domainFilter === 'all' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          All (12)
        </button>
        {(['consulting', 'finance', 'product', 'marketing', 'sales_gm', 'analytics'] as DomainId[]).map((dom) => (
          <button
            key={dom}
            onClick={() => setDomainFilter(dom)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              domainFilter === dom ? 'bg-[#00DF89] text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {DOMAINS[dom]?.shortName || dom}
          </button>
        ))}
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Company Cards */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {filteredCompanies.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCompanyId(c.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                selectedCompany.id === c.id
                  ? 'border-[#00DF89] bg-[#0E1526] shadow-lg shadow-[#00DF89]/10'
                  : 'border-slate-800 bg-[#0E1526]/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#00DF89] text-slate-950 font-black text-xs flex items-center justify-center">
                    {c.logoInitial}
                  </div>
                  <span className="font-bold text-white text-sm">{c.name}</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#00DF89]">★ {c.cultureRating}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">{c.tagline}</div>
              <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-0.5">
                <span>{c.payBandINR.split('+')[0]}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{c.selectivity} Selectivity</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Active Company Dossier */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#00DF89] text-slate-950 font-black text-sm flex items-center justify-center">
                    {selectedCompany.logoInitial}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">{selectedCompany.name}</h2>
                </div>
                <p className="text-xs text-slate-400">{selectedCompany.tagline}</p>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <div>
                  <div className="text-slate-400">Culture Rating</div>
                  <div className="text-base font-bold text-[#00DF89]">★ {selectedCompany.cultureRating} / 5.0</div>
                </div>
                <div>
                  <div className="text-slate-400">Selectivity</div>
                  <div className="text-base font-bold text-white">{selectedCompany.selectivity}</div>
                </div>
              </div>
            </div>

            {/* Compensation & Timeline Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-0.5">
                <div className="text-slate-400 font-medium">Post-MBA Pay (India)</div>
                <div className="font-bold text-white text-sm">{selectedCompany.payBandINR}</div>
              </div>
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-0.5">
                <div className="text-slate-400 font-medium">US / Global Benchmark</div>
                <div className="font-bold text-white text-sm">{selectedCompany.payBandUSD}</div>
              </div>
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-0.5">
                <div className="text-slate-400 font-medium">Campus Hiring Window</div>
                <div className="font-bold text-white text-sm">{selectedCompany.hiringTimeline}</div>
              </div>
            </div>

            {/* Interview Rounds Sequence */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Typical Selection Rounds</h3>
              <div className="space-y-2">
                {selectedCompany.typicalRounds.map((rnd) => (
                  <div key={rnd.round} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#00DF89] text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {rnd.round}
                    </div>
                    <div>
                      <div className="font-bold text-white">{rnd.name}</div>
                      <div className="text-slate-400 text-[11px] leading-relaxed">{rnd.focus}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insider Tips & Pitfalls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-900/60 space-y-2">
                <div className="font-bold text-[#00DF89]">Insider Placement Tips:</div>
                <ul className="space-y-1.5 text-slate-300">
                  {selectedCompany.insiderTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="font-bold text-[#00DF89]">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-rose-950/40 rounded-xl border border-rose-900/60 space-y-2">
                <div className="font-bold text-rose-400">Common Candidate Pitfalls:</div>
                <ul className="space-y-1.5 text-slate-300">
                  {selectedCompany.commonPitfalls.map((pit, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="font-bold text-rose-400">⚠</span>
                      <span>{pit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Review Digest Tool */}
          <div className="bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div>
              <span className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">Digest Engine</span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Parse Candidate & Employee Reviews for {selectedCompany.name}
              </h3>
              <p className="text-xs text-slate-400">
                Paste raw reviews from Glassdoor, AmbitionBox, or Fishbowl to extract pros, cons, and red flags.
              </p>
            </div>

            <textarea
              rows={3}
              value={digestInput}
              onChange={(e) => setDigestInput(e.target.value)}
              placeholder="Paste raw reviews here (e.g. 'Demanding 75-hour weeks during release sprint, but exceptional leadership mentorship and fast promotion')..."
              className="w-full text-xs p-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89] font-mono"
            ></textarea>

            <button
              onClick={handleDigestReviews}
              className="px-5 py-2.5 bg-[#00DF89] text-slate-950 text-xs font-bold rounded-xl hover:bg-[#00c97b] transition-all"
            >
              Analyze Review Themes →
            </button>

            {digestResult && (
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs pt-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white">Digest Summary</span>
                  <span className="font-mono font-bold text-[#00DF89]">Sentiment: {digestResult.sentiment}%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="font-bold text-[#00DF89] mb-1">Extracted Positives</div>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {digestResult.pros.map((p, i) => (
                        <li key={i}>✓ {p}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="font-bold text-amber-400 mb-1">Common Complaints</div>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {digestResult.cons.map((c, i) => (
                        <li key={i}>• {c}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="font-bold text-rose-400 mb-1">Potential Red Flags</div>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {digestResult.redFlags.length > 0 ? (
                        digestResult.redFlags.map((r, i) => <li key={i}>⚠ {r}</li>)
                      ) : (
                        <li className="text-slate-500">None detected</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
