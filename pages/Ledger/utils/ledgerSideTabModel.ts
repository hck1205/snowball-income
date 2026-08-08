/**
 * **옆탭 뷰 모델** — `자산` · `투자` · `분류 규칙` 을 화면이 그릴 문자열로 접는다. 순수 함수만.
 *
 * 🔴 계산·표시 규칙이 컴포넌트로 흩어지지 않게 여기서 다 끝낸다. 표와 요약이 같은 숫자를 말해야 한다
 *    (같은 처방이 `ledgerAnalysisModel.ts` 에도 있다).
 */
import { LEDGER_HOLDING_LABEL, findCategory } from '@/shared/constants/ledger';
import { netWorthByMonth } from '@/shared/lib/googleSheets';
import type { HoldingRecord, InvestmentRecord } from '@/shared/lib/googleSheets';
import type { LedgerClassifyRule } from '@/shared/lib/ledger';

/* ── 자산 ────────────────────────────────────────────────────────────────────── */

export type HoldingRow = {
  readonly id: string;
  readonly date: string;
  readonly kindLabel: string;
  readonly name: string;
  readonly amountText: string;
  /** 부채인가. 🔴 색이 아니라 **글자**로 표시한다(색 단독 채널 금지 · 손익색 금지). */
  readonly isDebt: boolean;
  readonly memo: string;
};

export type NetWorthPoint = {
  readonly month: string;
  readonly monthLabel: string;
  readonly valueText: string;
  /** 막대 길이 비율(0~1). 음수 순자산도 있으므로 **절댓값 최대**로 나눈다. */
  readonly ratio: number;
  /** 🔴 순자산이 음수인가. 부채가 자산보다 많은 상태를 숨기지 않는다. */
  readonly isNegative: boolean;
};

export type HoldingsModel = {
  /**
   * 파서가 낸 **원본 기록**.
   *
   * 🔴 화면용 행(`rows`)은 금액이 `10,000,000원` 같은 **문자열로 접힌** 값이라 집계에 못 쓴다.
   *    `한눈에 보기` 가 이 원본으로 순자산·구성을 낸다 — 문자열을 숫자로 되돌리는 코드를 쓰기
   *    시작하면 그건 모델이 원본을 버린 설계가 잘못이라는 신호다.
   */
  readonly records: readonly HoldingRecord[];
  readonly rows: readonly HoldingRow[];
  readonly trend: readonly NetWorthPoint[];
  /** 가장 최근 달의 순자산. 기록이 없으면 `null` — 🔴 0 이 아니다. */
  readonly latestNetWorthText: string | null;
  readonly latestMonthLabel: string | null;
  readonly skipped: number;
};

const formatMoney = (value: number): string => `${Math.round(value).toLocaleString('ko-KR')}원`;

/** `2026-08` → `2026년 8월`. */
const monthLabelOf = (month: string): string => {
  const [year, rawMonth] = month.split('-');
  return `${year}년 ${Number(rawMonth)}월`;
};

/** 최근 몇 달까지 추이로 보여 줄지. 그보다 오래된 것은 표에는 남고 추이에서만 잘린다. */
export const NET_WORTH_TREND_LIMIT = 12;

