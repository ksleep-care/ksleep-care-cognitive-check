import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StoryGame from './StoryGame';
import ReactionGame from './ReactionGame';
import DigitSpanGame from './DigitSpanGame';
import StroopGame from './StroopGame';
import PatternGame from './PatternGame';
import VigilanceGame from './VigilanceGame';
import { LEVEL_CONFIG } from '../domain/levels';
import { STORY_QUESTIONS } from '../domain/story';

afterEach(() => {
  vi.useRealTimers();
});

/** 레벨 1의 이야기 정답 4개. */
const LEVEL1_ANSWERS = STORY_QUESTIONS.slice(0, LEVEL_CONFIG[1].storyQuestions).map((q) => q.answer);

describe('이야기 기억하기', () => {
  it('문제마다 정오답을 먼저 보여준 뒤 사용자가 다음으로 넘어간다', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<StoryGame mode="immediate" level={1} onComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: '다 읽었어요' }));
    await user.click(screen.getByRole('button', { name: LEVEL1_ANSWERS[0] }));

    expect(screen.getByText('맞았어요')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '다음 문제' }));
    expect(screen.queryByText('맞았어요')).not.toBeInTheDocument();
  });

  it('틀리면 정답과 한 줄 설명을 알려준다', async () => {
    const user = userEvent.setup();
    render(<StoryGame mode="immediate" level={1} onComplete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '다 읽었어요' }));
    const wrong = STORY_QUESTIONS[0].options.find((o) => o !== STORY_QUESTIONS[0].answer)!;
    await user.click(screen.getByRole('button', { name: wrong }));

    const feedback = screen.getByRole('status');
    expect(within(feedback).getByText('아쉬워요')).toBeInTheDocument();
    expect(within(feedback).getByText(STORY_QUESTIONS[0].answer)).toBeInTheDocument();
    expect(within(feedback).getByText(STORY_QUESTIONS[0].hint)).toBeInTheDocument();
  });

  it('정답을 본 뒤 다시 눌러도 점수가 바뀌지 않는다', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<StoryGame mode="immediate" level={1} onComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: '다 읽었어요' }));
    for (let i = 0; i < LEVEL1_ANSWERS.length; i += 1) {
      const wrong = STORY_QUESTIONS[i].options.find((o) => o !== STORY_QUESTIONS[i].answer)!;
      await user.click(screen.getByRole('button', { name: wrong }));
      // 정답이 드러난 뒤 정답 버튼을 다시 눌러도 점수에 섞이지 않아야 한다.
      await user.click(screen.getByRole('button', { name: STORY_QUESTIONS[i].answer }));
      await user.click(screen.getByRole('button', { name: i === LEVEL1_ANSWERS.length - 1 ? '결과 보기' : '다음 문제' }));
    }

    expect(onComplete).toHaveBeenCalledWith({ correct: 0, total: 4 });
  });

  it('레벨이 오르면 문제 수가 늘어난다', async () => {
    const user = userEvent.setup();
    render(<StoryGame mode="immediate" level={4} onComplete={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '다 읽었어요' }));

    expect(screen.getByText(/질문 1 \/ 7/)).toBeInTheDocument();
  });

  it('다시 퀴즈는 이야기를 다시 보여주지 않는다', () => {
    render(<StoryGame mode="delayed" level={1} onComplete={vi.fn()} />);
    expect(screen.queryByText(/토요일 오후 3시, 민지는/)).not.toBeInTheDocument();
    expect(screen.getByText(/다시 떠올리기/)).toBeInTheDocument();
  });
});

