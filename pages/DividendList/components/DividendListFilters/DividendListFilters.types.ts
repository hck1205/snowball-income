import type { DividendListFilter, SectorFacet } from '../../utils';

export type DividendListFiltersProps = {
  /** 이 목록에 **실제로 있는** 섹터와 종목 수. 개수는 언제나 목록 전체 기준이다(`buildSectorFacets` 주석). */
  facets: readonly SectorFacet[];
  /** 목록 전체 종목 수. "전체" 칩이 이 숫자를 달아 필터 전 크기를 잃지 않게 한다. */
  totalCount: number;
  filter: DividendListFilter;
  /** 축 하나가 바뀌면 **필터 한 벌**을 통째로 돌려준다 — 화면이 축마다 상태를 쪼개 갖지 않게. */
  onChange: (next: DividendListFilter) => void;
};
