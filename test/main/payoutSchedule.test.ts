// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
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

import { buildCalendarMonths } from '@/components/MonthlyCashflow/MonthlyCashflow.utils';
import type { PayoutScheduleRow } from '@/components/MonthlyCashflow/MonthlyCashflow.utils';

/**
 * 캘린더 뷰의 계약: **연간 합 보존**. 어느 뷰(차트/캘린더)로 보든 1년 총액은 같아야 한다 —
 * 달라지는 건 월 배치뿐이다. 이게 깨지면 "캘린더가 돈을 만들어내는" 버그다.
 */
describe('buildCalendarMonths — 관측 지급월 재배분', () => {
  const schd: PayoutScheduleRow = {
    ticker: 'SCHD',
    displayName: 'SCHD',
    months: [3, 6, 9, 12],
    source: 'pay',
    exToPayLagDays: 5
  };
  // 엔진 분배: 시작월 기준이라 실제 지급월과 다르다 (2·5·8·11월에 놓였다고 하자)
  const engineData = [0, 120, 0, 0, 120, 0, 0, 120, 0, 0, 120, 0];

  it('연간 합을 관측 지급월에 균등 분배한다 — 총액 보존', () => {
    const months = buildCalendarMonths([{ name: 'SCHD', data: engineData }], [schd]);

    const total = months.reduce((sum, cell) => sum + cell.total, 0);
    expect(total).toBeCloseTo(480, 6);
    expect(months[2].total).toBeCloseTo(120, 6); // 3월
    expect(months[1].total).toBe(0); // 엔진이 놓았던 2월은 비워진다
    expect(months[2].items[0].source).toBe('pay');
  });

  it('관측 데이터 없는 종목은 엔진 분배를 그대로 둔다 (빼지도 지어내지도 않는다)', () => {
    const months = buildCalendarMonths([{ name: '직접티커', data: engineData }], []);

    expect(months[1].total).toBeCloseTo(120, 6); // 엔진이 놓은 2월 그대로
    expect(months[1].items[0].source).toBe('sim');
  });

  it('셀 안 종목은 금액 내림차순', () => {
    const months = buildCalendarMonths(
      [
        { name: 'A', data: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'B', data: [90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ],
      []
    );
    expect(months[0].items.map((item) => item.name)).toEqual(['B', 'A']);
  });

  it('배당이 0인 종목은 어느 달에도 나타나지 않는다', () => {
    const months = buildCalendarMonths([{ name: 'ANET', data: Array(12).fill(0) }], []);
    expect(months.every((cell) => cell.items.length === 0)).toBe(true);
  });
});
