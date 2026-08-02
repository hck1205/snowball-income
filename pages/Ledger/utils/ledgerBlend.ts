import type { LedgerSnapshot, StoredSheetLink } from '@/shared/lib/googleSheets';
import { formatKRW } from '@/shared/utils';
import type {
  LedgerBlendBody,
  LedgerBlendFailure,
  LedgerBlendLabels,
  LedgerBlendModel,
  LedgerBlendRow,
  LedgerBlendSourceKey,
  LedgerBlendSubtotal,
  LedgerBlendUnreadable,
  LedgerFailureReason,
  LedgerRowModel
} from '../types';
import { isSameMonth, isVisibleEntry, monthCursorOfISO, summarizeMonth, toErrorModel, toRowModel } from './ledgerFormat';
import type { LedgerMonthCursor } from './ledgerFormat';

/**
 * B-3 **두 가계부 블렌딩**의 데이터 층 — 저장 어댑터 + 병합·요약 순수 함수.
 *
 * ## 이 파일이 하지 않는 일
 * 🔴 **`snowball:ledger:links` 를 건드리지 않는다.** 블렌딩 구성은 links 의 두 항목을 *가리키는
 *    참조*일 뿐이라, 이 파일에는 `saveSheetLink`·`removeSheetLink`·링크 저장 키로 가는 길이 아예
 *    없다(소스 가드가 그것을 잠근다). 링크 목록은 인자로 받는다 — 읽지도 않는다.
 * 🔴 **쓰기 경로가 없다.** 블렌딩 뷰는 읽기 전용이다(D3-4) — 두 링크가 섞인 화면에서 "어느 시트에
 *    쓰나"부터 오류 표면이 두 배가 된다.
 * 🔴 **분류를 합치지 않고**(D3-5) **통화를 변환하지 않는다**(D3-6). 금액 숫자를 그대로 더한다.
 * 🔴 **시계·난수·전역 상태를 읽지 않는다.** 월 커서·라벨·읽기 결과는 전부 인자로 들어온다.
 *
 * ## 두 링크가 같은 파일이든 다른 파일이든 동일하게 동작한다
 * 권장 경로는 "한 스프레드시트에 탭 2개"(D3-1)지만, 이 파일은 `spreadsheetId + sheetId` 쌍을
 * 불투명한 식별자로만 다룬다 — 같은 파일의 두 탭을 특별대우하는 분기가 없다. 그래서 피커의
 * 공유 문서함 노출 여부(스펙 §8 의 미확인 항목)가 이 코드의 동작을 바꾸지 못한다.
 */

/* ── 블렌딩 구성 저장 (`snowball:ledger:blend`) ────────────────────────────── */

/**
 * 🔴 `snowball:ledger:links`·`snowball:ledger:dividend-overlay` 와 **별개 키**다.
 *    지우면 완전히 원상복구된다(기본 = 블렌딩 꺼짐).
 */
export const LEDGER_BLEND_STORAGE_KEY = 'snowball:ledger:blend';

/** 페이로드 버전. 다른 값이 들어오면 조용히 버린다(AC3-8) — 마이그레이션은 v2 를 만들 때 짠다. */
export const LEDGER_BLEND_VERSION = 1;

export const LEDGER_BLEND_SOURCE_KEYS = ['a', 'b'] as const;

/**
 * 라벨 기본값. 🔴 **시트 파일명·탭 제목을 쓰지 않는다**(D3-3) — 그것들은 준PII 이고, 기본값으로
 * 쓰는 순간 준PII 를 로컬에 저장하는 뒷문이 된다. 중립 문구만 둔다.
 *
 * ⚠ 화면 문구가 이 값을 다시 적지 마라 — 필요하면 `copy/ledgerCopy.ts` 가 이 상수를 **재export**
 *   해서 단일 출처를 유지한다(사본을 만들면 저장된 라벨과 화면 기본값이 갈린다).
 */
export const LEDGER_BLEND_DEFAULT_LABEL: LedgerBlendLabels = { a: '가계부 1', b: '가계부 2' };

