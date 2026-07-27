import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TARGET_MONTHLY_DIVIDEND_MAX,
  TARGET_MONTHLY_DIVIDEND_QUICK_VALUES,
  buildFocusTargetMonthlyDividendState,
  formatTargetMonthlyDividendChipLabel
} from '@/shared/constants';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import {
  buildGoalPayload,
  lastLocation,
  renderPortfolioPage,
  resetGoalStorages,
  seedGoalStorages
} from './portfolioGoalHarness';

/**
 * 목표 미설정 상태의 **값 선택 → 커밋 계약**.
 *
 * ⚠ 이 화면은 목표를 **저장하지 않는다**. 고른 값이 라우터 `location.state` 에 실려 시뮬레이터로
 * 넘어가는 것까지가 계약이고, 실제 커밋(`setField`)은 하이드레이션 게이트 하위에서 한 번 일어난다
 * (수신 쪽 계약은 `test/main/targetFocusRequest.test.tsx`). 여기서 저장하면 자동저장·클라우드 동기화가
 * 마운트돼 있지 않아 값이 조용히 사라진다.
 */

const copy = PORTFOLIO_COPY;

beforeEach(async () => {
  await resetGoalStorages();
  await seedGoalStorages({
    payload: buildGoalPayload({ targetMonthlyDividend: 0 }),
    holdings: [{ ticker: 'SCHD', quantity: 10 }]
  });
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('목표 카드 — 목표 미설정 상태의 값 선택', () => {
  it('칩은 v2 확정값 네 개(50/100/200/300만원)를 그대로 실어 보낸다', async () => {
    const user = userEvent.setup();
    renderPortfolioPage();
    await screen.findByText(copy.goal.setup.title);

    const chips = screen.getByRole('group', { name: copy.goal.setup.chipsLabel });
    for (const value of TARGET_MONTHLY_DIVIDEND_QUICK_VALUES) {
      expect(within(chips).getByRole('button', { name: formatTargetMonthlyDividendChipLabel(value) })).toBeInTheDocument();
    }
    expect(within(chips).getAllByRole('button')).toHaveLength(4);

    await user.click(within(chips).getByRole('button', { name: formatTargetMonthlyDividendChipLabel(2_000_000) }));

    expect(lastLocation.pathname).toBe('/');
    expect(lastLocation.state).toEqual(buildFocusTargetMonthlyDividendState(2_000_000));
  });

  it('누르기 **전에** 화면이 바뀐다는 사실을 말한다', async () => {
    renderPortfolioPage();
    await screen.findByText(copy.goal.setup.title);

    expect(screen.getByText(copy.goal.setup.pickLead)).toBeInTheDocument();
  });

  it('직접 입력은 만원 단위를 원 단위로 바꿔 실어 보낸다', async () => {
    const user = userEvent.setup();
    renderPortfolioPage();
    await screen.findByText(copy.goal.setup.title);

    await user.type(screen.getByRole('textbox', { name: copy.goal.setup.inputLabel }), '150');
    await user.click(screen.getByRole('button', { name: copy.goal.setup.submit }));

    expect(lastLocation.pathname).toBe('/');
    expect(lastLocation.state).toEqual(buildFocusTargetMonthlyDividendState(1_500_000));
  });

  it('빈 값·상한 초과는 이동하지 않고 이유를 말한다 (무음 실패 금지)', async () => {
    const user = userEvent.setup();
    const invalidMessage = copy.goal.setup.inputInvalid(TARGET_MONTHLY_DIVIDEND_MAX / 10_000);

    renderPortfolioPage();
    await screen.findByText(copy.goal.setup.title);

    await user.click(screen.getByRole('button', { name: copy.goal.setup.submit }));
    expect(await screen.findByText(invalidMessage)).toBeInTheDocument();
    expect(lastLocation.pathname).toBe('/dividend/portfolio');

    await user.type(screen.getByRole('textbox', { name: copy.goal.setup.inputLabel }), '99999999');
    await user.click(screen.getByRole('button', { name: copy.goal.setup.submit }));

    expect(screen.getByText(invalidMessage)).toBeInTheDocument();
    expect(lastLocation.pathname).toBe('/dividend/portfolio');
  });
});
