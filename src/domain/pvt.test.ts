import { describe, expect, it } from 'vitest';
import {
  PVT_LAPSE_MS,
  PVT_MIN_VALID_RT_MS,
  PVT_NO_RESPONSE_MS,
  PVT_PROTOCOL_VERSION,
  PVT_SCORED_DURATION_MS,
  PVT_ISI_MAX_MS,
  PVT_ISI_MIN_MS,
  assessQuality,
  calculatePvtMetrics,
  classifyResponse,
  isLapse,
  type PvtTrial,
} from './pvt';

const response = (rtMs: number, driftMs = 0): PvtTrial => ({ kind: 'response', rtMs, driftMs });
const falseStart = (rtMs: number | null, driftMs = 0): PvtTrial => ({ kind: 'falseStart', rtMs, driftMs });
const timeout = (driftMs = 0): PvtTrial => ({ kind: 'timeout', driftMs });

describe('PVT-B 프로토콜 상수', () => {
  it('논문(Basner 2011) 3분 PVT-B 계약을 코드에 한 번만 고정한다', () => {
    expect(PVT_SCORED_DURATION_MS).toBe(180_000);
    expect(PVT_ISI_MIN_MS).toBe(2_000);
    expect(PVT_ISI_MAX_MS).toBe(4_000);
    expect(PVT_MIN_VALID_RT_MS).toBe(100);
    expect(PVT_LAPSE_MS).toBe(355);
    expect(PVT_NO_RESPONSE_MS).toBe(30_000);
  });

  it('10분 PVT의 500ms 기준을 쓰지 않는다', () => {
    expect(PVT_LAPSE_MS).not.toBe(500);
  });

  it('프로토콜 버전 문자열을 노출한다', () => {
    expect(PVT_PROTOCOL_VERSION).toMatch(/^pvt-b-web-\d+$/);
  });
});

describe('반응 분류 경계값', () => {
  it('99ms는 false start, 100ms는 유효 반응이다', () => {
    expect(classifyResponse(99)).toBe('falseStart');
    expect(classifyResponse(100)).toBe('valid');
  });

  it('354ms는 lapse가 아니고 355ms부터 lapse다', () => {
    expect(isLapse(354)).toBe(false);
    expect(isLapse(355)).toBe(true);
    expect(isLapse(356)).toBe(true);
  });
});

describe('calculatePvtMetrics', () => {
  it('반응이 하나도 없으면 중앙값은 null이고 lapse만 센다', () => {
    const metrics = calculatePvtMetrics([timeout(), timeout()]);
    expect(metrics.medianRtMs).toBeNull();
    expect(metrics.responses).toBe(0);
    expect(metrics.stimuli).toBe(2);
    expect(metrics.lapses).toBe(2);
    expect(metrics.performanceScore).toBe(0);
  });

  it('빈 배열도 던지지 않고 0으로 처리한다', () => {
    const metrics = calculatePvtMetrics([]);
    expect(metrics.stimuli).toBe(0);
    expect(metrics.lapses).toBe(0);
    expect(metrics.medianRtMs).toBeNull();
    expect(metrics.performanceScore).toBe(100);
  });

  it('짝수 개 반응의 중앙값은 가운데 두 값의 평균이다', () => {
    const metrics = calculatePvtMetrics([response(200), response(220), response(260), response(300)]);
    expect(metrics.medianRtMs).toBe(240);
    expect(metrics.responses).toBe(4);
  });

  it('false start는 자극 수에 넣지 않지만 점수에는 반영한다', () => {
    const metrics = calculatePvtMetrics([response(200), falseStart(60), response(240)]);
    expect(metrics.stimuli).toBe(2);
    expect(metrics.falseStarts).toBe(1);
    expect(metrics.responses).toBe(2);
  });

  it('lapse는 355ms 이상 반응과 무응답을 합쳐 센다', () => {
    const metrics = calculatePvtMetrics([response(200), response(355), response(400), timeout()]);
    expect(metrics.lapses).toBe(3);
  });

  it('성능 점수는 논문 정의대로 lapse+false start를 유효자극+false start로 나눈다', () => {
    // 유효자극 4, false start 1 -> 분모 5. lapse 1 + fs 1 = 2 -> 100 - 40 = 60
    const metrics = calculatePvtMetrics([
      response(200), response(210), response(220), response(400), falseStart(50),
    ]);
    expect(metrics.performanceScore).toBe(60);
  });

  it('무응답은 30초 반응으로 기록되지만 중앙값을 오염시키지 않는다', () => {
    const metrics = calculatePvtMetrics([response(200), response(210), timeout()]);
    expect(metrics.medianRtMs).toBe(205);
    expect(metrics.slowestRtMs).toBe(PVT_NO_RESPONSE_MS);
  });

  it('전반부와 후반부 중앙값 차이를 계산한다', () => {
    const metrics = calculatePvtMetrics([
      response(200), response(200), response(300), response(300),
    ]);
    expect(metrics.firstHalfMedianMs).toBe(200);
    expect(metrics.secondHalfMedianMs).toBe(300);
    expect(metrics.timeOnTaskDeltaMs).toBe(100);
  });

  it('가장 빠른 10%와 느린 10%를 최소 1개씩 계산한다', () => {
    const metrics = calculatePvtMetrics([response(180), response(220), response(500)]);
    expect(metrics.fastest10PercentMs).toBe(180);
    expect(metrics.slowest10PercentMs).toBe(500);
  });

  it('변동성은 선형보간 사분위 범위(IQR)로 계산한다', () => {
    // [100,200,300,400] -> Q1 175, Q3 325, IQR 150
    const metrics = calculatePvtMetrics([
      response(100), response(200), response(300), response(400),
    ]);
    expect(metrics.spreadMs).toBe(150);
  });

  it('반응이 1개뿐이면 변동성을 만들지 않는다', () => {
    expect(calculatePvtMetrics([response(250)]).spreadMs).toBeNull();
  });
});

describe('assessQuality — 잘못된 측정을 좋은 결과로 보여주지 않는다', () => {
  const goodTrials = Array.from({ length: 45 }, () => response(250));

  it('정상 측정은 통과한다', () => {
    expect(assessQuality(goodTrials, { tabHidden: false })).toEqual({ ok: true, reasons: [] });
  });

  it('자극 수가 너무 적으면 다시 측정을 권한다', () => {
    const quality = assessQuality([response(250)], { tabHidden: false });
    expect(quality.ok).toBe(false);
    expect(quality.reasons).toContain('tooFewStimuli');
  });

  it('탭이 백그라운드로 갔으면 다시 측정을 권한다', () => {
    const quality = assessQuality(goodTrials, { tabHidden: true });
    expect(quality.ok).toBe(false);
    expect(quality.reasons).toContain('tabHidden');
  });

  it('false start가 지나치게 많으면 다시 측정을 권한다', () => {
    const trials = [...goodTrials, ...Array.from({ length: 20 }, () => falseStart(40))];
    const quality = assessQuality(trials, { tabHidden: false });
    expect(quality.ok).toBe(false);
    expect(quality.reasons).toContain('excessFalseStarts');
  });

  it('타이머가 크게 밀렸으면 다시 측정을 권한다', () => {
    const trials = Array.from({ length: 45 }, () => response(250, 400));
    const quality = assessQuality(trials, { tabHidden: false });
    expect(quality.ok).toBe(false);
    expect(quality.reasons).toContain('timingDrift');
  });
});
