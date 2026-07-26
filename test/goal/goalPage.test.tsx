import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import {
  TARGET_MONTHLY_DIVIDEND_MAX,
  TARGET_MONTHLY_DIVIDEND_QUICK_VALUES,
  buildFocusTargetMonthlyDividendState,
  formatTargetMonthlyDividendChipLabel
} from '@/shared/constants';
import {
  buildDefaultPayload,
  writePersistedAppState,
  type PersistedAppStatePayload,
  type PersistedInvestmentSettings
} from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';
import GoalPage from '@/pages/Goal/GoalPage';
import { GOAL_COPY } from '@/pages/Goal/copy';

/**
 * `/dividend/goal` 화면 **렌더 스모크** — 상태별로 "무엇이 보이고 무엇이 안 보이는가"만 본다
 * (행동 테스트 본대는 qa-tester가 잇는다).
 *
 * jsdom에는 indexedDB가 없어 `useGoalScenario`가 기본적으로 error로 떨어지므로,
 * 훅 테스트와 같은 fake-indexeddb 시딩을 그대로 쓴다.
 */

const PORTFOLIO_DB_NAME = 'snowball-income-db';

/** 투자 시작(2024-01) 후 29개월 — 롤링 12개월 창이 꽉 찬다. */
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

const deletePortfolioDb = () =>
  new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

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

beforeEach(async () => {
  lastLocation = { pathname: '', state: 'unset' };
  await deletePortfolioDb();
  /*
   * 환율 드라이버(`useFxRateSync`)가 마운트 시 `/api/fx`를 부른다. 테스트에서는 네트워크도,
   * 테스트 종료 후의 지연된 상태 갱신도 원치 않으므로 **영원히 대기하는** 프라미스를 준다
   * (거절하면 catch가 테스트 종료 뒤에 상태를 건드린다).
   */
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GoalPage — 상태별 렌더', () => {
  it('저장된 목표가 있으면 달성률 미터와 네 값(목표·현재·달성률·예상 달성)을 그린다', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 3_000_000 }));

    renderGoalPage();

    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(GOAL_COPY.hero.title);
    // 카드 제목과 hero 타일 라벨이 같은 문구라 두 번 나온다(카드 제목 = 섹션 이름).
    expect(screen.getAllByText(GOAL_COPY.tiles.target).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(GOAL_COPY.tiles.current)).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.tiles.eta)).toBeTruthy();
    expect(screen.getByText('₩3,000,000')).toBeTruthy();

    const meter = screen.getByRole('progressbar', { name: GOAL_COPY.meter.ariaLabel });
    const now = Number(meter.getAttribute('aria-valuenow'));
    expect(Number.isInteger(now)).toBe(true);
    expect(now).toBeGreaterThanOrEqual(0);
    expect(now).toBeLessThanOrEqual(100);

    // 시나리오명·종목 요약·기준일이 히어로 한 줄로 붙는다.
    expect(screen.getByText(/내 포트폴리오 · SCHD · 2026년 6월 기준/)).toBeTruthy();
  });

  it('목표가 0이면 달성률·예상 달성 대신 목표 설정 안내만 보여 준다(0원 목표 "달성" 금지)', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 0 }));

    renderGoalPage();

    await waitFor(() => expect(screen.getByText(GOAL_COPY.setup.title)).toBeTruthy());

    expect(screen.getByRole('button', { name: GOAL_COPY.setup.cta })).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(GOAL_COPY.tiles.eta)).toBeNull();
    // 0원을 목표 금액처럼 보여 주지 않는다(카드 제목은 남지만 값 타일은 없다).
    expect(screen.queryByText('₩0')).toBeNull();
    // 목표를 잡는 근거인 현재값은 계속 보인다.
    expect(screen.getByText(GOAL_COPY.tiles.current)).toBeTruthy();
  });

  it('저장된 포트폴리오가 없으면 카드 자리를 빈 상태가 대체한다', async () => {
    await writePersistedAppState(buildDefaultPayload());

    renderGoalPage();

    await waitFor(() => expect(screen.getByText(GOAL_COPY.empty.title)).toBeTruthy());

    expect(screen.getByRole('button', { name: GOAL_COPY.empty.cta })).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.empty.previewLabel)).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('저장소를 읽지 못하면 "불러오지 못했다"는 사실을 그대로 알린다', async () => {
    // 저장된 데이터가 잘못된 게 아니라 **읽기 자체가 실패**한 경우 — 두 문장을 섞지 않는다.
    const original = indexedDB.open;
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    try {
      renderGoalPage();
      await waitFor(() => expect(screen.getByText(GOAL_COPY.error.readFailed)).toBeTruthy());
      expect(screen.getByRole('button', { name: GOAL_COPY.error.cta })).toBeTruthy();
      expect(screen.queryByText(GOAL_COPY.error.invalidData)).toBeNull();
    } finally {
      vi.mocked(indexedDB.open).mockRestore();
      indexedDB.open = original;
    }
  });
});

