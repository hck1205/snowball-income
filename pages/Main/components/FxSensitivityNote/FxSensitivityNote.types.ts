export type FxSensitivityNoteProps = {
  /** 계산에 포함된 종목 티커들. 국내 상장만 있으면 안내를 내지 않는다. */
  tickers: readonly string[];
  /** 현재 환율(1 USD = N KRW). 조회 전·실패면 null — 그래도 민감도 문장은 낸다. */
  fxRate: number | null;
};
