/**
 * **한눈에 보기** — 가계부·자산·투자를 한 화면 분량의 숫자로 접는다. 순수 함수만.
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
import type { HoldingRecord, InvestmentRecord, LedgerEntry } from '@/shared/lib/googleSheets';
import { netWorthByMonth } from '@/shared/lib/googleSheets';

import { UNCLASSIFIED_LABEL } from './ledgerAnalysis';

/** `2026-08`. */
export type ReportMonth = string;

const monthOf = (entry: LedgerEntry): ReportMonth => entry.date.slice(0, 7);

/** 지운 행은 어디에도 세지 않는다. */
const alive = (entries: readonly LedgerEntry[]): readonly LedgerEntry[] =>
  entries.filter((entry) => (entry.status ?? '').trim().length === 0);

const labelOf = (raw: string | undefined): string => {
  const value = (raw ?? '').trim();
  return value.length > 0 ? value : UNCLASSIFIED_LABEL;
};

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

/* ── 구성(파이) ──────────────────────────────────────────────────────────────── */

export type ReportSlice = {
  readonly label: string;
  readonly value: number;
  /** 전체 대비 비율(0~1). */
  readonly ratio: number;
};

const toSlices = (totals: ReadonlyMap<string, number>): readonly ReportSlice[] => {
  const sum = [...totals.values()].reduce((total, value) => total + value, 0);
  if (sum <= 0) return [];
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value, ratio: value / sum }))
    .sort((left, right) => right.value - left.value);
};

/** 항목별 지출 구성. `month` 를 주면 그 달만, 없으면 전 기간. */
export const expenseByCategory = (
  entries: readonly LedgerEntry[],
  month?: ReportMonth
): readonly ReportSlice[] => {
  const totals = new Map<string, number>();
  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    if (month !== undefined && monthOf(entry) !== month) continue;
    const key = labelOf(entry.category);
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  }
  return toSlices(totals);
};

/** 결제수단별 지출. 🔴 카드 추천의 유일한 입력이 될 자리라 **적힌 값 그대로** 센다. */
export const expenseByMethod = (entries: readonly LedgerEntry[]): readonly ReportSlice[] => {
  const totals = new Map<string, number>();
  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    const key = labelOf(entry.method);
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  }
  return toSlices(totals);
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

/* ── 인사이트 ────────────────────────────────────────────────────────────────── */

export type ReportInsight = {
  readonly id: string;
  readonly text: string;
};

/** 평균을 낼 만큼의 달이 모였는가. 두 달로 "평균"을 말하면 그건 평균이 아니다. */
export const MIN_MONTHS_FOR_AVERAGE = 3;

/**
 * 숫자에서 **문장**을 만든다.
 *
 * 🔴 여기서 조언하지 않는다. "줄이세요" 는 투자·소비 권유에 가깝고, 무엇을 줄일지는 그 사람의
 *    사정이다. 이 문장들은 **관측**만 말한다 — "고정비가 지출의 62%입니다" 까지다.
 * 🔴 근거가 모자라면 아무 말도 하지 않는다. 빈 배열이 정상이다.
 */
