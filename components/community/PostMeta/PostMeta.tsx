import { COMMUNITY_COPY } from '@/shared/constants/community';
import { formatCompactCount } from '@/shared/lib/community';
import { CommentIcon, EyeIcon, HeartIcon } from '@/components/community/CommunityIcons';
import type { PostMetaProps } from './PostMeta.types';
import { MetaItem, MetaRow, VisuallyHidden } from './PostMeta.styled';

const { metaViews, metaLikes, metaComments } = COMMUNITY_COPY.gallery;

/**
 * 조회/좋아요/댓글 메타 숫자. 아이콘 + 숨김 라벨을 병기해 색/모양만으로 의미를 전달하지 않는다.
 */
export default function PostMeta({ viewCount, likeCount, commentCount, hideViews }: PostMetaProps) {
  return (
    <MetaRow>
      <MetaItem>
        <HeartIcon size={14} />
        <VisuallyHidden>{metaLikes}</VisuallyHidden>
        {formatCompactCount(likeCount)}
      </MetaItem>
      <MetaItem>
        <CommentIcon size={14} />
        <VisuallyHidden>{metaComments}</VisuallyHidden>
        {formatCompactCount(commentCount)}
      </MetaItem>
      {hideViews ? null : (
        <MetaItem>
          <EyeIcon size={14} />
          <VisuallyHidden>{metaViews}</VisuallyHidden>
          {formatCompactCount(viewCount)}
        </MetaItem>
      )}
    </MetaRow>
  );
}
