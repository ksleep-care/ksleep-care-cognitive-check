import type { MetricCard } from '../domain/types';

interface MetricListProps {
  cards: MetricCard[];
}

/** 숫자만 나열하지 않는다. 무엇을 본 과제인지 · 이번 값 · 읽는 방향 · 비교 범위 · 한계를 함께 준다. */
export default function MetricList({ cards }: MetricListProps) {
  return (
    <ul className="metric-list">
      {cards.map((card) => (
        <li className="metric-card" key={card.key}>
          <div className="metric-head">
            <span className="metric-icon" aria-hidden="true">{card.icon}</span>
            <h3>{card.title}</h3>
            <strong className="metric-value">{card.value}</strong>
          </div>
          <dl className="metric-body">
            <div>
              <dt>무엇을 보나요</dt>
              <dd>{card.looksAt}</dd>
            </div>
            <div>
              <dt>어떻게 읽나요</dt>
              <dd>{card.direction}</dd>
            </div>
            <div>
              <dt>무엇과 비교하나요</dt>
              <dd>{card.comparable}</dd>
            </div>
            <div>
              <dt>한계</dt>
              <dd>{card.limit}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
