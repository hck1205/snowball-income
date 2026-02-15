import { type CSSProperties, type MouseEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import {
  Card,
  DataTable,
  FormSection,
  FrequencySelect,
  InputField,
  ToggleField
} from '@/components';
import type { Frequency, SimulationOutput, SimulationResult } from '@/shared/types';
import { formatKRW } from '@/shared/utils';
import { useYieldArchitect } from '@/features/YieldArchitect/hooks';
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
  SelectedChip,
  SelectedChipLabel,
  SelectedChipWrap,
  SummaryGrid,
  SummaryValue,
  ChipRemoveButton,
  TickerCreateButton,
  TickerGridWrap,
  TickerChipWrap,
  TickerGearButton,
  TickerItemButton,
  TickerList
} from './feature.styled';

type SummaryItemProps = {
  title: string;
  value: string;
};

type TickerProfile = {
  id: string;
  ticker: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  priceGrowth: number;
  frequency: Frequency;
};

type TickerDraft = Omit<TickerProfile, 'id'>;

function SummaryItem({ title, value }: SummaryItemProps) {
  return (
    <Card title={title}>
      <SummaryValue>{value}</SummaryValue>
    </Card>
  );
}

function ResponsiveEChart({ option }: { option: EChartsOption }) {
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
        opts={{
          width: chartSize.width > 0 ? chartSize.width : undefined,
          height: chartSize.height > 0 ? chartSize.height : undefined
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

function ChartPanel({ title, rows, keyName }: { title: string; rows: SimulationResult[]; keyName: keyof SimulationResult }) {
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
        data: rows.map((row) => `${row.year}`)
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatKRW(Number(value))
        }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#0a7285', width: 2 },
          areaStyle: { color: 'rgba(10, 114, 133, 0.08)' },
          data: rows.map((row) => Number(row[keyName]))
        }
      ]
    }),
    [keyName, rows]
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
const ALLOCATION_COLORS = ['#4cc9f0', '#ff7f50', '#ffd166', '#06d6a0', '#b388ff', '#f472b6', '#70e000', '#00bbf9'];

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
    body: '정교 시뮬레이션은 월 단위 계산(지급주기/세금/재투자 타이밍)을 반영합니다. 빠른 추정은 단일 수익률 기반의 간단한 근사치입니다.'
  },
  allocationRatio: {
    title: '티커 비율',
    body: '여러 티커를 함께 선택하면 월 투자금을 입력한 비율대로 나눠서 투자합니다. 예: SCHD 6, JEPI 4이면 60:40 비율입니다.'
  }
} as const;

type HelpKey = keyof typeof HELP_CONTENT;

const PRESET_TICKERS = {
  SCHD: {
    ticker: 'SCHD',
    initialPrice: 100000,
    dividendYield: 3.5,
    dividendGrowth: 6,
    priceGrowth: 5,
    frequency: 'quarterly' as const
  },
  JEPI: {
    ticker: 'JEPI',
    initialPrice: 70000,
    dividendYield: 8.5,
    dividendGrowth: 1.5,
    priceGrowth: 2,
    frequency: 'monthly' as const
  },
  SPY: {
    ticker: 'SPY',
    initialPrice: 700000,
    dividendYield: 1.4,
    dividendGrowth: 5,
    priceGrowth: 7,
    frequency: 'quarterly' as const
  }
};

type PresetTickerKey = keyof typeof PRESET_TICKERS;
type PersistedPortfolioState = {
  tickerProfiles: TickerProfile[];
  includedTickerIds: string[];
  weightByTickerId: Record<string, number>;
  fixedByTickerId: Record<string, boolean>;
  selectedTickerId: string | null;
};
const PORTFOLIO_STORAGE_KEY = 'snowball-income:portfolio:v1';

const EMPTY_PORTFOLIO_STATE: PersistedPortfolioState = {
  tickerProfiles: [],
  includedTickerIds: [],
  weightByTickerId: {},
  fixedByTickerId: {},
  selectedTickerId: null
};

