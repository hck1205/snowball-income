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
import { formatChangePercent } from '@/shared/utils';

/**
 * 목록 화면의 **순수 조립 함수**. React 도 DOM 도 모른다 — 정렬·필터가 여기 있어야 테스트가
 * 렌더 없이 계약을 잡을 수 있다(이 레포가 캘린더·포트폴리오에서 쓰는 같은 규율).
 */

/** 정렬 축. 화면의 열 순서와 같다. */
export type DividendListSortKey = 'ticker' | 'name' | 'yield' | 'streak' | 'growth' | 'sector';
export type DividendListSortDirection = 'asc' | 'desc';

export type DividendListSort = {
  key: DividendListSortKey;
  direction: DividendListSortDirection;
};

/** 첫 화면은 티커 오름차순 — 목록의 기본 형태이자 사용자가 종목을 눈으로 찾을 때 가장 빠른 축이다. */
export const DEFAULT_DIVIDEND_LIST_SORT: DividendListSort = { key: 'ticker', direction: 'asc' };

/**
 * 값이 없는 칸이 **왜** 비었는지. 🔴 화면은 이 키로 문장을 고른다 — "—" 하나로 뭉뚱그리면
 * 사용자는 빈칸을 "0" 이나 "해당 없음" 으로 읽는다(전혀 다른 사실이다).
 * 문장 자체는 `copy/dividendListCopy.ts` 가 갖는다(컴포넌트·유틸에 문자열 리터럴 금지).
 */
export type DividendListUnknownReason =
  /** 완결된 6개 연도의 배당 이력이 없어 5년 성장률을 계산할 수 없다. */
  | 'growthHistory'
  /** 특별배당·지급주기 변경이 섞여 정기 배당을 기계가 가려내지 못했다. */
  | 'irregularPayout'
  /** 어느 자료에도 이 종목의 섹터가 적혀 있지 않다. */
  | 'sectorSource'
  /** 아직 이 목록에 실측 지표가 붙지 않았다(수집은 됐지만 화면 데이터에 합쳐지기 전). */
  | 'notMeasured';

/** 숫자 한 칸. `known: false` 를 타입으로 강제해 "0 으로 그리는" 실수를 원천 차단한다. */
export type DividendListNumberCell =
  | { known: true; text: string; value: number }
  | { known: false; reason: DividendListUnknownReason };

/**
 * 성장률 칸. 🔴 부호를 **색으로만** 말하지 않기 위해 `text` 에 `+`/`-` 가 반드시 들어간다
 * (`formatChangePercent` 가 그렇게 만든다). `direction` 은 색을 **보조로** 얹을 때만 쓴다.
 */
export type DividendListGrowthCell =
  | { known: true; text: string; value: number; direction: 'up' | 'down' | 'flat' }
  | { known: false; reason: DividendListUnknownReason };

/**
 * 연속 증배 연수 칸.
 *
 * 🔴 이 목록들이 줄 수 있는 값은 대부분 **하한**이다("50년 이상"). 종목별 정확한 연수는 원리적으로
 * 계산이 안 된다(근거: `shared/constants/dividendLists/dividendLists.types.ts` 머리말 — 배당귀족
 * 69종을 야후 이력으로 다시 세면 정교화해도 58종만 25년 이상으로 나온다). 그래서 화면은
 * `exact` 와 하한/구간을 **눈으로 구분되게** 그린다 — 둘을 같은 모양으로 그리면 하한이 정확값으로 읽힌다.
 */
export type DividendListStreakCell =
  | {
      known: true;
      /** `exact` = 시작 연도가 확인된 종목. `atLeast`·`range` = 목록 기준이 보장하는 범위일 뿐이다. */
      kind: 'exact' | 'atLeast' | 'range';
      text: string;
      /** 하한 표기에 붙는 한정어("이상"). 정확값·구간에는 없다. */
      qualifier: string | null;
      /** 정렬·비교용 숫자. 구간은 하한을 쓴다. */
      value: number;
      /** 정확값의 근거 한 줄. 🔴 출처 없는 숫자는 이 레포에서 지어낸 숫자다. 하한에는 없다(`null`). */
      source: string | null;
    }
  | { known: false; reason: DividendListUnknownReason };