/**
 * 목표 프리필(로드맵 v2) — 이 화면은 값을 **저장하지 않는다**. 고른 값이 라우터 state에 실려
 * 시뮬레이터로 넘어가는 것까지가 이 화면의 계약이고, 커밋은 시뮬레이터 안에서 일어난다
 * (수신 쪽 계약은 `targetFocusRequest.test.tsx`).
 */
describe('GoalPage — 목표 미설정 상태의 값 선택', () => {
  beforeEach(async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 0 }));
  });

  it('칩은 v2 확정값 네 개(50/100/200/300만원)를 그대로 실어 보낸다', async () => {
    const user = userEvent.setup();

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.setup.title)).toBeTruthy());

    const chips = screen.getByRole('group', { name: GOAL_COPY.setup.chipsLabel });
    for (const value of TARGET_MONTHLY_DIVIDEND_QUICK_VALUES) {
      expect(within(chips).getByRole('button', { name: formatTargetMonthlyDividendChipLabel(value) })).toBeTruthy();
    }

    await user.click(
      within(chips).getByRole('button', { name: formatTargetMonthlyDividendChipLabel(2_000_000) })
    );

    expect(lastLocation.pathname).toBe('/');
    expect(lastLocation.state).toEqual(buildFocusTargetMonthlyDividendState(2_000_000));
  });

  it('직접 입력은 만원 단위를 원 단위로 바꿔 실어 보낸다', async () => {
    const user = userEvent.setup();

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.setup.title)).toBeTruthy());

    await user.type(screen.getByRole('textbox', { name: GOAL_COPY.setup.inputLabel }), '150');
    await user.click(screen.getByRole('button', { name: GOAL_COPY.setup.submit }));

    expect(lastLocation.pathname).toBe('/');
    expect(lastLocation.state).toEqual(buildFocusTargetMonthlyDividendState(1_500_000));
  });

  it('빈 값·상한 초과는 이동하지 않고 이유를 말한다 (무음 실패 금지)', async () => {
    const user = userEvent.setup();
    const invalidMessage = GOAL_COPY.setup.inputInvalid(TARGET_MONTHLY_DIVIDEND_MAX / 10_000);

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.setup.title)).toBeTruthy());

    await user.click(screen.getByRole('button', { name: GOAL_COPY.setup.submit }));
    expect(await screen.findByText(invalidMessage)).toBeTruthy();
    expect(lastLocation.pathname).toBe('/dividend/goal');

    const input = screen.getByRole('textbox', { name: GOAL_COPY.setup.inputLabel });
    await user.type(input, '99999999');
    await user.click(screen.getByRole('button', { name: GOAL_COPY.setup.submit }));

    expect(screen.getByText(invalidMessage)).toBeTruthy();
    expect(lastLocation.pathname).toBe('/dividend/goal');
  });
});
