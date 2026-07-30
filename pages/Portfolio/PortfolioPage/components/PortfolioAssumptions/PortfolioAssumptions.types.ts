export type PortfolioAssumptionConditionRow = { label: string; value: string };

export type PortfolioAssumptionsProps = {
  summaryLabel: string;
  rows: PortfolioAssumptionConditionRow[];
  isLoading: boolean;
  /** 세율 입력의 제어값(빈 문자열 중간 상태를 허용하려고 문자열로 쥔다). */
  taxInput: string;
  onTaxInputChange: (raw: string) => void;
  onTaxInputBlur: () => void;
  /**
   * 목표 카드의 조건 그룹(예상 달성 시점 계산 조건). **빈 배열이면 그룹 자체를 렌더하지 않는다**
   * (목표 미설정·카드 미노출과 같은 뜻).
   */
  goalConditionRows: PortfolioAssumptionConditionRow[];
};
