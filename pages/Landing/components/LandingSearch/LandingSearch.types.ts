/** 검색 인덱스 한 줄 — 화면이 필요로 하는 최소 3필드. 서사·FAQ 는 여기 오지 않는다. */
export type LandingTickerEntry = {
  /** 대문자 심볼. `font.dataNumeric` 6ch 고정폭 열에 선다(배당 캘린더 티커 열 관례). */
  symbol: string;
  /** `/ticker/:slug` 의 slug(소문자). */
  slug: string;
  /** 한글 종목명. 단일 출처는 `PRESET_TICKER_KOREAN_NAME_BY_TICKER` 다. */
  koreanName: string;
};
