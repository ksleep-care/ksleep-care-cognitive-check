import { useCallback, useEffect, useRef } from 'react';

/**
 * 결과를 짧게 보여준 뒤 알아서 다음으로 넘어간다.
 *
 * 한 판에 문제가 40개 가까이 되는데, 문제마다 `다음`을 누르게 하면
 * 절반이 아무 뜻 없는 클릭이 된다. 읽을 것이 없는 결과는 시간이 넘긴다.
 *
 * 반환한 `advance`는 몇 번을 불러도 한 번만 실행된다.
 * 자동 진행과 손가락이 겹쳐 두 문제를 건너뛰는 일을 막는다.
 */
export function useAutoAdvance(active: boolean, delayMs: number, onNext: () => void) {
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const firedRef = useRef(false);

  const advance = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onNextRef.current();
  }, []);

  useEffect(() => {
    // 같은 컴포넌트가 문제마다 다시 쓰이므로, 결과 화면을 벗어날 때 잠금을 푼다.
    if (!active) {
      firedRef.current = false;
      return undefined;
    }
    const timer = window.setTimeout(advance, delayMs);
    return () => window.clearTimeout(timer);
  }, [active, advance, delayMs]);

  return advance;
}
