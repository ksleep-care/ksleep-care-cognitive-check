import { GAME_META, GAME_ORDER } from '../domain/session';

interface TransitionProps {
  index: number;
  onReady: () => void;
}

export default function Transition({ index, onReady }: TransitionProps) {
  const key = GAME_ORDER[index];
  const meta = GAME_META[key];

  return (
    <section className="transition-card" aria-labelledby="transition-title">
      <p className="progress-text">{index + 1} / {GAME_ORDER.length}</p>
      <div className="transition-icon" aria-hidden="true">{meta.icon}</div>
      <h1 id="transition-title">{meta.title}</h1>
      <p>{meta.description}</p>
      <button className="primary-button" type="button" onClick={onReady}>준비됐어요</button>
    </section>
  );
}
