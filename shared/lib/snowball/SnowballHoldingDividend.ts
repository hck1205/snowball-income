import {
  DEFAULT_ACCOUNT_TYPE,
  payoutTaxRateFor,
  resolveDefaultDividendTaxRatePercent,
  type AccountType
} from '@/shared/constants/tax';

export type HoldingMonthlyDividendParams = {
  /** 세율 파생에 쓴다(미국 상장 15 / 국내 상장 15.4). 상장지 판정의 유일한 입력이다. */
  ticker: string;
  /** 보유 주식 수. 음수는 0으로 본다. */
  shares: number;
  /** 그 시점의 주가(원). */
  price: number;
  /** 연 배당률(%). */
  dividendYield: number;
  /** 계좌 유형. 미지정은 과세계좌 — 저장된 옛 데이터가 그대로 통과한다. */
  accountType?: AccountType;
  /** 사용자가 직접 넣은 세율(%). `undefined` 일 때만 상장지에서 파생한다(`0` 은 "0%"다). */
  taxRate?: number;
};

/**
 * **지금 이만큼 들고 있으면 매달 얼마 받는가** (세후, 원).
 *
 *     shares × price × dividendYield ÷ 12 × (1 − 세율)
 *
 * 🔴 `runSimulation` 의 `finalRunRateMonthlyDividend` 와 **같은 식**이다. 거기서는
 *    `dps = price × dividendYield`(정합 모델의 항등식)를 쓰고 마지막 달 스냅샷에 적용하는데,
 *    이 함수는 그 식을 **t=0 시점**에 적용한 것뿐이다. 그래서 같은 보유량·같은 세율이면
 *    두 값이 서로 검산된다 — 시작 시점 값과 종료 시점 값이 다른 규칙으로 계산되면
 *    같은 화면에서 배당률이 어긋나 보인다.
 *
 * 🔴 세율 파생도 엔진과 **같은 두 함수**를 부른다(`resolveDefaultDividendTaxRatePercent` →
 *    `payoutTaxRateFor`). 종전에 이 파생을 화면 쪽에서 다시 구현했다가 국내 상장 종목이
 *    15.4% 가 아니라 15% 로 계산된 사고가 있었다(`createDefaultYieldFormValues` 의 taxRate 주석).
 *
 * ⚠ **ISA 는 0 이 아니라 "지금은 안 뗀다"** 이다(`payoutTaxRateFor`). 종료 시점 정산세
 *   (`estimateIsaSettlementTax`)는 이 값에 들어 있지 않다 — 이 함수가 답하는 질문이
 *   "이번 달 통장에 얼마 들어오나"이기 때문이다. 화면이 그 한계를 함께 말해야 한다.
 */
export const computeHoldingMonthlyDividend = ({
  ticker,
  shares,
  price,
  dividendYield,
  accountType,
  taxRate
}: HoldingMonthlyDividendParams): number => {
  const safeShares = Number.isFinite(shares) ? Math.max(0, shares) : 0;
  const safePrice = Number.isFinite(price) ? Math.max(0, price) : 0;
  const safeYield = Number.isFinite(dividendYield) ? Math.max(0, dividendYield) : 0;
  if (safeShares === 0 || safePrice === 0 || safeYield === 0) return 0;

  const taxableRatePercent = taxRate ?? resolveDefaultDividendTaxRatePercent(ticker);
  const payoutTaxRate = payoutTaxRateFor(accountType ?? DEFAULT_ACCOUNT_TYPE, taxableRatePercent) / 100;

  return (safeShares * safePrice * (safeYield / 100) * (1 - payoutTaxRate)) / 12;
};
