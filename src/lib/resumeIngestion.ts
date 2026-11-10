// Polyfill Promise.try for pdfjs-dist compatibility
if (typeof Promise !== 'undefined' && typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: (...args: any[]) => any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { createWorker } from 'tesseract.js';
import type { LiteParse as LiteParseType, ParseResult } from '@llamaindex/liteparse-wasm';

export const MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export type ResumeSourceType = 'pdf' | 'docx' | 'odt' | 'rtf' | 'html' | 'txt' | 'image';

export interface IngestionResult {
  text: string;
  source: ResumeSourceType;
  method: 'text' | 'ocr' | 'liteparse';
  warnings: string[];
  pageCount?: number;
  charCount: number;
  detectedType?: string;
  fileName: string;
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
 * Detect real file type from initial magic bytes
 */
export async function detectRealFileType(
  file: File | ArrayBuffer,
  fileName: string = ''
): Promise<{ type: ResumeSourceType | 'doc_legacy' | 'unsupported'; extension: string; mimeHint?: string }> {
  let buffer: ArrayBuffer;
  if (file instanceof File) {
    buffer = await file.slice(0, 4096).arrayBuffer();
  } else {
    buffer = file.slice(0, 4096);
  }

  const bytes = new Uint8Array(buffer);
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. PDF: %PDF (0x25, 0x50, 0x44, 0x46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { type: 'pdf', extension: 'pdf' };
  }

  // 2. Legacy DOC (OLE Compound File): D0 CF 11 E0 A1 B1 1A E1
  if (
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1 &&
    bytes[6] === 0x1a &&
    bytes[7] === 0xe1
  ) {
    return { type: 'doc_legacy', extension: 'doc' };
  }

  // 3. RTF: {\rtf (0x7B, 0x5C, 0x72, 0x74, 0x66)
  if (bytes[0] === 0x7b && bytes[1] === 0x5c && bytes[2] === 0x72 && bytes[3] === 0x74 && bytes[4] === 0x66) {
    return { type: 'rtf', extension: 'rtf' };
  }

  // 4. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { type: 'image', extension: 'png' };
  }

  // 5. JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { type: 'image', extension: 'jpg' };
  }

  // 6. WEBP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { type: 'image', extension: 'webp' };
  }

  // 7. ZIP-based containers (DOCX or ODT): PK\x03\x04
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    try {
      const fullBuffer = file instanceof File ? await file.arrayBuffer() : file;
      const zip = await JSZip.loadAsync(fullBuffer);
      if (zip.file('word/document.xml')) {
        return { type: 'docx', extension: 'docx' };
      }
      if (zip.file('content.xml')) {
        return { type: 'odt', extension: 'odt' };
      }
    } catch {
      // not a readable zip
    }
  }

  // 8. HTML check: starts with <!doctype html or <html or contains <head/<body
  const textSample = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 1024)).trim();
  if (/^<!DOCTYPE\s+html/i.test(textSample) || /^<html\b/i.test(textSample) || /<body[\s>]/i.test(textSample)) {
    return { type: 'html', extension: 'html' };
  }

  // 9. Plain Text / Markdown check: ensure no binary null bytes or non-printable control chars
  let binaryCharCount = 0;
  for (let i = 0; i < Math.min(bytes.length, 512); i++) {
    const b = bytes[i];
    if (b === 0 || (b < 9 && b !== 0) || (b > 13 && b < 32 && b !== 27)) {
      binaryCharCount++;
    }
  }

  if (binaryCharCount === 0) {
    return { type: 'txt', extension: ext === 'md' ? 'md' : 'txt' };
  }

  // If extension is known, check if it's unsupported
  const unsupportedExts = ['pages', 'zip', 'rar', 'tar', 'gz', '7z', 'exe', 'bin', 'dmg', 'iso'];
  if (unsupportedExts.includes(ext)) {
    return { type: 'unsupported', extension: ext };
  }

  return { type: 'unsupported', extension: ext || 'unknown' };
}

/**
 * Shared Normalization across all extractors
 */
