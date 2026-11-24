export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export type AvatarProps = {
  displayName: string | null | undefined;
  avatarUrl?: string | null;
  /** 작성자 id. AI 리포터 계정이면 이니셜 대신 윙크 하마를 그린다(2026-11-25). 없으면 이니셜. */
  authorId?: string | null;
  size?: AvatarSize;
};
