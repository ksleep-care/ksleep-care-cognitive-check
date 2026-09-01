import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PvtReport from './PvtReport';
import { calculatePvtMetrics, type PvtQuality, type PvtTrial } from '../domain/pvt';
import type { BaselineComparison } from '../domain/baseline';

const trials: PvtTrial[] = [
  ...Array.from({ length: 40 }, () => ({ kind: 'response', rtMs: 260, driftMs: 2 }) as PvtTrial),
  { kind: 'response', rtMs: 420, driftMs: 2 },
  { kind: 'falseStart', rtMs: 60, driftMs: 2 },
];

const metrics = calculatePvtMetrics(trials);
const okQuality: PvtQuality = { ok: true, reasons: [] };

function renderReport(comparison: BaselineComparison, quality = okQuality, savedCount = 0) {
  render(
    <PvtReport
      metrics={metrics}
      quality={quality}
      comparison={comparison}
      savedCount={savedCount}
      onEnableBaseline={vi.fn()}
      onRetry={vi.fn()}
      onClose={vi.fn()}
    />,
  );
}

describe('의료 안전 경계', () => {
  it('연구 참고와 의료 기준이 아님을 함께 보여준다', () => {
    renderReport({ state: 'off' });

    expect(screen.getByRole('heading', { name: '연구 참고' })).toBeInTheDocument();
    expect(screen.getAllByText(/의료 기준이 아니에요/).length).toBeGreaterThan(0);
    expect(screen.getByText(/진단, 질환 위험, 정상·비정상 판정에 쓸 수 없어요/)).toBeInTheDocument();
  });

  it('또래 백분위·정상 판정·ADHD 점수를 만들지 않는다', () => {
    renderReport({ state: 'off' });

    // 부인 문구에는 단어가 나오므로, 실제로 값을 제시하는 형태가 없는지 본다.
    expect(screen.queryByText(/상위 \d+\s*%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/백분위\s*\d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/또래 평균\s*\d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/동년배/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ADHD/)).not.toBeInTheDocument();
    expect(screen.queryByText(/정상 범위/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/또래 평균이나 백분위를 만들지 않아요/).length).toBeGreaterThan(0);
  });

  it('355ms가 전용 기기 기준임을 밝히고 500ms와 섞지 않는다', () => {
    renderReport({ state: 'off' });

    expect(screen.getByText(/전용 측정기기에서 정한 값이에요/)).toBeInTheDocument();
    expect(screen.getByText(/10분 과제의 500ms 기준과 다른 값이에요/)).toBeInTheDocument();
  });

  it('출처 링크를 제공한다', () => {
    renderReport({ state: 'off' });
    expect(screen.getByRole('link', { name: /Basner 2011/ }))
      .toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/22025811/');
  });
});

describe('개인 기준선 층', () => {
  it('동의 전에는 무엇을 저장하는지 먼저 설명한다', () => {
    renderReport({ state: 'off' });
    expect(screen.getByText(/3분 측정의 요약값만/)).toBeInTheDocument();
    expect(screen.getByText(/같은 기기를 쓰는 다른 사람도 이 기록을 볼 수 있어요/)).toBeInTheDocument();
  });

  it('3회 미만이면 기준 만드는 중 n\/3을 보여준다', () => {
    renderReport({ state: 'building', have: 2, need: 3 }, okQuality, 3);
    expect(screen.getByText(/기준 만드는 중/)).toBeInTheDocument();
    // counter는 `나의 변화` 탭과 같은 숫자를 쓴다: 이번 결과까지 포함해 3번 저장됨.
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('기준이 준비되면 좋다·나쁘다 대신 방향과 크기만 말한다', () => {
    renderReport({
      state: 'ready',
      samples: 5,
      baselineMedianRtMs: 250,
      baselineLapses: 1,
      rtDeltaMs: 18,
      lapseDelta: -1,
    });

    expect(screen.getByText(/내 기준보다 18ms 느림/)).toBeInTheDocument();
    expect(screen.getByText(/내 기준보다 1회 적음/)).toBeInTheDocument();
    expect(screen.getByText(/좋다·나쁘다는 뜻은 아니고, 치료가 듣는지도 알려주지 않아요/))
      .toBeInTheDocument();
  });
});

describe('측정 품질', () => {
  it('품질 문제가 있으면 다시 측정을 권하고 기준선에 넣지 않았다고 알린다', () => {
    renderReport({ state: 'ready', samples: 3, baselineMedianRtMs: 250, baselineLapses: 1, rtDeltaMs: 0, lapseDelta: 0 },
      { ok: false, reasons: ['tabHidden'] } satisfies PvtQuality);

    expect(screen.getByRole('alert')).toHaveTextContent('다시 측정 권장');
    expect(screen.getByText(/측정 중 화면이 뒤로 넘어갔어요/)).toBeInTheDocument();
    expect(screen.getByText(/이번 측정은 품질 문제가 있어서 내 기준선에 넣지 않았어요/))
      .toBeInTheDocument();
  });
});
