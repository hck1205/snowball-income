import { memo, type CSSProperties, type MouseEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useAtom } from 'jotai';
import {
  Card,
  FormSection,
  FrequencySelect,
  InputField,
  ToggleField
} from '@/components';
import type { Frequency, SimulationOutput } from '@/shared/types';
import { formatKRW } from '@/shared/utils';
import { useYieldArchitect } from '@/features/YieldArchitect/hooks';
import type { TickerDraft, TickerProfile } from '@/features/YieldArchitect/feature.types';
import {
  activeHelpAtom,
  editingTickerIdAtom,
  fixedByTickerIdAtom,
  includedTickerIdsAtom,
  isConfigDrawerOpenAtom,
  isTickerModalOpenAtom,
  readPersistedAppState,
  selectedPresetAtom,
  selectedTickerIdAtom,
  showQuickEstimateAtom,
  tickerDraftAtom,
  tickerModalModeAtom,
  tickerProfilesAtom,
  yieldFormAtom,
  weightByTickerIdAtom,
  writePersistedAppState
} from '@/features/YieldArchitect/state';
import { runSimulation } from './feature.utils';
import {
  AllocationChartLayout,
  AllocationColorDot,
  AllocationFixButton,
  AllocationLegend,
  AllocationLegendItem,
  AllocationLegendName,
  AllocationLegendSlider,
  AllocationLegendValue,
  ChartWrap,
  CompactSummaryGrid,
  CompactSummaryItem,
  CompactSummaryLabel,
  CompactSummaryValue,
  ConfigDrawerColumn,
  ConfigFormGrid,
  ConfigSectionDivider,
  ContentLayout,
  DrawerBackdrop,
  DrawerCloseButton,
  DrawerToggleButton,
  ErrorBox,
  FeatureLayout,
  FormGrid,
  Header,
  HeaderDescription,
  HeaderTitle,
  HelpMarkButton,
  HintText,
  InlineField,
  InlineFieldHeader,
  InlineSelect,
  ModalActions,
  ModalBackdrop,
  ModalBody,
  ModalClose,
  ModalPanel,
  ModalTitle,
  PrimaryButton,
  ResultsColumn,
  SecondaryButton,
  SeriesFilterGroup,
  SeriesFilterItem,
  SelectedChip,
  SelectedChipLabel,
  SelectedChipWrap,
  SeriesFilterCheckbox,
  SeriesFilterLabel,
  SeriesFilterRow,
  ChipRemoveButton,
  TickerCreateButton,
  TickerGridWrap,
  TickerChipWrap,
  TickerGearButton,
  TickerItemButton,
  TickerList
} from './feature.styled';

const ResponsiveEChart = memo(function ResponsiveEChart({
  option,
  replaceMerge
}: {
  option: EChartsOption;
  replaceMerge?: string[];
}) {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  const measureContainer = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(0, Math.floor(rect.width));
    const height = Math.max(0, Math.floor(rect.height));
    setChartSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const queueMeasure = () => {
    if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => {
      measureContainer();
      rafRef.current = null;
    });
  };

  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    const observer =
      typeof ResizeObserver !== 'undefined' && containerRef.current
        ? new ResizeObserver(() => {
            queueMeasure();
          })
        : null;

    if (observer && containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', queueMeasure);
    window.addEventListener('orientationchange', queueMeasure);
    viewport?.addEventListener('resize', queueMeasure);

    const timer = window.setTimeout(() => queueMeasure(), 80);
    const timer2 = window.setTimeout(() => queueMeasure(), 220);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(timer2);
      observer?.disconnect();
      window.removeEventListener('resize', queueMeasure);
      window.removeEventListener('orientationchange', queueMeasure);
      viewport?.removeEventListener('resize', queueMeasure);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => queueMeasure());
    return () => window.cancelAnimationFrame(raf);
  }, [option]);

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance?.();
    if (!chart) return;
    if (chartSize.width <= 0 || chartSize.height <= 0) return;
    chart.resize({ width: chartSize.width, height: chartSize.height });
  }, [chartSize.height, chartSize.width]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minWidth: 0 }}>
      <ReactECharts
        ref={chartRef}
        option={option}
        autoResize={false}
        replaceMerge={replaceMerge}
        opts={{
          width: chartSize.width > 0 ? chartSize.width : undefined,
          height: chartSize.height > 0 ? chartSize.height : undefined
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
});

function ChartPanel<T>({
  title,
  rows,
  xAxisLabel,
  yAxisLabelFormatter,
  getXValue,
  getYValue
}: {
  title: string;
  rows: T[];
  xAxisLabel?: string;
  yAxisLabelFormatter?: (value: number) => string;
  getXValue: (row: T) => string;
  getYValue: (row: T) => number;
}) {
  const chartOption = useMemo<EChartsOption>(
    () => ({
      grid: { left: 72, right: 20, top: 24, bottom: 36 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) => formatKRW(Number(value))
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        name: xAxisLabel,
        data: rows.map((row) => getXValue(row))
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => (yAxisLabelFormatter ? yAxisLabelFormatter(value) : formatKRW(Number(value)))
        }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#0a7285', width: 2 },
          areaStyle: { color: 'rgba(10, 114, 133, 0.08)' },
          data: rows.map((row) => getYValue(row))
        }
      ]
    }),
    [getXValue, getYValue, rows, xAxisLabel, yAxisLabelFormatter]
  );

  return (
    <Card title={title}>
      <ChartWrap>
        <ResponsiveEChart option={chartOption} />
      </ChartWrap>
    </Card>
  );
}

const targetYearLabel = (year: number | undefined): string => (year ? `${year}년` : '미도달');
const formatPercent = (value: number): string => `${(value * 100).toFixed(2)}%`;
const formatApproxKRW = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  const absValue = Math.abs(value);

  if (absValue >= 100_000_000) {
    const inEok = Math.round((absValue / 100_000_000) * 10) / 10;
    const label = Number.isInteger(inEok) ? `${inEok.toFixed(0)}억` : `${inEok.toFixed(1)}억`;
    return `${sign}약 ${label}`;
  }

  if (absValue >= 10_000) {
    const inMan = Math.round(absValue / 10_000);
    return `${sign}약 ${inMan.toLocaleString()}만`;
  }

  return `${sign}약 ${Math.round(absValue).toLocaleString()}원`;
};

