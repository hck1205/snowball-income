import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, ToggleField } from '@/components';
import type { SimulationResult as SimulationResultRow } from '@/shared/types';
import { DIVIDEND_UNIVERSE } from '@/shared/constants';
import {
  ModalActions,
  ModalBackdrop,
  ModalBody,
  ModalPanel,
  ModalTitle,
  PortfolioPresetCardButton,
  PortfolioPresetContentRow,
  PortfolioPresetCore,
  PortfolioPresetDesc,
  PortfolioPresetGrid,
  PortfolioPresetMain,
  PortfolioPresetMeta,
  PortfolioPresetPlan,
  PortfolioPresetPlanItem,
  PortfolioPresetTitle,
  PrimaryButton,
  ResultsColumn,
  ScenarioTabsHelpButton,
  ScenarioTabButton,
  ScenarioTabCloseButton,
  ScenarioTabEditWrap,
  ScenarioTabRenameInput,
  ScenarioTabTooltip,
  ScenarioTabsWrap,
  SecondaryButton
} from '@/pages/Main/Main.shared.styled';
import MonthlyCashflow from '@/components/MonthlyCashflow';
import PortfolioComposition from '@/components/PortfolioComposition';
import SimulationResult from '@/components/SimulationResult';
import YearlyResult from '@/components/YearlyResult';
import {
  useAdjustableTickerCountAtomValue,
  useAllocationPercentByTickerIdAtomValue,
  useFixedByTickerIdAtomValue,
  useIncludedProfilesAtomValue,
  useIsResultCompactAtomValue,
  useIsYearlyAreaFillOnAtomValue,
  useNormalizedAllocationAtomValue,
  useSetIsResultCompactWrite,
  useSetIsYearlyAreaFillOnWrite,
  useSetIncludedTickerIdsWrite,
  useSetSelectedTickerIdWrite,
  useSetShowPortfolioDividendCenterWrite,
  useShowPortfolioDividendCenterAtomValue,
  useShowQuickEstimateAtomValue,
  useShowSplitGraphsAtomValue,
  useSetTickerProfilesWrite,
  useSetFixedByTickerIdWrite,
  useSetActiveHelpWrite,
  useSetWeightByTickerIdWrite,
  useSetYieldFormWrite,
  useVisibleYearlySeriesAtomValue
} from '@/jotai';
import { useMainComputed, useScenarioTabs, useSnowballForm, useTickerActions } from '@/pages/Main/hooks';
import { ChartPanel, ResponsiveEChart } from '@/pages/Main/components';
import { formatPercent, formatResultAmount, targetYearLabel } from '@/pages/Main/utils';
import type { TickerProfile } from '@/shared/types/snowball';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

