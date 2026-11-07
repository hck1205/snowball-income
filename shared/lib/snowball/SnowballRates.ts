import type { DpsGrowthMode } from '@/shared/types';

/** 성장률 하한. 자산이 완전히 소멸(-100%)하지 않도록 막는다. */
export const MIN_GROWTH_RATE = -0.99;

/**
 * 주가·배당 하한 계수. 0/NaN 전파를 구조적으로 막는다.
 * ⚠ "정합 모델에서는 도달 불가능"이 아니다 — 성장 -15% 면 57년째에 닿는다. 그래서 `dpsAtMonth` 도
 *   같은 계수를 써야 배당수익률 불변이 바닥에서도 깨지지 않는다.
 */
export const MIN_PRICE_FACTOR = 1e-4;

export const toMonthlyGrowthRate = (annualRate: number): number => Math.pow(1 + annualRate, 1 / 12) - 1;

/** 세율(%) → 비율. 미입력(undefined)은 0% 로 취급한다. */
export const toTaxRate = (taxRatePercent: number | undefined): number => (taxRatePercent ?? 0) / 100;

export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** 재투자 비율(%) → 0..1 비율. 음수는 0, 100 초과는 1로 clamp 한다. */
export const toReinvestRatio = (reinvestDividendPercent: number): number => clamp01(reinvestDividendPercent / 100);

/** 소수 둘째 자리 반올림. 프리셋/저장데이터 마이그레이션이 부동소수 잡음을 남기지 않게 한다. */
export const roundToTwoDecimals = (value: number): number => Math.round(value * 100) / 100;

/**
 * 정합 모델(고든 성장모형)의 주가 성장률.
 *
 * 가격과 배당이 **같은 속도**로 성장한다고 가정한다 → `priceGrowth = dividendGrowth`.
 * 그 결과 배당수익률(DPS/주가)이 시간에 대해 불변이 되고, 수익률 표류와 NaN 폭주가
 * 구조적으로 불가능해진다.
 */
export const toPriceGrowth = (dividendGrowthPercent: number): number =>
  Math.max(MIN_GROWTH_RATE, dividendGrowthPercent / 100);

/**
 * 파생 총수익률(%). 고든: r = y + g.
 *
 * 엔진은 이 값을 **계산에 쓰지 않는다** — 표시/문서용 파생값이다.
 * 자유도는 `dividendYield` + `dividendGrowth` 둘뿐이다.
 */
export const toExpectedTotalReturnPercent = (dividendYieldPercent: number, dividendGrowthPercent: number): number =>
  roundToTwoDecimals(dividendYieldPercent + dividendGrowthPercent);

/**
 * 마이그레이션 규칙: 큐레이션/사용자가 튜닝한 `dividendYield`와 `expectedTotalReturn`을 보존하고
 * `dividendGrowth`를 재계산한다 (g = r - y).
 *
 * 구모델의 `dividendGrowth` 값은 가격과 무관하게 표류하던 시절의 값이라 신뢰할 수 없다.
 * 반면 `expectedTotalReturn`은 "이 자산의 총수익률"이라는 명시적 가정이므로 그쪽을 남긴다.
 */
export const toDerivedDividendGrowthPercent = (
  expectedTotalReturnPercent: number,
  dividendYieldPercent: number
): number => roundToTwoDecimals(expectedTotalReturnPercent - dividendYieldPercent);

/**
 * 해당 월 시점의 주가. 정합 모델에서는 `priceGrowth >= -99%` 라 발산/소멸이 없지만,
 * 손상된 입력이 흘러들어와도 0 이나 NaN 이 UI 까지 새지 않도록 하한을 둔다.
 */
export const priceAtMonth = (initialPrice: number, priceGrowth: number, elapsedYearFraction: number): number => {
  const floor = initialPrice * MIN_PRICE_FACTOR;
  const price = initialPrice * Math.pow(1 + priceGrowth, elapsedYearFraction);

  return Number.isFinite(price) ? Math.max(floor, price) : floor;
};

export type DpsAtMonthParams = {
  /** 1주당 최초 연간 배당금 (initialPrice * dividendYield) */
  dps0: number;
  dividendGrowth: number;
  mode: DpsGrowthMode;
  elapsedYearFraction: number;
  completedYears: number;
};

/**
 * 해당 월 시점의 1주당 **연간** 배당금(DPS).
 *
 * - `monthlySmooth`: 매월 연속적으로 성장 (지수 = 경과 연 소수).
 *   `priceGrowth === dividendGrowth` 이므로 `dps(t) === price(t) * dividendYield` 가 항상 성립한다.
 * - `annualStep`: 12개월마다 계단식으로 상승 (지수 = 완료된 연 수).
 *   연중에는 주가만 오르므로 배당수익률이 한 해 안에서 [y/(1+g), y] 사이를 오간다.
 *   **표류하지 않고 매년 같은 구간을 반복**한다는 점이 구모델과의 차이다.
 */
export const dpsAtMonth = ({
  dps0,
  dividendGrowth,
  mode,
  elapsedYearFraction,
  completedYears
}: DpsAtMonthParams): number => {
  const growthExponent = mode === 'monthlySmooth' ? elapsedYearFraction : completedYears;
  const dps = dps0 * Math.pow(1 + Math.max(MIN_GROWTH_RATE, dividendGrowth), growthExponent);
  /*
   * 🔴 주가와 **같은 계수**로 바닥을 둔다(2026-11-07).
   * 예전엔 0 으로만 막아서, 주가가 `MIN_PRICE_FACTOR` 바닥에 닿은 뒤에도 배당은 계속 줄었고
   * 배당수익률이 어긋났다 — 배당률 21%·성장 -15% 인 커버드콜(QQQT·SPYT)이 60년 계산에서
   * 21.4% → 18.8% 로 틀어져 정합 모델 불변식 테스트가 티커 월간 갱신을 막았다(#286).
   * 둘이 같은 바닥에 함께 서면 `dps / price === dps0 / initialPrice` 가 바닥에서도 유지된다.
   */
  const floor = Math.max(0, dps0) * MIN_PRICE_FACTOR;

  return Number.isFinite(dps) ? Math.max(floor, dps) : floor;
};
