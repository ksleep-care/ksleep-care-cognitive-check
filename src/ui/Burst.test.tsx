import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Burst from './Burst';

describe('폭죽', () => {
  it('트리거가 들어오면 조각을 그린다', () => {
    const { container } = render(<Burst trigger={1} count={12} />);
    expect(container.querySelectorAll('.burst-piece')).toHaveLength(12);
  });

  it('트리거가 바뀌면 새로 터진다', () => {
    const { container, rerender } = render(<Burst trigger={1} count={6} />);
    const before = container.querySelector('.burst-piece') as HTMLElement;
    const angleBefore = before.style.getPropertyValue('--angle');
    rerender(<Burst trigger={2} count={6} />);
    const after = container.querySelector('.burst-piece') as HTMLElement;
    expect(after.style.getPropertyValue('--angle')).not.toBe(angleBefore);
  });

  it('동작 줄이기 설정이면 그리지 않는다', () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes('reduce') })) as unknown as typeof window.matchMedia;
    try {
      const { container } = render(<Burst trigger={1} />);
      expect(container.querySelectorAll('.burst-piece')).toHaveLength(0);
    } finally {
      window.matchMedia = original;
    }
  });
});
