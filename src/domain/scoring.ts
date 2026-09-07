import { GAME_META } from './session';
import type { CognitiveReport, MetricCard, SessionDraft, SessionResults } from './types';

const REQUIRED_KEYS: Array<keyof SessionResults> = [
  'story',
  'reaction',
  'digit',
  'stroop',
  'storyDelayed',
  'pattern',
  'vigilance',
];

function percent(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function calculateReport(results: SessionDraft): CognitiveReport {
  const isComplete = REQUIRED_KEYS.every((key) => results[key] !== undefined);
  if (!isComplete) {
    throw new Error('7개 활동 결과가 모두 필요합니다.');
  }

  const complete = results as SessionResults;

  return {
    immediateMemoryPercent: percent(complete.story.correct, complete.story.total),
    delayedMemoryPercent: percent(complete.storyDelayed.correct, complete.storyDelayed.total),
    reactionAverageMs: complete.reaction.hits > 0 ? complete.reaction.averageMs : null,
    reactionMisses: complete.reaction.misses ?? 0,
    vigilanceEarlyPresses: complete.vigilance.earlyPresses ?? 0,
    reactionEarlyPresses: complete.reaction.earlyPresses,
    workingMemorySpan: complete.digit.maxSpan,
    stroopAccuracyPercent: percent(complete.stroop.correct, complete.stroop.total),
    patternAccuracyPercent: percent(complete.pattern.correct, complete.pattern.total),
    vigilanceAverageMs: complete.vigilance.hits > 0 ? complete.vigilance.averageMs : null,
    vigilanceMisses: complete.vigilance.misses,
  };
}

/**
 * 게임 결과는 전부 `게임 기록`이다. 임상 규준을 상속하지 않는다.
 * 같은 레벨의 자기 기록끼리만 비교할 수 있다고 분명히 적는다.
 */
export function buildGameCards(report: CognitiveReport, levelName: string): MetricCard[] {
  const sameLevelOnly = `같은 레벨(${levelName})에서 한 내 기록끼리만 비교할 수 있어요.`;

  return [
    {
      key: 'story',
      icon: GAME_META.story.icon,
      title: GAME_META.story.title,
      looksAt: GAME_META.story.looksAt,
      value: `${report.immediateMemoryPercent}% 맞음`,
      direction: '높을수록 방금 읽은 내용을 많이 붙잡았다는 뜻이에요.',
      comparable: sameLevelOnly,
      limit: GAME_META.story.limit,
    },
    {
      key: 'storyDelayed',
      icon: GAME_META.storyDelayed.icon,
      title: GAME_META.storyDelayed.title,
      looksAt: GAME_META.storyDelayed.looksAt,
      value: `${report.delayedMemoryPercent}% 맞음`,
      direction: '다른 게임 뒤에 맞춘 비율이에요. 처음과 다른 문항을 맞힐 수 있어 두 정답률을 기억 유지율로 나누지 않아요.',
      comparable: sameLevelOnly,
      limit: GAME_META.storyDelayed.limit,
    },
    {
      key: 'digit',
      icon: GAME_META.digit.icon,
      title: GAME_META.digit.title,
      looksAt: GAME_META.digit.looksAt,
      value: `최대 ${report.workingMemorySpan}자리`,
      direction: '길수록 한 번에 담아두고 뒤집을 수 있는 양이 많았다는 뜻이에요.',
      comparable: sameLevelOnly,
      limit: GAME_META.digit.limit,
    },
    {
      key: 'stroop',
      icon: GAME_META.stroop.icon,
      title: GAME_META.stroop.title,
      looksAt: GAME_META.stroop.looksAt,
      value: `${report.stroopAccuracyPercent}% 맞음`,
      direction: '높을수록 단어 뜻에 끌려가지 않고 색을 골랐다는 뜻이에요.',
      comparable: sameLevelOnly,
      limit: GAME_META.stroop.limit,
    },
    {
      key: 'pattern',
      icon: GAME_META.pattern.icon,
      title: GAME_META.pattern.title,
      looksAt: GAME_META.pattern.looksAt,
      value: `${report.patternAccuracyPercent}% 맞음`,
      direction: '높을수록 비교해서 고르는 게 잘 됐다는 뜻이에요.',
      comparable: sameLevelOnly,
      limit: GAME_META.pattern.limit,
    },
    {
      key: 'reaction',
      icon: GAME_META.reaction.icon,
      title: GAME_META.reaction.title,
      looksAt: GAME_META.reaction.looksAt,
      value: `${report.reactionAverageMs === null ? '측정 없음' : `평균 ${report.reactionAverageMs}ms`} · 놓침 ${report.reactionMisses}회 · 너무 이른 누름 ${report.reactionEarlyPresses}회`,
      direction: '유효하게 누른 응답만의 평균이에요. 너무 이른 누름과 놓침도 함께 보세요.',
      comparable: sameLevelOnly,
      limit: GAME_META.reaction.limit,
    },
    {
      key: 'vigilance',
      icon: GAME_META.vigilance.icon,
      title: GAME_META.vigilance.title,
      looksAt: GAME_META.vigilance.looksAt,
      value: report.vigilanceAverageMs === null
        ? `측정 없음 · 놓침 ${report.vigilanceMisses}회 · 너무 이른 누름 ${report.vigilanceEarlyPresses}회`
        : `평균 ${report.vigilanceAverageMs}ms · 놓침 ${report.vigilanceMisses}회 · 너무 이른 누름 ${report.vigilanceEarlyPresses}회`,
      direction: '작고 놓침이 적을수록 기다리는 동안 주의가 유지됐다는 뜻이에요.',
      comparable: sameLevelOnly,
      limit: GAME_META.vigilance.limit,
    },
  ];
}
