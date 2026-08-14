import { resolveDefaultDividendTaxRatePercent } from '@/shared/constants/tax';
import {
  DEFAULT_PORTFOLIO_TAX_RATE_PERCENT,
  normalizePortfolioQuantity,
  normalizePortfolioTaxRatePercent,
  normalizePortfolioTicker
} from './PortfolioHolding';
import { hasPortfolioPayoutMonths, portfolioAnnualDpsUsd, resolvePortfolioMarketInfo } from './PortfolioMarketInfo';
import { findNextPayout } from './PortfolioSchedule';
import type {
  PortfolioExclusion,
  PortfolioExclusionReason,
  PortfolioHolding,
  PortfolioHoldingBreakdown,
  PortfolioMarketInfo,
  PortfolioMarketInfoResolver,
  PortfolioSummary
} from './PortfolioTypes';

/**
 * **§4 의 7개 지표 — 전부 순수 함수, 전부 USD.**
 *
 * 정의(기호: 수량 q, 가격 P, 배당률 y, 지급월 M, 세율 t):
 *
 *   DPS(h)        = P(h) × y(h) / 100                     // 시뮬 `dps0` 와 같은 정의
 *   #1 자산가치    = Σ q(h) × P(h)
 *   #2 연배당      = Σ q(h) × DPS(h)                       // 현재 배당률 스냅샷 기준, 성장 미반영
 *   #3 월배당      = #2 ÷ 12                                // "평균"이지 "매달 이만큼"이 아니다
 *   #4 배당수익률  = #2 ÷ #1 × 100                          // FX 가 분자·분모에서 소거 → 환율 무관
 *   #5 세후        = 세전 × (1 − t/100)
 *   #6 이번 달     = Σ{h: 이번 달 ∈ M(h)} q(h) × DPS(h) ÷ |M(h)|   // 연배당을 지급월에 **균등 분배**
 *   #7 다음 지급일 = `findNextPayout`(PortfolioSchedule)
 *
 * **불변식**: 12개월치 #6 의 합 = `scheduledAnnualDividendUsd`(지급월을 아는 행들의 #2 부분합).
 * 전체 #2 와는 `exclusions` 의 연배당 합만큼 차이가 나며, 그 차이는 사유와 함께 반환된다
 * (무음 제외 금지 — 화면이 "n종 제외"를 말할 수 있어야 한다).
 *
 * 성장(배당·주가)은 여기서 다루지 않는다. Portfolio 는 **현재 상태**이고 미래는 시뮬레이터 소관이다.
 */

const MONTHS_IN_YEAR = 12;

/** `today` 와 무관한 값(#1·#2·#5) 계산 단계. 일정(#6·#7)은 이 위에 얹는다. */
type PortfolioValuation = {
  ticker: string;
  quantity: number;
  market: PortfolioMarketInfo | null;
  valueUsd: number;
  annualDividendUsd: number;
  exclusion: PortfolioExclusionReason | null;
};

/**
 * 제외 판정 순서: **시장 데이터 → 수량**.
 *
 * 둘 다 없는 행에서 어느 사유를 말할지의 문제인데, 시장 데이터가 없으면 수량을 채워도 아무 지표가
 * 안 나오므로(선행 조건) 그쪽을 먼저 알린다 — "수량 넣으세요" → "데이터 없어요" 2단 좌절 방지.
 */
const buildValuation = (holding: PortfolioHolding, resolve: PortfolioMarketInfoResolver): PortfolioValuation => {
  const ticker = normalizePortfolioTicker(holding.ticker);
  const market = resolve(holding);
  const quantity = normalizePortfolioQuantity(holding.quantity);

  if (!market) {
    // 수량은 사용자 입력이라 데이터 해석 실패와 무관하게 그대로 들고 있는다(화면이 되돌려 보여줄 수 있게).
    return {
      ticker,
      quantity: quantity ?? 0,
      market: null,
      valueUsd: 0,
      annualDividendUsd: 0,
      exclusion: 'no-market-data'
    };
  }

  if (quantity === null) {
    return { ticker, quantity: 0, market, valueUsd: 0, annualDividendUsd: 0, exclusion: 'no-quantity' };
  }

  return {
    ticker,
    quantity,
    market,
    valueUsd: quantity * market.price,
    annualDividendUsd: quantity * portfolioAnnualDpsUsd(market),
    // 값에는 들어가지만 지급월을 몰라 #6·#7 에서만 빠지는 행(수동 입력 종목이 여기 해당).
    exclusion: hasPortfolioPayoutMonths(market) ? null : 'no-payout-months'
  };
};

