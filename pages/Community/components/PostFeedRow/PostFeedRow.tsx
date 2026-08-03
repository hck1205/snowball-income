import { COMMUNITY_COPY, DEFAULT_POST_CATEGORY, toPostCategory } from '@/shared/constants/community';
import { buildPostShareUrl, formatCompactCount } from '@/shared/lib/community';
import {
  CommentIcon,
  EyeIcon,
  HeartIcon,
  PostShareButton,
  RelativeTime,
  SimBadge,
  SimSummaryStats,
  VisuallyHidden
} from '@/components/community';
import type { PostFeedRowProps } from './PostFeedRow.types';
import {
  RowCategoryBadge,
  RowKicker,
  RowKickerDot,
  RowKickerMeta,
  RowLink,
  RowMain,
  RowShareSlot,
  RowSimStrip,
  RowStatCell,
  RowStatRail,
  RowStatValue,
  RowSummary,
  RowTitle
} from './PostFeedRow.styled';

const { metaViews, metaLikes, metaComments } = COMMUNITY_COPY.gallery;

/**
 * 목록 행 — 게시판 본문과 갤러리 "목록 보기"가 공유한다.
 *
 * 조판은 편집 지면의 순서를 따른다: **키커(분류·작성자·시간) → 표제 → 리드 → 숫자 스트립**,
 * 그리고 우측에 **계수 레일**(조회·댓글·좋아요 + 공유). 구조 근거는 styled 파일 머리말.
 *
 * 행 전체가 상세로 가는 링크다. 공유 버튼은 링크 안의 버튼이라 클릭 시 네비게이션을 막는다.
 */
export default function PostFeedRow({ item, simSummary }: PostFeedRowProps) {
  const authorName = item.author?.display_name ?? '익명';
  // 상세 링크는 글의 섹션(kind)을 따른다 — 포트폴리오=/community/portfolio/:id, 게시판=/community/board/:id.
  const detailPath = item.kind === 'board' ? `/community/board/${item.id}` : `/community/portfolio/${item.id}`;

  /**
   * 분류 배지는 게시판 글에만, 그리고 **기본값('자유')이 아닐 때만** 붙인다.
   * 모든 행에 '자유'를 달면 피드가 배지로 뒤덮여 정작 공지/건의사항이 눈에 안 띈다.
   */
  const category = toPostCategory(item.category);
  const showCategoryBadge = item.kind === 'board' && category !== DEFAULT_POST_CATEGORY;

  return (
    <RowLink to={detailPath}>
      <RowMain>
        <RowKicker>
          {showCategoryBadge ? (
            <RowCategoryBadge $emphasis={category === 'notice'}>
              {COMMUNITY_COPY.write.categoryLabels[category]}
            </RowCategoryBadge>
          ) : null}
          {/* 숫자 스트립이 있으면 숫자가 곧 시뮬 신호 → 배지는 요약이 없을 때만. */}
          {!simSummary && item.has_payload ? <SimBadge /> : null}
          <RowKickerMeta>
            <b>{authorName}</b>
            <RowKickerDot aria-hidden="true">·</RowKickerDot>
            <RelativeTime iso={item.created_at} />
          </RowKickerMeta>
        </RowKicker>

        <RowTitle>{item.title}</RowTitle>
        {item.description ? <RowSummary>{item.description}</RowSummary> : null}

        {simSummary ? (
          <RowSimStrip>
            <SimSummaryStats variant="row" summary={simSummary} />
          </RowSimStrip>
        ) : null}
      </RowMain>

      <RowStatRail>
        {/* 아이콘만으로 의미 전달 금지 — 숨김 라벨을 병기해 "조회수 41"로 읽히게 한다. */}
        <RowStatCell>
          <EyeIcon size={12} strokeWidth={1.8} />
          <VisuallyHidden>{metaViews}</VisuallyHidden>
          <RowStatValue>{formatCompactCount(item.view_count)}</RowStatValue>
        </RowStatCell>
        <RowStatCell>
          <CommentIcon size={12} strokeWidth={1.8} />
          <VisuallyHidden>{metaComments}</VisuallyHidden>
          <RowStatValue>{formatCompactCount(item.comment_count)}</RowStatValue>
        </RowStatCell>
        <RowStatCell>
          <HeartIcon size={12} strokeWidth={1.8} />
          <VisuallyHidden>{metaLikes}</VisuallyHidden>
          <RowStatValue>{formatCompactCount(item.like_count)}</RowStatValue>
        </RowStatCell>
        <RowShareSlot>
          <PostShareButton
            postId={item.id}
            kind={item.kind}
            title={item.title}
            url={buildPostShareUrl(detailPath)}
            placement="feed"
          />
        </RowShareSlot>
      </RowStatRail>
    </RowLink>
  );
}
