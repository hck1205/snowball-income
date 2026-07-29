import { StrictMode } from 'react';
import { createElement, forwardRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import type { Session } from '@supabase/supabase-js';

/**
 * "내 포트폴리오" → 시뮬레이터 **프리필 커밋**의 수신 계약.
 *
 * 여기서만 잡히는 회귀 넷: ①요청을 처리하고도 `location.state`를 안 지워 뒤로가기·새로고침마다 탭이
 * 계속 늘어나는 것 ②커밋이 하이드레이션보다 먼저 일어나 저장값에 조용히 덮이는 것(그래서 커밋 지점이
 * `MainRightPanel` 하위여야 한다) ③다른 화면의 CTA가 사용자가 쓰던 시나리오를 덮어쓰는 것
 * ④비로그인 사용자가 아무 안내도 없이 "아무 일도 안 일어난다"를 겪는 것.
 *
 * 이 앱 테스트 환경은 커뮤니티 env가 비어 `isCommunityEnabled=false`(게이트 없음)가 기본이라,
 * 로그인 게이트를 재현하려 그 값만 true로 덮는다(`scenarioTabLoginNudge.test.tsx`와 같은 관례).
 */
vi.mock('@/shared/lib/supabase', async (importActual) => {
  const actual = await importActual<typeof import('@/shared/lib/supabase')>();
  return { ...actual, isCommunityEnabled: true };
});

/** 캔버스는 이 테스트의 관심사가 아니다 — 커밋 후 결과 화면이 그려질 때 실제 ECharts를 띄우지 않는다. */
vi.mock('echarts-for-react', () => ({
  __esModule: true,
  default: forwardRef<HTMLDivElement, { option?: unknown }>((_props, ref) =>
    createElement('div', { 'data-testid': 'chart-probe', ref })
  )
}));

import MainRightPanel from '@/pages/Main/components/MainRightPanel';
import { PortfolioPrefillRequest } from '@/pages/Main/components/MainRightPanel/components';
import { CommunityAuthProvider } from '@/components/community/CommunityAuthProvider';
import { sessionAtom } from '@/jotai/community';
import {
  EMPTY_INVESTMENT_SETTINGS,
  EMPTY_PORTFOLIO_STATE,
  activeScenarioIdAtom,
  scenarioTabsAtom,
  tickerProfilesAtom,
  weightByTickerIdAtom,
  yieldFormAtom
} from '@/jotai';
import type { PersistedScenarioState } from '@/jotai/snowball/types';
import type { TickerProfile } from '@/shared/types/snowball';
import { PORTFOLIO_PREFILL_SCENARIO_NAME } from '@/pages/Main/utils';
import { buildPortfolioSimulationPrefillState } from '@/shared/constants';

const PREFILL_STATE = buildPortfolioSimulationPrefillState({
  summary: {
    totalValueUsd: 10_000,
    holdings: [
      { ticker: 'SCHD', valueUsd: 7_000, includedInTotals: true },
      { ticker: 'JEPI', valueUsd: 3_000, includedInTotals: true }
    ]
  },
  fxRateKrwPerUsd: 1_400
});

const EXPECTED_INITIAL_INVESTMENT = 10_000 * 1_400;

const makeTab = (id: string, name: string): PersistedScenarioState => ({
  id,
  name,
  portfolio: { ...EMPTY_PORTFOLIO_STATE },
  investmentSettings: {
    ...EMPTY_INVESTMENT_SETTINGS,
    visibleYearlySeries: { ...EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries }
  }
});

const EXISTING_PROFILE: TickerProfile = {
  id: 'mine-1',
  ticker: 'VIG',
  name: '',
  initialPrice: 100,
  dividendYield: 2,
  dividendGrowth: 6,
  expectedTotalReturn: 8,
  frequency: 'quarterly'
};

const FAKE_SESSION = { user: { id: 'u1' } } as unknown as Session;

const seedStore = ({ loggedIn = false, withOwnPortfolio = false }: { loggedIn?: boolean; withOwnPortfolio?: boolean } = {}) => {
  const store = createStore();
  store.set(scenarioTabsAtom, [makeTab('tab-1', '기본 탭')]);
  store.set(activeScenarioIdAtom, 'tab-1');
  if (loggedIn) store.set(sessionAtom, FAKE_SESSION);
  if (withOwnPortfolio) {
    store.set(tickerProfilesAtom, [EXISTING_PROFILE]);
    store.set(weightByTickerIdAtom, { [EXISTING_PROFILE.id]: 100 });
  }
  return store;
};

const LocationProbe = ({ onState }: { onState: (state: unknown) => void }) => {
  const location = useLocation();
  onState(location.state);
  return null;
};

const renderPanel = (store: ReturnType<typeof seedStore>, state: unknown = PREFILL_STATE) => {
  let lastState: unknown = 'unset';

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
        <CommunityAuthProvider>
          <MainRightPanel configDrawerId="config-drawer" />
          <LocationProbe
            onState={(value) => {
              lastState = value;
            }}
          />
        </CommunityAuthProvider>
      </MemoryRouter>
    </Provider>
  );

  return { readState: () => lastState };
};