export function normalizeExtractedText(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 1. Remove non-printable / zero-width characters (except \t, \n, \r)
  text = text.replace(/[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  // 2. Normalize carriage returns
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Unify bullet glyphs
  // •, ●, ▪, ▫, ◦, ‣, ⁃, ➢, ✓, ✔, \uF0B7, \u2022, \u25CF, \u25AA, \u25BA, etc.
  text = text.replace(/^[ \t]*[•●▪▫◦‣⁃➢✓✔\uF0B7\u2022\u25CF\u25AA\u25BA\u25CB\u25AA\u25AB\u2043\u2219]\s*/gm, '• ');
  // Also replace inline or leading asterisks/dashes that act as bullets
  text = text.replace(/^[ \t]*[-*–]\s+/gm, '• ');

  // 4. Repair hyphenated line breaks (e.g. "devel-\nopment" -> "development")
  text = text.replace(/(\b[a-zA-Z]{3,})-\n([a-zA-Z]{3,}\b)/g, '$1$2');

  // 5. Rejoin URLs and emails wrapped across lines
  // e.g. "https\n://www.linkedin.com" or "https:\n//www.linkedin.com"
  text = text.replace(/https?\s*:\s*\/\s*\/\s*\n?\s*/gi, 'https://');
  text = text.replace(/(https?:\/\/[^\s\n]+)\n([a-zA-Z0-9_\-\.\/]+)/gi, '$1$2');
  // Rejoin linkedin.com URL fragments
  text = text.replace(/linkedin\s*\.\s*com\s*\/\s*\n?\s*in\s*\/\s*\n?\s*/gi, 'linkedin.com/in/');
  // Fix dangling https followed on same or next line by linkedin.com
  text = text.replace(/\bhttps?\b\s+(?:www\.)?linkedin\.com/gi, 'https://linkedin.com');
  // Rejoin wrapped email addresses
  text = text.replace(/([a-zA-Z0-9._%+-]+)\s*\n\s*@\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1@$2');
  text = text.replace(/([a-zA-Z0-9._%+-]+@)\s*\n\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1$2');

  // 6. Collapse repeated horizontal spaces/tabs (keep newlines)
  text = text.replace(/[^\S\r\n]+/g, ' ');

  // 7. Clean excessive blank lines (more than 2 consecutive newlines -> 2 newlines)
  text = text.replace(/\n{3,}/g, '\n\n');

  // 8. Truncate pathological input (e.g. infinite loops or huge junk files)
  const MAX_CHAR_LIMIT = 200000;
  return text.trim();
}

let wasmInitPromise: Promise<{ LiteParseClass: any } | null> | null = null;

async function ensureLiteParseInitialized(): Promise<{ LiteParseClass: any } | null> {
  if (!wasmInitPromise) {
    wasmInitPromise = (async () => {
      try {
        const lpModule = await import('@llamaindex/liteparse-wasm');
        if (typeof window === 'undefined') {
          const fs = await import('fs');
          const path = await import('path');
          const wasmPath = path.resolve('node_modules/@llamaindex/liteparse-wasm/pkg/liteparse_wasm_bg.wasm');
          if (fs.existsSync(wasmPath)) {
            const wasmBuf = fs.readFileSync(wasmPath);
            const initFn = lpModule.default || (lpModule as any).init;
            await initFn(wasmBuf);
            return { LiteParseClass: lpModule.LiteParse };
          }
        }
        const wasmUrlModule = await import('@llamaindex/liteparse-wasm/liteparse_wasm_bg.wasm?url');
        const initFn = lpModule.default || (lpModule as any).init;
        const url = wasmUrlModule.default || wasmUrlModule;
        await initFn({ module_or_path: url });
        return { LiteParseClass: lpModule.LiteParse };
      } catch (err) {
        console.warn('LiteParse WASM initialization deferred, using PDF.js fallback:', err);
        return null;
      }
    })();
  }
  return await wasmInitPromise;
}

/**
 * Spatial PDF Extraction using LiteParse WASM (Apache-2.0)
 * Uses WebAssembly spatial bounding boxes and layout block classification.
 */
export async function extractTextWithLiteParse(
  arrayBuffer: ArrayBuffer,
  onProgress?: (msg: string) => void
): Promise<{ text: string; pageCount: number; isLikelyScanned: boolean } | null> {
  try {
    if (onProgress) onProgress('Initializing LiteParse WASM spatial parser…');
    const lpInit = await ensureLiteParseInitialized();
    if (!lpInit || !lpInit.LiteParseClass) return null;

    if (onProgress) onProgress('Extracting PDF layout blocks with LiteParse WASM…');
    const parser = new lpInit.LiteParseClass({
      outputFormat: 'markdown',
      extractBlocks: true,
      extractContentBounds: true,
    });

    const uint8Bytes = new Uint8Array(arrayBuffer);
    const result: ParseResult = await parser.parse(uint8Bytes);

    if (!result || !result.pages || result.pages.length === 0) {
      return null;
    }

    const pageCount = result.totalPages || result.pages.length;
    let totalTextLength = 0;
    const pageStrings: string[] = [];

    for (const page of result.pages) {
      let pageText = '';
      if (page.textItems && page.textItems.length > 8) {
        const pageWidth = page.width || 612;
        const validItems = page.textItems
          .map((ti) => ({
            str: ti.text,
            x: ti.x,
            y: ti.y,
            width: ti.width,
            height: ti.height || ti.fontSize || 10,
          }))
          .filter((it) => it.str && it.str.trim().length > 0);

        // Dynamic multi-column detection: find continuous vertical whitespace gap
        const buckets = new Array(Math.ceil(pageWidth / 5)).fill(0);
        for (const item of validItems) {
          const startB = Math.floor(item.x / 5);
          const endB = Math.floor((item.x + item.width) / 5);
          for (let b = Math.max(0, startB); b <= Math.min(buckets.length - 1, endB); b++) {
            buckets[b]++;
          }
        }

        const startIdx = Math.floor((pageWidth * 0.20) / 5);
        const endIdx = Math.floor((pageWidth * 0.80) / 5);
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
        if (bestGapWidth >= 2) { // Gap >= 10pt
          const gapXStart = bestGapStart * 5;
          const gapXEnd = (bestGapStart + bestGapWidth) * 5;
          const splitX = (gapXStart + gapXEnd) / 2;

          const col1Items = validItems.filter((it) => it.x + it.width < splitX + 8);
          const col2Items = validItems.filter((it) => it.x >= splitX - 8);
          const spanningItems = validItems.filter((it) => it.x < splitX - 15 && it.x + it.width > splitX + 15);

          if (col1Items.length >= 8 && col2Items.length >= 8 && spanningItems.length < (col1Items.length + col2Items.length) * 0.18) {
            hasTwoColumns = true;
            const col1Text = buildTextFromItems(col1Items, true);
            const col2Text = buildTextFromItems(col2Items, true);
            pageText = `${col1Text}\n\n${col2Text}`;
          }
        }

        if (!hasTwoColumns) {
          pageText = buildTextFromItems(validItems, true);
        }
      } else if (page.markdown && page.markdown.trim()) {
        pageText = page.markdown.trim();
      } else if (page.text && page.text.trim()) {
        pageText = page.text.trim();
      }

      totalTextLength += pageText.replace(/\s+/g, '').length;
      if (pageText) {
        pageStrings.push(pageText);
      }
    }

    const fullText = pageStrings.join('\n\n--- PAGE BREAK ---\n\n');
    const isLikelyScanned = totalTextLength < 80;

    return {
      text: fullText,
      pageCount,
      isLikelyScanned,
    };
  } catch (err) {
    console.warn('LiteParse WASM parse note, falling back to PDF.js:', err);
    return null;
  }
}

/**
 * Text PDF Extraction with PDF.js
 * Groups text items into lines by Y-coordinate, clusters columns, detects vertical gaps.
 */
export async function extractTextFromPdfWithCoordinates(
  arrayBuffer: ArrayBuffer,
  onProgress?: (msg: string) => void
): Promise<{ text: string; pageCount: number; isLikelyScanned: boolean }> {
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
    try {
      pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: false,
        disableFontFace: true,
        disableAutoFetch: true,
        disableStream: true,
      }).promise;
    } catch (err2: any) {
      throw new Error(`PDF decoding error: ${err?.message || 'Invalid or corrupt PDF document'}`);
    }
  }

  const pageCount = pdf.numPages;
  const pageTexts: string[] = [];
  let totalChars = 0;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    if (onProgress) {
      onProgress(`Reading PDF page ${pageNum} of ${pageCount}…`);
    }

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent({ normalizeWhitespace: true });
    const items = textContent.items as Array<{
      str: string;
      transform: number[]; // [scaleX, skewY, skewX, scaleY, transX, transY]
      width: number;
      height: number;
    }>;

    if (!items || items.length === 0) {
      pageTexts.push('');
      continue;
    }

    // Filter out completely empty items
    const validItems = items
      .map((it) => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        width: it.width || 0,
        height: it.height || Math.abs(it.transform[0]) || 10,
      }))
      .filter((it) => it.str && it.str.trim().length > 0);

    if (validItems.length === 0) {
      pageTexts.push('');
      continue;
    }

    // Check for Two-Column / Sidebar Layout:
    // Cluster X coordinates to see if there's a distinct 2-column division (e.g. sidebar < 35% width, main > 40%)
    const pageWidth = viewport.width || 612; // default A4/letter ~ 595 - 612 pt
    const midSplit = pageWidth * 0.38;

    // Check how many items are strictly on left vs strictly on right
    const leftItems = validItems.filter((it) => it.x + it.width < midSplit);
    const rightItems = validItems.filter((it) => it.x >= midSplit - 15);
    const spansAcross = validItems.filter((it) => it.x < midSplit - 20 && it.x + it.width > midSplit + 20);

    const isTwoColumn =
      leftItems.length > 8 &&
      rightItems.length > 8 &&
      spansAcross.length < (leftItems.length + rightItems.length) * 0.15;

    let processedPageText = '';

    if (isTwoColumn) {
      // Process Column 1 then Column 2 (or Header items that span across first)
      const headerItems = validItems.filter((it) => it.y > viewport.height * 0.85 && it.width > pageWidth * 0.4);
      const remainingLeft = leftItems.filter((it) => !headerItems.includes(it));
      const remainingRight = rightItems.filter((it) => !headerItems.includes(it));

      const headerText = buildTextFromItems(headerItems);
      const col1Text = buildTextFromItems(remainingLeft);
      const col2Text = buildTextFromItems(remainingRight);

      processedPageText = [headerText, col1Text, col2Text].filter(Boolean).join('\n\n');
    } else {
      // Standard single-column or linear layout
      processedPageText = buildTextFromItems(validItems);
    }

    totalChars += processedPageText.replace(/\s+/g, '').length;
    pageTexts.push(processedPageText);
  }

  const isLikelyScanned = totalChars < 80;
  const fullText = pageTexts.join('\n\n--- PAGE BREAK ---\n\n');

  return {
    text: fullText,
    pageCount,
    isLikelyScanned,
  };
}

