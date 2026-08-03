// @vitest-environment node — 순수 함수 테스트(DOM 불필요).
import { describe, expect, it } from 'vitest';
import { DIVIDEND_LISTS } from '@/shared/constants/dividendLists';
import {
  DEFAULT_DIVIDEND_LIST_SORT,
  buildSectorFacets,
  filterBySector,
  formatStreakCriterion,
  nextDividendListSort,
  sortDividendListRows,
  toDividendListRow
} from '@/pages/DividendList/utils';
import type { DividendListRow } from '@/pages/DividendList/utils';

const row = (ticker: string, name: string, sector: DividendListRow['sector'], sectorLabel: string): DividendListRow => ({
  ticker,
  name,
  sector,
  sectorLabel,
  confirmedBy: ['테스트 자료'],
  tickerPagePath: null
});

const ROWS: DividendListRow[] = [
  row('KO', 'Coca-Cola Co', 'consumerStaples', '필수소비재'),
  row('AWR', 'American States Water', 'utilities', '유틸리티'),
  row('DOV', 'Dover Corp', 'industrials', '산업재'),
  row('PG', 'Procter & Gamble', 'consumerStaples', '필수소비재')
];

describe('정렬', () => {
  it('기본은 티커 오름차순이다', () => {
    expect(DEFAULT_DIVIDEND_LIST_SORT).toEqual({ key: 'ticker', direction: 'asc' });
    expect(sortDividendListRows(ROWS, DEFAULT_DIVIDEND_LIST_SORT).map((r) => r.ticker)).toEqual([
      'AWR',
      'DOV',
      'KO',
      'PG'
    ]);
  });

  it('방향을 뒤집으면 순서가 뒤집힌다', () => {
    expect(sortDividendListRows(ROWS, { key: 'ticker', direction: 'desc' }).map((r) => r.ticker)).toEqual([
      'PG',
      'KO',
      'DOV',
      'AWR'
    ]);
  });

  it('종목명으로도 정렬된다', () => {
    expect(sortDividendListRows(ROWS, { key: 'name', direction: 'asc' }).map((r) => r.ticker)).toEqual([
      'AWR',
      'KO',
      'DOV',
      'PG'
    ]);
  });

  it('🔴 섹터 정렬의 동률은 티커로 깨진다 — 누를 때마다 순서가 흔들리지 않게', () => {
    // 한국어 가나다순: 산업재 < 유틸리티 < 필수소비재. 필수소비재가 둘(KO·PG)인데,
    // 2차 축이 없으면 그 둘의 순서가 엔진에 따라 달라진다.
    expect(sortDividendListRows(ROWS, { key: 'sector', direction: 'asc' }).map((r) => r.ticker)).toEqual([
      'DOV',
      'AWR',
      'KO',
      'PG'
    ]);
  });

  it('원본 배열을 건드리지 않는다', () => {
    const before = ROWS.map((r) => r.ticker);
    sortDividendListRows(ROWS, { key: 'name', direction: 'desc' });
    expect(ROWS.map((r) => r.ticker)).toEqual(before);
  });

  it('같은 열을 다시 누르면 방향만 뒤집고, 다른 열은 오름차순부터 시작한다', () => {
    const first = nextDividendListSort({ key: 'ticker', direction: 'asc' }, 'ticker');
    expect(first).toEqual({ key: 'ticker', direction: 'desc' });
    // 🔴 열을 옮겼는데 내림차순이 유지되면 사용자는 자기가 무엇을 눌렀는지 잃는다.
    expect(nextDividendListSort(first, 'name')).toEqual({ key: 'name', direction: 'asc' });
  });
});

describe('섹터 필터', () => {
  it('목록에 실제로 있는 섹터만, 많은 순으로 준다', () => {
    const facets = buildSectorFacets(ROWS);
    expect(facets[0]).toEqual({ sector: 'consumerStaples', label: '필수소비재', count: 2 });
    expect(facets.map((f) => f.sector)).not.toContain('energy');
    expect(facets.reduce((sum, f) => sum + f.count, 0)).toBe(ROWS.length);
  });

  it('null 은 전체를 뜻한다', () => {
    expect(filterBySector(ROWS, null)).toHaveLength(4);
    expect(filterBySector(ROWS, 'consumerStaples').map((r) => r.ticker)).toEqual(['KO', 'PG']);
  });
});

describe('기준 문구', () => {
  it('상한이 없으면 "N년 이상", 있으면 구간으로 말한다', () => {
    expect(formatStreakCriterion(DIVIDEND_LISTS.kings)).toBe('50년 이상');
    expect(formatStreakCriterion(DIVIDEND_LISTS.aristocrats)).toBe('25년 이상');
    expect(formatStreakCriterion(DIVIDEND_LISTS.champions)).toBe('25~49년');
  });
});

describe('행 모델', () => {
  it('소개 페이지가 있는 티커만 링크 경로를 갖는다', () => {
    // KO 는 `/ticker/ko` 소개 글이 있고, 대부분의 목록 종목은 없다. 없는 페이지로 링크하면 죽은 링크다.
    const ko = DIVIDEND_LISTS.kings.members.find((member) => member.ticker === 'KO');
    expect(ko).toBeDefined();
    expect(toDividendListRow(ko!).tickerPagePath).toBe('/ticker/ko');

    const awr = DIVIDEND_LISTS.kings.members.find((member) => member.ticker === 'AWR');
    expect(awr).toBeDefined();
    expect(toDividendListRow(awr!).tickerPagePath).toBeNull();
  });
});
