export type MarketDataAsOfProps = {
  /**
   * 티커 스냅샷 기준일(`YYYY-MM-DD`). 기본값은 빌드에 박힌 `MARKET_DATA_AS_OF`.
   * `null`/빈 문자열이면 아무것도 렌더하지 않는다 — 큐레이션 프리셋만으로 도는 빌드에는 기준일이 없다.
   */
  asOf?: string | null;
};
