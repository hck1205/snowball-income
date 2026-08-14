import { describe, expect, it } from 'vitest';

import {
  KOREAN_DIVIDEND_TAX_RATE,
  resolveDefaultDividendTaxRatePercent,
  US_LISTED_DIVIDEND_TAX_RATE
} from '@/shared/constants/tax';
import { createDefaultYieldFormValues, runSimulation, toSimulationInput } from '@/shared/lib/snowball';
import type { SimulationInput } from '@/shared/types';

/**
 * **배당소득세 기본값이 상장지에서 나온다**는 계약 (2026-08-14).
 *
 * 🔴 고친 결함 둘:
 *   1. 세율 **미입력이 0%** 였다 — 세율은 선택 입력이라 비운 폼·세율 없이 저장된 페이로드·`h:null`
 *      공유 링크가 전부 **무세금**으로 계산됐다. 화면엔 아무 경고도 없었다(조용한 과대추정).
 *   2. 기본값이 상장지와 무관하게 **15.4% 고정**이었다 — 이 사이트의 주 종목인 미국 상장 ETF 는
 *      15.0% 다(미국 원천징수로 끝. 국내 14% 가 더 낮아 추가 징수가 없다).
 *
 * ⚠ 이 변경은 **의도적으로 하위호환을 깬다**(2026-08-14 사용자 결정) — 세율을 비운 채 나간 공유 링크의
 *   숫자가 바뀐다. 숫자가 바뀌더라도 정확한 쪽을 택했다.
 */

const buildInput = (ticker: string, taxRate: number | undefined): SimulationInput => ({
  ticker: {
    ticker,
    initialPrice: 100_000,
    dividendYield: 4,
    dividendGrowth: 0,
    expectedTotalReturn: 4,
    frequency: 'quarterly'
  },
  settings: {
    initialInvestment: 12_000_000,
    monthlyContribution: 0,
    targetMonthlyDividend: 1_000_000,
    investmentStartDate: '2026-01-01',
    durationYears: 1,
    reinvestDividends: false,
    reinvestDividendPercent: 0,
    taxRate,
    reinvestTiming: 'sameMonth',
    dpsGrowthMode: 'annualStep'
  }
});

const totalTax = (ticker: string, taxRate: number | undefined): number =>
  runSimulation(buildInput(ticker, taxRate)).summary.totalTaxPaid;

describe('resolveDefaultDividendTaxRatePercent', () => {
  it('미국 상장은 15% — 원천징수로 끝나고 국내 추가 징수가 없다', () => {
    expect(resolveDefaultDividendTaxRatePercent('SCHD')).toBe(US_LISTED_DIVIDEND_TAX_RATE);
    expect(US_LISTED_DIVIDEND_TAX_RATE).toBe(15);
  });

  it('국내 상장(.KS/.KQ)은 15.4% — 소득세 14% + 지방소득세 1.4%', () => {
    expect(resolveDefaultDividendTaxRatePercent('458730.KS')).toBe(KOREAN_DIVIDEND_TAX_RATE);
    expect(resolveDefaultDividendTaxRatePercent('123456.KQ')).toBe(KOREAN_DIVIDEND_TAX_RATE);
    expect(KOREAN_DIVIDEND_TAX_RATE).toBe(15.4);
  });

  it('미국·국내를 겹쳐 세지 않는다 — 15 + 15.4 는 세부담 이중 계상이다', () => {
    expect(US_LISTED_DIVIDEND_TAX_RATE).toBeLessThan(KOREAN_DIVIDEND_TAX_RATE + US_LISTED_DIVIDEND_TAX_RATE);
    expect(resolveDefaultDividendTaxRatePercent('SCHD')).toBeLessThan(20);
  });
});

describe('엔진 — 세율 미입력', () => {
  it('🔴 0% 로 계산하지 않는다 (과대추정 방지)', () => {
    expect(totalTax('SCHD', undefined)).toBeGreaterThan(0);
  });

  it('미국 상장은 15% 로 계산한다', () => {
    expect(totalTax('SCHD', undefined)).toBeCloseTo(totalTax('SCHD', 15), 6);
  });

  it('국내 상장은 15.4% 로 계산한다 — 같은 조건이라도 종목에 따라 갈린다', () => {
    expect(totalTax('458730.KS', undefined)).toBeCloseTo(totalTax('458730.KS', 15.4), 6);
    expect(totalTax('458730.KS', undefined)).toBeGreaterThan(totalTax('SCHD', undefined));
  });

  it('포트폴리오 시뮬레이션도 종목마다 정확해진다 — 같은 입력, 다른 종목, 다른 세금', () => {
    // 엔진은 종목별로 호출되므로(pages/Main/utils/simulation.ts) 촉점 하나로 전 종목이 덮인다.
    expect(totalTax('JEPI', undefined)).toBeCloseTo(totalTax('SCHD', undefined), 6);
    expect(totalTax('161510.KS', undefined)).toBeCloseTo(totalTax('458730.KS', undefined), 6);
  });
});

describe('엔진 — 사용자 입력이 항상 이긴다', () => {
  it('명시한 세율을 그대로 쓴다', () => {
    expect(totalTax('SCHD', 30)).toBeGreaterThan(totalTax('SCHD', undefined));
  });

  it('🔴 0 은 "미입력"이 아니라 "0%"다 — ISA·연금 등을 그렇게 표현한다', () => {
    // `??` 가 아니라 `||` 를 쓰면 여기가 깨진다(0 이 falsy 라 기본값으로 대체된다).
    expect(totalTax('SCHD', 0)).toBe(0);
  });
});

describe('폼 기본값', () => {
  it('기본 종목(SCHD, 미국 상장)의 세율은 15% 다', () => {
    expect(createDefaultYieldFormValues(new Date('2026-08-14')).taxRate).toBe(15);
  });

  it('기본 폼으로 만든 엔진 입력이 그 세율을 그대로 싣는다', () => {
    const values = createDefaultYieldFormValues(new Date('2026-08-14'));
    expect(toSimulationInput(values).settings.taxRate).toBe(15);
  });
});
