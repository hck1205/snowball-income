import { describe, expect, it } from 'vitest';
import { AVATAR_BUCKET, avatarStorageFolder } from '@/shared/lib/community';

/**
 * 프로필 사진 기능은 제거됐지만, 회원 탈퇴 시 서버(api/account-delete)가 기존 사용자의 아바타
 * 파일을 청소하려면 버킷 이름과 본인 폴더 규약이 안정적으로 유지돼야 한다(Storage RLS 정합).
 */
describe('아바타 Storage 정리 상수 (서버 탈퇴 전용)', () => {
  it('버킷 이름은 avatars', () => {
    expect(AVATAR_BUCKET).toBe('avatars');
  });

  it('본인 폴더는 userId (첫 세그먼트 = auth.uid())', () => {
    expect(avatarStorageFolder('user-123')).toBe('user-123');
  });
});
