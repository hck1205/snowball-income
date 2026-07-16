import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

export const WriteForm = styled.form`
  max-width: 760px;
  margin: 0 auto;
  display: grid;
  gap: ${space[5]};
`;

export const FieldBlock = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const LabelRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const FieldLabel = styled.label`
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
`;

export const Counter = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

export const TitleInput = styled.input<{ invalid?: boolean }>`
  width: 100%;
  height: 48px;
  padding: 0 ${space[4]};
  border-radius: ${radius.md};
  border: 1px solid ${({ invalid }) => (invalid ? color.danger : color.borderStrong)};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};

  &::placeholder {
    color: ${color.textMuted};
    font-weight: ${font.weight.regular};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }
`;

export const DescriptionTextarea = styled.textarea<{ invalid?: boolean }>`
  width: 100%;
  min-height: 72px;
  padding: ${space[3]} ${space[4]};
  border-radius: ${radius.md};
  border: 1px solid ${({ invalid }) => (invalid ? color.danger : color.borderStrong)};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
  resize: vertical;
  font-family: inherit;

  &::placeholder {
    color: ${color.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }
`;

export const FieldError = styled.p`
  margin: 0;
  color: ${color.danger};
  font-size: ${font.size.sm};
`;

/* 첨부 카드 */
export const AttachEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding: ${space[4]};
  border-radius: ${radius.md};
  border: 1px dashed ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const AttachCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  padding: ${space[4]};
  border-radius: ${radius.md};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
`;

export const AttachInfo = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    color: ${color.text};
    font-size: ${font.size.base};
    font-weight: ${font.weight.bold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size.sm};
    ${font.numeric}
  }
`;

export const VisibilityRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const VisibilityText = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${space[2]};
  padding-top: ${space[2]};
`;

export const EditorHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/* 로그인 게이트 / 로딩 */
export const GateWrap = styled.div`
  max-width: 480px;
  margin: clamp(${space[6]}, 8vw, ${space[16]}) auto 0;
`;

export const GateButtons = styled.div`
  display: grid;
  gap: ${space[2]};
  margin-top: ${space[4]};
`;

export const ProviderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  width: 100%;
  min-height: 44px;
  padding: 0 ${space[4]};
  border-radius: ${radius.md};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;
