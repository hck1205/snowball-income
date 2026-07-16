import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

export const Section = styled.section`
  margin-top: ${space[8]};
  padding-top: ${space[6]};
  border-top: 1px solid ${color.border};
`;

export const SectionHeading = styled.h2`
  margin: 0 0 ${space[4]};
  color: ${color.text};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
`;

export const Composer = styled.form`
  display: grid;
  gap: ${space[2]};
  margin-bottom: ${space[5]};
`;

export const CommentTextarea = styled.textarea`
  width: 100%;
  min-height: 72px;
  padding: ${space[3]};
  border-radius: ${radius.md};
  border: 1px solid ${color.borderStrong};
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

export const ComposerBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const ComposerCounter = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

export const LoginPrompt = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding: ${space[4]};
  margin-bottom: ${space[5]};
  border-radius: ${radius.md};
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const ThreadList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[4]};
`;

export const ReplyComposerForm = styled(Composer)`
  margin: ${space[3]} 0 0;
  padding-left: ${space[5]};
  border-left: 2px solid ${color.border};
`;

export const ReplyList = styled.ul`
  list-style: none;
  margin: ${space[3]} 0 0;
  padding: 0 0 0 ${space[5]};
  border-left: 2px solid ${color.border};
  display: grid;
  gap: ${space[3]};
`;

export const CommentRoot = styled.div<{ pending?: boolean }>`
  display: grid;
  gap: ${space[2]};
  opacity: ${({ pending }) => (pending ? 0.6 : 1)};
`;

export const CommentHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};

  b {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }

  time {
    color: ${color.textMuted};
    font-size: ${font.size.xs};
  }
`;

export const CommentBody = styled.p<{ deleted?: boolean }>`
  margin: 0;
  color: ${({ deleted }) => (deleted ? color.textMuted : color.text)};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
  white-space: pre-wrap;
  word-break: break-word;
  font-style: ${({ deleted }) => (deleted ? 'italic' : 'normal')};
`;

export const CommentActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[3]};
`;

export const TextAction = styled.button`
  border: 0;
  background: transparent;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  padding: 0;
  transition: color ${motion.fast} ${motion.ease};

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const StateText = styled.p`
  margin: 0;
  padding: ${space[4]} 0;
  color: ${color.textMuted};
  font-size: ${font.size.base};
`;

export const BannerAction = styled.div`
  margin-top: ${space[3]};
`;
