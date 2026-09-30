import styled from '@emotion/styled';
import {
  media,
  space
} from '@/shared/styles';

/* 화면 골격 — 세로 리듬과 고르기 ↔ 결과 두 단. */

export const Stack = styled.div`
  display: grid;
  gap: clamp(20px, 3.2vw, 34px);
  min-width: 0;
`;

/**
 * 고르기(왼쪽) ↔ 바구니·결론(오른쪽). 좁은 폭에서는 위아래로 쌓이고 **고르기(검색)가 먼저** 온다
 * (2026-09-30 사용자 지시 — 처음에는 결과가 먼저였는데, 모바일에서 검색창이 스크롤 한참 아래에 있어
 * 담기부터 막혔다). 목록은 자기 안에서 스크롤되므로 결과까지 내려가는 거리가 목록 길이만큼 늘지 않는다.
 */
export const Workbench = styled.div`
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;

  ${media.up('layout')} {
    grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
    align-items: start;
  }
`;

export const PickerColumn = styled.div`
  min-width: 0;

  ${media.up('layout')} {
    position: sticky;
    top: ${space[4]};
  }
`;

export const ResultColumn = styled.div`
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;
`;
