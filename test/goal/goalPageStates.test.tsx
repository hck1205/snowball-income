import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import {
  buildDefaultPayload,
  writePersistedAppState,
  type PersistedAppStatePayload,
  type PersistedInvestmentSettings
} from '@/jotai';
import { ANALYTICS_EVENT, track, trackEvent } from '@/shared/lib/analytics';
import { FOCUS_TARGET_MONTHLY_DIVIDEND_STATE } from '@/shared/constants';
import type { TickerProfile } from '@/shared/types/snowball';
import GoalPage from '@/pages/Goal/GoalPage';
import { GOAL_COPY } from '@/pages/Goal/copy';

/**
 * `/dividend/goal` **사용자 행동 테스트** — 상태 A~F를 실제 저장 데이터로 구동해
 * "무엇이 읽히고 / 무엇이 없고 / 눌렀을 때 어디로 가는가"를 본다.
 *
 * 스모크(`goalPage.test.tsx`)와의 분담: 저기는 "그려지는가", 여기는 **행동과 부재 단정**이다.
 * 저장소를 못 읽는 상태(G)는 리더를 갈아끼워야 재현되므로 `goalPageErrorStates.test.tsx`가 맡는다.
 *
 * jsdom에는 indexedDB가 없어 `useGoalScenario`가 기본적으로 error로 떨어진다 —
 * `fake-indexeddb/auto` + `writePersistedAppState` 시딩이 정상 경로의 전제 조건이다.
 */

// 계측 파라미터만 관찰한다(ANALYTICS_EVENT 등 상수는 실제 값 유지).
vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, track: vi.fn(), trackEvent: vi.fn() };
});

const PORTFOLIO_DB_NAME = 'snowball-income-db';

/** 투자 시작(2024-01) 후 29개월 — 롤링 12개월 창이 꽉 찬다(폴백 아님). */
const NOW = new Date('2026-06-15T00:00:00+09:00');

/** 이 시나리오의 2026-06 기준 현재 예상 월배당은 약 30만원대다(아래 목표값들이 그 위·아래로 갈린다). */
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

/** 카드(=section[aria-labelledby]) — 로딩·목표 상태에서 카드 자리를 지킨다. */
const goalCard = () => screen.getByRole('region', { name: GOAL_COPY.card.title });

const goalViewEvents = () =>
  vi.mocked(track).mock.calls.filter(([event]) => event === ANALYTICS_EVENT.GOAL_WIDGET_VIEW);

const ctaEvents = () =>
  vi.mocked(trackEvent).mock.calls.filter(([event]) => event === ANALYTICS_EVENT.CTA_CLICK);

beforeEach(async () => {
  vi.clearAllMocks();
  lastLocation = { pathname: '', state: 'unset' };
  await deletePortfolioDb();
  /*
   * 환율 드라이버(`useFxRateSync`)가 마운트 시 `/api/fx`를 부른다. 네트워크도, 테스트 종료 뒤의
   * 지연된 상태 갱신도 원치 않으므로 **영원히 대기하는** 프라미스를 준다(거절하면 catch가 나중에 돈다).
   */
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('목표 달성 페이지 — A 로딩', () => {
  it('데이터가 오기 전에도 골격과 값 자리를 유지한다 (빈 화면·거짓 0% 금지)', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 600_000 }));

    renderGoalPage();

    // 첫 렌더는 아직 저장소를 읽는 중이다.
    const card = goalCard();
    expect(card).toHaveAttribute('aria-busy', 'true');
    // 값이 없는 progressbar는 "0%"로 읽혀 거짓말이 된다 — 로딩 중엔 아예 부여하지 않는다.
    expect(screen.queryByRole('progressbar')).toBeNull();
    // 목표·현재·예상 달성·달성률 네 자리가 모두 '—'로 남는다(자리가 사라지면 화면이 튄다).
    expect(within(card).getAllByText(GOAL_COPY.tiles.empty).length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(GOAL_COPY.live.loading)).toBeTruthy();
    // 계산이 성립하기 전에는 조건 요약을 그리지 않는다(빈 값 나열 금지).
    expect(screen.queryByText(GOAL_COPY.conditions.summary)).toBeNull();

    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());
    expect(goalCard()).not.toHaveAttribute('aria-busy');
  });
});

