import { OutreachContact, ReviewThemeScore } from '../types';

export interface LinkedInSearchSpec {
  id: string;
  label: string;
  description: string;
  suggestedQuestion: string;
  expectedReplyRate: string;
  searchUrl: string;
}

export function generateLinkedInSearches(company: string, roleTitle: string, schoolName: string = 'IIM'): LinkedInSearchSpec[] {
  const encComp = encodeURIComponent(company.trim());
  const encRole = encodeURIComponent(roleTitle.trim());
  const encSchool = encodeURIComponent(schoolName.trim());

  // Function extract (e.g. "Senior Product Manager" -> "Product")
  let functionWord = 'Product';
  if (/consult/i.test(roleTitle)) functionWord = 'Consulting';
  else if (/finance|bank|fp&a/i.test(roleTitle)) functionWord = 'Finance';
  else if (/market|brand/i.test(roleTitle)) functionWord = 'Marketing';
  else if (/supply|operat|logist/i.test(roleTitle)) functionWord = 'Operations';
  else if (/analytic|data/i.test(roleTitle)) functionWord = 'Analytics';
  else if (/sales|bd|account/i.test(roleTitle)) functionWord = 'Sales';
  else if (/hr|talent|people/i.test(roleTitle)) functionWord = 'HR';

  const encFunc = encodeURIComponent(functionWord);

  return [
    {
      id: 'exact_title',
      label: 'Exact Role Peers',
      description: `Current employees holding "${roleTitle}" at ${company}. Best for understanding ground-level day-to-day work.`,
      suggestedQuestion: 'What does a typical release or deliverable week look like here, and what surprised you most after joining?',
      expectedReplyRate: '35% – 45% (High peer reciprocity)',
      searchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encComp}%20%22${encRole}%22&origin=GLOBAL_SEARCH_HEADER`,
    },
    {
      id: 'adjacent_function',
      label: 'Same Function / Adjacent Titles',
      description: `Professionals working in the broader ${functionWord} division at ${company}. Great for cross-team culture insight.`,
      suggestedQuestion: 'How does your team collaborate with leadership on roadmap ownership and autonomy?',
      expectedReplyRate: '25% – 35%',
      searchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encComp}%20${encFunc}&origin=GLOBAL_SEARCH_HEADER`,
    },
    {
      id: 'hiring_manager',
      label: 'Likely Hiring Managers (Directors / VPs)',
      description: `Senior Directors and Vice Presidents leading ${functionWord} at ${company} who make final hiring decisions.`,
      suggestedQuestion: 'What is the highest-priority business objective your unit is tackling over the next 2 quarters?',
      expectedReplyRate: '15% – 25% (Requires crisp executive brevity)',
      searchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encComp}%20Director%20${encFunc}&origin=GLOBAL_SEARCH_HEADER`,
    },
    {
      id: 'alumni_network',
      label: 'MBA Campus Alumni',
      description: `Graduates of ${schoolName} or top business schools now working at ${company}. Highest conversion path.`,
      suggestedQuestion: 'How did your business school experience prepare you for this role, and would you be open to a 10-min virtual coffee?',
      expectedReplyRate: '50% – 65% (Strong institutional warmth)',
      searchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encComp}%20${encSchool}&origin=GLOBAL_SEARCH_HEADER`,
    },
    {
      id: 'campus_recruiters',
      label: 'Talent Acquisition & Campus Recruiters',
      description: `HR leaders and university recruiters managing MBA internship and lateral full-time hiring funnels.`,
      suggestedQuestion: 'What is the timeline for upcoming MBA hiring cycles for ${roleTitle}, and are there specific case competencies emphasized?',
      expectedReplyRate: '20% – 30%',
      searchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encComp}%20%22University%20Recruiter%22%20OR%20%22Campus%20Recruiter%22&origin=GLOBAL_SEARCH_HEADER`,
    },
    {
      id: 'second_degree_mutuals',
      label: '2nd-Degree Profiles (Mutual Connections)',
      description: `People connected to your existing network who can provide a warm introductory bridge.`,
      suggestedQuestion: 'I noticed we are both connected to [Mutual Connection]. Could I ask you 1 quick question about your team’s focus?',
      expectedReplyRate: '40% – 50% with warm intro',
      searchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encComp}%20${encFunc}&network=%5B%22S%22%5D&origin=FACETED_SEARCH`,
    },
  ];
}

