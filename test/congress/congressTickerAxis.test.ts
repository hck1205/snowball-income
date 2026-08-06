import { describe, expect, it } from 'vitest';
import { CONGRESS_TRADES } from '@/shared/constants/congressTrades';
import { sortTickersBy } from '@/pages/Congress/utils';
import type { CongressTickerRow } from '@/shared/constants/congressTrades';

/**
 * 종목 표의 두 축(거래 건수 ↔ 신고 금액) 계약.
 *
 * 🔴 두 축을 붙인 이유는 **서로 다른 종목을 위로 올리기 때문**이다. 거래가 잦은 종목과 돈이 큰
 * 종목이 같다면 이 컨트롤은 있을 이유가 없다 — 아래 마지막 테스트가 실제 스냅샷으로 그 사실을
 * 잠근다(같아지면 이 기능의 전제가 무너진 것이니 알아야 한다).
 */
const row = (ticker: string, over: Partial<CongressTickerRow> = {}): CongressTickerRow => ({
  ticker,
  name: `${ticker} Inc`,
  buys: 1,
  sells: 1,
  memberCount: 1,
  minUsd: 1_000,
  maxUsd: 15_000,
  ...over
});

describe('종목 축 정렬', () => {
  it('건수 축은 매수+매도 합이 큰 순이다', () => {
    const rows = [row('A', { buys: 1, sells: 1 }), row('B', { buys: 10, sells: 2 }), row('C', { buys: 3, sells: 3 })];
    expect(sortTickersBy(rows, 'count').map((r) => r.ticker)).toEqual(['B', 'C', 'A']);
  });

  it('금액 축은 하한이 큰 순이다', () => {
    /* 🔴 상한이 아니라 하한으로 센다 — 상한은 최상단 구간이 섞이면 null 이라 축이 될 수 없다. */
    const rows = [row('A', { minUsd: 1_000 }), row('B', { minUsd: 500_000 }), row('C', { minUsd: 50_000 })];
    expect(sortTickersBy(rows, 'amount').map((r) => r.ticker)).toEqual(['B', 'C', 'A']);
  });

  it('상한이 없는 줄(최상단 구간)도 금액 축에서 사라지지 않는다', () => {
    const rows = [row('A', { minUsd: 1_000 }), row('OPEN', { minUsd: 50_000_000, maxUsd: null })];
    expect(sortTickersBy(rows, 'amount')[0].ticker).toBe('OPEN');
  });

  it('원본 배열을 뒤집지 않는다', () => {
    /* 스냅샷은 모듈 상수다 — 제자리 정렬하면 축을 한 번 바꾼 뒤 다른 화면의 순서까지 바뀐다. */
    const rows = [row('A', { buys: 1, sells: 1 }), row('B', { buys: 9, sells: 9 })];
    sortTickersBy(rows, 'count');
    expect(rows[0].ticker).toBe('A');
  });

  it('limit 만큼만 낸다', () => {
    const rows = ['A', 'B', 'C', 'D'].map((t) => row(t));
    expect(sortTickersBy(rows, 'count', 2)).toHaveLength(2);
  });

  it('🔴 실제 스냅샷에서 두 축의 1위가 같지 않다 — 이 컨트롤의 존재 이유', () => {
    const byCount = sortTickersBy(CONGRESS_TRADES.topTickers, 'count', 10);
    const byAmount = sortTickersBy(CONGRESS_TRADES.topTickers, 'amount', 10);
    expect(byCount.map((r) => r.ticker)).not.toEqual(byAmount.map((r) => r.ticker));
  });

  it('🔴 금액 상위에 거래가 적은 종목이 들어온다 — 건수 상위만 저장하면 놓치는 줄', () => {
    /*
     * 수집기가 두 축의 상위를 **합집합**으로 남기기 때문에 가능한 검사다
     * (tools/congressTrades/harvest.py). 건수 상위 N 만 저장하던 시절에는 이 줄이 아예 없었다.
     */
    const byAmount = sortTickersBy(CONGRESS_TRADES.topTickers, 'amount', 20);
    const median = [...CONGRESS_TRADES.topTickers]
      .map((r) => r.buys + r.sells)
      .sort((a, b) => a - b)[Math.floor(CONGRESS_TRADES.topTickers.length / 2)];
    expect(byAmount.some((r) => r.buys + r.sells < median)).toBe(true);
  });
});
