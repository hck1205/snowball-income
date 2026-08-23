import { clampPercent } from '@/shared/utils';

export type RedistributeAllocationWeightsParams = {
  /** Ticker whose slider was moved. */
  targetId: string;
  /** Raw slider value in percent; may be NaN or out of the 0~100 range. */
  rawValue: number;
  /** Ids currently included in the portfolio, in display order. */
  includedIds: string[];
  fixedById: Record<string, boolean>;
  /** Current (unrounded) allocation percent per ticker. */
  percentExactById: Record<string, number>;
};

/**
 * Rebuilds the allocation percent map after one slider moves.
 *
 * - Fixed tickers keep their current percent.
 * - The remaining budget (100 - fixed sum) is split between the target and the other mutable tickers.
 * - Other mutable tickers share the leftover proportionally to their current percent,
 *   or equally when their current percents all sum to 0.
 * - When the target is the only mutable ticker it absorbs the whole remaining budget.
 */
export const redistributeAllocationWeights = ({
  targetId,
  rawValue,
  includedIds,
  fixedById,
  percentExactById
}: RedistributeAllocationWeightsParams): Record<string, number> => {
  const nextTarget = clampPercent(rawValue);
  const fixedIds = includedIds.filter((id) => fixedById[id] && id !== targetId);
  const otherMutableIds = includedIds.filter((id) => !fixedById[id] && id !== targetId);

  const fixedSum = fixedIds.reduce((sum, id) => sum + (percentExactById[id] ?? 0), 0);
  const maxTarget = Math.max(0, 100 - fixedSum);
  const targetValue = otherMutableIds.length === 0 ? maxTarget : Math.min(nextTarget, maxTarget);
  const remaining = Math.max(0, maxTarget - targetValue);

  const nextMap: Record<string, number> = {};
  fixedIds.forEach((id) => {
    nextMap[id] = percentExactById[id] ?? 0;
  });
  nextMap[targetId] = targetValue;

  if (otherMutableIds.length > 0) {
    const otherBase = otherMutableIds.reduce((sum, id) => sum + (percentExactById[id] ?? 0), 0);
    if (otherBase === 0) {
      const equalWeight = remaining / otherMutableIds.length;
      otherMutableIds.forEach((id) => {
        nextMap[id] = equalWeight;
      });
    } else {
      otherMutableIds.forEach((id) => {
        nextMap[id] = (remaining * (percentExactById[id] ?? 0)) / otherBase;
      });
    }
  }

  return nextMap;
};

/* ────────────────────────────────────────────────────────────────────────────
 * 주식 수 입력 — 비중과 같은 값의 다른 표현
 *
 * 비중 슬라이더와 주식 수 입력은 **하나의 배분을 두 방향에서 만지는 것**이다. 규칙이 갈린다:
 *
 *  - 슬라이더는 **상대량**이다 → 총 투자금을 고정하고 종목끼리 나눠 갖는 몫을 바꾼다
 *    (위 `redistributeAllocationWeights`, 합은 언제나 100).
 *  - 주식 수·금액은 **절대량**이다 → 다른 종목을 건드리지 않고 그 종목의 크기만 바꾼다.
 *    그래서 **총 투자금이 따라 움직이고**, 비중은 그 결과로 다시 계산된다.
 *
 * 🔴 이 방향(절대량 → 총액·비중)이 저장 스키마를 넓히지 않는 이유이기도 하다. 종목별 금액을
 *    따로 들 필요 없이 `(initialInvestment, weightByTickerId)` 한 쌍으로 되돌려 놓을 수 있어,
 *    이미 저장된 데이터와 공유 링크가 그대로 열린다.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * 원 단위 금액의 정밀도 — **소수 둘째 자리**(2026-08-23 사용자 지시).
 *
 * 주식 수에서 되곱한 금액은 부동소수 꼬리를 달고 나온다(`5000 × 31.61 × 1383.9 =
 * 218725395.00000003`). 그 값이 그대로 `initialInvestment` 에 들어가 **투자 설정의 숫자 입력창에
 * 보이므로**, 여기서 한 번 접는다. 0.005원 이하의 오차는 주식 수로 되돌려도 1e-7 주 수준이라
 * 표시 정밀도(소수 둘째 자리)에 닿지 않는다.
 */
const toCurrencyAmount = (value: number): number => Math.round(value * 100) / 100;

/** 금액 → 주식 수. 주가가 0 이하면 나눌 수 없으므로 0 이다(모달이 양수 주가를 강제한다). */
export const toSharesFromAmount = (amount: number, price: number): number =>
  Number.isFinite(amount) && Number.isFinite(price) && price > 0 ? Math.max(0, amount) / price : 0;

