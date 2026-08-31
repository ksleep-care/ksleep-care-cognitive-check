import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('전체 검사 흐름', () => {
  it('처음 화면에서 비저장·비진단 안내와 한 개의 시작 행동을 보여준다', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '인지 컨디션 체크' })).toBeInTheDocument();
    expect(screen.getByText(/결과는 이 화면에서만 확인/)).toBeInTheDocument();
    expect(screen.getByText(/의료 진단이 아닌/)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByRole('button', { name: '검사 시작' })).toBeInTheDocument();
  });

  it('시작하면 첫 번째 이야기 기억 활동 안내로 이동한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '검사 시작' }));

    expect(screen.getByRole('heading', { name: '이야기 기억하기' })).toBeInTheDocument();
    expect(screen.getByText('1 / 7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '준비됐어요' })).toBeInTheDocument();
  });
});
