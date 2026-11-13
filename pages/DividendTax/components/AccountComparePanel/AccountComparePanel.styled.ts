import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

export const PanelHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]} ${space[3]};
`;

/** 계좌 비교 — 좁은 폭은 세로 3줄(라벨 왼쪽·금액 오른쪽 한 줄씩), mobileWide 이상은 3열. */
export const Compare = styled.div`
  display: grid;
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  overflow: hidden;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const CompareItem = styled('div', { shouldForwardProp: (prop) => prop !== 'best' })<{ best?: boolean }>`
  display: grid;
  /* 라벨이 두 줄로 꺾여도 금액은 칸 아래쪽에 — 두 칸의 금액이 같은 높이에 선다. */
  align-content: space-between;
  gap: ${space[1]};
  padding: ${space[3]} ${space[4]};
  background: ${({ best }) => (best ? color.brandSubtle : color.surface)};

  & + & {
    border-top: 1px solid ${color.border};
  }

  ${media.up('mobileWide')} {
    & + & {
      border-top: 0;
      border-left: 1px solid ${color.border};
    }
  }
`;

export const CompareLabel = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
`;

export const CompareValue = styled.strong`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
`;

export const Highlight = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.brandText};
`;

export const ToggleChip = styled('button', { shouldForwardProp: (prop) => prop !== 'active' })<{ active: boolean }>`
  min-height: 32px;
  padding: 0 ${space[3]};
  border: 1px solid ${({ active }) => (active ? color.brandBorder : color.borderStrong)};
  border-radius: ${radius.pill};
  background: ${({ active }) => (active ? color.brandSubtle : color.surface)};
  color: ${({ active }) => (active ? color.brandText : color.textSecondary)};
  font: inherit;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
`;