/** 주식 수 → 금액. 소수점 주식(해외주식 소수점 매수)을 그대로 허용한다. */
export const toAmountFromShares = (shares: number, price: number): number =>
  Number.isFinite(shares) && Number.isFinite(price) ? Math.max(0, shares) * Math.max(0, price) : 0;

/**
 * 새로 담는 종목의 초기 비중 — **0** (2026-08-23 사용자 결정).
 *
 * 종전에는 `1` 이었다(백분율 합이 100인 자리에 1을 더하면 새 종목이 ≈1%를 가져간다). 그러면
 * **이미 있던 종목의 주식 수가 1% 줄어든다** — 5,000주로 맞춰 놓은 값이 4,950.50주가 됐다.
 * 주식 수는 절대량이라 "다른 종목을 담았다"는 이유로 움직이면 안 된다.
 *
 * 0 으로 들어오면 총 투자금도 그대로고 기존 주수도 그대로다. 새 종목은 0주에서 시작해
 * 사용자가 주수나 슬라이더로 채운다.
 * ⚠ 첫 종목이면 비중 합이 0이라 `buildNormalizedAllocation` 이 균등 배분으로 떨어뜨린다 —
 *   그때는 총액도 0이라 어차피 0주다(문제 없음).
 */
export const NEW_TICKER_WEIGHT = 0;

export type ApplyTickerAmountParams = {
  /** 금액이 바뀐 종목. 편입 목록에 없으면 아무것도 바꾸지 않는다. */
  targetId: string;
  /** 그 종목의 새 금액(원). 음수·비유한값은 0으로 본다. */
  nextAmount: number;
  includedIds: string[];
  /** 현재 (반올림하지 않은) 종목별 비중 %. */
  percentExactById: Record<string, number>;
  /** 현재 총 투자금(원). */
  totalAmount: number;
};

export type ApplyTickerAmountResult = {
  /** 새 총 투자금 — 바뀐 종목을 뺀 나머지 금액의 합에 새 금액을 더한 것. */
  totalAmount: number;
  /** 새 종목별 비중 %. 합은 100(총액이 0이면 전부 0). */
  percentById: Record<string, number>;
};

/**
 * 한 종목의 **금액을 절대량으로 고정**했을 때의 새 총액·비중.
 *
 * 다른 종목의 금액은 그대로 둔다 — 그게 절대량 입력의 뜻이다. "SCHD를 1,200만원어치로"라고
 * 했는데 JEPI 보유가 같이 줄어들면 사용자가 방금 말한 것과 다른 포트폴리오가 된다.
 *
 * ⚠ 고정 핀(`fixedByTickerId`)을 보지 않는다. 핀의 뜻은 "**슬라이더를 끌 때** 이 비중은 안 움직인다"
 *   이고, 여기서 움직이는 것은 자기 자신의 절대량이라 충돌하지 않는다. 다만 결과적으로 핀이
 *   걸린 종목의 비중 %도 바뀐다(총액이 달라졌으므로) — 화면이 그 사실을 숨기지 않아야 한다.
 *
 * ⚠ 총액이 0이 되면 비중을 전부 0으로 돌려준다. `buildNormalizedAllocation` 이 합 0을 균등 배분으로
 *   처리하므로, 값을 다시 넣기 시작하면 자연스럽게 그 종목 100%에서 다시 갈라진다.
 */
export const applyTickerAmount = ({
  targetId,
  nextAmount,
  includedIds,
  percentExactById,
  totalAmount
}: ApplyTickerAmountParams): ApplyTickerAmountResult => {
  const safeTotal = Number.isFinite(totalAmount) ? Math.max(0, totalAmount) : 0;
  const safeNext = Number.isFinite(nextAmount) ? Math.max(0, nextAmount) : 0;

  /*
   * 🔴 **반올림을 먼저 하고 합친다.** 합계를 낸 뒤에 접으면 `총액 × 비중` 이 각 종목의 표시 금액과
   *    어긋나, 편집을 반복할수록 그 차이가 쌓인다. 접은 값으로 비중을 내면 다음 편집이 같은 금액을
   *    그대로 되살린다.
   */
  const amounts = includedIds.map((id) =>
    toCurrencyAmount(id === targetId ? safeNext : (safeTotal * (percentExactById[id] ?? 0)) / 100)
  );
  const nextTotal = toCurrencyAmount(amounts.reduce((sum, value) => sum + value, 0));

  const percentById = includedIds.reduce<Record<string, number>>((acc, id, index) => {
    acc[id] = nextTotal > 0 ? (amounts[index] * 100) / nextTotal : 0;
    return acc;
  }, {});

  return { totalAmount: nextTotal, percentById };
};
