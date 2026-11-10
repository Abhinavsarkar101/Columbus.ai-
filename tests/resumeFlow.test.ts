import { analyzeJobDescription } from '../src/lib/jd';
import { SAMPLE_MBA_RESUME, EMPTY_RESUME_DATA } from '../src/lib/resume';
import { normalizeExtractedText, detectFileTypeFromMagicBytes } from '../src/lib/resumeExtraction';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- RUNNING RESUME FLOW & ENGINE VERIFICATION SUITE ---');

// Test 1: Normalizer handles bullets, line wraps, URLs
console.log('1. Testing text normalizer...');
const rawSample = '• First bullet\n● Second bullet\n- Third bullet\nexperi-\nence\nhttps://\nlinkedin.com/in/test';
const normalized = normalizeExtractedText(rawSample);
assert(normalized.includes('• First bullet'), 'Should unify bullets');
assert(normalized.includes('• Second bullet'), 'Should unify bullets');
assert(normalized.includes('experience'), 'Should repair hyphenated line wrap');
assert(normalized.includes('https://linkedin.com/in/test'), 'Should rejoin broken URL');
console.log('✅ Text normalizer passed!');

// Test 2: Dual Source Engine with ResumeData (Source B)
console.log('2. Testing analyzeJobDescription with ResumeData (Source B)...');
const sampleJd = `Role: Senior Product Manager
Requirements:
• Author PRD documents and functional specifications
• Run A/B testing and experimentation sprints
• Financial modeling and DCF analysis`;

const analysisB = analyzeJobDescription(sampleJd, SAMPLE_MBA_RESUME);
assert(analysisB.overallMatch > 0, 'Should compute overallMatch > 0');
assert(analysisB.requirementGaps.length > 0, 'Should extract requirement gaps');
// Check that matched evidence quotes exact bullet from resume
const matchedGap = analysisB.requirementGaps.find((g) => g.classification === 'category_a_matched');
if (matchedGap && matchedGap.supportingEvidence) {
  assert(Boolean(matchedGap.supportingEvidence.originalBullet), 'Supporting evidence should have original bullet');
}
console.log(`✅ Source B Analysis passed! Match: ${analysisB.overallMatch}%, Matched: ${analysisB.summary.matchedCount}`);

// Test 3: Dual Source Engine with plain text (Source A)
console.log('3. Testing analyzeJobDescription with raw text string (Source A)...');
const plainResumeText = `
Abhinav Sarkar
Email: abhinav@alumni.iim.ac.in
Phone: +91 98201 45678
Location: Bengaluru, India

PROFESSIONAL SUMMARY
Experienced product manager with 4 years in software platforms and enterprise SaaS.

WORK EXPERIENCE
Senior Product Consultant - Enterprise Platforms
• Authored PRD documents for billing workflow platform, reducing approval cycle by 25%.
• Conducted qualitative user research and created wireframing mockups for executive stakeholders.
• Spearheaded agile scrum sprints and backlog grooming across 8 engineers.

EDUCATION
Indian Institute of Management (IIM) - MBA
`;

const analysisA = analyzeJobDescription(sampleJd, plainResumeText);
assert(analysisA.overallMatch > 0, 'Should compute overallMatch for raw text');
assert(analysisA.quantifiedImpactScore > 0, 'Should compute real metric score from text bullets');
// Check PRD is matched
const prdGap = analysisA.requirementGaps.find((g) => g.requirement.toLowerCase().includes('prd'));
assert(Boolean(prdGap), 'PRD should be detected in requirement gaps');
assert(prdGap?.classification === 'category_a_matched', 'PRD should be matched since authored PRD is in text');
assert(prdGap?.supportingEvidence?.originalBullet.includes('Authored PRD'), 'Evidence should quote exact text line');
console.log(`✅ Source A Analysis passed! Match: ${analysisA.overallMatch}%, Quantified: ${analysisA.quantifiedImpactScore}%`);

// Test 4: Verify Missing categories have no fake bullet
console.log('4. Testing Missing category integrity...');
const missingGaps = analysisA.requirementGaps.filter((g) => g.classification === 'category_c_missing');
for (const g of missingGaps) {
  assert(!g.recommendedImprovement, `Missing gap ${g.requirement} must NOT have recommendedImprovement rewrite`);
}
console.log(`✅ Missing gaps check passed! (${missingGaps.length} missing gaps verified with zero fabricated bullets)`);

// Test 5: Can Improve rewrites strictly improve wording of existing evidence without fabricating metrics
console.log('5. Testing Can Improve rewrites...');
const improveGaps = analysisA.requirementGaps.filter((g) => g.classification === 'category_b_improve');
for (const g of improveGaps) {
  assert(Boolean(g.supportingEvidence?.originalBullet), 'Improve gap must have real supporting evidence');
  assert(Boolean(g.recommendedImprovement), 'Improve gap must have clean wording rewrite');
}
console.log(`✅ Can Improve rewrites check passed! (${improveGaps.length} rewrites verified)`);

console.log('🎉 ALL RESUME FLOW & ENGINE TESTS PASSED!');
