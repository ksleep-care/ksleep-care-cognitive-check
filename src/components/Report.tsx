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
  const levelName = LEVEL_META[level].name;
  const cards = buildGameCards(report, levelName);

  return (
    <section className="report-card" aria-labelledby="report-title">
      <p className="eyebrow">{levelName} 코스 · 게임 7개 완료</p>
      <h1 id="report-title">오늘 한눈에 보기</h1>
      <p className="lead">
        아래는 <strong>게임 기록</strong>이에요. 검사 점수가 아니라, 같은 난이도에서
        내 기록이 어떻게 달라지는지 보는 값이에요.
      </p>

      <MetricList cards={cards} />

      <div className="notice-box">
        <p>의료 진단이나 정상·비정상 판정이 아니에요.</p>
        <p>이 게임들에는 연령별 기준값이 없어서 또래 평균이나 백분위를 만들지 않아요.</p>
        <p>게임 기록은 저장하지 않아요. 이 화면을 벗어나면 사라져요.</p>
      </div>

      <div className="report-actions">
        <button className="lime-button" type="button" onClick={onRestart}>
          {levelName}로 한 판 더 · 5분
        </button>

        <button className="pvt-row" type="button" onClick={onGoPvt}>
          <span className="pvt-row-title">3분 집중 측정</span>
          <span className="pvt-row-note">내 기준선 만들기</span>
          <span className="pvt-row-arrow" aria-hidden="true">→</span>
        </button>

        <button className="quiet-button" type="button" onClick={onClose}>
          플레이로 돌아가기
        </button>
      </div>
    </section>
  );
}
