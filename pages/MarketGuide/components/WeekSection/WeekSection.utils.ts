import type { WeekGuideRow } from '@/shared/lib/marketGuide';
import type { BadgeTone } from '../GuideList';

/** 일정 종류 → 배지 색. 휴장 · 조기 폐장은 경고, FOMC 는 브랜드, 지표 · 실적은 보조. */
export const WEEK_KIND_TONE: Record<WeekGuideRow['kind'], BadgeTone> = {
  휴장: 'warn',
  '조기 폐장': 'warn',
  FOMC: 'brand',
  지표: 'alt',
  실적: 'muted'
};

export type WeekDayGroup = {
  readonly date: string;
  readonly dateLabel: string;
  readonly items: readonly WeekGuideRow[];
};

/** 이번 주 일정을 날짜별로 묶는다 — 입력 순서(날짜순 · 같은 날은 시각순)를 그대로 지킨다. */
export const groupWeekRowsByDate = (rows: readonly WeekGuideRow[]): WeekDayGroup[] => {
  const groups = new Map<string, WeekGuideRow[]>();
  for (const row of rows) {
    const items = groups.get(row.date);
    if (items) items.push(row);
    else groups.set(row.date, [row]);
  }
  return [...groups.entries()].map(([date, items]) => ({ date, dateLabel: items[0]!.dateLabel, items }));
};
