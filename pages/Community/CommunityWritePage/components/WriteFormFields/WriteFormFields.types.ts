import type { PostCategory } from '@/shared/lib/supabase';
import type { UsePostComposer } from '../../hooks';

export type WriteFormFieldsProps = {
  composer: UsePostComposer;
  /** 자유게시판 글인가 — 플레이스홀더·힌트 카피 선택에만 쓴다. */
  isBoard: boolean;
  /** 글 종류 드롭다운 선택지(순서 포함) — 컨테이너가 운영자 여부로 접어 내려준 값. */
  categoryOptions: readonly PostCategory[];
};
