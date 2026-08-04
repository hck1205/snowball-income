import type { DividendListRow, DividendListSort, DividendListSortKey } from '../../utils';

export type DividendListTableProps = {
  /** 이미 정렬·필터가 끝난 행. 이 컴포넌트는 표시만 한다(상태는 페이지가 소유한다). */
  rows: readonly DividendListRow[];
  caption: string;
  sort: DividendListSort;
  onSortChange: (key: DividendListSortKey) => void;
  /**
   * 실제로 순서를 바꿀 수 있는 열. 여기 없는 열은 버튼이 아니라 글자로 그린다 —
   * 눌러도 아무 일이 없는 컨트롤을 만들지 않는다(`sortableDividendListKeys` 머리말).
   *
   * ⚠ **필터 전 전체 행**으로 계산한 값을 넘겨라. 필터마다 다시 계산하면 열 머리의 버튼이
   *   나타났다 사라진다.
   */
  sortableKeys: readonly DividendListSortKey[];
};
