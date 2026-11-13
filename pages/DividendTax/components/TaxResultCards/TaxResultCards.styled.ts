import styled from '@emotion/styled';
import { BREAKPOINT, color, font, media, radius, space } from '@/shared/styles';

export const ResultGrid = styled.div`
  display: grid;
  gap: ${space[3]};

  ${media.up('headerStack')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const ResultCard = styled.section`
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  align-content: start;
  gap: ${space[2]};
  padding: ${space[4]} ${space[5]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
  min-width: 0;

  /* 태블릿(mobileWide 초과 ~ headerStack): 한 줄에 한 장이라 폭이 남는다 — 왼쪽(제목·값·배지) | 오른쪽(설명) 가로 배치. */
  @media (min-width: ${BREAKPOINT.mobileWide + 1}px) and (max-width: ${BREAKPOINT.headerStack}px) {
    grid-template-columns: minmax(200px, 2fr) 3fr;
    grid-template-rows: auto auto 1fr;
    column-gap: ${space[5]};
    align-items: start;

    > :last-child {
      grid-column: 2;
      grid-row: 1 / span 3;
      align-self: center;
    }
  }
`;

export const Eyebrow = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const BigValue = styled.strong`
  font-size: clamp(${font.size['2xl']}, 3vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: ${color.text};
  ${font.numeric};
`;

export const StatusBadge = styled('span', { shouldForwardProp: (prop) => prop !== 'tone' })<{ tone: 'ok' | 'warn' | 'info' }>`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  /* 주의(warn)는 브랜드(초록)와 갈리는 액센트 계열 — 둘이 비슷한 초록이면 "괜찮다/주의"가 안 읽힌다. */
  border: 1px solid ${({ tone }) => (tone === 'warn' ? color.accentBorder : tone === 'ok' ? color.brandBorder : color.border)};
  background: ${({ tone }) => (tone === 'warn' ? color.accentSubtle : tone === 'ok' ? color.brandSubtle : color.surfaceSunken)};
  color: ${({ tone }) => (tone === 'warn' ? color.accentText : tone === 'ok' ? color.brandText : color.textSecondary)};
`;
