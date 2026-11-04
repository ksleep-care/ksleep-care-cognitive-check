import Icon3D from '../ui/Icon3D';
import SoundToggle from '../ui/SoundToggle';
import { GAME_META, GAME_ORDER, LEVELS, LEVEL_META, gameChallenge } from '../domain/session';
import { LEVEL_CONFIG } from '../domain/levels';
import type { Level } from '../domain/types';

interface PlayTabProps {
  level: Level; doneCount: number; onLevelChange: (level: Level) => void;
  onStartSession: () => void; onResumeSession: () => void;
}
export default function PlayTab({ level, doneCount, onLevelChange, onStartSession, onResumeSession }: PlayTabProps) {
  const paused = doneCount > 0;
  const config = LEVEL_CONFIG[level];
  return (
    <div className="tab-panel play-panel arcade-panel">
      <div className="app-name-row"><p className="app-name">인지 컨디션 체크</p><SoundToggle /></div>
      <div className="play-intro">
        <div><h1>기억부터 <span className="accent">반응까지.</span></h1>
          <p className="lead">7개의 게임, 한 단계씩 어렵게.</p></div>
      </div>
      <section className="level-picker" aria-label="코스 난이도 선택">
        <div className="section-topline"><h2>오늘의 난이도</h2><span>처음이면 루키</span></div>
        <div className="level-segments" role="radiogroup" aria-label="난이도">
          {LEVELS.map(value => <button type="button" key={value} role="radio"
            aria-checked={value === level} onClick={() => onLevelChange(value)}
            onKeyDown={event => {
              if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
              event.preventDefault();
              const offset = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
              const next = LEVELS[(LEVELS.indexOf(value) + offset + LEVELS.length) % LEVELS.length];
              onLevelChange(next);
              const buttons = event.currentTarget.parentElement?.querySelectorAll('button');
              buttons?.[next - 1]?.focus();
            }}
            tabIndex={value === level ? 0 : -1}
            className={`level-segment${value === level ? ' is-selected' : ''}`}>
            <span className="level-bars" aria-hidden="true">{LEVELS.map(bar => <i key={bar} className={bar <= value ? 'filled' : ''} />)}</span>
            {LEVEL_META[value].name}<span className="sr-only">{value === level ? '선택됨' : '선택 안 됨'}</span>
          </button>)}
        </div>
        <p className="level-description" aria-live="polite">{LEVEL_META[level].blurb}</p>
        <div className="challenge-summary">
          <div><span>앞뒤 퀴즈</span><strong>각 {config.storyQuestions}문제</strong></div>
          <div><span>숫자 도전</span><strong>{config.digitStart}~{config.digitMax}자리</strong></div>
          <div><span>별 잡을 시간</span><strong>{config.vigilanceDeadlineMs / 1000}초</strong></div>
        </div>
        {paused && <p className="level-warn">난이도를 바꾸면 끝낸 {doneCount}개 게임의 기록은 사라져요.</p>}
        <button className="lime-button start-course" type="button" onClick={paused ? onResumeSession : onStartSession}>
          <span>{paused ? `${GAME_META[GAME_ORDER[doneCount]].title}부터 이어서` : '게임 시작'}</span><span aria-hidden="true">→</span>
        </button>
        <p className="start-note">{paused ? '완료한 게임 다음부터 이어가요. 새로고침하면 처음부터 시작해요.' : '7개 게임을 순서대로 진행해요. 먼저 방법을 안내해요.'}</p>
      </section>
      <div className="section-topline game-list-heading"><h2>코스 순서</h2><span>{paused ? `${doneCount} / 7 완료` : `${LEVEL_META[level].name} · 순서대로 진행`}</span></div>
      <ol className="game-library" aria-label={`${LEVEL_META[level].name} 코스 진행`}>
        {GAME_ORDER.map((key, index) => <li key={key} className={`game-tile game-tile-${key}${index < doneCount ? ' is-done' : index === doneCount ? ' is-now' : ''}`}>
          <div className={`game-art art-${key}`} aria-hidden="true"><Icon3D name={key} size={56} /></div>
          <div className="game-tile-copy"><h3>{index + 1}. {GAME_META[key].title}</h3>
            <p><span className="game-state">{index < doneCount ? '완료' : index === doneCount ? '지금 차례' : '예정'}</span> · {gameChallenge(key, level)}</p></div>
          <details className="tile-detail"><summary><span className="sr-only">{GAME_META[key].title} </span>방법 보기</summary><p>{GAME_META[key].description}</p></details>
        </li>)}
      </ol>
      <p className="boundary-line">의료 진단이 아니에요. 로그인과 서버 전송 없이 플레이하며, 게임 답안과 결과를 저장하지 않아요.</p>
    </div>
  );
}