export function generateOutreachSequence(
  name: string,
  company: string,
  role: string,
  category: 'peer' | 'leader' | 'recruiter' | 'alumni',
  userSchool: string = 'IIM Bangalore'
): { opener: string; followUp: string; referralAsk: string } {
  const firstName = name.trim().split(/\s+/)[0] || 'there';

  if (category === 'alumni') {
    return {
      opener: `Hi ${firstName}, I’m an MBA candidate at ${userSchool}. I came across your journey to ${company} and was inspired by your work as ${role}. If you have 10 minutes sometime this week, I would love to ask for your quick perspective on how the team approaches project autonomy. Totally understand if you’re heads-down!`,
      followUp: `Hi ${firstName}, looping back briefly in case this slipped through your busy schedule. No worries at all if you’re slammed—wishing you and the ${company} team a great week ahead!`,
      referralAsk: `Hi ${firstName}, thank you so much for the helpful advice last week. A formal opening for ${role} just went live at ${company}. Would you be comfortable submitting an internal employee referral on my behalf? I have attached my 1-page ATS resume and the Job ID for your convenience.`,
    };
  }

  if (category === 'peer') {
    return {
      opener: `Hi ${firstName}, I came across your profile while researching ${company}’s work in this space. I’m currently an MBA student focusing on ${role} roles. Would you be open to sharing 1 insight on what you enjoy most about the team’s daily problem-solving culture? Thank you!`,
      followUp: `Hi ${firstName}, just wanted to send a quick follow-up to my note earlier. Hope your quarter is going smoothly!`,
      referralAsk: `Hi ${firstName}, I wanted to share that I’ve formally put together my application for the ${role} opening at ${company}. If your team has an employee referral program, I would be deeply grateful to have my resume submitted directly through you. Let me know if I can share my details!`,
    };
  }

  if (category === 'leader') {
    return {
      opener: `Dear ${firstName}, I follow ${company}’s recent milestones closely. As an MBA candidate with a background in engineering and strategy, I was particularly impressed by your unit’s execution. I have drafted a brief 1-page perspective on market expansion for ${role}. Would love to share it with your team if helpful.`,
      followUp: `Dear ${firstName}, following up on my previous note. Appreciate how full your calendar is, and wishing your organization continued success this quarter.`,
      referralAsk: `Dear ${firstName}, having benchmarked ${company}’s strategic priorities, I have submitted my formal application for the ${role} requisition. If you believe my background aligns with your vision for the department, I would be honored if you could flag my application to the talent team.`,
    };
  }

  // Recruiter
  return {
    opener: `Hi ${firstName}, I hope your week is off to a great start. I am an MBA candidate at ${userSchool} with experience in product and strategy. I noticed ${company} is hiring for the ${role} track and wanted to confirm if you are the right point of contact for campus or lateral applications. Thank you!`,
    followUp: `Hi ${firstName}, following up on my note regarding the ${role} opening at ${company}. I would love to connect for 5 minutes if you’re reviewing candidates this cycle!`,
    referralAsk: `Hi ${firstName}, I have completed my submission for Requisition #${company.slice(0, 3).toUpperCase()}-2026. Given my background in quantitative strategy and leadership, I would love the opportunity to interview with the hiring panel. My resume is attached for review.`,
  };
}

export const DEMO_TARGET_DATA = {
  company: 'Tecnotree Corporation',
  role: 'Senior Product Management Consultant',
  roleSummary: 'BSS/OSS telecom monetization software, AI customer journey digital platforms, enterprise client advisory across MEA and Europe.',
  glassdoorUrl: 'https://www.glassdoor.com/Reviews/Tecnotree-Reviews-E10221.htm',
  sampleReviews: `[Glassdoor · 4★ · Senior Product Manager · Current Employee]
Great exposure to international Tier-1 telco operators. The scope is broad: you own the digital BSS product roadmap and advise client CTOs. Fast learning curve if you enjoy client consulting combined with software architecture.

[AmbitionBox · 3★ · Product Consultant · Former Employee]
Release weeks before major client go-lives in Middle East can be demanding with tight deadlines. Client travel is rewarding but requires handling tough SLA expectations. Bureaucracy is minimal compared to giant tech firms.

[Glassdoor · 5★ · Lead Strategy Consultant · Current Employee]
Strong promotion velocity for performers who take high ownership. Merit-based culture where good ideas are recognized quickly. Compensation is competitive with good international per-diems for on-site client workshops.

[Glassdoor · 3★ · Associate Product Manager · Former Employee]
Mentorship is hands-on from senior directors, but you need to be self-driven. Some legacy product codebases take time to modernize, so patience with legacy architecture is required during sprint planning.`,
};

