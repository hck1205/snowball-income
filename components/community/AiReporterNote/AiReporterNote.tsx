import { AI_REPORTER, isAiReporterUserId } from '@/shared/constants/community';
import { NoteIcon, NoteRoot, NoteText } from './AiReporterNote.styled';
import type { AiReporterNoteProps } from './AiReporterNote.types';

/**
 * AI 리포터 글 본문 아래 고지(2026-11-10). 작성자가 AI 리포터가 아니면 **아무것도 그리지 않는다** —
 * 호출부는 조건 없이 작성자 id 만 넘긴다(`AiReporterBadge` 와 같은 계약).
 */
export default function AiReporterNote({ authorId }: AiReporterNoteProps) {
  if (!isAiReporterUserId(authorId)) return null;
  return (
    <NoteRoot aria-label={AI_REPORTER.badgeLabel}>
      <NoteIcon aria-hidden>🤖</NoteIcon>
      <NoteText>{AI_REPORTER.disclaimer}</NoteText>
    </NoteRoot>
  );
}
