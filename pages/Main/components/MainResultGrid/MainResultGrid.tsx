import { memo } from 'react';
import type { ReactNode } from 'react';
import { ResultGrid, ResultGridCell } from '@/components/common';
import type { MainResultGridProps } from './MainResultGrid.types';

type ResultCell = { key: string; span: number; node: ReactNode };

/**
 * 결과 카드 **배치 전용** 컴포넌트. 데이터도, 상태도, 스타일도 갖지 않는다 —
 * 어떤 카드가 어떤 폭으로 어떤 순서에 오는가만 안다.
 *
 * 🔴 **고아 칸 방지 규칙**: "월 평균 배당"은 조건부(목표 설정 또는 그래프 분할)라, 그 카드가 없는데
 * "포트폴리오 구성"이 5칸이면 우측 7칸이 빈 채로 남는다 → 짝이 없으면 12칸으로 편다.
 * 자산 가치·누적 배당은 항상 함께 오므로 6:6 고정이다.
 *
 * 순서(§Q6-4): 요약 → 배너 → [월평균 7 : 구성 5] → 월별 현금흐름 → 연도별 → [자산 6 : 누적 6]
 *             → 투자 종료 후 → 전량 매도.
 * "얼마 받나(시계열)"와 "무엇으로 받나(구성)"를 같은 행에 두는 것이 7:5 페어의 목적이고,
 * `MonthlyCashflow` 가 `YearlyResult` 보다 앞이라는 결정(2026-07-25)은 그대로다.
 */
function MainResultGridComponent({
  summary,
  financialIncomeBanner,
  monthlyAverageChart,
  composition,
  monthlyCashflow,
  yearlyResult,
  assetValueChart,
  cumulativeDividendChart,
  postInvestmentProjection,
  saleTax,
  emptyState
}: MainResultGridProps) {
  const compositionSpan = monthlyAverageChart ? 5 : 12;

  const layout: ResultCell[] = [
    { key: 'summary', span: 12, node: summary },
    { key: 'financial-income', span: 12, node: financialIncomeBanner },
    { key: 'monthly-average', span: 7, node: monthlyAverageChart },
    { key: 'composition', span: compositionSpan, node: composition },
    { key: 'monthly-cashflow', span: 12, node: monthlyCashflow },
    { key: 'yearly-result', span: 12, node: yearlyResult },
    { key: 'asset-value', span: 6, node: assetValueChart },
    { key: 'cumulative-dividend', span: 6, node: cumulativeDividendChart },
    { key: 'post-investment', span: 12, node: postInvestmentProjection },
    { key: 'sale-tax', span: 12, node: saleTax },
    { key: 'empty-state', span: 12, node: emptyState }
  ];

  const cells = layout.filter((cell) => Boolean(cell.node));

  if (cells.length === 0) return null;

  return (
    <ResultGrid>
      {cells.map((cell) => (
        <ResultGridCell key={cell.key} $span={cell.span}>
          {cell.node}
        </ResultGridCell>
      ))}
    </ResultGrid>
  );
}

const MainResultGrid = memo(MainResultGridComponent);

export default MainResultGrid;
