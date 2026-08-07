/**
 * 피커로 고른 **기존 시트**의 열 매핑 — 자동 후보 제시 + 검증 + 로컬 보관.
 *
 * 🔴 로컬에 저장하는 것은 **시트 ID + 탭 ID + 열 인덱스**뿐이다. 가계부 행(날짜·금액·메모)은
 *    한 글자도 저장하지 않는다. 매핑은 가계부 데이터가 아니라 "이 시트를 어떻게 읽을지"의 설정이다.
 *    탭 제목도 저장하지 않는다(준PII) — 연결할 때 시트 메타에서 다시 읽는다.
 */
import type { ColumnMapping, LedgerField } from './types';
import { LEDGER_OPTIONAL_FIELDS, LEDGER_REQUIRED_FIELDS } from './types';

/**
 * 헤더 텍스트 후보. 정규화(소문자·공백 제거) 후 **완전 일치**를 먼저 보고, 없으면 포함을 본다.
 *
 * ⚠ `구분`(수입/지출)과 `분류`(카테고리)는 글자가 비슷해 서로 잡아먹기 쉽다 — 완전 일치를 우선하는
 *   이유가 이것이다. 실제로 두 열이 나란히 있는 가계부가 흔하다.
 */
const HEADER_CANDIDATES: Readonly<Record<LedgerField, readonly string[]>> = {
  date: ['날짜', '일자', '거래일', '거래일자', 'date'],
  kind: ['구분', '유형', '수입지출', '입출금', 'type', 'kind'],
  amount: ['금액', '거래금액', '가격', 'amount', 'price'],
  category: ['항목', '분류', '카테고리', '내역분류', 'category'],
  /*
   * v2 축 넷. 남의 가계부에는 없는 것이 정상이고, 없으면 그 필드가 그냥 안 잡힌다(선택 필드다).
   * 🔴 후보 낱말은 실측에서 왔다 — 널리 쓰이는 시트 템플릿 2종의 `가계부 작성` 탭 헤더가
   *    `항목 / 상세항목 / 지출금액(원) / 상세내용` 이다(docs/ledger-v2-design.md §1.1).
   *    그래서 `category` 의 1순위를 `분류`→`항목` 으로 바꿨고 `memo` 에 `상세내용` 을 넣었다.
   */
  subcategory: ['상세항목', '소분류', '세부항목', '중분류', 'subcategory'],
  payer: ['주체', '지출자', '결제자', '사용자', '담당', 'payer'],
  method: ['결제수단', '결제방법', '수단', '카드', '지불수단', 'method', 'payment'],
  fixity: ['고정', '고정여부', '고정지출', '고정변동', 'fixed'],
  memo: ['내용', '상세내용', '메모', '비고', '상세', 'memo', 'note', 'description'],
  status: ['상태', 'status']
};

const normalizeHeader = (header: string): string => header.trim().toLowerCase().replace(/\s+/g, '');

export type MappingSuggestion = {
  readonly mapping: Partial<ColumnMapping>;
  /** 자동으로 못 찾은 **필수** 필드. 사용자가 직접 골라야 한다. */
  readonly missing: readonly LedgerField[];
};

/**
 * 헤더 행에서 열 매핑 후보를 만든다. **한 열이 두 필드에 배정되지 않는다** — 먼저 확정된 필드가 그 열을 갖는다.
 * 필수 필드부터 처리하므로, 애매한 헤더는 선택 필드(`메모`)가 아니라 필수 필드에 우선 배정된다.
 */