/**
 * 목록 데이터에 **아직 없을 수도 있는** 실측 지표.
 *
 * 🔴 전부 선택 필드라 `DividendListMember` 가 그대로 대입된다 — 캐스트가 없다는 뜻이고,
 * `shared/constants/dividendLists` 가 이 이름들로 필드를 실어 주는 날 **화면 코드를 고치지 않고**
 * 값이 채워진다. 이름은 수집기 산출물(`DividendUniverseMetrics`)과 **일부러 똑같이** 맞췄다 —
 * 옮겨 담는 층에서 이름이 갈리면 그 자리가 다음 버그의 자리가 된다.
 *
 * ⚠ `undefined` 와 `null` 은 다른 사실이다. `undefined` = 아직 실측이 안 붙었다(notMeasured),
 *   `null` = 붙였지만 그 종목은 계산이 불가능했다(growthHistory·irregularPayout). 화면 문장이 갈린다.
 */
export type DividendListMemberMetrics = {
  /** 선행 배당률(%) = 최신 1회 지급액 × 연 지급횟수 ÷ 현재가. */
  forwardYieldPercent?: number | null;
  /** 최근 5년 배당 연평균 성장률(%). 완결 6개 연도가 없으면 `null`. */
  fiveYearGrowthPercent?: number | null;
  /**
   * 연속 증배가 **시작된 해**. 없으면 목록 기준이 주는 하한만 쓴다.
   *
   * 🔴 연수를 숫자로 굳혀 두지 않고 시작 연도를 두는 이유: 해가 바뀌면 화면이 **스스로 다시 센다**.
   * "63년"을 박아 두면 내년에 조용히 한 해 틀린 숫자가 된다(같은 판단을
   * `shared/constants/dividendLists` 의 시작 연도 데이터가 갖고 있다 — 필드 이름을 거기 맞췄다).
   */
  streakStartYear?: number | null;
  /** 시작 연도의 근거. 🔴 값이 있으면 출처도 반드시 있다 — 출처 없는 숫자는 지어낸 숫자다. */
  streakSource?: string | null;
  /** 위 숫자를 실제로 받은 날짜(ISO). 기준일 없는 숫자는 "지금 값"으로 읽힌다. */
  measuredAt?: string | null;
};

/** 화면이 받아들이는 종목 한 줄. 지표가 붙기 전에도 붙은 뒤에도 같은 타입이다. */
export type DividendListMemberLike = DividendListMember & DividendListMemberMetrics;

