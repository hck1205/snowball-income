import type { DataTableProps } from './component.types';
import { toRowKey } from './component.utils';
import { TD, TH, Table, TableWrap } from './component.styled';

export default function DataTable<T>({ columns, rows }: DataTableProps<T>) {
  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            {columns.map((column) => (
              <TH key={String(column.key)}>{column.header}</TH>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={toRowKey(rowIndex)}>
              {columns.map((column) => (
                <TD key={`${toRowKey(rowIndex)}-${String(column.key)}`}>{column.render(row)}</TD>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
