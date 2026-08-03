import { DIVIDEND_UNIVERSE, PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants/presets';
import {
  INVESTORS_BY_SPOTLIGHT,
  isReportStale,
  type InvestorSnapshotEntry,
  type PositionKind
} from '@/shared/constants/investors';
import { tickerForCusip } from '@/shared/constants/investors/cusipToTicker';

/**
 * `/portfolio/investors` 의 계산 계층(순수). 화면은 이 모델을 그리기만 한다.
 *
 * ## 이 화면이 하는 유일한 부가가치
 * 13F 는 어디에나 있다. 우리가 더하는 것은 **그 종목의 배당 정보**다 — 공시에 없는 값을
 * 우리 유니버스에서 조인해 붙인다. 그래서 "버핏이 든 코카콜라의 배당률"을 한 화면에서 본다.
 *
 * ## 🔴 모르는 것을 없는 것으로 만들지 않는다
 * 매핑되지 않은 CUSIP 은 **배당 없음이 아니라 자료 없음**이다. 13F 에 있는 종목 대부분은
 * 배당을 주지만 우리 유니버스에 없을 뿐이다. 그 둘을 섞으면 "버핏 포트폴리오의 배당률"이
 * 실제보다 낮아 보인다 — 그래서 합계·평균 배당률을 **계산하지 않는다**(그 숫자는 거짓이 된다).
 */

export type InvestorHoldingRow = {
  readonly cusip: string;
  /** 공시에 적힌 발행사 이름. 매핑이 없으면 화면이 보여줄 수 있는 유일한 이름이다. */
  readonly issuer: string;
  /** 신고분 대비 비중(%). `null` 이면 계산 불가(합계 0). */
  readonly weightPercent: number | null;
  /** 우리 유니버스 티커. `null` = 자료 없음(배당 없음이 아니다). */
  readonly ticker: string | null;
  readonly koreanName: string | null;
  readonly dividendYieldPercent: number | null;
  /** 🔴 주식·풋·콜. 풋은 **보유가 아니라 하락 베팅**이다 — 화면이 반드시 밝혀야 한다. */
  readonly kind: PositionKind;
  readonly valueUsd: number;
};

export type InvestorCardModel = {
  readonly cik: string;
  readonly person: string;
  readonly firm: string;
  readonly note: string;
  /** 🔴 인물마다 다르다. 전역 기준일 하나로 뭉뚱그리면 거짓이 된다. */
  readonly reportDate: string;
  /** 두 분기 넘게 새 공시가 없다. ⚠ "청산했다"가 아니라 "공시가 없다"는 뜻이다. */
  readonly isStale: boolean;
  readonly totalValueUsd: number;
  readonly totalHoldingCount: number;
  /** 저장된 상위 N종. 전체는 `totalHoldingCount` 가 말한다. */
  readonly holdings: readonly InvestorHoldingRow[];
  /** 그중 우리 배당 데이터가 붙은 종목 수 — "N종에 배당 정보가 있다"를 정직하게 말하기 위한 값. */
  readonly mappedCount: number;
};

/** $263,095,703,570 → "$263.1B". 조 단위는 안 쓴다(원화 환산도 하지 않는다 — 환율은 이 화면의 관심사가 아니다). */
export const formatUsdCompact = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '-';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${Math.round(value).toLocaleString('en-US')}`;
};

const toRow = (holding: InvestorSnapshotEntry['topHoldings'][number]): InvestorHoldingRow => {
  /* 🔴 옛 스냅샷에는 이 필드가 없다. 없으면 주식으로 넘겨짚되(그 시절 데이터는 구분이 아예 없었다),
     지금 커밋된 스냅샷은 전부 갖고 있으므로 이 폴백은 실제로 타지 않는다. */
  const kind: PositionKind = holding.kind ?? 'share';
  const ticker = tickerForCusip(holding.cusip);
  if (!ticker) {
    return {
      cusip: holding.cusip,
      issuer: holding.issuer,
      weightPercent: holding.weightPercent,
      ticker: null,
      koreanName: null,
      dividendYieldPercent: null,
      kind,
      valueUsd: holding.valueUsd
    };
  }

  const preset = DIVIDEND_UNIVERSE[ticker as keyof typeof DIVIDEND_UNIVERSE];
  return {
    cusip: holding.cusip,
    issuer: holding.issuer,
    weightPercent: holding.weightPercent,
    ticker,
    koreanName:
      PRESET_TICKER_KOREAN_NAME_BY_TICKER[ticker as keyof typeof PRESET_TICKER_KOREAN_NAME_BY_TICKER] ?? null,
    /* 배당을 지급하지 않는 종목은 0 이 맞다 — 매핑이 있으므로 "모른다"가 아니라 "없다"를 안다. */
    dividendYieldPercent: preset ? preset.dividendYield : null,
    kind,
    valueUsd: holding.valueUsd
  };
};

export const buildInvestorCard = (entry: InvestorSnapshotEntry, today: Date): InvestorCardModel => {
  const holdings = entry.topHoldings.map(toRow);
  return {
    cik: entry.cik,
    person: entry.person,
    firm: entry.firm,
    note: entry.note,
    reportDate: entry.reportDate,
    isStale: isReportStale(entry, today),
    totalValueUsd: entry.totalValueUsd,
    totalHoldingCount: entry.totalHoldingCount,
    holdings,
    mappedCount: holdings.filter((row) => row.ticker !== null).length
  };
};

/**
 * 전체 카드. **이름이 널리 알려진 순**(2026-08-02 사용자 지시) — 규모 순이면 켄 피셔가 버핏보다
 * 위에 오는데, 이 화면에 처음 온 사람이 찾는 순서가 아니다.
 * ⚠ 그 순서는 측정값이 아니라 편집 판단이다(근거는 `INVESTORS_BY_SPOTLIGHT` 주석).
 *
 * `today` 를 인자로 받는 이유: 모듈이 `new Date()` 를 부르면 테스트가 실제 날짜에 매인다
 * (이 레포가 캘린더·목표에서 쓰는 같은 규율).
 */
export const buildInvestorCards = (today: Date): readonly InvestorCardModel[] =>
  INVESTORS_BY_SPOTLIGHT.map((entry) => buildInvestorCard(entry, today));

/* ── 시각화(순수) ──────────────────────────────────────────────────────────── */

/**
 * 도넛 한 조각.
 *
 * `dash`·`offset` 은 SVG `stroke-dasharray`/`stroke-dashoffset` 에 그대로 넣는 값이다
 * (둘레를 100 으로 정규화했으므로 **곧 퍼센트**다). 원호 `path` 를 계산하지 않는 이유:
 * 원호는 큰각 플래그·시계방향·부동소수 끝맺음에서 조용히 어긋나는데, 원 하나에 점선을 얹는
 * 방식은 계산이 덧셈뿐이라 틀릴 자리가 없다.
 */
export type DonutSlice = {
  readonly key: string;
  readonly label: string;
  readonly percent: number;
  readonly dash: number;
  readonly offset: number;
  /** `CHART_SERIES_VARS` 의 CSS 변수. 🔴 hex 를 만들지 않는다 — 프리셋 전환을 따라가야 한다. */
  readonly colorVar: string;
  /** 🔴 범례가 **글자로** 밝혀야 하는 값. 풋 조각을 보유로 읽히게 두면 방향이 뒤집힌다. */
  readonly kind: PositionKind;
};

/** 도넛 한 바퀴를 100 으로 둔다 — 조각 값이 곧 퍼센트가 되어 변환이 사라진다. */
export const DONUT_CIRCUMFERENCE = 100;

/**
 * 보유 목록을 도넛 조각으로 접는다.
 *
 * 🔴 **비중을 다시 정규화하지 않는다.** 스냅샷의 `weightPercent` 는 *신고분 전체* 대비 비중이고,
 * 우리가 들고 있는 것은 상위 N종뿐이다. 그 N종을 100% 로 다시 나누면 "버핏 포트폴리오의 30%가
 * 애플"이 "45%"로 부풀어 **거짓이 된다**. 그래서 남는 몫은 `restLabel` 조각으로 **정직하게 남긴다**.
 *
 * ⚠ 비중을 모르는 종목(`weightPercent === null`)은 조각으로 만들지 않는다 — 0 으로 두면
 *   "없다"로 읽히고, 임의 값을 주면 날조다. 그 몫은 자연히 나머지 조각에 남는다.
 */
export const buildDonutSlices = (
  holdings: readonly InvestorHoldingRow[],
  options: {
    readonly seriesVars: readonly string[];
    readonly maxSlices: number;
    readonly restLabel: string;
    /** 나머지 조각 색. 종목이 아니라 "그 밖"이라 시리즈 색을 쓰지 않는다 — 호출부가 중립 토큰을 준다. */
    readonly restColorVar: string;
  }
): readonly DonutSlice[] => {
  const { seriesVars, maxSlices, restLabel, restColorVar } = options;
  const known = holdings.filter(
    (row): row is InvestorHoldingRow & { weightPercent: number } =>
      row.weightPercent !== null && row.weightPercent > 0
  );

  const slices: DonutSlice[] = [];
  let offset = 0;

  known.slice(0, Math.max(0, maxSlices)).forEach((row, index) => {
    const percent = Math.min(row.weightPercent, DONUT_CIRCUMFERENCE - offset);
    if (percent <= 0) return;
    slices.push({
      key: row.cusip,
      label: row.ticker ?? row.issuer,
      percent: row.weightPercent,
      dash: percent,
      offset,
      colorVar: seriesVars[index % seriesVars.length] ?? seriesVars[0] ?? '',
      kind: row.kind
    });
    offset += percent;
  });

  const rest = DONUT_CIRCUMFERENCE - offset;
  if (rest > 0.05) {
    slices.push({
      key: '__rest__',
      label: restLabel,
      percent: rest,
      dash: rest,
      offset,
      colorVar: restColorVar,
      kind: 'share'
    });
  }

  return slices;
};

/* ── 인물 전체 합산 ────────────────────────────────────────────────────────── */

/**
 * 합산 줄에 이름을 남기는 인물.
 *
 * 🔴 `cik` 을 함께 주는 이유는 화면이 **이 줄에서 그 사람의 카드로 건너뛰기** 때문이다
 * (2026-08-03 2차 개편). 이름은 동명이인이 없다는 보장이 없으므로 식별자는 cik 이다.
 */
export type AggregateHolder = {
  readonly cik: string;
  readonly person: string;
};

/** 여러 인물이 함께 담은 종목 한 줄. */
export type AggregatedHolding = {
  readonly cusip: string;
  readonly label: string;
  readonly ticker: string | null;
  readonly koreanName: string | null;
  /** 인물들의 신고 금액 합(달러). */
  readonly totalValueUsd: number;
  /** 이 종목을 담은 인물 수. 규모가 큰 한 사람이 만든 1위와 여럿이 만든 1위를 가른다. */
  readonly holderCount: number;
  /**
   * 담은 인물들 — **카드 순서(스포트라이트 순)** 그대로다.
   *
   * 🔴 숫자만으로는 "여섯 명"이 누구인지 알 수 없어, 1차 개편까지 합산 표와 인물 카드는 같은
   * 화면에 있으면서 서로를 몰랐다. 화면은 이 목록으로 이니셜 칩을 세우고 그 칩이 카드를 연다.
   */
  readonly holders: readonly AggregateHolder[];
  /** 최대값 대비 길이(0~1). 가로 막대가 그대로 쓴다. */
  readonly ratio: number;
};

/**
 * 인물들을 가로질러 종목별로 합산한다.
 *
 * 🔴 **비중(%)을 더하지 않는다.** 운용 규모가 $294.9B(켄 피셔)와 $0.3B(데일리 저널)로 1,000배
 * 차이 나는 사람들의 퍼센트를 더하면 아무 뜻도 없는 숫자가 된다. 더하는 것은 **신고 금액(달러)** 이다.
 *
 * 🔴 **주식 보유분만 센다.** 풋을 보유로 세면 방향이 뒤집히고(버리의 팔란티어 66%), 옵션 금액은
 * 기초자산 명목이라 규모까지 부풀려진다. 그래서 옵션은 아예 제외하고, 그 사실을 화면이 밝힌다.
 *
 * `holderCount` 를 함께 주는 이유: 금액 합만 보면 "한 사람이 크게 담은 것"과 "여럿이 나눠 담은 것"이
 * 구분되지 않는다. 후자가 이 화면에서 사람들이 실제로 궁금해하는 것이다.
 */
/**
 * 합산 정렬 기준.
 *
 * 🔴 기본은 **`holders`(담은 인원 수)** 다(2026-08-02 사용자 지시). 금액 순은 규모 큰 한 사람이
 * 순위를 통째로 지배한다 — 켄 피셔 한 명이 $294.9B 라 그가 담은 것이 곧 1위가 된다.
 * "몇 명이 함께 담았나"가 이 표에서 사람들이 실제로 궁금해하는 것이고, 규모 편향도 없다.
 * ⚠ 두 기준은 **다른 이야기**를 한다. 하나를 다른 하나의 근사로 쓰지 마라.
 */
export type AggregateSort = 'holders' | 'value';

export const aggregateHoldings = (
  cards: readonly InvestorCardModel[],
  limit: number,
  sort: AggregateSort = 'holders'
): readonly AggregatedHolding[] => {
  /* 🔴 Map 이다(Set 아님) — cik 으로 중복을 막으면서 **이름과 카드 순서를 함께** 보존한다.
     화면이 이 목록으로 이니셜 칩을 세우므로 순서가 흔들리면 칩이 매 정렬마다 자리를 바꾼다. */
  const byCusip = new Map<
    string,
    { row: InvestorHoldingRow; totalValueUsd: number; holders: Map<string, string> }
  >();

  for (const card of cards) {
    for (const row of card.holdings) {
      if (row.kind !== 'share') continue;
      if (!Number.isFinite(row.valueUsd) || row.valueUsd <= 0) continue;

      const existing = byCusip.get(row.cusip);
      if (existing) {
        existing.totalValueUsd += row.valueUsd;
        existing.holders.set(card.cik, card.person);
      } else {
        byCusip.set(row.cusip, {
          row,
          totalValueUsd: row.valueUsd,
          holders: new Map([[card.cik, card.person]])
        });
      }
    }
  }

  /* 인원 수가 같으면 금액으로 가른다 — 같은 인원끼리의 순서가 매 렌더 흔들리면 표가 불안해진다. */
  const ranked = [...byCusip.values()]
    .sort((left, right) =>
      sort === 'holders'
        ? right.holders.size - left.holders.size || right.totalValueUsd - left.totalValueUsd
        : right.totalValueUsd - left.totalValueUsd
    )
    .slice(0, Math.max(0, limit));

  /* 🔴 막대 길이의 기준은 **정렬 기준과 같은 축**이다. 인원 순으로 정렬해 놓고 금액으로 막대를
     그리면 3번째 줄이 1번째보다 길어져 표가 스스로를 반박한다. */
  const max =
    sort === 'holders'
      ? Math.max(...ranked.map((item) => item.holders.size), 0)
      : Math.max(...ranked.map((item) => item.totalValueUsd), 0);

  return ranked.map((item) => {
    const measure = sort === 'holders' ? item.holders.size : item.totalValueUsd;
    return {
      cusip: item.row.cusip,
      label: item.row.ticker ?? item.row.issuer,
      ticker: item.row.ticker,
      koreanName: item.row.koreanName,
      totalValueUsd: item.totalValueUsd,
      holderCount: item.holders.size,
      holders: [...item.holders].map(([cik, person]) => ({ cik, person })),
      /* 최대값이 0이면 막대를 그리지 않는다 — 0으로 나눈 값을 1로 위장하지 않는다. */
      ratio: max > 0 ? measure / max : 0
    };
  });
};

/**
 * 인물 아바타 글자.
 *
 * ⚠ 실존 인물 사진은 대부분 저작권이 있어 자유롭게 번들할 수 없다(2026-08-02 확인) — 그래서
 * 사진 대신 이니셜을 쓴다. 한글 이름은 **성 한 글자**(워런 버핏 → "워"가 아니라 낱말 첫 글자들),
 * 즉 낱말마다 첫 글자를 최대 두 개 뽑는다. 한글은 한 글자가 이미 음절이라 두 글자면 충분히 갈린다.
 */
export const monogram = (person: string): string =>
  person
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

/**
 * 인물 고유색 — 이름 해시로 시리즈 팔레트에서 고른다.
 * 카드 순서가 바뀌어도 같은 사람은 같은 색이라 "그 사람"으로 기억된다(인덱스로 고르면 흔들린다).
 * 배당 캘린더의 티커 색(`pages/DividendCalendar/utils/tickerColor.ts`)과 같은 관용구다.
 */
export const personColorVar = (person: string, seriesVars: readonly string[]): string => {
  if (seriesVars.length === 0) return '';
  let hash = 0;
  for (let index = 0; index < person.length; index += 1) {
    hash = (hash * 31 + person.charCodeAt(index)) | 0;
  }
  return seriesVars[Math.abs(hash) % seriesVars.length] ?? seriesVars[0] ?? '';
};

/**
 * `'var(--sb-chart-series-3)'` → `'--sb-chart-series-3'`.
 *
 * 공용 `PickCard` 의 `cap.scopedVar` 는 **변수 이름**을 요구한다(부품이 스스로 `var()` 로 감싼다).
 * 반면 이 화면의 `personColorVar` 는 CSS 에 그대로 넣을 수 있는 **참조 표현식**을 준다 — 두 어법을
 * 잇는 한 줄이다. 이미 이름 형태(`--x`)면 그대로 돌려준다.
 */
export const cssVarName = (value: string): string =>
  value.startsWith('var(') ? value.slice(4, -1).trim() : value;

/** 비교 화면으로 넘길 티커들. 매핑된 것만 — 없는 것을 넘기면 빈 열이 생긴다. */
export const comparableTickers = (card: InvestorCardModel, limit: number): readonly string[] =>
  card.holdings
    .map((row) => row.ticker)
    .filter((ticker): ticker is string => ticker !== null)
    .slice(0, Math.max(0, limit));
