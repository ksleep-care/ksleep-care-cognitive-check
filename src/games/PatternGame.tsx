import { useMemo, useRef, useState } from 'react';
import Feedback from '../ui/Feedback';
import { LEVEL_CONFIG, makeRandom, shuffle } from '../domain/levels';
import type { Level, TimedAccuracyResult } from '../domain/types';

const SHAPES = ['●', '▲', '■', '◆', '★', '⬟'];

interface PatternTrial {
  target: string;
  options: string[];
}

function makeTrial(symbols: number, random: () => number): PatternTrial {
  const draw = () => Array.from({ length: symbols }, () => SHAPES[Math.floor(random() * SHAPES.length)]).join('');
  const target = draw();

  const distractors = new Set<string>();
  let guard = 0;
  while (distractors.size < 3 && guard < 60) {
    guard += 1;
    const chars = [...target];
    const at = Math.floor(random() * chars.length);
    const replacement = SHAPES[Math.floor(random() * SHAPES.length)];
    if (replacement === chars[at]) continue;
    chars[at] = replacement;
    const candidate = chars.join('');
    if (candidate !== target) distractors.add(candidate);
  }
  while (distractors.size < 3) distractors.add(`${target}${SHAPES[distractors.size]}`);

  return { target, options: shuffle([target, ...distractors], random) };
}

interface PatternGameProps {
  level: Level;
  onComplete: (result: TimedAccuracyResult) => void;
  seed?: number;
}

export default function PatternGame({ level, onComplete, seed }: PatternGameProps) {
  const trials = useMemo(() => {
    const { patternTrials, patternSymbols } = LEVEL_CONFIG[level];
    const random = makeRandom(seed ?? Date.now());
    return Array.from({ length: patternTrials }, () => makeTrial(patternSymbols, random));
  }, [level, seed]);

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const times = useRef<number[]>([]);
  const startedAt = useRef(performance.now());

  const trial = trials[index];
  const isLast = index === trials.length - 1;
  const isCorrect = picked === trial.target;

  const choose = (pattern: string) => {
    if (picked !== null) return;
    times.current.push(Math.max(0, Math.round(performance.now() - startedAt.current)));
    setPicked(pattern);
    if (pattern === trial.target) setCorrect((current) => current + 1);
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
    <section className="game-card center-card" aria-labelledby="pattern-title">
      <p className="eyebrow">문제 {index + 1} / {trials.length}</p>
      <h2 id="pattern-title">같은 패턴을 찾으세요</h2>
      <div className="pattern-target" data-testid="pattern-target" aria-label={`기준 패턴 ${trial.target}`}>
        {trial.target}
      </div>

      <div className="pattern-options">
        {trial.options.map((pattern) => {
          const state = picked === null
            ? ''
            : pattern === trial.target
              ? ' is-answer'
              : pattern === picked
                ? ' is-wrong'
                : ' is-dim';
          return (
            <button
              className={`pattern-button tilt${state}`}
              type="button"
              aria-label={`패턴 ${pattern}`}
              key={pattern}
              disabled={picked !== null}
              onClick={() => choose(pattern)}
            >
              {pattern}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <Feedback
          correct={isCorrect}
          answer={trial.target}
          hint="기준 패턴과 순서까지 똑같은 것을 골라야 해요."
          nextLabel={isLast ? '결과 보기' : '다음 문제'}
          onNext={advance}
        />
      )}
    </section>
  );
}