const tickersOf = (store: ReturnType<typeof seedStore>): string[] =>
  store.get(tickerProfilesAtom).map((profile) => profile.ticker);

const weightSum = (store: ReturnType<typeof seedStore>): number =>
  Object.values(store.get(weightByTickerIdAtom)).reduce((sum, weight) => sum + weight, 0);

describe('PortfolioPrefillRequest — 요청 수신(1회 소비 → 커밋 → 소거)', () => {
  const renderRequest = (state: unknown) => {
    const onApplyPrefill = vi.fn();
    let lastState: unknown = 'unset';

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
        <PortfolioPrefillRequest onApplyPrefill={onApplyPrefill} />
        <LocationProbe
          onState={(value) => {
            lastState = value;
          }}
        />
      </MemoryRouter>
    );

    return { onApplyPrefill, readState: () => lastState };
  };

  it('요청이 실려 오면 한 번 커밋하고 state를 지운다', async () => {
    const { onApplyPrefill, readState } = renderRequest(PREFILL_STATE);

    await waitFor(() => expect(onApplyPrefill).toHaveBeenCalledTimes(1));
    expect(onApplyPrefill).toHaveBeenCalledWith(PREFILL_STATE?.portfolioSimulationPrefill);
    // 소거되지 않으면 뒤로가기·새로고침마다 같은 프리필이 또 커밋된다(탭이 계속 늘어난다).
    await waitFor(() => expect(readState()).toBeNull());
    expect(onApplyPrefill).toHaveBeenCalledTimes(1);
  });

  it('요청이 없으면 아무 일도 하지 않는다', async () => {
    const { onApplyPrefill, readState } = renderRequest(null);

    await waitFor(() => expect(readState()).toBeNull());
    expect(onApplyPrefill).not.toHaveBeenCalled();
  });

  it('다른 화면의 요청(목표 포커스)은 건드리지 않는다', async () => {
    const { onApplyPrefill, readState } = renderRequest({ focusTargetMonthlyDividend: true });

    await waitFor(() => expect(onApplyPrefill).not.toHaveBeenCalled());
    // 남의 요청이므로 state도 지우지 않는다(TargetFocusRequest가 처리해야 한다).
    expect(readState()).toEqual({ focusTargetMonthlyDividend: true });
  });

  it.each([
    ['NaN 금액', { initialInvestmentKrw: Number.NaN, holdings: [{ ticker: 'SCHD', weightPercent: 100 }] }],
    ['음수 금액', { initialInvestmentKrw: -1, holdings: [{ ticker: 'SCHD', weightPercent: 100 }] }],
    ['비중 없음', { initialInvestmentKrw: 100, holdings: [] }],
    ['비중이 문자열', { initialInvestmentKrw: 100, holdings: [{ ticker: 'SCHD', weightPercent: '100' }] }]
  ])('히스토리로 주입된 %s은 커밋하지 않고 state만 지운다', async (_label, payload) => {
    const { onApplyPrefill, readState } = renderRequest({ portfolioSimulationPrefill: payload });

    await waitFor(() => expect(readState()).toBeNull());
    expect(onApplyPrefill).not.toHaveBeenCalled();
  });

  it('StrictMode의 이중 마운트에서도 두 번 커밋하지 않는다', async () => {
    const onApplyPrefill = vi.fn();

    render(
      <StrictMode>
        <MemoryRouter initialEntries={[{ pathname: '/', state: PREFILL_STATE }]}>
          <PortfolioPrefillRequest onApplyPrefill={onApplyPrefill} />
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() => expect(onApplyPrefill).toHaveBeenCalledTimes(1));
  });
});

