import { describe, expect, it } from 'vitest';
import { calculateReport } from './scoring';
import type { SessionResults } from './types';

const completeResults: SessionResults = {
  story: { correct: 4, total: 4 },
  reaction: { averageMs: 320, hits: 6, total: 6, earlyPresses: 1 },
  digit: { maxSpan: 5, correct: 2, total: 3 },
  stroop: { averageMs: 640, correct: 7, total: 8 },
  storyDelayed: { correct: 3, total: 4 },
  pattern: { averageMs: 910, correct: 5, total: 6 },
  vigilance: { averageMs: 410, hits: 5, total: 6, misses: 1 },
};

describe('결과 계산', () => {
  it('화면에 보여줄 수행값을 손실 없이 계산한다', () => {
    expect(calculateReport(completeResults)).toEqual({
      immediateMemoryPercent: 100,
      delayedMemoryPercent: 75,
      memoryRetentionPercent: 75,
      reactionAverageMs: 320,
      reactionEarlyPresses: 1,
      workingMemorySpan: 5,
      stroopAccuracyPercent: 88,
      patternAccuracyPercent: 83,
      vigilanceAverageMs: 410,
      vigilanceMisses: 1,
    });
  });

  it('즉시 기억 정답이 0이어도 기억 유지율을 안전하게 0으로 둔다', () => {
    expect(calculateReport({
      ...completeResults,
      story: { correct: 0, total: 4 },
      storyDelayed: { correct: 2, total: 4 },
    }).memoryRetentionPercent).toBe(0);
  });

  it('필수 활동 결과가 빠지면 잘못된 보고서를 만들지 않는다', () => {
    const incomplete = { ...completeResults } as Partial<SessionResults>;
    delete incomplete.pattern;

    expect(() => calculateReport(incomplete)).toThrow('7개 활동 결과가 모두 필요합니다.');
  });

  it('주의력 반응이 한 번도 없으면 0ms가 아니라 미측정으로 구분한다', () => {
    expect(calculateReport({
      ...completeResults,
      vigilance: { averageMs: 0, hits: 0, total: 6, misses: 6 },
    }).vigilanceAverageMs).toBeNull();
  });
});
