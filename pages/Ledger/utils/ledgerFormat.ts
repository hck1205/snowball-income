import { formatKRW } from '@/shared/utils';
import { columnLetter, isSoftDeleted } from '@/shared/lib/googleSheets';
import type { LedgerEntry, LedgerErrorCode } from '@/shared/lib/googleSheets';
import { LEDGER_COPY } from '../copy';
import type { LedgerErrorModel, LedgerFailureReason, LedgerMonthSummary, LedgerRowModel } from '../types';

const copy = LEDGER_COPY;

/**
 * 순수 함수만 둔다 — 시계·네트워크·DOM 을 읽지 않는다(호출부가 '오늘'을 주입한다).
 *
 * 🔴 포맷 규칙(§7): 이 화면은 **원 단위 정확값**만 쓴다. `formatApproxKRW`/`formatSummaryKRW`
 * (억/만 축약)도, 달러 포맷터도 쓰지 않는다 — 시트의 통화는 사용자 소유다.
 */

/** 구글 시트 편집 화면 주소. 데이터 계층은 ID 만 주므로 표시 주소는 여기서 만든다. */
export const buildSheetUrl = (spreadsheetId: string): string =>
  `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/edit`;

export type LedgerMonthCursor = { year: number; month: number };

export const toMonthCursor = (date: Date): LedgerMonthCursor => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1
});

/** 월 커서 이동. 12월 다음이 이듬해 1월이 되는 지점을 한 곳에서만 계산한다. */
export const addMonths = (cursor: LedgerMonthCursor, delta: number): LedgerMonthCursor => {
  const zeroBased = cursor.year * 12 + (cursor.month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (((zeroBased % 12) + 12) % 12) + 1 };
};

export const monthLabelOf = (cursor: LedgerMonthCursor): string => copy.month.label(cursor.year, cursor.month);

export const isSameMonth = (left: LedgerMonthCursor, right: LedgerMonthCursor): boolean =>
  left.year === right.year && left.month === right.month;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `2026-08-03` → `8월 3일 (월)`. 파싱할 수 없으면 **원문을 그대로 돌려준다**(값을 지어내지 않는다). */
export const formatEntryDate = (iso: string): string => {
  const matched = ISO_DATE.exec(iso);
  if (!matched) return iso;
  const [, yearText, monthText, dayText] = matched;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  // 로컬 자정 기준 — UTC 로 만들면 KST 에서 하루 앞선 요일이 나온다.
  const probe = new Date(year, month - 1, day);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) return iso;
  return `${month}월 ${day}일 (${WEEKDAYS[probe.getDay()]})`;
};

/** `YYYY-MM-DD` 의 월 커서. 형식이 아니면 `null`(월 분류에서 조용히 빠진다). */
export const monthCursorOfISO = (iso: string): LedgerMonthCursor | null => {
  const matched = ISO_DATE.exec(iso);
  if (!matched) return null;
  return { year: Number(matched[1]), month: Number(matched[2]) };
};

