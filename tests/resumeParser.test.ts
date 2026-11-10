import {
  segmentSections,
  extractHeaderCoordinates,
  parseDateRange,
  splitIntoAchievementBullets,
  parseSkillsSection,
  parseRawResumeText,
} from '../src/lib/resumeParser';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
}

console.log('--- Starting Resume Parser Phase 2 Test Suite ---');

// =========================================================================
// TEST 1: Clean Single-Column Resume (User's Resume: Abhinav Sarkar)
// =========================================================================
console.log('Testing Sample 1: Clean Single-Column (Abhinav Sarkar profile)...');
const sample1 = `
Abhinav Sarkar
Product & Strategy Lead | Ex-Tech Lead
Email: abhinav.sarkar@example.com | Phone: +91 98201 45678 | Bengaluru, India
LinkedIn: https://www.linkedin.com/in/abhinav-sarkar-mba

PROFESSIONAL SUMMARY
MBA candidate with 4+ years of cross-functional experience across software engineering, business analysis, and product strategy. Proven track record leading enterprise data platforms and optimizing unit economics.

WORK EXPERIENCE
Senior Product Consultant | Tecnotree Corporation
May 2024 – Present | Bengaluru, India
• Architected BSS/OSS digital monetization roadmap across MTN and Airtel telecom operators, driving projected $3.2M incremental ARR.
• Deployed DLPM and DAM lifecycle workflows for 12 enterprise clients, reducing manual provisioning latency by 45%.
• Led discovery sprints with 18 enterprise client stakeholders, transforming legacy billing specs into 24 user epics.

Product Engineer | FinTech Software Solutions
Aug 2021 – Apr 2024 | Bengaluru, India
• Spearheaded checkout reliability initiatives across 12,000+ merchants, decreasing drop-off rates from 8.4% to 2.9%.
• Built automated fraud anomaly detection scoring model handling 450+ TPS, saving $420K monthly.

EDUCATION
Premier Indian Institute of Management (IIM)
Master of Business Administration (MBA) in Strategy & Finance
2024 – 2026 | Bengaluru, India
GPA: 3.84 / 4.00

National Institute of Technology (NIT)
Bachelor of Technology (B.Tech) in Computer Science
2017 – 2021 | India
CGPA: 8.94 / 10.0

CORE SKILLS
Product & Strategy: Product Roadmapping, PRD Authoring, A/B Testing, Go-To-Market Strategy
Technical & Analytics: SQL, Python, Tableau, API Architecture, AWS Cloud
`;

const res1 = parseRawResumeText(sample1);
assert(res1.data.fullName === 'Abhinav Sarkar', `Expected name "Abhinav Sarkar", got "${res1.data.fullName}"`);
assert(res1.data.email === 'abhinav.sarkar@example.com', `Email mismatch: "${res1.data.email}"`);
assert(res1.data.phone.includes('98201 45678'), `Phone mismatch: "${res1.data.phone}"`);
assert(res1.data.location.includes('Bengaluru'), `Location mismatch: "${res1.data.location}"`);
assert(res1.data.linkedinUrl === 'https://linkedin.com/in/abhinav-sarkar-mba', `LinkedIn mismatch: "${res1.data.linkedinUrl}"`);
assert(!res1.data.linkedinUrl.includes('dangling'), 'LinkedIn should not contain dangling text');
assert(res1.data.experience.length === 2, `Expected 2 experience entries, got ${res1.data.experience.length}`);
assert(res1.data.experience[0].company.includes('Tecnotree'), `Expected Tecnotree company, got "${res1.data.experience[0].company}"`);
assert(res1.data.experience[0].bullets.length === 3, `Expected 3 bullets in entry 0, got ${res1.data.experience[0].bullets.length}`);
assert(res1.data.experience[0].bullets[0].includes('MTN and Airtel'), 'Bullet 1 should mention MTN and Airtel');
assert(res1.data.experience[0].bullets[1].includes('DLPM and DAM'), 'Bullet 2 should mention DLPM and DAM');
assert(res1.data.education.length === 2, `Expected 2 education entries, got ${res1.data.education.length}`);
assert(res1.data.skills.length >= 2, `Expected at least 2 skill categories, got ${res1.data.skills.length}`);
console.log('✅ Sample 1 Passed!');