const PORTFOLIO_PRESET_PLACEHOLDERS = [
  {
    id: 'warren-buffett-style',
    title: '🧓 워렌 버핏 스타일',
    hook: '우량 기업 중심의 장기 복리 전략',
    coreType: 'SCHD, VIG, PG, KO, JNJ, ABBV',
    style: '안정형',
    target: '장기 보유 투자자',
    allocations: [
      { ticker: 'SCHD', weight: 30 },
      { ticker: 'VIG', weight: 20 },
      { ticker: 'PG', weight: 15 },
      { ticker: 'KO', weight: 15 },
      { ticker: 'JNJ', weight: 10 },
      { ticker: 'ABBV', weight: 10 }
    ],
    monthlyInvestment: '100만원',
    targetInvestment: '2억',
    investmentPeriod: '12~15년',
    expectedMonthlyDividend: '약 40~50만원',
    monthlyContributionValue: 1_000_000,
    durationYearsValue: 13,
    targetMonthlyDividendValue: 450_000
  },
  {
    id: 'cashflow-now',
    title: '💸 당장 현금흐름',
    hook: '매달 배당 받는 월 인컴 전략',
    coreType: 'JEPI, JEPQ, QYLD, O, ENB',
    style: '인컴형',
    target: '은퇴자 / 세컨드 인컴',
    allocations: [
      { ticker: 'JEPI', weight: 30 },
      { ticker: 'JEPQ', weight: 20 },
      { ticker: 'QYLD', weight: 15 },
      { ticker: 'O', weight: 20 },
      { ticker: 'ENB', weight: 15 }
    ],
    monthlyInvestment: '200만원',
    targetInvestment: '2억',
    investmentPeriod: '6~8년',
    expectedMonthlyDividend: '약 110~130만원',
    monthlyContributionValue: 2_000_000,
    durationYearsValue: 7,
    targetMonthlyDividendValue: 1_200_000
  },
  {
    id: 'stable-dividend-growth',
    title: '🌱 안정적 배당성장',
    hook: '꾸준히 배당이 증가하는 ETF 중심',
    coreType: 'SCHD, DGRO, DGRW, NOBL',
    style: '성장+안정',
    target: '초중급 투자자',
    allocations: [
      { ticker: 'SCHD', weight: 40 },
      { ticker: 'DGRO', weight: 25 },
      { ticker: 'DGRW', weight: 20 },
      { ticker: 'NOBL', weight: 15 }
    ],
    monthlyInvestment: '150만원',
    targetInvestment: '3억',
    investmentPeriod: '12년',
    expectedMonthlyDividend: '약 70~90만원',
    monthlyContributionValue: 1_500_000,
    durationYearsValue: 12,
    targetMonthlyDividendValue: 800_000
  },
  {
    id: 'global-dividend-diversified',
    title: '🌎 글로벌 배당 분산',
    hook: '미국 + 해외 배당 ETF 분산',
    coreType: 'SCHD, VIGI, SCHY, VNQI, VYMI',
    style: '분산형',
    target: '환율 리스크 분산 원하는 투자자',
    allocations: [
      { ticker: 'SCHD', weight: 35 },
      { ticker: 'VIGI', weight: 20 },
      { ticker: 'SCHY', weight: 20 },
      { ticker: 'VNQI', weight: 15 },
      { ticker: 'VYMI', weight: 10 }
    ],
    monthlyInvestment: '120만원',
    targetInvestment: '2.5억',
    investmentPeriod: '12년',
    expectedMonthlyDividend: '약 60~75만원',
    monthlyContributionValue: 1_200_000,
    durationYearsValue: 12,
    targetMonthlyDividendValue: 675_000
  },
  {
    id: 'reit-monthly-rent-strategy',
    title: '🏢 월세 리츠 전략',
    hook: '부동산 중심 현금흐름 전략',
    coreType: 'O, VICI, SCHH, VNQI, JEPI',
    style: '인컴+리츠',
    target: '부동산 선호 투자자',
    allocations: [
      { ticker: 'O', weight: 35 },
      { ticker: 'VICI', weight: 20 },
      { ticker: 'SCHH', weight: 20 },
      { ticker: 'VNQI', weight: 15 },
      { ticker: 'JEPI', weight: 10 }
    ],
    monthlyInvestment: '180만원',
    targetInvestment: '2억',
    investmentPeriod: '8~10년',
    expectedMonthlyDividend: '약 90~110만원',
    monthlyContributionValue: 1_800_000,
    durationYearsValue: 9,
    targetMonthlyDividendValue: 1_000_000
  },
  {
    id: 'growth-income-balance',
    title: '📈 성장 + 인컴 밸런스',
    hook: '배당과 자본 성장을 동시에',
    coreType: 'SCHD, DGRW, DIVO, VYM, JEPI',
    style: '균형형',
    target: '장기 복리 추구',
    allocations: [
      { ticker: 'SCHD', weight: 35 },
      { ticker: 'DGRW', weight: 20 },
      { ticker: 'DIVO', weight: 20 },
      { ticker: 'VYM', weight: 15 },
      { ticker: 'JEPI', weight: 10 }
    ],
    monthlyInvestment: '150만원',
    targetInvestment: '3억',
    investmentPeriod: '10~12년',
    expectedMonthlyDividend: '약 100만원',
    monthlyContributionValue: 1_500_000,
    durationYearsValue: 11,
    targetMonthlyDividendValue: 1_000_000
  },
  {
    id: 'high-growth-dividend-challenger',
    title: '🚀 고성장 배당 챌린저',
    hook: '배당 성장률 높은 종목 중심',
    coreType: 'RDVY, SDVY, LOW, ABBV, SCHD',
    style: '공격형',
    target: '수익 극대화 지향',
    allocations: [
      { ticker: 'RDVY', weight: 30 },
      { ticker: 'SDVY', weight: 25 },
      { ticker: 'LOW', weight: 15 },
      { ticker: 'ABBV', weight: 15 },
      { ticker: 'SCHD', weight: 15 }
    ],
    monthlyInvestment: '130만원',
    targetInvestment: '4억',
    investmentPeriod: '15년',
    expectedMonthlyDividend: '약 120만원',
    monthlyContributionValue: 1_300_000,
    durationYearsValue: 15,
    targetMonthlyDividendValue: 1_200_000
  },
  {
    id: 'retirement-prep',
    title: '🛌 은퇴 준비형',
    hook: '은퇴 10년 전 리스크 완화 전략',
    coreType: 'SCHD, JEPI, DGRO, VYM, O',
    style: '점진적 안정',
    target: '은퇴 준비자',
    allocations: [
      { ticker: 'SCHD', weight: 30 },
      { ticker: 'JEPI', weight: 25 },
      { ticker: 'DGRO', weight: 20 },
      { ticker: 'VYM', weight: 15 },
      { ticker: 'O', weight: 10 }
    ],
    monthlyInvestment: '200만원',
    targetInvestment: '3억',
    investmentPeriod: '8~10년',
    expectedMonthlyDividend: '약 110만원',
    monthlyContributionValue: 2_000_000,
    durationYearsValue: 9,
    targetMonthlyDividendValue: 1_100_000
  },
  {
    id: 'dividend-aristocrats-collection',
    title: '💎 배당 귀족 컬렉션',
    hook: '25년 이상 배당 증가 기업 중심',
    coreType: 'NOBL, PG, KO, JNJ, ABBV, LOW',
    style: '초안정형',
    target: '변동성 싫어하는 투자자',
    allocations: [
      { ticker: 'NOBL', weight: 35 },
      { ticker: 'PG', weight: 15 },
      { ticker: 'KO', weight: 15 },
      { ticker: 'JNJ', weight: 15 },
      { ticker: 'ABBV', weight: 10 },
      { ticker: 'LOW', weight: 10 }
    ],
    monthlyInvestment: '100만원',
    targetInvestment: '2억',
    investmentPeriod: '15년',
    expectedMonthlyDividend: '약 45만원',
    monthlyContributionValue: 1_000_000,
    durationYearsValue: 15,
    targetMonthlyDividendValue: 450_000
  },
  {
    id: 'defensive-dividend-etf',
    title: '🧊 방어형 배당 ETF',
    hook: '변동성 낮은 고배당 ETF 중심',
    coreType: 'HDV, VYM, SCHD, DGRO',
    style: '방어형',
    target: '보수적 투자자',
    allocations: [
      { ticker: 'HDV', weight: 30 },
      { ticker: 'VYM', weight: 25 },
      { ticker: 'SCHD', weight: 25 },
      { ticker: 'DGRO', weight: 20 }
    ],
    monthlyInvestment: '120만원',
    targetInvestment: '2.5억',
    investmentPeriod: '12년',
    expectedMonthlyDividend: '약 70만원',
    monthlyContributionValue: 1_200_000,
    durationYearsValue: 12,
    targetMonthlyDividendValue: 700_000
  },
  {
    id: 'monthly-dividend-addict',
    title: '🌊 월배당 중독자',
    hook: '올 월배당 ETF 구성',
    coreType: 'JEPI, JEPQ, DIVO, IDVO, QDVO, O',
    style: '월 인컴 극대화',
    target: '심리적 현금흐름 선호',
    allocations: [
      { ticker: 'JEPI', weight: 25 },
      { ticker: 'JEPQ', weight: 20 },
      { ticker: 'DIVO', weight: 15 },
      { ticker: 'IDVO', weight: 15 },
      { ticker: 'QDVO', weight: 10 },
      { ticker: 'O', weight: 15 }
    ],
    monthlyInvestment: '250만원',
    targetInvestment: '2억',
    investmentPeriod: '5~7년',
    expectedMonthlyDividend: '약 130~150만원',
    monthlyContributionValue: 2_500_000,
    durationYearsValue: 6,
    targetMonthlyDividendValue: 1_400_000
  },
  {
    id: 'smart-diversification-360',
    title: '🧠 올인원 배당 전략',
    hook: '모든 자산군 혼합 입문형',
    coreType: 'SCHD, VYM, JEPI, VIGI, VNQI, DIVO',
    style: '올인원',
    target: '입문자',
    allocations: [
      { ticker: 'SCHD', weight: 30 },
      { ticker: 'VYM', weight: 15 },
      { ticker: 'JEPI', weight: 15 },
      { ticker: 'VIGI', weight: 15 },
      { ticker: 'VNQI', weight: 10 },
      { ticker: 'DIVO', weight: 15 }
    ],
    monthlyInvestment: '150만원',
    targetInvestment: '3억',
    investmentPeriod: '12년',
    expectedMonthlyDividend: '약 90~110만원',
    monthlyContributionValue: 1_500_000,
    durationYearsValue: 12,
    targetMonthlyDividendValue: 1_000_000
  },
  {
    id: 'ai-infra-dividend-growth',
    title: '🤖 AI 인프라 성장형',
    hook: 'AI 반도체, 전력, 데이터센터 인프라 중심',
    coreType: 'SMH, VRT, ETN, NVDA, AVGO, CEG',
    style: '성장형',
    target: 'AI 장기 구조 성장 선호 투자자',
    allocations: [
      { ticker: 'SMH', weight: 25 },
      { ticker: 'VRT', weight: 15 },
      { ticker: 'ETN', weight: 15 },
      { ticker: 'NVDA', weight: 15 },
      { ticker: 'AVGO', weight: 15 },
      { ticker: 'CEG', weight: 15 }
    ],
    monthlyInvestment: '200만원',
    targetInvestment: '3억',
    investmentPeriod: '10~12년',
    expectedMonthlyDividend: '약 55~75만원',
    monthlyContributionValue: 2_000_000,
    durationYearsValue: 11,
    targetMonthlyDividendValue: 650_000
  }
] as const;

