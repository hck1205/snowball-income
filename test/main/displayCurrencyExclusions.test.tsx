import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { SimSummaryStats, type SimSummaryStatsVariant } from '@/components/community/SimSummaryStats';
import {
  DISPLAY_CURRENCY_STORAGE_KEY,
  displayCurrencyAtom,
  effectiveDisplayCurrencyAtom,
  fxViewAtom
} from '@/jotai';
import { buildRecentCashflowBarOption } from '@/shared/lib/charts';
import {
  buildAllocationPieOption,
  buildOgShareText,
  buildYearlyResultBarOption,
  type OgCardModel
} from '@/pages/Main/utils';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { TickerProfile } from '@/shared/types/snowball';
import type { YearlySeriesKey } from '@/shared/constants';
import type { EChartsOption } from 'echarts';

/**
 * 표시 통화 **제외 표면**의 누출 방지.
 *
 * 표시 통화는 기기별 로컬 취향이다. 커뮤니티 카드·OG 카드는 **다른 사람이 보는 화면**이라
 * 내 로컬 설정이 새면 남의 화면 숫자가 바뀐다(그리고 게시 시점에 굳은 값과 어긋난다).
 * PDF 리포트·입력 필드도 같은 이유로 원화 고정이다.
 *
 * 그래서 여기서는 "달러를 실제로 켠 상태"를 만든 뒤 그 표면들이 **여전히 원화**인지 본다.
 * (구현상 이 표면들은 통화 atom을 아예 구독하지 않는다 — 그 구조가 유지되는지의 회귀 가드다.)
 */

const FX_RATE = { rate: 1_000, base: 'USD', quote: 'KRW', asOf: '2026-07-23T00:02:31.000Z' } as const;

const simSummary = (overrides: Partial<ScenarioSimSummary> = {}): ScenarioSimSummary => ({
  version: 1,
  durationYears: 20,
  tickerCount: 4,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  totalContribution: 250_000_000,
  finalAssetValue: 920_000_000,
  finalMonthlyDividend: 1_870_000,
  targetMonthlyDividend: 3_000_000,
  targetReachedInYears: 8,
  ...overrides
});

const ogModel = (overrides: Partial<OgCardModel> = {}): OgCardModel => ({
  holdings: [
    { ticker: 'SCHD', percent: 60 },
    { ticker: 'JEPI', percent: 40 }
  ],
  hiddenHoldingCount: 0,
  durationYears: 20,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  finalMonthlyDividend: 3_500_000,
  finalAssetValue: 1_240_000_000,
  targetReachedYear: 2038,
  ...overrides
});

/** 달러 표시가 **적용된** 스토어(선호 + 환율 둘 다). 이 상태에서도 아래 표면은 원화여야 한다. */
const usdStore = () => {
  const store = createStore();
  store.set(fxViewAtom, { status: 'success', rate: FX_RATE });
  store.set(displayCurrencyAtom, 'USD');
  expect(store.get(effectiveDisplayCurrencyAtom)).toBe('USD');
  return store;
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('커뮤니티 시뮬 요약(SimSummaryStats)은 통화 토글에 반응하지 않는다', () => {
  it.each<SimSummaryStatsVariant>(['card', 'row', 'attach'])(
    '%s 변형: 달러 모드에서도 게시 시점 원화 숫자를 그대로 보여준다',
    (variant) => {
      const store = usdStore();
      const { container } = render(
        createElement(Provider, { store }, createElement(SimSummaryStats, { variant, summary: simSummary() }))
      );

      const text = container.textContent ?? '';
      expect(text).not.toContain('$');
      // 원화 축약 표기(만원/억)가 그대로 살아 있다.
      expect(text).toContain('187만원');
      expect(text).toContain('9.2억');
    }
  );

  it('카드 컨텍스트 줄(초기·월 투입)도 원화 그대로다', () => {
    render(
      createElement(
        Provider,
        { store: usdStore() },
        createElement(SimSummaryStats, { variant: 'card', summary: simSummary() })
      )
    );

    expect(screen.getByText('초기 1,000만원 · 월 100만원 · 20년 · 티커 4개')).toBeInTheDocument();
  });

  it('localStorage 에 달러 선호가 저장돼 있어도(다음 세션 재방문) 원화로 그린다', () => {
    window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, 'USD');

    const { container } = render(
      createElement(
        Provider,
        { store: usdStore() },
        createElement(SimSummaryStats, { variant: 'card', summary: simSummary() })
      )
    );

    expect(container.textContent ?? '').not.toContain('$');
  });
});

