import { useEffect, useRef, useState } from 'react';
import Feedback from '../ui/Feedback';
import { LEVEL_CONFIG, digitRevealMs } from '../domain/levels';
import type { DigitResult, Level } from '../domain/types';

interface DigitSpanGameProps {
  level: Level;
  onComplete: (result: DigitResult) => void;
  /** 테스트에서 노출 시간을 짧게 만들기 위한 주입점. */
  revealMsOverride?: number;
}

export default function DigitSpanGame({ level, onComplete, revealMsOverride }: DigitSpanGameProps) {
  const sequences = LEVEL_CONFIG[level].digitSequences;

  const [index, setIndex] = useState(0);
  const [revealing, setRevealing] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [maxSpan, setMaxSpan] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const sequence = sequences[index];
  const expected = [...sequence].reverse().join('');
  const isLast = index === sequences.length - 1;
  const isCorrect = submitted === expected;

  useEffect(() => {
    setRevealing(true);
    const ms = revealMsOverride ?? digitRevealMs(sequences[index]);
    const timer = window.setTimeout(() => setRevealing(false), ms);
    return () => window.clearTimeout(timer);
  }, [index, revealMsOverride, sequences]);

  useEffect(() => {
    if (!revealing && submitted === null) inputRef.current?.focus();
  }, [revealing, submitted]);

  const submit = () => {
    if (answer.length === 0 || submitted !== null) return;
    setSubmitted(answer);
    if (answer === expected) {
      setCorrect((current) => current + 1);
      setMaxSpan((current) => Math.max(current, sequence.length));
    }
  };

  const advance = () => {
    if (isLast) {
      onComplete({ maxSpan, correct, total: sequences.length });
      return;
    }
    setSubmitted(null);
    setAnswer('');
    setIndex((current) => current + 1);
  };

  return (
    <section className="game-card center-card" aria-labelledby="digit-title">
      <p className="eyebrow">문제 {index + 1} / {sequences.length} · {sequence.length}자리</p>

      {revealing ? (
        <>
          <h2 id="digit-title">숫자를 기억하세요</h2>
          <div className="digit-sequence" aria-live="polite">{sequence}</div>
        </>
      ) : (
        <>
          <h2 id="digit-title">거꾸로 입력하세요</h2>
          <label className="sr-only" htmlFor="digit-answer">거꾸로 입력</label>
          <input
            id="digit-answer"
            ref={inputRef}
            className="digit-input"
            type="text"
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            pattern="[0-9]*"
            maxLength={sequence.length}
            disabled={submitted !== null}
            value={submitted ?? answer}
            onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ''))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
          {submitted === null ? (
            <button className="primary-button" type="button" disabled={answer.length === 0} onClick={submit}>
              답 제출
            </button>
          ) : (
            <Feedback
              correct={isCorrect}
              answer={expected}
              hint={`${sequence}를 뒤집으면 ${expected}예요.`}
              nextLabel={isLast ? '결과 보기' : '다음 문제'}
              onNext={advance}
            />
          )}
        </>
      )}
    </section>
  );
}
