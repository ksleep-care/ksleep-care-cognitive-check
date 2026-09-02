import Icon3D from '../ui/Icon3D';
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
      </div>
      <p className="progress-text">
        {meta.scalesWithLevel ? `${LEVEL_META[level].name} 난이도` : '난이도와 무관'}
      </p>

      <Icon3D name={key} size={72} className="transition-icon" />
      <h1 id="transition-title">{meta.title}</h1>
      <p className="lead">{meta.description}</p>
      <p className="game-note">{meta.looksAt}</p>
      <p className="game-basis">{meta.basis}</p>

      <button className="primary-button" type="button" onClick={onReady}>준비됐어요</button>
    </section>
  );
}
