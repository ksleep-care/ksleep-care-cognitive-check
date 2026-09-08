import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Feedback from '../ui/Feedback';
import { useTimedPhase } from './useTimedPhase';
import { completionLabel } from '../domain/session';
import { LEVEL_CONFIG, makeRandom, makeStroopTrials } from '../domain/levels';
import type { Level, TimedAccuracyResult } from '../domain/types';

type ColorName = '빨강' | '파랑' | '초록' | '노랑';

const COLORS: ColorName[] = ['빨강', '파랑', '초록', '노랑'];

interface StroopGameProps {
  level: Level;
  onComplete: (result: TimedAccuracyResult) => void;
  seed?: number;
  onTimingChange?: (active: boolean) => void;
}

export default function StroopGame({ level, onComplete, seed, onTimingChange }: StroopGameProps) {
  const trials = useMemo(() => {
    return makeStroopTrials(level, makeRandom(seed ?? Date.now()));
  }, [level, seed]);

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<ColorName | 'timeout' | null>(null);
  const locked = useRef(false);
  const times = useRef<number[]>([]);
  const startedAt = useRef(performance.now());
  useTimedPhase(picked === null, onTimingChange);

  const trial = trials[index];
  const isLast = index === trials.length - 1;
  const isCorrect = picked === trial.ink;
  useLayoutEffect(() => { startedAt.current = performance.now(); locked.current = false; }, [index]);
  useEffect(() => {
    if (picked !== null) return;
    const timer = window.setTimeout(() => { locked.current = true; setPicked('timeout'); }, LEVEL_CONFIG[level].stroopDeadlineMs);
    return () => window.clearTimeout(timer);
  }, [index, picked, level]);

  const choose = (color: ColorName) => {
    if (picked !== null || locked.current) return;
    locked.current = true;
    if (performance.now() - startedAt.current >= LEVEL_CONFIG[level].stroopDeadlineMs) { setPicked('timeout'); return; }
    if (color === trial.ink) times.current.push(Math.max(0, Math.round(performance.now() - startedAt.current)));
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
      <p className="eyebrow">문제 {index + 1} / {trials.length} · {LEVEL_CONFIG[level].stroopDeadlineMs / 1000}초 안에</p>
      <h2 id="stroop-title">글자색을 고르세요</h2>
      <div className={`stroop-word color-${trial.ink}`} data-testid="stroop-stimulus">{trial.word}</div>

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
          hint={picked === 'timeout' ? '시간이 끝났어요. 단어의 뜻보다 글자색을 먼저 보세요.' : `글자색은 ${trial.ink}이었어요. 뜻과 색이 같을 때도 있어요.`}
          nextLabel={isLast ? completionLabel('stroop') : '다음 문제'}
          onNext={advance}
        />
      )}
    </section>
  );
}
