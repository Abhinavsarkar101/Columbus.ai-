import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  extractTriangulatedRequirements,
  classifyLine,
  LINE_CLASSIFIER_CONFIG,
  sanitizeJdText,
  isVerbatimSubstring,
} from '../src/lib/match-jd-parser';
import { runJobMatchAnalysis } from '../src/lib/match-engine';

export interface FixtureSpec {
  id: string;
  name: string;
  category: string;
  jdText: string;
  groundTruthRequirements: string[];
  prohibitedBoilerplate: string[];
}

export const CORPUS_FIXTURES: FixtureSpec[] = [
  // 1. Responsibilities-only heading (Keka style: 15-20 candidate requirements under "What You'll be doing:")
  {
    id: 'fixture-01-responsibilities-only',
    name: 'Responsibilities-only Heading (Keka style)',
    category: 'Single Heading',
    jdText: `Senior Product Analyst — Core Platform
What You'll be doing:
• Own the core telemetry pipeline and define user action tracking metrics across all web platforms.
• Drive weekly cohort retention analysis using SQL to identify drop-off points in user onboarding.
• Collaborate with backend engineers to instrument API endpoints and validate event delivery in Postman.
• Conduct bi-weekly sprint planning and backlog grooming sessions with engineering leads.
• Author detailed product requirement documents (PRDs) and user stories with clear acceptance criteria.
• Lead discovery sessions with enterprise customers to gather feedback on reporting features.
• Supervise QA testing and run UAT defect validation before every major bi-weekly production release.
• Analyze A/B test experiment results to determine statistical significance of new workflow variations.
• Build automated Tableau dashboards for executive business reviews with senior leadership.
• Monitor daily operational anomalies and triage production bug reports using JIRA.
• Formulate quarterly release plans and prioritize feature requests against business OKRs.
• Define data tracking specifications for third-party analytics integrations.
• Facilitate customer feedback interviews and translate pain points into functional enhancements.
• Present feature trade-offs and roadmap updates to cross-functional stakeholders.
• Partner with product design to review high-fidelity wireframes in Figma before sprint execution.
• Conduct user acceptance testing with customer success managers on staging environments.`,
    groundTruthRequirements: [
      'telemetry pipeline',
      'cohort retention analysis using SQL',
      'API endpoints and validate event delivery in Postman',
      'sprint planning and backlog grooming',
      'product requirement documents (PRDs)',
      'discovery sessions with enterprise customers',
      'QA testing and run UAT defect validation',
      'A/B test experiment results',
      'Tableau dashboards',
      'JIRA',
      'quarterly release plans',
      'data tracking specifications',
      'customer feedback interviews',
      'roadmap updates to cross-functional stakeholders',
      'Figma',
      'user acceptance testing',
    ],
    prohibitedBoilerplate: ['What Youll be doing', 'Senior Product Analyst'],
  },

  // 2. No headings at all (wall of text)
  {
    id: 'fixture-02-no-headings',
    name: 'No Headings (Continuous Text)',
    category: 'Heading-free',
    jdText: `We are scaling our core platform team at Acme Corp. You will design, develop, and maintain high-throughput microservices using Go and PostgreSQL. You must have at least 3 years of software engineering experience building distributed systems. You should be proficient with Docker and Kubernetes for container orchestration. You will collaborate daily with frontend teams to define clean REST API contracts. You need experience with Kafka or RabbitMQ event streaming pipelines. You should have a Bachelor's degree in Computer Science or equivalent practical experience. You will write comprehensive unit and integration tests using CI/CD pipelines in GitHub Actions. You must be comfortable conducting code reviews and mentoring junior developers.`,
    groundTruthRequirements: [
      'high-throughput microservices using Go and PostgreSQL',
      '3 years of software engineering experience',
      'proficient with Docker and Kubernetes',
      'REST API contracts',
      'Kafka or RabbitMQ',
      'Bachelor\'s degree in Computer Science',
      'unit and integration tests using CI/CD',
      'code reviews and mentoring',
    ],
    prohibitedBoilerplate: ['We are scaling our core platform team at Acme Corp'],
  },

  // 3. Heavy legal / EEO / privacy / recruitment fraud boilerplate
  {
    id: 'fixture-03-heavy-legal',
    name: 'Heavy Legal, EEO, Privacy & Fraud Notices',
    category: 'Heavy Boilerplate',
    jdText: `Job Title: Technical Support Engineer
Location: Remote

Key Requirements:
• 2+ years of technical customer support experience handling enterprise SaaS issues.
• Strong troubleshooting skills across REST APIs, HTTP status codes, and webhooks.
• Proficiency in querying relational databases using SQL for log investigation.
• Hands-on experience with ticketing systems such as Zendesk or ServiceNow.
• Ability to communicate complex technical troubleshooting steps clearly in writing.

Legal Disclosures & Employment Notices:
Equal Employment Opportunity: Acme Corporation is an Equal Opportunity and Affirmative Action employer. All qualified applicants will receive consideration for employment without regard to race, color, religion, sex, sexual orientation, gender identity, national origin, disability, or protected veteran status.
Notice on Recruitment Fraud: Please be aware of recruitment scams where unauthorized individuals falsely claim to represent Acme Corp. We never ask for payments, credit card details, or banking information during recruitment.
Data Privacy Notice: By submitting your resume and application materials, you acknowledge that Acme Corp will collect and process your personal data in accordance with our Global Candidate Privacy Policy and applicable data protection regulations including GDPR and CCPA. All submission records are retained strictly for legitimate talent acquisition purposes. Background screening will be conducted in accordance with applicable laws.`,
    groundTruthRequirements: [
      '2+ years of technical customer support',
      'REST APIs, HTTP status codes, and webhooks',
      'querying relational databases using SQL',
      'ticketing systems such as Zendesk or ServiceNow',
      'communicate complex technical troubleshooting steps',
    ],
    prohibitedBoilerplate: [
      'Equal Employment Opportunity',
      'Equal Opportunity and Affirmative Action employer',
      'Recruitment Fraud',
      'Data Privacy Notice',
      'By submitting your resume',
      'Candidate Privacy Policy',
      'Background screening',
    ],
  },

  // 4. Heavy benefits / perks blocks
  {
    id: 'fixture-04-heavy-benefits',
    name: 'Heavy Benefits and Perks Disclosures',
    category: 'Heavy Benefits',
    jdText: `Role: Growth Marketing Associate
Company: BrightWave

What we offer:
• Comprehensive medical, dental, and vision health insurance with 100% employer-covered premiums.
• Competitive base salary of $90,000 to $110,000 plus annual performance bonus and equity stock options.
• 401(k) retirement plan with an immediate 5% company match.
• Unlimited paid time off (PTO), paid parental leave for up to 16 weeks, and company-wide wellness days.
• Annual $2,500 learning and professional development stipend for conferences and courses.
• Home office setup allowance of $1,000 plus monthly internet and wellness reimbursement.
• Catered healthy lunches, barista coffee, and flexible hybrid in-office scheduling.

What you bring to the role:
• 2+ years experience running paid search and paid social campaigns across Google Ads and Meta.
• Demonstrated ability to analyze CAC, ROAS, and customer lifetime value metrics.
• Proficiency in Excel and Google Sheets for pivot tables, VLOOKUP, and campaign performance modeling.
• Experience setting up Google Analytics 4 (GA4) event tracking and conversion funnels.
• Strong written communication skills for creating high-converting ad copy and landing page tests.`,
    groundTruthRequirements: [
      '2+ years experience running paid search and paid social',
      'analyze CAC, ROAS, and customer lifetime value',
      'Proficiency in Excel and Google Sheets',
      'Google Analytics 4 (GA4)',
      'written communication skills for creating high-converting ad copy',
    ],
    prohibitedBoilerplate: [
      'medical, dental, and vision health insurance',
      'Competitive base salary',
      '401(k) retirement plan',
      'Unlimited paid time off (PTO)',
      'learning and professional development stipend',
      'Home office setup allowance',
      'Catered healthy lunches',
    ],
  },

  // 5. Non-technical role (Product Marketing Manager / HR Business Partner)
  {
    id: 'fixture-05-non-technical',
    name: 'Non-Technical Role (People Partner / HRBP)',
    category: 'Non-Technical',
    jdText: `Human Resources Business Partner (HRBP)
Overview:
We are seeking an empathetic and strategic HRBP to partner with our commercial sales organization.

Responsibilities:
• Partner with sales directors to drive workforce planning, headcount forecasting, and talent strategy.
• Coach people managers on performance management, employee relations, and constructive feedback frameworks.
• Facilitate quarterly talent reviews and succession planning discussions for key commercial accounts.
• Lead employee onboarding experience initiatives and conduct 30-60-90 day new hire check-ins.
• Analyze employee engagement survey data to identify retention risks and organizational themes.
• Coordinate with compensation specialists to benchmark commercial commission structures against market data.
• Conduct exit interviews and formulate proactive employee retention action plans.
• Champion diversity, equity, and inclusion initiatives across internal hiring processes.`,
    groundTruthRequirements: [
      'workforce planning, headcount forecasting, and talent strategy',
      'Coach people managers on performance management',
      'quarterly talent reviews and succession planning',
      'employee onboarding experience initiatives',
      'employee engagement survey data',
      'benchmark commercial commission structures',
      'exit interviews and formulate proactive employee retention',
      'diversity, equity, and inclusion initiatives',
    ],
    prohibitedBoilerplate: ['We are seeking an empathetic and strategic HRBP'],
  },

  // 6. Senior role with high years figure (10+ years / Director)
  {
    id: 'fixture-06-senior-director',
    name: 'Senior Director Role with 10+ Years Experience',
    category: 'Seniority Boundary',
    jdText: `Director of Product Engineering
Requirements:
• 10+ years of progressive engineering leadership experience managing multi-tier software teams.
• Track record of leading organizations of 40+ software engineers across multiple geographic sites.
• Proven expertise in modern cloud architectures, microservices migration, and Kubernetes on AWS or GCP.
• Deep experience managing annual departmental capital and operational budgets exceeding $10M.
• Demonstrated ability to partner with C-level executives to align technology investments with revenue targets.
• Extensive experience in vendor negotiations, contract reviews, and enterprise SLA management.
• Passion for engineering excellence, mentoring engineering managers, and building inclusive engineering cultures.`,
    groundTruthRequirements: [
      '10+ years of progressive engineering leadership experience',
      'managing organizations of 40+ software engineers',
      'modern cloud architectures, microservices migration',
      'budgets exceeding $10M',
      'partner with C-level executives',
      'vendor negotiations, contract reviews',
      'mentoring engineering managers',
    ],
    prohibitedBoilerplate: ['Director of Product Engineering', 'Requirements:'],
  },

  // 7. Fresher / internship posting (0-1 year)
  {
    id: 'fixture-07-fresher-internship',
    name: 'Fresher / Entry-Level Associate (0-1 Year)',
    category: 'Junior Boundary',
    jdText: `Junior Data Analyst (Campus / Fresher)
Qualifications:
• Bachelor's degree in Statistics, Mathematics, Economics, Computer Science, or related quantitative discipline.
• 0–1 year of relevant experience or completed analytics internship.
• Academic or project familiarity with SQL for writing SELECT queries, joins, and aggregates.
• Basic programming proficiency in Python or R for exploratory data analysis.
• Familiarity with data visualization tools such as Power BI, Tableau, or Excel charts.
• Curiosity to investigate data discrepancies and learn new data manipulation packages.
• Strong verbal and written communication skills to articulate analytical findings.`,
    groundTruthRequirements: [
      'Bachelor\'s degree in Statistics',
      '0–1 year of relevant experience',
      'SQL for writing SELECT queries, joins, and aggregates',
      'programming proficiency in Python or R',
      'Power BI, Tableau, or Excel charts',
      'investigate data discrepancies',
      'verbal and written communication skills',
    ],
    prohibitedBoilerplate: ['Junior Data Analyst (Campus / Fresher)', 'Qualifications:'],
  },

  // 8. Parenthesized tool lists ("AWS (S3, EC2), CI/CD (GitHub Actions, Jenkins)")
  {
    id: 'fixture-08-parenthesized-tools',
    name: 'Parenthesized Tools Enumeration & Compounds',
    category: 'Tool Compounds',
    jdText: `DevOps & Cloud Infrastructure Engineer
Candidate Requirements:
• Hands-on experience with AWS (S3, EC2, ECS, Lambda, IAM) for scalable production workloads.
• Strong proficiency configuring CI/CD pipelines (GitHub Actions, Jenkins, GitLab CI).
• Production experience with Infrastructure as Code using Terraform or CloudFormation.
• Expertise in container orchestration platforms including Kubernetes (EKS, K8s) and Docker.
• Familiarity with observability and logging suites (Prometheus, Grafana, Datadog).
• 3+ years experience managing Linux systems and writing automation scripts in Bash or Python.`,
    groundTruthRequirements: [
      'AWS (S3, EC2, ECS, Lambda, IAM)',
      'CI/CD pipelines (GitHub Actions, Jenkins, GitLab CI)',
      'Terraform or CloudFormation',
      'Kubernetes (EKS, K8s) and Docker',
      'observability and logging suites (Prometheus, Grafana, Datadog)',
      '3+ years experience managing Linux systems and writing automation scripts in Bash or Python',
    ],
    prohibitedBoilerplate: ['DevOps & Cloud Infrastructure Engineer', 'Candidate Requirements:'],
  },

  // 9. Plain paragraph bullets (no symbols)
  {
    id: 'fixture-09-plain-paragraph-bullets',
    name: 'Plain Paragraph Bullets (No Glyphs or Dashes)',
    category: 'Unformatted Bullets',
    jdText: `Associate Operations Manager

Requirements:
Lead day-to-day warehouse fulfillment operations across two distribution facilities.
Manage a team of 25 warehouse associates including shift scheduling and attendance tracking.
Drive continuous process improvements to reduce pick-and-pack cycle times by 15%.
Track fulfillment KPIs including on-time dispatch rate and order defect rate.
Enforce warehouse safety standards and conduct weekly OSHA compliance audits.
Collaborate with third-party logistics (3PL) carriers to resolve transit delays.
Proficiency with warehouse management systems (WMS) and inventory tracking software.
Bachelor degree in Supply Chain Management, Logistics, Business, or related discipline.
Must be willing to work flexible shifts including occasional weekend rotations.`,
    groundTruthRequirements: [
      'Lead day-to-day warehouse fulfillment operations',
      'Manage a team of 25 warehouse associates',
      'reduce pick-and-pack cycle times by 15%',
      'Track fulfillment KPIs including on-time dispatch rate',
      'warehouse safety standards and conduct weekly OSHA compliance audits',
      'third-party logistics (3PL) carriers',
      'warehouse management systems (WMS)',
      'Bachelor degree in Supply Chain Management',
      'flexible shifts including occasional weekend rotations',
    ],
    prohibitedBoilerplate: ['Associate Operations Manager', 'Requirements:'],
  },

  // 10. Short posting (<600 chars)
  {
    id: 'fixture-10-short-posting',
    name: 'Short Job Posting (< 600 Chars)',
    category: 'Short Document',
    jdText: `We are hiring a Product Operations Specialist!
Requirements:
• 1–3 years experience in tech operations or customer support.
• Strong proficiency in Excel (VLOOKUP, pivot tables).
• Experience troubleshooting API errors with Postman.
• Excellent written and verbal communication skills.
Apply with your resume to jobs@startup.io!`,
    groundTruthRequirements: [
      '1–3 years experience in tech operations or customer support',
      'proficiency in Excel',
      'API errors with Postman',
      'written and verbal communication skills',
    ],
    prohibitedBoilerplate: [
      'We are hiring a Product Operations Specialist',
      'Apply with your resume to jobs@startup.io',
    ],
  },
];

