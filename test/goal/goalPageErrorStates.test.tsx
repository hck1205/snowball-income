import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { PersistedAppStatePayload, PersistedInvestmentSettings } from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 상태 G(저장 데이터로 계산할 수 없음)의 **두 사유가 서로 다른 문장으로 갈리는지** 본다.
 *
 * `invalid-data`는 실제 저장 경로로는 재현할 수 없다 — `writePersistedAppState`가 정규화로
 * 값을 전부 살려내기 때문에(세율 클램프·음수 목표 0 클램프) 실 IndexedDB 시딩으로는
 * 이 분기가 공허해진다(state-engineer 확인). 그래서 여기서는 **저장 리더 자체를 갈아끼운다.**
 *
 * 리더 교체는 `useGoalScenario`의 주입 옵션이 아니라 모듈 목으로 한다 — 페이지 컨테이너는
 * 훅에 리더를 넘기지 않으므로(실제 배선 그대로), 페이지를 통째로 구동하려면 모듈 경계에서 바꿔야 한다.
 */

const readPersistedAppStateMock = vi.fn();

vi.mock('@/jotai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/jotai')>();
  return { ...actual, readPersistedAppState: (...args: unknown[]) => readPersistedAppStateMock(...args) };
});

const { buildDefaultPayload } = await import('@/jotai');
const { default: GoalPage } = await import('@/pages/Goal/GoalPage');
const { GOAL_COPY } = await import('@/pages/Goal/copy');

const NOW = new Date('2026-06-15T00:00:00+09:00');

const buildProfile = (): TickerProfile => ({
  id: 'ticker-1',
  ticker: 'SCHD',
  name: '',
  initialPrice: 27,
  dividendGrowth: 6.4,
  dividendYield: 3.6,
  expectedTotalReturn: 10,
  frequency: 'quarterly'
});

const buildPayload = (settings: Partial<PersistedInvestmentSettings> = {}): PersistedAppStatePayload => {
  const base = buildDefaultPayload();
  const profile = buildProfile();
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
    targetMonthlyDividend: 1_000_000,
    investmentStartDate: '2024-01-01',
    durationYears: 20,
    ...settings
  };

  return {
    ...base,
    portfolio,
    investmentSettings,
    scenarios: base.scenarios.map((scenario) => ({
      ...scenario,
      name: '내 포트폴리오',
      portfolio,
      investmentSettings
    }))
  };
};

let lastLocation: { pathname: string; state: unknown } = { pathname: '', state: 'unset' };

const LocationProbe = () => {
  const location = useLocation();
  lastLocation = { pathname: location.pathname, state: location.state };
  return null;
};

const renderGoalPage = () =>
  render(
    <MemoryRouter initialEntries={['/dividend/goal']}>
      <GoalPage now={NOW} />
      <LocationProbe />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  lastLocation = { pathname: '', state: 'unset' };
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('목표 달성 페이지 — G 저장 데이터로 계산 불가', () => {
  it('저장된 조건이 계산 불가면 "조건을 다시 확인" 문장을 보여 준다 (읽기 실패 문장과 섞지 않는다)', async () => {
    // 세율 500%는 폼 스키마(max 100)를 통과하지 못한다 → 계산 자체가 성립하지 않는다.
    readPersistedAppStateMock.mockResolvedValue({ ok: true, payload: buildPayload({ taxRate: 500 }) });

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.error.invalidData)).toBeTruthy());

    expect(screen.queryByText(GOAL_COPY.error.readFailed)).toBeNull();
    expect(screen.getByText(GOAL_COPY.error.title)).toBeTruthy();
    expect(screen.getByRole('button', { name: GOAL_COPY.error.cta })).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.live.error)).toBeTruthy();

    // 계산이 없으므로 값·미터·조건 요약은 하나도 그리지 않는다(빈 카드 잔해 금지).
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('region', { name: GOAL_COPY.card.title })).toBeNull();
    expect(screen.queryByText(GOAL_COPY.conditions.summary)).toBeNull();
    // 에러 화면에는 "여기에 표시될 내용" 예고를 붙이지 않는다(B와 구분되는 지점).
    expect(screen.queryByText(GOAL_COPY.empty.previewLabel)).toBeNull();
  });

  it('저장소를 못 읽은 경우는 "불러오지 못했다"로 갈린다', async () => {
    readPersistedAppStateMock.mockResolvedValue({
      ok: false,
      payload: buildDefaultPayload(),
      error: new Error('blocked')
    });

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.error.readFailed)).toBeTruthy());

    expect(screen.queryByText(GOAL_COPY.error.invalidData)).toBeNull();
  });

  it('계산 불가 화면의 CTA도 시뮬레이터로 간다', async () => {
    const user = userEvent.setup();
    readPersistedAppStateMock.mockResolvedValue({ ok: true, payload: buildPayload({ taxRate: 500 }) });

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.error.invalidData)).toBeTruthy());

    await user.click(screen.getByRole('button', { name: GOAL_COPY.error.cta }));
    expect(lastLocation.pathname).toBe('/');
    expect(lastLocation.state).toBeNull();
  });
});

describe('목표 달성 페이지 — 음수 목표 (AC6 불변식)', () => {
  it('목표가 음수여도 어떤 경로로도 "달성"이라 말하지 않는다', async () => {
    /*
     * 실제 저장 경로에서는 정규화가 음수를 0으로 클램프하므로 여기까지 오지 않는다
     * (`appStateNormalize.ts` Math.max(0, …)). 저장소 밖에서 들어온 값에 대한 방어선이다.
     */
    readPersistedAppStateMock.mockResolvedValue({ ok: true, payload: buildPayload({ targetMonthlyDividend: -500_000 }) });

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.error.title)).toBeTruthy());

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(GOAL_COPY.tiles.etaAlready)).toBeNull();
    expect(screen.queryByText(/도달했습니다\.$/)).toBeNull();
    expect(screen.queryByText(/닿습니다\.$/)).toBeNull();
    expect(screen.queryByText('-₩500,000')).toBeNull();
  });
});
