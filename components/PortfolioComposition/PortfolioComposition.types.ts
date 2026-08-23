import type { ComponentType } from 'react';
import type { EChartsOption } from 'echarts';
import type { TickerProfile } from '@/shared/types/snowball';

/** 한 종목의 배분을 "몇 주 · 얼마 · 월 얼마"로 읽은 것. 페이지 계층이 만들어 내려준다. */
export type AllocationHoldingView = {
  /** `null` = 환율이 없어 **낼 수 없다**(0주가 아니다). 이때 수량 입력은 잠기고 사유가 붙는다. */
  shares: number | null;
  amount: number;
  /** 이 보유량 기준 월 배당(세후, 원). **시작 시점** 값이다 — 결과 카드의 '예상 월배당'과 다른 질문이다. */
  monthlyDividend: number;
};

export type AllocationHoldingsView = {
  byTickerId: Record<string, AllocationHoldingView>;
  totalAmount: number;
  totalMonthlyDividend: number;
  /** 주식 수를 못 낸 종목이 있는가 — 사유 안내를 띄우는 조건. */
  hasUnpricedShares: boolean;
  /** 환율이 실제로 곱해졌는가 — "환율 N원 적용"을 밝히는 조건. */
  usesFxRate: boolean;
};

export type PortfolioCompositionProps = {
  includedProfiles: TickerProfile[];
  normalizedAllocation: Array<{ profile: TickerProfile; weight: number }>;
  allocationPieOption: EChartsOption | null;
  allocationPercentByTickerId: Record<string, number>;
  fixedByTickerId: Record<string, boolean>;
  adjustableTickerCount: number;
  onSetTickerWeight: (profileId: string, value: number) => void;
  /**
   * 종목의 **보유 주식 수**를 직접 정한다. 슬라이더와 같은 배분을 반대 방향에서 만지는 입력이라
   * (절대량 → 총액·비중), 이 호출 뒤에는 총 투자금도 함께 움직인다.
   */
  onSetTickerShares: (profileId: string, shares: number) => void;
  holdings: AllocationHoldingsView;
  /**
   * 금액 표기. 표시 통화(원/달러) 전환을 이미 반영한 포맷터를 페이지가 내려준다.
   *
   * 🔴 **정밀 포맷터여야 한다.** `약 2.2억` 같은 간략 표기를 물리면 억 구간이 1,000만원 단위로
   *    반올림돼 100주를 고쳐도 숫자가 그대로 선다 — 입력 옆의 숫자는 "내 입력이 반영됐다"는 증거라
   *    그 순간 입력이 고장 난 것처럼 보인다(2026-08-23 사용자 신고).
   */
  formatAmount: (value: number) => string;
  /** 주식 수 환산에 쓴 환율(1 USD = N KRW). 화면은 근거로 밝히기만 한다. `null` 이면 미조회다. */
  fxRate: number | null;
  onToggleTickerFixed: (profileId: string) => void;
  onClearAllFixed: () => void;
  onRemoveIncludedTicker: (profileId: string) => void;
  /** 달러 표시 중일 때 차트 `aria-label` 에 붙는 접미 — 파이 중앙의 월배당이 달러로 바뀌므로 여기도 알린다. */
  chartLabelSuffix?: string;
  ResponsiveChart: ComponentType<{ option: EChartsOption; replaceMerge?: string[] }>;
};
