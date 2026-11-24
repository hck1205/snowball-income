import { AI_REPORTER, isAiReporterUserId } from '@/shared/constants/community';
import { AiReporterMark } from '../AiReporterMark';
import { BadgeRoot } from './AiReporterBadge.styled';
import type { AiReporterBadgeProps } from './AiReporterBadge.types';

/**
 * AI 리포터 글·댓글의 작성자 옆 배지(2026-11-10). 작성자가 AI 리포터 계정이 아니면 **아무것도 그리지 않는다**
 * — 호출부는 조건 없이 작성자 id 만 넘기면 된다.
 * 그림은 윙크 하마(`AiReporterMark`, 2026-11-25 — 예전 🤖 이모지를 바꿨다).
 */
export default function AiReporterBadge({ authorId }: AiReporterBadgeProps) {
  if (!isAiReporterUserId(authorId)) return null;
  return (
    <BadgeRoot title={AI_REPORTER.badgeTitle}>
      <AiReporterMark size="1.25em" />
      {AI_REPORTER.badgeLabel}
    </BadgeRoot>
  );
}