describe('목표 달성 페이지 — B 저장된 포트폴리오 없음', () => {
  it('카드 자리를 빈 상태가 대체하고, 예고 블록은 낭독되지 않는다', async () => {
    await writePersistedAppState(buildDefaultPayload());

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.empty.title)).toBeTruthy());

    // 카드 안에 또 카드를 만들지 않는다 — 목표 카드 자체가 없다.
    expect(screen.queryByRole('region', { name: GOAL_COPY.card.title })).toBeNull();
    expect(screen.getByText(GOAL_COPY.live.empty)).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
    /*
     * 예고 블록은 장식(aria-hidden) — 라벨은 눈에 보이지만 접근성 트리에서는 빠진다.
     * ⚠ 예고 항목의 문구가 실제 지표 라벨('달성률' 등)과 **같은 문자열**이라, 부재 단정을
     *   getByText로 하면 장식 문구에 걸려 거짓 실패한다. 부재는 역할(role)로만 단정한다.
     */
    expect(screen.getByText(GOAL_COPY.empty.previewLabel)).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('"시뮬레이터에서 시작하기"를 누르면 목표 포커스 요청 없이 시뮬레이터로 간다', async () => {
    const user = userEvent.setup();
    await writePersistedAppState(buildDefaultPayload());

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.empty.title)).toBeTruthy());

    await user.click(screen.getByRole('button', { name: GOAL_COPY.empty.cta }));

    expect(lastLocation.pathname).toBe('/');
    expect(lastLocation.state).toBeNull();
    expect(ctaEvents()).toEqual([
      [ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'goal_open_simulator', placement: 'goal_page' }]
    ]);
  });
});

describe('목표 달성 페이지 — C 목표 미설정 (AC6: 0원 목표를 "달성"이라 말하지 않는다)', () => {
  beforeEach(async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 0 }));
  });

  it('달성률·미터·예상 달성·상태 문장이 전부 없고, 현재 예상 월배당만 남는다', async () => {
    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.setup.title)).toBeTruthy());

    // 달성률 계열 표기가 하나도 없어야 한다(라벨·미터·병기 문장).
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(GOAL_COPY.meter.label)).toBeNull();
    expect(screen.queryByText(/까지 왔습니다\.$/)).toBeNull();
    expect(screen.queryByText(/도달했습니다\.$/)).toBeNull();

    // 예상 달성 타일과 상태 문장(도달/미도달/이미 달성)도 만들지 않는다.
    expect(screen.queryByText(GOAL_COPY.tiles.eta)).toBeNull();
    expect(screen.queryByText(GOAL_COPY.tiles.etaAlready)).toBeNull();
    expect(screen.queryByText(GOAL_COPY.tiles.etaNotReached)).toBeNull();
    expect(screen.queryByText(/닿습니다\.$/)).toBeNull();
    expect(screen.queryByText(/닿지 않습니다\.$/)).toBeNull();

    // 0원을 목표 금액처럼 보여 주지 않고, [목표 수정]도 아직 없다(정한 적이 없으므로).
    expect(screen.queryByText('₩0')).toBeNull();
    expect(screen.queryByRole('button', { name: GOAL_COPY.card.editTarget })).toBeNull();

    // 목표를 잡는 근거인 현재값은 계속 보인다.
    const card = goalCard();
    expect(within(card).getByText(GOAL_COPY.tiles.current)).toBeTruthy();
    expect(within(card).getByText(GOAL_COPY.tiles.currentHint)).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.live.noTarget)).toBeTruthy();
  });

  it('"시뮬레이터에서 목표 설정하기"는 목표 입력 포커스 요청을 실어 보낸다', async () => {
    const user = userEvent.setup();

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.setup.title)).toBeTruthy());

    await user.click(screen.getByRole('button', { name: GOAL_COPY.setup.cta }));

    expect(lastLocation.pathname).toBe('/');
    expect(lastLocation.state).toEqual(FOCUS_TARGET_MONTHLY_DIVIDEND_STATE);
    expect(ctaEvents()).toEqual([
      [ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'goal_set_target', placement: 'goal_page' }]
    ]);
  });

  it('목표가 없으면 달성률 버킷을 GA로 보내지 않는다 (0%로 왜곡 금지)', async () => {
    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.setup.title)).toBeTruthy());

    await waitFor(() => expect(goalViewEvents()).toHaveLength(1));
    const [, params] = goalViewEvents()[0];
    expect(params).toEqual({ has_target: false });
  });
});

