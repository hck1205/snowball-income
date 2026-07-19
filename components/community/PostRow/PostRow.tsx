import { COMMUNITY_COPY } from '@/shared/constants/community';
import { formatCompactCount } from '@/shared/lib/community';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PostListItem } from '@/shared/lib/supabase';
import { HeartIcon } from '@/components/community/CommunityIcons';
import { RelativeTime } from '@/components/community/RelativeTime';
import { VisuallyHidden } from '@/components/community/PostMeta';
import { SimBadge } from '@/components/community/SimBadge';
import { SimSummaryStats } from '@/components/community/SimSummaryStats';
import { LikeInline, RowBody, RowLink, RowStats, RowSubInfo, RowSubText, RowSummary, RowTitle } from './PostRow.styled';

export type PostRowProps = {
  item: PostListItem;
  /**
   * 게시 시점 시뮬 요약(스펙 §H) — 카드와 동일하게 옵셔널 주입(데이터 레이어 후속 트랙).
   * 없으면 숫자 줄 없이 텍스트 행으로 폴백한다(§I I4 — `has_payload`만으로 렌더하지 않는다).
   */
  simSummary?: ScenarioSimSummary | null;
};

const { metaViews, metaLikes, metaComments } = COMMUNITY_COPY.gallery;

/**
 * 구분선 피드 행(B안) — 좌 텍스트 열(제목 → 요약 → 서브 정보)과 우 숫자 칩(RowStats)의 2열.
 * 행 전체가 상세로 가는 링크. 요약(sim_summary)이 있으면 우측 칩에 숫자 클러스터를,
 * 없으면 칩을 렌더하지 않고 `has_payload`일 때만 SimBadge로 "시뮬 첨부"를 폴백 표시한다(§I I4).
 * 배지·hero 라벨은 텍스트를 포함하고(색 의존 없음), ♥는 숨김 라벨 "좋아요"와 함께 읽힌다.
 */
export default function PostRow({ item, simSummary }: PostRowProps) {
  const authorName = item.author?.display_name ?? '익명';

  return (
    <RowLink to={`/community/${item.id}`}>
      <RowBody>
        <RowTitle>{item.title}</RowTitle>
        {item.description ? <RowSummary>{item.description}</RowSummary> : null}
        <RowSubInfo>
          <RowSubText>
            <b>{authorName}</b>
            {' · '}
            <RelativeTime iso={item.created_at} />
            {` · ${metaComments} ${formatCompactCount(item.comment_count)} · ${metaViews} ${formatCompactCount(item.view_count)} · `}
            <LikeInline>
              <HeartIcon size={12} />
              <VisuallyHidden>{metaLikes}</VisuallyHidden>
              {formatCompactCount(item.like_count)}
            </LikeInline>
          </RowSubText>
          {/* 숫자 칩(=simSummary)이 있으면 숫자가 곧 시뮬 신호 + 목표 배지가 색을 담당 → SimBadge는 요약이 없을 때만. */}
          {!simSummary && item.has_payload ? <SimBadge /> : null}
        </RowSubInfo>
      </RowBody>
      {simSummary ? (
        <RowStats>
          <SimSummaryStats variant="row" summary={simSummary} />
        </RowStats>
      ) : null}
    </RowLink>
  );
}
