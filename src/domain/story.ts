import { makeRandom, shuffle } from './levels';
import { 이라고라고, 이었였 } from './particle';
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

/** 보기 수. 변수 값이 이보다 적은 틀(예: 터미널 2개)은 있는 만큼만 보여준다. */
export const STORY_OPTION_COUNT = 4;

/* ── 조합 번호 ───────────────────────────────────────────
   이야기에 0부터 차례로 번호를 매긴다. 나머지 = 틀, 몫 = 그 틀 안의 변수 조합.
   틀이 똑같이 자주 나오도록, 틀마다 가장 작은 틀의 조합 수만큼만 쓴다.
   번호 하나가 이야기 하나이므로, 번호가 다르면 이야기가 다르다는 것이 보장된다. */

const TEMPLATE_COUNT = STORY_TEMPLATES.length;

/** 틀마다 만들 수 있는 이야기 수 (전부). */
const TEMPLATE_SIZES: number[] = STORY_TEMPLATES.map((template) =>
  Object.values(template.variables).reduce((product, pool) => product * pool.length, 1));

/** 틀마다 실제로 쓰는 조합 수. 가장 작은 틀에 맞춘다. */
const PER_TEMPLATE = Math.min(...TEMPLATE_SIZES);

/** 번호가 한 바퀴 도는 길이 = 서로 다른 이야기 수. */
export const STORY_CYCLE: number = TEMPLATE_COUNT * PER_TEMPLATE;

/** 틀을 전부 쓰면 만들 수 있는 이야기 수. 안내 문구에 쓴다. */
export const STORY_COMBINATIONS: number = TEMPLATE_SIZES.reduce((sum, size) => sum + size, 0);

export function countStoryCombinations(): number {
  return STORY_COMBINATIONS;
}

/** 번호가 가리키는 틀. 이웃 번호는 항상 다른 틀이다. */
export function templateOf(index: number): number {
  return ((index % TEMPLATE_COUNT) + TEMPLATE_COUNT) % TEMPLATE_COUNT;
}

function decode(index: number): { template: StoryTemplate; values: Record<string, string> } {
  const normalized = ((index % STORY_CYCLE) + STORY_CYCLE) % STORY_CYCLE;
  const template = STORY_TEMPLATES[templateOf(normalized)];
  let rest = Math.floor(normalized / TEMPLATE_COUNT);
  const values: Record<string, string> = {};
  for (const [key, pool] of Object.entries(template.variables)) {
    values[key] = pool[rest % pool.length];
    rest = Math.floor(rest / pool.length);
  }
  return { template, values };
}

/* 입력 값 → 조합 번호. 범위 안에서 일대일로 섞고 이번 방문의 중복은 seen으로 피한다.
   App은 임의 시작점을 주며 재방문 이력을 저장하지 않으므로 방문 간 무중복은 보장하지 않는다. */

export const STORY_SLOT_MS = 60_000;
/** 한 방문 안에서 번호가 겹치거나 방금 한 틀과 같으면 이만큼 건너뛴다. 실제 시각으로는 69일쯤 떨어진 칸이다. */
const RETRY_STRIDE = 100_003;
/** 번호 범위를 덮는 2의 거듭제곱 비트 수. */
const PERM_BITS = Math.ceil(Math.log2(STORY_CYCLE));
const PERM_MASK = (2 ** PERM_BITS) - 1;

/** 고정 비트 정수를 섞는 일대일 함수. 곱셈(홀수)과 xorshift는 모두 되돌릴 수 있으므로 겹치는 출력이 없다. */
function mixBits(x: number): number {
  let y = x & PERM_MASK;
  y = Math.imul(y, 0x9E3779B1 | 1) & PERM_MASK;
  y ^= y >>> 7;
  y = Math.imul(y, 0x85EBCA6B | 1) & PERM_MASK;
  y ^= y >>> 11;
  y = Math.imul(y, 0xC2B2AE35 | 1) & PERM_MASK;
  y ^= y >>> 5;
  return y;
}

/** [0, STORY_CYCLE) 안에서의 일대일 섞기. 범위를 벗어나면 다시 섞는다(cycle walking). */
function permute(x: number): number {
  let y = mixBits(x);
  while (y >= STORY_CYCLE) y = mixBits(y);
  return y;
}

