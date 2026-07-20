import { COMMUNITY_COPY, DEFAULT_POST_CATEGORY, toPostCategory } from '@/shared/constants/community';
import { formatCompactCount } from '@/shared/lib/community';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PostListItem } from '@/shared/lib/supabase';
import { HeartIcon } from '@/components/community/CommunityIcons';
import { RelativeTime } from '@/components/community/RelativeTime';
import { VisuallyHidden } from '@/components/community/PostMeta';
import { SimBadge } from '@/components/community/SimBadge';
import { SimSummaryStats } from '@/components/community/SimSummaryStats';
import {
  CategoryBadge,
  LikeInline,
  RowBody,
  RowLink,
  RowStats,
  RowSubInfo,
  RowSubText,
  RowSummary,
  RowTitle,
  RowTitleRow
} from './PostRow.styled';

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
  // 상세 링크는 글의 섹션(kind)을 따른다 — 포트폴리오=/community/portfolio/:id, 게시판=/community/board/:id.
  const detailPath = item.kind === 'board' ? `/community/board/${item.id}` : `/community/portfolio/${item.id}`;

  /**
   * 분류 배지 — 게시판 글에만, 그리고 **기본값('자유')이 아닐 때만** 붙인다.
   * 모든 행에 "자유"를 달면 피드가 배지로 뒤덮여 정작 공지/건의사항이 눈에 안 띈다.
   * 마이그레이션 전(컬럼 부재)에는 값이 undefined → 'free'로 정규화돼 배지가 없다(무해한 폴백).
   */
  const category = toPostCategory(item.category);
  const showCategoryBadge = item.kind === 'board' && category !== DEFAULT_POST_CATEGORY;

  return (
    <RowLink to={detailPath}>
      <RowBody>
        <RowTitleRow>
          {showCategoryBadge ? (
            <CategoryBadge emphasis={category === 'notice'}>
              {COMMUNITY_COPY.write.categoryLabels[category]}
            </CategoryBadge>
          ) : null}
          <RowTitle>{item.title}</RowTitle>
        </RowTitleRow>
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
