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
      <p className="progress-text">
        {meta.scalesWithLevel ? `${LEVEL_META[level].name} 난이도` : '난이도와 무관'}
      </p>

      <Icon3D name={key} size={72} className="transition-icon" />
      <h1 id="transition-title">{meta.title}</h1>
      <p className="lead">{meta.description}</p>
      <p className="game-note">{meta.looksAt}</p>
      <p className="challenge-label">{gameChallenge(key, level)}</p>
      {key === 'story' && <div className="preparation-note">
        <p>{LEVEL_CONFIG[level].storyReadMs / 1000}초 동안 한 번 읽어요. 앞뒤 퀴즈에서 서로 다른 내용을 각 {LEVEL_CONFIG[level].storyQuestions}문제씩 물어요.</p>
        <p>첫 퀴즈에서는 정답을 보여주지 않아요. 뒤 퀴즈에 힌트가 되지 않도록 선택한 답만 표시해요.</p>
      </div>}
      {(key === 'reaction' || key === 'vigilance') && <p className="game-note">신호 사이와 게임 종료 뒤에는 자동으로 다음 화면으로 넘어가요. 게임 영역 안을 누르거나, 영역에 초점이 있을 때 스페이스 키를 누르세요.</p>}
      <p className="game-note">시간 제한 중 ‘코스 중단’을 누르거나 게임 중 화면을 벗어나면 새 이야기로 다시 시작해요.</p>
      <details className="transition-detail"><summary>과제 원리와 한계</summary>
        <p className="game-basis">{meta.basis}</p><p className="game-note">{meta.limit}</p>
      </details>

      <button className="primary-button" type="button" onClick={onReady}>{key === 'story' ? '이야기 읽기 시작' : '준비됐어요'}</button>
    </section>
  );
}
