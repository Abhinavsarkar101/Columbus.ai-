import { ingestResumeFile, detectRealFileType, MAX_RESUME_FILE_SIZE_BYTES } from '../src/lib/resumeIngestion';
import { parseRawResumeText } from '../src/lib/resumeParser';
import JSZip from 'jszip';

async function runIngestionTests() {
  console.log('--- Starting Resume Ingestion Integration Tests ---');

  // Test 1: Plain text file
  console.log('Testing TXT Ingestion...');
  const txtContent = `Abhinav Sarkar
abhinav.sarkar@iim.ac.in | +91 98201 45678 | Bengaluru, India | https://linkedin.com/in/abhinavsarkar

PROFESSIONAL SUMMARY
Strategic Product Manager with 5+ years driving B2B SaaS growth.

WORK EXPERIENCE
Senior Product Manager | Tecnotree Corporation
06/2021 - Present | Bengaluru, India
• Spearheaded enterprise digital catalog platform generating $4.2M ARR.
• Directed agile pod of 14 engineers across MTN and Airtel deployments.

EDUCATION
Indian Institute of Management (IIM)
Master of Business Administration (MBA) | 2019 - 2021

SKILLS
Product Strategy, Agile, Roadmap Planning, B2B SaaS
`;
  const txtBlob = new Blob([txtContent], { type: 'text/plain' });
  const txtFile = new File([txtBlob], 'resume.txt', { type: 'text/plain' });
  const txtResult = await ingestResumeFile(txtFile);
  if (txtResult.source !== 'txt') throw new Error(`Expected source txt, got ${txtResult.source}`);
  const txtParsed = parseRawResumeText(txtResult.text);
  if (txtParsed.data.fullName !== 'Abhinav Sarkar') throw new Error(`Expected name Abhinav Sarkar, got ${txtParsed.data.fullName}`);
  if (txtParsed.data.experience.length !== 1) throw new Error(`Expected 1 experience, got ${txtParsed.data.experience.length}`);
  console.log('✅ TXT Ingestion Passed!');

  // Test 2: HTML Ingestion
  console.log('Testing HTML Ingestion...');
  const htmlContent = `<!DOCTYPE html>
<html>
<body>
  <h1>Abhinav Sarkar</h1>
  <p>abhinav.sarkar@iim.ac.in | +91 98201 45678</p>
  <h2>EXPERIENCE</h2>
  <h3>Tecnotree Corporation - Product Manager</h3>
  <p>2021 - Present</p>
  <ul>
    <li>Managed DLPM platform across Airtel networks.</li>
  </ul>
</body>
</html>`;
  const htmlFile = new File([new Blob([htmlContent], { type: 'text/html' })], 'resume.html', { type: 'text/html' });
  const htmlResult = await ingestResumeFile(htmlFile);
  if (htmlResult.source !== 'html') throw new Error(`Expected source html, got ${htmlResult.source}`);
  if (!htmlResult.text.includes('Tecnotree Corporation')) throw new Error('HTML text missing Tecnotree Corporation');
  console.log('✅ HTML Ingestion Passed!');

  // Test 3: RTF Ingestion
  console.log('Testing RTF Ingestion...');
  const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Arial;}}
