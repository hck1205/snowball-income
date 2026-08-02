import { DIVIDEND_UNIVERSE, PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants/presets';
import { MARKET_DATA, MARKET_DATA_AS_OF } from '@/shared/constants/marketData';
import type { Frequency } from '@/shared/types';

/**
 * 종목 비교 — **계산 계층**(순수). 화면은 이 모델을 그리기만 하고 아무것도 계산하지 않는다.
 *
 * ## 🔴 이 파일의 존재 이유 — "가정을 사실처럼 보여주지 않는다"
 *
 * 비교표는 숫자를 나란히 놓는 순간 **전부 같은 무게의 사실처럼 읽힌다.** 그런데 이 앱의 티커 숫자는
 * 출처가 셋으로 갈린다(`shared/constants/marketData/applyMarketData.ts` 의 계약):
 *
 *  - **실측(observed)** — 스냅샷이 유니버스를 덮어쓰는 셋뿐이다: `initialPrice` · `dividendYield` · `frequency`.
 *    여기에 스냅샷이 따로 들고 있는 `payoutMonths`(지급월)를 더한다.
 *  - **가정(assumed)** — `expectedTotalReturn` 은 사람이 큐레이션한 값이고, `dividendGrowth` 는
 *    그 값에서 배당률을 빼 **파생**시킨 것이다(`shared/constants/presets/index.ts`). 관측이 아니다.
 *  - **참고(reference)** — `observedDividendCagr` 는 실제 지급 이력에서 계산한 배당 성장률인데,
 *    `applyMarketData` 가 **엔진에 절대 넣지 않는다**(주석: "reference-only observations ...
 *    must never end up as an engine input"). 사람이 판단할 때 쓰라고 남겨 둔 값이다.
 *
 * 그래서 모든 행이 `basis` 를 들고 다니고, 화면은 그것을 반드시 표기한다. 이 구분이 사라지면
 * "SCHD 의 배당성장률 8.2%" 가 관측치처럼 보이는데 실제로는 우리가 정한 가정이다 — 날조에 해당한다.
 *
 * ## 🔴 "무엇이 더 좋은가"를 말하지 않는다
 *
 * 행마다 최고·최저 열을 표시하지만 그것은 **사실 진술**("이 열이 가장 높다")이지 추천이 아니다.
 * 배당률이 높다고 좋은 종목이 아니고(커버드콜은 분배율이 높은 대신 NAV 가 깎일 수 있다),
 * 이 앱은 투자 자문이 아니다. `betterDirection` 을 두지 않은 것이 그 결정이다.
 */

/** 한 화면에서 비교할 수 있는 최대 종목 수. 표가 가로로 넘치기 전에 멈춘다. */
export const MAX_COMPARE_TICKERS = 4;
/** 비교가 성립하는 최소 종목 수. */
export const MIN_COMPARE_TICKERS = 2;

/** 숫자의 출처. 화면이 이 값을 반드시 표기한다(위 주석). */
export type CompareBasis = 'observed' | 'assumed' | 'reference';

export type CompareMetricKey =
  | 'price'
  | 'dividendYield'
  | 'observedDividendCagr'
  | 'dividendGrowth'
  | 'expectedTotalReturn'
  | 'frequency'
  | 'payoutMonths';

/**
 * 표의 한 칸. **값이 없으면 없다고 말한다** — 0 이나 대시로 채우지 않는다.
 * `numeric` 이 `null` 이면 정렬·최고/최저 비교에서 자동으로 빠진다.
 */
export type CompareCell = {
  readonly text: string;
  readonly numeric: number | null;
  readonly isUnknown: boolean;
};

export type CompareRow = {
  readonly key: CompareMetricKey;
  readonly label: string;
  readonly basis: CompareBasis;
  /** 이 행을 오해하지 않게 하는 한 줄. 가정치·참고치에는 반드시 있다. */
  readonly note?: string;
  readonly cells: readonly CompareCell[];
  /** 값이 가장 큰 열(동점이면 여럿). 숫자 행에서만 채워진다. */
  readonly highestIndexes: readonly number[];
  /** 값이 가장 작은 열(동점이면 여럿). */
  readonly lowestIndexes: readonly number[];
};

export type CompareColumn = {
  readonly ticker: string;
  readonly name: string;
  readonly frequency: Frequency;
};

/**
 * 지급월 겹침 — 이 비교 화면의 **차별점**이다.
 *
 * 배당률·성장률 비교는 어디에나 있지만 "이 조합이면 매달 들어오는가"는 지급월 데이터가 있어야
 * 답할 수 있고, 이 앱은 배당 캘린더 때문에 이미 갖고 있다.
 *
 * 🔴 지급월을 **모르는** 종목은 커버리지 계산에서 빼고 `unknownTickers` 로 따로 보고한다.
 * 모르는 것을 "지급 안 함"으로 접으면 빈 달이 실제보다 많아 보이는 거짓이 된다.
 */
export type PayoutCoverage = {
  /** 1~12월 각각, 그 달에 지급하는 종목들. 인덱스 0 = 1월. */
  readonly tickersByMonth: readonly (readonly string[])[];
  /** 한 종목이라도 지급하는 달(1~12). */
  readonly coveredMonths: readonly number[];
  /** 아무도 지급하지 않는 달(1~12). */
  readonly gapMonths: readonly number[];
  /** 12개월이 전부 덮이는가. `unknownTickers` 가 있어도 덮인 달만으로 판정한다. */
  readonly isEveryMonthCovered: boolean;
  /** 지급월 데이터가 없어 이 계산에서 빠진 종목. */
  readonly unknownTickers: readonly string[];
};

export type TickerCompareModel = {
  readonly columns: readonly CompareColumn[];
  readonly rows: readonly CompareRow[];
  readonly coverage: PayoutCoverage;
  /** 실측값의 기준일. 없으면 `null`(있는 척하지 않는다). */
  readonly asOf: string | null;
};

/* ── 포맷 ──────────────────────────────────────────────────────────────────── */

const FREQUENCY_LABEL: Record<Frequency, string> = {
  monthly: '매월',
  quarterly: '분기',
  semiannual: '반기',
  annual: '연 1회',
  none: '배당 없음'
};

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'] as const;

/** 값이 없을 때 쓰는 단 하나의 표기. 화면이 제각각 "—" 를 만들지 않게 여기서 정한다. */
export const UNKNOWN_TEXT = '자료 없음';

const unknownCell = (): CompareCell => ({ text: UNKNOWN_TEXT, numeric: null, isUnknown: true });

const numberCell = (value: number | undefined, format: (value: number) => string): CompareCell =>
  typeof value === 'number' && Number.isFinite(value)
    ? { text: format(value), numeric: value, isUnknown: false }
    : unknownCell();

const percent = (value: number): string => `${value.toFixed(2)}%`;
const usd = (value: number): string => `$${value.toFixed(2)}`;

/* ── 지급월 ────────────────────────────────────────────────────────────────── */

/** 생성물에서 온 값이라 방어적으로 정규화한다: 1~12 정수만, 중복 제거, 오름차순. */
const normalizeMonths = (months: readonly number[] | undefined): number[] => {
  if (!months) return [];
  const seen = new Set<number>();
  for (const month of months) {
    if (Number.isInteger(month) && month >= 1 && month <= 12) seen.add(month);
  }
  return [...seen].sort((left, right) => left - right);
};

/** 티커별 지급월을 12칸 커버리지로 접는다. 순수 — 인자 밖의 것을 읽지 않는다. */
export const analyzePayoutCoverage = (
  entries: readonly { ticker: string; payoutMonths: readonly number[] | undefined }[]
): PayoutCoverage => {
  const byMonth: string[][] = Array.from({ length: 12 }, () => []);
  const unknownTickers: string[] = [];

  for (const entry of entries) {
    const months = normalizeMonths(entry.payoutMonths);
    if (months.length === 0) {
      unknownTickers.push(entry.ticker);
      continue;
    }
    for (const month of months) byMonth[month - 1].push(entry.ticker);
  }

  const coveredMonths: number[] = [];
  const gapMonths: number[] = [];
  for (let index = 0; index < 12; index += 1) {
    (byMonth[index].length > 0 ? coveredMonths : gapMonths).push(index + 1);
  }

  return {
    tickersByMonth: byMonth,
    coveredMonths,
    gapMonths,
    isEveryMonthCovered: gapMonths.length === 0,
    unknownTickers
  };
};

/** `[1,2,3,5]` → `"1·2·3·5월"`. 빈 배열이면 빈 문자열(호출부가 그리지 않는다). */
export const formatMonthList = (months: readonly number[]): string =>
  months.length === 0 ? '' : `${months.join('·')}월`;

export const monthLabel = (month: number): string => MONTH_LABELS[month - 1] ?? `${month}월`;

/* ── 최고·최저 ─────────────────────────────────────────────────────────────── */

/** 숫자가 있는 칸들 중 최대/최소 인덱스. 값이 하나뿐이면 비교가 무의미하므로 빈 배열을 준다. */
const extremeIndexes = (cells: readonly CompareCell[]): { highest: number[]; lowest: number[] } => {
  const scored = cells
    .map((cell, index) => ({ index, value: cell.numeric }))
    .filter((entry): entry is { index: number; value: number } => entry.value !== null);

  if (scored.length < 2) return { highest: [], lowest: [] };

  const max = Math.max(...scored.map((entry) => entry.value));
  const min = Math.min(...scored.map((entry) => entry.value));
  // 전부 같은 값이면 "가장 높다"가 의미를 잃는다 — 아무 표시도 하지 않는다.
  if (max === min) return { highest: [], lowest: [] };

  return {
    highest: scored.filter((entry) => entry.value === max).map((entry) => entry.index),
    lowest: scored.filter((entry) => entry.value === min).map((entry) => entry.index)
  };
};

const toRow = (
  key: CompareMetricKey,
  label: string,
  basis: CompareBasis,
  cells: readonly CompareCell[],
  note?: string
): CompareRow => {
  const { highest, lowest } = extremeIndexes(cells);
  return { key, label, basis, ...(note ? { note } : {}), cells, highestIndexes: highest, lowestIndexes: lowest };
};

/* ── 유니버스 조회 ─────────────────────────────────────────────────────────── */

export type CompareCandidate = {
  readonly ticker: string;
  readonly name: string;
  readonly hasPayoutMonths: boolean;
};

/**
 * 고를 수 있는 종목 목록(티커 오름차순).
 *
 * ⚠ `pages/DividendCalendar/utils` 의 같은 조인을 **import 하지 않는다.** 페이지가 페이지를 물면
 * 한쪽을 지울 때 다른 쪽이 조용히 깨지고, 배럴 순환의 씨앗이 된다. 두 화면 모두 `shared/constants`
 * 라는 **같은 출처**에서 각자 읽는다 — 값이 갈릴 수 없으므로 중복이 아니라 독립이다.
 */
export const getCompareCandidates = (): readonly CompareCandidate[] =>
  Object.keys(DIVIDEND_UNIVERSE)
    .sort()
    .map((ticker) => ({
      ticker,
      name:
        PRESET_TICKER_KOREAN_NAME_BY_TICKER[ticker as keyof typeof PRESET_TICKER_KOREAN_NAME_BY_TICKER] ??
        DIVIDEND_UNIVERSE[ticker as keyof typeof DIVIDEND_UNIVERSE].name ??
        ticker,
      hasPayoutMonths: normalizeMonths(MARKET_DATA.entries[ticker]?.payoutMonths).length > 0
    }));

/* ── 예시 조합 ─────────────────────────────────────────────────────────────── */

export type ComparePreset = {
  /** URL·리스트 키. 티커 조합이 바뀌어도 유지되는 짧은 슬러그. */
  readonly id: string;
  /** 이 조합이 무엇을 보여주는지. 🔴 **사실 진술만** — "추천"·"최고"로 쓰지 마라. */
  readonly label: string;
  readonly tickers: readonly string[];
};

/**
 * 빈 상태에서 눌러 볼 수 있는 예시 조합.
 *
 * 🔴 **라벨은 데이터가 뒷받침하는 만큼만 말한다.** 여기 문구는 전부 `MARKET_DATA` 스냅샷 실측으로
 * 확인한 것이다(2026-08-02). 특히:
 *  - `quarterly-monthly` 의 "매달"은 T[1,4,7,10] · JNJ[2,5,8,11] · SCHD[3,6,9,12] 가 **12칸을 정확히
 *    채운다**는 실측이다 — `tickerCompare.test.ts` 가 이 주장을 잠근다. 데이터가 바뀌어 12칸이 깨지면
 *    라벨이 거짓이 되므로 테스트가 먼저 깨진다.
 *  - 이전 버전의 주석은 SCHD·VYM·DGRO 를 "분기 지급을 엇갈리게 모은 것"이라고 적었는데 **틀렸다**.
 *    셋 다 [3,6,9,12] 라 겹친다(빈 달 8개). 그 역할은 위 조합이 진다.
 *
 * ⚠ 예시에 쓰는 티커는 **스냅샷이 있는 것만** 고른다. 스냅샷이 없으면(SPYI·PLD·XOM 등) 표가
 *   "자료 없음"으로 열려 첫인상이 고장 난 화면이 된다 — 예시는 이 화면이 가장 잘 보이는 장면이어야 한다.
 * ⚠ 유니버스에서 사라진 티커는 `normalizeCompareSelection` 이 조용히 걸러 낸다(빈 열이 생기지 않는다).
 */
export const COMPARE_PRESETS: readonly ComparePreset[] = [
  { id: 'growth-big3', label: '배당성장 대표 3종', tickers: ['SCHD', 'VYM', 'DGRO'] },
  { id: 'quarterly-monthly', label: '분기 3종을 엇갈려 매달 받기', tickers: ['T', 'JNJ', 'SCHD'] },
  { id: 'covered-call', label: '월배당 커버드콜 3종', tickers: ['JEPI', 'JEPQ', 'QYLD'] },
  { id: 'mixed-character', label: '성격이 다른 셋 — 배당성장·커버드콜·리츠', tickers: ['SCHD', 'JEPI', 'O'] },
  { id: 'index-vs-dividend', label: '지수 ETF 와 배당 ETF', tickers: ['VOO', 'QQQ', 'SCHD'] },
  { id: 'aristocrats', label: '배당귀족과 배당성장', tickers: ['NOBL', 'SDY', 'VIG', 'DGRW'] },
  { id: 'high-yield', label: '고배당 ETF 4종', tickers: ['SPYD', 'HDV', 'DVY', 'IDV'] },
  { id: 'international', label: '미국 밖 배당 ETF', tickers: ['VYMI', 'SCHY', 'IDV'] },
  { id: 'covered-call-family', label: '커버드콜 형제 — 기초 지수만 다르다', tickers: ['QYLD', 'XYLD', 'JEPQ'] },
  { id: 'monthly-income', label: '매달 들어오는 종목끼리', tickers: ['O', 'DIVO', 'JEPI'] }
];

/** 입력 티커를 유니버스에 있는 것만, 중복 없이, 상한까지 자른다. */
export const normalizeCompareSelection = (tickers: readonly string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tickers) {
    const ticker = raw.trim().toUpperCase();
    if (ticker.length === 0 || seen.has(ticker)) continue;
    if (!(ticker in DIVIDEND_UNIVERSE)) continue;
    seen.add(ticker);
    out.push(ticker);
    if (out.length >= MAX_COMPARE_TICKERS) break;
  }
  return out;
};

