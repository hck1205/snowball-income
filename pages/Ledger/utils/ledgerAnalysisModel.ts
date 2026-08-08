/**
 * 분석 카드의 **뷰 모델** — 집계(`ledgerAnalysis.ts`)를 화면이 그릴 문자열로 접는다. 순수 함수.
 *
 * 왜 집계와 갈라 두는가: 집계는 숫자를 만들고, 여기는 **표시 규칙**(포맷·상한·"보일까 말까")을 진다.
 * 한 파일에 두면 "상위 5개만"이라는 화면 사정이 계산 함수에 스며들어, 다른 화면이 그 함수를 못 쓴다.
 *
 * 🔴 이 화면의 규율(§3.4 · LedgerDividendCard 와 같다):
 *    - **손익색 금지 · 색 단독 채널 금지.** 비율은 막대 **와 숫자**로 함께 말한다.
 *    - 값이 없으면 갈래로 말한다 — 0 으로 채우지 않는다(0% 와 "잴 수 없음"은 다른 사실이다).
 */
import type { LedgerEntry } from '@/shared/lib/googleSheets';
import { formatKRW } from '@/shared/utils';
import { LEDGER_COPY } from '../copy';
import {
  hasMultiplePayers,
  monthlyCashFlow,
  splitByFixity,
  topSpending,
  totalsByPayer,
  type MonthlyCashFlow
} from './ledgerAnalysis';
import { monthCursorOfISO, type LedgerMonthCursor } from './ledgerFormat';

const copy = LEDGER_COPY;

/** 화면에 세우는 막대 한 줄. `ratio` 는 0~1 이고 폭에만 쓴다(색으로 뜻을 말하지 않는다). */
export type AnalysisBar = {
  readonly id: string;
  readonly label: string;
  readonly valueText: string;
  /** 0~1. 가장 큰 항목이 1 이 되도록 정규화한다 — 절대 비율이면 막대가 전부 짧아 비교가 안 된다. */
  readonly ratio: number;
  /** 읽어 주기용 한 문장. 막대는 `aria-hidden` 이고 이 문장이 접근성 트리에 오른다. */
  readonly srText: string;
};

/** 고정비 대 변동비. 지출이 없으면 `null` — 카드가 그 구획을 통째로 접는다. */
export type FixitySection = {
  readonly fixedText: string;
  readonly variableText: string;
  /** `고정비 62%`. 지출 0 이면 이 모델 자체가 `null` 이라 여기 오지 않는다. */
  readonly fixedPercentText: string;
  readonly fixedRatio: number;
};

/** 주체별. **여러 사람이 쓴 가계부에서만** 만든다(1인 가구에 `공동 100%` 한 줄은 소음이다). */
export type PayerSection = { readonly bars: readonly AnalysisBar[] };

export type TrendPoint = {
  readonly monthKey: string;
  readonly monthLabel: string;
  readonly incomeText: string;
  readonly expenseText: string;
  /** `저축률 62%`. 수입이 0 인 달은 `null` — 그 달은 잴 수 없다. */
  readonly savingRateText: string | null;
  /** 막대 폭(0~1). 저축률이 음수면 0 으로 접는다(막대가 왼쪽으로 자라지 않는다). */
  readonly savingRatio: number | null;
};

export type LedgerAnalysisModel = {
  /** 이 달 지출 기준 구획들. 이 달에 지출이 없으면 전부 `null` 이고 카드가 빈 상태를 말한다. */
  readonly fixity: FixitySection | null;
  readonly payer: PayerSection | null;
  readonly topBars: readonly AnalysisBar[];
  /** 전체 기간 기준. 최근 것이 아래로 오도록 시간 순이다. */
  readonly trend: readonly TrendPoint[];
  /** 그릴 것이 하나도 없는가 — 카드가 빈 상태 한 문장으로 접힌다. */
  readonly isEmpty: boolean;
};

const percentText = (ratio: number): string => `${Math.round(ratio * 100)}%`;

/** `2026-08` → `8월`. 표의 세로 축이라 연도는 해가 바뀌는 자리에서만 필요하다. */
const monthLabelOfKey = (monthKey: string): string => {
  const month = Number(monthKey.slice(5, 7));
  return Number.isFinite(month) && month >= 1 && month <= 12 ? `${month}월` : monthKey;
};

