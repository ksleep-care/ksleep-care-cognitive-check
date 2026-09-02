import { useEffect, useRef, useState } from 'react';
import { useAutoAdvance } from '../ui/useAutoAdvance';
import type { VigilanceResult } from '../domain/types';

interface VigilanceGameProps {
  onComplete: (result: VigilanceResult) => void;
  getDelay?: () => number;
  missAfterMs?: number;
}

const TOTAL_TRIALS = 6;

type Phase = 'ready' | 'waiting' | 'visible' | 'feedback';

/**
 * 짧고 재미있는 별똥별 게임이다. 3분 PVT와 다른 과제이며,
 * 결과는 `게임 기록`으로만 쓰고 연구 참고 비교에 넣지 않는다.
 */
export default function VigilanceGame({
  onComplete,
  getDelay = () => 900 + Math.round(Math.random() * 2200),
  missAfterMs = 3000,
}: VigilanceGameProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [trial, setTrial] = useState(0);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const times = useRef<number[]>([]);
  const misses = useRef(0);
  const shownAt = useRef(0);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const timer = window.setTimeout(() => {
      shownAt.current = performance.now();
      setPhase('visible');
    }, getDelay());
    return () => window.clearTimeout(timer);
  }, [getDelay, phase]);

  useEffect(() => {
    if (phase !== 'visible') return;
    const timer = window.setTimeout(() => {
      misses.current += 1;
      setLastMs(null);
      setPhase('feedback');
    }, missAfterMs);
    return () => window.clearTimeout(timer);
  }, [missAfterMs, phase]);

  const hit = () => {
    const elapsed = Math.max(0, Math.round(performance.now() - shownAt.current));
    times.current.push(elapsed);
    setLastMs(elapsed);
    setPhase('feedback');
  };

  const advanceNow = () => {
    const done = trial + 1;
    if (done >= TOTAL_TRIALS) {
      const values = times.current;
      onComplete({
        averageMs: values.length > 0
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : 0,
        hits: values.length,
        total: TOTAL_TRIALS,
        misses: misses.current,
      });
      return;
    }
    setTrial(done);
    setPhase('waiting');
  };

  /** 결과를 1200ms 보여준 뒤 알아서 다음 문제로 간다. 손으로 눌러도 한 번만 넘어간다. */
  const advance = useAutoAdvance(phase === 'feedback', 1200, advanceNow);

  if (phase === 'ready') {
    return (
      <section className="game-card center-card">
        <h2>별이 나타나면 바로 누르세요</h2>
        <p className="game-note">6번이에요. 3분 집중 측정과는 다른 짧은 게임이에요.</p>
        <button className="primary-button" type="button" onClick={() => setPhase('waiting')}>
          시작
        </button>
      </section>
    );
  }

  return (
    <section className="game-card center-card night-stage" aria-live="polite">
      <p className="eyebrow">{trial + 1} / {TOTAL_TRIALS}</p>

      {phase === 'waiting' && (
        <div className="vigilance-stage">
          <p className="game-note">별을 기다리는 중…</p>
        </div>
      )}

      {phase === 'visible' && (
        <div className="vigilance-stage">
          <button className="star-target" type="button" aria-label="별똥별 잡기" onClick={hit}>★</button>
        </div>
      )}

      {phase === 'feedback' && (
        <div className={`vigilance-stage is-feedback ${lastMs === null ? 'is-miss' : 'is-hit'}`}>
          <p className="reaction-readout">{lastMs === null ? '놓쳤어요' : `${lastMs}ms`}</p>
          <button className="primary-button" type="button" autoFocus onClick={advance}>
            {trial + 1 >= TOTAL_TRIALS ? '결과 보기' : '다음'}
          </button>
        </div>
      )}
    </section>
  );
}
