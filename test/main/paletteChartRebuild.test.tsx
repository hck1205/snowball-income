import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { EChartsOption } from 'echarts';
import {
  includedTickerIdsAtom,
  palettePresetAtom,
  PALETTE_STORAGE_KEY,
  tickerProfilesAtom,
  useApplyPalettePreset
} from '@/jotai';
import { useMainComputed } from '@/pages/Main/hooks';
import { THEME_PRESETS } from '@/shared/styles';
import { PALETTE_PRESET_IDS } from '@/shared/constants';
import type { PalettePresetId, YearlySeriesKey } from '@/shared/constants';
import type { YieldFormValues } from '@/shared/types';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 프리셋 전환 → 캔버스 차트 색 갱신 계약.
 *
 * ECharts는 캔버스라 CSS 변수를 다시 읽지 않는다 — `palettePresetAtom`이 바뀌면
 * 차트 옵션이 **새 프리셋의 chart-series 색으로** 다시 빌드되어야 한다
 * (chartTheme.ts 주석, useMainComputed의 useMemo 의존성 배선).
 *
 * 이 테스트는 실제 앱과 같은 배선을 재현한다:
 *  - globalStyles가 만드는 `:root[data-palette='<id>']` 변수 스코프를 <style>로 주입
 *    (jsdom은 속성 스코프 커스텀 프로퍼티 캐스케이드를 해석한다 — 사전 검증됨)
 *  - 라우터 루트처럼 부모에서 `useApplyPalettePreset()`(html[data-palette] 반영),
 *    자식에서 `useMainComputed()`(차트 옵션 빌드)
 *
 * 검증 대상 색은 파이 조각 0의 `chart-series-0` — 4프리셋 모두 서로 다른 값이라
 * 전환이 실제로 반영됐는지 구분할 수 있다 (series-1(orange)은 전 프리셋 공통이라 부적합).
 */

const seriesZero = (id: PalettePresetId): string => THEME_PRESETS[id].light['chart-series-0'];

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
  investmentStartDate: '2026-01',
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

/** 파이 옵션에서 조각 0의 색을 꺼낸다 (data[0].itemStyle.color = theme.series[0]). */
const sliceZeroColor = (option: EChartsOption | null): string | undefined => {
  const series = option?.series;
  const pie = Array.isArray(series) ? series[0] : series;
  const data = (pie as { data?: Array<{ itemStyle?: { color?: string } }> } | undefined)?.data;
  return data?.[0]?.itemStyle?.color;
};

describe('프리셋 전환 → 차트 옵션 리빌드', () => {
  let styleEl: HTMLStyleElement;

  beforeEach(() => {
    window.localStorage.removeItem(PALETTE_STORAGE_KEY);
    document.documentElement.removeAttribute('data-palette');

    // globalStyles의 프리셋 스코프 축약판 — 속성 없음(no-JS 폴백) = 기본 프리셋(velog).
    styleEl = document.createElement('style');
    styleEl.textContent = [
      `:root { --sb-chart-series-0: ${seriesZero('velog')}; }`,
      ...PALETTE_PRESET_IDS.map((id) => `:root[data-palette='${id}'] { --sb-chart-series-0: ${seriesZero(id)}; }`)
    ].join('\n');
    document.head.appendChild(styleEl);
  });

  afterEach(() => {
    styleEl.remove();
    document.documentElement.removeAttribute('data-palette');
    window.localStorage.removeItem(PALETTE_STORAGE_KEY);
  });

  it('palettePresetAtom을 바꾸면 파이 옵션 조각 색이 새 프리셋의 chart-series-0으로 리빌드된다', () => {
    const store = createStore();
    store.set(tickerProfilesAtom, [profile]);
    store.set(includedTickerIdsAtom, [profile.id]);

    // 앱 구성 재현: 부모(라우터 루트)가 data-palette를 반영하고, 자식(Main)이 차트 옵션을 빌드한다.
    const AppWiring = ({ children }: { children: ReactNode }) => {
      useApplyPalettePreset();
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
          isValid: false, // 시뮬레이션 본체는 이 계약과 무관 — 파이는 normalizedAllocation만으로 그려진다.
          values,
          visibleYearlySeries,
          isYearlyAreaFillOn: false,
          postInvestmentProjectionYears: 10
        }),
      { wrapper }
    );

    // 초기: 기본 프리셋(velog)의 시리즈 색.
    expect(document.documentElement.getAttribute('data-palette')).toBe('velog');
    expect(sliceZeroColor(result.current.allocationPieOption)).toBe(seriesZero('velog'));

    // 사용자 행동: 스위처가 하는 일 = palettePresetAtom 쓰기 (DOM 조작 없음 — ThemePresetSwitcher 참고).
    act(() => {
      store.set(palettePresetAtom, 'aurora');
    });

    // 반영: html[data-palette] 갱신 + 차트 옵션이 새 프리셋 색으로 리빌드.
    expect(document.documentElement.getAttribute('data-palette')).toBe('aurora');
    expect(sliceZeroColor(result.current.allocationPieOption)).toBe(seriesZero('aurora'));
  });
});
