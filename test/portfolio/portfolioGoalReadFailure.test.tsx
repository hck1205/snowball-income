import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { MemoryRouter } from 'react-router-dom';
import type { PersistedInvestmentSettings } from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

/**
 * 시뮬레이터 저장 payload 로 **계산할 수 없을 때**(읽기 실패·검증 실패) 목표 카드는 아예 뜨지 않는다.
 *
 * 이 화면(보유 목록·요약)은 멀쩡히 동작 중이라 반쪽 에러 카드를 얹지 않는다 — 사실은 GA
 * (`operation_error`)로만 남는다. 카드가 조용히 사라지는 **유일한** 경로라 여기서 못 박는다.
 *
 * 리더 교체는 훅 주입 옵션이 아니라 **모듈 목**으로 한다: 페이지 컨테이너는 훅에 리더를 넘기지
 * 않으므로(실제 배선 그대로) 페이지를 통째로 구동하려면 모듈 경계에서 바꿔야 한다.
 * `invalid-data` 는 실 저장 경로로는 재현되지 않는다(정규화가 값을 다 살려낸다).
 */

const readPersistedAppStateMock = vi.fn();

vi.mock('@/jotai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/jotai')>();
  return { ...actual, readPersistedAppState: (...args: unknown[]) => readPersistedAppStateMock(...args) };
});

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, track: vi.fn(), trackEvent: vi.fn() };
});

const { applyFxFetchResultAtom, buildDefaultPayload } = await import('@/jotai');
const { default: PortfolioPage } = await import('@/pages/Portfolio/PortfolioPage');
const { PORTFOLIO_COPY } = await import('@/pages/Portfolio/copy');
const { writePortfolioRecord } = await import('@/pages/Portfolio/utils');

const copy = PORTFOLIO_COPY;
const NOW = new Date(2026, 5, 15);
const PORTFOLIO_DB_NAME = 'snowball-portfolio';

const buildPayload = (settings: Partial<PersistedInvestmentSettings> = {}) => {
  const base = buildDefaultPayload();
  const profile: TickerProfile = {
    id: 'ticker-1',
    ticker: 'SCHD',
    name: '',
    initialPrice: 27,
    dividendGrowth: 6.4,
    dividendYield: 3.6,
    expectedTotalReturn: 10,
    frequency: 'quarterly'
  };
  const portfolio = {
    tickerProfiles: [profile],
    includedTickerIds: [profile.id],
    weightByTickerId: { [profile.id]: 100 },
    fixedByTickerId: { [profile.id]: false },
    selectedTickerId: profile.id
  };
  const investmentSettings: PersistedInvestmentSettings = {
    ...base.investmentSettings,
    initialInvestment: 100_000_000,
    monthlyContribution: 1_000_000,
    targetMonthlyDividend: 600_000,
    investmentStartDate: '2024-01-01',
    durationYears: 20,
    ...settings
  };

  return {
    ...base,
    portfolio,
    investmentSettings,
    scenarios: base.scenarios.map((scenario) => ({ ...scenario, portfolio, investmentSettings }))
  };
};

const renderPage = () => {
  const store = createStore();
  store.set(applyFxFetchResultAtom, {
    rate: 1381,
    base: 'USD',
    quote: 'KRW',
    asOf: '2026-06-15T00:00:00+09:00'
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/dividend/portfolio']}>
        <PortfolioPage now={NOW} />
      </MemoryRouter>
    </Provider>
  );
};

const operationErrors = () =>
  vi
    .mocked(trackEvent)
    .mock.calls.filter(
      ([event, params]) =>
        event === ANALYTICS_EVENT.OPERATION_ERROR &&
        (params as { operation?: string } | undefined)?.operation === 'goal_read_persisted_state'
    );

beforeEach(async () => {
  vi.clearAllMocks();
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  await writePortfolioRecord([{ ticker: 'SCHD', quantity: 10 }], 15.4);
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('시뮬 저장 payload 를 쓸 수 없을 때 (P7)', () => {
  it('읽기 실패면 목표 카드가 뜨지 않고 나머지 화면은 정상이며 operation_error 가 1회 기록된다', async () => {
    readPersistedAppStateMock.mockResolvedValue({
      ok: false,
      payload: buildDefaultPayload(),
      error: new Error('blocked')
    });

    renderPage();
    await screen.findByRole('rowheader', { name: /SCHD/ });

    await waitFor(() => expect(operationErrors()).toHaveLength(1));

    expect(screen.queryByRole('region', { name: copy.goal.title })).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(copy.goal.conditions.groupTitle)).toBeNull();
    expect(screen.queryByText(copy.footnote.goal)).toBeNull();
    // 나머지 화면은 그대로 동작한다 — 목표 실패가 요약·목록을 죽이지 않는다.
    expect(screen.getByRole('region', { name: copy.summary.title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.cta.simulate })).toBeEnabled();
  });

  it('저장 조건이 계산 불가(검증 실패)여도 같은 방식으로 조용히 빠진다 (반쪽 에러 카드 금지)', async () => {
    // 세율 500%는 폼 스키마(max 100)를 통과하지 못한다 → 계산 자체가 성립하지 않는다.
    readPersistedAppStateMock.mockResolvedValue({ ok: true, payload: buildPayload({ taxRate: 500 }) });

    renderPage();
    await screen.findByRole('rowheader', { name: /SCHD/ });

    expect(screen.queryByRole('region', { name: copy.goal.title })).toBeNull();
    expect(screen.queryByText(copy.goal.setup.title)).toBeNull();
    // 이 경로는 읽기 자체가 성공했으므로 읽기 실패 계측을 쏘지 않는다(사유를 뭉치지 않는다).
    expect(operationErrors()).toHaveLength(0);
  });
});
