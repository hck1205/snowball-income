import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

export const MetaRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[3]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  white-space: nowrap;

  svg {
    flex: 0 0 auto;
  }
`;

/** 스크린리더 전용 라벨 — 아이콘만으로 의미가 전달되지 않게 병기한다. */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
