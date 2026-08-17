import { computePortfolioSummary } from '@/shared/lib/portfolio';
import type { PortfolioHolding, PortfolioMarketInfoResolver } from '@/shared/lib/portfolio';
import { formatKRW, formatUSD } from '@/shared/utils';
import { LEDGER_COPY } from '../copy';
import type { LedgerDividendBody, LedgerDividendModel, LedgerRowModel } from '../types';
import type { LedgerMonthCursor } from './ledgerFormat';
import { storageKey } from '@/shared/lib/storage';

const copy = LEDGER_COPY;

/**
 * B-4 **배당 겹쳐 보기**의 계산 — 전부 순수 함수다(시계·네트워크·DOM 을 읽지 않는다).
 *
 * ## 이 파일이 하지 않는 일
 * 🔴 **시트에 쓰지 않는다.** 배당은 화면 오버레이 전용이라 이 경로에는 `writeValues`·`deleteRow` 로
 * 가는 길 자체가 없다. 사용자 시트에 앱이 추정치를 기입하면 되돌릴 수 없고, 사용자가 실제 입금을
 * 이미 적어 뒀다면 이중 계상이 된다.
 * 🔴 **월 요약 3숫자(수입·지출·합계)를 만들지 않는다.** 여기서 나오는 값은 별도 카드에만 들어가고
 * `summarizeMonth` 의 결과에 한 번도 더해지지 않는다 — 가계부의 총합 정의는 하나로 유지된다.
 * 🔴 **`shared/lib/portfolio` 를 고치지 않는다.** `computePortfolioSummary` 를 읽기만 한다.
 *
 * ## 출처
 * 예상 배당의 유일한 근거는 **내 포트폴리오의 실보유**(`/dividend/portfolio` 의 저장소)다. 시뮬레이터
 * 상태는 가설 시나리오의 구성이지 보유가 아니고, 배당 캘린더는 지급월 데이터의 출처일 뿐 금액 주체가
 * 아니다. 그리고 "배당을 실제로 받고 있는가"는 앱이 알 수 없다 — 입금 내역을 보지 못한다. 그래서
 * 모든 산출물이 **예상**이고 카피도 그렇게 말한다.
 */

/**
 * 토글 상태 저장 키. 🔴 `hungryhippo:ledger:links`·`hungryhippo:ledger:blend` 와 **별개**이고,
 * 지우면 완전히 원상복구된다(기본값 = 꺼짐).
 */
export const LEDGER_DIVIDEND_OVERLAY_KEY = storageKey('ledger:dividend-overlay');

/**
 * 저장값 → 켜짐 여부. **`'on'` 만 켜짐**이고 나머지(없음·`'off'`·불량 값)는 전부 꺼짐이다 —
 * `parseStoredSheetLinks` 와 같은 관용 원칙(모르는 값에 화내지 않고 조용히 기본으로 떨어진다).
 */
export const parseLedgerDividendOverlay = (raw: string | null): boolean => raw === 'on';

/**
 * 🔴 `pages/Ledger` 에서 `localStorage` 를 만지는 **유일한 자리**다(소스 가드가 그것을 잠근다).
 * 여기 들어가는 값은 `'on' | 'off'` 닫힌 열거형뿐이라 가계부 값·시트 정보가 새어 나갈 자리가 없다.
 * 저장소를 못 여는 환경(프라이빗 모드·차단)에서는 조용히 꺼짐으로 떨어진다 — 화면은 계속 동작한다.
 */
export const readLedgerDividendOverlay = (): boolean => {
  try {
    return parseLedgerDividendOverlay(window.localStorage.getItem(LEDGER_DIVIDEND_OVERLAY_KEY));
  } catch {
    return false;
  }
};

export const writeLedgerDividendOverlay = (isOn: boolean): void => {
  try {
    window.localStorage.setItem(LEDGER_DIVIDEND_OVERLAY_KEY, isOn ? 'on' : 'off');
  } catch {
    // 저장하지 못해도 이번 세션의 토글은 계속 동작한다. 실패를 화면에 띄울 만한 사건이 아니다.
  }
};

/** 분류별 지출 소계. 정렬은 `foldExpenseByCategory` 가 정한다. */
export type LedgerExpenseCategoryTotal = { category: string; amount: number };

/** 그 달 지출 합계(원). 🔴 `LedgerRowModel.amount` 는 항상 양수이고 방향은 `kind` 가 갖는다. */
export const sumMonthExpense = (rows: readonly LedgerRowModel[]): number => {
  let total = 0;
  for (const row of rows) {
    if (row.kind === 'expense') total += row.amount;
  }
  return total;
};

/**
 * 그 달 지출을 분류별 합계로 접는다 — **작은 것부터**, 동점이면 이름 사전순(ko).
 *
 * ⚠ 동점 정렬 규칙이 필요한 이유: 두 분류의 합계가 같으면 `Map` 삽입 순서(=시트 행 순서)가 결과를
 * 좌우해, 같은 데이터에서 시트를 조금 손대는 것만으로 "덮는 분류" 문장이 흔들린다.
 * ⚠ 분류가 비어 있는 행은 **이름을 말할 수 없으므로** 목록에서 빠진다. 다만 지출 **합계**
 * (`sumMonthExpense`)에는 그대로 들어간다 — 커버율은 그 달 지출 전부를 분모로 써야 한다.
 */