/** 오늘 날짜의 `YYYY-MM-DD`(로컬 자정 기준). 폼의 날짜 기본값이다. */
export const toISODate = (date: Date): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/** 히어로 meta 의 "읽은 시각". 초까지 보여 줄 이유가 없다. */
export const formatReadAt = (date: Date): string =>
  `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;

/**
 * 시트에서 읽은 한 건 → 표의 한 행.
 *
 * 🔴 `amount` 는 **부호 없는 절대값**이다. 방향은 `kind`(구분 칩)가 말한다 — 행 금액에 부호나
 * 손익색을 넣지 않는다.
 */
export const toRowModel = (entry: LedgerEntry): LedgerRowModel => {
  const amount = Math.abs(entry.amount);
  return {
    id: `${entry.ref.snapshotId}:${entry.ref.rowNumber}`,
    dateISO: entry.date,
    dateText: formatEntryDate(entry.date),
    kind: entry.kind,
    category: entry.category,
    amount,
    amountText: formatKRW(amount),
    memo: entry.memo ?? '',
    failure: null
  };
};

/** 소프트 삭제된 행은 목록에서 뺀다(앱이 만든 시트에만 `상태` 열이 있다). */
export const isVisibleEntry = (entry: LedgerEntry): boolean => !isSoftDeleted(entry.status);

export const summarizeMonth = (rows: readonly LedgerRowModel[]): LedgerMonthSummary => {
  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const row of rows) {
    if (row.kind === 'income') {
      income += row.amount;
      incomeCount += 1;
    } else {
      expense += row.amount;
      expenseCount += 1;
    }
  }

  return {
    incomeText: formatKRW(income),
    expenseText: formatKRW(expense),
    // 🔴 순액만 부호를 갖는다(`Intl` 이 `-₩…` 로 낸다). 색은 붙이지 않는다.
    netText: formatKRW(income - expense),
    incomeCount,
    expenseCount
  };
};

/** 기록이 있는 **가장 최근 달**. §4.4 의 "가장 최근 기록은 N월에 있습니다"가 이 값에 달려 있다. */
export const latestMonthOf = (entries: readonly LedgerEntry[]): LedgerMonthCursor | null => {
  let latest: LedgerMonthCursor | null = null;
  for (const entry of entries) {
    const cursor = monthCursorOfISO(entry.date);
    if (!cursor) continue;
    if (latest === null || cursor.year * 12 + cursor.month > latest.year * 12 + latest.month) latest = cursor;
  }
  return latest;
};

/** 분류 자동완성 후보 — 시트에 등장한 값만, 빈도 내림차순, 상한 50(사용자 시트가 정본이다). */
export const collectCategories = (entries: readonly LedgerEntry[], limit = 50): string[] => {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const category = entry.category.trim();
    if (category.length === 0) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'ko'))
    .slice(0, limit)
    .map(([category]) => category);
};

/** 열 인덱스 목록 → 셀렉트 선택지. 헤더가 비어 있으면 문자만 보여 준다. */
export const toColumnOptions = (headers: readonly string[]): { letter: string; header: string }[] =>
  headers.map((header, index) => ({ letter: columnLetter(index), header: header.trim() }));

/**
 * 데이터 계층의 실패 코드 → 화면이 아는 다섯 갈래.
 * 🔴 `auth-expired`·`not-authorized` 는 여기 없다 — 그건 실패가 아니라 **만료 상태**로 승격된다(§4.7).
 */
export const toFailureReason = (code: LedgerErrorCode): LedgerFailureReason => {
  if (code === 'network-error') return 'network';
  if (code === 'permission-denied') return 'permission';
  if (code === 'rate-limited') return 'rateLimited';
  if (code === 'conflict' || code === 'stale-snapshot') return 'conflict';
  return 'unknown';
};

/** 만료로 승격되는 코드인가(§4.7 — 화면을 백지로 만들지 않고 배너 + 1클릭 재연결). */
export const isExpiredCode = (code: LedgerErrorCode): boolean =>
  code === 'auth-expired' || code === 'not-authorized';

/**
 * 실패 사유 → 화면 문구.
 * 🔴 `conflict` 는 여기서 만들지 않는다 — 충돌은 §4.10 의 전용 배너가 말한다.
 */
export const toErrorModel = (reason: LedgerFailureReason): LedgerErrorModel => {
  if (reason === 'network') return { ...copy.error.network, reason };
  if (reason === 'permission') return { ...copy.error.permission, reason };
  if (reason === 'rateLimited') return { ...copy.error.rateLimited, reason };
  if (reason === 'conflict') return { title: copy.conflict.title, body: copy.conflict.body, reason };
  return { ...copy.error.unknown, reason };
};

/** 429 카운트다운의 시작값 — 응답이 알려 주면 그 값, 모르면 30초에서 시작해 지수 백오프(상한 300). */
export const nextRetryDelaySec = (previous: number | null, retryAfterSec: number | null): number => {
  if (retryAfterSec !== null && Number.isFinite(retryAfterSec) && retryAfterSec > 0) {
    return Math.min(Math.ceil(retryAfterSec), 300);
  }
  if (previous === null) return 30;
  return Math.min(previous * 2, 300);
};
