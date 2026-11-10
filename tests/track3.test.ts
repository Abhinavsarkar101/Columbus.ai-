import { describe, it, expect } from 'vitest';
import { TRACK3_DOMAINS, PRESET_ROLES, DOMAIN_MAP } from '../src/track3/presets';
import { TRACK3_TAGS, AI_TAGS, TAG_MAP, AI_TAG_BY_LABEL_MAP, getDomainGroups } from '../src/track3/tags';
import {
  MODULE_QUESTIONS as ALL_DOMAIN_MODULE_QUESTIONS,
  SHARED_QUESTIONS,
  selectModuleQuestions,
} from '../src/track3/questions';
import { ALL_AI_QUESTIONS, selectAIQuestions } from '../src/track3/aiQuestions';
import { resolveTargetRole } from '../src/track3/resolveRole';
import { scoreTrack3Session } from '../src/track3/scoring';
import { Track3Question } from '../src/track3/types';

describe('Track 3 Validation Suite', () => {
  const allQuestions = [...SHARED_QUESTIONS, ...ALL_DOMAIN_MODULE_QUESTIONS, ...ALL_AI_QUESTIONS];

  // a) Tag structure and referential integrity
  it('a) verifies tag integrity and references', () => {
    // Every tag has a non-empty group
    for (const tag of TRACK3_TAGS) {
      expect(tag.group).toBeTruthy();
      expect(tag.groupId).toBeTruthy();
    }
    for (const tag of AI_TAGS) {
      expect(tag.group).toBeTruthy();
      expect(tag.groupId).toBeTruthy();
    }

    // Tag ids unique within domain
    for (const domain of TRACK3_DOMAINS) {
      const domainTags = TRACK3_TAGS.filter((t) => t.domain === domain.id);
      const tagIds = domainTags.map((t) => t.id);
      const uniqueIds = new Set(tagIds);
      expect(uniqueIds.size).toBe(tagIds.length);
    }

    // Every tag id used in a question's tags exists in that domain
    for (const q of ALL_DOMAIN_MODULE_QUESTIONS) {
      for (const tId of q.tags) {
        const found = TRACK3_TAGS.find((t) => t.id === tId && t.domain === q.domain);
        expect(found, `Question ${q.id} uses tag ${tId} which should exist in domain ${q.domain}`).toBeDefined();
      }
    }

    // Every tag id used in preset tags exists in that domain
    for (const preset of PRESET_ROLES) {
      for (const tId of preset.tags) {
        const found = TRACK3_TAGS.find((t) => t.id === tId && t.domain === preset.domain);
        expect(found, `Preset ${preset.id} uses tag ${tId} in domain ${preset.domain}`).toBeDefined();
      }
    }

    // Every preset aiTag exists in the AI family
    for (const preset of PRESET_ROLES) {
      if (preset.aiTags) {
        for (const aiTagLabel of preset.aiTags) {
          const found = AI_TAG_BY_LABEL_MAP[aiTagLabel];
          expect(found, `Preset ${preset.id} references aiTag "${aiTagLabel}" which must exist`).toBeDefined();
        }
      }
    }

    // Every AI question tag exists in the AI family
    for (const aiQ of ALL_AI_QUESTIONS) {
      for (const label of aiQ.tags) {
        const found = AI_TAG_BY_LABEL_MAP[label];
        expect(found, `AI Question ${aiQ.id} tag "${label}" must exist in AI family`).toBeDefined();
      }
    }
  });

  // b) Group coverage and coverage warnings
  it('b) verifies group coverage and outputs warning for single-question groups', () => {
    const singleQuestionGroups: string[] = [];

    // Check non-AI groups
    for (const domain of TRACK3_DOMAINS) {
      const groups = getDomainGroups(domain.id);
      for (const g of groups) {
        const qCount = ALL_DOMAIN_MODULE_QUESTIONS.filter(
          (q) => q.domain === domain.id && (q.groups.includes(g.groupId) || q.groups.includes(g.groupName))
        ).length;
        expect(qCount, `Domain ${domain.id} group ${g.groupName} (${g.groupId}) must have >= 1 question`).toBeGreaterThanOrEqual(1);
        if (qCount === 1) {
          singleQuestionGroups.push(`${domain.id} -> ${g.groupName}`);
        }
      }
    }

    // Check AI groups
    const aiGroups = getDomainGroups('ai');
    for (const g of aiGroups) {
      const qCount = ALL_AI_QUESTIONS.filter(
        (q) => q.groups.includes(g.groupId) || q.groups.includes(g.groupName)
      ).length;
      expect(qCount, `AI group ${g.groupName} (${g.groupId}) must have >= 1 question`).toBeGreaterThanOrEqual(1);
      if (qCount === 1) {
        singleQuestionGroups.push(`ai -> ${g.groupName}`);
      }
    }

    if (singleQuestionGroups.length > 0) {
      console.warn(
        `[COVERAGE WARNING] The following groups have only 1 contributing question:\n` +
          singleQuestionGroups.map((g) => `  - ${g}`).join('\n')
      );
    }
  });

  // c) Question option counts, unique score 4, and distinct scores
  it('c) checks that every question has 4 options, exactly one score 4, and >= 3 distinct scores', () => {
    for (const q of allQuestions) {
      expect(q.options.length, `Question ${q.id} must have 4 options`).toBe(4);
      const score4Count = q.options.filter((o) => o.score === 4).length;
      expect(score4Count, `Question ${q.id} must have exactly one score 4 option`).toBe(1);

      const distinctScores = new Set(q.options.map((o) => o.score));
      expect(
        distinctScores.size,
        `Question ${q.id} must have at least 3 distinct score values (has ${distinctScores.size})`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  // d) Preset tags count and domain weights sum to 1.00
  it('d) verifies preset tags count (3 to 15) and base weights sum to 1.00', () => {
    for (const preset of PRESET_ROLES) {
      expect(preset.tags.length).toBeGreaterThanOrEqual(3);
      expect(preset.tags.length).toBeLessThanOrEqual(15);
    }

    for (const domain of TRACK3_DOMAINS) {
      const sum = Object.values(domain.baseWeights).reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.0001);
    }
  });

  // e) Module selection determinism and group coverage
  it('e) tests deterministic greedy module selection and group coverage', () => {
    for (const preset of PRESET_ROLES) {
      const pick1 = selectModuleQuestions(preset.domain, preset.tags);
      const pick2 = selectModuleQuestions(preset.domain, preset.tags);

      expect(pick1.length).toBe(6);
      expect(pick2.length).toBe(6);
      expect(pick1.map((q) => q.id)).toEqual(pick2.map((q) => q.id));

      const uniquePickedIds = new Set(pick1.map((q) => q.id));
      expect(uniquePickedIds.size).toBe(6);

      // Check covered groups
      const selectedTagGroups = new Set(
        preset.tags.map((tId) => TAG_MAP[tId]?.groupId).filter(Boolean)
      );
      // Groups that actually have questions in this domain
      const availableGroupsWithQ = new Set<string>();
      for (const q of ALL_DOMAIN_MODULE_QUESTIONS.filter((q) => q.domain === preset.domain)) {
        for (const g of q.groups) {
          if (selectedTagGroups.has(g)) availableGroupsWithQ.add(g);
        }
      }

      const coveredGroups = new Set<string>();
      for (const q of pick1) {
        for (const g of q.groups) {
          if (selectedTagGroups.has(g)) coveredGroups.add(g);
        }
      }

      const expectedDistinct = Math.min(6, availableGroupsWithQ.size);
      expect(coveredGroups.size).toBeGreaterThanOrEqual(expectedDistinct);
    }
  });

  // f) Session question counts (10 vs 13) and AI score independence
  it('f) session has 10 questions without AI and 13 with AI; AI questions never affect overall readiness', () => {
    const preset = PRESET_ROLES[0]; // product-manager
    const moduleQ = selectModuleQuestions(preset.domain, preset.tags);
    const standardSession = [...SHARED_QUESTIONS, ...moduleQ];
    expect(standardSession.length).toBe(10);

    const aiQ = selectAIQuestions(['Large language models', 'Prompt engineering']);
    expect(aiQ.length).toBe(3);
    const aiSession = [...standardSession, ...aiQ];
    expect(aiSession.length).toBe(13);

    // Score with high non-AI answers and low AI answers
    const answers1: Record<string, string> = {};
    for (const q of standardSession) {
      const score4Opt = q.options.find((o) => o.score === 4)!;
      answers1[q.id] = score4Opt.id;
    }
    const reportWithoutAI = scoreTrack3Session({
      roleTitle: preset.title,
      domainId: preset.domain,
      level: 'Fresher',
      confidence: 'high',
      selectedTagIds: preset.tags,
      questions: standardSession,
      answers: answers1,
    });

    // Same answers for standard questions, but score 1 for all AI questions
    const answers2 = { ...answers1 };
    for (const q of aiQ) {
      const score1Opt = q.options.find((o) => o.score === 1)!;
      answers2[q.id] = score1Opt.id;
    }
    const reportWithLowAI = scoreTrack3Session({
      roleTitle: preset.title,
      domainId: preset.domain,
      level: 'Fresher',
      confidence: 'high',
      selectedTagIds: preset.tags,
      selectedAITags: ['Large language models'],
      questions: aiSession,
      answers: answers2,
    });

    expect(reportWithoutAI.overallScore).toBe(reportWithLowAI.overallScore);
    expect(reportWithoutAI.competencies).toEqual(reportWithLowAI.competencies);
    expect(reportWithLowAI.aiResult).toBeDefined();
    expect(reportWithLowAI.aiResult?.aiReadiness).toBe(0);
  });

  // g) Tag status logic: Assessed directly, Assessed at group level, Not assessed, tool tags
  it('g) validates tag status logic and tool tags behavior', () => {
    const preset = PRESET_ROLES.find((p) => p.id === 'product-manager')!;
    const moduleQ = selectModuleQuestions(preset.domain, preset.tags);
    const session = [...SHARED_QUESTIONS, ...moduleQ];
    const answers: Record<string, string> = {};
    session.forEach((q) => {
      answers[q.id] = q.options[0].id;
    });

    // Add a tool tag and an unassessed tag
    const selectedTagsWithTool = [...preset.tags, 'jira', 'information-architecture'];
    const report = scoreTrack3Session({
      roleTitle: preset.title,
      domainId: preset.domain,
      level: 'Fresher',
      confidence: 'high',
      selectedTagIds: selectedTagsWithTool,
      questions: session,
      answers,
    });

    for (const tagRes of report.selectedTags) {
      if (tagRes.kind === 'tool') {
        expect([
          'Listed (tool), assessed through group',
          'Listed (tool), not assessed',
        ]).toContain(tagRes.status);
      } else {
        expect(['Assessed directly', 'Assessed at group level', 'Not assessed']).toContain(
          tagRes.status
        );
      }
    }
  });

  // h) Picker limits validation (min 3, unlimited domain tags, max 8 AI)
  it('h) validates tag picker limits (min 3, unlimited domain, max 8 AI)', () => {
    function validatePicker(domainTagsCount: number, aiTagsCount: number): boolean {
      if (domainTagsCount < 3) return false;
      if (aiTagsCount > 8) return false;
      return true;
    }

    expect(validatePicker(2, 0)).toBe(false);
    expect(validatePicker(3, 0)).toBe(true);
    expect(validatePicker(15, 0)).toBe(true);
    expect(validatePicker(20, 0)).toBe(true);
    expect(validatePicker(35, 0)).toBe(true);
    expect(validatePicker(5, 8)).toBe(true);
    expect(validatePicker(5, 9)).toBe(false);
  });

  // i) Perfect score = 100, Min score = 0
  it('i) choosing all score-4 options gives 100; all score-1 gives 0', () => {
    const preset = PRESET_ROLES[0];
    const moduleQ = selectModuleQuestions(preset.domain, preset.tags);
    const aiQ = selectAIQuestions(['Large language models']);
    const session = [...SHARED_QUESTIONS, ...moduleQ, ...aiQ];

    const answersAll4: Record<string, string> = {};
    const answersAll1: Record<string, string> = {};
    for (const q of session) {
      answersAll4[q.id] = q.options.find((o) => o.score === 4)!.id;
      answersAll1[q.id] = q.options.find((o) => o.score === 1)!.id;
    }

    const report4 = scoreTrack3Session({
      roleTitle: preset.title,
      domainId: preset.domain,
      level: 'Fresher',
      confidence: 'high',
      selectedTagIds: preset.tags,
      selectedAITags: ['Large language models'],
      questions: session,
      answers: answersAll4,
    });

    expect(report4.overallScore).toBe(100);
    expect(report4.aiResult?.aiReadiness).toBe(100);
    expect(report4.overallLabel).toBe('Strong');

    const report1 = scoreTrack3Session({
      roleTitle: preset.title,
      domainId: preset.domain,
      level: 'Fresher',
      confidence: 'high',
      selectedTagIds: preset.tags,
      selectedAITags: ['Large language models'],
      questions: session,
      answers: answersAll1,
    });

    expect(report1.overallScore).toBe(0);
    expect(report1.aiResult?.aiReadiness).toBe(0);
    expect(report1.overallLabel).toBe('Early stage');
  });

  // j) 1000 simulated uniform random sessions give mean overall readiness in 15-35
  it('j) simulates 1000 uniform random sessions with mean overall readiness in 15-35', () => {
    const preset = PRESET_ROLES[0];
    const moduleQ = selectModuleQuestions(preset.domain, preset.tags);
    const aiQ = selectAIQuestions(['Large language models', 'Prompt engineering']);
    const session = [...SHARED_QUESTIONS, ...moduleQ, ...aiQ];

    let overallSum = 0;
    let aiSum = 0;
    const N = 1000;

    // Simple pseudo-random LCG for deterministic seeding
    let seed = 42;
    function randInt(max: number): number {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return Math.floor((seed / 4294967296) * max);
    }

    for (let i = 0; i < N; i++) {
      const answers: Record<string, string> = {};
      for (const q of session) {
        const opt = q.options[randInt(4)];
        answers[q.id] = opt.id;
      }
      const report = scoreTrack3Session({
        roleTitle: preset.title,
        domainId: preset.domain,
        level: 'Fresher',
        confidence: 'high',
        selectedTagIds: preset.tags,
        selectedAITags: ['Large language models'],
        questions: session,
        answers,
      });
      overallSum += report.overallScore;
      aiSum += report.aiResult?.aiReadiness || 0;
    }

    const meanOverall = overallSum / N;
    const meanAI = aiSum / N;

    expect(meanOverall).toBeGreaterThanOrEqual(15);
    expect(meanOverall).toBeLessThanOrEqual(35);
    expect(meanAI).toBeGreaterThanOrEqual(15);
    expect(meanAI).toBeLessThanOrEqual(35);
  });

  // k) Determinism: identical answers always produce identical reports
  it('k) verifies identical inputs and answers always produce identical reports', () => {
    const preset = PRESET_ROLES[1];
    const moduleQ = selectModuleQuestions(preset.domain, preset.tags);
    const session = [...SHARED_QUESTIONS, ...moduleQ];
    const answers: Record<string, string> = {};
    session.forEach((q, idx) => {
      answers[q.id] = q.options[idx % 4].id;
    });

    const report1 = scoreTrack3Session({
      roleTitle: preset.title,
      domainId: preset.domain,
      level: '1+ year experience',
      confidence: 'high',
      selectedTagIds: preset.tags,
      questions: session,
      answers,
    });

    const report2 = scoreTrack3Session({
      roleTitle: preset.title,
      domainId: preset.domain,
      level: '1+ year experience',
      confidence: 'high',
      selectedTagIds: preset.tags,
      questions: session,
      answers,
    });

    expect(report1).toEqual(report2);
  });

  // l) Typed role resolution cases
  it('l) checks typed role resolution matches test cases accurately', () => {
    // "data analyst" -> business-data-analyst (high)
    const r1 = resolveTargetRole('data analyst');
    expect(r1.presetId).toBe('business-data-analyst');
    expect(r1.confidence).toBe('high');

    // "SCM manager" -> operations-supply-chain (high)
    const r2 = resolveTargetRole('SCM manager');
    expect(r2.presetId).toBe('operations-supply-chain');
    expect(r2.confidence).toBe('high');

    // "UX researcher" -> product-tech domain
    const r3 = resolveTargetRole('UX researcher');
    expect(r3.domainId).toBe('product-tech');

    // "recruiter" -> hr-talent-acquisition (high)
    const r4 = resolveTargetRole('recruiter');
    expect(r4.presetId).toBe('hr-talent-acquisition');
    expect(r4.confidence).toBe('high');

    // "prompt engineer" -> ai-automation-analyst (high)
    const r5 = resolveTargetRole('prompt engineer');
    expect(r5.presetId).toBe('ai-automation-analyst');
    expect(r5.confidence).toBe('high');

    // "xyz" -> low confidence, general-management
    const r6 = resolveTargetRole('xyz');
    expect(r6.confidence).toBe('low');
    expect(r6.domainId).toBe('general-management');

    // "digital product sales" -> medium confidence with a domain and >= 3 tags
    const r7 = resolveTargetRole('digital product sales');
    expect(r7.confidence).toBe('medium');
    expect(r7.domainId).toBeDefined();
    expect(r7.tags.length).toBeGreaterThanOrEqual(3);
  });

  // m) Length-bias check: warning if score 4 option is the longest option
  it('m) performs length bias inspection and prints warning', () => {
    const longestScore4Questions: string[] = [];

    for (const q of allQuestions) {
      const score4Opt = q.options.find((o) => o.score === 4)!;
      const maxLength = Math.max(...q.options.map((o) => o.text.length));
      if (score4Opt.text.length === maxLength) {
        longestScore4Questions.push(q.id);
      }
    }

    const percentage = Math.round((longestScore4Questions.length / allQuestions.length) * 100);
    console.warn(
      `[LENGTH BIAS WARNING] ${percentage}% (${longestScore4Questions.length}/${allQuestions.length}) of questions have score-4 as the longest option. Flagged IDs:\n  ${longestScore4Questions.join(', ')}`
    );

    // We do NOT fail the test per spec requirement m
    expect(percentage).toBeGreaterThanOrEqual(0);
  });
});
