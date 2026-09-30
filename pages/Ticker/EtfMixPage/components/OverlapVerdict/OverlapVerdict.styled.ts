import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  color,
  font,
  media,
  motion,
  pageHueMix,
  radius,
  space,
  surface
} from '@/shared/styles';

/* OverlapVerdict 의 스타일 — 원래 EtfMixPage.styled.ts 에서 값 변경 없이 옮겼다. 규율은 ../../styled/index.ts 머리말. */

const VERDICT_PAD = 'clamp(18px, 2.2vw, 26px)';

export const Verdict = styled.section`
  position: relative;
  overflow: hidden;
  ${surface(DATA_RADIUS, VERDICT_PAD)}
  display: grid;
  gap: ${space[4]};
  border: 1px solid ${color.border};
  background: ${color.surfaceSunken};
  min-width: 0;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 6px;
    background: ${pageHueMix(70, 'transparent')};
  }
`;

export const VerdictBody = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${space[4]} clamp(16px, 3vw, 28px);
  min-width: 0;

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);
    justify-items: start;
  }
`;

/** 링 게이지. 값은 옆 숫자가 말하고, 링은 크기 감각만 준다(그래서 낭독에서 감춘다). */
export const Gauge = styled.div`
  position: relative;
  width: clamp(120px, 18vw, 148px);
  aspect-ratio: 1;
  max-width: 100%;

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
`;

export const GaugeTrack = styled.circle`
  fill: none;
  stroke: ${color.progressTrack};
`;

export const GaugeFill = styled.circle<{ $high: boolean }>`
  fill: none;
  stroke: ${({ $high }) => ($high ? color.warning : color.brand)};
  stroke-linecap: round;
  transition:
    stroke-dashoffset 600ms cubic-bezier(0.2, 0.8, 0.2, 1),
    stroke ${motion.base} ${motion.ease};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const GaugeCenter = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
`;

export const VerdictEyebrow = styled.h2`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.12em;
`;

/** 화면에서 가장 큰 숫자 — 이 화면에서 heroNumeric 의 한 곳은 여기다. */
export const VerdictValue = styled.p`
  margin: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  color: ${color.text};
  font-family: ${font.heroNumeric};
  font-size: clamp(24px, 3.2vw, 32px);
  font-weight: ${font.weight.extrabold};
  line-height: 1.05;
  letter-spacing: -0.02em;
  ${font.numeric}
`;

export const VerdictUnit = styled.span`
  color: ${color.textSecondary};
  font-family: ${font.sans};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};
`;

export const VerdictText = styled.div`
  display: grid;
  gap: ${space[2]};
  justify-items: start;
  min-width: 0;
`;

/** 방금 한 동작과 그 결과. 값이 바뀔 때마다 다시 튀어나오도록 호출부가 key 를 바꾼다. */
export const DeltaChip = styled.p<{ $tone: 'up' | 'down' | 'flat' }>`
  margin: 0;
  padding: 2px ${space[3]};
  border-radius: ${radius.pill};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
  color: ${({ $tone }) => ($tone === 'up' ? color.warning : color.textSecondary)};
  background: ${({ $tone }) => ($tone === 'up' ? color.warningSurface : color.surface)};
  border: 1px solid ${({ $tone }) => ($tone === 'up' ? 'transparent' : color.border)};
  animation: overlap-delta-in ${motion.base} ${motion.ease};

  @keyframes overlap-delta-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const VerdictSentence = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  min-width: 0;
`;

export const VerdictNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  min-width: 0;
`;

export const StatGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[2]};
  margin: 0;
  min-width: 0;

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Stat = styled.div`
  display: grid;
  gap: 2px;
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;

  dt {
    color: ${color.textMuted};
    font-size: ${font.size['2xs']};
  }

  dd {
    margin: 0;
    color: ${color.text};
    font-family: ${font.dataNumeric};
    font-size: ${font.size.lg};
    font-weight: ${font.weight.bold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${font.numeric}
  }
`;
