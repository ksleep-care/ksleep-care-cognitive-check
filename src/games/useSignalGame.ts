import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAutoAdvance } from '../ui/useAutoAdvance';
import { play } from '../ui/sound';

export type SignalPhase = 'waiting' | 'visible' | 'feedback';
export interface SignalSummary { averageMs: number; hits: number; total: number; earlyPresses: number; misses: number }
export function useSignalGame({ total, waitMaxMs, deadlineMs, getDelay, onComplete }: {
  total: number; waitMaxMs: number; deadlineMs: number; getDelay?: () => number; onComplete: (r: SignalSummary) => void;
}) {
  const [phase, setPhase] = useState<SignalPhase>('waiting');
  const phaseRef = useRef<SignalPhase>('waiting');
  const [trial, setTrial] = useState(0);
  const [outcome, setOutcome] = useState<'hit' | 'early' | 'miss'>('hit');
  const [lastMs, setLastMs] = useState<number | null>(null);
  const times = useRef<number[]>([]);
  const misses = useRef(0);
  const early = useRef(0);
  const onset = useRef(0);
  const finishTrial = (kind: 'hit' | 'early' | 'miss', ms: number | null = null) => {
    if (phaseRef.current === 'feedback') return;
    phaseRef.current = 'feedback';
    if (kind === 'hit' && ms !== null) times.current.push(ms);
    if (kind === 'early') early.current++;
    if (kind === 'miss') misses.current++;
    setOutcome(kind); setLastMs(ms); setPhase('feedback');
    play(kind === 'hit' ? 'hit' : kind === 'early' ? 'early' : 'miss');
  };
  useEffect(() => {
    if (phase !== 'waiting') return;
    const timer = window.setTimeout(() => {
      phaseRef.current = 'visible';
      setPhase('visible');
    }, getDelay?.() ?? 1000 + Math.random() * (waitMaxMs - 1000));
    return () => window.clearTimeout(timer);
  }, [phase, trial, getDelay, waitMaxMs]);
  // DOM 반영 후 시각. 웹 화면/입력 지연은 남으므로 연구 기기의 절대값과 비교하지 않는다.
  useLayoutEffect(() => {
    if (phase === 'visible') onset.current = performance.now();
  }, [phase]);
  useEffect(() => {
    if (phase !== 'visible') return;
    const timer = window.setTimeout(() => finishTrial('miss'), deadlineMs);
    return () => window.clearTimeout(timer);
  }, [phase, deadlineMs]);
  const press = () => {
    if (phaseRef.current === 'waiting') { finishTrial('early'); return; }
    if (phaseRef.current !== 'visible') return;
    const ms = Math.round(performance.now() - onset.current);
    if (ms < 100) finishTrial('early');
    else if (ms >= deadlineMs) finishTrial('miss');
    else finishTrial('hit', ms);
  };
  const advance = () => {
    if (trial + 1 >= total) {
      const values = times.current;
      onComplete({ averageMs: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0,
        hits: values.length, total, earlyPresses: early.current, misses: misses.current });
      return;
    }
    phaseRef.current = 'waiting';
    setTrial(t => t + 1); setPhase('waiting');
  };
  useAutoAdvance(phase === 'feedback', 1000, advance);
  return { phase, trial, outcome, lastMs, press, hits: times.current.length };
}
