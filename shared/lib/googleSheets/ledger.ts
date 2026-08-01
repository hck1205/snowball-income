/**
 * 가계부 조작의 **단일 진입점**. 어댑터(`sheetsApi.ts`)와 안전 규칙(`writeSafety.ts`)을 엮는다.
 *
 * 여기서만 지켜지는 순서가 있다 — 이 순서를 바꾸면 안전 규칙이 무력해진다.
 *   추가: 최신 마지막 행 확인 → 계획 → **대상 칸이 비었는지 확인** → 쓰기
 *   수정: 참조 유효성 → **현재 값 읽기 → 충돌 비교** → 계획 → 쓰기
 *   삭제: 참조 유효성 → **현재 값 읽기 → 충돌 비교** → (소프트 | 확인된 물리) → 물리면 **스냅샷 폐기**
 */
import { cellRange, headerRowRange, openColumnRange } from './a1';
import { draftToCells, patchToCells } from './format';
import { mappedColumnIndices } from './mapping';
import { parseLedgerColumns, validateLedgerDraft, validateLedgerPatch } from './parse';
import {
  APP_SHEET_MAPPING,
  APP_SHEET_TAB_TITLE,
  LEDGER_FIRST_DATA_ROW,
  LEDGER_HEADER_ROW,
  buildAppSheetHeaderRow,
  matchesAppSheetHeaders
} from './schema';
import type { SheetsRequestContext } from './sheetsApi';
import {
  createSpreadsheet,
  deleteRow,
  fetchColumnValues,
  fetchHeaderRow,
  fetchSpreadsheetMeta,
  writeValues
} from './sheetsApi';
import type {
  ColumnMapping,
  ItemOutcome,
  LedgerDraft,
  LedgerEntry,
  LedgerField,
  LedgerPatch,
  LedgerResult,
  LedgerRowRef,
  LedgerSnapshot,
  RowCells,
  SheetLink,
  UnreadableRow,
  WriteReport
} from './types';
import { ledgerErr, ledgerOk, ledgerError, summarizeWriteReport } from './types';
import type { HardDeleteConfirmation } from './writeSafety';
import {
  detectRowConflict,
  guardRowRef,
  isAppendTargetEmpty,
  planAppend,
  planFieldUpdate,
  planHardDelete,
  planSoftDelete,
  retireSnapshot
} from './writeSafety';

let snapshotCounter = 0;

const nextSnapshotId = (): string => {
  snapshotCounter += 1;
  return `ledger-${Date.now().toString(36)}-${snapshotCounter}`;
};

/** 테스트용 — 스냅샷 ID 카운터를 되돌린다(폐기 목록은 `resetRetiredSnapshotsForTest`). */
export const resetSnapshotCounterForTest = (): void => {
  snapshotCounter = 0;
};

/** 매핑된 필드 목록(순서 고정 — 범위와 응답을 인덱스로 맞추기 때문에 순서가 계약이다). */
const mappedFieldsOf = (mapping: ColumnMapping): LedgerField[] => {
  const fields: LedgerField[] = ['date', 'kind', 'amount', 'category'];
  if (mapping.memo !== undefined) fields.push('memo');
  if (mapping.status !== undefined) fields.push('status');
  return fields;
};

/* ── 연결 ───────────────────────────────────────────────────────────────────── */

/**
 * 앱 스키마의 새 시트를 만든다. 헤더만 넣고 **예시 데이터 행은 넣지 않는다**.
 * 헤더 쓰기가 실패하면 실패로 끝낸다 — 빈 시트를 "연결됨"이라고 말하지 않는다.
 */
export const createLedgerSheet = async (
  context: SheetsRequestContext,
  params: { readonly title: string }
): Promise<LedgerResult<SheetLink>> => {
  const created = await createSpreadsheet(context, { title: params.title, tabTitle: APP_SHEET_TAB_TITLE });
  if (!created.ok) return ledgerErr(created.error);

  const tab = created.value.tabs[0];
  const headers = buildAppSheetHeaderRow();
  const headerData = headers.map((header, index) => ({
    range: cellRange(tab.title, index, LEDGER_HEADER_ROW),
    majorDimension: 'COLUMNS' as const,
    values: [[header]]
  }));

  const written = await writeValues(context, { spreadsheetId: created.value.spreadsheetId, data: headerData });
  if (!written.ok) return ledgerErr(written.error);

  return ledgerOk({
    spreadsheetId: created.value.spreadsheetId,
    sheetId: tab.sheetId,
    sheetTitle: tab.title,
    mapping: APP_SHEET_MAPPING,
    createdByApp: true
  });
};

