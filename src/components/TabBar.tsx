import { TAB_META, TAB_ORDER } from '../domain/session';
import type { TabKey } from '../domain/types';

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

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
            <span className="tab-icon" aria-hidden="true">{TAB_META[key].icon}</span>
            <span className="tab-label">{TAB_META[key].label}</span>
            <span className="tab-dot" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}
