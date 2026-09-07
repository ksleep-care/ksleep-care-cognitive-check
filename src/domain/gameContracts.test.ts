import { describe, expect, it } from 'vitest';
import { createDigitSequence, LEVEL_CONFIG, makeRandom, nextDigitSpan, makeStroopTrials } from './levels';
import { generateStory, pickStoryIndex, templateOf } from './story';

describe('연구 과제의 핵심 규칙', () => {
  it('숫자열은 매번 생성되고 연속 중복 숫자를 피한다', () => {
    const random = makeRandom(71);
    const sequences = Array.from({ length: 100 }, () => createDigitSequence(7, random));
    expect(new Set(sequences).size).toBe(100);
    expect(sequences.every(s => /^\d{7}$/.test(s) && !/(\d)\1/.test(s))).toBe(true);
  });
  it('같은 길이에서 두 번 성공해야 늘리고 두 번 실패하면 종료한다', () => {
    expect(nextDigitSpan({ span: 4, successes: 0, failures: 0 }, true, 9)).toEqual({ span: 4, successes: 1, failures: 0, done: false });
    expect(nextDigitSpan({ span: 4, successes: 1, failures: 0 }, true, 9).span).toBe(5);
    expect(nextDigitSpan({ span: 4, successes: 0, failures: 1 }, false, 9).done).toBe(true);
  });
  it('모든 레벨에 스트룹 일치와 불일치 조건이 있고 자극 부하가 다르다', () => {
    for (const level of [1, 2, 3, 4] as const) {
      const trials = makeStroopTrials(level, makeRandom(12));
      expect(trials.some(t => t.word === t.ink)).toBe(true);
      expect(trials.some(t => t.word !== t.ink)).toBe(true);
    }
    expect(new Set(Object.values(LEVEL_CONFIG).map(c => c.stroopDeadlineMs)).size).toBe(4);
    expect(new Set(Object.values(LEVEL_CONFIG).map(c => c.vigilanceDeadlineMs)).size).toBe(4);
  });
  it('같은 시각에 1만 판을 시작해도 본문과 번호가 중복되지 않는다', () => {
    const seen = new Set<number>();
    const bodies = new Set<string>();
    let last: number | null = null;
    for (let i = 0; i < 10_000; i++) {
      const index = pickStoryIndex(1_756_800_000_000, seen, last);
      seen.add(index);
      last = templateOf(index);
      bodies.add(generateStory(index, { questions: 4, paragraphs: 2 }).paragraphs.join(' '));
    }
    expect(seen.size).toBe(10_000);
    expect(bodies.size).toBe(10_000);
  });
});