export type ConnectionOutcome =
  /** 그대로 쓸 수 있다(앱이 만든 스키마이거나, 호출부가 매핑을 줬다). */
  | { readonly status: 'linked'; readonly link: SheetLink }
  /** 열 매핑이 필요하다. 헤더를 보여 주고 사용자가 고르게 한다. */
  | {
      readonly status: 'needs-mapping';
      readonly spreadsheetId: string;
      readonly sheetId: number;
      readonly sheetTitle: string;
      readonly headers: readonly string[];
    };

/**
 * 피커로 고른 시트를 연결한다. 헤더 행 **한 줄만** 읽는다(데이터 셀은 이 단계에서 읽지 않는다).
 * 앱 스키마와 정확히 일치하면 매핑 단계를 건너뛴다.
 */
export const connectSpreadsheet = async (
  context: SheetsRequestContext,
  params: {
    readonly spreadsheetId: string;
    /** 여러 탭이 있으면 어느 탭인지. 없으면 첫 탭. */
    readonly sheetId?: number;
    /** 이미 저장된 매핑이 있으면 그대로 쓴다. */
    readonly mapping?: ColumnMapping;
  }
): Promise<LedgerResult<ConnectionOutcome>> => {
  const meta = await fetchSpreadsheetMeta(context, params.spreadsheetId);
  if (!meta.ok) return ledgerErr(meta.error);

  const tab = params.sheetId === undefined ? meta.value.tabs[0] : meta.value.tabs.find((t) => t.sheetId === params.sheetId);
  if (!tab) return ledgerErr(ledgerError('sheet-not-found'));

  const headerRead = await fetchHeaderRow(context, {
    spreadsheetId: params.spreadsheetId,
    range: headerRowRange(tab.title, LEDGER_HEADER_ROW)
  });
  if (!headerRead.ok) return ledgerErr(headerRead.error);
  const headers = headerRead.value;

  if (params.mapping) {
    return ledgerOk({
      status: 'linked',
      link: {
        spreadsheetId: params.spreadsheetId,
        sheetId: tab.sheetId,
        sheetTitle: tab.title,
        mapping: params.mapping,
        createdByApp: matchesAppSheetHeaders(headers)
      }
    });
  }

  if (matchesAppSheetHeaders(headers)) {
    return ledgerOk({
      status: 'linked',
      link: {
        spreadsheetId: params.spreadsheetId,
        sheetId: tab.sheetId,
        sheetTitle: tab.title,
        mapping: APP_SHEET_MAPPING,
        createdByApp: true
      }
    });
  }

  return ledgerOk({
    status: 'needs-mapping',
    spreadsheetId: params.spreadsheetId,
    sheetId: tab.sheetId,
    sheetTitle: tab.title,
    headers
  });
};

/* ── 조회 ───────────────────────────────────────────────────────────────────── */

/**
 * 매핑된 열만 읽어 스냅샷을 만든다. 읽을 수 없는 행은 건너뛰고 `unreadableRows` 로 보고한다
 * — **한 행 때문에 목록 전체가 실패하지 않는다.**
 *
 * ⚠ 목록 정렬은 여기서 하지 않는다. 시트를 정렬하지 않고 **앱이 메모리에서** 정렬한다(AC-W2).
 */
export const readLedgerSnapshot = async (
  context: SheetsRequestContext,
  link: SheetLink
): Promise<LedgerResult<LedgerSnapshot>> => {
  const indices = mappedColumnIndices(link.mapping);
  const ranges = indices.map((columnIndex) => openColumnRange(link.sheetTitle, columnIndex, LEDGER_FIRST_DATA_ROW));

  const read = await fetchColumnValues(context, { spreadsheetId: link.spreadsheetId, ranges });
  if (!read.ok) return ledgerErr(read.error);

  const columns = new Map<number, readonly string[]>();
  indices.forEach((columnIndex, position) => columns.set(columnIndex, read.value[position] ?? []));

  const parsed = parseLedgerColumns({ mapping: link.mapping, columns, firstDataRow: LEDGER_FIRST_DATA_ROW });
  const snapshotId = nextSnapshotId();

  const entries: LedgerEntry[] = [];
  const unreadableRows: UnreadableRow[] = [];
  for (const row of parsed.rows) {
    if (row.ok) {
      const { rowNumber, ...rest } = row.entry;
      entries.push({ ...rest, ref: { snapshotId, rowNumber } });
    } else {
      unreadableRows.push(row.unreadable);
    }
  }

  return ledgerOk({
    snapshotId,
    spreadsheetId: link.spreadsheetId,
    sheetTitle: link.sheetTitle,
    lastDataRow: Math.max(parsed.lastDataRow, LEDGER_HEADER_ROW),
    entries,
    unreadableRows
  });
};

