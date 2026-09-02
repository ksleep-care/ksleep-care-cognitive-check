import { describe, expect, it } from 'vitest';
import { STORY_OPTION_COUNT, countStoryCombinations, generateStory } from './story';
import { STORY_TEMPLATES } from './storyTemplates';

describe('이야기 생성', () => {
  it('같은 seed면 같은 이야기와 같은 질문 순서가 나온다 (바로 맞추기와 다시 퀴즈가 공유)', () => {
    const a = generateStory(42, 7);
    const b = generateStory(42, 7);
    expect(a).toEqual(b);
  });

  it('seed가 다르면 이야기가 달라진다', () => {
    const titles = new Set<string>();
    const bodies = new Set<string>();
    for (let seed = 1; seed <= 60; seed += 1) {
      const story = generateStory(seed, 4);
      titles.add(story.title);
      bodies.add(story.paragraphs.join(' '));
    }
    expect(titles.size).toBeGreaterThan(5);
    expect(bodies.size).toBeGreaterThan(50);
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

  it('틀은 10가지고 조합은 수천 가지가 넘는다', () => {
    expect(STORY_TEMPLATES).toHaveLength(10);
    expect(countStoryCombinations()).toBeGreaterThan(10_000);
  });
});
