import type { GameKey, Level, SessionStep, TabKey } from './types';

export const GAME_ORDER: GameKey[] = [
  'story',
  'reaction',
  'digit',
  'stroop',
  'storyDelayed',
  'pattern',
  'vigilance',
];

export const LEVELS: Level[] = [1, 2, 3, 4];
export const DEFAULT_LEVEL: Level = 1;

export const LEVEL_META: Record<Level, { icon: string; name: string; blurb: string }> = {
  1: { icon: '🌱', name: '루키', blurb: '처음이라면 여기부터' },
  2: { icon: '⚡', name: '챌린저', blurb: '조금 더 기억할 게 많아요' },
  3: { icon: '🔥', name: '프로', blurb: '문제 수와 자릿수가 늘어요' },
  4: { icon: '👑', name: '마스터', blurb: '가장 길고 헷갈리게' },
};

export const GAME_META: Record<
  GameKey,
  {
    icon: string;
    title: string;
    description: string;
    /** 무엇을 보는 과제인지. 임상 검사 이름을 상속하지 않는다. */
    looksAt: string;
    /** 이 게임으로 말할 수 없는 것. */
    limit: string;
    /** 레벨이 난이도를 바꾸는 게임인가. */
    scalesWithLevel: boolean;
  }
> = {
  story: {
    icon: '📖',
    title: '이야기 기억하기',
    description: '제한 시간 안에 짧은 이야기를 읽고 바로 질문에 답해요.',
    looksAt: '방금 들은 내용을 붙잡아 두는 힘을 쓰는 게임이에요.',
    limit: '기억력 검사가 아니에요. 이야기 종류가 하나라 다음에도 같은 이야기가 나와요. 읽기 시간은 레벨마다 달라서 레벨이 다르면 비교할 수 없어요.',
    scalesWithLevel: true,
  },
  reaction: {
    icon: '⚡',
    title: '반응속도',
    description: '원이 나타나는 순간 빠르게 눌러요.',
    looksAt: '몸이 얼마나 빨리 반응하는지 감을 잡는 워밍업이에요.',
    limit: '6번뿐이라 기록용이에요. 연구 기준과 비교하지 않아요.',
    scalesWithLevel: false,
  },
  digit: {
    icon: '🔢',
    title: '숫자 뒤집기',
    description: '본 숫자를 거꾸로 입력해요.',
    looksAt: '머릿속에 잠깐 담아두고 순서를 뒤집는 힘을 쓰는 게임이에요.',
    limit: '작업기억을 활용하는 게임일 뿐, 작업기억이 정상인지 알려주지 않아요.',
    scalesWithLevel: true,
  },
  stroop: {
    icon: '🎨',
    title: '색깔 단어',
    description: '단어의 뜻이 아니라 글자색을 골라요.',
    looksAt: '자동으로 튀어나오는 답을 눌러 참는 힘을 쓰는 게임이에요.',
    limit: '집중력 점수가 아니에요. 화면 밝기와 색 구분 능력에 영향을 받아요.',
    scalesWithLevel: true,
  },
  storyDelayed: {
    icon: '💭',
    title: '이야기 다시 퀴즈',
    description: '맨 처음 읽은 이야기를 다시 떠올려요.',
    looksAt: '시간이 지난 뒤에도 남아 있는지를 보는 게임이에요.',
    limit: '중간 게임들이 얼마나 방해했는지에 따라 값이 달라져요.',
    scalesWithLevel: true,
  },
  pattern: {
    icon: '🎯',
    title: '패턴 매칭',
    description: '기준과 똑같은 모양을 빠르게 찾아요.',
    looksAt: '보고 비교해서 고르는 속도를 쓰는 게임이에요.',
    limit: '판단력 점수가 아니에요. 화면 크기와 손가락 위치에 영향을 받아요.',
    scalesWithLevel: true,
  },
  vigilance: {
    icon: '🌙',
    title: '별똥별 잡기',
    description: '기다리다가 별이 나타나면 바로 눌러요.',
    looksAt: '기다리는 동안 주의를 붙잡아 두는 감을 보는 짧은 게임이에요.',
    limit: '6번짜리 게임 기록이에요. 3분 집중 측정과 다른 과제라 서로 비교하지 않아요.',
    scalesWithLevel: false,
  },
};

/** 아이콘은 이모지가 아니라 TabBar의 도형 SVG를 쓴다. 여기에는 라벨만 둔다. */
export const TAB_META: Record<TabKey, { label: string }> = {
  home: { label: '홈' },
  play: { label: '플레이' },
  trend: { label: '나의 변화' },
  guide: { label: '게임 안내' },
};

/** 게임 7개가 이 앱의 본체다. 플레이가 첫 탭이자 기본 탭이다. */
export const TAB_ORDER: TabKey[] = ['play', 'home', 'trend', 'guide'];

export function nextStep(step: SessionStep): SessionStep {
  if (step.type === 'transition') {
    return { type: 'game', index: step.index };
  }

  if (step.type === 'game') {
    return step.index >= GAME_ORDER.length - 1
      ? { type: 'report' }
      : { type: 'transition', index: step.index + 1 };
  }

  return step;
}

export const FIRST_STEP: SessionStep = { type: 'transition', index: 0 };