export type DividendListRow = {
  ticker: string;
  name: string;
  /** 섹터를 밝힌 자료가 없을 수 있다(러셀2000 전용 소형주 20종이 실제로 그렇다). 지어내지 않고 비운다. */
  sector: DividendListSectorId | null;
  sectorLabel: string | null;
  yield: DividendListNumberCell;
  streak: DividendListStreakCell;
  growth: DividendListGrowthCell;
  confirmedBy: string[];
  /** 이 줄의 숫자가 언제 기준인지. 없으면 `null`(있는 척하지 않는다). */
  measuredAt: string | null;
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

const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * 퍼센트 표기는 **한 포맷터**만 쓴다. `formatChangePercent` 는 `direction: 'flat'` 이면 부호를 붙이지
 * 않으므로 배당률(부호 없음)과 성장률(부호 있음)이 같은 소수 자릿수·같은 반올림을 공유한다.
 * 여기서 `toFixed` 를 다시 쓰면 두 열의 자릿수가 조용히 갈린다(이 레포가 금액 표기에서 이미 겪은 형태).
 */
const growthDirection = (value: number): 'up' | 'down' | 'flat' =>
  value > 0 ? 'up' : value < 0 ? 'down' : 'flat';

const toYieldCell = (metrics: DividendListMemberMetrics): DividendListNumberCell => {
  if (metrics.forwardYieldPercent === undefined) return { known: false, reason: 'notMeasured' };
  if (!isFiniteNumber(metrics.forwardYieldPercent)) return { known: false, reason: 'irregularPayout' };
  return {
    known: true,
    value: metrics.forwardYieldPercent,
    text: formatChangePercent({ percent: metrics.forwardYieldPercent, direction: 'flat' })
  };
};

const toGrowthCell = (metrics: DividendListMemberMetrics): DividendListGrowthCell => {
  if (metrics.fiveYearGrowthPercent === undefined) return { known: false, reason: 'notMeasured' };
  if (!isFiniteNumber(metrics.fiveYearGrowthPercent)) return { known: false, reason: 'growthHistory' };
  const direction = growthDirection(metrics.fiveYearGrowthPercent);
  return {
    known: true,
    value: metrics.fiveYearGrowthPercent,
    direction,
    text: formatChangePercent({ percent: metrics.fiveYearGrowthPercent, direction })
  };
};

/**
 * 연속 증배 연수. 시작 연도가 **실제로 있을 때만** `exact` 다. 그 밖에는 목록 기준이 보장하는
 * 하한(50년 이상)이나 구간(25~49년)을 그대로 옮긴다 — 없는 정밀도를 만들어 내지 않는다.
 *
 * ⚠ 시작 연도 → 연수는 **시작한 해도 한 해로 센다**(1962년 시작 → 2026년에 65년째). 목록 기준
 *   ("50년 이상")과 같은 셈법이라 둘이 어긋나 "킹인데 49년"이 나오는 일이 없다.
 */
const toStreakCell = (
  member: DividendListMemberLike,
  list: DividendList,
  currentYear: number
): DividendListStreakCell => {
  if (isFiniteNumber(member.streakStartYear)) {
    const years = currentYear - member.streakStartYear + 1;
    return {
      known: true,
      kind: 'exact',
      text: `${years}년`,
      qualifier: null,
      value: years,
      source: member.streakSource ?? null
    };
  }
  if (list.maximumStreakYears !== undefined) {
    return {
      known: true,
      kind: 'range',
      text: `${list.minimumStreakYears}~${list.maximumStreakYears}년`,
      qualifier: null,
      value: list.minimumStreakYears,
      source: null
    };
  }
  return {
    known: true,
    kind: 'atLeast',
    text: `${list.minimumStreakYears}년`,
    qualifier: '이상',
    value: list.minimumStreakYears,
    source: null
  };
};

/**
 * 🔴 오늘의 연도는 **인자로 받는다**(기본값만 시계에서 읽는다). 순수 함수가 시계를 직접 읽으면
 * 해가 바뀌는 순간 테스트가 깨지거나, 더 나쁘게는 통과한 채로 계약이 달라진다.
 */
export const toDividendListRow = (
  member: DividendListMemberLike,
  list: DividendList,
  currentYear: number = new Date().getFullYear()
): DividendListRow => {
  const slug = TICKER_PAGE_BY_SYMBOL.get(member.ticker);
  /* 섹터는 `null` 로 올 수 있는 미래(수집 지표 병합)를 지금부터 견딘다 — 대응표에 없는 id 도 같이 막는다. */
  const sector = member.sector ?? null;
  const sectorLabel = sector === null ? null : DIVIDEND_LIST_SECTOR_LABEL[sector] ?? null;

  return {
    ticker: member.ticker,
    name: member.name,
    sector,
    sectorLabel,
    yield: toYieldCell(member),
    streak: toStreakCell(member, list, currentYear),
    growth: toGrowthCell(member),
    confirmedBy: member.confirmedBy,
    measuredAt: member.measuredAt ?? null,
    tickerPagePath: slug ? tickerPagePath(slug) : null
  };
};

export const toDividendListRows = (
  list: DividendList,
  currentYear: number = new Date().getFullYear()
): DividendListRow[] => list.members.map((member) => toDividendListRow(member, list, currentYear));

/** 정렬 비교값. 값이 없는 칸은 `unknown` 으로 뽑아 **방향과 무관하게** 아래로 보낸다. */
type SortValue = { unknown: boolean; number: number | null; text: string | null };

const sortValueOf = (row: DividendListRow, key: DividendListSortKey): SortValue => {
  switch (key) {
    case 'ticker':
      return { unknown: false, number: null, text: row.ticker };
    case 'name':
      return { unknown: false, number: null, text: row.name };
    case 'yield':
      return row.yield.known
        ? { unknown: false, number: row.yield.value, text: null }
        : { unknown: true, number: null, text: null };
    case 'streak':
      return row.streak.known
        ? { unknown: false, number: row.streak.value, text: null }
        : { unknown: true, number: null, text: null };
    case 'growth':
      return row.growth.known
        ? { unknown: false, number: row.growth.value, text: null }
        : { unknown: true, number: null, text: null };
    case 'sector':
      return row.sectorLabel === null
        ? { unknown: true, number: null, text: null }
        : { unknown: false, number: null, text: row.sectorLabel };
  }
};

/**
 * 정렬. 문자열 비교는 `localeCompare` 로 한다 — 섹터 라벨이 한국어라 코드포인트 순서로는
 * 사용자가 기대하는 가나다순이 나오지 않는다.
 *
 * ⚠ **동률은 티커로 깬다.** 섹터로 정렬하면 같은 섹터가 수십 줄인데, 2차 축이 없으면 브라우저·엔진에
 * 따라 순서가 흔들려 "정렬했는데 매번 다르게 보인다"가 된다.
 *
 * 🔴 **값이 없는 줄은 언제나 맨 아래다**(방향을 뒤집어도). 내림차순에서 "—" 가 표 머리를 채우면
 * 정렬은 아무것도 알려주지 못한다 — 사용자가 배당률로 정렬하는 이유는 높은 값을 보려는 것이다.
 */
export const sortDividendListRows = (
  rows: readonly DividendListRow[],
  sort: DividendListSort
): DividendListRow[] => {
  const factor = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    const a = sortValueOf(left, sort.key);
    const b = sortValueOf(right, sort.key);
    if (a.unknown !== b.unknown) return a.unknown ? 1 : -1;

    let primary = 0;
    if (!a.unknown) {
      primary =
        a.number !== null && b.number !== null
          ? a.number - b.number
          : (a.text ?? '').localeCompare(b.text ?? '', 'ko');
    }
    if (primary !== 0) return primary * factor;
    return left.ticker.localeCompare(right.ticker, 'ko');
  });
};

