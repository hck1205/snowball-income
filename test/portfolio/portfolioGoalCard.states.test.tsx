import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ANALYTICS_EVENT, track, trackEvent } from '@/shared/lib/analytics';
import { FOCUS_TARGET_MONTHLY_DIVIDEND_STATE } from '@/shared/constants';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import {
  buildGoalPayload,
  lastLocation,
  renderPortfolioPage,
  resetGoalStorages,
  seedGoalStorages
} from './portfolioGoalHarness';

/**
 * `/dividend/portfolio` **목표 달성 카드**의 상태 교차 분기 — 보유(Portfolio) × 목표(시뮬 저장본).
 *
 * 여기서 지키는 것은 "무엇이 보이고 / 무엇이 **없고** / 눌렀을 때 어디로 가는가"다. 카드가 조용히
 * 사라지거나(첫 행동이 흐려진다) 없는 값이 지어내지는 순간이 이 화면의 유일한 사고 유형이다.
 *
 * 금액 리터럴은 **목표·조건 값**(저장 payload 에서 온 것)만 단정한다 — 실측 금액은 월간 시세 스냅샷에
 * 딸려 바뀌므로 구조로만 본다(`portfolioGoalMeasured.test.tsx` 가 그 짝을 증명한다).
 */

// 계측 파라미터만 관찰한다(ANALYTICS_EVENT 등 상수는 실제 값 유지).
vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, track: vi.fn(), trackEvent: vi.fn() };
});

const copy = PORTFOLIO_COPY;

/** 보유가 아주 적어 실측이 어떤 목표에도 못 미치는 구성(달성률 분기를 결정적으로 만든다). */
const TINY_HOLDING = [{ ticker: 'SCHD', quantity: 1 }];
/** 반대로 어떤 목표든 넘어서는 구성. */
const HUGE_HOLDING = [{ ticker: 'SCHD', quantity: 100_000 }];

const goalCard = () => screen.getByRole('region', { name: copy.goal.title });
const queryGoalCard = () => screen.queryByRole('region', { name: copy.goal.title });

const goalViewEvents = () =>
  vi.mocked(track).mock.calls.filter(([event]) => event === ANALYTICS_EVENT.GOAL_WIDGET_VIEW);

const ctaEvents = () =>
  vi.mocked(trackEvent).mock.calls.filter(([event]) => event === ANALYTICS_EVENT.CTA_CLICK);

beforeEach(async () => {
  vi.clearAllMocks();
  await resetGoalStorages();
  /*
   * 환율 드라이버(`useFxRateSync`)가 마운트 시 `/api/fx` 를 부른다. 네트워크도, 테스트 종료 뒤의 지연된
   * 상태 갱신도 원치 않으므로 **영원히 대기하는** 프라미스를 준다(거절하면 catch 가 나중에 돈다).
   */
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('목표 미설정 (P6) — 목표를 정하는 유일한 표면', () => {
  beforeEach(async () => {
    await seedGoalStorages({ payload: buildGoalPayload({ targetMonthlyDividend: 0 }), holdings: TINY_HOLDING });
  });

  it('설정 패널만 보이고 달성률 계열 표기는 하나도 없다 (AC6: 0원 목표를 "달성"이라 말하지 않는다)', async () => {
    renderPortfolioPage();
    await screen.findByText(copy.goal.setup.title);

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(copy.goal.meter.label)).toBeNull();
    expect(screen.queryByText(/까지 왔습니다\.$/)).toBeNull();
    expect(screen.queryByText(/도달했습니다\.$/)).toBeNull();
    expect(screen.queryByText(copy.goal.tiles.eta)).toBeNull();
    expect(screen.queryByText('₩0')).toBeNull();
    // 정한 적이 없으므로 [목표 수정]도 아직 없다.
    expect(screen.queryByRole('button', { name: copy.goal.editTarget })).toBeNull();
  });

  it('하단 "언제 목표를 달성할까요?" 버튼은 없다 (같은 패널 안에 직접 입력이 이미 있다)', async () => {
    renderPortfolioPage();
    const card = within(await screen.findByRole('region', { name: copy.goal.title }));

    expect(card.getByRole('group', { name: copy.goal.setup.chipsLabel })).toBeInTheDocument();
    expect(card.getByRole('textbox', { name: copy.goal.setup.inputLabel })).toBeInTheDocument();
    expect(card.getByRole('button', { name: copy.goal.setup.submit })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /언제 목표를 달성할까요/ })).toBeNull();
  });

  it('목표가 없으면 달성률 버킷을 GA 로 보내지 않는다 (0%로 왜곡 금지)', async () => {
    renderPortfolioPage();
    await screen.findByText(copy.goal.setup.title);

    await waitFor(() => expect(goalViewEvents()).toHaveLength(1));
    expect(goalViewEvents()[0][1]).toEqual({ has_target: false, current_basis: 'measured' });
  });
});

