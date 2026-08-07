import type { PortfolioHoldingBreakdown, PortfolioSummary } from '@/shared/lib/portfolio';
import { PORTFOLIO_COPY } from '../copy';
import { formatPortfolioDate, resolvePortfolioTickerName } from '../utils';
import type { PortfolioHoldingRow, PortfolioHoldingsStatus } from '../hooks';
import type { PortfolioStorageFailureReason } from '../utils';
import type {
  PortfolioAssumptionRow,
  PortfolioRowModel,
  PortfolioTileModel,
  PortfolioViewModel
} from './PortfolioPage.types';
// 다음 예상 지급일 타일(#7)은 정렬·묶기 규칙이 촘촘해 별도 파일로 뗐다 — 여기서 재-export 로
// 기존 배럴 표면(`buildNextPayoutTile`)을 그대로 유지한다.
import { buildNextPayoutDDay, buildNextPayoutTile } from './PortfolioPage.nextPayoutTile';
import { buildMonthlyRecap } from './PortfolioPage.monthlyRecap';
export { buildNextPayoutDDay, buildNextPayoutTile } from './PortfolioPage.nextPayoutTile';

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
  /**
   * USD 한 값을 화면 문자열로. 환율 가드는 컨테이너가 이미 통과시킨 상태다(§5 포맷 계약).
   *
   * ⚠ 이름의 `Usd` 는 장식이 아니라 **입력 단위**다 — 목표 카드가 쓰는 원화 입력 포맷터
   * (`formatKrwAmount`)와 시그니처가 같아 서로 바꿔 넣어도 tsc 가 잡지 못하고, 화면에는
   * 환율배 틀린 숫자가 오류 없이 그려진다.
   */
  formatUsdAmount: (usd: number) => string;
  /**
   * '오늘'. 히어로 D-Day 의 기준이고, **컨테이너가 마운트 시점에 한 번 고정한 값**이다
   * (`Date.now()` 를 여기서 읽으면 렌더마다 답이 달라져 테스트가 결정적이지 않다).
   */
  today: Date;
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

/**
 * 시세 기준일 표기. 구현 정본은 `pages/Portfolio/utils` 의 `formatPortfolioDate` 이고(목표 카드의
 * 투자 시작일도 같은 함수를 쓴다), 여기서는 페이지 배럴의 공개 이름만 유지한다.
 */
export { formatPortfolioDate as formatPortfolioSnapshotDate } from '../utils';

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

  if (summary.asOf) parts.push(copy.hero.asOfPrice(formatPortfolioDate(summary.asOf)));

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

/**
 * 이번 달 예상 배당 타일(#6). **`₩0` 을 그리지 않는다** — 0원 표기는 오류로 읽히므로 문장으로 말한다.
 */