/**
 * Group text items into lines by Y coordinate (within tolerance), sort top-to-bottom, left-to-right.
 */
function buildTextFromItems(
  items: Array<{ str: string; x: number; y: number; width: number; height: number }>,
  isTopOrigin = false
): string {
  if (items.length === 0) return '';

  const Y_TOLERANCE = 3.0; // points tolerance for same line

  // Group by Y
  interface TextLine {
    y: number;
    items: Array<{ str: string; x: number; width: number; height: number }>;
  }

  const lines: TextLine[] = [];

  for (const item of items) {
    let matchedLine = lines.find((line) => Math.abs(line.y - item.y) <= Y_TOLERANCE);
    if (!matchedLine) {
      matchedLine = { y: item.y, items: [] };
      lines.push(matchedLine);
    }
    matchedLine.items.push(item);
  }

  // Sort lines top-to-bottom
  if (isTopOrigin) {
    lines.sort((a, b) => a.y - b.y);
  } else {
    lines.sort((a, b) => b.y - a.y);
  }

  const formattedLines: string[] = [];
  let prevY: number | null = null;
  let typicalLineHeight = 12;

  // Calculate median line height
  const heights = items.map((i) => i.height).filter((h) => h > 4 && h < 36);
  if (heights.length > 0) {
    heights.sort((a, b) => a - b);
    typicalLineHeight = heights[Math.floor(heights.length / 2)] || 12;
  }

  for (const line of lines) {
    // Sort items within line left-to-right
    line.items.sort((a, b) => a.x - b.x);

    let lineStr = '';
    for (let i = 0; i < line.items.length; i++) {
      const it = line.items[i];
      if (i === 0) {
        lineStr += it.str;
      } else {
        const prev = line.items[i - 1];
        const gap = it.x - (prev.x + prev.width);
        // If there's a distinct space between words or columns
        if (gap > 12) {
          lineStr += '   ' + it.str;
        } else if (gap > 1.5) {
          lineStr += ' ' + it.str;
        } else {
          // Attached characters or kerning
          lineStr += it.str;
        }
      }
    }

    const trimmedLine = lineStr.trim();
    if (!trimmedLine) continue;

    // Detect larger vertical gap between lines -> insert extra blank line
    if (prevY !== null) {
      const vGap = prevY - line.y;
      if (vGap > typicalLineHeight * 1.6) {
        formattedLines.push(''); // blank line
      }
    }

    formattedLines.push(trimmedLine);
    prevY = line.y;
  }

  return formattedLines.join('\n');
}

