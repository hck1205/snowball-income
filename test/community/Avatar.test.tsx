import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '@/components/community';
import { getAvatarInitial } from '@/shared/lib/community';

/**
 * Avatar 는 v2에서 프로필 사진 기능이 폐기되어 `avatar_url` 이 있어도 무시하고 **항상 닉네임 이니셜**만
 * 그린다(단일 지점 통일 — Option A). 소비처가 avatarUrl 을 계속 넘겨도 사진이 새어 나오지 않아야 한다.
 */
describe('Avatar — 이니셜 통일(v2)', () => {
  it('닉네임 첫 글자 이니셜을 렌더한다', () => {
    render(<Avatar displayName="스노우볼러" />);
    expect(screen.getByText(getAvatarInitial('스노우볼러'))).toBeInTheDocument();
  });

  it('avatar_url 이 주어져도 이미지를 렌더하지 않고 이니셜만 보여준다', () => {
    render(<Avatar displayName="Grace" avatarUrl="https://cdn.example/x.webp" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText(getAvatarInitial('Grace'))).toBeInTheDocument();
  });

  it('빈 닉네임은 물음표로 폴백한다', () => {
    render(<Avatar displayName="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
