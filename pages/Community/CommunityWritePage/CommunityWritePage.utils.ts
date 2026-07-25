import { COMMUNITY_COPY } from '@/shared/constants/community';
import { formatKRW } from '@/shared/utils/format';

const w = COMMUNITY_COPY.write;

/** 프리뷰와 첨부 카드가 **같은 포맷**을 써야 "이게 그거구나"가 성립한다(§B3). */
export const attachSummary = (tickerCount: number, initial: number, monthly: number) =>
  `${w.attachTickerCount(tickerCount)} · 초기 ${formatKRW(initial)} · 월 ${formatKRW(monthly)}`;