describe('기간 내 미도달 (D)', () => {
  beforeEach(async () => {
    await seedGoalStorages({
      payload: buildGoalPayload({ targetMonthlyDividend: 1_000_000_000 }),
      holdings: TINY_HOLDING
    });
  });

  it('예상 달성 값을 비우지 않고 "기간 내 미도달"로 말하고, 다음 행동을 준다', async () => {
    renderPortfolioPage();
    await screen.findByText(copy.goal.tiles.etaNotReached);

    expect(screen.getByText(copy.goal.tiles.etaHintDuration(20))).toBeInTheDocument();
    expect(screen.getByText(copy.goal.status.notReached(20, '₩1,000,000,000'))).toBeInTheDocument();
    // 미도달인데 "도달/이미 달성" 어휘가 새면 안 된다.
    expect(screen.queryByText(copy.goal.tiles.etaAlready)).toBeNull();
    expect(screen.queryByText(/도달했습니다\.$/)).toBeNull();

    const meter = screen.getByRole('progressbar', { name: copy.goal.meter.ariaLabel });
    expect(Number(meter.getAttribute('aria-valuenow'))).toBeLessThan(100);
  });

  it('"매월 얼마를 더 넣으면 닿을지 확인하기"는 프리필 없이 시뮬레이터로 보낸다', async () => {
    const user = userEvent.setup();
    renderPortfolioPage();
    await screen.findByText(copy.goal.tiles.etaNotReached);

    await user.click(screen.getByRole('button', { name: copy.goal.status.changeConditions }));

    expect(lastLocation.pathname).toBe('/simulator');
    // 프리필을 실으면 위 타일이 보여 준 ETA 의 근거 시나리오가 이동과 동시에 바뀐다.
    expect(lastLocation.state).toBeNull();
    expect(ctaEvents()).toContainEqual([
      ANALYTICS_EVENT.CTA_CLICK,
      { cta_name: 'goal_open_simulator', placement: 'portfolio_page' }
    ]);
  });

  it('예상 달성 시점의 근거를 **기존 가정 요약 안**의 그룹으로 밝힌다 (새 접기 블록을 만들지 않는다)', async () => {
    renderPortfolioPage();
    await screen.findByText(copy.goal.tiles.etaNotReached);

    const assumptions = screen.getByText(copy.assumptions.summary(15.4)).closest('details');
    if (assumptions === null) throw new Error('가정 요약 details 를 찾지 못했다');

    const group = within(assumptions);
    expect(group.getByText(copy.goal.conditions.groupTitle)).toBeInTheDocument();
    expect(group.getByText(copy.goal.conditions.groupNote)).toBeInTheDocument();
    expect(group.getByText('₩100,000,000')).toBeInTheDocument();
    expect(group.getByText(copy.goal.conditions.durationValue(20))).toBeInTheDocument();
    expect(group.getByText('2024년 1월 1일')).toBeInTheDocument();
    expect(group.getByText(copy.goal.conditions.tickerCountValue(1))).toBeInTheDocument();
    // 세율 라벨이 두 번 나오는 것은 수용한 모호성이다 — 그룹 제목이 소속을 밝힌다.
    expect(group.getAllByText(copy.assumptions.taxLabel).length).toBeGreaterThanOrEqual(2);
  });
});

