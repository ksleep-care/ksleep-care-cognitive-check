import { useState } from 'react';
import type { StoryResult } from '../domain/types';

const STORY = '민지는 토요일 오후 3시에 한강공원에서 파란 우산을 든 준호를 만나 따뜻한 차를 마셨습니다.';

const QUESTIONS = [
  { prompt: '이야기의 주인공은 누구였나요?', answer: '민지', options: ['민지', '수연', '지우', '하나'] },
  { prompt: '언제 만나기로 했나요?', answer: '토요일 오후 3시', options: ['금요일 오전 10시', '토요일 오후 3시', '일요일 오후 5시', '월요일 저녁 7시'] },
  { prompt: '어디에서 만났나요?', answer: '한강공원', options: ['서울숲', '도서관', '한강공원', '미술관'] },
  { prompt: '두 사람은 무엇을 마셨나요?', answer: '따뜻한 차', options: ['찬물', '따뜻한 차', '오렌지 주스', '우유'] },
] as const;

interface StoryGameProps {
  mode: 'immediate' | 'delayed';
  onComplete: (result: StoryResult) => void;
}

export default function StoryGame({ mode, onComplete }: StoryGameProps) {
  const [reading, setReading] = useState(mode === 'immediate');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correct, setCorrect] = useState(0);

  if (reading) {
    return (
      <section className="game-card" aria-labelledby="story-reading-title">
        <p className="eyebrow">천천히 한 번 읽어보세요</p>
        <h2 id="story-reading-title">짧은 이야기</h2>
        <p className="story-copy">{STORY}</p>
        <button className="primary-button" type="button" onClick={() => setReading(false)}>
          질문 풀기
        </button>
      </section>
    );
  }

  const question = QUESTIONS[questionIndex];
  const choose = (option: string) => {
    const nextCorrect = correct + (option === question.answer ? 1 : 0);
    if (questionIndex === QUESTIONS.length - 1) {
      onComplete({ correct: nextCorrect, total: QUESTIONS.length });
      return;
    }
    setCorrect(nextCorrect);
    setQuestionIndex((current) => current + 1);
  };

  return (
    <section className="game-card" aria-labelledby="story-question-title">
      <p className="eyebrow">질문 {questionIndex + 1} / {QUESTIONS.length}</p>
      <h2 id="story-question-title">{question.prompt}</h2>
      <div className="option-grid">
        {question.options.map((option) => (
          <button className="option-button" type="button" key={option} onClick={() => choose(option)}>
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}
