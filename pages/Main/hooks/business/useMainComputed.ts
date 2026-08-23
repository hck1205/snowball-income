import { useDeferredValue, useMemo } from 'react';
import {
  ALLOCATION_COPY,
  DEFAULT_DISPLAY_CURRENCY,
  YEARLY_SERIES_HELP_KEY,
  YEARLY_SERIES_LABEL,
  YEARLY_SERIES_ORDER,
  type DisplayCurrency,
  type YearlySeriesKey
} from '@/shared/constants';
import type { YieldFormValues } from '@/shared/types';
import {
  useDividendCenterModeAtomValue,
  useEffectiveColorScheme,
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
  createChartValueFormatter,
  solveRequiredMonthlyContributionForPortfolio
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
   *
   * ⚠ 테마는 **두 축**이다 — 색 프리셋(palette)과 밝기(라이트/다크). 밝기는 별도 atom이라
   * 팔레트만 구독하면 토글을 눌러도 이 useMemo들이 하나도 다시 돌지 않는다(차트만 옛 밝기 색으로
   * 남는다 — 다크에서 축 라벨이 사실상 안 보인다). 두 축을 **완전 동형으로** 함께 의존한다.
   */
  const palettePreset = usePalettePresetAtomValue();
  const colorScheme = useEffectiveColorScheme();
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
    // palettePreset·colorScheme: 실지급 배당 스택 색이 번들 데이터에 박히므로(simulation.ts) 테마 전환 시 재빌드
    [colorScheme, includedProfiles, isValid, normalizedAllocation, palettePreset, postInvestmentProjectionYears, values]
  );

  const tableRows = useMemo(() => simulation?.yearly ?? [], [simulation]);
  /*
   * 목표에 **못 미칠 때만** 역산한다 — "월 얼마면 달성"을 목표 타일이 말하기 위한 값이다.
   *
   * 🔴 도달한 경우에는 계산하지 않는다. 답이 화면에 쓰이지 않는데 판정(=시뮬레이션)을 15~20번
   *    더 돌릴 이유가 없다. 슬라이더를 한 칸 움직일 때마다 이 훅이 다시 도는 자리다.
   */
  /*
   * 🔴 역산은 **급하지 않은 값**이라 `useDeferredValue` 로 미룬다 (2026-08-23, 실측 근거).
   *
   * 판정 1회가 시뮬레이션 1회이고 15~20회를 부르므로, 여기가 이 훅에서 유일하게 비싼 자리다:
   *   종목 2개 10.2ms · 종목 8개 **40.4ms** (비교: 번들 전체 빌드는 각각 3.6ms · 5.3ms).
   * 입력 한 글자마다 도는 자리라(슬라이더·초기 투자금·주식 수) 8종목에서는 프레임을 떨어뜨린다.
   *
   * 미루면 타이핑이 긴급 렌더로 먼저 끝나고 역산은 그다음 저우선순위 렌더에서 돈다 — 빠르게
   * 이어 치면 React 가 중간 렌더를 **버린다**. 목표 타일이 한 프레임 늦게 갱신되지만, 그건
   * "월 얼마면 달성" 이라는 참고 값이라 즉시성이 필요 없다.
   *
   * 🔴 **입력을 통째로 미룬다** — 도달 판정까지 같은 묶음에 넣는다. 판정만 최신이고 값이 옛것이면
   *    서로 다른 세대의 입력으로 만든 숫자가 한 화면에 서게 된다.
   * ⚠ 알고리즘 자체는 건드리지 않았다. 허용오차(1e-4)를 늘리면 3자리 반올림이 흔들리고,
   *   닫힌 식으로 바꾸는 것은 `SnowballGoalSolver` 가 **일부러 거부한 설계**다(그 머리말:
   *   엔진을 그대로 여러 번 돌려야 화면이 보여주는 숫자와 어긋날 수 없다).
   */
  const solverInput = useMemo(
    () =>
      simulation !== null && simulation.summary.targetMonthDividendReachedYear === undefined
        ? { isValid, includedProfiles, normalizedAllocation, values }
        : null,
    [includedProfiles, isValid, normalizedAllocation, simulation, values]
  );
  const deferredSolverInput = useDeferredValue(solverInput);
  const requiredMonthlyContribution = useMemo(
    () => (deferredSolverInput === null ? null : solveRequiredMonthlyContributionForPortfolio(deferredSolverInput)),
    [deferredSolverInput]
  );
  /*
   * 파이 중앙 표시값 — 기본은 **종료 시점 보유 기준 예상 월배당**이다(2026-08-14 사용자 결정).
   *
   * 적립식에서는 월평균(연÷12)이 종료 시점의 수령액을 크게 과소평가한다. 잔고가 그 해 내내
   * 커지므로 "그 해에 받은 총액"은 평균 잔고에 대한 값이기 때문이다 — JEPI 100% · 초기 2,500만 ·
   * 월 500만 · 1년이면 평균 30.5만 vs 런레이트 49.9만이다.
   *
   * 🔴 라벨을 값과 **함께** 넘긴다. 런레이트는 "받았다"가 아니라 추정이라 이름에 '예상'이 붙는다.
   */
  const dividendCenterMode = useDividendCenterModeAtomValue();
  const isRunRateCenter = dividendCenterMode === 'runRate';
  const centerDividend = isRunRateCenter
    ? simulation?.summary.finalRunRateMonthlyDividend ?? 0
    : simulation?.summary.finalMonthlyAverageDividend ?? 0;
  const allocationPieOption = useMemo(
    () =>
      buildAllocationPieOption({
        normalizedAllocation,
        // 배당 중앙표시 토글을 없애고 파이 중앙에 배당을 항상 노출한다(사용자 요청).
        showPortfolioDividendCenter: true,
        centerDividend,
        centerLabel: isRunRateCenter
          ? ALLOCATION_COPY.dividendCenterLabelRunRate
          : ALLOCATION_COPY.dividendCenterLabelAverage,
        formatCompact: formatChartCompact
      }),
    [centerDividend, colorScheme, formatChartCompact, isRunRateCenter, normalizedAllocation, palettePreset]
  );
  const defaultCashflowYear = yearlyCashflowByTicker.years[yearlyCashflowByTicker.years.length - 1] ?? null;
  const defaultCashflowByYear =
    defaultCashflowYear === null ? { months: [], series: [] } : yearlyCashflowByTicker.byYear[String(defaultCashflowYear)] ?? { months: [], series: [] };
  const recentCashflowBarOption = useMemo(
    () => buildRecentCashflowBarOption(defaultCashflowByYear, undefined, formatChartValue),
    [colorScheme, defaultCashflowByYear, formatChartValue, palettePreset]
  );
  const yearlyResultBarOption = useMemo(
    () =>
      buildYearlyResultBarOption({
        tableRows,
        visibleYearlySeries,
        isYearlyAreaFillOn,
        formatValue: formatChartValue
      }),
    [colorScheme, formatChartValue, isYearlyAreaFillOn, palettePreset, tableRows, visibleYearlySeries]
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
    /** 목표 미도달일 때만 값이 있다(도달했거나 목표 미설정이면 `null`). */
    requiredMonthlyContribution,
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
