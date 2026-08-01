import { useCallback, useMemo, useState } from 'react';
import type { LedgerEntry, LedgerSnapshot } from '@/shared/lib/googleSheets';
import type { LedgerMonthSummary, LedgerRowModel } from '../types';
import {
  addMonths,
  collectCategories,
  isSameMonth,
  isVisibleEntry,
  latestMonthOf,
  monthCursorOfISO,
  monthLabelOf,
  summarizeMonth,
  toMonthCursor,
  toRowModel
} from '../utils';
import type { LedgerMonthCursor } from '../utils';

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
  /** 분류 자동완성 후보(시트에 등장한 값만). */
  categoryOptions: readonly string[];
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
  const categoryOptions = useMemo(() => collectCategories(entries), [entries]);

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
    categoryOptions,
    goPrev,
    goNext,
    goThisMonth,
    goLatestMonth
  };
}
