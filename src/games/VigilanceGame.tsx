import type { CSSProperties } from 'react';
import Burst from '../ui/Burst';
import { LEVEL_CONFIG } from '../domain/levels';
import type { Level, VigilanceResult } from '../domain/types';
import { useSignalGame } from './useSignalGame';
interface VigilanceGameProps { level?: Level; onComplete: (result: VigilanceResult) => void; getDelay?: () => number; missAfterMs?: number }
export default function VigilanceGame({ level = 1, onComplete, getDelay, missAfterMs }: VigilanceGameProps) {
  const config = LEVEL_CONFIG[level];
  const deadline = missAfterMs ?? config.vigilanceDeadlineMs;
  const game = useSignalGame({ total: config.vigilanceTrials, waitMaxMs: config.vigilanceWaitMaxMs,
    deadlineMs: deadline, onComplete, getDelay });
  return (
    <section className="game-card center-card signal-game" aria-labelledby="vigilance-title">
      <div className="game-topline"><p className="eyebrow">{game.trial + 1} / {config.vigilanceTrials}</p><span>잡은 별 {game.hits}개</span></div>
      <h2 id="vigilance-title">{game.phase === 'waiting' ? '다음 별은 언제 올까요?' : game.phase === 'visible' ? '별을 잡아요!' : game.outcome === 'hit' ? '궤도에 담았어요' : game.outcome === 'early' ? '아직 별이 오지 않았어요' : '별이 지나갔어요'}</h2>
      <button className={`vigilance-stage cosmos-stage is-${game.phase} outcome-${game.outcome}`} type="button"
        aria-label={game.phase === 'visible' ? '별똥별 잡기' : game.phase === 'waiting' ? '별을 기다리는 중' : '포획 결과'}
        style={{ '--flight-ms': `${deadline}ms` } as CSSProperties} autoFocus
        onPointerDown={event => { if (event.button === 0) { event.preventDefault(); game.press(); } }}
        onClick={event => { if (event.detail === 0) game.press(); }}
        onKeyDown={event => { if (!event.repeat && (event.key === ' ' || event.key === 'Enter')) { event.preventDefault(); game.press(); } }}>
        <span className="cosmos-stars" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 19 + 7) % 84}%` }} />)}</span>
        <span className="cosmos-planet" aria-hidden="true"><i /></span>
        <span className="capture-orbit" aria-hidden="true" />
        {game.phase === 'visible' && <span className="comet-3d" aria-hidden="true"><i /><b /></span>}
        {game.phase === 'waiting' && <span className="stage-instruction">별이 보이면 화면 어디든 톡</span>}
        {game.phase === 'feedback' && <span className="signal-result" role="status">
          {game.outcome === 'hit' && <Burst trigger={game.trial} />}
          <strong>{game.lastMs !== null ? `${game.lastMs}ms` : game.outcome === 'early' ? '너무 이른 누름' : '놓침'}</strong>
          <span>{game.outcome === 'hit' ? '별 하나를 잡았어요' : '다음 별을 기다려요'}</span>
        </span>}
      </button>
      <p className="game-note">별을 따라 누를 필요는 없어요. 별이 없는 동안은 기다려요.</p>
    </section>
  );
}
