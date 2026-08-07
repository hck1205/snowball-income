/**
 * 가계부 **분석 집계** — 전부 순수 함수. 시계·네트워크·DOM 을 읽지 않는다.
 *
 * 왜 화면이 아니라 여기인가
 * ---------------------------------------------------------------------------
 * 분석한 시트들은 집계를 **수식으로** 갖고 있었다(항목별 월 합계, 항목×월 피벗, 저축률). 앱이
 * 그것을 대신하려면 같은 숫자를 같은 규칙으로 내야 하고, 그 규칙이 차트 컴포넌트 안에 흩어지면
 * 표와 그래프가 다른 숫자를 말하기 시작한다. 계산은 여기 한 곳에만 산다.
 *
 * 🔴 이 파일 전체를 관통하는 규칙 하나: **`transfer`(이체) 는 지출도 수입도 아니다.**
 *    저축·투자 납입을 지출로 세면 지출 합계가 부풀고 저축률이 무너진다. 집계 함수마다
 *    `kind` 를 세 갈래로 명시하는 이유이고, `else` 로 뭉뚱그리지 않는 이유다.
 */
import type { LedgerEntry, LedgerFixity } from '@/shared/lib/googleSheets';
import { LEDGER_PAYER_SHARED } from '@/shared/constants/ledger';
import { monthCursorOfISO, type LedgerMonthCursor } from './ledgerFormat';

/** `2026-08` 형태의 월 키. 정렬이 곧 시간 순이라 별도 비교 함수가 필요 없다. */
export type MonthKey = string;

export const monthKeyOf = (cursor: LedgerMonthCursor): MonthKey =>
  `${cursor.year}-${String(cursor.month).padStart(2, '0')}`;

/** 항목이 어느 달에 속하는지. 날짜를 못 읽으면 `null` — 그 건은 월 집계에서 조용히 빠진다. */
const monthKeyOfEntry = (entry: LedgerEntry): MonthKey | null => {
  const cursor = monthCursorOfISO(entry.date);
  return cursor === null ? null : monthKeyOf(cursor);
};

/** 지출만 고른다. **이체는 지출이 아니다.** */
const isSpending = (entry: LedgerEntry): boolean => entry.kind === 'expense';

/* ── 항목 × 월 피벗 ──────────────────────────────────────────────────────────── */

export type PivotCell = { readonly monthKey: MonthKey; readonly amount: number };

export type PivotRow = {
  /** 항목 이름(시트에 적힌 그대로). 빈 값은 `미분류` 로 모은다. */
  readonly label: string;
  readonly cells: readonly PivotCell[];
  readonly total: number;
};

export type CategoryPivot = {
  /** 오름차순 월 키 — 표의 열 순서다. */
  readonly months: readonly MonthKey[];
  /** 합계 내림차순 — 큰 항목이 위에 온다(작은 것부터 보면 화면이 스크롤을 요구한다). */
  readonly rows: readonly PivotRow[];
  readonly grandTotal: number;
};

/** 분류가 비어 있는 행을 부르는 이름. 🔴 `기타` 와 다르다 — 기타는 사용자가 고른 분류다. */
export const UNCLASSIFIED_LABEL = '미분류';

/**
 * 항목 × 월 피벗. 분석한 시트의 `가계부 시각화` 탭이 수식으로 만들던 표와 같은 것이다.
 *
 * @param depth `category` = 항목만, `subcategory` = `항목 · 상세항목` 까지 쪼갠다.
 */
export const buildCategoryPivot = (
  entries: readonly LedgerEntry[],
  depth: 'category' | 'subcategory' = 'category'
): CategoryPivot => {
  const months = new Set<MonthKey>();
  const rows = new Map<string, Map<MonthKey, number>>();
  let grandTotal = 0;

  for (const entry of entries) {
    if (!isSpending(entry)) continue;
    const monthKey = monthKeyOfEntry(entry);
    if (monthKey === null) continue;

    const category = entry.category.trim() || UNCLASSIFIED_LABEL;
    const subcategory = (entry.subcategory ?? '').trim();
    const label = depth === 'subcategory' && subcategory.length > 0 ? `${category} · ${subcategory}` : category;

    months.add(monthKey);
    const amount = Math.abs(entry.amount);
    grandTotal += amount;

    const row = rows.get(label) ?? new Map<MonthKey, number>();
    row.set(monthKey, (row.get(monthKey) ?? 0) + amount);
    rows.set(label, row);
  }

  const monthList = [...months].sort();

  const pivotRows: PivotRow[] = [...rows.entries()]
    .map(([label, byMonth]) => {
      /* 🔴 빈 달도 0 으로 채운다 — 열이 비면 표가 어긋나고 차트의 x축이 달마다 달라진다. */
      const cells = monthList.map((monthKey) => ({ monthKey, amount: byMonth.get(monthKey) ?? 0 }));
      return { label, cells, total: cells.reduce((sum, cell) => sum + cell.amount, 0) };
    })
    .sort((left, right) => right.total - left.total || left.label.localeCompare(right.label, 'ko'));

  return { months: monthList, rows: pivotRows, grandTotal };
};