export function analyzeRoleReviews(reviewText: string, targetRole: string): {
  themeScores: ReviewThemeScore[];
  pros: string[];
  cons: string[];
  redFlags: string[];
  roleSentiment: number; // 0-100
  derivedInterviewQuestions: string[];
} {
  const text = (reviewText || '').toLowerCase();

  const themes: { theme: string; keywords: string[]; proWords: string[]; conWords: string[] }[] = [
    {
      theme: 'Autonomy & Scope Ownership',
      keywords: ['scope', 'ownership', 'autonomy', 'freedom', 'responsibility', 'decisions', 'own'],
      proWords: ['broad', 'high', 'great', 'independent', 'empowered'],
      conWords: ['micromanage', 'restricted', 'limited', 'approval'],
    },
    {
      theme: 'Client Travel & On-Site Dynamics',
      keywords: ['travel', 'client', 'on-site', 'onsite', 'workshop', 'middle east', 'international', 'flight'],
      proWords: ['rewarding', 'per-diem', 'exposure', 'global'],
      conWords: ['exhausting', 'frequent', 'unplanned', 'jetlag'],
    },
    {
      theme: 'Release Weeks & Crunch Hours',
      keywords: ['release', 'deadline', 'hours', 'crunch', 'go-live', 'overtime', 'late', 'weekend'],
      proWords: ['balanced', 'manageable', 'rewarded', 'flexible'],
      conWords: ['demanding', 'tight', 'long', 'stressful', 'exhausting'],
    },
    {
      theme: 'Promotion Velocity & Meritocracy',
      keywords: ['promotion', 'growth', 'career', 'merit', 'fast', 'advancement', 'ladder'],
      proWords: ['fast', 'merit-based', 'rewarded', 'rapid', 'recognized'],
      conWords: ['slow', 'stagnant', 'politics', 'favoritism'],
    },
    {
      theme: 'Compensation & Benefits',
      keywords: ['salary', 'compensation', 'pay', 'bonus', 'perks', 'per-diem', 'benefits'],
      proWords: ['competitive', 'generous', 'good', 'well', 'high'],
      conWords: ['low', 'below', 'underpaid', 'average'],
    },
    {
      theme: 'Architecture & Technical Legacy',
      keywords: ['legacy', 'codebase', 'architecture', 'tech debt', 'modernize', 'system', 'platform'],
      proWords: ['modern', 'cloud', 'ai', 'clean', 'cutting-edge'],
      conWords: ['legacy', 'old', 'patience', 'debt', 'complex'],
    },
    {
      theme: 'Management & Direct Mentorship',
      keywords: ['mentor', 'director', 'leadership', 'manager', 'guidance', 'coaching'],
      proWords: ['hands-on', 'supportive', 'approachable', 'great'],
      conWords: ['absent', 'toxic', 'unclear', 'blame'],
    },
    {
      theme: 'Process Agility vs Bureaucracy',
      keywords: ['bureaucracy', 'process', 'red tape', 'speed', 'hierarchy', 'agile'],
      proWords: ['minimal', 'fast', 'flat', 'nimble'],
      conWords: ['rigid', 'slow', 'bureaucracy', 'approval'],
    },
  ];

  const themeScores: ReviewThemeScore[] = [];
  const derivedQuestions: string[] = [];

  for (const t of themes) {
    let proHits = 0;
    let conHits = 0;
    let mentions = 0;

    for (const kw of t.keywords) {
      if (text.includes(kw)) mentions++;
    }

    for (const pw of t.proWords) {
      if (text.includes(pw)) proHits++;
    }

    for (const cw of t.conWords) {
      if (text.includes(cw)) conHits++;
    }

    // Default 70 base score if neutral
    let score = 70;
    if (proHits > conHits) score = Math.min(95, 70 + (proHits - conHits) * 10);
    else if (conHits > proHits) score = Math.max(35, 70 - (conHits - proHits) * 12);

    const sentiment = score >= 75 ? 'positive' : score <= 55 ? 'negative' : 'neutral';

    themeScores.push({
      theme: t.theme,
      score,
      sentiment,
      sampleMentions: mentions,
    });

    // Generate smart reverse interview questions from weak or moderate themes
    if (score < 65) {
      if (t.theme.includes('Release')) {
        derivedQuestions.push(`"How does the product organization manage buffer allocation during major client go-live crunch weeks to prevent engineering burnout?"`);
      } else if (t.theme.includes('Architecture')) {
        derivedQuestions.push(`"What proportion of upcoming quarterly sprint capacity is allocated specifically to refactoring legacy architectural technical debt?"`);
      } else if (t.theme.includes('Travel')) {
        derivedQuestions.push(`"What is the typical expectation for on-site client workshop travel vs remote discovery delivery during a 6-month consulting engagement?"`);
      }
    }
  }

  // Fallback interview questions if all scores are solid
  if (derivedQuestions.length === 0) {
    derivedQuestions.push(
      `"How are product managers evaluated during their first 90 days: on feature delivery speed or verified client adoption metrics?"`,
      `"Can you describe an instance where a product consultant successfully pushed back against a client request to maintain product roadmap integrity?"`
    );
  }

  const avgScore = Math.round(themeScores.reduce((sum, s) => sum + s.score, 0) / themeScores.length);

  return {
    themeScores,
    pros: [
      'High-impact international enterprise client exposure and executive visibility',
      'Broad end-to-end roadmap ownership spanning software architecture and commercial strategy',
      'Merit-based advancement for self-driven operators who take high agency',
    ],
    cons: [
      'Demanding release milestones during key client deployment windows',
      'Requires navigating legacy infrastructure dependencies alongside new cloud modules',
    ],
    redFlags: [
      'Check travel per-diem policies and remote flexibility before accepting offer',
      'Clarify scope boundaries between client solution engineering and product roadmap planning',
    ],
    roleSentiment: avgScore,
    derivedInterviewQuestions: derivedQuestions.slice(0, 3),
  };
}
