/**
 * **흐름** — 달마다의 수입·지출·저축률, 누적, 고정/변동, 주체별. 순수 함수만.
 *
 * ## 왜 새 계층인가
 *
 * `ledgerAnalysis.ts` 는 **보고 있는 달**을 접는다("어디에 몰렸나"). 여기는 **전 기간**을 본다
 * ("어떻게 흘러왔나"). 같은 파일에 두면 "이 숫자는 어느 기간인가"가 함수마다 달라져,
 * 화면이 그 차이를 매번 설명해야 한다.
 *
 * ## 🔴 지어내지 않는다
 *
 * - 기록이 없는 달은 **건너뛴다.** 0 으로 채우면 안 쓴 달과 안 적은 달이 같아 보이고,
 *   추이 그래프가 실제로는 없는 골짜기를 그린다.
 * - 수입이 0 인 달의 저축률은 **`null`** 이다. "수입이 없어서"와 "다 써서"는 다른 사실이다.
 * - 자산을 안 적은 달의 순자산도 `null` 이다(시트 수식·`netWorthByMonth` 와 같은 판단).
 *
 * ## 🔴 이체는 지출이 아니다
 *
 * 저축·투자 납입은 쓴 것이 아니라 옮긴 것이다. 이 파일의 모든 지출 집계에서 빠지고,
 * 필요한 곳에서는 따로 센다. (`ledgerAnalysis.ts` 와 같은 정의 — 두 곳이 갈리면 안 된다.)
 */
import { isSharedPayer } from '@/shared/constants/ledger';
import type { LedgerEntry } from '@/shared/lib/googleSheets';

import { alive, monthOf } from './reportShared';
import type { ReportMonth } from './reportShared';


/* ── 월별 현금흐름 ───────────────────────────────────────────────────────────── */

export type ReportMonthlyFlow = {
  readonly month: ReportMonth;
  readonly income: number;
  readonly expense: number;
  /** 저축·투자로 옮긴 돈. 🔴 지출과 따로 센다. */
  readonly transfer: number;
  /** 수입 − 지출. 이체는 빼지 않는다(옮긴 돈은 아직 내 돈이다). */
  readonly net: number;
  /**
   * 저축률. 🔴 수입이 0 이면 **`null`** — 0% 로 적으면 "다 써서 0%"와 구분이 사라진다.
   */
  readonly savingRate: number | null;
};

/**
 * 달별 수입·지출·이체.
 *
 * 🔴 **기록이 있는 달만** 돌려준다(오름차순). 없는 달을 0 으로 채우면 그래프가 없는 골짜기를 그린다.
 */
export const monthlyFlows = (entries: readonly LedgerEntry[]): readonly ReportMonthlyFlow[] => {
  const byMonth = new Map<ReportMonth, { income: number; expense: number; transfer: number }>();

  for (const entry of alive(entries)) {
    const month = monthOf(entry);
    const bucket = byMonth.get(month) ?? { income: 0, expense: 0, transfer: 0 };
    if (entry.kind === 'income') bucket.income += entry.amount;
    else if (entry.kind === 'expense') bucket.expense += entry.amount;
    else bucket.transfer += entry.amount;
    byMonth.set(month, bucket);
  }

  return [...byMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, bucket]) => ({
      month,
      income: bucket.income,
      expense: bucket.expense,
      transfer: bucket.transfer,
      net: bucket.income - bucket.expense,
      savingRate: bucket.income === 0 ? null : (bucket.income - bucket.expense) / bucket.income
    }));
};

/* ── 고정비·변동비 추이 ──────────────────────────────────────────────────────── */

export type ReportFixitySplit = {
  readonly month: ReportMonth;
  readonly fixed: number;
  readonly variable: number;
  /**
   * 지출에서 고정비가 차지하는 비율(0~1). 지출이 0 이면 `null`.
   *
   * 🔴 이 화면에서 가장 실행 가능한 숫자다 — 고정비는 계약을 바꿔야 줄고 변동비는 이번 달에 줄인다.
   */
  readonly fixedRatio: number | null;
};

export const fixityTrend = (entries: readonly LedgerEntry[]): readonly ReportFixitySplit[] => {
  const byMonth = new Map<ReportMonth, { fixed: number; variable: number }>();

  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    const month = monthOf(entry);
    const bucket = byMonth.get(month) ?? { fixed: 0, variable: 0 };
    if (entry.fixity === 'fixed') bucket.fixed += entry.amount;
    else bucket.variable += entry.amount;
    byMonth.set(month, bucket);
  }

  return [...byMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, bucket]) => {
      const total = bucket.fixed + bucket.variable;
      return {
        month,
        fixed: bucket.fixed,
        variable: bucket.variable,
        fixedRatio: total === 0 ? null : bucket.fixed / total
      };
    });
};

/* ── 주체별 ──────────────────────────────────────────────────────────────────── */

export type ReportPayerMonth = {
  readonly month: ReportMonth;
  /** 주체 → 그 달 지출. 🔴 공동은 하나의 주체다(겹치지 않게 나눈다 — `ledgerPayerScope.ts`). */
  readonly byPayer: ReadonlyMap<string, number>;
};

export const payerTrend = (
  entries: readonly LedgerEntry[],
  sharedLabel: string
): readonly ReportPayerMonth[] => {
  const byMonth = new Map<ReportMonth, Map<string, number>>();

  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    const month = monthOf(entry);
    const payer = isSharedPayer(entry.payer) ? sharedLabel : (entry.payer ?? '').trim();
    const bucket = byMonth.get(month) ?? new Map<string, number>();
    bucket.set(payer, (bucket.get(payer) ?? 0) + entry.amount);
    byMonth.set(month, bucket);
  }

  return [...byMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, byPayer]) => ({ month, byPayer }));
};

/* ── 누적 순현금 ─────────────────────────────────────────────────────────────── */

export type ReportCumulativePoint = {
  readonly month: ReportMonth;
  /** 그 달까지의 (수입 − 지출) 누계. */
  readonly cumulative: number;
};

/**
 * 달마다의 남은 돈을 **쌓아** 본다.
 *
 * 🔴 월별 막대는 "이 달 어땠나"를 말하고 이 선은 **"그래서 지금까지 얼마나 모았나"** 를 말한다.
 *    한 달만 나빴는지 계속 새고 있는지는 누계로만 보인다.
 * ⚠ 이체는 빼지 않는다 — 저축·투자로 옮긴 돈도 아직 내 돈이다(`ReportMonthlyFlow.net` 과 같은 정의).
 */
export const cumulativeNet = (flows: readonly ReportMonthlyFlow[]): readonly ReportCumulativePoint[] => {
  let running = 0;
  return flows.map((flow) => {
    running += flow.net;
    return { month: flow.month, cumulative: running };
  });
};
