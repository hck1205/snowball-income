import { DIVIDEND_LIST_COPY } from '../../copy';
import type { DividendListSortKey } from '../../utils';
import type { DividendListTableProps } from './DividendListTable.types';
import {
  ConfirmedBy,
  EmptyRowCell,
  SectorTag,
  SortButton,
  SortGlyph,
  TD,
  TH,
  Table,
  TableWrap,
  TickerCell,
  TickerLink
} from './DividendListTable.styled';

const copy = DIVIDEND_LIST_COPY.page;

/** 열 정의. `key` 는 정렬 축이자 `data-label`(좁은 폭에서 행 카드의 라벨)의 출처다. */
const COLUMNS: Array<{ key: DividendListSortKey; header: string }> = [
  { key: 'ticker', header: copy.columnTicker },
  { key: 'name', header: copy.columnName },
  { key: 'sector', header: copy.columnSector }
];

/**
 * 목록 표 — 티커·종목명·섹터로 정렬할 수 있다.
 *
 * 접근성 계약 두 가지:
 *  1. `aria-sort` 를 **현재 정렬 중인 열에만** 붙인다(WAI-ARIA: 표당 하나여야 한다).
 *  2. 방향은 색이 아니라 **글리프 + `aria-sort` 값**이 말한다. 색 단독 채널은 이 레포가 반복해서
 *     금지해 온 것이다.
 */
export default function DividendListTable({ rows, caption, sort, onSortChange }: DividendListTableProps) {
  return (
    <TableWrap>
      <Table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => {
              const active = sort.key === column.key;
              const directionLabel = sort.direction === 'asc' ? copy.sortAscLabel : copy.sortDescLabel;
              return (
                <TH
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <SortButton
                    type="button"
                    $active={active}
                    onClick={() => onSortChange(column.key)}
                    /* 버튼 이름에 현재 방향을 담는다 — 화살표 글리프는 aria-hidden 이라 이름에 안 들어온다. */
                    aria-label={active ? `${column.header} (${directionLabel})` : column.header}
                  >
                    {column.header}
                    <SortGlyph $active={active} aria-hidden>
                      {active ? (sort.direction === 'asc' ? '▲' : '▼') : '▾'}
                    </SortGlyph>
                  </SortButton>
                </TH>
              );
            })}
            <TH scope="col">
              {/* 확인 자료 열은 정렬 축이 아니다 — 목록 전체가 같은 자료라 정렬해도 순서가 안 바뀐다. */}
              <SortButton as="span" $active={false}>
                {copy.columnConfirmedBy}
              </SortButton>
            </TH>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <EmptyRowCell colSpan={COLUMNS.length + 1}>{copy.filteredEmpty}</EmptyRowCell>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.ticker}>
                <TickerCell data-label={copy.columnTicker}>
                  {/* 소개 페이지가 실재할 때만 링크한다(없는 페이지로 보내지 않는다). */}
                  {row.tickerPagePath ? (
                    <TickerLink to={row.tickerPagePath} title={copy.tickerPageLinkTitle}>
                      {row.ticker}
                    </TickerLink>
                  ) : (
                    row.ticker
                  )}
                </TickerCell>
                <TD data-label={copy.columnName}>{row.name}</TD>
                <TD data-label={copy.columnSector}>
                  <SectorTag>{row.sectorLabel}</SectorTag>
                </TD>
                <TD data-label={copy.columnConfirmedBy}>
                  <ConfirmedBy>{row.confirmedBy.join(' · ')}</ConfirmedBy>
                </TD>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </TableWrap>
  );
}
