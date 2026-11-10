import jsPDF from 'jspdf';
import { ThreeBlockResultCard } from './match-engine-types';

export interface JobMatchReportExportData {
  jobInfo: {
    title: string;
    company: string;
    sourceUrl?: string;
    location?: string;
    experienceRange?: string;
    workplaceType?: string;
  };
  candidateInfo: {
    name?: string;
    sourceMode: 'upload' | 'compass';
    fileName?: string;
    charCount?: number;
    detectedSeniority?: string;
    totalExperienceYears?: number;
  };
  scores: {
    overallFitScore: number;
    fitLabel: string;
    priorityWeightedScore: number;
    quantifiedMetricsScore: number;
    metricsBulletsCount?: number;
    totalBulletsCount?: number;
    atsKeywordScore: number;
    honestSummary: string;
    counts: {
      total: number;
      matched: number;
      canImprove: number;
      missing: number;
      uncertain: number;
      criticalTotal?: number;
      criticalMatched?: number;
    };
  };
  cards: ThreeBlockResultCard[];
  engineModel?: string;
  generationDate?: string;
}

// Convert special unicode characters to safe ASCII for standard jsPDF Helvetica fonts
export function cleanPdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, ' - ')
    .replace(/[•·]/g, '* ')
    .replace(/[›»]/g, '>')
    .replace(/[✓✔]/g, '[x]')
    .replace(/[✕✗]/g, '[ ]')
    .replace(/[⚡★]/g, '*')
    .replace(/[📍]/g, '@ ')
    .replace(/[⚠]/g, '!')
    .replace(/[₹]/g, 'INR ')
    .replace(/[€]/g, 'EUR ')
    .replace(/[£]/g, 'GBP ')
    .replace(/[^\x00-\x7F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// Generate human-friendly filename
export function getReportFilename(
  data: JobMatchReportExportData,
  extension: 'pdf' | 'md' | 'txt' | 'json'
): string {
  const company = (data.jobInfo.company || 'Company').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const title = (data.jobInfo.title || 'Role').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  return `${company}_${title}_Match_Report_${dateStr}.${extension}`.replace(/__+/g, '_');
}

/**
 * Generates an executive Markdown report
 */
export function generateJobMatchMarkdownReport(data: JobMatchReportExportData): string {
  const { jobInfo, candidateInfo, scores, cards, engineModel, generationDate } = data;
  const date = generationDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines: string[] = [];

  lines.push(`# Job Match & ATS Optimization Report`);
  lines.push(`**Target Role:** ${jobInfo.title} at ${jobInfo.company}`);
  if (jobInfo.location) {
    lines.push(`**Location:** ${jobInfo.location}`);
  }
  if (jobInfo.experienceRange) {
    lines.push(`**Experience Range:** ${jobInfo.experienceRange}`);
  }
  if (jobInfo.sourceUrl) {
    lines.push(`**Source URL:** ${jobInfo.sourceUrl}`);
  }
  lines.push(`**Candidate Resume:** ${candidateInfo.name || (candidateInfo.sourceMode === 'compass' ? 'Compass Resume Studio' : candidateInfo.fileName || 'Uploaded File')}`);
  lines.push(`**Generated:** ${date}`);
  if (engineModel) {
    lines.push(`**Analysis Model:** ${engineModel}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  const isIncomplete =
    scores.counts.total < 3 &&
    (scores.honestSummary.includes('Could not reliably extract') || scores.overallFitScore === 0);

  // Executive Scorecard
  lines.push('## Executive Scorecard');
  lines.push('');
  if (isIncomplete) {
    lines.push(`- **Overall Role Fit:** **—** (Results Incomplete: Could not reliably extract requirements from this posting)`);
  } else {
    lines.push(`- **Overall Role Fit:** **${scores.overallFitScore}%** (${scores.fitLabel} — ${scores.counts.matched} of ${scores.counts.total} requirements met)`);
  }
  lines.push(`- **Priority-Weighted Fit:** ${scores.priorityWeightedScore}% (Critical requirements weighted 3×, Important 2×)`);
  lines.push(`- **Bullet Metric Density:** ${scores.quantifiedMetricsScore}% (${scores.metricsBulletsCount ?? 0}/${scores.totalBulletsCount ?? 0} experience bullets contain numbers/metrics)`);
  lines.push(`- **ATS Keyword & Terminology Alignment:** ${scores.atsKeywordScore}%`);
  lines.push('');

  // Requirement Counts Summary Table
  lines.push('### Requirement Breakdown');
  lines.push('');
  lines.push('| Category | Count | Status |');
  lines.push('| :--- | :--- | :--- |');
  lines.push(`| **Directly Matched** | ${scores.counts.matched} | Fully evidenced in resume |`);
  lines.push(`| **Can Improve / Sharpen** | ${scores.counts.canImprove} | Evidenced; can be strengthened with Google XYZ rewrites |`);
  lines.push(`| **Missing Gaps** | ${scores.counts.missing} | Not detected; priority area to bridge |`);
  lines.push(`| **Uncertain / Related** | ${scores.counts.uncertain} | Related domain exposure found |`);
  lines.push(`| **Total Requirements Extracted** | ${scores.counts.total} | 100% gated against raw JD |`);
  lines.push('');

  // Objective Audit Summary
  lines.push('### Objective Audit Summary');
  lines.push('');
  lines.push(`> ${scores.honestSummary}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // 3-Block Audit Details
  lines.push('## Detailed Requirement Audit & Action Plan');
  lines.push('');

  cards.forEach((card, idx) => {
    const statusLabel =
      card.classification === 'matched'
        ? '[MATCHED]'
        : card.classification === 'can_improve'
        ? '[CAN IMPROVE]'
        : card.classification === 'missing'
        ? '[MISSING]'
        : '[UNCERTAIN]';

    const priorityMultiplier =
      card.jobAsks.priority === 'critical'
        ? '3x Weight'
        : card.jobAsks.priority === 'important'
        ? '2x Weight'
        : '1x Weight';

    lines.push(`### ${idx + 1}. ${card.jobAsks.canonicalTerm} — ${statusLabel}`);
    lines.push(`- **Priority:** ${card.jobAsks.priority.toUpperCase()} (${priorityMultiplier})`);
    lines.push(`- **Requirement Type:** ${card.jobAsks.type.replace('_', ' ')} (Zone: ${card.jobAsks.zone})`);
    lines.push('');
    lines.push(`**1. The Job Asks:**`);
    lines.push(`> "${card.jobAsks.verbatimQuote}"`);
    lines.push('');

    lines.push(`**2. Candidate Evidence in Resume:**`);
    if (card.yourResume.breadcrumbs) {
      lines.push(`*Location: ${card.yourResume.breadcrumbs}*`);
    }
    if (card.yourResume.citedUnit) {
      lines.push(`\`\`\``);
      lines.push(card.yourResume.citedUnit.text);
      lines.push(`\`\`\``);
      if (card.yourResume.evidencePhrase) {
        lines.push(`*Matched key phrase:* "${card.yourResume.evidencePhrase}"`);
      }
    } else if (card.yourResume.missingExplanation) {
      lines.push(`*Not detected:* ${card.yourResume.missingExplanation}`);
    } else {
      lines.push(`*No direct evidence found in candidate resume.*`);
    }
    lines.push('');

    lines.push(`**3. Strategic Recommendation / What To Do:**`);
    lines.push(`**${card.whatToDo.actionHeadline}**`);
    lines.push(card.whatToDo.adviceText);
    if (card.whatToDo.suggestedRewrite) {
      lines.push('');
      lines.push(`*Suggested Google XYZ Bullet Rewrite:*`);
      lines.push(`> "${card.whatToDo.suggestedRewrite}"`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  lines.push('');
  lines.push(`*Report generated automatically by Compass Career Engine on ${date}.*`);

  return lines.join('\n');
}

/**
 * Generates an ASCII plain-text report
 */
export function generateJobMatchTextReport(data: JobMatchReportExportData): string {
  const { jobInfo, candidateInfo, scores, cards, generationDate } = data;
  const date = generationDate || new Date().toLocaleString();

  const lines: string[] = [];
  const divider = '='.repeat(76);
  const thinDivider = '-'.repeat(76);

  lines.push(divider);
  lines.push(`JOB MATCH & ATS AUDIT REPORT`);
  lines.push(divider);
  lines.push(`Target Role : ${jobInfo.title}`);
  lines.push(`Company     : ${jobInfo.company}`);
  if (jobInfo.location) {
    lines.push(`Location    : ${jobInfo.location}`);
  }
  if (jobInfo.experienceRange) {
    lines.push(`Experience  : ${jobInfo.experienceRange}`);
  }
  if (jobInfo.sourceUrl) {
    lines.push(`Source URL  : ${jobInfo.sourceUrl}`);
  }
  lines.push(`Candidate   : ${candidateInfo.name || (candidateInfo.sourceMode === 'compass' ? 'Compass Resume' : candidateInfo.fileName || 'Uploaded Resume')}`);
  if (data.engineModel) {
    lines.push(`Model       : ${data.engineModel}`);
  }
  lines.push(`Date        : ${date}`);
  lines.push(divider);
  const isIncomplete =
    scores.counts.total < 3 &&
    (scores.honestSummary.includes('Could not reliably extract') || scores.overallFitScore === 0);

  if (isIncomplete) {
    lines.push(`OVERALL ROLE FIT: — [RESULTS INCOMPLETE: Could not reliably extract requirements]`);
  } else {
    lines.push(`OVERALL ROLE FIT: ${scores.overallFitScore}% [${scores.fitLabel.toUpperCase()}] (${scores.counts.matched} of ${scores.counts.total} requirements met)`);
  }
  lines.push(`- Priority-Weighted Fit    : ${scores.priorityWeightedScore}%`);
  lines.push(`- Metric Bullet Density    : ${scores.quantifiedMetricsScore}% (${scores.metricsBulletsCount ?? 0}/${scores.totalBulletsCount ?? 0} bullets with metrics)`);
  lines.push(`- ATS Keyword Alignment    : ${scores.atsKeywordScore}%`);
  lines.push('');
  lines.push(`SUMMARY BREAKDOWN:`);
  lines.push(`- Directly Matched         : ${scores.counts.matched} requirements`);
  lines.push(`- Can Improve (Rewrites)   : ${scores.counts.canImprove} requirements`);
  lines.push(`- Missing Gaps             : ${scores.counts.missing} requirements`);
  lines.push(`- Uncertain / Related      : ${scores.counts.uncertain} requirements`);
  lines.push('');
  lines.push(`OBJECTIVE AUDIT SUMMARY:`);
  lines.push(scores.honestSummary);
  lines.push('');
  lines.push(divider);
  lines.push(`DETAILED REQUIREMENT AUDIT (${cards.length} REQUIREMENTS)`);
  lines.push(divider);
  lines.push('');

  cards.forEach((card, idx) => {
    const status = card.classification.toUpperCase().replace('_', ' ');
    const priority = card.jobAsks.priority.toUpperCase();
    lines.push(`[${idx + 1}] ${card.jobAsks.canonicalTerm} [STATUS: ${status}] [PRIORITY: ${priority}]`);
    lines.push(`    1. Job Asks: "${card.jobAsks.verbatimQuote}"`);
    if (card.yourResume.citedUnit) {
      lines.push(`    2. Resume  : "${card.yourResume.citedUnit.text}"`);
      if (card.yourResume.breadcrumbs) {
        lines.push(`       Location: ${card.yourResume.breadcrumbs}`);
      }
    } else {
      lines.push(`    2. Resume  : No direct evidence found in resume.`);
    }
    lines.push(`    3. Action  : ${card.whatToDo.actionHeadline}`);
    lines.push(`       ${card.whatToDo.adviceText}`);
    if (card.whatToDo.suggestedRewrite) {
      lines.push(`       Suggested Rewrite: "${card.whatToDo.suggestedRewrite}"`);
    }
    lines.push(thinDivider);
  });

  return lines.join('\n');
}

/**
 * Triggers a download of an arbitrary text blob
 */
function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function downloadJobMatchMarkdown(data: JobMatchReportExportData): void {
  const md = generateJobMatchMarkdownReport(data);
  const filename = getReportFilename(data, 'md');
  downloadBlob(md, filename, 'text/markdown;charset=utf-8');
}

export function downloadJobMatchText(data: JobMatchReportExportData): void {
  const txt = generateJobMatchTextReport(data);
  const filename = getReportFilename(data, 'txt');
  downloadBlob(txt, filename, 'text/plain;charset=utf-8');
}

export function downloadJobMatchJson(data: JobMatchReportExportData): void {
  const json = JSON.stringify(data, null, 2);
  const filename = getReportFilename(data, 'json');
  downloadBlob(json, filename, 'application/json;charset=utf-8');
}

/**
 * Downloads a crisp, professionally formatted executive PDF report using jsPDF
 */
export async function downloadJobMatchPdf(data: JobMatchReportExportData): Promise<boolean> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;

    // Helper to check page break and wrap
    const ensureSpace = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin - 10) {
        pdf.addPage();
        currentY = margin + 6;
        return true;
      }
      return false;
    };

    // Brand Header Bar
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text('COMPASS CAREER ENGINE', margin + 6, currentY + 9);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 223, 137); // #00DF89 emerald
    pdf.text('JOB MATCH & ATS AUDIT REPORT', margin + 6, currentY + 16);

    const dateStr = data.generationDate || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text(`Date: ${cleanPdfText(dateStr)}`, pageWidth - margin - 6, currentY + 13, { align: 'right' });

    currentY += 26;

    // Target Role & Candidate Info Box
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    const metaParts = [
      data.jobInfo.location ? data.jobInfo.location : '',
      data.jobInfo.experienceRange ? data.jobInfo.experienceRange : '',
    ].filter(Boolean);
    const metaSuffix = metaParts.length > 0 ? ` [${metaParts.join(' · ')}]` : '';
    const roleTitle = cleanPdfText(`${data.jobInfo.title} — ${data.jobInfo.company}${metaSuffix}`);
    pdf.text(roleTitle, margin + 5, currentY + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    const candidateName = cleanPdfText(
      data.candidateInfo.name ||
        (data.candidateInfo.sourceMode === 'compass' ? 'Compass Resume' : data.candidateInfo.fileName || 'Uploaded Resume')
    );
    pdf.text(`Candidate: ${candidateName}`, margin + 5, currentY + 14);

    const modelInfo = cleanPdfText(data.engineModel ? `Model: ${data.engineModel}` : 'Audit: 5-Stage Gated Engine');
    pdf.text(modelInfo, pageWidth - margin - 5, currentY + 14, { align: 'right' });

    currentY += 24;

    // Executive Scorecard Card
    ensureSpace(32);
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.setDrawColor(203, 213, 225); // slate-300
    pdf.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'FD');

    const isIncomplete =
      data.scores.counts.total < 3 &&
      (data.scores.honestSummary.includes('Could not reliably extract') || data.scores.overallFitScore === 0);

    // Left score circle/box
    if (isIncomplete) {
      pdf.setFillColor(225, 29, 72); // rose-600
      pdf.roundedRect(margin + 4, currentY + 4, 28, 20, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('—', margin + 18, currentY + 15, { align: 'center' });
      pdf.setFontSize(5.5);
      pdf.text('INCOMPLETE', margin + 18, currentY + 20, { align: 'center' });
    } else {
      pdf.setFillColor(5, 150, 105); // emerald-600
      pdf.roundedRect(margin + 4, currentY + 4, 28, 20, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${data.scores.overallFitScore}%`, margin + 18, currentY + 15, { align: 'center' });
      pdf.setFontSize(6.5);
      pdf.text('OVERALL FIT', margin + 18, currentY + 20, { align: 'center' });
    }

    // Middle text: verdict & metrics
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    const fitLabelText = isIncomplete
      ? 'Results Incomplete'
      : `${cleanPdfText(data.scores.fitLabel)} (${data.scores.counts.matched} of ${data.scores.counts.total} met)`;
    pdf.text(fitLabelText, margin + 36, currentY + 9);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(
      `Role Fit (Priority-Weighted): ${data.scores.priorityWeightedScore}%  |  ATS Keyword Alignment: ${data.scores.atsKeywordScore}%`,
      margin + 36,
      currentY + 16
    );
    pdf.text(
      `Metric Bullet Density: ${data.scores.quantifiedMetricsScore}% (${data.scores.metricsBulletsCount ?? 0}/${data.scores.totalBulletsCount ?? 0} experience bullets with metrics)`,
      margin + 36,
      currentY + 22
    );

    currentY += 32;

    // Summary Count Badges
    ensureSpace(14);
    const boxW = (contentWidth - 6) / 4;
    const badgeData = [
      { label: 'MATCHED', count: data.scores.counts.matched, fill: [236, 253, 245], textCol: [4, 120, 87] },
      { label: 'CAN IMPROVE', count: data.scores.counts.canImprove, fill: [240, 253, 250], textCol: [13, 148, 136] },
      { label: 'MISSING GAPS', count: data.scores.counts.missing, fill: [255, 241, 242], textCol: [225, 29, 72] },
      { label: 'UNCERTAIN', count: data.scores.counts.uncertain, fill: [254, 252, 232], textCol: [161, 98, 7] },
    ];

    badgeData.forEach((b, i) => {
      const bx = margin + i * (boxW + 2);
      pdf.setFillColor(b.fill[0], b.fill[1], b.fill[2]);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(bx, currentY, boxW, 11, 1.5, 1.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(b.textCol[0], b.textCol[1], b.textCol[2]);
      pdf.text(`${b.count} ${b.label}`, bx + boxW / 2, currentY + 7.5, { align: 'center' });
    });

    currentY += 15;

    // Objective Audit Summary Box
    ensureSpace(24);
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    const honestSummaryLines = pdf.splitTextToSize(
      cleanPdfText(data.scores.honestSummary),
      contentWidth - 10
    );
    const summaryBoxH = Math.max(16, honestSummaryLines.length * 4 + 8);
    pdf.roundedRect(margin, currentY, contentWidth, summaryBoxH, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text('OBJECTIVE AUDIT SYNTHESIS:', margin + 4, currentY + 5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85);
    pdf.text(honestSummaryLines, margin + 4, currentY + 10);

    currentY += summaryBoxH + 6;

    // Detailed Requirement Audit Section Header
    ensureSpace(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`DETAILED REQUIREMENT AUDIT (${data.cards.length} REQUIREMENTS)`, margin, currentY + 4);
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, currentY + 6, pageWidth - margin, currentY + 6);
    currentY += 10;

    // Cards list
    data.cards.forEach((card, idx) => {
      const canonicalTerm = cleanPdfText(card.jobAsks.canonicalTerm);
      const verbatimQuote = cleanPdfText(card.jobAsks.verbatimQuote);
      const statusLabel =
        card.classification === 'matched'
          ? 'MATCHED'
          : card.classification === 'can_improve'
          ? 'CAN IMPROVE'
          : card.classification === 'missing'
          ? 'MISSING GAP'
          : 'UNCERTAIN';

      const priorityLabel = `${card.jobAsks.priority.toUpperCase()} (${card.jobAsks.priority === 'critical' ? '3x' : card.jobAsks.priority === 'important' ? '2x' : '1x'})`;

      const askLines = pdf.splitTextToSize(`Job asks: "${verbatimQuote}"`, contentWidth - 8);
      
      let evidenceText = 'Resume: No direct evidence found in candidate resume.';
      if (card.yourResume.citedUnit) {
        evidenceText = `Resume: "${cleanPdfText(card.yourResume.citedUnit.text)}"`;
      }
      const evidenceLines = pdf.splitTextToSize(evidenceText, contentWidth - 8);

      const actionText = `Action: ${cleanPdfText(card.whatToDo.actionHeadline)} - ${cleanPdfText(card.whatToDo.adviceText)}`;
      const actionLines = pdf.splitTextToSize(actionText, contentWidth - 8);

      let rewriteLines: string[] = [];
      if (card.whatToDo.suggestedRewrite) {
        rewriteLines = pdf.splitTextToSize(
          `Google XYZ Rewrite: "${cleanPdfText(card.whatToDo.suggestedRewrite)}"`,
          contentWidth - 12
        );
      }

      const totalCardHeight =
        10 +
        askLines.length * 3.6 +
        evidenceLines.length * 3.6 +
        actionLines.length * 3.6 +
        (rewriteLines.length > 0 ? rewriteLines.length * 3.6 + 6 : 0) +
        4;

      ensureSpace(totalCardHeight);

      // Card Background Box
      pdf.setFillColor(252, 252, 253);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, currentY, contentWidth, totalCardHeight, 1.5, 1.5, 'FD');

      // Card Header Line
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${idx + 1}. ${canonicalTerm}`, margin + 4, currentY + 6);

      // Status Badge
      const statusColor: [number, number, number] =
        card.classification === 'matched'
          ? [5, 150, 105]
          : card.classification === 'can_improve'
          ? [13, 148, 136]
          : card.classification === 'missing'
          ? [225, 29, 72]
          : [180, 83, 9];

      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.setFontSize(8);
      pdf.text(`[${statusLabel}]`, margin + 70, currentY + 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Priority: ${priorityLabel}`, pageWidth - margin - 4, currentY + 6, { align: 'right' });

      let subY = currentY + 11;

      // 1. Job Asks text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(51, 65, 85);
      pdf.text(askLines, margin + 4, subY);
      subY += askLines.length * 3.6 + 1.5;

      // 2. Resume Evidence
      pdf.setTextColor(15, 23, 42);
      pdf.text(evidenceLines, margin + 4, subY);
      subY += evidenceLines.length * 3.6 + 1.5;

      // 3. Action
      pdf.setTextColor(30, 41, 59);
      pdf.text(actionLines, margin + 4, subY);
      subY += actionLines.length * 3.6 + 1.5;

      // Suggested rewrite box if present
      if (rewriteLines.length > 0) {
        pdf.setFillColor(240, 253, 250);
        pdf.setDrawColor(204, 251, 241);
        const rH = rewriteLines.length * 3.6 + 3;
        pdf.roundedRect(margin + 4, subY - 1, contentWidth - 8, rH, 1, 1, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(13, 148, 136);
        pdf.text(rewriteLines, margin + 6, subY + 2.5);
        subY += rH + 1.5;
      }

      currentY += totalCardHeight + 3.5;
    });

    // Add page numbers and footers across all pages
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(148, 163, 184);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, pageHeight - margin + 2, pageWidth - margin, pageHeight - margin + 2);
      pdf.text(
        'Generated by Compass Career Engine - Confidential Candidate Audit',
        margin,
        pageHeight - margin + 6
      );
      pdf.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - margin + 6, {
        align: 'right',
      });
    }

    const filename = getReportFilename(data, 'pdf');
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Failed to generate Job Match PDF:', err);
    return false;
  }
}
