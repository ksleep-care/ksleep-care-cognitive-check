import type { GameKey, SessionStep } from './types';

export const GAME_ORDER: GameKey[] = [
  'story',
  'reaction',
  'digit',
  'stroop',
  'storyDelayed',
  'pattern',
  'vigilance',
];

export const GAME_META: Record<GameKey, { icon: string; title: string; description: string }> = {
  story: {
    icon: '📖',
    title: '이야기 기억하기',
    description: '짧은 이야기를 읽고 기억나는 내용을 골라요.',
  },
  reaction: {
    icon: '⚡',
    title: '반응속도',
    description: '원이 나타나는 순간 빠르게 눌러요.',
  },
  digit: {
    icon: '🔢',
    title: '숫자 뒤집기',
    description: '본 숫자를 반대 순서로 입력해요.',
  },
  stroop: {
    icon: '🎨',
    title: '색깔 단어',
    description: '단어의 뜻이 아니라 글자색을 골라요.',
  },
  storyDelayed: {
    icon: '💭',
    title: '이야기 다시 퀴즈',
    description: '처음에 읽은 이야기를 다시 떠올려요.',
  },
  pattern: {
    icon: '🎯',
    title: '패턴 매칭',
    description: '기준과 같은 모양을 빠르게 찾아요.',
  },
  vigilance: {
    icon: '🌙',
    title: '별똥별 잡기',
    description: '기다리다가 별이 나타나면 바로 눌러요.',
  },
};

export function nextStep(step: SessionStep): SessionStep {
  if (step.type === 'intro') {
    return { type: 'transition', index: 0 };
  }

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
