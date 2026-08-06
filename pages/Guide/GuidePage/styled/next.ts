import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  DATA_RADIUS,
  cardElevation,
  color,
  font,
  media,
  motion,
  pageHue,
  pageHueMix,
  radius,
  space,
  topRail
} from '@/shared/styles';
import { MEASURE, RAIL } from './metrics';

/* -------------------------------------------------------------------------- */
/* 마무리 — 다음 걸음 · 다른 가이드                                              */
/* -------------------------------------------------------------------------- */

/**
 * 글이 향하는 곳.
 *
 * 🔴 종전에는 버튼 하나와 회색 한 줄이 본문 끝에 그냥 붙어 있었다. 이 글을 다 읽은 사람에게 **다음
 * 행동은 하나**여야 하고, 그 하나는 화면에서 가장 무거운 덩어리여야 한다. 그래서 카드 + hue 리본이다.
 *
 * ⚠ `overflow: hidden` 은 반경 바로 옆에 둔다(리본이 둥근 모서리 밖으로 나가지 않게 —
 *   근거는 table.ts 의 TableCard 주석).
 */
export const CtaPanel = styled.div`
  position: relative;
  display: grid;
  gap: ${space[3]};
  max-width: ${MEASURE};
  padding: clamp(20px, 2.6vw, 32px);
  border-radius: ${DATA_RADIUS};
  overflow: hidden;
  ${cardElevation('raised')}

  &::before {
    ${topRail(RAIL)}
    background: ${pageHue};
  }
`;

export const CtaTitle = styled.p`
  margin: 0;
  font-family: ${font.display};
  font-size: clamp(${font.size.lg}, 1.6vw, ${font.size['2xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
  word-break: keep-all;
`;

export const CtaNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;

export const CtaActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[3]};
  margin-top: ${space[1]};
`;

/* -------------------------------------------------------------------------- */
/* 시작 경로의 다음 글                                                           */
/* -------------------------------------------------------------------------- */

/**
 * "다음 글" 한 장.
 *
 * 🔴 다른 가이드들과 **같은 크기로 늘어놓지 않는다.** 랜딩의 시작 경로가 다섯 걸음의 **순서**를
 * 갖고, 이 카드가 그 순서를 글 안에서 잇는다 — 다음 걸음이 목록 속에 섞이면 순서가 사라진다.
 */
export const NextCard = styled(Link)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[3]};
  max-width: ${MEASURE};
  padding: ${space[4]};
  border: 1px solid ${pageHueMix(45, 'transparent')};
  border-radius: ${DATA_RADIUS};
  background: ${pageHueMix(10)};
  color: ${color.text};
  text-decoration: none;
  transition:
    border-color ${motion.fast} ${motion.ease},
    background-color ${motion.fast} ${motion.ease};

  &:hover,
  &:focus-visible {
    background: ${pageHueMix(16)};
  }
`;

/** 걸음 번호(원). 폭이 짧아 틴트 면 예산 밖이다(색면 사다리 L1). */
export const StepBadge = styled.span`
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: ${radius.pill};
  background: ${color.surface};
  border: 1px solid ${color.border};
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  ${font.numeric};
`;

export const NextBody = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const NextEyebrow = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
`;

export const NextTitle = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  word-break: keep-all;
`;

export const NextAction = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${color.brandText};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
`;

/* -------------------------------------------------------------------------- */
/* 다른 가이드                                                                   */
/* -------------------------------------------------------------------------- */

export const RelatedHead = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${color.textMuted};
`;

export const RelatedGrid = styled.ul`
  display: grid;
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('tabletSm')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const RelatedCard = styled(Link)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[3]};
  height: 100%;
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
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

export const RelatedBody = styled.span`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const RelatedTitle = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  word-break: keep-all;
`;

export const RelatedLede = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;
