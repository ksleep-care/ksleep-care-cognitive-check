import { describe, expect, it } from 'vitest';
import { GAME_ORDER, nextStep } from './session';

describe('인지검사 진행 순서', () => {
  it('승인된 7개 활동 순서를 바꾸지 않는다', () => {
    expect(GAME_ORDER).toEqual([
      'story',
      'reaction',
      'digit',
      'stroop',
      'storyDelayed',
      'pattern',
      'vigilance',
    ]);
  });

  it('첫 화면에서 첫 활동 안내로 이동한다', () => {
    expect(nextStep({ type: 'intro' })).toEqual({ type: 'transition', index: 0 });
  });

  it('활동 안내 뒤 같은 순서의 활동을 시작한다', () => {
    expect(nextStep({ type: 'transition', index: 3 })).toEqual({ type: 'game', index: 3 });
  });

  it('마지막 활동을 마치면 결과 화면으로 이동한다', () => {
    expect(nextStep({ type: 'game', index: 6 })).toEqual({ type: 'report' });
  });
});