type PortfolioTotals = {
  totalValueUsd: number;
  annualDividendUsd: number;
  scheduledAnnualDividendUsd: number;
  includedCount: number;
  scheduledCount: number;
};

/**
 * 합산은 이 함수 **하나**만 쓴다. `computePortfolioSummary` 와 `computeMeasuredMonthlyDividend` 가
 * 각자 더하면 부동소수 결합순서가 갈려 두 화면이 미세하게 다른 숫자를 낼 수 있다.
 */
const sumValuations = (valuations: readonly PortfolioValuation[]): PortfolioTotals => {
  let totalValueUsd = 0;
  let annualDividendUsd = 0;
  let scheduledAnnualDividendUsd = 0;
  let includedCount = 0;
  let scheduledCount = 0;

  for (const valuation of valuations) {
    if (valuation.exclusion === 'no-market-data' || valuation.exclusion === 'no-quantity') continue;

    totalValueUsd += valuation.valueUsd;
    annualDividendUsd += valuation.annualDividendUsd;
    includedCount += 1;

    if (valuation.exclusion === null) {
      scheduledAnnualDividendUsd += valuation.annualDividendUsd;
      scheduledCount += 1;
    }
  }

  return { totalValueUsd, annualDividendUsd, scheduledAnnualDividendUsd, includedCount, scheduledCount };
};

const toAfterTax = (amount: number, taxRatePercent: number): number => amount * (1 - taxRatePercent / 100);

/**
 * 이 종목에 실제로 붙는 배당소득세율(%).
 *
 * 🔴 **현행 세법 기준**이다(2026-08-14 사용자 결정) — 미국 상장은 15.0%(현지 원천징수로 끝),
 * 국내 상장(`.KS`/`.KQ`)은 15.4%(소득세 14% + 지방소득세 1.4%). 종전에는 포트폴리오 전체에
 * **15.4% 하나**를 곱해서, 미국 ETF 가 대부분인 이 사이트의 실제 구성에서 세부담이 과대 계상됐고
 * 같은 종목을 시뮬레이터와 견주면 두 화면이 **다른 세후 금액**을 말했다.
 *
 * `override` 가 있으면 그 값이 이긴다 — ISA·연금저축처럼 계좌가 세율을 바꾸는 경우를 사용자가
 * 직접 표현하는 통로다.
 */
const resolveHoldingTaxRate = (ticker: string, override: number | null): number =>
  override ?? resolveDefaultDividendTaxRatePercent(ticker);

/**
 * 그 달에 실제로 들어오는 금액(#6 의 한 행). 연배당을 지급월 수로 **균등 분배**한다.
 *
 * 실제 지급액은 회차마다 조금씩 다르지만, 스냅샷이 주는 것은 "연 배당률" 하나뿐이라 회차별 편차를
 * 만들어낼 근거가 없다 — 없는 정밀도를 지어내지 않고 균등 분배임을 카피로 밝힌다.
 */
const monthlyPayoutOf = (valuation: PortfolioValuation, month: number): number => {
  const months = valuation.market?.payoutMonths ?? [];
  if (valuation.exclusion !== null || !months.includes(month)) return 0;

  return valuation.annualDividendUsd / months.length;
};

export type PortfolioSummaryOptions = {
  /**
   * "오늘". 테스트 결정성을 위해 **반드시 주입**한다 — 이 계층은 절대 `new Date()` 를 부르지 않는다.
   * 로컬 연·월(KST)로 읽는다.
   */
  today: Date;
  /**
   * 사용자가 직접 지정한 세율(%). **미입력(undefined·null)이면 종목마다 현행 세법 기준**으로 계산한다
   * (미국 상장 15.0 / 국내 상장 15.4). 지정하면 그 값이 전 종목에 적용된다 — ISA·연금저축처럼
   * 계좌가 세율을 바꾸는 경우를 표현하는 통로다. 0..100 으로 clamp 된다.
   */
  taxRatePercent?: number | null;
  /** 시장 정보 해석기 주입(테스트·대체 유니버스용). 기본값은 실제 스냅샷/프리셋 해석기. */
  resolve?: PortfolioMarketInfoResolver;
};

