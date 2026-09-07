import { useId, type JSX } from 'react';

/**
 * 색이 있는 3D 느낌의 SVG 아이콘.
 *
 * 이미지 파일 없이 SVG 하나로 그린다. 위에서 아래로 어두워지는 면 + 위쪽 흰 하이라이트 + 아래 그림자로
 * 부피감을 만든다. 색은 UI 토큰이 아니라 그림의 색이므로 여기서만 정한다(상태 의미가 없다).
 * 장식이므로 항상 aria-hidden이고, 뜻은 옆의 글자가 전한다.
 */
export type IconName =
  | 'play' | 'trend' | 'guide'
  | 'story' | 'reaction' | 'digit' | 'stroop' | 'storyDelayed' | 'pattern' | 'vigilance'
  | 'pvt';

interface Icon3DProps {
  name: IconName;
  size?: number;
  className?: string;
}

/** 아이콘마다 밝은 면 / 어두운 면 두 색. */
export const ICON_SHADE: Record<IconName, [string, string]> = {
  play: ['#D9F78F', '#7FAF2A'],
  trend: ['#8FC1FF', '#2B5FD0'],
  guide: ['#E0E0D9', '#83857F'],
  story: ['#FFB27A', '#D9622A'],
  reaction: ['#D9F78F', '#7FAF2A'],
  digit: ['#8FC1FF', '#2B5FD0'],
  stroop: ['#FF9DB0', '#C43A5A'],
  storyDelayed: ['#F4C464', '#A5782F'],
  pattern: ['#E0E0D9', '#83857F'],
  vigilance: ['#FFE08A', '#D9A21B'],
  pvt: ['#7DE8E2', '#1E9C97'],
};

function Glyph({ name, ink }: { name: IconName; ink: string }): JSX.Element {
  switch (name) {
    case 'play':
      return <path d="M13 10.5v11l9-5.5z" fill={ink} />;
    case 'trend':
      return (
        <path d="M9 21l4.5-5 3.5 3 6-7" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      );
    case 'guide':
      return (
        <>
          <circle cx="16" cy="11" r="1.7" fill={ink} />
          <path d="M16 14.5v8" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
        </>
      );
    case 'story':
      return (
        <>
          <path d="M10 9.5h5.2v13H10zM16.8 9.5H22v13h-5.2z" fill={ink} opacity="0.85" />
          <path d="M16 10v12" stroke={ink} strokeWidth="1.2" />
        </>
      );
    case 'reaction':
      return <path d="M17.5 8L11 17.5h4.5L14.5 24 21 14.5h-4.5z" fill={ink} />;
    case 'digit':
      return (
        <text x="16" y="21" textAnchor="middle" fontSize="12" fontWeight="700" fill={ink} fontFamily="Pretendard, system-ui, sans-serif">
          123
        </text>
      );
    case 'stroop':
      return (
        <>
          <circle cx="12.5" cy="13" r="3" fill="#2B5FD0" />
          <circle cx="19.5" cy="13" r="3" fill="#F4C464" />
          <circle cx="12.5" cy="20" r="3" fill="#67D39B" />
          <circle cx="19.5" cy="20" r="3" fill={ink} />
        </>
      );
    case 'storyDelayed':
      return (
        <>
          <path d="M11 12.5a4.5 4.5 0 0 1 8.6-1.6A3.5 3.5 0 0 1 21 17.5h-9a3 3 0 0 1-1-5z" fill={ink} />
          <circle cx="10.5" cy="21" r="1.4" fill={ink} />
          <circle cx="8.3" cy="23.5" r="0.9" fill={ink} />
        </>
      );
    case 'pattern':
      return (
        <>
          <rect x="9.5" y="9.5" width="6" height="6" rx="1" fill={ink} />
          <path d="M19.5 9.5l3 3-3 3-3-3z" fill={ink} />
          <circle cx="12.5" cy="19.5" r="3" fill={ink} />
          <path d="M16.5 22.5l3-6 3 6z" fill={ink} />
        </>
      );
    case 'vigilance':
      return (
        <>
          <path d="M6.5 8.5 L18 17.5 L16.5 19.5 Z" fill={ink} opacity="0.55" />
          <path d="M19.5 13.5l1.7 3.6 3.9.5-2.9 2.7.7 3.9-3.4-1.9-3.4 1.9.7-3.9-2.9-2.7 3.9-.5z" fill={ink} />
        </>
      );
    case 'pvt':
      return (
        <>
          <circle cx="16" cy="16" r="6.5" fill="none" stroke={ink} strokeWidth="2.2" />
          <circle cx="16" cy="16" r="2" fill={ink} />
        </>
      );
    default:
      return <></>;
  }
}

export default function Icon3D({ name, size = 28, className }: Icon3DProps) {
  const id = useId();
  const [light, dark] = ICON_SHADE[name];
  const round = name === 'play' || name === 'guide' || name === 'reaction' || name === 'vigilance' || name === 'pvt';
  const ink = '#0F141D';

  return (
    <svg
      className={className ? `icon-3d ${className}` : 'icon-3d'}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0.35" cy="0.2" r="0.6">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-drop`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${id}-drop)`}>
        {round
          ? <circle cx="16" cy="16" r="13" fill={`url(#${id}-body)`} />
          : <rect x="3" y="3" width="26" height="26" rx="8" fill={`url(#${id}-body)`} />}
        {round
          ? <circle cx="16" cy="16" r="13" fill={`url(#${id}-shine)`} />
          : <rect x="3" y="3" width="26" height="26" rx="8" fill={`url(#${id}-shine)`} />}
        {/* 아래쪽 어두운 띠로 두께를 만든다 */}
        {round
          ? <path d="M5.2 20a12 12 0 0 0 21.6 0 13 13 0 0 1-21.6 0z" fill="#000000" opacity="0.18" />
          : <rect x="3" y="22" width="26" height="7" rx="6" fill="#000000" opacity="0.18" />}
        <Glyph name={name} ink={ink} />
      </g>
    </svg>
  );
}