export const suggestColumnMapping = (headers: readonly string[]): MappingSuggestion => {
  const normalized = headers.map(normalizeHeader);
  const taken = new Set<number>();
  const mapping: Partial<Record<LedgerField, number>> = {};

  const claim = (field: LedgerField, predicate: (header: string, candidate: string) => boolean): boolean => {
    for (const candidate of HEADER_CANDIDATES[field]) {
      const target = normalizeHeader(candidate);
      for (let index = 0; index < normalized.length; index += 1) {
        if (taken.has(index) || normalized[index].length === 0) continue;
        if (!predicate(normalized[index], target)) continue;
        mapping[field] = index;
        taken.add(index);
        return true;
      }
    }
    return false;
  };

  const fields: readonly LedgerField[] = [...LEDGER_REQUIRED_FIELDS, ...LEDGER_OPTIONAL_FIELDS];
  // 1차: 완전 일치. 2차: 포함(예: `거래 금액(원)` → 금액).
  for (const field of fields) claim(field, (header, candidate) => header === candidate);
  for (const field of fields) {
    if (mapping[field] !== undefined) continue;
    claim(field, (header, candidate) => header.includes(candidate));
  }

  const missing = LEDGER_REQUIRED_FIELDS.filter((field) => mapping[field] === undefined);
  return { mapping: mapping as Partial<ColumnMapping>, missing };
};

/** 필수 4필드가 전부 있는지. */
export const isCompleteMapping = (mapping: Partial<ColumnMapping>): mapping is ColumnMapping =>
  LEDGER_REQUIRED_FIELDS.every((field) => Number.isInteger(mapping[field]) && (mapping[field] as number) >= 0);

/** 같은 열에 두 필드가 배정됐는지 — 그러면 한쪽 값을 다른 쪽이 덮어쓴다. */
export const findDuplicateColumns = (mapping: Partial<ColumnMapping>): number[] => {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  for (const field of [...LEDGER_REQUIRED_FIELDS, ...LEDGER_OPTIONAL_FIELDS]) {
    const index = mapping[field];
    if (index === undefined) continue;
    if (seen.has(index)) duplicates.add(index);
    seen.add(index);
  }
  return [...duplicates].sort((a, b) => a - b);
};

export type MappingValidation =
  | { readonly ok: true; readonly mapping: ColumnMapping }
  | { readonly ok: false; readonly missing: readonly LedgerField[]; readonly duplicated: readonly number[] };

/** 저장 전 검증. 필수 누락 또는 열 중복이면 저장하지 않는다. */
export const validateColumnMapping = (mapping: Partial<ColumnMapping>): MappingValidation => {
  const missing = LEDGER_REQUIRED_FIELDS.filter(
    (field) => !Number.isInteger(mapping[field]) || (mapping[field] as number) < 0
  );
  const duplicated = findDuplicateColumns(mapping);
  if (missing.length > 0 || duplicated.length > 0) return { ok: false, missing, duplicated };
  return { ok: true, mapping: mapping as ColumnMapping };
};

/** 앱이 읽고 쓰는 열 인덱스 목록(중복 제거, 오름차순). "앱 영역"의 정의 그 자체다(AC-W2). */
/**
 * 🔴 선택 필드를 **한 줄씩 손으로 적지 않는다.** v2 에서 축 넷(상세항목·주체·결제수단·고정)이
 *    늘었을 때 이 함수만 옛 목록으로 남아, 그 열들을 **요청조차 하지 않는** 버그가 났다
 *    (읽기는 성공하고 값만 조용히 비는 형태라 더 나빴다). `LEDGER_OPTIONAL_FIELDS` 를 돌면
 *    필드가 늘어날 때 여기를 고치는 것을 잊을 수 없다.
 */
export const mappedColumnIndices = (mapping: ColumnMapping): number[] => {
  const indices = new Set<number>(LEDGER_REQUIRED_FIELDS.map((field) => mapping[field]));
  for (const field of LEDGER_OPTIONAL_FIELDS) {
    const index = mapping[field];
    if (index !== undefined) indices.add(index);
  }
  return [...indices].sort((a, b) => a - b);
};

/* ── 로컬 보관 ──────────────────────────────────────────────────────────────── */

/** 로컬에 남기는 연결 정보. **가계부 값은 여기 없다.** */
export type StoredSheetLink = {
  readonly spreadsheetId: string;
  readonly sheetId: number;
  readonly mapping: ColumnMapping;
  readonly createdByApp: boolean;
};

