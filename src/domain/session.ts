import { LEVEL_CONFIG } from './levels';
import type { GameKey, Level, SessionStep, TabKey } from './types';

export const GAME_ORDER: GameKey[] = ['story', 'reaction', 'digit', 'stroop', 'storyDelayed', 'pattern', 'vigilance'];
export const LEVELS: Level[] = [1, 2, 3, 4];
export const DEFAULT_LEVEL: Level = 1;
export const LEVEL_META: Record<Level, { icon: string; name: string; blurb: string }> = {
  1: { icon: '1', name: '루키', blurb: '규칙에 익숙해지는 첫 도전' },
  2: { icon: '2', name: '챌린저', blurb: '더 길게 기억하고 빠르게 반응' },
  3: { icon: '3', name: '프로', blurb: '복잡한 패턴과 짧은 응답 시간' },
  4: { icon: '4', name: '마스터', blurb: '긴 숫자열과 촘촘한 시간 제한' },
};
export const GAME_META: Record<GameKey, {
  icon: string; title: string; description: string; looksAt: string; basis: string; limit: string;
  scalesWithLevel: boolean; source: string;
}> = {
  story: { icon: '📖', title: '이야기 기억하기',
    description: '이야기를 한 번 읽고 답을 골라요. 뒤에는 같은 이야기의 다른 질문이 나와요.',
    looksAt: '읽은 사건과 세부 정보를 기억하는 게임이에요.',
    basis: '이야기 기억 과제의 부호화 → 즉시 응답 → 방해 활동 → 지연 응답 순서를 따릅니다. 직접 쓴 가상 이야기를 화면으로 읽고 객관식으로 답하므로 구술 자유 회상 검사의 복제는 아닙니다.',
    limit: '24개 사건 틀의 내용을 조합해요. 같은 방문에서는 본문이 반복되지 않지만, 재방문 중복과 틀에 익숙해지는 효과는 남아요.',
    scalesWithLevel: true, source: 'https://agingresearchbiobank.nia.nih.gov/studies/swan/documents/download/Codebooks_and_Forms/NIA62018_cdbk.pdf/' },
  reaction: { icon: '⚡', title: '반응속도',
    description: '신호등이 켜지면 화면을 눌러 출발해요. 신호가 오기 전에는 기다려요.',
    looksAt: '한 가지 신호를 보고 반응하는 속도를 쓰는 게임이에요.',
    basis: '단순 반응시간 과제처럼 예측하기 어려운 간격, 한 가지 신호, 한 가지 응답을 유지합니다. 신호 전 누름과 100ms 미만 응답은 너무 이른 누름으로 분리합니다.',
    limit: '짧은 게임이며 화면·브라우저·입력 지연이 포함돼요. 레벨별 시간 제한이 달라 서로 비교하지 않아요.',
    scalesWithLevel: true, source: 'https://www.psytoolkit.org/experiment-library/deary_liewald.html' },
  digit: { icon: '🔢', title: '숫자 뒤집기',
    description: '숫자가 하나씩 지나가요. 모두 사라지면 거꾸로 입력하세요.',
    looksAt: '숫자의 순서를 잠깐 기억하고 뒤집는 게임이에요.',
    basis: '숫자 거꾸로 따라 하기 형식입니다. 1초에 한 자리씩 제시하고, 같은 길이에서 두 번 성공하면 길어집니다. 같은 길이에서 두 번 실패하거나 최대 도전에 도달하면 끝납니다.',
    limit: '임상 검사처럼 음성으로 제시하지 않아요. 시작 길이·최대 길이·최대 8회 제한이 있는 게임이므로 검사 점수로 읽지 않아요.',
    scalesWithLevel: true, source: 'https://www.psytoolkit.org/experiment-library/rdigitspan.html' },
  stroop: { icon: '🎨', title: '색깔 단어',
    description: '단어를 읽지 말고 글자색을 골라요. 뜻과 색이 같을 때도 있어요.',
    looksAt: '단어를 읽으려는 반응을 억제하고 색을 고르는 게임이에요.',
    basis: 'Stroop 과제의 뜻과 색이 같은 조건, 다른 조건을 절반씩 섞습니다. 색 버튼의 위치는 고정하고 레벨에 따라 응답 제한을 줄입니다.',
    limit: '표준 Stroop 검사나 ADHD 선별 점수가 아니에요. 색 구분·읽기·기기 성능의 영향을 받아요.',
    scalesWithLevel: true, source: 'https://www.psytoolkit.org/experiment-library/stroop.html' },
  storyDelayed: { icon: '💭', title: '이야기 다시 퀴즈',
    description: '처음 읽은 이야기, 아직 기억나나요? 글을 다시 보지 않고 답해요.',
    looksAt: '다른 게임을 한 뒤에 남아 있는 내용을 떠올려요.',
    basis: '중간 게임 세 개 뒤에 같은 이야기의 장소·사건·처리 행동·물건을 다른 질문으로 묻습니다. 상위 난이도에서는 마무리 행동·기록한 곳·소식을 전한 대상도 묻습니다. 첫 퀴즈에서 정답을 가르쳐 주지 않습니다. 객관식 재인 방식이며 정해진 분 단위 지연 검사는 아닙니다.',
    limit: '앞뒤 문항의 내용과 난이도가 달라 정답률을 직접 비교하지 않아요. 보기가 단서가 되고 중간 소요 시간도 달라요. 표준화된 기억 검사가 아니에요.',
    scalesWithLevel: true, source: 'https://agingresearchbiobank.nia.nih.gov/studies/swan/documents/download/Codebooks_and_Forms/NIA152019_cdbk.pdf/' },
  pattern: { icon: '🎯', title: '패턴 매칭',
    description: '기준과 모양도 순서도 같은 패턴을 찾아요.',
    looksAt: '눈으로 비교하고 구별하는 게임이에요.',
    basis: '동시 시각 매칭 형식으로 기준을 계속 보여주고 유사한 보기 중 정확한 일치를 고릅니다. CANTAB DMS의 동시 제시 원칙을 참고했으며 자체 도형을 사용합니다.',
    limit: 'CANTAB 검사 복제나 표준 점수가 아니에요. 도형 수와 응답 시간이 레벨별로 달라요.',
    scalesWithLevel: true, source: 'https://cambridgecognition.com/delayed-matching-to-sample-dms/' },
  vigilance: { icon: '🌙', title: '별똥별 잡기',
    description: '예고 없이 나타나는 별을 기다려요. 별이 보일 때 화면 어디든 누르면 잡혀요.',
    looksAt: '기다리는 동안 신호에 주의를 두는 짧은 게임이에요.',
    basis: '지속 주의 과제의 불규칙한 신호 대기와 놓침 기록 원칙을 참고했습니다. 움직이는 별과 짧은 시행을 쓰는 자체 게임이며 Mackworth나 CPT 검사를 재현하지 않습니다.',
    limit: '표준 지속 주의 측정이 아니에요. 놓침·너무 이른 누름을 구분하며 같은 레벨·기기에서도 참고용이에요.',
    scalesWithLevel: true, source: 'https://www.psytoolkit.org/experiment-library/mackworth.html' },
};
export function gameChallenge(key: GameKey, level: Level): string {
  const c = LEVEL_CONFIG[level];
  if (key === 'story' || key === 'storyDelayed') return `${c.storyQuestions}가지 사실 기억`;
  if (key === 'digit') return `${c.digitStart}자리 시작 · 최대 ${c.digitMax}자리`;
  if (key === 'stroop') return `${c.stroopTrials}문제 · ${c.stroopDeadlineMs / 1000}초 안에`;
  if (key === 'pattern') return `${c.patternSymbols}개 도형 · ${c.patternDeadlineMs / 1000}초 안에`;
  if (key === 'reaction') return `${c.reactionTrials}회 · ${c.reactionDeadlineMs / 1000}초 안에`;
  return `${c.vigilanceTrials}개의 별 · ${c.vigilanceDeadlineMs / 1000}초 안에`;
}
export const TAB_META: Record<TabKey, { label: string }> = { play: { label: '플레이' }, guide: { label: '게임 안내' } };
export const TAB_ORDER: TabKey[] = ['play', 'guide'];
export function nextStep(step: SessionStep): SessionStep {
  if (step.type === 'transition') return { type: 'game', index: step.index };
  if (step.type === 'game') return step.index >= GAME_ORDER.length - 1 ? { type: 'report' } : { type: 'transition', index: step.index + 1 };
  return step;
}
export const FIRST_STEP: SessionStep = { type: 'transition', index: 0 };