/* ── 고정비 vs 변동비 ───────────────────────────────────────────────────────── */

export type FixitySplit = {
  readonly fixed: number;
  readonly variable: number;
  readonly total: number;
  /** 고정비 비중(0~1). 지출이 0 이면 `null` — 0 나눗셈을 0% 로 위장하지 않는다. */
  readonly fixedRatio: number | null;
};

/**
 * 고정비와 변동비를 가른다.
 *
 * 이 갈래가 가계부에서 가장 실천적인 숫자다 — 변동비는 이번 달에 줄일 수 있고, 고정비는 계약을
 * 바꿔야 줄어든다. 원본 시트는 이 구분을 **날짜 칸의 `고정지출` 토큰**으로 갖고 있었고, v2 는
 * 별도 축으로 꺼냈다(그래서 이 함수가 한 줄로 선다).
 */
export const splitByFixity = (entries: readonly LedgerEntry[]): FixitySplit => {
  let fixed = 0;
  let variable = 0;

  for (const entry of entries) {
    if (!isSpending(entry)) continue;
    const amount = Math.abs(entry.amount);
    if (entry.fixity === 'fixed') fixed += amount;
    else variable += amount;
  }

  const total = fixed + variable;
  return { fixed, variable, total, fixedRatio: total === 0 ? null : fixed / total };
};

/* ── 주체별 ─────────────────────────────────────────────────────────────────── */

export type PayerTotal = {
  readonly payer: string;
  readonly amount: number;
  /** 전체 지출 대비 비중(0~1). */
  readonly ratio: number;
};

/**
 * 누가 얼마를 썼는가. **빈 주체는 공동으로 센다** — 1인 가구는 이 칸을 영영 비워 두고,
 * 그때 모든 지출이 공동이 되어야 집계가 성립한다.
 *
 * 🔴 이 함수가 2인 가구 지원의 본체다. 분석한 2인 템플릿은 주체를 항목 칸에 넣는 바람에
 *    "남편이 쓴 식비"를 표현하지 못했다. 축을 갈라 두었으므로 여기서는 **항목과 무관하게** 센다.
 */
export const totalsByPayer = (entries: readonly LedgerEntry[]): PayerTotal[] => {
  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const entry of entries) {
    if (!isSpending(entry)) continue;
    const payer = (entry.payer ?? '').trim() || LEDGER_PAYER_SHARED;
    const amount = Math.abs(entry.amount);
    totals.set(payer, (totals.get(payer) ?? 0) + amount);
    grandTotal += amount;
  }

  return [...totals.entries()]
    .map(([payer, amount]) => ({ payer, amount, ratio: grandTotal === 0 ? 0 : amount / grandTotal }))
    .sort((left, right) => right.amount - left.amount || left.payer.localeCompare(right.payer, 'ko'));
};

/** 이 가계부가 여러 사람의 것인가 — 주체 칸을 화면에 보일지 정하는 기준. */
export const hasMultiplePayers = (entries: readonly LedgerEntry[]): boolean =>
  new Set(entries.map((entry) => (entry.payer ?? '').trim()).filter((payer) => payer.length > 0)).size > 0;

/* ── 결제수단별 (P6 카드 추천의 입력) ───────────────────────────────────────── */

export type MethodTotal = { readonly method: string; readonly amount: number; readonly count: number };

/**
 * 결제수단별 지출. **지금은 화면용이지만 나중에 카드 추천의 입력이 된다** —
 * "무엇으로 얼마를 썼나"가 없으면 추천은 "식비 많이 쓰시네요" 수준을 넘지 못한다.
 * 수단을 적지 않은 건은 집계에서 빠진다(빈 값을 `현금` 으로 단정하지 않는다).
 */
