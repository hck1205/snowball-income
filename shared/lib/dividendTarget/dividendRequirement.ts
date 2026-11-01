/**
 * "월 N 원을 받으려면 얼마가 필요한가" — **순수 산수**(2026-11-01 신설).
 *
 * ## 🔴 식의 정본은 여기가 아니다
 * 원금 식은 `shared/lib/goalPlan` 의 `principalForMonthlyDividend` 가 소유한다. 이 파일은 그것을
 * **부르고**, 나머지(세전 연 배당·세금·세후 연 배당)를 같은 전제에서 파생시킨다. 식을 여기 복제하면
 * 랜딩의 목표 역산과 이 화면이 조용히 갈린다 — 같은 질문에 두 답이 나오는 결함이다.
 *
 * ## 🔴 통화가 없다 — 그래서 환율도 없다
 * 목표를 원으로 넣으면 원금이 원으로 나온다. 배당률은 비율이라 통화를 소거하기 때문이다:
 *
 *     필요 원금 = (목표 월 배당 × 12 ÷ (1 − 세율)) ÷ 배당률
 *
 * 미국 상장 종목인데도 환율이 필요 없는 이유가 이것이다. `shared/lib/fx` 를 끌어오지 마라 —
 * 끌어오는 순간 이 화면이 네트워크 상태에 묶이고(정적 셸에서 숫자가 사라진다), 환율이라는
 * **또 하나의 가정**이 결과에 섞인다. 주식 수가 필요한 화면(시뮬레이터)만 환율을 쓴다.
 *
 * ## 🔴 세율은 상장지에서 파생된다 — 계좌 선택지를 주지 않는다
 * `resolveDefaultDividendTaxRatePercent` 가 티커 표기(`.KS`/`.KQ`)로 15% / 15.4% 를 가른다.
 * **ISA 토글을 일부러 두지 않았다**: 국내 ISA 는 국내 상장 상품만 편입하는데(`isIsaSelectableFor`)
 * 이 화면이 비교하는 종목은 전부 미국 상장이다. 토글을 주면 **현실에 없는 조합**으로 계산된
 * 숫자가 나오고, 그건 틀린 답이다(`shared/constants/tax/accountType.ts` 의 같은 결정).
 */
import { FINANCIAL_INCOME_TAX_THRESHOLD, resolveDefaultDividendTaxRatePercent } from '@/shared/constants/tax';
import { principalForMonthlyDividend } from '@/shared/lib/goalPlan';

/**
 * 목표 한 건의 **세금·원금 분해**. 화면은 이 모델을 그리기만 한다.
 *
 * 금액은 전부 목표와 같은 통화(원)의 **정수가 아닌 실수**다 — 반올림은 표시 계층이 한다
 * (여기서 깎으면 `annualPreTax − annualTax === annualAfterTax` 가 1원씩 어긋난다).
 */
export type DividendRequirement = {
  /** 입력 그대로의 목표 월 배당(세후). */
  readonly monthlyAfterTax: number;
  /** 목표 × 12. */
  readonly annualAfterTax: number;
  /** 세금을 떼기 **전** 연 배당 — 종목이 실제로 지급해야 하는 금액. */
  readonly annualPreTax: number;
  /** 연간 배당소득세. `annualPreTax − annualAfterTax` 와 항등이다. */
  readonly annualTax: number;
  /** 적용된 배당소득세율(%). 상장지에서 파생된다. */
  readonly taxRatePercent: number;
  /** 필요한 투자 원금. */
  readonly requiredPrincipal: number;
  /**
   * 🔴 세전 연 배당이 **금융소득종합과세 기준(2,000만원)을 넘는가.**
   *
   * 넘으면 위 `taxRatePercent` 는 **과소추정**이다 — 초과분이 다른 소득과 합산돼 누진세율을 받으므로
   * 실효세율이 원천징수 15% 보다 높아질 수 있다. 앱은 사용자의 다른 소득을 알 수 없어
   * **세율을 자동으로 바꾸지 않고 초과 사실만 알린다**(`shared/constants/tax/index.ts` 의 결정).
   *
   * ⚠ 월 167만원(세후)만 넘어도 참이 된다 — 이 화면의 목표 선택지 대부분이 여기 걸린다.
   *   드물게 발생하는 경고가 아니라 **기본적으로 보이는 사실**로 설계해야 한다.
   */
  readonly exceedsFinancialIncomeThreshold: boolean;
};

