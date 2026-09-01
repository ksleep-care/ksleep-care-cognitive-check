import { useMemo, useState } from 'react';
import Feedback from '../ui/Feedback';
import { LEVEL_CONFIG } from '../domain/levels';
import { STORY_QUESTIONS, STORY_TEXT, STORY_TITLE } from '../domain/story';
import type { Level, StoryResult } from '../domain/types';

interface StoryGameProps {
  mode: 'immediate' | 'delayed';
  level: Level;
  onComplete: (result: StoryResult) => void;
}

export default function StoryGame({ mode, level, onComplete }: StoryGameProps) {
  const questions = useMemo(
    () => STORY_QUESTIONS.slice(0, LEVEL_CONFIG[level].storyQuestions),
    [level],
  );

  const [reading, setReading] = useState(mode === 'immediate');
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  if (reading) {
    return (
      <section className="game-card story-reading" aria-labelledby="story-reading-title">
        <p className="eyebrow">천천히 한 번 읽어보세요</p>
        <h2 id="story-reading-title">{STORY_TITLE}</h2>
        <p className="story-copy">{STORY_TEXT}</p>
        <p className="game-note">이따가 다시 물어볼 거예요.</p>
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
    <section className="game-card" aria-labelledby="story-question-title">
      <p className="eyebrow">
        {mode === 'immediate' ? '바로 맞추기' : '다시 떠올리기'} · 질문 {index + 1} / {questions.length}
      </p>
      <h2 id="story-question-title">{question.prompt}</h2>

      <div className="option-grid">
        {question.options.map((option) => {
          const state = picked === null
            ? ''
            : option === question.answer
              ? ' is-answer'
              : option === picked
                ? ' is-wrong'
                : ' is-dim';
          return (
            <button
              className={`option-button tilt${state}`}
              type="button"
              key={option}
              disabled={picked !== null}
              onClick={() => choose(option)}
            >
              {option}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <Feedback
          correct={isCorrect}
          answer={question.answer}
          hint={question.hint}
          nextLabel={isLast ? '결과 보기' : '다음 문제'}
          onNext={advance}
        />
      )}
    </section>
  );
}
