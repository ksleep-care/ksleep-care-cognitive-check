import { useEffect, useRef, useState } from 'react';
import { PVT_PRACTICE_TRIALS, PVT_SCORED_DURATION_MS, type PvtTrial } from '../domain/pvt';
import { PvtEngine, type PvtEngineView } from '../domain/pvtEngine';
import SoundToggle from '../ui/SoundToggle';
import { play } from '../ui/sound';

/**
 * 3분 PVT-B 측정 화면.
 *
 * 이 화면에는 tilt, particle, parallax, spring 이동, 움직이는 배경을 넣지 않는다.
 * 타깃의 위치·크기·표시 방식이 매번 같아야 반응시간이 오염되지 않는다.
 * 경과 숫자와 진행 바는 React 상태가 아니라 DOM에 직접 써서
 * 측정 중 재렌더링이 타이밍을 흔들지 않게 한다.
 */
interface PvtTaskProps {
  onFinish: (trials: PvtTrial[], context: { tabHidden: boolean }) => void;
  onCancel: () => void;
  scoredDurationMs?: number;
  practiceTrials?: number;
}

export default function PvtTask({
  onFinish,
  onCancel,
  scoredDurationMs = PVT_SCORED_DURATION_MS,
  practiceTrials = PVT_PRACTICE_TRIALS,
}: PvtTaskProps) {
  const [view, setView] = useState<PvtEngineView>({ live: false, message: '', phase: 'idle' });
  const counterRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PvtEngine | null>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  if (engineRef.current === null) {
    engineRef.current = new PvtEngine(
      {
        onView: setView,
        onFinish: (trials, context) => finishRef.current(trials, context),
      },
      { scoredDurationMs, practiceTrials },
    );
  }
  const engine = engineRef.current;

  useEffect(() => () => engine.stop(), [engine]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) engine.markHidden();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [engine]);

  /** 화면 갱신은 여기서만 한다. React 상태를 건드리지 않으므로 재렌더링이 없다. */
  useEffect(() => {
    if (view.phase !== 'practice' && view.phase !== 'scored') return;
    let frame = 0;
    const paint = () => {
      if (counterRef.current && view.live) {
        counterRef.current.textContent = String(engine.elapsedSinceStimulus());
      }
      if (progressRef.current) {
        progressRef.current.style.width = `${(engine.progress() * 100).toFixed(1)}%`;
      }
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [engine, view.live, view.phase]);

  const stop = () => {
    engine.stop();
    onCancel();
  };

  if (view.phase === 'idle') {
    return (
      <section className="pvt-screen pvt-brief" aria-labelledby="pvt-brief-title">
        <p className="eyebrow">3분 집중 측정</p>
        <h1 id="pvt-brief-title">빈 화면에 숫자가 튀어나오면 바로 누르세요</h1>
        <p className="pvt-why">
          <strong>왜 하나요</strong> · 이 측정은 정신운동 각성 검사(PVT)의 3분 판 형식이에요.
          잠이 부족하거나 피로하면 반응이 느려지고 놓치는 순간이 늘어나는데, 그 변화를 가장 민감하게
          잡아내는 과제라 수면 연구와 우주비행사 피로 연구에서 표준처럼 써 왔어요.
          몇 번 해도 익숙해져서 잘해지는 효과가 거의 없어서, 반복하며 내 변화를 보기에 알맞아요.
        </p>
        <ol className="pvt-rules">
          <li>가운데 네모는 평소에 <strong>비어 있어요</strong>. 갑자기 숫자가 나타나 올라가기 시작하면 한 번 누릅니다.</li>
          <li>누르면 방금 반응시간이 1초 동안 회색으로 보였다가 사라져요. 그 숫자는 누르는 대상이 아니에요.</li>
          <li>숫자가 나오기 전에 누르면 <strong>너무 이른 누름</strong>으로 남아요.</li>
          <li>연습 {practiceTrials}번 뒤에 3분을 잽니다. 연습은 점수에 안 들어가요.</li>
          <li>측정 중에 다른 창으로 넘어가면 그 측정은 못 써요.</li>
        </ol>
        <p className="pvt-note">
          의료 검사가 아니에요. 같은 기기·같은 브라우저에서 반복할 때
          내 값이 어떻게 달라지는지 보는 용도예요.
        </p>
        <button className="primary-button" type="button" onClick={() => engine.startPractice()}>
          연습 시작
        </button>
        <button className="quiet-button" type="button" onClick={stop}>그만두기</button>
      </section>
    );
  }

  if (view.phase === 'bridge') {
    return (
      <section className="pvt-screen pvt-brief" aria-labelledby="pvt-bridge-title">
        <p className="eyebrow">연습 끝</p>
        <h1 id="pvt-bridge-title">이제 3분을 잽니다</h1>
        <p className="pvt-note">준비되면 시작하세요. 중간에 멈추면 그 측정은 저장되지 않아요.</p>
        <button className="primary-button" type="button" onClick={() => engine.startScored()}>
          3분 측정 시작
        </button>
        <button className="quiet-button" type="button" onClick={stop}>그만두기</button>
      </section>
    );
  }

  if (view.phase === 'done') {
    return (
      <section className="pvt-screen pvt-brief" aria-live="polite">
        <h1>측정이 끝났어요</h1>
        <p className="pvt-note">결과를 정리하고 있어요…</p>
      </section>
    );
  }

  return (
    <section className="pvt-screen pvt-measure" aria-label="3분 집중 측정 진행 중">
      <div className="pvt-topline">
        <span className="pvt-phase">{view.phase === 'practice' ? '연습' : '측정 중'}</span>
        <span className="header-actions">
          <SoundToggle />
          <button className="quiet-button" type="button" onClick={stop}>그만두기</button>
        </span>
      </div>

      <div className="pvt-progress" aria-hidden="true">
        <div className="pvt-progress-fill" ref={progressRef} />
      </div>

      <button
        className={`pvt-field${view.live ? ' is-live' : ''}`}
        type="button"
        aria-label="자극이 보이면 누르기"
        onClick={() => {
          // 기록을 먼저 남기고 나서 소리를 낸다. 소리는 누른 뒤의 확인일 뿐 자극이 아니다.
          const wasLive = view.live;
          engine.press();
          play(wasLive ? 'hit' : 'early');
        }}
      >
        <span className="pvt-counter">
          {view.live
            ? <span ref={counterRef}>0</span>
            : <span className="pvt-counter-idle">{view.message || '·'}</span>}
        </span>
      </button>

      <p className="pvt-hint" aria-live="polite">
        {view.live ? '지금 누르세요' : '빈 화면을 보며 기다리세요'}
      </p>
    </section>
  );
}
