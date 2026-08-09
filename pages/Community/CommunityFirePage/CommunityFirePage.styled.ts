import styled from '@emotion/styled';

/**
 * 무한스크롤 관찰 지점 — 목록 **끝보다 먼저** 걸리도록 관찰자가 rootMargin 을 준다(뷰가 소유).
 * 높이 1px 인 이유: 0 이면 일부 브라우저가 교차 판정을 하지 않는다.
 */
export const Sentinel = styled.div`
  height: 1px;
`;
