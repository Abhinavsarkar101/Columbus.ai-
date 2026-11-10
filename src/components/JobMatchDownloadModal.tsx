import React, { useState } from 'react';
import {
  X,
  FileDown,
  FileText,
  FileCode,
  Copy,
  Check,
  Printer,
  Sparkles,
  ShieldCheck,
  Download,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  JobMatchReportExportData,
  downloadJobMatchPdf,
  downloadJobMatchMarkdown,
  downloadJobMatchText,
  downloadJobMatchJson,
  generateJobMatchMarkdownReport,
  getReportFilename,
} from '../lib/matchReportExport';

interface JobMatchDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: JobMatchReportExportData;
  onToast?: (message: string) => void;
}

export const JobMatchDownloadModal: React.FC<JobMatchDownloadModalProps> = ({
  isOpen,
  onClose,
  data,
  onToast,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [downloadSuccessType, setDownloadSuccessType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const ok = await downloadJobMatchPdf(data);
      if (ok) {
        setDownloadSuccessType('pdf');
        const filename = getReportFilename(data, 'pdf');
        onToast?.(`Downloaded ${filename}`);
        setTimeout(() => setDownloadSuccessType(null), 3000);
      }
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    downloadJobMatchMarkdown(data);
    setDownloadSuccessType('md');
    const filename = getReportFilename(data, 'md');
    onToast?.(`Downloaded ${filename}`);
    setTimeout(() => setDownloadSuccessType(null), 3000);
  };

  const handleDownloadText = () => {
    downloadJobMatchText(data);
    setDownloadSuccessType('txt');
    const filename = getReportFilename(data, 'txt');
    onToast?.(`Downloaded ${filename}`);
    setTimeout(() => setDownloadSuccessType(null), 3000);
  };

  const handleDownloadJson = () => {
    downloadJobMatchJson(data);
    setDownloadSuccessType('json');
    const filename = getReportFilename(data, 'json');
    onToast?.(`Downloaded ${filename}`);
    setTimeout(() => setDownloadSuccessType(null), 3000);
  };

  const handleCopyMarkdown = async () => {
    const md = generateJobMatchMarkdownReport(data);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedMd(true);
      onToast?.('Report copied to clipboard as Markdown');
      setTimeout(() => setCopiedMd(false), 2500);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-[#0E1526] border border-slate-700/90 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative text-left space-y-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-[#00DF89] shrink-0 shadow-lg shadow-emerald-950/50">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="download-modal-title" className="text-lg font-bold text-white tracking-tight">
                Download Job Match Report
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-[#00DF89] font-bold">
                {data.scores.overallFitScore}% Fit Score
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target:{' '}
              <strong className="text-slate-200">
                {data.jobInfo.title}
              </strong>{' '}
              at <strong className="text-slate-200">{data.jobInfo.company}</strong>
            </p>
          </div>
        </div>

        {/* Target & Candidate Summary Pill Bar */}
        <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00DF89]" />
            <span className="text-slate-300">
              <span className="font-semibold text-white">{data.scores.counts.total}</span> requirements audited (
              <span className="text-emerald-400 font-semibold">{data.scores.counts.matched} matched</span>,{' '}
              <span className="text-[#00DF89] font-semibold">{data.scores.counts.canImprove} can improve</span>,{' '}
              <span className="text-rose-400 font-semibold">{data.scores.counts.missing} missing</span>)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-medium bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              title="Copy markdown text to clipboard"
            >
              {copiedMd ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00DF89]" />
                  <span className="text-[#00DF89] font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-medium bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              title="Print report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Download Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* OPTION 1: EXECUTIVE PDF */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-emerald-500/50 hover:bg-slate-900 transition-all space-y-3 flex flex-col justify-between group">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-[#00DF89]">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <span>Executive PDF Report</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00DF89] bg-[#00DF89]/10 px-2 py-0.5 rounded border border-[#00DF89]/30">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Multi-page presentation-grade PDF with score cards, priority breakdown, verbatim quotes, resume evidence citations, and Google XYZ rewrites.
              </p>
            </div>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="w-full py-2.5 px-3 bg-[#00DF89] hover:bg-[#00c97b] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : downloadSuccessType === 'pdf' ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Downloaded PDF</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-slate-950" />
                  <span>Download PDF (.pdf)</span>
                </>
              )}
            </button>
          </div>

          {/* OPTION 2: MARKDOWN REPORT */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-teal-500/50 hover:bg-slate-900 transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-950/90 border border-teal-500/40 text-teal-300">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <span>Markdown Document</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">.md</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Formatted with headers, markdown tables, blockquotes, and code snippets. Ready to import directly into Notion, Obsidian, or documentation.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {downloadSuccessType === 'md' ? (
                <>
                  <Check className="w-4 h-4 text-[#00DF89]" />
                  <span>Downloaded .md</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Markdown (.md)</span>
                </>
              )}
            </button>
          </div>

          {/* OPTION 3: PLAIN TEXT CHECKLIST */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-600 hover:bg-slate-900 transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Plain Text Audit</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">.txt</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Clean ASCII formatted summary report. Zero formatting dependencies, lightweight and ideal for drafting emails or quick offline reference.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadText}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {downloadSuccessType === 'txt' ? (
                <>
                  <Check className="w-4 h-4 text-[#00DF89]" />
                  <span>Downloaded .txt</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Plain Text (.txt)</span>
                </>
              )}
            </button>
          </div>

          {/* OPTION 4: STRUCTURED JSON */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-600 hover:bg-slate-900 transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span>Raw Audit JSON</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">.json</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Machine-readable JSON containing all raw requirement cards, evidence units, metric computations, and classification metadata.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {downloadSuccessType === 'json' ? (
                <>
                  <Check className="w-4 h-4 text-[#00DF89]" />
                  <span>Downloaded .json</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download JSON (.json)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
          <span>Files are generated locally in your browser.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
