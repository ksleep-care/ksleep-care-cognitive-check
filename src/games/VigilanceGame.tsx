import { useEffect, useRef, useState } from 'react';
import Burst from '../ui/Burst';
import { play } from '../ui/sound';
import { useAutoAdvance } from '../ui/useAutoAdvance';
import type { VigilanceResult } from '../domain/types';

interface VigilanceGameProps {
  onComplete: (result: VigilanceResult) => void;
  getDelay?: () => number;
  missAfterMs?: number;
}

const TOTAL_TRIALS = 6;

type Phase = 'waiting' | 'visible' | 'feedback';

/** 빛꼬리를 단 별똥별. 머리는 안쪽이 밝은 구슬, 꼬리는 뒤로 갈수록 옅어진다. 방향은 CSS가 정한다. */
function ShootingStar() {
  return (
    <span className="shooting-star" aria-hidden="true">
      <svg width="160" height="60" viewBox="0 0 160 60">
        <defs>
          <linearGradient id="star-tail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFE08A" stopOpacity="0" />
            <stop offset="0.7" stopColor="#FFE08A" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="star-head" cx="0.4" cy="0.35" r="0.65">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.45" stopColor="#FFE08A" />
            <stop offset="1" stopColor="#D9A21B" />
          </radialGradient>
        </defs>
        <path d="M0 32 L128 22 L128 38 Z" fill="url(#star-tail)" />
        <circle cx="104" cy="30" r="2" fill="#FFE08A" opacity="0.7" />
        <circle cx="86" cy="26" r="1.5" fill="#FFE08A" opacity="0.45" />
        <circle cx="132" cy="30" r="14" fill="url(#star-head)" />
        <circle cx="132" cy="30" r="14" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" />
        <path d="M132 16 l3.2 9.6 10 .4-8 6.2 2.8 9.8-8-5.8-8 5.8 2.8-9.8-8-6.2 10-.4z" fill="#FFFFFF" opacity="0.85" />
      </svg>
    </span>
  );
}

/**
 * 짧고 재미있는 별똥별 게임이다. 3분 PVT와 다른 과제이며,
 * 결과는 `게임 기록`으로만 쓰고 연구 참고 비교에 넣지 않는다.
 */
export default function VigilanceGame({
  onComplete,
  getDelay = () => 900 + Math.round(Math.random() * 2200),
  missAfterMs = 3000,
}: VigilanceGameProps) {
  /** 준비 화면은 앞의 안내 화면이 대신한다. 바로 기다리기부터 시작해 클릭 하나를 줄인다. */
  const [phase, setPhase] = useState<Phase>('waiting');
  const [trial, setTrial] = useState(0);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const times = useRef<number[]>([]);
  const misses = useRef(0);
  const shownAt = useRef(0);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const timer = window.setTimeout(() => {
      shownAt.current = performance.now();
      setPhase('visible');
    }, getDelay());
    return () => window.clearTimeout(timer);
  }, [getDelay, phase]);

  useEffect(() => {
    if (phase !== 'visible') return;
    const timer = window.setTimeout(() => {
      misses.current += 1;
      setLastMs(null);
      setPhase('feedback');
      play('miss');
    }, missAfterMs);
    return () => window.clearTimeout(timer);
  }, [missAfterMs, phase]);

  const hit = () => {
    const elapsed = Math.max(0, Math.round(performance.now() - shownAt.current));
    times.current.push(elapsed);
    setLastMs(elapsed);
    setPhase('feedback');
    play('hit');
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
        misses: misses.current,
      });
      return;
    }
    setTrial(done);
    setPhase('waiting');
  };

  /** 결과를 1200ms 보여준 뒤 알아서 다음 문제로 간다. 누를 버튼은 없다. 볼 것이 숫자 하나뿐이다. */
  useAutoAdvance(phase === 'feedback', 1200, advanceNow);

  return (
    <section className="game-card center-card night-stage" aria-live="polite">
      <p className="eyebrow">{trial + 1} / {TOTAL_TRIALS}</p>

      {phase === 'waiting' && (
        <div className="vigilance-stage">
          <p className="game-note">별을 기다리는 중…</p>
        </div>
      )}

      {phase === 'visible' && (
        // 별똥별은 3초 동안 대각선으로 흘러가며 사라진다. 움직이는 별을 쫓지 않아도 되게 판 전체를 누르는 영역으로 둔다.
        <button className="vigilance-stage is-live" type="button" aria-label="별똥별 잡기" onClick={hit}>
          <ShootingStar />
        </button>
      )}

      {phase === 'feedback' && (
        <div className={`vigilance-stage is-feedback ${lastMs === null ? 'is-miss' : 'is-hit'}`}>
          {lastMs !== null && <Burst trigger={trial} colors={['#FFE08A', '#FFB27A', '#C6F26A']} />}
          <p className="reaction-readout">{lastMs === null ? '놓쳤어요' : `${lastMs}ms`}</p>
          <div className="feedback-timer feedback-timer-long" aria-hidden="true">
            <span className="feedback-timer-fill" />
          </div>
        </div>
      )}
    </section>
  );
}
