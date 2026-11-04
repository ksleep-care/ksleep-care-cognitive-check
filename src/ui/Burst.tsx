import { useEffect, useState } from 'react';

interface BurstProps {
  /** 값이 바뀔 때마다 다시 터진다. */
  trigger: number | string | boolean;
  /** 색 여러 개면 조각마다 번갈아 쓴다. */
  colors?: string[];
  count?: number;
}

const DEFAULT_COLORS = ['#C6F26A', '#7DE8E2', '#FFB27A', '#C9B6FF', '#FFE08A'];

/**
 * 폭죽. 가운데에서 조각이 사방으로 튀어 나가 사라진다. 600ms.
 *
 * 순수 CSS 애니메이션이라 측정값에 영향이 없고, 동작 줄이기 설정이면 그리지 않는다.
 * 3분 측정 화면(pvt-field)에는 넣지 않는다. 타깃 말고 움직이는 것이 있으면 반응시간이 오염된다.
 */
export default function Burst({ trigger, colors = DEFAULT_COLORS, count = 14 }: BurstProps) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    setKey((current) => current + 1);
  }, [trigger]);

  if (key === 0) return null;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;

  return (
    <span className="burst" key={key} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const angle = (360 / count) * index + (key * 37) % 360;
        const distance = 56 + ((index * 13 + key * 7) % 40);
        return (
          <span
            className="burst-piece"
            key={index}
            style={{
              '--angle': `${angle}deg`,
              '--distance': `${distance}px`,
              background: colors[index % colors.length],
            } as React.CSSProperties}
          />
        );
      })}
    </span>
  );
}