export const LEDGER_LINK_STORAGE_KEY = 'snowball:ledger:links';

/** 저장 페이로드에 허용되는 키 — 이 목록 밖의 키가 들어가면 소스/직렬화 가드가 실패한다. */
export const STORED_SHEET_LINK_KEYS = ['spreadsheetId', 'sheetId', 'mapping', 'createdByApp'] as const;

const isColumnMapping = (value: unknown): value is ColumnMapping => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  const isIndex = (candidate: unknown): boolean => Number.isInteger(candidate) && (candidate as number) >= 0;
  if (!LEDGER_REQUIRED_FIELDS.every((field) => isIndex(record[field]))) return false;
  return LEDGER_OPTIONAL_FIELDS.every((field) => record[field] === undefined || isIndex(record[field]));
};

/** 저장 직전에 **허용된 키만** 남긴다. 실수로 행 값을 흘려 넣어도 여기서 떨어진다. */
export const toStoredSheetLink = (link: StoredSheetLink): StoredSheetLink => {
  const mapping: Record<string, number> = {
    date: link.mapping.date,
    kind: link.mapping.kind,
    amount: link.mapping.amount,
    category: link.mapping.category
  };
  if (link.mapping.memo !== undefined) mapping.memo = link.mapping.memo;
  if (link.mapping.status !== undefined) mapping.status = link.mapping.status;
  return {
    spreadsheetId: link.spreadsheetId,
    sheetId: link.sheetId,
    mapping: mapping as unknown as ColumnMapping,
    createdByApp: link.createdByApp === true
  };
};

/** 저장된 문자열을 되읽는다. 형태가 어긋난 항목은 조용히 버린다(연결이 실패하면 안 된다). */
export const parseStoredSheetLinks = (raw: string | null): StoredSheetLink[] => {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const links: StoredSheetLink[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (typeof record.spreadsheetId !== 'string' || record.spreadsheetId.length === 0) continue;
    if (!Number.isInteger(record.sheetId)) continue;
    if (!isColumnMapping(record.mapping)) continue;
    links.push(
      toStoredSheetLink({
        spreadsheetId: record.spreadsheetId,
        sheetId: record.sheetId as number,
        mapping: record.mapping,
        createdByApp: record.createdByApp === true
      })
    );
  }
  return links;
};

export const serializeStoredSheetLinks = (links: readonly StoredSheetLink[]): string =>
  JSON.stringify(links.map(toStoredSheetLink));

const readStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    // 사생활 보호 모드·차단 설정에서 접근 자체가 던진다.
    return null;
  }
};

export const loadSheetLinks = (): StoredSheetLink[] => {
  const storage = readStorage();
  if (!storage) return [];
  try {
    return parseStoredSheetLinks(storage.getItem(LEDGER_LINK_STORAGE_KEY));
  } catch {
    return [];
  }
};

/** 같은 `spreadsheetId + sheetId` 는 덮어쓴다. 실패하면 false(무음 성공으로 위장하지 않는다). */
export const saveSheetLink = (link: StoredSheetLink): boolean => {
  const storage = readStorage();
  if (!storage) return false;
  const next = loadSheetLinks().filter(
    (stored) => !(stored.spreadsheetId === link.spreadsheetId && stored.sheetId === link.sheetId)
  );
  next.push(toStoredSheetLink(link));
  try {
    storage.setItem(LEDGER_LINK_STORAGE_KEY, serializeStoredSheetLinks(next));
    return true;
  } catch {
    return false;
  }
};

export const removeSheetLink = (spreadsheetId: string, sheetId: number): boolean => {
  const storage = readStorage();
  if (!storage) return false;
  const next = loadSheetLinks().filter(
    (stored) => !(stored.spreadsheetId === spreadsheetId && stored.sheetId === sheetId)
  );
  try {
    storage.setItem(LEDGER_LINK_STORAGE_KEY, serializeStoredSheetLinks(next));
    return true;
  } catch {
    return false;
  }
};
