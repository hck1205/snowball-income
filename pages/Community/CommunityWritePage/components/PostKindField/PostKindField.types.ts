import type { PostCategory } from '@/shared/lib/supabase';

export type PostKindFieldProps = {
  value: PostCategory;
  onChange: (category: PostCategory) => void;
  /** 글 종류 드롭다운 선택지(순서 포함) — 컨테이너가 운영자 여부로 접어 내려준 값. */
  options: readonly PostCategory[];
};
