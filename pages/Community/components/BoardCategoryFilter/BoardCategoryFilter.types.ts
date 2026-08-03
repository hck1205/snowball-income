import type { PostCategory } from '@/shared/lib/supabase';

export type BoardCategoryFilterProps = {
  /**
   * 켜진 분류들. **빈 배열이 곧 '전체'**다(별도 플래그를 두지 않는다 — 두 개면 반드시 어긋난다).
   * 규칙 전문은 `shared/constants/community/boardFilters.ts` 머리말.
   */
  categories: readonly PostCategory[];
  /** 분류 칩 하나를 뒤집는다. 계산은 `toggleBoardCategory` 가 하고 화면은 결과만 전달한다. */
  onToggle: (id: PostCategory) => void;
  /** '전체' 칩 — 선택 집합을 비운다(=조건 없음). */
  onSelectAll: () => void;
};
