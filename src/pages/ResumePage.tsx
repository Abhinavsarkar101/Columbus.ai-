import React, { useState, useMemo } from 'react';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { BLANK_RESUME, calculateBulletMetrics, exportResumeToPdf, generateAtsPlainText, SAMPLE_MBA_RESUME } from '../lib/resume';
import { ResumeData } from '../types';

interface ResumePageProps {
  resumeData: ResumeData;
  onUpdateResume: (data: ResumeData) => void;
  onNavigateTab: (tab: string) => void;
}

export const ResumePage: React.FC<ResumePageProps> = ({
  resumeData,
  onUpdateResume,
  onNavigateTab,
}) => {
  const [template, setTemplate] = useState<'ats' | 'modern' | 'minimal'>('ats');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const bulletMetrics = useMemo(() => {
    return calculateBulletMetrics(resumeData);
  }, [resumeData]);

  const completeness = useMemo(() => {
    let score = 0;
    if (resumeData.fullName && resumeData.email && resumeData.phone) score += 20;
    if (resumeData.summary && resumeData.summary.length > 50) score += 20;
    if (resumeData.experience.length >= 2) score += 25;
    if (resumeData.education.length >= 1) score += 15;
    if (resumeData.skills.length >= 2) score += 10;
    if (resumeData.projects.length >= 1) score += 10;
    return score;
  }, [resumeData]);

  const handleDownloadTxt = () => {
    const text = generateAtsPlainText(resumeData);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const namePart = (resumeData.fullName || 'Candidate').replace(/\s+/g, '_');
    link.download = `${namePart}_ATS_Resume.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    // Allow state change to flush highlights off the DOM before taking snapshot
    await new Promise((resolve) => setTimeout(resolve, 150));
    const namePart = (resumeData.fullName || 'Candidate').replace(/\s+/g, '_');
    const success = await exportResumeToPdf('resume-sheet', `${namePart}_Resume.pdf`);
    setIsExportingPdf(false);
    if (!success) {
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateExperienceBullet = (expIndex: number, bulletIndex: number, val: string) => {
    const nextExp = [...resumeData.experience];
    nextExp[expIndex].bullets[bulletIndex] = val;
    onUpdateResume({ ...resumeData, experience: nextExp });
  };

  const handleAddExperienceBullet = (expIndex: number) => {
    const nextExp = [...resumeData.experience];
    nextExp[expIndex].bullets.push('Spearheaded new initiative, driving a 24% operational efficiency gain.');
    onUpdateResume({ ...resumeData, experience: nextExp });
  };

  const handleDeleteExperienceBullet = (expIndex: number, bulletIndex: number) => {
    const nextExp = [...resumeData.experience];
    nextExp[expIndex].bullets.splice(bulletIndex, 1);
    onUpdateResume({ ...resumeData, experience: nextExp });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 bg-[#070B14] text-slate-100">
      {/* Upload Modal */}
      <ResumeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onApplyParsedResume={(parsed) => {
          onUpdateResume(parsed);
        }}
      />

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00DF89] uppercase tracking-wider">
            <span>Module 2</span>
            <span aria-hidden="true">·</span>
            <span>ATS Resume Studio</span>
            <span aria-hidden="true">·</span>
            <span>Completeness: {completeness}%</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            ATS Resume Studio & Live Metric Density Auditor
          </h1>
        </div>

        {/* Action Controls & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Upload Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 text-[#00DF89] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>↑ Upload Resume</span>
            <span className="text-[10px] bg-[#00DF89] text-slate-950 px-1.5 py-0.2 rounded font-black">Auto-fill</span>
          </button>

          {/* Template Switcher */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-medium text-slate-400">
            <button
              onClick={() => setTemplate('ats')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                template === 'ats' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'hover:text-white'
              }`}
            >
              ATS Classic
            </button>
            <button
              onClick={() => setTemplate('modern')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                template === 'modern' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'hover:text-white'
              }`}
            >
              Modern Split
            </button>
            <button
              onClick={() => setTemplate('minimal')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                template === 'minimal' ? 'bg-[#00DF89] text-slate-950 font-bold' : 'hover:text-white'
              }`}
            >
              Minimal Serif
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          {/* Export Buttons */}
          <button
            onClick={handleDownloadTxt}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            ATS Plain .txt
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            Print / Save
          </button>
          <button
            disabled={isExportingPdf}
            onClick={handleDownloadPdf}
            className="px-4 py-1.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            {isExportingPdf ? 'Rendering PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Profile State Bar */}
      <div className="bg-[#0E1526] p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Candidate Profile</div>
            <div className="text-sm font-bold text-white">
              {resumeData.fullName || '(No name set — Upload or type below)'}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
          <div>
            <div className="text-slate-400 font-medium">Bullet Metric Density</div>
            <div className="text-sm font-bold text-[#00DF89] tabular-nums">
              {bulletMetrics.percentage}% ({bulletMetrics.quantifiedCount}/{bulletMetrics.totalBullets} bullets)
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
          <div>
            <div className="text-slate-400 font-medium">ATS Formats</div>
            <div className="text-emerald-400 font-bold">100% Workday / Taleo Clean</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateResume(SAMPLE_MBA_RESUME)}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-white border border-slate-800 rounded-lg hover:bg-slate-900"
          >
            Load Sample Profile
          </button>
          <button
            onClick={() => onUpdateResume(BLANK_RESUME)}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg hover:bg-slate-900"
          >
            Clear Fields
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'preview' ? 'editor' : 'preview')}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
          >
            {activeTab === 'preview' ? '✎ Switch to Edit Mode' : '👁 Switch to Preview'}
          </button>
          <button
            onClick={() => onNavigateTab('match')}
            className="px-3 py-1.5 bg-[#00DF89] text-slate-950 text-xs font-bold rounded-lg hover:bg-[#00c97b]"
          >
            Match Job Description →
          </button>
        </div>
      </div>

      {/* Empty State Banner if no resume has been uploaded yet */}
      {(!resumeData.fullName && resumeData.experience.length === 0) && (
        <div className="bg-[#0E1526] border border-[#00DF89]/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 no-print">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#00DF89]/10 text-[#00DF89] text-[11px] font-bold">
              <span>⚡ AUTO-FILL RESUME</span>
            </div>
            <h3 className="text-base font-bold text-white">Have your existing resume ready?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your PDF, Word, or plain text resume. Compass client-side parser automatically extracts your contact details, work experience, quantifiable bullets, education, and skills into all fields below so you can customize and benchmark against JDs.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-[#00DF89]/20 transition-all flex items-center gap-1.5"
            >
              <span>↑ Upload Resume</span>
              <span>→</span>
            </button>
            <button
              onClick={() => onUpdateResume(SAMPLE_MBA_RESUME)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Load Sample Profile
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Editor vs Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Editor Accordion */}
        {activeTab === 'editor' && (
          <div className="lg:col-span-5 bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5 text-xs no-print">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">
                Candidate Information & Bullets
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="text-[#00DF89] font-bold hover:underline"
              >
                ↑ Upload File to Fill
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={resumeData.fullName}
                  placeholder="e.g. Abhinav Sarkar"
                  onChange={(e) => onUpdateResume({ ...resumeData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#00DF89]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={resumeData.headline}
                  placeholder="e.g. MBA Candidate | Product Management & Strategy"
                  onChange={(e) => onUpdateResume({ ...resumeData, headline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#00DF89]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={resumeData.email}
                    placeholder="name@alumni.iim.ac.in"
                    onChange={(e) => onUpdateResume({ ...resumeData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#00DF89]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={resumeData.phone}
                    placeholder="+91 98765 43210"
                    onChange={(e) => onUpdateResume({ ...resumeData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#00DF89]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={resumeData.location}
                    placeholder="e.g. Bengaluru, India"
                    onChange={(e) => onUpdateResume({ ...resumeData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#00DF89]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={resumeData.linkedinUrl}
                    placeholder="https://linkedin.com/in/..."
                    onChange={(e) => onUpdateResume({ ...resumeData, linkedinUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#00DF89]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Executive Summary</label>
                <textarea
                  rows={3}
                  value={resumeData.summary}
                  placeholder="2–3 sentences highlighting your pre-MBA tenure, domain focus, and post-MBA career aspirations..."
                  onChange={(e) => onUpdateResume({ ...resumeData, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#00DF89]"
                ></textarea>
              </div>
            </div>

            {/* Work Experience Bullets */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="font-bold text-white">Work Experience & Bullets</h4>
              {resumeData.experience.map((exp, expIdx) => (
                <div key={exp.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={exp.role}
                      placeholder="Role title"
                      onChange={(e) => {
                        const next = [...resumeData.experience];
                        next[expIdx].role = e.target.value;
                        onUpdateResume({ ...resumeData, experience: next });
                      }}
                      className="p-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white font-semibold"
                    />
                    <input
                      type="text"
                      value={exp.company}
                      placeholder="Company name"
                      onChange={(e) => {
                        const next = [...resumeData.experience];
                        next[expIdx].company = e.target.value;
                        onUpdateResume({ ...resumeData, experience: next });
                      }}
                      className="p-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    {exp.bullets.map((b, bIdx) => {
                      const isOptimized = Boolean(resumeData.optimizedBullets?.includes(b));
                      return (
                        <div key={bIdx} className="space-y-1">
                          {isOptimized && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00DF89]">
                              <span>✨ ATS Optimized via Match Engine</span>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <textarea
                              rows={2}
                              value={b}
                              onChange={(e) => handleUpdateExperienceBullet(expIdx, bIdx, e.target.value)}
                              className={`flex-1 p-2 bg-slate-950 border rounded text-xs text-white ${
                                isOptimized ? 'border-[#00DF89]/60 bg-emerald-950/20' : 'border-slate-700'
                              }`}
                            />
                            <button
                              onClick={() => handleDeleteExperienceBullet(expIdx, bIdx)}
                              className="text-slate-500 hover:text-rose-400 font-bold px-1.5"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleAddExperienceBullet(expIdx)}
                    className="text-[11px] font-bold text-[#00DF89] hover:underline"
                  >
                    + Add Metric Bullet
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Column / Full Preview: The A4 Paper Sheet (Clean white background for realistic document export) */}
        <div className={`${activeTab === 'editor' ? 'lg:col-span-7' : 'lg:col-span-12'} flex justify-center`}>
          <div
            id="resume-sheet"
            className={`w-full max-w-[800px] min-h-[1050px] bg-white p-8 sm:p-12 shadow-2xl border border-slate-300 text-slate-900 rounded-2xl ${
              template === 'minimal' ? 'font-serif' : 'font-sans'
            }`}
          >
            {/* TEMPLATE 1: ATS CLASSIC */}
            {template === 'ats' && (
              <div className="space-y-6 text-sm">
                <div className="text-center space-y-1 border-b border-slate-300 pb-4">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">
                    {resumeData.fullName || 'YOUR NAME'}
                  </h1>
                  <div className="text-xs text-slate-600 font-medium">
                    {resumeData.headline || 'MBA Candidate | Strategy & Management'}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap justify-center gap-x-2 gap-y-0.5 pt-0.5">
                    <span>{resumeData.email || 'email@example.com'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{resumeData.phone || '+91 00000 00000'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{resumeData.location || 'Location'}</span>
                    {resumeData.linkedinUrl && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{resumeData.linkedinUrl}</span>
                      </>
                    )}
                  </div>
                </div>

                {resumeData.summary && (
                  <div className="space-y-1">
                    <h2 className="text-xs font-bold tracking-wider uppercase text-slate-900 border-b border-slate-200 pb-0.5">
                      Executive Summary
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed pt-1">
                      {resumeData.summary}
                    </p>
                  </div>
                )}

                {resumeData.education.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold tracking-wider uppercase text-slate-900 border-b border-slate-200 pb-0.5">
                      Education
                    </h2>
                    {resumeData.education.map((edu) => (
                      <div key={edu.id} className="text-xs space-y-0.5 pt-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{edu.institution}</span>
                          <span className="font-mono font-normal text-slate-600">{edu.startDate} – {edu.endDate}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>{edu.degree} — {edu.field}</span>
                          <span className="text-slate-500">{edu.location}</span>
                        </div>
                        {edu.gpaOrScore && <div className="text-slate-600">{edu.gpaOrScore}</div>}
                        {edu.honors && <div className="text-slate-600 italic">{edu.honors}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {resumeData.experience.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold tracking-wider uppercase text-slate-900 border-b border-slate-200 pb-0.5">
                      Professional Experience
                    </h2>
                    {resumeData.experience.map((exp) => (
                      <div key={exp.id} className="text-xs space-y-1 pt-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{exp.role}</span>
                          <span className="font-mono font-normal text-slate-600">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[11px] pb-0.5">
                          <span className="font-semibold text-slate-800">{exp.company}</span>
                          <span>{exp.location}</span>
                        </div>
                        <ul className="list-disc list-outside pl-4 space-y-1 text-slate-700">
                          {exp.bullets.map((b, i) => {
                            const isOptimized = Boolean(resumeData.optimizedBullets?.includes(b));
                            const showHighlight = isOptimized && !isExportingPdf;
                            return (
                              <li
                                key={i}
                                className={`leading-relaxed transition-all ${
                                  showHighlight
                                    ? 'bg-emerald-50 text-emerald-950 font-medium px-2 py-0.5 rounded border-l-2 border-emerald-500'
                                    : ''
                                }`}
                              >
                                {b}
                                {showHighlight && (
                                  <span className="ml-2 inline-flex items-center text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded uppercase tracking-wider print:hidden">
                                    ✨ ATS Optimized
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {resumeData.projects.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold tracking-wider uppercase text-slate-900 border-b border-slate-200 pb-0.5">
                      Strategic Projects & Capstones
                    </h2>
                    {resumeData.projects.map((proj) => (
                      <div key={proj.id} className="text-xs space-y-0.5 pt-1">
                        <div className="font-bold text-slate-900">{proj.name} — <span className="font-normal text-slate-600">{proj.context}</span></div>
                        <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
                          {proj.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {resumeData.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <h2 className="text-xs font-bold tracking-wider uppercase text-slate-900 border-b border-slate-200 pb-0.5">
                      Core Competencies & Tools
                    </h2>
                    <div className="text-xs space-y-1 text-slate-700 pt-1">
                      {resumeData.skills.map((s, i) => (
                        <div key={i}>
                          <span className="font-bold text-slate-800">{s.category}: </span>
                          <span>{s.items.join(', ')}</span>
                        </div>
                      ))}
                      {resumeData.certifications.length > 0 && (
                        <div className="pt-1">
                          <span className="font-bold text-slate-800">Certifications: </span>
                          <span>{resumeData.certifications.join(' · ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEMPLATE 2: MODERN SPLIT */}
            {template === 'modern' && (
              <div className="grid grid-cols-12 gap-8 text-xs">
                <div className="col-span-4 border-r border-slate-200 pr-6 space-y-5">
                  <div>
                    <h1 className="text-lg font-extrabold text-slate-950 tracking-tight leading-tight">
                      {resumeData.fullName || 'YOUR NAME'}
                    </h1>
                    <div className="text-[11px] text-teal-700 font-semibold mt-0.5">
                      {resumeData.headline || 'MBA Candidate'}
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div>{resumeData.email || 'email@example.com'}</div>
                    <div>{resumeData.phone || '+91 00000 00000'}</div>
                    <div>{resumeData.location || 'India'}</div>
                    {resumeData.linkedinUrl && (
                      <div className="text-teal-600 truncate">{resumeData.linkedinUrl}</div>
                    )}
                  </div>

                  {resumeData.skills.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                        Skills
                      </h3>
                      {resumeData.skills.map((s, i) => (
                        <div key={i} className="space-y-1">
                          <div className="font-semibold text-slate-800">{s.category}</div>
                          <div className="text-slate-600 leading-snug">{s.items.join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {resumeData.education.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                        Education
                      </h3>
                      {resumeData.education.map((edu) => (
                        <div key={edu.id} className="space-y-0.5">
                          <div className="font-bold text-slate-900">{edu.institution}</div>
                          <div className="text-slate-700 font-medium">{edu.degree}</div>
                          <div className="text-slate-500 font-mono text-[10px]">{edu.startDate} - {edu.endDate}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-8 space-y-5">
                  {resumeData.summary && (
                    <div className="space-y-1">
                      <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                        Summary
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        {resumeData.summary}
                      </p>
                    </div>
                  )}

                  {resumeData.experience.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                        Experience
                      </h3>
                      {resumeData.experience.map((exp) => (
                        <div key={exp.id} className="space-y-1">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{exp.role}</span>
                            <span className="font-mono font-normal text-slate-500">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                          </div>
                          <div className="text-slate-600 font-semibold">{exp.company} · {exp.location}</div>
                          <ul className="list-disc pl-4 space-y-1 text-slate-700 pt-0.5">
                            {exp.bullets.map((b, i) => {
                              const isOptimized = Boolean(resumeData.optimizedBullets?.includes(b));
                              const showHighlight = isOptimized && !isExportingPdf;
                              return (
                                <li
                                  key={i}
                                  className={`leading-relaxed transition-all ${
                                    showHighlight
                                      ? 'bg-emerald-50 text-emerald-950 font-medium px-2 py-0.5 rounded border-l-2 border-emerald-500'
                                      : ''
                                  }`}
                                >
                                  {b}
                                  {showHighlight && (
                                    <span className="ml-2 inline-flex items-center text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded print:hidden">
                                      ATS Optimized
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TEMPLATE 3: MINIMAL SERIF */}
            {template === 'minimal' && (
              <div className="space-y-6 text-sm font-serif">
                <div className="border-b-2 border-slate-900 pb-3">
                  <h1 className="text-3xl font-normal text-slate-950 tracking-tight">
                    {resumeData.fullName || 'YOUR NAME'}
                  </h1>
                  <div className="text-xs italic text-slate-700 mt-1">
                    {resumeData.headline || 'MBA Candidate'}
                  </div>
                  <div className="text-xs text-slate-600 flex gap-3 pt-1 font-sans">
                    <span>{resumeData.email || 'email@example.com'}</span>
                    <span>{resumeData.phone || '+91 00000 00000'}</span>
                    <span>{resumeData.location || 'India'}</span>
                  </div>
                </div>

                {resumeData.summary && (
                  <div className="space-y-1">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 font-sans">
                      Background
                    </h2>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {resumeData.summary}
                    </p>
                  </div>
                )}

                {resumeData.experience.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 font-sans">
                      Experience
                    </h2>
                    {resumeData.experience.map((exp) => (
                      <div key={exp.id} className="text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-950">
                          <span>{exp.company} — {exp.role}</span>
                          <span className="font-sans font-normal text-slate-600">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-800">
                          {exp.bullets.map((b, i) => {
                            const isOptimized = Boolean(resumeData.optimizedBullets?.includes(b));
                            const showHighlight = isOptimized && !isExportingPdf;
                            return (
                              <li
                                key={i}
                                className={`leading-relaxed transition-all ${
                                  showHighlight
                                    ? 'bg-emerald-50 text-emerald-950 font-medium px-2 py-0.5 rounded border-l-2 border-emerald-500 font-sans'
                                    : ''
                                }`}
                              >
                                {b}
                                {showHighlight && (
                                  <span className="ml-2 inline-flex items-center text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded font-sans print:hidden">
                                    ATS Optimized
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
