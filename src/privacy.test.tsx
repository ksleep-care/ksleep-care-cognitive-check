import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import DigitSpanGame from './games/DigitSpanGame';
import { BASELINE_STORAGE_KEY, enableBaseline } from './domain/baseline';
import { PVT_PROTOCOL_VERSION } from './domain/pvt';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

function tab(name: RegExp) {
  return within(screen.getByRole('navigation', { name: '주요 화면' })).getByRole('button', { name });
}

describe('동의 전에는 아무것도 저장하지 않는다', () => {
  it('앱을 열기만 해서는 네트워크·브라우저 저장소·쿠키를 쓰지 않는다', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<App />);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
    fetchSpy.mockRestore();
  });

  it('탭을 모두 둘러봐도 저장소가 비어 있다', async () => {
    const user = userEvent.setup();
    render(<App />);

    for (const name of [/플레이/, /나의 변화/, /게임 안내/]) {
      await user.click(tab(name));
    }

    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it('게임 세션을 시작해도 저장소를 건드리지 않는다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(tab(/플레이/));
    await user.click(screen.getByRole('button', { name: /게임 7개 시작/ }));
    await user.click(screen.getByRole('button', { name: '준비됐어요' }));

    expect(window.localStorage.length).toBe(0);
  });
});

describe('저장에 동의한 뒤에도 경계를 지킨다', () => {
  it('나의 변화 탭에서 무엇을 저장하는지 먼저 알려주고 동의를 받는다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab(/나의 변화/));

    expect(screen.getByText(/3분 측정의 요약값만/)).toBeInTheDocument();
    expect(screen.getByText(/이름·연락처·생년월일·환자번호·게임 답안·매 회 반응 기록은 저장하지 않아요/))
      .toBeInTheDocument();
    expect(screen.getByText(/같은 기기를 쓰는 다른 사람도 이 기록을 볼 수 있어요/)).toBeInTheDocument();
    expect(window.localStorage.length).toBe(0);

    await user.click(screen.getByRole('button', { name: '이 기기에 나의 변화 저장' }));
    expect(window.localStorage.getItem(BASELINE_STORAGE_KEY)).not.toBeNull();
  });

  it('동의 뒤 저장된 값에는 허용 필드만 들어 있다', () => {
    enableBaseline(window.localStorage);
    const raw = window.localStorage.getItem(BASELINE_STORAGE_KEY) ?? '';
    const parsed = JSON.parse(raw) as { version: number; entries: unknown[] };

    expect(parsed.version).toBe(1);
    expect(parsed.entries).toEqual([]);
    expect(raw).not.toMatch(/name|patient|birth|phone|답안/i);
  });

  it('내 기록 모두 삭제를 누르면 저장소와 화면에서 함께 사라진다', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify({
      version: 1,
      entries: [{
        protocol: PVT_PROTOCOL_VERSION,
        completedAt: 1_756_000_000_000,
        medianRtMs: 260,
        lapses: 2,
        falseStarts: 0,
        performanceScore: 95,
      }],
    }));

    render(<App />);
    await user.click(tab(/나의 변화/));
    expect(screen.getByText('260ms')).toBeInTheDocument();

    // 브라우저 confirm 창이 아니라 앱 안에서 한 번 더 묻는다.
    await user.click(screen.getByRole('button', { name: '내 기록 모두 삭제' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('되돌릴 수 없어요');
    expect(window.localStorage.getItem(BASELINE_STORAGE_KEY)).not.toBeNull();

    await user.click(screen.getByRole('button', { name: '네, 모두 지울게요' }));

    expect(window.localStorage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
    expect(screen.queryByText('260ms')).not.toBeInTheDocument();
    expect(screen.getByText(/아직 기록이 없어요/)).toBeInTheDocument();
  });

  it('삭제를 취소하면 기록이 그대로 남는다', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify({
      version: 1,
      entries: [{
        protocol: PVT_PROTOCOL_VERSION,
        completedAt: 1_756_000_000_000,
        medianRtMs: 260,
        lapses: 2,
        falseStarts: 0,
        performanceScore: 95,
      }],
    }));

    render(<App />);
    await user.click(tab(/나의 변화/));
    await user.click(screen.getByRole('button', { name: '내 기록 모두 삭제' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(window.localStorage.getItem(BASELINE_STORAGE_KEY)).not.toBeNull();
    expect(screen.getByText('260ms')).toBeInTheDocument();
  });

  it('모르는 schema 버전은 읽지 않고 지운다', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify({ version: 99, entries: [] }));

    render(<App />);
    await user.click(tab(/나의 변화/));

    expect(screen.getByText(/아직 기록이 없어요/)).toBeInTheDocument();
    expect(window.localStorage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
  });
});

describe('입력 필드 경계', () => {
  it('유일한 입력 필드는 자동완성을 끈 숫자 전용 입력이다', async () => {
    vi.useFakeTimers();
    render(<DigitSpanGame level={1} onComplete={vi.fn()} revealMsOverride={10} />);
    await act(() => vi.advanceTimersByTimeAsync(10));

    const input = screen.getByLabelText('거꾸로 입력');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
    vi.useRealTimers();
  });

  it('개인정보를 물어보는 입력이 어디에도 없다', () => {
    render(<App />);
    expect(screen.queryByLabelText(/이름|연락처|생년월일|환자번호/)).not.toBeInTheDocument();
  });
});
