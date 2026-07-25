import styled from '@emotion/styled';

/**
 * 우측 결과 컬럼 레이아웃. `pages/Main/Main.shared.styled.ts`에서 옮겨왔다
 * (소비처가 이 패널뿐 — 스타일 값 동일, 마크업/동작 변화 없음).
 * 섹션별 스타일은 각 하위 컴포넌트의 `components/<Name>/<Name>.styled.ts`에 있다.
 */
export const ResultsColumn = styled.section`
  display: grid;
  gap: clamp(12px, 1.8vw, 20px);
  min-width: 0;
  contain: layout style;

  > * {
    min-width: 0;
  }
`;
