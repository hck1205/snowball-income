import type { ReactNode } from 'react';

export type TableColumn<T> = {
  key: keyof T | string;
  header: string;
  render: (row: T) => ReactNode;
};

export type DataTableProps<T> = {
  caption?: string;
  columns: Array<TableColumn<T>>;
  rows: T[];
};
