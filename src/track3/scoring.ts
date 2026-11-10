import {
  BarStatus,
  CompetencyKey,
  COMPETENCY_KEYS,
  COMPETENCY_LABELS,
  CompetencyScoreResult,
  DomainId,
  EvidenceStrength,
  ExperienceLevel,
  GroupScoreResult,
  MissedQuestionReviewItem,
  TagAssessmentStatus,
  TagScoreResult,
  Track3Question,
  Track3Report,
  ConfidenceLevel,
} from './types';
import { DOMAIN_MAP, PRESET_ROLES } from './presets';
import { AI_TAG_BY_LABEL_MAP, AI_TAGS, TAG_MAP, TRACK3_TAGS } from './tags';
import { selectNextSteps } from './nextSteps';

export interface ExperienceBars {
  expected: number;
  strong: number;
}

export const EXPERIENCE_BARS: Record<ExperienceLevel, ExperienceBars> = {
  Fresher: { expected: 2.8, strong: 3.3 },
  'Intern / Internship completed': { expected: 3.0, strong: 3.4 },
  '1+ year experience': { expected: 3.2, strong: 3.6 },
};

export function getBarStatus(score: number, bars: ExperienceBars): BarStatus {
  if (score >= bars.strong) return 'Above strong bar';
  if (score >= bars.expected) return 'Meets expected bar';
  return 'Below expected bar';
}

export function getEvidenceStrength(count: number): EvidenceStrength {
  if (count <= 1) return 'low';
  if (count <= 3) return 'medium';
  return 'high';
}

export interface ScoreSessionInput {
  roleTitle: string;
  domainId: DomainId;
  level: ExperienceLevel;
  confidence: ConfidenceLevel;
  presetId?: string;
  selectedTagIds: string[]; // Selected domain tags
  selectedAITags?: string[]; // Selected AI tags (labels or ids)
  questions: Track3Question[]; // 10 or 13 questions in session
  answers: Record<string, string>; // questionId -> optionId ('o1' | 'o2' | 'o3' | 'o4')
  isTypedRole?: boolean;
}

/**
 * Pure scoring function for Track 3 assessment.
 * ZERO network calls, zero AI, deterministic calculation.
 */