// =========================================================================
// TEST 2: Inline Headings / Line Breaks Lost (The Current Bug)
// =========================================================================
console.log('Testing Sample 2: Inline Headings (Line breaks lost during extraction)...');
const sample2 = `Abhinav Sarkar abhinav.sarkar@example.com +91 98201 45678 Bengaluru, India linkedin.com/in/abhinav-sarkar-mba PROFESSIONAL SUMMARY Experienced product lead leading digital transformation. WORK EXPERIENCE Senior Product Consultant Tecnotree Corporation May 2024 – Present • Led DLPM and DAM rollout across MTN and Airtel telecom operators. • Achieved 99.98% platform SLA during migration. EDUCATION Premier Indian Institute of Management (IIM) Master of Business Administration 2024 – 2026 SKILLS Product Roadmapping, SQL, Python, Tableau, GTM Strategy`;

const res2 = parseRawResumeText(sample2);
assert(res2.data.fullName === 'Abhinav Sarkar', `Expected name "Abhinav Sarkar", got "${res2.data.fullName}"`);
assert(res2.data.summary.includes('Experienced product lead'), `Summary should be captured, got "${res2.data.summary}"`);
assert(!res2.data.summary.includes('WORK EXPERIENCE'), 'Summary must NOT contain WORK EXPERIENCE heading');
assert(res2.data.experience.length >= 1, `Experience should have at least 1 entry, got ${res2.data.experience.length}`);
assert(res2.data.experience[0].bullets.length >= 2, `Bullets should be separated, got ${res2.data.experience[0].bullets.length}`);
assert(!res2.data.experience[0].bullets[0].includes('EDUCATION'), 'Experience bullet must not contain EDUCATION heading');
assert(res2.data.education.length >= 1, `Education should have at least 1 entry, got ${res2.data.education.length}`);
assert(res2.data.skills.length >= 1, `Skills should be extracted, got ${res2.data.skills.length}`);
console.log('✅ Sample 2 Passed!');

// =========================================================================
// TEST 3: Two-Column / Sidebar Layout
// =========================================================================
console.log('Testing Sample 3: Two-Column / Sidebar Layout...');
const sample3 = `
Priya Sharma
Associate Product Manager
Email: priya.sharma@domain.com | Phone: +1 (555) 019-2834 | San Francisco, CA
https://linkedin.com/in/priyasharma-pm

SUMMARY
Results-oriented associate product manager with 3 years of consumer mobile app experience.

CORE SKILLS
Agile Delivery
User Research
A/B Testing
SQL Analytics
Figma Wireframing

WORK EXPERIENCE
Associate Product Manager | Apex Consumer Tech
Jan 2023 – Present | San Francisco, CA
• Increased monthly active user retention by 22% through redesign of push notification engine.
• Conducted 40+ user interviews to build initial PRD for viral referral mechanics.

Product Analyst | DataPulse Analytics
Jun 2021 – Dec 2022 | Austin, TX
• Designed 14 interactive Tableau business dashboards monitoring funnel conversion.
• Automated SQL ETL queries saving 12 hours of weekly manual reporting.

EDUCATION
University of California, Berkeley
Bachelor of Science in Cognitive Science
2017 – 2021
`;

const res3 = parseRawResumeText(sample3);
assert(res3.data.fullName === 'Priya Sharma', `Expected name "Priya Sharma", got "${res3.data.fullName}"`);
assert(res3.data.location.includes('San Francisco'), `Expected San Francisco, got "${res3.data.location}"`);
assert(res3.data.experience.length === 2, `Expected 2 experience entries, got ${res3.data.experience.length}`);
assert(res3.data.experience[0].bullets.length === 2, `Expected 2 bullets for Apex, got ${res3.data.experience[0].bullets.length}`);
assert(res3.data.education.length === 1, `Expected 1 education entry, got ${res3.data.education.length}`);
assert(res3.data.skills.length >= 1, 'Skills should be parsed');
console.log('✅ Sample 3 Passed!');

