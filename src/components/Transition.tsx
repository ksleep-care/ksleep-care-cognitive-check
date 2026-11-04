import Icon3D from '../ui/Icon3D';
import { GAME_META, GAME_ORDER, LEVEL_META, gameChallenge } from '../domain/session';
import type { Level } from '../domain/types';
import { LEVEL_CONFIG } from '../domain/levels';

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

      <Icon3D name={key} size={72} className="transition-icon" />
      <h1 id="transition-title">{meta.title}</h1>
      <p className="lead">{meta.description}</p>
      <p className="challenge-label">{gameChallenge(key, level)} · {meta.scalesWithLevel ? `${LEVEL_META[level].name} 난이도` : '난이도와 무관'}</p>
      {key === 'story' && <p className="preparation-note">
        {LEVEL_CONFIG[level].storyReadMs / 1000}초 동안 한 번 읽어요. 앞뒤 각 {LEVEL_CONFIG[level].storyQuestions}문제이고, 첫 퀴즈에서는 정답을 보여주지 않아요.
      </p>}
      {(key === 'reaction' || key === 'vigilance') && <p className="game-note">화면이나 스페이스 키를 눌러요. 자동으로 넘어가요.</p>}
      {/* 자세한 설명은 접어 둔다. 내용은 줄이지 않고 위치만 옮겼다. */}
      <details className="transition-detail"><summary>자세히 보기</summary>
        <p className="game-note">{meta.looksAt}</p>
        {key === 'story' && <p className="game-note">뒤 퀴즈에 힌트가 되지 않도록 첫 퀴즈에서는 고른 답만 표시해요.</p>}
        <p className="game-note">시간 제한 중 ‘코스 중단’을 누르거나 게임 중 화면을 벗어나면 새 이야기로 다시 시작해요.</p>
        <p className="game-basis">{meta.basis}</p><p className="game-note">{meta.limit}</p>
      </details>

      <button className="primary-button" type="button" onClick={onReady}>{key === 'story' ? '이야기 읽기 시작' : '준비됐어요'}</button>
    </section>
  );
}
