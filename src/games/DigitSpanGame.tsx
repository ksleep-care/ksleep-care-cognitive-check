import { useEffect, useRef, useState } from 'react';
import Feedback from '../ui/Feedback';
import { useTimedPhase } from './useTimedPhase';
import { completionLabel } from '../domain/session';
import { LEVEL_CONFIG, DIGIT_ON_MS, DIGIT_GAP_MS, createDigitSequence, nextDigitSpan } from '../domain/levels';
import type { DigitResult, Level } from '../domain/types';

interface DigitSpanGameProps {
  level: Level;
  onComplete: (result: DigitResult) => void;
  /** 테스트에서 노출 시간을 짧게 만들기 위한 주입점. */
  revealMsOverride?: number;
  random?: () => number;
  onTimingChange?: (active: boolean) => void;
}

export default function DigitSpanGame({ level, onComplete, revealMsOverride, random = Math.random, onTimingChange }: DigitSpanGameProps) {
  const config = LEVEL_CONFIG[level];
  const [spanState, setSpanState] = useState({ span: config.digitStart, successes: 0, failures: 0 });
  const [sequence, setSequence] = useState(() => createDigitSequence(config.digitStart, random));
  const [position, setPosition] = useState(0);
  const [digitOn, setDigitOn] = useState(true);

  const [index, setIndex] = useState(0);
  const [revealing, setRevealing] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [maxSpan, setMaxSpan] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useTimedPhase(revealing, onTimingChange);

  const expected = [...sequence].reverse().join('');
  const nextState = nextDigitSpan(spanState, submitted === expected, config.digitMax);
  const isLast = nextState.done || index + 1 >= config.digitMaxTrials;
  const isCorrect = submitted === expected;

  useEffect(() => {
    setRevealing(true);
    setPosition(0);
    setDigitOn(true);
    const timers: number[] = [];
    const cycle = revealMsOverride !== undefined ? revealMsOverride / sequence.length : DIGIT_ON_MS + DIGIT_GAP_MS;
    for (let i = 0; i < sequence.length; i++) {
      timers.push(window.setTimeout(() => { setPosition(i); setDigitOn(true); }, i * cycle));
      timers.push(window.setTimeout(() => setDigitOn(false), i * cycle + cycle * 0.7));
    }
    timers.push(window.setTimeout(() => setRevealing(false), sequence.length * cycle));
    return () => timers.forEach(window.clearTimeout);
  }, [index, revealMsOverride, sequence]);

  useEffect(() => {
    if (!revealing && submitted === null) inputRef.current?.focus();
  }, [revealing, submitted]);

  /** 기억이 안 날 때 넘긴다. 다시 보여 주면 기억 길이를 잴 수 없으므로 틀린 것으로 센다. */
  const pass = () => {
    if (submitted !== null) return;
    setSubmitted('');
  };

  const submit = () => {
    if (answer.length !== sequence.length || submitted !== null) return;
    setSubmitted(answer);
    if (answer === expected) {
      setCorrect((current) => current + 1);
      setMaxSpan((current) => Math.max(current, sequence.length));
    }
  };

  const advance = () => {
    if (isLast) {
      onComplete({ maxSpan, correct, total: index + 1 });
      return;
    }
    setSubmitted(null);
    setRevealing(true);
    setAnswer('');
    setSpanState(nextState);
    setSequence(createDigitSequence(nextState.span, random));
    setIndex((current) => current + 1);
  };

  return (
    <section className="game-card center-card" aria-labelledby="digit-title">
      <p className="eyebrow">도전 {index + 1} / 최대 {config.digitMaxTrials}회 · {sequence.length}자리</p>

      {revealing ? (
        <>
          <h2 id="digit-title">하나씩, 순서대로 기억하세요</h2>
          <div className="digit-sequence" data-testid="digit-stimulus" aria-live="off">{digitOn ? sequence[position] : '·'}</div>
          <p className="game-note">{position + 1} / {sequence.length} · 끝나면 거꾸로 입력</p>
        </>
      ) : (
        <>
          <h2 id="digit-title">거꾸로 입력하세요</h2>
          <label className="sr-only" htmlFor="digit-answer">거꾸로 입력</label>
          <input
            id="digit-answer"
            aria-describedby={submitted === null ? 'digit-input-hint' : undefined}
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
          {submitted === null && <p id="digit-input-hint" className="game-note" role="status">
            {answer.length < sequence.length ? `${sequence.length - answer.length}자리를 더 입력하세요` : '답 제출을 누르세요'}
          </p>}
          {submitted === null ? (
            <div className="digit-actions">
              <button className="primary-button" type="button" disabled={answer.length !== sequence.length} onClick={submit}>
                답 제출
              </button>
              <button className="quiet-button" type="button" onClick={pass}>모르겠어요</button>
            </div>
          ) : (
            <Feedback
              correct={isCorrect}
              answer={expected}
              hint={submitted === '' ? `넘겼어요. ${sequence}를 뒤집으면 ${expected}예요.` : `${sequence}를 뒤집으면 ${expected}예요.`}
              nextLabel={isLast ? completionLabel('digit') : '다음 문제'}
              onNext={advance}
            />
          )}
        </>
      )}
    </section>
  );
}
