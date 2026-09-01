import {
  PVT_FEEDBACK_MS,
  PVT_MIN_VALID_RT_MS,
  PVT_NO_RESPONSE_MS,
  PVT_PRACTICE_TRIALS,
  PVT_SCORED_DURATION_MS,
  drawIsiMs,
  type PvtTrial,
} from './pvt';

export type PvtPhase = 'idle' | 'practice' | 'bridge' | 'scored' | 'done';

export interface PvtEngineView {
  /** 자극이 보이는가. */
  live: boolean;
  /** 자극이 없을 때 자리에 보여줄 짧은 중립 문구. */
  message: string;
  phase: PvtPhase;
}

export interface PvtEngineHost {
  onView(view: PvtEngineView): void;
  onFinish(trials: PvtTrial[], context: { tabHidden: boolean }): void;
}

export interface PvtEngineOptions {
  scoredDurationMs?: number;
  practiceTrials?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => number;
  clearTimer?: (id: number) => void;
  random?: () => number;
}

/**
 * 3분 PVT의 시행 진행을 React 밖에서 관리한다.
 * 화면 재렌더링이 자극 타이밍을 흔들지 않게 하고, 경계값을 테스트할 수 있게 하려는 목적이다.
 */
export class PvtEngine {
  private readonly host: PvtEngineHost;
  private readonly scoredDurationMs: number;
  private readonly practiceTrials: number;
  private readonly now: () => number;
  private readonly setTimer: (fn: () => void, ms: number) => number;
  private readonly clearTimer: (id: number) => void;
  private readonly random: () => number;

  private phase: PvtPhase = 'idle';
  private live = false;
  private message = '';
  private timerId = 0;
  private shownAt = 0;
  private scheduledAt = 0;
  private scoredStartedAt = 0;
  private practiceCount = 0;
  private hidden = false;
  private collected: PvtTrial[] = [];

  constructor(host: PvtEngineHost, options: PvtEngineOptions = {}) {
    this.host = host;
    this.scoredDurationMs = options.scoredDurationMs ?? PVT_SCORED_DURATION_MS;
    this.practiceTrials = options.practiceTrials ?? PVT_PRACTICE_TRIALS;
    this.now = options.now ?? (() => performance.now());
    this.setTimer = options.setTimer ?? ((fn, ms) => window.setTimeout(fn, ms));
    this.clearTimer = options.clearTimer ?? ((id) => window.clearTimeout(id));
    this.random = options.random ?? Math.random;
  }

  get trials(): PvtTrial[] {
    return [...this.collected];
  }

  get tabHidden(): boolean {
    return this.hidden;
  }

  get currentPhase(): PvtPhase {
    return this.phase;
  }

  /** 측정 구간에서만 탭 이탈을 기록한다. */
  markHidden(): void {
    if (this.phase === 'scored') this.hidden = true;
  }

  /** 측정 시작 시점 기준으로 흐른 비율 0~1. */
  progress(): number {
    if (this.phase !== 'scored') return 0;
    return Math.min(1, (this.now() - this.scoredStartedAt) / this.scoredDurationMs);
  }

  /** 자극이 떠 있는 동안 화면에 올릴 경과 ms. */
  elapsedSinceStimulus(): number {
    return this.live ? Math.max(0, Math.round(this.now() - this.shownAt)) : 0;
  }

  startPractice(): void {
    this.collected = [];
    this.practiceCount = 0;
    this.hidden = false;
    this.phase = 'practice';
    this.emit();
    this.schedule(drawIsiMs(this.random));
  }

  startScored(): void {
    this.collected = [];
    this.hidden = false;
    this.phase = 'scored';
    this.scoredStartedAt = this.now();
    this.emit();
    this.schedule(drawIsiMs(this.random));
  }

  stop(): void {
    this.clear();
    this.live = false;
    this.phase = 'idle';
    this.emit();
  }

  press(): void {
    if (this.phase !== 'practice' && this.phase !== 'scored') return;

    if (!this.live) {
      // 자극이 없는데 누른 것. 논문의 errors of commission.
      this.collected.push({ kind: 'falseStart', rtMs: null, driftMs: 0 });
      this.endTrial('아직이에요', PVT_FEEDBACK_MS);
      return;
    }

    const rtMs = Math.round(this.now() - this.shownAt);
    const driftMs = Math.round(this.shownAt - this.scheduledAt);

    if (rtMs < PVT_MIN_VALID_RT_MS) {
      this.collected.push({ kind: 'falseStart', rtMs, driftMs });
      this.endTrial('너무 빨라요', PVT_FEEDBACK_MS);
      return;
    }

    this.collected.push({ kind: 'response', rtMs, driftMs });
    this.endTrial(String(rtMs), Math.max(PVT_FEEDBACK_MS, drawIsiMs(this.random) - rtMs));
  }

  private clear(): void {
    if (this.timerId) this.clearTimer(this.timerId);
    this.timerId = 0;
  }

  private emit(): void {
    this.host.onView({ live: this.live, message: this.message, phase: this.phase });
  }

  private schedule(delayMs: number): void {
    this.clear();
    this.live = false;
    this.scheduledAt = this.now() + delayMs;
    this.emit();

    this.timerId = this.setTimer(() => {
      if (this.phase === 'scored' && this.now() - this.scoredStartedAt >= this.scoredDurationMs) {
        this.finish();
        return;
      }
      this.shownAt = this.now();
      this.live = true;
      this.message = '';
      this.emit();

      this.timerId = this.setTimer(() => {
        this.collected.push({
          kind: 'timeout',
          driftMs: Math.round(this.shownAt - this.scheduledAt),
        });
        this.endTrial('놓쳤어요', PVT_FEEDBACK_MS);
      }, PVT_NO_RESPONSE_MS);
    }, delayMs);
  }

  private endTrial(message: string, nextDelayMs: number): void {
    this.clear();
    this.live = false;
    this.message = message;
    this.emit();

    if (this.phase === 'practice') {
      this.practiceCount += 1;
      if (this.practiceCount >= this.practiceTrials) {
        this.collected = [];
        this.phase = 'bridge';
        this.emit();
        return;
      }
      this.timerId = this.setTimer(() => this.schedule(drawIsiMs(this.random)), PVT_FEEDBACK_MS);
      return;
    }

    if (this.now() - this.scoredStartedAt >= this.scoredDurationMs) {
      this.finish();
      return;
    }

    this.timerId = this.setTimer(() => this.schedule(0), nextDelayMs);
  }

  private finish(): void {
    this.clear();
    this.live = false;
    this.message = '';
    this.phase = 'done';
    this.emit();
    this.host.onFinish(this.trials, { tabHidden: this.hidden });
  }
}
