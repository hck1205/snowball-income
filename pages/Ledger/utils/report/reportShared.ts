/**
 * 리포트 집계가 함께 쓰는 **타입과 조각**.
 *
 * 🔴 여기 있는 것은 전부 **여러 파일이 공유하는 것**뿐이다. 한 파일만 쓰는 헬퍼를 여기 올리면
 *    "공유하는 것"이라는 이 파일의 뜻이 흐려진다.
 */
import type { LedgerEntry } from '@/shared/lib/googleSheets';

import { UNCLASSIFIED_LABEL } from '../ledgerAnalysis';

/** `2026-08`. */
export type ReportMonth = string;

export const monthOf = (entry: LedgerEntry): ReportMonth => entry.date.slice(0, 7);

/** 지운 행은 어디에도 세지 않는다. */
export const alive = (entries: readonly LedgerEntry[]): readonly LedgerEntry[] =>
  entries.filter((entry) => (entry.status ?? '').trim().length === 0);

/** 빈 값은 미분류로 모은다. 🔴 조용히 버리지 않는다 — 버리면 합이 실제와 안 맞는다. */
export const labelOf = (raw: string | undefined): string => {
  const value = (raw ?? '').trim();
  return value.length > 0 ? value : UNCLASSIFIED_LABEL;
};

export type ReportSlice = {
  readonly label: string;
  readonly value: number;
  /** 전체 대비 비율(0~1). */
  readonly ratio: number;
};

/** 합계 표 → 큰 것부터 정렬한 조각들. 합이 0 이하면 그릴 것이 없다. */
export const toSlices = (totals: ReadonlyMap<string, number>): readonly ReportSlice[] => {
  const sum = [...totals.values()].reduce((total, value) => total + value, 0);
  if (sum <= 0) return [];
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value, ratio: value / sum }))
    .sort((left, right) => right.value - left.value);
};
