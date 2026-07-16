import type { ScenarioListItem } from '@/shared/lib/supabase';
import { RelativeTime } from '@/components/community/RelativeTime';
import { ScenarioMeta } from '@/components/community/ScenarioMeta';
import { SimBadge } from '@/components/community/SimBadge';
import { RowAuthor, RowLink, RowMain, RowRight, RowTitle } from './ScenarioRow.styled';

export type ScenarioRowProps = {
  item: ScenarioListItem;
};

/**
 * inline 뷰 아이템 — 제목 위주 밀도 높은 행. 각 행이 상세로 가는 링크.
 * 640 이하에서 작성자/조회수/상대시간을 접는다.
 */
export default function ScenarioRow({ item }: ScenarioRowProps) {
  const authorName = item.author?.display_name ?? '익명';

  return (
    <RowLink to={`/community/${item.id}`}>
      <RowMain>
        {item.has_payload ? <SimBadge /> : null}
        <RowTitle>{item.title}</RowTitle>
      </RowMain>
      <RowAuthor>{authorName}</RowAuthor>
      <RowRight>
        <ScenarioMeta
          viewCount={item.view_count}
          likeCount={item.like_count}
          commentCount={item.comment_count}
          hideViews
        />
        <RelativeTime iso={item.created_at} />
      </RowRight>
    </RowLink>
  );
}