/** 가장 큰 값이 1 이 되도록 정규화. 전부 0 이면 0(막대가 서지 않는다). */
const normalize = (value: number, max: number): number => (max <= 0 ? 0 : value / max);

const isInMonth = (entry: LedgerEntry, cursor: LedgerMonthCursor): boolean => {
  const entryCursor = monthCursorOfISO(entry.date);
  return entryCursor !== null && entryCursor.year === cursor.year && entryCursor.month === cursor.month;
};

/** 추이에 세우는 달 수. 12개월이면 세로로 너무 길어 카드가 화면을 독차지한다. */
export const TREND_MONTH_LIMIT = 6;

/** 상세항목 막대 개수. 상위 몇 개만 봐도 "무엇을 줄일 수 있나"의 답이 나온다. */
export const TOP_SPENDING_LIMIT = 5;

/**
 * 분석 카드 모델을 만든다.
 *
 * @param entries 시트에서 읽은 **전부**(추이가 여러 달을 봐야 한다).
 * @param cursor  지금 보고 있는 달 — 고정비·주체·Top N 은 이 달 기준이다.
 *
 * ⚠ 구획마다 기준 기간이 다른 것은 의도다. "이 달에 무엇을 줄일 수 있나"와 "요즘 저축률이 어떤가"는
 *   다른 질문이고, 둘을 같은 기간으로 묶으면 한쪽이 쓸모없어진다. 화면이 구획마다 기간을 밝힌다.
 */
export const buildLedgerAnalysisModel = (
  entries: readonly LedgerEntry[],
  cursor: LedgerMonthCursor
): LedgerAnalysisModel => {
  const monthEntries = entries.filter((entry) => isInMonth(entry, cursor));

  const split = splitByFixity(monthEntries);
  const fixity: FixitySection | null =
    split.fixedRatio === null
      ? null
      : {
          fixedText: formatKRW(split.fixed),
          variableText: formatKRW(split.variable),
          fixedPercentText: copy.analysis.fixedPercent(percentText(split.fixedRatio)),
          fixedRatio: split.fixedRatio
        };

  /* 🔴 1인 가구에는 주체 구획을 만들지 않는다 — `공동 100%` 한 줄은 정보가 아니라 소음이다. */
  const payerTotals = hasMultiplePayers(monthEntries) ? totalsByPayer(monthEntries) : [];
  const payerMax = payerTotals[0]?.amount ?? 0;
  const payer: PayerSection | null =
    payerTotals.length === 0
      ? null
      : {
          bars: payerTotals.map((total) => ({
            id: `payer:${total.payer}`,
            label: total.payer,
            valueText: formatKRW(total.amount),
            ratio: normalize(total.amount, payerMax),
            srText: copy.analysis.payerSr(total.payer, formatKRW(total.amount), percentText(total.ratio))
          }))
        };

  const top = topSpending(monthEntries, TOP_SPENDING_LIMIT);
  const topMax = top[0]?.amount ?? 0;
  const topBars: AnalysisBar[] = top.map((item) => ({
    id: `top:${item.label}`,
    label: item.label,
    valueText: formatKRW(item.amount),
    ratio: normalize(item.amount, topMax),
    srText: copy.analysis.topSr(item.label, formatKRW(item.amount), item.count)
  }));

  const flow: readonly MonthlyCashFlow[] = monthlyCashFlow(entries).slice(-TREND_MONTH_LIMIT);
  const trend: TrendPoint[] = flow.map((month) => ({
    monthKey: month.monthKey,
    monthLabel: monthLabelOfKey(month.monthKey),
    incomeText: formatKRW(month.income),
    expenseText: formatKRW(month.expense),
    savingRateText: month.savingRate === null ? null : copy.analysis.savingRate(percentText(month.savingRate)),
    /* 🔴 음수 저축률(적자)은 막대 0 이다 — 막대가 왼쪽으로 자라면 길이가 뜻을 잃는다. 숫자는 그대로 말한다. */
    savingRatio: month.savingRate === null ? null : Math.max(0, Math.min(1, month.savingRate))
  }));

  return {
    fixity,
    payer,
    topBars,
    trend,
    isEmpty: fixity === null && payer === null && topBars.length === 0 && trend.length === 0
  };
};
