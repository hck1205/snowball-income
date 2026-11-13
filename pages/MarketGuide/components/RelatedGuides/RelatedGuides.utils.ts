import { MARKET_FOMC_GUIDE_PATH, MARKET_HOLIDAY_GUIDE_YEARS, MARKET_WEEK_GUIDE_PATH, marketHolidayGuidePath } from '@/shared/constants/routes';
import { MARKET_GUIDE_COPY } from '../../copy';

const copy = MARKET_GUIDE_COPY.relatedLinks;
export const US_CALENDAR_PATH = '/market/us-calendar';

export type RelatedGuideIcon = 'week' | 'fomc' | 'holidays' | 'calendar';

export type RelatedGuide = {
  readonly to: string;
  readonly title: string;
  readonly description: string;
  readonly icon: RelatedGuideIcon;
};

/** 다른 안내 지면 — 이번 주 · FOMC · 연도별 휴장일 · 미국 증시 달력. 지금 보고 있는 지면은 뺀다. */
export const relatedGuidesFor = (currentPath: string): RelatedGuide[] =>
  [
    { to: MARKET_WEEK_GUIDE_PATH, ...copy.week, icon: 'week' as const },
    { to: MARKET_FOMC_GUIDE_PATH, ...copy.fomc, icon: 'fomc' as const },
    ...MARKET_HOLIDAY_GUIDE_YEARS.map((year) => ({ to: marketHolidayGuidePath(year), ...copy.holidays(year), icon: 'holidays' as const })),
    { to: US_CALENDAR_PATH, ...copy.calendar, icon: 'calendar' as const }
  ].filter((item) => item.to !== currentPath);
