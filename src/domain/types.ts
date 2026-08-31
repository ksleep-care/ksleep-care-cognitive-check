export type GameKey =
  | 'story'
  | 'reaction'
  | 'digit'
  | 'stroop'
  | 'storyDelayed'
  | 'pattern'
  | 'vigilance';

export type SessionStep =
  | { type: 'intro' }
  | { type: 'transition'; index: number }
  | { type: 'game'; index: number }
  | { type: 'report' };

export interface StoryResult {
  correct: number;
  total: number;
}

export interface TimedAccuracyResult {
  averageMs: number;
  correct: number;
  total: number;
}

export interface ReactionResult {
  averageMs: number;
  hits: number;
  total: number;
}

export interface DigitResult {
  maxSpan: number;
  correct: number;
  total: number;
}

export interface VigilanceResult {
  averageMs: number;
  hits: number;
  total: number;
  misses: number;
}

export interface SessionResults {
  story: StoryResult;
  reaction: ReactionResult;
  digit: DigitResult;
  stroop: TimedAccuracyResult;
  storyDelayed: StoryResult;
  pattern: TimedAccuracyResult;
  vigilance: VigilanceResult;
}

export type SessionDraft = Partial<SessionResults>;
export type GameResult = SessionResults[GameKey];

export interface CognitiveReport {
  immediateMemoryPercent: number;
  memoryRetentionPercent: number;
  reactionAverageMs: number;
  workingMemorySpan: number;
  stroopAccuracyPercent: number;
  patternAccuracyPercent: number;
  vigilanceAverageMs: number | null;
  vigilanceMisses: number;
}
