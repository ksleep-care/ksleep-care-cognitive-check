import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => { vi.useRealTimers(); });
function beginStory() {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /게임.*시작/ }));
  fireEvent.click(screen.getByRole('button', { name: /준비됐어요|이야기 읽기 시작/ }));
}
function beginQuiz() {
  beginStory();
  fireEvent.click(screen.getByRole('button', { name: '다 읽었어요' }));
}
function answer() { fireEvent.click(document.querySelector<HTMLButtonElement>('.option-button')!); }
function finishStory() {
  beginQuiz();
  for (let i = 0; i < 4; i++) {
    answer();
    fireEvent.click(screen.getByRole('button', { name: i === 3 ? /결과 보기|다음 게임/ : '다음 문제' }));
  }
}
function leaveTransition() {
  fireEvent.click(screen.getByRole('button', { name: '그만두기' }));
  fireEvent.click(screen.getByRole('button', { name: '네, 그만할게요' }));
}
function reachDigit() {
  finishStory();
  fireEvent.click(screen.getByRole('button', { name: '준비됐어요' }));
  for (let i = 0; i < 6; i++) {
    fireEvent.click(screen.getByRole('button', { name: '아직 기다리세요' }));
    act(() => vi.advanceTimersByTime(1000));
  }
  fireEvent.click(screen.getByRole('button', { name: '준비됐어요' }));
}

describe('사용자가 기대한 행동', () => {
  it('게임 탭은 화면 이동, 게임 시작은 첫 방법 안내로 연결된다', () => {
    render(<App />);
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: '게임 안내' }));
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: '게임' }));
    fireEvent.click(screen.getByRole('button', { name: '게임 시작' }));
    expect(screen.getByRole('heading', { name: '이야기 기억하기' })).toBeInTheDocument();
    expect(screen.getByText(/25초 동안 한 번/)).toBeInTheDocument();
    expect(screen.getByText(/첫 퀴즈에서는 정답을/)).toBeInTheDocument();
  });
  it('질문 2에서 나가기를 취소해도 선택한 답과 질문을 보존한다', () => {
    beginQuiz(); answer(); fireEvent.click(screen.getByRole('button', { name: '다음 문제' }));
    answer();
    const question = screen.getByRole('heading', { level: 2 }).textContent;
    const chosen = document.querySelector('.is-selected')?.textContent;
    fireEvent.click(screen.getByRole('button', { name: '그만두기' }));
    fireEvent.click(screen.getByRole('button', { name: '계속하기' }));
    expect(screen.queryByRole('button', { name: '다 읽었어요' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(question!);
    expect(document.querySelector('.is-selected')).toHaveTextContent(chosen!);
    expect(screen.getByText(/질문 2 \/ 4/)).toBeInTheDocument();
  });
  it('나가기 확인창은 안전한 초점과 순환, Escape 취소, 원래 초점을 제공한다', async () => {
    const user = userEvent.setup(); beginQuiz();
    const leave = screen.getByRole('button', { name: '그만두기' });
    await user.click(leave);
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByRole('button', { name: '계속하기' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.tab(); await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(leave).toHaveFocus();
  });
  it('첫 이야기의 마지막 버튼은 예고한 다음 게임으로 간다', () => {
    beginQuiz();
    for(let i=0;i<3;i++) { answer(); fireEvent.click(screen.getByRole('button',{name:'다음 문제'})); }
    answer();
    fireEvent.click(screen.getByRole('button', { name: '다음 게임 · 반응속도' }));
    expect(screen.getByRole('heading', { name: '반응속도' })).toBeInTheDocument();
  });
  it('진행이 있을 때 난이도 변경을 취소하면 기록과 선택을 유지한다', () => {
    finishStory(); leaveTransition();
    fireEvent.click(screen.getByRole('radio', { name: /챌린저/ }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('1개');
    fireEvent.click(screen.getByRole('button', { name: '현재 난이도 유지' }));
    expect(screen.getByRole('radio', { name: /루키/ })).toHaveAttribute('aria-checked','true');
    expect(screen.getByRole('button', { name: /반응속도부터 이어서/ })).toBeInTheDocument();
  });
  it('방향키 변경도 확인한 뒤에만 기존 기록을 지운다', () => {
    finishStory(); leaveTransition();
    fireEvent.keyDown(screen.getByRole('radio', { name: /루키/ }), { key:'ArrowRight' });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '난이도 바꾸기' }));
    expect(screen.getByRole('radio', { name:/챌린저/ })).toHaveAttribute('aria-checked','true');
    expect(screen.queryByRole('button',{name:/이어서/})).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name:'게임 시작' })).toBeInTheDocument();
  });
  it('난이도 변경을 취소하면 선택된 난이도에서 다시 방향키로 이동한다', async () => {
    const user = userEvent.setup(); finishStory(); leaveTransition();
    screen.getByRole('radio', {name:/루키/}).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', {name:'현재 난이도 유지'}));
    expect(screen.getByRole('radio', {name:/루키/})).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('챌린저로 바꿀까요?');
  });
  it('읽기 중 중단은 재읽기를 정상 기록으로 이어 붙이지 않는다', () => {
    vi.useFakeTimers(); beginStory();
    fireEvent.click(screen.getByRole('button', { name: /그만두기|코스 중단/ }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('새 이야기');
    expect(screen.queryByRole('button', { name:'계속하기' })).not.toBeInTheDocument();
    act(()=>vi.advanceTimersByTime(30000));
    expect(screen.queryByText(/질문 1 \/ 4/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name:'새 코스 시작' }));
    expect(screen.getByRole('heading', { name:'이야기 기억하기' })).toBeInTheDocument();
  });
  it('아직 답을 고르지 않은 질문도 취소하면 그 질문에 머문다', () => {
    beginQuiz(); answer(); fireEvent.click(screen.getByRole('button',{name:'다음 문제'}));
    const prompt = screen.getByRole('heading', {level:2}).textContent;
    fireEvent.click(screen.getByRole('button',{name:'그만두기'}));
    fireEvent.click(screen.getByRole('button',{name:'계속하기'}));
    expect(screen.getByRole('heading',{level:2})).toHaveTextContent(prompt!);
    expect(document.querySelectorAll('.option-button:not(:disabled)')).toHaveLength(4);
  });
  it('숫자 노출 중 중단하면 완료한 앞 게임도 정상 이어가기로 남기지 않는다', () => {
    vi.useFakeTimers(); reachDigit();
    fireEvent.click(screen.getByRole('button',{name:'코스 중단'}));
    act(()=>vi.advanceTimersByTime(10000));
    expect(screen.queryByLabelText('거꾸로 입력')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'게임으로 돌아가기'}));
    expect(screen.getByRole('button',{name:'게임 시작'})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:/이어서/})).not.toBeInTheDocument();
  });
  it('숫자 입력 단계의 취소는 입력을 보존하고 남은 자리 수를 안내한다', () => {
    vi.useFakeTimers(); reachDigit(); act(()=>vi.advanceTimersByTime(3000));
    fireEvent.change(screen.getByLabelText('거꾸로 입력'), {target:{value:'1'}});
    expect(screen.getByRole('status')).toHaveTextContent('2자리를 더 입력하세요');
    fireEvent.click(screen.getByRole('button',{name:'그만두기'}));
    fireEvent.click(screen.getByRole('button',{name:'계속하기'}));
    expect(screen.getByLabelText('거꾸로 입력')).toHaveValue('1');
    expect(screen.getByRole('button',{name:'답 제출'})).toBeDisabled();
  });
});
