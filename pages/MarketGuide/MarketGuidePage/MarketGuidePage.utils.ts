import { MARKET_FOMC_GUIDE_PATH, MARKET_WEEK_GUIDE_PATH, marketHolidayGuidePath } from '@/shared/constants/routes';
import { MARKET_GUIDE_COPY } from '../copy';
import type { MarketGuideKind } from './MarketGuidePage.types';

const copy = MARKET_GUIDE_COPY;

/** 지면 종류(+ 휴장일이면 연도) → 그 지면의 경로. 연도가 목록 밖(null)이면 첫 연도로 돌려보내기 전이다. */
export const guidePath = (guide: MarketGuideKind, year: number | null): string =>
  guide === 'holidays' && year ? marketHolidayGuidePath(year) : guide === 'fomc' ? MARKET_FOMC_GUIDE_PATH : MARKET_WEEK_GUIDE_PATH;

/** 지면의 제목 · 설명. 목록 밖 연도는 빈 제목 — 곧 돌려보내므로 메타를 건드리지 않는다. */
export const guideMeta = (guide: MarketGuideKind, year: number | null): { readonly title: string; readonly description: string } => {
  if (guide === 'holidays') return year ? { title: copy.holidays.title(year), description: copy.holidays.description(year) } : { title: '', description: '' };
  if (guide === 'fomc') return { title: copy.fomc.title, description: copy.fomc.description };
  return { title: copy.week.title, description: copy.week.description };
};