export function scoreTrack3Session(input: ScoreSessionInput): Track3Report {
  const bars = EXPERIENCE_BARS[input.level];
  const domainDef = DOMAIN_MAP[input.domainId];
  const baseWeights = domainDef.baseWeights;

  // 1. Question scores
  const questionScores: Record<string, number> = {};
  for (const q of input.questions) {
    const chosenOptionId = input.answers[q.id];
    const option = q.options.find((o) => o.id === chosenOptionId);
    // Default to lowest score if unanswered (should not happen in normal flow)
    questionScores[q.id] = option ? option.score : 1;
  }

  // Separate non-AI questions (shared + module) and AI questions
  const nonAIQuestions = input.questions.filter((q) => q.domain !== 'ai');
  const aiQuestions = input.questions.filter((q) => q.domain === 'ai');

  // 2. Competency scores: mean of scores of shared & module questions that list that competency
  const competencyResults: CompetencyScoreResult[] = [];
  const compScoresMap: Record<CompetencyKey, number> = {} as any;

  for (const comp of COMPETENCY_KEYS) {
    const contributingQuestions = nonAIQuestions.filter((q) =>
      q.competencies.includes(comp)
    );
    const count = contributingQuestions.length;
    let score = 2.0; // fallback if somehow no questions
    if (count > 0) {
      const sum = contributingQuestions.reduce(
        (acc, q) => acc + questionScores[q.id],
        0
      );
      score = Math.round((sum / count) * 10) / 10;
    }
    compScoresMap[comp] = score;

    competencyResults.push({
      competency: comp,
      label: COMPETENCY_LABELS[comp],
      score,
      evidenceStrength: getEvidenceStrength(count),
      expectedBar: bars.expected,
      strongBar: bars.strong,
      status: getBarStatus(score, bars),
    });
  }

  // 3. Group scores: mean of session's module questions whose groups include that group
  // Collect all unique groups in session
  const assessedGroupIds = new Set<string>();
  const moduleQuestions = input.questions.filter(
    (q) => q.domain === input.domainId
  );

  for (const q of moduleQuestions) {
    for (const g of q.groups) {
      assessedGroupIds.add(g);
    }
  }

  const groupScores: GroupScoreResult[] = [];
  for (const groupId of assessedGroupIds) {
    const questionsWithGroup = moduleQuestions.filter((q) =>
      q.groups.includes(groupId)
    );
    const count = questionsWithGroup.length;
    if (count > 0) {
      const sum = questionsWithGroup.reduce(
        (acc, q) => acc + questionScores[q.id],
        0
      );
      const score = Math.round((sum / count) * 10) / 10;

      // Group name from tags
      const sampleTag = TRACK3_TAGS.find((t) => t.groupId === groupId);
      const groupName = sampleTag ? sampleTag.group : groupId;

      groupScores.push({
        groupId,
        groupName,
        domain: input.domainId,
        score,
        evidenceStrength: getEvidenceStrength(count),
        expectedBar: bars.expected,
        strongBar: bars.strong,
        status: getBarStatus(score, bars),
      });
    }
  }

  // 4. Tag status for every selected tag
  const selectedTagResults: TagScoreResult[] = [];
  for (const tagId of input.selectedTagIds) {
    const tagDef = TAG_MAP[tagId];
    const label = tagDef ? tagDef.label : tagId;
    const groupName = tagDef ? tagDef.group : '';
    const groupId = tagDef ? tagDef.groupId : '';
    const kind = tagDef ? tagDef.kind : 'skill';

    const directQuestions = moduleQuestions.filter((q) =>
      q.tags.includes(tagId)
    );
    const hasDirectQuestion = directQuestions.length > 0;
    const groupHasQuestion = assessedGroupIds.has(groupId);
    const matchedGroup = groupScores.find((g) => g.groupId === groupId);

    if (kind === 'tool') {
      if (groupHasQuestion) {
        selectedTagResults.push({
          tagId,
          label,
          groupName,
          kind: 'tool',
          status: 'Listed (tool), assessed through group',
          score: matchedGroup?.score,
          scoreLabel: `Listed (tool), assessed through ${groupName}`,
        });
      } else {
        selectedTagResults.push({
          tagId,
          label,
          groupName,
          kind: 'tool',
          status: 'Listed (tool), not assessed',
          scoreLabel: 'Listed (tool), not assessed',
        });
      }
    } else {
      if (hasDirectQuestion) {
        const sum = directQuestions.reduce(
          (acc, q) => acc + questionScores[q.id],
          0
        );
        const directScore =
          Math.round((sum / directQuestions.length) * 10) / 10;
        selectedTagResults.push({
          tagId,
          label,
          groupName,
          kind: 'skill',
          status: 'Assessed directly',
          score: directScore,
        });
      } else if (groupHasQuestion) {
        selectedTagResults.push({
          tagId,
          label,
          groupName,
          kind: 'skill',
          status: 'Assessed at group level',
          score: matchedGroup?.score,
          scoreLabel: 'group score',
        });
      } else {
        selectedTagResults.push({
          tagId,
          label,
          groupName,
          kind: 'skill',
          status: 'Not assessed',
        });
      }
    }
  }

  // 5. weightedAverage = sum of (domain weight x competency score)
  let weightedAverage = 0;
  for (const comp of COMPETENCY_KEYS) {
    const weight = baseWeights[comp] || 0;
    const score = compScoresMap[comp];
    weightedAverage += weight * score;
  }

  // 6. Overall readiness = round(clamp((weightedAverage - 2) / 2, 0, 1) * 100)
  const clampedReadinessFraction = Math.min(
    1,
    Math.max(0, (weightedAverage - 2) / 2)
  );
  const overallScore = Math.round(clampedReadinessFraction * 100);

  // 7. Labels: 0 to 34 "Early stage"; 35 to 54 "Developing"; 55 to 74 "Job-ready"; 75 to 100 "Strong"
  let overallLabel: 'Early stage' | 'Developing' | 'Job-ready' | 'Strong';
  if (overallScore >= 75) {
    overallLabel = 'Strong';
  } else if (overallScore >= 55) {
    overallLabel = 'Job-ready';
  } else if (overallScore >= 35) {
    overallLabel = 'Developing';
  } else {
    overallLabel = 'Early stage';
  }

  // 8. AI score (only if AI questions exist in session)
  let aiResult: Track3Report['aiResult'] = undefined;
  let aiMean: number | undefined = undefined;

  if (aiQuestions.length > 0) {
    const aiSum = aiQuestions.reduce(
      (acc, q) => acc + questionScores[q.id],
      0
    );
    aiMean = Math.round((aiSum / aiQuestions.length) * 10) / 10;
    const aiFraction = Math.min(1, Math.max(0, (aiMean - 2) / 2));
    const aiReadiness = Math.round(aiFraction * 100);

    // AI groups
    const aiGroupIds = new Set<string>();
    for (const q of aiQuestions) {
      for (const g of q.groups) {
        aiGroupIds.add(g);
      }
    }

    const aiGroupsAssessed: GroupScoreResult[] = [];
    for (const groupId of aiGroupIds) {
      const qWithGroup = aiQuestions.filter((q) => q.groups.includes(groupId));
      const count = qWithGroup.length;
      if (count > 0) {
        const sum = qWithGroup.reduce(
          (acc, q) => acc + questionScores[q.id],
          0
        );
        const score = Math.round((sum / count) * 10) / 10;
        const sampleTag = AI_TAGS.find((t) => t.groupId === groupId);
        const groupName = sampleTag ? sampleTag.group : groupId;

        aiGroupsAssessed.push({
          groupId,
          groupName,
          domain: 'ai',
          score,
          evidenceStrength: getEvidenceStrength(count),
          expectedBar: bars.expected,
          strongBar: bars.strong,
          status: getBarStatus(score, bars),
        });
      }
    }

    aiResult = {
      aiMean,
      aiReadiness,
      status: getBarStatus(aiMean, bars),
      groupsAssessed: aiGroupsAssessed,
    };
  }

  // 9. Strengths = up to 3 competencies at or above the strong bar, highest first
  const strengths = [...competencyResults]
    .filter((c) => c.score >= bars.strong)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Gaps = up to 3 competencies below the expected bar, lowest first
  let gaps = [...competencyResults]
    .filter((c) => c.score < bars.expected)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  // If there are no gaps, show the lowest-scoring competency as "Next to build"
  if (gaps.length === 0) {
    const lowest = [...competencyResults].sort((a, b) => a.score - b.score)[0];
    if (lowest) {
      gaps = [lowest];
    }
  }

  // 10. Missed-question review: list up to 3 questions across the whole session (including AI)
  // where the chosen option scored 2 or less, lowest first.
  const missedQuestions: MissedQuestionReviewItem[] = [];
  const lowQuestions = input.questions
    .filter((q) => questionScores[q.id] <= 2)
    .sort((a, b) => questionScores[a.id] - questionScores[b.id]);

  for (const q of lowQuestions.slice(0, 3)) {
    const chosenOptionId = input.answers[q.id];
    const chosenOption = q.options.find((o) => o.id === chosenOptionId);
    const score4Option = q.options.find((o) => o.score === 4);

    missedQuestions.push({
      questionId: q.id,
      questionText: q.text,
      userAnswerText: chosenOption?.text || '',
      userScore: questionScores[q.id],
      strongerApproachText: score4Option?.text || '',
    });
  }

  // Scope line logic
  let scopeLine = 'General management assessment';
  if (input.confidence === 'low') {
    scopeLine = 'General management assessment';
  } else if (input.presetId) {
    const preset = PRESET_ROLES.find((p) => p.id === input.presetId);
    // Check if tags are unchanged
    const isUnchanged =
      preset &&
      preset.tags.length === input.selectedTagIds.length &&
      preset.tags.every((t) => input.selectedTagIds.includes(t));

    if (isUnchanged && !input.isTypedRole) {
      scopeLine = `Role-specific assessment: ${input.roleTitle}`;
    } else {
      const topTags = input.selectedTagIds
        .slice(0, 4)
        .map((id) => TAG_MAP[id]?.label || id);
      const remainingCount = input.selectedTagIds.length - 4;
      const tagStr =
        remainingCount > 0
          ? `${topTags.join(', ')}, +${remainingCount} more`
          : topTags.join(', ');
      scopeLine = `Custom assessment for ${domainDef.label}: ${tagStr}`;
    }
  } else {
    const topTags = input.selectedTagIds
      .slice(0, 4)
      .map((id) => TAG_MAP[id]?.label || id);
    const remainingCount = input.selectedTagIds.length - 4;
    const tagStr =
      remainingCount > 0
        ? `${topTags.join(', ')}, +${remainingCount} more`
        : topTags.join(', ');
    scopeLine = `Custom assessment for ${domainDef.label}: ${tagStr}`;
  }

  // Next steps
  const nextSteps = selectNextSteps({
    level: input.level,
    roleTitle: input.roleTitle,
    domainId: input.domainId,
    competencyScores: competencyResults,
    groupScores,
    aiMean,
    aiGroupsAssessed: aiResult?.groupsAssessed,
    missedQuestions,
    selectedTagIds: input.selectedTagIds,
  });

  // Warnings
  const lowEvidenceCount = competencyResults.filter(
    (c) => c.evidenceStrength === 'low'
  ).length;
  const lowEvidenceWarning = lowEvidenceCount >= 3;

  // Selected tags span more than 6 groups?
  const selectedGroupIds = new Set<string>();
  for (const tId of input.selectedTagIds) {
    const def = TAG_MAP[tId];
    if (def) selectedGroupIds.add(def.groupId);
  }
  const tooManyGroupsWarning = selectedGroupIds.size > 6;

  const disclaimer =
    'This is a preparation estimate based on your choices in a fixed set of scenarios. It is not a prediction of hiring outcomes. Skills marked as tools are self-declared and were not tested for product knowledge.';

  return {
    roleTitle: input.roleTitle,
    domainId: input.domainId,
    level: input.level,
    confidence: input.confidence,
    scopeLine,
    overallScore,
    overallLabel,
    competencies: competencyResults,
    groupScores,
    selectedTags: selectedTagResults,
    aiResult,
    strengths,
    gaps,
    missedQuestions,
    nextSteps,
    disclaimer,
    lowEvidenceWarning,
    tooManyGroupsWarning,
  };
}
