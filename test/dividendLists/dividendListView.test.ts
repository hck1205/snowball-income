// @vitest-environment node — 순수 함수 테스트(DOM 불필요).
import { describe, expect, it } from 'vitest';
import { DIVIDEND_LISTS } from '@/shared/constants/dividendLists';
import type { DividendList, DividendListMember } from '@/shared/constants/dividendLists';
import {
  DEFAULT_DIVIDEND_LIST_SORT,
  DIVIDEND_LIST_GROWTH_STEPS,
  DIVIDEND_LIST_YIELD_STEPS,
  NO_DIVIDEND_LIST_FILTER,
  buildSectorFacets,
  countRowsHiddenByUnknown,
  filterDividendListRows,
  formatStreakCriterion,
  isDividendListFiltered,
  latestMeasuredAt,
  nextDividendListSort,
  sortDividendListRows,
  sortableDividendListKeys,
  toDividendListRow,
  toDividendListRows,
  toggleDividendListSector,
  usesWikipediaSource
} from '@/pages/DividendList/utils';
import type {
  DividendListFilter,
  DividendListMemberLike,
  DividendListRow
} from '@/pages/DividendList/utils';

const row = (
  ticker: string,
  name: string,
  sector: DividendListRow['sector'],
  sectorLabel: string | null,
  overrides: Partial<DividendListRow> = {}
): DividendListRow => ({
  ticker,
  name,
  sector,
  sectorLabel,
  yield: { known: false, reason: 'notMeasured' },
  streak: { known: true, kind: 'atLeast', text: '50년', qualifier: '이상', value: 50, source: null },
  growth: { known: false, reason: 'notMeasured' },
  measuredAt: null,
  tickerPagePath: null,
  ...overrides
});

const ROWS: DividendListRow[] = [
  row('KO', 'Coca-Cola Co', 'consumerStaples', '필수소비재'),
  row('AWR', 'American States Water', 'utilities', '유틸리티'),
  row('DOV', 'Dover Corp', 'industrials', '산업재'),
  row('PG', 'Procter & Gamble', 'consumerStaples', '필수소비재')
];

/** 지표가 붙은 행. 값이 있는 경우/없는 경우가 한 표에 섞이는 실제 형태를 재현한다. */
const METRIC_ROWS: DividendListRow[] = [
  row('KO', 'Coca-Cola Co', 'consumerStaples', '필수소비재', {
    yield: { known: true, text: '2.44%', value: 2.441 },
    growth: { known: true, text: '+4.46%', value: 4.46, direction: 'up' },
    measuredAt: '2026-08-04'
  }),
  row('PG', 'Procter & Gamble', 'consumerStaples', '필수소비재', {
    yield: { known: true, text: '3.01%', value: 3.005 },
    growth: { known: false, reason: 'growthHistory' },
    measuredAt: '2026-08-01'
  }),
  row('WRB', 'W. R. Berkley', 'financials', '금융', {
    yield: { known: false, reason: 'irregularPayout' },
    growth: { known: true, text: '-1.20%', value: -1.2, direction: 'down' }
  }),
  row('YORW', 'York Water', null, null, {
    yield: { known: true, text: '1.90%', value: 1.9 },
    growth: { known: true, text: '+3.90%', value: 3.9, direction: 'up' }
  })
];

/** 목록 기준만 바꾼 최소 목록. 연속 증배 칸이 목록에서 파생된다는 계약을 이걸로 잰다. */
const listOf = (member: DividendListMember, extra: Partial<DividendList> = {}): DividendList => ({
  id: 'kings',
  minimumStreakYears: 50,
  asOf: '2026-08-01',
  sources: [],
  coverageNote: '',
  members: [member],
  ...extra
});