const readPersistedPortfolioState = (): PersistedPortfolioState => {
  try {
    const raw = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) return EMPTY_PORTFOLIO_STATE;
    const parsed = JSON.parse(raw) as PersistedPortfolioState;
    if (!parsed || typeof parsed !== 'object') return EMPTY_PORTFOLIO_STATE;

    const profiles = Array.isArray(parsed.tickerProfiles) ? parsed.tickerProfiles : [];
    const idSet = new Set(profiles.map((profile) => profile.id));
    const included = (Array.isArray(parsed.includedTickerIds) ? parsed.includedTickerIds : []).filter((id) => idSet.has(id));
    const weights = Object.entries(parsed.weightByTickerId ?? {}).reduce<Record<string, number>>((acc, [id, value]) => {
      if (!idSet.has(id)) return acc;
      const next = Number(value);
      if (!Number.isFinite(next) || next < 0) return acc;
      acc[id] = next;
      return acc;
    }, {});
    const fixed = Object.entries(parsed.fixedByTickerId ?? {}).reduce<Record<string, boolean>>((acc, [id, value]) => {
      if (!idSet.has(id)) return acc;
      acc[id] = Boolean(value);
      return acc;
    }, {});
    const selected = parsed.selectedTickerId && idSet.has(parsed.selectedTickerId) ? parsed.selectedTickerId : null;

    return {
      tickerProfiles: profiles,
      includedTickerIds: included,
      weightByTickerId: weights,
      fixedByTickerId: fixed,
      selectedTickerId: selected
    };
  } catch {
    return EMPTY_PORTFOLIO_STATE;
  }
};

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
  const initialPortfolioRef = useRef<PersistedPortfolioState>(readPersistedPortfolioState());
  const { values, setField, validation } = useYieldArchitect();
  const [activeHelp, setActiveHelp] = useState<HelpKey | null>(null);
  const [isTickerModalOpen, setIsTickerModalOpen] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [tickerModalMode, setTickerModalMode] = useState<'create' | 'edit'>('create');
  const [editingTickerId, setEditingTickerId] = useState<string | null>(null);
  const [showQuickEstimate, setShowQuickEstimate] = useState(false);
  const [tickerProfiles, setTickerProfiles] = useState<TickerProfile[]>(initialPortfolioRef.current.tickerProfiles);
  const [selectedTickerId, setSelectedTickerId] = useState<string | null>(initialPortfolioRef.current.selectedTickerId);
  const [includedTickerIds, setIncludedTickerIds] = useState<string[]>(initialPortfolioRef.current.includedTickerIds);
  const [weightByTickerId, setWeightByTickerId] = useState<Record<string, number>>(initialPortfolioRef.current.weightByTickerId);
  const [fixedByTickerId, setFixedByTickerId] = useState<Record<string, boolean>>(initialPortfolioRef.current.fixedByTickerId);
  const [tickerDraft, setTickerDraft] = useState<TickerDraft>(toTickerDraft(values));
  const [selectedPreset, setSelectedPreset] = useState<'custom' | PresetTickerKey>('custom');
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const currentHelp = useMemo(() => (activeHelp ? HELP_CONTENT[activeHelp] : null), [activeHelp]);
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
  const allocationPieOption = useMemo<EChartsOption | null>(() => {
    if (normalizedAllocation.length === 0) return null;

    return {
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
  }, [normalizedAllocation]);
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
    const payload: PersistedPortfolioState = {
      tickerProfiles,
      includedTickerIds,
      weightByTickerId,
      fixedByTickerId,
      selectedTickerId
    };
    window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(payload));
  }, [fixedByTickerId, includedTickerIds, selectedTickerId, tickerProfiles, weightByTickerId]);

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
        targetMonthDividend100ReachedYear: yearly.find((item) => item.monthlyDividend >= 1_000_000)?.year,
        targetMonthDividend200ReachedYear: yearly.find((item) => item.monthlyDividend >= 2_000_000)?.year
      },
      quickEstimate: {
        endValue: outputs.reduce((sum, output) => sum + output.quickEstimate.endValue, 0),
        annualDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.annualDividendApprox, 0),
        monthlyDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.monthlyDividendApprox, 0),
        yieldOnPriceAtEnd: outputs.reduce((sum, output) => sum + output.quickEstimate.yieldOnPriceAtEnd, 0) / outputs.length
      }
    };
  }, [includedProfiles, normalizedAllocation, validation.isValid, values]);

  const tableRows = simulation?.yearly ?? [];
  const recentCashflowRows = (simulation?.monthly ?? []).slice(-12).map((row) => ({
    month: `${row.year}-${String(row.month).padStart(2, '0')}`,
    payout: row.dividendPaid
  }));

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
    setIncludedTickerIds((prev) => {
      const isIncluded = prev.includes(profile.id);
      if (isIncluded) {
        return prev.filter((id) => id !== profile.id);
      }

      setWeightByTickerId((weights) => ({ ...weights, [profile.id]: weights[profile.id] ?? 1 }));
      setFixedByTickerId((fixed) => ({ ...fixed, [profile.id]: fixed[profile.id] ?? false }));
      return [...prev, profile.id];
    });
    setSelectedTickerId(profile.id);
    applyTickerProfile(profile);
    setIsConfigDrawerOpen(false);
  };

  const removeIncludedTicker = (profileId: string) => {
    setIncludedTickerIds((prev) => prev.filter((id) => id !== profileId));
    setFixedByTickerId((prev) => ({ ...prev, [profileId]: false }));
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
                  label="배당 재투자"
                  checked={values.reinvestDividends}
                  onChange={(event) => setField('reinvestDividends', event.target.checked)}
                />
                <ConfigSectionDivider aria-hidden="true" />
                <InputField
                  label="월 투자금"
                  type="number"
                  min={0}
                  value={values.monthlyContribution}
                  onChange={(event) => setField('monthlyContribution', Number(event.target.value))}
                />
                <InputField
                  label="투자 기간"
                  type="number"
                  min={1}
                  max={60}
                  value={values.durationYears}
                  onChange={(event) => setField('durationYears', Number(event.target.value))}
                />
                <InputField
                  label="세율"
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
              <Card title="포트폴리오 구성">
                {includedProfiles.length === 0 ? (
                  <HintText>좌측 티커 chip을 눌러 포트폴리오에 추가하세요.</HintText>
                ) : (
                  <>
                    {allocationPieOption ? (
                      <AllocationChartLayout>
                        <ChartWrap>
                          <ResponsiveEChart option={allocationPieOption} />
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

              {showQuickEstimate ? (
                <Card title="빠른 추정(참고)">
                  <SummaryGrid>
                    <SummaryItem title="최종 자산 추정" value={formatKRW(simulation.quickEstimate.endValue)} />
                    <SummaryItem title="연 배당 추정(세후)" value={formatKRW(simulation.quickEstimate.annualDividendApprox)} />
                    <SummaryItem title="월 배당 추정(세후)" value={formatKRW(simulation.quickEstimate.monthlyDividendApprox)} />
                    <SummaryItem title="종료 시점 배당률(가격 기준)" value={formatPercent(simulation.quickEstimate.yieldOnPriceAtEnd)} />
                  </SummaryGrid>
                  <HintText>빠른 추정은 지급빈도, 세금 타이밍, 재투자 시점을 단순화한 근사값입니다.</HintText>
                </Card>
              ) : (
                <Card title="정교 시뮬레이션(추천)">
                  <SummaryGrid>
                    <SummaryItem title="최종 자산 가치" value={formatKRW(simulation.summary.finalAssetValue)} />
                    <SummaryItem title="월배당(월평균: 연/12)" value={formatKRW(simulation.summary.finalMonthlyAverageDividend)} />
                    <SummaryItem title="최근 실지급 월배당" value={formatKRW(simulation.summary.finalPayoutMonthDividend)} />
                    <SummaryItem title="누적 순배당" value={formatKRW(simulation.summary.totalNetDividend)} />
                    <SummaryItem title="누적 세금" value={formatKRW(simulation.summary.totalTaxPaid)} />
                    <SummaryItem title="목표 월 배당 100만" value={targetYearLabel(simulation.summary.targetMonthDividend100ReachedYear)} />
                    <SummaryItem title="목표 월 배당 200만" value={targetYearLabel(simulation.summary.targetMonthDividend200ReachedYear)} />
                  </SummaryGrid>
                </Card>
              )}

              <ChartPanel title="월 평균 배당" rows={tableRows} keyName="monthlyDividend" />
              <ChartPanel title="자산 가치" rows={tableRows} keyName="assetValue" />
              <ChartPanel title="누적 배당" rows={tableRows} keyName="cumulativeDividend" />

              <Card title="연도별 결과">
                <DataTable
                  rows={tableRows}
                  columns={[
                    { key: 'year', header: '연도', render: (row) => row.year },
                    { key: 'totalContribution', header: '누적 투자금', render: (row) => formatKRW(row.totalContribution) },
                    { key: 'assetValue', header: '자산 가치', render: (row) => formatKRW(row.assetValue) },
                    { key: 'annualDividend', header: '연 배당', render: (row) => formatKRW(row.annualDividend) },
                    { key: 'monthlyDividend', header: '월 평균 배당', render: (row) => formatKRW(row.monthlyDividend) },
                    { key: 'cumulativeDividend', header: '누적 배당', render: (row) => formatKRW(row.cumulativeDividend) }
                  ]}
                />
              </Card>

              <Card title="실지급 월별 배당 (최근 12개월)">
                <DataTable
                  rows={recentCashflowRows}
                  columns={[
                    { key: 'month', header: '월', render: (row) => row.month },
                    { key: 'payout', header: '실지급 배당', render: (row) => formatKRW(row.payout) }
                  ]}
                />
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
                <option value="SCHD">SCHD</option>
                <option value="JEPI">JEPI</option>
                <option value="SPY">SPY</option>
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
