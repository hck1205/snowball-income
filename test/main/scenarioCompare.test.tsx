import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import {
  EMPTY_INVESTMENT_SETTINGS,
  activeScenarioIdAtom,
  includedTickerIdsAtom,
  scenarioTabsAtom,
  tickerProfilesAtom,
  weightByTickerIdAtom,
  yieldFormAtom,
  type PersistedInvestmentSettings,
  type PersistedScenarioState
} from '@/jotai';
import { ScenarioCompare } from '@/pages/Main/components';
import {
  buildNormalizedAllocation,
  buildScenarioCompareColumn,
  buildScenarioComparison,
  buildSimulationBundle,
  findBestColumnIds,
  getIncludedProfiles,
  toYieldFormValues,
  type ScenarioCompareColumn
} from '@/pages/Main/utils';
import { defaultYieldFormValues } from '@/shared/lib/snowball';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 시나리오 탭 비교(2026-11-09).
 *
 * 잠그는 것: ① 탭 하나의 결과가 **메인 화면과 같은 계산**(종목별 재투자 포함)이다 ② 계산이 안 되는 탭은
 * 0 이 아니라 "계산 불가"다 ③ "최고"는 2개 이상일 때만, 동점은 함께, 달성 시점은 작을수록 ④ 지금 탭의
 * 아직 저장 안 된 편집이 표에 반영된다 ⑤ 표에서 고르면 그 탭으로 간다.
 */
const profile = (id: string, ticker: string, dividendYield: number, dividendGrowth: number): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield,
  dividendGrowth,
  expectedTotalReturn: dividendYield + dividendGrowth,
  frequency: 'quarterly'
});

const schd = profile('t1', 'SCHD', 3.5, 5);
const jepi = profile('t2', 'JEPI', 7.2, 0);

const settings = (overrides: Partial<PersistedInvestmentSettings> = {}): PersistedInvestmentSettings => ({
  ...EMPTY_INVESTMENT_SETTINGS,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  investmentStartDate: '2024-01-01',
  durationYears: 20,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  taxRate: 15,
  ...overrides
});

const scenario = (
  id: string,
  name: string,
  profiles: TickerProfile[],
  investment: Partial<PersistedInvestmentSettings> = {},
  extra: Partial<PersistedScenarioState['portfolio']> = {}
): PersistedScenarioState => ({
  id,
  name,
  portfolio: {
    tickerProfiles: profiles,
    includedTickerIds: profiles.map((item) => item.id),
    weightByTickerId: {},
    fixedByTickerId: {},
    selectedTickerId: null,
    ...extra
  },
  investmentSettings: settings(investment)
});

describe('buildScenarioCompareColumn — 화면과 같은 계산', () => {
  it('🔴 종목별 재투자 설정까지 넣어 메인 화면의 계산과 같은 숫자를 낸다', () => {
    const tab = scenario('a', 'A', [schd, jepi], {}, {
      weightByTickerId: { t1: 60, t2: 40 },
      reinvestPercentByTickerId: { t2: 0 },
      reinvestTargetByTickerId: {}
    });
    const includedProfiles = getIncludedProfiles(tab.portfolio.tickerProfiles, tab.portfolio.includedTickerIds);
    const { simulation } = buildSimulationBundle({
      isValid: true,
      includedProfiles,
      normalizedAllocation: buildNormalizedAllocation(includedProfiles, tab.portfolio.weightByTickerId),
      values: toYieldFormValues(tab.investmentSettings),
      reinvestPercentByTickerId: { t2: 0 },
      reinvestTargetByTickerId: {}
    });

    const column = buildScenarioCompareColumn(tab, true);

    expect(column.result?.finalAssetValue).toBe(simulation!.summary.finalAssetValue);
    expect(column.result?.finalMonthlyDividend).toBe(simulation!.summary.finalMonthlyAverageDividend);
    expect(column.result?.totalNetDividend).toBe(simulation!.summary.totalNetDividend);
    expect(column.holdingsLine).toBe('SCHD 60% · JEPI 40%');
  });

  it('재투자를 끈 종목이 있으면 결과가 달라진다 — 그 설정이 실제로 계산에 들어간다', () => {
    const withRouting = buildScenarioCompareColumn(
      scenario('a', 'A', [schd, jepi], {}, { reinvestPercentByTickerId: { t2: 0 } }),
      true
    );
    const without = buildScenarioCompareColumn(scenario('a', 'A', [schd, jepi]), true);
    expect(withRouting.result!.finalAssetValue).not.toBe(without.result!.finalAssetValue);
  });

  it('🔴 종목이 없으면 0 이 아니라 결과 없음(null)이다', () => {
    const column = buildScenarioCompareColumn(scenario('empty', '빈 탭', []), false);
    expect(column.result).toBeNull();
    expect(column.holdingsLine).toBe('');
  });

  it('목표가 없으면 달성 시점은 null 이다 (목표 0 은 첫 해 "달성"으로 읽히면 안 된다)', () => {
    const column = buildScenarioCompareColumn(scenario('a', 'A', [schd], { targetMonthlyDividend: 0 }), true);
    expect(column.result?.targetReachedYear).toBeNull();
  });
});

