import { useRef, useState } from 'react';
import type { TimedAccuracyResult } from '../domain/types';

const TRIALS = [
  { target: '●▲', options: ['●▲', '▲●', '■●', '●■'] },
  { target: '■◆', options: ['◆■', '■◆', '●◆', '■●'] },
  { target: '▲●', options: ['●▲', '▲■', '▲●', '◆●'] },
  { target: '◆■', options: ['◆●', '■◆', '◆■', '▲■'] },
  { target: '●■', options: ['■●', '●◆', '●■', '▲●'] },
  { target: '▲◆', options: ['◆▲', '▲●', '■◆', '▲◆'] },
];

interface PatternGameProps {
  onComplete: (result: TimedAccuracyResult) => void;
}

export default function PatternGame({ onComplete }: PatternGameProps) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const startedAt = useRef(performance.now());
  const trial = TRIALS[index];

  const choose = (pattern: string) => {
    const nextCorrect = correct + (pattern === trial.target ? 1 : 0);
    const nextTimes = [...times, Math.max(0, Math.round(performance.now() - startedAt.current))];
    if (index === TRIALS.length - 1) {
      onComplete({
        averageMs: Math.round(nextTimes.reduce((sum, value) => sum + value, 0) / nextTimes.length),
        correct: nextCorrect,
        total: TRIALS.length,
      });
      return;
    }
    setCorrect(nextCorrect);
    setTimes(nextTimes);
    setIndex((current) => current + 1);
    startedAt.current = performance.now();
  };

  return (
    <section className="game-card center-card">
      <p className="eyebrow">문제 {index + 1} / {TRIALS.length}</p>
      <h2>같은 패턴을 찾으세요</h2>
      <div className="pattern-target" data-testid="pattern-target">{trial.target}</div>
      <div className="pattern-options">
        {trial.options.map((pattern) => (
          <button className="pattern-button" type="button" aria-label={`패턴 ${pattern}`} key={pattern} onClick={() => choose(pattern)}>
            {pattern}
          </button>
        ))}
      </div>
    </section>
  );
}