const formatResultAmount = (value: number, compact: boolean): string => (compact ? formatApproxKRW(value) : formatKRW(value));
const ALLOCATION_COLORS = ['#4cc9f0', '#ff7f50', '#ffd166', '#06d6a0', '#b388ff', '#f472b6', '#70e000', '#00bbf9'];
type YearlySeriesKey = 'totalContribution' | 'assetValue' | 'annualDividend' | 'monthlyDividend' | 'cumulativeDividend';
const YEARLY_SERIES_ORDER: YearlySeriesKey[] = ['monthlyDividend', 'annualDividend', 'cumulativeDividend', 'assetValue', 'totalContribution'];
const YEARLY_SERIES_LABEL: Record<YearlySeriesKey, string> = {
  totalContribution: '누적 투자금',
  assetValue: '자산 가치',
  annualDividend: '연 배당',
  monthlyDividend: '월 평균 배당',
  cumulativeDividend: '누적 배당'
};
const YEARLY_SERIES_COLOR: Record<YearlySeriesKey, string> = {
  totalContribution: '#0f4c81',
  assetValue: '#c0392b',
  annualDividend: '#1e8449',
  monthlyDividend: '#f39c12',
  cumulativeDividend: '#6c3483'
};

const HELP_CONTENT = {
  dividendYield: {
    title: '배당률',
    body: '현재 주가 대비 1년 배당 비율입니다. 예: 3.5는 연 3.5%를 의미합니다.'
  },
  dividendGrowth: {
    title: '배당 성장률',
    body: '배당금(DPS)이 매년 얼마나 증가한다고 가정할지 입력합니다.'
  },
  priceGrowth: {
    title: '주가 성장률',
    body: '주가가 연평균 얼마나 변한다고 가정할지 입력합니다. 음수도 입력 가능합니다.'
  },
  frequency: {
    title: '배당 지급 주기',
    body: '배당이 실제로 지급되는 횟수입니다. 월/분기/반기/연 중 선택합니다.'
  },
  reinvestTiming: {
    title: '재투자 시점',
    body: '당월 재투자는 배당을 받은 같은 달에 재매수합니다. 익월 재투자는 다음 달에 재매수해 더 보수적인 결과가 나옵니다.'
  },
  dpsGrowthMode: {
    title: 'DPS 성장 반영',
    body: '연 단위 점프는 해가 바뀔 때만 배당이 증가합니다. 월 단위 스무딩은 월별로 부드럽게 증가시켜 반영합니다.'
  },
  resultMode: {
    title: '결과 표시 모드',
    body: '정밀 시뮬레이션은 월 단위 계산(지급주기/세금/재투자 타이밍)을 반영합니다. 간편 추정(빠른 추정)은 단일 수익률 기반으로 빠르게 확인하는 근사치입니다.'
  },
  allocationRatio: {
    title: '티커 비율',
    body: '여러 티커를 함께 선택하면 월 투자금을 입력한 비율대로 나눠서 투자합니다. 예: SCHD 6, JEPI 4이면 60:40 비율입니다.'
  },
  yearlyTotalContribution: {
    title: '누적 투자금',
    body: '지금까지 사용자가 실제로 투입한 원금의 누적 합계입니다.'
  },
  yearlyAssetValue: {
    title: '자산 가치',
    body: '해당 시점의 보유 자산 평가금액입니다. 원금과 평가손익이 반영됩니다.'
  },
  yearlyAnnualDividend: {
    title: '연 배당',
    body: '해당 연도에 실제 지급된 배당금 합계(세후)입니다.'
  },
  yearlyMonthlyDividend: {
    title: '월 평균 배당',
    body: '연 배당을 12로 나눈 값으로, 월 기준 평균치입니다.'
  },
  yearlyCumulativeDividend: {
    title: '누적 배당',
    body: '시작 시점부터 현재까지 누적된 세후 배당금 총합입니다.'
  }
} as const;

type HelpKey = keyof typeof HELP_CONTENT;
const YEARLY_SERIES_HELP_KEY: Record<YearlySeriesKey, HelpKey> = {
  totalContribution: 'yearlyTotalContribution',
  assetValue: 'yearlyAssetValue',
  annualDividend: 'yearlyAnnualDividend',
  monthlyDividend: 'yearlyMonthlyDividend',
  cumulativeDividend: 'yearlyCumulativeDividend'
};

const PRESET_TICKERS = {
  SCHD: {
    ticker: 'SCHD',
    initialPrice: 31.61,
    dividendYield: 3.34,
    dividendGrowth: 9.08,
    priceGrowth: 10.85,
    frequency: 'quarterly' as const
  },
  JEPI: {
    ticker: 'JEPI',
    initialPrice: 59.31,
    dividendYield: 7.99,
    dividendGrowth: 7.88,
    priceGrowth: 10.09,
    frequency: 'monthly' as const
  },
  VIG: {
    ticker: 'VIG',
    initialPrice: 227.26,
    dividendYield: 1.57,
    dividendGrowth: 9.13,
    priceGrowth: 11.7,
    frequency: 'quarterly' as const
  },
  DGRO: {
    ticker: 'DGRO',
    initialPrice: 73.62,
    dividendYield: 1.97,
    dividendGrowth: 7.08,
    priceGrowth: 12.33,
    frequency: 'quarterly' as const
  },
  VYM: {
    ticker: 'VYM',
    initialPrice: 155.37,
    dividendYield: 2.25,
    dividendGrowth: 3.76,
    priceGrowth: 13.46,
    frequency: 'quarterly' as const
  },
  HDV: {
    ticker: 'HDV',
    initialPrice: 138.76,
    dividendYield: 2.82,
    dividendGrowth: 1.84,
    priceGrowth: 13.06,
    frequency: 'quarterly' as const
  },
  DIVO: {
    ticker: 'DIVO',
    initialPrice: 46.59,
    dividendYield: 6.18,
    dividendGrowth: 9.42,
    priceGrowth: 12.65,
    frequency: 'monthly' as const
  },
  NOBL: {
    ticker: 'NOBL',
    initialPrice: 114.0,
    dividendYield: 1.95,
    dividendGrowth: 5.45,
    priceGrowth: 9.1,
    frequency: 'quarterly' as const
  },
  SDY: {
    ticker: 'SDY',
    initialPrice: 155.25,
    dividendYield: 2.36,
    dividendGrowth: 3.75,
    priceGrowth: 9.63,
    frequency: 'quarterly' as const
  },
  SPYD: {
    ticker: 'SPYD',
    initialPrice: 48.07,
    dividendYield: 4.11,
    dividendGrowth: 3.76,
    priceGrowth: 10.61,
    frequency: 'quarterly' as const
  }
};

type PresetTickerKey = keyof typeof PRESET_TICKERS;

const toTickerDraft = (values: {
  ticker: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  priceGrowth: number;
  frequency: Frequency;
}): TickerDraft => ({
  ticker: values.ticker,
  initialPrice: values.initialPrice,
  dividendYield: values.dividendYield,
  dividendGrowth: values.dividendGrowth,
  priceGrowth: values.priceGrowth,
  frequency: values.frequency
});