// =========================================================================
// TEST 4: Non-Standard Headings
// =========================================================================
console.log('Testing Sample 4: Non-Standard Headings...');
const sample4 = `
Rahul Verma
rahul.verma@alumni.bits.ac.in | +91-9123456789 | Gurugram, India
linkedin.com/in/rahul-verma-growth

WHERE I'VE WORKED
Growth Strategy Manager | HyperGrowth Logistics
03/2023 - Present
• Spearheaded last-mile dispatch routing optimization across 18 regional hubs.
• Scaled daily deliveries from 45,000 to 110,000 orders while reducing fuel expenditure by 14%.

TECHNICAL PROFICIENCY
SQL, Python for Data Science, Mixpanel, Amplitude, Metabase, Jira, Confluence

ACADEMIC QUALIFICATIONS
BITS Pilani
B.E. in Mechanical Engineering
2018 - 2022
CGPA: 8.4/10

POSITIONS OF RESPONSIBILITY
• President, Student Placement Cell: Managed recruitment drives for 1,200+ students.
• Lead Coordinator, Annual National Tech Fest.
`;

const res4 = parseRawResumeText(sample4);
assert(res4.data.fullName === 'Rahul Verma', `Expected name "Rahul Verma", got "${res4.data.fullName}"`);
assert(res4.data.experience.length >= 1, `Expected experience parsed under "WHERE I'VE WORKED", got ${res4.data.experience.length}`);
assert(res4.data.skills.length >= 1, `Expected skills parsed under "TECHNICAL PROFICIENCY", got ${res4.data.skills.length}`);
assert(res4.data.education.length >= 1, `Expected education parsed under "ACADEMIC QUALIFICATIONS", got ${res4.data.education.length}`);
assert(res4.data.certifications.length >= 2, `Expected achievements parsed under POSITIONS OF RESPONSIBILITY, got ${res4.data.certifications.length}`);
console.log('✅ Sample 4 Passed!');

// =========================================================================
// TEST 5: Fresher Resume with Education First
// =========================================================================
console.log('Testing Sample 5: Fresher Resume with Education First...');
const sample5 = `
Ananya Deshmukh
ananya.deshmukh@iitb.ac.in | +91 9988776655 | Mumbai, India | linkedin.com/in/ananya-deshmukh

EDUCATION
Indian Institute of Technology (IIT) Bombay
Bachelor of Technology in Electrical Engineering
2021 – 2025
CGPA: 9.12 / 10.0 (Institute Academic Honor Award)

INTERNSHIPS & EXPERIENCE
Product Management Intern | FinServe Technologies
May 2024 – July 2024 | Mumbai, India
• Formulated user onboarding PRD for retail micro-investment microapp, boosting day-7 activation by 31%.
• Analyzed user drop-offs across payment checkout funnels using SQL queries over 200,000 daily events.

PROJECTS & CAPSTONES
AI Portfolio Rebalancing Simulator
Capstone Project | B-School Finance Track
• Modeled mean-variance Markowitz portfolio optimization algorithm evaluating 50 Nifty equities.
• Backtested strategy against benchmark over 5-year historical horizon, yielding a Sharpe ratio of 1.84.

KEY SKILLS
Core Competencies: Product Analytics, Wireframing, Financial Modeling, Market Research
Tools & Tech: Python, SQL, Tableau, Figma, Advanced Excel
`;

