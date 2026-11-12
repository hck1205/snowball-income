import { describe, expect, it } from 'vitest';
import { buildTickerPaySchedule, withPayDateTitle } from '@/shared/lib/tickerPayDates';
import type { MarketDataSnapshotEntry } from '@/shared/constants/marketData';

/**
 * 종목 배당 일정(2026-11-12). 잠그는 것: 날짜를 지어내지 않는다(근거 등급 pay/ex), 배당락은 지급일−간격,
 * 다음 지급은 오늘 기준, 제목에 "배당일"은 일정이 있을 때만.
 */
const entry = (patch: Partial<MarketDataSnapshotEntry>) => ({ price: 10, dividendYield: 3, ...patch }) as MarketDataSnapshotEntry;

describe('buildTickerPaySchedule', () => {
  it('🔴 pay 근거: 예상 지급일과 배당락(지급일 − 간격, 달을 넘기면 앞 달)', () => {
    const schedule = buildTickerPaySchedule(
      'TEST',
      new Date(2026, 10, 12),
      { TEST: entry({ payoutMonths: [1, 4, 7, 10], payoutMonthsSource: 'pay', exToPayLagDays: 5, estimatedPayDayByMonth: { '1': 3, '4': 20, '7': 20, '10': 20 } }) },
      '2026-11-08'
    )!;
    expect(schedule.source).toBe('pay');
    expect(schedule.cadenceLabel).toBe('분기 (1·4·7·10월)');
    expect(schedule.rows[0]).toMatchObject({ payLabel: '1월 3일쯤', exLabel: '12월 29일쯤' });
    expect(schedule.rows[1]).toMatchObject({ payLabel: '4월 20일쯤', exLabel: '4월 15일쯤' });
    expect(schedule.next).toEqual({ year: 2027, label: '1월 3일쯤' });
  });

  it('🔴 ex 근거: 월만 말하고 날짜·배당락을 만들지 않는다', () => {
    const schedule = buildTickerPaySchedule('E', new Date(2026, 10, 12), { E: entry({ payoutMonths: [3, 6, 9, 12], payoutMonthsSource: 'ex' }) }, null)!;
    expect(schedule.rows.every((row) => row.payDay === null && row.exLabel === null)).toBe(true);
    expect(schedule.next).toEqual({ year: 2026, label: '12월' });
  });

  it('지급 월이 없거나 배당 없음으로 확인된 종목은 null', () => {
    expect(buildTickerPaySchedule('N', new Date(), { N: entry({ payoutMonthsSource: 'none' }) }, null)).toBeNull();
    expect(buildTickerPaySchedule('X', new Date(), {}, null)).toBeNull();
  });

  it('제목에 "배당일"은 일정이 있을 때만, 이미 있으면 그대로', () => {
    expect(withPayDateTitle('SCHD 배당률 총정리', 'SCHD', true)).toBe('SCHD 배당일·배당률 총정리');
    expect(withPayDateTitle('SCHD 배당률 총정리', 'SCHD', false)).toBe('SCHD 배당률 총정리');
    expect(withPayDateTitle('SCHD 배당일 정리', 'SCHD', true)).toBe('SCHD 배당일 정리');
  });
});