export const buildInsights = (params: {
  readonly flows: readonly ReportMonthlyFlow[];
  readonly fixity: readonly ReportFixitySplit[];
  readonly netWorth: readonly ReportNetWorthPoint[];
}): readonly ReportInsight[] => {
  const insights: ReportInsight[] = [];
  const { flows, fixity, netWorth } = params;

  /* 저축률 평균 — 수입이 0 인 달은 애초에 셀 수 없으니 뺀다. */
  const rates = flows.map((flow) => flow.savingRate).filter((rate): rate is number => rate !== null);
  if (rates.length >= MIN_MONTHS_FOR_AVERAGE) {
    const average = rates.reduce((total, rate) => total + rate, 0) / rates.length;
    insights.push({
      id: 'saving-rate',
      text: `기록이 있는 ${rates.length}개월의 평균 저축률은 ${Math.round(average * 100)}%입니다.`
    });
  }

  /* 고정비 비중 — 가장 최근 달 기준. */
  const lastFixity = fixity.at(-1);
  if (lastFixity && lastFixity.fixedRatio !== null) {
    insights.push({
      id: 'fixed-ratio',
      text: `가장 최근 달 지출에서 고정비가 ${Math.round(lastFixity.fixedRatio * 100)}%를 차지합니다.`
    });
  }

  /* 순자산 변화 — 두 점이 있어야 "변했다"를 말할 수 있다. */
  if (netWorth.length >= 2) {
    const first = netWorth[0];
    const last = netWorth[netWorth.length - 1];
    const delta = last.netWorth - first.netWorth;
    const direction = delta === 0 ? '그대로입니다' : delta > 0 ? '늘었습니다' : '줄었습니다';
    insights.push({
      id: 'net-worth',
      text:
        `순자산은 ${first.month.replace('-', '년 ')}월부터 ${last.month.replace('-', '년 ')}월까지 `
        + `${Math.abs(Math.round(delta)).toLocaleString('ko-KR')}원 ${direction}.`
    });
  }

  /* 이체(저축·투자)로 옮긴 돈 — 지출과 헷갈리기 쉬운 자리라 숫자로 못 박는다. */
  const transferTotal = flows.reduce((total, flow) => total + flow.transfer, 0);
  if (transferTotal > 0) {
    insights.push({
      id: 'transfer',
      text:
        `저축·투자로 옮긴 돈은 모두 ${Math.round(transferTotal).toLocaleString('ko-KR')}원입니다. `
        + '이 금액은 지출 합계에 들어 있지 않습니다.'
    });
  }

  return insights;
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

/* ── 항목별 추이 ─────────────────────────────────────────────────────────────── */

export type ReportCategoryTrend = {
  readonly months: readonly ReportMonth[];
  /** 항목 이름 → 달별 금액(달 순서는 `months` 와 같다). */
  readonly series: readonly { readonly label: string; readonly values: readonly number[] }[];
};

/** 추이에 세울 항목 수. 그보다 많으면 읽을 수 없고, 나머지는 `기타` 한 줄로 접는다. */
export const CATEGORY_TREND_LIMIT = 5;

/**
 * 상위 항목이 **달마다 어떻게 움직였나.**
 *
 * 🔴 파이는 "지금 어떻게 나뉘나"를 말하고 이건 **"무엇이 늘고 있나"** 를 말한다 — 파이만 보면
 *    비중이 그대로여도 총액이 두 배가 된 것을 못 본다.
 * ⚠ 상위 밖 항목은 버리지 않고 `기타` 로 접는다. 버리면 달별 합이 실제 지출과 안 맞는다.
 */
export const categoryTrend = (
  entries: readonly LedgerEntry[],
  limit = CATEGORY_TREND_LIMIT
): ReportCategoryTrend => {
  const living = alive(entries).filter((entry) => entry.kind === 'expense');
  const months = [...new Set(living.map(monthOf))].sort();
  if (months.length === 0) return { months: [], series: [] };

  const totals = new Map<string, number>();
  for (const entry of living) {
    const key = labelOf(entry.category);
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  }
  const ranked = [...totals.entries()].sort(([, left], [, right]) => right - left).map(([label]) => label);
  const head = ranked.slice(0, limit);
  const headSet = new Set(head);
  const hasTail = ranked.length > head.length;

  const byLabel = new Map<string, number[]>();
  for (const label of head) byLabel.set(label, months.map(() => 0));
  if (hasTail) byLabel.set('기타', months.map(() => 0));

  const monthIndex = new Map(months.map((month, index) => [month, index]));
  for (const entry of living) {
    const key = labelOf(entry.category);
    const bucket = byLabel.get(headSet.has(key) ? key : '기타');
    if (!bucket) continue;
    bucket[monthIndex.get(monthOf(entry)) as number] += entry.amount;
  }

  return {
    months,
    series: [...byLabel.entries()].map(([label, values]) => ({ label, values }))
  };
};

/* ── 요일별 소비 리듬 ────────────────────────────────────────────────────────── */

export type ReportWeekdaySpending = {
  /** 0 = 일요일. */
  readonly weekday: number;
  readonly label: string;
  readonly total: number;
  /** 그 요일에 기록이 있던 날 수. */
  readonly days: number;
  /** 하루 평균. 🔴 요일마다 등장 횟수가 달라 **합계로 비교하면 왜곡**된다. */
  readonly average: number;
};

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 요일별 지출.
 *
 * 🔴 **합계가 아니라 평균으로 비교한다.** 기록 구간에 따라 월요일이 5번, 화요일이 4번일 수 있어
 *    합계로 세우면 그 차이가 소비 습관처럼 보인다.
 * ⚠ 하루에 여러 건이 있어도 그 날은 하루로 센다.
 */
export const weekdaySpending = (entries: readonly LedgerEntry[]): readonly ReportWeekdaySpending[] => {
  const totals = new Array(7).fill(0) as number[];
  const dates = Array.from({ length: 7 }, () => new Set<string>());

  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    const weekday = new Date(entry.date + 'T00:00:00').getDay();
    if (!Number.isFinite(weekday)) continue;
    totals[weekday] += entry.amount;
    dates[weekday].add(entry.date);
  }

  return WEEKDAY_LABEL.map((label, weekday) => {
    const days = dates[weekday].size;
    return {
      weekday,
      label,
      total: totals[weekday],
      days,
      average: days === 0 ? 0 : totals[weekday] / days
    };
  });
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

/* ── 요약 타일 ───────────────────────────────────────────────────────────────── */

export type ReportKpi = {
  readonly id: string;
  readonly label: string;
  /** 🔴 낼 수 없으면 `null` — 화면이 대시로 그리고 사유를 적는다. 0 으로 위장하지 않는다. */
  readonly value: number | null;
  readonly unit: 'krw' | 'percent';
  /** 왜 그 숫자인지 한 줄. */
  readonly note: string;
};

/**
 * 화면 맨 위의 큰 숫자 넷.
 *
 * 🔴 **낼 수 없는 값은 `null`** 이다. 자산을 안 적었으면 순자산은 0 이 아니라 없음이고,
 *    수입이 없는 달의 저축률도 없음이다.
 */
export const buildKpis = (params: {
  readonly flows: readonly ReportMonthlyFlow[];
  readonly fixity: readonly ReportFixitySplit[];
  readonly netWorth: readonly ReportNetWorthPoint[];
}): readonly ReportKpi[] => {
  const { flows, fixity, netWorth } = params;
  const lastFlow = flows.at(-1) ?? null;
  const lastFixity = fixity.at(-1) ?? null;
  const lastNetWorth = netWorth.at(-1) ?? null;

  const expenses = flows.map((flow) => flow.expense).filter((value) => value > 0);
  const averageExpense =
    expenses.length === 0 ? null : expenses.reduce((total, value) => total + value, 0) / expenses.length;

  return [
    {
      id: 'saving-rate',
      label: '최근 달 저축률',
      value: lastFlow?.savingRate ?? null,
      unit: 'percent',
      note: (lastFlow?.savingRate ?? null) === null ? '수입 기록이 없어 잴 수 없습니다.' : '수입에서 지출을 뺀 몫입니다.'
    },
    {
      id: 'average-expense',
      label: '월평균 지출',
      value: averageExpense,
      unit: 'krw',
      note: `지출이 있는 ${expenses.length}개월 평균입니다.`
    },
    {
      id: 'fixed-ratio',
      label: '고정비 비중',
      value: lastFixity?.fixedRatio ?? null,
      unit: 'percent',
      note: '최근 달 지출에서 고정비가 차지하는 몫입니다.'
    },
    {
      id: 'net-worth',
      label: '순자산',
      value: lastNetWorth?.netWorth ?? null,
      unit: 'krw',
      note:
        lastNetWorth === null
          ? '자산 탭에 잔액을 적으시면 여기에 나타납니다.'
          : `${lastNetWorth.month.slice(0, 4)}년 ${Number(lastNetWorth.month.slice(5))}월 기준입니다.`
    }
  ];
};

/* ── 돈의 흐름 (생키) ────────────────────────────────────────────────────────── */

export type ReportFlowNode = { readonly name: string };
export type ReportFlowLink = { readonly source: string; readonly target: string; readonly value: number };
export type ReportSankey = {
  readonly nodes: readonly ReportFlowNode[];
  readonly links: readonly ReportFlowLink[];
};

/** 흐름도의 가운데 마디 이름. 화면과 집계가 같은 글자를 봐야 한다. */
export const SANKEY_HUB = '들어온 돈';
/** 쓰지도 옮기지도 않고 남은 돈. */
export const SANKEY_LEFTOVER = '남은 돈';

/**
 * **돈이 어디서 와서 어디로 갔나** — 수입원 → 들어온 돈 → 항목별 지출 / 저축·투자 / 남은 돈.
 *
 * 🔴 이 그림이 가계부에서 가장 많은 것을 한 번에 말한다. 파이는 지출 안의 비율만 보여 주고
 *    막대는 달별 크기만 보여 주는데, 흐름도는 **번 돈이 어떻게 쪼개졌나**를 통째로 보여 준다.
 *
 * 🔴 **남은 돈이 음수면 그 마디를 만들지 않는다.** 생키는 음수 링크를 그릴 수 없고, 억지로
 *    0 으로 만들면 "딱 맞게 썼다"는 거짓이 된다 — 대신 화면이 그 사실을 문장으로 말한다.
 * ⚠ 수입이 없으면 빈 그림이다(그릴 원천이 없다).
 */
export const sankeyFlow = (
  entries: readonly LedgerEntry[],
  month?: ReportMonth
): ReportSankey & { readonly overspent: number } => {
  const living = alive(entries).filter((entry) => month === undefined || monthOf(entry) === month);

  const incomeBy = new Map<string, number>();
  const expenseBy = new Map<string, number>();
  const transferBy = new Map<string, number>();

  for (const entry of living) {
    const key = labelOf(entry.category);
    if (entry.kind === 'income') incomeBy.set(key, (incomeBy.get(key) ?? 0) + entry.amount);
    else if (entry.kind === 'expense') expenseBy.set(key, (expenseBy.get(key) ?? 0) + entry.amount);
    else transferBy.set(key, (transferBy.get(key) ?? 0) + entry.amount);
  }

  const income = [...incomeBy.values()].reduce((total, value) => total + value, 0);
  if (income <= 0) return { nodes: [], links: [], overspent: 0 };

  const outTotal =
    [...expenseBy.values()].reduce((total, value) => total + value, 0)
    + [...transferBy.values()].reduce((total, value) => total + value, 0);
  const leftover = income - outTotal;

  const names = new Set<string>([SANKEY_HUB]);
  const links: ReportFlowLink[] = [];

  for (const [name, value] of incomeBy) {
    if (value <= 0) continue;
    /* 🔴 수입 항목 이름이 지출 항목과 같을 수 있다 — 마디 이름이 겹치면 생키가 고리를 만든다. */
    const source = `${name} (수입)`;
    names.add(source);
    links.push({ source, target: SANKEY_HUB, value });
  }
  for (const [name, value] of [...expenseBy, ...transferBy]) {
    if (value <= 0) continue;
    names.add(name);
    links.push({ source: SANKEY_HUB, target: name, value });
  }
  if (leftover > 0) {
    names.add(SANKEY_LEFTOVER);
    links.push({ source: SANKEY_HUB, target: SANKEY_LEFTOVER, value: leftover });
  }

  return {
    nodes: [...names].map((name) => ({ name })),
    links,
    /* 🔴 번 것보다 쓴 것이 많으면 그 크기를 돌려준다 — 화면이 문장으로 말한다. */
    overspent: leftover < 0 ? -leftover : 0
  };
};

/* ── 일별 지출 (캘린더 히트맵) ───────────────────────────────────────────────── */

export type ReportDailySpending = {
  /** `YYYY-MM-DD`. */
  readonly date: string;
  readonly amount: number;
};

/**
 * 날짜별 지출.
 *
 * 🔴 **기록이 있는 날만** 돌려준다. 안 쓴 날과 안 적은 날을 0 으로 같게 만들면, 달력이 온통
 *    "안 썼다"로 칠해져 실제로 안 쓴 날의 뜻이 사라진다.
 */
export const dailySpending = (entries: readonly LedgerEntry[]): readonly ReportDailySpending[] => {
  const byDate = new Map<string, number>();
  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    byDate.set(entry.date, (byDate.get(entry.date) ?? 0) + entry.amount);
  }
  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, amount]) => ({ date, amount }));
};

