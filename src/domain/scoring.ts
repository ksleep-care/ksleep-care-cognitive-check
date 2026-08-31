import type { CognitiveReport, SessionDraft, SessionResults } from './types';

const REQUIRED_KEYS: Array<keyof SessionResults> = [
  'story',
  'reaction',
  'digit',
  'stroop',
  'storyDelayed',
  'pattern',
  'vigilance',
];

function percent(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function calculateReport(results: SessionDraft): CognitiveReport {
  const isComplete = REQUIRED_KEYS.every((key) => results[key] !== undefined);
  if (!isComplete) {
    throw new Error('7개 활동 결과가 모두 필요합니다.');
  }

  const complete = results as SessionResults;
  const immediateRatio = complete.story.total > 0
    ? complete.story.correct / complete.story.total
    : 0;
  const delayedRatio = complete.storyDelayed.total > 0
    ? complete.storyDelayed.correct / complete.storyDelayed.total
    : 0;

  return {
    immediateMemoryPercent: percent(complete.story.correct, complete.story.total),
    memoryRetentionPercent: immediateRatio > 0
      ? Math.min(100, Math.round((delayedRatio / immediateRatio) * 100))
      : 0,
    reactionAverageMs: complete.reaction.averageMs,
    workingMemorySpan: complete.digit.maxSpan,
    stroopAccuracyPercent: percent(complete.stroop.correct, complete.stroop.total),
    patternAccuracyPercent: percent(complete.pattern.correct, complete.pattern.total),
    vigilanceAverageMs: complete.vigilance.hits > 0 ? complete.vigilance.averageMs : null,
    vigilanceMisses: complete.vigilance.misses,
  };
}