/** 라벨 길이 상한. 저장 단계에서 자른다(배지가 표를 밀어내는 것을 저장소에서 막는다). */
export const LEDGER_BLEND_LABEL_MAX_LENGTH = 20;

/** 저장 페이로드에 허용되는 키 — 이 목록 밖의 키는 직렬화에서 떨어진다. */
export const LEDGER_BLEND_CONFIG_KEYS = ['version', 'a', 'b'] as const;
export const LEDGER_BLEND_SOURCE_FIELDS = ['spreadsheetId', 'sheetId', 'label'] as const;

/** 구성 한쪽 — links 의 한 항목을 가리키는 참조 + 사용자 라벨. 🔴 **가계부 값은 여기 없다.** */
export type LedgerBlendSourceConfig = {
  readonly spreadsheetId: string;
  readonly sheetId: number;
  readonly label: string;
};

/** 블렌딩 구성 1개. 앱에 하나만 존재한다(단일 객체 — 배열이 아니다). */
export type LedgerBlendConfig = {
  readonly a: LedgerBlendSourceConfig;
  readonly b: LedgerBlendSourceConfig;
};

/** 아직 라벨을 정하지 않은 상태의 선택. `label` 이 없거나 비면 기본 문구가 들어간다. */
export type LedgerBlendSourceDraft = {
  readonly spreadsheetId: string;
  readonly sheetId: number;
  readonly label?: string;
};

/**
 * 라벨 정규화. 공백만 있거나 문자열이 아니면 기본값으로 떨어지고, 상한을 넘으면 자른다.
 * 🔴 **비어 있는 라벨을 허용하지 않는다** — 배지가 빈 칸이면 그 행의 출처를 말할 방법이 사라진다.
 */
export const normalizeLedgerBlendLabel = (raw: unknown, fallback: string): string => {
  if (typeof raw !== 'string') return fallback;
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  if (collapsed.length === 0) return fallback;
  return collapsed.slice(0, LEDGER_BLEND_LABEL_MAX_LENGTH);
};

const toStoredSource = (source: LedgerBlendSourceDraft, fallbackLabel: string): LedgerBlendSourceConfig => ({
  spreadsheetId: source.spreadsheetId,
  sheetId: source.sheetId,
  label: normalizeLedgerBlendLabel(source.label, fallbackLabel)
});

/** 저장 직전에 **허용된 키만** 남긴다(`toStoredSheetLink` 와 같은 처방). */
export const toStoredLedgerBlendConfig = (config: LedgerBlendConfig): LedgerBlendConfig => ({
  a: toStoredSource(config.a, LEDGER_BLEND_DEFAULT_LABEL.a),
  b: toStoredSource(config.b, LEDGER_BLEND_DEFAULT_LABEL.b)
});

/** 키를 짧게 유지한다 — 이 페이로드는 공유 URL 이 아니지만, 로컬 저장도 같은 절제를 따른다. */
export const serializeLedgerBlendConfig = (config: LedgerBlendConfig): string =>
  JSON.stringify({ version: LEDGER_BLEND_VERSION, ...toStoredLedgerBlendConfig(config) });

const sameSource = (
  left: { spreadsheetId: string; sheetId: number },
  right: { spreadsheetId: string; sheetId: number }
): boolean => left.spreadsheetId === right.spreadsheetId && left.sheetId === right.sheetId;

const parseSource = (value: unknown, fallbackLabel: string): LedgerBlendSourceConfig | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.spreadsheetId !== 'string' || record.spreadsheetId.length === 0) return null;
  if (!Number.isInteger(record.sheetId)) return null;
  return {
    spreadsheetId: record.spreadsheetId,
    sheetId: record.sheetId as number,
    label: normalizeLedgerBlendLabel(record.label, fallbackLabel)
  };
};