describe('목표 달성 페이지 — D 기간 내 미도달', () => {
  beforeEach(async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 1_000_000_000 }));
  });

  it('예상 달성 값을 비우지 않고 "기간 내 미도달"로 말한다', async () => {
    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.tiles.etaNotReached)).toBeTruthy());

    // 빈칸·0이 아니라 사유가 값 자리에 온다 + 무엇을 기준으로 미도달인지 힌트가 붙는다.
    expect(screen.getByText(GOAL_COPY.tiles.etaHintDuration(20))).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.status.notReached(20, '₩1,000,000,000'))).toBeTruthy();

    // 미도달인데 "도달/이미 달성" 어휘가 새면 안 된다.
    expect(screen.queryByText(GOAL_COPY.tiles.etaAlready)).toBeNull();
    expect(screen.queryByText(/도달했습니다\.$/)).toBeNull();

    // 미터는 참 정보로 그대로 그린다(0%가 아니라 실제 비율).
    const meter = screen.getByRole('progressbar', { name: GOAL_COPY.meter.ariaLabel });
    expect(Number(meter.getAttribute('aria-valuenow'))).toBeLessThan(100);
    expect(screen.getByText(GOAL_COPY.live.notReached(Number(meter.getAttribute('aria-valuenow'))))).toBeTruthy();
  });

  it('"조건 바꾸기"로 시뮬레이터로 돌아갈 수 있다 (목표 포커스 없이)', async () => {
    const user = userEvent.setup();

    renderGoalPage();
    await waitFor(() => expect(screen.getByText(GOAL_COPY.tiles.etaNotReached)).toBeTruthy());

    await user.click(screen.getByRole('button', { name: GOAL_COPY.status.changeConditions }));

    expect(lastLocation.pathname).toBe('/');
    expect(lastLocation.state).toBeNull();
  });
});

