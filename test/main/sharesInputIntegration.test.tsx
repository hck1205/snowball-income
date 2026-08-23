import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDefaultStore } from 'jotai/vanilla';
import { describe, expect, it, beforeEach } from 'vitest';
import PortfolioComposition from '@/components/PortfolioComposition';
import { ALLOCATION_COPY } from '@/shared/constants';
import type { TickerProfile } from '@/shared/types/snowball';
import {
  fixedByTickerIdAtom,
  includedTickerIdsAtom,
  tickerProfilesAtom,
  weightByTickerIdAtom,
  yieldFormAtom,
  fxViewAtom,
  useAdjustableTickerCountAtomValue,
  useAllocationPercentByTickerIdAtomValue,
  useFixedByTickerIdAtomValue,
  useIncludedProfilesAtomValue,
  useNormalizedAllocationAtomValue,
  useYieldFormAtomValue
} from '@/jotai';
import { useTickerActions } from '@/pages/Main/hooks/business';
import { buildAllocationHoldings } from '@/pages/Main/utils';
import { defaultYieldFormValues } from '@/shared/lib/snowball';
import { formatApproxKRW, formatKRW } from '@/shared/utils';

/**
 * 주식 수 입력 **통합** 회귀 — 순수 함수가 아니라 **실제 atom·훅·컴포넌트**를 함께 돌린다.
 *
 * 배분 산술은 `test/main/allocationShares.test.ts` 가 이미 본다. 여기서 보는 것은 그 산술이
 * **화면까지 실제로 도달하는가**다: 타건 → setTickerShares → weight/초기투자금 atom →
 * 파생 배분 → 그 행의 월 배당 문구. 한 칸이라도 끊기면 사용자에게는 "안 바뀐다"로 보인다.
 */

const FX_RATE = 1383.9;
const store = getDefaultStore();

const SCHD: TickerProfile = {
  id: 'schd', ticker: 'SCHD', name: '', initialPrice: 31.61,
  dividendYield: 3.34, dividendGrowth: 6.66, expectedTotalReturn: 10, frequency: 'quarterly'
};
const QQQ: TickerProfile = {
  id: 'qqq', ticker: 'QQQ', name: '', initialPrice: 430,
  dividendYield: 0.6, dividendGrowth: 10.4, expectedTotalReturn: 11, frequency: 'quarterly'
};

const StubChart = () => null;

function Harness() {
  const includedProfiles = useIncludedProfilesAtomValue();
  const normalizedAllocation = useNormalizedAllocationAtomValue();
  const allocationPercentByTickerId = useAllocationPercentByTickerIdAtomValue();
  const fixedByTickerId = useFixedByTickerIdAtomValue();
  const adjustableTickerCount = useAdjustableTickerCountAtomValue();
  const values = useYieldFormAtomValue();
  const { setTickerShares, setTickerWeight, toggleTickerFixed, clearAllFixed, removeIncludedTicker } = useTickerActions();

  const holdings = buildAllocationHoldings({
    normalizedAllocation,
    initialInvestment: values.initialInvestment,
    taxRate: values.taxRate,
    fxRate: FX_RATE
  });

  return createElement(PortfolioComposition, {
    includedProfiles,
    normalizedAllocation,
    allocationPieOption: {},
    allocationPercentByTickerId,
    fixedByTickerId,
    adjustableTickerCount,
    onSetTickerWeight: setTickerWeight,
    onSetTickerShares: setTickerShares,
    holdings,
    formatAmount: (value: number) => `[${Math.round(value)}]`,
    fxRate: FX_RATE,
    onToggleTickerFixed: toggleTickerFixed,
    onClearAllFixed: clearAllFixed,
    onRemoveIncludedTicker: removeIncludedTicker,
    ResponsiveChart: StubChart
  });
}

const sharesInput = (ticker: string) =>
  screen.getByRole('textbox', { name: ALLOCATION_COPY.sharesInputAria(ticker) });

/**
 * 그 종목 행의 월 배당 텍스트(`[숫자]` 로 포맷했으므로 숫자만 뽑는다).
 * ⚠ 낭독 전용 라벨이 같은 요소 안에 있어 `textContent` 는 "월 배당월 [517672]" 다 — 앞을 고정하지 않는다.
 */
const rowMonthlyDividend = (ticker: string): number => {
  const row = sharesInput(ticker).closest('li');
  const texts = Array.from(row?.querySelectorAll('span') ?? []).map((node) => node.textContent ?? '');
  const match = texts.map((text) => /월 \[(\d+)\]/.exec(text)).find(Boolean);
  return match ? Number(match[1]) : Number.NaN;
};

beforeEach(() => {
  store.set(tickerProfilesAtom, [SCHD, QQQ]);
  store.set(includedTickerIdsAtom, ['schd', 'qqq']);
  store.set(weightByTickerIdAtom, { schd: 50, qqq: 50 });
  store.set(fixedByTickerIdAtom, { schd: false, qqq: false });
  store.set(yieldFormAtom, { ...defaultYieldFormValues, initialInvestment: 0 });
  store.set(fxViewAtom, {
    status: 'success',
    rate: { rate: FX_RATE, base: 'USD', quote: 'KRW', asOf: '2026-08-23T00:00:00.000Z' }
  });
});

