import React, { useState } from 'react';
import { generateLinkedInSearches, LinkedInSearchSpec } from '../lib/target';

interface TargetProps {
  onNavigateTab: (tab: string) => void;
}

export const Target: React.FC<TargetProps> = ({ onNavigateTab }) => {
  const [company, setCompany] = useState('Google');
  const [roleTitle, setRoleTitle] = useState('Product Manager');
  const [school, setSchool] = useState('IIM');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searches: LinkedInSearchSpec[] = generateLinkedInSearches(company, roleTitle, school);

  const templates = [
    {
      id: 'alumni_warm',
      title: 'Warm MBA Alumni Connection (300 chars)',
      text: `Hi [Name], I'm a first-year MBA student at ${school} following your journey at ${company}. Your background in ${roleTitle} is inspiring. Would you have 10 minutes for a brief virtual coffee next week? Thanks so much!`,
    },
    {
      id: 'peer_inmail',
      title: 'Direct Peer Question (Ground Reality)',
      text: `Hi [Name], I'm currently preparing for ${roleTitle} roles and researching ${company}'s culture. Would love to learn about what a typical release week looks like on your team. Best, [Your Name]`,
    },
    {
      id: 'manager_outreach',
      title: 'Hiring Manager Pitch (Concise Value)',
      text: `Hi [Name], I noticed ${company} is expanding its ${roleTitle} team. With an MBA from ${school} and previous tech lead experience, I've delivered $3M+ impact in platform monetization. Would welcome an exploratory conversation.`,
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">People & Target Outreach</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Construct high-conversion LinkedIn search filters and tested outreach messaging.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('company')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              View Company Intelligence →
            </button>
          </div>
        </div>

        {/* Search Parameter Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00DF89]">Outreach Target Parameters</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. McKinsey, Google, Amazon"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00DF89]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Role Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Product Manager, Consultant"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00DF89]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Your School / Alumni Tag</label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. IIM, ISB, XLRI"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00DF89]"
              />
            </div>
          </div>
        </div>

        {/* 4 Targeted LinkedIn Search Spec Cards */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Recommended Search Segments at {company}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searches.map((spec) => (
              <div
                key={spec.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm text-white">{spec.label}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {spec.expectedReplyRate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{spec.description}</p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">Suggested Question:</span>
                    <span className="text-slate-300 italic">"{spec.suggestedQuestion}"</span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={spec.searchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[#00DF89] font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Launch LinkedIn Search ↗</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outreach Message Templates */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#00DF89]">Tested Message Templates</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">{tpl.title}</h4>
                  <p className="text-xs text-slate-300 mt-2 font-mono whitespace-pre-wrap leading-relaxed">
                    {tpl.text}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(tpl.id, tpl.text)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedId === tpl.id ? 'Copied to Clipboard!' : 'Copy Template'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
