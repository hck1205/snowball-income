/**
 * 🔴 **쓰기 안전 5규칙**. 남의 가계부라 버그 하나가 되돌릴 수 없다.
 *
 * 여기 있는 것은 전부 **순수 함수**다 — 네트워크 없이 "무엇을 쓸 것인가"를 계산하고, 규칙을 어기면
 * 계획 단계에서 실패로 끝난다. 어댑터(`sheetsApi.ts`)는 여기서 나온 계획만 실행한다.
 *
 *  AC-W1 추가는 **마지막 데이터 행 다음**에만. 기존 행 범위를 대상으로 하면 실행하지 않는다.
 *  AC-W2 앱 영역 = **매핑된 열 × 해당 행**. 그 밖의 열은 읽지도 쓰지도 않는다(정렬·서식·수식 불변).
 *  AC-W3 수정은 **매핑된 셀만**. 행 단위 덮어쓰기 금지.
 *  AC-W4 삭제는 되돌릴 수 있게(소프트) — 물리 삭제는 확인 필수 + **행 인덱스가 밀리므로 스냅샷 폐기**.
 *  AC-W5 실패를 무음으로 삼키지 않는다(`LedgerResult` / `WriteReport`).
 *  AC-W6 수정·삭제 **전에** 현재 값을 읽어, 마지막으로 본 값과 다르면 덮어쓰지 않고 충돌로 돌려준다.
 */
import { cellRange, columnSpanRange, parseSingleColumnRange } from './a1';
import { LEDGER_FIRST_DATA_ROW, LEDGER_HEADER_ROW, LEDGER_STATUS } from './schema';
import type {
  ColumnMapping,
  LedgerError,
  LedgerField,
  LedgerResult,
  LedgerRowRef,
  LedgerSnapshot,
  RowCells,
  SheetValueRange
} from './types';
import { ledgerErr, ledgerOk, ledgerError } from './types';

/** 물리 삭제로 행 번호가 밀려 더는 믿을 수 없게 된 스냅샷들. */
const retiredSnapshots = new Set<string>();

/**
 * 🔴 이 스냅샷에서 나온 행 참조를 전부 무효화한다. **물리 삭제 직후 반드시 호출한다.**
 * 삭제된 행 아래의 행 번호가 하나씩 밀리므로, 캐시된 번호로 다음 쓰기를 하면 엉뚱한 행을 건드린다.
 */
export const retireSnapshot = (snapshotId: string): void => {
  retiredSnapshots.add(snapshotId);
};

export const isSnapshotRetired = (snapshotId: string): boolean => retiredSnapshots.has(snapshotId);

/** 테스트용 — 폐기 목록을 비운다. */
export const resetRetiredSnapshotsForTest = (): void => {
  retiredSnapshots.clear();
};

/**
 * 행 참조가 지금 이 스냅샷의 것이고, 그 스냅샷이 아직 살아 있는지 검사한다.
 * 통과하지 못하면 쓰기를 **시도조차 하지 않는다**.
 */
export const guardRowRef = (snapshot: LedgerSnapshot, ref: LedgerRowRef): LedgerError | null => {
  if (ref.snapshotId !== snapshot.snapshotId) return ledgerError('stale-snapshot');
  if (isSnapshotRetired(snapshot.snapshotId)) return ledgerError('stale-snapshot');
  if (!Number.isInteger(ref.rowNumber) || ref.rowNumber <= LEDGER_HEADER_ROW) return ledgerError('write-safety');
  if (ref.rowNumber > snapshot.lastDataRow) return ledgerError('stale-snapshot');
  return null;
};

/** 매핑된 필드 목록(값이 있는 것만). */
const mappedFields = (mapping: ColumnMapping): LedgerField[] => {
  const fields: LedgerField[] = ['date', 'kind', 'amount', 'category'];
  if (mapping.memo !== undefined) fields.push('memo');
  if (mapping.status !== undefined) fields.push('status');
  return fields;
};

const columnOf = (mapping: ColumnMapping, field: LedgerField): number | undefined => mapping[field];

/* ── AC-W1 추가 ─────────────────────────────────────────────────────────────── */

export type AppendPlan = {
  /** 새 행이 들어갈 첫 행 번호. */
  readonly firstRowNumber: number;
  readonly lastRowNumber: number;
  /** 실제로 보낼 쓰기 단위 — **열마다 하나씩**. 매핑 안 된 열은 여기 없다. */
  readonly data: readonly SheetValueRange[];
  /** 쓰기 직전에 "정말 비어 있는지" 확인할 범위(같은 열·같은 행). */
  readonly verifyRanges: readonly string[];
};

/**
 * 추가 계획. 시작 행을 **호출부가 정하지 못한다** — 스냅샷의 `lastDataRow` 에서 계산한다.
 * 그래서 "기존 행 범위에 추가"라는 요청 자체가 성립하지 않는다(AC-W1).
 *
 * 그럼에도 호출부가 시작 행을 강제로 넘길 수 있게 `targetFirstRow` 를 받되, 데이터 범위를 침범하면
 * 계획을 만들지 않고 실패로 끝낸다(방어 코드).
 */
