import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { DATA_RADIUS, color, font, media, motion, space, surface } from '@/shared/styles';

const CARD_PAD = space[5];

export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[6]};
  margin-top: ${space[6]};
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[4]};

  /* 카드 안 문장이 3열에서 4~5줄로 접혀 카드가 세로로 길어지는 폭. 여기서 1열로 내린다. */
  ${media.down('tabletSm')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ListCard = styled(Link)`
  ${surface(DATA_RADIUS, CARD_PAD)};
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  text-decoration: none;
  transition:
    border-color ${motion.fast} ${motion.ease},
    background-color ${motion.fast} ${motion.ease};

  &:hover,
  &:focus-visible {
    border-color: ${color.brandBorder};
    background: ${color.surfaceHover};
  }
`;

export const CardTitle = styled.span`
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
`;

export const CardCriterion = styled.span`
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

export const CardBody = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: 1.7;
`;

export const CardMeta = styled.span`
  margin-top: auto;
  padding-top: ${space[2]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const CardCta = styled.span`
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;
