import { GAME_META, GAME_ORDER, LEVEL_META } from '../domain/session';
import type { Level } from '../domain/types';

interface TransitionProps {
  index: number;
  level: Level;
  onReady: () => void;
}

export default function Transition({ index, level, onReady }: TransitionProps) {
  const key = GAME_ORDER[index];
  const meta = GAME_META[key];
  const percent = Math.round((index / GAME_ORDER.length) * 100);

  return (
    <section className="transition-card" aria-labelledby="transition-title">
      <div className="progress-track" role="img" aria-label={`${GAME_ORDER.length}개 중 ${index + 1}번째`}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
        <span className="progress-orb" style={{ left: `${percent}%` }} aria-hidden="true" />
      </div>
      <p className="progress-text">
        {index + 1} / {GAME_ORDER.length}
        {meta.scalesWithLevel && ` · ${LEVEL_META[level].icon} ${LEVEL_META[level].name}`}
      </p>

      <div className="transition-icon" aria-hidden="true">{meta.icon}</div>
      <h1 id="transition-title">{meta.title}</h1>
      <p className="lead">{meta.description}</p>
      <p className="game-note">{meta.looksAt}</p>

      <button className="primary-button" type="button" onClick={onReady}>준비됐어요</button>
    </section>
  );
}
