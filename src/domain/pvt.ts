/**
 * 3분 PVT-B 측정 계약.
 *
 * 근거 논문 (원문 Material and methods 직접 확인):
 *   Basner M, Mollicone D, Dinges DF.
 *   "Validity and sensitivity of a brief psychomotor vigilance test (PVT-B)
 *    to total and partial sleep deprivation."
 *   Acta Astronautica 69 (2011) 949-959.  https://pubmed.ncbi.nlm.nih.gov/22025811/
 *
 * 논문에서 그대로 가져온 값:
 *   - 측정 길이 3분 (10분 PVT에서 단축)
 *   - 자극 간 간격 2~4초 (355ms lapse 기준을 보정한 조건, 논문 2.4절)
 *   - 반응시간 100ms 미만 = false start (errors of commission), 논문 2.3절
 *   - 무응답 30초 = lapse, 반응시간 30000ms로 기록, 논문 2.2절
 *   - lapse 기준 >= 355ms. **10분 PVT의 500ms 기준과 절대 섞지 않는다.**
 *   - 성능 점수 = 100% - (lapse + false start) / (유효자극 + false start)
 *
 * 논문과 다른 점 (정직하게 화면에 표시해야 하는 한계):
 *   논문은 전용 측정기기 PVT-192(LED 표시 + 물리 버튼)로 측정했다.
 *   이 앱은 브라우저다. 화면 표시 지연과 입력 지연이 기기와 다르므로
 *   **절대 반응시간(ms)을 논문 수치와 직접 비교하지 않는다.**
 *   355ms는 lapse를 세는 규칙으로만 쓴다.
 *
 * 3분 PVT를 10분 PVT 기준으로 해석하면 안 되는 근거:
 *   Cognitive fatigue 연구, PMC8885985 — "the PVT-3 is not interchangeable with the PVT-10".
 */

export const PVT_PROTOCOL_VERSION = 'pvt-b-web-1';

/** 점수에 들어가는 측정 구간 길이. 연습 구간은 여기에 포함하지 않는다. */
export const PVT_SCORED_DURATION_MS = 180_000;
/** 본 측정 전 연습 자극 수. 점수에 넣지 않는다. */
export const PVT_PRACTICE_TRIALS = 3;
/** 자극이 나타난 뒤 다음 자극까지의 간격 (1초 피드백 표시 시간 포함). */
export const PVT_ISI_MIN_MS = 2_000;
export const PVT_ISI_MAX_MS = 4_000;
/** 반응시간을 화면에 보여주는 시간. */
export const PVT_FEEDBACK_MS = 1_000;
/** 이 값 미만은 자극을 보고 누른 것이 아니라고 본다. */
export const PVT_MIN_VALID_RT_MS = 100;
/** 연구 참고 기준. 이 값 이상이면 lapse(놓친 순간)로 센다. */
export const PVT_LAPSE_MS = 355;
/** 이 시간 동안 반응이 없으면 lapse로 기록한다. */
export const PVT_NO_RESPONSE_MS = 30_000;

/** 측정 품질 판정 기준. */
export const PVT_MIN_SCORED_STIMULI = 30;
export const PVT_MAX_FALSE_START_RATIO = 0.2;
export const PVT_MAX_MEDIAN_DRIFT_MS = 80;

export type PvtTrial =
  | { kind: 'response'; rtMs: number; driftMs: number }
  | { kind: 'falseStart'; rtMs: number | null; driftMs: number }
  | { kind: 'timeout'; driftMs: number };

export interface PvtMetrics {
  /** 실제로 제시된 유효 자극 수 (반응 + 무응답). */
  stimuli: number;
  /** 100ms 이상으로 응답한 횟수. */
  responses: number;
  medianRtMs: number | null;
  meanRtMs: number | null;
  fastestRtMs: number | null;
  slowestRtMs: number | null;
  fastest10PercentMs: number | null;
  slowest10PercentMs: number | null;
  /** 변동성: 사분위 범위(IQR). */
  spreadMs: number | null;
  lapses: number;
  falseStarts: number;
  performanceScore: number;
  firstHalfMedianMs: number | null;
  secondHalfMedianMs: number | null;
  /** 후반부 중앙값 - 전반부 중앙값. 양수면 뒤로 갈수록 느려졌다는 뜻. */
  timeOnTaskDeltaMs: number | null;
}

export type PvtQualityReason =
  | 'tooFewStimuli'
  | 'tabHidden'
  | 'excessFalseStarts'
  | 'timingDrift';

export interface PvtQuality {
  ok: boolean;
  reasons: PvtQualityReason[];
}

