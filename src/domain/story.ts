import { makeRandom, shuffle } from './levels';
import { 이라고라고 } from './particle';
import { STORY_TEMPLATES, type StoryTemplate } from './storyTemplates';

/** 가상의 이야기다. 실제 인물·환자 정보를 쓰지 않는다. */
export interface StoryQuestion {
  prompt: string;
  answer: string;
  options: string[];
  /** 틀렸을 때 보여줄 한 줄 설명. */
  hint: string;
}

export interface Story {
  title: string;
  /** 문단 단위. 화면에서는 문단마다 줄을 띄운다. */
  paragraphs: string[];
  questions: StoryQuestion[];
}

/**
 * seed를 한 번 섞는다. 시각(ms)으로 만든 seed는 몇 초 차이면 앞자리가 거의 같아서
 * 그대로 쓰면 연달아 같은 틀이 나오기 쉽다. (lowbias32 해시)
 */
function scramble(seed: number): number {
  let x = seed >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

/** 보기 수. 변수 값이 이보다 적은 틀(예: 터미널 2개)은 있는 만큼만 보여준다. */
export const STORY_OPTION_COUNT = 4;

function pickOptions(answer: string, pool: string[], random: () => number): string[] {
  const others = shuffle(pool.filter((value) => value !== answer), random);
  return shuffle([answer, ...others.slice(0, STORY_OPTION_COUNT - 1)], random);
}

/**
 * 같은 seed면 같은 이야기·같은 질문·같은 보기 순서가 나온다.
 * 바로 맞추기와 다시 퀴즈가 seed를 공유해야 같은 이야기를 묻는다.
 * 틀 10가지 × 변수 조합이라 한 판마다 다른 이야기가 나온다.
 */
export function generateStory(seed: number, questionCount: number): Story {
  const random = makeRandom(scramble(seed));
  const template: StoryTemplate = STORY_TEMPLATES[Math.floor(random() * STORY_TEMPLATES.length)];

  const values: Record<string, string> = {};
  for (const [key, pool] of Object.entries(template.variables)) {
    values[key] = pool[Math.floor(random() * pool.length)];
  }

  const generated = template.generate(values);
  const picked = shuffle(generated.questions, random).slice(0, questionCount);

  return {
    title: template.title,
    paragraphs: generated.content.split('\n\n').map((line) => line.trim()).filter((line) => line.length > 0),
    questions: picked.map((question) => ({
      prompt: question.q,
      answer: question.answer,
      options: pickOptions(question.answer, template.variables[question.pool], random),
      hint: `이야기에 "${이라고라고(question.answer)} 나왔어요.`,
    })),
  };
}

/** 이 게임이 만들 수 있는 서로 다른 이야기 수. 안내 문구에 쓴다. */
export function countStoryCombinations(): number {
  return STORY_TEMPLATES.reduce(
    (sum, template) => sum + Object.values(template.variables).reduce((product, pool) => product * pool.length, 1),
    0,
  );
}