export const planAppend = (params: {
  readonly sheetTitle: string;
  readonly mapping: ColumnMapping;
  readonly lastDataRow: number;
  readonly rows: readonly RowCells[];
  /** 테스트·방어용. 주지 않으면 `lastDataRow + 1`. */
  readonly targetFirstRow?: number;
}): LedgerResult<AppendPlan> => {
  const { sheetTitle, mapping, lastDataRow, rows } = params;
  if (rows.length === 0) return ledgerErr(ledgerError('invalid-entry'));
  if (!Number.isInteger(lastDataRow) || lastDataRow < LEDGER_HEADER_ROW) {
    return ledgerErr(ledgerError('write-safety'));
  }

  const firstRowNumber = params.targetFirstRow ?? lastDataRow + 1;

  // 🔴 여기가 AC-W1 의 방어선이다. 헤더 행이나 기존 데이터 행을 대상으로 하면 실행하지 않는다.
  if (!Number.isInteger(firstRowNumber) || firstRowNumber < LEDGER_FIRST_DATA_ROW) {
    return ledgerErr(ledgerError('write-safety'));
  }
  if (firstRowNumber <= lastDataRow) return ledgerErr(ledgerError('write-safety'));

  const lastRowNumber = firstRowNumber + rows.length - 1;
  const data: SheetValueRange[] = [];
  const verifyRanges: string[] = [];

  for (const field of mappedFields(mapping)) {
    const columnIndex = columnOf(mapping, field);
    if (columnIndex === undefined) continue;
    const range = columnSpanRange(sheetTitle, columnIndex, firstRowNumber, lastRowNumber);
    data.push({
      range,
      majorDimension: 'COLUMNS',
      values: [rows.map((row) => row[field] ?? '')]
    });
    verifyRanges.push(range);
  }

  return ledgerOk({ firstRowNumber, lastRowNumber, data, verifyRanges });
};

/**
 * 추가 직전 확인 — 대상 칸이 **정말 비어 있는지**. 하나라도 값이 있으면 다른 곳에서 이미 쓴 것이므로
 * 덮어쓰지 않는다. (`lastDataRow` 를 읽은 시점과 쓰는 시점 사이의 틈을 막는다.)
 */
export const isAppendTargetEmpty = (columns: readonly (readonly string[])[]): boolean =>
  columns.every((column) => column.every((value) => (value ?? '').trim().length === 0));

/* ── AC-W3 수정 ─────────────────────────────────────────────────────────────── */

/**
 * 수정 계획. **패치에 들어 있는 필드의 셀만** 만든다 — 행 범위를 통째로 만드는 경로가 없다.
 * 매핑되지 않은 필드(예: `메모` 열이 없는 시트에 메모를 넣으려는 시도)는 실패로 돌려준다.
 */
export const planFieldUpdate = (params: {
  readonly sheetTitle: string;
  readonly mapping: ColumnMapping;
  readonly rowNumber: number;
  readonly cells: RowCells;
}): LedgerResult<readonly SheetValueRange[]> => {
  const { sheetTitle, mapping, rowNumber, cells } = params;
  if (!Number.isInteger(rowNumber) || rowNumber <= LEDGER_HEADER_ROW) {
    return ledgerErr(ledgerError('write-safety'));
  }

  const fields = Object.keys(cells) as LedgerField[];
  if (fields.length === 0) return ledgerErr(ledgerError('invalid-entry'));

  const unmapped = fields.filter((field) => columnOf(mapping, field) === undefined);
  if (unmapped.length > 0) return ledgerErr(ledgerError('write-safety', unmapped));

  const data: SheetValueRange[] = fields.map((field) => ({
    range: cellRange(sheetTitle, columnOf(mapping, field) as number, rowNumber),
    majorDimension: 'COLUMNS' as const,
    values: [[cells[field] ?? '']]
  }));

  return ledgerOk(data);
};

/* ── AC-W4 삭제 ─────────────────────────────────────────────────────────────── */

/** 소프트 삭제 = `상태` 칸에 `삭제됨`. `상태` 열이 없는 시트(피커로 고른 기존 시트)에서는 불가능하다. */
export const planSoftDelete = (params: {
  readonly sheetTitle: string;
  readonly mapping: ColumnMapping;
  readonly rowNumber: number;
}): LedgerResult<readonly SheetValueRange[]> => {
  if (params.mapping.status === undefined) return ledgerErr(ledgerError('write-safety', ['status']));
  return planFieldUpdate({
    sheetTitle: params.sheetTitle,
    mapping: params.mapping,
    rowNumber: params.rowNumber,
    cells: { status: LEDGER_STATUS.deleted }
  });
};

