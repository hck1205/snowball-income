import type { CalendarTickerEntry } from './calendarSchedule';

/**
 * 공유 URL 의 선택 목록 파라미터: `?tickers=SCHD,JEPI,O`.
 *
 * 시뮬레이터 공유 링크와 달리 lz-string 압축을 쓰지 않는다 — 심볼 몇 개짜리 짧은 목록이라
 * 압축이 오히려 길어지고, 사람이 읽고 손으로 고칠 수 있는 편이 이 화면엔 이득이다.
 * 상태는 **쿼리스트링에만** 담는다(해시 `#` 로 상태를 나르지 않는다 — 확정 결정).
 */
export const CALENDAR_TICKERS_PARAM = 'tickers';

const normalizeSymbols = (symbols: readonly string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of symbols) {
    const symbol = raw.trim().toUpperCase();
    if (symbol.length === 0 || seen.has(symbol)) continue;
    seen.add(symbol);
    result.push(symbol);
  }

  return result;
};

/**
 * 쿼리스트링에서 선택 목록을 읽는다. `search` 는 `?a=b` / `a=b` 둘 다 받는다.
 *
 * 대문자 정규화 · 중복 제거 · 입력 순서 보존. **유니버스에 없는 심볼은 버린다** — 남겨두면
 * 캘린더에 아무 데도 놓을 수 없는 유령 선택이 되고, 잘못된 링크 하나가 화면을 깨뜨린다.
 */
export const parseCalendarTickersParam = (search: string, universe: CalendarTickerEntry[]): string[] => {
  const raw = new URLSearchParams(search).get(CALENDAR_TICKERS_PARAM);
  if (!raw) return [];

  const known = new Set(universe.map((entry) => entry.ticker));

  return normalizeSymbols(raw.split(',')).filter((symbol) => known.has(symbol));
};

/**
 * 파라미터 **값**만 만든다(`SCHD,JEPI,O`). 빈 선택은 빈 문자열 — 호출자가 파라미터를 지우면 된다.
 *
 * ⚠ 2026-07-30 이후 **캘린더 안에는 호출부가 없다**(선택 → 주소 동기화를 걷어냈다 —
 * `hooks/useCalendarSelection.ts` 주석). 그래도 남기는 이유는 "언젠가 쓸지도"가 아니라
 * 이 함수가 **파라미터 포맷의 정본**이기 때문이다: `pages/Portfolio/utils/portfolioShareUrl.ts`
 * 가 이 포맷을 미러링해 `/dividend/calendar?tickers=…` 링크를 실제로 만들고 있고(살아 있는 생산자),
 * 위 `parseCalendarTickersParam` 과의 왕복은 `test/dividendCalendar/calendarShareUrl.test.ts` 가
 * 잠근다. 즉 읽기 계약의 반대편 절반이지 죽은 코드가 아니다.
 */
export const serializeCalendarTickersParam = (tickers: string[]): string => normalizeSymbols(tickers).join(',');
