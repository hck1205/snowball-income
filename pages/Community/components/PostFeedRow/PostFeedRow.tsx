import { COMMUNITY_COPY, DEFAULT_POST_CATEGORY, toPostCategory } from '@/shared/constants/community';
import { formatCompactCount } from '@/shared/lib/community';
import {
  CommentIcon,
  EyeIcon,
  HeartIcon,
  RelativeTime,
  SimBadge,
  SimSummaryStats,
  VisuallyHidden
} from '@/components/community';
import type { PostFeedRowProps } from './PostFeedRow.types';
import {
  RowCategoryBadge,
  RowHead,
  RowKicker,
  RowKickerDot,
  RowKickerMeta,
  RowLink,
  RowMain,
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
 * 조판은 편집 지면의 순서를 따른다: **머리줄(분류·작성자·시간 + 우측 끝 공유) → 표제 → 리드 →
 * 숫자 스트립 → 바닥 계수 줄**(조회·댓글·좋아요). 구조 근거는 styled 파일 머리말.
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
      {/* 머리줄 — 키커뿐이다. 공유는 목록에서 뺐다(2026-08-04 사용자 지시: "List 화면에선 share 를
          없애고 View 화면에서만"). 목록의 행동은 "열어 보기" 하나여야 한다 — 링크 안에 다른 동작이
          섞이면 어디를 눌러야 할지 매번 판단해야 한다. 공유는 글을 읽은 뒤에 하는 일이라 상세가 맞다. */}
      <RowHead>
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

      </RowHead>

      <RowMain>
        <RowTitle>{item.title}</RowTitle>
        {item.description ? <RowSummary>{item.description}</RowSummary> : null}

        {simSummary ? (
          <RowSimStrip>
            <SimSummaryStats variant="row" summary={simSummary} />
          </RowSimStrip>
        ) : null}
      </RowMain>

      {/* 계수 줄 — 카드 **좌측 하단**에 모은다(2026-08-04 사용자 지시).
          종전에는 space-between 으로 셋을 전폭에 흩어 놨는데, 그러면 숫자 사이 간격이 카드 폭에 따라
          널뛰어 "세 값이 한 묶음"으로 안 읽힌다. 왼쪽에 붙이면 간격이 고정되고 시선이 한 번에 훑는다. */}
      <RowStatRail>
        {/* 아이콘만으로 의미 전달 금지 — 숨김 라벨을 병기해 "조회수 41"로 읽히게 한다. */}
        <RowStatCell>
          <EyeIcon size={16} strokeWidth={1.8} />
          <VisuallyHidden>{metaViews}</VisuallyHidden>
          <RowStatValue>{formatCompactCount(item.view_count)}</RowStatValue>
        </RowStatCell>
        {/* 🔴 순서는 **조회 → 좋아요 → 댓글**이다(2026-08-04 사용자 지시).
            읽은 사람 수 → 반응한 사람 수 → 말을 남긴 사람 수 로, 관여도가 낮은 것에서 높은 것으로 간다.
            상세 화면의 반응 레일(좋아요 → 공유)과도 같은 방향이다. */}
        <RowStatCell>
          <HeartIcon size={16} strokeWidth={1.8} />
          <VisuallyHidden>{metaLikes}</VisuallyHidden>
          <RowStatValue>{formatCompactCount(item.like_count)}</RowStatValue>
        </RowStatCell>
        <RowStatCell>
          <CommentIcon size={16} strokeWidth={1.8} />
          <VisuallyHidden>{metaComments}</VisuallyHidden>
          <RowStatValue>{formatCompactCount(item.comment_count)}</RowStatValue>
        </RowStatCell>
      </RowStatRail>
    </RowLink>
  );
}