/**
 * 목표·배당률·세율로 분해를 만든다. 성립하지 않으면 **`null`** 이다(0 이나 Infinity 로 채우지 않는다 —
 * 배당률 0% 종목에 "필요 원금 무한"을 그리면 표가 거짓말을 한다).
 *
 * @param dividendYieldPercent 연 배당률(%). 0 이하면 `null`.
 * @param taxRatePercent 배당소득세율(%). 0~100 미만이 아니면 `null`.
 */
export const computeDividendRequirement = (input: {
  readonly monthlyAfterTax: number;
  readonly dividendYieldPercent: number;
  readonly taxRatePercent: number;
}): DividendRequirement | null => {
  const { monthlyAfterTax, dividendYieldPercent, taxRatePercent } = input;

  if (!Number.isFinite(taxRatePercent) || taxRatePercent < 0 || taxRatePercent >= 100) return null;

  const taxRate = taxRatePercent / 100;
  const dividendYield = dividendYieldPercent / 100;

  /* 원금 식은 `goalPlan` 이 소유한다 — 입력 검증(목표 > 0 · 배당률 > 0)도 그쪽이 한다. */
  const requiredPrincipal = principalForMonthlyDividend({
    monthlyDividend: monthlyAfterTax,
    dividendYield,
    taxRate
  });
  if (requiredPrincipal === null) return null;

  const annualAfterTax = monthlyAfterTax * 12;
  const annualPreTax = annualAfterTax / (1 - taxRate);

  return {
    monthlyAfterTax,
    annualAfterTax,
    annualPreTax,
    annualTax: annualPreTax - annualAfterTax,
    taxRatePercent,
    requiredPrincipal,
    exceedsFinancialIncomeThreshold: annualPreTax > FINANCIAL_INCOME_TAX_THRESHOLD
  };
};

/** 그 종목에 붙는 배당소득세율(%). 재export 가 아니라 **이 화면의 유일한 세율 출처**라는 표시다. */
export const taxRateForTicker = (ticker: string): number => resolveDefaultDividendTaxRatePercent(ticker);

/* ── 물가 비교 ──────────────────────────────────────────────────────────────── */

/**
 * 배당 인상률이 물가를 이기는가.
 *
 * - `beats` — 인상률 > 물가. 받는 돈의 **구매력이 늘어난다**.
 * - `trails` — 인상률 ≤ 물가. 금액은 늘어도 구매력은 제자리거나 줄어든다.
 * - `unknown` — 인상률 **자료가 없다**(상장이 짧거나 지급 이력이 모자란 종목). `trails` 로 접지 마라.
 */
export type InflationVerdict = 'beats' | 'trails' | 'unknown';

export type InflationComparison = {
  readonly verdict: InflationVerdict;
  /** 인상률 − 물가 (%p). `unknown` 이면 `null`. */
  readonly gapPercentPoints: number | null;
};

/**
 * 🔴 **`dividendCagrPercent` 에 `dividendGrowth` 를 넣지 마라.**
 *
 * 이 레포의 `dividendGrowth` 는 이름과 달리 배당 인상률이 **아니다** — 정합 모델에서 그것은
 * 주가 성장률이고, 큐레이터의 `expectedTotalReturn` 에서 배당률을 뺀 **파생 가정**이다
 * (`shared/constants/presets/index.ts`). 물가와 비교해야 하는 것은 "받는 배당이 얼마나 빨리
 * 늘었는가"이므로 **지급 이력에서 관측한 `observedDividendCagr`** 만 여기 들어온다.
 *
 * 둘을 섞으면 "VIG 의 배당이 연 9.15% 늘었다"가 아니라 "우리가 가정한 주가 상승률이 9.15%"를
 * 배당 인상률로 발표하는 셈이 된다 — 날조다.
 */
export const compareDividendGrowthToInflation = (
  dividendCagrPercent: number | null,
  inflationRatePercent: number
): InflationComparison => {
  if (dividendCagrPercent === null || !Number.isFinite(dividendCagrPercent)) {
    return { verdict: 'unknown', gapPercentPoints: null };
  }

  const gap = dividendCagrPercent - inflationRatePercent;
  return { verdict: gap > 0 ? 'beats' : 'trails', gapPercentPoints: gap };
};
