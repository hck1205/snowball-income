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
 * 고르기(왼쪽) ↔ 바구니·결론(오른쪽). 좁은 폭에서는 위아래로 쌓인다 —
 * 그때는 바구니·결론이 **먼저** 온다: 담은 결과가 먼저 보여야 "담을 때마다 바뀐다"가 읽힌다.
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
  order: 2;
  min-width: 0;

  ${media.up('layout')} {
    order: 1;
    position: sticky;
    top: ${space[4]};
  }
`;

export const ResultColumn = styled.div`
  order: 1;
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;

  ${media.up('layout')} {
    order: 2;
  }
`;