/**
 * Client-Side OCR for scanned PDF / image resumes using tesseract.js
 */
export async function performClientOcr(
  source: Blob | File | ArrayBuffer,
  fileType: 'pdf' | 'image',
  onProgress?: (msg: string) => void
): Promise<{ text: string; pageCount: number }> {
  if (onProgress) {
    onProgress('Initializing OCR engine (client-side)…');
  }

  const worker = await createWorker('eng');

  try {
    if (fileType === 'pdf') {
      const arrayBuffer = source instanceof ArrayBuffer ? source : await (source as Blob).arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const maxPages = Math.min(pdf.numPages, 3); // process up to first 3 pages for performance
      const ocrPages: string[] = [];

      for (let p = 1; p <= maxPages; p++) {
        if (onProgress) {
          onProgress(`Running OCR… page ${p} of ${maxPages}`);
        }
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better OCR accuracy
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) continue;

        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;

        const ret = await worker.recognize(canvas);
        ocrPages.push(ret.data.text);
      }

      await worker.terminate();
      return { text: ocrPages.join('\n\n--- PAGE BREAK ---\n\n'), pageCount: maxPages };
    } else {
      // Image file (PNG, JPG, WEBP)
      if (onProgress) {
        onProgress('Running OCR on resume image…');
      }
      const imageBlob = source instanceof Blob ? source : new Blob([source]);
      const ret = await worker.recognize(imageBlob);
      await worker.terminate();
      return { text: ret.data.text, pageCount: 1 };
    }
  } catch (err: any) {
    try {
      await worker.terminate();
    } catch {}
    throw new Error(`OCR processing failed: ${err?.message || 'Unable to recognize text from scanned image'}`);
  }
}