/** 캘린더가 덮을 해 목록. 기록이 있는 해만. */
export const spendingYears = (daily: readonly ReportDailySpending[]): readonly string[] =>
  [...new Set(daily.map((point) => point.date.slice(0, 4)))].sort();

/* ── 항목 → 상세항목 (선버스트) ─────────────────────────────────────────────── */

export type ReportSunburstNode = {
  readonly name: string;
  readonly value: number;
  readonly children?: readonly ReportSunburstNode[];
};

/**
 * 항목 안쪽 고리, 상세항목 바깥 고리.
 *
 * 🔴 도넛은 한 층만 보여 준다 — `식비` 가 크다는 것까지는 알아도 그 안에서 `외식` 과 `배달` 중
 *    무엇이 컸는지는 못 본다. 우리 시트는 두 층을 이미 갖고 있으므로 그것을 버릴 이유가 없다.
 * ⚠ 상세항목을 안 적은 기록은 항목 자체의 몫으로 남는다 — 억지로 `기타` 자식을 만들지 않는다
 *   (없는 분류를 지어내는 것과 같다).
 */
export const categorySunburst = (
  entries: readonly LedgerEntry[],
  month?: ReportMonth
): readonly ReportSunburstNode[] => {
  const tree = new Map<string, { own: number; children: Map<string, number> }>();

  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    if (month !== undefined && monthOf(entry) !== month) continue;
    const parent = labelOf(entry.category);
    const node = tree.get(parent) ?? { own: 0, children: new Map<string, number>() };
    const child = (entry.subcategory ?? '').trim();
    if (child.length === 0) node.own += entry.amount;
    else node.children.set(child, (node.children.get(child) ?? 0) + entry.amount);
    tree.set(parent, node);
  }

  return [...tree.entries()]
    .map(([name, node]) => {
      const childTotal = [...node.children.values()].reduce((total, value) => total + value, 0);
      const children = [...node.children.entries()]
        .map(([childName, value]) => ({ name: childName, value }))
        .sort((left, right) => right.value - left.value);
      return {
        name,
        value: node.own + childTotal,
        ...(children.length > 0 ? { children } : {})
      };
    })
    .sort((left, right) => right.value - left.value);
};

