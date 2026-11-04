import Icon3D, { ICON_SHADE, type IconName } from '../ui/Icon3D';
import type { MetricCard } from '../domain/types';

interface MetricTableProps {
  cards: MetricCard[];
}

/** "83% 맞음"처럼 앞에 백분율이 있으면 그 숫자. 없으면 null. */
function percentOf(value: string): number | null {
  const match = /^(\d{1,3})%/.exec(value);
  return match === null ? null : Math.min(100, Number(match[1]));
}

/**
 * 게임 7개 결과를 한 화면에 들어오는 표로 보여준다.
 *
 * 줄마다 아이콘 · 이름 · 값. 값의 색은 그 게임 아이콘의 색이라 좋고 나쁨을 뜻하지 않는다.
 * 백분율 값에는 같은 색의 가는 선을 두어 비율이 눈에 들어오게 한다.
 * 읽는 법·비교 범위·한계는 표 아래 한 곳에 접어 둔다(`MetricGlossary`).
 */
export default function MetricTable({ cards }: MetricTableProps) {
  return (
    <ul className="metric-table">
      {cards.map((card) => {
        const name = card.key as IconName;
        const color = ICON_SHADE[name][0];
        const percent = percentOf(card.value);
        return (
          <li className="metric-tr" key={card.key}>
            <Icon3D name={name} size={28} />
            <span className="metric-td-title">{card.title}</span>
            <span className="metric-td-value" style={{ color }}>
              {card.value}
              {percent !== null && (
                <span className="metric-bar" aria-hidden="true">
                  <span className="metric-bar-fill" style={{ width: `${percent}%`, background: color }} />
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** 표 아래 접어 두는 설명. 값은 다시 적지 않는다. */
export function MetricGlossary({ cards }: MetricTableProps) {
  return (
    <details className="sources metric-glossary">
      <summary>각 값을 어떻게 읽나요</summary>
      <dl className="metric-glossary-body">
        {cards.map((card) => (
          <div key={card.key}>
            <dt>{card.title}</dt>
            <dd>
              {card.looksAt} {card.direction} {card.comparable} {card.limit}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