export const buildThisMonthTile = (
  summary: PortfolioSummary,
  formatUsdAmount: (usd: number) => string
): PortfolioTileModel => {
  const payingCount = summary.holdings.filter((row) => row.thisMonthDividendUsd > 0).length;

  if (payingCount > 0) {
    return {
      label: copy.summary.tiles.thisMonth,
      value: formatUsdAmount(summary.thisMonthDividendUsd),
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
  formatUsdAmount: (usd: number) => string
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
      marketValue: included ? formatUsdAmount(breakdown.valueUsd) : DASH,
      annualNet: included ? formatUsdAmount(breakdown.annualDividendAfterTaxUsd) : DASH,
      /*
       * 🔴 총액이 0 이면 `null` 이다 — 0 으로 나누면 `Infinity`/`NaN` 이 그대로 막대 폭·도넛 각도로
       * 흘러 들어간다(둘 다 CSS 에서 조용히 무시돼 "왜 안 보이지"로만 드러난다).
       * 계산에서 빠진 행도 `null` 이다: 금액 자리에 `—` 를 쓰면서 비중만 숫자를 주면 두 셀이 다른 말을 한다.
       */
      weightPercent:
        included && breakdown && summary.totalValueUsd > 0
          ? (breakdown.valueUsd / summary.totalValueUsd) * 100
          : null,
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
        ? copy.assumptions.priceBasisValue(formatPortfolioDate(summary.asOf))
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
 * CTA 2종. 비활성이면 **반드시 사유**가 붙는다.
 *
 * 상태 D(수량을 하나도 안 넣음)에서는 둘 다 비활성이다 — 이 화면의 두 CTA 는 "지금 이 포트폴리오"를
 * 다른 화면으로 들고 가는 동작이라, 들고 갈 것이 없으면 눌러도 빈 화면에 도착한다.
 * (구 세 번째 CTA "목표까지 얼마나 왔는지 보기"는 목적지였던 `/dividend/goal` 이 이 페이지의
 * 목표 달성 카드로 흡수되면서 사라졌다 — 바로 아래에 보이는 카드로 보내는 버튼은 소음이다.)
 */
const buildCtas = (
  input: PortfolioViewModelInput,
  hasIncludedRows: boolean
): Pick<PortfolioViewModel, 'simulateCta' | 'calendarCta'> => {
  const { fx, canSimulate, simulationExcludedCount, calendarTickerCount, calendarExcludedCount } = input;

  const simulateHint = (): string | null => {
    if (!hasIncludedRows) return copy.cta.simulateDisabledEmpty;
    // 조회 중을 실패보다 **먼저** 본다 — 아직 실패하지 않은 상태를 "불러오지 못했다"고 말하지 않는다.
    if (fx.status === 'loading') return copy.cta.simulateDisabledFxLoading;
    if (fx.rate === null) return copy.cta.simulateDisabledFx;
    if (!canSimulate) return copy.cta.simulateDisabledUnsupported;

    return simulationExcludedCount > 0 ? copy.cta.simulateExcluded(simulationExcludedCount) : null;
  };

  const calendarHint = (): string | null => {
    // 🔴 달력의 사유는 **달력의 말**이어야 한다 — 종전에는 시뮬레이션 문장을 그대로 빌려 썼고,
    //    두 버튼이 한 카드에 있어 뷰가 같은 문장을 한 번만 그리는 바람에 드러나지 않았을 뿐이다.
    if (!hasIncludedRows) return copy.cta.calendarDisabledEmpty;
    if (calendarTickerCount === 0) return copy.cta.calendarDisabled;

    return calendarExcludedCount > 0 ? copy.cta.calendarManualExcluded : null;
  };

  return {
    simulateCta: { disabled: !hasIncludedRows || !canSimulate, hint: simulateHint() },
    calendarCta: {
      disabled: !hasIncludedRows || calendarTickerCount === 0,
      hint: calendarHint()
    }
  };
};

const emptyTile = (label: string, hint?: string): PortfolioTileModel => ({ label, value: DASH, hint });

export const buildPortfolioViewModel = (input: PortfolioViewModelInput): PortfolioViewModel => {
  const { status, items, summary, fx, formatUsdAmount, pendingUndo } = input;

  const isLoading = status === 'loading';
  const hasIncludedRows = summary.counts.included > 0;
  const taxPercent = summary.taxRatePercent;

  const heroTile: PortfolioTileModel = {
    label: copy.summary.tiles.monthlyNet,
    value: hasIncludedRows ? formatUsdAmount(summary.monthlyDividendAfterTaxUsd) : DASH,
    // 수량이 하나도 없으면 "왜 0인가"가 먼저다 — 계산 근거 대신 다음 행동을 말한다.
    hint: hasIncludedRows ? copy.summary.tiles.monthlyNetHint : copy.summary.tiles.monthlyNetHintEmpty
  };

  const tiles: PortfolioTileModel[] = hasIncludedRows
    ? [
        {
          label: copy.summary.tiles.marketValue,
          value: formatUsdAmount(summary.totalValueUsd),
          hint: summary.asOf
            ? copy.summary.tiles.marketValueHint(formatPortfolioDate(summary.asOf))
            : copy.summary.tiles.marketValueHintUnknown
        },
        {
          label: copy.summary.tiles.annualNet,
          value: formatUsdAmount(summary.annualDividendAfterTaxUsd),
          hint: copy.summary.tiles.annualNetHint(taxPercent)
        },
        {
          label: copy.summary.tiles.yield,
          value: `${summary.weightedYieldPercent.toFixed(2)}%`,
          hint: copy.summary.tiles.yieldHint
        },
        buildThisMonthTile(summary, formatUsdAmount),
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
    /*
     * 🔴 로딩 중에는 D-Day 를 그리지 않는다. 저장소를 읽는 동안 보유 목록은 비어 있어 결과가
     * "지급 없음"과 구분되지 않는데, 히어로는 골격(스켈레톤)이 없는 자리라 **줄이 나타났다 사라진다**.
     * 아직 모르는 것을 먼저 말하지 않는다.
     */
    dDay: isLoading ? null : buildNextPayoutDDay(summary, input.today),
    storageError: buildStorageError(status, input.writeError),
    fxError: fx.status === 'error' ? copy.error.fxFailed : null,
    heroTile,
    tiles,
    /*
     * #3(월 평균)과 #6(이번 달)은 정의가 다르다. 분기 배당만 보유하면 "월 배당은 있는데 이번 달은 0"이
     * 정상인데, 설명이 없으면 계산 오류로 읽힌다.
     */
    /* 지급월을 아는 종목이 없으면 부품이 안 그린다 — 모델은 항상 만들고 판단은 화면이 한다. */
    monthlyRecap: buildMonthlyRecap(summary),
    showMonthlyVsThisMonthNote:
      hasIncludedRows && summary.thisMonthDividendUsd <= 0 && summary.monthlyDividendAfterTaxUsd > 0,
    summaryNotes: buildSummaryNotes(summary),
    rows: buildRows(items, summary, formatUsdAmount),
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
  /**
   * 목표 달성률(0..100). 목표 카드가 값을 가진 채 떠 있을 때만 숫자이고, 그 외에는 `null`.
   *
   * **새 라이브 리전을 만들지 않는다** — 두 번째 `role="status"` 를 두면 진입 시 두 문장이 겹쳐 낭독된다.
   */
  goalProgressPercent: number | null;
};

/**
 * 라이브 리전 기본 문구(사건이 없을 때). 추가·삭제·실행 취소·중복 안내처럼 **사건성** 문구는
 * 컨테이너가 따로 실어 보낸다 — 파생값으로는 "방금 무슨 일이 있었는지"를 표현할 수 없다.
 */
export const buildPortfolioLiveMessage = (input: PortfolioLiveMessageInput): string => {
  if (input.status === 'loading') return copy.live.loading;
  if (input.status === 'read-error') return copy.error.readFailed;

  const parts: string[] = [
    input.holdingsCount === 0 || !input.hasIncludedRows
      ? copy.live.empty
      : copy.live.summary(input.monthlyText, input.holdingsCount)
  ];

  if (input.goalProgressPercent !== null) parts.push(copy.goal.live.progress(input.goalProgressPercent));
  // 보유가 하나도 없으면 환율 실패는 사용자가 지금 겪는 문제가 아니다(환산할 값 자체가 없다).
  if (input.fxFailed && input.holdingsCount > 0) parts.push(copy.live.fxFailed);

  return parts.join(' ');
};

/**
 * GA `portfolio_summary_view` 의 평가금액 버킷 경계(**USD**).
 *
 * 원값 대신 버킷만 보내는 규칙(analytics.ts)에 더해, **원화가 아니라 달러**로 버킷을 만든다 —
 * 환율 조회에 실패한 세션과 성공한 세션이 같은 축에 놓여야 분포를 비교할 수 있기 때문이다.
 */
export const PORTFOLIO_VALUE_BUCKET_EDGES_USD = [1_000, 10_000, 50_000, 100_000, 500_000] as const;
