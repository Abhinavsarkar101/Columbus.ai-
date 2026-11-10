// Polyfill Promise.try for pdfjs-dist compatibility
if (typeof Promise !== 'undefined' && typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: (...args: any[]) => any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export const MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ExtractedResumeText {
  text: string;
  charCount: number;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt';
  pageCount?: number;
}

// PDF.js worker setup
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
    }
  }
} catch {
  // worker setup fallback
}

/**
 * Normalizes extracted text:
 * - Unifies bullet glyphs (•, ●, ▪, -, *)
 * - Repairs hyphen-wrapped words across line breaks
 * - Reconnects wrapped URLs and emails
 * - Normalizes whitespaces while preserving newlines
 */
export function normalizeExtractedText(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 1. Remove non-printable / zero-width characters (except \t, \n, \r)
  text = text.replace(/[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  // 2. Normalize carriage returns
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Unify bullet glyphs
  text = text.replace(/^[ \t]*[•●▪▫◦‣⁃➢✓✔\uF0B7\u2022\u25CF\u25AA\u25BA\u25CB\u2043\u2219]\s*/gm, '• ');
  text = text.replace(/^[ \t]*[-*–]\s+/gm, '• ');

  // 4. Repair hyphenated line breaks (e.g. "devel-\nopment" -> "development")
  text = text.replace(/(\b[a-zA-Z]{3,})-\n([a-zA-Z]{3,}\b)/g, '$1$2');

  // 5. Rejoin URLs and emails wrapped across lines
  text = text.replace(/https?\s*:\s*\/\s*\/\s*\n?\s*/gi, 'https://');
  text = text.replace(/(https?:\/\/[^\s\n]+)\n([a-zA-Z0-9_\-\.\/]+)/gi, '$1$2');
  text = text.replace(/linkedin\s*\.\s*com\s*\/\s*\n?\s*in\s*\/\s*\n?\s*/gi, 'linkedin.com/in/');
  text = text.replace(/\bhttps?\b\s+(?:www\.)?linkedin\.com/gi, 'https://linkedin.com');
  text = text.replace(/([a-zA-Z0-9._%+-]+)\s*\n\s*@\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1@$2');
  text = text.replace(/([a-zA-Z0-9._%+-]+@)\s*\n\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1$2');

  // 6. Collapse excessive inline whitespace (preserve newlines)
  text = text.replace(/[^\S\r\n]+/g, ' ');

  // 7. Limit excessive blank lines to max 2
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Detect file type via initial magic bytes
 */
export async function detectFileTypeFromMagicBytes(
  file: File
): Promise<'pdf' | 'docx' | 'txt' | 'unsupported'> {
  const headerSlice = await file.slice(0, 4096).arrayBuffer();
  const bytes = new Uint8Array(headerSlice);

  // 1. PDF: %PDF (0x25, 0x50, 0x44, 0x46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }

  // 2. ZIP-based container (DOCX): PK\x03\x04
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    try {
      const fullBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(fullBuffer);
      if (zip.file('word/document.xml')) {
        return 'docx';
      }
    } catch {
      // not a readable zip
    }
  }

  // 3. Plain Text: Check for absence of binary null bytes or excessive control chars
  let binaryCharCount = 0;
  for (let i = 0; i < Math.min(bytes.length, 512); i++) {
    const b = bytes[i];
    if (b === 0 || (b < 9 && b !== 0) || (b > 13 && b < 32 && b !== 27)) {
      binaryCharCount++;
    }
  }

  if (binaryCharCount === 0 && file.size > 0) {
    return 'txt';
  }

  return 'unsupported';
}

/**
 * Extract plain text from PDF using PDF.js with line clustering & column gutter detection
 */
export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  let pdf: any;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: true,
    });
    pdf = await loadingTask.promise;
  } catch (err: any) {
    if (err?.name === 'PasswordException' || /password/i.test(err?.message || '')) {
      throw new Error('This PDF is password-protected or encrypted. Please remove password protection and try again.');
    }
    throw new Error('The PDF document is corrupt or cannot be read.');
  }

  const pageCount = pdf.numPages;
  const pageTexts: string[] = [];
  let totalTextLength = 0;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;

    const items: Array<{ str: string; x: number; y: number; width: number; height: number }> = [];
    for (const item of textContent.items as any[]) {
      if (!item.str || item.str.trim().length === 0) continue;
      items.push({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width || 0,
        height: item.height || 10,
      });
    }

    if (items.length === 0) continue;

    // Detect 2-column layout via vertical gutter
    const bucketCount = Math.ceil(pageWidth / 5);
    const buckets = new Array(bucketCount).fill(0);
    for (const it of items) {
      const startB = Math.floor(it.x / 5);
      const endB = Math.floor((it.x + it.width) / 5);
      for (let b = Math.max(0, startB); b <= Math.min(bucketCount - 1, endB); b++) {
        buckets[b]++;
      }
    }

    const startIdx = Math.floor((pageWidth * 0.2) / 5);
    const endIdx = Math.floor((pageWidth * 0.8) / 5);
    let bestGapStart = -1;
    let bestGapWidth = 0;
    let currentGapStart = -1;
    let currentGapWidth = 0;

    for (let i = startIdx; i <= endIdx; i++) {
      if (buckets[i] <= 2) {
        if (currentGapStart === -1) currentGapStart = i;
        currentGapWidth++;
      } else {
        if (currentGapWidth > bestGapWidth) {
          bestGapWidth = currentGapWidth;
          bestGapStart = currentGapStart;
        }
        currentGapStart = -1;
        currentGapWidth = 0;
      }
    }
    if (currentGapWidth > bestGapWidth) {
      bestGapWidth = currentGapWidth;
      bestGapStart = currentGapStart;
    }

    let hasTwoColumns = false;
    let pageText = '';

    if (bestGapWidth >= 2) { // Gutter >= 10pt
      const gapXStart = bestGapStart * 5;
      const gapXEnd = (bestGapStart + bestGapWidth) * 5;
      const splitX = (gapXStart + gapXEnd) / 2;

      const col1Items = items.filter((it) => it.x + it.width < splitX + 8);
      const col2Items = items.filter((it) => it.x >= splitX - 8);

      if (col1Items.length >= 8 && col2Items.length >= 8) {
        hasTwoColumns = true;
        const col1Text = groupItemsIntoLines(col1Items);
        const col2Text = groupItemsIntoLines(col2Items);
        pageText = `${col1Text}\n\n${col2Text}`;
      }
    }

    if (!hasTwoColumns) {
      pageText = groupItemsIntoLines(items);
    }

    totalTextLength += pageText.replace(/\s+/g, '').length;
    if (pageText.trim()) {
      pageTexts.push(pageText);
    }
  }

  // Scanned PDF detection: if total non-whitespace chars across all pages < 80
  if (totalTextLength < 80) {
    throw new Error('This looks like a scanned file; please upload a text-based PDF, DOCX or TXT');
  }

  return {
    text: pageTexts.join('\n\n'),
    pageCount,
  };
}