const res5 = parseRawResumeText(sample5);
assert(res5.data.fullName === 'Ananya Deshmukh', `Expected Ananya Deshmukh, got "${res5.data.fullName}"`);
assert(res5.data.education.length >= 1, 'Education must be parsed');
assert(res5.data.education[0].institution.includes('IIT'), `Expected IIT institution, got "${res5.data.education[0].institution}"`);
assert(res5.data.experience.length >= 1, 'Internships must be mapped to experience');
assert(res5.data.projects.length >= 1, 'Projects must be parsed');
assert(res5.data.projects[0].name.includes('Portfolio Rebalancing'), `Expected project name, got "${res5.data.projects[0].name}"`);
console.log('✅ Sample 5 Passed!');

// =========================================================================
// TEST 6: LinkedIn Export Format
// =========================================================================
console.log('Testing Sample 6: LinkedIn Export Format...');
const sample6 = `
Contact
abhinav.sarkar@example.com
www.linkedin.com/in/abhinav-sarkar-mba (LinkedIn)

Top Skills
Product Roadmapping
Go-To-Market Strategy
SQL Data Analytics

Languages
English (Full Professional)
Hindi (Native)

Abhinav Sarkar
Senior Product & Strategy Consultant | Ex-Tech Lead
Bengaluru, Karnataka, India

Summary
MBA Candidate and seasoned technology product consultant with leadership experience driving carrier-grade telecom platforms and monetizing digital services.

Experience
Tecnotree Corporation
Senior Product Management Consultant
May 2024 - Present (1 year)
Bengaluru, India
• Spearheaded digital monetization and DAM roadmap across Tier-1 operators.
• Governed cross-functional engineering pods delivering 24 epics ahead of sprint milestones.

Education
Indian Institute of Management
Master of Business Administration - MBA, Strategy & Finance
2024 - 2026
`;

const res6 = parseRawResumeText(sample6);
assert(res6.data.fullName === 'Abhinav Sarkar', `Expected Abhinav Sarkar, got "${res6.data.fullName}"`);
assert(res6.data.email === 'abhinav.sarkar@example.com', `Email mismatch, got "${res6.data.email}"`);
assert(res6.data.linkedinUrl.includes('linkedin.com/in/abhinav-sarkar-mba'), `LinkedIn mismatch, got "${res6.data.linkedinUrl}"`);
assert(res6.data.summary.includes('seasoned technology product consultant'), `Summary mismatch, got "${res6.data.summary}"`);
assert(res6.data.experience.length >= 1, `Expected experience in LinkedIn format, got ${res6.data.experience.length}`);
assert(res6.data.education.length >= 1, `Expected education in LinkedIn format, got ${res6.data.education.length}`);
console.log('✅ Sample 6 Passed!');

// =========================================================================
// TEST 7: Date Range Parser Unit Checks
// =========================================================================
console.log('Testing Date Range Parser...');
assert(parseDateRange('May 2024 – Present')?.current === true, 'May 2024 - Present should be current');
assert(parseDateRange('2021–2023')?.startDate === '2021', '2021-2023 start date');
assert(parseDateRange('07/2022 - 03/2024')?.endDate.includes('2024'), '07/2022 - 03/2024 end date');
assert(parseDateRange("Mar'22 – Apr'24")?.startDate.includes('22'), "Mar'22 start date");
assert(parseDateRange('2023 - Till date')?.current === true, 'Till date should be current');
console.log('✅ Date Range Parser Passed!');

// =========================================================================
// TEST 8: Bullet Splitting Unit Checks
// =========================================================================
console.log('Testing Bullet Splitting...');
const multiBulletText = `• First achievement with quantifiable metric of 34% growth.\nContinuation of first achievement with more details.\n• Second achievement that was delivered on time.`;
const splitBullets = splitIntoAchievementBullets(multiBulletText);
assert(splitBullets.length === 2, `Expected 2 bullets, got ${splitBullets.length}`);
assert(splitBullets[0].includes('Continuation'), 'Soft-wrapped line should be joined to previous bullet');

const paragraphBulletText = `Led engineering architecture for core checkout system. Reduced transaction latency by 45%. Slashed gateway drop-offs from 7% to 2.8%.`;
const paraSplit = splitIntoAchievementBullets(paragraphBulletText);
assert(paraSplit.length >= 2, `Paragraph without bullets should split on sentences, got ${paraSplit.length}`);
console.log('✅ Bullet Splitting Passed!');