/**
 * 저장된 문자열 → 구성. 🔴 **불량 페이로드는 조용히 버린다**(AC3-8, `parseStoredSheetLinks` 와 같은
 * 관용 원칙 — 예외를 던지지 않는다). 버려지면 블렌딩이 꺼진 상태로 떨어질 뿐, 가계부는 계속 열린다.
 *
 * 버리는 경우: 비어 있음 · JSON 아님 · 객체 아님 · `version !== 1` · 한쪽이라도 참조가 깨짐 ·
 * **두 자리가 같은 링크**(자기 자신과 합치면 모든 숫자가 두 배가 된다 — 있을 수 없는 구성이다).
 */
export const parseLedgerBlendConfig = (raw: string | null): LedgerBlendConfig | null => {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const record = parsed as Record<string, unknown>;
  if (record.version !== LEDGER_BLEND_VERSION) return null;

  const a = parseSource(record.a, LEDGER_BLEND_DEFAULT_LABEL.a);
  const b = parseSource(record.b, LEDGER_BLEND_DEFAULT_LABEL.b);
  if (a === null || b === null) return null;
  if (sameSource(a, b)) return null;

  return { a, b };
};

/**
 * 구성 만들기. 두 자리가 같은 링크면 `null` — 저장 경로와 화면 검증이 **같은 규칙**을 쓰게 한다.
 */
export const createLedgerBlendConfig = (
  a: LedgerBlendSourceDraft,
  b: LedgerBlendSourceDraft
): LedgerBlendConfig | null => {
  if (sameSource(a, b)) return null;
  return toStoredLedgerBlendConfig({
    a: toStoredSource(a, LEDGER_BLEND_DEFAULT_LABEL.a),
    b: toStoredSource(b, LEDGER_BLEND_DEFAULT_LABEL.b)
  });
};

/** 저장된 링크 목록에 이 참조가 아직 있는가. */
export const hasLedgerBlendLink = (
  links: readonly StoredSheetLink[],
  source: LedgerBlendSourceConfig
): boolean => links.some((link) => sameSource(link, source));

/**
 * 구성 ↔ 링크 목록 대조(AC3-7). 가리키는 링크가 하나라도 사라졌으면 **구성 전체가 무효**다 —
 * 남은 한쪽으로 블렌딩을 이어 가면 "우리 가계"가 조용히 한 사람 것이 된다.
 */
export const resolveLedgerBlendConfig = (
  config: LedgerBlendConfig | null,
  links: readonly StoredSheetLink[]
): LedgerBlendConfig | null => {
  if (config === null) return null;
  if (!hasLedgerBlendLink(links, config.a)) return null;
  if (!hasLedgerBlendLink(links, config.b)) return null;
  return config;
};

/** 블렌딩 진입점 노출 조건(AC3-1). 저장된 링크가 2개 이상일 때만 고를 것이 있다. */
export const isLedgerBlendAvailable = (links: readonly StoredSheetLink[]): boolean => links.length >= 2;

/**
 * 🔴 `pages/Ledger` 에서 `localStorage` 를 만지는 **두 자리 중 하나**다(다른 하나는 B-4 배당 토글).
 * 여기 들어가는 값은 `serializeLedgerBlendConfig` 가 화이트리스트로 만든 페이로드뿐이라 가계부
 * 행·탭 제목이 새어 나갈 자리가 없다. 저장소를 못 여는 환경에서는 조용히 "블렌딩 없음"이 된다.
 */
export const readLedgerBlendConfig = (): LedgerBlendConfig | null => {
  try {
    return parseLedgerBlendConfig(window.localStorage.getItem(LEDGER_BLEND_STORAGE_KEY));
  } catch {
    return null;
  }
};

export const writeLedgerBlendConfig = (config: LedgerBlendConfig): void => {
  try {
    window.localStorage.setItem(LEDGER_BLEND_STORAGE_KEY, serializeLedgerBlendConfig(config));
  } catch {
    // 저장하지 못해도 이번 세션의 블렌딩은 계속 동작한다. 화면에 띄울 만한 사건이 아니다.
  }
};

