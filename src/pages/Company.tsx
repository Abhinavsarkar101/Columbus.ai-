import React, { useState } from 'react';
import { COMPANIES } from '../data/companies';
import { CompanyBrief } from '../types';

interface CompanyProps {
  onNavigateTab: (tab: string) => void;
}

export const Company: React.FC<CompanyProps> = ({ onNavigateTab }) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCompany, setActiveCompany] = useState<CompanyBrief>(COMPANIES[0]);

  const filteredCompanies = COMPANIES.filter((comp) => {
    const matchesDomain = selectedDomain === 'all' || comp.domain === selectedDomain;
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Company Interview Prep</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Deep company dossiers, typical interview rounds, culture ratings, and proven insider tips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('target')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Outreach & Networking →
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['all', 'consulting', 'product', 'finance', 'marketing', 'operations'].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDomain(d)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider cursor-pointer ${
                  selectedDomain === d
                    ? 'bg-[#00DF89] text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies..."
            className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00DF89]"
          />
        </div>

        {/* Main Grid: Sidebar + Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company List */}
          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filteredCompanies.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveCompany(c)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeCompany.id === c.id
                    ? 'bg-slate-900 border-[#00DF89] ring-1 ring-[#00DF89]'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm text-white">{c.name}</div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                    {c.domain}
                  </span>
                </div>
                <div className="text-xs text-slate-400 line-clamp-1 mt-1">{c.tagline}</div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-mono">
                  <span>★ {c.cultureRating}/5.0</span>
                  <span>•</span>
                  <span>{c.selectivity}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Dossier Detail */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white">{activeCompany.name}</h2>
                <p className="text-xs text-slate-400 mt-1">{activeCompany.tagline}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
                  Culture: ★ {activeCompany.cultureRating}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Selectivity: {activeCompany.selectivity}
                </span>
              </div>
            </div>

            {/* Compensation & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Pay Band (Indicative)</div>
                <div className="text-sm font-bold text-white mt-1">{activeCompany.payBandINR}</div>
                <div className="text-[10px] text-slate-500 font-mono">{activeCompany.payBandUSD}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Hiring Timeline</div>
                <div className="text-sm font-bold text-white mt-1">{activeCompany.hiringTimeline}</div>
                <div className="text-[10px] text-slate-500">Day 0 / Early Campus Slot</div>
              </div>
            </div>

            {/* Typical Interview Rounds */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00DF89]">
                Typical Interview Process ({activeCompany.typicalRounds.length} Rounds)
              </h3>
              <div className="space-y-2">
                {activeCompany.typicalRounds.map((rnd) => (
                  <div key={rnd.round} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      R{rnd.round}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">{rnd.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{rnd.focus}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insider Tips */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00DF89]">Insider Preparation Tips</h3>
              <div className="space-y-2">
                {activeCompany.insiderTips.map((tip, idx) => (
                  <div key={idx} className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/40 text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-[#00DF89] font-bold">💡</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pitfalls to Avoid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">Common Pitfalls to Avoid</h3>
              <div className="space-y-2">
                {activeCompany.commonPitfalls.map((pitfall, idx) => (
                  <div key={idx} className="p-3 bg-rose-950/20 rounded-xl border border-rose-900/40 text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-rose-400 font-bold">⚠️</span>
                    <span>{pitfall}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
