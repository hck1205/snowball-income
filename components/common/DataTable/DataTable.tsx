import type { DataTableProps } from './DataTable.types';
import { buildMergeSpans, toRowKey } from './DataTable.utils';
import { TD, TH, Table, TableWrap } from './DataTable.styled';

/**
 * 읽는 면의 표 한 벌.
 *
 * ## 날짜 병합(`column.mergeKey`)
 * 연속한 같은 값을 한 칸으로 합쳐 `rowSpan` 으로 덮는다 — 증시 캘린더처럼 **한 날짜에 여러 줄**이
 * 달리는 표에서 같은 날짜가 세 번 네 번 반복되는 것을 없앤다. 판정은 `buildMergeSpans` 가
 * 렌더 전에 한 번에 하고(순수 함수), 여기서는 그 표를 읽기만 한다.
 * ⚠ 좁은 폭에서 표가 카드로 접히면 `rowSpan` 은 시각적으로 무의미해진다 — 그 폭에서는 스타일이
 *   병합 칸을 각 카드에 다시 보이게 한다(`DataTable.styled` 의 tablet↓ 규칙).
 */
export default function DataTable<T>({ caption, columns, rows }: DataTableProps<T>) {
  /* 열마다 "누가 몇 줄을 덮는가" 표. mergeKey 가 없는 열은 전부 span 1 이라 비용이 사실상 0 이다. */
  const spansByColumn = columns.map((column) => buildMergeSpans(rows, column));

  return (
    <TableWrap>
      <Table>
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <TH key={String(column.key)} scope="col">
                {column.header}
              </TH>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={toRowKey(rowIndex)}>
              {columns.map((column, columnIndex) => {
                const merge = spansByColumn[columnIndex]?.[rowIndex] ?? { skip: false, span: 1 };

                /*
                 * 위 줄이 rowSpan 으로 덮은 칸. 넓은 폭에서는 **그려지지 않아야** 표가 밀리지 않지만,
                 * 좁은 폭에서 표가 카드로 접히면 이 줄만 날짜가 없는 카드가 된다. 그래서 칸은
                 * 내보내되 스타일이 넓은 폭에서 display:none 으로 걷어 간다(DataTable.styled 주석).
                 */
                if (merge.skip) {
                  return (
                    <TD
                      key={`${toRowKey(rowIndex)}-${String(column.key)}`}
                      data-label={column.header}
                      data-merge-repeat="true"
                    >
                      {column.render(row)}
                    </TD>
                  );
                }

                return (
                  <TD
                    key={`${toRowKey(rowIndex)}-${String(column.key)}`}
                    data-label={column.header}
                    data-merged={merge.span > 1 ? 'true' : undefined}
                    rowSpan={merge.span > 1 ? merge.span : undefined}
                  >
                    {column.render(row)}
                  </TD>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
