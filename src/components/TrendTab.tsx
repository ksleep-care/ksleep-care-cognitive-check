import { useState } from 'react';
import { BASELINE_MIN_ENTRIES, type BaselineStore } from '../domain/baseline';
import { PVT_LIMITS } from '../domain/pvtReport';
import { PVT_PROTOCOL_VERSION } from '../domain/pvt';

interface TrendTabProps {
  store: BaselineStore | null;
  onEnable: () => void;
  onClearAll: () => void;
  onStartPvt: () => void;
}

function formatDate(epochMs: number): string {
  const date = new Date(epochMs);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TrendTab({ store, onEnable, onClearAll, onStartPvt }: TrendTabProps) {
  // 브라우저 기본 confirm 창은 화면을 막고 스타일도 맞지 않아 앱 안에서 한 번 더 묻는다.
  const [confirming, setConfirming] = useState(false);
  if (store === null) {
    return (
      <div className="tab-panel">
        <h1 className="panel-title">나의 변화</h1>
        <section className="hero-card">
          <p className="eyebrow">아직 기록이 없어요</p>
          <h2>3분 측정을 {BASELINE_MIN_ENTRIES}번 하면 내 기준이 생겨요</h2>
          <p className="lead">
            측정이 끝나면 결과 화면에서 저장을 켤 수 있어요. 켜기 전까지는 아무것도 남기지 않아요.
          </p>
          <button className="primary-button" type="button" onClick={onStartPvt}>3분 측정 하기</button>
        </section>
        <div className="consent-card">
          <h2>먼저 저장을 켜 둘 수도 있어요</h2>
          <p>
            켜면 <strong>3분 측정의 요약값만</strong> 이 브라우저에 남겨요 —
            반응시간 중앙값, 놓친 순간 수, 너무 이른 누름 수, 수행 점수, 측정 시각, 측정 방식 버전.
          </p>
          <p>
            이름·연락처·생년월일·환자번호·게임 답안·매 회 반응 기록은 저장하지 않아요.
            서버로 보내지 않고, 계정도 쿠키도 만들지 않아요.
          </p>
          <p className="warn-line">
            이 기기에만 저장돼요. 같은 기기를 쓰는 다른 사람도 이 기록을 볼 수 있어요.
          </p>
          <button className="ghost-button" type="button" onClick={onEnable}>
            이 기기에 나의 변화 저장
          </button>
        </div>
      </div>
    );
  }

  const usable = store.entries.filter((entry) => entry.protocol === PVT_PROTOCOL_VERSION);
  const recent = [...usable].reverse();

  return (
    <div className="tab-panel">
      <h1 className="panel-title">나의 변화</h1>

      {usable.length < BASELINE_MIN_ENTRIES ? (
        <section className="hero-card">
          <p className="eyebrow">기준 만드는 중</p>
          <h2>{usable.length} / {BASELINE_MIN_ENTRIES}</h2>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${(usable.length / BASELINE_MIN_ENTRIES) * 100}%` }} />
          </div>
          <p className="lead">
            같은 방식으로 {BASELINE_MIN_ENTRIES}번 측정하면 그때부터 내 기준과 비교해서 보여줘요.
          </p>
          <button className="primary-button" type="button" onClick={onStartPvt}>3분 측정 하기</button>
        </section>
      ) : (
        <section className="hero-card">
          <p className="eyebrow">기준 준비됨</p>
          <h2>지금까지 {usable.length}번</h2>
          <p className="lead">측정할 때마다 최근 5번의 가운데 값과 비교해서 보여줘요.</p>
          <button className="primary-button" type="button" onClick={onStartPvt}>3분 측정 하기</button>
        </section>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="history-title">
          <h2 id="history-title" className="section-title">최근 기록</h2>
          <ul className="history-list">
            {recent.map((entry) => (
              <li key={entry.completedAt}>
                <span className="history-date">{formatDate(entry.completedAt)}</span>
                <span className="history-metric">{entry.medianRtMs}ms</span>
                <span className="history-metric">놓침 {entry.lapses}회</span>
                <span className="history-metric">{entry.performanceScore}점</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="notice-box">
        <p>이 기기에만 저장돼요. 같은 기기를 쓰는 다른 사람도 이 기록을 볼 수 있어요.</p>
        <p>서버로 보내지 않아요. 계정도 쿠키도 만들지 않아요.</p>
        {PVT_LIMITS.map((limit) => <p key={limit}>{limit}</p>)}
      </div>

      {confirming ? (
        <div className="confirm-card" role="alertdialog" aria-labelledby="clear-title">
          <h2 id="clear-title">이 기기에 저장된 기록을 모두 지울까요?</h2>
          <p>되돌릴 수 없어요. 지우면 기준선도 처음부터 다시 만들어요.</p>
          <button
            className="danger-button"
            type="button"
            onClick={() => { setConfirming(false); onClearAll(); }}
          >
            네, 모두 지울게요
          </button>
          <button className="quiet-button" type="button" onClick={() => setConfirming(false)}>
            취소
          </button>
        </div>
      ) : (
        <button className="danger-button" type="button" onClick={() => setConfirming(true)}>
          내 기록 모두 삭제
        </button>
      )}
    </div>
  );
}
