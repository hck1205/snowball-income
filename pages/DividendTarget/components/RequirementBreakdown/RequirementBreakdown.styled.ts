import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, shadow, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 자세히 보기 — 이 화면의 주인공 카드.
 *
 * 왼쪽(넓은 폭) = 답(필요 원금, 화면에서 가장 큰 숫자 하나) + 근거 한 줄.
 * 오른쪽 = 그 답이 나온 **순서**. 위에서 아래로 내려가며 연산자(×12, ÷(1−세율), ÷배당률)가
 * 줄 사이에 끼어 있다 — "자세히"의 실체는 숫자 개수가 아니라 **숫자 사이의 관계**다.
 *
 * 물가 비교는 이 카드 **안**의 아래 칸이다. 따로 떼어 카드를 하나 더 세우면 "같은 종목 이야기"가
 * 두 덩어리로 읽힌다.
 *
 * 묶음 색은 --tone-* 변수로 받는다(부모가 style 로 심는다). 컴포넌트 셀렉터를 쓰지 않는 이유:
 * 이 레포에는 Emotion babel 플러그인이 없어 런타임에서 깨진다.
 * -------------------------------------------------------------------------- */

export const BreakdownCard = styled.section`
  display: grid;
  gap: 0;
  border: 1px solid var(--tone-border);
  border-radius: ${radius.xl};
  background: ${color.surface};
  box-shadow: ${shadow.e2};
  overflow: hidden;
  scroll-margin-top: 96px;
`;

export const BreakdownTop = styled.div`
  display: grid;
  gap: ${space[6]};
  padding: clamp(20px, 3vw, 32px);

  ${media.up('tablet')} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    align-items: start;
    gap: ${space[8]};
  }
`;

export const AnswerColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  min-width: 0;
`;

export const TickerLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
`;

export const TickerSymbol = styled.span`
  font-family: ${font.display};
  font-size: ${font.size['3xl']};
  color: ${color.text};
`;

export const TickerName = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 ${space[2]};
  border-radius: ${radius.pill};
  background: var(--tone-subtle);
  color: var(--tone-text);
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
`;

export const NeutralBadge = styled(Badge)`
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
`;

export const AnswerLabel = styled.p`
  margin: ${space[2]} 0 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const AnswerValue = styled.p`
  margin: 0;
  font-family: ${font.heroNumeric};
  ${font.numeric}
  font-size: clamp(34px, 5.6vw, 54px);
  font-weight: ${font.weight.extrabold};
  line-height: 1.1;
  color: ${color.text};
  word-break: keep-all;
`;

export const AnswerCaption = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const PayoutPill = styled.p`
  ${font.numeric}
  align-self: flex-start;
  margin: ${space[1]} 0 0;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.md};
  background: var(--tone-subtle);
  color: var(--tone-text);
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: ${space[2]};
`;

export const SimulateButton = styled.button`
  min-height: 44px;
  padding: 0 ${space[4]};
  border: 0;
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, transform ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandHover};
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const SecondaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;

  &:hover {
    border-color: ${color.borderStrong};
  }
`;

/* ── 계산 순서 ───────────────────────────────────────────────────────────── */

export const StepsPanel = styled.div`
  padding: ${space[4]};
  border-radius: ${radius.lg};
  background: ${color.surfaceMuted};
`;

export const StepsTitle = styled.h3`
  margin: 0 0 ${space[3]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.textSecondary};
`;

export const StepList = styled.ol`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const StepRow = styled.li<{ $tone?: 'tax' | 'result' }>`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
  padding: ${space[3]} ${space[3]};
  border-radius: ${radius.md};
  background: ${({ $tone }) => ($tone === 'result' ? 'var(--tone-subtle)' : color.surface)};
  border: 1px solid ${({ $tone }) => ($tone === 'result' ? 'var(--tone-border)' : color.border)};
`;

export const StepLabel = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const StepValue = styled.span<{ $tone?: 'tax' | 'result' }>`
  font-family: ${font.dataNumeric};
  ${font.numeric}
  font-size: ${({ $tone }) => ($tone === 'result' ? font.size.xl : font.size.lg)};
  font-weight: ${font.weight.bold};
  color: ${({ $tone }) => ($tone === 'tax' ? color.dataNegative : $tone === 'result' ? 'var(--tone-text)' : color.text)};
  white-space: nowrap;
`;

/* 줄 사이 연산자 — 행이 아니라 행 사이의 이음새다. 목록 항목이 아니므로 스크린리더에는 행 라벨에 붙여 읽힌다. */
export const StepOperator = styled.span`
  ${font.numeric}
  display: block;
  padding: ${space[1]} 0 ${space[1]} ${space[4]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textMuted};
`;

export const BasisNote = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  color: ${color.textMuted};
  word-break: keep-all;
`;
