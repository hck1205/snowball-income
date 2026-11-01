import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 히어로 — 질문 문장 안에 **고른 금액이 박혀 있다.**
 *
 * 금액을 문장 밖 칩에만 두면 "무엇을 묻는 화면인가"와 "지금 무엇을 골랐나"가 두 군데로 갈린다.
 * 제목 한 줄이 둘을 동시에 말하게 한다: "매달 250만원 받으려면, 얼마가 있어야 할까?"
 * -------------------------------------------------------------------------- */

export const PickerRoot = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[4]};
  padding: clamp(20px, 3vw, 36px);
  border: 1px solid ${color.identityBorder};
  border-radius: ${radius.xl};
  background: ${color.identitySubtle};
`;

export const Eyebrow = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.02em;
  color: ${color.identityText};
`;

export const Title = styled.h1`
  margin: 0;
  font-family: ${font.display};
  font-size: clamp(26px, 4.2vw, 40px);
  line-height: ${font.leading.tight};
  color: ${color.text};
  word-break: keep-all;
`;

/* 문장 속 금액 — 형광펜처럼 밑을 칠한다. 글자색을 바꾸지 않는 이유: 틴트 면 위 컬러 글자는 대비가 보장되지 않는다. */
export const TitleAmount = styled.span`
  ${font.numeric}
  padding: 0 0.12em;
  background: linear-gradient(transparent 58%, ${color.accentAltSubtle} 58%);
  box-shadow: inset 0 -0.18em 0 ${color.accentAltBorder};
`;

export const Lede = styled.p`
  margin: 0;
  max-width: 62ch;
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const ChoiceLabel = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

export const AmountChip = styled.button`
  ${font.numeric}
  min-height: 44px;
  padding: 0 ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brand};
  }

  &:active {
    transform: scale(0.97);
  }

  &[aria-pressed='true'] {
    border-color: ${color.brand};
    background: ${color.brand};
    color: ${color.onBrand};
  }
`;

export const CustomForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
`;

export const CustomField = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 44px;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};

  &:focus-within {
    border-color: ${color.brand};
    box-shadow: ${color.focusShadow};
  }

  input {
    ${font.numeric}
    width: 6ch;
    border: 0;
    outline: none;
    background: transparent;
    color: ${color.text};
    font-size: ${font.size.md};
    font-weight: ${font.weight.bold};
    text-align: right;
  }
`;

export const CustomApply = styled.button`
  min-height: 44px;
  padding: 0 ${space[4]};
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;

  &:hover {
    border-color: ${color.brand};
  }
`;

export const CustomHint = styled.span<{ $invalid: boolean }>`
  font-size: ${font.size.xs};
  color: ${({ $invalid }) => ($invalid ? color.danger : color.textMuted)};

  ${media.down('mobile')} {
    flex-basis: 100%;
  }
`;
