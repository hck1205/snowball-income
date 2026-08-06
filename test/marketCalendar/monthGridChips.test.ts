import { describe, expect, it } from 'vitest';
import { MAX_DAY_CHIPS, chipsOf, splitDayChips } from '@/pages/MarketCalendar/components/MonthGrid/MonthGrid.utils';
import type { MarketDayCell } from '@/pages/MarketCalendar/utils';

/**
 * 달력 칸이 **점이 아니라 글자로** 일정을 말하는지 잠근다(2026-08-05 변경).
 *
 * 이전에는 점 세 개가 전부라, 무슨 일정인지 알려면 마우스를 올려야 했다 — 터치 기기에서는
 * 그마저도 안 됐다. 이제 칸 안에 이름이 들어가고, 다 못 담은 것은 `+N` 이 밝힌다.
 */

const cell = (events: Partial<MarketDayCell['events']>): MarketDayCell =>
  ({
    date: '2026-08-14',
    day: 14,
    inMonth: true,
    isToday: false,
    trading: null,
    events: { fomc: null, economic: [], earnings: [], ...events }
  }) as MarketDayCell;

const economic = (nameKo: string) =>
  ({ date: '2026-08-14', timeEt: '08:30', nameKo, nameEn: nameKo, major: true }) as never;

const earnings = (ticker: string, hasTickerPage = false) =>
  ({ date: '2026-08-14', ticker, nameEn: ticker, session: 'beforeOpen', hasTickerPage }) as never;

describe('달력 칸의 일정 칩', () => {
  it('일정이 없으면 칩도 없다', () => {
    expect(chipsOf(cell({}))).toEqual([]);
  });

  it('중요도 순으로 세운다 — FOMC → 경제지표 → 실적', () => {
    const chips = chipsOf(
      cell({
        fomc: { date: '2026-08-14', labelKo: 'FOMC' } as never,
        economic: [economic('소비자물가지수(CPI)')],
        earnings: [earnings('AMD')]
      })
    );
    expect(chips.map((chip) => chip.kind)).toEqual(['fomc', 'economic', 'earnings']);
    expect(chips.map((chip) => chip.label)).toEqual(['FOMC', '소비자물가지수(CPI)', 'AMD']);
  });

  it('우리 앱에 소개 페이지가 있는 종목을 앞에 세운다', () => {
    /* `+N` 으로 접히는 자리라, 사용자가 아는 이름이 먼저 보여야 접힌 나머지가 덜 아쉽다. */
    const chips = chipsOf(cell({ earnings: [earnings('ZZZ'), earnings('SCHD', true)] }));
    expect(chips.map((chip) => chip.label)).toEqual(['SCHD', 'ZZZ']);
  });

  it('원본 배열을 뒤집지 않는다', () => {
    /* 스냅샷은 모듈 상수다 — 한 번 제자리 정렬하면 전 화면의 순서가 함께 바뀐다. */
    const source = [earnings('ZZZ'), earnings('SCHD', true)];
    chipsOf(cell({ earnings: source }));
    expect((source[0] as { ticker: string }).ticker).toBe('ZZZ');
  });

  it('넘치는 일정은 개수로 밝힌다 — 조용히 버리지 않는다', () => {
    const chips = chipsOf(
      cell({ earnings: ['A', 'B', 'C', 'D', 'E'].map((ticker) => earnings(ticker)) })
    );
    const { visible, hiddenCount } = splitDayChips(chips);
    expect(visible).toHaveLength(MAX_DAY_CHIPS);
    expect(hiddenCount).toBe(5 - MAX_DAY_CHIPS);
  });

  it('접힌 것이 없으면 개수를 말하지 않는다', () => {
    const { hiddenCount } = splitDayChips(chipsOf(cell({ earnings: [earnings('AMD')] })));
    expect(hiddenCount).toBe(0);
  });
});
