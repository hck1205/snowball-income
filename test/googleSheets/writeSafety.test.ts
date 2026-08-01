// @vitest-environment node — 계획 단계의 순수 규칙. 네트워크 없음.
import { beforeEach, describe, expect, it } from 'vitest';

import {
  APP_SHEET_MAPPING,
  HARD_DELETE_CONFIRMATION,
  detectRowConflict,
  findWriteAreaViolations,
  guardRowRef,
  isAppendTargetEmpty,
  parseSingleColumnRange,
  planAppend,
  planFieldUpdate,
  planHardDelete,
  planSoftDelete,
  planSoftDeleteUndo,
  resetRetiredSnapshotsForTest,
  retireSnapshot,
  summarizeWriteReport,
  type ColumnMapping,
  type LedgerSnapshot,
  type RowCells,
  type SheetValueRange
} from '@/shared/lib/googleSheets';

const SHEET = '가계부';

/** 피커로 고른 기존 시트 — 열이 흩어져 있고 `상태` 열이 없다. */
const EXTERNAL_MAPPING: ColumnMapping = { date: 1, kind: 4, amount: 2, category: 7, memo: 9 };

const row = (overrides: RowCells = {}): RowCells => ({
  date: '2026-08-01',
  kind: '지출',
  amount: '1200',
  category: '식비',
  ...overrides
});

const snapshot = (overrides: Partial<LedgerSnapshot> = {}): LedgerSnapshot => ({
  snapshotId: 'snap-1',
  spreadsheetId: 'sheet-id',
  sheetTitle: SHEET,
  lastDataRow: 10,
  entries: [],
  unreadableRows: [],
  ...overrides
});

const rangesOf = (data: readonly SheetValueRange[]): string[] => data.map((entry) => entry.range);

describe('AC-W1 — 추가는 마지막 데이터 행 다음에만', () => {
  it('시작 행은 마지막 데이터 행 + 1 이다', () => {
    const plan = planAppend({
      sheetTitle: SHEET,
      mapping: APP_SHEET_MAPPING,
      lastDataRow: 10,
      rows: [row(), row()]
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.value.firstRowNumber).toBe(11);
    expect(plan.value.lastRowNumber).toBe(12);
    expect(rangesOf(plan.value.data)).toContain("'가계부'!A11:A12");
  });

  it('🔴 기존 행 범위를 대상으로 하면 계획을 만들지 않는다', () => {
    const plan = planAppend({
      sheetTitle: SHEET,
      mapping: APP_SHEET_MAPPING,
      lastDataRow: 10,
      rows: [row()],
      targetFirstRow: 10
    });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.error.code).toBe('write-safety');
  });

  it('🔴 헤더 행을 대상으로 하면 계획을 만들지 않는다', () => {
    const plan = planAppend({
      sheetTitle: SHEET,
      mapping: APP_SHEET_MAPPING,
      lastDataRow: 1,
      rows: [row()],
      targetFirstRow: 1
    });
    expect(plan.ok).toBe(false);
  });

  it('데이터가 없으면 2행부터 쓴다', () => {
    const plan = planAppend({ sheetTitle: SHEET, mapping: APP_SHEET_MAPPING, lastDataRow: 1, rows: [row()] });
    expect(plan.ok && plan.value.firstRowNumber).toBe(2);
  });

  it('마지막 데이터 행이 헤더보다 앞일 수는 없다', () => {
    const plan = planAppend({ sheetTitle: SHEET, mapping: APP_SHEET_MAPPING, lastDataRow: 0, rows: [row()] });
    expect(plan.ok).toBe(false);
  });

  it('쓸 것이 없으면 요청을 만들지 않는다', () => {
    expect(planAppend({ sheetTitle: SHEET, mapping: APP_SHEET_MAPPING, lastDataRow: 3, rows: [] }).ok).toBe(false);
  });

  it('쓰기 직전 확인 — 대상 칸에 값이 하나라도 있으면 비어 있지 않다고 본다', () => {
    expect(isAppendTargetEmpty([[], [''], ['  ']])).toBe(true);
    expect(isAppendTargetEmpty([[], ['기존값']])).toBe(false);
  });
});

