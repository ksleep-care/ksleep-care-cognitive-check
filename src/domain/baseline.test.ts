import { beforeEach, describe, expect, it } from 'vitest';
import {
  BASELINE_ENTRY_FIELDS,
  BASELINE_MAX_ENTRIES,
  BASELINE_MIN_ENTRIES,
  BASELINE_STORAGE_KEY,
  appendResult,
  clearBaseline,
  compareToBaseline,
  enableBaseline,
  isBaselineOn,
  readBaseline,
  sanitizeEntry,
} from './baseline';
import { PVT_PROTOCOL_VERSION } from './pvt';

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => { map.delete(k); },
    setItem: (k: string, v: string) => { map.set(k, v); },
  } as Storage;
}

const entry = (overrides: Partial<Record<string, number | string>> = {}) => ({
  protocol: PVT_PROTOCOL_VERSION,
  completedAt: 1_756_000_000_000,
  medianRtMs: 260,
  lapses: 2,
  falseStarts: 0,
  performanceScore: 95,
  ...overrides,
});

let storage: Storage;
beforeEach(() => { storage = makeStorage(); });

describe('동의 전에는 브라우저 영구 저장소가 비어 있다', () => {
  it('동의 전 isBaselineOn은 false이고 저장소에 키가 없다', () => {
    expect(isBaselineOn(storage)).toBe(false);
    expect(storage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
    expect(storage.length).toBe(0);
  });

  it('동의하지 않은 상태에서 결과를 넣어도 저장하지 않는다', () => {
    appendResult(storage, entry());
    expect(storage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
  });

  it('동의를 켜면 빈 기록으로 시작한다', () => {
    enableBaseline(storage);
    expect(isBaselineOn(storage)).toBe(true);
    expect(readBaseline(storage)?.entries).toEqual([]);
  });
});

describe('저장 schema — 허용 필드만 통과시킨다', () => {
  it('허용 필드 목록이 최소 집계값과 프로토콜·시각뿐이다', () => {
    expect([...BASELINE_ENTRY_FIELDS].sort()).toEqual([
      'completedAt', 'falseStarts', 'lapses', 'medianRtMs', 'performanceScore', 'protocol',
    ]);
  });

  it('이름·환자번호·raw trial 같은 추가 필드는 잘라낸다', () => {
    const dirty = {
      ...entry(),
      name: '홍길동',
      patientId: 'P-1',
      birthDate: '1990-01-01',
      rawTrials: [1, 2, 3],
      storyAnswers: ['민지'],
      digitInput: '720',
    };
    const clean = sanitizeEntry(dirty) as unknown as Record<string, unknown>;
    expect(Object.keys(clean).sort()).toEqual([...BASELINE_ENTRY_FIELDS].sort());
    expect(clean.name).toBeUndefined();
    expect(clean.rawTrials).toBeUndefined();
  });

  it('필수 숫자 필드가 없으면 저장을 거부한다', () => {
    expect(() => sanitizeEntry({ protocol: PVT_PROTOCOL_VERSION })).toThrow();
    expect(() => sanitizeEntry({ ...entry(), medianRtMs: Number.NaN })).toThrow();
  });

  it('저장된 값에 개인 식별 문자열이 남지 않는다', () => {
    enableBaseline(storage);
    appendResult(storage, { ...entry(), name: '홍길동' } as never);
    expect(storage.getItem(BASELINE_STORAGE_KEY)).not.toContain('홍길동');
  });
});

describe('기록 적재와 삭제', () => {
  it('최신 결과가 뒤에 쌓이고 상한을 넘지 않는다', () => {
    enableBaseline(storage);
    for (let i = 0; i < BASELINE_MAX_ENTRIES + 5; i += 1) {
      appendResult(storage, entry({ completedAt: 1_000 + i, medianRtMs: 200 + i }));
    }
    const store = readBaseline(storage);
    expect(store?.entries).toHaveLength(BASELINE_MAX_ENTRIES);
    expect(store?.entries.at(-1)?.completedAt).toBe(1_000 + BASELINE_MAX_ENTRIES + 4);
  });

  it('모두 삭제하면 저장소에서 키가 사라진다', () => {
    enableBaseline(storage);
    appendResult(storage, entry());
    clearBaseline(storage);
    expect(storage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
    expect(storage.length).toBe(0);
    expect(isBaselineOn(storage)).toBe(false);
  });

  it('깨진 값은 억지로 읽지 않고 지운다', () => {
    storage.setItem(BASELINE_STORAGE_KEY, '{not json');
    expect(readBaseline(storage)).toBeNull();
    expect(storage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
  });

  it('모르는 schema 버전은 무시하고 지운다', () => {
    storage.setItem(BASELINE_STORAGE_KEY, JSON.stringify({ version: 99, entries: [entry()] }));
    expect(readBaseline(storage)).toBeNull();
  });
});

describe('compareToBaseline — 0·1·2·3·5회 경계', () => {
  const current = { medianRtMs: 280, lapses: 4 };

  it('동의하지 않았으면 off다', () => {
    expect(compareToBaseline(null, current)).toEqual({ state: 'off' });
  });

  it.each([0, 1, 2])('이전 유효 결과가 %i회면 기준을 만드는 중이다', (count) => {
    enableBaseline(storage);
    for (let i = 0; i < count; i += 1) appendResult(storage, entry({ completedAt: 1_000 + i }));
    const result = compareToBaseline(readBaseline(storage), current);
    expect(result).toEqual({ state: 'building', have: count, need: BASELINE_MIN_ENTRIES });
  });

  it('3회부터 비교를 시작한다', () => {
    enableBaseline(storage);
    [240, 260, 280].forEach((ms, i) => appendResult(storage, entry({ completedAt: 1_000 + i, medianRtMs: ms, lapses: 2 })));
    const result = compareToBaseline(readBaseline(storage), current);
    expect(result.state).toBe('ready');
    if (result.state !== 'ready') throw new Error('unreachable');
    expect(result.samples).toBe(3);
    expect(result.baselineMedianRtMs).toBe(260);
    expect(result.rtDeltaMs).toBe(20);
    expect(result.baselineLapses).toBe(2);
    expect(result.lapseDelta).toBe(2);
  });

  it('6회가 쌓이면 최근 5회만 사용한다', () => {
    enableBaseline(storage);
    [1000, 240, 250, 260, 270, 280].forEach((ms, i) =>
      appendResult(storage, entry({ completedAt: 1_000 + i, medianRtMs: ms })));
    const result = compareToBaseline(readBaseline(storage), current);
    if (result.state !== 'ready') throw new Error('unreachable');
    expect(result.samples).toBe(5);
    expect(result.baselineMedianRtMs).toBe(260);
  });

  it('프로토콜 버전이 다르면 기존 기록을 기준선으로 쓰지 않는다', () => {
    enableBaseline(storage);
    [240, 260, 280].forEach((ms, i) =>
      appendResult(storage, entry({ completedAt: 1_000 + i, medianRtMs: ms, protocol: 'pvt-b-web-0' })));
    const result = compareToBaseline(readBaseline(storage), current);
    expect(result).toEqual({ state: 'building', have: 0, need: BASELINE_MIN_ENTRIES });
  });
});
