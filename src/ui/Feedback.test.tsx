import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Feedback from './Feedback';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function tick(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('문제 피드백', () => {
  it('맞았으면 누르지 않아도 다음으로 넘어간다', () => {
    const onNext = vi.fn();
    render(<Feedback correct nextLabel="다음 문제" onNext={onNext} />);

    expect(screen.getByText('맞았어요')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();

    tick(900);

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('틀렸으면 정답을 읽어야 하므로 저절로 넘어가지 않는다', () => {
    const onNext = vi.fn();
    render(
      <Feedback
        correct={false}
        answer="한강공원 2번 출구"
        hint="만난 곳은 한강공원 2번 출구였어요."
        nextLabel="다음 문제"
        onNext={onNext}
      />,
    );

    expect(screen.getByText('아쉬워요')).toBeInTheDocument();
    expect(screen.getByText('한강공원 2번 출구')).toBeInTheDocument();

    tick(5_000);

    expect(onNext).not.toHaveBeenCalled();
  });

  it('버튼을 눌렀는데 시간까지 지나도 두 번 넘어가지 않는다', () => {
    const onNext = vi.fn();
    render(<Feedback correct nextLabel="다음 문제" onNext={onNext} />);

    act(() => {
      screen.getByRole('button', { name: '다음 문제' }).click();
    });
    tick(3_000);

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('맞았을 때도 버튼이 남아 있어 키보드로 바로 넘길 수 있다', () => {
    const onNext = vi.fn();
    render(<Feedback correct nextLabel="결과 보기" onNext={onNext} />);

    expect(screen.getByRole('button', { name: '결과 보기' })).toBeInTheDocument();
  });
});