describe('AC-W2 — 앱 영역은 매핑된 열뿐', () => {
  it('매핑되지 않은 열에는 범위를 만들지 않는다', () => {
    const plan = planAppend({ sheetTitle: SHEET, mapping: EXTERNAL_MAPPING, lastDataRow: 5, rows: [row()] });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;

    const columns = plan.value.data
      .map((entry) => parseSingleColumnRange(entry.range)?.columnIndex)
      .sort((left, right) => (left ?? 0) - (right ?? 0));
    expect(columns).toEqual([1, 2, 4, 7, 9]);
    expect(findWriteAreaViolations(plan.value.data, EXTERNAL_MAPPING)).toEqual([]);
  });

  it('`상태` 열이 없는 시트에는 상태 칸을 만들지 않는다', () => {
    const plan = planAppend({ sheetTitle: SHEET, mapping: EXTERNAL_MAPPING, lastDataRow: 5, rows: [row()] });
    expect(plan.ok && plan.value.data).toHaveLength(5);
  });

  it('🔴 행 단위 범위·매핑 밖 열·헤더 행을 기계적으로 잡아낸다', () => {
    const violations = findWriteAreaViolations(
      [
        { range: "'가계부'!A2:F2", majorDimension: 'COLUMNS', values: [['x']] },
        { range: "'가계부'!Z2", majorDimension: 'COLUMNS', values: [['x']] },
        { range: "'가계부'!A1", majorDimension: 'COLUMNS', values: [['x']] }
      ],
      APP_SHEET_MAPPING
    );
    expect(violations.map((violation) => violation.reason)).toEqual(['multi-column', 'unmapped-column', 'header-row']);
  });

  it('추가 계획이 만든 확인 범위는 쓰기 범위와 같다', () => {
    const plan = planAppend({ sheetTitle: SHEET, mapping: APP_SHEET_MAPPING, lastDataRow: 4, rows: [row()] });
    expect(plan.ok && plan.value.verifyRanges).toEqual(plan.ok ? rangesOf(plan.value.data) : []);
  });
});

