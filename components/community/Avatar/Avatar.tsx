import { getAvatarInitial } from '@/shared/lib/community';
import type { AvatarProps } from './Avatar.types';
import { AvatarRoot } from './Avatar.styled';

/**
 * 작성자 아바타. 프로필 사진 기능 폐기(v2)에 따라 `avatarUrl`을 무시하고 **항상 닉네임 이니셜**만 그린다.
 * 옆에 닉네임 텍스트가 함께 오므로 장식으로 취급(`aria-hidden`).
 * (`avatarUrl` prop 은 소비처 호환을 위해 타입에 남지만 렌더에는 쓰지 않는다.)
 */
export default function Avatar({ displayName, size = 'md' }: AvatarProps) {
  return (
    <AvatarRoot size={size} aria-hidden="true">
      {getAvatarInitial(displayName)}
    </AvatarRoot>
  );
}
