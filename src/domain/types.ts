export type GameKey =
  | 'story'
  | 'reaction'
  | 'digit'
  | 'stroop'
  | 'storyDelayed'
  | 'pattern'
  | 'vigilance';

/** 레벨은 기억·숫자·색깔·패턴 게임의 난이도만 바꾼다. 3분 PVT에는 영향을 주지 않는다. */
export type Level = 1 | 2 | 3 | 4;

export type TabKey = 'play' | 'trend' | 'guide';

export type SessionStep =
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
  earlyPresses: number;
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
  delayedMemoryPercent: number;
  memoryRetentionPercent: number;
  reactionAverageMs: number;
  reactionEarlyPresses: number;
  workingMemorySpan: number;
  stroopAccuracyPercent: number;
  patternAccuracyPercent: number;
  vigilanceAverageMs: number | null;
  vigilanceMisses: number;
}

/** 결과 한 줄을 사람 말로 설명하는 카드. 숫자만 던지지 않기 위한 계약. */
export interface MetricCard {
  key: string;
  icon: string;
  /** 과제 이름 */
  title: string;
  /** 무엇을 보는 과제인지 */
  looksAt: string;
  /** 이번 값 */
  value: string;
  /** 어느 방향으로 읽는지 */
  direction: string;
  /** 비교 가능한 범위 */
  comparable: string;
  /** 한계 */
  limit: string;
}