/* ── 폭포 (한 달의 수입 → 지출 → 남은 돈) ───────────────────────────────────── */

export type ReportWaterfallStep = {
  readonly label: string;
  /** 이 칸이 시작하는 높이(투명 받침). */
  readonly base: number;
  /** 막대 길이. 언제나 양수다 — 방향은 `direction` 이 갖는다. */
  readonly size: number;
  readonly direction: 'up' | 'down' | 'total';
  /** 실제 값(부호 있음). 툴팁이 이걸 말한다. */
  readonly value: number;
};

/** 폭포에 세울 지출 항목 수. 나머지는 `기타` 한 칸으로 접는다. */
export const WATERFALL_LIMIT = 6;

/**
 * 한 달의 돈이 **어디서 깎여 나갔나**.
 *
 * 🔴 파이는 지출 안의 비율만 말한다. 폭포는 **수입에서 시작해 항목마다 깎이고 무엇이 남았는지**를
 *    한 줄로 보여 준다 — "왜 이만큼밖에 안 남았지"에 대한 답이 그림 자체다.
 * ⚠ 이체(저축·투자)도 한 칸으로 세운다. 쓴 것은 아니지만 **손에서 나간 것**은 맞고, 그걸 빼면
 *   마지막 "남은 돈"이 통장 잔액과 안 맞는다. 라벨이 그것이 저축임을 말한다.
 */