/* ── 모델 ──────────────────────────────────────────────────────────────────── */

/**
 * 비교 모델 한 벌. 🔴 **숫자를 새로 만들지 않는다** — 유니버스와 스냅샷에서 읽어 포맷만 한다.
 * 선택이 비어 있어도 빈 모델을 정상적으로 돌려준다(화면이 빈 상태를 그린다).
 */
export const buildTickerCompareModel = (tickers: readonly string[]): TickerCompareModel => {
  const selected = normalizeCompareSelection(tickers);

  const columns: CompareColumn[] = selected.map((ticker) => {
    const preset = DIVIDEND_UNIVERSE[ticker as keyof typeof DIVIDEND_UNIVERSE];
    return {
      ticker,
      name:
        PRESET_TICKER_KOREAN_NAME_BY_TICKER[ticker as keyof typeof PRESET_TICKER_KOREAN_NAME_BY_TICKER] ??
        preset.name ??
        ticker,
      frequency: preset.frequency
    };
  });

  const presets = selected.map((ticker) => DIVIDEND_UNIVERSE[ticker as keyof typeof DIVIDEND_UNIVERSE]);
  const snapshots = selected.map((ticker) => MARKET_DATA.entries[ticker]);

  const rows: CompareRow[] = [
    toRow(
      'price',
      '현재가',
      'observed',
      presets.map((preset) => numberCell(preset.initialPrice, usd))
    ),
    toRow(
      'dividendYield',
      '배당률',
      'observed',
      presets.map((preset) => numberCell(preset.dividendYield, percent)),
      '최근 12개월 지급액을 현재가로 나눈 값입니다.'
    ),
    toRow(
      'observedDividendCagr',
      '배당 성장률 (실제 이력)',
      'reference',
      snapshots.map((entry) => numberCell(entry?.observedDividendCagr, percent)),
      '실제 지급 이력에서 계산한 값입니다. 시뮬레이터 계산에는 쓰이지 않습니다.'
    ),
    toRow(
      'dividendGrowth',
      '배당 성장률 (계산 가정)',
      'assumed',
      presets.map((preset) => numberCell(preset.dividendGrowth, percent)),
      '시뮬레이터가 쓰는 가정값입니다. 아래 기대 총수익률에서 배당률을 뺀 값이라 관측치가 아닙니다.'
    ),
    toRow(
      'expectedTotalReturn',
      '기대 총수익률 (계산 가정)',
      'assumed',
      presets.map((preset) => numberCell(preset.expectedTotalReturn, percent)),
      '장기 가정으로 직접 정한 값입니다. 미래를 예측한 값이 아닙니다.'
    ),
    toRow(
      'frequency',
      '지급 주기',
      'observed',
      presets.map((preset) => ({ text: FREQUENCY_LABEL[preset.frequency], numeric: null, isUnknown: false }))
    ),
    toRow(
      'payoutMonths',
      '지급월',
      'observed',
      snapshots.map((entry) => {
        const months = normalizeMonths(entry?.payoutMonths);
        return months.length === 0
          ? unknownCell()
          : { text: formatMonthList(months), numeric: null, isUnknown: false };
      }),
      '과거 지급 이력에서 확인한 달입니다. 운용사 사정으로 바뀔 수 있습니다.'
    )
  ];

  const coverage = analyzePayoutCoverage(
    selected.map((ticker, index) => ({ ticker, payoutMonths: snapshots[index]?.payoutMonths }))
  );

  return { columns, rows, coverage, asOf: MARKET_DATA_AS_OF ?? null };
};
