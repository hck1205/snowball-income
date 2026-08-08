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
