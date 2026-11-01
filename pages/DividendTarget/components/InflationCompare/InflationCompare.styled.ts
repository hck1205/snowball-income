import styled from '@emotion/styled';
import type { InflationVerdict } from '@/shared/lib/dividendTarget';
import { color, font, media, motion, radius, space } from '@/shared/styles';
import { VERDICT_TONE } from '../../utils';

/* --------------------------------------------------------------------------
 * 물가 비교 — 막대 두 줄(과거 배당 인상률 / 물가 가정)을 **같은 눈금**에 놓는다.
 *
 * 눈금이 다르면 막대 길이가 거짓말을 한다. 그래서 두 막대의 폭은 부품이 계산한 같은 최댓값을
 * 기준으로 한 비율이고(style 로 --bar 를 심는다), 마이너스 인상률은 막대 0 + 숫자로만 보여 준다
 * (왼쪽으로 뻗는 막대는 이 크기에서 "작은 양수"와 구별되지 않는다).
 *
 * 판정 색은 VERDICT_TONE(utils/verdictTone) 하나가 정한다 — 비교 카드의 칩과 같은 표다.
 * -------------------------------------------------------------------------- */

export const CompareRoot = styled.div`
  display: grid;
  gap: ${space[4]};
  padding: clamp(20px, 3vw, 32px);
  border-top: 1px dashed ${color.border};
  background: ${color.surfaceMuted};

  ${media.up('tablet')} {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.2fr);
    gap: ${space[8]};
    align-items: start;
  }
`;

export const CompareIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
`;

export const CompareTitle = styled.h3`
  margin: 0;
  font-family: ${font.display};
  font-size: ${font.size['2xl']};
  color: ${color.text};
`;

export const CompareLede = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const RateGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  margin-top: ${space[2]};
`;

export const RateLabel = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const RateChip = styled.button`
  ${font.numeric}
  min-height: 36px;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;

  &:hover {
    border-color: ${color.borderStrong};
  }

  &[aria-pressed='true'] {
    border-color: ${color.text};
    background: ${color.text};
    color: ${color.surface};
  }
`;

export const RateBasis = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const Bars = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

export const BarRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'label value'
    'track track';
  gap: ${space[1]} ${space[3]};
  align-items: baseline;
`;

export const BarLabel = styled.span`
  grid-area: label;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
`;

export const BarValue = styled.span`
  grid-area: value;
  font-family: ${font.dataNumeric};
  ${font.numeric}
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const BarTrack = styled.div`
  grid-area: track;
  height: 14px;
  border-radius: ${radius.pill};
  background: ${color.progressTrack};
  overflow: hidden;
`;

export const BarFill = styled.div<{ $kind: 'growth' | 'inflation' }>`
  width: var(--bar, 0%);
  height: 100%;
  border-radius: inherit;
  background: ${({ $kind }) => ($kind === 'growth' ? 'var(--tone-solid)' : color.textMuted)};
  transition: width ${motion.slow} ${motion.easeInOut};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const Verdict = styled.p<{ $verdict: InflationVerdict }>`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin: ${space[1]} 0 0;
  padding: ${space[3]};
  border-radius: ${radius.md};
  border: 1px solid ${({ $verdict }) => VERDICT_TONE[$verdict].edge};
  background: ${({ $verdict }) => VERDICT_TONE[$verdict].surface};
  color: ${({ $verdict }) => VERDICT_TONE[$verdict].text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  word-break: keep-all;
`;

export const GrowthBasis = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  color: ${color.textMuted};
  word-break: keep-all;
`;