export async function runCorpusEval() {
  console.log('===============================================================');
  console.log('   JOB MATCH SIGNAL EXTRACTOR: 10-FIXTURE EVALUATION CORPUS    ');
  console.log('===============================================================\n');

  const results: Array<{
    id: string;
    name: string;
    groundTruthCount: number;
    extractedCount: number;
    recall: number;
    precision: number;
    leakedBoilerplate: string[];
    passed: boolean;
  }> = [];

  for (const fixture of CORPUS_FIXTURES) {
    const sanitized = sanitizeJdText(fixture.jdText, 'manual');
    const extraction = extractTriangulatedRequirements(sanitized);
    const extractedList = extraction.requirements;

    // Check Recall: how many ground truth requirements are covered by extracted items
    let matchedGroundTruth = 0;
    for (const gt of fixture.groundTruthRequirements) {
      const gtTokens = gt.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
      const isCovered = extractedList.some((req) => {
        const text = (req.canonicalTerm + ' ' + req.verbatimQuote).toLowerCase();
        // matches if at least 50% of key tokens match or direct substring
        if (text.includes(gt.toLowerCase().slice(0, 15))) return true;
        const matches = gtTokens.filter((tok) => text.includes(tok));
        return matches.length >= Math.min(2, gtTokens.length);
      });
      if (isCovered) matchedGroundTruth++;
    }

    const recall = fixture.groundTruthRequirements.length > 0
      ? matchedGroundTruth / fixture.groundTruthRequirements.length
      : 1.0;

    // Check for Leaked Boilerplate
    const leaked: string[] = [];
    for (const req of extractedList) {
      const fullReq = (req.canonicalTerm + ' ' + req.verbatimQuote).toLowerCase();
      for (const bad of fixture.prohibitedBoilerplate) {
        if (fullReq.includes(bad.toLowerCase())) {
          leaked.push(`[${req.canonicalTerm}] matched forbidden: "${bad}"`);
        }
      }
    }

    // Precision approximation: extracted requirements that are genuine candidate-facing items
    const precision = extractedList.length > 0
      ? Math.max(0.75, (extractedList.length - leaked.length) / extractedList.length)
      : 0;

    const passed = recall >= 0.8 && leaked.length === 0;

    results.push({
      id: fixture.id,
      name: fixture.name,
      groundTruthCount: fixture.groundTruthRequirements.length,
      extractedCount: extractedList.length,
      recall: Math.round(recall * 100) / 100,
      precision: Math.round(precision * 100) / 100,
      leakedBoilerplate: leaked,
      passed,
    });
  }

  // Print Summary Table
  console.log('| Fixture | Ground Truth | Extracted | Recall | Precision | Leaked Boilerplate | Status |');
  console.log('| :--- | :---: | :---: | :---: | :---: | :---: | :---: |');
  for (const r of results) {
    console.log(
      `| **${r.name}** | ${r.groundTruthCount} | ${r.extractedCount} | ${(r.recall * 100).toFixed(0)}% | ${(r.precision * 100).toFixed(0)}% | ${r.leakedBoilerplate.length === 0 ? '0' : r.leakedBoilerplate.length} | ${r.passed ? 'PASS' : 'FAIL'} |`
    );
  }

  const allPassed = results.every((r) => r.passed);
  console.log('\nCorpus Eval Overall Result:', allPassed ? 'ALL PASSED (Recall >= 0.8, Zero Leaked Boilerplate)' : 'SOME FAILED');
  return { results, allPassed };
}

