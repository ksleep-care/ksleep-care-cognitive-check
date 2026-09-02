import Icon3D from '../ui/Icon3D';
import { TAB_META, TAB_ORDER } from '../domain/session';
import type { TabKey } from '../domain/types';

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

/** 탭 아이콘은 이모지가 아니라 SVG(Icon3D)다. 이모지는 기기마다 그림이 달라 일관성이 깨진다. */

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
            <Icon3D name={key} size={24} className="tab-icon" />
            <span className="tab-label">{TAB_META[key].label}</span>
            <span className="tab-dot" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}
