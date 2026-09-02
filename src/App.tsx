import { useCallback, useMemo, useRef, useState } from 'react';
import GuideTab from './components/GuideTab';
import PlayTab from './components/PlayTab';
import PvtReport from './components/PvtReport';
import Report from './components/Report';
import TabBar from './components/TabBar';
import TrendTab from './components/TrendTab';
import Transition from './components/Transition';
import SoundToggle from './ui/SoundToggle';
import {
  appendResult,
  clearBaseline,
  compareToBaseline,
  enableBaseline,
  readBaseline,
  type BaselineComparison,
  type BaselineStore,
} from './domain/baseline';
import {
  PVT_PROTOCOL_VERSION,
  assessQuality,
  calculatePvtMetrics,
  type PvtMetrics,
  type PvtQuality,
  type PvtTrial,
} from './domain/pvt';
import { DEFAULT_LEVEL, FIRST_STEP, GAME_META, GAME_ORDER, nextStep } from './domain/session';
import { pickStoryIndex, templateOf } from './domain/story';
import type {
  GameKey,
  GameResult,
  Level,
  SessionDraft,
  SessionResults,
  SessionStep,
  TabKey,
} from './domain/types';
import DigitSpanGame from './games/DigitSpanGame';
import PatternGame from './games/PatternGame';
import PvtTask from './games/PvtTask';
import ReactionGame from './games/ReactionGame';
import StoryGame from './games/StoryGame';
import StroopGame from './games/StroopGame';
import VigilanceGame from './games/VigilanceGame';

type Mode =
  | { kind: 'tabs' }
  | { kind: 'session'; step: SessionStep }
  | { kind: 'pvt' }
  | {
      kind: 'pvtReport';
      metrics: PvtMetrics;
      quality: PvtQuality;
      /** 이번 결과를 넣기 **전**의 기록과 비교한 값. 자기 자신을 기준선에 섞지 않는다. */
      comparison: BaselineComparison;
      /** 이번 결과까지 포함한 저장 횟수. 화면 counter 전용이며 비교 계산에는 쓰지 않는다. */
      savedCount: number;
    };

/** 지금 저장돼 있는 같은 프로토콜의 유효 측정 횟수. `나의 변화` 탭과 같은 숫자를 쓴다. */
function countSaved(storage: Storage | null): number {
  if (storage === null) return 0;
  const store = readBaseline(storage);
  if (store === null) return 0;
  return store.entries.filter((entry) => entry.protocol === PVT_PROTOCOL_VERSION).length;
}

