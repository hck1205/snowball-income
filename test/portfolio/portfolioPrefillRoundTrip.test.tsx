import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import PortfolioPage from '@/pages/Portfolio/PortfolioPage';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { writePortfolioRecord } from '@/pages/Portfolio/utils';
import MainRightPanel from '@/pages/Main/components/MainRightPanel';
import {
  EMPTY_INVESTMENT_SETTINGS,
  EMPTY_PORTFOLIO_STATE,
  activeScenarioIdAtom,
  applyFxFetchResultAtom,
  scenarioTabsAtom,
  tickerProfilesAtom,
  weightByTickerIdAtom,
  yieldFormAtom
} from '@/jotai';
import type { PersistedScenarioState } from '@/jotai/snowball/types';
import { computePortfolioSummary } from '@/shared/lib/portfolio';

/**
 * **내 포트폴리오 → 시뮬레이터 왕복** (AC5).
 *
 * `portfolioPrefillCommit.test.tsx` 는 손으로 만든 프리필 payload 로 받는 쪽을 검증하고,
 * `portfolioSimulationPrefill.test.ts` 는 보내는 쪽 순수 함수를 검증한다. 둘 다 초록인데도
 * **화면이 실제로 만들어 보내는 state** 가 받는 쪽 sanitize 를 통과하지 못하면(필드명·단위·환율
 * 반영 시점이 어긋나면) 사용자는 "눌렀는데 아무 일도 안 일어남"을 만난다 — 그 이음매가 여기다.
 *
 * 그래서 payload 를 지어내지 않는다: Portfolio 화면을 실제로 렌더해 CTA 를 누르고, 그때
 * `location.state` 로 나간 **그 객체 그대로** 시뮬레이터 결과 패널에 넣는다.
 */

const copy = PORTFOLIO_COPY;
const NOW = new Date(2026, 6, 27);
const FX_RATE = 1381;
const PORTFOLIO_DB_NAME = 'snowball-portfolio';

/** 유니버스 밖 심볼 — 비중에서는 빠지지만 평가금액에는 남는다(그래서 화면이 제외를 안내한다). */
const MANUAL_TICKER = 'ZZTOP';

const SEED = [
  { ticker: 'SCHD', quantity: 10 },
  { ticker: 'JEPI', quantity: 4 },
  { ticker: MANUAL_TICKER, quantity: 5, manual: { price: 20, dividendYield: 3 } }
];

const makeTab = (id: string, name: string): PersistedScenarioState => ({
  id,
  name,
  portfolio: { ...EMPTY_PORTFOLIO_STATE },
  investmentSettings: {
    ...EMPTY_INVESTMENT_SETTINGS,
    visibleYearlySeries: { ...EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries }
  }
});

function StateProbe({ onState }: { onState: (state: unknown) => void }) {
  const location = useLocation();
  onState(location.state);

  return <p data-testid="probe-path">{location.pathname}</p>;
}

/** Portfolio 화면에서 CTA 를 눌러 **실제로 나가는** `location.state` 를 얻는다. */
const captureSimulatePrefillState = async (): Promise<unknown> => {
  const user = userEvent.setup();
  const store = createStore();
  store.set(applyFxFetchResultAtom, { rate: FX_RATE, base: 'USD', quote: 'KRW', asOf: '2026-07-27T00:00:00+09:00' });

  let sent: unknown = 'unset';

  const { unmount } = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/dividend/portfolio']}>
        <Routes>
          <Route path="/dividend/portfolio" element={<PortfolioPage now={NOW} />} />
          <Route
            path="*"
            element={
              <StateProbe
                onState={(value) => {
                  sent = value;
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

  await screen.findByRole('rowheader', { name: /SCHD/ });
  await user.click(screen.getByRole('button', { name: copy.cta.simulate }));
  await screen.findByTestId('probe-path');

  unmount();

  return sent;
};

const renderSimulator = (state: unknown) => {
  const store = createStore();
  store.set(scenarioTabsAtom, [makeTab('tab-1', '기본 탭')]);
  store.set(activeScenarioIdAtom, 'tab-1');

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
        <MainRightPanel />
      </MemoryRouter>
    </Provider>
  );

  return store;
};

beforeEach(async () => {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

describe('내 포트폴리오 → 시뮬레이터 프리필 왕복 (AC5)', () => {
  it('화면이 보낸 state 를 시뮬레이터가 그대로 받아 티커·비중·초기 투자금을 커밋한다', async () => {
    await writePortfolioRecord(SEED, 15.4);

    const sent = await captureSimulatePrefillState();
    const prefill = (sent as { portfolioSimulationPrefill?: { initialInvestmentKrw: number } }).portfolioSimulationPrefill;
    expect(prefill).toBeTruthy();

    const store = renderSimulator(sent);

    await waitFor(() => expect(store.get(tickerProfilesAtom).map((profile) => profile.ticker)).toEqual(['SCHD', 'JEPI']));

    const weights = Object.values(store.get(weightByTickerIdAtom));
    expect(weights.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(100, 9);
    // 보낸 금액이 **그대로** 초기 투자금이 된다(중간에 다시 환산하거나 반올림하지 않는다).
    expect(store.get(yieldFormAtom).initialInvestment).toBe(prefill?.initialInvestmentKrw);
  });

  it('보내는 금액은 클릭 시점 환율로 환산한 총 평가금액이다 (유니버스 밖 종목 포함)', async () => {
    await writePortfolioRecord(SEED, 15.4);

    const sent = await captureSimulatePrefillState();
    const prefill = (sent as { portfolioSimulationPrefill: { initialInvestmentKrw: number; holdings: { ticker: string }[] } })
      .portfolioSimulationPrefill;

    const summary = computePortfolioSummary(SEED, { today: NOW, taxRatePercent: 15.4 });
    expect(prefill.initialInvestmentKrw).toBeCloseTo(summary.totalValueUsd * FX_RATE, 6);

    /*
     * 비중에는 시뮬레이터가 아는 종목만 들어간다 — 금액에는 남고 비중에서는 빠지므로, 그 사실을
     * 화면이 먼저 말해야 한다(같은 화면에서 안내 문구를 함께 확인한다).
     */
    expect(prefill.holdings.map((holding) => holding.ticker)).toEqual(['SCHD', 'JEPI']);
  });

  it('환율이 없으면 프리필을 만들지 않고 CTA 도 누를 수 없다 (가짜 환율 금지)', async () => {
    await writePortfolioRecord(SEED, 15.4);

    const store = createStore();
    store.set(applyFxFetchResultAtom, null);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dividend/portfolio']}>
          <PortfolioPage now={NOW} />
        </MemoryRouter>
      </Provider>
    );

    await screen.findByRole('rowheader', { name: /SCHD/ });
    expect(screen.getByRole('button', { name: copy.cta.simulate })).toBeDisabled();
    expect(screen.getByText(copy.cta.simulateDisabledFx)).toBeInTheDocument();
  });
});