/**
 * 실제로 **순서를 바꿀 수 있는** 열만. 한 목록 안에서 값이 전부 같은 열(예: 배당킹의 "50년 이상")은
 * 눌러도 아무 일이 없다 — 누를 수 있어 보이는데 반응이 없는 컨트롤을 만들지 않는다는
 * 기존 판단(`확인한 자료` 열을 정렬 축에서 뺀 이유)을 그대로 적용한다.
 *
 * ⚠ 인자는 **필터 전 전체 행**을 준다. 필터링된 행으로 계산하면 섹터 칩을 누를 때마다 열 머리의
 *   버튼이 나타났다 사라져 화면이 덜컹거린다.
 */
export const sortableDividendListKeys = (
  rows: readonly DividendListRow[],
  keys: readonly DividendListSortKey[]
): DividendListSortKey[] =>
  keys.filter((key) => {
    const seen = new Set<string>();
    for (const row of rows) {
      const value = sortValueOf(row, key);
      seen.add(value.unknown ? ' unknown' : `${value.number ?? ''}|${value.text ?? ''}`);
      if (seen.size > 1) return true;
    }
    return false;
  });

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
 *
 * ⚠ 섹터를 모르는 종목은 칩을 만들지 않는다 — "섹터 미상"이라는 칩은 분류가 아니라 우리 자료의 구멍이고,
 *   칩으로 세우면 그 구멍이 하나의 섹터처럼 읽힌다. 그 종목들은 표에서 "—" 로 남는다.
 */
export const buildSectorFacets = (rows: readonly DividendListRow[]): SectorFacet[] => {
  const counts = new Map<DividendListSectorId, number>();
  for (const row of rows) {
    if (row.sector === null) continue;
    counts.set(row.sector, (counts.get(row.sector) ?? 0) + 1);
  }
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

/**
 * 표의 숫자가 **언제 기준인지**. 줄마다 실측일이 다를 수 있어 가장 최근 날짜를 쓴다 —
 * 화면이 "이 날짜까지의 값"이라고 말할 수 있는 유일한 형태다. 실측이 하나도 없으면 `null`.
 */
export const latestMeasuredAt = (rows: readonly DividendListRow[]): string | null => {
  let latest: string | null = null;
  for (const row of rows) {
    if (row.measuredAt === null) continue;
    if (latest === null || row.measuredAt > latest) latest = row.measuredAt;
  }
  return latest;
};

/** 위키피디아 자료를 쓰는 목록인가. CC BY-SA 4.0 은 **출처 표기가 의무**라 화면이 그 사실을 말해야 한다. */
export const usesWikipediaSource = (list: DividendList): boolean =>
  list.sources.some((source) => source.url.includes('wikipedia.org'));

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