const MEMBER: DividendListMember = {
  ticker: 'KO',
  name: 'Coca-Cola Co',
  sector: 'consumerStaples',
  sourceSectorLabel: 'Consumer Staples',
  confirmedBy: ['테스트 자료']
};

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

  it('배당률은 숫자로 정렬된다 — 문자열 비교면 "10.86%" 가 "2.44%" 앞에 온다', () => {
    const rows = [
      row('A', 'A', 'utilities', '유틸리티', { yield: { known: true, text: '2.44%', value: 2.441 } }),
      row('B', 'B', 'utilities', '유틸리티', { yield: { known: true, text: '10.86%', value: 10.861 } }),
      row('C', 'C', 'utilities', '유틸리티', { yield: { known: true, text: '0.15%', value: 0.147 } })
    ];
    expect(sortDividendListRows(rows, { key: 'yield', direction: 'asc' }).map((r) => r.ticker)).toEqual([
      'C',
      'A',
      'B'
    ]);
  });

  it('5년 성장률은 음수까지 숫자로 정렬된다', () => {
    expect(sortDividendListRows(METRIC_ROWS, { key: 'growth', direction: 'desc' }).map((r) => r.ticker)).toEqual([
      'KO', // +4.46
      'YORW', // +3.90
      'WRB', // -1.20
      'PG' // 값 없음 → 맨 아래
    ]);
  });

  it('🔴 값이 없는 줄은 방향과 무관하게 맨 아래다 — 내림차순에서 "—" 가 표 머리를 채우면 정렬이 쓸모없다', () => {
    const asc = sortDividendListRows(METRIC_ROWS, { key: 'yield', direction: 'asc' });
    const desc = sortDividendListRows(METRIC_ROWS, { key: 'yield', direction: 'desc' });
    expect(asc[asc.length - 1].ticker).toBe('WRB');
    expect(desc[desc.length - 1].ticker).toBe('WRB');
    // 나머지는 실제로 뒤집혀야 한다(전부 아래로 밀어 버리는 뮤턴트 방지).
    expect(asc[0].ticker).toBe('YORW');
    expect(desc[0].ticker).toBe('PG');
  });

  it('섹터를 모르는 줄도 맨 아래로 간다', () => {
    const asc = sortDividendListRows(METRIC_ROWS, { key: 'sector', direction: 'asc' });
    const desc = sortDividendListRows(METRIC_ROWS, { key: 'sector', direction: 'desc' });
    expect(asc[asc.length - 1].ticker).toBe('YORW');
    expect(desc[desc.length - 1].ticker).toBe('YORW');
  });
});

describe('정렬 가능한 열', () => {
  it('값이 실제로 갈리는 열만 정렬 축이 된다', () => {
    const keys = sortableDividendListKeys(METRIC_ROWS, ['ticker', 'name', 'yield', 'streak', 'growth', 'sector']);
    expect(keys).toContain('ticker');
    expect(keys).toContain('yield');
    expect(keys).toContain('growth');
    expect(keys).toContain('sector');
  });

  it('🔴 한 목록 안에서 값이 전부 같은 열은 정렬 축에서 빠진다 — 눌러도 안 바뀌는 버튼을 만들지 않는다', () => {
    // 배당킹은 모든 줄이 "50년 이상"이다(하한은 종목이 아니라 목록이 준다).
    expect(sortableDividendListKeys(METRIC_ROWS, ['streak'])).toEqual([]);
    const varied = [
      ...METRIC_ROWS,
      row('X', 'X', 'utilities', '유틸리티', {
        streak: { known: true, kind: 'exact', text: '68년', qualifier: null, value: 68, source: '테스트 근거' }
      })
    ];
    expect(sortableDividendListKeys(varied, ['streak'])).toEqual(['streak']);
  });

  it('빈 목록에서는 어떤 열도 정렬 축이 아니다', () => {
    expect(sortableDividendListKeys([], ['ticker', 'yield'])).toEqual([]);
  });
});

describe('섹터 필터', () => {
  it('목록에 실제로 있는 섹터만, 많은 순으로 준다', () => {
    const facets = buildSectorFacets(ROWS);
    expect(facets[0]).toEqual({ sector: 'consumerStaples', label: '필수소비재', count: 2 });
    expect(facets.map((f) => f.sector)).not.toContain('energy');
    expect(facets.reduce((sum, f) => sum + f.count, 0)).toBe(ROWS.length);
  });

  it('🔴 섹터를 모르는 종목은 칩을 만들지 않는다 — 자료의 구멍이 하나의 섹터처럼 읽히면 안 된다', () => {
    const facets = buildSectorFacets(METRIC_ROWS);
    expect(facets.reduce((sum, f) => sum + f.count, 0)).toBe(METRIC_ROWS.length - 1);
    expect(facets.some((f) => f.label === null)).toBe(false);
  });

});

