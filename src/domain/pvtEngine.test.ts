import { describe, expect, it, vi } from 'vitest';
import { PvtEngine, type PvtEngineView } from './pvtEngine';
import { PVT_NO_RESPONSE_MS, type PvtTrial } from './pvt';

/** 시간과 타이머를 완전히 손으로 굴려서 경계값을 확인한다. */
function makeHarness(options: { scoredDurationMs?: number; practiceTrials?: number } = {}) {
  let clock = 0;
  const queue: Array<{ id: number; at: number; fn: () => void }> = [];
  let nextId = 1;

  const views: PvtEngineView[] = [];
  const finished: Array<{ trials: PvtTrial[]; tabHidden: boolean }> = [];

  const engine = new PvtEngine(
    {
      onView: (view) => views.push({ ...view }),
      onFinish: (trials, context) => finished.push({ trials, tabHidden: context.tabHidden }),
    },
    {
      ...options,
      random: () => 0.5, // ISI를 항상 3000ms로 고정
      now: () => clock,
      setTimer: (fn, ms) => {
        const id = nextId;
        nextId += 1;
        queue.push({ id, at: clock + ms, fn });
        return id;
      },
      clearTimer: (id) => {
        const index = queue.findIndex((task) => task.id === id);
        if (index >= 0) queue.splice(index, 1);
      },
    },
  );

  /** 지정한 시간만큼 시계를 밀면서 도착한 타이머를 순서대로 실행한다. */
  const advance = (ms: number) => {
    const target = clock + ms;
    for (;;) {
      const due = queue
        .filter((task) => task.at <= target)
        .sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      queue.splice(queue.indexOf(due), 1);
      clock = due.at;
      due.fn();
    }
    clock = target;
  };

  return {
    engine,
    views,
    finished,
    advance,
    press: () => engine.press(),
    setClock: (value: number) => { clock = value; },
    get clock() { return clock; },
  };
}

describe('연습 구간', () => {
  it('연습 시행은 점수에 들어가지 않는다', () => {
    const h = makeHarness({ practiceTrials: 2 });
    h.engine.startPractice();

    h.advance(3000);           // 첫 자극
    h.setClock(h.clock + 250);
    h.press();
    h.advance(3000);           // 두 번째 자극
    h.setClock(h.clock + 240);
    h.press();

    expect(h.engine.currentPhase).toBe('bridge');
    expect(h.engine.trials).toHaveLength(0);
  });
});

describe('측정 구간', () => {
  it('100ms 미만 반응은 false start로 기록한다', () => {
    const h = makeHarness({ scoredDurationMs: 60_000 });
    h.engine.startScored();
    h.advance(3000);
    h.setClock(h.clock + 40);
    h.press();

    expect(h.engine.trials).toEqual([{ kind: 'falseStart', rtMs: 40, driftMs: 0 }]);
  });

  it('자극이 없을 때 누르면 반응시간 없는 false start가 된다', () => {
    const h = makeHarness({ scoredDurationMs: 60_000 });
    h.engine.startScored();
    h.advance(500); // 아직 자극 전
    h.press();

    expect(h.engine.trials).toEqual([{ kind: 'falseStart', rtMs: null, driftMs: 0 }]);
  });

  it('100ms 이상 반응은 유효 반응으로 기록한다', () => {
    const h = makeHarness({ scoredDurationMs: 60_000 });
    h.engine.startScored();
    h.advance(3000);
    h.setClock(h.clock + 100);
    h.press();

    expect(h.engine.trials).toEqual([{ kind: 'response', rtMs: 100, driftMs: 0 }]);
  });

  it('30초 동안 누르지 않으면 무응답으로 기록한다', () => {
    const h = makeHarness({ scoredDurationMs: 120_000 });
    h.engine.startScored();
    h.advance(3000 + PVT_NO_RESPONSE_MS);

    expect(h.engine.trials).toEqual([{ kind: 'timeout', driftMs: 0 }]);
  });

  it('측정 시간이 끝나면 결과를 넘기고 더 이상 자극을 내지 않는다', () => {
    const h = makeHarness({ scoredDurationMs: 10_000 });
    h.engine.startScored();

    for (let i = 0; i < 10; i += 1) {
      h.advance(3000);
      if (h.engine.currentPhase !== 'scored') break;
      h.setClock(h.clock + 250);
      h.press();
    }
    h.advance(20_000);

    expect(h.finished).toHaveLength(1);
    expect(h.engine.currentPhase).toBe('done');
    const before = h.engine.trials.length;
    h.advance(30_000);
    expect(h.engine.trials).toHaveLength(before);
  });

  it('측정 중 탭 이탈만 기록하고 연습 중 이탈은 무시한다', () => {
    const h = makeHarness({ scoredDurationMs: 10_000, practiceTrials: 1 });
    h.engine.startPractice();
    h.engine.markHidden();
    expect(h.engine.tabHidden).toBe(false);

    h.advance(3000);
    h.setClock(h.clock + 250);
    h.press();
    h.engine.startScored();
    h.engine.markHidden();
    expect(h.engine.tabHidden).toBe(true);
  });

  it('그만두면 남은 타이머가 자극을 만들지 않는다', () => {
    const h = makeHarness({ scoredDurationMs: 60_000 });
    h.engine.startScored();
    h.engine.stop();
    h.advance(30_000);

    expect(h.engine.trials).toHaveLength(0);
    expect(h.views.at(-1)?.live).toBe(false);
  });

  it('자극 표시 지연(drift)을 시행마다 기록한다', () => {
    const h = makeHarness({ scoredDurationMs: 60_000 });
    const spy = vi.fn();
    h.engine.startScored();
    h.advance(3000);
    h.setClock(h.clock + 250);
    h.press();
    spy(h.engine.trials[0]);

    expect(h.engine.trials[0]).toHaveProperty('driftMs');
  });
});
