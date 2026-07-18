import { COMMUNITY_COPY } from '@/shared/constants/community';
import { formatCompactCount } from '@/shared/lib/community';
import { HeartIcon } from '@/components/community/CommunityIcons';
import type { LikeButtonProps } from './LikeButton.types';
import { LikeRoot } from './LikeButton.styled';

/**
 * 좋아요 토글. 채움/외곽선을 아이콘 형태로 구분하고 `aria-pressed`로 상태를 전달한다(색만 X).
 */
export default function LikeButton({ liked, count, onToggle, disabled, size = 'sm' }: LikeButtonProps) {
  return (
    <LikeRoot
      type="button"
      liked={liked}
      size={size}
      aria-pressed={liked}
      aria-label={liked ? COMMUNITY_COPY.detail.likeActiveAria : COMMUNITY_COPY.detail.likeAria}
      disabled={disabled}
      onClick={onToggle}
    >
      <HeartIcon size={size === 'md' ? 18 : 15} filled={liked} />
      {formatCompactCount(count)}
    </LikeRoot>
  );
}
