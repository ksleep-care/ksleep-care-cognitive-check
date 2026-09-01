/**
 * 개인 기준선 저장 경계.
 *
 * 원칙 (2026-09-01 인계문 §3-F):
 *   - 기본은 꺼짐. 사용자가 명시적으로 켠 뒤에만 브라우저에 무엇이든 쓴다.
 *   - 저장하는 것은 PVT의 최소 집계 결과 + 프로토콜 버전 + 완료 시각뿐이다.
 *   - 이름·연락처·생년월일·환자번호·진단명·이야기 답안·숫자 입력값·raw trial은 저장하지 않는다.
 *   - 서버로 보내지 않는다. 이 브라우저에만 있다.
 *   - 비교는 같은 브라우저의 같은 PVT 프로토콜끼리만 한다.
 */
import { PVT_PROTOCOL_VERSION } from './pvt';

export const BASELINE_STORAGE_KEY = 'ksleep-cognitive-check:pvt-baseline';
export const BASELINE_SCHEMA_VERSION = 1;
export const BASELINE_MAX_ENTRIES = 30;
/** 이 횟수부터 비교를 시작한다. */
export const BASELINE_MIN_ENTRIES = 3;
/** 기준값은 최근 이 횟수의 중앙값이다. */
export const BASELINE_WINDOW = 5;

export const BASELINE_ENTRY_FIELDS = [
  'protocol',
  'completedAt',
  'medianRtMs',
  'lapses',
  'falseStarts',
  'performanceScore',
] as const;

export interface BaselineEntry {
  protocol: string;
  completedAt: number;
  medianRtMs: number;
  lapses: number;
  falseStarts: number;
  performanceScore: number;
}

export interface BaselineStore {
  version: typeof BASELINE_SCHEMA_VERSION;
  entries: BaselineEntry[];
}

const NUMERIC_FIELDS = [
  'completedAt',
  'medianRtMs',
  'lapses',
  'falseStarts',
  'performanceScore',
] as const;

/** 허용 필드만 남기고 전부 버린다. 필수 값이 없거나 숫자가 아니면 저장을 거부한다. */
export function sanitizeEntry(input: unknown): BaselineEntry {
  if (typeof input !== 'object' || input === null) {
    throw new Error('저장할 수 없는 결과입니다.');
  }
  const source = input as Record<string, unknown>;

  if (typeof source.protocol !== 'string' || source.protocol.length === 0) {
    throw new Error('프로토콜 버전이 없는 결과는 저장하지 않습니다.');
  }
  for (const field of NUMERIC_FIELDS) {
    const value = source[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`저장할 수 없는 값입니다: ${field}`);
    }
  }

  return {
    protocol: source.protocol,
    completedAt: source.completedAt as number,
    medianRtMs: source.medianRtMs as number,
    lapses: source.lapses as number,
    falseStarts: source.falseStarts as number,
    performanceScore: source.performanceScore as number,
  };
}

function safeRemove(storage: Storage): void {
  try {
    storage.removeItem(BASELINE_STORAGE_KEY);
  } catch {
    /* 사파리 프라이빗 모드 등에서 실패해도 앱은 계속 동작해야 한다. */
  }
}

/** 깨진 값이나 모르는 schema 버전은 억지로 읽지 않고 지운다. */
export function readBaseline(storage: Storage): BaselineStore | null {
  let raw: string | null = null;
  try {
    raw = storage.getItem(BASELINE_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' || parsed === null
      || (parsed as BaselineStore).version !== BASELINE_SCHEMA_VERSION
      || !Array.isArray((parsed as BaselineStore).entries)
    ) {
      safeRemove(storage);
      return null;
    }
    const entries: BaselineEntry[] = [];
    for (const candidate of (parsed as BaselineStore).entries) {
      try {
        entries.push(sanitizeEntry(candidate));
      } catch {
        /* 깨진 항목 하나 때문에 전체 기록을 버리지는 않는다. */
      }
    }
    return { version: BASELINE_SCHEMA_VERSION, entries };
  } catch {
    safeRemove(storage);
    return null;
  }
}

export function isBaselineOn(storage: Storage): boolean {
  return readBaseline(storage) !== null;
}

function write(storage: Storage, store: BaselineStore): BaselineStore {
  try {
    storage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* 저장 실패는 조용히 넘긴다. 화면은 저장 없음 상태로 계속 동작한다. */
  }
  return store;
}

export function enableBaseline(storage: Storage): BaselineStore {
  const existing = readBaseline(storage);
  return existing ?? write(storage, { version: BASELINE_SCHEMA_VERSION, entries: [] });
}

export function clearBaseline(storage: Storage): void {
  safeRemove(storage);
}

/** 동의하지 않은 상태에서는 아무것도 쓰지 않는다. */
export function appendResult(storage: Storage, input: unknown): BaselineStore | null {
  const store = readBaseline(storage);
  if (store === null) return null;

  const entry = sanitizeEntry(input);
  const entries = [...store.entries, entry].slice(-BASELINE_MAX_ENTRIES);
  return write(storage, { version: BASELINE_SCHEMA_VERSION, entries });
}

export interface BaselineCurrent {
  medianRtMs: number;
  lapses: number;
}

export type BaselineComparison =
  | { state: 'off' }
  | { state: 'building'; have: number; need: number }
  | {
      state: 'ready';
      samples: number;
      baselineMedianRtMs: number;
      baselineLapses: number;
      /** 이번 값 - 기준값. 양수면 이번이 더 느리다/많다. */
      rtDeltaMs: number;
      lapseDelta: number;
    };

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return sorted.length % 2 === 1
    ? sorted[Math.floor(mid)]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * 같은 프로토콜 버전의 이전 결과만 기준선으로 쓴다.
 * 버전이 바뀌면 기존 기록은 남겨두되 비교에 쓰지 않고 새 기준선을 처음부터 만든다.
 */
export function compareToBaseline(
  store: BaselineStore | null,
  current: BaselineCurrent,
  protocol: string = PVT_PROTOCOL_VERSION,
): BaselineComparison {
  if (store === null) return { state: 'off' };

  const usable = store.entries.filter((entry) => entry.protocol === protocol);
  if (usable.length < BASELINE_MIN_ENTRIES) {
    return { state: 'building', have: usable.length, need: BASELINE_MIN_ENTRIES };
  }

  const window = usable.slice(-BASELINE_WINDOW);
  const baselineMedianRtMs = medianOf(window.map((entry) => entry.medianRtMs));
  const baselineLapses = medianOf(window.map((entry) => entry.lapses));

  return {
    state: 'ready',
    samples: window.length,
    baselineMedianRtMs,
    baselineLapses,
    rtDeltaMs: current.medianRtMs - baselineMedianRtMs,
    lapseDelta: current.lapses - baselineLapses,
  };
}