describe('이야기 읽기 시간 제한', () => {
  it('남은 시간을 초 단위로 보여주고 1초마다 줄어든다', async () => {
    vi.useFakeTimers();
    render(<StoryGame mode="immediate" level={1} onComplete={vi.fn()} />);

    expect(screen.getByRole('timer')).toHaveTextContent('25초');
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByRole('timer')).toHaveTextContent('24초');
  });

  it('레벨이 오를수록 읽는 시간이 줄어든다', () => {
    vi.useFakeTimers();
    const { unmount } = render(<StoryGame mode="immediate" level={1} onComplete={vi.fn()} />);
    expect(screen.getByRole('timer')).toHaveTextContent(`${LEVEL_CONFIG[1].storyReadMs / 1000}초`);
    unmount();

    render(<StoryGame mode="immediate" level={4} onComplete={vi.fn()} />);
    expect(screen.getByRole('timer')).toHaveTextContent(`${LEVEL_CONFIG[4].storyReadMs / 1000}초`);
    expect(LEVEL_CONFIG[4].storyReadMs).toBeLessThan(LEVEL_CONFIG[1].storyReadMs);
  });

  it('시간이 다 되면 이야기를 감추고 첫 질문으로 자동으로 넘어간다', async () => {
    vi.useFakeTimers();
    render(<StoryGame mode="immediate" level={1} onComplete={vi.fn()} />);

    expect(screen.getByText(/토요일 오후 3시, 민지는/)).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(LEVEL_CONFIG[1].storyReadMs));

    expect(screen.queryByText(/토요일 오후 3시, 민지는/)).not.toBeInTheDocument();
    expect(screen.getByText(/질문 1 \/ 4/)).toBeInTheDocument();
  });

  it('먼저 다 읽으면 남은 시간을 기다리지 않고 넘어간다', async () => {
    const user = userEvent.setup();
    render(<StoryGame mode="immediate" level={1} onComplete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '다 읽었어요' }));
    expect(screen.getByText(/질문 1 \/ 4/)).toBeInTheDocument();
  });

  it('넘어간 뒤에는 타이머가 더 돌지 않는다', async () => {
    vi.useFakeTimers();
    render(<StoryGame mode="immediate" level={1} onComplete={vi.fn()} />);

    await act(() => vi.advanceTimersByTimeAsync(LEVEL_CONFIG[1].storyReadMs));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(screen.getByText(/질문 1 \/ 4/)).toBeInTheDocument();
  });

  it('마지막 5초부터 색 말고 글자 크기로도 급한 걸 알린다', async () => {
    vi.useFakeTimers();
    render(<StoryGame mode="immediate" level={1} onComplete={vi.fn()} />);

    // 25초 -> 6초 남음: 아직 평상 상태
    await act(() => vi.advanceTimersByTimeAsync(19_000));
    expect(screen.getByRole('timer')).toHaveTextContent('6초');
    expect(screen.getByRole('timer').className).not.toContain('is-hurrying');

    // 5초 남음: 급함 상태로 바뀐다
    await act(() => vi.advanceTimersByTimeAsync(1_000));
    expect(screen.getByRole('timer')).toHaveTextContent('5초');
    expect(screen.getByRole('timer').className).toContain('is-hurrying');
  });

  it('다시 퀴즈에는 읽기 화면도 타이머도 없다', () => {
    render(<StoryGame mode="delayed" level={1} onComplete={vi.fn()} />);
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });
});

describe('숫자 뒤집기', () => {
  it('Enter로 제출할 수 있고 모바일 숫자 키패드를 쓴다', async () => {
    vi.useFakeTimers();
    render(<DigitSpanGame level={1} onComplete={vi.fn()} revealMsOverride={10} />);
    await act(() => vi.advanceTimersByTimeAsync(10));

    const input = screen.getByLabelText('거꾸로 입력');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'off');

    fireEvent.change(input, { target: { value: '729' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('맞았어요')).toBeInTheDocument();
  });

  it('숫자가 아닌 문자는 입력되지 않는다', async () => {
    vi.useFakeTimers();
    render(<DigitSpanGame level={1} onComplete={vi.fn()} revealMsOverride={10} />);
    await act(() => vi.advanceTimersByTimeAsync(10));

    const input = screen.getByLabelText('거꾸로 입력');
    fireEvent.change(input, { target: { value: '7a2b9' } });
    expect(input).toHaveValue('729');
  });

  it('세 문제 후 최대 정답 자릿수를 전달한다', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<DigitSpanGame level={1} onComplete={onComplete} revealMsOverride={10} />);

    const sequences = LEVEL_CONFIG[1].digitSequences;
    for (let i = 0; i < sequences.length; i += 1) {
      await act(() => vi.advanceTimersByTimeAsync(10));
      const reversed = [...sequences[i]].reverse().join('');
      fireEvent.change(screen.getByLabelText('거꾸로 입력'), { target: { value: reversed } });
      fireEvent.click(screen.getByRole('button', { name: '답 제출' }));
      fireEvent.click(screen.getByRole('button', { name: i === sequences.length - 1 ? '결과 보기' : '다음 문제' }));
    }

    expect(onComplete).toHaveBeenCalledWith({ maxSpan: 4, correct: 3, total: 3 });
  });
});