describe('기간 안에 도달 (E)', () => {
  beforeEach(async () => {
    await seedGoalStorages({
      payload: buildGoalPayload({ targetMonthlyDividend: 600_000 }),
      holdings: TINY_HOLDING
    });
  });

  it('도달 시점을 달력 연·월로 말하고 투자 N년차를 함께 붙인다', async () => {
    renderPortfolioPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());

    const card = within(goalCard());
    const eta = card.getByText(/^\d{4}년 \d{1,2}월$/);
    expect(eta.textContent).toBe(copy.goal.tiles.etaMonth(2030, 9));

    /*
     * "N년차" 힌트는 **연 해상도**에서 오고 값은 **월 해상도**에서 온다 — 두 계산이 갈리면
     * "2030년 9월 / 투자 8년차"처럼 스스로 모순된 화면이 된다(투자 시작 2024-01 → N = 연 − 2024 + 1).
     */
    const hint = card.getByText(/^투자 \d+년차$/);
    expect(Number(/\d+/.exec(hint.textContent ?? '')?.[0])).toBe(2030 - 2024 + 1);
    expect(card.getByText(copy.goal.status.reached(copy.goal.tiles.etaMonth(2030, 9), '₩600,000'))).toBeInTheDocument();

    expect(screen.queryByText(copy.goal.tiles.etaAlready)).toBeNull();
    expect(screen.queryByText(copy.goal.tiles.etaNotReached)).toBeNull();
  });

  it('실측과 시뮬이 한 화면에 있으면 기준 안내가 한 줄로 출처를 밝힌다', async () => {
    renderPortfolioPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());

    const notes = screen.getAllByText(copy.goal.basis.mixed);
    // 한 슬롯에 한 줄 — 기준 문구가 두 번 나오면 사용자는 두 가지 일이 있었다고 읽는다.
    expect(notes).toHaveLength(1);
    expect(screen.getByText(copy.footnote.goal)).toBeInTheDocument();
  });

  it('[목표 수정]은 시뮬레이터의 목표 입력으로 데려간다 (값은 여기서 저장하지 않는다)', async () => {
    const user = userEvent.setup();
    renderPortfolioPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: copy.goal.editTarget }));

    expect(lastLocation.pathname).toBe('/simulator');
    expect(lastLocation.state).toEqual(FOCUS_TARGET_MONTHLY_DIVIDEND_STATE);
    expect(ctaEvents()).toContainEqual([
      ANALYTICS_EVENT.CTA_CLICK,
      { cta_name: 'goal_set_target', placement: 'portfolio_page' }
    ]);
  });

  it('카드 노출은 값이 온 뒤 한 번만 계측한다 (리렌더로 중복 발화 금지)', async () => {
    const user = userEvent.setup();
    renderPortfolioPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());

    await waitFor(() => expect(goalViewEvents()).toHaveLength(1));
    expect(goalViewEvents()[0][1]).toMatchObject({
      has_target: true,
      reached_in_range: true,
      current_basis: 'measured'
    });

    // 페이지 상태를 바꿔 리렌더를 유발해도 다시 쏘지 않는다.
    await user.click(screen.getByRole('button', { name: /종목 추가 열기/ }));
    await screen.findByRole('searchbox', { name: copy.picker.searchLabel });

    expect(goalViewEvents()).toHaveLength(1);
  });

  it('달성률 버킷은 화면에 보이는 달성률을 따라간다 (미래 도달을 "reached"로 기록하지 않는다)', async () => {
    renderPortfolioPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());
    await waitFor(() => expect(goalViewEvents()).toHaveLength(1));

    const percent = Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
    expect(percent).toBeLessThan(25);
    expect(goalViewEvents()[0][1]).toMatchObject({ progress_bucket: '0-25', reached_in_range: true });
  });
});

