// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  filterCalendarUniverse,
  getCalendarUniverse,
  getMonthEvents,
  type CalendarTickerEntry
} from '@/pages/DividendCalendar/utils';
import { MARKET_DATA } from '@/shared/constants/marketData';
import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

const entry = (ticker: string, months: number[] | null, name = `${ticker} 이름`): CalendarTickerEntry =>
  months === null
    ? { ticker, name, hasSchedule: false }
    : { ticker, name, hasSchedule: true, payoutMonths: months, source: 'pay' };

describe('getCalendarUniverse', () => {
  it('프리셋 유니버스의 모든 종목을 티커 알파벳순으로 돌려준다', () => {
    const entries = getCalendarUniverse();

    expect(entries).toHaveLength(Object.keys(DIVIDEND_UNIVERSE).length);
    expect(entries.map((item) => item.ticker)).toEqual([...entries.map((item) => item.ticker)].sort());
  });

  it('지급월 데이터가 있는 종목만 hasSchedule 이다 — 없는 종목을 빼거나 지어내지 않는다', () => {
    for (const item of getCalendarUniverse()) {
      const observed = MARKET_DATA.entries[item.ticker]?.payoutMonths ?? [];
      expect(item.hasSchedule).toBe(observed.length > 0);
      if (!item.hasSchedule) {
        expect(item.payoutMonths).toBeUndefined();
        expect(item.source).toBeUndefined();
      }
    }
  });

  /*
   * ⚠ 특정 티커를 "데이터 없는 예시"로 박아두지 마라. 예전에는 QQQ 를 그 예로 썼는데,
   * 2026-07-29 시세 갱신으로 QQQ 에 데이터가 생기면서 이 테스트가 깨졌다(기능 회귀가 아니라
   * 테스트가 옛 사실을 붙들고 있던 것). 지켜야 할 계약은 **"일정을 못 구해도 목록에서 빠지지
   * 않는다"** 는 성질이지, 어느 티커가 그에 해당하느냐가 아니다.
   *
   * ANET 만 이름으로 남긴다 — 배당을 지급하지 않는 종목이라 데이터 갱신으로 바뀌지 않는다.
   * (언젠가 배당을 시작하면 이 줄이 깨지는데, 그건 알아야 할 변화가 맞다.)
   */
  it('일정을 못 구한 종목도 목록에 남되 hasSchedule=false 다', () => {
    const items = getCalendarUniverse();
    const byTicker = new Map(items.map((item) => [item.ticker, item]));

    // 무배당 종목은 지급 일정이 있을 수 없다.
    expect(byTicker.get('ANET')?.hasSchedule).toBe(false);

    // 일정이 없는 종목은 **전부** 목록에 남고, 일정 관련 필드만 비어 있다.
    for (const item of items.filter((candidate) => !candidate.hasSchedule)) {
      expect(item.payoutMonths).toBeUndefined();
      expect(item.source).toBeUndefined();
    }
  });

  it('실측 지급월을 그대로 싣는다 (SCHD 분기, O 매월)', () => {
    const byTicker = new Map(getCalendarUniverse().map((item) => [item.ticker, item]));

    expect(byTicker.get('SCHD')?.payoutMonths).toEqual([3, 6, 9, 12]);
    expect(byTicker.get('O')?.payoutMonths).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('지급월 근거(source)는 실측이면 pay, 그 외에는 추정(ex)이다', () => {
    for (const item of getCalendarUniverse()) {
      if (!item.hasSchedule) continue;
      const expected = MARKET_DATA.entries[item.ticker]?.payoutMonthsSource === 'pay' ? 'pay' : 'ex';
      expect(item.source).toBe(expected);
    }
  });

  it('한글명을 이름으로 쓴다', () => {
    const byTicker = new Map(getCalendarUniverse().map((item) => [item.ticker, item]));

    expect(byTicker.get('O')?.name).toBe('리얼티 인컴');
    expect(byTicker.get('SCHD')?.name).toBe('슈왑 미국 배당주 ETF');
  });

  it('같은 배열 참조를 재사용한다 (렌더마다 새 배열이면 memo 가 무의미해진다)', () => {
    expect(getCalendarUniverse()).toBe(getCalendarUniverse());
  });
});

describe('filterCalendarUniverse', () => {
  const entries = getCalendarUniverse();

  it('빈 질의는 전체를 돌려준다', () => {
    expect(filterCalendarUniverse(entries, '')).toEqual(entries);
    expect(filterCalendarUniverse(entries, '   ')).toEqual(entries);
  });

  it('티커를 대소문자 무시하고 부분일치시킨다', () => {
    expect(filterCalendarUniverse(entries, 'schd').map((item) => item.ticker)).toEqual(['SCHD']);
    expect(filterCalendarUniverse(entries, 'jep').map((item) => item.ticker)).toEqual(['JEPI', 'JEPQ']);
  });

  it('한글명으로도 찾는다', () => {
    expect(filterCalendarUniverse(entries, '리얼티').map((item) => item.ticker)).toEqual(['O']);
  });

  it('영문명 부분일치도 지원한다', () => {
    const result = filterCalendarUniverse(
      [entry('AAA', [1], 'Vanguard Growth ETF'), entry('BBB', [2], '코카콜라')],
      'vanguard'
    );

    expect(result.map((item) => item.ticker)).toEqual(['AAA']);
  });

  it('일치가 없으면 빈 배열', () => {
    expect(filterCalendarUniverse(entries, 'zzzzz')).toEqual([]);
  });
});

describe('getMonthEvents', () => {
  const entries = [entry('AAA', [1, 7]), entry('BBB', [12]), entry('CCC', null), entry('DDD', [1])];

  it('1월(하단 경계)에 지급하는 선택 종목만 티커순으로 돌려준다', () => {
    expect(getMonthEvents(entries, ['DDD', 'AAA', 'BBB'], 1)).toEqual([
      { ticker: 'AAA', name: 'AAA 이름', source: 'pay' },
      { ticker: 'DDD', name: 'DDD 이름', source: 'pay' }
    ]);
  });

  it('12월(상단 경계)도 동일하게 동작한다', () => {
    expect(getMonthEvents(entries, ['AAA', 'BBB'], 12).map((event) => event.ticker)).toEqual(['BBB']);
  });

  it('선택이 없으면 빈 배열', () => {
    expect(getMonthEvents(entries, [], 1)).toEqual([]);
  });

  it('선택했더라도 지급월 데이터가 없는 종목은 어느 달에도 놓지 않는다', () => {
    for (let month = 1; month <= 12; month += 1) {
      expect(getMonthEvents(entries, ['CCC'], month)).toEqual([]);
    }
  });

  it('선택 목록의 소문자·공백·중복을 흡수한다', () => {
    expect(getMonthEvents(entries, [' aaa ', 'AAA', 'aAa'], 7).map((event) => event.ticker)).toEqual(['AAA']);
  });

  it('1-12 밖의 달은 빈 배열 (조용히 이상한 달에 놓지 않는다)', () => {
    expect(getMonthEvents(entries, ['AAA'], 0)).toEqual([]);
    expect(getMonthEvents(entries, ['AAA'], 13)).toEqual([]);
    expect(getMonthEvents(entries, ['AAA'], 1.5)).toEqual([]);
  });

  it('실제 유니버스에서도 동작한다 — SCHD 는 3월에 있고 1월에는 없다', () => {
    const universe = getCalendarUniverse();

    expect(getMonthEvents(universe, ['SCHD', 'O'], 3).map((event) => event.ticker)).toEqual(['O', 'SCHD']);
    expect(getMonthEvents(universe, ['SCHD', 'O'], 1).map((event) => event.ticker)).toEqual(['O']);
  });
});
