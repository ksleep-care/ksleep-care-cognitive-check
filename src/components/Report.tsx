import Icon3D from '../ui/Icon3D';
import MetricTable, { MetricGlossary } from './MetricTable';
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
        <strong>게임 기록</strong>이에요. 검사 점수가 아니라 같은 난이도에서 내 기록이 어떻게 달라지는지 보는 값이에요.
      </p>

      <MetricTable cards={cards} />
      <MetricGlossary cards={cards} />

      <p className="boundary-line">
        의료 진단이나 정상·비정상 판정이 아니에요 · 연령별 기준값이 없어 또래 평균이나 백분위를 만들지 않아요 ·
        게임 기록은 저장하지 않아요. 이 화면을 벗어나면 사라져요.
      </p>

      <div className="report-actions">
        <p className="next-step-note">워밍업이 끝났어요. 내 기준선은 3분 집중 측정으로만 만들어져요.</p>
        <button className="lime-button" type="button" onClick={onGoPvt}>
          3분 집중 측정 시작
        </button>

        <button className="pvt-row" type="button" onClick={onRestart}>
          <Icon3D name="play" size={28} />
          <span className="pvt-row-title">{levelName}로 한 판 더</span>
          <span className="pvt-row-note">게임 7개 · 5분</span>
          <span className="pvt-row-arrow" aria-hidden="true">→</span>
        </button>

        <button className="quiet-button" type="button" onClick={onClose}>
          플레이로 돌아가기
        </button>
      </div>
    </section>
  );
}
