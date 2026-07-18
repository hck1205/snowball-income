/**
 * 아바타 Storage 정리 상수 — **서버(회원 탈퇴) 전용**.
 *
 * 프로필 사진 기능은 앱에서 제거됐지만(업로드/표시 안 함), `avatars` 버킷과 avatar_url 컬럼은
 * 하위 호환·역가역을 위해 **그대로 둔다**. 기능 제거 이전에 이미 아바타를 올린 기존 사용자의 파일이
 * 버킷에 남아 있을 수 있으므로, 회원 탈퇴 시 서버(api/account-delete)가 본인 폴더를 청소한다 —
 * 그 청소가 참조하는 값이 아래 둘이다. 순수 상수/문자열 빌더라 Node(서버) 에서 import 해도 안전하다.
 */

/** Storage 버킷 이름. 서버(admin 삭제)가 참조한다. */
export const AVATAR_BUCKET = 'avatars';

/**
 * 본인 폴더 경로. Storage objects 정책과 정합: 첫 폴더 세그먼트가 auth.uid() 여야
 * (썼던) 파일이 본인 것으로 인식돼 탈퇴 시 청소된다.
 */
export const avatarStorageFolder = (userId: string): string => userId;
