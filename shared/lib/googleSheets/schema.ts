/**
 * 앱이 만드는 시트의 **확정 스키마**. 이 시트에는 열 매핑 단계가 없다(자리가 정해져 있다).
 *
 * 규칙 두 가지:
 *  - 1행 = 헤더, 데이터는 2행부터.
 *  - **예시 데이터 행을 넣지 않는다** — 사용자가 지워야 할 일을 앱이 만들지 않는다.
 */
import type { ColumnMapping } from './types';

/** 헤더가 있는 행(1-based). */
export const LEDGER_HEADER_ROW = 1;

/** 데이터가 시작하는 행(1-based). */
export const LEDGER_FIRST_DATA_ROW = 2;

/** 앱이 만드는 탭의 제목. */
export const APP_SHEET_TAB_TITLE = '가계부';

/**
 * 앱이 만드는 시트의 헤더. 순서가 곧 열 인덱스다.
 * 🔴 `구분` 은 필수다 — 없으면 나중에 지출만 골라낼 수 없다.
 */
export const APP_SHEET_HEADERS = ['날짜', '구분', '금액', '분류', '메모', '상태'] as const;

/** 앱이 만든 시트의 고정 매핑. */
export const APP_SHEET_MAPPING: ColumnMapping = {
  date: 0,
  kind: 1,
  amount: 2,
  category: 3,
  memo: 4,
  status: 5
};

/**
 * `상태` 열의 값.
 * - 살아 있는 행은 빈 칸이다(앱이 `정상` 같은 글자를 채워 넣지 않는다 — 사용자 시트를 어지럽히지 않는다).
 * - 소프트 삭제는 `삭제됨`. 되돌리려면 이 칸을 비우면 된다.
 */
export const LEDGER_STATUS = {
  active: '',
  deleted: '삭제됨'
} as const;

/** 소프트 삭제된 행인지. `상태` 열이 없는 시트(피커로 고른 기존 시트)는 항상 false. */
export const isSoftDeleted = (status: string | undefined): boolean =>
  typeof status === 'string' && status.trim() === LEDGER_STATUS.deleted;

/** 앱이 만든 시트인지 = `상태` 열까지 스키마가 그대로인지. */
export const matchesAppSheetHeaders = (headers: readonly string[]): boolean =>
  APP_SHEET_HEADERS.every((header, index) => (headers[index] ?? '').trim() === header);

/** 새 시트에 넣을 헤더 행. */
export const buildAppSheetHeaderRow = (): string[] => [...APP_SHEET_HEADERS];
