import { useMemo } from 'react';
import {
  DEFAULT_DISPLAY_CURRENCY,
  YEARLY_SERIES_HELP_KEY,
  YEARLY_SERIES_LABEL,
  YEARLY_SERIES_ORDER,
  type DisplayCurrency,
  type YearlySeriesKey
} from '@/shared/constants';
import type { YieldFormValues } from '@/shared/types';
import {
  useIncludedProfilesAtomValue,
  useNormalizedAllocationAtomValue,
  usePalettePresetAtomValue,
  useSetActiveHelpWrite,
  useSetVisibleYearlySeriesWrite
} from '@/jotai';
import { buildRecentCashflowBarOption } from '@/shared/lib/charts';
import {
  buildAllocationPieOption,
  buildSimulationBundle,
  buildYearlyResultBarOption,
  createChartCompactFormatter,
  createChartValueFormatter
} from '@/pages/Main/utils';

type UseMainComputedParams = {
  isValid: boolean;
  values: YieldFormValues;
  visibleYearlySeries: Record<YearlySeriesKey, boolean>;
  isYearlyAreaFillOn: boolean;
  postInvestmentProjectionYears: number;
  /**
   * 결과 **표시** 통화(계산은 언제나 원화). 차트 축·툴팁 라벨만 바뀐다.
   * 미지정이면 원화 — 기존 호출부(테스트 하네스 포함) 무변경.
   */
  displayCurrency?: DisplayCurrency;
  /** 1 USD = N KRW. `displayCurrency === 'USD'` 일 때만 쓴다. */
  fxRate?: number | null;
};

export const useMainComputed = ({
  isValid,
  values,
  visibleYearlySeries,
  isYearlyAreaFillOn,
  postInvestmentProjectionYears,
  displayCurrency = DEFAULT_DISPLAY_CURRENCY,
  fxRate = null
}: UseMainComputedParams) => {
  const includedProfiles = useIncludedProfilesAtomValue();
  const normalizedAllocation = useNormalizedAllocationAtomValue();
  const setVisibleYearlySeries = useSetVisibleYearlySeriesWrite();
  const setActiveHelp = useSetActiveHelpWrite();
  /*
   * 캔버스(ECharts)는 CSS 변수를 다시 읽지 않는다 — 팔레트 프리셋이 바뀌면 차트 옵션을
   * 다시 빌드해야 옛 색이 남지 않는다. 그래서 아래 차트 옵션 useMemo들의 의존성에
   * palettePreset을 넣는다 (빌더 내부의 getChartTheme()이 새 프리셋 값을 읽는다).
   */
  const palettePreset = usePalettePresetAtomValue();
  /*
   * 팔레트와 같은 이유로 표시 통화도 옵션 재빌드 트리거다 — 캔버스는 이미 그려진 라벨을 다시 계산하지
   * 않으므로 deps 에서 빠지면 차트만 옛 통화로 남는다(팔레트 stale-by-one 과 동형).
   * ⚠ `displayCurrency` 만 넣으면 안 된다: 통화 그대로 **환율만** 갱신되는 전이가 실제로 있다.
   */
  const formatChartValue = useMemo(() => createChartValueFormatter(displayCurrency, fxRate), [displayCurrency, fxRate]);
  const formatChartCompact = useMemo(() => createChartCompactFormatter(displayCurrency, fxRate), [displayCurrency, fxRate]);

  const { simulation, yearlyCashflowByTicker, postInvestmentDividendProjectionRows } = useMemo(
    () =>
      buildSimulationBundle({
        isValid,
        includedProfiles,
        normalizedAllocation,
        values,
        postInvestmentProjectionYears
      }),
    // palettePreset: 실지급 배당 스택 색이 번들 데이터에 박히므로(simulation.ts) 프리셋 전환 시 재빌드
    [includedProfiles, isValid, normalizedAllocation, palettePreset, postInvestmentProjectionYears, values]
  );

  const tableRows = useMemo(() => simulation?.yearly ?? [], [simulation]);
  const allocationPieOption = useMemo(
    () =>
      buildAllocationPieOption({
        normalizedAllocation,
        // 배당 중앙표시 토글을 없애고 파이 중앙에 월배당을 항상 노출한다(사용자 요청).
        showPortfolioDividendCenter: true,
        finalMonthlyAverageDividend: simulation?.summary.finalMonthlyAverageDividend ?? 0,
        formatCompact: formatChartCompact
      }),
    [formatChartCompact, normalizedAllocation, palettePreset, simulation?.summary.finalMonthlyAverageDividend]
  );
  const defaultCashflowYear = yearlyCashflowByTicker.years[yearlyCashflowByTicker.years.length - 1] ?? null;
  const defaultCashflowByYear =
    defaultCashflowYear === null ? { months: [], series: [] } : yearlyCashflowByTicker.byYear[String(defaultCashflowYear)] ?? { months: [], series: [] };
  const recentCashflowBarOption = useMemo(
    () => buildRecentCashflowBarOption(defaultCashflowByYear, undefined, formatChartValue),
    [defaultCashflowByYear, formatChartValue, palettePreset]
  );
  const yearlyResultBarOption = useMemo(
    () =>
      buildYearlyResultBarOption({
        tableRows,
        visibleYearlySeries,
        isYearlyAreaFillOn,
        formatValue: formatChartValue
      }),
    [formatChartValue, isYearlyAreaFillOn, palettePreset, tableRows, visibleYearlySeries]
  );
  const yearlySeriesItems = useMemo(
    () =>
      YEARLY_SERIES_ORDER.map((key) => ({
        key,
        label: YEARLY_SERIES_LABEL[key],
        checked: visibleYearlySeries[key],
        onToggle: (checked: boolean) => setVisibleYearlySeries((prev) => ({ ...prev, [key]: checked })),
        onHelp: () => setActiveHelp(YEARLY_SERIES_HELP_KEY[key])
      })),
    [setActiveHelp, setVisibleYearlySeries, visibleYearlySeries]
  );

  return {
    simulation,
    tableRows,
    allocationPieOption,
    recentCashflowBarOption,
    yearlyCashflowByTicker,
    postInvestmentDividendProjectionRows,
    yearlyResultBarOption,
    yearlySeriesItems,
    /** 자체적으로 옵션을 만드는 표면(라인 차트 패널·실지급 배당 카드)이 같은 포맷터를 쓰도록 함께 돌려준다. */
    formatChartValue,
    /**
     * 차트 안 축약 라벨(목표선 markLine 라벨 등)용. 축과 같은 통화를 쓰게 하려고 함께 노출한다 —
     * 원화 고정 포맷터를 쓰면 달러 표시 모드에서 축과 목표선의 단위가 섞인다.
     */
    formatChartCompact
  };
};
