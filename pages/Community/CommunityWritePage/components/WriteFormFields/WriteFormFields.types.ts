import type { UsePostComposer } from '../../hooks';

export type WriteFormFieldsProps = {
  composer: UsePostComposer;
  /** 자유게시판 글인가 — 플레이스홀더·힌트 카피 선택에만 쓴다. */
  isBoard: boolean;
};
