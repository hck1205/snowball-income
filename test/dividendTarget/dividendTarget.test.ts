// @vitest-environment node — 순수 계산만 본다 (DOM 불필요)
import { describe, expect, it } from 'vitest';

import { FINANCIAL_INCOME_TAX_THRESHOLD, US_LISTED_DIVIDEND_TAX_RATE } from '@/shared/constants/tax';
import { DEFAULT_INFLATION_RATE } from '@/shared/constants/inflation';
import { MARKET_DATA } from '@/shared/constants/marketData';
import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';
import { TICKER_PAGE_INDEX } from '@/shared/constants/tickerPages';
import { principalForMonthlyDividend } from '@/shared/lib/goalPlan';
import { paymentsPerYearMap } from '@/shared/lib/snowball';
import {
  buildDividendTargetModel,
  compareDividendGrowthToInflation,
  computeDividendRequirement,
  DEFAULT_DIVIDEND_TARGET_TICKER,
  DIVIDEND_TARGET_CATEGORIES,
  DIVIDEND_TARGET_TICKERS,
  findTickerRequirement,
  taxRateForTicker
} from '@/shared/lib/dividendTarget';

/**
 * `/dividend/how-much` 의 계산 계층 (2026-11-01).
 *
 * 🔴 이 화면이 틀리는 방식은 하나다: **"앱이 9.8억이라고 해서 넣었는데 월 250이 안 나온다."**
 *    그래서 아래 "왕복" 블록이 핵심이다 — 모델이 낸 원금을 되돌려 월 배당을 다시 계산해
 *    목표와 일치하는지 본다. 세금 분해가 어긋나면 거기서 먼저 빨개진다.
 */

const MONTHLY_TARGET = 2_500_000;

describe('computeDividendRequirement — 세금 분해', () => {
  it('세전 − 세금 === 세후 (항등식이 깨지면 표의 세 줄이 서로 모순된다)', () => {
    const result = computeDividendRequirement({
      monthlyAfterTax: MONTHLY_TARGET,
      dividendYieldPercent: 3.13,
      taxRatePercent: US_LISTED_DIVIDEND_TAX_RATE
    });

    expect(result).not.toBeNull();
    expect(result!.annualPreTax - result!.annualTax).toBeCloseTo(result!.annualAfterTax, 6);
    expect(result!.annualAfterTax).toBe(MONTHLY_TARGET * 12);
  });

  it('🔴 왕복 — 낸 원금 × 배당률 × (1 − 세율) ÷ 12 가 목표 월 배당으로 되돌아온다', () => {
    for (const yieldPercent of [1.28, 3.13, 5.08, 11.9]) {
      const result = computeDividendRequirement({
        monthlyAfterTax: MONTHLY_TARGET,
        dividendYieldPercent: yieldPercent,
        taxRatePercent: US_LISTED_DIVIDEND_TAX_RATE
      });

      expect(result, `배당률 ${yieldPercent}%`).not.toBeNull();

      const annualPreTax = result!.requiredPrincipal * (yieldPercent / 100);
      const monthlyAfterTax = (annualPreTax * (1 - US_LISTED_DIVIDEND_TAX_RATE / 100)) / 12;

      expect(monthlyAfterTax, `배당률 ${yieldPercent}%`).toBeCloseTo(MONTHLY_TARGET, 4);
    }
  });

  it('원금은 `goalPlan` 의 식과 같다 — 식이 두 벌이 되면 랜딩과 이 화면이 갈린다', () => {
    const result = computeDividendRequirement({
      monthlyAfterTax: MONTHLY_TARGET,
      dividendYieldPercent: 3.13,
      taxRatePercent: US_LISTED_DIVIDEND_TAX_RATE
    });

    const fromGoalPlan = principalForMonthlyDividend({
      monthlyDividend: MONTHLY_TARGET,
      dividendYield: 0.0313,
      taxRate: US_LISTED_DIVIDEND_TAX_RATE / 100
    });

    expect(result!.requiredPrincipal).toBe(fromGoalPlan);
  });

  it('성립하지 않는 입력은 `null` 이다 — 0 이나 Infinity 로 채우지 않는다', () => {
    const base = { monthlyAfterTax: MONTHLY_TARGET, taxRatePercent: US_LISTED_DIVIDEND_TAX_RATE };

    expect(computeDividendRequirement({ ...base, dividendYieldPercent: 0 })).toBeNull();
    expect(computeDividendRequirement({ ...base, dividendYieldPercent: -1 })).toBeNull();
    expect(computeDividendRequirement({ ...base, dividendYieldPercent: Number.NaN })).toBeNull();
    expect(computeDividendRequirement({ ...base, monthlyAfterTax: 0, dividendYieldPercent: 3 })).toBeNull();
    expect(computeDividendRequirement({ ...base, dividendYieldPercent: 3, taxRatePercent: 100 })).toBeNull();
    expect(computeDividendRequirement({ ...base, dividendYieldPercent: 3, taxRatePercent: -1 })).toBeNull();
  });

  it('🔴 금융소득종합과세 초과를 기준금액에서 판정한다 (세전 연 배당 기준)', () => {
    /* 기준(2,000만원)을 세전 연 배당이 **딱 넘기는** 월 목표를 역산해 경계를 양쪽에서 찍는다. */
    const taxRate = US_LISTED_DIVIDEND_TAX_RATE / 100;
    const boundaryMonthly = (FINANCIAL_INCOME_TAX_THRESHOLD * (1 - taxRate)) / 12;

    const under = computeDividendRequirement({
      monthlyAfterTax: boundaryMonthly - 1000,
      dividendYieldPercent: 3.13,
      taxRatePercent: US_LISTED_DIVIDEND_TAX_RATE
    });
    const over = computeDividendRequirement({
      monthlyAfterTax: boundaryMonthly + 1000,
      dividendYieldPercent: 3.13,
      taxRatePercent: US_LISTED_DIVIDEND_TAX_RATE
    });

    expect(under!.exceedsFinancialIncomeThreshold).toBe(false);
    expect(over!.exceedsFinancialIncomeThreshold).toBe(true);
  });

  it('월 250만원 목표는 기준금액을 넘는다 — 화면이 기본적으로 알려야 하는 사실이다', () => {
    const result = computeDividendRequirement({
      monthlyAfterTax: MONTHLY_TARGET,
      dividendYieldPercent: 3.13,
      taxRatePercent: US_LISTED_DIVIDEND_TAX_RATE
    });

    expect(result!.annualPreTax).toBeGreaterThan(FINANCIAL_INCOME_TAX_THRESHOLD);
    expect(result!.exceedsFinancialIncomeThreshold).toBe(true);
  });
});

