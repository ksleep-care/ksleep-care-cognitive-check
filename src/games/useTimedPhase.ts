import { useLayoutEffect } from 'react';

/** 제한 시간이나 자극 노출 중에는 정상 기록으로 일시 정지·재개하지 않는다. */
export function useTimedPhase(active: boolean, onTimingChange?: (active: boolean) => void) {
  useLayoutEffect(() => { onTimingChange?.(active); }, [active, onTimingChange]);
}
