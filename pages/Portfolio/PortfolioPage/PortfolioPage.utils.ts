import type {
  PortfolioHoldingBreakdown,
  PortfolioNextPayout,
  PortfolioSummary
} from '@/shared/lib/portfolio';
import { PORTFOLIO_COPY } from '../copy';
import { resolvePortfolioTickerName } from '../utils';
import type { PortfolioHoldingRow, PortfolioHoldingsStatus } from '../hooks';
import type { PortfolioStorageFailureReason } from '../utils';
import type {
  PortfolioAssumptionRow,
  PortfolioRowModel,
  PortfolioTileModel,
  PortfolioViewModel
} from './PortfolioPage.types';

/**
 * 화면 모델 조립 — **순수 함수만**. `Date.now()`·DOM·전역 상태를 읽지 않는다(전부 인자로 받는다).
 *
 * ⚠ 날짜는 **로컬 게터만** 쓴다. `toISOString()`/UTC 게터는 KST(UTC+9)에서 자정~09시 사이에 하루
 * 밀린다(pitfalls 2026-07-25). '오늘'은 컨테이너가 계산해 넘긴다.
 */

const copy = PORTFOLIO_COPY;
const DASH = copy.summary.tiles.empty;

/** 환율 4상태 중 화면이 알아야 하는 것만. `rate` 가 있는 상태에서만 원화 환산이 성립한다. */
export type PortfolioFxView = {
  status: 'loading' | 'success' | 'stale' | 'error';
  rate: number | null;
  /** 환율 기준 시각(ISO). 값이 없으면 null. */
  asOf: string | null;
};

export type PortfolioViewModelInput = {
  status: PortfolioHoldingsStatus;
  items: readonly PortfolioHoldingRow[];
  summary: PortfolioSummary;
  fx: PortfolioFxView;
  writeError: PortfolioStorageFailureReason | null;
  /** USD 한 값을 화면 문자열로. 환율 가드는 컨테이너가 이미 통과시킨 상태다(§5 포맷 계약). */
  formatAmount: (usd: number) => string;
  /** 시뮬레이터 프리필 state 가 만들어졌는가(= CTA 를 누를 수 있는가). */
  canSimulate: boolean;
  /** 합계에는 들었지만 시뮬레이터 유니버스 밖이라 **비중에서 빠지는** 종목 수. */
  simulationExcludedCount: number;
  /** 캘린더 딥링크에 실을 종목 수 / 실을 수 없어 빠지는 종목 수. */
  calendarTickerCount: number;
  calendarExcludedCount: number;
  /** 직전 삭제 1건(실행 취소 배너). */
  pendingUndo: { ticker: string } | null;
};

/** `YYYY-MM-DD` → `2026년 7월 25일`. 형식이 다르면 원문을 그대로 보여 준다(거짓말보다 낫다). */
export const formatPortfolioSnapshotDate = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;

  return `${Number(match[1])}년 ${Number(match[2])}월 ${Number(match[3])}일`;
};