describe('이미 달성 (F)', () => {
  beforeEach(async () => {
    await seedGoalStorages({
      payload: buildGoalPayload({ targetMonthlyDividend: 3_000_000 }),
      holdings: HUGE_HOLDING
    });
  });

  it('미터를 100%로 채우고 다음 행동으로 목표 올리기를 권한다 (남은 금액 타일은 없다)', async () => {
    renderPortfolioPage();
    await screen.findByText(copy.goal.tiles.etaAlready);

    const meter = screen.getByRole('progressbar', { name: copy.goal.meter.ariaLabel });
    expect(meter).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText(copy.goal.meter.value(100))).toBeInTheDocument();
    expect(screen.getByText(copy.goal.meter.sentenceReached('₩3,000,000'))).toBeInTheDocument();
    // 실측 기준이므로 "지금 보유한 종목" 문장이 맞다.
    expect(screen.getByText(copy.goal.status.already('₩3,000,000'))).toBeInTheDocument();
    expect(within(goalCard()).queryByText(copy.goal.tiles.remaining)).toBeNull();
    expect(screen.getByRole('button', { name: copy.goal.editTarget })).toBeInTheDocument();
  });

  it('GA 달성률 버킷은 reached 로 보낸다', async () => {
    renderPortfolioPage();
    await screen.findByText(copy.goal.tiles.etaAlready);

    await waitFor(() => expect(goalViewEvents()).toHaveLength(1));
    expect(goalViewEvents()[0][1]).toEqual({
      has_target: true,
      current_basis: 'measured',
      progress_bucket: 'reached',
      reached_in_range: true
    });
  });
});

describe('보유가 비었을 때 (P3·P4)', () => {
  it('보유 0 + 목표 없음이면 카드를 만들지 않는다 (첫 행동은 "종목 추가" 하나여야 한다)', async () => {
    await seedGoalStorages({ payload: buildGoalPayload({ targetMonthlyDividend: 0 }) });

    renderPortfolioPage();
    await screen.findByText(copy.empty.title);

    expect(queryGoalCard()).toBeNull();
    expect(screen.queryByText(copy.goal.setup.title)).toBeNull();
  });

  it('보유 0 + 목표 있음이면 빈 상태 아래에 카드가 남고, 폴백 사유와 [종목 추가]가 붙는다', async () => {
    const user = userEvent.setup();
    await seedGoalStorages({ payload: buildGoalPayload({ targetMonthlyDividend: 600_000 }) });

    renderPortfolioPage();
    await screen.findByText(copy.empty.title);
    await waitFor(() => expect(queryGoalCard()).not.toBeNull());

    expect(screen.getByText(copy.goal.basis.noHoldings)).toBeInTheDocument();
    const addButton = within(goalCard()).getByRole('button', { name: copy.goal.basis.noHoldingsAction });
    expect(addButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(addButton);

    expect(await screen.findByRole('searchbox', { name: copy.picker.searchLabel })).toBeVisible();
    expect(addButton).toHaveAttribute('aria-expanded', 'true');
    expect(ctaEvents()).toContainEqual([
      ANALYTICS_EVENT.CTA_CLICK,
      { cta_name: 'goal_add_holding', placement: 'portfolio_page' }
    ]);
  });

  it('보유 0 폴백에서도 시뮬 기준임을 밝힐 뿐 값을 감추지 않는다', async () => {
    await seedGoalStorages({ payload: buildGoalPayload({ targetMonthlyDividend: 600_000 }) });

    renderPortfolioPage();
    await waitFor(() => expect(queryGoalCard()).not.toBeNull());

    const card = within(goalCard());
    expect(card.getByText('₩600,000')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: copy.goal.meter.ariaLabel })).toBeInTheDocument();
  });
});

