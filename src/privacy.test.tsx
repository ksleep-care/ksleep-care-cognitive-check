import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import DigitSpanGame from './games/DigitSpanGame';
import { BASELINE_STORAGE_KEY, enableBaseline } from './domain/baseline';
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
async function openRecords() {
  const user = userEvent.setup();
  await user.click(within(screen.getByRole('navigation')).getByRole('button', { name: /게임 안내/ }));
  await user.click(screen.getByText('이전 버전의 저장 기록 관리'));
  return user;
}
describe('개인정보와 이전 기록 경계', () => {
  it('열고 탐색하고 코스를 시작해도 네트워크 전송과 영구 저장이 없다', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup(); render(<App />);
    for (const name of [/게임 안내/, /^게임$/]) {
      await user.click(within(screen.getByRole('navigation')).getByRole('button', { name }));
    }
    await user.click(screen.getByRole('button', { name: /게임 시작/ }));
    await user.click(screen.getByRole('button', { name: '이야기 읽기 시작' }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0); expect(document.cookie).toBe('');
    fetchSpy.mockRestore();
  });
  it('이전 데이터는 자동 삭제하거나 새 형식으로 전환하지 않는다', () => {
    enableBaseline(localStorage);
    const before = localStorage.getItem(BASELINE_STORAGE_KEY);
    render(<App />);
    expect(localStorage.getItem(BASELINE_STORAGE_KEY)).toBe(before);
    expect(screen.queryByLabelText(/이름|연락처|생년월일|환자번호/)).not.toBeInTheDocument();
  });
  it('기록 삭제는 확인을 거치고 앱 소유 키만 지운다', async () => {
    enableBaseline(localStorage); localStorage.setItem('unrelated', 'keep');
    render(<App />); const user = await openRecords();
    await user.click(screen.getByRole('button', { name: '내 기록 모두 삭제' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('되돌릴 수 없어요');
    expect(localStorage.getItem(BASELINE_STORAGE_KEY)).not.toBeNull();
    await user.click(screen.getByRole('button', { name: '네, 모두 지울게요' }));
    expect(localStorage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep');
    expect(screen.getByRole('status')).toHaveTextContent('삭제했어요');
  });
  it('삭제를 취소하면 기록을 보존한다', async () => {
    enableBaseline(localStorage); render(<App />); const user = await openRecords();
    await user.click(screen.getByRole('button', { name: '내 기록 모두 삭제' }));
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(localStorage.getItem(BASELINE_STORAGE_KEY)).not.toBeNull();
  });
  it('숫자 답안에 자동완성과 개인정보 입력을 쓰지 않는다', async () => {
    vi.useFakeTimers();
    render(<DigitSpanGame level={1} onComplete={vi.fn()} revealMsOverride={10} />);
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(screen.getByLabelText('거꾸로 입력')).toHaveAttribute('inputmode', 'numeric');
    expect(screen.getByLabelText('거꾸로 입력')).toHaveAttribute('autocomplete', 'off');
    expect(screen.getByLabelText('거꾸로 입력')).toHaveAttribute('spellcheck', 'false');
    vi.useRealTimers();
  });
});
