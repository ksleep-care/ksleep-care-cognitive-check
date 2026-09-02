import type { MetricCard } from '../domain/types';

interface MetricListProps {
  cards: MetricCard[];
}

/**
 * 게임 7개는 모두 같은 위계다. 카드를 일곱 번 반복하지 않고 실선으로만 나눈다.
 *
 * 값은 바로 보이고, 읽는 법·비교 범위·한계는 접어 둔다.
 * 우리 값은 정밀한 검사 점수가 아니므로 설명을 화면 가득 펼쳐 두면
 * 실제보다 정확해 보인다. 필요한 사람만 펴서 보게 한다.
 */
export default function MetricList({ cards }: MetricListProps) {
  return (
    <ul className="metric-list">
      {cards.map((card) => (
        <li className="metric-row" key={card.key}>
          <div className="metric-head">
            <h3>{card.title}</h3>
            <strong className="metric-value">{card.value}</strong>
          </div>
          <details className="metric-detail">
            <summary>이 값을 어떻게 읽나요</summary>
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
          </details>
        </li>
      ))}
    </ul>
  );
}