export default function YieldArchitectFeature() {
  const LONG_PRESS_MS = 550;
  const { values, setField, validation } = useYieldArchitect();
  const [activeHelp, setActiveHelp] = useAtom(activeHelpAtom);
  const [isTickerModalOpen, setIsTickerModalOpen] = useAtom(isTickerModalOpenAtom);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useAtom(isConfigDrawerOpenAtom);
  const [tickerModalMode, setTickerModalMode] = useAtom(tickerModalModeAtom);
  const [editingTickerId, setEditingTickerId] = useAtom(editingTickerIdAtom);
  const [showQuickEstimate, setShowQuickEstimate] = useAtom(showQuickEstimateAtom);
  const [tickerProfiles, setTickerProfiles] = useAtom(tickerProfilesAtom);
  const [, setYieldFormValues] = useAtom(yieldFormAtom);
  const [selectedTickerId, setSelectedTickerId] = useAtom(selectedTickerIdAtom);
  const [includedTickerIds, setIncludedTickerIds] = useAtom(includedTickerIdsAtom);
  const [weightByTickerId, setWeightByTickerId] = useAtom(weightByTickerIdAtom);
  const [fixedByTickerId, setFixedByTickerId] = useAtom(fixedByTickerIdAtom);
  const [tickerDraft, setTickerDraft] = useAtom(tickerDraftAtom);
  const [selectedPreset, setSelectedPreset] = useAtom(selectedPresetAtom);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const [visibleYearlySeries, setVisibleYearlySeries] = useState<Record<YearlySeriesKey, boolean>>({
    totalContribution: false,
    assetValue: false,
    annualDividend: false,
    monthlyDividend: true,
    cumulativeDividend: false
  });
  const [isYearlyAreaFillOn, setIsYearlyAreaFillOn] = useState(false);
  const [isResultCompact, setIsResultCompact] = useState(false);
  const [showSplitGraphs, setShowSplitGraphs] = useState(false);
  const [showPortfolioDividendCenter, setShowPortfolioDividendCenter] = useState(false);
  const [isPortfolioHydrated, setIsPortfolioHydrated] = useState(false);

  const currentHelp = useMemo(() => {
    if (!activeHelp) return null;
    if (!(activeHelp in HELP_CONTENT)) return null;
    return HELP_CONTENT[activeHelp as HelpKey];
  }, [activeHelp]);
  const includedProfiles = useMemo(
    () => tickerProfiles.filter((profile) => includedTickerIds.includes(profile.id)),
    [includedTickerIds, tickerProfiles]
  );
  const normalizedAllocation = useMemo(
    () => {
      if (includedProfiles.length === 0) return [];
      const rawWeights = includedProfiles.map((profile) => Math.max(0, weightByTickerId[profile.id] ?? 1));
      const rawWeightSum = rawWeights.reduce((sum, value) => sum + value, 0);
      const normalizedWeights =
        rawWeightSum === 0 ? includedProfiles.map(() => 1 / includedProfiles.length) : rawWeights.map((weight) => weight / rawWeightSum);

      return includedProfiles.map((profile, index) => ({ profile, weight: normalizedWeights[index] }));
    },
    [includedProfiles, weightByTickerId]
  );
  const allocationPercentByTickerId = useMemo<Record<string, number>>(
    () =>
      normalizedAllocation.reduce<Record<string, number>>((acc, item) => {
        acc[item.profile.id] = Number((item.weight * 100).toFixed(1));
        return acc;
      }, {}),
    [normalizedAllocation]
  );
  const allocationPercentExactByTickerId = useMemo<Record<string, number>>(
    () =>
      normalizedAllocation.reduce<Record<string, number>>((acc, item) => {
        acc[item.profile.id] = item.weight * 100;
        return acc;
      }, {}),
    [normalizedAllocation]
  );
  const adjustableTickerCount = useMemo(
    () => includedProfiles.filter((profile) => !fixedByTickerId[profile.id]).length,
    [fixedByTickerId, includedProfiles]
  );

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const payload = await readPersistedAppState();
      if (cancelled) return;
      setTickerProfiles(payload.portfolio.tickerProfiles);
      setIncludedTickerIds(payload.portfolio.includedTickerIds);
      setWeightByTickerId(payload.portfolio.weightByTickerId);
      setFixedByTickerId(payload.portfolio.fixedByTickerId);
      setSelectedTickerId(payload.portfolio.selectedTickerId);
      setYieldFormValues((prev) => ({
        ...prev,
        monthlyContribution: payload.investmentSettings.monthlyContribution,
        targetMonthlyDividend: payload.investmentSettings.targetMonthlyDividend,
        durationYears: payload.investmentSettings.durationYears,
        reinvestDividends: payload.investmentSettings.reinvestDividends,
        taxRate: payload.investmentSettings.taxRate,
        reinvestTiming: payload.investmentSettings.reinvestTiming,
        dpsGrowthMode: payload.investmentSettings.dpsGrowthMode
      }));
      setShowQuickEstimate(payload.investmentSettings.showQuickEstimate);
      setShowSplitGraphs(payload.investmentSettings.showSplitGraphs);
      setIsPortfolioHydrated(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [setFixedByTickerId, setIncludedTickerIds, setSelectedTickerId, setShowQuickEstimate, setTickerProfiles, setWeightByTickerId, setYieldFormValues]);

  useEffect(() => {
    if (!isPortfolioHydrated) return;

    const payload = {
      portfolio: {
        tickerProfiles,
        includedTickerIds,
        weightByTickerId,
        fixedByTickerId,
        selectedTickerId
      },
      investmentSettings: {
        monthlyContribution: values.monthlyContribution,
        targetMonthlyDividend: values.targetMonthlyDividend,
        durationYears: values.durationYears,
        reinvestDividends: values.reinvestDividends,
        taxRate: values.taxRate,
        reinvestTiming: values.reinvestTiming,
        dpsGrowthMode: values.dpsGrowthMode,
        showQuickEstimate,
        showSplitGraphs
      }
    };

    const timer = window.setTimeout(() => {
      void writePersistedAppState(payload);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [
    fixedByTickerId,
    includedTickerIds,
    isPortfolioHydrated,
    selectedTickerId,
    showQuickEstimate,
    showSplitGraphs,
    tickerProfiles,
    values.dpsGrowthMode,
    values.durationYears,
    values.monthlyContribution,
    values.reinvestDividends,
    values.reinvestTiming,
    values.targetMonthlyDividend,
    values.taxRate,
    weightByTickerId
  ]);

  useEffect(() => {
    if (selectedTickerId && !includedTickerIds.includes(selectedTickerId)) {
      setSelectedTickerId(includedTickerIds[0] ?? null);
    }
  }, [includedTickerIds, selectedTickerId, setSelectedTickerId]);

  const applyTickerProfile = (profile: TickerDraft) => {
    setField('ticker', profile.ticker);
    setField('initialPrice', profile.initialPrice);
    setField('dividendYield', profile.dividendYield);
    setField('dividendGrowth', profile.dividendGrowth);
    setField('priceGrowth', profile.priceGrowth);
    setField('frequency', profile.frequency);
  };

  const runForProfile = (profile: TickerDraft, monthlyContribution: number): SimulationOutput =>
    runSimulation({
      ticker: {
        ticker: profile.ticker,
        initialPrice: profile.initialPrice,
        dividendYield: profile.dividendYield,
        dividendGrowth: profile.dividendGrowth,
        priceGrowth: profile.priceGrowth,
        frequency: profile.frequency
      },
      settings: {
        monthlyContribution,
        targetMonthlyDividend: values.targetMonthlyDividend,
        durationYears: values.durationYears,
        reinvestDividends: values.reinvestDividends,
        taxRate: values.taxRate,
        reinvestTiming: values.reinvestTiming,
        dpsGrowthMode: values.dpsGrowthMode
      }
    });

  const simulation = useMemo(() => {
    if (!validation.isValid) return null;

    if (includedProfiles.length === 0) {
      return runForProfile(toTickerDraft(values), values.monthlyContribution);
    }

    if (includedProfiles.length === 1) {
      return runForProfile(includedProfiles[0], values.monthlyContribution);
    }

    const outputs = normalizedAllocation.map(({ profile, weight }) => runForProfile(profile, values.monthlyContribution * weight));
    const base = outputs[0];

    const monthly = base.monthly.map((row, index) => {
      const merged = outputs.map((output) => output.monthly[index]);
      return {
        ...row,
        shares: merged.reduce((sum, item) => sum + item.shares, 0),
        dividendPaid: merged.reduce((sum, item) => sum + item.dividendPaid, 0),
        contributionPaid: merged.reduce((sum, item) => sum + item.contributionPaid, 0),
        taxPaid: merged.reduce((sum, item) => sum + item.taxPaid, 0),
        portfolioValue: merged.reduce((sum, item) => sum + item.portfolioValue, 0),
        cumulativeDividend: merged.reduce((sum, item) => sum + item.cumulativeDividend, 0)
      };
    });

    const yearly = base.yearly.map((row, index) => {
      const merged = outputs.map((output) => output.yearly[index]);
      const annualDividend = merged.reduce((sum, item) => sum + item.annualDividend, 0);
      return {
        ...row,
        totalContribution: merged.reduce((sum, item) => sum + item.totalContribution, 0),
        assetValue: merged.reduce((sum, item) => sum + item.assetValue, 0),
        annualDividend,
        cumulativeDividend: merged.reduce((sum, item) => sum + item.cumulativeDividend, 0),
        monthlyDividend: annualDividend / 12
      };
    });

    const finalYear = yearly[yearly.length - 1];
    const lastPayout = [...monthly].reverse().find((item) => item.dividendPaid > 0);

    return {
      monthly,
      yearly,
      summary: {
        finalAssetValue: finalYear?.assetValue ?? 0,
        finalAnnualDividend: finalYear?.annualDividend ?? 0,
        finalMonthlyDividend: finalYear?.monthlyDividend ?? 0,
        finalMonthlyAverageDividend: finalYear?.monthlyDividend ?? 0,
        finalPayoutMonthDividend: lastPayout?.dividendPaid ?? 0,
        totalContribution: finalYear?.totalContribution ?? 0,
        totalNetDividend: finalYear?.cumulativeDividend ?? 0,
        totalTaxPaid: outputs.reduce((sum, output) => sum + output.summary.totalTaxPaid, 0),
        targetMonthDividendReachedYear: yearly.find((item) => item.monthlyDividend >= values.targetMonthlyDividend)?.year
      },
      quickEstimate: {
        endValue: outputs.reduce((sum, output) => sum + output.quickEstimate.endValue, 0),
        annualDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.annualDividendApprox, 0),
        monthlyDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.monthlyDividendApprox, 0),
        yieldOnPriceAtEnd: outputs.reduce((sum, output) => sum + output.quickEstimate.yieldOnPriceAtEnd, 0) / outputs.length
      }
    };
  }, [includedProfiles, normalizedAllocation, validation.isValid, values]);

  const tableRows = useMemo(() => simulation?.yearly ?? [], [simulation]);
  const allocationPieOption = useMemo<EChartsOption | null>(() => {
    if (normalizedAllocation.length === 0) return null;

    return {
      graphic: showPortfolioDividendCenter
        ? [
            {
              type: 'group',
              left: 'center',
              top: 'center',
              children: [
                {
                  type: 'text',
                  left: 'center',
                  top: -12,
                  style: {
                    text: '월배당',
                    fill: '#567285',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                    textVerticalAlign: 'middle'
                  }
                },
                {
                  type: 'text',
                  left: 'center',
                  top: 8,
                  style: {
                    text: formatApproxKRW(simulation?.summary.finalMonthlyAverageDividend ?? 0),
                    fill: '#1f3341',
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: 'center',
                    textVerticalAlign: 'middle'
                  }
                }
              ]
            }
          ]
        : undefined,
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {d}%'
      },
      series: [
        {
          type: 'pie',
          selectedMode: false,
          silent: true,
          radius: ['46%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: normalizedAllocation.map(({ profile, weight }, index) => ({
            name: profile.ticker,
            value: Number((weight * 100).toFixed(4)),
            itemStyle: { color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }
          }))
        }
      ]
    };
  }, [normalizedAllocation, showPortfolioDividendCenter, simulation?.summary.finalMonthlyAverageDividend]);
  const recentCashflowByTicker = useMemo(() => {
    if (!validation.isValid) return { months: [] as string[], series: [] as Array<{ name: string; data: number[]; color: string }> };

    const targetProfiles =
      includedProfiles.length === 0
        ? [
            {
              profile: toTickerDraft(values),
              weight: 1
            }
          ]
        : includedProfiles.length === 1
          ? [
              {
                profile: includedProfiles[0],
                weight: 1
              }
            ]
          : normalizedAllocation.map(({ profile, weight }) => ({ profile, weight }));

    const outputs = targetProfiles.map((item) => ({
      ticker: item.profile.ticker,
      output: runForProfile(item.profile, values.monthlyContribution * item.weight)
    }));

    const baseMonthly = outputs[0]?.output.monthly ?? [];
    const months = baseMonthly.slice(-12).map((row) => `${row.year}-${String(row.month).padStart(2, '0')}`);
    const series = outputs.map((item, index) => ({
      name: item.ticker,
      data: item.output.monthly.slice(-12).map((row) => row.dividendPaid),
      color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]
    }));

    return { months, series };
  }, [includedProfiles, normalizedAllocation, runForProfile, validation.isValid, values]);

  const recentCashflowBarOption = useMemo<EChartsOption>(
    () => ({
      grid: { left: 72, right: 16, top: 24, bottom: 42 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value: unknown) => formatKRW(Number(value))
      },
      legend: {
        top: 0,
        textStyle: { color: '#486073', fontSize: 12 }
      },
      xAxis: {
        type: 'category',
        data: recentCashflowByTicker.months
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatKRW(value)
        }
      },
      series: recentCashflowByTicker.series.map((item) => ({
        type: 'bar',
        name: item.name,
        stack: 'total',
        data: item.data,
        barMaxWidth: 24,
        itemStyle: {
          color: item.color
        }
      }))
    }),
    [recentCashflowByTicker]
  );
  const yearlyResultBarOption = useMemo<EChartsOption>(() => {
    const seriesKeys = YEARLY_SERIES_ORDER.filter((key) => visibleYearlySeries[key]);
    return {
      grid: { left: 72, right: 20, top: 24, bottom: 36 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) => formatKRW(Number(value))
      },
      legend: {
        top: 0,
        textStyle: { color: '#486073', fontSize: 12 }
      },
      xAxis: {
        type: 'category',
        data: tableRows.map((row) => `${row.year}`)
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (value: number) => formatKRW(value) }
      },
      series: seriesKeys.map((key) => ({
        type: 'line',
        name: YEARLY_SERIES_LABEL[key],
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: YEARLY_SERIES_COLOR[key] },
        itemStyle: { color: YEARLY_SERIES_COLOR[key] },
        areaStyle: isYearlyAreaFillOn ? { color: `${YEARLY_SERIES_COLOR[key]}22` } : undefined,
        data: tableRows.map((row) => row[key])
      }))
    };
  }, [isYearlyAreaFillOn, tableRows, visibleYearlySeries]);

  const openTickerModal = () => {
    setTickerDraft(toTickerDraft(values));
    setSelectedPreset('custom');
    setTickerModalMode('create');
    setEditingTickerId(null);
    setIsTickerModalOpen(true);
  };

  const openTickerEditModal = (profile: TickerProfile) => {
    setTickerDraft(toTickerDraft(profile));
    setSelectedPreset('custom');
    setTickerModalMode('edit');
    setEditingTickerId(profile.id);
    setIsTickerModalOpen(true);
  };

  const closeTickerModal = () => {
    setIsTickerModalOpen(false);
    setTickerModalMode('create');
    setEditingTickerId(null);
  };
  const closeHelp = () => setActiveHelp(null);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (currentHelp) closeHelp();
    if (isTickerModalOpen) closeTickerModal();
  };

  const saveTicker = () => {
    const tickerName = tickerDraft.ticker.trim();
    if (!tickerName) return;

    const profile: TickerProfile = {
      ...tickerDraft,
      ticker: tickerName,
      id: editingTickerId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    };

    if (tickerModalMode === 'edit') {
      setTickerProfiles((prev) => prev.map((item) => (item.id === profile.id ? profile : item)));
      if (selectedTickerId === profile.id) {
        applyTickerProfile(profile);
      }
    } else {
      setTickerProfiles((prev) => [profile, ...prev]);
      setSelectedTickerId(profile.id);
      setIncludedTickerIds((prev) => [profile.id, ...prev]);
      setWeightByTickerId((prev) => ({ ...prev, [profile.id]: 1 }));
      setFixedByTickerId((prev) => ({ ...prev, [profile.id]: false }));
      applyTickerProfile(profile);
    }

    setIsConfigDrawerOpen(false);
    closeTickerModal();
  };

  const deleteTicker = () => {
    if (tickerModalMode !== 'edit' || !editingTickerId) return;

    const deletingId = editingTickerId;
    const nextProfiles = tickerProfiles.filter((profile) => profile.id !== deletingId);
    const nextIncludedIds = includedTickerIds.filter((id) => id !== deletingId);
    const fallbackSelectedId = nextIncludedIds[0] ?? null;

    setTickerProfiles(nextProfiles);
    setIncludedTickerIds(nextIncludedIds);
    setWeightByTickerId((prev) => {
      const next = { ...prev };
      delete next[deletingId];
      return next;
    });
    setFixedByTickerId((prev) => {
      const next = { ...prev };
      delete next[deletingId];
      return next;
    });

    if (selectedTickerId === deletingId) {
      setSelectedTickerId(fallbackSelectedId);
      const fallbackProfile = nextProfiles.find((profile) => profile.id === fallbackSelectedId);
      if (fallbackProfile) {
        applyTickerProfile(fallbackProfile);
      }
    }

    setIsConfigDrawerOpen(false);
    closeTickerModal();
  };

  const toggleIncludeTicker = (profile: TickerProfile) => {
    const isIncluded = includedTickerIds.includes(profile.id);

    if (isIncluded) {
      const nextIncludedIds = includedTickerIds.filter((id) => id !== profile.id);
      setIncludedTickerIds(nextIncludedIds);
      setFixedByTickerId((prev) => ({ ...prev, [profile.id]: false }));

      if (selectedTickerId === profile.id) {
        const nextSelectedId = nextIncludedIds[0] ?? null;
        setSelectedTickerId(nextSelectedId);
        if (nextSelectedId) {
          const nextProfile = tickerProfiles.find((item) => item.id === nextSelectedId);
          if (nextProfile) {
            applyTickerProfile(nextProfile);
          }
        }
      }
      return;
    }

    setIncludedTickerIds((prev) => [...prev, profile.id]);
    setWeightByTickerId((weights) => ({ ...weights, [profile.id]: weights[profile.id] ?? 1 }));
    setFixedByTickerId((fixed) => ({ ...fixed, [profile.id]: fixed[profile.id] ?? false }));
    setSelectedTickerId(profile.id);
    applyTickerProfile(profile);
    setIsConfigDrawerOpen(false);
  };

  const removeIncludedTicker = (profileId: string) => {
    const nextIncludedIds = includedTickerIds.filter((id) => id !== profileId);
    setIncludedTickerIds(nextIncludedIds);
    setFixedByTickerId((prev) => ({ ...prev, [profileId]: false }));

    if (selectedTickerId === profileId) {
      const nextSelectedId = nextIncludedIds[0] ?? null;
      setSelectedTickerId(nextSelectedId);
      if (nextSelectedId) {
        const nextProfile = tickerProfiles.find((item) => item.id === nextSelectedId);
        if (nextProfile) {
          applyTickerProfile(nextProfile);
        }
      }
    }
  };

  const setTickerWeight = (profileId: string, value: number) => {
    if (fixedByTickerId[profileId]) return;

    const nextTarget = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
    const fixedIds = includedProfiles
      .filter((profile) => fixedByTickerId[profile.id] && profile.id !== profileId)
      .map((profile) => profile.id);
    const otherMutableIds = includedProfiles
      .filter((profile) => !fixedByTickerId[profile.id] && profile.id !== profileId)
      .map((profile) => profile.id);

    const fixedSum = fixedIds.reduce((sum, id) => sum + (allocationPercentExactByTickerId[id] ?? 0), 0);
    const maxTarget = Math.max(0, 100 - fixedSum);
    const targetValue = otherMutableIds.length === 0 ? maxTarget : Math.min(nextTarget, maxTarget);
    const remaining = Math.max(0, maxTarget - targetValue);

    const nextMap: Record<string, number> = {};
    fixedIds.forEach((id) => {
      nextMap[id] = allocationPercentExactByTickerId[id] ?? 0;
    });
    nextMap[profileId] = targetValue;

    if (otherMutableIds.length > 0) {
      const otherBase = otherMutableIds.reduce((sum, id) => sum + (allocationPercentExactByTickerId[id] ?? 0), 0);
      if (otherBase === 0) {
        const equalWeight = remaining / otherMutableIds.length;
        otherMutableIds.forEach((id) => {
          nextMap[id] = equalWeight;
        });
      } else {
        otherMutableIds.forEach((id) => {
          nextMap[id] = (remaining * (allocationPercentExactByTickerId[id] ?? 0)) / otherBase;
        });
      }
    }

    setWeightByTickerId((prev) => ({ ...prev, ...nextMap }));
  };

  const toggleTickerFixed = (profileId: string) => {
    setFixedByTickerId((prev) => ({ ...prev, [profileId]: !prev[profileId] }));
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current === null) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  useEffect(
    () => () => {
      if (longPressTimerRef.current === null) return;
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    },
    []
  );

  const handleTickerPressStart = (profile: TickerProfile) => {
    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      openTickerEditModal(profile);
    }, LONG_PRESS_MS);
  };

  const handleTickerPressEnd = () => {
    clearLongPressTimer();
  };

  const handleTickerChipClick = (profile: TickerProfile) => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    toggleIncludeTicker(profile);
  };

  return (
    <FeatureLayout>
      <Header>
        <HeaderTitle>Snowball Income</HeaderTitle>
        <HeaderDescription>장기 배당 투자 전략을 설계하고 시뮬레이션 결과를 비교하세요.</HeaderDescription>
        <DrawerToggleButton
          type="button"
          aria-label="설정 열기"
          aria-expanded={isConfigDrawerOpen}
          onClick={() => setIsConfigDrawerOpen(true)}
        >
          설정 열기
        </DrawerToggleButton>
      </Header>

      <DrawerBackdrop open={isConfigDrawerOpen} onClick={() => setIsConfigDrawerOpen(false)} />

      <ContentLayout>
        <ConfigDrawerColumn open={isConfigDrawerOpen}>
          <DrawerCloseButton type="button" aria-label="설정 닫기" onClick={() => setIsConfigDrawerOpen(false)}>
            ×
          </DrawerCloseButton>

          <Card>
            <TickerCreateButton type="button" aria-label="티커 생성 열기" onClick={openTickerModal}>
              티커 생성
            </TickerCreateButton>
            {tickerProfiles.length === 0 ? (
              <HintText>아직 생성된 티커가 없습니다.</HintText>
            ) : (
              <TickerGridWrap>
                <TickerList>
                  {tickerProfiles.map((profile) => (
                    <li key={profile.id}>
                      <TickerChipWrap>
                        <TickerItemButton
                          type="button"
                          data-chip="true"
                          selected={includedTickerIds.includes(profile.id)}
                          aria-label={`티커 ${profile.ticker} 선택`}
                          onClick={() => handleTickerChipClick(profile)}
                          onMouseDown={() => handleTickerPressStart(profile)}
                          onMouseUp={handleTickerPressEnd}
                          onMouseLeave={handleTickerPressEnd}
                          onTouchStart={() => handleTickerPressStart(profile)}
                          onTouchEnd={handleTickerPressEnd}
                          onTouchCancel={handleTickerPressEnd}
                        >
                          {profile.ticker}
                        </TickerItemButton>
                        <TickerGearButton
                          type="button"
                          data-gear="true"
                          aria-label={`티커 ${profile.ticker} 설정`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            openTickerEditModal(profile);
                          }}
                        >
                          ⚙
                        </TickerGearButton>
                      </TickerChipWrap>
                    </li>
                  ))}
                </TickerList>
              </TickerGridWrap>
            )}
          </Card>

          <Card>
            <FormSection title="투자 설정">
              <ConfigFormGrid>
                <ToggleField
                  label="빠른 추정 보기"
                  checked={showQuickEstimate}
                  helpAriaLabel="결과 모드 설명 열기"
                  onHelpClick={() => setActiveHelp('resultMode')}
                  onChange={(event) => setShowQuickEstimate(event.target.checked)}
                />
                <ToggleField
                  label="그래프 나누어 보기"
                  checked={showSplitGraphs}
                  onChange={(event) => setShowSplitGraphs(event.target.checked)}
                />
                <ToggleField
                  label="배당 재투자"
                  checked={values.reinvestDividends}
                  onChange={(event) => setField('reinvestDividends', event.target.checked)}
                />
                <ConfigSectionDivider aria-hidden="true" />
                <InputField
                  label="월 투자금 (원)"
                  type="number"
                  min={0}
                  value={values.monthlyContribution}
                  onChange={(event) => setField('monthlyContribution', Number(event.target.value))}
                />
                <InputField
                  label="투자 기간 (연단위)"
                  type="number"
                  min={1}
                  max={60}
                  value={values.durationYears}
                  onChange={(event) => setField('durationYears', Number(event.target.value))}
                />
                <InputField
                  label="세율 (%)"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={values.taxRate ?? ''}
                  onChange={(event) => {
                    const next = event.target.value;
                    setField('taxRate', next === '' ? undefined : Number(next));
                  }}
                />
                <InputField
                  label="목표 월배당 (원)"
                  type="number"
                  min={0}
                  value={values.targetMonthlyDividend}
                  onChange={(event) => setField('targetMonthlyDividend', Number(event.target.value))}
                />
                <InlineField htmlFor="reinvest-timing">
                  <InlineFieldHeader>
                    재투자 시점
                    <HelpMarkButton type="button" aria-label="재투자 시점 설명 열기" onClick={() => setActiveHelp('reinvestTiming')}>
                      ?
                    </HelpMarkButton>
                  </InlineFieldHeader>
                  <InlineSelect
                    id="reinvest-timing"
                    aria-label="재투자 시점"
                    value={values.reinvestTiming}
                    disabled={!values.reinvestDividends}
                    onChange={(event) => setField('reinvestTiming', event.target.value as typeof values.reinvestTiming)}
                  >
                    <option value="sameMonth">당월 재투자</option>
                    <option value="nextMonth">익월 재투자(보수적)</option>
                  </InlineSelect>
                </InlineField>
                <InlineField htmlFor="dps-growth-mode">
                  <InlineFieldHeader>
                    DPS 성장 반영
                    <HelpMarkButton type="button" aria-label="DPS 성장 반영 설명 열기" onClick={() => setActiveHelp('dpsGrowthMode')}>
                      ?
                    </HelpMarkButton>
                  </InlineFieldHeader>
                  <InlineSelect
                    id="dps-growth-mode"
                    aria-label="DPS 성장 반영"
                    value={values.dpsGrowthMode}
                    onChange={(event) => setField('dpsGrowthMode', event.target.value as typeof values.dpsGrowthMode)}
                  >
                    <option value="annualStep">연 단위 점프</option>
                    <option value="monthlySmooth">월 단위 스무딩</option>
                  </InlineSelect>
                </InlineField>
              </ConfigFormGrid>
            </FormSection>

            {!validation.isValid ? (
              <ErrorBox role="alert" aria-live="polite">
                {validation.errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </ErrorBox>
            ) : null}
          </Card>
        </ConfigDrawerColumn>

        <ResultsColumn>
          {simulation ? (
            <>
              {showQuickEstimate ? (
                <Card
                  title="시뮬레이션 결과 (간편)"
                  titleRight={
                    <ToggleField
                      label="결과 상세도"
                      checked={isResultCompact}
                      hideLabel
                      controlWidth="54px"
                      onText="간략"
                      offText="상세"
                      onChange={(event) => setIsResultCompact(event.target.checked)}
                    />
                  }
                >
                  <CompactSummaryGrid>
                    <CompactSummaryItem>
                      <CompactSummaryLabel>최종 자산 추정</CompactSummaryLabel>
                      <CompactSummaryValue>{formatResultAmount(simulation.quickEstimate.endValue, isResultCompact)}</CompactSummaryValue>
                    </CompactSummaryItem>
                    <CompactSummaryItem>
                      <CompactSummaryLabel>연 배당 추정(세후)</CompactSummaryLabel>
                      <CompactSummaryValue>{formatResultAmount(simulation.quickEstimate.annualDividendApprox, isResultCompact)}</CompactSummaryValue>
                    </CompactSummaryItem>
                    <CompactSummaryItem>
                      <CompactSummaryLabel>월 배당 추정(세후)</CompactSummaryLabel>
                      <CompactSummaryValue>{formatResultAmount(simulation.quickEstimate.monthlyDividendApprox, isResultCompact)}</CompactSummaryValue>
                    </CompactSummaryItem>
                    <CompactSummaryItem>
                      <CompactSummaryLabel>종료 시점 배당률(가격 기준)</CompactSummaryLabel>
                      <CompactSummaryValue>{formatPercent(simulation.quickEstimate.yieldOnPriceAtEnd)}</CompactSummaryValue>
                    </CompactSummaryItem>
                  </CompactSummaryGrid>
                </Card>
              ) : (
                <Card
                  title="시뮬레이션 결과 (정밀)"
                  titleRight={
                    <ToggleField
                      label="결과 상세도"
                      checked={isResultCompact}
                      hideLabel
                      controlWidth="54px"
                      onText="간략"
                      offText="상세"
                      onChange={(event) => setIsResultCompact(event.target.checked)}
                    />
                  }
                >
                  <CompactSummaryGrid>
                    <CompactSummaryItem>
                      <CompactSummaryLabel>최종 자산 가치</CompactSummaryLabel>
                      <CompactSummaryValue>{formatResultAmount(simulation.summary.finalAssetValue, isResultCompact)}</CompactSummaryValue>
                    </CompactSummaryItem>
                    <CompactSummaryItem>
                      <CompactSummaryLabel>월배당(월평균: 연/12)</CompactSummaryLabel>
                      <CompactSummaryValue>{formatResultAmount(simulation.summary.finalMonthlyAverageDividend, isResultCompact)}</CompactSummaryValue>
                    </CompactSummaryItem>
                    <CompactSummaryItem>
                      <CompactSummaryLabel>최근 실지급 월배당</CompactSummaryLabel>
                      <CompactSummaryValue>{formatResultAmount(simulation.summary.finalPayoutMonthDividend, isResultCompact)}</CompactSummaryValue>
                    </CompactSummaryItem>
                    <CompactSummaryItem>
                      <CompactSummaryLabel>누적 순배당</CompactSummaryLabel>
                      <CompactSummaryValue>{formatResultAmount(simulation.summary.totalNetDividend, isResultCompact)}</CompactSummaryValue>
                    </CompactSummaryItem>
                    <CompactSummaryItem>
                      <CompactSummaryLabel>누적 세금</CompactSummaryLabel>
                      <CompactSummaryValue>{formatResultAmount(simulation.summary.totalTaxPaid, isResultCompact)}</CompactSummaryValue>
                    </CompactSummaryItem>
                    <CompactSummaryItem>
                      <CompactSummaryLabel>목표 월배당 도달 ({formatResultAmount(values.targetMonthlyDividend, isResultCompact)})</CompactSummaryLabel>
                      <CompactSummaryValue>{targetYearLabel(simulation.summary.targetMonthDividendReachedYear)}</CompactSummaryValue>
                    </CompactSummaryItem>
                  </CompactSummaryGrid>
                </Card>
              )}

              <Card
                title="포트폴리오 구성"
                titleRight={
                  <ToggleField
                    label="포트폴리오 중앙표시"
                    checked={showPortfolioDividendCenter}
                    hideLabel
                    controlWidth="58px"
                    onText="배당"
                    offText="Blank"
                    onChange={(event) => setShowPortfolioDividendCenter(event.target.checked)}
                  />
                }
              >
                {includedProfiles.length === 0 ? (
                  <HintText>좌측 티커 chip을 눌러 포트폴리오에 추가하세요.</HintText>
                ) : (
                  <>
                    {allocationPieOption ? (
                      <AllocationChartLayout>
                        <ChartWrap>
                          <ResponsiveEChart option={allocationPieOption} replaceMerge={['graphic']} />
                        </ChartWrap>
                        <AllocationLegend>
                          {normalizedAllocation.map(({ profile, weight }, index) => (
                            <AllocationLegendItem key={profile.id}>
                              <AllocationColorDot color={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
                              <AllocationLegendName>{profile.ticker}</AllocationLegendName>
                              <AllocationLegendSlider
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                aria-label={`${profile.ticker} 비율`}
                                value={allocationPercentByTickerId[profile.id] ?? 0}
                                style={{ '--slider-progress': `${allocationPercentByTickerId[profile.id] ?? 0}%` } as CSSProperties}
                                disabled={
                                  includedProfiles.length <= 1 || fixedByTickerId[profile.id] || (!fixedByTickerId[profile.id] && adjustableTickerCount <= 1)
                                }
                                onChange={(event) => setTickerWeight(profile.id, Number(event.target.value))}
                              />
                              <AllocationFixButton
                                type="button"
                                active={Boolean(fixedByTickerId[profile.id])}
                                aria-label={`티커 ${profile.ticker} 비율 고정`}
                                title={fixedByTickerId[profile.id] ? '고정 해제' : '비율 고정'}
                                onClick={() => toggleTickerFixed(profile.id)}
                              >
                                고정
                              </AllocationFixButton>
                              <AllocationLegendValue>{`${(weight * 100).toFixed(1)}%`}</AllocationLegendValue>
                            </AllocationLegendItem>
                          ))}
                        </AllocationLegend>
                      </AllocationChartLayout>
                    ) : null}
                    <SelectedChipWrap>
                      {includedProfiles.map((profile) => (
                        <SelectedChip key={profile.id}>
                          <SelectedChipLabel>{profile.ticker}</SelectedChipLabel>
                          <ChipRemoveButton
                            type="button"
                            aria-label={`티커 ${profile.ticker} 삭제`}
                            onClick={() => removeIncludedTicker(profile.id)}
                          >
                            x
                          </ChipRemoveButton>
                        </SelectedChip>
                      ))}
                    </SelectedChipWrap>
                  </>
                )}
              </Card>

              {showSplitGraphs ? (
                <>
                  <ChartPanel
                    title="월 평균 배당"
                    rows={tableRows}
                    getXValue={(row) => `${row.year}`}
                    getYValue={(row) => row.monthlyDividend}
                  />
                  <ChartPanel
                    title="자산 가치"
                    rows={tableRows}
                    getXValue={(row) => `${row.year}`}
                    getYValue={(row) => row.assetValue}
                  />
                  <ChartPanel
                    title="누적 배당"
                    rows={tableRows}
                    getXValue={(row) => `${row.year}`}
                    getYValue={(row) => row.cumulativeDividend}
                  />
                </>
              ) : null}

              <Card title="연도별 결과">
                <SeriesFilterRow>
                  <SeriesFilterGroup>
                    {YEARLY_SERIES_ORDER.map((key) => (
                      <SeriesFilterItem key={key}>
                        <SeriesFilterLabel>
                          <SeriesFilterCheckbox
                            type="checkbox"
                            checked={visibleYearlySeries[key]}
                            onChange={(event) => setVisibleYearlySeries((prev) => ({ ...prev, [key]: event.target.checked }))}
                          />
                          {YEARLY_SERIES_LABEL[key]}
                        </SeriesFilterLabel>
                        <HelpMarkButton
                          type="button"
                          aria-label={`${YEARLY_SERIES_LABEL[key]} 설명 열기`}
                          onClick={() => setActiveHelp(YEARLY_SERIES_HELP_KEY[key])}
                        >
                          ?
                        </HelpMarkButton>
                      </SeriesFilterItem>
                    ))}
                  </SeriesFilterGroup>
                  <ToggleField
                    label="Fill"
                    checked={isYearlyAreaFillOn}
                    hideLabel
                    controlWidth="60px"
                    stateTextColor="#111"
                    onText="Color"
                    offText="Blank"
                    onChange={(event) => setIsYearlyAreaFillOn(event.target.checked)}
                  />
                </SeriesFilterRow>
                <ChartWrap>
                  <ResponsiveEChart option={yearlyResultBarOption} replaceMerge={['series']} />
                </ChartWrap>
              </Card>

              <Card title="실지급 월별 배당 (최근 12개월)">
                <ChartWrap>
                  <ResponsiveEChart option={recentCashflowBarOption} />
                </ChartWrap>
              </Card>
            </>
          ) : (
            <Card title="결과">
              <p>입력값 오류를 수정하면 결과가 표시됩니다.</p>
            </Card>
          )}
        </ResultsColumn>
      </ContentLayout>

      {isTickerModalOpen ? (
        <ModalBackdrop role="dialog" aria-modal="true" aria-label="티커 생성" onClick={handleBackdropClick}>
          <ModalPanel>
            <ModalTitle>{tickerModalMode === 'edit' ? '티커 설정 수정' : '티커 생성'}</ModalTitle>
            <ModalBody>
              {tickerModalMode === 'edit'
                ? '값을 수정하면 해당 티커 설정이 업데이트됩니다.'
                : '아래 값을 저장하면 좌측 목록에 티커가 추가됩니다.'}
            </ModalBody>
            <InlineField htmlFor="ticker-preset">
              <InlineFieldHeader>프리셋 티커</InlineFieldHeader>
              <InlineSelect
                id="ticker-preset"
                aria-label="프리셋 티커"
                value={selectedPreset}
                onChange={(event) => {
                  const nextPreset = event.target.value as 'custom' | PresetTickerKey;
                  setSelectedPreset(nextPreset);
                  if (nextPreset !== 'custom') {
                    setTickerDraft(PRESET_TICKERS[nextPreset]);
                  }
                }}
              >
                <option value="custom">직접 입력</option>
                {Object.keys(PRESET_TICKERS).map((ticker) => (
                  <option key={ticker} value={ticker}>
                    {ticker}
                  </option>
                ))}
              </InlineSelect>
            </InlineField>
            <FormGrid>
              <InputField
                label="티커"
                value={tickerDraft.ticker}
                onChange={(event) => setTickerDraft((prev) => ({ ...prev, ticker: event.target.value }))}
              />
              <InputField
                label="현재 주가"
                type="number"
                min={0}
                value={tickerDraft.initialPrice}
                onChange={(event) => setTickerDraft((prev) => ({ ...prev, initialPrice: Number(event.target.value) }))}
              />
              <InputField
                label="배당률"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={tickerDraft.dividendYield}
                onChange={(event) => setTickerDraft((prev) => ({ ...prev, dividendYield: Number(event.target.value) }))}
              />
              <InputField
                label="배당 성장률"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={tickerDraft.dividendGrowth}
                onChange={(event) => setTickerDraft((prev) => ({ ...prev, dividendGrowth: Number(event.target.value) }))}
              />
              <InputField
                label="주가 성장률"
                type="number"
                min={-100}
                max={100}
                step={0.1}
                value={tickerDraft.priceGrowth}
                onChange={(event) => setTickerDraft((prev) => ({ ...prev, priceGrowth: Number(event.target.value) }))}
              />
              <FrequencySelect
                label="배당 지급 주기"
                value={tickerDraft.frequency}
                onChange={(event) => setTickerDraft((prev) => ({ ...prev, frequency: event.target.value as Frequency }))}
              />
            </FormGrid>
            <ModalActions>
              {tickerModalMode === 'edit' ? (
                <SecondaryButton type="button" onClick={deleteTicker}>
                  티커 삭제
                </SecondaryButton>
              ) : null}
              <SecondaryButton type="button" onClick={closeTickerModal}>
                취소
              </SecondaryButton>
              <PrimaryButton type="button" onClick={saveTicker}>
                {tickerModalMode === 'edit' ? '저장' : '생성'}
              </PrimaryButton>
            </ModalActions>
          </ModalPanel>
        </ModalBackdrop>
      ) : null}

      {currentHelp ? (
        <ModalBackdrop role="dialog" aria-modal="true" aria-label={currentHelp.title} onClick={handleBackdropClick}>
          <ModalPanel>
            <ModalTitle>{currentHelp.title}</ModalTitle>
            <ModalBody>{currentHelp.body}</ModalBody>
            <ModalClose type="button" onClick={closeHelp}>
              닫기
            </ModalClose>
          </ModalPanel>
        </ModalBackdrop>
      ) : null}
    </FeatureLayout>
  );
}
