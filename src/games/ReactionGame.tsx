import { useEffect, useRef, useState } from 'react';
import { useAutoAdvance } from '../ui/useAutoAdvance';
import type { ReactionResult } from '../domain/types';

interface ReactionGameProps {
  onComplete: (result: ReactionResult) => void;
  getDelay?: () => number;
}

const TOTAL_TRIALS = 6;
/** 이 시간 안에 눌리면 보고 누른 것이 아니라고 본다. */
const MIN_VALID_MS = 100;

type Phase = 'waiting' | 'visible' | 'feedback';

export default function ReactionGame({
  onComplete,
  getDelay = () => 700 + Math.round(Math.random() * 1500),
}: ReactionGameProps) {
  /** 준비 화면은 앞의 안내 화면이 대신한다. 바로 기다리기부터 시작해 클릭 하나를 줄인다. */
  const [phase, setPhase] = useState<Phase>('waiting');
  const [trial, setTrial] = useState(0);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [early, setEarly] = useState(false);
  const times = useRef<number[]>([]);
  const earlyPresses = useRef(0);
  const shownAt = useRef(0);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const timer = window.setTimeout(() => {
      shownAt.current = performance.now();
      setPhase('visible');
    }, getDelay());
    return () => window.clearTimeout(timer);
  }, [getDelay, phase]);

  const pressEarly = () => {
    if (phase !== 'waiting') return;
    earlyPresses.current += 1;
    setEarly(true);
    setLastMs(null);
    setPhase('feedback');
  };

  const hit = () => {
    const elapsed = Math.round(performance.now() - shownAt.current);
    if (elapsed < MIN_VALID_MS) {
      earlyPresses.current += 1;
      setEarly(true);
      setLastMs(null);
    } else {
      times.current.push(elapsed);
      setEarly(false);
      setLastMs(elapsed);
    }
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
        earlyPresses: earlyPresses.current,
      });
      return;
    }
    setTrial(done);
    setPhase('waiting');
  };

  /** 결과를 1200ms 보여준 뒤 알아서 다음 문제로 간다. 손으로 눌러도 한 번만 넘어간다. */
  const advance = useAutoAdvance(phase === 'feedback', 1200, advanceNow);

  return (
    <section className="game-card center-card" aria-live="polite">
      <p className="eyebrow">{trial + 1} / {TOTAL_TRIALS}</p>

      {phase === 'waiting' && (
        <button className="reaction-stage is-waiting" type="button" aria-label="아직 기다리세요" onClick={pressEarly}>
          <span>기다려 주세요…</span>
        </button>
      )}

      {phase === 'visible' && (
        <div className="reaction-stage is-live">
          <button className="reaction-target" type="button" aria-label="지금 누르기" onClick={hit} />
        </div>
      )}

      {phase === 'feedback' && (
        <div className={`reaction-stage is-feedback ${early ? 'is-early' : 'is-hit'}`}>
          <p className="reaction-readout">
            {early ? '너무 일찍 눌렀어요' : `${lastMs}ms`}
          </p>
          <button className="primary-button" type="button" autoFocus onClick={advance}>
            {trial + 1 >= TOTAL_TRIALS ? '결과 보기' : '다음'}
          </button>
          <div className="feedback-timer feedback-timer-long" aria-hidden="true">
            <span className="feedback-timer-fill" />
          </div>
        </div>
      )}
    </section>
  );
}