// =========================================================================
// TEST 9: Two-Pass Parsing Architecture (Geometry Isolation & Semantic Mapping)
// =========================================================================
console.log('Testing Test 9: Two-Pass Architecture (Geometry & Semantic Segmentation)...');
const sample9 = `
CONTACT DETAILS
email@domain.com | +1 555 019 2834 | New York, NY
SKILLS
Python, SQL, React, AWS
EXPERIENCE
Software Engineer | Acme Corp
Jan 2022 - Present
• Built cloud microservices in Python.
`;

const res9 = parseRawResumeText(sample9);
assert(res9.data.email === 'email@domain.com', 'Pass 2 should correctly extract email without bleeding into skills');
assert(res9.data.skills.length >= 1, 'Pass 2 should isolate skills correctly');
assert(res9.data.experience.length === 1, 'Pass 2 should isolate experience correctly');
assert(!res9.data.skills.some(s => s.items.some(item => item.includes('EXPERIENCE'))), 'No section heading bleeding into skills');
console.log('✅ Test 9 Two-Pass Architecture Passed!');

// =========================================================================
// TEST 10: Education Degree Extraction & Certification Year Merging
// =========================================================================
console.log('Testing Test 10: Education Degree & Certifications Parsing...');
const sample10 = `
Abhinav Sarkar
abhinav.sarkar@example.com | +91 98201 45678

EDUCATION
Sri Balaji University, Pune
MBA, Marketing
2022 - 2024

Amity University, Mumbai
BJMC, Journalism and Mass Communication (Majors)
2019 - 2022

CERTIFICATIONS & HONORS
• Nextleap Product Manager Fellowship Certification ·
• 2024
• AI micro PM certification · 2026
• Become a Product manager · 2024
`;

const res10 = parseRawResumeText(sample10);
assert(res10.data.education.length === 2, `Expected 2 education entries, got ${res10.data.education.length}`);
assert(res10.data.education[0].institution.includes('Sri Balaji University'), `Expected university name, got "${res10.data.education[0].institution}"`);
assert(res10.data.education[0].degree.includes('MBA') || res10.data.education[0].degree.includes('Master'), `Expected MBA degree, got "${res10.data.education[0].degree}"`);
assert(res10.data.education[0].startDate === '2022', `Expected 2022 start date, got "${res10.data.education[0].startDate}"`);
assert(res10.data.education[0].endDate === '2024', `Expected 2024 end date, got "${res10.data.education[0].endDate}"`);

assert(res10.data.education[1].institution.includes('Amity University'), `Expected Amity University, got "${res10.data.education[1].institution}"`);
assert(
  res10.data.education[1].degree.includes('BJMC') || res10.data.education[1].degree.includes('Journalism'),
  `Expected BJMC / Journalism degree for Amity, got "${res10.data.education[1].degree}"`
);
assert(res10.data.education[1].startDate === '2019', `Expected 2019 start date, got "${res10.data.education[1].startDate}"`);
assert(res10.data.education[1].endDate === '2022', `Expected 2022 end date, got "${res10.data.education[1].endDate}"`);

// Exactly 3 certifications, year-only '2024' token must be re-categorized as Completion Date for Nextleap
assert(res10.data.certifications.length === 3, `Expected 3 certifications (no standalone 2024 entry), got ${res10.data.certifications.length}`);
assert(
  res10.data.certifications[0].includes('Nextleap') && res10.data.certifications[0].includes('2024'),
  `Expected Nextleap cert to include completion date 2024, got "${res10.data.certifications[0]}"`
);
assert(!res10.data.certifications.some((c) => /^\(?\d{4}\)?$/.test(c.trim())), 'No standalone year entry allowed in certifications');
console.log('✅ Test 10 Education & Certifications Parsing Passed!');

console.log('\n🎉 ALL 10 UNIT TESTS PASSED WITH 100% SUCCESS!');