describe('AC-W3 — 수정은 매핑된 셀만', () => {
  it('패치에 넣은 필드의 셀만 만든다', () => {
    const plan = planFieldUpdate({
      sheetTitle: SHEET,
      mapping: APP_SHEET_MAPPING,
      rowNumber: 7,
      cells: { amount: '3000' }
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(rangesOf(plan.value)).toEqual(["'가계부'!C7"]);
  });

  it('🔴 만들어지는 범위는 모두 단일 셀이다 — 행 단위 덮어쓰기 경로가 없다', () => {
    const plan = planFieldUpdate({
      sheetTitle: SHEET,
      mapping: EXTERNAL_MAPPING,
      rowNumber: 12,
      cells: { date: '2026-08-02', memo: '수정' }
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;

    for (const entry of plan.value) {
      const parsed = parseSingleColumnRange(entry.range);
      expect(parsed).not.toBeNull();
      expect(parsed?.startRow).toBe(12);
      expect(parsed?.endRow).toBe(12);
    }
    expect(findWriteAreaViolations(plan.value, EXTERNAL_MAPPING)).toEqual([]);
  });

  it('매핑 안 된 필드를 쓰려 하면 실패한다', () => {
    const plan = planFieldUpdate({
      sheetTitle: SHEET,
      mapping: { date: 0, kind: 1, amount: 2, category: 3 },
      rowNumber: 5,
      cells: { memo: '메모' }
    });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.error.fields).toEqual(['memo']);
  });

  it('헤더 행은 수정 대상이 될 수 없다', () => {
    expect(
      planFieldUpdate({ sheetTitle: SHEET, mapping: APP_SHEET_MAPPING, rowNumber: 1, cells: { amount: '1' } }).ok
    ).toBe(false);
  });

  it('바꿀 것이 없으면 요청을 만들지 않는다', () => {
    expect(planFieldUpdate({ sheetTitle: SHEET, mapping: APP_SHEET_MAPPING, rowNumber: 3, cells: {} }).ok).toBe(false);
  });
});

describe('AC-W4 — 삭제는 되돌릴 수 있게', () => {
  it('소프트 삭제는 상태 칸 하나만 바꾼다', () => {
    const plan = planSoftDelete({ sheetTitle: SHEET, mapping: APP_SHEET_MAPPING, rowNumber: 9 });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.value).toEqual([{ range: "'가계부'!F9", majorDimension: 'COLUMNS', values: [['삭제됨']] }]);
  });

  it('되돌리기는 상태 칸을 비운다', () => {
    const plan = planSoftDeleteUndo({ sheetTitle: SHEET, mapping: APP_SHEET_MAPPING, rowNumber: 9 });
    expect(plan.ok && plan.value[0].values[0][0]).toBe('');
  });

  it('상태 열이 없는 시트에서는 소프트 삭제를 만들 수 없다', () => {
    const plan = planSoftDelete({ sheetTitle: SHEET, mapping: EXTERNAL_MAPPING, rowNumber: 9 });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.error.fields).toEqual(['status']);
  });

  it('🔴 물리 삭제는 확인 토큰 없이 계획되지 않는다', () => {
    const wrong = planHardDelete({
      sheetId: 0,
      rowNumber: 5,
      confirmation: '네' as unknown as typeof HARD_DELETE_CONFIRMATION
    });
    expect(wrong.ok).toBe(false);

    const right = planHardDelete({ sheetId: 0, rowNumber: 5, confirmation: HARD_DELETE_CONFIRMATION });
    expect(right.ok).toBe(true);
  });

  it('삭제 범위는 그 행 하나다 (0-based, 끝은 배타적)', () => {
    const plan = planHardDelete({ sheetId: 42, rowNumber: 5, confirmation: HARD_DELETE_CONFIRMATION });
    expect(plan.ok && plan.value.deleteDimension.range).toEqual({
      sheetId: 42,
      dimension: 'ROWS',
      startIndex: 4,
      endIndex: 5
    });
  });

  it('헤더 행은 삭제 대상이 될 수 없다', () => {
    expect(planHardDelete({ sheetId: 0, rowNumber: 1, confirmation: HARD_DELETE_CONFIRMATION }).ok).toBe(false);
  });
});

describe('AC-W4 후속 — 물리 삭제 뒤에는 옛 행 번호로 쓸 수 없다', () => {
  beforeEach(() => {
    resetRetiredSnapshotsForTest();
  });

  it('같은 스냅샷의 참조는 통과한다', () => {
    const current = snapshot();
    expect(guardRowRef(current, { snapshotId: 'snap-1', rowNumber: 5 })).toBeNull();
  });

  it('🔴 스냅샷을 폐기하면 그 스냅샷의 모든 참조가 막힌다', () => {
    const current = snapshot();
    retireSnapshot('snap-1');
    expect(guardRowRef(current, { snapshotId: 'snap-1', rowNumber: 5 })?.code).toBe('stale-snapshot');
  });

  it('다른 조회에서 나온 참조는 섞이지 않는다', () => {
    expect(guardRowRef(snapshot(), { snapshotId: 'snap-0', rowNumber: 5 })?.code).toBe('stale-snapshot');
  });

  it('스냅샷이 모르는 행(범위 밖)도 막는다', () => {
    expect(guardRowRef(snapshot({ lastDataRow: 4 }), { snapshotId: 'snap-1', rowNumber: 5 })?.code).toBe(
      'stale-snapshot'
    );
  });

  it('헤더 행 참조는 안전 위반이다', () => {
    expect(guardRowRef(snapshot(), { snapshotId: 'snap-1', rowNumber: 1 })?.code).toBe('write-safety');
  });
});

describe('AC-W5 — 실패를 무음으로 삼키지 않는다', () => {
  it('전부 성공 / 전부 실패 / 섞임을 구분한다', () => {
    const success = summarizeWriteReport([{ ok: true, index: 0, value: 2 }]);
    expect(success.status).toBe('success');

    const failure = summarizeWriteReport([
      { ok: false, index: 0, error: { code: 'invalid-entry', message: 'x', recovery: 'none' } }
    ]);
    expect(failure.status).toBe('failure');

    const partial = summarizeWriteReport([
      { ok: true, index: 0, value: 2 },
      { ok: false, index: 1, error: { code: 'invalid-entry', message: 'x', recovery: 'none' } }
    ]);
    expect(partial).toMatchObject({ status: 'partial', successCount: 1, failureCount: 1 });
  });

  it('아무것도 시도하지 않은 결과를 성공으로 위장하지 않는다', () => {
    expect(summarizeWriteReport([]).status).toBe('failure');
  });
});

describe('AC-W6 — 동시 편집 감지', () => {
  const mapping = APP_SHEET_MAPPING;

  it('본 값과 같으면 충돌이 아니다', () => {
    expect(detectRowConflict({ mapping, seen: row(), current: row() })).toBeNull();
  });

  it('🔴 한 필드라도 다르면 그 필드를 돌려준다', () => {
    expect(detectRowConflict({ mapping, seen: row(), current: row({ amount: '9900' }) })).toEqual(['amount']);
  });

  it('여러 필드가 바뀌면 전부 알려준다', () => {
    expect(
      detectRowConflict({ mapping, seen: row(), current: row({ amount: '9900', category: '교통' }) })
    ).toEqual(['amount', 'category']);
  });

  it('앞뒤 공백 차이는 충돌이 아니다', () => {
    expect(detectRowConflict({ mapping, seen: row(), current: row({ category: ' 식비 ' }) })).toBeNull();
  });

  it('시트에서 값이 지워진 것도 충돌이다', () => {
    expect(detectRowConflict({ mapping, seen: row(), current: row({ category: '' }) })).toEqual(['category']);
  });
});
