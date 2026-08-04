import { DIVIDEND_LIST_COPY } from '../../copy';
import type { DividendListRow, DividendListSortKey, DividendListUnknownReason } from '../../utils';
import type { DividendListTableProps } from './DividendListTable.types';
import {
  EmptyRowCell,
  GrowthValue,
  NumberCell,
  NumberTH,
  ScreenReaderOnly,
  SectorTag,
  SortButton,
  SortGlyph,
  StreakQualifier,
  StreakValue,
  TD,
  TH,
  Table,
  TableWrap,
  TickerCell,
  TickerLink,
  UnknownMark
} from './DividendListTable.styled';

const copy = DIVIDEND_LIST_COPY.page;

/**
 * 열 정의. `key` 는 정렬 축이자 `data-label`(좁은 폭에서 행 카드의 라벨)의 출처다.
 * `numeric` 인 열은 넓은 폭에서 오른쪽 정렬한다(머리와 값이 같은 축에 선다).
 *
 * 🔴 **여기 있는 것이 표의 전부다**(2026-08-04). 종전에는 이 배열 밖에 "확인한 자료" 열이 하나 더
 * 손으로 그려져 있었다 — 정렬 축이 아니라는 이유였는데, 그 탓에 "열이 몇 개인가"의 답이 두 곳으로
 * 갈려 `colSpan`·`min-width` 가 조용히 어긋날 수 있었다. 그 열은 값이 목록 안에서 전 종목 동일해
 * (46~83줄이 같은 문자열) 제거했고, 같은 사실은 "출처와 기준일" 섹션이 목록당 한 번 말한다.
 * 새 열이 필요하면 **이 배열에만** 넣어라.
 */
const COLUMNS: Array<{ key: DividendListSortKey; header: string; numeric: boolean }> = [
  { key: 'ticker', header: copy.columnTicker, numeric: false },
  { key: 'name', header: copy.columnName, numeric: false },
  { key: 'yield', header: copy.columnYield, numeric: true },
  { key: 'streak', header: copy.columnStreak, numeric: true },
  { key: 'growth', header: copy.columnGrowth, numeric: true },
  { key: 'sector', header: copy.columnSector, numeric: false }
];

/** 표에서 값이 없는 칸을 그리는 **단 하나의** 방법. 세 화면 채널(기호·툴팁·보조기술)이 같은 사실을 말한다. */
function Unknown({ reason }: { reason: DividendListUnknownReason }) {
  const sentence = copy.unknownReason[reason];
  return (
    <UnknownMark title={sentence}>
      <span aria-hidden>{copy.unknownMark}</span>
      <ScreenReaderOnly>{sentence}</ScreenReaderOnly>
    </UnknownMark>
  );
}

/** 연속 증배 칸. 하한("50년 이상")과 정확값을 **다른 모양**으로 그리는 게 이 함수의 존재 이유다. */
function Streak({ streak }: { streak: DividendListRow['streak'] }) {
  if (!streak.known) return <Unknown reason={streak.reason} />;
  const exact = streak.kind === 'exact';
  /* 정확값에는 근거를 함께 매단다 — 출처 없는 숫자를 화면에 세우지 않는다는 레포 규율. */
  const title = exact
    ? streak.source
      ? `${copy.streakExactTitle} (${streak.source})`
      : copy.streakExactTitle
    : copy.streakBoundTitle;
  return (
    <StreakValue $exact={exact} title={title}>
      {streak.text}
      {streak.qualifier ? <StreakQualifier>{streak.qualifier}</StreakQualifier> : null}
    </StreakValue>
  );
}

/**
 * 목록 표 — 티커·종목명·배당률·연속 증배·5년 배당성장·섹터로 정렬할 수 있다.
 *
 * 접근성 계약 세 가지:
 *  1. `aria-sort` 를 **현재 정렬 중인 열에만** 붙인다(WAI-ARIA: 표당 하나여야 한다).
 *  2. 방향은 색이 아니라 **글리프 + `aria-sort` 값**이 말한다. 색 단독 채널은 이 레포가 반복해서
 *     금지해 온 것이다. 같은 이유로 성장률의 부호도 텍스트(`+`/`-`)가 먼저 말하고 색은 보조다.
 *  3. 값이 없는 칸은 "—" 만 남기지 않고 이유 문장을 `title` 과 보조기술 텍스트로 함께 준다 —
 *     빈칸을 "0" 이나 "해당 없음"으로 읽히게 두지 않는다.
 */
export default function DividendListTable({
  rows,
  caption,
  sort,
  onSortChange,
  sortableKeys
}: DividendListTableProps) {
  return (
    <TableWrap>
      <Table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => {
              const active = sort.key === column.key;
              const sortable = sortableKeys.includes(column.key);
              const directionLabel = sort.direction === 'asc' ? copy.sortAscLabel : copy.sortDescLabel;
              const HeaderCell = column.numeric ? NumberTH : TH;
              return (
                <HeaderCell
                  key={column.key}
                  scope="col"
                  aria-sort={
                    active && sortable ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {sortable ? (
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
                  ) : (
                    /* 값이 전부 같은 열은 버튼이 아니다 — 눌러도 순서가 안 바뀌는 컨트롤을 만들지 않는다. */
                    <SortButton as="span" $active={false} title={copy.sortUnavailableLabel}>
                      {column.header}
                    </SortButton>
                  )}
                </HeaderCell>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <EmptyRowCell colSpan={COLUMNS.length}>{copy.filteredEmpty}</EmptyRowCell>
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
                <NumberCell data-label={copy.columnYield}>
                  {row.yield.known ? row.yield.text : <Unknown reason={row.yield.reason} />}
                </NumberCell>
                <NumberCell data-label={copy.columnStreak}>
                  <Streak streak={row.streak} />
                </NumberCell>
                <NumberCell data-label={copy.columnGrowth}>
                  {row.growth.known ? (
                    <GrowthValue $direction={row.growth.direction}>{row.growth.text}</GrowthValue>
                  ) : (
                    <Unknown reason={row.growth.reason} />
                  )}
                </NumberCell>
                <TD data-label={copy.columnSector}>
                  {row.sectorLabel === null ? (
                    <Unknown reason="sectorSource" />
                  ) : (
                    <SectorTag>{row.sectorLabel}</SectorTag>
                  )}
                </TD>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </TableWrap>
  );
}
