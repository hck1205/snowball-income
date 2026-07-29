/**
 * 배당 캘린더 딥링크(`/dividend/calendar?tickers=SCHD,JEPI,O`) 조립.
 *
 * ⚠ 포맷 출처 = `pages/DividendCalendar/utils/calendarShareUrl.ts`(`CALENDAR_TICKERS_PARAM`·
 * `serializeCalendarTickersParam`). 그 모듈을 직접 import 하지 않고 **여기서 미러링**하는 이유는
 * 페이지 간 결합 금지 규칙 때문이다(캘린더 청크를 이 페이지 청크로 끌어오지 않는다).
 * 두 구현이 갈리면 링크가 조용히 깨지므로, 규칙은 셋뿐이고 그대로 옮겼다:
 * **대문자 정규화 · 중복 제거 · 입력 순서 보존**(구분자는 콤마).
 *
 * 받는 쪽(`parseCalendarTickersParam`)이 유니버스 밖 심볼을 버리므로, 보내는 쪽에서도 캘린더가 아는
 * 종목만 실어야 "달력에 없는 종목"이 조용히 사라지지 않는다 — 그 필터는 호출부가 한다
 * (`isSimulationKnownTicker`, 캘린더와 같은 `DIVIDEND_UNIVERSE` 판정).
 */

/** 캘린더가 읽는 쿼리 파라미터 이름. */
export const PORTFOLIO_CALENDAR_TICKERS_PARAM = 'tickers';

/** 캘린더 딥링크의 경로(쿼리 제외). */
export const PORTFOLIO_CALENDAR_PATH = '/dividend/calendar';

const normalizeSymbols = (symbols: readonly string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of symbols) {
    const symbol = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
    if (symbol.length === 0 || seen.has(symbol)) continue;
    seen.add(symbol);
    result.push(symbol);
  }

  return result;
};

/** 파라미터 **값**만 만든다(`SCHD,JEPI,O`). 빈 선택은 빈 문자열. */
export const serializePortfolioCalendarTickers = (tickers: readonly string[]): string =>
  normalizeSymbols(tickers).join(',');

/**
 * 캘린더로 이동할 경로. 실을 종목이 없으면 파라미터를 **붙이지 않는다**
 * (`?tickers=` 빈 값은 "0종 선택"이 아니라 잡음이다).
 */
export const buildPortfolioCalendarPath = (tickers: readonly string[]): string => {
  const value = serializePortfolioCalendarTickers(tickers);

  return value.length === 0
    ? PORTFOLIO_CALENDAR_PATH
    : `${PORTFOLIO_CALENDAR_PATH}?${PORTFOLIO_CALENDAR_TICKERS_PARAM}=${value}`;
};
