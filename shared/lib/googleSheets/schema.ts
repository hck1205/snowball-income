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

/** 앱이 만드는 탭의 제목. 파일 안쪽 이름이라 짧게 둔다. */
export const APP_SHEET_TAB_TITLE = '가계부';

/**
 * 앱이 만드는 **스프레드시트 파일**의 이름.
 *
 * 🔴 탭 제목과 갈라 둔다 — 파일은 사용자의 구글 드라이브에서 **다른 문서들 사이에 섞여** 있고,
 * 그냥 "가계부"면 본인이 만든 것인지 이 앱이 만든 것인지 나중에 알 수 없다. 앱 이름을 앞에 붙여
 * 드라이브 검색에서 바로 찾히게 한다(2026-08-01 사용자 요청).
 *
 * 🔴 **이 값은 바꾸지 마라.** 이미 만들어진 시트가 사용자 드라이브에 이 이름으로 남아 있고, 값을 바꾸면
 * 같은 앱이 만든 파일이 드라이브에서 두 이름으로 갈린다(앱은 이 이름으로 파일을 되찾지 않으므로 기능이
 * 깨지지는 않지만, "이 앱이 만든 파일"이라는 단서가 끊긴다). 제품명 확정("Hungry Hippo", 2026-08-03)과
 * 이미 일치하며, 화면의 `LEDGER_COPY.hero.title` 이 **이 표기를 따라온다**(줄임말 "Hippo" 금지).
 */
export const APP_SPREADSHEET_TITLE = 'Hungry Hippo 가계부';

/**
 * 앱이 만드는 시트의 헤더. 순서가 곧 열 인덱스다.
 *
 * 🔴 `구분` 은 필수다 — 없으면 나중에 지출만 골라낼 수 없다.
 *
 * ## v2 열 구성 (2026-08-08)
 *
 * 순서는 **사람이 시트를 열었을 때 읽히는 순서**다: 언제 → 무엇을(2단) → 얼마 → 누가 → 무엇으로 →
 * 반복성 → 설명. 금액을 분류 뒤에 둔 이유는 입력 순서와 맞추기 위해서다(분석한 템플릿도
 * 항목 → 상세항목 → 금액 순이고, 헤비 유저의 손이 이미 그 순서에 익어 있다).
 *
 * 🔴 **`상태` 는 항상 마지막이다.** 앱 전용 열이라 사용자가 볼 일이 가장 적고, 뒤에 있어야
 *    사용자가 오른쪽에 자기 열을 덧붙일 때 방해가 덜하다.
 *
 * ⚠ v1 시트(`날짜·구분·금액·분류·메모·상태`)와 **열 순서가 다르다.** 2026-08-08 사용자 결정으로
 *   기존 시트 호환을 포기하고 순서를 바로잡았다 — v1 로 만들어진 시트는 피커로 다시 고른 뒤
 *   열 매핑을 새로 잡으면 그대로 읽힌다(매핑 경로는 남의 가계부와 같다).
 */
export const APP_SHEET_HEADERS = [
  '날짜',
  '구분',
  '항목',
  '상세항목',
  '금액',
  '주체',
  '결제수단',
  '고정',
  '내용',
  '상태'
] as const;

/** 앱이 만든 시트의 고정 매핑. */
export const APP_SHEET_MAPPING: ColumnMapping = {
  date: 0,
  kind: 1,
  category: 2,
  subcategory: 3,
  amount: 4,
  payer: 5,
  method: 6,
  fixity: 7,
  memo: 8,
  status: 9
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
