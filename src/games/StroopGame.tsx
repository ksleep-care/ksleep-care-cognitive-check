import { useRef, useState } from 'react';
import type { TimedAccuracyResult } from '../domain/types';

type ColorName = '빨강' | '파랑' | '초록' | '노랑';

const COLORS: ColorName[] = ['빨강', '파랑', '초록', '노랑'];
const TRIALS: Array<{ word: ColorName; ink: ColorName }> = [
  { word: '파랑', ink: '빨강' },
  { word: '노랑', ink: '파랑' },
  { word: '빨강', ink: '초록' },
  { word: '초록', ink: '노랑' },
  { word: '노랑', ink: '빨강' },
  { word: '파랑', ink: '초록' },
  { word: '초록', ink: '파랑' },
  { word: '빨강', ink: '노랑' },
];

interface StroopGameProps {
  onComplete: (result: TimedAccuracyResult) => void;
}

export default function StroopGame({ onComplete }: StroopGameProps) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const startedAt = useRef(performance.now());
  const trial = TRIALS[index];

  const choose = (color: ColorName) => {
    const nextCorrect = correct + (color === trial.ink ? 1 : 0);
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
      <h2>글자색을 고르세요</h2>
      <div className={`stroop-word color-${trial.ink}`}>{trial.word}</div>
      <div className="color-options">
        {COLORS.map((color) => (
          <button className={`color-button color-button-${color}`} type="button" key={color} onClick={() => choose(color)}>
            {color}
          </button>
        ))}
      </div>
    </section>
  );
}
