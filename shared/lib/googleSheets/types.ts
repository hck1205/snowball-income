/**
 * 가계부 데이터 계층의 공용 타입.
 *
 * 여기서 정한 세 가지가 나머지 파일의 형태를 결정한다.
 *  1) **결과는 항상 명시적이다** (`LedgerResult`) — 어댑터가 예외를 삼키고 `void` 를 돌려주지 않는다.
 *  2) **행 참조는 스냅샷에 묶인다** (`LedgerRowRef`) — 물리 삭제로 행 인덱스가 밀린 뒤 옛 참조로
 *     쓰기를 시도하면 타입이 아니라 런타임 가드가 잡는다(`writeSafety.ts`).
 *  3) **본 값을 함께 들고 다닌다** (`LedgerEntry.seen`) — 동시 편집 감지(AC-W6)의 비교 기준.
 */

/** 성공/실패를 값으로 표현한다. 이름을 길게 쓰는 이유 = 배럴에서 `ok`/`err` 같은 흔한 이름 충돌 방지. */
export type LedgerResult<T, E = LedgerError> = { ok: true; value: T } | { ok: false; error: E };

export const ledgerOk = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });
export const ledgerErr = <E>(error: E): { ok: false; error: E } => ({ ok: false, error });

/** 수입/지출. `구분` 열이 없으면 나중에 지출만 골라낼 수 없어서 **필수 필드**다. */
export type LedgerKind = 'income' | 'expense';

/** 시트 열에 대응하는 논리 필드. `memo`·`status` 만 선택이다. */
export type LedgerField = 'date' | 'kind' | 'amount' | 'category' | 'memo' | 'status';

/** 매핑이 반드시 있어야 하는 필드. */
export const LEDGER_REQUIRED_FIELDS = ['date', 'kind', 'amount', 'category'] as const;

/** 매핑이 있으면 쓰고 없으면 생략하는 필드. `status` 는 앱이 만든 시트에만 있다(소프트 삭제용). */
export const LEDGER_OPTIONAL_FIELDS = ['memo', 'status'] as const;

/** 전체 필드 순서(표시·직렬화의 단일 기준). */
export const LEDGER_FIELDS = [...LEDGER_REQUIRED_FIELDS, ...LEDGER_OPTIONAL_FIELDS] as const;

/**
 * 논리 필드 → **0-based 열 인덱스**. 앱이 읽고 쓰는 범위는 이 열들뿐이다(AC-W2).
 * 여기 없는 열은 읽지도 쓰지도 않는다 — 사용자의 다른 열·수식·서식은 앱의 관심사가 아니다.
 */
export type ColumnMapping = {
  readonly date: number;
  readonly kind: number;
  readonly amount: number;
  readonly category: number;
  readonly memo?: number;
  readonly status?: number;
};

/** 매핑된 필드의 **원본 셀 문자열**. 값이 빈 칸이면 `''`(키는 존재한다). */
export type RowCells = Readonly<Partial<Record<LedgerField, string>>>;

/**
 * 스냅샷에 묶인 행 참조.
 *
 * 🔴 물리 삭제 뒤에는 아래 행 번호가 전부 하나씩 밀린다. 캐시된 행 번호로 다음 쓰기를 하면
 *    **엉뚱한 행을 건드린다**. 그래서 모든 쓰기 API 는 `LedgerRowRef` 만 받고, 그 참조가 나온
 *    스냅샷이 아직 살아 있는지 먼저 검사한다(`guardRowRef`).
 */
export type LedgerRowRef = {
  readonly snapshotId: string;
  /** 시트 행 번호(1-based, 헤더 = 1). */
  readonly rowNumber: number;
};

/** 시트에서 읽어 온 한 건. */
export type LedgerEntry = {
  readonly ref: LedgerRowRef;
  /** ISO `YYYY-MM-DD`. */
  readonly date: string;
  readonly kind: LedgerKind;
  readonly amount: number;
  readonly category: string;
  readonly memo?: string;
  /** 앱이 만든 시트에만 있다. `삭제됨` 이면 소프트 삭제된 행이다. */
  readonly status?: string;
  /** 읽을 때 본 원본 셀 값 — 동시 편집 감지(AC-W6)의 비교 기준. */
  readonly seen: RowCells;
};