/** ISO 타임스탬프 → `7월 27일`(로컬 기준). 파싱 실패면 `null`(없는 날짜를 지어내지 않는다). */
export const formatPortfolioFxDate = (iso: string | null): string | null => {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

/** 환율 표기(원). 소수점은 버린다 — 표시용이라 1원 미만은 정보가 아니다. */
export const formatPortfolioFxRate = (rate: number): string => new Intl.NumberFormat('ko-KR').format(Math.round(rate));

/** 히어로 하단 한 줄(시세 기준일 · 환율). 없는 조각은 빠진다. */
export const buildPortfolioAsOfLine = (summary: PortfolioSummary, fx: PortfolioFxView): string => {
  const parts: string[] = [];

  if (summary.asOf) parts.push(copy.hero.asOfPrice(formatPortfolioSnapshotDate(summary.asOf)));

  if (fx.status === 'loading') {
    parts.push(copy.hero.asOfFxLoading);
  } else if (fx.rate === null) {
    parts.push(copy.hero.asOfFxMissing);
  } else {
    const fxDate = formatPortfolioFxDate(fx.asOf);
    parts.push(
      fxDate === null
        ? copy.hero.asOfFxMissing
        : copy.hero.asOfFx(formatPortfolioFxRate(fx.rate), fxDate)
    );
    // 값은 있지만 최근 갱신이 실패했다 — 값을 숨기지 않고 사실만 덧붙인다.
    if (fx.status === 'stale') parts.push(copy.hero.asOfFxStale);
  }

  return copy.hero.asOf(parts);
};

/** 지급 정렬 키. 가까운 달 → 날짜를 아는 쪽 → 이른 날 순. */
const payoutSortKey = (payout: PortfolioNextPayout, currentMonth: number): number => {
  if (payout.kind === 'none') return Number.POSITIVE_INFINITY;

  const monthsAhead = (payout.month - currentMonth + 12) % 12;
  const day = payout.kind === 'estimated-day' ? payout.day : 40;

  return monthsAhead * 100 + day;
};

/** 같은 줄로 묶어 셀 수 있는 지급인가. 한쪽만 날짜를 아는 경우는 표기가 달라 묶지 않는다. */
const isSamePayout = (left: PortfolioNextPayout, right: PortfolioNextPayout): boolean => {
  if (left.kind === 'estimated-day' && right.kind === 'estimated-day') {
    return left.month === right.month && left.day === right.day;
  }
  if (left.kind === 'month-only' && right.kind === 'month-only') return left.month === right.month;

  return false;
};

/**
 * 다음 예상 지급일 타일(#7). 엔진의 `{ kind }` 3분기를 그대로 화면 3분기로 옮긴다 — **날짜 날조 금지**.
 * 대상은 **지급 일정이 계산에 들어간 행**뿐이다(수량 미입력·시장데이터 없음·지급월 미상은 제외).
 */
export const buildNextPayoutTile = (summary: PortfolioSummary): PortfolioTileModel => {
  const scheduled = summary.holdings.filter((row) => row.includedInSchedule && row.nextPayout.kind !== 'none');

  if (scheduled.length === 0) {
    return { label: copy.summary.tiles.nextPayout, value: copy.summary.tiles.nextPayoutNone, hint: copy.summary.tiles.nextPayoutNoneHint };
  }

  const currentMonth = summary.thisMonth.month;
  const sorted = [...scheduled].sort(
    (left, right) => payoutSortKey(left.nextPayout, currentMonth) - payoutSortKey(right.nextPayout, currentMonth)
  );

  const nearest = sorted[0].nextPayout;
  // 위에서 걸러냈지만 배열 필터는 타입을 좁히지 않는다 — 실행되지 않는 가지를 명시해 둔다.
  if (nearest.kind === 'none') {
    return {
      label: copy.summary.tiles.nextPayout,
      value: copy.summary.tiles.nextPayoutNone,
      hint: copy.summary.tiles.nextPayoutNoneHint
    };
  }

  const sharing = sorted.filter((row) => isSamePayout(row.nextPayout, nearest));
  const tickers = copy.summary.tiles.tickerSummary(sharing[0].ticker, sharing.length);

  if (nearest.kind === 'estimated-day') {
    return {
      label: copy.summary.tiles.nextPayout,
      value: copy.summary.tiles.nextPayoutDay(nearest.month, nearest.day),
      hint: tickers
    };
  }

  return {
    label: copy.summary.tiles.nextPayout,
    value: copy.summary.tiles.nextPayoutMonthOnly(nearest.month),
    hint: copy.summary.tiles.nextPayoutMonthOnlyHint(tickers)
  };
};

/**
 * 이번 달 예상 배당 타일(#6). **`₩0` 을 그리지 않는다** — 0원 표기는 오류로 읽히므로 문장으로 말한다.
 */
export const buildThisMonthTile = (
  summary: PortfolioSummary,
  formatAmount: (usd: number) => string
): PortfolioTileModel => {
  const payingCount = summary.holdings.filter((row) => row.thisMonthDividendUsd > 0).length;

  if (payingCount > 0) {
    return {
      label: copy.summary.tiles.thisMonth,
      value: formatAmount(summary.thisMonthDividendUsd),
      hint: copy.summary.tiles.thisMonthHint(summary.thisMonth.month, payingCount)
    };
  }

  // 지급월을 아는 종목이 하나도 없으면 "이번 달 없음"이 아니라 "모른다"가 사실이다.
  if (summary.counts.scheduled === 0) {
    return {
      label: copy.summary.tiles.thisMonth,
      value: copy.summary.tiles.thisMonthUnknown,
      hint: copy.summary.tiles.thisMonthUnknownHint
    };
  }

  return {
    label: copy.summary.tiles.thisMonth,
    value: copy.summary.tiles.thisMonthNone,
    hint: copy.summary.tiles.thisMonthNoneHint
  };
};

const buildRowNote = (row: PortfolioHoldingBreakdown): string | null => {
  if (row.exclusion === 'no-market-data') return copy.holdings.rowNoMarketData;
  if (row.exclusion === 'no-quantity') return copy.holdings.rowNeedsQuantity;
  if (row.exclusion === 'no-payout-months') {
    return row.market?.freshness === 'manual' ? copy.holdings.rowManualExcluded : copy.holdings.rowNoSchedule;
  }

  return null;
};

const buildRows = (
  items: readonly PortfolioHoldingRow[],
  summary: PortfolioSummary,
  formatAmount: (usd: number) => string
): PortfolioRowModel[] =>
  items.map((item, index) => {
    // `summary.holdings` 는 입력 순서를 그대로 보존한다(1:1 매핑) — 인덱스로 짝을 맞춘다.
    const breakdown = summary.holdings[index];
    const freshness = breakdown?.market?.freshness ?? null;
    const included = breakdown?.includedInTotals ?? false;

    return {
      ticker: item.ticker,
      name: freshness === 'manual' ? '' : resolvePortfolioTickerName(item.ticker),
      badge: freshness === 'preset' ? 'stale-price' : freshness === 'manual' ? 'manual' : null,
      quantityInput: item.quantityInput,
      marketValue: included ? formatAmount(breakdown.valueUsd) : DASH,
      annualNet: included ? formatAmount(breakdown.annualDividendAfterTaxUsd) : DASH,
      note: breakdown ? buildRowNote(breakdown) : null
    };
  });

const countByFreshness = (summary: PortfolioSummary, freshness: 'preset' | 'manual'): number =>
  summary.holdings.filter((row) => row.includedInTotals && row.market?.freshness === freshness).length;

const buildSummaryNotes = (summary: PortfolioSummary): string[] => {
  const notes: string[] = [];

  const staleCount = countByFreshness(summary, 'preset');
  if (staleCount > 0) notes.push(copy.summary.staleTickerNote(staleCount));

  const manualCount = summary.holdings.filter(
    (row) => row.exclusion === 'no-payout-months' && row.market?.freshness === 'manual'
  ).length;
  if (manualCount > 0) notes.push(copy.summary.manualExcludedNote(manualCount));

  const missingScheduleCount = summary.holdings.filter(
    (row) => row.exclusion === 'no-payout-months' && row.market?.freshness !== 'manual'
  ).length;
  if (missingScheduleCount > 0) notes.push(copy.summary.missingScheduleNote(missingScheduleCount));

  return notes;
};

const buildAssumptionRows = (summary: PortfolioSummary, fx: PortfolioFxView): PortfolioAssumptionRow[] => {
  const fxDate = formatPortfolioFxDate(fx.asOf);
  const rows: PortfolioAssumptionRow[] = [
    {
      label: copy.assumptions.priceBasis,
      value: summary.asOf
        ? copy.assumptions.priceBasisValue(formatPortfolioSnapshotDate(summary.asOf))
        : copy.assumptions.priceBasisUnknown
    },
    {
      label: copy.assumptions.fxBasis,
      value:
        fx.rate === null || fxDate === null
          ? copy.assumptions.fxBasisMissing
          : copy.assumptions.fxBasisValue(formatPortfolioFxRate(fx.rate), fxDate)
    },
    { label: copy.assumptions.distribution, value: copy.assumptions.distributionValue }
  ];

  const staleCount = countByFreshness(summary, 'preset');
  if (staleCount > 0) {
    rows.push({ label: copy.assumptions.stalePrice, value: copy.assumptions.stalePriceValue(staleCount) });
  }

  const manualCount = countByFreshness(summary, 'manual');
  if (manualCount > 0) {
    rows.push({ label: copy.assumptions.manual, value: copy.assumptions.manualValue(manualCount) });
  }

  return rows;
};

/** 저장 실패 문구. 읽기 실패(E)와 쓰기 실패(F)는 사용자가 할 수 있는 일이 달라 문장이 다르다. */
const buildStorageError = (
  status: PortfolioHoldingsStatus,
  writeError: PortfolioStorageFailureReason | null
): string | null => {
  if (status === 'read-error') return copy.error.readFailed;

  return writeError === null ? null : copy.error.writeFailed;
};

/**
 * CTA 3종. 비활성이면 **반드시 사유**가 붙는다.
 *
 * 상태 D(수량을 하나도 안 넣음)에서는 셋 다 비활성이다 — 이 화면의 세 CTA 는 전부 "지금 이 포트폴리오"를
 * 다른 화면으로 들고 가는 동작이라, 들고 갈 것이 없으면 눌러도 빈 화면에 도착한다.
 */
const buildCtas = (
  input: PortfolioViewModelInput,
  hasIncludedRows: boolean
): Pick<PortfolioViewModel, 'simulateCta' | 'goalCta' | 'calendarCta'> => {
  const { fx, canSimulate, simulationExcludedCount, calendarTickerCount, calendarExcludedCount } = input;

  const simulateHint = (): string | null => {
    if (!hasIncludedRows) return copy.cta.simulateDisabledEmpty;
    if (fx.rate === null) return copy.cta.simulateDisabledFx;
    if (!canSimulate) return copy.cta.simulateDisabledUnsupported;

    return simulationExcludedCount > 0 ? copy.cta.simulateExcluded(simulationExcludedCount) : null;
  };

  const calendarHint = (): string | null => {
    if (!hasIncludedRows) return copy.cta.simulateDisabledEmpty;
    if (calendarTickerCount === 0) return copy.cta.calendarDisabled;

    return calendarExcludedCount > 0 ? copy.cta.calendarManualExcluded : null;
  };

  return {
    simulateCta: { disabled: !hasIncludedRows || !canSimulate, hint: simulateHint() },
    goalCta: { disabled: !hasIncludedRows, hint: hasIncludedRows ? null : copy.cta.simulateDisabledEmpty },
    calendarCta: {
      disabled: !hasIncludedRows || calendarTickerCount === 0,
      hint: calendarHint()
    }
  };
};

const emptyTile = (label: string, hint?: string): PortfolioTileModel => ({ label, value: DASH, hint });

export const buildPortfolioViewModel = (input: PortfolioViewModelInput): PortfolioViewModel => {
  const { status, items, summary, fx, formatAmount, pendingUndo } = input;

  const isLoading = status === 'loading';
  const hasIncludedRows = summary.counts.included > 0;
  const taxPercent = summary.taxRatePercent;

  const heroTile: PortfolioTileModel = {
    label: copy.summary.tiles.monthlyNet,
    value: hasIncludedRows ? formatAmount(summary.monthlyDividendAfterTaxUsd) : DASH,
    // 수량이 하나도 없으면 "왜 0인가"가 먼저다 — 계산 근거 대신 다음 행동을 말한다.
    hint: hasIncludedRows ? copy.summary.tiles.monthlyNetHint : copy.summary.tiles.monthlyNetHintEmpty
  };

  const tiles: PortfolioTileModel[] = hasIncludedRows
    ? [
        {
          label: copy.summary.tiles.marketValue,
          value: formatAmount(summary.totalValueUsd),
          hint: summary.asOf
            ? copy.summary.tiles.marketValueHint(formatPortfolioSnapshotDate(summary.asOf))
            : copy.summary.tiles.marketValueHintUnknown
        },
        {
          label: copy.summary.tiles.annualNet,
          value: formatAmount(summary.annualDividendAfterTaxUsd),
          hint: copy.summary.tiles.annualNetHint(taxPercent)
        },
        {
          label: copy.summary.tiles.yield,
          value: `${summary.weightedYieldPercent.toFixed(2)}%`,
          hint: copy.summary.tiles.yieldHint
        },
        buildThisMonthTile(summary, formatAmount),
        buildNextPayoutTile(summary)
      ]
    : [
        emptyTile(copy.summary.tiles.marketValue),
        emptyTile(copy.summary.tiles.annualNet),
        emptyTile(copy.summary.tiles.yield),
        emptyTile(copy.summary.tiles.thisMonth),
        emptyTile(copy.summary.tiles.nextPayout)
      ];

  return {
    isLoading,
    showEmptyState: !isLoading && items.length === 0,
    asOfLine: buildPortfolioAsOfLine(summary, fx),
    storageError: buildStorageError(status, input.writeError),
    fxError: fx.status === 'error' ? copy.error.fxFailed : null,
    heroTile,
    tiles,
    /*
     * #3(월 평균)과 #6(이번 달)은 정의가 다르다. 분기 배당만 보유하면 "월 배당은 있는데 이번 달은 0"이
     * 정상인데, 설명이 없으면 계산 오류로 읽힌다.
     */
    showMonthlyVsThisMonthNote:
      hasIncludedRows && summary.thisMonthDividendUsd <= 0 && summary.monthlyDividendAfterTaxUsd > 0,
    summaryNotes: buildSummaryNotes(summary),
    rows: buildRows(items, summary, formatAmount),
    holdingsCount: items.length,
    ...buildCtas(input, hasIncludedRows),
    assumptions: {
      summaryLabel: copy.assumptions.summary(taxPercent),
      rows: buildAssumptionRows(summary, fx)
    },
    undoMessage: pendingUndo === null ? null : copy.undo.deleted(pendingUndo.ticker)
  };
};

export type PortfolioLiveMessageInput = {
  status: PortfolioHoldingsStatus;
  holdingsCount: number;
  hasIncludedRows: boolean;
  /** 이미 포맷된 월 배당(세후) 문자열. */
  monthlyText: string;
  fxFailed: boolean;
};

/**
 * 라이브 리전 기본 문구(사건이 없을 때). 추가·삭제·실행 취소·중복 안내처럼 **사건성** 문구는
 * 컨테이너가 따로 실어 보낸다 — 파생값으로는 "방금 무슨 일이 있었는지"를 표현할 수 없다.
 */
export const buildPortfolioLiveMessage = (input: PortfolioLiveMessageInput): string => {
  if (input.status === 'loading') return copy.live.loading;
  if (input.status === 'read-error') return copy.error.readFailed;
  if (input.holdingsCount === 0) return copy.live.empty;

  const summaryMessage = input.hasIncludedRows
    ? copy.live.summary(input.monthlyText, input.holdingsCount)
    : copy.live.empty;

  return input.fxFailed ? `${summaryMessage} ${copy.live.fxFailed}` : summaryMessage;
};

/**
 * GA `portfolio_summary_view` 의 평가금액 버킷 경계(**USD**).
 *
 * 원값 대신 버킷만 보내는 규칙(analytics.ts)에 더해, **원화가 아니라 달러**로 버킷을 만든다 —
 * 환율 조회에 실패한 세션과 성공한 세션이 같은 축에 놓여야 분포를 비교할 수 있기 때문이다.
 */
export const PORTFOLIO_VALUE_BUCKET_EDGES_USD = [1_000, 10_000, 50_000, 100_000, 500_000] as const;
