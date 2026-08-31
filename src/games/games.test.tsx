import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StoryGame from './StoryGame';
import ReactionGame from './ReactionGame';
import DigitSpanGame from './DigitSpanGame';
import StroopGame from './StroopGame';
import PatternGame from './PatternGame';
import VigilanceGame from './VigilanceGame';

afterEach(() => {
  vi.useRealTimers();
});

describe('7개 활동 완료 계약', () => {
  it('이야기 기억하기는 네 질문의 정답 수를 전달한다', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<StoryGame mode="immediate" onComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: '질문 풀기' }));
    for (const answer of ['민지', '토요일 오후 3시', '한강공원', '따뜻한 차']) {
      await user.click(screen.getByRole('button', { name: answer }));
    }

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith({ correct: 4, total: 4 });
  });

  it('이야기 다시 퀴즈는 이야기 재노출 없이 바로 네 질문을 묻는다', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<StoryGame mode="delayed" onComplete={onComplete} />);

    expect(screen.queryByText(/민지는 토요일/)).not.toBeInTheDocument();
    for (const answer of ['민지', '토요일 오후 3시', '한강공원', '따뜻한 차']) {
      await user.click(screen.getByRole('button', { name: answer }));
    }

    expect(onComplete).toHaveBeenCalledWith({ correct: 4, total: 4 });
  });

  it('반응속도는 여섯 번 누른 평균과 성공 수를 전달한다', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<ReactionGame onComplete={onComplete} getDelay={() => 10} />);

    fireEvent.click(screen.getByRole('button', { name: '반응 시작' }));
    for (let index = 0; index < 6; index += 1) {
      await act(() => vi.advanceTimersByTimeAsync(10));
      fireEvent.click(screen.getByRole('button', { name: '지금 누르기' }));
    }

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][0]).toMatchObject({ hits: 6, total: 6 });
    expect(onComplete.mock.calls[0][0].averageMs).toBeGreaterThanOrEqual(0);
  });

  it('숫자 뒤집기는 세 문제 후 최대 정답 자릿수를 전달한다', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<DigitSpanGame onComplete={onComplete} revealMs={10} />);

    for (const answer of ['729', '1846', '53027']) {
      await act(() => vi.advanceTimersByTimeAsync(10));
      fireEvent.change(screen.getByLabelText('거꾸로 입력'), { target: { value: answer } });
      fireEvent.click(screen.getByRole('button', { name: '답 제출' }));
    }

    expect(onComplete).toHaveBeenCalledWith({ maxSpan: 5, correct: 3, total: 3 });
  });

  it('색깔 단어는 여덟 선택 후 정확도와 평균 시간을 전달한다', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<StroopGame onComplete={onComplete} />);

    for (let index = 0; index < 8; index += 1) {
      await user.click(screen.getByRole('button', { name: '빨강' }));
    }

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][0]).toMatchObject({ correct: 2, total: 8 });
  });

  it('패턴 매칭은 여섯 선택 후 정확도와 평균 시간을 전달한다', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<PatternGame onComplete={onComplete} />);

    for (let index = 0; index < 6; index += 1) {
      const target = screen.getByTestId('pattern-target').textContent ?? '';
      await user.click(screen.getByRole('button', { name: `패턴 ${target}` }));
    }

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ correct: 6, total: 6 }));
  });

  it('별똥별 잡기는 여섯 번 누른 평균과 놓침 수를 전달한다', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<VigilanceGame onComplete={onComplete} getDelay={() => 10} />);

    fireEvent.click(screen.getByRole('button', { name: '주의력 측정 시작' }));
    for (let index = 0; index < 6; index += 1) {
      await act(() => vi.advanceTimersByTimeAsync(10));
      fireEvent.click(screen.getByRole('button', { name: '별똥별 잡기' }));
    }

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][0]).toMatchObject({ hits: 6, total: 6, misses: 0 });
  });

  it('별똥별은 느린 조작을 위해 최소 3초 동안 누를 수 있다', async () => {
    vi.useFakeTimers();
    render(<VigilanceGame onComplete={vi.fn()} getDelay={() => 10} />);

    fireEvent.click(screen.getByRole('button', { name: '주의력 측정 시작' }));
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(screen.getByRole('button', { name: '별똥별 잡기' })).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(screen.getByRole('button', { name: '별똥별 잡기' })).toBeInTheDocument();
  });
});
