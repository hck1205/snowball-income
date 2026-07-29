/**
 * 내 포트폴리오 화면들이 공유하는 **표시 포맷**. 계산·상태·DOM 을 모르는 최하층이라
 * 페이지(`PortfolioPage`)와 카드(`GoalCard`) 어느 쪽에서든 부를 수 있다.
 */

/**
 * `YYYY-MM-DD` → `2026년 7월 25일`. 형식이 다르면 원문을 그대로 보여 준다(거짓말보다 낫다).
 *
 * 요약의 **시세 기준일**과 목표 카드의 **투자 시작일**은 가정 요약에서 나란히 놓인다 — 각 화면이
 * 자기 포매터를 들고 있으면 표기 변경 요청이 왔을 때 한쪽만 고쳐져 같은 화면에 두 포맷이 남는다.
 */
export const formatPortfolioDate = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;

  return `${Number(match[1])}년 ${Number(match[2])}월 ${Number(match[3])}일`;
};
