/**
 * Have at least 3 practitioners per domain rate each option independently (for AI questions, people who build with AI tools), then revise flagged items before launch.
 */

import { ALL_AI_QUESTIONS } from '../aiQuestions';
import { MODULE_QUESTIONS, SHARED_QUESTIONS } from '../questions';
import { Track3Question } from '../types';

export interface OptionReviewRating {
  reviewerId: string;
  optionId: 'o1' | 'o2' | 'o3' | 'o4';
  rating: 1 | 2 | 3 | 4;
}

export interface ReviewQuestionItem {
  question: Track3Question;
  reviewerRatings: OptionReviewRating[];
}

export const ALL_QUESTIONS_FOR_REVIEW: ReviewQuestionItem[] = [
  ...SHARED_QUESTIONS,
  ...MODULE_QUESTIONS,
  ...ALL_AI_QUESTIONS,
].map((q) => ({
  question: q,
  reviewerRatings: [],
}));

export interface QuestionValidationSummary {
  questionId: string;
  hasEnoughReviewers: boolean;
  orderMatchesKey: boolean;
  hasSevereDisagreement: boolean; // reviewers disagree by 2 or more points on same option
  notes: string[];
}

/**
 * Computes median of an array of numbers
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Evaluates whether median reviewer rating ranks the options in the same order as the key,
 * and flags questions where reviewers disagree by 2 or more points.
 */
export function validateQuestionReviews(
  item: ReviewQuestionItem
): QuestionValidationSummary {
  const { question, reviewerRatings } = item;
  const reviewers = Array.from(new Set(reviewerRatings.map((r) => r.reviewerId)));
  const hasEnoughReviewers = reviewers.length >= 3;
  const notes: string[] = [];

  let hasSevereDisagreement = false;

  // Check each option's ratings
  const optionMedians: { optionId: string; median: number; keyScore: number }[] = [];

  for (const opt of question.options) {
    const ratingsForOption = reviewerRatings
      .filter((r) => r.optionId === opt.id)
      .map((r) => r.rating);

    if (ratingsForOption.length >= 2) {
      const min = Math.min(...ratingsForOption);
      const max = Math.max(...ratingsForOption);
      if (max - min >= 2) {
        hasSevereDisagreement = true;
        notes.push(
          `Reviewers disagreed by ${max - min} points on option ${opt.id} ("${opt.text.slice(0, 30)}...")`
        );
      }
    }

    const med = median(ratingsForOption);
    optionMedians.push({
      optionId: opt.id,
      median: med,
      keyScore: opt.score,
    });
  }

  // Check if median ranking matches key order (ranking of scores 1..4)
  // Higher key score should have higher median rating
  let orderMatchesKey = true;
  if (hasEnoughReviewers) {
    // Sort by key score ascending
    const sortedByKey = [...optionMedians].sort((a, b) => a.keyScore - b.keyScore);
    for (let i = 0; i < sortedByKey.length - 1; i++) {
      if (sortedByKey[i].median > sortedByKey[i + 1].median) {
        orderMatchesKey = false;
        notes.push(
          `Median rank inverted between option ${sortedByKey[i].optionId} (key ${sortedByKey[i].keyScore}, med ${sortedByKey[i].median}) and ${sortedByKey[i + 1].optionId} (key ${sortedByKey[i + 1].keyScore}, med ${sortedByKey[i + 1].median})`
        );
      }
    }
  }

  return {
    questionId: question.id,
    hasEnoughReviewers,
    orderMatchesKey,
    hasSevereDisagreement,
    notes,
  };
}