/** 대상 행의 **현재** 값을 매핑된 열에서만 읽는다(충돌 비교용). */
const readCurrentRowCells = async (
  context: SheetsRequestContext,
  link: SheetLink,
  rowNumber: number
): Promise<LedgerResult<RowCells>> => {
  const fields = mappedFieldsOf(link.mapping);
  const ranges = fields.map((field) => cellRange(link.sheetTitle, link.mapping[field] as number, rowNumber));

  const read = await fetchColumnValues(context, { spreadsheetId: link.spreadsheetId, ranges });
  if (!read.ok) return ledgerErr(read.error);

  const cells: Partial<Record<LedgerField, string>> = {};
  fields.forEach((field, position) => {
    cells[field] = read.value[position]?.[0] ?? '';
  });
  return ledgerOk(cells);
};

/* ── 추가 (AC-W1) ───────────────────────────────────────────────────────────── */

/**
 * 항목을 **마지막 데이터 행 다음에만** 추가한다.
 *
 * 값 검증에서 걸린 건은 네트워크 없이 그 건만 실패로 보고되고, 나머지는 그대로 추가된다
 * → 결과는 `partial` 이 될 수 있다(AC-W5).
 */
export const appendLedgerEntries = async (
  context: SheetsRequestContext,
  params: {
    readonly link: SheetLink;
    readonly snapshot: LedgerSnapshot;
    readonly drafts: readonly LedgerDraft[];
  }
): Promise<WriteReport<number>> => {
  const { link, snapshot, drafts } = params;

  const failures: ItemOutcome<number>[] = [];
  const accepted: { readonly index: number; readonly draft: LedgerDraft }[] = [];

  drafts.forEach((draft, index) => {
    const invalid = validateLedgerDraft(draft);
    if (invalid.length > 0) failures.push({ ok: false, index, error: ledgerError('invalid-entry', invalid) });
    else accepted.push({ index, draft });
  });

  if (accepted.length === 0) return summarizeWriteReport(failures);

  const rows = accepted.map(({ draft }) => draftToCells(draft, { withStatus: link.mapping.status !== undefined }));
  const plan = planAppend({
    sheetTitle: link.sheetTitle,
    mapping: link.mapping,
    lastDataRow: snapshot.lastDataRow,
    rows
  });
  if (!plan.ok) {
    return summarizeWriteReport([
      ...failures,
      ...accepted.map(({ index }): ItemOutcome<number> => ({ ok: false, index, error: plan.error }))
    ]);
  }

  // 🔴 AC-W1 의 두 번째 방어선 — 계획한 자리가 정말 비어 있는지 쓰기 직전에 확인한다.
  //    (마지막 행을 읽은 시점과 쓰는 시점 사이에 다른 사람이 행을 추가했을 수 있다.)
  const verify = await fetchColumnValues(context, {
    spreadsheetId: link.spreadsheetId,
    ranges: plan.value.verifyRanges
  });
  if (!verify.ok) {
    return summarizeWriteReport([
      ...failures,
      ...accepted.map(({ index }): ItemOutcome<number> => ({ ok: false, index, error: verify.error }))
    ]);
  }
  if (!isAppendTargetEmpty(verify.value)) {
    return summarizeWriteReport([
      ...failures,
      ...accepted.map(({ index }): ItemOutcome<number> => ({
        ok: false,
        index,
        error: ledgerError('conflict')
      }))
    ]);
  }

  const written = await writeValues(context, { spreadsheetId: link.spreadsheetId, data: plan.value.data });
  if (!written.ok) {
    return summarizeWriteReport([
      ...failures,
      ...accepted.map(({ index }): ItemOutcome<number> => ({ ok: false, index, error: written.error }))
    ]);
  }

  const successes = accepted.map(
    ({ index }, position): ItemOutcome<number> => ({
      ok: true,
      index,
      value: plan.value.firstRowNumber + position
    })
  );

  return summarizeWriteReport(
    [...failures, ...successes].sort((left, right) => left.index - right.index)
  );
};

/* ── 수정 (AC-W3 + AC-W6) ───────────────────────────────────────────────────── */

/** 수정 성공 시 돌려주는 것 — 무엇을 바꿨는지. 행 값 전체가 아니다. */
export type UpdateOutcome = {
  readonly rowNumber: number;
  readonly updatedFields: readonly LedgerField[];
};

/**
 * 한 건을 수정한다. **패치에 넣은 필드의 셀만** 바뀐다(행 단위 덮어쓰기 없음).
 * 쓰기 전에 현재 값을 읽어, 앱이 마지막으로 본 값과 다르면 **덮어쓰지 않고** 충돌로 돌려준다.
 */
