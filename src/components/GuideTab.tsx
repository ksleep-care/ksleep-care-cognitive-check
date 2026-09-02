import Icon3D from '../ui/Icon3D';
import { GAME_META, GAME_ORDER } from '../domain/session';
import { PVT_LAPSE_MS, PVT_SCORED_DURATION_MS } from '../domain/pvt';
import { PVT_LIMITS, PVT_SOURCES } from '../domain/pvtReport';

const MINUTES = Math.round(PVT_SCORED_DURATION_MS / 60_000);

export default function GuideTab() {
  return (
    <div className="tab-panel">
      <h1 className="panel-title">게임 안내</h1>
      <p className="lead">
        게임 7개는 인지·주의 연구에서 오래 쓰인 과제 형식을 가져와 짧게 다듬은 거예요.
        각 게임이 <strong>어디서 왔는지</strong>, 무엇을 보는지, 그리고 <strong>무엇을 말할 수 없는지</strong>를 같이 적었어요.
        형식은 같지만 점수는 그 검사들과 비교할 수 없어요.
      </p>

      <section className="guide-card guide-card-measure" aria-labelledby="guide-pvt">
        <div className="guide-head">
          <Icon3D name="pvt" size={32} />
          <h2 id="guide-pvt">{MINUTES}분 집중 측정</h2>
        </div>
        <p>
          <strong>왜 하나요</strong> · 정신운동 각성 검사(PVT)의 3분 판 형식이에요. 잠이 부족하거나 피로하면
          반응이 느려지고 놓치는 순간이 늘어나는 변화를 가장 민감하게 잡아내는 과제라, 수면 연구와
          우주비행사 피로 연구에서 표준처럼 써 왔어요. 반복해도 익숙해져서 잘해지는 효과가 거의 없어요.
        </p>
        <p><strong>무엇을 보나요</strong> · 아무 예고 없이 뜨는 신호에 얼마나 일정하게 반응하는지를 봐요.</p>
        <p>
          <strong>어떻게 만들었나요</strong> · 3분 PVT-B 연구 프로토콜의 측정 계약을 그대로 옮겼어요.
          자극 간격 2~4초, 100ms 미만은 너무 이른 누름, {PVT_LAPSE_MS}ms 이상은 놓친 순간으로 셉니다.
        </p>
        <p>
          <strong>한계</strong> · {PVT_LAPSE_MS}ms는 논문이 <em>전용 측정기기</em>에서 정한 값이에요.
          브라우저는 화면과 입력 지연이 달라서 ms 숫자를 논문 수치와 직접 비교하지 않아요.
          10분짜리 과제의 500ms 기준과도 섞지 않아요.
        </p>
        <details className="sources">
          <summary>출처</summary>
          <ul>
            {PVT_SOURCES.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer noopener">{source.label}</a>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <h2 className="section-title">게임 {GAME_ORDER.length}개</h2>
      <ul className="guide-list">
        {GAME_ORDER.map((key) => {
          const meta = GAME_META[key];
          return (
            <li className="guide-row" key={key}>
              <div className="guide-head">
                <Icon3D name={key} size={28} />
                <h3>{meta.title}</h3>
                <span className="guide-meta">
                  {meta.scalesWithLevel ? '난이도 적용' : '난이도 고정'}
                </span>
              </div>
              <p className="guide-basis">{meta.basis}</p>
              <details className="guide-detail">
                <summary>무엇을 보고 무엇을 못 보나요</summary>
                <p><strong>무엇을 보나요</strong> · {meta.looksAt}</p>
                <p><strong>한계</strong> · {meta.limit}</p>
              </details>
            </li>
          );
        })}
      </ul>

      <div className="notice-box">
        <p>이 앱은 어떤 게임도 진단·선별·치료 판단에 쓰지 않아요.</p>
        {PVT_LIMITS.map((limit) => <p key={limit}>{limit}</p>)}
      </div>
    </div>
  );
}