describe('findBestColumnIds', () => {
  const col = (id: string, result: Partial<ScenarioCompareColumn['result']> | null): ScenarioCompareColumn => ({
    id,
    name: id,
    isActive: false,
    holdingsLine: '',
    initialInvestment: 0,
    monthlyContribution: 0,
    durationYears: 10,
    targetMonthlyDividend: 1,
    result: result === null ? null : { finalAssetValue: 0, finalMonthlyDividend: 0, totalNetDividend: 0, totalContribution: 0, targetReachedYear: null, ...result }
  });

  it('큰 값이 최고, 동점은 함께, 계산 불가 탭은 후보가 아니다', () => {
    const columns = [col('a', { finalAssetValue: 100 }), col('b', { finalAssetValue: 100.4 }), col('c', { finalAssetValue: 50 }), col('d', null)];
    expect([...findBestColumnIds(columns, 'finalAssetValue')].sort()).toEqual(['a', 'b']);
  });

  it('🔴 달성 시점은 작을수록 최고다', () => {
    const columns = [col('a', { targetReachedYear: 12 }), col('b', { targetReachedYear: 9 }), col('c', { targetReachedYear: null })];
    expect([...findBestColumnIds(columns, 'targetReachedYear')]).toEqual(['b']);
  });

  it('후보가 하나뿐이면 최고를 붙이지 않는다 (혼자 1등은 비교가 아니다)', () => {
    expect(findBestColumnIds([col('a', { finalAssetValue: 1 }), col('b', null)], 'finalAssetValue').size).toBe(0);
  });
});

describe('탭 비교 화면', () => {
  const renderCompare = (onSelectScenario = vi.fn()) => {
    const tabA = scenario('a', '성장형', [schd]);
    const tabB = scenario('b', '고배당', [jepi], { monthlyContribution: 2_000_000 });
    const store = createStore();
    store.set(scenarioTabsAtom, [tabA, tabB]);
    store.set(activeScenarioIdAtom, 'a');
    // 지금 탭의 **화면 상태**(아직 탭 스냅샷에 저장되지 않은 편집) — 초기 투자금을 3천만으로 바꿔 둔다.
    store.set(tickerProfilesAtom, [schd]);
    store.set(includedTickerIdsAtom, ['t1']);
    store.set(weightByTickerIdAtom, {});
    store.set(yieldFormAtom, { ...defaultYieldFormValues, ...toYieldFormValues(settings({ initialInvestment: 30_000_000 })) });

    render(
      <Provider store={store}>
        <ScenarioCompare tabCount={2} onSelectScenario={onSelectScenario} />
      </Provider>
    );
    return { tabA, tabB, onSelectScenario };
  };

  it('탭이 하나면 버튼이 없다', () => {
    render(
      <Provider store={createStore()}>
        <ScenarioCompare tabCount={1} onSelectScenario={vi.fn()} />
      </Provider>
    );
    expect(screen.queryByRole('button', { name: /탭 비교/ })).toBeNull();
  });

  const openPanel = async () => {
    await userEvent.click(screen.getByRole('button', { name: '탭 비교 (2개)' }));
    return screen.getByRole('region', { name: '탭 비교' });
  };

  it('🔴 펼치면 탭마다 범례 한 칸이고, 지금 탭은 아직 저장 안 된 편집까지 반영된다', async () => {
    renderCompare();
    const panel = await openPanel();

    const legend = within(within(panel).getByRole('list', { name: '비교하는 탭' })).getAllByRole('listitem');
    expect(legend).toHaveLength(2);
    expect(legend[0]!.textContent).toContain('성장형');
    expect(legend[0]!.textContent).toContain('보는 중');
    // 탭 스냅샷은 초기 1천만이지만, 화면 상태(3천만)가 반영돼야 한다.
    expect(legend[0]!.textContent).toMatch(/초기 약 3,000만|초기 3,000만|초기 약 3천만/);
    expect(legend[1]!.textContent).toContain('고배당');
  });

  it('🔴 지표마다 탭별 막대 한 줄 — 값은 글자로도 있다(막대만으로 말하지 않는다)', async () => {
    renderCompare();
    const panel = await openPanel();

    for (const title of ['최종 자산', '마지막 해 월 배당(세후)', '누적 배당(세후)', '목표 월 배당 달성']) {
      const rows = within(within(panel).getByRole('list', { name: title })).getAllByRole('listitem');
      expect(rows, title).toHaveLength(2);
      expect(rows[0]!.textContent).toContain('성장형');
    }
    expect(within(panel).getAllByText(/최고|가장 빠름/).length).toBeGreaterThan(0);
  });

  it('범례의 "보기"를 누르면 그 탭으로 가고, 패널은 열린 채로 남는다', async () => {
    const { onSelectScenario } = renderCompare();
    await openPanel();

    await userEvent.click(screen.getByRole('button', { name: /보기 \(고배당\)/ }));

    expect(onSelectScenario).toHaveBeenCalledWith('b');
    expect(screen.getByRole('region', { name: '탭 비교' })).toBeInTheDocument();
  });

  it('버튼으로 접고 펼친다 (aria-expanded 가 상태를 말한다)', async () => {
    renderCompare();
    const toggle = screen.getByRole('button', { name: '탭 비교 (2개)' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: '탭 비교 접기' })).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByRole('button', { name: '탭 비교 접기' }));
    expect(screen.queryByRole('region', { name: '탭 비교' })).toBeNull();
  });
});

describe('buildScenarioComparison', () => {
  it('탭 순서를 지키고 지금 탭을 표시한다', () => {
    const columns = buildScenarioComparison([scenario('x', 'X', [schd]), scenario('y', 'Y', [jepi])], 'y');
    expect(columns.map((column) => [column.id, column.isActive])).toEqual([
      ['x', false],
      ['y', true]
    ]);
  });
});
