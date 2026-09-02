import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

beforeEach(() => {
  window.localStorage.clear();
});

/** 탭 버튼은 본문 버튼과 이름이 겹칠 수 있으므로 항상 nav 안에서 찾는다. */
function tab(name: RegExp) {
  return within(screen.getByRole('navigation', { name: '주요 화면' })).getByRole('button', { name });
}

describe('첫 화면과 하단 탭', () => {
  it('홈은 오늘의 주 행동 하나와 비진단·비저장 안내를 보여준다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab(/홈/));

    expect(screen.getByRole('heading', { name: '인지 컨디션 체크' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '3분 집중 측정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3분 측정 시작' })).toBeInTheDocument();
    expect(screen.getByText(/의료 진단이 아니에요/)).toBeInTheDocument();
    expect(screen.getByText(/켜기 전까지 아무것도 저장하지 않아요/)).toBeInTheDocument();
  });

  it('하단 탭은 게임 전용 4개이고, 플레이가 첫 탭이자 기본 탭이다', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: '주요 화면' });
    const tabs = within(nav).getAllByRole('button');

    expect(tabs.map((tab) => tab.textContent)).toEqual(['플레이', '홈', '나의 변화', '게임 안내']);
    expect(within(nav).getByRole('button', { name: /플레이/ })).toHaveAttribute('aria-current', 'page');
  });

  it('탭 아이콘에 이모지를 쓰지 않는다', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: '주요 화면' });

    expect(nav.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(nav.querySelectorAll('svg.tab-icon')).toHaveLength(4);
  });

  it('플레이 탭이 첫 화면이고, 게임 7개가 주인공이며 3분 측정은 한 줄로 내려간다', () => {
    render(<App />);

    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByRole('list', { name: /코스 진행/ })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByRole('button', { name: /게임 7개 시작/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3분 집중 측정/ })).toBeInTheDocument();
  });

  it('레벨을 고르면 선택 상태가 색이 아닌 텍스트로도 보인다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab(/플레이/));

    const master = screen.getByRole('radio', { name: /마스터/ });
    await user.click(master);

    expect(master).toHaveAttribute('aria-checked', 'true');
    expect(within(master).getByText('선택됨')).toBeInTheDocument();
  });
});

describe('세션 시작', () => {
  it('시작하면 첫 활동 안내로 가고 하단 탭이 사라진다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(tab(/플레이/));
    await user.click(screen.getByRole('button', { name: /게임 7개 시작/ }));

    expect(screen.getByRole('heading', { name: '이야기 기억하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '준비됐어요' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '주요 화면' })).not.toBeInTheDocument();
  });

  it('3분 측정을 열면 하단 탭이 사라지고 연습부터 시작한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /3분 집중 측정/ }));

    expect(screen.getByRole('heading', { name: '숫자가 나타나면 바로 누르세요' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '연습 시작' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '주요 화면' })).not.toBeInTheDocument();
  });

  it('측정 화면에서는 배경 장식을 정지시키는 상태로 들어간다', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: /3분 집중 측정/ }));

    expect(container.querySelector('.app-shell')).toHaveClass('is-measuring');
  });

  it('게임 세션에서는 측정 전용 상태로 들어가지 않는다', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(tab(/플레이/));
    await user.click(screen.getByRole('button', { name: /게임 7개 시작/ }));

    expect(container.querySelector('.app-shell')).not.toHaveClass('is-measuring');
  });
});

describe('세션 그만두기', () => {
  it('브라우저 confirm 창이 아니라 앱 안에서 한 번 더 묻고, 계속하기로 되돌아온다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(tab(/플레이/));
    await user.click(screen.getByRole('button', { name: /게임 7개 시작/ }));
    await user.click(screen.getByRole('button', { name: '그만두기' }));

    expect(screen.getByRole('alertdialog')).toHaveTextContent('진행 중인 내용은 저장되지 않고 사라져요');

    await user.click(screen.getByRole('button', { name: '계속하기' }));
    expect(screen.getByRole('button', { name: '준비됐어요' })).toBeInTheDocument();
  });

  it('그만하면 탭 화면으로 돌아온다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(tab(/플레이/));
    await user.click(screen.getByRole('button', { name: /게임 7개 시작/ }));
    await user.click(screen.getByRole('button', { name: '그만두기' }));
    await user.click(screen.getByRole('button', { name: '네, 그만할게요' }));

    expect(screen.getByRole('navigation', { name: '주요 화면' })).toBeInTheDocument();
  });
});

describe('게임 안내 탭', () => {
  it('모든 게임의 한계를 함께 적고 정상·비정상 판정을 하지 않는다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab(/게임 안내/));

    expect(screen.getAllByText(/한계/).length).toBeGreaterThanOrEqual(8);
    expect(screen.getByText(/진단·선별·치료 판단에 쓰지 않아요/)).toBeInTheDocument();
    expect(screen.queryByText(/정상입니다/)).not.toBeInTheDocument();
  });
});
