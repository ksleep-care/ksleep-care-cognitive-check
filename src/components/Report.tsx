import { calculateReport } from '../domain/scoring';
import type { SessionResults } from '../domain/types';

interface ReportProps {
  results: SessionResults;
  onRestart: () => void;
}

export default function Report({ results, onRestart }: ReportProps) {
  const report = calculateReport(results);
  const metrics = [
    { icon: '📖', label: '바로 기억한 내용', value: `${report.immediateMemoryPercent}%` },
    { icon: '💭', label: '기억 유지', value: `${report.memoryRetentionPercent}%` },
    { icon: '⚡', label: '평균 반응속도', value: `${report.reactionAverageMs}ms` },
    { icon: '🔢', label: '거꾸로 기억한 최대 길이', value: `${report.workingMemorySpan}자리` },
    { icon: '🎨', label: '색깔 단어 정확도', value: `${report.stroopAccuracyPercent}%` },
    { icon: '🎯', label: '패턴 매칭 정확도', value: `${report.patternAccuracyPercent}%` },
    { icon: '🌙', label: '별똥별 평균 반응', value: report.vigilanceAverageMs === null ? '측정 없음' : `${report.vigilanceAverageMs}ms` },
    { icon: '○', label: '별똥별 놓침', value: `${report.vigilanceMisses}회` },
  ];

  return (
    <section className="report-card" aria-labelledby="report-title">
      <p className="eyebrow">7개 활동 완료</p>
      <h1 id="report-title">오늘의 결과</h1>
      <p className="lead">점수는 오늘의 컨디션을 돌아보는 참고값이에요.</p>
      <div className="metric-list">
        {metrics.map((metric) => (
          <div className="metric-row" key={metric.label}>
            <span aria-hidden="true">{metric.icon}</span>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="notice-box">
        <p>ℹ️ 이 결과는 의료 진단이나 정상·비정상 판정이 아니에요.</p>
        <p>🔒 새로고침하거나 다시 시작하면 결과가 사라져요.</p>
      </div>
      <button className="primary-button" type="button" onClick={onRestart}>처음부터 다시 하기</button>
    </section>
  );
}
