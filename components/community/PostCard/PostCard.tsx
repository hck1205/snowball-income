import { COMMUNITY_COPY } from '@/shared/constants/community';
import { formatCompactCount } from '@/shared/lib/community';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PostListItem } from '@/shared/lib/supabase';
import { HeartIcon } from '@/components/community/CommunityIcons';
import { RelativeTime } from '@/components/community/RelativeTime';
import { VisuallyHidden } from '@/components/community/PostMeta';
import { SimBadge } from '@/components/community/SimBadge';
import { SimSummaryStats } from '@/components/community/SimSummaryStats';
import {
  CardLink,
  CardSummary,
  CardTitle,
  FooterAuthor,
  FooterRow,
  LikeStat,
  PreviewBlock,
  SubInfoRow,
  SubInfoText
} from './PostCard.styled';

export type PostCardProps = {
  item: PostListItem;
  /**
   * 게시 시점 시뮬 요약(스펙 §H, `posts.sim_summary`를 `parseScenarioSimSummary`로 검증한 값).
   * 목록 쿼리가 sim_summary를 실으면 데이터 레이어가 주입한다(후속 트랙) — 없으면(구버전 글 포함)
   * 현행 텍스트 카드 그대로. **`has_payload`만으로 프리뷰를 그리지 않는다**(§E).
   */
  simSummary?: ScenarioSimSummary | null;
};

const { metaViews, metaLikes, metaComments } = COMMUNITY_COPY.gallery;

/**
 * velog 글 카드 포맷 — 첨부 글(sim_summary 있음)만 상단에 시뮬 숫자 프리뷰 블록을 얹고(§E),
 * 없으면 제목부터 시작한다(높이 차이는 velog식 의도된 변주). 카드 전체가 상세로 가는 링크.
 * 구조: (프리뷰) → 제목 → 요약 → 서브 정보(시간·댓글·조회 | 시뮬 배지) → 구분선 → 푸터(닉네임 | ♥).
 */
export default function PostCard({ item, simSummary }: PostCardProps) {
  const authorName = item.author?.display_name ?? '익명';
  // 상세 링크는 글의 섹션(kind)을 따른다 — 포트폴리오=/community/portfolio/:id, 게시판=/community/board/:id.
  const detailPath = item.kind === 'board' ? `/community/board/${item.id}` : `/community/portfolio/${item.id}`;

  return (
    <CardLink to={detailPath}>
      {simSummary ? (
        <PreviewBlock>
          <SimSummaryStats variant="card" summary={simSummary} />
        </PreviewBlock>
      ) : null}
      <CardTitle>{item.title}</CardTitle>
      {item.description ? <CardSummary>{item.description}</CardSummary> : null}

      <SubInfoRow>
        <SubInfoText>
          <RelativeTime iso={item.created_at} />
          {` · ${metaComments} ${formatCompactCount(item.comment_count)} · ${metaViews} ${formatCompactCount(item.view_count)}`}
        </SubInfoText>
        {item.has_payload ? <SimBadge /> : null}
      </SubInfoRow>

      <FooterRow>
        <FooterAuthor>
          <b>{authorName}</b>
        </FooterAuthor>
        {/* 아이콘만으로 의미 전달 금지 — 숨김 라벨을 병기해 "좋아요 12"로 읽히게 한다. */}
        <LikeStat>
          <HeartIcon size={14} />
          <VisuallyHidden>{metaLikes}</VisuallyHidden>
          {formatCompactCount(item.like_count)}
        </LikeStat>
      </FooterRow>
    </CardLink>
  );
}
