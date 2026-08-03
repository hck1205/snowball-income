import type { DividendListRow, DividendListSort, DividendListSortKey } from '../../utils';

export type DividendListTableProps = {
  /** 이미 정렬·필터가 끝난 행. 이 컴포넌트는 표시만 한다(상태는 페이지가 소유한다). */
  rows: readonly DividendListRow[];
  caption: string;
  sort: DividendListSort;
  onSortChange: (key: DividendListSortKey) => void;
};