export const monthWaterfall = (
  entries: readonly LedgerEntry[],
  month: ReportMonth,
  limit = WATERFALL_LIMIT
): readonly ReportWaterfallStep[] => {
  const living = alive(entries).filter((entry) => monthOf(entry) === month);
  const income = living
    .filter((entry) => entry.kind === 'income')
    .reduce((total, entry) => total + entry.amount, 0);
  if (income <= 0) return [];

  const outBy = new Map<string, number>();
  for (const entry of living) {
    if (entry.kind === 'income') continue;
    const key = entry.kind === 'transfer' ? '저축·투자' : labelOf(entry.category);
    outBy.set(key, (outBy.get(key) ?? 0) + entry.amount);
  }

  const ranked = [...outBy.entries()].sort(([, left], [, right]) => right - left);
  const head = ranked.slice(0, limit);
  const tail = ranked.slice(limit);
  const steps: ReportWaterfallStep[] = [
    { label: '수입', base: 0, size: income, direction: 'up', value: income }
  ];

  let running = income;
  for (const [label, value] of head) {
    running -= value;
    steps.push({ label, base: Math.max(running, 0), size: value, direction: 'down', value: -value });
  }
  if (tail.length > 0) {
    const rest = tail.reduce((total, [, value]) => total + value, 0);
    running -= rest;
    steps.push({
      label: `기타 ${tail.length}개`,
      base: Math.max(running, 0),
      size: rest,
      direction: 'down',
      value: -rest
    });
  }

  /* 🔴 남은 돈이 음수면 받침을 0 으로 두고 크기만 그린다 — 음수 막대는 폭포에서 그릴 수 없다. */
  steps.push({
    label: '남은 돈',
    base: 0,
    size: Math.abs(running),
    direction: 'total',
    value: running
  });
  return steps;
};

