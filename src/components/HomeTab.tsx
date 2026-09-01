import { BASELINE_MIN_ENTRIES } from '../domain/baseline';
import { GAME_ORDER } from '../domain/session';

interface HomeTabProps {
  /** 저장에 동의했고 지금까지 쌓인 유효 측정 횟수. 동의 전이면 null. */
  baselineCount: number | null;
  onStartPvt: () => void;
  onStartSession: () => void;
  onOpenGuide: () => void;
}

export default function HomeTab({
  baselineCount,
  onStartPvt,
  onStartSession,
  onOpenGuide,
}: HomeTabProps) {
  const building = baselineCount !== null && baselineCount < BASELINE_MIN_ENTRIES;

  return (
    <div className="tab-panel">
      <header className="app-hero">
        <span className="brand-mark" aria-hidden="true">K</span>
        <div>
          <p className="eyebrow">K-Sleep Care</p>
          <h1>인지 컨디션 체크</h1>
        </div>
      </header>

      <section className="hero-card" aria-labelledby="today-title">
        <p className="eyebrow">오늘 할 한 가지</p>
        <h2 id="today-title">3분 집중 측정</h2>
        <p className="lead">
          숫자가 뜨면 바로 누르는 것만 3분 하면 돼요. 같은 방식으로 반복하면
          내 값이 어떻게 달라지는지 볼 수 있어요.
        </p>

        {baselineCount === null && (
          <p className="hero-status">기록 저장은 꺼져 있어요. 측정 뒤에 켤지 물어볼게요.</p>
        )}
        {building && (
          <p className="hero-status">
            기준 만드는 중 <strong>{baselineCount} / {BASELINE_MIN_ENTRIES}</strong>
          </p>
        )}
        {baselineCount !== null && !building && (
          <p className="hero-status">
            기준 준비됨 · 지금까지 <strong>{baselineCount}번</strong> 측정했어요
          </p>
        )}

        <button className="primary-button hero-cta" type="button" onClick={onStartPvt}>
          3분 측정 시작
        </button>
      </section>

      <section className="side-card" aria-labelledby="warmup-title">
        <h2 id="warmup-title">게임 {GAME_ORDER.length}개로 워밍업</h2>
        <p>기억·숫자·색깔·패턴·반응까지 한 판. 약 5분 걸려요.</p>
        <button className="ghost-button" type="button" onClick={onStartSession}>
          플레이 열기
        </button>
      </section>

      <div className="notice-box">
        <p>ℹ️ 의료 진단이 아니에요. 오늘의 컨디션을 스스로 돌아보는 용도예요.</p>
        <p>🔒 로그인이 없고, 켜기 전까지 아무것도 저장하지 않아요.</p>
      </div>

      <button className="link-button" type="button" onClick={onOpenGuide}>
        각 게임이 무엇을 보는지 알아보기
      </button>
    </div>
  );
}
