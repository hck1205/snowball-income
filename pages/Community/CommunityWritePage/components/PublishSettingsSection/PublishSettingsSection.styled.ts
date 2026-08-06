import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/** 공개 범위 토글 줄. 좁은 인스펙터 칼럼이라 토글만 놓고 안내 문구는 아래 줄로 내렸다. */
export const VisibilityRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

/** 현재 상태 안내 — 토글이 무엇을 뜻하는지 평문으로 한 번 더 말한다(위치·색만으로 두지 않는다). */
export const VisibilityText = styled.p`
  margin: 0;
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;