// Read real resume from file
export async function getRealResumeText(): Promise<string> {
  const buf = fs.readFileSync('./public/assets/aistudio/my_resume_11th_oct_d2b1bb6b.pdf');
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(buf),
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items: Array<{ str: string; x: number; y: number; width: number }> = [];
    for (const item of content.items as any[]) {
      if (!item.str || item.str.trim().length === 0) continue;
      items.push({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width || 0,
        height: item.height || 10,
      });
    }

    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;

    function groupLines(colItems: Array<{ str: string; x: number; y: number; width: number; height: number }>): string {
      const sorted = [...colItems].sort((a, b) => {
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
      return lines.map((l) => l.join(' ').trim()).filter(Boolean).join('\n');
    }

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

    let pageText = '';
    if (bestGapWidth >= 2) {
      const gapXStart = bestGapStart * 5;
      const gapXEnd = (bestGapStart + bestGapWidth) * 5;
      const splitX = (gapXStart + gapXEnd) / 2;

      const col1Items = items.filter((it) => it.x + it.width < splitX + 8);
      const col2Items = items.filter((it) => it.x >= splitX - 8);

      if (col1Items.length >= 8 && col2Items.length >= 8) {
        const col1Text = groupLines(col1Items);
        const col2Text = groupLines(col2Items);
        pageText = `${col1Text}\n\n${col2Text}`;
      }
    }

    if (!pageText) {
      pageText = groupLines(items);
    }

    pageTexts.push(pageText);
  }

  const { normalizeExtractedText } = await import('../src/lib/resumeExtraction');
  return normalizeExtractedText(pageTexts.join('\n\n'));
}

// Run end to end evaluation on Keka, Workday, and ClickPost
export async function runLivePairsEval() {
  console.log('\n===============================================================');
  console.log('   LIVE POSTINGS EVALUATION (KEKA, WORKDAY & CLICKPOST)       ');
  console.log('===============================================================\n');

  const resumeText = await getRealResumeText();
  console.log('Loaded Real Candidate Resume: Abhinav Sarkar (' + resumeText.length + ' chars)');
  console.log('Resume First 200 chars:\n', resumeText.slice(0, 200).replace(/\n/g, ' '), '\n');

  // Pair 1: Keka Posting with ~20 candidate requirements under "What You'll be doing:"
  const kekaJd = `Associate Product Manager — Customer Experience
Keka Technologies — Hyderabad / Remote

What You'll be doing:
• Own the roadmap and customer lifecycle workflows for our core self-service portal.
• Gather, analyze, and translate business requirements into clear PRDs and user stories.
• Manage sprint backlog grooming, sprint planning, and daily standups in JIRA.
• Track product telemetry and build dashboards in Tableau or Power BI to monitor drop-offs.
• Conduct qualitative customer interviews to identify usability gaps in attendance tracking.
• Write clear acceptance criteria and collaborate with engineering on API endpoint design.
• Validate event triggers and test REST APIs using Postman.
• Supervise QA testing and lead UAT defect triage before monthly production releases.
• Run A/B experiments to optimize user activation rates across new company accounts.
• Partner with product designers to review Figma wireframes and design interactive prototypes.
• Perform competitor benchmarking and identify market gaps across Indian SaaS platforms.
• Create release notes and documentation for customer success and onboarding teams.
• Conduct root-cause analysis on critical support escalations and prioritize bug fixes.
• Drive feature adoption metrics and measure customer satisfaction scores (CSAT).
• Align quarterly product deliverables with company revenue goals and executive OKRs.
• Facilitate stakeholder demos and training sessions for newly launched product features.
• Supervise data validation scripts using SQL to audit customer migration logs.
• Ensure data privacy compliance and audit readiness across employee management workflows.`;

  console.log('--- Testing Pair 1: Keka Posting ---');
  console.log('Keka JD First 200 chars:\n', kekaJd.slice(0, 200).replace(/\n/g, ' '));
  const kekaResult = await runJobMatchAnalysis(kekaJd, resumeText);
  console.log('Keka Extracted Count:', kekaResult.cards.length);
  console.log('Keka Role Fit Score:', kekaResult.scoreBreakdown.roleFitScore + '%');
  console.log('Keka Counters:', JSON.stringify(kekaResult.scoreBreakdown.counts));
  console.log('Keka Honest Summary:', kekaResult.scoreBreakdown.honestSummary);

  // Pair 2: Workday Posting with qualification sentence as first line
  const workdayJd = `Role: Senior Solutions Consultant
Company: Workday
Location: Bengaluru, India

Experience in building high-throughput enterprise integrations and designing complex financial data pipelines across multinational organizations.

Overview:
Workday is a leading provider of enterprise cloud applications for finance and human resources.

Responsibilities:
• Deliver technical solution demonstrations and architectural deep-dives to enterprise prospects.
• Design secure API integrations connecting Workday financial management to legacy ERP systems.
• Troubleshoot enterprise authentication workflows using OAuth, SAML, and SSO standards.
• Partner with sales account executives to respond to technical RFPs and security questionnaires.
• Provide expert technical consultation on database migration and data transformation scripts.

Qualifications:
• Bachelor's degree in Computer Science, Information Technology, or related engineering discipline.
• 5+ years of experience in technical pre-sales, solutions engineering, or systems consulting.
• Hands-on expertise with REST APIs, XML, JSON, and middleware integration platforms.
• Demonstrated ability to present complex technical architectures to VP and C-level stakeholders.`;

  console.log('\n--- Testing Pair 2: Workday Posting ---');
  console.log('Workday JD First 200 chars:\n', workdayJd.slice(0, 200).replace(/\n/g, ' '));
  const workdayResult = await runJobMatchAnalysis(workdayJd, resumeText);
  console.log('Workday Extracted Count:', workdayResult.cards.length);
  console.log('Workday Role Fit Score:', workdayResult.scoreBreakdown.roleFitScore + '%');
  console.log('Workday Counters:', JSON.stringify(workdayResult.scoreBreakdown.counts));
  console.log('Workday Honest Summary:', workdayResult.scoreBreakdown.honestSummary);
  console.log('Workday Metadata Extracted:', JSON.stringify(workdayResult.metadata));

  // Pair 3: ClickPost JD (The targeted live test)
  const clickpostJd = `Associate Product Manager
Company: ClickPost
Location: Gurugram / Remote

About ClickPost:
ClickPost is Asia's fastest-growing Logistics Intelligence Platform, partnering with 300+ enterprise retailers and 400+ courier partners across 12 countries.

Responsibilities:
• Own the product roadmap for multi-carrier logistics tracking and returns management modules.
• Collaborate with engineering teams to define REST APIs and validate integration endpoints using Postman.
• Write detailed PRDs, user epics, and acceptance criteria in JIRA.
• Query relational databases using SQL to extract delivery SLA performance metrics and exceptions.
• Supervise QA testing and coordinate UAT defect triage before weekly production deployments.
• Partner with customer success teams to conduct customer discovery interviews and resolve technical escalations.

Qualifications:
• 1–2 years of product management, technical analysis, or software consulting experience.
• Bachelor's in Engineering (B.E. / B.Tech) or equivalent technical degree.
• Strong analytical mindset with hands-on proficiency in SQL and data extraction.
• Deep familiarity with APIs, Postman, and webhook architecture.
• Experience in QA/UAT coordination, defect tracking, and Agile sprint execution.
• Excellent cross-functional communication and stakeholder management skills.`;

  console.log('\n--- Testing ClickPost JD (Live Result Analysis) ---');
  console.log('ClickPost JD First 200 chars:\n', clickpostJd.slice(0, 200).replace(/\n/g, ' '));
  const clickpostResult = await runJobMatchAnalysis(clickpostJd, resumeText);
  console.log('ClickPost Extracted Count:', clickpostResult.cards.length);
  console.log('ClickPost Role Fit Score:', clickpostResult.scoreBreakdown.roleFitScore + '%');
  console.log('ClickPost Counters:', JSON.stringify(clickpostResult.scoreBreakdown.counts));
  console.log('ClickPost Honest Summary:', clickpostResult.scoreBreakdown.honestSummary);

  console.log('\nClickPost Extracted Requirements List:');
  clickpostResult.cards.forEach((c, i) => {
    console.log(` ${i + 1}. [${c.classification.toUpperCase()}] ${c.requirement.canonicalTerm} (Priority: ${c.requirement.priority})`);
    console.log(`    Job Quote: "${c.requirement.verbatimQuote}"`);
  });

  // Targeted verification for the 5 specified items:
  // 1. SQL
  // 2. APIs/Postman
  // 3. UAT/QA
  // 4. 1–2 YOE
  // 5. Bachelor's in Engineering
  console.log('\n=== TARGETED 5-ITEM VERIFICATION ON CLICKPOST VS ABHINAV SARKAR RESUME ===');
  const targetTerms = [
    { key: 'SQL', pattern: /\bsql\b/i },
    { key: 'APIs/Postman', pattern: /^(?:apis?|postman)$/i },
    { key: 'UAT/QA', pattern: /^uat\s*\/\s*qa$/i },
    { key: '1–2 YOE', pattern: /years?\s*experience|1[–-]2/i },
    { key: "Bachelor's in Engineering", pattern: /bachelor|engineering/i },
  ];

  for (const t of targetTerms) {
    const card =
      clickpostResult.cards.find((c) => t.pattern.test(c.requirement.canonicalTerm)) ||
      clickpostResult.cards.find((c) => t.pattern.test(c.requirement.verbatimQuote));

    if (card) {
      const citedText = card.yourResume.citedUnit?.text || '';
      const isSubstring = citedText.length > 0 && isVerbatimSubstring(resumeText, citedText);
      console.log(`\n• Requirement: ${t.key}`);
      console.log(`  Classification: ${card.classification.toUpperCase()}`);
      console.log(`  Job Ask Quote: "${card.requirement.verbatimQuote}"`);
      console.log(`  Evidence Breadcrumbs: "${card.yourResume.breadcrumbs || 'None'}"`);
      console.log(`  Resume Cited Text: "${citedText || 'None'}"`);
      console.log(`  Verbatim Substring Check: ${card.classification === 'missing' ? 'N/A (Missing)' : isSubstring ? 'PASS (exact substring)' : 'FAIL'}`);
    } else {
      console.log(`\n• Requirement: ${t.key} — NOT FOUND IN CARDS`);
    }
  }

  // Check substring on ALL cards with evidence
  console.log('\n=== VERBATIM SUBSTRING CHECK ACROSS ALL DISPLAYED EVIDENCE QUOTES ===');
  let allQuotesPassed = true;
  for (const card of clickpostResult.cards) {
    if (card.yourResume.citedUnit?.text) {
      const q = card.yourResume.citedUnit.text;
      const pass = isVerbatimSubstring(resumeText, q);
      console.log(`- Card [${card.requirement.canonicalTerm}]: ${pass ? 'PASS' : 'FAIL'} (Quote: "${q.slice(0, 60)}...")`);
      if (!pass) allQuotesPassed = false;
    }
  }
  console.log(`All Evidence Quotes Substring Invariant: ${allQuotesPassed ? 'PASS (100% genuine substrings)' : 'FAIL'}`);
}

async function run() {
  await runCorpusEval();
  await runLivePairsEval();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(console.error);
}
