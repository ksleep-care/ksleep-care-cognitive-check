import { useState } from 'react';
import Intro from './components/Intro';
import Report from './components/Report';
import Transition from './components/Transition';
import { GAME_META, GAME_ORDER, nextStep } from './domain/session';
import type { GameKey, GameResult, SessionDraft, SessionResults, SessionStep } from './domain/types';
import DigitSpanGame from './games/DigitSpanGame';
import PatternGame from './games/PatternGame';
import ReactionGame from './games/ReactionGame';
import StoryGame from './games/StoryGame';
import StroopGame from './games/StroopGame';
import VigilanceGame from './games/VigilanceGame';

export default function App() {
  const [step, setStep] = useState<SessionStep>({ type: 'intro' });
  const [results, setResults] = useState<SessionDraft>({});

  const reset = () => {
    setResults({});
    setStep({ type: 'intro' });
  };

  const completeGame = (key: GameKey, result: GameResult) => {
    setResults((current) => ({ ...current, [key]: result }) as SessionDraft);
    setStep((current) => nextStep(current));
  };

  const confirmReset = () => {
    if (window.confirm('현재 진행 내용이 사라져요. 처음으로 돌아갈까요?')) reset();
  };

  const renderGame = (key: GameKey) => {
    if (key === 'story') return <StoryGame mode="immediate" onComplete={(value) => completeGame(key, value)} />;
    if (key === 'reaction') return <ReactionGame onComplete={(value) => completeGame(key, value)} />;
    if (key === 'digit') return <DigitSpanGame onComplete={(value) => completeGame(key, value)} />;
    if (key === 'stroop') return <StroopGame onComplete={(value) => completeGame(key, value)} />;
    if (key === 'storyDelayed') return <StoryGame mode="delayed" onComplete={(value) => completeGame(key, value)} />;
    if (key === 'pattern') return <PatternGame onComplete={(value) => completeGame(key, value)} />;
    return <VigilanceGame onComplete={(value) => completeGame(key, value)} />;
  };

  return (
    <div className="app-shell">
      {step.type !== 'intro' && step.type !== 'report' && (
        <header className="app-header">
          <div>
            <span className="header-brand">K-Sleep Care</span>
            <span className="header-progress">
              {step.index + 1} / {GAME_ORDER.length} · {GAME_META[GAME_ORDER[step.index]].title}
            </span>
          </div>
          <button className="quiet-button" type="button" onClick={confirmReset}>처음으로</button>
        </header>
      )}

      <main aria-live="polite">
        {step.type === 'intro' && <Intro onStart={() => setStep(nextStep(step))} />}
        {step.type === 'transition' && <Transition index={step.index} onReady={() => setStep(nextStep(step))} />}
        {step.type === 'game' && renderGame(GAME_ORDER[step.index])}
        {step.type === 'report' && <Report results={results as SessionResults} onRestart={reset} />}
      </main>
    </div>
  );
}