export const computePortfolioSummary = (
  holdings: readonly PortfolioHolding[],
  options: PortfolioSummaryOptions
): PortfolioSummary => {
  const { today, resolve = resolvePortfolioMarketInfo } = options;
  const taxOverride =
    options.taxRatePercent === undefined || options.taxRatePercent === null
      ? null
      : normalizePortfolioTaxRatePercent(options.taxRatePercent);

  const valuations = holdings.map((holding) => buildValuation(holding, resolve));
  const totals = sumValuations(valuations);

  const thisMonth = { year: today.getFullYear(), month: today.getMonth() + 1 };

  const rows: PortfolioHoldingBreakdown[] = valuations.map((valuation) => ({
    ticker: valuation.ticker,
    quantity: valuation.quantity,
    market: valuation.market,
    valueUsd: valuation.valueUsd,
    annualDividendUsd: valuation.annualDividendUsd,
    annualDividendAfterTaxUsd: toAfterTax(
      valuation.annualDividendUsd,
      resolveHoldingTaxRate(valuation.ticker, taxOverride)
    ),
    thisMonthDividendUsd: monthlyPayoutOf(valuation, thisMonth.month),
    // 다음 지급일은 수량과 무관한 사실이라 수량 미입력 행에도 그대로 알려준다.
    nextPayout: findNextPayout(valuation.market, today),
    includedInTotals: valuation.exclusion !== 'no-market-data' && valuation.exclusion !== 'no-quantity',
    includedInSchedule: valuation.exclusion === null,
    exclusion: valuation.exclusion
  }));

  const exclusions: PortfolioExclusion[] = rows.flatMap((row) =>
    row.exclusion === null
      ? []
      : [{ ticker: row.ticker, reason: row.exclusion, annualDividendUsd: row.annualDividendUsd }]
  );

  let thisMonthDividendUsd = 0;
  for (const row of rows) thisMonthDividendUsd += row.thisMonthDividendUsd;

  /*
   * 🔴 합계 세후는 **행별 세후의 합**이다 — 합계에 세율 하나를 곱하면 미국·국내가 섞인 포트폴리오에서
   *    어느 쪽으로든 틀린다. 합계에서 역산한 `effectiveTaxRatePercent` 는 그래서 **결과이지 입력이 아니다**.
   */
  // ⚠ 합산 기준을 `totals.annualDividendUsd`(= sumValuations)와 **같게** 둔다. 여기서 행을 더 거르면
  //    세전 합계와 세후 합계가 다른 모수를 세게 되어 실효세율이 엉뚱해진다(합산 경로는 하나여야 한다).
  let annualDividendAfterTaxUsd = 0;
  for (const row of rows) annualDividendAfterTaxUsd += row.annualDividendAfterTaxUsd;

  /*
   * ⚠ 지정값은 **역산하지 않는다.** 22 를 넣었는데 합계에서 되돌리면 21.999999999999996 이 나온다
   *   (부동소수 왕복). 사용자가 준 숫자는 그대로 돌려주는 것이 맞다 — 역산은 자동일 때만 의미가 있다.
   */
  const effectiveTaxRatePercent =
    taxOverride ??
    (totals.annualDividendUsd > 0
      ? // 역산은 부동소수 잡음을 남긴다(순수 미국 구성이 14.999999999999991 로 나온다). 세율은
        // 소수 둘째 자리면 충분하므로 여기서 잘라 표시·비교 양쪽을 안정시킨다.
        Math.round((1 - annualDividendAfterTaxUsd / totals.annualDividendUsd) * 100 * 100) / 100
      : DEFAULT_PORTFOLIO_TAX_RATE_PERCENT);

  const asOf = rows.find((row) => row.market?.asOf)?.market?.asOf ?? null;

  return {
    totalValueUsd: totals.totalValueUsd,
    annualDividendUsd: totals.annualDividendUsd,
    monthlyDividendUsd: totals.annualDividendUsd / MONTHS_IN_YEAR,
    weightedYieldPercent: totals.totalValueUsd > 0 ? (totals.annualDividendUsd / totals.totalValueUsd) * 100 : 0,
    annualDividendAfterTaxUsd,
    monthlyDividendAfterTaxUsd: annualDividendAfterTaxUsd / MONTHS_IN_YEAR,
    thisMonthDividendUsd,
    thisMonth,
    scheduledAnnualDividendUsd: totals.scheduledAnnualDividendUsd,
    /* 표시·다운스트림 호환용 단일 값. 자동일 때는 구성에서 나온 **실효세율**이다. */
    taxRatePercent: effectiveTaxRatePercent,
    taxRateMode: taxOverride === null ? 'auto' : 'manual',
    asOf,
    holdings: rows,
    exclusions,
    counts: {
      total: holdings.length,
      included: totals.includedCount,
      scheduled: totals.scheduledCount
    }
  };
};

