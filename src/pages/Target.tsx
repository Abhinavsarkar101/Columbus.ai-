import React, { useState, useEffect, useMemo } from 'react';
import {
  DEMO_TARGET_DATA,
  generateLinkedInSearches,
  generateOutreachSequence,
  analyzeRoleReviews,
} from '../lib/target';
import { OutreachContact } from '../types';

interface TargetProps {
  onNavigateTab: (tab: string) => void;
}

const STORAGE_KEY_CONTACTS = 'compass.connectors.v1';

export const Target: React.FC<TargetProps> = () => {
  const [companyName, setCompanyName] = useState(DEMO_TARGET_DATA.company);
  const [roleTitle, setRoleTitle] = useState(DEMO_TARGET_DATA.role);
  const [schoolName, setSchoolName] = useState('IIM');
  const [reviewsText, setReviewsText] = useState(DEMO_TARGET_DATA.sampleReviews);

  const [contacts, setContacts] = useState<OutreachContact[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONTACTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'contact_1',
        name: 'Priya Sharma',
        company: 'Tecnotree Corporation',
        role: 'Senior Product Manager',
        linkedinUrl: 'https://linkedin.com/in/priya-sharma-product',
        category: 'peer',
        stage: 'replied',
        addedAt: new Date().toISOString(),
        notes: 'Agreed to a 10-minute coffee chat on client travel frequency next Tuesday.',
        messages: generateOutreachSequence('Priya Sharma', 'Tecnotree Corporation', 'Senior Product Management Consultant', 'peer', 'IIM'),
      },
      {
        id: 'contact_2',
        name: 'Karan Mehra',
        company: 'Tecnotree Corporation',
        role: 'Director of Product Management',
        linkedinUrl: 'https://linkedin.com/in/karan-mehra-product',
        category: 'leader',
        stage: 'sent',
        addedAt: new Date().toISOString(),
        notes: 'IIM alumnus leading BSS monetization. Reached out with 1-page perspective.',
        messages: generateOutreachSequence('Karan Mehra', 'Tecnotree Corporation', 'Senior Product Management Consultant', 'leader', 'IIM'),
      },
    ];
  });

  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactUrl, setNewContactUrl] = useState('');
  const [newContactCategory, setNewContactCategory] = useState<'peer' | 'leader' | 'recruiter' | 'alumni'>('peer');
  const [newContactNotes, setNewContactNotes] = useState('');

  const [activeContactForMessages, setActiveContactForMessages] = useState<OutreachContact | null>(contacts[0] || null);
  const [copiedMessageKey, setCopiedMessageKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
    } catch {
      // ignore
    }
  }, [contacts]);

  const searches = useMemo(() => {
    return generateLinkedInSearches(companyName, roleTitle, schoolName);
  }, [companyName, roleTitle, schoolName]);

  const reviewAnalysis = useMemo(() => {
    return analyzeRoleReviews(reviewsText, roleTitle);
  }, [reviewsText, roleTitle]);

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    const messages = generateOutreachSequence(
      newContactName,
      companyName,
      roleTitle,
      newContactCategory,
      schoolName
    );

    const newContact: OutreachContact = {
      id: `contact_${Date.now()}`,
      name: newContactName.trim(),
      company: companyName.trim(),
      role: newContactRole.trim() || roleTitle,
      linkedinUrl: newContactUrl.trim() || `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(newContactName)}`,
      category: newContactCategory,
      stage: 'not_contacted',
      addedAt: new Date().toISOString(),
      notes: newContactNotes.trim(),
      messages,
    };

    setContacts([newContact, ...contacts]);
    setActiveContactForMessages(newContact);
    setIsAddingContact(false);
    setNewContactName('');
    setNewContactRole('');
    setNewContactUrl('');
    setNewContactNotes('');
  };

  const handleUpdateStage = (contactId: string, nextStage: OutreachContact['stage']) => {
    setContacts(
      contacts.map((c) => (c.id === contactId ? { ...c, stage: nextStage } : c))
    );
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(contacts.filter((c) => c.id !== contactId));
    if (activeContactForMessages?.id === contactId) {
      setActiveContactForMessages(contacts.find((c) => c.id !== contactId) || null);
    }
  };

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageKey(key);
    setTimeout(() => setCopiedMessageKey(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 bg-[#070B14] text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00DF89] uppercase tracking-wider">
            <span>Module 4</span>
            <span aria-hidden="true">·</span>
            <span>People Map & Review Lens</span>
            <span aria-hidden="true">·</span>
            <span>Zero Scraping · 100% Live URLs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Company Target, People Mapping & Role-Level Reviews
          </h1>
        </div>

        <button
          onClick={() => {
            setCompanyName('Tecnotree Corporation');
            setRoleTitle('Senior Product Management Consultant');
            setReviewsText(DEMO_TARGET_DATA.sampleReviews);
          }}
          className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg"
        >
          Reset Demo (Tecnotree)
        </button>
      </div>

      {/* Target Parameters Bar */}
      <div className="bg-[#0E1526] p-5 rounded-2xl border border-slate-800 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-bold text-slate-300 mb-1">Target Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-semibold text-white focus:outline-none focus:border-[#00DF89]"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-300 mb-1">Target Role Title</label>
          <input
            type="text"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-semibold text-white focus:outline-none focus:border-[#00DF89]"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-300 mb-1">Alumni School Filter</label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-semibold text-white focus:outline-none focus:border-[#00DF89]"
          />
        </div>
      </div>

      {/* SECTION 1: 6 TARGETED LINKEDIN SEARCHES */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Precision LinkedIn People Searches for {companyName}
          </h2>
          <p className="text-xs text-slate-400">
            Clicking opens the live LinkedIn directory filtered to these exact titles and parameters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searches.map((s) => (
            <div key={s.id} className="p-5 bg-[#0E1526] rounded-2xl border border-slate-800 shadow-xl space-y-3 text-xs flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="font-bold text-white text-sm">{s.label}</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">{s.description}</p>
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300 italic text-[11px]">
                  <span className="font-semibold text-[#00DF89] not-italic">Ask: </span>
                  "{s.suggestedQuestion}"
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-[#00DF89] font-medium">{s.expectedReplyRate}</span>
                <a
                  href={s.searchUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-3 py-1.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 shadow-sm"
                >
                  Open Live Search ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: OUTREACH BOARD & MESSAGE SEQUENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Contact Tracker */}
        <div className="lg:col-span-6 bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Tracked Outreach Pipeline</h3>
              <div className="text-xs text-slate-400">{contacts.length} Contacts Added</div>
            </div>
            <button
              onClick={() => setIsAddingContact(!isAddingContact)}
              className="px-3.5 py-1.5 bg-[#00DF89] text-slate-950 text-xs font-bold rounded-lg hover:bg-[#00c97b]"
            >
              + Add Found Profile
            </button>
          </div>

          {/* Add Form */}
          {isAddingContact && (
            <form onSubmit={handleCreateContact} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-white">Add LinkedIn Profile for Outreach</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-0.5">Person's Name</label>
                  <input
                    type="text"
                    required
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full p-2 bg-[#070B14] border border-slate-800 rounded text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-0.5">Title / Designation</label>
                  <input
                    type="text"
                    value={newContactRole}
                    onChange={(e) => setNewContactRole(e.target.value)}
                    placeholder="e.g. Lead Consultant"
                    className="w-full p-2 bg-[#070B14] border border-slate-800 rounded text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-0.5">Relationship Type</label>
                  <select
                    value={newContactCategory}
                    onChange={(e) => setNewContactCategory(e.target.value as any)}
                    className="w-full p-2 bg-[#070B14] border border-slate-800 rounded text-white text-xs"
                  >
                    <option value="peer">Peer / Same Level</option>
                    <option value="leader">Director / Senior Leader</option>
                    <option value="alumni">School Alumni</option>
                    <option value="recruiter">Campus / Talent Recruiter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-0.5">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={newContactUrl}
                    onChange={(e) => setNewContactUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full p-2 bg-[#070B14] border border-slate-800 rounded text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="px-3 py-1.5 border border-slate-700 rounded text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#00DF89] text-slate-950 rounded font-bold"
                >
                  Save & Generate Messages
                </button>
              </div>
            </form>
          )}

          {/* Contact Cards List */}
          <div className="space-y-3">
            {contacts.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveContactForMessages(c)}
                className={`p-4 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                  activeContactForMessages?.id === c.id
                    ? 'border-[#00DF89] bg-[#00DF89]/10 shadow-sm'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-white text-sm">{c.name}</div>
                    <div className="text-slate-400 text-[11px]">{c.role} · {c.company}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="capitalize px-2 py-0.5 bg-slate-800 text-slate-300 font-semibold rounded text-[10px]">
                      {c.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteContact(c.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 text-sm px-1"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Stage Selector */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {(['not_contacted', 'sent', 'replied', 'call', 'referral'] as const).map((stg) => (
                      <button
                        key={stg}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStage(c.id, stg);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors capitalize ${
                          c.stage === stg
                            ? 'bg-[#00DF89] text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {stg.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {c.linkedinUrl && (
                    <a
                      href={c.linkedinUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#00DF89] hover:underline font-semibold text-[11px]"
                    >
                      Profile ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: 3-Step Outreach Sequence */}
        <div className="lg:col-span-6 bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          {activeContactForMessages ? (
            <>
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">Outreach Playbook</span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  3-Touch Sequence for: {activeContactForMessages.name}
                </h3>
                <div className="text-xs text-slate-400">
                  Calibrated for {activeContactForMessages.category.toUpperCase()} relation · Short, humble & high reciprocity.
                </div>
              </div>

              {/* Touch 1 */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Touch 1: Connection Request Note (Day 1)</span>
                  <button
                    onClick={() => handleCopyText('opener', activeContactForMessages.messages.opener)}
                    className="text-[#00DF89] font-bold hover:underline"
                  >
                    {copiedMessageKey === 'opener' ? '✓ Copied!' : 'Copy Note'}
                  </button>
                </div>
                <div className="p-3 bg-[#070B14] rounded-lg border border-slate-800 text-slate-300 leading-relaxed font-mono text-[11px]">
                  {activeContactForMessages.messages.opener}
                </div>
              </div>

              {/* Touch 2 */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Touch 2: Soft Bump (Day 4)</span>
                  <button
                    onClick={() => handleCopyText('followUp', activeContactForMessages.messages.followUp)}
                    className="text-[#00DF89] font-bold hover:underline"
                  >
                    {copiedMessageKey === 'followUp' ? '✓ Copied!' : 'Copy Note'}
                  </button>
                </div>
                <div className="p-3 bg-[#070B14] rounded-lg border border-slate-800 text-slate-300 leading-relaxed font-mono text-[11px]">
                  {activeContactForMessages.messages.followUp}
                </div>
              </div>

              {/* Touch 3 */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Touch 3: The Internal Referral Ask (After Rapport)</span>
                  <button
                    onClick={() => handleCopyText('referral', activeContactForMessages.messages.referralAsk)}
                    className="text-[#00DF89] font-bold hover:underline"
                  >
                    {copiedMessageKey === 'referral' ? '✓ Copied!' : 'Copy Note'}
                  </button>
                </div>
                <div className="p-3 bg-[#070B14] rounded-lg border border-slate-800 text-slate-300 leading-relaxed font-mono text-[11px]">
                  {activeContactForMessages.messages.referralAsk}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select or add a contact to view personalized message sequences.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: ROLE-LEVEL REVIEWS LENS */}
      <div className="bg-[#0E1526] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">Insider Intelligence</span>
            <h2 className="text-xl font-bold text-white">
              Role-Level Review Lens for: {roleTitle} at {companyName}
            </h2>
            <div className="text-xs text-slate-400">
              Bypasses generic corporate ratings to evaluate 8 specific day-to-day realities.
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400">Role Sentiment Index</div>
              <div className="text-2xl font-black text-white tabular-nums">
                {reviewAnalysis.roleSentiment} / 100
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-[#00DF89] flex items-center justify-center font-bold text-xs text-white">
              {reviewAnalysis.roleSentiment}%
            </div>
          </div>
        </div>

        {/* 8 Themes Score Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {reviewAnalysis.themeScores.map((ts, idx) => (
            <div key={idx} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200 truncate">{ts.theme}</span>
                <span className="font-mono font-bold text-white">{ts.score}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    ts.score >= 75 ? 'bg-[#00DF89]' : ts.score >= 60 ? 'bg-[#14B8A6]' : 'bg-amber-400'
                  }`}
                  style={{ width: `${ts.score}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 capitalize">{ts.sentiment} sentiment in role reviews</div>
            </div>
          ))}
        </div>

        {/* Reverse Interview Questions */}
        <div className="p-4 bg-[#070B14] rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-[#00DF89]">Reverse Interview Questions (Probe During Final Partner Rounds):</div>
          <ul className="space-y-1 text-slate-300">
            {reviewAnalysis.derivedInterviewQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-bold text-[#00DF89]">•</span>
                <span className="italic">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