/* ── PDF 리포트·커뮤니티 상세 미리보기: 차트 빌더의 **기본 인자**가 원화라는 계약 ───────────── */

const yAxisLabel = (option: EChartsOption, value: number): string => {
  const yAxis = Array.isArray(option.yAxis) ? option.yAxis[0] : option.yAxis;
  const formatter = (yAxis as { axisLabel?: { formatter?: (v: number) => string } } | undefined)?.axisLabel?.formatter;
  return formatter ? formatter(value) : '';
};

const pieCenterText = (option: EChartsOption | null): string | undefined => {
  const graphic = option?.graphic as Array<{ children?: Array<{ style?: { text?: string } }> }> | undefined;
  return graphic?.[0]?.children?.[1]?.style?.text;
};

const profile: TickerProfile = {
  id: 'ticker-1',
  ticker: 'SCHD',
  name: '슈드',
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 9.5,
  frequency: 'quarterly'
};

const allVisible: Record<YearlySeriesKey, boolean> = {
  totalContribution: true,
  assetValue: true,
  annualDividend: true,
  monthlyDividend: true,
  cumulativeDividend: true
};

describe('PDF 리포트·커뮤니티 미리보기 경로(빌더 기본 인자)는 원화로 남는다', () => {
  /**
   * PDF 파이프라인(`pdfReportPipeline.buildCharts`)과 커뮤니티 상세 미리보기는 포맷터 인자를
   * **주지 않고** 빌더를 부른다 — 즉 기본값이 원화라는 계약 위에 서 있다. 그 기본값이 통화 atom을
   * 몰래 읽는 순간(전역 참조) 남의 화면과 인쇄물이 내 로컬 설정으로 물든다.
   */
  it('연간 결과·실지급 배당 축 라벨은 달러 모드에서도 원화다', () => {
    usdStore();

    expect(
      yAxisLabel(buildYearlyResultBarOption({ tableRows: [], visibleYearlySeries: allVisible, isYearlyAreaFillOn: true }), 1_000_000)
    ).toBe('₩1,000,000');
    expect(yAxisLabel(buildRecentCashflowBarOption({ months: [], series: [] }), 1_000_000)).toBe('₩1,000,000');
  });

  it('파이 중앙 월배당도 달러 모드에서 원화 축약 표기 그대로다', () => {
    usdStore();

    const option = buildAllocationPieOption({
      normalizedAllocation: [{ profile, weight: 1 }],
      showPortfolioDividendCenter: true,
      finalMonthlyAverageDividend: 1_870_000
    });

    expect(pieCenterText(option)).toBe('약 187만');
    expect(pieCenterText(option)).not.toContain('$');
  });
});

describe('OG 공유 텍스트는 통화 토글에 반응하지 않는다', () => {
  it('제목·설명·이미지 대체텍스트가 달러 모드 전/후로 완전히 동일하다', () => {
    const model = ogModel();
    const before = buildOgShareText(model);

    usdStore();
    window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, 'USD');
    const after = buildOgShareText(model);

    expect(after).toEqual(before);
    expect(after.title).toBe('20년 후 월 배당 350만 · 2038년 목표 달성 — Hungry Hippo');
    expect(`${after.title}${after.description}${after.imageAlt}`).not.toContain('$');
  });
});
