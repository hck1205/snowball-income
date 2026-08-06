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
  /**
   * 결과 카드 **바로 아래**의 1차 조정 줄(월 적립·기간·목표). 요약 다음 자리인 이유는
   * "지금 본 숫자를 그 자리에서 바꾼다"가 이 앱의 핵심 루프이기 때문이다 —
   * 조정과 결과가 한 화면에 있어야 조정↔확인이 성립한다.
   */
  quickAdjust?: ReactNode;
  /** 금융소득종합과세 안내 배너. 리드 막의 마지막 칸이다(경고는 막 안으로 들어가지 않는다). */
  financialIncomeBanner?: ReactNode;
  /** 월 평균 배당 차트(목표선·도달 마커 포함). 막 01 의 마지막 칸. */
  monthlyAverageChart?: ReactNode;
  /** 포트폴리오 구성(파이 + 비중). 막 01 의 첫 칸. */
  composition?: ReactNode;
  monthlyCashflow?: ReactNode;
  yearlyResult?: ReactNode;
  assetValueChart?: ReactNode;
  cumulativeDividendChart?: ReactNode;
  /** 투자 종료 후 배당 추정. 막 03 에서 `saleTax` 와 7:5 로 한 행을 나눠 쓴다. */
  postInvestmentProjection?: ReactNode;
  /** "전량 매도한다면" 부속 카드. 간략 모드에서는 오지 않고, 그때 짝이 전 폭으로 펴진다. */
  saleTax?: ReactNode;
  /** 결과가 없을 때의 화면(포트폴리오 프리셋 보드). */
  emptyState?: ReactNode;
};