export const clearLedgerBlendConfig = (): void => {
  try {
    window.localStorage.removeItem(LEDGER_BLEND_STORAGE_KEY);
  } catch {
    // 지우지 못해도 다음 로드에서 참조 대조(resolveLedgerBlendConfig)가 무효 구성을 걸러 낸다.
  }
};

/* ── 병합·요약 순수 함수 ───────────────────────────────────────────────────── */

/** 출처 한쪽의 읽기 결과. 🔴 성공/실패/로딩을 **값**으로 표현한다 — UI 가 세 상태를 다시 발명하지 않는다. */
export type LedgerBlendSourceInput =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly rows: readonly LedgerRowModel[]; readonly unreadableCount: number }
  | { readonly status: 'failed'; readonly reason: LedgerFailureReason };

export type LedgerBlendInput = {
  readonly labels: LedgerBlendLabels;
  readonly a: LedgerBlendSourceInput;
  readonly b: LedgerBlendSourceInput;
};

/**
 * 스냅샷 → 그 달의 블렌딩 입력. 단일 뷰(`useLedgerMonth`)와 **같은 파이프라인**이다:
 * 소프트 삭제 제외 → 월 필터 → 행 모델. 시트를 다시 읽지 않는다(429 예산).
 *
 * ⚠ `unreadableCount` 는 **스냅샷 전체** 기준이다 — `UnreadableRow` 는 날짜를 읽지 못한 행이라
 *   월로 나눌 방법이 없다(월별로 쪼개면 그것이 날조다).
 */
export const toBlendReadySource = (
  snapshot: LedgerSnapshot,
  cursor: LedgerMonthCursor
): LedgerBlendSourceInput => ({
  status: 'ready',
  rows: snapshot.entries
    .filter(isVisibleEntry)
    .filter((entry) => {
      const entryCursor = monthCursorOfISO(entry.date);
      return entryCursor !== null && isSameMonth(entryCursor, cursor);
    })
    .map(toRowModel),
  unreadableCount: snapshot.unreadableRows.length
});

/**
 * 정렬 키. `YYYY-MM-DD` 를 숫자로 접는다. 🔴 형식이 아닌 날짜는 **맨 뒤**로 보내되 원래 순서를
 * 유지한다 — 읽지 못한 날짜를 임의의 위치에 끼워 넣으면 "언제 일인지"를 지어내는 것이 된다.
 */
const dateSortKey = (iso: string): number => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!matched) return Number.POSITIVE_INFINITY;
  return Number(matched[1]) * 10000 + Number(matched[2]) * 100 + Number(matched[3]);
};

const toBlendRow = (row: LedgerRowModel, source: LedgerBlendSourceKey, label: string): LedgerBlendRow => ({
  ...row,
  source,
  sourceLabel: label,
  blendId: `${source}:${row.id}`
});

/**
 * **날짜 오름차순 안정 정렬**(D3-4 — 통합 목록에만 허용된 예외).
 *
 * 🔴 안정성을 엔진의 `Array#sort` 구현에 맡기지 않는다 — 원래 위치(`index`)를 동점 비교에 명시로
 *    넣는다. 같은 날짜 안에서는 ①원본 시트 순서가 유지되고 ②a 의 행이 b 보다 앞선다.
 *    이 규칙이 흔들리면 같은 데이터에서 화면 순서가 달라진다.
 */
export const sortLedgerBlendRows = (rows: readonly LedgerBlendRow[]): LedgerBlendRow[] =>
  rows
    .map((row, index) => ({ row, index }))
    .sort(
      (left, right) => dateSortKey(left.row.dateISO) - dateSortKey(right.row.dateISO) || left.index - right.index
    )
    .map((item) => item.row);

/** 두 출처의 행에 출처를 실어 합친 뒤 위 규칙으로 정렬한다. */
export const mergeLedgerBlendRows = (
  labels: LedgerBlendLabels,
  aRows: readonly LedgerRowModel[],
  bRows: readonly LedgerRowModel[]
): LedgerBlendRow[] =>
  sortLedgerBlendRows([
    ...aRows.map((row) => toBlendRow(row, 'a', labels.a)),
    ...bRows.map((row) => toBlendRow(row, 'b', labels.b))
  ]);

