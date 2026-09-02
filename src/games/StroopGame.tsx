import { useMemo, useRef, useState } from 'react';
import Feedback from '../ui/Feedback';
import { LEVEL_CONFIG, makeRandom, shuffle } from '../domain/levels';
import type { Level, TimedAccuracyResult } from '../domain/types';

type ColorName = '빨강' | '파랑' | '초록' | '노랑';

const COLORS: ColorName[] = ['빨강', '파랑', '초록', '노랑'];

const POOL: Array<{ word: ColorName; ink: ColorName }> = [
  { word: '파랑', ink: '빨강' },
  { word: '노랑', ink: '파랑' },
  { word: '빨강', ink: '초록' },
  { word: '초록', ink: '노랑' },
  { word: '노랑', ink: '빨강' },
  { word: '파랑', ink: '초록' },
  { word: '초록', ink: '파랑' },
  { word: '빨강', ink: '노랑' },
  { word: '노랑', ink: '초록' },
  { word: '초록', ink: '빨강' },
  { word: '빨강', ink: '파랑' },
  { word: '파랑', ink: '노랑' },
];

interface StroopGameProps {
  level: Level;
  onComplete: (result: TimedAccuracyResult) => void;
  seed?: number;
}

export default function StroopGame({ level, onComplete, seed }: StroopGameProps) {
  const trials = useMemo(() => {
    const count = LEVEL_CONFIG[level].stroopTrials;
    return shuffle(POOL, makeRandom(seed ?? Date.now())).slice(0, count);
  }, [level, seed]);

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<ColorName | null>(null);
  const times = useRef<number[]>([]);
  const startedAt = useRef(performance.now());

  const trial = trials[index];
  const isLast = index === trials.length - 1;
  const isCorrect = picked === trial.ink;

  const choose = (color: ColorName) => {
    if (picked !== null) return;
    times.current.push(Math.max(0, Math.round(performance.now() - startedAt.current)));
    setPicked(color);
    if (color === trial.ink) setCorrect((current) => current + 1);
  };

  const advance = () => {
    if (isLast) {
      const values = times.current;
      onComplete({
        averageMs: values.length > 0
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : 0,
        correct,
        total: trials.length,
      });
      return;
    }
    setPicked(null);
    setIndex((current) => current + 1);
    startedAt.current = performance.now();
  };

  return (
    <section className="game-card center-card" aria-labelledby="stroop-title">
      <p className="eyebrow">문제 {index + 1} / {trials.length}</p>
      <h2 id="stroop-title">글자색을 고르세요</h2>
      <div className={`stroop-word color-${trial.ink}`}>{trial.word}</div>

      <div className="color-options">
        {COLORS.map((color) => {
          const state = picked === null
            ? ''
            : color === trial.ink
              ? ' is-answer'
              : color === picked
                ? ' is-wrong'
                : ' is-dim';
          return (
            <button
              className={`color-button color-button-${color}${state}`}
              type="button"
              key={color}
              disabled={picked !== null}
              onClick={() => choose(color)}
            >
              {color}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <Feedback
          correct={isCorrect}
          answer={trial.ink}
          hint={`"${trial.word}"라고 써 있지만 글자색은 ${trial.ink}이었어요.`}
          nextLabel={isLast ? '결과 보기' : '다음 문제'}
          onNext={advance}
        />
      )}
    </section>
  );
}
