import { useEffect, useMemo, useRef, useState } from 'react';
import GuideTab from './components/GuideTab';
import PlayTab from './components/PlayTab';
import Report from './components/Report';
import TabBar from './components/TabBar';
import Transition from './components/Transition';
import SoundToggle from './ui/SoundToggle';
import { DEFAULT_LEVEL, FIRST_STEP, GAME_META, GAME_ORDER, nextStep } from './domain/session';
import { pickStoryIndex, templateOf } from './domain/story';
import type { GameKey, GameResult, Level, SessionDraft, SessionResults, SessionStep, TabKey } from './domain/types';
import DigitSpanGame from './games/DigitSpanGame';
import PatternGame from './games/PatternGame';
import ReactionGame from './games/ReactionGame';
import StoryGame from './games/StoryGame';
import StroopGame from './games/StroopGame';
import VigilanceGame from './games/VigilanceGame';

type Mode = { kind: 'tabs' } | { kind: 'session'; step: SessionStep };
export default function App() {
  const [tab, setTab] = useState<TabKey>('play');
  const [level, setLevel] = useState<Level>(DEFAULT_LEVEL);
  const [mode, setMode] = useState<Mode>({ kind: 'tabs' });
  const [results, setResults] = useState<SessionDraft>({});
  const seenStories = useRef(new Set<number>());
  const lastTemplate = useRef<number | null>(null);
  const nextStory = () => {
    // 저장소를 쓰지 않으므로 재방문 중복은 절대 보장하지 않는다.
    // 방문 중에는 전체 조합을 소진하기 전까지 번호가 겹치지 않는다.
    const entropy = crypto.getRandomValues(new Uint32Array(1))[0];
    const index = pickStoryIndex(entropy * 60_000, seenStories.current, lastTemplate.current);
    seenStories.current.add(index);
    lastTemplate.current = templateOf(index);
    return index;
  };
  const [storySeed, setStorySeed] = useState(nextStory);
  const [leaving, setLeaving] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const startSession = () => {
    setResults({});
    setStorySeed(nextStory());
    setLeaving(false);
    setInterrupted(false);
    setMode({ kind: 'session', step: FIRST_STEP });
  };
  const exitToPlay = () => {
    setResults({});
    setMode({ kind: 'tabs' });
    setTab('play');
  };
  const changeLevel = (next: Level) => {
    if (next === level) return;
    setLevel(next);
    setResults({});
    setStorySeed(nextStory());
  };
  const completeGame = (key: GameKey, result: GameResult) => {
    setResults(current => ({ ...current, [key]: result }) as SessionDraft);
    setMode(current => current.kind === 'session' ? { kind: 'session', step: nextStep(current.step) } : current);
  };
  const doneCount = useMemo(() => {
    let count = 0;
    for (const key of GAME_ORDER) {
      if (results[key] === undefined) break;
      count++;
    }
    return count >= GAME_ORDER.length ? 0 : count;
  }, [results]);
  const renderGame = (key: GameKey) => {
    const done = (value: GameResult) => completeGame(key, value);
    if (key === 'story') return <StoryGame mode="immediate" level={level} seed={storySeed} onComplete={done} />;
    if (key === 'reaction') return <ReactionGame level={level} onComplete={done} />;
    if (key === 'digit') return <DigitSpanGame level={level} onComplete={done} />;
    if (key === 'stroop') return <StroopGame level={level} onComplete={done} />;
    if (key === 'storyDelayed') return <StoryGame mode="delayed" level={level} seed={storySeed} onComplete={done} />;
    if (key === 'pattern') return <PatternGame level={level} onComplete={done} />;
    return <VigilanceGame level={level} onComplete={done} />;
  };
  const immersive = mode.kind === 'session';
  const timedGame = immersive && mode.step.type === 'game';
  // 탭을 벗어난 시간은 반응시간/기억 간격으로 해석하지 않는다.
  useEffect(() => {
    const hidden = () => { if (document.hidden && timedGame) setInterrupted(true); };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, [timedGame]);
  return (
    <div className={`app-shell${immersive ? ' is-immersive' : ''}`}>
      {mode.kind === 'session' && mode.step.type !== 'report' && (
        <header className="app-header">
          <span className="header-progress">{mode.step.index + 1} / 7 · {GAME_META[GAME_ORDER[mode.step.index]].title}</span>
          <span className="header-actions"><SoundToggle />
            <button className="quiet-button" type="button" onClick={() => setLeaving(true)}>그만두기</button>
          </span>
        </header>
      )}
      <main>
        {mode.kind === 'tabs' && tab === 'play' && <PlayTab level={level} doneCount={doneCount}
          onLevelChange={changeLevel} onStartSession={startSession}
          onResumeSession={() => { setLeaving(false); setInterrupted(false); setMode({ kind: 'session', step: { type: 'transition', index: doneCount } }); }} />}
        {mode.kind === 'tabs' && tab === 'guide' && <GuideTab />}
        {immersive && leaving && (
          <div className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="leave-title">
            <h2 id="leave-title">코스를 나갈까요?</h2>
            <p>지금 하던 게임은 다시 시작해요. 끝낸 게임은 이 화면을 새로고침하기 전까지 이어갈 수 있어요.</p>
            <button className="danger-button" type="button" autoFocus onClick={() => { setLeaving(false); setMode({ kind: 'tabs' }); setTab('play'); }}>네, 그만할게요</button>
            <button className="quiet-button" type="button" onClick={() => { setLeaving(false); setAttempt(a => a + 1); }}>계속하기</button>
          </div>
        )}
        {immersive && !leaving && interrupted && (
          <div className="confirm-card" role="alertdialog" aria-labelledby="interrupted-title">
            <h2 id="interrupted-title">화면을 벗어나 코스를 멈췄어요</h2>
            <p>기억하는 시간과 반응 기록의 조건이 달라져요. 새 이야기로 코스를 다시 시작해요.</p>
            <button className="primary-button" onClick={startSession}>새 코스 시작</button>
            <button className="quiet-button" onClick={exitToPlay}>플레이로 돌아가기</button>
          </div>
        )}
        {mode.kind === 'session' && !leaving && !interrupted && mode.step.type === 'transition' &&
          <Transition index={mode.step.index} level={level} onReady={() => setMode({ kind: 'session', step: nextStep(mode.step) })} />}
        {mode.kind === 'session' && !leaving && !interrupted && mode.step.type === 'game' &&
          <div key={`${mode.step.index}-${attempt}`}>{renderGame(GAME_ORDER[mode.step.index])}</div>}
        {mode.kind === 'session' && !leaving && !interrupted && mode.step.type === 'report' &&
          <Report results={results as SessionResults} level={level} onRestart={startSession} onClose={exitToPlay} />}
      </main>
      {!immersive && <TabBar active={tab} onChange={setTab} />}
    </div>
  );
}