describe('주식 수 입력 → 그 행의 월 배당 (통합)', () => {
  it('SCHD 에 5000 을 치면 그 행의 월 배당이 따라 올라간다', async () => {
    const user = userEvent.setup();
    render(createElement(Harness));

    expect(rowMonthlyDividend('SCHD')).toBe(0);

    await user.clear(sharesInput('SCHD'));
    await user.type(sharesInput('SCHD'), '5000');

    // 5000 × 31.61 × 1383.9 = 218,720,239원 → × 3.34% ÷ 12 × (1−0.15) ≈ 517,672원
    expect(rowMonthlyDividend('SCHD')).toBeGreaterThan(500_000);
    expect(rowMonthlyDividend('SCHD')).toBeLessThan(540_000);
  });

  it('한 글자마다 값이 실제로 움직인다 (마지막 타건만 반영되는 게 아니다)', async () => {
    const user = userEvent.setup();
    render(createElement(Harness));
    await user.clear(sharesInput('SCHD'));

    const seen: number[] = [];
    for (const digit of ['5', '0', '0', '0']) {
      await user.type(sharesInput('SCHD'), digit);
      seen.push(rowMonthlyDividend('SCHD'));
    }

    expect(seen[0]).toBeGreaterThan(0);
    expect(seen[1]).toBeGreaterThan(seen[0]);
    expect(seen[2]).toBeGreaterThan(seen[1]);
    expect(seen[3]).toBeGreaterThan(seen[2]);
  });

  it('QQQ 를 나중에 채워도 SCHD 행은 그대로 있는다', async () => {
    const user = userEvent.setup();
    render(createElement(Harness));

    await user.clear(sharesInput('SCHD'));
    await user.type(sharesInput('SCHD'), '5000');
    const schdBefore = rowMonthlyDividend('SCHD');

    await user.clear(sharesInput('QQQ'));
    await user.type(sharesInput('QQQ'), '5000');

    expect(rowMonthlyDividend('SCHD')).toBeCloseTo(schdBefore, -1);
    expect(rowMonthlyDividend('QQQ')).toBeGreaterThan(1_000_000);
  });
});

/**
 * 🔴 회귀 방지 — 보유 줄의 금액은 **간략 표기를 쓰면 안 된다**(2026-08-23 사용자 신고).
 *
 * `formatApproxKRW` 는 억 구간을 0.1억(=1,000만원) 단위로 반올림한다. 차트 라벨에는 맞지만 입력
 * 옆에서는 100주를 고쳐도 숫자가 그대로 서서 입력이 고장 난 것처럼 보인다.
 */
describe('보유 줄 금액 — 작은 변화도 보여야 한다', () => {
  it('간략 표기(약 N억)는 100주 변화를 삼킨다 — 이 자리에 쓰면 안 되는 이유', () => {
    const at5000 = 5000 * 31.61 * FX_RATE;
    const at5100 = 5100 * 31.61 * FX_RATE;

    expect(formatApproxKRW(at5000)).toBe(formatApproxKRW(at5100));
    // 정밀 표기는 갈린다 — 그래서 이 자리에는 정밀 포맷터를 쓴다.
    expect(formatKRW(Math.round(at5000))).not.toBe(formatKRW(Math.round(at5100)));
  });

  it('정밀 포맷터를 물리면 100주 차이가 화면에 드러난다', async () => {
    const user = userEvent.setup();
    render(createElement(Harness));

    await user.clear(sharesInput('SCHD'));
    await user.type(sharesInput('SCHD'), '5000');
    const at5000 = rowMonthlyDividend('SCHD');

    await user.clear(sharesInput('SCHD'));
    await user.type(sharesInput('SCHD'), '5100');
    const at5100 = rowMonthlyDividend('SCHD');

    expect(at5100).toBeGreaterThan(at5000);
  });
});

/**
 * 🔴 편입 집합이 바뀌어도 **이미 입력한 주식 수는 안 움직인다** (2026-08-23 사용자 결정).
 *
 * 종전에는 총액을 예산처럼 고정하고 남은 종목에 재분배해서, QQQ 를 빼면 SCHD 가 5,000주 →
 * 73,016주가 됐다(14.6배). 담을 때도 새 종목이 ≈1%를 가져가 기존 주수가 1% 줄었다.
 */
describe('종목을 빼고 더해도 주식 수는 그대로', () => {
  const removeChip = (ticker: string) => screen.getByRole('button', { name: `티커 ${ticker} 삭제` });

  const seedShares = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.clear(sharesInput('SCHD'));
    await user.type(sharesInput('SCHD'), '5000');
    await user.clear(sharesInput('QQQ'));
    await user.type(sharesInput('QQQ'), '5000');
  };

  it('QQQ 를 빼도 SCHD 는 5,000주 그대로다 (초기 투자금이 그만큼 줄어든다)', async () => {
    const user = userEvent.setup();
    render(createElement(Harness));
    await seedShares(user);

    const schdBefore = rowMonthlyDividend('SCHD');
    const totalBefore = store.get(yieldFormAtom).initialInvestment;

    await user.click(removeChip('QQQ'));

    expect(sharesInput('SCHD')).toHaveValue('5000');
    expect(rowMonthlyDividend('SCHD')).toBe(schdBefore);
    // 빠진 금액만큼만 줄어든다 — QQQ 5,000주 값이 사라진다.
    expect(store.get(yieldFormAtom).initialInvestment).toBeLessThan(totalBefore);
    expect(store.get(yieldFormAtom).initialInvestment).toBeGreaterThan(0);
  });

  it('마지막 한 종목까지 빼면 초기 투자금은 0 이 된다', async () => {
    const user = userEvent.setup();
    render(createElement(Harness));
    await seedShares(user);

    await user.click(removeChip('QQQ'));
    await user.click(removeChip('SCHD'));

    expect(store.get(yieldFormAtom).initialInvestment).toBe(0);
  });
});
