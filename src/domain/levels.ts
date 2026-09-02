import type { Level } from './types';

/** 레벨이 바꾸는 것은 여기 있는 값뿐이다. 3분 PVT는 이 파일을 쓰지 않는다. */
export interface LevelConfig {
  storyQuestions: number;
  /**
   * 이야기를 읽을 수 있는 최대 시간(ms).
   * 읽은 시간이 사람마다 다르면 기억 점수를 자기 기록끼리도 비교할 수 없다.
   * 레벨이 오를수록 질문은 늘고 시간은 줄어든다.
   */
  storyReadMs: number;
  /** 보여주는 문단 수. 루키는 앞 두 문단만 읽고, 위 레벨은 세 문단 전부 읽는다. */
  storyParagraphs: number;
  /** 헷갈리는 문장(지난번에는 …였다)을 하나 덧붙이는가. 마스터만. */
  storyDistractor: boolean;
  digitSequences: string[];
  stroopTrials: number;
  patternTrials: number;
  patternSymbols: number;
}

export const LEVEL_CONFIG: Record<Level, LevelConfig> = {
  1: {
    storyQuestions: 4,
    storyReadMs: 25_000,
    storyParagraphs: 2,
    storyDistractor: false,
    digitSequences: ['927', '6481', '3057'],
    stroopTrials: 6,
    patternTrials: 6,
    patternSymbols: 2,
  },
  2: {
    storyQuestions: 5,
    storyReadMs: 22_000,
    storyParagraphs: 3,
    storyDistractor: false,
    digitSequences: ['4172', '90563', '38215'],
    stroopTrials: 8,
    patternTrials: 6,
    patternSymbols: 3,
  },
  3: {
    storyQuestions: 6,
    storyReadMs: 20_000,
    storyParagraphs: 3,
    storyDistractor: false,
    digitSequences: ['61840', '275093', '480716'],
    stroopTrials: 10,
    patternTrials: 8,
    patternSymbols: 3,
  },
  4: {
    storyQuestions: 7,
    storyReadMs: 18_000,
    storyParagraphs: 3,
    storyDistractor: true,
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
