import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileUp,
  Upload,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  Sparkles,
  X,
  RotateCcw,
  ExternalLink,
  History,
  Trash2,
  AlertCircle,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Zap,
  Activity,
  Cpu,
  Eye,
  HelpCircle,
  ArrowRight,
  Info,
  Download,
  FileDown,
} from 'lucide-react';
import { ResumeData, JDAnalysis, RequirementGap } from '../types';
import { analyzeJobDescription } from '../lib/jd';
import { SAMPLE_MBA_RESUME, generateAtsPlainText } from '../lib/resume';
import { extractResumeFileText, ExtractedResumeText } from '../lib/resumeExtraction';
import { runJobMatchAnalysis } from '../lib/match-engine';
import {
  ThreeBlockResultCard,
  EngineAnalysisResult,
  ResumeEvidenceUnit,
  MatchClassification,
  RequirementPriority,
  ExtractedRequirement,
} from '../lib/match-engine-types';
import { JobMatchDownloadModal } from '../components/JobMatchDownloadModal';
import { AtsEngineResultsView } from '../components/AtsEngineResultsView';
import {
  JobMatchReportExportData,
  downloadJobMatchPdf,
  getReportFilename,
} from '../lib/matchReportExport';

interface MatchProps {
  resumeData: ResumeData;
  onUpdateResume: (data: ResumeData) => void;
  onNavigateTab: (tab: string) => void;
  onOpenUploadModal?: () => void;
}

export type ResumeSourceMode = 'upload' | 'compass';

export interface PreviouslyViewedJob {
  id: string;
  title: string;
  company: string;
  text: string;
  sourceUrl: string;
  sourceType: 'greenhouse' | 'lever' | 'public_web' | 'manual' | 'preset';
  timestamp: number;
  charCount: number;
}

interface ImportFailureModalState {
  isOpen: boolean;
  title: string;
  reason: string;
  attemptedUrl: string;
}

const SAMPLE_JDS = [
  {
    title: 'Senior Product Manager — Digital Platforms',
    company: 'Swiggy',
    source: 'https://www.linkedin.com/jobs/view/swiggy-sr-pm-digital',
    text: `Role: Senior Product Manager — Digital Platforms & Core Monetization
Company: Swiggy
Location: Bengaluru / Remote

About the Role:
We are looking for an exceptional post-MBA Product Manager to lead our Core Monetization and Workflow platform. You will define the multi-year product roadmap, drive conversion rate optimization, and run structured A/B testing sprints with cross-functional engineering teams.

Key Responsibilities:
• Author clear and comprehensive PRD specifications for billing, subscription, and onboarding workflows.
• Run bi-weekly agile scrum sprint ceremonies, backlog grooming, and prioritize features based on user research.
• Analyze customer churn metrics, unit economics (LTV/CAC), and establish clear KPIs for business stakeholders.
• Conduct qualitative user discovery interviews and translate findings into high-fidelity wireframing specs in Figma.
• Partner with sales and corporate finance teams on pricing elasticity and annual operating plan budgeting.

Qualifications:
• MBA from a top-tier business school or equivalent quantitative analytical background.
• 3+ years experience in technical product management or cross-functional strategy consulting.
• Proven track record shipping scalable software products with measurable revenue impact.`,
  },
  {
    title: 'Management Consultant — Strategy & Digital',
    company: 'McKinsey & Company',
    source: 'https://www.linkedin.com/jobs/view/mckinsey-associate-consultant',
    text: `Role: Management Consultant / Associate
Company: McKinsey & Company
Location: Mumbai / Gurugram

About the Role:
Join our Strategy & Digital Transformation practice to counsel Fortune 500 C-suite executives on strategic capital allocation, operating model redesign, and market entry strategies.

Key Responsibilities:
• Conduct rigorous financial modeling, DCF valuation, and EBITDA expansion benchmarking across client business units.
• Synthesize complex quantitative market research and present structured executive decks to executive steering committees.
• Drive cost optimization and working capital reduction across global supply chain networks.
• Perform competitor benchmarking and formulate growth strategies for high-growth digital ventures.

Qualifications:
• Top-tier MBA degree with strong academic record and proven problem-solving mindset.
• Track record of structured quantitative analysis, team leadership, and executive communication.`,
  },
  {
    title: 'Brand Manager — FMCG & Category Growth',
    company: 'Hindustan Unilever (HUL)',
    source: 'https://www.linkedin.com/jobs/view/hul-brand-manager-growth',
    text: `Role: Brand Manager — Beauty & Personal Care
Company: Hindustan Unilever (HUL)
Location: Mumbai

About the Role:
Lead go-to-market execution, media planning, consumer insights, and P&L growth for a flagship FMCG brand portfolio generating ₹500+ Cr annually.

Key Responsibilities:
• Own end-to-end P&L management, pricing strategy, and gross margin optimization for retail and e-commerce channels.
• Conceptualize and deploy integrated marketing communications (IMC) across digital, television, and performance channels.
• Analyze consumer panel data (Nielsen/Kantar) to identify category growth drivers and market share opportunities.
• Collaborate with trade marketing, sales, and supply chain teams to drive quick-commerce velocity and trial conversion.

Qualifications:
• MBA in Marketing/Strategy from a premier institute.
• 2–4 years experience in FMCG brand management, trade marketing, or consumer growth.`,
  },
];

// Normalizes and cleans JD text
function cleanJdText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Phase B Browser HTML-to-clean-text extraction using safe DOMParser (content-based, zero site-specific conditionals)
function cleanHtmlToPlainText(html: string): string {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Prefer JSON-LD JobPosting description when present
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const scriptEl of Array.from(jsonLdScripts)) {
      try {
        const rawJson = scriptEl.textContent || '';
        const parsed = JSON.parse(rawJson);
        const candidates = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of candidates) {
          if (item && (item['@type'] === 'JobPosting' || item['@type'] === 'jobPosting') && item.description) {
            const desc = item.description;
            if (typeof desc === 'string' && desc.trim().length > 50) {
              if (desc.includes('<')) {
                return cleanHtmlToPlainText(desc);
              }
              return cleanJdText(desc);
            }
          }
        }
      } catch {}
    }

    // 2. Remove noise elements: script/style/svg/img/iframe/nav/header/footer/aside/button/input and hidden elements
    doc
      .querySelectorAll(
        'script, style, noscript, svg, img, iframe, nav, header, footer, aside, button, input, [hidden], [aria-hidden="true"]'
      )
      .forEach((el) => el.remove());

    // Replace line break elements with newlines
    doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));

    // Non-empty <li> -> "• " + text (strip pre-existing leading glyphs)
    doc.querySelectorAll('li').forEach((li) => {
      const rawText = (li.textContent || '').trim();
      const stripped = rawText.replace(/^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/, '').trim();
      if (/[a-zA-Z0-9]/.test(stripped)) {
        li.textContent = `• ${stripped}`;
        li.append('\n');
      } else {
        li.remove();
      }
    });

    // Headings / paragraphs on own lines
    doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, section, article').forEach((block) => {
      block.append('\n\n');
    });

    // Emit text ONLY from remaining content
    const text = doc.body.textContent || '';
    return cleanJdText(text);
  } catch (err) {
    console.warn('[cleanHtmlToPlainText fallback]:', err);
    return cleanJdText(html.replace(/<[^>]+>/g, ' '));
  }
}

