import { COMMUNITY_COPY, POST_CATEGORY_IDS } from '@/shared/constants/community';
import type { BoardCategoryFilterProps } from './BoardCategoryFilter.types';
import { FilterChip, FilterRow } from './BoardCategoryFilter.styled';

const b = COMMUNITY_COPY.board;

/**
 * 게시판 글 분류 필터 — **전체 + 5개 분류의 다중 토글**.
 *
 * ## All 과 개별의 관계 (화면에서 보이는 규칙)
 * - '전체'는 여섯 번째 분류가 아니라 **조건 없음**이다. 그래서 선택 집합이 비어 있으면 전체가 켜진다.
 * - **'전체'를 누르면 나머지가 전부 꺼진다**(집합을 비운다). 이미 전체인 상태에서 눌러도 전체다 —
 *   되돌릴 수 없는 상태로 빠지지 않는다.
 * - 개별 분류를 누르면 그것만 켜지고 전체는 꺼진 것처럼 보인다. 마지막 하나를 다시 끄면(집합이 비면)
 *   자동으로 전체로 돌아간다 — 아무것도 안 보이는 목록에 갇히지 않는다.
 * - 5개를 전부 켜면 전체와 결과가 같으므로 **전체로 접는다**(계산은 `toggleBoardCategory`).
 *
 * 상태·URL 계약 전문은 `shared/constants/community/boardFilters.ts` 머리말.
 *
 * 🔴 `aria-pressed` 로 켜짐/꺼짐을 말한다 — 색만으로 상태를 말하지 않는다. 분류 낱말은 글쓰기
 * 드롭다운과 **같은 맵**(`write.categoryLabels`)을 써서 두 화면의 표기가 갈리지 않게 한다.
 */
export function BoardCategoryFilter({ categories, onToggle, onSelectAll }: BoardCategoryFilterProps) {
  const isAll = categories.length === 0;

  return (
    <FilterRow role="group" aria-label={b.categoryFilterLabel}>
      <FilterChip type="button" $selected={isAll} aria-pressed={isAll} onClick={onSelectAll}>
        {b.categoryAll}
      </FilterChip>
      {POST_CATEGORY_IDS.map((id) => {
        const selected = categories.includes(id);
        return (
          <FilterChip
            key={id}
            type="button"
            $selected={selected}
            aria-pressed={selected}
            onClick={() => onToggle(id)}
          >
            {COMMUNITY_COPY.write.categoryLabels[id]}
          </FilterChip>
        );
      })}
    </FilterRow>
  );
}
