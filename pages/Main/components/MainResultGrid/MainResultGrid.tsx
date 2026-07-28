import { memo } from 'react';
import type { ReactNode } from 'react';
import { ResultGrid, ResultGridCell } from '@/components/common';
import type { MainResultGridProps } from './MainResultGrid.types';

type ResultCell = { key: string; span: number; node: ReactNode };

/**
 * 결과 카드 **배치 전용** 컴포넌트. 데이터도, 상태도, 스타일도 갖지 않는다 —
 * 어떤 카드가 어떤 폭으로 어떤 순서에 오는가만 안다.
 *
 * 순서: 요약 → 배너 → **포트폴리오 구성 → 실지급 월별 배당 → 월 평균 배당** → 연도별
 *      → [자산 6 : 누적 6] → 투자 종료 후 → 전량 매도.
 * 가운데 세 카드의 순서는 2026-07-28 사용자 지정이다 — "무엇으로 받나(구성) → 실제로 언제 얼마
 * 들어오나(실지급) → 장기 추이(월 평균)" 로 **가까운 사실에서 먼 추정으로** 내려간다.
 * `MonthlyCashflow` 가 `YearlyResult` 보다 앞이라는 결정(2026-07-25)도 그대로 지켜진다.
 *
 * **한 행에 두 카드를 묶는 페어는 자산 가치 : 누적 배당(6:6) 하나뿐이다.** 둘은 같은 시간축의 같은
 * 그래프 두 장이라 나란히 놓아야 비교가 되고, 항상 함께 오므로 고아 칸도 생기지 않는다.
 * "월 평균 배당 : 포트폴리오 구성"은 한때 7:5 페어였지만 **각자 전 폭**으로 되돌렸다
 * (2026-07-28 사용자 결정) — 차트와 비중 슬라이더는 각자 가로 폭을 다 쓸수록 읽기 쉽고,
 * 월평균은 조건부 카드라 짝이 없으면 우측 7칸이 비는 고아 칸 문제를 계속 안고 있었다.
 * 전 폭 카드만 남으므로 폭 계산 분기도 필요 없다.
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
  const layout: ResultCell[] = [
    { key: 'summary', span: 12, node: summary },
    { key: 'financial-income', span: 12, node: financialIncomeBanner },
    { key: 'composition', span: 12, node: composition },
    { key: 'monthly-cashflow', span: 12, node: monthlyCashflow },
    { key: 'monthly-average', span: 12, node: monthlyAverageChart },
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
