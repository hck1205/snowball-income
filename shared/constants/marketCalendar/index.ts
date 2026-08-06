import generated from './marketCalendar.generated.json';
import type { MarketCalendarSnapshot } from './marketCalendar.types';

export * from './marketCalendar.curated';
export * from './marketCalendar.sessions';
export * from './marketCalendar.types';

/**
 * 미국 증시 캘린더 — **두 겹**을 한 문에서 내보낸다.
 *
 * ```
 *   사람이 소유(curated)   휴장일 · 조기폐장 · FOMC   연 1회 갱신, 1~3년 앞을 본다
 *   스크립트가 소유(generated) 경제지표 · 실적 발표     주 1회 갱신, 몇 주 앞까지만 안다
 * ```
 *
 * 🔴 이 비대칭이 이 화면의 핵심이다. 생성물의 `rangeEnd` 뒤는 **"일정 없음"이 아니라 "아직
 * 알려지지 않음"** 이다 — 기업이 발표일을 3~4주 전에야 알리기 때문이다. 화면이 그 둘을 같은
 * 빈칸으로 그리면, 사용자는 "9월엔 실적이 없구나"라는 거짓을 읽는다.
 */
export const MARKET_CALENDAR = generated as MarketCalendarSnapshot;
