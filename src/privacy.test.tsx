import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import DigitSpanGame from './games/DigitSpanGame';

describe('개인정보 비저장 경계', () => {
  it('첫 화면을 열어도 네트워크·브라우저 저장소·쿠키를 사용하지 않는다', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<App />);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
    fetchSpy.mockRestore();
  });

  it('유일한 입력 필드는 브라우저 자동완성을 끈 숫자 입력이다', async () => {
    vi.useFakeTimers();
    render(<DigitSpanGame onComplete={vi.fn()} revealMs={10} />);

    await act(() => vi.advanceTimersByTimeAsync(10));
    const input = screen.getByLabelText('거꾸로 입력');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'off');
    vi.useRealTimers();
  });
});