describe('taxRateForTicker — 상장지에서 파생', () => {
  it('미국 상장은 15%, 국내 상장(.KS)은 15.4%', () => {
    expect(taxRateForTicker('SCHD')).toBe(15);
    expect(taxRateForTicker('458730.KS')).toBe(15.4);
  });
});

describe('compareDividendGrowthToInflation', () => {
  it('인상률이 물가보다 높으면 beats, 낮거나 같으면 trails', () => {
    expect(compareDividendGrowthToInflation(9.13, 2).verdict).toBe('beats');
    expect(compareDividendGrowthToInflation(1.86, 2).verdict).toBe('trails');
    expect(compareDividendGrowthToInflation(2, 2).verdict).toBe('trails');
  });

  it('🔴 자료 없음은 unknown 이다 — trails 로 접으면 없는 사실이 생긴다', () => {
    expect(compareDividendGrowthToInflation(null, 2)).toEqual({ verdict: 'unknown', gapPercentPoints: null });
    expect(compareDividendGrowthToInflation(Number.NaN, 2).verdict).toBe('unknown');
  });

  it('격차는 %p 차이다 (마이너스 인상률도 그대로 전달한다)', () => {
    expect(compareDividendGrowthToInflation(9.13, 2).gapPercentPoints).toBeCloseTo(7.13, 10);
    expect(compareDividendGrowthToInflation(-4.33, 2).gapPercentPoints).toBeCloseTo(-6.33, 10);
  });
});

describe('큐레이션 12 종', () => {
  it('네 묶음 × 세 종목 = 12 종이고 중복이 없다', () => {
    expect(DIVIDEND_TARGET_CATEGORIES).toHaveLength(4);
    for (const category of DIVIDEND_TARGET_CATEGORIES) {
      expect(category.tickers, category.id).toHaveLength(3);
    }
    expect(DIVIDEND_TARGET_TICKERS).toHaveLength(12);
    expect(new Set(DIVIDEND_TARGET_TICKERS).size).toBe(12);
  });

  it('🔴 전부 `/ticker/<slug>` 소개 페이지가 실재한다 — 없으면 카드가 죽은 링크를 만든다', () => {
    const withPage = new Set<string>(TICKER_PAGE_INDEX.map((entry) => entry.symbol));
    const missing = DIVIDEND_TARGET_TICKERS.filter((ticker) => !withPage.has(ticker));

    expect(missing).toEqual([]);
  });

  it('🔴 전부 유니버스에 있다 — 없으면 모델에서 조용히 빠져 화면에 11 종만 뜬다', () => {
    const universe = DIVIDEND_UNIVERSE as Record<string, unknown>;
    const missing = DIVIDEND_TARGET_TICKERS.filter((ticker) => !universe[ticker]);

    expect(missing).toEqual([]);
  });

  it('기본 종목이 큐레이션 안에 있다', () => {
    expect(DIVIDEND_TARGET_TICKERS).toContain(DEFAULT_DIVIDEND_TARGET_TICKER);
  });

  it('배당률이 전부 0 보다 크다 — 0 이면 필요 원금이 계산되지 않아 카드가 빈다', () => {
    const universe = DIVIDEND_UNIVERSE as Record<string, { dividendYield: number }>;
    const zeroYield = DIVIDEND_TARGET_TICKERS.filter((ticker) => !(universe[ticker].dividendYield > 0));

    expect(zeroYield).toEqual([]);
  });
});

