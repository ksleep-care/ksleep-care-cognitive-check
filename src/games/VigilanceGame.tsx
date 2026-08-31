import { useEffect, useRef, useState } from 'react';
import type { VigilanceResult } from '../domain/types';

interface VigilanceGameProps {
  onComplete: (result: VigilanceResult) => void;
  getDelay?: () => number;
}

const TOTAL_TRIALS = 6;

export default function VigilanceGame({
  onComplete,
  getDelay = () => 650 + Math.round(Math.random() * 900),
}: VigilanceGameProps) {
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [trial, setTrial] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const shownAt = useRef(0);

  const finishOrContinue = (nextTimes: number[], nextMisses: number) => {
    const completed = nextTimes.length + nextMisses;
    if (completed === TOTAL_TRIALS) {
      onComplete({
        averageMs: nextTimes.length > 0
          ? Math.round(nextTimes.reduce((sum, value) => sum + value, 0) / nextTimes.length)
          : 0,
        hits: nextTimes.length,
        total: TOTAL_TRIALS,
        misses: nextMisses,
      });
      return true;
    }
    setTrial(completed);
    return false;
  };

  useEffect(() => {
    if (!started || visible || trial >= TOTAL_TRIALS) return;
    const timer = window.setTimeout(() => {
      shownAt.current = performance.now();
      setVisible(true);
    }, getDelay());
    return () => window.clearTimeout(timer);
  }, [getDelay, started, trial, visible]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      const nextMisses = misses + 1;
      setVisible(false);
      setMisses(nextMisses);
      finishOrContinue(times, nextMisses);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [misses, times, visible]);

  const hit = () => {
    const nextTimes = [...times, Math.max(0, Math.round(performance.now() - shownAt.current))];
    setVisible(false);
    setTimes(nextTimes);
    finishOrContinue(nextTimes, misses);
  };

  if (!started) {
    return (
      <section className="game-card center-card">
        <h2>별이 나타날 때까지 기다리세요</h2>
        <p>화면을 지켜보다가 별똥별이 보이면 바로 눌러요.</p>
        <button className="primary-button" type="button" onClick={() => setStarted(true)}>주의력 측정 시작</button>
      </section>
    );
  }

  return (
    <section className="game-card center-card" aria-live="polite">
      <p className="eyebrow">{trial + 1} / {TOTAL_TRIALS}</p>
      <div className="vigilance-stage">
        {visible ? (
          <button className="star-target" type="button" aria-label="별똥별 잡기" onClick={hit}>★</button>
        ) : (
          <p>별을 기다리는 중…</p>
        )}
      </div>
    </section>
  );
}
