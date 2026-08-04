import type {
  CongressMemberRow,
  CongressRecentTrade,
  CongressTickerRow,
  CongressTradesSnapshot
} from '@/shared/constants/congressTrades';

/**
 * 화면이 그릴 수 있는 형태로 접는 **순수 계산**. 네트워크도 `new Date()` 도 없다.
 *
 * 🔴 이 파일이 지키는 규율 하나: **금액은 끝까지 구간이다.** 어디서도 (min+max)/2 를 만들지 않는다.
 * 신고 제도가 구간으로만 알려 주기로 한 값을 화면 편의로 점 하나에 접으면, 그 숫자는 어떤 공시에도
 * 없는 값이 된다. 그래서 포맷터도 "A ~ B" 또는 "A 이상" 두 형태만 낸다.
 */

/** 표에 몇 줄까지 보일지. 더 보고 싶은 사람은 원문 공시로 간다(링크가 있다). */
export const TICKER_ROWS = 20;
export const MEMBER_ROWS = 15;
export const RECENT_ROWS = 30;

export type CongressViewModel = {
  readonly snapshot: CongressTradesSnapshot;
  readonly tickers: readonly CongressTickerRow[];
  readonly members: readonly CongressMemberRow[];
  readonly recent: readonly CongressRecentTrade[];
};

export const buildCongressViewModel = (snapshot: CongressTradesSnapshot): CongressViewModel => ({
  snapshot,
  tickers: snapshot.topTickers.slice(0, TICKER_ROWS),
  members: snapshot.topMembers.slice(0, MEMBER_ROWS),
  recent: snapshot.recent.slice(0, RECENT_ROWS)
});

/**
 * 달러 금액을 한국어 자릿수로 줄인다(만·억 단위가 아니라 **달러 그대로**의 천·백만 단위).
 *
 * ⚠ 원화로 환산하지 않는다. 환율은 매일 바뀌고 신고 시점의 환율도 알 수 없어서, 환산하는 순간
 *   "언제 환율로 계산한 값인가"라는 답할 수 없는 질문이 생긴다.
 */
export const formatUsdCompact = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M달러`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K달러`;
  return `${value}달러`;
};

/**
 * 구간 합의 표시. 상한이 없으면 "이상"이다.
 *
 * 🔴 `maxUsd === null` 은 최상단 구간(5,000만 달러 초과)이 섞였다는 뜻이지 0이 아니다.
 * 여기서 0으로 읽으면 가장 큰 거래가 가장 작아 보인다 — 정반대의 거짓이다.
 */
export const formatUsdRange = (minUsd: number, maxUsd: number | null): string => {
  if (maxUsd === null) return `${formatUsdCompact(minUsd)} 이상`;
  if (minUsd === maxUsd) return formatUsdCompact(minUsd);
  return `${formatUsdCompact(minUsd)} ~ ${formatUsdCompact(maxUsd)}`;
};

/** `MI09` → `미시간 9구`처럼 풀지 않는다 — 주 약칭 50개를 한글로 옮기는 표는 이 화면의 몫이 아니다. */
export const formatDistrict = (stateDistrict: string): string => {
  const match = /^([A-Z]{2})(\d{2})$/.exec(stateDistrict);
  if (!match) return stateDistrict;
  /* `00` 은 주 전체가 한 선거구인 경우다(알래스카 등) — "0구"라고 쓰면 틀린 말이 된다. */
  return match[2] === '00' ? `${match[1]} 전역` : `${match[1]} ${Number(match[2])}구`;
};

/** `2026-07-24` → `7월 24일`. 연도는 표 위 "집계 구간"이 이미 말한다. */
export const formatTradeDate = (date: string): string => {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  return `${Number(match[1])}월 ${Number(match[2])}일`;
};