/**
 * DOCX Extraction using Mammoth
 * Preserves paragraphs, table rows, and list bullets.
 */
export async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const options: any = { arrayBuffer };
  if (typeof Buffer !== 'undefined') {
    options.buffer = Buffer.from(arrayBuffer);
  }

  // Use convertToHtml to preserve tables, paragraphs, and list items
  const result = await mammoth.convertToHtml(options);
  const html = result.value || '';

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Convert list items to bullets
    doc.querySelectorAll('li').forEach((li) => {
      li.textContent = `• ${li.textContent?.trim() || ''}`;
    });

    // Convert table rows to lines with cell separation
    doc.querySelectorAll('tr').forEach((tr) => {
      const cellTexts = Array.from(tr.querySelectorAll('td, th')).map((c) => c.textContent?.trim() || '');
      tr.textContent = cellTexts.filter(Boolean).join(' | ');
    });

    // Replace block elements with newlines
    doc.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, tr').forEach((el) => {
      el.textContent = `${el.textContent?.trim() || ''}\n`;
    });

    const bodyText = doc.body.textContent || '';
    return bodyText;
  }

  // Fallback for non-DOM environments
  return html
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>\s*<td[^>]*>/gi, ' | ')
    .replace(/<\/(p|div|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * ODT Extraction using JSZip
 * Reads content.xml and extracts <text:h>, <text:p>, and <text:list-item>
 */
export async function extractTextFromOdt(arrayBuffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const contentXmlFile = zip.file('content.xml');
  if (!contentXmlFile) {
    throw new Error('Invalid ODT document: missing content.xml');
  }

  const xmlText = await contentXmlFile.async('string');

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    const lines: string[] = [];

    // Traverse document body nodes
    const body = doc.querySelector('office\\:body, body');
    if (!body) {
      return xmlText.replace(/<[^>]+>/g, ' ');
    }

    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_ELEMENT);
    let currentNode = walker.currentNode as Element;

    while (currentNode) {
      const tagName = currentNode.tagName.toLowerCase();
      if (tagName.endsWith(':h')) {
        const heading = currentNode.textContent?.trim();
        if (heading) lines.push(`\n${heading}\n`);
      } else if (tagName.endsWith(':list-item')) {
        const itemText = currentNode.textContent?.trim();
        if (itemText) lines.push(`• ${itemText}`);
      } else if (tagName.endsWith(':p')) {
        // Check if this paragraph is inside a list item already handled
        if (!currentNode.closest('text\\:list-item, list-item')) {
          const pText = currentNode.textContent?.trim();
          if (pText) lines.push(pText);
        }
      }
      currentNode = walker.nextNode() as Element;
    }

    return lines.join('\n');
  }

  // Non-DOM fallback
  const matches = xmlText.match(/<text:[ph][^>]*>([\s\S]*?)<\/text:[ph]>/g) || [];
  const lines = matches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  return lines.join('\n');
}

