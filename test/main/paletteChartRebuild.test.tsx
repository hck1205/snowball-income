import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EChartsOption } from 'echarts';
import {
  includedTickerIdsAtom,
  palettePresetAtom,
  PALETTE_STORAGE_KEY,
  tickerProfilesAtom,
  useApplyPalettePreset
} from '@/jotai';
import { useMainComputed } from '@/pages/Main/hooks';
import { CHART_SERIES_VARS, THEME_PRESETS } from '@/shared/styles';
import { assignSeriesIndexes } from '@/shared/lib/tickerSeries';

/** 팔레트 슬롯 수 — 앱과 같은 값을 쓴다(테스트가 자기 숫자를 갖지 않는다). */
const PALETTE_SIZE = CHART_SERIES_VARS.length;
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
 * 🔓 2026-08-01 부터 색 프리셋은 화면에서 감춰져 팔레트가 기본값 하나로 고정된다 —
 * 그 상태에서는 "전환"이 일어나지 않아 이 계약을 관측할 수 없다. 그렇다고 테스트를 지우면
 * 감추기를 되돌리는 날 **차트 리빌드 배선이 끊긴 걸 아무도 모르게 된다**(이 배선은 그때
 * 조용히 사라지기 가장 쉬운 종류다). 그래서 노출 목록만 원래대로 돌려놓은 세계를 목으로
 * 재현해 계약을 계속 지킨다 — 되살릴 때 고칠 한 줄이 정확히 이 목이 하는 일이다.
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
vi.mock('@/shared/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/constants')>();
  return {
    ...actual,
    VISIBLE_PALETTE_PRESET_IDS: actual.PALETTE_PRESET_IDS,
    isVisiblePalettePresetId: actual.isPalettePresetId,
    toVisiblePalettePresetId: actual.normalizePalettePresetId
  };
});

/**
 * 이 화면이 그리는 유일한 종목(SCHD)에 **실제로 배정되는** 시리즈 슬롯.
 *
 * 🔴 0 을 하드코딩하지 않는다(2026-08-03 D4). 조각 색은 이제 목록 순서가 아니라
 * 종목 이름 해시 + 충돌 회피로 정해지므로, 어느 번호가 나오는지는 구현 세부다.
 * 여기서 지키려는 계약은 **"프리셋을 바꾸면 새 프리셋 색으로 리빌드된다"** 이지
 * "0번 슬롯을 쓴다"가 아니다 — 번호를 고정하면 종목명만 바뀌어도 빨개진다.
 */
const SLOT = assignSeriesIndexes(['SCHD'], PALETTE_SIZE).get('SCHD')!;

const seriesColor = (id: PalettePresetId): string =>
  THEME_PRESETS[id].light[`chart-series-${SLOT}`] as string;

/** 프리셋 하나의 시리즈 변수 8개를 전부 선언한다. */
const slotVars = (id: PalettePresetId): string =>
  Array.from(
    { length: PALETTE_SIZE },
    (_, index) => `--sb-chart-series-${index}: ${THEME_PRESETS[id].light[`chart-series-${index}`]};`
  ).join(' ');

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

/** 파이 옵션에서 조각 0의 색을 꺼낸다 (data[0] = 이 화면의 유일한 종목). */
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
      /* 배정 슬롯이 0 이 아닐 수 있으므로 **8개 전부** 정의한다 — 하나만 두면 슬롯이 바뀔 때 조용히 빈다. */
      `:root { ${slotVars('velog')} }`,
      ...PALETTE_PRESET_IDS.map((id) => `:root[data-palette='${id}'] { ${slotVars(id)} }`)
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
    expect(sliceZeroColor(result.current.allocationPieOption)).toBe(seriesColor('velog'));

    // 사용자 행동: 스위처가 하는 일 = palettePresetAtom 쓰기 (DOM 조작 없음 — ThemePresetSwitcher 참고).
    act(() => {
      store.set(palettePresetAtom, 'aurora');
    });

    // 반영: html[data-palette] 갱신 + 차트 옵션이 새 프리셋 색으로 리빌드.
    expect(document.documentElement.getAttribute('data-palette')).toBe('aurora');
    expect(sliceZeroColor(result.current.allocationPieOption)).toBe(seriesColor('aurora'));
  });
});
