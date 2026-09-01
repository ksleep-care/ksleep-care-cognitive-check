import MetricList from './MetricList';
import { buildGameCards, calculateReport } from '../domain/scoring';
import { LEVEL_META } from '../domain/session';
import type { Level, SessionResults } from '../domain/types';

interface ReportProps {
  results: SessionResults;
  level: Level;
  onRestart: () => void;
  onGoPvt: () => void;
  onClose: () => void;
}

export default function Report({ results, level, onRestart, onGoPvt, onClose }: ReportProps) {
  const report = calculateReport(results);
  const cards = buildGameCards(report, LEVEL_META[level].name);

  return (
    <section className="report-card" aria-labelledby="report-title">
      <p className="eyebrow">게임 7개 완료 · {LEVEL_META[level].icon} {LEVEL_META[level].name}</p>
      <h1 id="report-title">오늘 한눈에 보기</h1>
      <p className="lead">
        아래는 <strong>게임 기록</strong>이에요. 검사 점수가 아니라, 같은 레벨에서
        내 기록이 어떻게 달라지는지 보는 값이에요.
      </p>

      <MetricList cards={cards} />

      <div className="notice-box">
        <p>ℹ️ 의료 진단이나 정상·비정상 판정이 아니에요.</p>
        <p>📏 이 게임들에는 연령별 기준값이 없어서 또래 평균이나 백분위를 만들지 않아요.</p>
        <p>🔒 게임 기록은 저장하지 않아요. 이 화면을 벗어나면 사라져요.</p>
      </div>

      <div className="report-actions">
        <button className="primary-button" type="button" onClick={onGoPvt}>
          3분 집중 측정도 해보기
        </button>
        <button className="ghost-button" type="button" onClick={onRestart}>같은 레벨로 한 판 더</button>
        <button className="quiet-button" type="button" onClick={onClose}>홈으로</button>
      </div>
    </section>
  );
}
