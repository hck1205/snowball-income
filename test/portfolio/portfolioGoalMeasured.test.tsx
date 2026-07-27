import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import {
  buildGoalPayload,
  renderPortfolioPage,
  resetGoalStorages,
  seedGoalStorages
} from './portfolioGoalHarness';

/**
 * **실측 경로 통합** — 요약 카드(USD 입력 포맷터)와 목표 카드(원화 입력 포맷터)가 한 화면에 공존한다.
 *
 * 🔴 이 파일의 존재 이유는 회귀 앵커 하나다: **요약 hero 의 금액 문자열 === 미터 병기 문장 안의 금액**.
 * 목표 도메인에 요약용 USD 포맷터가 잘못 배선되면 조용히 환율배(~1,381배) 틀린 숫자가 나오고 화면
 * 어디에도 오류 표시가 없다 — 두 문자열을 직접 맞대는 이 단정이 유일한 검출기다.
 *
 * 금액 **숫자**는 단정하지 않는다(시세 스냅샷은 월간 크론이 갱신한다) — 두 표면의 일치와 반응성만 본다.
 */

const copy = PORTFOLIO_COPY;

/** 어떤 목표에도 못 미치는 보유(달성률 분기를 결정적으로 만든다). */
const HOLDINGS = [{ ticker: 'SCHD', quantity: 40 }];

const goalCard = () => screen.getByRole('region', { name: copy.goal.title });

/** 요약 hero(`월 배당(세후)`)가 실제로 그린 금액 문자열. */
const heroAmountText = () => {
  const summary = screen.getByRole('region', { name: copy.summary.title });
  const label = within(summary).getByText(copy.summary.tiles.monthlyNet);
  const tile = label.closest('div');
  if (tile === null) throw new Error('hero 타일을 찾지 못했다');

  const amount = within(tile).getByText(/[₩$]/);
  return amount.textContent ?? '';
};

/** 미터 병기 문장 — 현재값이 숫자로 나오는 **유일한** 자리다. */
const meterSentence = () => within(goalCard()).getByText(/까지 왔습니다\.$/).textContent ?? '';

beforeEach(async () => {
  await resetGoalStorages();
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('실측 달성률 — 포맷터 2종 공존 (회귀 앵커)', () => {
  beforeEach(async () => {
    await seedGoalStorages({
      payload: buildGoalPayload({ targetMonthlyDividend: 3_000_000 }),
      holdings: HOLDINGS
    });
  });

  it('보유·환율·목표가 모두 있으면 미터와 타일 셋이 전부 값을 가진다 (빈 자리 금지)', async () => {
    renderPortfolioPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());

    const card = within(goalCard());
    expect(card.getByText(copy.goal.tiles.target)).toBeInTheDocument();
    expect(card.getByText('₩3,000,000')).toBeInTheDocument();
    expect(card.getByText(copy.goal.tiles.remaining)).toBeInTheDocument();
    expect(card.getByText(copy.goal.tiles.remainingHint)).toBeInTheDocument();
    expect(card.getByText(copy.goal.tiles.eta)).toBeInTheDocument();
    // 값 자리를 '—' 로 남겨 두지 않는다(로딩이 아니라 계산이 끝난 상태다).
    expect(card.queryByText(copy.summary.tiles.empty)).toBeNull();
    expect(card.getByRole('progressbar', { name: copy.goal.meter.ariaLabel })).toBeInTheDocument();
  });

  it('요약 hero 의 금액 문자열과 미터 문장 안의 현재값이 정확히 같다', async () => {
    renderPortfolioPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());

    const hero = heroAmountText();
    expect(hero).toMatch(/^₩/);
    expect(meterSentence()).toBe(copy.goal.meter.sentence('₩3,000,000', hero));
  });

  it('보유 수량을 고치면 달성률과 남은 금액이 즉시 따라 움직인다 (저장 디바운스와 무관)', async () => {
    const user = userEvent.setup();
    renderPortfolioPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());

    const before = meterSentence();
    const input = screen.getByRole('textbox', { name: copy.holdings.quantityAria('SCHD') });

    await user.clear(input);
    await user.type(input, '400');

    await waitFor(() => expect(meterSentence()).not.toBe(before));
    // 요약과 목표가 같은 사건에 함께 움직인다(두 표면이 어긋나면 사용자는 어느 쪽을 믿을지 모른다).
    expect(meterSentence()).toBe(copy.goal.meter.sentence('₩3,000,000', heroAmountText()));
  });

  it('환율 실패로 폴백하면 현재값이 요약 hero(달러)와 더는 같지 않다 — 대신 기준을 문장으로 말한다', async () => {
    renderPortfolioPage({ fx: 'error' });
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());

    expect(heroAmountText()).toMatch(/^\$/);
    expect(meterSentence()).not.toContain('$');
    expect(screen.getByText(copy.goal.basis.fxUnavailable)).toBeInTheDocument();
  });
});

describe('실측 달성률 — E′ 저장된 조건이 지금 보유와 많이 다를 때', () => {
  it('시뮬 도달월이 오늘 이전이면 과거 날짜가 화면에 절대 나오지 않는다', async () => {
    /*
     * 초기 투자금 5억 + 목표 60만원이면 저장된 조건상 첫 해에 이미 목표를 넘긴다(2024년) —
     * 그런데 실제 보유는 그에 한참 못 미친다. "2024년 3월에 달성 예정"이라고 말하면 거짓이다.
     */
    await seedGoalStorages({
      payload: buildGoalPayload({ initialInvestment: 500_000_000, targetMonthlyDividend: 600_000 }),
      holdings: [{ ticker: 'SCHD', quantity: 1 }]
    });

    renderPortfolioPage();
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());

    const card = within(goalCard());
    expect(card.getByText(copy.goal.tiles.etaPast)).toBeInTheDocument();
    expect(card.getByText(copy.goal.tiles.etaPastHint)).toBeInTheDocument();
    expect(card.getByText(copy.goal.status.etaPast)).toBeInTheDocument();
    expect(card.getByRole('button', { name: copy.goal.status.etaPastCta })).toBeInTheDocument();
    // 과거 날짜가 어떤 형태로도 나오지 않는다.
    expect(card.queryByText(/^\d{4}년 \d{1,2}월$/)).toBeNull();
    expect(card.queryByText(/^투자 \d+년차$/)).toBeNull();
  });
});
