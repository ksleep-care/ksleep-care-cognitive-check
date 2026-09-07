import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PlayTab from './PlayTab';

function setup(doneCount: number) {
  const onLevelChange = vi.fn();
  const onStartSession = vi.fn();
  const onResumeSession = vi.fn();
  const onStartPvt = vi.fn();

  render(
    <PlayTab
      level={1}
      doneCount={doneCount}
      onLevelChange={onLevelChange}
      onStartSession={onStartSession}
      onResumeSession={onResumeSession}
    />,
  );

  return { onLevelChange, onStartSession, onResumeSession, onStartPvt };
}

describe('플레이 탭 - 처음 여는 사람', () => {
  it('게임 7개를 모두 보여주고 시작 버튼이 결과를 말한다', () => {
    setup(0);

    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByText('이야기 기억하기')).toBeInTheDocument();
    expect(screen.getByText('별똥별 잡기')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /게임 7개 시작/ })).toBeInTheDocument();
    expect(screen.queryByText(/사라져요/)).not.toBeInTheDocument();
  });

  it('시작 버튼은 이어서 하기가 아니라 새 판을 연다', async () => {
    const user = userEvent.setup();
    const { onStartSession, onResumeSession } = setup(0);

    await user.click(screen.getByRole('button', { name: /게임 7개 시작/ }));

    expect(onStartSession).toHaveBeenCalledTimes(1);
    expect(onResumeSession).not.toHaveBeenCalled();
  });
});

describe('플레이 탭 - 중간에 그만둔 사람', () => {
  it('끝난 게임과 지금 차례를 색이 아닌 텍스트로도 알려준다', () => {
    setup(3);

    const steps = screen.getAllByRole('listitem');
    expect(within(steps[0]).getByText(/완료/)).toBeInTheDocument();
    expect(within(steps[2]).getByText(/완료/)).toBeInTheDocument();
    expect(within(steps[3]).getByText('지금 차례')).toBeInTheDocument();
    expect(within(steps[4]).getByText(/예정/)).toBeInTheDocument();
  });

  it('다음 게임 이름을 버튼에 적고, 난이도를 바꾸면 진행이 사라진다고 미리 알린다', () => {
    setup(3);

    expect(screen.getByRole('button', { name: /색깔 단어부터 이어서/ })).toBeInTheDocument();
    expect(screen.getByText(/끝낸 3개 게임의 기록은 사라져요/)).toBeInTheDocument();
  });

  it('이어서 버튼은 새 판이 아니라 이어서 하기를 부른다', async () => {
    const user = userEvent.setup();
    const { onStartSession, onResumeSession } = setup(3);

    await user.click(screen.getByRole('button', { name: /이어서/ }));

    expect(onResumeSession).toHaveBeenCalledTimes(1);
    expect(onStartSession).not.toHaveBeenCalled();
  });
});

describe('플레이 탭 - 난이도', () => {
  it('고른 난이도를 색뿐 아니라 텍스트로도 알려준다', () => {
    setup(0);

    const rookie = screen.getByRole('radio', { name: /루키/ });
    expect(rookie).toHaveAttribute('aria-checked', 'true');
    expect(within(rookie).getByText('선택됨')).toBeInTheDocument();

    const master = screen.getByRole('radio', { name: /마스터/ });
    expect(master).toHaveAttribute('aria-checked', 'false');
    expect(within(master).getByText('선택 안 됨')).toBeInTheDocument();
  });

  it('다른 난이도를 누르면 바뀐 값을 올려보낸다', async () => {
    const user = userEvent.setup();
    const { onLevelChange } = setup(0);

    await user.click(screen.getByRole('radio', { name: /프로/ }));

    expect(onLevelChange).toHaveBeenCalledWith(3);
  });
});