const toPresetTargetMonthlyDividend = (expectedMonthlyDividend: string, fallback: number): number => {
  const normalized = expectedMonthlyDividend.replace(/,/g, '');
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return fallback;

  const lowerBoundInManwon = Number(match[1]);
  if (!Number.isFinite(lowerBoundInManwon) || lowerBoundInManwon < 0) return fallback;

  return Math.floor(lowerBoundInManwon * 10_000);
};

function MainRightPanelComponent() {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [editingTabWidth, setEditingTabWidth] = useState<number | null>(null);
  const [deleteTargetTabId, setDeleteTargetTabId] = useState<string | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [postInvestmentProjectionYears, setPostInvestmentProjectionYears] = useState(10);
  const [isPostInvestmentAssetView, setIsPostInvestmentAssetView] = useState(false);
  const dragJustFinishedRef = useRef(false);
  const hasTrackedSimulationRef = useRef(false);
  const hasTrackedPortfolioConfigRef = useRef(false);
  const showQuickEstimate = useShowQuickEstimateAtomValue();
  const isResultCompact = useIsResultCompactAtomValue();
  const setIsResultCompact = useSetIsResultCompactWrite();
  const includedProfiles = useIncludedProfilesAtomValue();
  const normalizedAllocation = useNormalizedAllocationAtomValue();
  const allocationPercentByTickerId = useAllocationPercentByTickerIdAtomValue();
  const adjustableTickerCount = useAdjustableTickerCountAtomValue();
  const fixedByTickerId = useFixedByTickerIdAtomValue();
  const showPortfolioDividendCenter = useShowPortfolioDividendCenterAtomValue();
  const setShowPortfolioDividendCenter = useSetShowPortfolioDividendCenterWrite();
  const setTickerProfiles = useSetTickerProfilesWrite();
  const setIncludedTickerIds = useSetIncludedTickerIdsWrite();
  const setSelectedTickerId = useSetSelectedTickerIdWrite();
  const setWeightByTickerId = useSetWeightByTickerIdWrite();
  const setFixedByTickerId = useSetFixedByTickerIdWrite();
  const setActiveHelp = useSetActiveHelpWrite();
  const setYieldFormValues = useSetYieldFormWrite();
  const showSplitGraphs = useShowSplitGraphsAtomValue();
  const isYearlyAreaFillOn = useIsYearlyAreaFillOnAtomValue();
  const setIsYearlyAreaFillOn = useSetIsYearlyAreaFillOnWrite();
  const visibleYearlySeries = useVisibleYearlySeriesAtomValue();
  const { values, validation } = useSnowballForm();
  const {
    simulation,
    tableRows,
    allocationPieOption,
    recentCashflowBarOption,
    yearlyCashflowByTicker,
    postInvestmentDividendProjectionRows,
    yearlyResultBarOption,
    yearlySeriesItems
  } = useMainComputed({
    isValid: validation.isValid,
    values,
    showPortfolioDividendCenter,
    visibleYearlySeries,
    isYearlyAreaFillOn,
    postInvestmentProjectionYears
  });
  const { setTickerWeight, toggleTickerFixed, removeIncludedTicker } = useTickerActions();
  const {
    tabs,
    activeScenarioId,
    canCreateTab,
    canDeleteTab,
    selectScenarioTab,
    createScenarioTab,
    renameScenarioTab,
    deleteScenarioTab,
    reorderScenarioTabs
  } = useScenarioTabs();
  const hasGraphData = includedProfiles.length > 0;
  const emptyGraphMessage = '좌측 티커 생성을 통해 포트폴리오를 구성해주세요.';
  const getYear = useCallback((row: SimulationResultRow) => `${row.year}`, []);
  const getMonthlyDividend = useCallback((row: SimulationResultRow) => row.monthlyDividend, []);
  const getAssetValue = useCallback((row: SimulationResultRow) => row.assetValue, []);
  const getCumulativeDividend = useCallback((row: SimulationResultRow) => row.cumulativeDividend, []);
  const getProjectedYear = useCallback((row: { year: number }) => `${row.year}`, []);
  const getProjectedMonthlyDividend = useCallback((row: { monthlyDividend: number }) => row.monthlyDividend, []);
  const getProjectedAssetValue = useCallback((row: { assetValue: number }) => row.assetValue, []);
  const projectedAnnualDividendGrowthRate =
    postInvestmentDividendProjectionRows.length >= 2 && postInvestmentDividendProjectionRows[0].annualDividend > 0
      ? (postInvestmentDividendProjectionRows[1].annualDividend / postInvestmentDividendProjectionRows[0].annualDividend) - 1
      : null;
  const projectedAnnualAssetGrowthRate =
    postInvestmentDividendProjectionRows.length >= 2 && postInvestmentDividendProjectionRows[0].assetValue > 0
      ? (postInvestmentDividendProjectionRows[1].assetValue / postInvestmentDividendProjectionRows[0].assetValue) - 1
      : null;
  const postInvestmentChartTitle =
    isPostInvestmentAssetView
      ? projectedAnnualAssetGrowthRate === null
        ? '투자 종료 후 자산가치 추정 (추가 납입 없음)'
        : `투자 종료 후 자산가치 추정 (추가 납입 없음, 연 ${projectedAnnualAssetGrowthRate >= 0 ? '+' : ''}${(
            projectedAnnualAssetGrowthRate * 100
          ).toFixed(2)}%)`
      : projectedAnnualDividendGrowthRate === null
        ? '투자 종료 후 월배당 성장 추정 (추가 납입 없음)'
        : `투자 종료 후 월배당 성장 추정 (추가 납입 없음, 연 ${projectedAnnualDividendGrowthRate >= 0 ? '+' : ''}${(
            projectedAnnualDividendGrowthRate * 100
          ).toFixed(2)}%)`;

  const startRenameMode = useCallback((tabId: string, tabName: string, tabWidth?: number) => {
    setHoverTooltip(null);
    setEditingTabId(tabId);
    setEditingTabName(tabName);
    setEditingTabWidth(typeof tabWidth === 'number' && tabWidth > 0 ? tabWidth + 20 : null);
  }, []);

  const cancelRenameMode = useCallback(() => {
    setHoverTooltip(null);
    setEditingTabId(null);
    setEditingTabName('');
    setEditingTabWidth(null);
  }, []);

  const commitRenameMode = useCallback(() => {
    if (!editingTabId) return;
    setHoverTooltip(null);
    const nextName = editingTabName.trim();
    if (!nextName) {
      // Empty input keeps previous tab name.
      setEditingTabId(null);
      setEditingTabName('');
      setEditingTabWidth(null);
      return;
    }
    const success = renameScenarioTab(editingTabId, editingTabName);
    if (!success) return;
    setEditingTabId(null);
    setEditingTabName('');
    setEditingTabWidth(null);
  }, [editingTabId, editingTabName, renameScenarioTab]);

  const openDeleteModal = useCallback((tabId: string) => {
    trackEvent(ANALYTICS_EVENT.MODAL_VIEW, {
      modal_type: 'delete_tab_modal',
      scenario_id: tabId
    });
    setDeleteTargetTabId(tabId);
  }, []);

  const openScenarioTabsHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_scenario_tabs',
      placement: 'scenario_tabs'
    });
    setActiveHelp('scenarioTabs');
  }, [setActiveHelp]);

  const closeDeleteModal = useCallback(() => {
    setDeleteTargetTabId(null);
  }, []);

  const confirmDeleteTab = useCallback(() => {
    if (!deleteTargetTabId) return;
    deleteScenarioTab(deleteTargetTabId);
    setDeleteTargetTabId(null);
    if (editingTabId === deleteTargetTabId) {
      setEditingTabId(null);
      setEditingTabName('');
      setEditingTabWidth(null);
    }
  }, [deleteScenarioTab, deleteTargetTabId, editingTabId]);

  const showHoverTooltip = useCallback((text: string, x: number, y: number) => {
    setHoverTooltip({ text, x, y });
  }, []);

  const hideHoverTooltip = useCallback(() => {
    setHoverTooltip(null);
  }, []);

  const applyPortfolioPreset = useCallback(
    (preset: (typeof PORTFOLIO_PRESET_PLACEHOLDERS)[number]) => {
      const profiles = preset.allocations
        .map(({ ticker }, index) => {
          const universeItem = DIVIDEND_UNIVERSE[ticker];
          if (!universeItem) return null;

          const profile: TickerProfile = {
            ...universeItem,
            id: `preset-${preset.id}-${ticker.toLowerCase()}-${index + 1}`,
            name: ''
          };
          return profile;
        })
        .filter((profile): profile is TickerProfile => profile !== null);

      if (profiles.length === 0) return;

      trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
        cta_name: 'apply_portfolio_preset',
        placement: 'empty_result_preset_grid',
        preset_id: preset.id
      });
      trackEvent(ANALYTICS_EVENT.PRESET_APPLIED, {
        preset_id: preset.id,
        ticker_count: profiles.length
      });

      const includedIds = profiles.map((profile) => profile.id);
      const selectedId = includedIds[0] ?? null;
      const selectedProfile = profiles[0];

      const nextWeightByTickerId = profiles.reduce<Record<string, number>>((acc, profile, index) => {
        const rawWeight = preset.allocations[index]?.weight ?? 0;
        acc[profile.id] = Math.max(0, rawWeight);
        return acc;
      }, {});
      const nextFixedByTickerId = profiles.reduce<Record<string, boolean>>((acc, profile) => {
        acc[profile.id] = false;
        return acc;
      }, {});

      setTickerProfiles(profiles);
      setIncludedTickerIds(includedIds);
      setSelectedTickerId(selectedId);
      setWeightByTickerId(nextWeightByTickerId);
      setFixedByTickerId(nextFixedByTickerId);
      setShowPortfolioDividendCenter(true);
      renameScenarioTab(activeScenarioId, preset.title);
      setYieldFormValues((prev) => ({
        ...prev,
        ticker: selectedProfile.ticker,
        initialPrice: selectedProfile.initialPrice,
        dividendYield: selectedProfile.dividendYield,
        dividendGrowth: selectedProfile.dividendGrowth,
        expectedTotalReturn: selectedProfile.expectedTotalReturn,
        frequency: selectedProfile.frequency,
        initialInvestment: 0,
        monthlyContribution: preset.monthlyContributionValue,
        targetMonthlyDividend: toPresetTargetMonthlyDividend(preset.expectedMonthlyDividend, preset.targetMonthlyDividendValue),
        durationYears: preset.durationYearsValue
      }));
    },
    [
      setFixedByTickerId,
      setIncludedTickerIds,
      activeScenarioId,
      renameScenarioTab,
      setSelectedTickerId,
      setShowPortfolioDividendCenter,
      setTickerProfiles,
      setWeightByTickerId,
      setYieldFormValues
    ]
  );

  useEffect(() => {
    if (!simulation) {
      hasTrackedSimulationRef.current = false;
      hasTrackedPortfolioConfigRef.current = false;
      return;
    }

    if (!hasTrackedSimulationRef.current) {
      trackEvent(ANALYTICS_EVENT.SIMULATION_RESULT_VIEW, {
        included_ticker_count: includedProfiles.length,
        duration_years: values.durationYears,
        show_quick_estimate: showQuickEstimate
      });
      hasTrackedSimulationRef.current = true;
    }

    if (!hasTrackedPortfolioConfigRef.current) {
      trackEvent(ANALYTICS_EVENT.PORTFOLIO_CONFIG_COMPLETED, {
        included_ticker_count: includedProfiles.length,
        has_split_graphs: showSplitGraphs
      });
      hasTrackedPortfolioConfigRef.current = true;
    }
  }, [includedProfiles.length, showQuickEstimate, showSplitGraphs, simulation, values.durationYears]);

  useEffect(() => {
    if (!simulation) return;
    trackEvent(ANALYTICS_EVENT.CHART_VIEW, {
      chart_name: 'yearly_result',
      mode: isYearlyAreaFillOn ? 'fill' : 'line'
    });
  }, [isYearlyAreaFillOn, simulation]);

  useEffect(() => {
    if (!simulation || !showSplitGraphs) return;
    trackEvent(ANALYTICS_EVENT.CHART_VIEW, {
      chart_name: 'split_graphs',
      visible: true
    });
  }, [showSplitGraphs, simulation]);

  useEffect(() => {
    if (!simulation || postInvestmentDividendProjectionRows.length === 0) return;
    trackEvent(ANALYTICS_EVENT.CHART_VIEW, {
      chart_name: 'post_investment_monthly_dividend_projection',
      visible: true
    });
  }, [postInvestmentDividendProjectionRows.length, simulation]);

  return (
    <ResultsColumn>
      <ScenarioTabsWrap aria-label="포트폴리오 탭 목록">
        {tabs.map((tab) =>
          editingTabId === tab.id ? (
            <ScenarioTabEditWrap key={tab.id} style={editingTabWidth ? { width: `${editingTabWidth}px` } : undefined}>
              <ScenarioTabRenameInput
                autoFocus
                aria-label={`${tab.name} 이름 변경`}
                value={editingTabName}
                onChange={(event) => setEditingTabName(event.target.value)}
                onBlur={commitRenameMode}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitRenameMode();
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelRenameMode();
                  }
                }}
              />
              <ScenarioTabCloseButton
                type="button"
                aria-label={`${tab.name} 삭제`}
                disabled={!canDeleteTab}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openDeleteModal(tab.id);
                }}
              >
                ×
              </ScenarioTabCloseButton>
            </ScenarioTabEditWrap>
          ) : (
            <ScenarioTabButton
              key={tab.id}
              type="button"
              active={tab.id === activeScenarioId}
              dragOver={dragOverTabId === tab.id && draggingTabId !== tab.id}
              isDragging={draggingTabId === tab.id}
              draggable
              onClick={() => {
                if (dragJustFinishedRef.current) {
                  dragJustFinishedRef.current = false;
                  return;
                }
                selectScenarioTab(tab.id);
              }}
              onDragStart={(event) => {
                setDraggingTabId(tab.id);
                setDragOverTabId(null);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', tab.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggingTabId && draggingTabId !== tab.id) {
                  setDragOverTabId(tab.id);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const fromTabId = draggingTabId || event.dataTransfer.getData('text/plain');
                if (!fromTabId || fromTabId === tab.id) return;
                reorderScenarioTabs(fromTabId, tab.id);
                dragJustFinishedRef.current = true;
                setDragOverTabId(null);
              }}
              onDragEnd={() => {
                setDraggingTabId(null);
                setDragOverTabId(null);
              }}
              onMouseEnter={(event) => showHoverTooltip(tab.name, event.clientX, event.clientY)}
              onMouseMove={(event) => showHoverTooltip(tab.name, event.clientX, event.clientY)}
              onDoubleClick={(event) => startRenameMode(tab.id, tab.name, event.currentTarget.getBoundingClientRect().width)}
              onMouseLeave={hideHoverTooltip}
            >
              {tab.name}
            </ScenarioTabButton>
          )
        )}
        {canCreateTab ? (
          <ScenarioTabButton type="button" aria-label="새 포트폴리오 탭 추가" onClick={() => void createScenarioTab()}>
            +
          </ScenarioTabButton>
        ) : null}
        <ScenarioTabsHelpButton type="button" aria-label="포트폴리오 탭 도움말 열기" onClick={openScenarioTabsHelp}>
          ?
        </ScenarioTabsHelpButton>
      </ScenarioTabsWrap>

      {simulation ? (
        <>
          <SimulationResult
            simulation={simulation}
            showQuickEstimate={showQuickEstimate}
            isResultCompact={isResultCompact}
            targetMonthlyDividend={values.targetMonthlyDividend}
            onToggleCompact={setIsResultCompact}
            formatResultAmount={formatResultAmount}
            formatPercent={formatPercent}
            targetYearLabel={targetYearLabel}
          />

          <PortfolioComposition
            includedProfiles={includedProfiles}
            normalizedAllocation={normalizedAllocation}
            allocationPieOption={allocationPieOption}
            allocationPercentByTickerId={allocationPercentByTickerId}
            fixedByTickerId={fixedByTickerId}
            adjustableTickerCount={adjustableTickerCount}
            showPortfolioDividendCenter={showPortfolioDividendCenter}
            onToggleCenterDisplay={setShowPortfolioDividendCenter}
            onSetTickerWeight={setTickerWeight}
            onToggleTickerFixed={toggleTickerFixed}
            onRemoveIncludedTicker={removeIncludedTicker}
            ResponsiveChart={ResponsiveEChart}
          />

          {showSplitGraphs ? (
            <>
              <ChartPanel
                title="월 평균 배당"
                rows={tableRows}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                getXValue={getYear}
                getYValue={getMonthlyDividend}
              />
              <ChartPanel
                title="자산 가치"
                rows={tableRows}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                getXValue={getYear}
                getYValue={getAssetValue}
              />
              <ChartPanel
                title="누적 배당"
                rows={tableRows}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                getXValue={getYear}
                getYValue={getCumulativeDividend}
              />
            </>
          ) : null}

          <YearlyResult
            items={yearlySeriesItems}
            isFillOn={isYearlyAreaFillOn}
            onToggleFill={setIsYearlyAreaFillOn}
            chartOption={yearlyResultBarOption}
            hasData={hasGraphData}
            emptyMessage={emptyGraphMessage}
            ResponsiveChart={ResponsiveEChart}
          />

          <MonthlyCashflow
            chartOption={recentCashflowBarOption}
            yearlyCashflowByTicker={yearlyCashflowByTicker}
            hasData={hasGraphData}
            emptyMessage={emptyGraphMessage}
            ResponsiveChart={ResponsiveEChart}
          />

          <ChartPanel
            title={postInvestmentChartTitle}
            titleRight={
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <select
                    aria-label="향후 확인 기간 선택 (년)"
                    value={postInvestmentProjectionYears}
                    style={{
                      width: '56px',
                      height: '24px',
                      border: '1px solid #bfd0de',
                      borderRadius: '6px',
                      padding: '0 6px',
                      fontSize: '12px',
                      color: '#1f3341',
                      background: '#fff'
                    }}
                    onChange={(event) => setPostInvestmentProjectionYears(Number(event.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={40}>40</option>
                    <option value={50}>50</option>
                  </select>
                  <span style={{ color: '#486073', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>년</span>
                </div>
                <ToggleField
                  label="추정 보기 전환"
                  hideLabel
                  controlWidth="60px"
                  stateTextColor="#111"
                  checked={isPostInvestmentAssetView}
                  offText="배당"
                  onText="자산"
                  onChange={(event) => {
                    trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
                      field_name: 'postInvestmentProjectionView',
                      value: event.target.checked
                    });
                    setIsPostInvestmentAssetView(event.target.checked);
                  }}
                />
              </div>
            }
            rows={postInvestmentDividendProjectionRows}
            hasData={hasGraphData && postInvestmentDividendProjectionRows.length > 0}
            emptyMessage={emptyGraphMessage}
            getXValue={getProjectedYear}
            getYValue={isPostInvestmentAssetView ? getProjectedAssetValue : getProjectedMonthlyDividend}
          />
        </>
      ) : (
        <Card title={includedProfiles.length === 0 ? '추천 포트폴리오로 시작해보세요' : '결과'}>
          {includedProfiles.length === 0 ? (
            <PortfolioPresetGrid aria-label="포트폴리오 프리셋 목록">
              {PORTFOLIO_PRESET_PLACEHOLDERS.map((preset) => (
                <PortfolioPresetCardButton key={preset.id} type="button" onClick={() => applyPortfolioPreset(preset)}>
                  <PortfolioPresetContentRow>
                    <PortfolioPresetMain>
                      <PortfolioPresetTitle>{preset.title}</PortfolioPresetTitle>
                      <PortfolioPresetDesc>{preset.hook}</PortfolioPresetDesc>
                      <PortfolioPresetCore>핵심 구성: {preset.coreType}</PortfolioPresetCore>
                      <PortfolioPresetMeta>
                        성향: {preset.style} | 추천 대상: {preset.target}
                      </PortfolioPresetMeta>
                    </PortfolioPresetMain>
                    <PortfolioPresetPlan>
                      <PortfolioPresetPlanItem>
                        월 투자금 제안 <strong>{preset.monthlyInvestment}</strong>
                      </PortfolioPresetPlanItem>
                      <PortfolioPresetPlanItem>
                        목표 투자금 <strong>{preset.targetInvestment}</strong>
                      </PortfolioPresetPlanItem>
                      <PortfolioPresetPlanItem>
                        투자 기간 <strong>{preset.investmentPeriod}</strong>
                      </PortfolioPresetPlanItem>
                      <PortfolioPresetPlanItem>
                        목표 월배당(예상) <strong>{preset.expectedMonthlyDividend}</strong>
                      </PortfolioPresetPlanItem>
                    </PortfolioPresetPlan>
                  </PortfolioPresetContentRow>
                </PortfolioPresetCardButton>
              ))}
            </PortfolioPresetGrid>
          ) : (
            <p>입력값 오류를 수정하면 결과가 표시됩니다.</p>
          )}
        </Card>
      )}
      {deleteTargetTabId && modalRoot
        ? createPortal(
            <ModalBackdrop
              role="dialog"
              aria-modal="true"
              aria-label="탭 삭제 확인"
              onClick={(event) => {
                if (event.target !== event.currentTarget) return;
                closeDeleteModal();
              }}
            >
              <ModalPanel>
                <ModalTitle>탭 삭제</ModalTitle>
                <ModalBody>정말 삭제하시겠습니까?</ModalBody>
                <ModalActions>
                  <SecondaryButton type="button" onClick={closeDeleteModal}>
                    취소
                  </SecondaryButton>
                  <PrimaryButton type="button" onClick={confirmDeleteTab}>
                    삭제
                  </PrimaryButton>
                </ModalActions>
              </ModalPanel>
            </ModalBackdrop>,
            modalRoot
          )
        : null}
      {hoverTooltip && modalRoot
        ? createPortal(
            <ScenarioTabTooltip style={{ left: `${hoverTooltip.x + 10}px`, top: `${hoverTooltip.y + 14}px` }}>
              {hoverTooltip.text}
            </ScenarioTabTooltip>,
            modalRoot
          )
        : null}
    </ResultsColumn>
  );
}

const MainRightPanel = memo(MainRightPanelComponent);

export default MainRightPanel;
