import { computeHoldingMonthlyDividend } from '@/shared/lib/snowball';
import { toKrwUnitPrice } from '@/shared/lib/tickerPrice';
import { toSharesFromAmount } from './allocation';
import type { NormalizedAllocationItem } from './portfolio';

export type AllocationHoldingRow = {
  /**
   * 초기 투자금 × 비중 ÷ **원 단위 주가**. 소수점 주식을 그대로 둔다(표시 반올림은 화면이 한다).
   *
   * 🔴 `null` = **낼 수 없다**(0주가 아니다). 미국 상장 종목인데 환율이 아직 없는 경우다 —
   *    원가격(달러 숫자)으로 나누면 주식 수가 1400배 어긋난 채 조용히 서 있게 된다
   *    (`toKrwUnitPrice` 머리말의 사고 기록). 화면은 이때 입력을 잠그고 사유를 말해야 한다.
   */
  shares: number | null;
  /** 초기 투자금 × 비중 (원). 환율과 무관하게 언제나 낼 수 있다. */
  amount: number;
  /** 이 보유량 기준 월 배당(세후, 원). */
  monthlyDividend: number;
};

export type AllocationHoldings = {
  byTickerId: Record<string, AllocationHoldingRow>;
  /** 편입 종목 금액의 합. 배분이 정상이면 초기 투자금과 같다. */
  totalAmount: number;
  totalMonthlyDividend: number;
  /**
   * 환율이 없어 주식 수를 내지 못한 종목이 하나라도 있는가. 화면이 사유 안내를 띄우는 조건이다
   * (무음 비활성 금지 — 잠긴 입력은 왜 잠겼는지 말해야 한다).
   */
  hasUnpricedShares: boolean;
  /** 환율이 실제로 곱해졌는가. 화면이 "환율 N원 적용"을 밝히는 조건이다. */
  usesFxRate: boolean;
};

export type BuildAllocationHoldingsParams = {
  normalizedAllocation: NormalizedAllocationItem[];
  /** 폼의 초기 투자금(원). */
  initialInvestment: number;
  /** 폼의 세율 override(%). `undefined` 면 종목마다 상장지에서 파생된다. */
  taxRate?: number;
  /** 1 USD = N KRW. 미국 상장 종목의 주가를 원으로 되맞추는 데 쓴다. 없으면 `null`. */
  fxRate: number | null;
};

/**
 * **비중 배분을 "몇 주 · 얼마 · 월 얼마"로 되읽은 것.**
 *
 * 저장되는 값은 여전히 `(초기 투자금, 비중)` 한 쌍이다. 이 함수는 그 쌍을 사용자가 실제로 아는
 * 단위 — 주식 수와 매달 들어오는 돈 — 로 펼쳐 놓기만 한다. 입력(`applyTickerAmount`)이 그 반대
 * 방향이라, 둘을 왕복하면 같은 값으로 돌아온다.
 *
 * 🔴 주가는 **원 단위로 되맞춰 쓴다**(`toKrwUnitPrice`). 프리셋이 미국 종목의 달러 가격을 그대로
 *    담고 있어서, 원가격으로 나누면 주식 수가 환율배만큼 어긋난다(그 함수 머리말에 사고 기록).
 *
 * 🔴 금액과 월 배당은 **환율에 영향받지 않는다.** 둘 다 `초기 투자금 × 비중` 에서 곧장 나오고,
 *    배당은 `금액 × 배당률` 이라 주가가 약분된다. 환율이 바뀌어도 움직이는 것은 주식 수뿐이다 —
 *    그래서 환율이 없어도 이 두 값은 언제나 정확하다.
 *
 * 🔴 세후 월 배당은 **엔진과 같은 함수**(`computeHoldingMonthlyDividend`)로 낸다 — 계좌 유형·상장지별
 *    세율 파생이 화면 쪽에서 두 번째로 구현되지 않아야 한다(그 함수 머리말의 사고 기록 참고).
 *
 * ⚠ 여기서 나오는 월 배당은 **시작 시점** 값이다. 결과 카드·파이 중앙의 "예상 월배당"은 시뮬레이션
 *   **종료 시점** 값이라 훨씬 크다 — 두 숫자는 다른 질문에 답한다. 화면 라벨이 그것을 갈라야 한다.
 */
export const buildAllocationHoldings = ({
  normalizedAllocation,
  initialInvestment,
  taxRate,
  fxRate
}: BuildAllocationHoldingsParams): AllocationHoldings => {
  const safeTotal = Number.isFinite(initialInvestment) ? Math.max(0, initialInvestment) : 0;

  return normalizedAllocation.reduce<AllocationHoldings>(
    (acc, { profile, weight }) => {
      const amount = safeTotal * weight;
      const krwUnitPrice = toKrwUnitPrice({ ticker: profile.ticker, price: profile.initialPrice, fxRate });
      const shares = krwUnitPrice === null ? null : toSharesFromAmount(amount, krwUnitPrice);
      /*
       * 🔴 배당은 **금액 하나로** 낸다 — 주가가 약분되기 때문이다(`shares × price === amount`).
       *    그래서 `shares: 1, price: amount` 로 부르면 주식 수가 있든 없든 **같은 한 경로**다.
       *    환율 유무로 분기해 두 번 부르던 것을 접었다: 두 갈래가 같은 값을 내야 한다는 약속을
       *    주석으로만 지키는 구조였는데, 그건 한쪽을 고치는 순간 깨진다.
       */
      const monthlyDividend = computeHoldingMonthlyDividend({
        ticker: profile.ticker,
        shares: 1,
        price: amount,
        dividendYield: profile.dividendYield,
        accountType: profile.accountType,
        taxRate
      });

      acc.byTickerId[profile.id] = { shares, amount, monthlyDividend };
      acc.totalAmount += amount;
      acc.totalMonthlyDividend += monthlyDividend;
      if (shares === null) acc.hasUnpricedShares = true;
      if (krwUnitPrice !== null && krwUnitPrice !== profile.initialPrice) acc.usesFxRate = true;
      return acc;
    },
    { byTickerId: {}, totalAmount: 0, totalMonthlyDividend: 0, hasUnpricedShares: false, usesFxRate: false }
  );
};
