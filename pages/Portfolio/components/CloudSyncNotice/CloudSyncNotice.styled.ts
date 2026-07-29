import styled from '@emotion/styled';
import { font, space } from '@/shared/styles';

/** 아이콘 · 문구 · 행동 버튼 한 줄. 좁은 폭에서는 버튼이 아래로 내려간다. */
export const NoticeRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${space[2]};
  flex-wrap: wrap;

  /* 아이콘은 첫 줄에 고정한다 — 문구가 여러 줄이 되면 가운데 정렬은 아이콘을 중간에 띄운다
     (이 레포에서 반복된 아이콘 정렬 결함과 같은 처방). */
  > svg {
    flex: 0 0 auto;
    margin-top: 1px;
  }
`;

/** 문구가 남는 폭을 다 쓰게 한다 — min-width:0 이 없으면 flex 자식이 내용보다 못 줄어든다. */
export const NoticeText = styled.p`
  flex: 1 1 240px;
  min-width: 0;
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
`;
