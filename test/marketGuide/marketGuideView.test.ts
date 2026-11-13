import { describe, expect, it } from 'vitest';
import {
  buildFomcRowViews,
  buildHolidayRowViews,
  dateParts,
  groupWeekRowsByDate,
  relatedGuidesFor,
  US_CALENDAR_PATH
} from '@/pages/MarketGuide/components';
import { MARKET_FOMC_GUIDE_PATH, MARKET_HOLIDAY_GUIDE_YEARS, MARKET_WEEK_GUIDE_PATH, marketHolidayGuidePath } from '@/shared/constants/routes';
import type { FomcGuideRow, HolidayGuideRow, WeekGuideRow } from '@/shared/lib/marketGuide';

/**
 * 미국 증시 안내 지면 화면 모델(2026-11-13 — 섹션 컴포넌트에서 순수 함수로 뺐다). 잠그는 것:
 * ① 날짜 블록의 요일 ② "다음 · 지남" 표시가 오늘 기준으로 한 줄에만 붙는다 ③ 이번 주 묶음 순서
 * ④ 관련 지면 링크에서 지금 지면만 빠진다.
 */
describe('날짜 블록', () => {
  it('2026-11-26 → 11월 · 26 · 목', () => {
    expect(dateParts('2026-11-26')).toEqual({ month: '11월', day: '26', weekday: '목' });
  });
});

describe('휴장일 줄', () => {
  const rows: HolidayGuideRow[] = [
    { date: '2026-07-03', dateLabel: '7월 3일 (금)', name: '독립기념일(대체)', kind: 'holiday', note: '종일 휴장' },
    { date: '2026-11-26', dateLabel: '11월 26일 (목)', name: '추수감사절', kind: 'holiday', note: '종일 휴장' },
    {
      date: '2026-11-27',
      dateLabel: '11월 27일 (금)',
      name: '추수감사절 다음 날',
      kind: 'earlyClose',
      note: '미국 13:00 조기 마감 (한국시간 다음 날 03:00)'
    }
  ];

  it('오늘 이후 첫 날이 "다음", 오늘 전은 "지남"', () => {
    const views = buildHolidayRowViews(rows, '2026-11-13');
    expect(views.map((view) => view.state)).toEqual(['past', 'next', 'normal']);
  });

  it('오늘이 휴장일이면 오늘이 "다음"이다', () => {
    expect(buildHolidayRowViews(rows, '2026-11-26')[1]!.state).toBe('next');
  });

  it('조기 폐장은 마감 시각을 날짜 옆에 줄여 붙인다', () => {
    const views = buildHolidayRowViews(rows, '2026-11-13');
    expect(views[1]!.sub).toBe('11월 26일 (목)');
    expect(views[2]!.sub).toBe('11월 27일 (금) · 13:00 마감 (한국시간 다음 날 03:00)');
  });
});

describe('FOMC 줄', () => {
  const rows: FomcGuideRow[] = [
    { decisionDate: '2026-10-28', meetingLabel: '10월 27~28일 (화~수)', kstLabel: '10월 29일 03:00', withProjections: false, past: true },
    { decisionDate: '2026-12-09', meetingLabel: '12월 8~9일 (화~수)', kstLabel: '12월 10일 04:00', withProjections: true, past: false },
    { decisionDate: '2027-01-27', meetingLabel: '1월 26~27일 (화~수)', kstLabel: '1월 28일 04:00', withProjections: false, past: false }
  ];

  it('지나지 않은 첫 회의만 "다음"', () => {
    expect(buildFomcRowViews(rows).map((view) => view.state)).toEqual(['past', 'next', 'normal']);
  });

  it('점도표 회의는 제목이 말하고, 회의 날짜에서 괄호 속 요일은 뺀다', () => {
    const view = buildFomcRowViews(rows)[1]!;
    expect(view.title).toBe('FOMC 금리 결정 · 점도표');
    expect(view.meeting).toBe('회의 12월 8~9일');
  });
});

describe('이번 주 묶음', () => {
  const row = (date: string, label: string): WeekGuideRow => ({
    date,
    dateLabel: `${date} 라벨`,
    kind: '지표',
    label,
    kstLabel: '22:30',
    major: false
  });

  it('날짜별로 묶되 입력 순서를 지킨다', () => {
    const days = groupWeekRowsByDate([row('2026-11-16', 'a'), row('2026-11-16', 'b'), row('2026-11-17', 'c')]);
    expect(days.map((day) => [day.date, day.dateLabel, day.items.map((item) => item.label)])).toEqual([
      ['2026-11-16', '2026-11-16 라벨', ['a', 'b']],
      ['2026-11-17', '2026-11-17 라벨', ['c']]
    ]);
    expect(groupWeekRowsByDate([])).toEqual([]);
  });
});

describe('관련 지면', () => {
  const all = [MARKET_WEEK_GUIDE_PATH, MARKET_FOMC_GUIDE_PATH, ...MARKET_HOLIDAY_GUIDE_YEARS.map(marketHolidayGuidePath), US_CALENDAR_PATH];

  it('지금 지면만 빠지고 나머지는 그 순서대로', () => {
    expect(relatedGuidesFor(MARKET_FOMC_GUIDE_PATH).map((item) => item.to)).toEqual(all.filter((to) => to !== MARKET_FOMC_GUIDE_PATH));
  });

  it('카드마다 제목 · 설명이 있다', () => {
    for (const item of relatedGuidesFor(MARKET_WEEK_GUIDE_PATH)) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });
});
