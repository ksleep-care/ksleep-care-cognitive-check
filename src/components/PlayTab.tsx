import { GAME_META, GAME_ORDER, LEVELS, LEVEL_META } from '../domain/session';
import type { GameKey, Level } from '../domain/types';

interface PlayTabProps {
  level: Level;
  /** 0이면 시작 전, 1~6이면 중간에 그만둔 상태다. 7이 되는 일은 없다(결과 화면에서 비워진다). */
  doneCount: number;
  onLevelChange: (level: Level) => void;
  onStartSession: () => void;
  onResumeSession: () => void;
  onStartPvt: () => void;
}

/** 게임 7개는 항상 GAME_ORDER 순서로 이어서 하므로, 끝난 것은 언제나 앞에서부터다. */
function stepState(index: number, doneCount: number): 'done' | 'now' | 'todo' {
  if (index < doneCount) return 'done';
  if (index === doneCount) return 'now';
  return 'todo';
}

const STATE_LABEL: Record<'done' | 'now' | 'todo', string> = {
  done: '완료',
  now: '지금 차례',
  todo: '예정',
};

export default function PlayTab({
  level,
  doneCount,
  onLevelChange,
  onStartSession,
  onResumeSession,
  onStartPvt,
}: PlayTabProps) {
  const paused = doneCount > 0;
  const nextKey: GameKey = GAME_ORDER[Math.min(doneCount, GAME_ORDER.length - 1)];
  const levelName = LEVEL_META[level].name;

  return (
    <div className="tab-panel play-panel">
      <p className="app-name">인지 컨디션 체크</p>

      <p className="eyebrow">난이도 · 처음이면 루키</p>

      <div className="level-rows" role="radiogroup" aria-label="난이도">
        {LEVELS.map((value) => {
          const meta = LEVEL_META[value];
          const selected = value === level;
          return (
            <button
              key={value}
              className={`level-row${selected ? ' is-selected' : ''}`}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onLevelChange(value)}
            >
              <span className="level-index">{String(value).padStart(2, '0')}</span>
              <span className="level-name">{meta.name}</span>
              <span className="level-hint">{meta.blurb}</span>
              <span className="sr-only">{selected ? '선택됨' : '선택 안 됨'}</span>
              <span className="level-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {paused && (
        <p className="level-warn">
          난이도를 바꾸면 지금까지 한 {doneCount}개는 사라져요.
        </p>
      )}

      <p className="eyebrow course-eyebrow">
        {levelName} 코스 · {paused ? `게임 ${GAME_ORDER.length}개 중 ${doneCount}개 끝` : `게임 ${GAME_ORDER.length}개`}
      </p>
      <h1 className="course-title">
        {paused ? '이어서 할까요?' : <><span className="accent">5분</span>이면 끝나요</>}
      </h1>

      <ol className="track" aria-label={`${levelName} 코스 진행`}>
        {GAME_ORDER.map((key, index) => {
          const state = stepState(index, doneCount);
          return (
            <li className={`track-step is-${state}`} key={key}>
              <span className="track-rail" aria-hidden="true">
                <span className="track-node" />
              </span>
              <span className="track-name">{GAME_META[key].title}</span>
              <span className="sr-only">{STATE_LABEL[state]}</span>
            </li>
          );
        })}
      </ol>

      <div className="play-spacer" aria-hidden="true" />

      <button
        className="lime-button"
        type="button"
        onClick={paused ? onResumeSession : onStartSession}
      >
        {paused
          ? `${GAME_META[nextKey].title}부터 이어서`
          : `게임 ${GAME_ORDER.length}개 시작 · 5분`}
      </button>

      <button className="pvt-row" type="button" onClick={onStartPvt}>
        <span className="pvt-row-title">3분 집중 측정</span>
        <span className="pvt-row-note">내 기준선 만들기</span>
        <span className="pvt-row-arrow" aria-hidden="true">→</span>
      </button>

      <p className="boundary-line">
        의료 진단이 아니에요 · 로그인이 없고, 켜기 전까지 아무것도 저장하지 않아요
      </p>
    </div>
  );
}
