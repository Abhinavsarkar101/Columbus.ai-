import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileDown,
  Copy,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Palette,
  ZoomIn,
  ZoomOut,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Wrench,
  Award,
  User,
  Zap,
  BarChart2,
  X,
  RotateCcw,
  LayoutTemplate,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResumeData,
  ResumeTemplateId,
  ResumeFontFamily,
  ResumeFontSize,
  AtsCheckResult,
  CustomSection,
} from '../types';
import {
  EMPTY_RESUME_DATA,
  SAMPLE_MBA_RESUME,
  RESUME_TEMPLATES,
  RESUME_ACCENT_COLORS,
  RESUME_FONTS,
  POWER_VERBS_CATALOG,
  GOOGLE_XYZ_TEMPLATES,
  hasMetric,
  startsWithActionVerb,
  runAtsChecks,
  generateAtsPlainText,
  downloadResumePdf,
} from '../lib/resume';

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
  const { user } = useAuth();
  // Left pane active view: 'templates' | 'content' | 'ats'
  const [leftTab, setLeftTab] = useState<'templates' | 'content' | 'ats'>('templates');

  // Mobile viewport toggle (left pane vs right preview)
  const [mobileTab, setMobileTab] = useState<'left' | 'preview'>('left');

  // Preview zoom level (default 100%)
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Status indicators
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleClearAllFields = () => {
    if (window.confirm('Are you sure you want to clear all resume fields? This will completely erase the resume from the website.')) {
      onUpdateResume(EMPTY_RESUME_DATA);
      try {
        localStorage.removeItem('uprezr_resume_data');
        localStorage.removeItem('user_resume');
        localStorage.clear();
      } catch (e) {
        // Storage clearing fallback
      }
      setActionNotice('All resume fields erased.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const dismissReview = (_section?: string) => {};

  // Modals for bullet tools
  const [activeModal, setActiveModal] = useState<'none' | 'xyz' | 'verbs'>('none');
  const [activeBulletTarget, setActiveBulletTarget] = useState<{
    type: 'exp' | 'proj';
    itemIndex: number;
    bulletIndex: number;
  } | null>(null);

  // XYZ Builder local state
  const [selectedXyzTemplate, setSelectedXyzTemplate] = useState<string>(GOOGLE_XYZ_TEMPLATES[0].id);
  const [xyzX, setXyzX] = useState<string>('');
  const [xyzY, setXyzY] = useState<string>('');
  const [xyzZ, setXyzZ] = useState<string>('');

  // Power verbs local state
  const [verbSearch, setVerbSearch] = useState<string>('');
  const [selectedVerbCategory, setSelectedVerbCategory] = useState<string>('all');

  // Collapsible section cards in content editor
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    contact: true,
    summary: true,
    experience: true,
    education: true,
    projects: true,
    skills: true,
    certifications: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Safe accessor for customization
  const activeTemplate: ResumeTemplateId = resumeData.activeTemplate || 'clean';
  const accentColor: string = resumeData.accentColor || '#2563EB';
  const fontFamily: ResumeFontFamily = resumeData.fontFamily || 'sans';
  const fontSize: ResumeFontSize = resumeData.fontSize || 'base';

  const rawSectionOrder: string[] = resumeData.sectionOrder || [
    'summary',
    'experience',
    'education',
    'projects',
    'skills',
    'certifications',
  ];
  if (!rawSectionOrder.includes('certifications')) {
    rawSectionOrder.push('certifications');
  }
  const customSectionIds = (resumeData.customSections || []).map((cs) => cs.id);
  const effectiveSectionOrder = [
    ...rawSectionOrder,
    ...customSectionIds.filter((id) => !rawSectionOrder.includes(id)),
  ];

  const sectionVisibility: Record<string, boolean> = resumeData.sectionVisibility || {
    summary: true,
    experience: true,
    education: true,
    projects: true,
    skills: true,
    certifications: true,
  };

  // Live ATS Checks
  const atsChecks: AtsCheckResult[] = runAtsChecks(resumeData);
  const passedChecks = atsChecks.filter((c) => c.passed).length;
  const atsScore = Math.round((passedChecks / atsChecks.length) * 100);

  // Handlers for updating ResumeData
  const handleUpdate = (updates: Partial<ResumeData>) => {
    onUpdateResume({
      ...resumeData,
      ...updates,
    });
  };

  const handleFieldChange = (field: keyof ResumeData, value: any) => {
    if (['fullName', 'headline', 'email', 'phone', 'location', 'linkedinUrl', 'githubOrPortfolio'].includes(field as string)) {
      dismissReview('contact');
    }
    if (field === 'summary') {
      dismissReview('summary');
    }
    handleUpdate({ [field]: value });
  };

  // Section visibility toggle
  const toggleVisibility = (sectionKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedVis = {
      ...sectionVisibility,
      [sectionKey]: sectionVisibility[sectionKey] === false ? true : false,
    };
    handleUpdate({ sectionVisibility: updatedVis });
  };

  // Section reordering
  const moveSection = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const newOrder = [...effectiveSectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    handleUpdate({ sectionOrder: newOrder });
  };

  // Work Experience Handlers
  const handleAddExperience = () => {
    dismissReview('experience');
    const newExp = {
      id: `exp_${Date.now()}`,
      role: 'Associate Manager / Specialist',
      company: 'Target Enterprise',
      location: 'Bengaluru, India',
      startDate: '2024',
      endDate: 'Present',
      current: true,
      bullets: [
        'Spearheaded strategic operations, delivering a 25% revenue expansion across target accounts.',
      ],
    };
    handleUpdate({ experience: [newExp, ...resumeData.experience] });
  };

  const handleRemoveExperience = (index: number) => {
    dismissReview('experience');
    const updated = resumeData.experience.filter((_, idx) => idx !== index);
    handleUpdate({ experience: updated });
  };

  const handleExperienceChange = (index: number, field: string, value: any) => {
    dismissReview('experience');
    const updated = [...resumeData.experience];
    updated[index] = { ...updated[index], [field]: value };
    handleUpdate({ experience: updated });
  };

  const handleBulletChange = (expIndex: number, bulletIndex: number, text: string) => {
    dismissReview('experience');
    const updated = [...resumeData.experience];
    const bullets = [...updated[expIndex].bullets];
    bullets[bulletIndex] = text;
    updated[expIndex] = { ...updated[expIndex], bullets };
    handleUpdate({ experience: updated });
  };

  const handleAddBullet = (expIndex: number) => {
    dismissReview('experience');
    const updated = [...resumeData.experience];
    updated[expIndex] = {
      ...updated[expIndex],
      bullets: [...updated[expIndex].bullets, ''],
    };
    handleUpdate({ experience: updated });
  };

  const handleRemoveBullet = (expIndex: number, bulletIndex: number) => {
    dismissReview('experience');
    const updated = [...resumeData.experience];
    updated[expIndex] = {
      ...updated[expIndex],
      bullets: updated[expIndex].bullets.filter((_, idx) => idx !== bulletIndex),
    };
    handleUpdate({ experience: updated });
  };

  // Education Handlers
  const handleAddEducation = () => {
    dismissReview('education');
    const newEdu = {
      id: `edu_${Date.now()}`,
      institution: 'University / Institute Name',
      degree: 'Master of Business Administration (MBA)',
      field: 'Strategy & Leadership',
      location: 'City, Country',
      startDate: '2025',
      endDate: '2027',
      gpaOrScore: 'GPA: 3.8 / 4.0',
      honors: 'Merit Scholar',
    };
    handleUpdate({ education: [...resumeData.education, newEdu] });
  };

  const handleEducationChange = (index: number, field: string, value: any) => {
    dismissReview('education');
    const updated = [...resumeData.education];
    updated[index] = { ...updated[index], [field]: value };
    handleUpdate({ education: updated });
  };

  const handleRemoveEducation = (index: number) => {
    dismissReview('education');
    handleUpdate({ education: resumeData.education.filter((_, idx) => idx !== index) });
  };

  // Projects Handlers
  const handleAddProject = () => {
    const newProj = {
      id: `proj_${Date.now()}`,
      name: 'Strategic Capstone Project',
      context: 'Industry Case Study',
      bullets: ['Modeled financial valuation and projected 18% cost optimization using statistical tools.'],
    };
    handleUpdate({ projects: [...resumeData.projects, newProj] });
  };

  const handleProjectChange = (index: number, field: string, value: any) => {
    const updated = [...resumeData.projects];
    updated[index] = { ...updated[index], [field]: value };
    handleUpdate({ projects: updated });
  };

  const handleProjectBulletChange = (projIndex: number, bulletIndex: number, text: string) => {
    const updated = [...resumeData.projects];
    const bullets = [...updated[projIndex].bullets];
    bullets[bulletIndex] = text;
    updated[projIndex] = { ...updated[projIndex], bullets };
    handleUpdate({ projects: updated });
  };

  const handleAddProjectBullet = (projIndex: number) => {
    const updated = [...resumeData.projects];
    updated[projIndex] = {
      ...updated[projIndex],
      bullets: [...updated[projIndex].bullets, ''],
    };
    handleUpdate({ projects: updated });
  };

  const handleRemoveProjectBullet = (projIndex: number, bulletIndex: number) => {
    const updated = [...resumeData.projects];
    updated[projIndex] = {
      ...updated[projIndex],
      bullets: updated[projIndex].bullets.filter((_, idx) => idx !== bulletIndex),
    };
    handleUpdate({ projects: updated });
  };

  const handleRemoveProject = (index: number) => {
    handleUpdate({ projects: resumeData.projects.filter((_, idx) => idx !== index) });
  };

  // Skills Handlers
  const handleAddSkillTag = (categoryIndex: number, tagText: string) => {
    dismissReview('skills');
    if (!tagText.trim()) return;
    const updated = [...resumeData.skills];
    if (!updated[categoryIndex].items.includes(tagText.trim())) {
      updated[categoryIndex] = {
        ...updated[categoryIndex],
        items: [...updated[categoryIndex].items, tagText.trim()],
      };
      handleUpdate({ skills: updated });
    }
  };

  const handleRemoveSkillTag = (categoryIndex: number, tagIndex: number) => {
    dismissReview('skills');
    const updated = [...resumeData.skills];
    updated[categoryIndex] = {
      ...updated[categoryIndex],
      items: updated[categoryIndex].items.filter((_, idx) => idx !== tagIndex),
    };
    handleUpdate({ skills: updated });
  };

  const handleAddSkillCategory = () => {
    dismissReview('skills');
    const newCat = {
      category: 'Specialized Expertise',
      items: ['Strategic Planning', 'Data Analytics'],
    };
    handleUpdate({ skills: [...resumeData.skills, newCat] });
  };

  const handleRemoveSkillCategory = (index: number) => {
    handleUpdate({ skills: resumeData.skills.filter((_, idx) => idx !== index) });
  };

  // Certifications Handlers
  const handleAddCertification = () => {
    handleUpdate({ certifications: [...resumeData.certifications, ''] });
  };

  const handleCertChange = (index: number, text: string) => {
    const updated = [...resumeData.certifications];
    updated[index] = text;
    handleUpdate({ certifications: updated });
  };

  const handleRemoveCert = (index: number) => {
    handleUpdate({ certifications: (resumeData.certifications || []).filter((_, idx) => idx !== index) });
  };

  // Custom Section Handlers
  const handleAddCustomSection = () => {
    const newCs: CustomSection = {
      id: `cs_${Date.now()}`,
      title: 'Additional Highlights',
      kind: 'bullets',
      bullets: ['Key achievement or highlight...'],
    };
    const updatedCustom = [...(resumeData.customSections || []), newCs];
    const updatedOrder = [...effectiveSectionOrder, newCs.id];
    handleUpdate({ customSections: updatedCustom, sectionOrder: updatedOrder });
  };

  const handleRemoveCustomSection = (id: string) => {
    const updatedCustom = (resumeData.customSections || []).filter((cs) => cs.id !== id);
    const updatedOrder = effectiveSectionOrder.filter((sId) => sId !== id);
    handleUpdate({ customSections: updatedCustom, sectionOrder: updatedOrder });
  };

  const handleUpdateCustomSection = (id: string, updates: Partial<CustomSection>) => {
    const updatedCustom = (resumeData.customSections || []).map((cs) => {
      if (cs.id === id) {
        return { ...cs, ...updates };
      }
      return cs;
    });
    handleUpdate({ customSections: updatedCustom });
  };

  // Export & Copy
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await downloadResumePdf(resumeData);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyAtsText = () => {
    const plain = generateAtsPlainText(resumeData);
    navigator.clipboard?.writeText(plain);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2200);
  };

  // Apply Power Verb to Bullet
  const applyPowerVerb = (verb: string) => {
    if (!activeBulletTarget) return;
    const { type, itemIndex, bulletIndex } = activeBulletTarget;
    if (type === 'exp') {
      const current = resumeData.experience[itemIndex]?.bullets[bulletIndex] || '';
      const words = current.trim().split(/\s+/);
      const rest = words.length > 1 ? words.slice(1).join(' ') : '';
      const newText = rest ? `${verb} ${rest}` : `${verb} `;
      handleBulletChange(itemIndex, bulletIndex, newText);
    } else {
      const current = resumeData.projects[itemIndex]?.bullets[bulletIndex] || '';
      const words = current.trim().split(/\s+/);
      const rest = words.length > 1 ? words.slice(1).join(' ') : '';
      const newText = rest ? `${verb} ${rest}` : `${verb} `;
      handleProjectBulletChange(itemIndex, bulletIndex, newText);
    }
    setActiveModal('none');
  };

  // Apply XYZ Template to Bullet
  const applyXyzFormula = () => {
    if (!activeBulletTarget) return;
    const { type, itemIndex, bulletIndex } = activeBulletTarget;

    let constructed = '';
    if (selectedXyzTemplate === 'xyz_growth') {
      constructed = `Accelerated ${xyzX || '[Business Goal]'} by ${xyzY || '[Metric/Growth%]'}, through ${xyzZ || '[Strategic Implementation]'}.`;
    } else if (selectedXyzTemplate === 'xyz_efficiency') {
      constructed = `Reduced ${xyzX || '[Cost/Latency]'} by ${xyzY || '[% Saved]'}, by deploying ${xyzZ || '[Process Automation]'}.`;
    } else if (selectedXyzTemplate === 'xyz_scale') {
      constructed = `Orchestrated ${xyzX || '[Team/Pod]'} to deliver ${xyzY || '[Key Milestone]'}, achieving ${xyzZ || '[Impact Outcome]'}.`;
    } else {
      constructed = `Boosted ${xyzX || '[User Metric]'} by ${xyzY || '[Conversion%]'}, by diagnosing root cause and deploying ${xyzZ || '[Key Solution]'}.`;
    }

    if (type === 'exp') {
      handleBulletChange(itemIndex, bulletIndex, constructed);
    } else {
      handleProjectBulletChange(itemIndex, bulletIndex, constructed);
    }
    setActiveModal('none');
    setXyzX('');
    setXyzY('');
    setXyzZ('');
  };

  // Font styling dynamic classes
  const fontCssClass =
    fontFamily === 'serif'
      ? 'font-serif'
      : fontFamily === 'slab'
      ? 'font-serif tracking-tight'
      : fontFamily === 'clean'
      ? 'font-sans tracking-wide'
      : fontFamily === 'modern'
      ? 'font-sans'
      : 'font-sans';

  // Font size multiplier
  const sizeClasses = {
    sm: {
      body: 'text-[10px] leading-relaxed',
      heading: 'text-xs',
      title: 'text-xl',
      sub: 'text-[11px]',
      gap: 'space-y-2.5',
      bulletGap: 'space-y-0.5',
    },
    base: {
      body: 'text-[11px] leading-relaxed',
      heading: 'text-xs',
      title: 'text-2xl',
      sub: 'text-xs',
      gap: 'space-y-3.5',
      bulletGap: 'space-y-1',
    },
    lg: {
      body: 'text-xs leading-relaxed',
      heading: 'text-sm',
      title: 'text-3xl',
      sub: 'text-xs',
      gap: 'space-y-4',
      bulletGap: 'space-y-1.5',
    },
  }[fontSize];

  const renderTemplateCertifications = (headingClass: string) => {
    if (sectionVisibility.certifications === false || !resumeData.certifications || resumeData.certifications.length === 0) {
      return null;
    }
    return (
      <div className="space-y-1">
        <h2 className={headingClass}>Certifications & Honors</h2>
        <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
          {resumeData.certifications.map((c, cIdx) => (
            <li key={cIdx}>{c}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderTemplateCustomSection = (cs: CustomSection, headingClass: string) => {
    if (sectionVisibility[cs.id] === false) return null;
    return (
      <div key={cs.id} className="space-y-1">
        <h2 className={headingClass}>{cs.title}</h2>
        {(cs.kind === 'bullets' || (!cs.kind && cs.bullets)) && cs.bullets && (
          <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
            {cs.bullets.map((b, bIdx) => (
              <li key={bIdx}>{b}</li>
            ))}
          </ul>
        )}
        {cs.kind === 'tags' && cs.tags && (
          <div className="text-slate-800 font-medium">
            {cs.tags.join(' · ')}
          </div>
        )}
        {cs.kind === 'paragraph' && cs.paragraph && (
          <p className="text-slate-800 leading-relaxed text-justify">{cs.paragraph}</p>
        )}
        {cs.kind === 'keyvalue' && cs.keyValues && (
          <div className="space-y-0.5 text-slate-800">
            {cs.keyValues.map((kv, kvIdx) => (
              <div key={kvIdx}>
                <span className="font-bold text-slate-900">{kv.label}: </span>
                <span>{kv.value}</span>
              </div>
            ))}
          </div>
        )}
        {cs.kind === 'entries' && cs.entries && (
          <div className="space-y-1.5">
            {cs.entries.map((entry, eIdx) => (
              <div key={eIdx} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{entry.title} {entry.subtitle ? `— ${entry.subtitle}` : ''}</span>
                  {entry.startDate && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {entry.startDate} {entry.endDate ? `– ${entry.endDate}` : ''}
                    </span>
                  )}
                </div>
                {entry.bullets && entry.bullets.length > 0 && (
                  <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                    {entry.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* TOP STUDIO TOOLBAR & BRAND STRIP                                         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/95 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Left: Brand & Mobile Tab Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00DF89] animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                <span>Resume Studio</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono">
                  100% Free · ATS Safe
                </span>
              </h1>
            </div>

            {/* Mobile Tab Toggle */}
            <div className="flex md:hidden bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs ml-auto">
              <button
                onClick={() => setMobileTab('left')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  mobileTab === 'left' ? 'bg-[#00DF89] text-slate-950' : 'text-slate-400'
                }`}
              >
                Controls
              </button>
              <button
                onClick={() => setMobileTab('preview')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  mobileTab === 'preview' ? 'bg-[#00DF89] text-slate-950' : 'text-slate-400'
                }`}
              >
                Sheet (A4)
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
            {/* Reset Sample Button */}
            <button
              onClick={() => {
                handleUpdate(SAMPLE_MBA_RESUME);
                setActionNotice('Reset to standard sample MBA profile.');
                setTimeout(() => setActionNotice(null), 3000);
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              title="Load standard sample data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample</span>
            </button>

            {/* Red Clear All Fields Button */}
            <button
              onClick={handleClearAllFields}
              className="px-3 py-1.5 bg-red-600/90 hover:bg-red-500 text-white border border-red-500/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-red-950/50 cursor-pointer"
              title="Completely erase all resume fields from website"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Fields</span>
            </button>

            {/* Copy Plain Text */}
            <button
              onClick={handleCopyAtsText}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copySuccess ? 'Copied .txt' : 'Copy ATS .txt'}</span>
            </button>

            {/* Download PDF */}
            {!user && (
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="px-3.5 py-1.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>Download PDF</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="bg-[#00DF89]/10 border-b border-[#00DF89]/30 text-[#00DF89] text-xs font-bold px-4 py-2 text-center animate-fade-in flex items-center justify-center gap-2 z-20">
          <span>✨ {actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white ml-2 font-mono cursor-pointer">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN DUAL-PANE VIEWPORT                                                   */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: TEMPLATE GALLERY & RESUME CONTENT EDITOR                   */}
        {/* ======================================================================= */}
        <section
          className={`lg:col-span-6 space-y-4 ${
            mobileTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Tab Switcher: Templates vs Edit Content vs ATS Audit */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setLeftTab('templates')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                leftTab === 'templates'
                  ? 'bg-[#00DF89] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Choose Template (6)</span>
            </button>
            <button
              onClick={() => setLeftTab('content')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                leftTab === 'content'
                  ? 'bg-[#00DF89] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Edit Content & Bullets</span>
            </button>
            <button
              onClick={() => setLeftTab('ats')}
              className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                leftTab === 'ats'
                  ? 'bg-[#00DF89] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>ATS Audit ({atsScore}%)</span>
            </button>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* VIEW A: TEMPLATES GALLERY (MATCHING UPREZR SCREENSHOT)                 */}
          {/* --------------------------------------------------------------------- */}
          {leftTab === 'templates' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Click a template to apply it — preview updates instantly
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  All 6 templates are 100% ATS-safe with single-column structural compliance.
                </p>
              </div>

              {/* 2-Column Grid of Template Cards (Exact upRezr visual cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {RESUME_TEMPLATES.map((tmpl) => {
                  const isSelected = activeTemplate === tmpl.id;

                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleUpdate({ activeTemplate: tmpl.id })}
                      className={`relative bg-[#0E1526] rounded-2xl border-2 p-3 transition-all cursor-pointer hover:border-slate-500 shadow-md flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : 'border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        {tmpl.badge ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tmpl.id === 'clean' ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'
                          }`}>
                            {tmpl.badge}
                          </span>
                        ) : (
                          <div />
                        )}

                        {/* Blue checkmark indicator when selected */}
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      {/* Mini Realistic Resume Thumbnail Preview */}
                      <div className="w-full bg-white text-slate-900 rounded-lg p-3 shadow-inner text-[6px] space-y-1.5 pointer-events-none select-none h-48 overflow-hidden border border-slate-200">
                        {/* Clean Template Thumbnail */}
                        {tmpl.id === 'clean' && (
                          <div className="space-y-1">
                            <div className="font-bold text-[8px] text-slate-900">Priya Sharma</div>
                            <div className="text-[5px] text-slate-500">Senior Software Engineer | Bengaluru, Karnataka</div>
                            <div className="h-0.5 w-full bg-blue-500 my-0.5" />
                            <div className="font-bold text-[6px] text-slate-800 uppercase tracking-wider">Professional Summary</div>
                            <div className="h-1 bg-slate-200 rounded w-full" />
                            <div className="font-bold text-[6px] text-slate-800 uppercase tracking-wider pt-0.5">Work Experience</div>
                            <div className="flex justify-between font-bold text-[5.5px]"><span>Senior Software Engineer — Flipkart</span><span>2021–Present</span></div>
                            <div className="h-0.5 bg-slate-200 rounded w-11/12" />
                            <div className="h-0.5 bg-slate-200 rounded w-10/12" />
                            <div className="font-bold text-[6px] text-slate-800 uppercase tracking-wider pt-0.5">Education</div>
                            <div className="flex justify-between text-[5.5px]"><span>IIT Delhi — B.Tech Computer Science</span><span>2015–2019</span></div>
                            <div className="font-bold text-[6px] text-slate-800 uppercase tracking-wider pt-0.5">Skills</div>
                            <div className="text-[5px] text-slate-600">React · TypeScript · Python · PostgreSQL · AWS</div>
                          </div>
                        )}

                        {/* Minimal Template Thumbnail */}
                        {tmpl.id === 'minimal' && (
                          <div className="space-y-1 text-center">
                            <div className="font-bold text-[8px] text-slate-900">Priya Sharma</div>
                            <div className="text-[5px] text-slate-500">priya@example.com | +91 98765 43210 | Bengaluru</div>
                            <div className="h-px w-3/4 mx-auto bg-slate-300 my-0.5" />
                            <div className="text-left font-bold text-[6px] text-slate-800 uppercase tracking-wider">Experience</div>
                            <div className="text-left text-[5.5px] font-semibold">Flipkart — Senior Software Engineer</div>
                            <div className="h-0.5 bg-slate-200 rounded w-full" />
                            <div className="h-0.5 bg-slate-200 rounded w-4/5" />
                            <div className="text-left font-bold text-[6px] text-slate-800 uppercase tracking-wider pt-0.5">Education</div>
                            <div className="text-left text-[5.5px]">IIT Delhi · B.Tech</div>
                            <div className="text-left font-bold text-[6px] text-slate-800 uppercase tracking-wider pt-0.5">Skills</div>
                            <div className="text-left text-[5px] text-slate-600">System Design • Distributed Systems • Python</div>
                          </div>
                        )}

                        {/* Modern Template Thumbnail */}
                        {tmpl.id === 'modern' && (
                          <div className="space-y-1 border-l-2 border-emerald-500 pl-1.5">
                            <div className="font-bold text-[8px] text-slate-900">Priya Sharma</div>
                            <div className="text-[5px] text-emerald-600 font-semibold">Senior Software Engineer</div>
                            <div className="font-bold text-[6px] text-emerald-700 uppercase tracking-wider pt-0.5">Experience</div>
                            <div className="h-0.5 bg-slate-200 rounded w-full" />
                            <div className="h-0.5 bg-slate-200 rounded w-3/4" />
                            <div className="font-bold text-[6px] text-emerald-700 uppercase tracking-wider pt-0.5">Education</div>
                            <div className="text-[5px]">IIT Delhi — 8.9 CGPA</div>
                            <div className="font-bold text-[6px] text-emerald-700 uppercase tracking-wider pt-0.5">Core Competencies</div>
                            <div className="text-[5px] text-slate-600">TypeScript · GraphQL · Cloud Architecture</div>
                          </div>
                        )}

                        {/* Fresher Template Thumbnail */}
                        {tmpl.id === 'fresher' && (
                          <div className="space-y-1">
                            <div className="font-bold text-[8px] text-slate-900">Priya Sharma</div>
                            <div className="text-[5px] text-orange-600 font-semibold">Computer Science Graduate | Aspiring PM</div>
                            <div className="h-0.5 w-full bg-orange-500 my-0.5" />
                            <div className="font-bold text-[6px] text-orange-700 uppercase tracking-wider">Education (Top Priority)</div>
                            <div className="flex justify-between text-[5.5px] font-bold"><span>IIT Delhi — B.Tech CSE</span><span className="text-emerald-700 bg-emerald-50 px-1 rounded">CGPA 8.94/10</span></div>
                            <div className="font-bold text-[6px] text-orange-700 uppercase tracking-wider pt-0.5">Projects & Capstones</div>
                            <div className="flex gap-1">
                              <span className="bg-orange-50 text-orange-800 px-1 rounded text-[4.5px]">Python</span>
                              <span className="bg-orange-50 text-orange-800 px-1 rounded text-[4.5px]">Docker</span>
                              <span className="bg-orange-50 text-orange-800 px-1 rounded text-[4.5px]">Redis</span>
                            </div>
                            <div className="h-0.5 bg-slate-200 rounded w-full" />
                            <div className="font-bold text-[6px] text-orange-700 uppercase tracking-wider pt-0.5">Internship Experience</div>
                            <div className="text-[5px]">Razorpay — Software Engineering Intern</div>
                          </div>
                        )}

                        {/* Executive Template Thumbnail */}
                        {tmpl.id === 'executive' && (
                          <div className="space-y-1 -m-3 p-3">
                            <div className="bg-slate-900 text-white p-2 rounded-t -mx-3 -mt-3 mb-1">
                              <div className="font-bold text-[8px]">Priya Sharma</div>
                              <div className="text-[5px] text-blue-300">VP of Engineering / Product Strategy</div>
                            </div>
                            <div className="font-bold text-[6px] text-slate-900 uppercase tracking-wider">Leadership Tenure</div>
                            <div className="h-0.5 bg-slate-200 rounded w-full" />
                            <div className="h-0.5 bg-slate-200 rounded w-4/5" />
                            <div className="font-bold text-[6px] text-slate-900 uppercase tracking-wider pt-0.5">Core Executive Board Impact</div>
                            <div className="h-0.5 bg-slate-200 rounded w-11/12" />
                            <div className="font-bold text-[6px] text-slate-900 uppercase tracking-wider pt-0.5">Education</div>
                            <div className="text-[5px]">IIM Bengaluru · Executive MBA</div>
                          </div>
                        )}

                        {/* Academic Template Thumbnail */}
                        {tmpl.id === 'academic' && (
                          <div className="space-y-1">
                            <div className="text-center font-serif font-bold text-[8px] text-slate-900">Priya Sharma</div>
                            <div className="text-center text-[5px] text-slate-600">Placement Committee Standard CV</div>
                            <div className="border border-slate-300 p-1 text-[5px] space-y-0.5 bg-slate-50">
                              <div className="flex justify-between font-bold border-b border-slate-200 pb-0.5"><span>Qualification</span><span>Institute</span><span>Year</span><span>Score</span></div>
                              <div className="flex justify-between"><span>MBA</span><span>IIM</span><span>2027</span><span>3.84</span></div>
                              <div className="flex justify-between"><span>B.Tech</span><span>IIT</span><span>2023</span><span>8.94</span></div>
                            </div>
                            <div className="font-bold text-[6px] text-slate-900 uppercase tracking-wider pt-0.5">Professional Experience</div>
                            <div className="h-0.5 bg-slate-200 rounded w-full" />
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Name & ATS Score */}
                      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800">
                        <span className="font-extrabold text-white text-xs">{tmpl.name}</span>
                        <span className="font-bold text-emerald-400 font-mono text-xs">{tmpl.atsSafetyScore}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* VIEW B: CONTENT EDITOR & BULLETS                                      */}
          {/* --------------------------------------------------------------------- */}
          {leftTab === 'content' && (
            <div className="space-y-4 text-xs">
              {/* Section 1: Contact Coordinates */}
              <div className="bg-[#0E1526] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleSection('contact')}
                  className="w-full px-4 py-3 bg-slate-900/60 flex items-center justify-between text-xs font-bold text-white hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Personal & Contact Coordinates</span>
                  </span>
                  <span className="text-slate-400">{openSections.contact ? '▲' : '▼'}</span>
                </button>

                {openSections.contact && (
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        value={resumeData.fullName}
                        onChange={(e) => handleFieldChange('fullName', e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Professional Target Headline</label>
                      <input
                        type="text"
                        value={resumeData.headline}
                        onChange={(e) => handleFieldChange('headline', e.target.value)}
                        placeholder="e.g. MBA Candidate | Product Management & Corporate Strategy"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                        <input
                          type="email"
                          value={resumeData.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder="name@alumni.iim.ac.in"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={resumeData.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          placeholder="+91 98201 45678"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Location (City, Country)</label>
                        <input
                          type="text"
                          value={resumeData.location}
                          onChange={(e) => handleFieldChange('location', e.target.value)}
                          placeholder="Bengaluru, India"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">LinkedIn Profile URL</label>
                        <input
                          type="text"
                          value={resumeData.linkedinUrl}
                          onChange={(e) => handleFieldChange('linkedinUrl', e.target.value)}
                          placeholder="https://linkedin.com/in/..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DYNAMIC REORDERABLE SECTIONS */}
              {effectiveSectionOrder.map((sectionKey, sIdx) => {
                const isVisible = sectionVisibility[sectionKey] !== false;

                // SECTION: SUMMARY
                if (sectionKey === 'summary') {
                  return (
                    <div key={sectionKey} className="bg-[#0E1526] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="w-full px-4 py-3 bg-slate-900/60 flex items-center justify-between text-xs font-bold text-white">
                        <button
                          onClick={() => toggleSection('summary')}
                          className="flex items-center gap-2 text-left hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <span>Executive Summary</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleVisibility('summary', e)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${isVisible ? 'text-emerald-400' : 'text-slate-500'}`}
                            title={isVisible ? 'Visible in sheet' : 'Hidden from sheet'}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'up', e)}
                            disabled={sIdx === 0}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'down', e)}
                            disabled={sIdx === effectiveSectionOrder.length - 1}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {openSections.summary && isVisible && (
                        <div className="p-4 space-y-2">
                          <textarea
                            rows={3}
                            value={resumeData.summary}
                            onChange={(e) => handleFieldChange('summary', e.target.value)}
                            placeholder="2–3 sentences highlighting pre-MBA tenure, domain focus, and post-MBA career aspirations..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00DF89] leading-relaxed"
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                // SECTION: EXPERIENCE
                if (sectionKey === 'experience') {
                  return (
                    <div key={sectionKey} className="bg-[#0E1526] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="w-full px-4 py-3 bg-slate-900/60 flex items-center justify-between text-xs font-bold text-white">
                        <button
                          onClick={() => toggleSection('experience')}
                          className="flex items-center gap-2 text-left hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Briefcase className="w-4 h-4 text-emerald-400" />
                          <span>Work Experience ({resumeData.experience.length})</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleVisibility('experience', e)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${isVisible ? 'text-emerald-400' : 'text-slate-500'}`}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'up', e)}
                            disabled={sIdx === 0}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'down', e)}
                            disabled={sIdx === effectiveSectionOrder.length - 1}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {openSections.experience && isVisible && (
                        <div className="p-4 space-y-4">
                          {resumeData.experience.map((exp, eIdx) => (
                            <div key={exp.id || eIdx} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs">Experience #{eIdx + 1}</span>
                                <button
                                  onClick={() => handleRemoveExperience(eIdx)}
                                  className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] text-slate-400">Designation / Role</label>
                                  <input
                                    type="text"
                                    value={exp.role}
                                    onChange={(e) => handleExperienceChange(eIdx, 'role', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-[#00DF89]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-slate-400">Company Name</label>
                                  <input
                                    type="text"
                                    value={exp.company}
                                    onChange={(e) => handleExperienceChange(eIdx, 'company', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-[#00DF89]"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[11px] text-slate-400">Start Date</label>
                                  <input
                                    type="text"
                                    value={exp.startDate}
                                    onChange={(e) => handleExperienceChange(eIdx, 'startDate', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-slate-400">End Date</label>
                                  <input
                                    type="text"
                                    value={exp.endDate}
                                    onChange={(e) => handleExperienceChange(eIdx, 'endDate', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-slate-400">Location</label>
                                  <input
                                    type="text"
                                    value={exp.location}
                                    onChange={(e) => handleExperienceChange(eIdx, 'location', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                  />
                                </div>
                              </div>

                              {/* Bullets with XYZ & Power Verb Tools */}
                              <div className="space-y-2 pt-2 border-t border-slate-800">
                                {exp.bullets.map((bullet, bIdx) => {
                                  const quantified = hasMetric(bullet);
                                  const hasActionVerb = startsWithActionVerb(bullet);

                                  return (
                                    <div key={bIdx} className="space-y-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                                      <div className="flex items-start gap-2">
                                        <textarea
                                          rows={2}
                                          value={bullet}
                                          onChange={(e) => handleBulletChange(eIdx, bIdx, e.target.value)}
                                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-[#00DF89] leading-relaxed"
                                        />
                                        <button
                                          onClick={() => handleRemoveBullet(eIdx, bIdx)}
                                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer shrink-0"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                              quantified
                                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                                : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                                            }`}
                                          >
                                            {quantified ? '✓ Quantified' : '⚠ Add Metric'}
                                          </span>
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                              hasActionVerb
                                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                                : 'bg-slate-800 text-slate-400'
                                            }`}
                                          >
                                            {hasActionVerb ? '✓ Power Verb' : 'Weak Verb'}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => {
                                              setActiveBulletTarget({ type: 'exp', itemIndex: eIdx, bulletIndex: bIdx });
                                              setActiveModal('verbs');
                                            }}
                                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                                          >
                                            <Zap className="w-3 h-3 text-amber-400" />
                                            <span>Power Verbs</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              setActiveBulletTarget({ type: 'exp', itemIndex: eIdx, bulletIndex: bIdx });
                                              setActiveModal('xyz');
                                            }}
                                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[#00DF89] text-[10px] font-bold cursor-pointer flex items-center gap-1"
                                          >
                                            <Sparkles className="w-3 h-3" />
                                            <span>Google XYZ</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}

                                <button
                                  onClick={() => handleAddBullet(eIdx)}
                                  className="text-xs font-bold text-[#00DF89] hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Bullet Point</span>
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={handleAddExperience}
                            className="w-full py-2 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 text-slate-300 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>Add Work Experience</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                // SECTION: EDUCATION
                if (sectionKey === 'education') {
                  return (
                    <div key={sectionKey} className="bg-[#0E1526] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="w-full px-4 py-3 bg-slate-900/60 flex items-center justify-between text-xs font-bold text-white">
                        <button
                          onClick={() => toggleSection('education')}
                          className="flex items-center gap-2 text-left hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <GraduationCap className="w-4 h-4 text-emerald-400" />
                          <span>Education ({resumeData.education.length})</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleVisibility('education', e)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${isVisible ? 'text-emerald-400' : 'text-slate-500'}`}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'up', e)}
                            disabled={sIdx === 0}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'down', e)}
                            disabled={sIdx === effectiveSectionOrder.length - 1}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {openSections.education && isVisible && (
                        <div className="p-4 space-y-4">
                          {resumeData.education.map((edu, eduIdx) => (
                            <div key={edu.id || eduIdx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white text-xs">Degree #{eduIdx + 1}</span>
                                <button
                                  onClick={() => handleRemoveEducation(eduIdx)}
                                  className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] text-slate-400">Institution / University</label>
                                  <input
                                    type="text"
                                    value={edu.institution}
                                    onChange={(e) => handleEducationChange(eduIdx, 'institution', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-slate-400">Degree & Discipline</label>
                                  <input
                                    type="text"
                                    value={edu.degree}
                                    onChange={(e) => handleEducationChange(eduIdx, 'degree', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[11px] text-slate-400">Field</label>
                                  <input
                                    type="text"
                                    value={edu.field}
                                    onChange={(e) => handleEducationChange(eduIdx, 'field', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-slate-400">Dates</label>
                                  <input
                                    type="text"
                                    value={`${edu.startDate} - ${edu.endDate}`}
                                    onChange={(e) => {
                                      const parts = e.target.value.split('-');
                                      handleEducationChange(eduIdx, 'startDate', parts[0]?.trim() || '');
                                      handleEducationChange(eduIdx, 'endDate', parts[1]?.trim() || '');
                                    }}
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-slate-400">GPA / Score</label>
                                  <input
                                    type="text"
                                    value={edu.gpaOrScore || ''}
                                    onChange={(e) => handleEducationChange(eduIdx, 'gpaOrScore', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={handleAddEducation}
                            className="w-full py-2 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 text-slate-300 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Add Education</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                // SECTION: PROJECTS
                if (sectionKey === 'projects') {
                  return (
                    <div key={sectionKey} className="bg-[#0E1526] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="w-full px-4 py-3 bg-slate-900/60 flex items-center justify-between text-xs font-bold text-white">
                        <button
                          onClick={() => toggleSection('projects')}
                          className="flex items-center gap-2 text-left hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <FolderGit2 className="w-4 h-4 text-emerald-400" />
                          <span>Projects & Capstones ({resumeData.projects.length})</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleVisibility('projects', e)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${isVisible ? 'text-emerald-400' : 'text-slate-500'}`}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'up', e)}
                            disabled={sIdx === 0}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'down', e)}
                            disabled={sIdx === effectiveSectionOrder.length - 1}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {openSections.projects && isVisible && (
                        <div className="p-4 space-y-4">
                          {resumeData.projects.map((proj, pIdx) => (
                            <div key={proj.id || pIdx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white text-xs">Project #{pIdx + 1}</span>
                                <button
                                  onClick={() => handleRemoveProject(pIdx)}
                                  className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] text-slate-400">Project Name</label>
                                  <input
                                    type="text"
                                    value={proj.name}
                                    onChange={(e) => handleProjectChange(pIdx, 'name', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-slate-400">Tech Stack / Context</label>
                                  <input
                                    type="text"
                                    value={proj.context}
                                    onChange={(e) => handleProjectChange(pIdx, 'context', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5 pt-1">
                                {proj.bullets.map((b, pbIdx) => (
                                  <div key={pbIdx} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={b}
                                      onChange={(e) => handleProjectBulletChange(pIdx, pbIdx, e.target.value)}
                                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                                    />
                                    <button
                                      onClick={() => handleRemoveProjectBullet(pIdx, pbIdx)}
                                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => handleAddProjectBullet(pIdx)}
                                  className="text-xs font-bold text-[#00DF89] hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Project Bullet</span>
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={handleAddProject}
                            className="w-full py-2 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 text-slate-300 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Add Project / Capstone</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                // SECTION: SKILLS
                if (sectionKey === 'skills') {
                  return (
                    <div key={sectionKey} className="bg-[#0E1526] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="w-full px-4 py-3 bg-slate-900/60 flex items-center justify-between text-xs font-bold text-white">
                        <button
                          onClick={() => toggleSection('skills')}
                          className="flex items-center gap-2 text-left hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Wrench className="w-4 h-4 text-emerald-400" />
                          <span>Skills & Core Competencies</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleVisibility('skills', e)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${isVisible ? 'text-emerald-400' : 'text-slate-500'}`}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'up', e)}
                            disabled={sIdx === 0}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'down', e)}
                            disabled={sIdx === effectiveSectionOrder.length - 1}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {openSections.skills && isVisible && (
                        <div className="p-4 space-y-4">
                          {resumeData.skills.map((cat, cIdx) => (
                            <div key={cIdx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <input
                                  type="text"
                                  value={cat.category}
                                  onChange={(e) => {
                                    const updated = [...resumeData.skills];
                                    updated[cIdx].category = e.target.value;
                                    handleUpdate({ skills: updated });
                                  }}
                                  className="font-bold text-white bg-transparent border-b border-transparent focus:border-emerald-400 outline-none text-xs"
                                />
                                <button
                                  onClick={() => handleRemoveSkillCategory(cIdx)}
                                  className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {cat.items.map((item, iIdx) => (
                                  <span
                                    key={iIdx}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
                                  >
                                    <span>{item}</span>
                                    <button
                                      onClick={() => handleRemoveSkillTag(cIdx, iIdx)}
                                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>

                              <input
                                type="text"
                                placeholder="+ Add skill tag (Press Enter)..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSkillTag(cIdx, (e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:border-[#00DF89] outline-none"
                              />
                            </div>
                          ))}

                          <button
                            onClick={handleAddSkillCategory}
                            className="w-full py-2 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 text-slate-300 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Add Skill Category</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                // SECTION: CERTIFICATIONS
                if (sectionKey === 'certifications') {
                  const certs = resumeData.certifications || [];
                  return (
                    <div key={sectionKey} className="bg-[#0E1526] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="w-full px-4 py-3 bg-slate-900/60 flex items-center justify-between text-xs font-bold text-white">
                        <button
                          onClick={() => toggleSection('certifications')}
                          className="flex items-center gap-2 text-left hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-emerald-400" />
                          <span>Certifications & Honors ({certs.length})</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleVisibility('certifications', e)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${isVisible ? 'text-emerald-400' : 'text-slate-500'}`}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'up', e)}
                            disabled={sIdx === 0}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'down', e)}
                            disabled={sIdx === effectiveSectionOrder.length - 1}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {(openSections.certifications ?? true) && isVisible && (
                        <div className="p-4 space-y-3">
                          {certs.map((cert, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={cert}
                                onChange={(e) => handleCertChange(cIdx, e.target.value)}
                                placeholder="e.g. AWS Certified Solutions Architect or Certified Scrum Master"
                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-[#00DF89]"
                              />
                              <button
                                onClick={() => handleRemoveCert(cIdx)}
                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          <button
                            onClick={handleAddCertification}
                            className="w-full py-2 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 text-slate-300 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Add Certification / Honor</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                // SECTION: CUSTOM SECTION
                const customSec = (resumeData.customSections || []).find((cs) => cs.id === sectionKey);
                if (customSec) {
                  const cs = customSec;
                  return (
                    <div key={cs.id} className="bg-[#0E1526] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="w-full px-4 py-3 bg-slate-900/60 flex items-center justify-between text-xs font-bold text-white">
                        <button
                          onClick={() => toggleSection(cs.id)}
                          className="flex items-center gap-2 text-left hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Zap className="w-4 h-4 text-emerald-400" />
                          <span>{cs.title} ({(cs.bullets?.length || cs.tags?.length || cs.keyValues?.length || cs.entries?.length || 1)})</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleVisibility(cs.id, e)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${isVisible ? 'text-emerald-400' : 'text-slate-500'}`}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'up', e)}
                            disabled={sIdx === 0}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => moveSection(sIdx, 'down', e)}
                            disabled={sIdx === effectiveSectionOrder.length - 1}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveCustomSection(cs.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Delete Section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {(openSections[cs.id] ?? true) && isVisible && (
                        <div className="p-4 space-y-3">
                          <div>
                            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Section Title</label>
                            <input
                              type="text"
                              value={cs.title}
                              onChange={(e) => handleUpdateCustomSection(cs.id, { title: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-xs focus:border-[#00DF89]"
                            />
                          </div>

                          {(cs.kind === 'bullets' || (!cs.kind && cs.bullets)) && (
                            <div className="space-y-2">
                              <label className="text-[11px] text-slate-400 font-semibold block">Bullet Points</label>
                              {(cs.bullets || []).map((bullet, bIdx) => (
                                <div key={bIdx} className="flex items-center gap-2">
                                  <textarea
                                    rows={2}
                                    value={bullet}
                                    onChange={(e) => {
                                      const updated = [...(cs.bullets || [])];
                                      updated[bIdx] = e.target.value;
                                      handleUpdateCustomSection(cs.id, { bullets: updated });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-[#00DF89]"
                                  />
                                  <button
                                    onClick={() => {
                                      const updated = (cs.bullets || []).filter((_, idx) => idx !== bIdx);
                                      handleUpdateCustomSection(cs.id, { bullets: updated });
                                    }}
                                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  handleUpdateCustomSection(cs.id, { bullets: [...(cs.bullets || []), ''] });
                                }}
                                className="text-xs font-bold text-[#00DF89] hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Bullet Point</span>
                              </button>
                            </div>
                          )}

                          {cs.kind === 'tags' && (
                            <div className="space-y-2">
                              <label className="text-[11px] text-slate-400 font-semibold block">Items / Tags</label>
                              <div className="flex flex-wrap gap-1.5">
                                {(cs.tags || []).map((tag, tIdx) => (
                                  <span key={tIdx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs flex items-center gap-1.5">
                                    <span>{tag}</span>
                                    <button
                                      onClick={() => {
                                        const updated = (cs.tags || []).filter((_, idx) => idx !== tIdx);
                                        handleUpdateCustomSection(cs.id, { tags: updated });
                                      }}
                                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder="+ Add tag (Press Enter)..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val) {
                                      handleUpdateCustomSection(cs.id, { tags: [...(cs.tags || []), val] });
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:border-[#00DF89] outline-none"
                              />
                            </div>
                          )}

                          {cs.kind === 'paragraph' && (
                            <div>
                              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Text Content</label>
                              <textarea
                                rows={3}
                                value={cs.paragraph || ''}
                                onChange={(e) => handleUpdateCustomSection(cs.id, { paragraph: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-[#00DF89]"
                              />
                            </div>
                          )}

                          {cs.kind === 'keyvalue' && (
                            <div className="space-y-2">
                              {(cs.keyValues || []).map((kv, kvIdx) => (
                                <div key={kvIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={kv.label}
                                    placeholder="Label"
                                    onChange={(e) => {
                                      const updated = [...(cs.keyValues || [])];
                                      updated[kvIdx] = { ...updated[kvIdx], label: e.target.value };
                                      handleUpdateCustomSection(cs.id, { keyValues: updated });
                                    }}
                                    className="w-1/3 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={kv.value}
                                    placeholder="Value"
                                    onChange={(e) => {
                                      const updated = [...(cs.keyValues || [])];
                                      updated[kvIdx] = { ...updated[kvIdx], value: e.target.value };
                                      handleUpdateCustomSection(cs.id, { keyValues: updated });
                                    }}
                                    className="w-2/3 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                                  />
                                  <button
                                    onClick={() => {
                                      const updated = (cs.keyValues || []).filter((_, idx) => idx !== kvIdx);
                                      handleUpdateCustomSection(cs.id, { keyValues: updated });
                                    }}
                                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  handleUpdateCustomSection(cs.id, {
                                    keyValues: [...(cs.keyValues || []), { label: '', value: '' }],
                                  });
                                }}
                                className="text-xs font-bold text-[#00DF89] hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Key-Value Pair</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}

              <button
                onClick={handleAddCustomSection}
                className="w-full py-2.5 rounded-2xl border border-dashed border-slate-700 hover:border-emerald-500 text-slate-300 font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 bg-[#0E1526]"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Custom Section (e.g. Languages, Achievements, Honors)</span>
              </button>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* VIEW C: ATS AUDIT CHECKLIST                                           */}
          {/* --------------------------------------------------------------------- */}
          {leftTab === 'ats' && (
            <div className="bg-[#0E1526] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">ATS Compatibility Audit Breakdown</h3>
                  <p className="text-slate-400 text-[11px]">
                    {passedChecks} of {atsChecks.length} ATS Safety Checks Passed
                  </p>
                </div>
                <div className="text-2xl font-black text-[#00DF89]">{atsScore}%</div>
              </div>

              <div className="space-y-3">
                {atsChecks.map((check) => (
                  <div
                    key={check.id}
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      check.passed
                        ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-900/60 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{check.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          check.passed
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {check.passed ? '✓ PASSED' : '✕ ATTENTION'}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{check.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: REAL-TIME A4 PREVIEW SHEET (WITH UPREZR TOOLBAR)          */}
        {/* ======================================================================= */}
        <section
          className={`lg:col-span-6 sticky top-16 flex flex-col items-center space-y-2.5 ${
            mobileTab === 'left' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* UPREZR TOP CONTROLS TOOLBAR (EXACT MATCH WITH SCREENSHOT) */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2 bg-[#0B0F19] border border-slate-800 rounded-2xl text-xs shadow-sm">
            {/* Left: Preview Title & Badges */}
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-white text-sm">Preview</span>
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                <span>✓</span>
                <span>Core complete</span>
              </span>
              <button
                onClick={() => setLeftTab('content')}
                className="text-blue-400 hover:text-blue-300 text-xs font-semibold cursor-pointer"
              >
                +3 extra
              </button>
            </div>

            {/* Middle: 8 Color Swatches */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-800">
              {RESUME_ACCENT_COLORS.map((col) => {
                const isSelected = accentColor.toLowerCase() === col.hex.toLowerCase();
                return (
                  <button
                    key={col.id}
                    onClick={() => handleUpdate({ accentColor: col.hex })}
                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                      isSelected ? 'ring-2 ring-white scale-110 shadow-sm' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                );
              })}
            </div>

            {/* Right: 5 Font Family Buttons (Ag) + Font Size Buttons (A A) */}
            <div className="flex items-center gap-2">
              {/* Font Family (Ag buttons) */}
              <div className="flex items-center gap-0.5 bg-slate-900/80 p-0.5 rounded-xl border border-slate-800">
                {RESUME_FONTS.map((f) => {
                  const isSelected = fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleUpdate({ fontFamily: f.id })}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${f.cssStyle} ${
                        isSelected
                          ? 'bg-slate-800 text-white font-bold ring-1 ring-slate-600'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={f.name}
                    >
                      {f.previewLabel}
                    </button>
                  );
                })}
              </div>

              {/* Font Size Buttons (A A A) */}
              <div className="flex items-center gap-0.5 bg-slate-900/80 p-0.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => handleUpdate({ fontSize: 'sm' })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                    fontSize === 'sm' ? 'bg-slate-800 text-white font-bold ring-1 ring-slate-600' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Compact Font Size"
                >
                  A
                </button>
                <button
                  onClick={() => handleUpdate({ fontSize: 'base' })}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    fontSize === 'base' ? 'bg-slate-800 text-white font-bold ring-1 ring-slate-600' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Regular Font Size"
                >
                  A
                </button>
                <button
                  onClick={() => handleUpdate({ fontSize: 'lg' })}
                  className={`px-2 py-1 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                    fontSize === 'lg' ? 'bg-slate-800 text-white font-black ring-1 ring-slate-600' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Large Font Size"
                >
                  A
                </button>
              </div>

              {/* Zoom In/Out */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-900/80 px-1.5 py-1 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="hover:text-white cursor-pointer px-0.5"
                >
                  -
                </button>
                <span>{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                  className="hover:text-white cursor-pointer px-0.5"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Scalable Container for A4 Sheet */}
          <div className="w-full overflow-x-auto p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex justify-center shadow-inner">
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="w-full max-w-[700px]"
            >
              {/* THE RENDERED RESUME SHEET NODE FOR VECTOR PDF */}
              <div
                id="resume-sheet-preview"
                className={`w-full bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-10 min-h-[960px] text-left ${fontCssClass} ${sizeClasses.body}`}
              >
                {/* ========================================================= */}
                {/* TEMPLATE 1: CLEAN (upRezr Most Popular)                   */}
                {/* Single-column, crisp blue/accent rule, clean date format */}
                {/* ========================================================= */}
                {activeTemplate === 'clean' && (
                  <div className={sizeClasses.gap}>
                    {/* Header */}
                    <div className="space-y-1">
                      <h1 className={`font-bold tracking-tight text-slate-900 uppercase ${sizeClasses.title}`}>
                        {resumeData.fullName || ''}
                      </h1>
                      <div className={`font-semibold text-slate-600 ${sizeClasses.sub}`}>
                        {resumeData.headline || ''}
                      </div>
                      <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                        {resumeData.email && <span>{resumeData.email}</span>}
                        {resumeData.phone && <span>| {resumeData.phone}</span>}
                        {resumeData.location && <span>| {resumeData.location}</span>}
                        {resumeData.linkedinUrl && <span>| {resumeData.linkedinUrl}</span>}
                      </div>
                      <div className="h-0.5 w-full mt-2" style={{ backgroundColor: accentColor }} />
                    </div>

                    {/* Summary */}
                    {sectionVisibility.summary !== false && resumeData.summary && (
                      <div className="space-y-1">
                        <h2 className={`font-bold uppercase tracking-wider text-slate-900 ${sizeClasses.heading}`}>
                          Professional Summary
                        </h2>
                        <p className="text-slate-800 leading-relaxed text-justify">{resumeData.summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {sectionVisibility.experience !== false && resumeData.experience.length > 0 && (
                      <div className="space-y-2.5">
                        <h2 className={`font-bold uppercase tracking-wider text-slate-900 ${sizeClasses.heading}`}>
                          Work Experience
                        </h2>
                        {resumeData.experience.map((exp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-slate-900">
                              <span>
                                {exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                              </span>
                            </div>
                            <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                              {exp.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Education */}
                    {sectionVisibility.education !== false && resumeData.education.length > 0 && (
                      <div className="space-y-1.5">
                        <h2 className={`font-bold uppercase tracking-wider text-slate-900 ${sizeClasses.heading}`}>
                          Education
                        </h2>
                        {resumeData.education.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-baseline text-slate-800">
                            <div>
                              <span className="font-bold text-slate-900">{edu.institution}</span>{edu.degree ? ` — ${edu.degree}` : ''}
                              {edu.field && <span className="text-slate-600 block text-[10px]">{edu.field}</span>}
                            </div>
                            <div className="text-[10px] font-mono text-slate-600 text-right">
                              <span>{edu.startDate} – {edu.endDate}</span>
                              {edu.gpaOrScore && <span className="block font-bold text-slate-800">{edu.gpaOrScore}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Projects */}
                    {sectionVisibility.projects !== false && resumeData.projects.length > 0 && (
                      <div className="space-y-2">
                        <h2 className={`font-bold uppercase tracking-wider text-slate-900 ${sizeClasses.heading}`}>
                          Projects & Capstones
                        </h2>
                        {resumeData.projects.map((proj, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-slate-900">
                              <span>{proj.name}</span>
                              <span className="text-[10px] text-slate-500 italic">{proj.context}</span>
                            </div>
                            <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                              {proj.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {sectionVisibility.skills !== false && resumeData.skills.length > 0 && (
                      <div className="space-y-1">
                        <h2 className={`font-bold uppercase tracking-wider text-slate-900 ${sizeClasses.heading}`}>
                          Skills
                        </h2>
                        <div className="space-y-0.5 text-slate-800">
                          {resumeData.skills.map((cat, idx) => (
                            <div key={idx}>
                              <span className="font-bold text-slate-900">{cat.category}: </span>
                              <span>{cat.items.join(' · ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {renderTemplateCertifications(`font-bold uppercase tracking-wider text-slate-900 ${sizeClasses.heading}`)}

                    {/* Custom Sections */}
                    {(resumeData.customSections || []).map((cs) =>
                      renderTemplateCustomSection(cs, `font-bold uppercase tracking-wider text-slate-900 ${sizeClasses.heading}`)
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* TEMPLATE 2: MINIMAL                                       */}
                {/* Centered header, quiet elegance, maximal scannability     */}
                {/* ========================================================= */}
                {activeTemplate === 'minimal' && (
                  <div className={sizeClasses.gap}>
                    {/* Centered Minimal Header */}
                    <div className="text-center space-y-1 pb-2">
                      <h1 className={`font-bold tracking-tight text-slate-900 uppercase ${sizeClasses.title}`}>
                        {resumeData.fullName || ''}
                      </h1>
                      <div className={`font-medium text-slate-700 ${sizeClasses.sub}`}>
                        {resumeData.headline || ''}
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-center flex-wrap gap-x-2">
                        {resumeData.email && <span>{resumeData.email}</span>}
                        {resumeData.phone && <span>• {resumeData.phone}</span>}
                        {resumeData.location && <span>• {resumeData.location}</span>}
                        {resumeData.linkedinUrl && <span>• {resumeData.linkedinUrl}</span>}
                      </div>
                      <div className="h-px w-2/3 mx-auto bg-slate-300 mt-2" />
                    </div>

                    {/* Summary */}
                    {sectionVisibility.summary !== false && resumeData.summary && (
                      <div className="space-y-1">
                        <h2 className={`font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 ${sizeClasses.heading}`}>
                          Summary
                        </h2>
                        <p className="text-slate-800 leading-relaxed text-justify">{resumeData.summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {sectionVisibility.experience !== false && resumeData.experience.length > 0 && (
                      <div className="space-y-2.5">
                        <h2 className={`font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 ${sizeClasses.heading}`}>
                          Experience
                        </h2>
                        {resumeData.experience.map((exp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-slate-900">
                              <span>{exp.company} — <span className="font-normal italic text-slate-700">{exp.role}</span></span>
                              <span className="text-[10px] font-mono text-slate-500">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                            </div>
                            <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                              {exp.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Education */}
                    {sectionVisibility.education !== false && resumeData.education.length > 0 && (
                      <div className="space-y-1.5">
                        <h2 className={`font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 ${sizeClasses.heading}`}>
                          Education
                        </h2>
                        {resumeData.education.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-baseline text-slate-800">
                            <div>
                              <span className="font-bold text-slate-900">{edu.institution}</span>{edu.degree ? `, ${edu.degree}` : ''}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {edu.startDate} – {edu.endDate} {edu.gpaOrScore ? `(${edu.gpaOrScore})` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {sectionVisibility.skills !== false && resumeData.skills.length > 0 && (
                      <div className="space-y-1">
                        <h2 className={`font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 ${sizeClasses.heading}`}>
                          Skills
                        </h2>
                        <div className="space-y-0.5 text-slate-800">
                          {resumeData.skills.map((cat, idx) => (
                            <div key={idx}>
                              <span className="font-bold">{cat.category}: </span>
                              <span>{cat.items.join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {renderTemplateCertifications(`font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 ${sizeClasses.heading}`)}

                    {/* Custom Sections */}
                    {(resumeData.customSections || []).map((cs) =>
                      renderTemplateCustomSection(cs, `font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 ${sizeClasses.heading}`)
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* TEMPLATE 3: MODERN                                        */}
                {/* Colored section headings & accent border markers          */}
                {/* ========================================================= */}
                {activeTemplate === 'modern' && (
                  <div className={sizeClasses.gap}>
                    {/* Modern Left Bar Header */}
                    <div className="border-l-4 pl-3 space-y-1" style={{ borderColor: accentColor }}>
                      <h1 className={`font-black tracking-tight text-slate-900 uppercase ${sizeClasses.title}`}>
                        {resumeData.fullName || ''}
                      </h1>
                      <div className={`font-bold ${sizeClasses.sub}`} style={{ color: accentColor }}>
                        {resumeData.headline || ''}
                      </div>
                      <div className="text-[10px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        {resumeData.email && <span>{resumeData.email}</span>}
                        {resumeData.phone && <span>· {resumeData.phone}</span>}
                        {resumeData.location && <span>· {resumeData.location}</span>}
                        {resumeData.linkedinUrl && <span>· {resumeData.linkedinUrl}</span>}
                      </div>
                    </div>

                    {/* Summary */}
                    {sectionVisibility.summary !== false && resumeData.summary && (
                      <div className="space-y-1">
                        <h2
                          className={`font-black uppercase tracking-wider pb-0.5 border-b-2 ${sizeClasses.heading}`}
                          style={{ borderColor: accentColor, color: accentColor }}
                        >
                          Professional Summary
                        </h2>
                        <p className="text-slate-800 leading-relaxed text-justify">{resumeData.summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {sectionVisibility.experience !== false && resumeData.experience.length > 0 && (
                      <div className="space-y-2.5">
                        <h2
                          className={`font-black uppercase tracking-wider pb-0.5 border-b-2 ${sizeClasses.heading}`}
                          style={{ borderColor: accentColor, color: accentColor }}
                        >
                          Work Experience
                        </h2>
                        {resumeData.experience.map((exp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-slate-900">
                              <span>
                                {exp.role} <span className="font-normal text-slate-500">—</span>{' '}
                                <span className="text-slate-700">{exp.company}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                              </span>
                            </div>
                            <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                              {exp.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Education */}
                    {sectionVisibility.education !== false && resumeData.education.length > 0 && (
                      <div className="space-y-1.5">
                        <h2
                          className={`font-black uppercase tracking-wider pb-0.5 border-b-2 ${sizeClasses.heading}`}
                          style={{ borderColor: accentColor, color: accentColor }}
                        >
                          Education
                        </h2>
                        {resumeData.education.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-baseline text-slate-800">
                            <div>
                              <span className="font-bold text-slate-900">{edu.degree}</span> · {edu.institution}
                            </div>
                            <div className="text-[10px] font-mono text-slate-600">
                              {edu.startDate} – {edu.endDate} {edu.gpaOrScore ? `(${edu.gpaOrScore})` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {sectionVisibility.skills !== false && resumeData.skills.length > 0 && (
                      <div className="space-y-1">
                        <h2
                          className={`font-black uppercase tracking-wider pb-0.5 border-b-2 ${sizeClasses.heading}`}
                          style={{ borderColor: accentColor, color: accentColor }}
                        >
                          Skills & Competencies
                        </h2>
                        <div className="space-y-0.5 text-slate-800">
                          {resumeData.skills.map((cat, idx) => (
                            <div key={idx}>
                              <span className="font-bold text-slate-900">{cat.category}: </span>
                              <span>{cat.items.join(' • ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {sectionVisibility.certifications !== false && resumeData.certifications && resumeData.certifications.length > 0 && (
                      <div className="space-y-1">
                        <h2
                          className={`font-black uppercase tracking-wider pb-0.5 border-b-2 ${sizeClasses.heading}`}
                          style={{ borderColor: accentColor, color: accentColor }}
                        >
                          Certifications & Honors
                        </h2>
                        <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                          {resumeData.certifications.map((c, cIdx) => (
                            <li key={cIdx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Custom Sections */}
                    {(resumeData.customSections || []).map((cs) => {
                      if (sectionVisibility[cs.id] === false) return null;
                      return (
                        <div key={cs.id} className="space-y-1">
                          <h2
                            className={`font-black uppercase tracking-wider pb-0.5 border-b-2 ${sizeClasses.heading}`}
                            style={{ borderColor: accentColor, color: accentColor }}
                          >
                            {cs.title}
                          </h2>
                          {(cs.kind === 'bullets' || (!cs.kind && cs.bullets)) && cs.bullets && (
                            <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                              {cs.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          )}
                          {cs.kind === 'tags' && cs.tags && (
                            <div className="text-slate-800 font-medium">{cs.tags.join(' · ')}</div>
                          )}
                          {cs.kind === 'paragraph' && cs.paragraph && (
                            <p className="text-slate-800 leading-relaxed text-justify">{cs.paragraph}</p>
                          )}
                          {cs.kind === 'keyvalue' && cs.keyValues && (
                            <div className="space-y-0.5 text-slate-800">
                              {cs.keyValues.map((kv, kvIdx) => (
                                <div key={kvIdx}>
                                  <span className="font-bold text-slate-900">{kv.label}: </span>
                                  <span>{kv.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ========================================================= */}
                {/* TEMPLATE 4: FRESHER (India Fresher)                       */}
                {/* Education & CGPA FIRST, project tech tags, internship focus */}
                {/* ========================================================= */}
                {activeTemplate === 'fresher' && (
                  <div className={sizeClasses.gap}>
                    {/* Header with Orange/Accent strip */}
                    <div className="space-y-1 pb-1">
                      <div className="flex justify-between items-baseline">
                        <h1 className={`font-black tracking-tight text-slate-900 uppercase ${sizeClasses.title}`}>
                          {resumeData.fullName || ''}
                        </h1>
                        <span className="text-[10px] font-mono text-slate-500">{resumeData.location}</span>
                      </div>
                      <div className={`font-bold text-orange-600 ${sizeClasses.sub}`}>
                        {resumeData.headline || ''}
                      </div>
                      <div className="text-[10px] text-slate-600 flex flex-wrap gap-x-2">
                        {resumeData.email && <span>{resumeData.email}</span>}
                        {resumeData.phone && <span>· {resumeData.phone}</span>}
                        {resumeData.linkedinUrl && <span>· {resumeData.linkedinUrl}</span>}
                        {resumeData.githubOrPortfolio && <span>· {resumeData.githubOrPortfolio}</span>}
                      </div>
                      <div className="h-0.5 w-full bg-orange-500 mt-1" />
                    </div>

                    {/* Summary */}
                    {sectionVisibility.summary !== false && resumeData.summary && (
                      <div className="space-y-0.5">
                        <h2 className={`font-bold uppercase tracking-wider text-orange-700 ${sizeClasses.heading}`}>
                          Professional Summary
                        </h2>
                        <p className="text-slate-800 leading-relaxed text-justify">{resumeData.summary}</p>
                      </div>
                    )}

                    {/* 1. EDUCATION PLACED FIRST (CRITICAL FOR INDIA FRESHERS) */}
                    {sectionVisibility.education !== false && resumeData.education.length > 0 && (
                      <div className="space-y-1.5 p-2 rounded-lg bg-orange-50/40 border border-orange-200">
                        <h2 className={`font-bold uppercase tracking-wider text-orange-800 ${sizeClasses.heading}`}>
                          Academic Qualifications
                        </h2>
                        {resumeData.education.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-baseline text-slate-800">
                            <div>
                              <span className="font-bold text-slate-900">{edu.degree}</span> — {edu.institution}
                              {edu.field && <span className="text-slate-600 block text-[10px]">{edu.field}</span>}
                            </div>
                            <div className="text-[10px] font-mono text-right">
                              <span className="text-slate-600">{edu.startDate} – {edu.endDate}</span>
                              {edu.gpaOrScore && (
                                <span className="block font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded mt-0.5">
                                  {edu.gpaOrScore}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. PROJECTS & CAPSTONES WITH TECH-STACK PILL TAGS */}
                    {sectionVisibility.projects !== false && resumeData.projects.length > 0 && (
                      <div className="space-y-2">
                        <h2 className={`font-bold uppercase tracking-wider text-orange-700 ${sizeClasses.heading}`}>
                          Key Academic Projects & Capstones
                        </h2>
                        {resumeData.projects.map((proj, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-baseline font-bold text-slate-900">
                              <span>{proj.name}</span>
                              <span className="text-[10px] text-slate-500 italic">{proj.context}</span>
                            </div>
                            {/* Tech-stack pill tags */}
                            <div className="flex flex-wrap gap-1">
                              {proj.context.split(/[,·/|]/).map((tag, tIdx) => (
                                <span key={tIdx} className="px-1.5 py-0.2 bg-orange-100 text-orange-800 rounded text-[9px] font-mono">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                            <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                              {proj.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. WORK EXPERIENCE / INTERNSHIPS */}
                    {sectionVisibility.experience !== false && resumeData.experience.length > 0 && (
                      <div className="space-y-2">
                        <h2 className={`font-bold uppercase tracking-wider text-orange-700 ${sizeClasses.heading}`}>
                          Internships & Work Experience
                        </h2>
                        {resumeData.experience.map((exp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-slate-900">
                              <span>{exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span></span>
                              <span className="text-[10px] text-slate-500 font-mono">{exp.startDate} – {exp.endDate}</span>
                            </div>
                            <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                              {exp.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4. SKILLS */}
                    {sectionVisibility.skills !== false && resumeData.skills.length > 0 && (
                      <div className="space-y-1">
                        <h2 className={`font-bold uppercase tracking-wider text-orange-700 ${sizeClasses.heading}`}>
                          Technical & Analytical Skills
                        </h2>
                        <div className="space-y-0.5 text-slate-800">
                          {resumeData.skills.map((cat, idx) => (
                            <div key={idx}>
                              <span className="font-bold text-slate-900">{cat.category}: </span>
                              <span>{cat.items.join(' · ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {renderTemplateCertifications(`font-bold uppercase tracking-wider text-orange-700 ${sizeClasses.heading}`)}

                    {/* Custom Sections */}
                    {(resumeData.customSections || []).map((cs) =>
                      renderTemplateCustomSection(cs, `font-bold uppercase tracking-wider text-orange-700 ${sizeClasses.heading}`)
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* TEMPLATE 5: EXECUTIVE                                     */}
                {/* Dark full-width header block across top, executive styling*/}
                {/* ========================================================= */}
                {activeTemplate === 'executive' && (
                  <div className={sizeClasses.gap}>
                    {/* Dark Contrast Header Banner */}
                    <div className="bg-slate-900 text-white -mx-8 sm:-mx-10 -mt-8 sm:-mt-10 p-6 sm:p-8 space-y-1 shadow-md">
                      <h1 className={`font-black tracking-tight uppercase ${sizeClasses.title}`}>
                        {resumeData.fullName || ''}
                      </h1>
                      <div className={`font-bold ${sizeClasses.sub}`} style={{ color: accentColor }}>
                        {resumeData.headline || ''}
                      </div>
                      <div className="text-[10px] text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1">
                        {resumeData.email && <span>{resumeData.email}</span>}
                        {resumeData.phone && <span>· {resumeData.phone}</span>}
                        {resumeData.location && <span>· {resumeData.location}</span>}
                        {resumeData.linkedinUrl && <span>· {resumeData.linkedinUrl}</span>}
                      </div>
                    </div>

                    {/* Summary */}
                    {sectionVisibility.summary !== false && resumeData.summary && (
                      <div className="space-y-1 pt-2">
                        <h2 className={`font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 ${sizeClasses.heading}`}>
                          Executive Leadership Profile
                        </h2>
                        <p className="text-slate-800 leading-relaxed text-justify">{resumeData.summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {sectionVisibility.experience !== false && resumeData.experience.length > 0 && (
                      <div className="space-y-2.5">
                        <h2 className={`font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 ${sizeClasses.heading}`}>
                          Leadership & Professional Experience
                        </h2>
                        {resumeData.experience.map((exp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-slate-900">
                              <span>{exp.role} | {exp.company}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                            </div>
                            <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                              {exp.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Education */}
                    {sectionVisibility.education !== false && resumeData.education.length > 0 && (
                      <div className="space-y-1.5">
                        <h2 className={`font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 ${sizeClasses.heading}`}>
                          Academic Credentials
                        </h2>
                        {resumeData.education.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-baseline text-slate-800">
                            <div>
                              <span className="font-bold text-slate-900">{edu.degree}</span> — {edu.institution}
                            </div>
                            <div className="text-[10px] font-mono text-slate-600">
                              {edu.startDate} – {edu.endDate} {edu.gpaOrScore ? `(${edu.gpaOrScore})` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {sectionVisibility.skills !== false && resumeData.skills.length > 0 && (
                      <div className="space-y-1">
                        <h2 className={`font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 ${sizeClasses.heading}`}>
                          Strategic Competencies
                        </h2>
                        <div className="space-y-0.5 text-slate-800">
                          {resumeData.skills.map((cat, idx) => (
                            <div key={idx}>
                              <span className="font-bold">{cat.category}: </span>
                              <span>{cat.items.join(' • ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {renderTemplateCertifications(`font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 ${sizeClasses.heading}`)}

                    {/* Custom Sections */}
                    {(resumeData.customSections || []).map((cs) =>
                      renderTemplateCustomSection(cs, `font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 ${sizeClasses.heading}`)
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* TEMPLATE 6: ACADEMIC / PLACEMENT COMMITTEE (IIM / XLRI)   */}
                {/* Formal qualifications matrix, double rule under header    */}
                {/* ========================================================= */}
                {activeTemplate === 'academic' && (
                  <div className={sizeClasses.gap}>
                    {/* Formal Header with Double Rule */}
                    <div className="text-center space-y-1">
                      <h1 className={`font-serif font-black tracking-wide text-slate-900 uppercase ${sizeClasses.title}`}>
                        {resumeData.fullName || ''}
                      </h1>
                      <div className={`font-serif italic text-slate-700 ${sizeClasses.sub}`}>
                        {resumeData.headline || ''}
                      </div>
                      <div className="text-[10px] text-slate-600 flex justify-center flex-wrap gap-x-3">
                        {resumeData.email && <span>Email: {resumeData.email}</span>}
                        {resumeData.phone && <span>· Mob: {resumeData.phone}</span>}
                        {resumeData.linkedinUrl && <span>· LinkedIn: {resumeData.linkedinUrl}</span>}
                      </div>
                      <div className="border-t-2 border-b border-slate-900 py-0.5 my-1" />
                    </div>

                    {/* Structured Qualifications Table (Classic B-School Format) */}
                    {sectionVisibility.education !== false && resumeData.education.length > 0 && (
                      <div className="space-y-1">
                        <h2 className={`font-serif font-bold uppercase tracking-wider text-slate-900 ${sizeClasses.heading}`}>
                          Academic Qualifications
                        </h2>
                        <div className="border border-slate-300 text-[10px]">
                          <div className="grid grid-cols-12 bg-slate-100 font-bold border-b border-slate-300 p-1 text-slate-900">
                            <span className="col-span-4">Degree / Examination</span>
                            <span className="col-span-4">Institution / University</span>
                            <span className="col-span-2">Year</span>
                            <span className="col-span-2 text-right">Score / GPA</span>
                          </div>
                          {resumeData.education.map((edu, idx) => (
                            <div key={idx} className="grid grid-cols-12 p-1 border-b border-slate-200 text-slate-800 last:border-b-0">
                              <span className="col-span-4 font-semibold">{edu.degree}</span>
                              <span className="col-span-4">{edu.institution}</span>
                              <span className="col-span-2 font-mono">{edu.endDate}</span>
                              <span className="col-span-2 font-mono font-bold text-right">{edu.gpaOrScore || 'Pass'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {sectionVisibility.summary !== false && resumeData.summary && (
                      <div className="space-y-1">
                        <h2 className={`font-serif font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 ${sizeClasses.heading}`}>
                          Executive Summary
                        </h2>
                        <p className="text-slate-800 leading-relaxed text-justify">{resumeData.summary}</p>
                      </div>
                    )}

                    {/* Work Experience */}
                    {sectionVisibility.experience !== false && resumeData.experience.length > 0 && (
                      <div className="space-y-2">
                        <h2 className={`font-serif font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 ${sizeClasses.heading}`}>
                          Professional Experience
                        </h2>
                        {resumeData.experience.map((exp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-slate-900">
                              <span>{exp.company} — <span className="font-normal italic">{exp.role}</span></span>
                              <span className="text-[10px] font-mono text-slate-600">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                            </div>
                            <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                              {exp.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Projects */}
                    {sectionVisibility.projects !== false && resumeData.projects.length > 0 && (
                      <div className="space-y-2">
                        <h2 className={`font-serif font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 ${sizeClasses.heading}`}>
                          Academic Projects & Case Competitions
                        </h2>
                        {resumeData.projects.map((proj, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-slate-900">
                              <span>{proj.name}</span>
                              <span className="text-[10px] text-slate-500 italic">{proj.context}</span>
                            </div>
                            <ul className={`list-disc list-inside text-slate-800 pl-1 ${sizeClasses.bulletGap}`}>
                              {proj.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {sectionVisibility.skills !== false && resumeData.skills.length > 0 && (
                      <div className="space-y-1">
                        <h2 className={`font-serif font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 ${sizeClasses.heading}`}>
                          Technical & Managerial Competencies
                        </h2>
                        <div className="space-y-0.5 text-slate-800">
                          {resumeData.skills.map((cat, idx) => (
                            <div key={idx}>
                              <span className="font-bold">{cat.category}: </span>
                              <span>{cat.items.join(' · ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {renderTemplateCertifications(`font-serif font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 ${sizeClasses.heading}`)}

                    {/* Custom Sections */}
                    {(resumeData.customSections || []).map((cs) =>
                      renderTemplateCustomSection(cs, `font-serif font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 ${sizeClasses.heading}`)
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: GOOGLE XYZ ASSISTANT MODAL                                       */}
      {/* ========================================================================= */}
      {activeModal === 'xyz' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1526] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00DF89]" />
                <h3 className="text-base font-bold text-white">Google XYZ Bullet Formula Builder</h3>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Google recruiters advocate the formula: <span className="text-[#00DF89] font-bold">"Accomplished [X] as measured by [Y], by doing [Z]"</span>. Fill in the blanks below to generate an interview-grade bullet.
            </p>

            {/* Template Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GOOGLE_XYZ_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedXyzTemplate(tmpl.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedXyzTemplate === tmpl.id
                      ? 'bg-emerald-950/80 border-[#00DF89] text-white font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">{tmpl.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{tmpl.category}</div>
                </button>
              ))}
            </div>

            {/* Input Fields */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  [X] What did you accomplish? (Business Goal / Result)
                </label>
                <input
                  type="text"
                  value={xyzX}
                  onChange={(e) => setXyzX(e.target.value)}
                  placeholder="e.g. checkout conversion rate or customer retention"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-[#00DF89]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  [Y] As measured by what metric? (%, $, ₹, time saved, multiplier)
                </label>
                <input
                  type="text"
                  value={xyzY}
                  onChange={(e) => setXyzY(e.target.value)}
                  placeholder="e.g. 24% increase ($1.2M incremental ARR)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-[#00DF89]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  [Z] By doing what strategic action? (Implementation / Methodology)
                </label>
                <input
                  type="text"
                  value={xyzZ}
                  onChange={(e) => setXyzZ(e.target.value)}
                  placeholder="e.g. redesigning the 1-click checkout funnel and conducting A/B tests"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-[#00DF89]"
                />
              </div>
            </div>

            {/* Generated Preview */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Live Output Preview</span>
              <p className="text-white font-medium text-xs">
                {`Accomplished ${xyzX || '[Business Goal]'} as measured by ${xyzY || '[Metric]'}, by doing ${xyzZ || '[Strategic Action]'}.`}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveModal('none')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={applyXyzFormula}
                className="px-5 py-2 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                Insert into Bullet →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: POWER ACTION VERBS CATALOG MODAL                                 */}
      {/* ========================================================================= */}
      {activeModal === 'verbs' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1526] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Power Action Verbs Catalog (150+ Verbs)</h3>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={verbSearch}
                onChange={(e) => setVerbSearch(e.target.value)}
                placeholder="Search verbs (e.g. Orchestrated, Accelerated)..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-[#00DF89]"
              />
              <select
                value={selectedVerbCategory}
                onChange={(e) => setSelectedVerbCategory(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:border-[#00DF89]"
              >
                <option value="all">All Domains</option>
                {POWER_VERBS_CATALOG.map((c) => (
                  <option key={c.category} value={c.category}>{c.category}</option>
                ))}
              </select>
            </div>

            {/* Verbs List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {POWER_VERBS_CATALOG.filter(
                (c) => selectedVerbCategory === 'all' || c.category === selectedVerbCategory
              ).map((cat) => {
                const filteredVerbs = cat.verbs.filter((v) =>
                  v.toLowerCase().includes(verbSearch.toLowerCase())
                );
                if (filteredVerbs.length === 0) return null;

                return (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-1">
                      <span className="font-bold text-white text-xs">{cat.category}</span>
                      <span className="text-[10px] text-slate-400">{cat.description}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filteredVerbs.map((v) => (
                        <button
                          key={v}
                          onClick={() => applyPowerVerb(v)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-emerald-950 hover:border-[#00DF89] hover:text-[#00DF89] text-slate-200 font-semibold transition-colors cursor-pointer"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveModal('none')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
