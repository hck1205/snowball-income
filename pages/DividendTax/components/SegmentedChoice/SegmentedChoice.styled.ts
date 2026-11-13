import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/** InputField 의 FieldWrapper 와 같은 골격(라벨 줄 + 컨트롤). */
export const Field = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const FieldLabel = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

/** 3칸 선택 — 입력창과 같은 높이(40px)·같은 라운드. */
export const Segmented = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 40px;
  padding: 3px;
  gap: 3px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
`;

export const SegmentButton = styled('button', { shouldForwardProp: (prop) => prop !== 'active' })<{ active: boolean }>`
  min-width: 0;
  border: 0;
  border-radius: calc(${radius.sm} - 2px);
  background: ${({ active }) => (active ? color.surface : 'transparent')};
  box-shadow: ${({ active }) => (active ? `0 0 0 1px ${color.brandBorder}` : 'none')};
  color: ${({ active }) => (active ? color.brandText : color.textSecondary)};
  font: inherit;
  font-size: ${font.size.sm};
  font-weight: ${({ active }) => (active ? font.weight.bold : font.weight.medium)};
  cursor: pointer;
  white-space: nowrap;
`;