/** 소프트 삭제 되돌리기 = `상태` 칸 비우기. */
export const planSoftDeleteUndo = (params: {
  readonly sheetTitle: string;
  readonly mapping: ColumnMapping;
  readonly rowNumber: number;
}): LedgerResult<readonly SheetValueRange[]> => {
  if (params.mapping.status === undefined) return ledgerErr(ledgerError('write-safety', ['status']));
  return planFieldUpdate({
    sheetTitle: params.sheetTitle,
    mapping: params.mapping,
    rowNumber: params.rowNumber,
    cells: { status: LEDGER_STATUS.active }
  });
};

/**
 * 물리 삭제의 확인 토큰. 불리언이 아니라 **문자열 리터럴**인 이유는, 기본값·오타로 조용히 통과하는
 * 일이 없게 하기 위해서다(`true` 는 실수로 들어가지만 이 문자열은 그렇지 않다).
 */
export const HARD_DELETE_CONFIRMATION = '삭제를-확인했습니다' as const;
export type HardDeleteConfirmation = typeof HARD_DELETE_CONFIRMATION;

/** `spreadsheets.batchUpdate` 의 행 삭제 요청 1건. */
export type DeleteRowRequest = {
  readonly deleteDimension: {
    readonly range: {
      readonly sheetId: number;
      readonly dimension: 'ROWS';
      readonly startIndex: number;
      readonly endIndex: number;
    };
  };
};

/**
 * 물리 삭제 계획. 확인 토큰이 없으면 계획 자체를 만들지 않는다.
 * ⚠ 실행 뒤에는 **반드시 `retireSnapshot`** 을 불러야 한다 — 아래 행 번호가 전부 밀린다.
 */
export const planHardDelete = (params: {
  readonly sheetId: number;
  readonly rowNumber: number;
  readonly confirmation: HardDeleteConfirmation;
}): LedgerResult<DeleteRowRequest> => {
  if (params.confirmation !== HARD_DELETE_CONFIRMATION) return ledgerErr(ledgerError('write-safety'));
  if (!Number.isInteger(params.rowNumber) || params.rowNumber <= LEDGER_HEADER_ROW) {
    return ledgerErr(ledgerError('write-safety'));
  }
  if (!Number.isInteger(params.sheetId) || params.sheetId < 0) return ledgerErr(ledgerError('write-safety'));

  // deleteDimension 은 0-based, endIndex 는 배타적이다. 행 5 → [4, 5).
  const startIndex = params.rowNumber - 1;
  return ledgerOk({
    deleteDimension: { range: { sheetId: params.sheetId, dimension: 'ROWS', startIndex, endIndex: startIndex + 1 } }
  });
};

/* ── AC-W6 동시 편집 감지 ───────────────────────────────────────────────────── */

/**
 * 마지막으로 본 값과 지금 시트의 값을 비교한다. 다른 필드가 있으면 그 목록을 돌려준다(= 충돌).
 * 사용자가 시트 앱을 나란히 켜 두는 것은 이 기능의 **정상** 사용 패턴이라, 충돌은 예외가 아니라 일상이다.
 *
 * 비교는 **같은 방식으로 읽어 온 원본 문자열**끼리 한다. 앞뒤 공백만 무시한다(시트가 표시용으로
 * 붙이는 공백까지 충돌로 보면 아무것도 수정할 수 없다).
 */
export const detectRowConflict = (params: {
  readonly mapping: ColumnMapping;
  readonly seen: RowCells;
  readonly current: RowCells;
  /** 검사할 필드. 주지 않으면 매핑된 필드 전부. */
  readonly fields?: readonly LedgerField[];
}): LedgerField[] | null => {
  const fields = params.fields ?? mappedFields(params.mapping);
  const changed = fields.filter(
    (field) => (params.seen[field] ?? '').trim() !== (params.current[field] ?? '').trim()
  );
  return changed.length > 0 ? changed : null;
};

/* ── AC-W2/W3 를 기계적으로 검사하기 ────────────────────────────────────────── */

export type WriteAreaViolation = {
  readonly range: string;
  readonly reason: 'multi-column' | 'unmapped-column' | 'header-row';
};

/**
 * 만들어진 쓰기 계획이 **앱 영역 안에만** 있는지 검사한다.
 * 이 함수가 있으면 "행 단위 덮어쓰기"·"매핑 안 된 열 건드리기"를 테스트가 직접 잡을 수 있다.
 */
export const findWriteAreaViolations = (
  data: readonly SheetValueRange[],
  mapping: ColumnMapping
): WriteAreaViolation[] => {
  const allowed = new Set<number>(
    mappedFields(mapping)
      .map((field) => columnOf(mapping, field))
      .filter((index): index is number => index !== undefined)
  );

  const violations: WriteAreaViolation[] = [];
  for (const entry of data) {
    const parsed = parseSingleColumnRange(entry.range);
    if (!parsed) {
      violations.push({ range: entry.range, reason: 'multi-column' });
      continue;
    }
    if (!allowed.has(parsed.columnIndex)) violations.push({ range: entry.range, reason: 'unmapped-column' });
    if (parsed.startRow <= LEDGER_HEADER_ROW) violations.push({ range: entry.range, reason: 'header-row' });
  }
  return violations;
};
