import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
beforeEach(() => { window.localStorage.clear(); });
describe('바로 플레이', () => {
  it('홈과 측정 진입점 없이 플레이와 안내만 제공한다', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: '주요 화면' });
    expect(within(nav).getAllByRole('button').map(b => b.textContent)).toEqual(['플레이', '게임 안내']);
    expect(within(nav).getByRole('button', { name: /플레이/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByRole('button', { name: /게임 7개 시작/ })).toBeInTheDocument();
    expect(screen.queryByText(/3분 집중 측정/)).not.toBeInTheDocument();
    expect(screen.getByText(/의료 진단이 아니에요/)).toBeInTheDocument();
  });
  it('마스터를 고르면 실제 도전 조건도 바뀐다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /마스터/ }));
    expect(screen.getByRole('radio', { name: /마스터/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('6~9자리')).toBeInTheDocument();
    expect(screen.getByText('0.75초')).toBeInTheDocument();
  });
  it('시작하면 첫 게임 안내로 이동하고 탭이 사라진다', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole('button', { name: /게임 7개 시작/ }));
    expect(screen.getByRole('heading', { name: '이야기 기억하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '준비됐어요' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
  it('앱 안에서 나가기와 계속하기를 처리한다', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole('button', { name: /게임 7개 시작/ }));
    await user.click(screen.getByRole('button', { name: '그만두기' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('지금 하던 게임은 다시 시작');
    await user.click(screen.getByRole('button', { name: '계속하기' }));
    expect(screen.getByRole('button', { name: '준비됐어요' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '그만두기' }));
    await user.click(screen.getByRole('button', { name: '네, 그만할게요' }));
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
  it('측정 도중 탭을 벗어나면 변질된 기록을 이어서 만들지 않는다', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole('button', { name: /게임 7개 시작/ }));
    await user.click(screen.getByRole('button', { name: '준비됐어요' }));
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    fireEvent(document, new Event('visibilitychange'));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('화면을 벗어나');
    expect(screen.getByRole('button', { name: '새 코스 시작' })).toBeInTheDocument();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  });
  it('모든 게임에 출처와 한계가 있으며 측정 광고가 없다', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(within(screen.getByRole('navigation')).getByRole('button', { name: /게임 안내/ }));
    expect(screen.getAllByText('한계')).toHaveLength(7);
    expect(screen.getByText(/진단·선별·치료 판단에 쓰지 않아요/)).toBeInTheDocument();
    expect(screen.queryByText(/3분 집중 측정/)).not.toBeInTheDocument();
    expect(document.querySelectorAll('a[href^="https:"]')).toHaveLength(7);
  });
});
