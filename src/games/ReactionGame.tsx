import Burst from '../ui/Burst';
import { LEVEL_CONFIG } from '../domain/levels';
import type { Level, ReactionResult } from '../domain/types';
import { useSignalGame } from './useSignalGame';

interface ReactionGameProps { level?: Level; onComplete: (result: ReactionResult) => void; getDelay?: () => number }
export default function ReactionGame({ level = 1, onComplete, getDelay }: ReactionGameProps) {
  const config = LEVEL_CONFIG[level];
  const game = useSignalGame({ total: config.reactionTrials, waitMaxMs: config.reactionWaitMaxMs,
    deadlineMs: config.reactionDeadlineMs, onComplete, getDelay });
  const label = game.phase === 'waiting' ? '아직 기다리세요' : game.phase === 'visible' ? '지금 누르기' : '반응 결과';
  return (
    <section className="game-card center-card signal-game" aria-labelledby="reaction-title">
      <div className="game-topline"><p className="eyebrow">{game.trial + 1} / {config.reactionTrials}</p><span>출발 신호</span></div>
      <h2 id="reaction-title">{game.phase === 'waiting' ? '불이 켜지면 출발!' : game.phase === 'visible' ? '지금!' : game.outcome === 'hit' ? '출발 성공' : game.outcome === 'early' ? '신호보다 빨랐어요' : '신호를 놓쳤어요'}</h2>
      <button className={`reaction-stage launch-stage is-${game.phase} outcome-${game.outcome}`}
        aria-label={label} type="button" autoFocus
        onPointerDown={event => { if (event.button === 0) { event.preventDefault(); game.press(); } }}
        onClick={event => { if (event.detail === 0) game.press(); }}
        onKeyDown={event => { if (!event.repeat && (event.key === ' ' || event.key === 'Enter')) { event.preventDefault(); game.press(); } }}>
        <span className="launch-lanes" aria-hidden="true"><i /><i /><i /></span>
        <span className={`signal-lamp ${game.phase === 'visible' ? 'is-on' : ''}`} aria-hidden="true" />
        <span className="launch-craft" aria-hidden="true"><i /><b /></span>
        {game.phase === 'waiting' && <span className="stage-instruction">손가락을 준비하세요</span>}
        {game.phase === 'visible' && <span className="stage-instruction">지금 누르세요</span>}
        {game.phase === 'feedback' && <span className="signal-result" role="status">
          {game.outcome === 'hit' && <Burst trigger={game.trial} />}
          <strong>{game.lastMs !== null ? `${game.lastMs}ms` : game.outcome === 'early' ? '너무 이른 누름' : '놓침'}</strong>
          <span>{game.outcome === 'hit' ? '신호를 보고 반응했어요' : '다음 신호를 기다려요'}</span>
        </span>}
      </button>
      <p className="game-note">신호 전에 누르면 기록하지 않아요.</p>
    </section>
  );
}
