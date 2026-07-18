export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export type AvatarProps = {
  displayName: string | null | undefined;
  avatarUrl?: string | null;
  size?: AvatarSize;
};