/**
 * RTF Extraction
 * Strips control words, groups, decodes \'hh escapes, preserves paragraphs
 */
export function extractTextFromRtf(rtfString: string): string {
  // Strip RTF destination header groups (fonttbl, colortbl, stylesheet, generator, info, pict)
  let text = rtfString.replace(/\{\\(?:fonttbl|colortbl|stylesheet|generator|info|pict)[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gi, ' ');

  // Decode hex character escapes: \'hh
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => {
    try {
      const code = parseInt(hex, 16);
      return String.fromCharCode(code);
    } catch {
      return '';
    }
  });

  // Decode unicode escapes: \uN?
  text = text.replace(/\\u(-?\d+)\??/g, (_, dec) => {
    try {
      let code = parseInt(dec, 10);
      if (code < 0) code += 65536;
      return String.fromCharCode(code);
    } catch {
      return '';
    }
  });

  // Convert paragraph and tab breaks
  text = text.replace(/\\par[d]?\b/gi, '\n');
  text = text.replace(/\\tab\b/gi, '\t');
  text = text.replace(/\\line\b/gi, '\n');

  // Strip remaining RTF control words: \word or \word123
  text = text.replace(/\\[a-zA-Z]+-?\d*\s?/g, ' ');

  // Remove curly braces {}
  text = text.replace(/[{}]/g, '');

  return text;
}

/**
 * HTML Extraction
 * Cleans script/style and converts block elements & list items into formatted lines
 */
export function extractTextFromHtmlDocument(htmlString: string): string {
  if (typeof DOMParser === 'undefined') {
    return htmlString.replace(/<[^>]+>/g, ' ');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Remove unwanted elements
  doc.querySelectorAll('script, style, noscript, svg, nav, footer, header').forEach((el) => el.remove());

  // Bullets for list items
  doc.querySelectorAll('li').forEach((li) => {
    li.textContent = `• ${li.textContent?.trim() || ''}\n`;
  });

  // Newlines for block elements
  doc.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, tr, br').forEach((el) => {
    if (el.tagName.toLowerCase() === 'br') {
      el.replaceWith('\n');
    } else {
      el.textContent = `${el.textContent?.trim() || ''}\n`;
    }
  });

  return doc.body.textContent || '';
}

/**
 * Plain Text / Markdown Extraction
 * Handles encodings and normalizes Markdown
 */
export function extractTextFromPlainText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let encoding = 'utf-8';

  // Check UTF-16 BOM
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    encoding = 'utf-16le';
  } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    encoding = 'utf-16be';
  }

  let text = '';
  try {
    text = new TextDecoder(encoding).decode(buffer);
  } catch {
    text = new TextDecoder('windows-1252').decode(buffer);
  }

  // Strip Markdown bold/italic markers (*, _, ~~) while preserving content
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/~~(.*?)~~/g, '$1');
  text = text.replace(/^#{1,6}\s+(.*)$/gm, '$1'); // Strip # headings
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)'); // Markdown links [text](url) -> text (url)

  return text;
}

/**
 * Single Main Ingestion Router: ingestResumeFile(file, onProgress)
 * Enforces size limits, validates magic bytes, routes extraction, normalizes result.
 */