/**
 * 출처 한쪽의 소계.
 *
 * ⚠ `summarizeMonth` 의 루프를 재사용하지 않고 여기서 다시 센다 — 그래야 합산(병합 행 →
 *   `summarizeMonth`)과 소계(출처별 행 → 이 함수)가 **서로 독립된 경로**가 되고, "합산 = 소계의 합"
 *   단정이 진짜 교차검증이 된다(AC3-4). 한쪽을 고치면 다른 쪽이 빨개진다.
 */
export const subtotalOfSource = (
  source: LedgerBlendSourceKey,
  label: string,
  rows: readonly LedgerRowModel[]
): LedgerBlendSubtotal => {
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
    source,
    label,
    income,
    expense,
    incomeText: formatKRW(income),
    expenseText: formatKRW(expense),
    incomeCount,
    expenseCount
  };
};

const toUnreadable = (
  source: LedgerBlendSourceKey,
  label: string,
  count: number
): LedgerBlendUnreadable[] => (count > 0 ? [{ source, label, count }] : []);

const toFailure = (
  source: LedgerBlendSourceKey,
  label: string,
  reason: LedgerFailureReason
): LedgerBlendFailure => ({ source, label, error: toErrorModel(reason) });

const buildPartial = (
  failure: LedgerBlendFailure,
  source: LedgerBlendSourceKey,
  label: string,
  ready: { readonly rows: readonly LedgerRowModel[]; readonly unreadableCount: number }
): LedgerBlendBody => ({
  kind: 'partial',
  failure,
  available: subtotalOfSource(source, label, ready.rows),
  // 정렬 규칙은 블렌딩 뷰에 하나뿐이다 — 실패가 복구되는 순간 행 순서가 뒤집히면 안 된다.
  rows: sortLedgerBlendRows(ready.rows.map((row) => toBlendRow(row, source, label))),
  unreadable: toUnreadable(source, label, ready.unreadableCount)
});

const buildBody = (input: LedgerBlendInput): LedgerBlendBody => {
  const { labels, a, b } = input;

  // 🔴 한쪽이라도 읽는 중이면 숫자를 만들지 않는다 — "아직 모름"과 "0" 은 다르다.
  if (a.status === 'loading' || b.status === 'loading') return { kind: 'loading' };

  if (a.status === 'failed') {
    const failure = toFailure('a', labels.a, a.reason);
    if (b.status === 'failed') {
      return { kind: 'unavailable', failures: [failure, toFailure('b', labels.b, b.reason)] };
    }
    return buildPartial(failure, 'b', labels.b, b);
  }

  if (b.status === 'failed') {
    return buildPartial(toFailure('b', labels.b, b.reason), 'a', labels.a, a);
  }

  const rows = mergeLedgerBlendRows(labels, a.rows, b.rows);

  return {
    kind: 'ready',
    rows,
    summary: summarizeMonth(rows),
    subtotals: [subtotalOfSource('a', labels.a, a.rows), subtotalOfSource('b', labels.b, b.rows)],
    unreadable: [
      ...toUnreadable('a', labels.a, a.unreadableCount),
      ...toUnreadable('b', labels.b, b.unreadableCount)
    ]
  };
};

/** 블렌딩 화면 모델 한 벌. UI 는 `body.kind` 로 갈라 그리기만 한다(계산 0). */
export const buildLedgerBlendModel = (input: LedgerBlendInput): LedgerBlendModel => ({
  labels: input.labels,
  body: buildBody(input)
});

/** 구성 → 라벨. 구성이 없으면 기본 문구(설정 화면의 초기값). */
export const labelsOfLedgerBlendConfig = (config: LedgerBlendConfig | null): LedgerBlendLabels =>
  config === null ? LEDGER_BLEND_DEFAULT_LABEL : { a: config.a.label, b: config.b.label };