describe('buildDividendTargetModel', () => {
  const model = buildDividendTargetModel(MONTHLY_TARGET, DEFAULT_INFLATION_RATE);

  it('12 종이 전부 모델에 들어온다 (조용한 누락이 조용히 배포되는 것을 막는다)', () => {
    expect(model.all).toHaveLength(12);
    expect(model.all.map((item) => item.ticker)).toEqual([...DIVIDEND_TARGET_TICKERS]);
  });

  it('묶음 순서가 큐레이션 순서와 같다 — 배치가 곧 주장이라 순서가 우연이면 안 된다', () => {
    expect(model.categories.map((group) => group.category.id)).toEqual(['growth', 'highYield', 'coveredCall', 'monthly']);
  });

  it('종목마다 필요 원금이 나오고, 세후 연 배당은 목표와 같다', () => {
    for (const item of model.all) {
      expect(item.requirement, item.ticker).not.toBeNull();
      expect(item.requirement!.requiredPrincipal, item.ticker).toBeGreaterThan(0);
      expect(item.requirement!.annualAfterTax, item.ticker).toBe(MONTHLY_TARGET * 12);
    }
  });

  it('배당률이 높은 종목일수록 필요 원금이 적다 (같은 세율 안에서 단조)', () => {
    const sorted = [...model.all].sort((a, b) => b.dividendYieldPercent - a.dividendYieldPercent);

    for (let index = 1; index < sorted.length; index += 1) {
      expect(
        sorted[index].requirement!.requiredPrincipal,
        `${sorted[index - 1].ticker} → ${sorted[index].ticker}`
      ).toBeGreaterThanOrEqual(sorted[index - 1].requirement!.requiredPrincipal);
    }
  });

  it('🔴 배당 인상률은 스냅샷의 `observedDividendCagr` 와 **같은 값**이다 (`dividendGrowth` 가 아니다)', () => {
    /*
     * 이 레포의 `dividendGrowth` 는 배당 인상률이 아니라 주가 성장률(파생 가정)이다.
     * 둘을 섞으면 "우리가 가정한 값"을 "관측된 배당 인상률"로 발표하게 된다 — 날조다.
     */
    for (const item of model.all) {
      const observed = MARKET_DATA.entries[item.ticker]?.observedDividendCagr;
      expect(item.dividendCagrPercent, item.ticker).toBe(typeof observed === 'number' ? observed : null);
    }
  });

  it('인상률 자료가 없는 종목은 물가 비교가 unknown 이다', () => {
    for (const item of model.all) {
      if (item.dividendCagrPercent !== null) continue;
      expect(item.inflation.verdict, item.ticker).toBe('unknown');
    }
  });

  it('물가 가정을 올리면 beats 종목이 늘지 않는다 (단조성)', () => {
    const countBeats = (rate: number) =>
      buildDividendTargetModel(MONTHLY_TARGET, rate).all.filter((item) => item.inflation.verdict === 'beats').length;

    expect(countBeats(3.0)).toBeLessThanOrEqual(countBeats(2.0));
  });

  it('목표를 두 배로 하면 필요 원금도 두 배다 (선형)', () => {
    const doubled = buildDividendTargetModel(MONTHLY_TARGET * 2, DEFAULT_INFLATION_RATE);

    for (const item of model.all) {
      const other = findTickerRequirement(doubled, item.ticker);
      expect(other!.requirement!.requiredPrincipal, item.ticker).toBeCloseTo(
        item.requirement!.requiredPrincipal * 2,
        4
      );
    }
  });

  it('한 번 받는 금액 × 연 지급 횟수 === 세후 연 배당 (지급 횟수는 엔진 정본)', () => {
    for (const item of model.all) {
      const payouts = paymentsPerYearMap[item.frequency];
      expect(item.perPayoutAfterTax, item.ticker).not.toBeNull();
      expect(item.perPayoutAfterTax! * payouts, item.ticker).toBeCloseTo(item.requirement!.annualAfterTax, 6);
    }
  });

  it('종목마다 자기 묶음 이름을 들고 다닌다 (화면이 큐레이션을 다시 뒤지지 않게)', () => {
    for (const group of model.categories) {
      for (const item of group.tickers) expect(item.categoryLabel, item.ticker).toBe(group.category.label);
    }
  });

  it('`findTickerRequirement` 는 없는 종목에 `null` 을 준다 — 첫 종목으로 몰래 대체하지 않는다', () => {
    expect(findTickerRequirement(model, 'SCHD')?.ticker).toBe('SCHD');
    expect(findTickerRequirement(model, 'NOPE')).toBeNull();
  });
});