describe('프리필 커밋 (결과 패널 전체 경로)', () => {
  it('로그인 사용자: 새 탭을 만들어 티커·비중·초기 투자금을 커밋한다', async () => {
    const store = seedStore({ loggedIn: true });
    const { readState } = renderPanel(store);

    await waitFor(() => expect(tickersOf(store)).toEqual(['SCHD', 'JEPI']));

    const tabs = store.get(scenarioTabsAtom);
    expect(tabs).toHaveLength(2);
    expect(tabs[1].name).toBe(PORTFOLIO_PREFILL_SCENARIO_NAME);
    expect(store.get(activeScenarioIdAtom)).toBe(tabs[1].id);
    expect(weightSum(store)).toBeCloseTo(100, 9);
    expect(store.get(yieldFormAtom).initialInvestment).toBe(EXPECTED_INITIAL_INVESTMENT);
    await waitFor(() => expect(readState()).toBeNull());
  });

  it('비로그인 + 빈 활성 탭: 탭을 늘리지 않고 그 탭에 커밋한다', async () => {
    const store = seedStore({ loggedIn: false });
    renderPanel(store);

    await waitFor(() => expect(tickersOf(store)).toEqual(['SCHD', 'JEPI']));

    // 1탭 게이트는 그대로다 — 탭을 늘리지 않았다.
    expect(store.get(scenarioTabsAtom)).toHaveLength(1);
    expect(store.get(yieldFormAtom).initialInvestment).toBe(EXPECTED_INITIAL_INVESTMENT);
    // 파괴가 없었으므로 로그인 프롬프트도 띄우지 않는다.
    expect(screen.queryByRole('dialog', { name: '로그인 유도' })).not.toBeInTheDocument();
  });

  it('비로그인 + 쓰던 시나리오: 아무것도 덮지 않고 로그인을 유도한다', async () => {
    const store = seedStore({ loggedIn: false, withOwnPortfolio: true });
    const { readState } = renderPanel(store);

    expect(await screen.findByRole('dialog', { name: '로그인 유도' })).toBeInTheDocument();
    // 사용자가 만들던 포트폴리오·금액은 그대로다.
    expect(tickersOf(store)).toEqual(['VIG']);
    expect(store.get(yieldFormAtom).initialInvestment).toBe(0);
    expect(store.get(scenarioTabsAtom)).toHaveLength(1);
    // 커밋은 못 했지만 요청은 소비한다 — 남겨두면 이동할 때마다 같은 프롬프트를 다시 만난다.
    await waitFor(() => expect(readState()).toBeNull());
  });

  it('요청이 없으면 평범한 진입과 똑같다 (탭·포트폴리오 불변)', async () => {
    const store = seedStore({ loggedIn: true });
    renderPanel(store, null);

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '로그인 유도' })).not.toBeInTheDocument());
    expect(store.get(scenarioTabsAtom)).toHaveLength(1);
    expect(tickersOf(store)).toEqual([]);
    expect(store.get(yieldFormAtom).initialInvestment).toBe(0);
  });

  it('유니버스 밖 티커만 실려 오면 빈 탭조차 만들지 않는다', async () => {
    const store = seedStore({ loggedIn: true });
    const { readState } = renderPanel(store, {
      portfolioSimulationPrefill: {
        initialInvestmentKrw: 1_000_000,
        holdings: [{ ticker: 'ZZZZ', weightPercent: 100 }]
      }
    });

    await waitFor(() => expect(readState()).toBeNull());
    expect(store.get(scenarioTabsAtom)).toHaveLength(1);
    expect(tickersOf(store)).toEqual([]);
    expect(store.get(yieldFormAtom).initialInvestment).toBe(0);
  });
});
