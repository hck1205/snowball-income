import type { ReactNode } from 'react';

/** 스트립 한 조각. `key` 는 React key 겸 테스트 앵커다. */
export type ConditionStripItem = {
  key: 'duration' | 'monthly' | 'initial' | 'tax' | 'reinvest' | 'tickers' | 'target' | 'mode';
  /** 화면·스크린리더에 그대로 나가는 **완성 문구**. 조각을 뷰에서 다시 조립하지 않는다. */
  text: string;
};

export type ConditionStripInput = {
  durationYears: number;
  monthlyContribution: number;
  initialInvestment: number;
  /** `undefined` = 미입력. 엔진은 이때 0% 를 적용한다(`toTaxRate`). */
  taxRatePercent: number | undefined;
  reinvestDividends: boolean;
  reinvestDividendPercent: number;
  targetMonthlyDividend: number;
  includedTickerCount: number;
  showQuickEstimate: boolean;
  /**
   * 표시 통화 인식 금액 포맷터. 호출부가 `formatResultAmount(value, true)`(compact)를 바인딩해 넘긴다 —
   * 여기서 새 포맷터를 만들면 달러 표시 모드에서 스트립만 원화로 남는다.
   */
  formatAmount: (won: number) => string;
};

export type ConditionStripProps = {
  items: ConditionStripItem[];
  /**
   * 우측 액션 슬롯("조건 수정" 버튼). 설정 진입점 3자리는 같은 접근성 계약
   * (`aria-controls`/`aria-expanded`)을 공유해야 해서 **버튼 자체는 페이지가 만들어 넣는다**
   * (이 폴더는 재사용 레이어라 `pages/` 를 import 할 수 없다).
   */
  action?: ReactNode;
};
