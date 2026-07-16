import type { ScenarioListItem } from '@/shared/lib/supabase';
import { Avatar } from '@/components/community/Avatar';
import { RelativeTime } from '@/components/community/RelativeTime';
import { ScenarioMeta } from '@/components/community/ScenarioMeta';
import { SimBadge } from '@/components/community/SimBadge';
import {
  AuthorLine,
  CardBottom,
  CardLink,
  CardSummary,
  CardTitle,
  CardTop
} from './ScenarioCard.styled';

export type ScenarioCardProps = {
  item: ScenarioListItem;
};

/**
 * 카드 뷰 아이템. 카드 전체가 상세로 가는 링크다.
 * 썸네일이 없으므로 작성자 아바타 + 제목이 시각 앵커. 첨부(payload)가 있을 때만 시뮬 배지.
 */
export default function ScenarioCard({ item }: ScenarioCardProps) {
  const authorName = item.author?.display_name ?? '익명';

  return (
    <CardLink to={`/community/${item.id}`}>
      <CardTop>
        <AuthorLine>
          <Avatar displayName={authorName} avatarUrl={item.author?.avatar_url} size="sm" />
          <b>{authorName}</b>
        </AuthorLine>
        {item.has_payload ? <SimBadge /> : null}
      </CardTop>

      <CardTitle>{item.title}</CardTitle>
      {item.description ? <CardSummary>{item.description}</CardSummary> : null}

      <CardBottom>
        <ScenarioMeta viewCount={item.view_count} likeCount={item.like_count} commentCount={item.comment_count} />
        <RelativeTime iso={item.created_at} />
      </CardBottom>
    </CardLink>
  );
}