/** 파싱에 실패해 건너뛴 행. 전체 실패로 만들지 않고 "읽을 수 없음"으로 표시한다. */
export type UnreadableRow = {
  readonly rowNumber: number;
  /** 어떤 필드가 왜 실패했는지 — 사용자에게 보여줄 수 있는 격식체 사유. */
  readonly reasons: readonly string[];
};

/** 사용자가 새로 넣으려는 한 건(아직 시트에 없다). */
export type LedgerDraft = {
  readonly date: string;
  readonly kind: LedgerKind;
  readonly amount: number;
  readonly category: string;
  readonly memo?: string;
};

/** 수정 요청 — **넣은 필드만** 갱신한다(행 단위 덮어쓰기 금지, AC-W3). */
export type LedgerPatch = {
  readonly date?: string;
  readonly kind?: LedgerKind;
  readonly amount?: number;
  readonly category?: string;
  readonly memo?: string;
};

/** 연결된 시트 1개. 로컬에 저장되는 것은 이 형태에서 `sheetTitle` 을 뺀 것이다(`mapping.ts`). */
export type SheetLink = {
  readonly spreadsheetId: string;
  /** 탭(워크시트)의 숫자 ID. 물리 삭제(`deleteDimension`)에 필요하다. */
  readonly sheetId: number;
  /** 탭 제목. A1 범위를 만들 때 쓴다 — **로컬에 저장하지 않고** 연결할 때마다 다시 읽는다. */
  readonly sheetTitle: string;
  readonly mapping: ColumnMapping;
  /** 앱이 만든 시트인지. `상태` 열이 있어 소프트 삭제가 가능한 시트만 true. */
  readonly createdByApp: boolean;
};

/** 한 번의 조회 결과. 쓰기는 항상 "이 스냅샷에서 나온 참조"로만 이뤄진다. */
export type LedgerSnapshot = {
  /** 이 조회를 식별한다. 물리 삭제가 일어나면 이 ID 가 폐기되어 이후 쓰기가 거부된다. */
  readonly snapshotId: string;
  readonly spreadsheetId: string;
  readonly sheetTitle: string;
  /** 매핑된 열 기준 마지막 데이터 행. 헤더만 있으면 1. 추가는 항상 이 다음 행부터다(AC-W1). */
  readonly lastDataRow: number;
  readonly entries: readonly LedgerEntry[];
  readonly unreadableRows: readonly UnreadableRow[];
};

/** 실패의 종류. UI 는 이 코드로 복구 경로를 고른다. */
export type LedgerErrorCode =
  | 'disabled'
  | 'not-authorized'
  | 'auth-expired'
  | 'permission-denied'
  | 'api-disabled'
  | 'sheet-not-found'
  | 'rate-limited'
  | 'server-error'
  | 'network-error'
  | 'invalid-response'
  | 'invalid-entry'
  | 'write-safety'
  | 'conflict'
  | 'stale-snapshot';

/** 사용자가 다음에 할 수 있는 일. `reconnect` = 피커로 다시 고르기, `reauthorize` = 권한 다시 받기. */
export type LedgerRecovery = 'none' | 'retry' | 'reauthorize' | 'reconnect';

/**
 * 실패 1건.
 *
 * 🔴 `message` 는 **정적 문구**다 — 시트 ID·파일명·시트 제목·열 이름·금액을 넣지 마라(준PII).
 *    상세는 `fields`(어떤 논리 필드가 문제인지)처럼 값이 아닌 것만 싣는다.
 */
export type LedgerError = {
  readonly code: LedgerErrorCode;
  readonly message: string;
  readonly recovery: LedgerRecovery;
  /** 충돌·검증 실패에서 문제가 된 논리 필드(값이 아니라 필드 이름만). */
  readonly fields?: readonly LedgerField[];
};

