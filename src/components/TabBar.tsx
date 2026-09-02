import type { JSX } from 'react';
import { TAB_META, TAB_ORDER } from '../domain/session';
import type { TabKey } from '../domain/types';

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

/**
 * 탭 아이콘은 이모지가 아니라 도형 SVG다.
 * 이모지는 기기마다 그림이 달라 UI 아이콘으로 쓰면 일관성이 깨진다.
 */
const TAB_ICON: Record<TabKey, JSX.Element> = {
  play: (
    <polygon points="4,3 15,9 4,15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  ),
  trend: (
    <polyline
      points="2,13 6.5,8 10,11 16,4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  guide: (
    <>
      <circle cx="9" cy="9" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <line x1="9" y1="8" x2="9" y2="12.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="5.6" r="1" fill="currentColor" />
    </>
  ),
};

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="주요 화면">
      {TAB_ORDER.map((key) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            className={`tab-button${isActive ? ' is-active' : ''}`}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(key)}
          >
            <svg className="tab-icon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              {TAB_ICON[key]}
            </svg>
            <span className="tab-label">{TAB_META[key].label}</span>
            <span className="tab-dot" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}
