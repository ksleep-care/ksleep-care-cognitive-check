import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Report from './Report';
import type { SessionResults } from '../domain/types';

const allMissed: SessionResults = {
  story: { correct: 4, total: 4 },
  reaction: { averageMs: 320, hits: 6, total: 6 },
  digit: { maxSpan: 5, correct: 3, total: 3 },
  stroop: { averageMs: 600, correct: 6, total: 8 },
  storyDelayed: { correct: 3, total: 4 },
  pattern: { averageMs: 800, correct: 6, total: 6 },
  vigilance: { averageMs: 0, hits: 0, total: 6, misses: 6 },
};

describe('결과 표시', () => {
  it('주의력 반응을 모두 놓치면 평균을 0ms로 오해시키지 않는다', () => {
    render(<Report results={allMissed} onRestart={vi.fn()} />);

    expect(screen.getByText('측정 없음')).toBeInTheDocument();
    expect(screen.queryByText('0ms')).not.toBeInTheDocument();
  });
});
