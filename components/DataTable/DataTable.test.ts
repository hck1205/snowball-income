import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import DataTable from './DataTable';

type Row = { name: string; value: number };

describe('DataTable', () => {
  it('renders table content', () => {
    const rows: Row[] = [{ name: 'A', value: 1 }];

    render(
      createElement(DataTable<Row>, {
        columns: [
          { key: 'name', header: '이름', render: (row) => row.name },
          { key: 'value', header: '값', render: (row) => row.value }
        ],
        rows
      })
    );

    expect(screen.getByText('이름')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
