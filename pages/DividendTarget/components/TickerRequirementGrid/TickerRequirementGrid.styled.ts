import styled from '@emotion/styled';
import type { InflationVerdict } from '@/shared/lib/dividendTarget';
import { color, font, media, motion, radius, shadow, space } from '@/shared/styles';
import { VERDICT_TONE } from '../../utils';

/* --------------------------------------------------------------------------
 * 12 종 비교 — 네 묶음, 묶음마다 카드 셋.
 *
 * 카드마다 **같은 눈금의 막대**가 있다(필요 원금 / 12 종 중 최댓값). 숫자 열두 개를 나란히 놓으면
 * 자릿수를 읽어야 차이가 보이지만, 막대는 훑기만 해도 "VIG 는 QYLD 의 여덟 배"가 보인다 —
 * 이 화면이 "시각적으로"를 약속한 자리가 이것이다.
 *
 * 묶음 색은 --tone-* 변수로 받는다(섹션이 style 로 심는다).
 * -------------------------------------------------------------------------- */

export const GridRoot = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[5]};
`;

export const GridHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
`;

export const GridTitle = styled.h2`
  margin: 0;
  font-family: ${font.display};
  font-size: clamp(22px, 3vw, 30px);
  color: ${color.text};
`;

export const GridLede = styled.p`
  margin: 0;
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const CategoryBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  padding: clamp(14px, 2vw, 20px);
  border: 1px solid var(--tone-border);
  border-radius: ${radius.xl};
  background: var(--tone-subtle);
`;

export const CategoryHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[1]} ${space[3]};
`;

export const CategoryLabel = styled.h3`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  color: var(--tone-text);

  &::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: ${radius.pill};
    background: var(--tone-solid);
  }
`;

export const CategorySummary = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const CardRow = styled.ul`
  display: grid;
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const TickerCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  width: 100%;
  height: 100%;
  padding: ${space[4]};
  border: 2px solid transparent;
  border-radius: ${radius.lg};
  background: ${color.surface};
  box-shadow: ${shadow.e1};
  color: ${color.text};
  text-align: left;
  cursor: pointer;
  transition: transform ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${shadow.e2};
  }

  &:active {
    transform: translateY(0);
  }

  &[aria-pressed='true'] {
    border-color: var(--tone-solid);
    box-shadow: ${shadow.e2};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

export const CardTop = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const CardSymbol = styled.span`
  font-family: ${font.display};
  font-size: ${font.size.xl};
`;

export const SelectedMark = styled.span`
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: var(--tone-subtle);
  color: var(--tone-text);
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
`;

export const CardName = styled.span`
  overflow: hidden;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CardMetricLabel = styled.span`
  margin-top: ${space[1]};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

export const CardPrincipal = styled.span`
  font-family: ${font.dataNumeric};
  ${font.numeric}
  font-size: clamp(20px, 2.2vw, 24px);
  font-weight: ${font.weight.extrabold};
  line-height: 1.15;
  word-break: keep-all;
`;

export const PrincipalTrack = styled.span`
  display: block;
  height: 8px;
  border-radius: ${radius.pill};
  background: ${color.progressTrack};
  overflow: hidden;
`;

export const PrincipalFill = styled.span`
  display: block;
  width: var(--bar, 0%);
  height: 100%;
  border-radius: inherit;
  background: var(--tone-solid);
  transition: width ${motion.slow} ${motion.easeInOut};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CardFacts = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[2]};
  margin-top: ${space[1]};
`;

export const Fact = styled.span`
  ${font.numeric}
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 2px ${space[2]};
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};

  strong {
    color: ${color.text};
    font-weight: ${font.weight.bold};
  }
`;

/* 판정 색은 VERDICT_TONE 하나가 정한다 — 상세 카드의 판정 줄과 같은 표다(utils/verdictTone 머리말). */
export const VerdictFact = styled(Fact)<{ $verdict: InflationVerdict }>`
  background: ${({ $verdict }) => VERDICT_TONE[$verdict].surface};
  color: ${({ $verdict }) => VERDICT_TONE[$verdict].text};
  box-shadow: inset 0 0 0 1px ${({ $verdict }) => VERDICT_TONE[$verdict].edge};
  font-weight: ${font.weight.semibold};
`;

export const TradeoffNote = styled.p`
  margin: 0;
  padding: ${space[3]} ${space[4]};
  border-left: 3px solid ${color.borderStrong};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;
