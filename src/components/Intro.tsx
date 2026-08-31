import { GAME_META, GAME_ORDER } from '../domain/session';

interface IntroProps {
  onStart: () => void;
}

export default function Intro({ onStart }: IntroProps) {
  return (
    <section className="intro-card" aria-labelledby="intro-title">
      <div className="brand-mark" aria-hidden="true">K</div>
      <p className="eyebrow">K-Sleep Care</p>
      <h1 id="intro-title">인지 컨디션 체크</h1>
      <p className="lead">7개의 짧은 활동으로 오늘의 기억·집중·반응 상태를 가볍게 확인해 보세요.</p>

      <ul className="activity-list" aria-label="7개 활동 목록">
        {GAME_ORDER.map((key, index) => (
          <li key={key}>
            <span className="activity-number">{index + 1}</span>
            <span aria-hidden="true">{GAME_META[key].icon}</span>
            <span>{GAME_META[key].title}</span>
          </li>
        ))}
      </ul>

      <div className="notice-box">
        <p>🔒 로그인하지 않으며, 결과는 이 화면에서만 확인할 수 있어요.</p>
        <p>ℹ️ 의료 진단이 아닌 오늘의 컨디션 참고용이에요.</p>
      </div>

      <button className="primary-button" type="button" onClick={onStart}>검사 시작</button>
    </section>
  );
}
