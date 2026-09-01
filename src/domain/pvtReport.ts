import { PVT_LAPSE_MS, PVT_SCORED_DURATION_MS, type PvtMetrics } from './pvt';
import type { MetricCard } from './types';

export interface ResearchSource {
  label: string;
  url: string;
}

export const PVT_SOURCES: ResearchSource[] = [
  {
    label: 'Basner 2011 · 3분 PVT-B 타당도 (Acta Astronautica)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/22025811/',
  },
  {
    label: '3분 PVT는 10분 PVT를 대신할 수 없음 (2022)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35242006/',
  },
  {
    label: '수면부족에서 PVT가 어떻게 변하는지 (Lim & Dinges 2008)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/18591490/',
  },
];

/** 화면 어디에나 함께 나가야 하는 한계 문장. */
export const PVT_LIMITS = [
  '의료 기준이 아니에요. 진단, 질환 위험, 정상·비정상 판정에 쓸 수 없어요.',
  `${PVT_LAPSE_MS}ms 기준은 논문이 전용 측정기기에서 정한 값이에요. 브라우저는 화면·입력 지연이 달라서 ms 숫자를 논문 수치와 직접 비교하지 않아요.`,
  '한국 성인 연령별 기준값이 확인되지 않아서 또래 평균이나 백분위를 만들지 않아요.',
  '기기와 브라우저가 바뀌면 값이 달라져요. 같은 기기·같은 브라우저에서 반복하세요.',
];

const MINUTES = Math.round(PVT_SCORED_DURATION_MS / 60_000);
const SAME_DEVICE = `같은 기기·같은 브라우저에서 한 내 ${MINUTES}분 측정끼리만 비교할 수 있어요.`;

/**
 * 연구 참고 층.
 * 같은 프로토콜에서 이 지표가 일반적으로 어떻게 움직이는지만 적는다.
 * 이 값이 좋다·나쁘다, 정상이다, 치료가 듣는다는 말은 쓰지 않는다.
 */
export function buildPvtCards(metrics: PvtMetrics): MetricCard[] {
  const cards: MetricCard[] = [
    {
      key: 'medianRt',
      icon: '⏱️',
      title: '반응시간 중앙값',
      looksAt: '숫자가 뜨고 나서 누르기까지 걸린 시간의 한가운데 값이에요.',
      value: metrics.medianRtMs === null ? '측정 없음' : `${metrics.medianRtMs}ms`,
      direction: '작을수록 빨랐다는 뜻이에요. 연구에서는 잠이 부족할 때 이 값이 전반적으로 커지는 경향이 보고돼요.',
      comparable: SAME_DEVICE,
      limit: '이 숫자 하나로 컨디션을 판정하지 않아요.',
    },
    {
      key: 'lapses',
      icon: '💤',
      title: `놓친 순간 (${PVT_LAPSE_MS}ms 이상)`,
      looksAt: `숫자가 떴는데 반응이 ${PVT_LAPSE_MS}ms 이상 늦어진 횟수예요. 아예 못 누른 것도 여기 포함돼요.`,
      value: `${metrics.lapses}회 / 자극 ${metrics.stimuli}개`,
      direction: `적을수록 끊김이 적었다는 뜻이에요. 연구에서는 잠이 부족할 때 이 횟수가 늘어나는 경향이 보고돼요. ${PVT_LAPSE_MS}ms는 ${MINUTES}분 과제 전용 연구 참고 기준이고, 10분 과제의 500ms 기준과 다른 값이에요.`,
      comparable: SAME_DEVICE,
      limit: '횟수가 늘었다고 해서 수면 문제가 있다는 뜻이 아니에요.',
    },
    {
      key: 'spread',
      icon: '〰️',
      title: '반응 들쭉날쭉함',
      looksAt: '빠를 때와 느릴 때의 차이가 얼마나 벌어졌는지 보는 값이에요.',
      value: metrics.spreadMs === null ? '측정 없음' : `${metrics.spreadMs}ms 폭`,
      direction: '작을수록 일정했다는 뜻이에요. 연구에서는 잠이 부족할 때 반응이 더 들쭉날쭉해지는 경향이 보고돼요.',
      comparable: SAME_DEVICE,
      limit: '주변 소음이나 자세만으로도 쉽게 변해요.',
    },
    {
      key: 'timeOnTask',
      icon: '📉',
      title: '후반부 변화',
      looksAt: `${MINUTES}분 중 뒤쪽 절반이 앞쪽 절반보다 얼마나 느려졌는지예요.`,
      value: metrics.timeOnTaskDeltaMs === null
        ? '측정 없음'
        : metrics.timeOnTaskDeltaMs >= 0
          ? `뒤로 갈수록 ${metrics.timeOnTaskDeltaMs}ms 느려짐`
          : `뒤로 갈수록 ${Math.abs(metrics.timeOnTaskDeltaMs)}ms 빨라짐`,
      direction: '0에 가까울수록 끝까지 비슷하게 유지했다는 뜻이에요. 연구에서는 잠이 부족할 때 뒤로 갈수록 느려지는 폭이 커지는 경향이 보고돼요.',
      comparable: SAME_DEVICE,
      limit: `${MINUTES}분은 짧아서 이 변화가 작게 나올 수 있어요.`,
    },
    {
      key: 'falseStarts',
      icon: '⚡',
      title: '너무 이른 누름',
      looksAt: '숫자가 뜨기 전에 눌렀거나 100ms 안에 눌러서 보고 누른 것으로 볼 수 없는 횟수예요.',
      value: `${metrics.falseStarts}회`,
      direction: '적을수록 기다렸다가 눌렀다는 뜻이에요. 많으면 조급했거나 측정이 오염됐을 수 있어요.',
      comparable: SAME_DEVICE,
      limit: '성격이 급한 것과 졸린 것을 이 값만으로 구분할 수 없어요.',
    },
    {
      key: 'performance',
      icon: '🎯',
      title: '수행 점수',
      looksAt: '놓친 순간과 너무 이른 누름을 전체 자극 수로 나눠 만든 논문 정의 점수예요.',
      value: `${metrics.performanceScore}점 / 100점`,
      direction: '100에 가까울수록 놓침과 이른 누름이 적었다는 뜻이에요.',
      comparable: SAME_DEVICE,
      limit: '학교 성적이 아니에요. 여러 지표를 하나로 눌러 담은 요약값이라 세부는 위 카드로 보세요.',
    },
  ];

  return cards;
}