export type MeasuredMonthlyDividendOptions = {
  /** 시장 정보 해석기 주입(테스트용). */
  resolve?: PortfolioMarketInfoResolver;
};

/**
 * **실측 세후 월배당(USD) 한 숫자** = #5 ÷ 12.
 *
 * `computePortfolioSummary(...).monthlyDividendAfterTaxUsd` 와 **같은 숫자**를 요약 전체를 만들지 않고
 * 보유 목록만으로 얻는 지름길이다(합산은 둘 다 `sumValuations` 하나를 공유하므로 값이 갈리지 않는다).
 * 실제로 이 숫자를 화면에 쓰는 곳 — 내 포트폴리오(`/dividend/portfolio`)의 목표 달성 카드 — 은 이미
 * 요약을 손에 들고 있어 요약 필드 쪽을 넘긴다(pages/Portfolio/PortfolioPage/PortfolioPage.tsx:170).
 * 요약이 필요 없는 호출자(보유만 있는 계산·테스트)를 위한 진입점이다.
 *
 * `today` 가 필요 없다 — 값(#1~#5)은 달력과 무관하다. 그래서 소비처가 날짜 주입 계약을 만들 필요가 없다.
 *
 * ⚠ 이 값은 시뮬 파생 `currentMonthlyDividend`(직전 12개월 **시뮬** 세후 평균, shared/lib/snowball/SnowballGoal.ts)
 * 와 **정의가 다르다** — 여기엔 성장·재투자·적립이 없다. 달성률의 현재값으로 둘 중 무엇을 쓸지는
 * `resolvePortfolioGoalBasis`(pages/Portfolio/components/GoalCard/GoalCard.utils.ts)가 판정한다 —
 * 실측이 서면 실측(원화 환산은 거기서 1회), 아니면 시뮬 폴백.
 */
export const computeMeasuredMonthlyDividend = (
  holdings: readonly PortfolioHolding[],
  taxRatePercent: number | null = null,
  options: MeasuredMonthlyDividendOptions = {}
): number => {
  const resolve = options.resolve ?? resolvePortfolioMarketInfo;
  /*
   * ⚠ 레거시 15.4 → 자동 매핑은 **저장 경계**(PortfolioPage)의 일이다. 엔진 안에서 또 하면 같은 값을
   *   넘겨도 `computePortfolioSummary` 와 결과가 갈린다 — 두 경로가 하나여야 한다는 계약이 깨진다.
   */
  const override =
    taxRatePercent === undefined || taxRatePercent === null
      ? null
      : normalizePortfolioTaxRatePercent(taxRatePercent);

  /*
   * 🔴 `computePortfolioSummary` 와 **같은 규칙**으로 센다 — 종목별 세법 기준(자동) 또는 지정값.
   *   이 함수는 Goal 진행률의 "실측" 자리에 쓰이므로 포트폴리오 화면과 다른 숫자를 내면 안 된다.
   */
  let afterTaxUsd = 0;
  for (const holding of holdings) {
    const valuation = buildValuation(holding, resolve);
    afterTaxUsd += toAfterTax(valuation.annualDividendUsd, resolveHoldingTaxRate(valuation.ticker, override));
  }

  return afterTaxUsd / MONTHS_IN_YEAR;
};