export async function ingestResumeFile(
  file: File,
  onProgress?: (msg: string) => void
): Promise<IngestionResult> {
  const warnings: string[] = [];

  // 1. Validate size and reject empty files
  if (!file || file.size === 0) {
    throw new Error('The selected file is empty (0 bytes). Please upload a valid resume file.');
  }

  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5 MB limit. Please upload a smaller resume file.`
    );
  }

  // 2. Real type detection via magic bytes
  if (onProgress) onProgress('Detecting file format…');
  const buffer = await file.arrayBuffer();
  const detection = await detectRealFileType(buffer, file.name);

  // Check for legacy .doc
  if (detection.type === 'doc_legacy') {
    throw new Error(
      "Old .doc files aren't supported. Please open it in Microsoft Word or Google Docs and save as .docx or PDF, or paste the text directly."
    );
  }

  if (detection.type === 'unsupported') {
    throw new Error(
      `Unsupported file format (.${detection.extension || 'file'}). Supported formats: PDF, DOCX, ODT, TXT, MD, RTF, HTML, and images (PNG, JPG, WEBP).`
    );
  }

  let extractedRaw = '';
  let method: 'text' | 'ocr' | 'liteparse' = 'text';
  let pageCount: number | undefined = undefined;
  const sourceType = detection.type as ResumeSourceType;

  // 3. Extract based on real type
  switch (sourceType) {
    case 'pdf': {
      if (onProgress) onProgress('Reading PDF structure…');
      let pdfRes = await extractTextWithLiteParse(buffer, onProgress);
      if (pdfRes && pdfRes.text && pdfRes.text.trim().length >= 30) {
        method = 'liteparse';
        warnings.push('PDF parsed using LiteParse WASM spatial layout engine.');
      } else {
        pdfRes = await extractTextFromPdfWithCoordinates(buffer, onProgress);
      }

      pageCount = pdfRes.pageCount;

      if (pdfRes.isLikelyScanned) {
        // Scanned PDF fallback to OCR
        warnings.push('Scanned PDF detected: running client-side OCR. Please review extracted fields carefully.');
        if (onProgress) onProgress('Scanned document detected. Running client-side OCR…');
        try {
          const ocrRes = await performClientOcr(buffer, 'pdf', onProgress);
          extractedRaw = ocrRes.text;
          method = 'ocr';
          pageCount = ocrRes.pageCount;
        } catch (ocrErr: any) {
          warnings.push(`OCR fallback warning: ${ocrErr?.message || 'OCR could not process page'}`);
          extractedRaw = pdfRes.text; // fallback to whatever text was found
        }
      } else {
        extractedRaw = pdfRes.text;
      }
      break;
    }

    case 'docx': {
      if (onProgress) onProgress('Reading DOCX structure & tables…');
      extractedRaw = await extractTextFromDocx(buffer);
      break;
    }

    case 'odt': {
      if (onProgress) onProgress('Reading OpenDocument Text…');
      extractedRaw = await extractTextFromOdt(buffer);
      break;
    }

    case 'rtf': {
      if (onProgress) onProgress('Reading Rich Text Format…');
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rtfString = textDecoder.decode(buffer);
      extractedRaw = extractTextFromRtf(rtfString);
      break;
    }

    case 'html': {
      if (onProgress) onProgress('Reading HTML resume…');
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const htmlString = textDecoder.decode(buffer);
      extractedRaw = extractTextFromHtmlDocument(htmlString);
      break;
    }

    case 'image': {
      if (onProgress) onProgress('Scanning resume image with OCR…');
      warnings.push('Image resume: text extracted via OCR. Please verify all details.');
      const ocrRes = await performClientOcr(file, 'image', onProgress);
      extractedRaw = ocrRes.text;
      method = 'ocr';
      pageCount = 1;
      break;
    }

    case 'txt':
    default: {
      if (onProgress) onProgress('Reading text content…');
      extractedRaw = extractTextFromPlainText(buffer);
      break;
    }
  }

  // 4. Shared Normalization
  if (onProgress) onProgress('Normalizing resume text…');
  const normalized = normalizeExtractedText(extractedRaw);

  if (!normalized || normalized.trim().length < 20) {
    throw new Error(
      'Could not extract readable text from this file. It may be empty or corrupted. Please try pasting the text instead.'
    );
  }

  return {
    text: normalized,
    source: sourceType,
    method,
    warnings,
    pageCount,
    charCount: normalized.length,
    detectedType: detection.extension,
    fileName: file.name,
  };
}
