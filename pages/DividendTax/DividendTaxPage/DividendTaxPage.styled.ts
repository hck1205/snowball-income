import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/** 세금 계산기(2026-11-12). 결과 카드는 판정(종합과세·피부양자)에 따라 경고/안심 톤을 갖는다 — 글자가 함께 말한다. */
export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[5]};
  padding-bottom: ${space[7]};
`;

export const Form = styled.form`
  display: grid;
  gap: ${space[4]};
  padding: ${space[5]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const Field = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const FieldLabel = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

export const ResultGrid = styled.div`
  display: grid;
  gap: ${space[3]};

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const ResultCard = styled('section', { shouldForwardProp: (prop) => prop !== 'tone' })<{ tone?: 'ok' | 'warn' }>`
  display: grid;
  align-content: start;
  gap: ${space[2]};
  padding: ${space[4]};
  border: 1px solid ${({ tone }) => (tone === 'warn' ? color.accentAltBorder : tone === 'ok' ? color.brandBorder : color.border)};
  border-radius: ${radius.lg};
  background: ${({ tone }) => (tone === 'warn' ? color.accentAltSubtle : tone === 'ok' ? color.brandSubtle : color.surface)};
`;

export const ResultLabel = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

export const ResultValue = styled.strong`
  font-size: clamp(${font.size['2xl']}, 3vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  ${font.numeric};
`;

export const ResultTone = styled.strong`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const Compare = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[3]};
`;

export const CompareItem = styled.div`
  display: grid;
  gap: ${space[1]};
`;

export const CompareLabel = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

export const CompareValue = styled.strong`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
`;

export const Note = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;
