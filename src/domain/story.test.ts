import { describe, expect, it } from 'vitest';
import {
  STORY_COMBINATIONS,
  STORY_CYCLE,
  STORY_OPTION_COUNT,
  STORY_SLOT_MS,
  countStoryCombinations,
  generateStory,
  pickStoryIndex,
  templateOf,
} from './story';
import { STORY_TEMPLATES } from './storyTemplates';

describe('이야기 생성', () => {
  it('같은 번호면 같은 이야기와 같은 질문 순서가 나온다 (바로 맞추기와 다시 퀴즈가 공유)', () => {
    expect(generateStory(42, 7)).toEqual(generateStory(42, 7));
  });

  it('번호가 다르면 이야기 본문이 다르다', () => {
    const bodies = new Set<string>();
    for (let i = 0; i < 500; i += 1) {
      bodies.add(generateStory(i * 2_857, 4).paragraphs.join(' '));
    }
    expect(bodies.size).toBe(500);
  });

  it('레벨이 요구한 개수만큼 질문을 내고, 정답이 보기 안에 정확히 한 번 있다', () => {
    for (const count of [4, 5, 6, 7]) {
      const story = generateStory(7, count);
      expect(story.questions).toHaveLength(count);
      for (const question of story.questions) {
        expect(question.options.filter((option) => option === question.answer)).toHaveLength(1);
        expect(question.options.length).toBeLessThanOrEqual(STORY_OPTION_COUNT);
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(story.paragraphs.join(' ')).toContain(question.answer);
      }
    }
  });

  it('사건 틀은 24가지이고 수천 판을 넘는 본문 조합이 있다', () => {
    expect(STORY_TEMPLATES).toHaveLength(24);
    expect(countStoryCombinations()).toBe(STORY_COMBINATIONS);
    expect(STORY_COMBINATIONS).toBeGreaterThan(1_000_000);
    expect(STORY_CYCLE).toBeGreaterThan(150_000);
  });

  it('이웃 번호는 다른 틀이고, 같은 틀의 번호끼리는 본문이 다르다', () => {
    const titles = new Set<string>();
    for (let i = 0; i < 10; i += 1) titles.add(generateStory(i, 4).title);
    expect(titles.size).toBe(10);

    const bodies = new Set<string>();
    for (let k = 0; k < 300; k += 1) bodies.add(generateStory(k * 10 + 3, 4).paragraphs.join(' '));
    expect(bodies.size).toBe(300);
  });
});

describe('레벨이 오르면 기억할 것이 늘어난다', () => {
  it('루키는 두 문단, 그 위는 세 문단을 읽고, 마스터에는 헷갈리는 문장이 하나 더 붙는다', () => {
    for (let index = 0; index < 10; index += 1) {
      const rookie = generateStory(index, { questions: 4, paragraphs: 2 });
      const pro = generateStory(index, { questions: 6, paragraphs: 3 });
      const master = generateStory(index, { questions: 7, paragraphs: 3, distractor: true });
      expect(rookie.paragraphs.join('').length).toBeLessThan(pro.paragraphs.join('').length);
      expect(master.paragraphs.length).toBe(pro.paragraphs.length + 1);
      expect(master.paragraphs.at(-1)).toMatch(/^참고로 지난번에는/);
      expect(master.questions).toHaveLength(7);
    }
  });

  it('질문은 보여준 문단 안에 답이 있는 것만 낸다', () => {
    for (let index = 0; index < 30; index += 1) {
      const story = generateStory(index, { questions: 4, paragraphs: 2 });
      const shown = story.paragraphs.join(' ');
      for (const question of story.questions) expect(shown).toContain(question.answer);
    }
  });
});

describe('같은 이야기가 다시 나오지 않는다', () => {
  it('5분 간격으로 500판을 해도 (새로고침해서 기억이 없어도) 번호가 전부 다르다', () => {
    const start = 1_756_800_000_000;
    const seen = new Set<number>();
    const titles = new Map<string, number>();
    for (let play = 0; play < 500; play += 1) {
      const index = pickStoryIndex(start + play * 5 * 60_000);
      expect(seen.has(index)).toBe(false);
      seen.add(index);
      const { title } = generateStory(index, 4);
      titles.set(title, (titles.get(title) ?? 0) + 1);
    }
    // 틀 10개가 고루 나온다.
    expect(titles.size).toBe(24);
    for (const count of titles.values()) expect(count).toBeGreaterThan(5);
  });

  it('방금 한 틀을 알려주면 같은 틀이 연달아 나오지 않는다', () => {
    const start = 1_756_800_000_000;
    const seen = new Set<number>();
    let last: number | null = null;
    for (let play = 0; play < 300; play += 1) {
      const index = pickStoryIndex(start + play * 3 * 60_000, seen, last);
      expect(seen.has(index)).toBe(false);
      expect(templateOf(index)).not.toBe(last);
      seen.add(index);
      last = templateOf(index);
    }
  });

  it('같은 1분 안에 연달아 시작해도 이번 방문에서 쓴 번호는 피한다', () => {
    const now = 1_756_800_000_000;
    const seen = new Set<number>();
    for (let i = 0; i < 20; i += 1) {
      const index = pickStoryIndex(now + i * 100, seen);
      expect(seen.has(index)).toBe(false);
      seen.add(index);
    }
  });

  it('번호 섞기는 일대일이다 (앞 5만 칸이 전부 다른 번호를 받는다)', () => {
    const seen = new Set<number>();
    for (let slot = 0; slot < 50_000; slot += 1) {
      const index = pickStoryIndex(slot * STORY_SLOT_MS);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(STORY_CYCLE);
      seen.add(index);
    }
    expect(seen.size).toBe(50_000);
  });

  it('시간 칸이 하나 바뀌면 번호가 바뀐다', () => {
    const now = 1_756_800_000_000;
    expect(pickStoryIndex(now)).toBe(pickStoryIndex(now + STORY_SLOT_MS - 1));
    expect(pickStoryIndex(now)).not.toBe(pickStoryIndex(now + STORY_SLOT_MS));
  });
});
