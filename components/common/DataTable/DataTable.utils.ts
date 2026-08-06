import type { TableColumn } from './DataTable.types';

export const toRowKey = (index: number): string => `row-${index}`;

/**
 * 병합 칸 한 개의 판정 결과.
 * - `skip`: 위 줄이 이미 이 칸을 `rowSpan` 으로 덮고 있다 → 이 줄에서는 `<td>` 자체를 그리지 않는다.
 * - `span`: 이 줄이 덮을 줄 수(1이면 병합 없음).
 */
export type MergeSpan = { readonly skip: boolean; readonly span: number };

/**
 * 열의 `mergeKey` 로 **연속한 같은 값**의 rowSpan 표를 만든다.
 *
 * 🔴 순수 함수다 — 렌더 중에 이전 행을 되돌아보는 방식(직전 값 기억 변수)을 쓰지 않는 이유는
 * 그 방식이 리스트 재정렬·필터에서 조용히 틀리기 때문이다. 행 배열 전체를 한 번 훑어
 * "누가 몇 줄을 덮는가"를 먼저 정하고, 렌더는 그 표를 읽기만 한다.
 * ⚠ 병합은 **연속한 것만** 합친다. 같은 키가 떨어져 나타나면 각각 따로 덩어리가 된다 —
 *   정렬 책임은 데이터를 만드는 쪽에 있다(`TableColumn.mergeKey` 주석).
 */
export const buildMergeSpans = <T,>(rows: readonly T[], column: TableColumn<T>): MergeSpan[] => {
  const spans: MergeSpan[] = rows.map(() => ({ skip: false, span: 1 }));
  if (!column.mergeKey) return spans;

  let anchor = 0;
  let run = 0;

  const flush = () => {
    if (run > 0) spans[anchor] = { skip: false, span: run };
  };

  rows.forEach((row, index) => {
    const key = column.mergeKey?.(row) ?? '';
    const previousKey = index > 0 ? (column.mergeKey?.(rows[index - 1] as T) ?? '') : null;

    if (index > 0 && key === previousKey) {
      spans[index] = { skip: true, span: 0 };
      run += 1;
      return;
    }

    flush();
    anchor = index;
    run = 1;
  });

  flush();
  return spans;
};
