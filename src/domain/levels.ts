import type { Level } from './types';

/** 레벨이 바꾸는 것은 여기 있는 값뿐이다. 3분 PVT는 이 파일을 쓰지 않는다. */
export interface LevelConfig {
  storyQuestions: number;
  digitSequences: string[];
  stroopTrials: number;
  patternTrials: number;
  patternSymbols: number;
}

export const LEVEL_CONFIG: Record<Level, LevelConfig> = {
  1: {
    storyQuestions: 4,
    digitSequences: ['927', '6481', '3057'],
    stroopTrials: 6,
    patternTrials: 6,
    patternSymbols: 2,
  },
  2: {
    storyQuestions: 5,
    digitSequences: ['4172', '90563', '38215'],
    stroopTrials: 8,
    patternTrials: 6,
    patternSymbols: 3,
  },
  3: {
    storyQuestions: 6,
    digitSequences: ['61840', '275093', '480716'],
    stroopTrials: 10,
    patternTrials: 8,
    patternSymbols: 3,
  },
  4: {
    storyQuestions: 7,
    digitSequences: ['582074', '3197462', '6408351'],
    stroopTrials: 12,
    patternTrials: 8,
    patternSymbols: 4,
  },
};

/** 숫자를 보여주는 시간. 자릿수가 늘면 함께 늘린다. */
export function digitRevealMs(sequence: string): number {
  return 600 + sequence.length * 320;
}

/** 재현 가능한 난수. 테스트에서 seed를 고정한다. */
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