/**
 * Groups PDF text items into lines by Y-coordinate tolerance and sorts top-to-bottom, left-to-right
 */
function groupItemsIntoLines(items: Array<{ str: string; x: number; y: number; width: number; height: number }>): string {
  // Sort primarily top-to-bottom (descending Y in PDF coordinates), secondarily left-to-right
  const sorted = [...items].sort((a, b) => {
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > 4) return yDiff;
    return a.x - b.x;
  });

  const lines: string[][] = [];
  let currentLine: Array<{ str: string; x: number; y: number; width: number }> = [];
  let currentY: number | null = null;

  for (const item of sorted) {
    if (currentY === null || Math.abs(item.y - currentY) <= 4) {
      currentLine.push(item);
      currentY = item.y;
    } else {
      if (currentLine.length > 0) {
        // Sort items in this line left-to-right
        currentLine.sort((a, b) => a.x - b.x);
        lines.push(currentLine.map((it) => it.str));
      }
      currentLine = [item];
      currentY = item.y;
    }
  }

  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push(currentLine.map((it) => it.str));
  }

  return lines.map((l) => l.join(' ').trim()).filter((l) => l.length > 0).join('\n');
}

/**
 * Extract plain text from DOCX using mammoth
 */
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  } catch (err: any) {
    throw new Error('Could not parse DOCX file. Please ensure it is a valid, uncorrupted Word document.');
  }
}

/**
 * Extract plain text from TXT with encoding fallback
 */
async function extractTextFromTxt(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check UTF-16 BOM
  if (bytes.length >= 2) {
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder('utf-16le').decode(buffer);
    }
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder('utf-16be').decode(buffer);
    }
  }

  // Try UTF-8
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    // Fallback to Windows-1252 / ISO-8859-1
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

/**
 * Main entry point: extracts plain text from uploaded resume file (PDF, DOCX, TXT)
 * Validates file size, magic bytes, encoding, and minimum character count
 */
export async function extractResumeFileText(file: File): Promise<ExtractedResumeText> {
  if (!file) {
    throw new Error('No file provided.');
  }

  if (file.size === 0) {
    throw new Error('The uploaded file is empty.');
  }

  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    throw new Error('File exceeds maximum size limit (5MB). Please upload a smaller file.');
  }

  const detectedType = await detectFileTypeFromMagicBytes(file);
  if (detectedType === 'unsupported') {
    throw new Error('Unsupported file type. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt) file.');
  }

  let rawText = '';
  let pageCount: number | undefined;

  const arrayBuffer = await file.arrayBuffer();

  if (detectedType === 'pdf') {
    const res = await extractTextFromPdf(arrayBuffer);
    rawText = res.text;
    pageCount = res.pageCount;
  } else if (detectedType === 'docx') {
    rawText = await extractTextFromDocx(arrayBuffer);
  } else {
    rawText = await extractTextFromTxt(file);
  }

  const normalized = normalizeExtractedText(rawText);

  // Character count guard (<200 chars treated as failed)
  if (normalized.length < 200) {
    throw new Error('This looks like a scanned file; please upload a text-based PDF, DOCX or TXT');
  }

  return {
    text: normalized,
    charCount: normalized.length,
    fileName: file.name,
    fileType: detectedType,
    pageCount,
  };
}
