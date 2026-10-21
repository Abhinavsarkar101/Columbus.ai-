import React, { useState } from 'react';
import { SAMPLE_MBA_RESUME } from '../lib/resume';
import { parseResumeText, parsePdfFileDirectly } from '../lib/resumeParser';
import { ResumeData } from '../types';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedResume: (resume: ResumeData) => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedResume,
}) => {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Partial<ResumeData> | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const parsed = await parsePdfFileDirectly(file);
        setParsedPreview(parsed);
      } else {
        const text = await file.text();
        const parsed = parseResumeText(text);
        setParsedPreview(parsed);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not read file. Please ensure it is a valid PDF or text document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Please paste some text from your resume first.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const parsed = parseResumeText(pastedText);
      setParsedPreview(parsed);
    } catch (err: any) {
      setErrorMsg('Failed to parse text. Please try pasting raw text directly.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmApply = () => {
    if (!parsedPreview) return;

    const fullResume: ResumeData = {
      fullName: parsedPreview.fullName || 'Candidate',
      headline: parsedPreview.headline || 'MBA Candidate',
      email: parsedPreview.email || '',
      phone: parsedPreview.phone || '',
      location: parsedPreview.location || 'India',
      linkedinUrl: parsedPreview.linkedinUrl || '',
      githubOrPortfolio: parsedPreview.githubOrPortfolio || '',
      summary: parsedPreview.summary || '',
      education: parsedPreview.education || [],
      experience: parsedPreview.experience || [],
      skills: parsedPreview.skills || [],
      projects: parsedPreview.projects || [],
      certifications: parsedPreview.certifications || [],
      targetDomain: 'product',
    };

    onApplyParsedResume(fullResume);
    onClose();
  };

  const handleLoadSample = () => {
    onApplyParsedResume(SAMPLE_MBA_RESUME);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#0E1526] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#070B14]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00DF89] animate-pulse"></span>
              <h3 className="text-base font-bold text-white">Upload & Auto-fill Resume</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your PDF/TXT resume or paste text to auto-fill all candidate fields instantly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 px-6 pt-2 bg-[#0A0F1D]">
          <button
            onClick={() => {
              setTab('upload');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'upload'
                ? 'border-[#00DF89] text-[#00DF89]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload File (PDF / TXT)
          </button>
          <button
            onClick={() => {
              setTab('paste');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'paste'
                ? 'border-[#00DF89] text-[#00DF89]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste Text Directly
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 text-rose-300 rounded-lg">
              {errorMsg}
            </div>
          )}

          {tab === 'upload' && !parsedPreview && (
            <div className="border-2 border-dashed border-slate-700/80 hover:border-[#00DF89]/60 rounded-xl p-8 text-center space-y-3 bg-[#070B14]/60 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#00DF89]/10 text-[#00DF89] flex items-center justify-center mx-auto text-xl font-bold">
                ↑
              </div>
              <div>
                <span className="font-bold text-white text-sm">Choose a resume file</span>
                <p className="text-slate-400 text-xs mt-0.5">Supports PDF or plain TXT files</p>
              </div>

              <input
                type="file"
                id="resume-file-input"
                accept=".pdf,.txt,.json,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="resume-file-input"
                className="inline-block px-4 py-2.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                {isProcessing ? 'Processing File...' : 'Select Resume File'}
              </label>

              <div className="pt-2 text-[11px] text-slate-400">
                🔒 100% Client-Side: Your resume never leaves your browser.
              </div>
            </div>
          )}

          {tab === 'paste' && !parsedPreview && (
            <div className="space-y-3">
              <label className="block font-semibold text-slate-300">Paste your resume content below:</label>
              <textarea
                rows={9}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the full text of your resume here (Name, Contact, Experience bullets, Education, Skills)..."
                className="w-full p-3 bg-[#070B14] border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00DF89] font-mono text-xs text-slate-200 placeholder:text-slate-500"
              ></textarea>
              <button
                disabled={isProcessing}
                onClick={handleParsePastedText}
                className="w-full py-2.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isProcessing ? 'Parsing Resume...' : 'Parse & Preview Auto-Fill →'}
              </button>
            </div>
          )}

          {/* Parsed Preview Confirmation */}
          {parsedPreview && (
            <div className="space-y-3 bg-[#070B14] p-4 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-sm">Parsed Candidate Data</span>
                <span className="text-[#00DF89] bg-[#00DF89]/10 px-2.5 py-0.5 rounded text-[11px] font-bold border border-[#00DF89]/30">
                  Ready to Auto-Fill
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Full Name:</span>
                  <div className="font-bold text-white">{parsedPreview.fullName || 'Not detected'}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Email:</span>
                  <div className="font-bold text-white truncate">{parsedPreview.email || 'Not detected'}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Phone:</span>
                  <div className="font-bold text-white">{parsedPreview.phone || 'Not detected'}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Headline:</span>
                  <div className="font-bold text-white truncate">{parsedPreview.headline || 'MBA Candidate'}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Work Experience Entries:</span>
                  <span className="font-mono font-bold text-white">{parsedPreview.experience?.length || 0}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Education Credentials:</span>
                  <span className="font-mono font-bold text-white">{parsedPreview.education?.length || 0}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Skills Identified:</span>
                  <span className="font-mono font-bold text-white">
                    {parsedPreview.skills?.flatMap((s) => s.items).length || 0}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setParsedPreview(null)}
                  className="flex-1 py-2 border border-slate-700 rounded-lg text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
                >
                  Upload Another File
                </button>
                <button
                  onClick={handleConfirmApply}
                  className="flex-1 py-2 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold rounded-lg transition-colors shadow-sm"
                >
                  Apply & Auto-Fill Resume →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Sample Demo Option */}
        <div className="px-6 py-3.5 bg-[#070B14] border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Don't have a file ready right now?</span>
          <button
            onClick={handleLoadSample}
            className="text-[#00DF89] hover:underline font-bold"
          >
            Load Sample MBA Profile
          </button>
        </div>
      </div>
    </div>
  );
};