describe('수량 전부 미입력 (P11)', () => {
  it('폴백 사유를 말하되 액션 버튼은 달지 않는다 (할 일이 바로 아래 표 안에 있다)', async () => {
    await seedGoalStorages({
      payload: buildGoalPayload({ targetMonthlyDividend: 600_000 }),
      holdings: [{ ticker: 'SCHD', quantity: 0 }]
    });

    renderPortfolioPage();
    await waitFor(() => expect(queryGoalCard()).not.toBeNull());

    expect(screen.getByText(copy.goal.basis.noQuantity)).toBeInTheDocument();
    expect(within(goalCard()).queryByRole('button', { name: copy.goal.basis.noHoldingsAction })).toBeNull();
  });
});

describe('환율 상태 (P9·P10)', () => {
  it('환율 조회 중에는 골격만 — 시뮬 숫자를 먼저 보여 줬다 실측으로 바꾸지 않는다', async () => {
    await seedGoalStorages({
      payload: buildGoalPayload({ targetMonthlyDividend: 600_000 }),
      holdings: TINY_HOLDING
    });

    renderPortfolioPage({ fx: 'loading' });
    await waitFor(() => expect(queryGoalCard()).not.toBeNull());

    const card = goalCard();
    expect(card).toHaveAttribute('aria-busy', 'true');
    // 값 없는 progressbar 는 "0%"로 읽혀 거짓말이 된다 — 아예 부여하지 않는다.
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(within(card).getAllByText(copy.summary.tiles.empty).length).toBeGreaterThanOrEqual(3);
    expect(within(card).queryByText('₩600,000')).toBeNull();
    // 로딩 골격에서는 계측도 하지 않는다(has_target 이 항상 false 로 왜곡된다).
    expect(goalViewEvents()).toHaveLength(0);
  });

  it('환율 실패면 폴백 사유가 원화 기준임을 함께 말하고, 에러 카드는 만들지 않는다', async () => {
    await seedGoalStorages({
      payload: buildGoalPayload({ targetMonthlyDividend: 600_000 }),
      holdings: TINY_HOLDING
    });

    renderPortfolioPage({ fx: 'error' });
    await waitFor(() => expect(queryGoalCard()).not.toBeNull());

    expect(screen.getByText(copy.goal.basis.fxUnavailable)).toBeInTheDocument();
    // 요약은 달러, 목표는 원화 — 각 영역이 자기 기준을 라벨했으므로 모순이 아니다.
    expect(within(goalCard()).getByText('₩600,000')).toBeInTheDocument();
    expect(screen.getByText(copy.error.fxFailed)).toBeInTheDocument();
    await waitFor(() => expect(goalViewEvents()).toHaveLength(1));
    expect(goalViewEvents()[0][1]).toMatchObject({ current_basis: 'simulated' });
  });
});

describe('음수 목표 (AC6 불변식)', () => {
  it('목표가 음수인 저장본에서도 어떤 경로로도 "달성"이라 말하지 않는다', async () => {
    /*
     * 실제 저장 경로에서는 정규화가 음수를 0 으로 클램프한다(= 목표 미설정). 어느 쪽으로 접히든
     * **"달성"이라는 말이 나오지 않는다**가 이 불변식의 전부다 — 접히는 방식은 단정하지 않는다.
     */
    await seedGoalStorages({
      payload: buildGoalPayload({ targetMonthlyDividend: -500_000 }),
      holdings: TINY_HOLDING
    });

    renderPortfolioPage();
    await screen.findByRole('region', { name: copy.summary.title });

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(copy.goal.tiles.etaAlready)).toBeNull();
    expect(screen.queryByText(/도달했습니다\.$/)).toBeNull();
    expect(screen.queryByText(/닿습니다\.$/)).toBeNull();
    expect(screen.queryByText('-₩500,000')).toBeNull();
  });
});
