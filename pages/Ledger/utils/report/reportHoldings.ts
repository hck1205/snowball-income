/**
 * **자산과 투자** — 순자산 추이, 구성, 종류별 쌓기, 계좌별.
 *
 * 🔴 자산은 **잔액**이고 가계부는 **흐름**이다. 같은 파일에 두면 "이 숫자는 그 달에 쓴 돈인가
 *    그 달에 갖고 있던 돈인가"가 함수마다 달라진다.
 */
import type { HoldingRecord, InvestmentRecord } from '@/shared/lib/googleSheets';
import { netWorthByMonth } from '@/shared/lib/googleSheets';

import { toSlices } from './reportShared';
import type { ReportMonth, ReportSlice } from './reportShared';

/* ── 자산 ────────────────────────────────────────────────────────────────────── */

export type ReportNetWorthPoint = {
  readonly month: ReportMonth;
  readonly netWorth: number;
};

/** 🔴 적은 달만. 안 적은 달을 0 으로 채우면 추이가 바닥을 찍는다. */
export const netWorthTrend = (records: readonly HoldingRecord[]): readonly ReportNetWorthPoint[] =>
  [...netWorthByMonth(records).entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, netWorth]) => ({ month, netWorth }));

/**
 * 가장 최근에 적은 달의 자산 구성.
 *
 * 🔴 **부채를 섞지 않는다.** 자산 구성 파이에 부채를 한 조각으로 넣으면 "부채도 내 자산"으로
 *    읽힌다. 부채는 따로 돌려주고 화면이 그 옆에 세운다.
 */
export const latestHoldingMix = (
  records: readonly HoldingRecord[]
): { readonly month: ReportMonth | null; readonly assets: readonly ReportSlice[]; readonly debt: number } => {
  const months = [...new Set(records.map((record) => record.date.slice(0, 7)))].sort();
  const latest = months.at(-1) ?? null;
  if (latest === null) return { month: null, assets: [], debt: 0 };

  const totals = new Map<string, number>();
  let debt = 0;
  for (const record of records) {
    if (record.date.slice(0, 7) !== latest) continue;
    if (record.isDebt) {
      debt += record.amount;
      continue;
    }
    const key = record.name.trim().length > 0 ? record.name.trim() : record.kind;
    totals.set(key, (totals.get(key) ?? 0) + record.amount);
  }

  return { month: latest, assets: toSlices(totals), debt };
};

/* ── 투자 ────────────────────────────────────────────────────────────────────── */

/**
 * 티커별 매입금액 구성.
 *
 * 🔴 **평가금액이 아니라 매입금액**이다. 시세를 받아 오지 않으므로 평가금액을 낼 수 없고,
 *    낼 수 없는 것을 낸 척하지 않는다. 화면이 "매입금액 기준"이라고 밝힌다.
 * ⚠ 통화가 섞이면 더할 수 없다 — 통화별로 나눠 돌려준다.
 */
export const investmentMix = (
  records: readonly InvestmentRecord[]
): readonly { readonly currency: string; readonly slices: readonly ReportSlice[] }[] => {
  const byCurrency = new Map<string, Map<string, number>>();

  for (const record of records) {
    /* 매입단가를 안 적었으면 금액을 낼 수 없다 — 0 으로 세지 않고 뺀다. */
    if (record.unitCost === null) continue;
    const bucket = byCurrency.get(record.currency) ?? new Map<string, number>();
    bucket.set(record.ticker, (bucket.get(record.ticker) ?? 0) + record.unitCost * record.shares);
    byCurrency.set(record.currency, bucket);
  }

  return [...byCurrency.entries()]
    .map(([currency, totals]) => ({ currency, slices: toSlices(totals) }))
    .filter((group) => group.slices.length > 0)
    .sort((left, right) => left.currency.localeCompare(right.currency));
};

/* ── 자산 종류별 추이 ────────────────────────────────────────────────────────── */

export type ReportHoldingTrend = {
  readonly months: readonly ReportMonth[];
  readonly series: readonly { readonly label: string; readonly values: readonly number[] }[];
};

/**
 * 자산이 **무엇으로** 쌓여 왔나.
 *
 * 🔴 부채는 빼고 자산만 쌓는다 — 순자산 추이가 따로 있고, 여기에 부채를 섞으면 "무엇으로
 *    갖고 있나"라는 질문의 답이 아니게 된다.
 * ⚠ 적지 않은 달은 그 달 자체가 없다(0 으로 채우지 않는다).
 */
export const holdingKindTrend = (
  records: readonly HoldingRecord[],
  labelOfKind: (kind: HoldingRecord['kind']) => string
): ReportHoldingTrend => {
  const assets = records.filter((record) => !record.isDebt);
  const months = [...new Set(assets.map((record) => record.date.slice(0, 7)))].sort();
  if (months.length === 0) return { months: [], series: [] };

  const monthIndex = new Map(months.map((month, index) => [month, index]));
  const byKind = new Map<string, number[]>();
  for (const record of assets) {
    const label = labelOfKind(record.kind);
    const bucket = byKind.get(label) ?? months.map(() => 0);
    bucket[monthIndex.get(record.date.slice(0, 7)) as number] += record.amount;
    byKind.set(label, bucket);
  }

  return { months, series: [...byKind.entries()].map(([label, values]) => ({ label, values })) };
};

/* ── 투자 ────────────────────────────────────────────────────────────────────── */

/**
 * 계좌별 매입금액.
 *
 * ⚠ 통화가 섞이면 더할 수 없다 — `investmentMix` 와 같은 이유로 통화별로 나눈다.
 */
export const investmentByAccount = (
  records: readonly InvestmentRecord[]
): readonly { readonly currency: string; readonly slices: readonly ReportSlice[] }[] => {
  const byCurrency = new Map<string, Map<string, number>>();

  for (const record of records) {
    if (record.unitCost === null) continue;
    const account = record.account.trim().length > 0 ? record.account.trim() : '계좌 미기재';
    const bucket = byCurrency.get(record.currency) ?? new Map<string, number>();
    bucket.set(account, (bucket.get(account) ?? 0) + record.unitCost * record.shares);
    byCurrency.set(record.currency, bucket);
  }

  return [...byCurrency.entries()]
    .map(([currency, totals]) => ({ currency, slices: toSlices(totals) }))
    .filter((group) => group.slices.length > 0)
    .sort((left, right) => left.currency.localeCompare(right.currency));
};
