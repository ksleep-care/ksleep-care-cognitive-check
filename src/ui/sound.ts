import { useSyncExternalStore } from 'react';

/**
 * 효과음. 파일 없이 Web Audio로 짧은 음을 만든다.
 *
 * - 기본은 꺼짐이다. 켜는 것은 사용자의 손짓(버튼)이어야 브라우저가 소리를 허용한다.
 * - 설정은 저장하지 않는다. 동의 전 브라우저 저장소를 비워 두는 약속 때문이다. 새로고침하면 꺼진다.
 * - 3분 측정에서는 누른 **뒤**에만 소리를 낸다. 자극 전에 소리를 내면 예고가 되어 측정을 오염시킨다.
 */
export type SoundKind = 'hit' | 'early' | 'miss' | 'correct' | 'wrong' | 'finish';

let enabled = false;
let context: AudioContext | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isSoundOn(): boolean {
  return enabled;
}

export function setSoundOn(next: boolean): void {
  enabled = next;
  if (next) {
    try {
      context ??= new AudioContext();
      void context.resume();
    } catch {
      enabled = false;
    }
  }
  notify();
}

/** 컴포넌트에서 켜짐 여부를 구독한다. */
export function useSoundOn(): boolean {
  return useSyncExternalStore(subscribe, isSoundOn, () => false);
}

interface Note {
  /** Hz */
  freq: number;
  /** 시작 시각(초, 지금 기준) */
  at: number;
  /** 길이(초) */
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

/** 소리마다 짧은 음 몇 개. 전부 0.5초 안에 끝난다. */
const NOTES: Record<SoundKind, Note[]> = {
  hit: [{ freq: 880, at: 0, dur: 0.08, type: 'triangle' }],
  early: [{ freq: 180, at: 0, dur: 0.16, type: 'sawtooth', gain: 0.12 }],
  miss: [{ freq: 240, at: 0, dur: 0.12, type: 'square', gain: 0.08 }, { freq: 180, at: 0.12, dur: 0.14, type: 'square', gain: 0.08 }],
  correct: [{ freq: 660, at: 0, dur: 0.08 }, { freq: 990, at: 0.08, dur: 0.12 }],
  wrong: [{ freq: 300, at: 0, dur: 0.14, type: 'triangle', gain: 0.14 }],
  finish: [
    { freq: 523, at: 0, dur: 0.1 },
    { freq: 659, at: 0.1, dur: 0.1 },
    { freq: 784, at: 0.2, dur: 0.1 },
    { freq: 1047, at: 0.3, dur: 0.22 },
  ],
};

export function play(kind: SoundKind): void {
  if (!enabled || context === null) return;
  const now = context.currentTime;
  for (const note of NOTES[kind]) {
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = note.type ?? 'sine';
    osc.frequency.setValueAtTime(note.freq, now + note.at);
    const peak = note.gain ?? 0.18;
    amp.gain.setValueAtTime(0.0001, now + note.at);
    amp.gain.exponentialRampToValueAtTime(peak, now + note.at + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.dur);
    osc.connect(amp);
    amp.connect(context.destination);
    osc.start(now + note.at);
    osc.stop(now + note.at + note.dur + 0.02);
  }
}
