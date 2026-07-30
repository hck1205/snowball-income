import { normalizePortfolioQuantity, normalizePortfolioTicker } from '@/shared/lib/portfolio';
import type { PortfolioHolding, PortfolioManualMarketInput } from '@/shared/lib/portfolio';

/**
 * 보유 목록 행 ↔ 계산 엔진 입력 사이의 순수 변환.
 *
 * `usePortfolioHoldings`(저장·편집·실행취소 같은 부수효과)에서 분리해 둔다 — 여기 있는 함수는
 * 전부 인자만으로 결정되는 순수 매핑이라, 훅의 상태 관리 로직과 같은 파일에 있을 이유가 없다.
 */

/**
 * 화면이 그리는 보유 1행.
 *
 * `quantity` 와 `quantityInput` 이 **둘 다** 있는 이유: 저장·계산은 정규화된 숫자를 쓰지만,
 * 입력창은 사용자가 친 문자열 그대로여야 한다(`"1."` 을 숫자로 되돌리면 소수점을 못 찍는다).
 */
export type PortfolioHoldingRow = {
  /** 대문자·트림된 심볼. */
  ticker: string;
  /** 정규화된 수량. **`null` = 미입력**(에러가 아니다 — 행은 유지되고 합계에서만 빠진다). */
  quantity: number | null;
  /** `QuantityInput` 제어값. 저장하지 않는다(세션 안에서만 산다). */
  quantityInput: string;
  /** 유니버스 밖 종목의 수동 시장 정보(USD). */
  manual?: PortfolioManualMarketInput;
};

export type PortfolioHoldingsStatus = 'loading' | 'ready' | 'read-error';

/** 정규화 수량 → 입력창 문자열. 미입력은 빈 문자열이다(`0` 을 찍으면 지우고 다시 치게 된다). */
export const toQuantityInputValue = (quantity: number | null): string => (quantity === null ? '' : String(quantity));

/**
 * 행 → 계산 엔진 입력.
 *
 * M0 의 `PortfolioHolding.quantity` 는 `number` 필수라 **미입력을 `0` 으로 옮긴다** —
 * `normalizePortfolioQuantity(0)` 이 `null`(미입력)을 돌려주므로 엔진에서 의미가 정확히 보존되고,
 * 그 행은 `no-quantity` 사유와 함께 합계에서만 빠진다(엔진을 고치지 않는 쪽을 택한 이유).
 */
export const toPortfolioHoldings = (rows: readonly PortfolioHoldingRow[]): PortfolioHolding[] =>
  rows.map((row) => ({
    ticker: row.ticker,
    quantity: row.quantity ?? 0,
    ...(row.manual ? { manual: row.manual } : {})
  }));

/** 저장소에서 읽은 보유 1건 → 화면 행. `toPortfolioHoldings` 의 역방향이다. */
export const toPortfolioHoldingRow = (holding: PortfolioHolding): PortfolioHoldingRow => {
  const quantity = normalizePortfolioQuantity(holding.quantity);

  return {
    ticker: normalizePortfolioTicker(holding.ticker),
    quantity,
    quantityInput: toQuantityInputValue(quantity),
    ...(holding.manual ? { manual: holding.manual } : {})
  };
};
