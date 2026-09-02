import { describe, expect, it } from 'vitest';
import {
  FIRST_STEP,
  GAME_META,
  GAME_ORDER,
  LEVELS,
  TAB_ORDER,
  nextStep,
} from './session';

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

  it('세션은 첫 활동 안내에서 시작한다', () => {
    expect(FIRST_STEP).toEqual({ type: 'transition', index: 0 });
  });

  it('활동 안내 뒤 같은 순서의 활동을 시작한다', () => {
    expect(nextStep({ type: 'transition', index: 3 })).toEqual({ type: 'game', index: 3 });
  });

  it('마지막 활동을 마치면 결과 화면으로 이동한다', () => {
    expect(nextStep({ type: 'game', index: 6 })).toEqual({ type: 'report' });
  });
});

describe('레벨과 탭', () => {
  it('레벨은 1~4 네 개다', () => {
    expect(LEVELS).toEqual([1, 2, 3, 4]);
  });

  it('하단 탭은 게임 전용 4개이며 K-Sleep 앱 탭을 복사하지 않는다', () => {
    expect(TAB_ORDER).toEqual(['play', 'home', 'trend', 'guide']);
    expect(TAB_ORDER).not.toContain('chatbot');
    expect(TAB_ORDER).not.toContain('sleepTips');
  });

  it('레벨은 기억·숫자·색깔·패턴 게임만 바꾸고 반응·별똥별은 고정한다', () => {
    expect(GAME_META.story.scalesWithLevel).toBe(true);
    expect(GAME_META.digit.scalesWithLevel).toBe(true);
    expect(GAME_META.stroop.scalesWithLevel).toBe(true);
    expect(GAME_META.pattern.scalesWithLevel).toBe(true);
    expect(GAME_META.storyDelayed.scalesWithLevel).toBe(true);
    expect(GAME_META.reaction.scalesWithLevel).toBe(false);
    expect(GAME_META.vigilance.scalesWithLevel).toBe(false);
  });

  it('모든 게임이 무엇을 보는 과제인지와 한계를 함께 설명한다', () => {
    for (const key of GAME_ORDER) {
      expect(GAME_META[key].looksAt.length).toBeGreaterThan(0);
      expect(GAME_META[key].limit.length).toBeGreaterThan(0);
      expect(GAME_META[key].looksAt).not.toContain('정상');
      expect(GAME_META[key].looksAt).not.toContain('진단');
    }
  });
});