/* ── 레이더 (이번 달 vs 평균) ───────────────────────────────────────────────── */

export type ReportRadarAxis = {
  readonly label: string;
  /** 축 최댓값 — 두 값 중 큰 쪽에 여유를 준다. */
  readonly max: number;
  readonly latest: number;
  readonly average: number;
};

/** 레이더 축 수. 셋 미만이면 도형이 안 되고, 여덟을 넘으면 라벨이 겹친다. */
export const RADAR_MIN_AXES = 3;
export const RADAR_MAX_AXES = 6;

/**
 * **이번 달이 평소와 어떻게 달랐나.**
 *
 * 🔴 추이 그래프는 항목별로 따로 봐야 하는데, 레이더는 **한 그림에서 튀는 축**을 찾게 해 준다.
 * ⚠ 평균은 **그 항목에 지출이 있던 달**로만 나눈다 — 없던 달을 0 으로 섞으면 평균이 낮아져
 *   이번 달이 실제보다 과하게 튀어 보인다.
 * 🔴 달이 둘 미만이면 비교할 평소가 없다 — 빈 배열을 돌려주고 화면이 그리지 않는다.
 */
export const categoryRadar = (
  entries: readonly LedgerEntry[],
  maxAxes = RADAR_MAX_AXES
): readonly ReportRadarAxis[] => {
  const living = alive(entries).filter((entry) => entry.kind === 'expense');
  const months = [...new Set(living.map(monthOf))].sort();
  if (months.length < 2) return [];

  const latestMonth = months[months.length - 1];
  const byCategory = new Map<string, Map<ReportMonth, number>>();
  for (const entry of living) {
    const key = labelOf(entry.category);
    const bucket = byCategory.get(key) ?? new Map<ReportMonth, number>();
    bucket.set(monthOf(entry), (bucket.get(monthOf(entry)) ?? 0) + entry.amount);
    byCategory.set(key, bucket);
  }

  const axes = [...byCategory.entries()]
    .map(([label, byMonth]) => {
      const latest = byMonth.get(latestMonth) ?? 0;
      /* 🔴 그 항목에 지출이 있던 달로만 나눈다(이번 달은 빼고 — 평소와 비교하는 것이다). */
      const past = [...byMonth.entries()].filter(([month]) => month !== latestMonth).map(([, value]) => value);
      const average = past.length === 0 ? 0 : past.reduce((total, value) => total + value, 0) / past.length;
      return { label, latest, average, max: Math.max(latest, average) * 1.2 };
    })
    .filter((axis) => axis.max > 0)
    .sort((left, right) => right.max - left.max)
    .slice(0, maxAxes);

  return axes.length >= RADAR_MIN_AXES ? axes : [];
};
