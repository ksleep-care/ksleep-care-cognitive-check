import { useEffect, useMemo, useRef, useState } from 'react';
import Icon3D from '../ui/Icon3D';
import Feedback from '../ui/Feedback';
import { useTimedPhase } from './useTimedPhase';
import { completionLabel } from '../domain/session';
import { LEVEL_CONFIG } from '../domain/levels';
import { generateStory } from '../domain/story';
import type { Level, StoryResult } from '../domain/types';

interface StoryGameProps {
  mode: 'immediate' | 'delayed';
  level: Level;
  /** 한 판 동안 같은 값이어야 바로 맞추기와 다시 퀴즈가 같은 이야기를 묻는다. */
  seed: number;
  onComplete: (result: StoryResult) => void;
  onTimingChange?: (active: boolean) => void;
}

export default function StoryGame({ mode, level, seed, onComplete, onTimingChange }: StoryGameProps) {
  const story = useMemo(() => {
    const config = LEVEL_CONFIG[level];
    return generateStory(seed, {
      questions: config.storyQuestions,
      paragraphs: config.storyParagraphs,
      distractor: config.storyDistractor,
      phase: mode,
    });
  }, [level, seed, mode]);
  const questions = story.questions;

  const readMs = LEVEL_CONFIG[level].storyReadMs;

  const [reading, setReading] = useState(mode === 'immediate');
  const [remainingMs, setRemainingMs] = useState(readMs);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const deadline = useRef(0);
  useTimedPhase(reading, onTimingChange);

  /**
   * 읽는 시간을 제한한다. 사람마다 읽은 시간이 다르면
   * 기억 점수를 자기 기록끼리도 비교할 수 없기 때문이다.
   * 시간이 다 되면 이야기를 감추고 첫 질문으로 자동으로 넘어간다.
   */
  useEffect(() => {
    if (!reading) return;
    deadline.current = performance.now() + readMs;

    const tick = window.setInterval(() => {
      const left = deadline.current - performance.now();
      if (left <= 0) {
        window.clearInterval(tick);
        setRemainingMs(0);
        setReading(false);
        return;
      }
      setRemainingMs(left);
    }, 200);

    return () => window.clearInterval(tick);
  }, [readMs, reading]);

  if (reading) {
    const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
    const ratio = Math.max(0, Math.min(1, remainingMs / readMs));
    const hurrying = secondsLeft <= 5;
    return (
      <section className="game-card story-reading" aria-labelledby="story-reading-title">
        <div className="read-timer">
          <div className="progress-track" aria-hidden="true">
            <div className={`progress-fill${hurrying ? ' is-hurrying' : ''}`} style={{ width: `${ratio * 100}%` }} />
          </div>
          <p
            className={`read-countdown${hurrying ? ' is-hurrying' : ''}`}
            role="timer"
            aria-live="off"
          >
            {secondsLeft}초
          </p>
        </div>

        <div className="story-title-row">
          <Icon3D name="story" size={44} />
          <h2 id="story-reading-title">{story.title}</h2>
        </div>
        <p className="game-note">장소·사건·해결 방법까지 기억해요.</p>
        <div className="story-copy">
          {story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <p className="game-note">시간이 끝나면 질문으로 넘어가요.</p>
        <button className="primary-button" type="button" onClick={() => setReading(false)}>
          다 읽었어요
        </button>
      </section>
    );
  }

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const isCorrect = picked === question.answer;

  const choose = (option: string) => {
    if (picked !== null) return;
    setPicked(option);
    if (option === question.answer) setCorrect((current) => current + 1);
  };

  const advance = () => {
    if (isLast) {
      onComplete({ correct, total: questions.length });
      return;
    }
    setPicked(null);
    setIndex((current) => current + 1);
  };

  return (
    <section className="game-card story-quiz" aria-labelledby="story-question-title">
      <p className="eyebrow">
        {mode === 'immediate' ? '바로 맞추기' : '다시 떠올리기'} · 질문 {index + 1} / {questions.length}
      </p>
      <h2 id="story-question-title">{question.prompt}</h2>

      <div className="option-grid">
        {question.options.map((option) => {
          const state = picked === null
            ? ''
            : mode === 'immediate'
              ? option === picked ? ' is-selected' : ' is-dim'
              : option === question.answer
              ? ' is-answer'
              : option === picked
                ? ' is-wrong'
                : ' is-dim';
          return (
            <button
              className={`option-button${state}`}
              type="button"
              key={option}
              disabled={picked !== null}
              aria-pressed={picked === option}
              onClick={() => choose(option)}
            >
              {option}
              {picked === option && <span className="choice-label">✓ 선택한 답</span>}
            </button>
          );
        })}
      </div>

      {picked !== null && mode === 'immediate' && (
        <div className="feedback" role="status">
          <p>선택했어요. 지금은 정답을 보여주지 않아요.</p>
          <button className="primary-button" type="button" autoFocus onClick={advance}>
            {isLast ? completionLabel('story') : '다음 문제'}
          </button>
        </div>
      )}
      {picked !== null && mode === 'delayed' && (
        <Feedback
          correct={isCorrect}
          answer={question.answer}
          hint={question.hint}
          nextLabel={isLast ? completionLabel('storyDelayed') : '다음 문제'}
          onNext={advance}
        />
      )}
    </section>
  );
}