describe('색깔 단어와 패턴 매칭', () => {
  it('색깔 단어는 레벨만큼 문제를 내고 매번 피드백을 준다', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<StroopGame level={1} onComplete={onComplete} seed={7} />);

    for (let i = 0; i < LEVEL_CONFIG[1].stroopTrials; i += 1) {
      await user.click(screen.getByRole('button', { name: '빨강' }));
      expect(screen.getByText(/맞았어요|아쉬워요/)).toBeInTheDocument();
      await user.click(screen.getByRole('button', {
        name: i === LEVEL_CONFIG[1].stroopTrials - 1 ? '결과 보기' : '다음 문제',
      }));
    }

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][0].total).toBe(LEVEL_CONFIG[1].stroopTrials);
  });

  it('패턴 매칭은 정답을 모두 고르면 만점을 전달한다', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<PatternGame level={1} onComplete={onComplete} seed={11} />);

    const total = LEVEL_CONFIG[1].patternTrials;
    for (let i = 0; i < total; i += 1) {
      const target = screen.getByTestId('pattern-target').textContent ?? '';
      await user.click(screen.getByRole('button', { name: `패턴 ${target}` }));
      await user.click(screen.getByRole('button', { name: i === total - 1 ? '결과 보기' : '다음 문제' }));
    }

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ correct: total, total }));
  });

  it('패턴 선택지는 서로 다르고 정답을 정확히 하나 포함한다', () => {
    render(<PatternGame level={4} onComplete={vi.fn()} seed={3} />);
    const target = screen.getByTestId('pattern-target').textContent ?? '';
    const buttons = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-label')?.startsWith('패턴 '));
    const labels = buttons.map((b) => b.textContent);

    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.filter((label) => label === target)).toHaveLength(1);
  });
});

describe('반응속도와 별똥별 (게임 기록)', () => {
  it('반응속도는 매 시행 ms를 즉시 알려준다', async () => {
    vi.useFakeTimers();
    render(<ReactionGame onComplete={vi.fn()} getDelay={() => 10} />);

    await act(() => vi.advanceTimersByTimeAsync(10));
    await act(() => vi.advanceTimersByTimeAsync(150));
    fireEvent.click(screen.getByRole('button', { name: '지금 누르기' }));

    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('자극 전에 누르면 너무 이른 누름으로 알려주고 기록에 남긴다', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<ReactionGame onComplete={onComplete} getDelay={() => 5000} />);

    fireEvent.click(screen.getByRole('button', { name: '아직 기다리세요' }));

    expect(screen.getByText('너무 일찍 눌렀어요')).toBeInTheDocument();
  });

  it('반응속도는 여섯 시행 뒤 평균과 이른 누름 수를 전달한다', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<ReactionGame onComplete={onComplete} getDelay={() => 10} />);

    for (let i = 0; i < 6; i += 1) {
      await act(() => vi.advanceTimersByTimeAsync(10));
      await act(() => vi.advanceTimersByTimeAsync(200));
      fireEvent.click(screen.getByRole('button', { name: '지금 누르기' }));
      fireEvent.click(screen.getByRole('button', { name: i === 5 ? '결과 보기' : '다음' }));
    }

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][0]).toMatchObject({
      hits: 6, total: 6, earlyPresses: 0, averageMs: 200,
    });
  });

  it('별똥별은 여섯 번 뒤 평균과 놓침 수를 전달한다', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<VigilanceGame onComplete={onComplete} getDelay={() => 10} />);

    for (let i = 0; i < 6; i += 1) {
      await act(() => vi.advanceTimersByTimeAsync(10));
      fireEvent.click(screen.getByRole('button', { name: '별똥별 잡기' }));
      fireEvent.click(screen.getByRole('button', { name: i === 5 ? '결과 보기' : '다음' }));
    }

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][0]).toMatchObject({ hits: 6, total: 6, misses: 0 });
  });

  it('별똥별을 놓치면 놓침으로 알려준다', async () => {
    vi.useFakeTimers();
    render(<VigilanceGame onComplete={vi.fn()} getDelay={() => 10} missAfterMs={3000} />);

    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(screen.getByRole('button', { name: '별똥별 잡기' })).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(screen.getByText('놓쳤어요')).toBeInTheDocument();
  });
});