\\f0\\fs24 Abhinav Sarkar\\par
abhinav.sarkar@iim.ac.in\\par
EXPERIENCE\\par
Tecnotree Corporation\\par
• Led product delivery\\par
}`;
  const rtfFile = new File([new Blob([rtfContent], { type: 'application/rtf' })], 'resume.rtf', { type: 'application/rtf' });
  const rtfResult = await ingestResumeFile(rtfFile);
  if (rtfResult.source !== 'rtf') throw new Error(`Expected source rtf, got ${rtfResult.source}`);
  if (!rtfResult.text.includes('Abhinav Sarkar')) throw new Error('RTF missing name');
  console.log('✅ RTF Ingestion Passed!');

  // Test 4: DOCX Ingestion using synthetic docx zip
  console.log('Testing DOCX Ingestion...');
  const docxZip = new JSZip();
  docxZip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>');
  docxZip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Abhinav Sarkar</w:t></w:r></w:p>
    <w:p><w:r><w:t>abhinav.sarkar@iim.ac.in | +91 98201 45678</w:t></w:r></w:p>
    <w:p><w:r><w:t>EXPERIENCE</w:t></w:r></w:p>
    <w:p><w:r><w:t>Tecnotree Corporation - Senior Product Manager</w:t></w:r></w:p>
    <w:p><w:r><w:t>2021 - Present</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Scaled MTN telecom operations</w:t></w:r></w:p>
  </w:body>
</w:document>`);
  const docxBuffer = await docxZip.generateAsync({ type: 'arraybuffer' });
  const docxFile = new File([docxBuffer], 'resume.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const docxResult = await ingestResumeFile(docxFile);
  if (docxResult.source !== 'docx') throw new Error(`Expected source docx, got ${docxResult.source}`);
  if (!docxResult.text.includes('Abhinav Sarkar') || !docxResult.text.includes('Tecnotree Corporation')) {
    throw new Error(`DOCX text missing expected strings: ${docxResult.text}`);
  }
  console.log('✅ DOCX Ingestion Passed!');

  // Test 5: ODT Ingestion using synthetic odt zip
  console.log('Testing ODT Ingestion...');
  const odtZip = new JSZip();
  odtZip.file('mimetype', 'application/vnd.oasis.opendocument.text');
  odtZip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:text>
      <text:p>Abhinav Sarkar</text:p>
      <text:p>abhinav.sarkar@iim.ac.in</text:p>
      <text:p>EXPERIENCE</text:p>
      <text:p>Tecnotree Corporation</text:p>
    </office:text>
  </office:body>
</office:document-content>`);
  const odtBuffer = await odtZip.generateAsync({ type: 'arraybuffer' });
  const odtFile = new File([odtBuffer], 'resume.odt', { type: 'application/vnd.oasis.opendocument.text' });
  const odtResult = await ingestResumeFile(odtFile);
  if (odtResult.source !== 'odt') throw new Error(`Expected source odt, got ${odtResult.source}`);
  if (!odtResult.text.includes('Abhinav Sarkar')) throw new Error('ODT text missing expected strings');
  console.log('✅ ODT Ingestion Passed!');

  // Test 6: Legacy DOC rejection with friendly error
  console.log('Testing Legacy DOC detection...');
  const legacyDocBytes = new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
  const legacyFile = new File([legacyDocBytes.buffer], 'old_resume.doc', { type: 'application/msword' });
  let caughtLegacyError = false;
  try {
    await ingestResumeFile(legacyFile);
  } catch (err: any) {
    caughtLegacyError = true;
    if (!err.message.includes('.docx')) throw new Error(`Expected friendly .docx conversion hint, got: ${err.message}`);
  }
  if (!caughtLegacyError) throw new Error('Expected legacy doc to throw conversion error');
  console.log('✅ Legacy DOC detection Passed!');

  // Test 7: Renamed file detection (PDF renamed as .docx)
  console.log('Testing Renamed file extension detection...');
  const pdfBytes = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const renamedFile = new File([pdfBytes.buffer], 'spoofed.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const detected = await detectRealFileType(renamedFile);
  if (detected.type !== 'pdf') throw new Error(`Expected real type 'pdf', got '${detected.type}'`);
  console.log('✅ Renamed file detection Passed!');

  // Test 8: Empty file rejection
  console.log('Testing Empty file rejection...');
  const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
  let caughtEmpty = false;
  try {
    await ingestResumeFile(emptyFile);
  } catch (err: any) {
    caughtEmpty = true;
  }
  if (!caughtEmpty) throw new Error('Expected empty file rejection');
  console.log('✅ Empty file rejection Passed!');

  console.log('\n🎉 ALL INGESTION INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
}

runIngestionTests().catch((err) => {
  console.error('❌ Ingestion Test Failed:', err);
  process.exit(1);
});
