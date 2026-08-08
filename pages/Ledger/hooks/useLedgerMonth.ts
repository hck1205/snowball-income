import { useCallback, useMemo, useState } from 'react';
import type { LedgerEntry, LedgerSnapshot } from '@/shared/lib/googleSheets';
import { LEDGER_CATEGORIES } from '@/shared/constants/ledger';
import type { LedgerMonthSummary, LedgerRowModel } from '../types';
import {
  addMonths,
  buildLedgerAnalysisModel,
  collectCarryOverCandidates,
  collectFieldValues,
  isSameMonth,
  isVisibleEntry,
  latestMonthOf,
  monthCursorOfISO,
  monthLabelOf,
  summarizeMonth,
  toMonthCursor,
  toRowModel
} from '../utils';
import type { CarryOverCandidate, LedgerAnalysisModel, LedgerMonthCursor } from '../utils';

export type LedgerMonth = {
  cursor: LedgerMonthCursor;
  monthLabel: string;
  prevMonthLabel: string;
  nextMonthLabel: string;
  thisMonthLabel: string;
  isCurrentMonth: boolean;
  /** 기록이 있는 가장 최근 달. 없으면 `null` — 그러면 §4.4 의 그 문장을 만들 수 없다. */
  latestMonthLabel: string | null;
  rows: readonly LedgerRowModel[];
  summary: LedgerMonthSummary;
  /** 행 id → 시트에서 읽은 원본(쓰기에 필요한 `ref`·`seen` 을 갖고 있다). */
  entryById: ReadonlyMap<string, LedgerEntry>;
  /**
   * 자동완성 후보 — 시트에 등장한 값이 앞, 기본 분류 사전이 뒤.
   * 🔴 관측값이 먼저다. 사용자가 실제로 쓰던 낱말을 사전이 밀어내지 않는다.
   */
  categoryOptions: readonly string[];
  subcategoryOptions: readonly string[];
  /** 분석 카드가 그릴 값. 이 달 기준 구획 + 전체 기간 추이가 함께 들어 있다. */
  analysis: LedgerAnalysisModel;
  /** 지난달 고정비 중 이번 달에 아직 없는 것. 비어 있으면 이어가기 자리를 만들지 않는다. */
  carryOverCandidates: readonly CarryOverCandidate[];
  /** 주체·결제수단은 사전이 없다 — 사용자가 정하는 이름이라 시드가 있을 수 없다. */
  payerOptions: readonly string[];
  methodOptions: readonly string[];
  goPrev: () => void;
  goNext: () => void;
  goThisMonth: () => void;
  goLatestMonth: () => void;
};

/**
 * 월 커서와 그 달의 파생 값.
 *
 * 🔴 **월 이동은 시트를 다시 읽지 않는다.** 스냅샷 한 번에 전 기간이 들어오므로 달 필터는 메모리에서
 * 한다 — 달을 넘길 때마다 네트워크를 때리면 429(요청 제한)에 바로 닿는다.
 * 🔴 **정렬하지 않는다.** 시트 행 순서 그대로다(앱이 시트를 정렬하지도, 화면에서 재정렬하지도 않는다).
 */
export function useLedgerMonth(snapshot: LedgerSnapshot | null, now: Date): LedgerMonth {
  const today = useMemo(() => toMonthCursor(now), [now]);
  const [cursor, setCursor] = useState<LedgerMonthCursor>(today);

  const entries = useMemo(
    () => (snapshot === null ? [] : snapshot.entries.filter(isVisibleEntry)),
    [snapshot]
  );

  const monthEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const entryCursor = monthCursorOfISO(entry.date);
        return entryCursor !== null && isSameMonth(entryCursor, cursor);
      }),
    [cursor, entries]
  );

  const rows = useMemo(() => monthEntries.map(toRowModel), [monthEntries]);
  const summary = useMemo(() => summarizeMonth(rows), [rows]);

  const entryById = useMemo(() => {
    const map = new Map<string, LedgerEntry>();
    for (const entry of entries) map.set(`${entry.ref.snapshotId}:${entry.ref.rowNumber}`, entry);
    return map;
  }, [entries]);

  const latestMonth = useMemo(() => latestMonthOf(entries), [entries]);
  const categoryOptions = useMemo(
    () => collectFieldValues(entries, 'category', { seed: LEDGER_CATEGORIES.map((category) => category.label) }),
    [entries]
  );
  const subcategoryOptions = useMemo(
    () =>
      collectFieldValues(entries, 'subcategory', {
        seed: LEDGER_CATEGORIES.flatMap((category) => category.subcategories.map((sub) => sub.label))
      }),
    [entries]
  );
  const payerOptions = useMemo(() => collectFieldValues(entries, 'payer'), [entries]);

  /*
   * 분석 카드 모델. 🔴 **전체 entries** 를 넘긴다 — 최근 흐름 구획이 여러 달을 봐야 하고,
   * 이 달만 넘기면 추이가 한 점짜리 그래프가 된다. 이 달 기준 구획은 모델이 안에서 걸러 낸다.
   */
  const analysis = useMemo(() => buildLedgerAnalysisModel(entries, cursor), [entries, cursor]);

  /*
   * 고정비 이어가기 후보. 🔴 계산은 여기(시트에 무엇이 있나를 아는 쪽)가 하고, 쓰기는
   * `useLedgerWrite` 가 한다 — 두 관심사를 한 훅에 넣으면 "읽은 것"과 "쓸 것"이 섞인다.
   */
  const carryOverCandidates = useMemo(() => collectCarryOverCandidates(entries, cursor), [entries, cursor]);
  const methodOptions = useMemo(() => collectFieldValues(entries, 'method'), [entries]);

  const goPrev = useCallback(() => setCursor((previous) => addMonths(previous, -1)), []);
  const goNext = useCallback(() => setCursor((previous) => addMonths(previous, 1)), []);
  const goThisMonth = useCallback(() => setCursor(today), [today]);
  const goLatestMonth = useCallback(() => {
    if (latestMonth !== null) setCursor(latestMonth);
  }, [latestMonth]);

  return {
    cursor,
    monthLabel: monthLabelOf(cursor),
    prevMonthLabel: monthLabelOf(addMonths(cursor, -1)),
    nextMonthLabel: monthLabelOf(addMonths(cursor, 1)),
    thisMonthLabel: monthLabelOf(today),
    isCurrentMonth: isSameMonth(cursor, today),
    // 지금 보고 있는 달이 곧 최근 달이면 "다른 달에 있다"고 말할 이유가 없다.
    latestMonthLabel: latestMonth === null || isSameMonth(latestMonth, cursor) ? null : monthLabelOf(latestMonth),
    rows,
    summary,
    entryById,
    analysis,
    carryOverCandidates,
    categoryOptions,
    subcategoryOptions,
    payerOptions,
    methodOptions,
    goPrev,
    goNext,
    goThisMonth,
    goLatestMonth
  };
}