export const totalsByMethod = (entries: readonly LedgerEntry[]): MethodTotal[] => {
  const totals = new Map<string, { amount: number; count: number }>();

  for (const entry of entries) {
    if (!isSpending(entry)) continue;
    const method = (entry.method ?? '').trim();
    if (method.length === 0) continue;
    const seen = totals.get(method) ?? { amount: 0, count: 0 };
    seen.amount += Math.abs(entry.amount);
    seen.count += 1;
    totals.set(method, seen);
  }

  return [...totals.entries()]
    .map(([method, seen]) => ({ method, amount: seen.amount, count: seen.count }))
    .sort((left, right) => right.amount - left.amount || left.method.localeCompare(right.method, 'ko'));
};

/* ── 월별 현금흐름 (P5) ─────────────────────────────────────────────────────── */

export type MonthlyCashFlow = {
  readonly monthKey: MonthKey;
  readonly income: number;
  readonly expense: number;
  /** 저축·투자로 **옮긴** 돈. 지출이 아니다. */
  readonly transferred: number;
  /** 수입 − 지출. 이체는 빼지 않는다(내 돈이 내 통장에 남아 있다). */
  readonly net: number;
  /**
   * 저축률 = (수입 − 지출) / 수입. 수입이 0 인 달은 `null`.
   * 🔴 0 으로 채우지 않는다 — "수입이 없어 저축률 0%"와 "다 써서 저축률 0%"는 다른 사실이다.
   */
  readonly savingRate: number | null;
};

/**
 * 월별 현금흐름. 분석한 시트의 `현금흐름표` 탭이 손으로 채우던 표를 **실적으로** 만든다.
 *
 * 🔴 저축률의 분자를 "저축 이체액"이 아니라 "수입 − 지출"로 잡은 것이 판단이다. 저축 이체를
 *    분자로 쓰면 통장에 그냥 남겨 둔 돈이 저축에서 빠지고, 이체를 깜빡한 달의 저축률이 0 이 된다.
 *    남은 돈이 곧 저축이다.
 */
export const monthlyCashFlow = (entries: readonly LedgerEntry[]): MonthlyCashFlow[] => {
  const byMonth = new Map<MonthKey, { income: number; expense: number; transferred: number }>();

  for (const entry of entries) {
    const monthKey = monthKeyOfEntry(entry);
    if (monthKey === null) continue;
    const bucket = byMonth.get(monthKey) ?? { income: 0, expense: 0, transferred: 0 };
    const amount = Math.abs(entry.amount);

    /* 🔴 세 갈래를 명시한다. else 로 뭉뚱그리면 이체가 지출로 새어 든다. */
    if (entry.kind === 'income') bucket.income += amount;
    else if (entry.kind === 'expense') bucket.expense += amount;
    else if (entry.kind === 'transfer') bucket.transferred += amount;

    byMonth.set(monthKey, bucket);
  }

  return [...byMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([monthKey, bucket]) => {
      const net = bucket.income - bucket.expense;
      return {
        monthKey,
        income: bucket.income,
        expense: bucket.expense,
        transferred: bucket.transferred,
        net,
        savingRate: bucket.income === 0 ? null : net / bucket.income
      };
    });
};

/* ── 상세항목 Top N ─────────────────────────────────────────────────────────── */

export type TopSpending = { readonly label: string; readonly amount: number; readonly count: number };

/**
 * 가장 많이 쓴 상세항목 N 개. "무엇을 줄일 수 있나"에 가장 가까운 답이다.
 * 상세항목이 없는 건은 항목 이름으로 집계된다(빈 이름으로 한 줄을 만들지 않는다).
 */
export const topSpending = (entries: readonly LedgerEntry[], limit = 10): TopSpending[] => {
  const totals = new Map<string, { amount: number; count: number }>();

  for (const entry of entries) {
    if (!isSpending(entry)) continue;
    const subcategory = (entry.subcategory ?? '').trim();
    const label = subcategory.length > 0 ? subcategory : entry.category.trim() || UNCLASSIFIED_LABEL;
    const seen = totals.get(label) ?? { amount: 0, count: 0 };
    seen.amount += Math.abs(entry.amount);
    seen.count += 1;
    totals.set(label, seen);
  }

  return [...totals.entries()]
    .map(([label, seen]) => ({ label, amount: seen.amount, count: seen.count }))
    .sort((left, right) => right.amount - left.amount || left.label.localeCompare(right.label, 'ko'))
    .slice(0, limit);
};

/** 화면이 쓰는 고정/변동 라벨. 집계와 표시가 한 파일에서 갈리지 않게 여기 둔다. */
export const FIXITY_LABEL: Readonly<Record<LedgerFixity, string>> = {
  fixed: '고정비',
  variable: '변동비'
};
