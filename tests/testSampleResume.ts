import init, { LiteParse } from '../node_modules/@llamaindex/liteparse-wasm/pkg/liteparse_wasm.js';
import { parseRawResumeText } from '../src/lib/resumeParser';
import fs from 'fs';

function buildTextFromItems(
  items: Array<{ str: string; x: number; y: number; width: number; height: number }>,
  isTopOrigin = false
): string {
  if (items.length === 0) return '';
  const Y_TOLERANCE = 3.0;

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

  if (isTopOrigin) {
    lines.sort((a, b) => a.y - b.y);
  } else {
    lines.sort((a, b) => b.y - a.y);
  }

  const formattedLines: string[] = [];
  let prevY: number | null = null;
  let typicalLineHeight = 12;

  const heights = items.map((i) => i.height).filter((h) => h > 4 && h < 36);
  if (heights.length > 0) {
    heights.sort((a, b) => a - b);
    typicalLineHeight = heights[Math.floor(heights.length / 2)] || 12;
  }

  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    let lineStr = '';
    for (let i = 0; i < line.items.length; i++) {
      const it = line.items[i];
      if (i === 0) {
        lineStr += it.str;
      } else {
        const prev = line.items[i - 1];
        const gap = it.x - (prev.x + prev.width);
        if (gap > 12) {
          lineStr += '   ' + it.str;
        } else if (gap > 1.5) {
          lineStr += ' ' + it.str;
        } else {
          lineStr += it.str;
        }
      }
    }

    const trimmedLine = lineStr.trim();
    if (!trimmedLine) continue;

    if (prevY !== null) {
      const vGap = Math.abs(prevY - line.y);
      if (vGap > typicalLineHeight * 1.6) {
        formattedLines.push('');
      }
    }

    formattedLines.push(trimmedLine);
    prevY = line.y;
  }

  return formattedLines.join('\n');
}

async function testSampleResume() {
  const wasmBuffer = fs.readFileSync('./node_modules/@llamaindex/liteparse-wasm/pkg/liteparse_wasm_bg.wasm');
  await init(wasmBuffer);

  const parser = new LiteParse({
    outputFormat: 'markdown',
    extractBlocks: true,
  });

  const pdfBuffer = fs.readFileSync('public/assets/aistudio/my_resume_11th_oct_d2b1bb6b.pdf');
  const res = await parser.parse(new Uint8Array(pdfBuffer));
  const page = res.pages[0];

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

  // Check column split points (right sidebar ~65% width)
  const colSplit = pageWidth * 0.65;
  const leftItems = validItems.filter((it) => it.x + it.width < colSplit + 15);
  const rightItems = validItems.filter((it) => it.x >= colSplit - 15);

  const col1Text = buildTextFromItems(leftItems, true);
  const col2Text = buildTextFromItems(rightItems, true);

  const fullDocText = `${col1Text}\n\n${col2Text}`;

  console.log('--- RECONSTRUCTED TEXT ---\n', fullDocText.slice(0, 1200));

  const parsed = parseRawResumeText(fullDocText);
  console.log('\n--- PARSED MODEL SUMMARY ---');
  console.log('Full Name:', parsed.data.fullName);
  console.log('Headline:', parsed.data.headline);
  console.log('Email:', parsed.data.email);
  console.log('Phone:', parsed.data.phone);
  console.log('Location:', parsed.data.location);
  console.log('LinkedIn:', parsed.data.linkedinUrl);
  console.log('Experience Entries:', parsed.data.experience.length);
  parsed.data.experience.forEach((e, i) => console.log(`  [Exp ${i + 1}] Role: "${e.role}", Company: "${e.company}", Dates: "${e.startDate} - ${e.endDate}", Bullets: ${e.bullets.length}`));
  console.log('Education Entries:', parsed.data.education.length);
  parsed.data.education.forEach((e, i) => console.log(`  [Edu ${i + 1}] Inst: "${e.institution}", Degree: "${e.degree}", Field: "${e.field}", Dates: "${e.startDate} - ${e.endDate}"`));
  console.log('Skill Categories:', parsed.data.skills.length);
  parsed.data.skills.forEach((s) => console.log(`  [Skill Cat: "${s.category}"] (${s.items.length} items):`, s.items.join(', ')));
  console.log('Certifications:', parsed.data.certifications.length);
  parsed.data.certifications.forEach((c) => console.log('  [Cert]', c));
  console.log('Custom Sections:', parsed.data.customSections.length);
  parsed.data.customSections.forEach((cs) => console.log(`  [Custom Section: "${cs.title}"] Kind: ${cs.kind}`));
}

testSampleResume();
