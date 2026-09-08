import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Feedback from '../ui/Feedback';
import { useTimedPhase } from './useTimedPhase';
import { completionLabel } from '../domain/session';
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
  for (const shape of SHAPES) {
    if (distractors.size >= 3) break;
    const candidate = shape + target.slice(1);
    if (candidate !== target) distractors.add(candidate);
  }

  return { target, options: shuffle([target, ...distractors], random) };
}

interface PatternGameProps {
  level: Level;
  onComplete: (result: TimedAccuracyResult) => void;
  seed?: number;
  onTimingChange?: (active: boolean) => void;
}

export default function PatternGame({ level, onComplete, seed, onTimingChange }: PatternGameProps) {
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
  const locked = useRef(false);
  useTimedPhase(picked === null, onTimingChange);

  const trial = trials[index];
  const isLast = index === trials.length - 1;
  const isCorrect = picked === trial.target;
  useLayoutEffect(() => { startedAt.current = performance.now(); locked.current = false; }, [index]);
  useEffect(() => {
    if (picked !== null) return;
    const timer = window.setTimeout(() => { locked.current = true; setPicked('timeout'); }, LEVEL_CONFIG[level].patternDeadlineMs);
    return () => window.clearTimeout(timer);
  }, [index, picked, level]);

  const choose = (pattern: string) => {
    if (picked !== null || locked.current) return;
    locked.current = true;
    if (performance.now() - startedAt.current >= LEVEL_CONFIG[level].patternDeadlineMs) { setPicked('timeout'); return; }
    if (pattern === trial.target) times.current.push(Math.max(0, Math.round(performance.now() - startedAt.current)));
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
      <p className="eyebrow">문제 {index + 1} / {trials.length} · {LEVEL_CONFIG[level].patternDeadlineMs / 1000}초 안에</p>
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
              className={`pattern-button${state}`}
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
          hint={picked === 'timeout' ? '시간이 끝났어요. 모양과 순서를 함께 비교해 보세요.' : '기준 패턴과 순서까지 똑같은 것을 골라야 해요.'}
          nextLabel={isLast ? completionLabel('pattern') : '다음 문제'}
          onNext={advance}
        />
      )}
    </section>
  );
}