// Detect login-walled / anti-bot platforms that forbid automated link access
function getLoginWalledSiteName(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('indeed.com')) return 'Indeed';
    if (host.includes('glassdoor.com')) return 'Glassdoor';
    if (host.includes('naukri.com')) return 'Naukri';
  } catch {}
  return null;
}

// Detect and parse Greenhouse URLs
function parseGreenhouseUrl(urlString: string): { boardToken: string; jobId: string } | null {
  try {
    const parsed = new URL(urlString);
    if (parsed.hostname.includes('greenhouse.io')) {
      const match =
        parsed.pathname.match(/\/(?:jobs\/)?([^/?#]+)\/jobs\/(\d+)/i) ||
        parsed.pathname.match(/^\/([^/?#]+)\/jobs\/(\d+)/i);
      if (match && match[1] && match[2]) {
        return { boardToken: match[1], jobId: match[2] };
      }
    }
  } catch {}
  return null;
}

// Detect and parse Lever URLs
function parseLeverUrl(urlString: string): { companySlug: string; jobId: string } | null {
  try {
    const parsed = new URL(urlString);
    if (parsed.hostname.includes('lever.co')) {
      const match = parsed.pathname.match(/^\/([^/?#]+)\/([a-zA-Z0-9_-]+)/i);
      if (match && match[1] && match[2]) {
        return { companySlug: match[1], jobId: match[2] };
      }
    }
  } catch {}
  return null;
}

export const Match: React.FC<MatchProps> = ({
  resumeData,
  onUpdateResume,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  // Check if current user Compass resume has content
  const hasCompassContent = Boolean(
    (resumeData.fullName && resumeData.fullName.trim()) ||
    (resumeData.experience && resumeData.experience.length > 0) ||
    (resumeData.summary && resumeData.summary.trim())
  );

  // Resume source state: default to 'compass' if content exists, otherwise 'upload'
  const [sourceMode, setSourceMode] = useState<ResumeSourceMode>(() => {
    return hasCompassContent ? 'compass' : 'upload';
  });

  // Source A: Uploaded resume file state
  const [uploadedResume, setUploadedResume] = useState<ExtractedResumeText | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showExtractedText, setShowExtractedText] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Job description input state
  const [selectedJdIndex, setSelectedJdIndex] = useState(0);
  const [jdText, setJdText] = useState(SAMPLE_JDS[0].text);
  const [jobUrl, setJobUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active Job Reference metadata
  const [activeJobInfo, setActiveJobInfo] = useState<{ title: string; company: string; source: string }>({
    title: SAMPLE_JDS[0].title,
    company: SAMPLE_JDS[0].company,
    source: SAMPLE_JDS[0].source,
  });

  // Manual Metadata editing state
  const [showManualMeta, setShowManualMeta] = useState<boolean>(false);
  const [manualTitle, setManualTitle] = useState<string>(SAMPLE_JDS[0].title);
  const [manualCompany, setManualCompany] = useState<string>(SAMPLE_JDS[0].company);

  // Previously Viewed Jobs storage
  const [previouslyViewedJobs, setPreviouslyViewedJobs] = useState<PreviouslyViewedJob[]>(() => {
    try {
      const stored = localStorage.getItem('compass_previously_viewed_jobs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    // Seed with standard presets
    return SAMPLE_JDS.map((jd, idx) => ({
      id: `preset-${idx}`,
      title: jd.title,
      company: jd.company,
      text: jd.text,
      sourceUrl: jd.source,
      sourceType: 'preset',
      timestamp: Date.now() - (idx + 1) * 3600000,
      charCount: jd.text.length,
    }));
  });

  // Failure Modal Popup State
  const [modalState, setModalState] = useState<ImportFailureModalState>({
    isOpen: false,
    title: "Couldn't import this job posting",
    reason: '',
    attemptedUrl: '',
  });

  // Refs for modal focus trap and textarea
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const pasteManuallyBtnRef = useRef<HTMLButtonElement>(null);
  const jdTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Action feedback states
  const [appliedGapIds, setAppliedGapIds] = useState<Record<string, boolean>>({});
  const [copiedGapIds, setCopiedGapIds] = useState<Record<string, boolean>>({});
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);

  // Active requirement gap filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'category_a_matched' | 'category_b_improve' | 'category_c_missing' | 'category_d_uncertain'>('all');

  // Modal accessibility: Escape key listener, body scroll lock, focus restoration
  useEffect(() => {
    if (modalState.isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        pasteManuallyBtnRef.current?.focus();
      }, 60);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCloseModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [modalState.isOpen]);

  // If user transitions to match with new Compass resume content, auto-select if previously on empty
  useEffect(() => {
    if (hasCompassContent && sourceMode === 'upload' && !uploadedResume) {
      setSourceMode('compass');
    }
  }, [hasCompassContent]);

  // Determine active resume input for comparison engine
  let activeResumeInput: ResumeData | string = resumeData;
  if (sourceMode === 'compass') {
    activeResumeInput = resumeData;
  } else {
    activeResumeInput = uploadedResume ? uploadedResume.text : '';
  }

  // Stage 1-5 Unified Dynamic Analysis Engine State
  const [engineResult, setEngineResult] = useState<EngineAnalysisResult | null>(null);
  const [isAnalyzingEngine, setIsAnalyzingEngine] = useState<boolean>(false);
  const [showWeightsDrawer, setShowWeightsDrawer] = useState<boolean>(false);
  const [selectedEvidenceUnitForResumeView, setSelectedEvidenceUnitForResumeView] = useState<ResumeEvidenceUnit | null>(null);
  const [userDescribedNotes, setUserDescribedNotes] = useState<Record<string, string>>({});
  const [userConfirmedCards, setUserConfirmedCards] = useState<Record<string, boolean>>({});
  const [isReEvaluatingNote, setIsReEvaluatingNote] = useState<Record<string, boolean>>({});
  const [expandedDescribeNote, setExpandedDescribeNote] = useState<Record<string, boolean>>({});
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'important' | 'preferred' | 'bonus'>('all');

  // Report download states
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [isQuickDownloadingPdf, setIsQuickDownloadingPdf] = useState<boolean>(false);

  const prepareReportExportData = (): JobMatchReportExportData => {
    const roleFit = engineResult?.scoreBreakdown.roleFitScore ?? analysis.overallMatch;
    const fitLabel =
      roleFit >= 75
        ? 'Strong Role Fit'
        : roleFit >= 50
        ? 'Competitive with Gaps'
        : 'Substantial Gaps';

    const cardsToExport: ThreeBlockResultCard[] = engineResult?.cards || [];

    return {
      jobInfo: {
        title: activeJobInfo.title || analysis.inferredRole || 'Target Role',
        company: activeJobInfo.company || 'Target Company',
        sourceUrl: activeJobInfo.source || jobUrl || undefined,
        location: engineResult?.metadata?.location,
        experienceRange: engineResult?.metadata?.experienceRange,
        workplaceType: engineResult?.metadata?.workplaceType,
      },
      candidateInfo: {
        name: resumeData.fullName || undefined,
        sourceMode,
        fileName: uploadedResume?.fileName,
        charCount: uploadedResume?.charCount,
        detectedSeniority: engineResult?.resumeFacts.detectedSeniorityLevel,
        totalExperienceYears: engineResult?.resumeFacts.totalExperienceYears,
      },
      scores: {
        overallFitScore: roleFit,
        fitLabel,
        priorityWeightedScore: engineResult?.scoreBreakdown.roleFitScore ?? analysis.keywordCoverage,
        quantifiedMetricsScore:
          engineResult?.resumeFacts.quantifiedMetricsPercent ?? analysis.quantifiedImpactScore,
        metricsBulletsCount: engineResult?.resumeFacts.metricsBulletsCount,
        totalBulletsCount: engineResult?.resumeFacts.totalExperienceBullets,
        atsKeywordScore: engineResult?.scoreBreakdown.wordingScore ?? analysis.structureScore,
        honestSummary:
          engineResult?.scoreBreakdown.honestSummary ||
          `Analysis complete. ${analysis.summary.matchedCount} requirements directly evidenced, ${analysis.summary.improveCount} can be sharpened, and ${analysis.summary.missingCount} are missing.`,
        counts: {
          total: cardsToExport.length,
          matched: engineResult?.scoreBreakdown.counts.matched ?? analysis.summary.matchedCount,
          canImprove: engineResult?.scoreBreakdown.counts.canImprove ?? analysis.summary.improveCount,
          missing: engineResult?.scoreBreakdown.counts.missing ?? analysis.summary.missingCount,
          uncertain: engineResult?.scoreBreakdown.counts.uncertain ?? analysis.summary.uncertainCount,
          criticalTotal: engineResult?.scoreBreakdown.counts.criticalTotal,
          criticalMatched: engineResult?.scoreBreakdown.counts.criticalMatched,
        },
      },
      cards: cardsToExport,
      engineModel: engineResult?.modelUsed || '@veriworkly/ats-engine@0.22.0',
      generationDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  };

  const handleQuickDownloadPdf = async () => {
    setIsQuickDownloadingPdf(true);
    try {
      const data = prepareReportExportData();
      const ok = await downloadJobMatchPdf(data);
      if (ok) {
        const filename = getReportFilename(data, 'pdf');
        setInlineNotice(`Downloaded ${filename}`);
        setTimeout(() => setInlineNotice(null), 5000);
      }
    } catch (err) {
      console.error('Quick PDF download failed:', err);
    } finally {
      setIsQuickDownloadingPdf(false);
    }
  };
  // Base deterministic analysis is immediately available
  const baseAnalysis: JDAnalysis = analyzeJobDescription(jdText, activeResumeInput);

  // Debounced pass that runs the deterministic ATS engine
  useEffect(() => {
    let isCurrent = true;
    if (!jdText.trim()) {
      setEngineResult(null);
      setIsAnalyzingEngine(false);
      return;
    }

    setIsAnalyzingEngine(true);

    const timer = setTimeout(async () => {
      try {
        const rawResume =
          typeof activeResumeInput === 'string'
            ? activeResumeInput
            : generateAtsPlainText(activeResumeInput);

        const res = await runJobMatchAnalysis(jdText, rawResume, {
          jobCompany: activeJobInfo.company,
        });

        if (isCurrent) {
          setEngineResult(res);
        }
      } catch (err) {
        console.warn('ATS engine match error:', err);
      } finally {
        if (isCurrent) {
          setIsAnalyzingEngine(false);
        }
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [jdText, activeResumeInput, activeJobInfo.company]);

  // One-click Reset / Restart handler: clears JD text, URL, and resets active reference back to fresh empty state
  const handleResetAll = () => {
    setJdText('');
    setJobUrl('');
    setSelectedJdIndex(-1);
    setActiveJobInfo({
      title: 'Target Role',
      company: 'Target Employer',
      source: '',
    });
    setManualTitle('');
    setManualCompany('');
    setShowManualMeta(false);
    setUrlValidationError(null);
    setImportStatus(null);
    setEngineResult(null);
    setInlineNotice('Workspace reset to empty state. Paste or import a new job description to begin.');
    setTimeout(() => setInlineNotice(null), 4000);
    if (jdTextareaRef.current) {
      jdTextareaRef.current.focus();
    }
  };

  const analysis: JDAnalysis = baseAnalysis;

  // Handle uploaded file ingestion
  const handleProcessFile = async (file: File) => {
    setIsExtracting(true);
    setUploadError(null);

    try {
      const extracted = await extractResumeFileText(file);
      setUploadedResume(extracted);
      setSourceMode('upload');
      setInlineNotice(`Extracted ${extracted.charCount.toLocaleString()} characters from ${file.name}. Benchmark updated.`);
      setTimeout(() => setInlineNotice(null), 5000);
    } catch (err: any) {
      console.error('Resume extraction failed:', err);
      const msg = err?.message || 'Could not extract text from this document. Please ensure it is a valid text-based PDF, DOCX or TXT.';
      setUploadError(msg);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleSelectSampleJd = (index: number) => {
    setSelectedJdIndex(index);
    setJdText(SAMPLE_JDS[index].text);
    setJobUrl(SAMPLE_JDS[index].source);
    setActiveJobInfo({
      title: SAMPLE_JDS[index].title,
      company: SAMPLE_JDS[index].company,
      source: SAMPLE_JDS[index].source,
    });
    setManualTitle(SAMPLE_JDS[index].title);
    setManualCompany(SAMPLE_JDS[index].company);
    setUrlValidationError(null);
    setImportStatus({ type: 'info', message: `Loaded sample job: ${SAMPLE_JDS[index].title}` });
  };

  // Close failure modal safely restoring focus
  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
    }
  };

  // Handle [Paste manually] click in failure modal
  const handlePasteManuallyFromModal = () => {
    handleCloseModal();
    setShowManualMeta(true);
    setTimeout(() => {
      jdTextareaRef.current?.focus();
    }, 80);
  };

  // Save successful import to history and active state
  const handleImportSuccess = (
    text: string,
    title: string,
    company: string,
    sourceUrl: string,
    sourceType: 'greenhouse' | 'lever' | 'public_web'
  ) => {
    const cleanText = cleanJdText(text);

    setJdText(cleanText);
    setActiveJobInfo({ title, company, source: sourceUrl });
    setJobUrl(sourceUrl);
    setManualTitle(title);
    setManualCompany(company);
    setUrlValidationError(null);

    const newRecord: PreviouslyViewedJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      company,
      text: cleanText,
      sourceUrl,
      sourceType,
      timestamp: Date.now(),
      charCount: cleanText.length,
    };

    setPreviouslyViewedJobs((prev) => {
      const filtered = prev.filter((j) => j.sourceUrl !== sourceUrl && j.title !== title);
      const updated = [newRecord, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('compass_previously_viewed_jobs', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setImportStatus({
      type: 'success',
      message: `Imported "${title}" from ${company} (${text.length.toLocaleString()} characters).`,
    });
  };

  // TIERED IMPORT ENGINE
  const executeImport = async (rawUrl: string) => {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) return;

    setUrlValidationError(null);

    // B.1 URL validation (before any request)
    // Trim; require http/https; reject anything else inline with "Please paste a valid job posting link" (no popup for validation errors).
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUrlValidationError('Please paste a valid job posting link (beginning with http:// or https://)');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setUrlValidationError('Please paste a valid job posting link (beginning with http:// or https://)');
      return;
    }

    // B.3 Tier 2 — Login-walled / anti-bot sites: do not attempt
    // If the URL is linkedin.com, indeed.com, glassdoor.com, naukri.com:
    // Make NO network request. Open the failure popup immediately with site-specific explanation.
    const loginWalledSite = getLoginWalledSiteName(trimmed);
    if (loginWalledSite) {
      setModalState({
        isOpen: true,
        title: "Couldn't import this job posting",
        reason: `${loginWalledSite} requires login and blocks automated access, so job pages there can't be imported by link.`,
        attemptedUrl: trimmed,
      });
      return;
    }

    setIsImporting(true);
    setImportStatus(null);

    try {
      // B.2 Tier 1 — ATS platforms with stable public JSON APIs (browser-only CORS)
      // Greenhouse
      const ghInfo = parseGreenhouseUrl(trimmed);
      if (ghInfo) {
        try {
          const ghApiUrl = `https://boards-api.greenhouse.io/v1/boards/${ghInfo.boardToken}/jobs/${ghInfo.jobId}`;
          const res = await fetch(ghApiUrl);
          if (res.status === 404) {
            setModalState({
              isOpen: true,
              title: "Couldn't import this job posting",
              reason: 'Job posting not found on Greenhouse (HTTP 404). The listing may have expired, been closed, or the link may be incomplete.',
              attemptedUrl: trimmed,
            });
            setIsImporting(false);
            return;
          }
          if (!res.ok) {
            throw new Error(`Greenhouse API responded with HTTP ${res.status}`);
          }
          const ghData = await res.json();
          const cleanDesc = cleanHtmlToPlainText(ghData.content || '');
          if (!cleanDesc || cleanDesc.length < 50) {
            setModalState({
              isOpen: true,
              title: "Couldn't import this job posting",
              reason: 'Could not extract sufficient job description text from this Greenhouse posting.',
              attemptedUrl: trimmed,
            });
            setIsImporting(false);
            return;
          }
          const formattedCompany = ghInfo.boardToken.charAt(0).toUpperCase() + ghInfo.boardToken.slice(1);
          handleImportSuccess(cleanDesc, ghData.title || 'Job Posting', formattedCompany, trimmed, 'greenhouse');
          setIsImporting(false);
          return;
        } catch (err: any) {
          console.warn('Greenhouse direct fetch error:', err);
          setModalState({
            isOpen: true,
            title: "Couldn't import this job posting",
            reason: `Could not reach Greenhouse public endpoint: ${err?.message || 'Network error'}.`,
            attemptedUrl: trimmed,
          });
          setIsImporting(false);
          return;
        }
      }

      // Lever
      const leverInfo = parseLeverUrl(trimmed);
      if (leverInfo) {
        try {
          const leverApiUrl = `https://api.lever.co/v0/postings/${leverInfo.companySlug}/${leverInfo.jobId}`;
          const res = await fetch(leverApiUrl);
          if (res.status === 404) {
            setModalState({
              isOpen: true,
              title: "Couldn't import this job posting",
              reason: 'Job posting not found on Lever (HTTP 404). The listing may have expired, been removed, or the link may be incomplete.',
              attemptedUrl: trimmed,
            });
            setIsImporting(false);
            return;
          }
          if (!res.ok) {
            throw new Error(`Lever API responded with HTTP ${res.status}`);
          }
          const leverData = await res.json();
          let leverDesc = leverData.descriptionPlain || cleanHtmlToPlainText(leverData.description || '');
          if (Array.isArray(leverData.lists) && leverData.lists.length > 0) {
            const listsText = leverData.lists
              .map((item: any) => `${item.text}:\n${cleanHtmlToPlainText(item.content || '')}`)
              .join('\n\n');
            leverDesc = leverDesc ? `${leverDesc}\n\n${listsText}` : listsText;
          }
          if (leverData.additionalPlain || leverData.additional) {
            const add = leverData.additionalPlain || cleanHtmlToPlainText(leverData.additional || '');
            leverDesc = leverDesc ? `${leverDesc}\n\n${add}` : add;
          }
          if (!leverDesc || leverDesc.length < 50) {
            setModalState({
              isOpen: true,
              title: "Couldn't import this job posting",
              reason: 'Could not extract sufficient job description text from this Lever posting.',
              attemptedUrl: trimmed,
            });
            setIsImporting(false);
            return;
          }
          const formattedCompany = leverInfo.companySlug.charAt(0).toUpperCase() + leverInfo.companySlug.slice(1);
          handleImportSuccess(leverDesc, leverData.text || 'Job Posting', formattedCompany, trimmed, 'lever');
          setIsImporting(false);
          return;
        } catch (err: any) {
          console.warn('Lever direct fetch error:', err);
          setModalState({
            isOpen: true,
            title: "Couldn't import this job posting",
            reason: `Could not reach Lever public endpoint: ${err?.message || 'Network error'}.`,
            attemptedUrl: trimmed,
          });
          setIsImporting(false);
          return;
        }
      }

      // B.4 Tier 3 — Other public company career sites (via /api/fetch-jd)
      const resp = await fetch('/api/fetch-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await resp.json().catch(() => null);

      if (resp.status === 404) {
        setModalState({
          isOpen: true,
          title: "Couldn't import this job posting",
          reason: 'Job posting not found on this website (HTTP 404). The listing may have expired, been removed, or the link is incomplete.',
          attemptedUrl: trimmed,
        });
        setIsImporting(false);
        return;
      }

      if (resp.status === 504) {
        setModalState({
          isOpen: true,
          title: "Couldn't import this job posting",
          reason: 'The website took longer than 10 seconds to respond (connection timed out).',
          attemptedUrl: trimmed,
        });
        setIsImporting(false);
        return;
      }

      if (!resp.ok || !data?.success) {
        let failureReason = data?.error || 'Could not retrieve the job description from this link.';
        if (resp.status === 502) {
          failureReason = 'The destination website blocked automated access or requires login credentials.';
        } else if (resp.status === 422) {
          failureReason = 'Could not extract a readable job description from this page (it may be rendered via JavaScript or behind an application portal).';
        }
        setModalState({
          isOpen: true,
          title: "Couldn't import this job posting",
          reason: failureReason,
          attemptedUrl: trimmed,
        });
        setIsImporting(false);
        return;
      }

      // Success Tier 3
      handleImportSuccess(data.text, data.title || 'Job Role', data.company || 'Target Company', trimmed, 'public_web');
    } catch (err: any) {
      console.error('Job import error:', err);
      setModalState({
        isOpen: true,
        title: "Couldn't import this job posting",
        reason: `Could not connect to the job posting URL (${err?.message || 'network connection failed'}).`,
        attemptedUrl: trimmed,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleUrlImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeImport(jobUrl);
  };

  // Restore job from Previously Viewed list
  const handleLoadPreviouslyViewed = (job: PreviouslyViewedJob) => {
    setJdText(job.text);
    setActiveJobInfo({ title: job.title, company: job.company, source: job.sourceUrl });
    setJobUrl(job.sourceUrl.startsWith('http') ? job.sourceUrl : '');
    setManualTitle(job.title);
    setManualCompany(job.company);
    setUrlValidationError(null);
    setImportStatus({
      type: 'info',
      message: `Restored "${job.title}" (${job.company}) into active comparison.`,
    });
  };

  // Remove job from Previously Viewed list
  const handleRemovePreviouslyViewed = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviouslyViewedJobs((prev) => {
      const updated = prev.filter((j) => j.id !== id);
      try {
        localStorage.setItem('compass_previously_viewed_jobs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Manual title & company edit handlers
  const handleManualTitleChange = (val: string) => {
    setManualTitle(val);
    setActiveJobInfo((prev) => ({ ...prev, title: val.trim() || 'Custom Job Posting' }));
  };

  const handleManualCompanyChange = (val: string) => {
    setManualCompany(val);
    setActiveJobInfo((prev) => ({ ...prev, company: val.trim() || 'Target Employer' }));
  };

  // SOURCE B ACTION: Apply rewrite directly to Compass Resume in memory
  const handleApplyRewriteToCompassResume = (gap: RequirementGap) => {
    if (!gap.supportingEvidence || !gap.recommendedImprovement) return;

    const originalBullet = gap.supportingEvidence.originalBullet.trim();
    const replacement = gap.recommendedImprovement.trim();

    let bulletUpdated = false;
    const updatedExp = resumeData.experience.map((exp) => {
      const updatedBullets = exp.bullets.map((b) => {
        if (b.trim() === originalBullet) {
          bulletUpdated = true;
          return replacement;
        }
        return b;
      });
      return { ...exp, bullets: updatedBullets };
    });

    if (bulletUpdated) {
      onUpdateResume({ ...resumeData, experience: updatedExp });
      setAppliedGapIds((prev) => ({ ...prev, [gap.id]: true }));
      setInlineNotice(`✓ Updated bullet in your Compass resume! Match score recalculated.`);
      setTimeout(() => setInlineNotice(null), 4000);
    } else {
      // Fallback: If not found in experience, check projects
      let projectUpdated = false;
      const updatedProjects = (resumeData.projects || []).map((proj) => {
        const updatedBullets = proj.bullets.map((b) => {
          if (b.trim() === originalBullet) {
            projectUpdated = true;
            return replacement;
          }
          return b;
        });
        return { ...proj, bullets: updatedBullets };
      });

      if (projectUpdated) {
        onUpdateResume({ ...resumeData, projects: updatedProjects });
        setAppliedGapIds((prev) => ({ ...prev, [gap.id]: true }));
        setInlineNotice(`✓ Updated project bullet in your Compass resume! Match score recalculated.`);
        setTimeout(() => setInlineNotice(null), 4000);
      }
    }
  };

  // SOURCE A ACTION: Copy suggestion to clipboard
  const handleCopySuggestion = (gap: RequirementGap) => {
    if (!gap.recommendedImprovement) return;
    navigator.clipboard.writeText(gap.recommendedImprovement);
    setCopiedGapIds((prev) => ({ ...prev, [gap.id]: true }));
    setTimeout(() => {
      setCopiedGapIds((prev) => ({ ...prev, [gap.id]: false }));
    }, 2500);
  };

  // Card Actions for the 3-Block Result Cards
  const handleApplyCardRewriteToCompassResume = (card: ThreeBlockResultCard) => {
    if (!card.whatToDo.sourceBulletText || !card.whatToDo.suggestedRewrite) return;
    const originalBullet = card.whatToDo.sourceBulletText.trim();
    const replacement = card.whatToDo.suggestedRewrite.trim();

    let bulletUpdated = false;
    const updatedExp = resumeData.experience.map((exp) => {
      const updatedBullets = exp.bullets.map((b) => {
        if (b.trim() === originalBullet || originalBullet.includes(b.trim()) || b.trim().includes(originalBullet)) {
          bulletUpdated = true;
          return replacement;
        }
        return b;
      });
      return { ...exp, bullets: updatedBullets };
    });

    if (bulletUpdated) {
      onUpdateResume({ ...resumeData, experience: updatedExp });
      setAppliedGapIds((prev) => ({ ...prev, [card.id]: true }));
      setInlineNotice(`✓ Applied rewrite for "${card.requirement.canonicalTerm}" to your Compass resume! Match score recalculated.`);
      setTimeout(() => setInlineNotice(null), 4000);
      return;
    }

    let projUpdated = false;
    const updatedProj = (resumeData.projects || []).map((proj) => {
      const updatedBullets = proj.bullets.map((b) => {
        if (b.trim() === originalBullet || originalBullet.includes(b.trim()) || b.trim().includes(originalBullet)) {
          projUpdated = true;
          return replacement;
        }
        return b;
      });
      return { ...proj, bullets: updatedBullets };
    });

    if (projUpdated) {
      onUpdateResume({ ...resumeData, projects: updatedProj });
      setAppliedGapIds((prev) => ({ ...prev, [card.id]: true }));
      setInlineNotice(`✓ Applied rewrite for "${card.requirement.canonicalTerm}" to your Compass resume! Match score recalculated.`);
      setTimeout(() => setInlineNotice(null), 4000);
    }
  };

  const handleCopyCardSuggestion = (card: ThreeBlockResultCard) => {
    if (!card.whatToDo.suggestedRewrite) return;
    navigator.clipboard.writeText(card.whatToDo.suggestedRewrite);
    setCopiedGapIds((prev) => ({ ...prev, [card.id]: true }));
    setTimeout(() => {
      setCopiedGapIds((prev) => ({ ...prev, [card.id]: false }));
    }, 2500);
  };

  const handleToggleDescribeNote = (cardId: string) => {
    setExpandedDescribeNote((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleReEvaluateNote = (cardId: string) => {
    const note = userDescribedNotes[cardId];
    if (!note || note.trim().length < 5) return;

    setIsReEvaluatingNote((prev) => ({ ...prev, [cardId]: true }));
    setTimeout(() => {
      setUserConfirmedCards((prev) => ({ ...prev, [cardId]: true }));
      setIsReEvaluatingNote((prev) => ({ ...prev, [cardId]: false }));
      setInlineNotice(`✓ Experience verified: Re-evaluation confirmed for this qualification.`);
      setTimeout(() => setInlineNotice(null), 4000);
    }, 450);
  };

  const filteredGaps = analysis.requirementGaps.filter((g) => {
    if (activeFilter === 'all') return true;
    return g.classification === activeFilter;
  });

  const cardsList = engineResult?.cards || [];
  const filteredCards = cardsList.filter((card) => {
    // Classification filter
    if (activeFilter === 'category_a_matched' && card.classification !== 'matched') return false;
    if (activeFilter === 'category_b_improve' && card.classification !== 'can_improve') return false;
    if (activeFilter === 'category_c_missing' && card.classification !== 'missing') return false;
    if (activeFilter === 'category_d_uncertain' && card.classification !== 'uncertain') return false;

    // Priority filter
    if (priorityFilter !== 'all' && card.requirement.priority !== priorityFilter) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      <>
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-[#00DF89] px-2.5 py-0.5 rounded bg-[#00DF89]/10 border border-[#00DF89]/30">
                03. JOB MATCH & ATS BENCHMARK
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Job Match Optimizer</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Deterministic ATS evaluation engine that parses requirements, verifies candidate evidence units, and calculates precise match scores.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigateTab('resume')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#00DF89]" />
              <span>Resume Studio →</span>
            </button>

            {/* Download Match Report Button with 1-click Quick PDF */}
            {!user && (
              <div className="relative inline-flex items-center rounded-xl shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowDownloadModal(true)}
                  className="px-3.5 py-1.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold text-xs rounded-l-xl transition-all flex items-center gap-1.5 cursor-pointer shadow"
                  title="Download Job Match Audit Report (PDF, Markdown, TXT, JSON)"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-950" />
                  <span>Download Report</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickDownloadPdf}
                  disabled={isQuickDownloadingPdf}
                  className="px-2 py-1.5 bg-[#00c97b] hover:bg-[#00b36c] text-slate-950 border-l border-emerald-600 font-bold text-xs rounded-r-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                  title="Quick 1-Click PDF Download"
                >
                  {isQuickDownloadingPdf ? (
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-950" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Inline Feedback Notice */}
        {inlineNotice && (
          <div className="bg-[#00DF89]/15 border border-[#00DF89]/40 text-[#00DF89] text-xs font-bold px-4 py-2.5 rounded-xl animate-fade-in flex items-center justify-between shadow-lg shadow-emerald-950/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{inlineNotice}</span>
            </div>
            <button
              onClick={() => setInlineNotice(null)}
              className="text-slate-400 hover:text-white font-mono cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RESUME SOURCE SELECTOR (SOURCE A, SOURCE B, SAMPLE)                       */}
        {/* ========================================================================= */}
        <div className="bg-[#0E1526] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00DF89]">Step 1 · Resume Source</span>
              <h2 className="text-base font-bold text-white">Select Which Resume to Benchmark</h2>
            </div>

          </div>

          {/* 2-Way Source Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SOURCE A: UPLOAD YOUR RESUME */}
            <div
              onClick={() => setSourceMode('upload')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                sourceMode === 'upload'
                  ? 'bg-emerald-950/30 border-[#00DF89] ring-1 ring-[#00DF89]/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-[#00DF89]" />
                    <span>Upload your resume</span>
                  </span>
                  {sourceMode === 'upload' && (
                    <span className="w-2 h-2 rounded-full bg-[#00DF89] animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Accepts text-based <strong className="text-slate-300">.pdf</strong>, <strong className="text-slate-300">.docx</strong>, or <strong className="text-slate-300">.txt</strong> (up to 5MB).
                </p>
              </div>

              <div className="pt-3">
                {uploadedResume ? (
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
                    <span className="truncate max-w-[160px]">{uploadedResume.fileName}</span>
                    <span>✓ Ready</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Click to select file
                  </span>
                )}
              </div>
            </div>

            {/* SOURCE B: USE MY COMPASS RESUME */}
            <div
              onClick={() => {
                if (hasCompassContent) {
                  setSourceMode('compass');
                }
              }}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                !hasCompassContent
                  ? 'bg-slate-900/30 border-slate-800/60 opacity-60 cursor-not-allowed'
                  : sourceMode === 'compass'
                  ? 'bg-emerald-950/30 border-[#00DF89] ring-1 ring-[#00DF89]/40 cursor-pointer'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 cursor-pointer'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00DF89]" />
                    <span>Use my Compass resume</span>
                  </span>
                  {sourceMode === 'compass' && (
                    <span className="w-2 h-2 rounded-full bg-[#00DF89] animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {hasCompassContent
                    ? `Live sync from Resume Studio (${resumeData.experience.length} roles, ${resumeData.experience.reduce((a, c) => a + c.bullets.length, 0)} bullets).`
                    : 'Create a resume in Resume Studio first to enable this source.'}
                </p>
              </div>

              <div className="pt-3">
                {hasCompassContent ? (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span>✓ Live Compass data active</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateTab('resume');
                    }}
                    className="text-[11px] text-[#00DF89] hover:underline font-semibold"
                  >
                    Open Resume Studio →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SOURCE A: UPLOAD DROPZONE & COLLAPSIBLE EXTRACTED TEXT ACCORDION */}
          {sourceMode === 'upload' && (
            <div className="pt-2 space-y-3">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!uploadedResume ? (
                /* Drag & Drop Area */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleProcessFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
                    isDragging
                      ? 'border-[#00DF89] bg-emerald-950/40 scale-[1.01]'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-950/60'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-[#00DF89]">
                    {isExtracting ? (
                      <span className="w-5 h-5 border-2 border-[#00DF89] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isExtracting ? 'Reading document layers & extracting text...' : 'Upload your resume document'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Drag and drop your <strong className="text-slate-300">.pdf</strong>, <strong className="text-slate-300">.docx</strong>, or <strong className="text-slate-300">.txt</strong> file here, or click to browse. Real file validation via magic bytes (max 5MB).
                    </p>
                  </div>
                </div>
              ) : (
                /* Uploaded File Summary Header */
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-[#00DF89] shrink-0 font-bold font-mono text-xs uppercase">
                      {uploadedResume.fileType}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{uploadedResume.fileName}</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                          {uploadedResume.charCount.toLocaleString()} chars
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Extracted text successfully parsed into discrete evidence lines for the comparison engine.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowExtractedText(!showExtractedText)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{showExtractedText ? 'Hide extracted text' : 'View extracted text'}</span>
                      {showExtractedText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Re-upload
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-3 bg-rose-950/40 border border-rose-600/50 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">Upload Failed</span>
                    <p className="text-[11px] leading-relaxed text-rose-200/90">{uploadError}</p>
                  </div>
                </div>
              )}

              {/* Collapsed Accordion: "Resume text we read" */}
              {uploadedResume && showExtractedText && (
                <div className="space-y-2 p-3 bg-slate-950/90 rounded-xl border border-slate-800 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#00DF89]" />
                      <span>Resume text we read ({uploadedResume.charCount.toLocaleString()} characters)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Read-only preview</span>
                  </div>
                  <pre className="p-3 bg-[#070B14] rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-300 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                    {uploadedResume.text}
                  </pre>
                  <p className="text-[10px] text-slate-400 italic">
                    ℹ️ Verify what the engine sees. If formatting or text looks incorrect, re-upload a cleaner text-based PDF, DOCX or TXT file.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MAIN TWO-COLUMN GRID                                                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: JOB DESCRIPTION SOURCE & EDITABLE TEXT AREA */}
          <div className="lg:col-span-5 bg-[#0E1526] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Job Description Source</h3>
              <span className="text-[11px] text-[#00DF89] font-bold bg-[#00DF89]/10 px-2.5 py-0.5 rounded border border-[#00DF89]/30">
                Requirements 3× Weight
              </span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Load Curated MBA Role Preset:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_JDS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSampleJd(idx)}
                    className={`p-2 rounded-xl text-[11px] text-left border transition-all cursor-pointer ${
                      selectedJdIndex === idx && activeJobInfo.title === s.title
                        ? 'bg-emerald-950/80 border-[#00DF89] text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold truncate">{s.company}</div>
                    <div className="text-[10px] opacity-80 truncate">{s.title.split('—')[0]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* URL Import */}
            <div className="space-y-2.5 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#00DF89]">
                  Paste Job URL:
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Greenhouse, Lever, or Public Careers
                </span>
              </div>

              <form onSubmit={handleUrlImportSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={jobUrl}
                  onChange={(e) => {
                    setJobUrl(e.target.value);
                    if (urlValidationError) setUrlValidationError(null);
                  }}
                  disabled={isImporting}
                  placeholder="e.g. https://boards.greenhouse.io/... or https://jobs.lever.co/..."
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[#00DF89] disabled:opacity-60 font-mono"
                />
                <button
                  type="submit"
                  disabled={isImporting || !jobUrl.trim()}
                  className="px-3.5 py-2 bg-[#00DF89] hover:bg-[#00c97b] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs rounded-lg whitespace-nowrap transition-all shadow flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>Import Job</span>
                  )}
                </button>
              </form>

              {/* Inline URL format validation (no popup for validation errors) */}
              {urlValidationError && (
                <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 animate-fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{urlValidationError}</span>
                </p>
              )}



              {importStatus && (
                <div
                  className={`text-xs p-2.5 rounded-lg border flex items-start gap-2 ${
                    importStatus.type === 'error'
                      ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                      : importStatus.type === 'success'
                      ? 'bg-emerald-950/40 border-[#00DF89]/30 text-[#00DF89]'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-bold shrink-0 mt-0.5">
                    {importStatus.type === 'error' ? '⚠' : importStatus.type === 'success' ? '✓' : 'ℹ'}
                  </span>
                  <span className="leading-snug">{importStatus.message}</span>
                </div>
              )}
            </div>

            {/* Previously Viewed Jobs Panel */}
            {previouslyViewedJobs.length > 0 && (
              <div className="space-y-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#00DF89]" />
                    <span>Previously Viewed Jobs ({previouslyViewedJobs.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Click to restore</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {previouslyViewedJobs.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadPreviouslyViewed(item)}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        activeJobInfo.title === item.title && activeJobInfo.company === item.company
                          ? 'bg-emerald-950/40 border-[#00DF89]/60 text-white'
                          : 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white truncate text-xs">{item.title}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="truncate">{item.company}</span>
                          <span>•</span>
                          <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-slate-800 border border-slate-700">
                            {item.sourceType}
                          </span>
                          <span>•</span>
                          <span>{item.charCount.toLocaleString()} chars</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleRemovePreviouslyViewed(item.id, e)}
                          title="Remove from history"
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Reference Box */}
            <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-[#00DF89]/40 rounded-xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#00DF89] uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00DF89] animate-pulse" />
                  Active Job Reference
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManualMeta(!showManualMeta)}
                    className="text-[11px] text-slate-400 hover:text-[#00DF89] flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{showManualMeta ? 'Hide Labels' : 'Edit Labels'}</span>
                  </button>
                  {activeJobInfo.source && activeJobInfo.source.startsWith('http') && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeJobInfo.source);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="text-[11px] text-slate-400 hover:text-[#00DF89] flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 transition-colors cursor-pointer"
                    >
                      <span>{copiedLink ? 'Copied ✓' : 'Copy Link'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>🎯</span>
                  <span>{activeJobInfo.title}</span>
                </h2>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300">
                  <span className="font-semibold text-white flex items-center gap-1">
                    <span>🏢</span>
                    <span>{activeJobInfo.company}</span>
                  </span>
                  {activeJobInfo.source && !activeJobInfo.source.startsWith('http') && (
                    <span className="text-[10px] font-mono text-slate-400">
                      ({activeJobInfo.source})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Editable Title and Company inputs (revealed via Paste Manually or Edit Labels toggle) */}
            {showManualMeta && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 animate-fade-in">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Job Details (Label Your Manually Pasted Job):</span>
                  <span className="text-[10px] text-slate-400 font-mono">Syncs Active Reference</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Job Title</label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => handleManualTitleChange(e.target.value)}
                      placeholder="e.g. Senior Product Manager"
                      className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[#00DF89]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Company Name</label>
                    <input
                      type="text"
                      value={manualCompany}
                      onChange={(e) => handleManualCompanyChange(e.target.value)}
                      placeholder="e.g. Swiggy, Stripe, Google"
                      className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[#00DF89]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Editable Text Area (The Single Source of Truth for JD) */}
            {/* Editable Text Area (The Single Source of Truth for JD) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <label className="block text-xs font-semibold text-slate-300">
                  Job Description Text (Fully Editable):
                </label>
                <div className="flex items-center gap-2">
                  {jdText.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium hover:underline cursor-pointer"
                      title="Clear Job Description and restart analysis"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear / Reset</span>
                    </button>
                  )}
                  <span className="text-[10px] text-emerald-400 font-bold">Single Engine Source</span>
                </div>
              </div>
              <textarea
                ref={jdTextareaRef}
                rows={11}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste any company job posting text here..."
                className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89] font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: ATS ENGINE MATCH RESULTS */}
          <div className="lg:col-span-7 space-y-6">
            <AtsEngineResultsView
              jdText={jdText}
              activeJobInfo={activeJobInfo}
              engineResult={engineResult}
              isAnalyzing={isAnalyzingEngine}
              onResetAll={handleResetAll}
              onLoadSampleJd={() => handleSelectSampleJd(0)}
              onQuickDownloadPdf={handleQuickDownloadPdf}
              onOpenExportModal={() => setShowDownloadModal(true)}
              onRetry={() => {
                setIsAnalyzingEngine(true);
                const rawResume =
                  typeof activeResumeInput === 'string'
                    ? activeResumeInput
                    : generateAtsPlainText(activeResumeInput);
                runJobMatchAnalysis(jdText, rawResume, {
                  jobCompany: activeJobInfo.company,
                })
                  .then(setEngineResult)
                  .catch((err) => console.warn('Retry error:', err))
                  .finally(() => setIsAnalyzingEngine(false));
              }}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ACCESSIBLE IMPORT FAILURE MODAL POPUP                                     */}
        {/* ========================================================================= */}
        {modalState.isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-failure-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseModal();
            }}
          >
            <div
              className="bg-[#0E1526] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left space-y-5 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close X */}
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Close modal"
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="import-failure-title" className="text-lg font-bold text-white tracking-tight">
                    {modalState.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-sm">
                    {modalState.attemptedUrl}
                  </p>
                </div>
              </div>

              {/* Body with reason and manual paste instructions */}
              <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 text-xs leading-relaxed">
                <div className="text-slate-200">
                  <strong className="text-amber-300">Why it couldn't be imported:</strong>
                  <p className="mt-1 text-slate-300">{modalState.reason}</p>
                </div>
                <div className="border-t border-slate-800 pt-3 text-slate-300">
                  <p className="font-medium text-slate-200">
                    Please open the posting, copy the job description, and paste it below — the analysis works exactly the same.
                  </p>
                </div>
              </div>

              {/* Actions: [Try again] and [Paste manually] */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const urlToRetry = modalState.attemptedUrl;
                    handleCloseModal();
                    executeImport(urlToRetry);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try again</span>
                </button>

                <button
                  ref={pasteManuallyBtnRef}
                  type="button"
                  onClick={handlePasteManuallyFromModal}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-950" />
                  <span>Paste manually</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* "How This Is Calculated" Weights & Scoring Drawer */}
        {showWeightsDrawer && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="weights-drawer-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowWeightsDrawer(false);
            }}
          >
            <div
              className="bg-[#0E1526] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative text-left space-y-5 max-h-[88vh] overflow-y-auto animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-[#00DF89]/40 flex items-center justify-center text-[#00DF89]">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 id="weights-drawer-title" className="text-base font-bold text-white tracking-tight">
                      How Role Fit Is Calculated
                    </h2>
                    <p className="text-xs text-slate-400">
                      Objective, priority-weighted scoring formula with zero opaque estimations.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeightsDrawer(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Priority Multipliers Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">
                  1. Requirement Priority Weights
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Critical</div>
                    <div className="text-base font-black text-rose-300">3.0×</div>
                    <div className="text-[10px] text-slate-500">Must-have / Minimum</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Important</div>
                    <div className="text-base font-black text-amber-300">2.0×</div>
                    <div className="text-[10px] text-slate-500">Core Responsibilities</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Preferred</div>
                    <div className="text-base font-black text-emerald-300">1.0×</div>
                    <div className="text-[10px] text-slate-500">Nice-to-have</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Bonus</div>
                    <div className="text-base font-black text-slate-300">0.5×</div>
                    <div className="text-[10px] text-slate-500">Supplementary</div>
                  </div>
                </div>
              </div>

              {/* Classification Scoring */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#00DF89] uppercase tracking-wider">
                  2. Status Multipliers
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-emerald-400 text-[10px] uppercase font-sans font-bold">Matched</div>
                    <div className="text-sm font-bold text-white">100% (1.0)</div>
                    <div className="text-[10px] text-slate-500 font-sans">Full evidence</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[#00DF89] text-[10px] uppercase font-sans font-bold">Can Improve</div>
                    <div className="text-sm font-bold text-white">65% (0.65)</div>
                    <div className="text-[10px] text-slate-500 font-sans">Valid adjacent proof</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-amber-400 text-[10px] uppercase font-sans font-bold">Uncertain</div>
                    <div className="text-sm font-bold text-white">35% (0.35)</div>
                    <div className="text-[10px] text-slate-500 font-sans">Needs candidate detail</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-rose-400 text-[10px] uppercase font-sans font-bold">Missing</div>
                    <div className="text-sm font-bold text-white">0% (0.0)</div>
                    <div className="text-[10px] text-slate-500 font-sans">No evidence</div>
                  </div>
                </div>
              </div>

              {/* Formula & Itemized Breakdown */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="font-bold text-white">Formula:</div>
                <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-[#00DF89]">
                  Role Fit % = (Σ Status Multiplier × Priority Weight) ÷ (Σ 1.0 × Priority Weight) × 100
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Every requirement extracted from the actual job description text is mapped to a priority based on the section where it appears. Critical requirements carry 3× the scoring influence of preferred qualifications, ensuring honest role fit assessment.
                </p>
              </div>

              {/* Quantified Metrics Rule */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-white">Quantified Metrics Score:</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Calculated strictly across complete work experience bullet points (rejoined without line breaks or sentence fragments). Bullets containing verifiable metrics (numbers, percentages, currency, scaling multipliers) count toward the ratio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* "Show in Resume" Evidence Viewer Drawer */}
        {selectedEvidenceUnitForResumeView && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-viewer-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedEvidenceUnitForResumeView(null);
            }}
          >
            <div
              className="bg-[#0E1526] border border-slate-700/80 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative text-left space-y-4 max-h-[88vh] overflow-y-auto animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-[#00DF89]/40 flex items-center justify-center text-[#00DF89]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 id="resume-viewer-title" className="text-base font-bold text-white tracking-tight">
                      Resume Evidence Inspector
                    </h2>
                    <p className="text-xs text-slate-400">
                      Inspecting cited bullet unit #{selectedEvidenceUnitForResumeView.index} in your active resume.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvidenceUnitForResumeView(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cited Unit Highlight Callout */}
              <div className="p-3.5 bg-emerald-950/40 rounded-xl border-2 border-[#00DF89]/80 space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between text-[10px] text-[#00DF89] font-bold uppercase tracking-wider">
                  <span>Highlighted Evidence Bullet</span>
                  <span>Unit #{selectedEvidenceUnitForResumeView.index}</span>
                </div>
                <div className="text-slate-100 font-mono text-xs leading-relaxed select-text font-medium">
                  {selectedEvidenceUnitForResumeView.text}
                </div>
                {selectedEvidenceUnitForResumeView.roleTitle && (
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-emerald-900/60">
                    Role: {selectedEvidenceUnitForResumeView.roleTitle} {selectedEvidenceUnitForResumeView.company ? `at ${selectedEvidenceUnitForResumeView.company}` : ''}
                  </div>
                )}
              </div>

              {/* Full Read-Only Resume Units View */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">Complete Evidence Units Parsed:</div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-72 overflow-y-auto space-y-2 text-xs font-mono">
                  {(engineResult?.resumeFacts.evidenceUnits || []).map((u) => {
                    const isSelected = u.index === selectedEvidenceUnitForResumeView.index;
                    return (
                      <div
                        key={u.index}
                        id={`evidence-unit-${u.index}`}
                        className={`p-2.5 rounded-lg border transition-all text-xs select-text ${
                          isSelected
                            ? 'bg-emerald-950/70 border-[#00DF89] text-white shadow-md'
                            : 'bg-slate-900/40 border-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>Unit #{u.index} · {u.section}</span>
                          {isSelected && <span className="text-[#00DF89] font-bold">★ CITED EVIDENCE</span>}
                        </div>
                        <div>{u.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Match Report Download Modal */}
        <JobMatchDownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          data={prepareReportExportData()}
          onToast={(msg) => {
            setInlineNotice(msg);
            setTimeout(() => setInlineNotice(null), 5000);
          }}
        />
        </div>
      </>
    </div>
  );
};