describe('목표 달성 페이지 — E 기간 안에 도달', () => {
  beforeEach(async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 600_000 }));
  });

  it('도달 시점을 달력 연·월(월 해상도)로 말한다', async () => {
    renderGoalPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());

    const card = goalCard();
    const eta = within(card).getByText(/^\d{4}년 \d{1,2}월$/);
    expect(eta.textContent).toBe(GOAL_COPY.tiles.etaMonth(2030, 9));

    /*
     * "N년차" 힌트는 **연 해상도**(findTargetYear)에서 오고 값은 **월 해상도**에서 온다 —
     * 두 계산이 갈리면 "2030년 9월 / 투자 8년차"처럼 스스로 모순된 화면이 된다.
     * 투자 시작이 2024-01이므로 N = 도달 연 − 2024 + 1 이어야 한다.
     */
    const hint = within(card).getByText(/^투자 \d+년차$/);
    const yearIndex = Number(/\d+/.exec(hint.textContent ?? '')?.[0]);
    expect(yearIndex).toBe(2030 - 2024 + 1);
    // 상태 문장은 추정형 어법 — 도달 월과 목표 금액을 함께 말한다.
    expect(within(card).getByText(GOAL_COPY.status.reached(GOAL_COPY.tiles.etaMonth(2030, 9), '₩600,000'))).toBeTruthy();

    // 아직 닿지 않았으므로 "이미 달성"·"조건 바꾸기"는 없다.
    expect(screen.queryByText(GOAL_COPY.tiles.etaAlready)).toBeNull();
    expect(screen.queryByText(GOAL_COPY.tiles.etaNotReached)).toBeNull();
    expect(screen.queryByRole('button', { name: GOAL_COPY.status.changeConditions })).toBeNull();
  });

  it('[목표 수정]은 시뮬레이터의 목표 입력으로 데려간다', async () => {
    const user = userEvent.setup();

    renderGoalPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());

    await user.click(screen.getByRole('button', { name: GOAL_COPY.card.editTarget }));

    expect(lastLocation.pathname).toBe('/');
    expect(lastLocation.state).toEqual(FOCUS_TARGET_MONTHLY_DIVIDEND_STATE);
    expect(ctaEvents()).toEqual([
      [ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'goal_set_target', placement: 'goal_page' }]
    ]);
  });

  it('이 계산에 쓰인 투자 조건을 그대로 밝힌다', async () => {
    renderGoalPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());

    expect(screen.getByText(GOAL_COPY.conditions.summary)).toBeTruthy();
    expect(screen.getByText('₩100,000,000')).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.conditions.durationValue(20))).toBeTruthy();
    expect(screen.getByText('2024년 1월 1일')).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.conditions.taxRateValue(15.4))).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.conditions.tickerCountValue(1))).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.conditions.currencyNote)).toBeTruthy();
  });

  it('위젯 노출은 하이드레이션 뒤 한 번만 계측한다 (리렌더로 중복 발화 금지)', async () => {
    const { rerender } = renderGoalPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());

    await waitFor(() => expect(goalViewEvents()).toHaveLength(1));
    const [, params] = goalViewEvents()[0];
    expect(params).toMatchObject({ has_target: true, reached_in_range: true });

    rerender(
      <MemoryRouter initialEntries={['/dividend/goal']}>
        <GoalPage now={NOW} />
        <LocationProbe />
      </MemoryRouter>
    );

    expect(goalViewEvents()).toHaveLength(1);
  });

  /*
   * 🐞 버그 재현 (2026-07-27, qa) — GoalPage.tsx:70
   *
   * `toProgressBucket(percent, isReached)`의 `isReached`는 **현재 달성 여부**(isAlreadyReached)를
   * 받도록 문서화돼 있는데(GoalPage.utils.ts:10-13 — "99.999%인데 도달"은 현재값 비교의 부동소수 문제),
   * 호출부가 `goal.isAlreadyReached || goal.reachedMonth !== null`을 넘긴다. 그래서 **기간 안에 언젠가
   * 닿기만 하면** 현재 달성률이 5%든 59%든 전부 progress_bucket='reached'로 기록된다.
   *
   * 결과: ①0-25/25-50/50-75/75-100 버킷에는 "끝내 못 닿는 시나리오"만 남아 진행 분포가 무의미해지고
   *       ②progress_bucket이 reached_in_range와 사실상 같은 값이 돼 파라미터 하나가 죽는다.
   * 사용자 화면에는 영향이 없다(미터·문구는 정상). 수정 담당: frontend-engineer.
   */
  it('달성률 버킷은 화면에 보이는 달성률을 따라간다 (미래 도달을 "reached"로 기록하지 않는다)', async () => {
    renderGoalPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());
    await waitFor(() => expect(goalViewEvents()).toHaveLength(1));

    const percent = Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
    expect(percent).toBeGreaterThan(50);
    expect(percent).toBeLessThan(75);

    expect(goalViewEvents()[0][1]).toEqual({
      has_target: true,
      progress_bucket: '50-75',
      reached_in_range: true
    });
  });
});

describe('목표 달성 페이지 — F 이미 달성', () => {
  beforeEach(async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 100_000 }));
  });

  it('미터를 100%로 채우고 다음 행동으로 목표 올리기를 권한다', async () => {
    renderGoalPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());

    const meter = screen.getByRole('progressbar', { name: GOAL_COPY.meter.ariaLabel });
    expect(meter).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText(GOAL_COPY.meter.value(100))).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.meter.sentenceReached('₩100,000'))).toBeTruthy();

    expect(screen.getByText(GOAL_COPY.tiles.etaAlready)).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.status.already('₩100,000'))).toBeTruthy();
    expect(screen.getByRole('button', { name: GOAL_COPY.card.editTarget })).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.live.already)).toBeTruthy();

    // 이미 넘었으므로 미래 도달 월·미도달 문구는 나오지 않는다.
    expect(screen.queryByText(GOAL_COPY.tiles.etaNotReached)).toBeNull();
    expect(within(goalCard()).queryByText(/^\d{4}년 \d{1,2}월$/)).toBeNull();
  });

  it('GA 달성률 버킷은 reached로 보낸다', async () => {
    renderGoalPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());

    await waitFor(() => expect(goalViewEvents()).toHaveLength(1));
    expect(goalViewEvents()[0][1]).toEqual({
      has_target: true,
      progress_bucket: 'reached',
      reached_in_range: true
    });
  });
});