export const PVT_QUALITY_MESSAGE: Record<PvtQualityReason, string> = {
  tooFewStimuli: '자극이 충분히 나오지 않았어요. 3분을 끝까지 채우고 다시 해보세요.',
  tabHidden: '측정 중 화면이 뒤로 넘어갔어요. 이 창만 켜 둔 상태로 다시 해보세요.',
  excessFalseStarts: '자극이 나오기 전에 누른 횟수가 많아요. 숫자가 뜬 뒤에 누르고 다시 해보세요.',
  timingDrift: '기기가 바빠 화면 표시가 밀렸어요. 다른 창과 앱을 닫고 다시 해보세요.',
};

export function classifyResponse(rtMs: number): 'falseStart' | 'valid' {
  return rtMs < PVT_MIN_VALID_RT_MS ? 'falseStart' : 'valid';
}

export function isLapse(rtMs: number): boolean {
  return rtMs >= PVT_LAPSE_MS;
}

/** 자극 간 간격을 뽑는다. 1초 피드백 표시 시간을 포함한 값이다. */
export function drawIsiMs(random: () => number = Math.random): number {
  return Math.round(PVT_ISI_MIN_MS + random() * (PVT_ISI_MAX_MS - PVT_ISI_MIN_MS));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return sorted.length % 2 === 1
    ? sorted[Math.floor(mid)]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function quantile(sorted: number[], fraction: number): number {
  const position = (sorted.length - 1) * fraction;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

function tailMean(sorted: number[], side: 'fastest' | 'slowest'): number {
  const take = Math.max(1, Math.round(sorted.length * 0.1));
  const slice = side === 'fastest' ? sorted.slice(0, take) : sorted.slice(-take);
  return Math.round(slice.reduce((sum, value) => sum + value, 0) / slice.length);
}

export function calculatePvtMetrics(trials: PvtTrial[]): PvtMetrics {
  const responses = trials.filter((trial) => trial.kind === 'response');
  const timeouts = trials.filter((trial) => trial.kind === 'timeout');
  const falseStarts = trials.filter((trial) => trial.kind === 'falseStart');

  const rts = responses.map((trial) => trial.rtMs);
  const sorted = [...rts].sort((a, b) => a - b);
  const stimuli = responses.length + timeouts.length;
  const lapses = rts.filter(isLapse).length + timeouts.length;

  const denominator = stimuli + falseStarts.length;
  const performanceScore = denominator === 0
    ? 100
    : Math.round((1 - (lapses + falseStarts.length) / denominator) * 100);

  const half = Math.floor(rts.length / 2);
  const firstHalf = rts.slice(0, half);
  const secondHalf = rts.slice(rts.length - half);
  const firstHalfMedianMs = median(firstHalf);
  const secondHalfMedianMs = median(secondHalf);

  /** 무응답은 논문대로 30초 반응으로 기록하되, 중앙값·평균 계산에는 넣지 않는다. */
  const slowestRtMs = timeouts.length > 0
    ? PVT_NO_RESPONSE_MS
    : (sorted.at(-1) ?? null);

  return {
    stimuli,
    responses: responses.length,
    medianRtMs: median(rts),
    meanRtMs: rts.length > 0
      ? Math.round(rts.reduce((sum, value) => sum + value, 0) / rts.length)
      : null,
    fastestRtMs: sorted[0] ?? null,
    slowestRtMs,
    fastest10PercentMs: sorted.length > 0 ? tailMean(sorted, 'fastest') : null,
    slowest10PercentMs: sorted.length > 0 ? tailMean(sorted, 'slowest') : null,
    spreadMs: sorted.length > 1
      ? Math.round(quantile(sorted, 0.75) - quantile(sorted, 0.25))
      : null,
    lapses,
    falseStarts: falseStarts.length,
    performanceScore,
    firstHalfMedianMs,
    secondHalfMedianMs,
    timeOnTaskDeltaMs: firstHalfMedianMs !== null && secondHalfMedianMs !== null
      ? secondHalfMedianMs - firstHalfMedianMs
      : null,
  };
}

export function assessQuality(
  trials: PvtTrial[],
  context: { tabHidden: boolean },
): PvtQuality {
  const reasons: PvtQualityReason[] = [];
  const metrics = calculatePvtMetrics(trials);

  if (metrics.stimuli < PVT_MIN_SCORED_STIMULI) reasons.push('tooFewStimuli');
  if (context.tabHidden) reasons.push('tabHidden');

  const denominator = metrics.stimuli + metrics.falseStarts;
  if (denominator > 0 && metrics.falseStarts / denominator > PVT_MAX_FALSE_START_RATIO) {
    reasons.push('excessFalseStarts');
  }

  const drifts = trials.map((trial) => trial.driftMs);
  const medianDrift = median(drifts);
  if (medianDrift !== null && medianDrift > PVT_MAX_MEDIAN_DRIFT_MS) reasons.push('timingDrift');

  return { ok: reasons.length === 0, reasons };
}
