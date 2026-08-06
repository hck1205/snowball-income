import type {
  KoreaAssemblyStocksSnapshot,
  KoreaIssuerRow,
  KoreaMemberRow
} from '@/shared/constants/koreaAssemblyStocks';

/**
 * 화면이 그릴 수 있는 형태로 접는 **순수 계산**. 네트워크도 `new Date()` 도 없다.
 *
 * 🔴 이 파일이 지키는 규율 하나: **주식 수를 금액으로 바꾸지 않는다.** 공보는 종목별 금액을
 * 주지 않고 우리에게 기준일 주가도 없다. "몇 주"를 "얼마"로 옮기는 순간 어떤 공시에도 없는
 * 숫자가 된다 — 미국 화면이 구간을 가운뎃값으로 접지 않는 것과 같은 규율이다.
 */

/** 표에 몇 줄까지 보일지. 더 보고 싶은 사람은 원문 공보로 간다(링크가 있다). */
export const ISSUER_ROWS = 25;
export const MEMBER_ROWS = 20;

export type KoreaAssemblyViewModel = {
  readonly snapshot: KoreaAssemblyStocksSnapshot;
  readonly issuers: readonly KoreaIssuerRow[];
  readonly members: readonly KoreaMemberRow[];
  /** 공보에 실렸지만 의원이 아니라 뺀 사람 수. 숨기지 않고 화면이 밝힌다. */
  readonly excludedStaff: number;
};

export const buildKoreaAssemblyViewModel = (
  snapshot: KoreaAssemblyStocksSnapshot
): KoreaAssemblyViewModel => ({
  snapshot,
  issuers: snapshot.topIssuers.slice(0, ISSUER_ROWS),
  members: snapshot.topMembers.slice(0, MEMBER_ROWS),
  excludedStaff: Math.max(0, snapshot.coverage.peopleTotal - snapshot.coverage.membersTotal)
});

/**
 * `2025-12-31` → `2025년 12월 31일`.
 *
 * ⚠ 기준일은 이 화면에서 가장 중요한 숫자다(자료가 얼마나 낡았는지를 말한다). 그래서
 *   `12/31` 같은 축약이 아니라 연도까지 다 쓴다 — 연도가 빠지면 "올해 것"으로 읽힌다.
 */
export const formatKoreanDate = (date: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  return `${match[1]}년 ${Number(match[2])}월 ${Number(match[3])}일`;
};

/**
 * 신고한 의원 이름 몇 개를 "가, 나, 다 외 N명"으로.
 *
 * 🔴 `members` 는 **표본**이지 전부가 아니다(수집기가 6명까지만 남긴다). 그래서 남은 수를
 * 셀 때 `memberCount` 를 쓴다 — 배열 길이로 세면 "외 0명"이 되어 표본이 전부인 것처럼 보인다.
 */
export const formatMemberSample = (members: readonly string[], memberCount: number): string => {
  if (members.length === 0) return '—';
  const rest = memberCount - members.length;
  const shown = members.join(', ');
  return rest > 0 ? `${shown} 외 ${rest}명` : shown;
};