describe('목표 달성 페이지 — 화면 전역 계약', () => {
  it('라이브 리전은 상태와 무관하게 항상 마운트된다', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 600_000 }));

    renderGoalPage();
    // 로딩 시점에도 이미 존재한다(나중에 생기면 첫 낭독을 놓친다).
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(GOAL_COPY.live.loading)).toBeTruthy();

    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());
    expect(screen.queryByText(GOAL_COPY.live.loading)).toBeNull();
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(1);
  });

  it('종목이 여러 개면 히어로 한 줄이 "첫 종목 외 N종"으로 줄여 말한다', async () => {
    const payload = buildPayload({ targetMonthlyDividend: 600_000 });
    const second: TickerProfile = { ...buildProfile(), id: 'ticker-2', ticker: 'JEPI' };
    const portfolio = {
      tickerProfiles: [buildProfile(), second],
      includedTickerIds: ['ticker-1', 'ticker-2'],
      weightByTickerId: { 'ticker-1': 60, 'ticker-2': 40 },
      fixedByTickerId: { 'ticker-1': false, 'ticker-2': false },
      selectedTickerId: 'ticker-1'
    };

    await writePersistedAppState({
      ...payload,
      portfolio,
      scenarios: payload.scenarios.map((scenario) => ({ ...scenario, portfolio }))
    });

    renderGoalPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());

    expect(screen.getByText('내 포트폴리오 · SCHD 외 1종 · 2026년 6월 기준')).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.conditions.tickerCountValue(2))).toBeTruthy();
  });

  it('구버전 저장 payload(시나리오 탭·세율 없음, 모순된 수익률 3종)도 그대로 열린다', async () => {
    /*
     * 저장 데이터는 사용자 자산이다 — 목표 화면은 **읽기만** 하므로 스키마를 바꾸지 않았고,
     * 탭·세율이 없던 시절의 payload도 정규화를 거쳐 계속 열려야 한다(열리지 않으면 사용자는
     * 자기 포트폴리오가 사라졌다고 느낀다).
     */
    const legacy = {
      portfolio: {
        tickerProfiles: [
          {
            id: 'ticker-1',
            ticker: 'SCHD',
            name: '',
            initialPrice: 27,
            // 구버전은 dy + dg !== etr 로 서로 모순이었다 — 정규화가 정합 모델로 옮긴다.
            dividendYield: 3.34,
            dividendGrowth: 7,
            expectedTotalReturn: 10,
            frequency: 'quarterly'
          }
        ],
        includedTickerIds: ['ticker-1'],
        weightByTickerId: { 'ticker-1': 100 },
        fixedByTickerId: { 'ticker-1': false },
        selectedTickerId: 'ticker-1'
      },
      investmentSettings: {
        initialInvestment: 100_000_000,
        monthlyContribution: 1_000_000,
        targetMonthlyDividend: 600_000,
        investmentStartDate: '2024-01-01',
        durationYears: 20
        // taxRate 없음 — 세율 도입 전 저장본
      }
      // scenarios 없음 — 시나리오 탭 도입 전 저장본
    };

    await writePersistedAppState(legacy as unknown as PersistedAppStatePayload);

    renderGoalPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());

    expect(screen.queryByText(GOAL_COPY.error.title)).toBeNull();
    expect(screen.queryByText(GOAL_COPY.empty.title)).toBeNull();
    expect(screen.getByText('₩600,000')).toBeTruthy();
    expect(screen.getByText(GOAL_COPY.conditions.summary)).toBeTruthy();
  });

  it('h1은 하나뿐이고, 내비에서 목표 달성이 현재 페이지로 표시된다', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 600_000 }));

    renderGoalPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeTruthy());

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(GOAL_COPY.hero.title);
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('link', { name: '목표 달성' })).toHaveAttribute('aria-current', 'page');
    // 직접 URL 진입·새로고침으로 들어와도 문서 제목이 이 화면의 것이어야 한다(공유·북마크).
    expect(document.title).toContain(GOAL_COPY.meta.title);
  });
});
