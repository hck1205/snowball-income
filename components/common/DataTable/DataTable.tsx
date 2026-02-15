import type { DataTableProps } from './DataTable.types';
import { toRowKey } from './DataTable.utils';
import { TD, TH, Table, TableWrap } from './DataTable.styled';

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
                <TD key={`${toRowKey(rowIndex)}-${String(column.key)}`} data-label={column.header}>
                  {column.render(row)}
                </TD>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
