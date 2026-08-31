import { useEffect, useState } from 'react';
import type { DigitResult } from '../domain/types';

const SEQUENCES = ['927', '6481', '72035'];

interface DigitSpanGameProps {
  onComplete: (result: DigitResult) => void;
  revealMs?: number;
}

export default function DigitSpanGame({ onComplete, revealMs = 1200 }: DigitSpanGameProps) {
  const [index, setIndex] = useState(0);
  const [revealing, setRevealing] = useState(true);
  const [answer, setAnswer] = useState('');
  const [correct, setCorrect] = useState(0);
  const [maxSpan, setMaxSpan] = useState(0);

  useEffect(() => {
    setRevealing(true);
    const timer = window.setTimeout(() => setRevealing(false), revealMs);
    return () => window.clearTimeout(timer);
  }, [index, revealMs]);

  const submit = () => {
    const expected = [...SEQUENCES[index]].reverse().join('');
    const isCorrect = answer === expected;
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    const nextMaxSpan = isCorrect ? Math.max(maxSpan, SEQUENCES[index].length) : maxSpan;

    if (index === SEQUENCES.length - 1) {
      onComplete({ maxSpan: nextMaxSpan, correct: nextCorrect, total: SEQUENCES.length });
      return;
    }
    setCorrect(nextCorrect);
    setMaxSpan(nextMaxSpan);
    setAnswer('');
    setIndex((current) => current + 1);
  };

  return (
    <section className="game-card center-card" aria-live="polite">
      <p className="eyebrow">문제 {index + 1} / {SEQUENCES.length}</p>
      {revealing ? (
        <>
          <h2>숫자를 기억하세요</h2>
          <div className="digit-sequence">{SEQUENCES[index]}</div>
        </>
      ) : (
        <>
          <h2>거꾸로 입력하세요</h2>
          <label className="sr-only" htmlFor="digit-answer">거꾸로 입력</label>
          <input
            id="digit-answer"
            className="digit-input"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            autoFocus
            value={answer}
            onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ''))}
          />
          <button className="primary-button" type="button" disabled={!answer} onClick={submit}>답 제출</button>
        </>
      )}
    </section>
  );
}