/** 저장소 접근은 여기 한 곳으로만 한다. 접근 자체가 막힌 브라우저도 있다. */
function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function App() {
  const [tab, setTab] = useState<TabKey>('play');
  const [level, setLevel] = useState<Level>(DEFAULT_LEVEL);
  const [mode, setMode] = useState<Mode>({ kind: 'tabs' });
  const [results, setResults] = useState<SessionDraft>({});
  /**
   * 이야기 번호. 판을 새로 시작할 때만 바뀌므로 바로 맞추기와 다시 퀴즈가 같은 이야기를 쓴다.
   * 번호는 시각으로 정해져 새로고침해도 겹치지 않고, 이번 방문에서 쓴 번호는 따로 기억해 연달아 시작해도 겹치지 않는다.
   */
  const seenStories = useRef<Set<number>>(new Set());
  const lastTemplate = useRef<number | null>(null);
  const nextStory = () => {
    const index = pickStoryIndex(Date.now(), seenStories.current, lastTemplate.current);
    seenStories.current.add(index);
    lastTemplate.current = templateOf(index);
    return index;
  };
  const [storySeed, setStorySeed] = useState(nextStory);
  const [leaving, setLeaving] = useState(false);
  const [store, setStore] = useState<BaselineStore | null>(() => {
    const storage = safeStorage();
    return storage === null ? null : readBaseline(storage);
  });

  const refreshStore = useCallback(() => {
    const storage = safeStorage();
    setStore(storage === null ? null : readBaseline(storage));
  }, []);

  const startSession = () => {
    setLeaving(false);
    setResults({});
    setStorySeed(nextStory());
    setMode({ kind: 'session', step: FIRST_STEP });
  };

  const startPvt = () => setMode({ kind: 'pvt' });

  const exitToPlay = () => {
    setResults({});
    setMode({ kind: 'tabs' });
    setTab('play');
  };

  const leaveSession = () => setLeaving(true);

  /**
   * 중간에 그만둬도 이번 방문 동안은 진행을 기억한다.
   * 저장소에는 쓰지 않는다 - 새로고침하면 사라지고, 동의 전 저장 금지 약속을 지킨다.
   */
  const confirmLeave = () => {
    setLeaving(false);
    setMode({ kind: 'tabs' });
    setTab('play');
  };

  /** 난이도가 바뀌면 앞뒤 게임을 같은 조건으로 볼 수 없으므로 진행 중이던 판을 버린다. */
  const changeLevel = (next: Level) => {
    if (next === level) return;
    setLevel(next);
    setResults({});
    setStorySeed(nextStory());
  };

  const completeGame = (key: GameKey, result: GameResult) => {
    setResults((current) => ({ ...current, [key]: result }) as SessionDraft);
    setMode((current) =>
      current.kind === 'session' ? { kind: 'session', step: nextStep(current.step) } : current);
  };

  const finishPvt = useCallback((trials: PvtTrial[], context: { tabHidden: boolean }) => {
    const metrics = calculatePvtMetrics(trials);
    const quality = assessQuality(trials, context);
    const storage = safeStorage();

    // 비교는 항상 이번 결과를 넣기 **전**의 기록으로 한다.
    const before = storage === null ? null : readBaseline(storage);
    const comparison = compareToBaseline(before, {
      medianRtMs: metrics.medianRtMs ?? 0,
      lapses: metrics.lapses,
    });

    if (storage !== null && before !== null && quality.ok && metrics.medianRtMs !== null) {
      appendResult(storage, {
        protocol: PVT_PROTOCOL_VERSION,
        completedAt: Date.now(),
        medianRtMs: metrics.medianRtMs,
        lapses: metrics.lapses,
        falseStarts: metrics.falseStarts,
        performanceScore: metrics.performanceScore,
      });
    }

    refreshStore();
    setMode({ kind: 'pvtReport', metrics, quality, comparison, savedCount: countSaved(storage) });
  }, [refreshStore]);

  /**
   * 동의를 켠 뒤에는 방금 측정도 함께 기록한다.
   * 품질 문제가 있는 측정은 넣지 않는다.
   */
  const enableAndSave = (metrics: PvtMetrics, quality: PvtQuality) => {
    const storage = safeStorage();
    if (storage === null) return;
    enableBaseline(storage);
    if (quality.ok && metrics.medianRtMs !== null) {
      appendResult(storage, {
        protocol: PVT_PROTOCOL_VERSION,
        completedAt: Date.now(),
        medianRtMs: metrics.medianRtMs,
        lapses: metrics.lapses,
        falseStarts: metrics.falseStarts,
        performanceScore: metrics.performanceScore,
      });
    }
    refreshStore();
    setMode((current) =>
      current.kind === 'pvtReport'
        ? {
            ...current,
            // 방금 켰으므로 이전 유효 결과는 0회다. counter는 방금 저장한 것까지 센다.
            comparison: compareToBaseline(
              { version: 1, entries: [] },
              { medianRtMs: metrics.medianRtMs ?? 0, lapses: metrics.lapses },
            ),
            savedCount: countSaved(storage),
          }
        : current);
  };

  /** 앞에서부터 연속으로 끝난 게임 수. 7개를 다 채운 상태는 결과 화면이 처리하므로 0으로 본다. */
  const doneCount = useMemo(() => {
    let count = 0;
    for (const key of GAME_ORDER) {
      if (results[key] === undefined) break;
      count += 1;
    }
    return count >= GAME_ORDER.length ? 0 : count;
  }, [results]);

  const resumeSession = () => {
    setLeaving(false);
    setMode({ kind: 'session', step: { type: 'transition', index: doneCount } });
  };

  const renderGame = (key: GameKey) => {
    const done = (value: GameResult) => completeGame(key, value);
    if (key === 'story') return <StoryGame mode="immediate" level={level} seed={storySeed} onComplete={done} />;
    if (key === 'reaction') return <ReactionGame onComplete={done} />;
    if (key === 'digit') return <DigitSpanGame level={level} onComplete={done} />;
    if (key === 'stroop') return <StroopGame level={level} onComplete={done} />;
    if (key === 'storyDelayed') return <StoryGame mode="delayed" level={level} seed={storySeed} onComplete={done} />;
    if (key === 'pattern') return <PatternGame level={level} onComplete={done} />;
    return <VigilanceGame onComplete={done} />;
  };

  const immersive = mode.kind === 'session' || mode.kind === 'pvt';
  // 측정 중 표시. 화면 전환 애니메이션도 끈다.
  const measuring = mode.kind === 'pvt';

  return (
    <div className={`app-shell${immersive ? ' is-immersive' : ''}${measuring ? ' is-measuring' : ''}`}>
      {mode.kind === 'session' && mode.step.type !== 'report' && (
        <header className="app-header">
          <span className="header-progress">
            {mode.step.index + 1} / {GAME_ORDER.length} · {GAME_META[GAME_ORDER[mode.step.index]].title}
          </span>
          <span className="header-actions">
            <SoundToggle />
            <button className="quiet-button" type="button" onClick={leaveSession}>그만두기</button>
          </span>
        </header>
      )}

      <main aria-live="polite">
        {mode.kind === 'tabs' && tab === 'play' && (
          <PlayTab
            level={level}
            doneCount={doneCount}
            onLevelChange={changeLevel}
            onStartSession={startSession}
            onResumeSession={resumeSession}
            onStartPvt={startPvt}
          />
        )}
        {mode.kind === 'tabs' && tab === 'trend' && (
          <TrendTab
            store={store}
            onEnable={() => {
              const storage = safeStorage();
              if (storage !== null) enableBaseline(storage);
              refreshStore();
            }}
            onClearAll={() => {
              const storage = safeStorage();
              if (storage !== null) clearBaseline(storage);
              refreshStore();
            }}
            onStartPvt={startPvt}
          />
        )}
        {mode.kind === 'tabs' && tab === 'guide' && <GuideTab />}

        {mode.kind === 'session' && leaving && (
          <div className="confirm-card" role="alertdialog" aria-labelledby="leave-title">
            <h2 id="leave-title">그만둘까요?</h2>
            <p>진행 중인 내용은 저장되지 않고 사라져요.</p>
            <button className="danger-button" type="button" onClick={confirmLeave}>
              네, 그만할게요
            </button>
            <button className="quiet-button" type="button" onClick={() => setLeaving(false)}>
              계속하기
            </button>
          </div>
        )}

        {mode.kind === 'session' && !leaving && mode.step.type === 'transition' && (
          <Transition
            index={mode.step.index}
            level={level}
            onReady={() => setMode({ kind: 'session', step: nextStep(mode.step) })}
          />
        )}
        {mode.kind === 'session' && !leaving && mode.step.type === 'game'
          && renderGame(GAME_ORDER[mode.step.index])}
        {mode.kind === 'session' && !leaving && mode.step.type === 'report' && (
          <Report
            results={results as SessionResults}
            level={level}
            onRestart={startSession}
            onGoPvt={startPvt}
            onClose={exitToPlay}
          />
        )}

        {mode.kind === 'pvt' && (
          <PvtTask onFinish={finishPvt} onCancel={() => setMode({ kind: 'tabs' })} />
        )}

        {mode.kind === 'pvtReport' && (
          <PvtReport
            metrics={mode.metrics}
            quality={mode.quality}
            comparison={mode.comparison}
            savedCount={mode.savedCount}
            onEnableBaseline={() => enableAndSave(mode.metrics, mode.quality)}
            onRetry={startPvt}
            onClose={exitToPlay}
          />
        )}
      </main>

      {!immersive && <TabBar active={tab} onChange={setTab} />}
    </div>
  );
}
