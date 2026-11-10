export type CompetencyKey =
  | 'analytical'
  | 'business'
  | 'communication'
  | 'problemSolving'
  | 'execution'
  | 'influence'
  | 'learning';

export const COMPETENCY_KEYS: CompetencyKey[] = [
  'analytical',
  'business',
  'communication',
  'problemSolving',
  'execution',
  'influence',
  'learning',
];

export const COMPETENCY_ABBREVIATIONS: Record<string, CompetencyKey> = {
  A: 'analytical',
  B: 'business',
  C: 'communication',
  P: 'problemSolving',
  E: 'execution',
  I: 'influence',
  L: 'learning',
};

export const COMPETENCY_LABELS: Record<CompetencyKey, string> = {
  analytical: 'Analytical Reasoning',
  business: 'Business Acumen',
  communication: 'Communication & Structure',
  problemSolving: 'Problem Solving & Trade-offs',
  execution: 'Execution & Ownership',
  influence: 'Stakeholder Influence',
  learning: 'Learning Agility',
};

export const COMPETENCY_DESCRIPTIONS: Record<CompetencyKey, string> = {
  analytical: 'Analytical reasoning with data and logic',
  business: 'Business acumen and commercial judgment',
  communication: 'Clarity and structure of communication',
  problemSolving: 'Structured problem solving and trade-off thinking',
  execution: 'Ownership, follow-through, and results',
  influence: 'Stakeholder management and persuasion',
  learning: 'Learning agility and self-awareness',
};

export type DomainId =
  | 'product-tech'
  | 'finance-consulting'
  | 'marketing-growth'
  | 'operations-analytics'
  | 'sales-bd'
  | 'people'
  | 'general-management';

export type TagDomain = DomainId | 'ai';

export type TagKind = 'skill' | 'tool';

export interface TagDef {
  id: string;
  label: string;
  domain: TagDomain;
  group: string; // Display label of the group
  groupId: string; // kebab-case of group name prefixed by domain id
  aliases: string[];
  kind: TagKind;
}

export interface SkillGroupDef {
  id: string;
  label: string;
  domain: TagDomain;
  tags: TagDef[];
}

export interface DomainDef {
  id: DomainId;
  label: string;
  baseWeights: Record<CompetencyKey, number>;
}

export interface PresetRoleDef {
  id: string;
  title: string;
  domain: DomainId;
  tags: string[]; // domain tag ids
  aiTags?: string[]; // AI tag labels
  aliases: string[];
}

export interface QuestionOption {
  id: 'o1' | 'o2' | 'o3' | 'o4';
  text: string;
  score: 1 | 2 | 3 | 4;
}

export interface Track3Question {
  id: string;
  competencies: CompetencyKey[];
  domain: DomainId | 'shared' | 'ai';
  tags: string[]; // tag ids for domain, AI tag labels for AI, empty for shared
  text: string;
  options: QuestionOption[];
  groups: string[]; // derived distinct groups of the question's tags
}

export type ExperienceLevel =
  | 'Fresher'
  | 'Intern / Internship completed'
  | '1+ year experience';

export type EvidenceStrength = 'low' | 'medium' | 'high';

export type BarStatus = 'Above strong bar' | 'Meets expected bar' | 'Below expected bar';

export interface CompetencyScoreResult {
  competency: CompetencyKey;
  label: string;
  score: number; // 1 to 4, rounded to 1 decimal
  evidenceStrength: EvidenceStrength;
  expectedBar: number;
  strongBar: number;
  status: BarStatus;
}

export interface GroupScoreResult {
  groupId: string;
  groupName: string;
  domain: TagDomain;
  score: number; // 1 to 4, rounded to 1 decimal
  evidenceStrength: EvidenceStrength;
  expectedBar: number;
  strongBar: number;
  status: BarStatus;
}

export type TagAssessmentStatus =
  | 'Assessed directly'
  | 'Assessed at group level'
  | 'Not assessed'
  | 'Listed (tool), assessed through group'
  | 'Listed (tool), not assessed';

export interface TagScoreResult {
  tagId: string;
  label: string;
  groupName: string;
  kind: TagKind;
  status: TagAssessmentStatus;
  score?: number; // question score if directly assessed, or group score if group assessed
  scoreLabel?: string;
}

export interface MissedQuestionReviewItem {
  questionId: string;
  questionText: string;
  userAnswerText: string;
  userScore: number;
  strongerApproachText: string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ResolvedRole {
  confidence: ConfidenceLevel;
  presetId?: string;
  roleTitle: string;
  domainId: DomainId;
  tags: string[]; // pre-selected domain tag ids (min 3, max 15)
  aiTags?: string[]; // pre-selected AI tag labels (max 8)
  isTyped: boolean;
  rawInput?: string;
}

export interface Track3Report {
  roleTitle: string;
  domainId: DomainId;
  level: ExperienceLevel;
  confidence: ConfidenceLevel;
  scopeLine: string;
  overallScore: number; // 0 to 100
  overallLabel: 'Early stage' | 'Developing' | 'Job-ready' | 'Strong';
  competencies: CompetencyScoreResult[];
  groupScores: GroupScoreResult[];
  selectedTags: TagScoreResult[];
  aiResult?: {
    aiMean: number;
    aiReadiness: number;
    status: BarStatus;
    groupsAssessed: GroupScoreResult[];
  };
  strengths: CompetencyScoreResult[];
  gaps: CompetencyScoreResult[];
  missedQuestions: MissedQuestionReviewItem[];
  nextSteps: string[];
  disclaimer: string;
  lowEvidenceWarning: boolean;
  tooManyGroupsWarning: boolean;
}
