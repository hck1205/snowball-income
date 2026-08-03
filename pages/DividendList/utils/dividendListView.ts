import {
  DIVIDEND_LIST_SECTOR_LABEL,
  dividendListPath
} from '@/shared/constants/dividendLists';
import type {
  DividendList,
  DividendListId,
  DividendListMember,
  DividendListSectorId
} from '@/shared/constants/dividendLists';
import { TICKER_PAGE_INDEX, tickerPagePath } from '@/shared/constants/tickerPages';

/**
 * 목록 화면의 **순수 조립 함수**. React 도 DOM 도 모른다 — 정렬·필터가 여기 있어야 테스트가
 * 렌더 없이 계약을 잡을 수 있다(이 레포가 캘린더·포트폴리오에서 쓰는 같은 규율).
 */

/** 정렬 축. 화면의 열 순서와 같다. */
export type DividendListSortKey = 'ticker' | 'name' | 'sector';
export type DividendListSortDirection = 'asc' | 'desc';

export type DividendListSort = {
  key: DividendListSortKey;
  direction: DividendListSortDirection;
};

/** 첫 화면은 티커 오름차순 — 목록의 기본 형태이자 사용자가 종목을 눈으로 찾을 때 가장 빠른 축이다. */
export const DEFAULT_DIVIDEND_LIST_SORT: DividendListSort = { key: 'ticker', direction: 'asc' };

export type DividendListRow = {
  ticker: string;
  name: string;
  sector: DividendListSectorId;
  sectorLabel: string;
  confirmedBy: string[];
  /**
   * 이 종목의 소개 페이지 경로. 소개 글이 **실재할 때만** 채운다 — 없는 페이지로 링크하면
   * 무치환 셸로 떨어지는 죽은 링크가 된다(`shared/constants/tickerPages` 머리말의 같은 근거).
   */
  tickerPagePath: string | null;
};

/**
 * 소개 페이지가 있는 티커 집합. `TICKER_PAGE_INDEX` 는 **의존성 0의 경량 인덱스**라 이걸 읽어도
 * 목록 청크가 티커 서사 텍스트(수백 KB)를 지지 않는다.
 */
const TICKER_PAGE_BY_SYMBOL = new Map<string, string>(
  TICKER_PAGE_INDEX.map((entry) => [entry.symbol, entry.slug])
);

export const toDividendListRow = (member: DividendListMember): DividendListRow => {
  const slug = TICKER_PAGE_BY_SYMBOL.get(member.ticker);
  return {
    ticker: member.ticker,
    name: member.name,
    sector: member.sector,
    sectorLabel: DIVIDEND_LIST_SECTOR_LABEL[member.sector],
    confirmedBy: member.confirmedBy,
    tickerPagePath: slug ? tickerPagePath(slug) : null
  };
};

/**
 * 정렬. 문자열 비교는 `localeCompare` 로 한다 — 섹터 라벨이 한국어라 코드포인트 순서로는
 * 사용자가 기대하는 가나다순이 나오지 않는다.
 *
 * ⚠ **동률은 티커로 깬다.** 섹터로 정렬하면 같은 섹터가 수십 줄인데, 2차 축이 없으면 브라우저·엔진에
 * 따라 순서가 흔들려 "정렬했는데 매번 다르게 보인다"가 된다.
 */
export const sortDividendListRows = (
  rows: readonly DividendListRow[],
  sort: DividendListSort
): DividendListRow[] => {
  const factor = sort.direction === 'asc' ? 1 : -1;
  const value = (row: DividendListRow): string =>
    sort.key === 'ticker' ? row.ticker : sort.key === 'name' ? row.name : row.sectorLabel;

  return [...rows].sort((left, right) => {
    const primary = value(left).localeCompare(value(right), 'ko');
    if (primary !== 0) return primary * factor;
    return left.ticker.localeCompare(right.ticker, 'ko');
  });
};

/**
 * 같은 열을 다시 누르면 방향만 뒤집고, 다른 열을 누르면 **오름차순부터** 시작한다.
 * (다른 열로 옮겼는데 내림차순이 유지되면 사용자는 자기가 무엇을 눌렀는지 잃는다.)
 */
export const nextDividendListSort = (
  current: DividendListSort,
  key: DividendListSortKey
): DividendListSort =>
  current.key === key
    ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : { key, direction: 'asc' };

export type SectorFacet = {
  sector: DividendListSectorId;
  label: string;
  count: number;
};

/**
 * 목록에 **실제로 있는** 섹터만, 종목 수가 많은 순으로. 0종 섹터 칩을 그리지 않는 이유는
 * 누를 수 있어 보이는데 아무 일도 일어나지 않기 때문이다.
 */
export const buildSectorFacets = (rows: readonly DividendListRow[]): SectorFacet[] => {
  const counts = new Map<DividendListSectorId, number>();
  for (const row of rows) counts.set(row.sector, (counts.get(row.sector) ?? 0) + 1);
  return [...counts.entries()]
    .map(([sector, count]) => ({ sector, label: DIVIDEND_LIST_SECTOR_LABEL[sector], count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'ko'));
};

/** `null` = 전체(필터 없음). 필터가 목록을 비우는 것과 목록 자체가 빈 것은 화면에서 다르게 말한다. */
export const filterBySector = (
  rows: readonly DividendListRow[],
  sector: DividendListSectorId | null
): DividendListRow[] => (sector === null ? [...rows] : rows.filter((row) => row.sector === sector));

/** 목록의 기준을 한 줄로. 상한이 있으면 구간으로 말한다(배당챔피언 25~49년). */
export const formatStreakCriterion = (list: DividendList): string =>
  list.maximumStreakYears === undefined
    ? `${list.minimumStreakYears}년 이상`
    : `${list.minimumStreakYears}~${list.maximumStreakYears}년`;

export type DividendListSummary = {
  id: DividendListId;
  path: string;
  count: number;
  asOf: string;
  criterion: string;
};

export const toDividendListSummary = (list: DividendList): DividendListSummary => ({
  id: list.id,
  path: dividendListPath(list.id),
  count: list.members.length,
  asOf: list.asOf,
  criterion: formatStreakCriterion(list)
});
