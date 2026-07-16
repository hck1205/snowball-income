import { useState } from 'react';
import { getAvatarInitial } from '@/shared/lib/community';
import type { AvatarProps } from './Avatar.types';
import { AvatarImage, AvatarRoot } from './Avatar.styled';

/**
 * 작성자 아바타. avatar_url이 있으면 이미지, 없거나 로드 실패면 닉네임 이니셜 원형으로 폴백한다.
 * 옆에 닉네임 텍스트가 함께 오므로 장식으로 취급(`aria-hidden`).
 */
export default function Avatar({ displayName, avatarUrl, size = 'md' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(avatarUrl) && !failed;

  return (
    <AvatarRoot size={size} aria-hidden="true">
      {showImage ? (
        <AvatarImage src={avatarUrl ?? ''} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        getAvatarInitial(displayName)
      )}
    </AvatarRoot>
  );
}
