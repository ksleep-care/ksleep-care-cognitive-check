import { useEffect, useRef } from 'react';

/**
 * 답을 고른 뒤 잠깐 보여 주고 저절로 다음 문제로 넘어간다.
 *
 * 맞으면 짧게, 틀리면 정답을 읽을 만큼 보여 준다.
 * 버튼을 누르면 기다리지 않고 바로 넘어가며, 버튼과 시간이 겹쳐도 한 번만 넘어간다.
 * 문제마다 새로 그려지므로 잠금은 문제 단위로 풀린다.
 */
export const AUTO_NEXT_MS = { chosen: 700, correct: 900, wrong: 2500 } as const;

interface AutoNextButtonProps {
  label: string;
  delayMs: number;
  onNext: () => void;
}

export default function AutoNextButton({ label, delayMs, onNext }: AutoNextButtonProps) {
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const firedRef = useRef(false);
  const goRef = useRef(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onNextRef.current();
  });

  useEffect(() => {
    const timer = window.setTimeout(goRef.current, delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return (
    <button className="primary-button" type="button" autoFocus onClick={goRef.current}>
      {label}
    </button>
  );
}
