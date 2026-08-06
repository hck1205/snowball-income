import styled from '@emotion/styled';

/* -------------------------------------------------------------------------- */
/* 페이지 골격 · 라이브 리전                                                     */
/* -------------------------------------------------------------------------- */

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;
`;

/**
 * 라이브 리전은 **처음부터 끝까지 마운트 상태를 유지**한다. 시각적으로만 숨기고 텍스트만 바꾼다 —
 * `display:none`이나 조건부 언마운트는 접근성 트리에서 노드를 지워 이후 변경이 낭독되지 않는다.
 */
export const LiveRegion = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;
