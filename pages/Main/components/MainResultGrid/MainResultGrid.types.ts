import type { ReactNode } from 'react';

/**
 * 결과 카드 슬롯. **전부 옵셔널**이고, 값이 없으면 그 칸은 아예 렌더되지 않는다
 * (빈 셀이 그리드에 구멍을 내지 않게).
 *
 * 카드가 늘어나면 여기에 슬롯 하나 + `MainResultGrid.tsx` 의 배치표에 줄 하나만 추가하면 된다 —
 * 폭 규칙이 카드마다 흩어지지 않는 것이 이 컴포넌트의 존재 이유다.
 */
export type MainResultGridProps = {
  /** 결과 요약(hero + 지표 타일 + 조건 스트립). */
  summary?: ReactNode;
  /** 금융소득종합과세 안내 배너. */
  financialIncomeBanner?: ReactNode;
  /** 월 평균 배당 차트(목표선·도달 마커 포함). 조건부라 아래 구성 카드의 폭을 좌우한다. */
  monthlyAverageChart?: ReactNode;
  /** 포트폴리오 구성(파이 + 비중). */
  composition?: ReactNode;
  monthlyCashflow?: ReactNode;
  yearlyResult?: ReactNode;
  assetValueChart?: ReactNode;
  cumulativeDividendChart?: ReactNode;
  postInvestmentProjection?: ReactNode;
  /** "전량 매도한다면" 부속 카드. */
  saleTax?: ReactNode;
  /** 결과가 없을 때의 화면(포트폴리오 프리셋 보드). */
  emptyState?: ReactNode;
};
