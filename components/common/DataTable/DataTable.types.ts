import type { ReactNode } from 'react';

export type TableColumn<T> = {
  key: keyof T | string;
  header: string;
  render: (row: T) => ReactNode;
  /**
   * **연속한 같은 값을 한 칸으로 합친다**(2026-08-05 신설, 증시 캘린더의 날짜 열).
   *
   * 같은 키를 돌려주는 행이 이어지면 첫 줄만 이 칸을 그리고 `rowSpan` 으로 아래를 덮는다.
   * 합쳐진 칸은 **세로 가운데**에 선다(`vertical-align: middle`).
   *
   * 🔴 **행이 그 키로 정렬돼 있어야 한다.** 이 병합은 "연속한 것"만 합친다 — 정렬이 흐트러지면
   *   같은 날짜가 표에 여러 덩어리로 나뉘어 나타난다(정렬은 데이터를 만드는 쪽의 책임이다).
   * ⚠ 좁은 폭에서 표가 카드로 접히는 화면(DataTable 의 tablet↓ 레이아웃)에서는 병합이 **풀린다** —
   *   카드 한 장이 곧 한 행이라 rowSpan 이 의미를 잃기 때문이다. 그 폭에서는 모든 줄이 자기
   *   날짜를 다시 갖는다(정보가 사라지지 않는 쪽을 택했다).
   */
  mergeKey?: (row: T) => string;
};

export type DataTableProps<T> = {
  caption?: string;
  columns: Array<TableColumn<T>>;
  rows: T[];
};