export const updateLedgerEntry = async (
  context: SheetsRequestContext,
  params: {
    readonly link: SheetLink;
    readonly snapshot: LedgerSnapshot;
    readonly ref: LedgerRowRef;
    readonly seen: RowCells;
    readonly patch: LedgerPatch;
  }
): Promise<LedgerResult<UpdateOutcome>> => {
  const { link, snapshot, ref, seen, patch } = params;

  const refError = guardRowRef(snapshot, ref);
  if (refError) return ledgerErr(refError);

  const invalid = validateLedgerPatch(patch);
  if (invalid.length > 0) return ledgerErr(ledgerError('invalid-entry', invalid));

  const cells = patchToCells(patch);
  const fields = Object.keys(cells) as LedgerField[];
  if (fields.length === 0) return ledgerErr(ledgerError('invalid-entry'));

  const current = await readCurrentRowCells(context, link, ref.rowNumber);
  if (!current.ok) return ledgerErr(current.error);

  const conflicts = detectRowConflict({ mapping: link.mapping, seen, current: current.value });
  if (conflicts) return ledgerErr(ledgerError('conflict', conflicts));

  const plan = planFieldUpdate({
    sheetTitle: link.sheetTitle,
    mapping: link.mapping,
    rowNumber: ref.rowNumber,
    cells
  });
  if (!plan.ok) return ledgerErr(plan.error);

  const written = await writeValues(context, { spreadsheetId: link.spreadsheetId, data: plan.value });
  if (!written.ok) return ledgerErr(written.error);

  return ledgerOk({ rowNumber: ref.rowNumber, updatedFields: fields });
};

/* ── 삭제 (AC-W4 + AC-W6) ───────────────────────────────────────────────────── */

export type DeleteOutcome = {
  readonly rowNumber: number;
  readonly mode: 'soft' | 'hard';
  /**
   * `true` 면 이 스냅샷의 모든 행 참조가 무효다 — **목록을 반드시 재조회**해야 한다.
   * (물리 삭제로 아래 행 번호가 전부 밀렸다. 옛 참조로 다음 쓰기를 하면 엉뚱한 행을 건드린다.)
   */
  readonly snapshotRetired: boolean;
};

/**
 * 한 건을 삭제한다.
 *  - `soft`: 앱이 만든 시트만 가능(`상태` 열에 `삭제됨`). 되돌릴 수 있다.
 *  - `hard`: 확인 토큰 필수. 성공 뒤 **스냅샷을 폐기**해 옛 행 번호로 쓰는 길을 막는다.
 */
export const deleteLedgerEntry = async (
  context: SheetsRequestContext,
  params: {
    readonly link: SheetLink;
    readonly snapshot: LedgerSnapshot;
    readonly ref: LedgerRowRef;
    readonly seen: RowCells;
    readonly mode: 'soft' | 'hard';
    /** `hard` 일 때만 필요하고, 없으면 실행하지 않는다. */
    readonly confirmation?: HardDeleteConfirmation;
  }
): Promise<LedgerResult<DeleteOutcome>> => {
  const { link, snapshot, ref, seen, mode } = params;

  const refError = guardRowRef(snapshot, ref);
  if (refError) return ledgerErr(refError);

  const current = await readCurrentRowCells(context, link, ref.rowNumber);
  if (!current.ok) return ledgerErr(current.error);

  const conflicts = detectRowConflict({ mapping: link.mapping, seen, current: current.value });
  if (conflicts) return ledgerErr(ledgerError('conflict', conflicts));

  if (mode === 'soft') {
    const plan = planSoftDelete({ sheetTitle: link.sheetTitle, mapping: link.mapping, rowNumber: ref.rowNumber });
    if (!plan.ok) return ledgerErr(plan.error);
    const written = await writeValues(context, { spreadsheetId: link.spreadsheetId, data: plan.value });
    if (!written.ok) return ledgerErr(written.error);
    return ledgerOk({ rowNumber: ref.rowNumber, mode: 'soft', snapshotRetired: false });
  }

  if (params.confirmation === undefined) return ledgerErr(ledgerError('write-safety'));

  const plan = planHardDelete({
    sheetId: link.sheetId,
    rowNumber: ref.rowNumber,
    confirmation: params.confirmation
  });
  if (!plan.ok) return ledgerErr(plan.error);

  const deleted = await deleteRow(context, { spreadsheetId: link.spreadsheetId, request: plan.value });
  if (!deleted.ok) return ledgerErr(deleted.error);

  // 🔴 여기가 "행 인덱스가 밀린다" 를 막는 자리. 이 줄이 빠지면 옛 참조로 엉뚱한 행을 건드린다.
  retireSnapshot(snapshot.snapshotId);

  return ledgerOk({ rowNumber: ref.rowNumber, mode: 'hard', snapshotRetired: true });
};
