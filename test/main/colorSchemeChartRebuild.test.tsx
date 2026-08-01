import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { EChartsOption } from 'echarts';
import {
  colorSchemeAtom,
  COLOR_SCHEME_STORAGE_KEY,
  includedTickerIdsAtom,
  PALETTE_STORAGE_KEY,
  tickerProfilesAtom,
  useApplyColorScheme
} from '@/jotai';
import { useMainComputed } from '@/pages/Main/hooks';
import { DEFAULT_THEME_PRESET } from '@/shared/styles';
import type { YearlySeriesKey } from '@/shared/constants';
import type { YieldFormValues } from '@/shared/types';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 밝기(라이트/다크) 전환 → 캔버스 차트 색 갱신 계약.
 *
 * `paletteChartRebuild.test.tsx`가 **색 프리셋 축**에 대해 하는 일을 **밝기 축**에 대해 한다.
 * 테마는 두 축이고 서로 다른 atom이 쥐고 있다 — 팔레트만 구독하면 밝기 토글로는 차트 옵션이
 * 하나도 다시 빌드되지 않아 다크에서 축·라벨이 라이트 값(#495057)으로 남는다(약 2.0:1, 사실상 안 보임).
 *
 * 이 테스트는 실제 앱과 같은 배선을 재현한다:
 *  - globalStyles가 만드는 `:root` / `:root[data-theme='dark']` 변수 스코프를 <style>로 주입
 *    (jsdom은 속성 스코프 커스텀 프로퍼티 캐스케이드를 해석한다 — 팔레트 축에서 사전 검증됨)
 *  - 라우터 루트처럼 부모에서 `useApplyColorScheme()`(html[data-theme] 반영),
 *    자식에서 `useMainComputed()`(차트 옵션 빌드)
 *
 * 검증 대상 색은 비중 파이 라벨의 `chart-label` — 축 라벨·툴팁·범례가 전부 이 토큰을 쓰고,
 * 시리즈 색(`chart-series-*`)과 달리 **라이트/다크가 서로 다른 값**이라 전환을 관측할 수 있다.
 *
 * ⚠ 밝기 기본값은 `system`이고 setup.dom의 matchMedia 스텁이 항상 `matches: false`라
 * 초기 상태는 결정적으로 라이트다.
 */

const labelToken = (scheme: 'light' | 'dark'): string => DEFAULT_THEME_PRESET[scheme]['chart-label'];

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

const values: YieldFormValues = {
  ticker: 'SCHD',
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 9.5,
  frequency: 'quarterly',
  initialInvestment: 10_000_000,
  monthlyContribution: 500_000,
  targetMonthlyDividend: 1_000_000,
  investmentStartDate: '2026-01-01',
  durationYears: 10,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  reinvestTiming: 'sameMonth',
  dpsGrowthMode: 'annualStep'
};

const visibleYearlySeries: Record<YearlySeriesKey, boolean> = {
  totalContribution: true,
  assetValue: true,
  annualDividend: false,
  monthlyDividend: false,
  cumulativeDividend: false
};

/** 파이 옵션에서 조각 라벨 색을 꺼낸다 (series[0].label.color = theme.label). */
const pieLabelColor = (option: EChartsOption | null): string | undefined => {
  const series = option?.series;
  const pie = Array.isArray(series) ? series[0] : series;
  return (pie as { label?: { color?: string } } | undefined)?.label?.color;
};

/** 연도 막대 차트 x축 라벨 색 — 리뷰가 지목한 "다크에서 안 보이는" 바로 그 표면. */
const xAxisLabelColor = (option: EChartsOption | null): string | undefined => {
  const xAxis = option?.xAxis;
  const axis = Array.isArray(xAxis) ? xAxis[0] : xAxis;
  return (axis as { axisLabel?: { color?: string } } | undefined)?.axisLabel?.color;
};

describe('밝기 전환 → 차트 옵션 리빌드', () => {
  let styleEl: HTMLStyleElement;

  beforeEach(() => {
    window.localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY);
    window.localStorage.removeItem(PALETTE_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');

    // globalStyles의 밝기 스코프 축약판 — 속성 없음(프리페인트 전/OS 따름) = 라이트.
    styleEl = document.createElement('style');
    styleEl.textContent = [
      `:root { --sb-chart-label: ${labelToken('light')}; }`,
      `:root[data-theme='light'] { --sb-chart-label: ${labelToken('light')}; }`,
      `:root[data-theme='dark'] { --sb-chart-label: ${labelToken('dark')}; }`
    ].join('\n');
    document.head.appendChild(styleEl);
  });

  afterEach(() => {
    styleEl.remove();
    document.documentElement.removeAttribute('data-theme');
    window.localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY);
    window.localStorage.removeItem(PALETTE_STORAGE_KEY);
  });

  it('라이트와 다크의 chart-label 토큰은 서로 다른 값이다 (이 계약이 관측 가능하다는 전제)', () => {
    expect(labelToken('light')).not.toBe(labelToken('dark'));
  });

  it('colorSchemeAtom을 dark로 바꾸면 차트 옵션 라벨 색이 다크 chart-label로 리빌드된다', () => {
    const store = createStore();
    store.set(tickerProfilesAtom, [profile]);
    store.set(includedTickerIdsAtom, [profile.id]);

    // 앱 구성 재현: 부모(라우터 루트)가 data-theme을 반영하고, 자식(Main)이 차트 옵션을 빌드한다.
    const AppWiring = ({ children }: { children: ReactNode }) => {
      useApplyColorScheme();
      return <>{children}</>;
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <AppWiring>{children}</AppWiring>
      </Provider>
    );

    const { result } = renderHook(
      () =>
        useMainComputed({
          isValid: true,
          values,
          visibleYearlySeries,
          isYearlyAreaFillOn: false,
          postInvestmentProjectionYears: 10
        }),
      { wrapper }
    );

    // 초기: 선호 `system` + OS 라이트 → 어트리뷰트 없음, 라이트 라벨 색.
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(pieLabelColor(result.current.allocationPieOption)).toBe(labelToken('light'));
    expect(xAxisLabelColor(result.current.yearlyResultBarOption)).toBe(labelToken('light'));

    // 사용자 행동: 밝기 토글이 하는 일 = colorSchemeAtom 쓰기 (DOM 조작 없음 — ColorSchemeToggle 참고).
    act(() => {
      store.set(colorSchemeAtom, 'dark');
    });

    // 반영: html[data-theme] 갱신 + 차트 옵션이 다크 색으로 리빌드.
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(pieLabelColor(result.current.allocationPieOption)).toBe(labelToken('dark'));
    expect(xAxisLabelColor(result.current.yearlyResultBarOption)).toBe(labelToken('dark'));

    // 되돌리기도 같은 경로로 관측된다(단방향 가드 방지).
    act(() => {
      store.set(colorSchemeAtom, 'light');
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(pieLabelColor(result.current.allocationPieOption)).toBe(labelToken('light'));
    expect(xAxisLabelColor(result.current.yearlyResultBarOption)).toBe(labelToken('light'));
  });
});
