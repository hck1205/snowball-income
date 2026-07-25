import { describe, expect, it } from 'vitest';
import { buildPayoutScheduleRows } from '@/components/MonthlyCashflow/MonthlyCashflow.utils';
import type { MarketDataSnapshot } from '@/shared/constants/marketData';

/**
 * 지급 일정 스트립의 원칙: **관측된 것만 보여준다.**
 * frequency 로 아무 달이나 지어내지 않고, 출처(실측/추정)를 사용자에게 그대로 전달한다.
 */
const snapshot = (entries: MarketDataSnapshot['entries']): MarketDataSnapshot => ({
  asOf: '2026-07-25',
  source: 'test',
  entries
});

const base = { initialPrice: 100, dividendYield: 3, frequency: 'quarterly' as const };

describe('buildPayoutScheduleRows', () => {
  it('실측(pay) 종목은 지급월·간격·출처를 그대로 싣는다', () => {
    const rows = buildPayoutScheduleRows(
      [{ ticker: 'SCHD', displayName: 'SCHD' }],
      snapshot({ SCHD: { ...base, payoutMonths: [3, 6, 9, 12], payoutMonthsSource: 'pay', exToPayLagDays: 5 } })
    );

    expect(rows).toEqual([
      { ticker: 'SCHD', displayName: 'SCHD', months: [3, 6, 9, 12], source: 'pay', exToPayLagDays: 5 }
    ]);
  });

  it('추정(ex) 종목은 source=ex 로 표시하고 간격은 싣지 않는다 (ex 소스는 지급일을 모른다)', () => {
    const rows = buildPayoutScheduleRows(
      [{ ticker: 'VYM', displayName: 'VYM' }],
      snapshot({ VYM: { ...base, payoutMonths: [3, 6, 9, 12], payoutMonthsSource: 'ex' } })
    );

    expect(rows[0].source).toBe('ex');
    expect(rows[0].exToPayLagDays).toBeNull();
  });

  it('지급월 데이터가 없는 종목은 뺀다 — frequency 로 지어내지 않는다', () => {
    const rows = buildPayoutScheduleRows(
      [
        { ticker: 'CUSTOM', displayName: '직접 만든 티커' },
        { ticker: 'SCHD', displayName: 'SCHD' }
      ],
      snapshot({ SCHD: { ...base, payoutMonths: [3, 6, 9, 12], payoutMonthsSource: 'pay' } })
    );

    expect(rows.map((row) => row.ticker)).toEqual(['SCHD']);
  });

  it('payoutMonthsSource 가 없는 옛 스냅샷 항목은 추정으로 취급한다 (하위 호환)', () => {
    const rows = buildPayoutScheduleRows(
      [{ ticker: 'DVY', displayName: 'DVY' }],
      snapshot({ DVY: { ...base, payoutMonths: [3, 6, 9, 12] } })
    );

    expect(rows[0].source).toBe('ex');
  });

  it('포함 종목 순서를 유지한다 (차트 시리즈와 같은 순서로 스캔되게)', () => {
    const entries = snapshot({
      A: { ...base, payoutMonths: [1], payoutMonthsSource: 'pay' },
      B: { ...base, payoutMonths: [2], payoutMonthsSource: 'pay' }
    });
    const rows = buildPayoutScheduleRows(
      [
        { ticker: 'B', displayName: 'B' },
        { ticker: 'A', displayName: 'A' }
      ],
      entries
    );

    expect(rows.map((row) => row.ticker)).toEqual(['B', 'A']);
  });
});