/**
 * 입력 값에 해당하는 이야기 번호.
 * `seen`은 이번 방문에서 이미 쓴 번호, `lastTemplate`은 방금 한 틀이다.
 * 새로고침 없이 연달아 시작해도 번호가 겹치지 않고, 같은 틀이 두 번 연달아 나오지 않는다.
 */
export function pickStoryIndex(
  now: number,
  seen: ReadonlySet<number> = new Set(),
  lastTemplate: number | null = null,
): number {
  const slot = Math.floor(now / STORY_SLOT_MS);
  for (let attempt = seen.size; attempt < seen.size + STORY_CYCLE; attempt += 1) {
    const index = permute((slot + attempt * RETRY_STRIDE) % STORY_CYCLE);
    if (seen.has(index)) continue;
    if (lastTemplate !== null && templateOf(index) === lastTemplate) continue;
    return index;
  }
  throw new Error('이번 방문에서 모든 이야기를 읽었어요.');
}

/** 질문 순서와 보기 순서를 섞을 난수의 씨앗. 번호를 한 번 더 섞어 이웃 번호끼리 닮지 않게 한다. */
function scramble(seed: number): number {
  let x = seed >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

function pickOptions(answer: string, pool: string[], random: () => number): string[] {
  const others = shuffle(pool.filter((value) => value !== answer), random);
  return shuffle([answer, ...others.slice(0, STORY_OPTION_COUNT - 1)], random);
}

export interface StoryShape {
  phase?: 'immediate' | 'delayed';
  /** 낼 질문 수. */
  questions: number;
  /** 보여줄 문단 수. 질문에 필요한 사실이 모자라면 문단을 더 보여준다. */
  paragraphs?: number;
  /** 정답과 헷갈리는 문장을 하나 덧붙인다. */
  distractor?: boolean;
}

/**
 * 같은 번호와 단계면 같은 질문·보기 순서가 나온다.
 * 앞뒤 퀴즈는 본문을 공유하되 서로 다른 질문 묶음을 쓴다.
 *
 * 레벨은 문단 수(기억할 사실의 양)·질문 수·헷갈림 문장으로 난이도를 만든다.
 * 질문은 보여준 문단 안에 답이 있는 것만 낸다.
 */
export function generateStory(index: number, shape: number | StoryShape): Story {
  const wanted: StoryShape = typeof shape === 'number' ? { questions: shape } : shape;
  const { template, values } = decode(index);
  const random = makeRandom(scramble(index));

  const generated = template.generate(values);
  const allParagraphs = generated.content.split('\n\n').map((line) => line.trim()).filter((line) => line.length > 0);

  // 보여줄 문단을 정한다. 답이 들어 있는 문단만 세어, 질문 수를 채울 때까지 늘린다.
  let shown = Math.min(allParagraphs.length, Math.max(1, wanted.paragraphs ?? allParagraphs.length));
  const eligible = (count: number, questions = generated.questions) => {
    const text = allParagraphs.slice(0, count).join(' ');
    return questions.filter((question) => text.includes(question.answer));
  };
  while (shown < allParagraphs.length && (
    eligible(shown).length < wanted.questions || eligible(shown, generated.delayedQuestions).length < wanted.questions
  )) shown += 1;

  const paragraphs = allParagraphs.slice(0, shown);
  const immediate = shuffle(eligible(shown).slice(0, wanted.questions), random);

  if (wanted.distractor && immediate.length > 0) {
    // 물어볼 사실 하나를 골라, 같은 종류의 다른 값을 "지난번" 이야기로 덧붙인다.
    const target = immediate[Math.floor(random() * immediate.length)];
    const pool = template.variables[target.pool].filter((value) => value !== target.answer);
    if (pool.length > 0) {
      const other = pool[Math.floor(random() * pool.length)];
      paragraphs.push(`참고로 지난번에는 ${이었였(other)}는데, 이번에는 다릅니다.`);
    }
  }

  const questionRandom = wanted.phase === 'delayed' ? makeRandom(scramble(index ^ 0x5a17)) : random;
  const picked = wanted.phase === 'delayed'
    ? shuffle(eligible(shown, generated.delayedQuestions).slice(0, wanted.questions), questionRandom)
    : immediate;

  return {
    title: template.title,
    paragraphs,
    questions: picked.map((question) => ({
      prompt: question.q,
      answer: question.answer,
      options: pickOptions(question.answer, question.alternatives ?? template.variables[question.pool], questionRandom),
      hint: `이야기에 "${이라고라고(question.answer)} 나왔어요.`,
    })),
  };
}