export const foldExpenseByCategory = (rows: readonly LedgerRowModel[]): LedgerExpenseCategoryTotal[] => {
  const totals = new Map<string, number>();

  for (const row of rows) {
    if (row.kind !== 'expense') continue;
    const category = row.category.trim();
    if (category.length === 0) continue;
    totals.set(category, (totals.get(category) ?? 0) + row.amount);
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((left, right) => left.amount - right.amount || left.category.localeCompare(right.category, 'ko'));
};

/**
 * 예상 배당(세후·원) 안에 들어오는 분류 이름 — 작은 분류부터 누적하고 **처음 넘치는 곳에서 멈춘다**.
 *
 * 넘치는 분류를 건너뛰고 더 작은 다음 것을 담지 않는 이유: 정렬이 오름차순이라 뒤에 오는 것은 전부
 * 더 크다(건너뛰어도 담을 것이 없다). "여기까지 덮습니다"라는 문장이 그대로 읽히는 것도 이 규칙이다.
 */
export const coveredExpenseCategories = (
  rows: readonly LedgerRowModel[],
  budgetKrw: number
): string[] => {
  if (!Number.isFinite(budgetKrw) || budgetKrw <= 0) return [];

  const names: string[] = [];
  let cumulative = 0;

  for (const { category, amount } of foldExpenseByCategory(rows)) {
    if (cumulative + amount > budgetKrw) break;
    cumulative += amount;
    names.push(category);
  }

  return names;
};

/**
 * 지출 커버율. 🔴 **지출이 0 이면 `null`** — 0 으로 나눈 결과를 100% 로 위장하는 것은 날조다.
 */
export const expenseCoverageRatio = (dividendKrw: number, expenseKrw: number): number | null =>
  expenseKrw > 0 ? dividendKrw / expenseKrw : null;

/**
 * 커버율 → 표시 문자열. 반올림해서 `0%` 가 되는 구간은 "1% 미만"으로 쓴다 —
 * `0%` 로 적으면 "배당이 아예 없다"로 읽힌다.
 */
export const formatCoveragePercent = (ratio: number): string => {
  const percent = ratio * 100;
  if (percent > 0 && percent < 1) return copy.dividend.coverageUnderOne;
  return copy.dividend.coveragePercent(Math.round(percent));
};

export type LedgerDividendInput = {
  /** 토글 상태. 꺼져 있으면 아무 계산도 하지 않는다. */
  isOn: boolean;
  /** 포트폴리오 저장소 상태(`usePortfolioHoldings`). */
  portfolioStatus: 'loading' | 'ready' | 'read-error';
  holdings: readonly PortfolioHolding[];
  /** 배당소득세(%). 포트폴리오 화면이 쥔 값을 그대로 쓴다(가계부가 따로 정하지 않는다). */
  taxRatePercent: number;
  /** 1 USD = N KRW. 🔴 환율 상태가 `success`/`stale` 이 아니면 `null` 이어야 한다. */
  fxRateKrwPerUsd: number | null;
  /** **보고 있는 달**. 오늘이 아니라 화면의 월 커서다. */
  cursor: LedgerMonthCursor;
  /** 보고 있는 달의 가계부 행. */
  rows: readonly LedgerRowModel[];
  /** 시장 정보 해석기 주입(테스트용). 기본은 실제 스냅샷/프리셋 해석기. */
  resolve?: PortfolioMarketInfoResolver;
};

/**
 * 보고 있는 달의 배당 지표.
 *
 * ⚠ `computePortfolioSummary` 에 넘기는 `today` 는 **월 커서의 1일**이다. 그 함수가 `today` 에서
 * 읽는 것은 "이번 달이 몇 월인가"(`thisMonthDividendUsd`)뿐이라, 8월 화면에서는 8월 지급 종목이
 * 계상된다. 같은 호출의 `nextPayout` 은 이 화면에서 쓰지 않는다(그 값만 오늘 기준이 아니다).
 */
export const buildLedgerDividendModel = (input: LedgerDividendInput): LedgerDividendModel => ({
  isOn: input.isOn,
  body: input.isOn ? buildBody(input) : null
});

const buildBody = (input: LedgerDividendInput): LedgerDividendBody => {
  if (input.portfolioStatus === 'loading') return { kind: 'loading' };
  if (input.portfolioStatus === 'read-error') return { kind: 'unavailable' };

  const summary = computePortfolioSummary(input.holdings, {
    today: new Date(input.cursor.year, input.cursor.month - 1, 1),
    taxRatePercent: input.taxRatePercent,
    ...(input.resolve ? { resolve: input.resolve } : {})
  });

  // 합계에 들어가는 보유가 없다 = 계산의 근거가 없다. 0 원이라고 말하지 않는다.
  if (summary.counts.included === 0) return { kind: 'no-holdings' };

  const unknownScheduleCount = summary.exclusions.filter(
    (exclusion) => exclusion.reason === 'no-payout-months'
  ).length;

  const afterTaxUsd = summary.thisMonthDividendUsd * (1 - summary.taxRatePercent / 100);
  // 보유는 있지만 이 달에 지급이 없다 — 진짜 0 이므로 사유를 말한다(커버율도 만들지 않는다).
  if (afterTaxUsd <= 0) return { kind: 'no-payout' };

  const rate = input.fxRateKrwPerUsd;
  if (rate === null) {
    return { kind: 'fx-unavailable', usdText: formatUSD(afterTaxUsd), unknownScheduleCount };
  }

  const afterTaxKrw = afterTaxUsd * rate;
  const expenseKrw = sumMonthExpense(input.rows);
  const ratio = expenseCoverageRatio(afterTaxKrw, expenseKrw);

  return {
    kind: 'metrics',
    amountText: formatKRW(afterTaxKrw),
    coverageText: ratio === null ? null : formatCoveragePercent(ratio),
    // 지출이 없는 달에는 덮을 대상 자체가 없다 — 목록도 만들지 않는다.
    coveredCategories: ratio === null ? [] : coveredExpenseCategories(input.rows, afterTaxKrw),
    unknownScheduleCount
  };
};
