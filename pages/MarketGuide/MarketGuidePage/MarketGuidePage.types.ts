/** 어느 안내 지면인가 — 연도별 휴장일 · FOMC 일정 · 이번 주 일정. */
export type MarketGuideKind = 'holidays' | 'fomc' | 'week';

export type MarketGuidePageProps = {
  readonly guide: MarketGuideKind;
};
