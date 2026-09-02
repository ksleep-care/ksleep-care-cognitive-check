import { useAutoAdvance } from './useAutoAdvance';

/**
 * 문제마다 즉시 보여주는 정오답 피드백.
 *
 * 규칙: 점수는 항상 **최초 제출**로 확정된다. 이 화면은 학습용 안내일 뿐,
 * 여기서 무엇을 눌러도 점수에 섞이지 않는다.
 *
 * 맞았을 때는 더 읽을 것이 없으므로 짧게 보여주고 알아서 넘어간다.
 * 틀렸을 때는 정답과 설명을 읽어야 하므로 사용자가 직접 넘긴다.
 */
interface FeedbackProps {
  correct: boolean;
  /** 틀렸을 때만 보여주는 정답. */
  answer?: string;
  /** 틀렸을 때 한 줄 설명. */
  hint?: string;
  nextLabel: string;
  onNext: () => void;
}

/** 맞았다는 것만 알면 되는 시간. 이보다 짧으면 확인이 안 되고, 길면 지루하다. */
const CORRECT_DWELL_MS = 900;

export default function Feedback({ correct, answer, hint, nextLabel, onNext }: FeedbackProps) {
  const advance = useAutoAdvance(correct, CORRECT_DWELL_MS, onNext);

  return (
    <div className={`feedback feedback-${correct ? 'correct' : 'wrong'}`} role="status">
      <p className="feedback-headline">
        <span className="feedback-icon" aria-hidden="true">{correct ? '✓' : '✕'}</span>
        {correct ? '맞았어요' : '아쉬워요'}
      </p>
      {!correct && answer !== undefined && (
        <p className="feedback-answer">정답: <strong>{answer}</strong></p>
      )}
      {!correct && hint !== undefined && <p className="feedback-hint">{hint}</p>}

      <button className="primary-button" type="button" autoFocus onClick={advance}>
        {nextLabel}
      </button>

      {correct && (
        <div className="feedback-timer" aria-hidden="true">
          <span className="feedback-timer-fill" />
        </div>
      )}
    </div>
  );
}
