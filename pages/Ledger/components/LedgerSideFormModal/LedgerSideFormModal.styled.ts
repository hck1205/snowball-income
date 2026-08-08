import styled from '@emotion/styled';
import { color, font, inputSurface, media, space } from '@/shared/styles';

/**
 * 자산·투자 입력 폼.
 *
 * 🔴 면은 공용 `inputSurface` 를 쓴다 — 가계부 폼과 나란히 놓이는 컨트롤이라 높이·테두리·
 *    포커스링이 갈리면 눈에 바로 보인다(그 조각을 shared 로 올린 이유).
 */

export const SideFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[3]};
  min-width: 0;
  /* 같은 줄의 두 칸이 큰 쪽 높이로 늘어나 입력칸이 세로로 어긋나지 않게(가계부 폼과 같은 처방). */
  align-items: start;

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SideField = styled.div<{ $full?: boolean }>`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
  align-content: start;
  ${(props) => (props.$full ? 'grid-column: 1 / -1;' : '')}
`;

export const SideLabel = styled.label`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

export const SideInput = styled.input`
  ${inputSurface}
`;

export const SideSelect = styled.select`
  ${inputSurface}
`;

export const SideHint = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.5;
  color: ${color.textMuted};
`;

/** 🔴 오류는 색만으로 말하지 않는다 — 글로 무엇이 잘못됐는지 적는다. */
export const SideError = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.5;
  color: ${color.danger};
`;
