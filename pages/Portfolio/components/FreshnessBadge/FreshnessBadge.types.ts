/**
 * 시세 출처가 **기본값에서 벗어날 때만** 다는 배지.
 *
 * - `stale-price`: 월간 시세 스냅샷 밖의 유니버스 종목(큐레이션 값이라 낡았을 수 있다).
 * - `manual`: 사용자가 주가·배당률을 직접 넣은 종목.
 *
 * 스냅샷(기본값)은 정상 상태라 아무것도 그리지 않는다 — 기본에 배지를 달면 소음이다(캘린더 선례).
 */
export type PortfolioFreshnessTone = 'stale-price' | 'manual';

export type FreshnessBadgeProps = {
  /** `null` 이면 렌더하지 않는다. */
  tone: PortfolioFreshnessTone | null;
};
