import { useEffect, useRef, useState } from 'react';
import type { ReactionResult } from '../domain/types';

interface ReactionGameProps {
  onComplete: (result: ReactionResult) => void;
  getDelay?: () => number;
}

const TOTAL_TRIALS = 6;

export default function ReactionGame({
  onComplete,
  getDelay = () => 450 + Math.round(Math.random() * 650),
}: ReactionGameProps) {
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [trial, setTrial] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const shownAt = useRef(0);

  useEffect(() => {
    if (!started || visible || trial >= TOTAL_TRIALS) return;
    const timer = window.setTimeout(() => {
      shownAt.current = performance.now();
      setVisible(true);
    }, getDelay());
    return () => window.clearTimeout(timer);
  }, [getDelay, started, trial, visible]);

  const hit = () => {
    const nextTimes = [...times, Math.max(0, Math.round(performance.now() - shownAt.current))];
    if (nextTimes.length === TOTAL_TRIALS) {
      onComplete({
        averageMs: Math.round(nextTimes.reduce((sum, value) => sum + value, 0) / nextTimes.length),
        hits: TOTAL_TRIALS,
        total: TOTAL_TRIALS,
      });
      return;
    }
    setTimes(nextTimes);
    setTrial((current) => current + 1);
    setVisible(false);
  };

  if (!started) {
    return (
      <section className="game-card center-card">
        <h2>원이 나타나면 바로 누르세요</h2>
        <p>너무 일찍 누르지 말고 화면 중앙을 지켜보세요.</p>
        <button className="primary-button" type="button" onClick={() => setStarted(true)}>반응 시작</button>
      </section>
    );
  }

  return (
    <section className="game-card center-card" aria-live="polite">
      <p className="eyebrow">{trial + 1} / {TOTAL_TRIALS}</p>
      <div className="reaction-stage">
        {visible ? (
          <button className="reaction-target" type="button" aria-label="지금 누르기" onClick={hit} />
        ) : (
          <p>기다려 주세요…</p>
        )}
      </div>
    </section>
  );
}
