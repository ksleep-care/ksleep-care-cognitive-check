import MetricList from './MetricList';
import { PVT_QUALITY_MESSAGE, type PvtMetrics, type PvtQuality } from '../domain/pvt';
import { PVT_LIMITS, PVT_SOURCES, buildPvtCards } from '../domain/pvtReport';
import { BASELINE_MIN_ENTRIES, type BaselineComparison } from '../domain/baseline';

interface PvtReportProps {
  metrics: PvtMetrics;
  quality: PvtQuality;
  comparison: BaselineComparison;
  /** 이번 결과까지 포함해 지금 저장돼 있는 유효 측정 횟수. `나의 변화` 탭과 같은 숫자다. */
  savedCount: number;
  /** 저장에 동의하지 않은 상태에서만 물어본다. */
  onEnableBaseline: () => void;
  onRetry: () => void;
  onClose: () => void;
}

function BaselineLayer({ comparison, savedCount, quality, onEnableBaseline }: {
  comparison: BaselineComparison;
  savedCount: number;
  quality: PvtQuality;
  onEnableBaseline: () => void;
}) {
  if (!quality.ok) {
    return (
      <p className="layer-note">
        이번 측정은 품질 문제가 있어서 내 기준선에 넣지 않았어요.
      </p>
    );
  }

  if (comparison.state === 'off') {
    return (
      <div className="consent-card">
        <h3>이 기기에 나의 변화 저장할까요?</h3>
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
        <button className="primary-button" type="button" onClick={onEnableBaseline}>
          이 기기에 나의 변화 저장
        </button>
        <p className="layer-note">지금 켜지 않아도 측정은 계속 할 수 있어요.</p>
      </div>
    );
  }

  if (comparison.state === 'building') {
    return (
      <div className="baseline-building">
        <p className="baseline-progress">
          기준 만드는 중 <strong>{savedCount} / {comparison.need}</strong>
        </p>
        <div className="progress-track" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(1, savedCount / comparison.need) * 100}%` }}
          />
        </div>
        <p className="layer-note">
          같은 방식으로 {BASELINE_MIN_ENTRIES}번 모이면 그다음 측정부터 내 기준과 비교해서 보여줘요.
        </p>
      </div>
    );
  }

  const rt = comparison.rtDeltaMs;
  const lapse = comparison.lapseDelta;

  return (
    <div className="baseline-ready">
      <p className="baseline-line">
        <span className="baseline-label">반응시간</span>
        <strong>
          {rt === 0 ? '내 기준과 같음' : `내 기준보다 ${Math.abs(rt)}ms ${rt > 0 ? '느림' : '빠름'}`}
        </strong>
      </p>
      <p className="baseline-line">
        <span className="baseline-label">놓친 순간</span>
        <strong>
          {lapse === 0 ? '내 기준과 같음' : `내 기준보다 ${Math.abs(lapse)}회 ${lapse > 0 ? '많음' : '적음'}`}
        </strong>
      </p>
      <p className="layer-note">
        기준값은 최근 {comparison.samples}번 측정의 가운데 값이에요
        (반응시간 {comparison.baselineMedianRtMs}ms, 놓친 순간 {comparison.baselineLapses}회).
        차이가 좋다·나쁘다는 뜻은 아니고, 치료가 듣는지도 알려주지 않아요.
      </p>
    </div>
  );
}

export default function PvtReport({
  metrics,
  quality,
  comparison,
  savedCount,
  onEnableBaseline,
  onRetry,
  onClose,
}: PvtReportProps) {
  return (
    <section className="report-card" aria-labelledby="pvt-report-title">
      <p className="eyebrow">3분 집중 측정 완료</p>
      <h1 id="pvt-report-title">오늘 한눈에 보기</h1>

      {!quality.ok && (
        <div className="quality-warning" role="alert">
          <p className="quality-headline">다시 측정 권장</p>
          <ul>
            {quality.reasons.map((reason) => (
              <li key={reason}>{PVT_QUALITY_MESSAGE[reason]}</li>
            ))}
          </ul>
          <p>이번 값은 측정이 제대로 되지 않았을 수 있어서 기준선에 넣지 않았어요.</p>
        </div>
      )}

      <div className="summary-strip">
        <div>
          <span>반응시간 중앙값</span>
          <strong>{metrics.medianRtMs === null ? '—' : `${metrics.medianRtMs}ms`}</strong>
        </div>
        <div>
          <span>놓친 순간</span>
          <strong>{metrics.lapses}회</strong>
        </div>
        <div>
          <span>자극 수</span>
          <strong>{metrics.stimuli}개</strong>
        </div>
      </div>

      <h2 className="layer-title">내 기준선과 비교</h2>
      <BaselineLayer
        comparison={comparison}
        savedCount={savedCount}
        quality={quality}
        onEnableBaseline={onEnableBaseline}
      />

      <h2 className="layer-title">연구 참고</h2>
      <p className="layer-note">
        아래 설명은 같은 방식의 3분 과제에서 지표가 어떻게 움직이는지에 대한 <strong>연구 참고</strong>예요.
        <strong> 의료 기준이 아니에요.</strong>
      </p>
      <MetricList cards={buildPvtCards(metrics)} />

      <div className="notice-box">
        {PVT_LIMITS.map((limit) => <p key={limit}>{limit}</p>)}
      </div>

      <details className="sources">
        <summary>이 설명의 출처</summary>
        <ul>
          {PVT_SOURCES.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer noopener">{source.label}</a>
            </li>
          ))}
        </ul>
      </details>

      <div className="report-actions">
        <button className="primary-button" type="button" onClick={onRetry}>다시 측정</button>
        <button className="quiet-button" type="button" onClick={onClose}>홈으로</button>
      </div>
    </section>
  );
}