/** 코드별 정적 문구. 값이 섞이지 않으므로 로그·화면 어디에 실려도 안전하다. */
export const LEDGER_ERROR_MESSAGE: Readonly<Record<LedgerErrorCode, string>> = {
  disabled: '가계부 연동이 비활성화되어 있습니다.',
  'not-authorized': '구글 계정 접근 권한이 없습니다. 권한을 다시 허용해 주십시오.',
  'auth-expired': '접근 권한이 만료되었습니다. 권한을 다시 허용해 주십시오.',
  'permission-denied': '이 시트에 접근할 권한이 없습니다. 시트를 다시 선택해 주십시오.',
  'api-disabled':
    '구글 클라우드 프로젝트에서 Google Sheets API 가 켜져 있지 않습니다. 사용 설정한 뒤 다시 시도해 주십시오.',
  'sheet-not-found': '시트를 찾을 수 없습니다. 삭제되었거나 휴지통으로 이동했을 수 있습니다.',
  'rate-limited': '요청이 잠시 제한되었습니다. 잠시 후 다시 시도해 주십시오.',
  'server-error': '구글 시트 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주십시오.',
  'network-error': '네트워크 연결을 확인해 주십시오.',
  'invalid-response': '구글 시트의 응답을 해석하지 못했습니다.',
  'invalid-entry': '입력한 내용을 저장할 수 없습니다. 값을 확인해 주십시오.',
  'write-safety': '안전 규칙에 어긋나는 쓰기 요청이라 실행하지 않았습니다.',
  conflict: '시트의 값이 앱에서 마지막으로 확인한 값과 다릅니다. 목록을 새로 고친 뒤 다시 시도해 주십시오.',
  'stale-snapshot': '목록이 최신 상태가 아닙니다. 목록을 새로 고친 뒤 다시 시도해 주십시오.'
};

const LEDGER_ERROR_RECOVERY: Readonly<Record<LedgerErrorCode, LedgerRecovery>> = {
  disabled: 'none',
  'not-authorized': 'reauthorize',
  'auth-expired': 'reauthorize',
  'permission-denied': 'reconnect',
  // 프로젝트 설정 문제라 사용자가 앱 안에서 할 수 있는 일이 없다 — 재시도·재선택 버튼을 주면 거짓 희망이다.
  'api-disabled': 'none',
  'sheet-not-found': 'reconnect',
  'rate-limited': 'retry',
  'server-error': 'retry',
  'network-error': 'retry',
  'invalid-response': 'retry',
  'invalid-entry': 'none',
  'write-safety': 'none',
  conflict: 'retry',
  'stale-snapshot': 'retry'
};

/** 실패 1건을 만든다. 문구·복구경로는 코드에서만 나온다 — 호출부가 값을 끼워 넣을 수 없다. */
export const ledgerError = (code: LedgerErrorCode, fields?: readonly LedgerField[]): LedgerError =>
  fields && fields.length > 0
    ? { code, message: LEDGER_ERROR_MESSAGE[code], recovery: LEDGER_ERROR_RECOVERY[code], fields }
    : { code, message: LEDGER_ERROR_MESSAGE[code], recovery: LEDGER_ERROR_RECOVERY[code] };

/** 여러 건을 쓸 때의 건별 결과(AC-W5). 성공/실패를 **건마다** 돌려준다. */
export type ItemOutcome<T> =
  | { readonly ok: true; readonly index: number; readonly value: T }
  | { readonly ok: false; readonly index: number; readonly error: LedgerError };

/** 여러 건 쓰기의 종합 결과. `partial` 이 1급 상태다 — "N건 중 M건 성공"을 삼키지 않는다. */
export type WriteReport<T> = {
  readonly status: 'success' | 'partial' | 'failure';
  readonly items: readonly ItemOutcome<T>[];
  readonly successCount: number;
  readonly failureCount: number;
};

/**
 * 건별 결과에서 종합 상태를 정한다.
 * - 시도 0건 → `failure`(아무것도 성공하지 않았다. "성공"으로 위장하지 않는다)
 * - 전부 성공 → `success` / 전부 실패 → `failure` / 섞임 → `partial`
 */
export const summarizeWriteReport = <T>(items: readonly ItemOutcome<T>[]): WriteReport<T> => {
  const successCount = items.filter((item) => item.ok).length;
  const failureCount = items.length - successCount;
  const status: WriteReport<T>['status'] =
    items.length === 0 || successCount === 0 ? 'failure' : failureCount === 0 ? 'success' : 'partial';
  return { status, items, successCount, failureCount };
};

/** Sheets `values` 쓰기 1건 — 한 열 × 한 구간. 앱은 이 단위로만 쓴다. */
export type SheetValueRange = {
  readonly range: string;
  readonly majorDimension: 'COLUMNS';
  readonly values: readonly (readonly string[])[];
};
