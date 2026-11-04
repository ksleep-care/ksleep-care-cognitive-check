import type { Level } from './types';

/** 게임용 난이도. 임상 검사 프로토콜이나 규준이 아니다. */
export interface LevelConfig {
  storyQuestions: number; storyReadMs: number; storyParagraphs: number; storyDistractor: boolean;
  digitStart: number; digitMax: number; digitMaxTrials: number;
  stroopTrials: number; stroopDeadlineMs: number; stroopIncongruent: number;
  patternTrials: number; patternSymbols: number; patternDeadlineMs: number;
  reactionTrials: number; reactionWaitMaxMs: number; reactionDeadlineMs: number;
  vigilanceTrials: number; vigilanceWaitMaxMs: number; vigilanceDeadlineMs: number;
}
export const LEVEL_CONFIG: Record<Level, LevelConfig> = {
  1: { storyQuestions: 4, storyReadMs: 25000, storyParagraphs: 2, storyDistractor: false,
    digitStart: 3, digitMax: 6, digitMaxTrials: 6,
    stroopTrials: 8, stroopDeadlineMs: 5000, stroopIncongruent: 0.5,
    patternTrials: 6, patternSymbols: 3, patternDeadlineMs: 6500,
    reactionTrials: 6, reactionWaitMaxMs: 2500, reactionDeadlineMs: 2500,
    vigilanceTrials: 8, vigilanceWaitMaxMs: 3500, vigilanceDeadlineMs: 2200 },
  2: { storyQuestions: 5, storyReadMs: 25000, storyParagraphs: 3, storyDistractor: false,
    digitStart: 4, digitMax: 7, digitMaxTrials: 6,
    stroopTrials: 12, stroopDeadlineMs: 3500, stroopIncongruent: 0.5,
    patternTrials: 8, patternSymbols: 4, patternDeadlineMs: 5000,
    reactionTrials: 8, reactionWaitMaxMs: 3500, reactionDeadlineMs: 1800,
    vigilanceTrials: 10, vigilanceWaitMaxMs: 4500, vigilanceDeadlineMs: 1600 },
  3: { storyQuestions: 6, storyReadMs: 25000, storyParagraphs: 3, storyDistractor: false,
    digitStart: 5, digitMax: 8, digitMaxTrials: 6,
    stroopTrials: 16, stroopDeadlineMs: 2400, stroopIncongruent: 0.5,
    patternTrials: 10, patternSymbols: 5, patternDeadlineMs: 3500,
    reactionTrials: 10, reactionWaitMaxMs: 4500, reactionDeadlineMs: 1200,
    vigilanceTrials: 12, vigilanceWaitMaxMs: 5500, vigilanceDeadlineMs: 1100 },
  4: { storyQuestions: 7, storyReadMs: 25000, storyParagraphs: 3, storyDistractor: false,
    digitStart: 6, digitMax: 9, digitMaxTrials: 6,
    stroopTrials: 20, stroopDeadlineMs: 1600, stroopIncongruent: 0.5,
    patternTrials: 12, patternSymbols: 6, patternDeadlineMs: 2400,
    reactionTrials: 12, reactionWaitMaxMs: 5500, reactionDeadlineMs: 850,
    vigilanceTrials: 14, vigilanceWaitMaxMs: 6500, vigilanceDeadlineMs: 750 },
};
/** 제시 속도는 고정하고 숫자열 길이를 바꾼다. */
export const DIGIT_ON_MS = 700;
export const DIGIT_GAP_MS = 300;
export function digitRevealMs(sequence: string): number {
  return sequence.length * (DIGIT_ON_MS + DIGIT_GAP_MS);
}
export function createDigitSequence(length: number, random: () => number = Math.random): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const candidates = '0123456789'.split('').filter(digit => digit !== result.at(-1));
    result += candidates[Math.floor(random() * candidates.length)];
  }
  return result;
}
export interface DigitSpanState { span: number; successes: number; failures: number }
export function nextDigitSpan(state: DigitSpanState, correct: boolean, maximum: number) {
  const successes = state.successes + Number(correct);
  const failures = state.failures + Number(!correct);
  if (failures >= 2) return { ...state, successes, failures, done: true };
  // 한 번 맞히면 바로 한 자리 늘린다. 판 수를 줄이려고 2회 성공 규칙을 1회로 바꿨다.
  if (successes >= 1) {
    if (state.span >= maximum) return { ...state, successes, failures, done: true };
    return { span: state.span + 1, successes: 0, failures: 0, done: false };
  }
  return { ...state, successes, failures, done: false };
}
export const STROOP_COLORS = ['빨강', '파랑', '초록', '노랑'] as const;
export type ColorName = typeof STROOP_COLORS[number];
export function makeStroopTrials(level: Level, random: () => number) {
  const config = LEVEL_CONFIG[level];
  return shuffle(Array.from({ length: config.stroopTrials }, (_, i) => {
    const ink = STROOP_COLORS[i % STROOP_COLORS.length];
    const congruent = i < config.stroopTrials * (1 - config.stroopIncongruent);
    const other = STROOP_COLORS.filter(color => color !== ink);
    return { ink, word: congruent ? ink : other[Math.floor(random() * other.length)], congruent };
  }), random);
}
export function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