export const buildHoldingsModel = (
  records: readonly HoldingRecord[],
  skipped: number
): HoldingsModel => {
  const rows: HoldingRow[] = records.map((record, index) => ({
    id: `${record.date}-${record.kind}-${record.name}-${index}`,
    date: record.date,
    kindLabel: LEDGER_HOLDING_LABEL[record.kind],
    name: record.name,
    amountText: formatMoney(record.amount),
    isDebt: record.isDebt,
    memo: record.memo ?? ''
  }));

  const byMonth = netWorthByMonth(records);
  /* 달 순서대로. 최근 것이 아래로 오게 두면 추이가 왼→오로 읽힌다. */
  const months = [...byMonth.keys()].sort();
  const recent = months.slice(-NET_WORTH_TREND_LIMIT);

  /*
   * 🔴 **절댓값 최대**로 나눈다. 순자산은 음수일 수 있고(부채가 자산보다 많은 상태),
   *    최댓값으로만 나누면 음수 달의 막대가 0 이 되어 그 사실이 화면에서 사라진다.
   */
  const scale = recent.reduce((max, month) => Math.max(max, Math.abs(byMonth.get(month) ?? 0)), 0);

  const trend: NetWorthPoint[] = recent.map((month) => {
    const value = byMonth.get(month) ?? 0;
    return {
      month,
      monthLabel: monthLabelOf(month),
      valueText: formatMoney(value),
      ratio: scale === 0 ? 0 : Math.abs(value) / scale,
      isNegative: value < 0
    };
  });

  const latestMonth = months.at(-1) ?? null;
  const latestValue = latestMonth === null ? null : (byMonth.get(latestMonth) ?? null);

  return {
    records,
    rows,
    trend,
    latestNetWorthText: latestValue === null ? null : formatMoney(latestValue),
    latestMonthLabel: latestMonth === null ? null : monthLabelOf(latestMonth),
    skipped
  };
};

/* ── 투자 ────────────────────────────────────────────────────────────────────── */

export type InvestmentRow = {
  readonly id: string;
  readonly account: string;
  readonly ticker: string;
  readonly sharesText: string;
  /** 매입단가. 🔴 안 적었으면 `null` — `0원` 으로 위장하지 않는다. */
  readonly unitCostText: string | null;
  readonly currency: string;
  readonly memo: string;
};

export type InvestmentsModel = {
  /** 파서가 낸 원본 기록. 🔴 이유는 `HoldingsModel.records` 와 같다. */
  readonly records: readonly InvestmentRecord[];
  readonly rows: readonly InvestmentRow[];
  readonly skipped: number;
};

/** 수량은 소수가 나온다(소수점 매수). 정수로 자르면 사용자가 자기 수량을 의심한다. */
const formatShares = (shares: number): string =>
  shares.toLocaleString('ko-KR', { maximumFractionDigits: 4 });

export const buildInvestmentsModel = (
  records: readonly InvestmentRecord[],
  skipped: number
): InvestmentsModel => ({
  records,
  rows: records.map((record, index) => ({
    id: `${record.ticker}-${record.currency}-${index}`,
    account: record.account,
    ticker: record.ticker,
    sharesText: formatShares(record.shares),
    unitCostText:
      record.unitCost === null
        ? null
        : `${record.unitCost.toLocaleString('ko-KR', { maximumFractionDigits: 2 })} ${record.currency}`,
    currency: record.currency,
    memo: record.memo ?? ''
  })),
  skipped
});

/* ── 분류 규칙 ───────────────────────────────────────────────────────────────── */

export type RuleRow = {
  readonly id: string;
  readonly contains: string;
  readonly categoryLabel: string;
  readonly subcategoryLabel: string;
  /** 🔴 `고정` 이거나 빈 문자열. `변동` 이라 적지 않는다 — 규칙은 변동을 말할 수 없다. */
  readonly fixityLabel: string;
};

export type RulesModel = {
  readonly rows: readonly RuleRow[];
  readonly skipped: number;
};

export const buildRulesModel = (
  rules: readonly LedgerClassifyRule[],
  skipped: number
): RulesModel => ({
  rows: rules.map((rule, index) => {
    const category = findCategory(rule.categoryId);
    const subcategory = rule.subcategoryId
      ? category?.subcategories.find((sub) => sub.id === rule.subcategoryId)
      : undefined;
    return {
      id: `${rule.contains}-${index}`,
      contains: rule.contains,
      categoryLabel: category?.label ?? '',
      subcategoryLabel: subcategory?.label ?? '',
      fixityLabel: rule.fixity === 'fixed' ? '고정' : ''
    };
  }),
  skipped
});