/**
 * 세 축 필터(배당률 · 5년 배당성장 · 섹터).
 *
 * 잠그는 것:
 *  ① 세 축은 **AND**, 섹터 축 안에서는 **OR**.
 *  ② 🔴 값이 없는 줄은 "이상" 조건을 통과하지 못한다 — 모르는 값을 0 으로도 통과로도 읽지 않는다.
 *  ③ 그렇게 빠진 줄의 수를 셀 수 있다(화면이 그 숫자를 말해야 조용히 사라지지 않는다).
 *  ④ 눈금이 **실제 분포에 맞는다** — 세 목록 어디서도 눌렀을 때 표가 사라지지 않는다.
 */
describe('세 축 필터', () => {
  const filterOf = (overrides: Partial<DividendListFilter> = {}): DividendListFilter => ({
    ...NO_DIVIDEND_LIST_FILTER,
    ...overrides
  });
  const tickersOf = (filter: DividendListFilter) =>
    filterDividendListRows(METRIC_ROWS, filter).map((r) => r.ticker);

  it('아무 축도 안 걸면 전부 남는다', () => {
    expect(isDividendListFiltered(NO_DIVIDEND_LIST_FILTER)).toBe(false);
    expect(tickersOf(NO_DIVIDEND_LIST_FILTER)).toEqual(METRIC_ROWS.map((r) => r.ticker));
  });

  it('🔴 "이상" 조건은 값이 낮은 줄과 **값이 없는 줄**을 함께 뺀다', () => {
    // KO 2.44 · PG 3.01 남고, YORW 1.90(낮다)·WRB(값 없음)은 빠진다.
    expect(tickersOf(filterOf({ minYieldPercent: 2 }))).toEqual(['KO', 'PG']);
    // 성장 축도 같다 — PG 는 성장률이 없어 빠진다(0% 로 읽지 않는다).
    expect(tickersOf(filterOf({ minGrowthPercent: 3 }))).toEqual(['KO', 'YORW']);
  });

  it('세 축은 AND 로 겹친다', () => {
    expect(tickersOf(filterOf({ minYieldPercent: 2, sectors: ['consumerStaples'] }))).toEqual(['KO', 'PG']);
    // 여기에 성장 축까지 얹으면 성장률이 없는 PG 가 빠진다.
    expect(
      tickersOf(filterOf({ minYieldPercent: 2, minGrowthPercent: 3, sectors: ['consumerStaples'] }))
    ).toEqual(['KO']);
  });

  it('섹터는 여러 개를 고르면 OR 로 묶인다', () => {
    expect(tickersOf(filterOf({ sectors: ['consumerStaples'] }))).toEqual(['KO', 'PG']);
    expect(tickersOf(filterOf({ sectors: ['consumerStaples', 'financials'] }))).toEqual(['KO', 'PG', 'WRB']);
    // 섹터를 모르는 줄은 어떤 섹터 칩에도 걸리지 않는다(자료의 구멍은 분류가 아니다).
    expect(tickersOf(filterOf({ sectors: ['consumerStaples', 'financials'] }))).not.toContain('YORW');
  });

  it('🔴 값이 없어 빠진 줄을 셀 수 있다 — 조용히 사라지면 목록이 틀린 것으로 읽힌다', () => {
    // 배당률 축만 켜면 값이 없는 WRB 한 줄. YORW 는 값이 있는데 낮아서 빠진 것이라 세지 않는다.
    expect(countRowsHiddenByUnknown(METRIC_ROWS, filterOf({ minYieldPercent: 2 }))).toBe(1);
    // 성장 축만 켜면 값이 없는 PG 한 줄.
    expect(countRowsHiddenByUnknown(METRIC_ROWS, filterOf({ minGrowthPercent: 3 }))).toBe(1);
    // 섹터로 이미 빠진 줄은 세지 않는다 — 세면 "값이 없어 제외됐다"는 숫자가 부풀려진다.
    expect(
      countRowsHiddenByUnknown(METRIC_ROWS, filterOf({ minYieldPercent: 2, sectors: ['consumerStaples'] }))
    ).toBe(0);
    // 축이 꺼져 있으면 값이 없어도 아무도 빠지지 않는다.
    expect(countRowsHiddenByUnknown(METRIC_ROWS, NO_DIVIDEND_LIST_FILTER)).toBe(0);
  });

  it('섹터 토글은 켜고 끄며 **누른 순서를 보존한다**', () => {
    const once = toggleDividendListSector([], 'utilities');
    expect(once).toEqual(['utilities']);
    const twice = toggleDividendListSector(once, 'financials');
    expect(twice).toEqual(['utilities', 'financials']);
    expect(toggleDividendListSector(twice, 'utilities')).toEqual(['financials']);
  });

  it('🔴 눈금은 실제 분포에 맞는다 — 어느 목록에서도 눌렀을 때 표가 사라지지 않는다', () => {
    for (const list of Object.values(DIVIDEND_LISTS)) {
      const rows = toDividendListRows(list);
      for (const step of DIVIDEND_LIST_YIELD_STEPS) {
        expect(filterDividendListRows(rows, filterOf({ minYieldPercent: step })).length).toBeGreaterThanOrEqual(3);
      }
      for (const step of DIVIDEND_LIST_GROWTH_STEPS) {
        expect(filterDividendListRows(rows, filterOf({ minGrowthPercent: step })).length).toBeGreaterThanOrEqual(3);
      }
      // 가장 센 조합(배당률 최상단 + 성장 최상단)은 비어도 된다 — 그 상태를 화면이 감당해야 한다.
      const strictest = filterOf({
        minYieldPercent: DIVIDEND_LIST_YIELD_STEPS[DIVIDEND_LIST_YIELD_STEPS.length - 1],
        minGrowthPercent: DIVIDEND_LIST_GROWTH_STEPS[DIVIDEND_LIST_GROWTH_STEPS.length - 1]
      });
      expect(filterDividendListRows(rows, strictest).length).toBeGreaterThanOrEqual(0);
    }
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
    const kings = DIVIDEND_LISTS.kings;
    const ko = kings.members.find((member) => member.ticker === 'KO');
    expect(ko).toBeDefined();
    expect(toDividendListRow(ko!, kings).tickerPagePath).toBe('/ticker/ko');

    const awr = kings.members.find((member) => member.ticker === 'AWR');
    expect(awr).toBeDefined();
    expect(toDividendListRow(awr!, kings).tickerPagePath).toBeNull();
  });

  it('🔴 연속 증배는 목록 기준이 주는 **하한**이다 — 종목마다 센 값이 아니다', () => {
    const cell = toDividendListRow(MEMBER, listOf(MEMBER)).streak;
    expect(cell).toEqual({ known: true, kind: 'atLeast', text: '50년', qualifier: '이상', value: 50, source: null });
  });

  it('상한이 있는 목록(배당챔피언)은 구간으로 말하고 "이상"을 붙이지 않는다', () => {
    const list = listOf(MEMBER, { id: 'champions', minimumStreakYears: 25, maximumStreakYears: 49 });
    const cell = toDividendListRow(MEMBER, list).streak;
    expect(cell).toEqual({ known: true, kind: 'range', text: '25~49년', qualifier: null, value: 25, source: null });
  });

  it('🔴 시작 연도가 있으면 연수를 **그 해에 맞춰 다시 세서** 정확값으로 표시한다', () => {
    const member: DividendListMemberLike = {
      ...MEMBER,
      streakStartYear: 1963,
      streakSource: '증배 63회 · 마지막 증배 2026-04'
    };
    // 시작한 해도 한 해로 센다: 1963 시작 → 2026년에 64년째.
    expect(toDividendListRow(member, listOf(MEMBER), 2026).streak).toEqual({
      known: true,
      kind: 'exact',
      text: '64년',
      qualifier: null,
      value: 64,
      source: '증배 63회 · 마지막 증배 2026-04'
    });
    // 🔴 해가 바뀌면 숫자도 따라 늘어난다 — 굳혀 두면 내년에 조용히 한 해 틀린다.
    expect(toDividendListRow(member, listOf(MEMBER), 2027).streak).toMatchObject({ text: '65년', value: 65 });
  });

  it('시작 연도가 없는 종목은 빈칸이 아니라 하한으로 남는다 — 하한도 정보다', () => {
    expect(toDividendListRow(MEMBER, listOf(MEMBER), 2026).streak).toMatchObject({
      known: true,
      kind: 'atLeast'
    });
  });

  it('🔴 지표가 안 붙은 목록은 "아직 안 쟀다"로, 붙었는데 못 낸 값은 그 이유로 갈린다', () => {
    // undefined = 실측 자체가 없다.
    const bare = toDividendListRow(MEMBER, listOf(MEMBER));
    expect(bare.yield).toEqual({ known: false, reason: 'notMeasured' });
    expect(bare.growth).toEqual({ known: false, reason: 'notMeasured' });

    // null = 실측은 했는데 그 종목은 계산이 불가능했다. 사용자에게 할 말이 다르다.
    const measured: DividendListMemberLike = {
      ...MEMBER,
      forwardYieldPercent: null,
      fiveYearGrowthPercent: null,
      measuredAt: '2026-08-04'
    };
    const row = toDividendListRow(measured, listOf(MEMBER));
    expect(row.yield).toEqual({ known: false, reason: 'irregularPayout' });
    expect(row.growth).toEqual({ known: false, reason: 'growthHistory' });
    expect(row.measuredAt).toBe('2026-08-04');
  });

  it('배당률·성장률은 같은 소수 자릿수로 그려지고 성장률만 부호를 갖는다', () => {
    const member: DividendListMemberLike = {
      ...MEMBER,
      forwardYieldPercent: 2.441,
      fiveYearGrowthPercent: 4.4649
    };
    const built = toDividendListRow(member, listOf(MEMBER));
    expect(built.yield).toEqual({ known: true, text: '2.44%', value: 2.441 });
    // 🔴 색이 아니라 부호가 방향을 말한다.
    expect(built.growth).toEqual({ known: true, text: '+4.46%', value: 4.4649, direction: 'up' });
  });

  it('마이너스 성장은 부호와 방향을 함께 남긴다', () => {
    const member: DividendListMemberLike = { ...MEMBER, fiveYearGrowthPercent: -1.2 };
    const built = toDividendListRow(member, listOf(MEMBER));
    expect(built.growth).toEqual({ known: true, text: '-1.20%', value: -1.2, direction: 'down' });
  });

  it('toDividendListRows 는 목록의 모든 종목을 같은 기준으로 만든다', () => {
    const rows = toDividendListRows(DIVIDEND_LISTS.champions);
    expect(rows).toHaveLength(DIVIDEND_LISTS.champions.members.length);
    expect(rows.every((r) => r.streak.known && r.streak.kind === 'range')).toBe(true);
  });
});

describe('기준일·라이선스', () => {
  it('실측일이 없으면 null 이다 — 없는 기준일을 지어내지 않는다', () => {
    expect(latestMeasuredAt(ROWS)).toBeNull();
  });

  it('줄마다 실측일이 다르면 가장 최근 날짜를 쓴다', () => {
    expect(latestMeasuredAt(METRIC_ROWS)).toBe('2026-08-04');
  });

  it('🔴 위키피디아를 쓰는 목록만 CC BY-SA 고지가 필요하다', () => {
    // 배당귀족은 위키피디아 구성종목 표로 교차확인한다 → 라이선스 표기 의무가 있다.
    expect(usesWikipediaSource(DIVIDEND_LISTS.aristocrats)).toBe(true);
    expect(usesWikipediaSource(listOf(MEMBER))).toBe(false);
  });
});
