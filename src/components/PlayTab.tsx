import { GAME_META, GAME_ORDER, LEVELS, LEVEL_META } from '../domain/session';
import type { Level } from '../domain/types';

interface PlayTabProps {
  level: Level;
  onLevelChange: (level: Level) => void;
  onStartSession: () => void;
  onStartPvt: () => void;
}

export default function PlayTab({ level, onLevelChange, onStartSession, onStartPvt }: PlayTabProps) {
  return (
    <div className="tab-panel">
      <h1 className="panel-title">플레이</h1>

      <section aria-labelledby="level-title">
        <h2 id="level-title" className="section-title">난이도 선택</h2>
        <div className="level-grid" role="radiogroup" aria-labelledby="level-title">
          {LEVELS.map((value) => {
            const meta = LEVEL_META[value];
            const selected = value === level;
            return (
              <button
                key={value}
                className={`level-tile tilt${selected ? ' is-selected' : ''}`}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onLevelChange(value)}
              >
                <span className="level-icon" aria-hidden="true">{meta.icon}</span>
                <span className="level-rank">Lv.{value}</span>
                <span className="level-name">{meta.name}</span>
                <span className="level-blurb">{meta.blurb}</span>
                {selected && <span className="level-check" aria-hidden="true">선택됨</span>}
              </button>
            );
          })}
        </div>
        <p className="section-note">
          난이도는 기억·숫자·색깔·패턴 게임의 문제 수와 길이만 바꿔요.
          아래 3분 집중 측정은 난이도와 무관하게 항상 똑같이 진행돼요.
        </p>
      </section>

      <section className="play-card" aria-labelledby="session-title">
        <p className="eyebrow">약 5분 · {LEVEL_META[level].icon} {LEVEL_META[level].name}</p>
        <h2 id="session-title">게임 {GAME_ORDER.length}개 한 판</h2>
        <ol className="game-line">
          {GAME_ORDER.map((key) => (
            <li key={key}>
              <span aria-hidden="true">{GAME_META[key].icon}</span>
              <span>{GAME_META[key].title}</span>
            </li>
          ))}
        </ol>
        <button className="primary-button" type="button" onClick={onStartSession}>
          시작하기
        </button>
      </section>

      <section className="play-card play-card-measure" aria-labelledby="pvt-title">
        <p className="eyebrow">3분 · 난이도 없음</p>
        <h2 id="pvt-title">3분 집중 측정</h2>
        <p>
          연구에서 쓰는 방식을 그대로 옮긴 단순한 과제예요. 매번 똑같은 조건이라
          내 기준선을 만들 수 있는 건 이것뿐이에요.
        </p>
        <button className="primary-button" type="button" onClick={onStartPvt}>
          측정 시작
        </button>
      </section>
    </div>
  );
}
