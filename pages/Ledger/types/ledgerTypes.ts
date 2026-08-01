/**
 * `/ledger` 의 **도메인 모델**. 페이지·훅·컴포넌트가 함께 쓴다.
 *
 * 왜 `LedgerPage/LedgerPage.types.ts` 가 아니라 여기인가: `pages/Ledger/hooks` 와
 * `pages/Ledger/components` 는 `LedgerPage/` 폴더의 **외부**라, 그 안의 파일을 직접 import 하면
 * "폴더 단위 import" 규칙을 어긴다(`.cursor/rules`). 배럴(`LedgerPage/index.ts`)을 거치면 이번엔
 * 순환이 된다. 그래서 공유 모델만 형제 폴더로 뺐다 — `LedgerPage.types.ts` 에는 그 페이지의
 * **뷰 모델·props** 만 남는다.
 */

/**
 * 화면 상태 기계. 상태마다 라우트를 만들지 않는다 — 뒤로가기 스택이 지저분해지고
 * 히어로가 라우트마다 lazy 언마운트되면 hue 알약이 깜빡인다.
 */
export type LedgerConnectionState = 'checking' | 'disconnected' | 'mapping' | 'connected' | 'denied';

/** 지금 진행 중인 비동기 작업. 버튼 `loading` 배정의 단일 기준이다. */
export type LedgerPhase = 'idle' | 'picking' | 'creating' | 'connecting' | 'reconnecting' | 'refreshing';

/** 매핑 셀렉트의 한 선택지. `letter` 는 A1 열 문자, `header` 는 첫 행에서 읽은 이름(빈 문자열 가능). */
export type LedgerColumnOption = { letter: string; header: string };

/** 화면이 다루는 논리 필드. 데이터 계층의 `status`(소프트 삭제 표시)는 사용자가 고르는 대상이 아니다. */
export type LedgerFieldId = 'date' | 'kind' | 'amount' | 'category' | 'memo';

/** 필드 → 열 문자. `null` = 아직 고르지 않음. */
export type LedgerMappingDraft = Readonly<Record<LedgerFieldId, string | null>>;

/** 매핑 화면의 필드 정의(필수 4 + 선택 1). 순서가 곧 화면 순서다. */
export const LEDGER_MAPPING_FIELDS = [
  { id: 'date', required: true },
  { id: 'kind', required: true },
  { id: 'amount', required: true },
  { id: 'category', required: true },
  { id: 'memo', required: false }
] as const satisfies readonly { id: LedgerFieldId; required: boolean }[];

/** 미리보기 한 행. 값은 이미 표시용 문자열이다(뷰는 계산하지 않는다). */
export type LedgerPreviewRow = {
  id: string;
  /** 필드 순서(날짜·구분·금액·분류·메모)대로 포맷된 값. */
  cells: readonly string[];
  /** 고른 열 조합으로 읽지 못한 행인가. 🔴 danger 색이 아니라 텍스트가 채널이다. */
  unreadable: boolean;
};

/** 실패 사유. 데이터 계층의 `LedgerErrorCode` 를 화면이 아는 다섯 갈래로 접은 것. */
export type LedgerFailureReason = 'network' | 'permission' | 'rateLimited' | 'conflict' | 'unknown';

export type LedgerRowFailure = {
  reason: LedgerFailureReason;
  /** 화면에 그대로 나가는 사유 본문(중립색으로 읽는 글). */
  body: string;
  /** 429 의 대기 시간(초). 없으면 `null`. */
  retryAfterSec: number | null;
};

/** 표의 한 행. 값은 전부 **이미 포맷된 문자열**이다. */
export type LedgerRowModel = {
  id: string;
  /** `YYYY-MM-DD` — `<time dateTime>` 의 원값. */
  dateISO: string;
  /** `8월 3일 (월)`. 파싱이 안 되면 시트 원문 그대로. */
  dateText: string;
  kind: 'income' | 'expense';
  category: string;
  /** 🔴 항상 양수. 방향은 `kind` 가 갖는다(행 금액에는 부호가 없다). */
  amount: number;
  /** `formatKRW(Math.abs(amount))`. */
  amountText: string;
  memo: string;
  /** 🔴 쓰기 실패는 목록에 **잔류**한다(토스트 금지). 새로고침·월 이동 전까지 사라지지 않는다. */
  failure: LedgerRowFailure | null;
};

/** 월 요약 3숫자. 🔴 손익색을 쓰지 않는다 — 수입·지출은 P&L 이 아니다. */
export type LedgerMonthSummary = {
  incomeText: string;
  expenseText: string;
  /** 순액만 부호를 갖는다(`Intl` 이 `-₩…` 로 낸다). 색은 없다. */
  netText: string;
  incomeCount: number;
  expenseCount: number;
};

/** 폼이 다루는 값. 금액은 문자열 그대로 쥔다(중간 입력 상태를 숫자로 접으면 지울 수 없다). */
export type LedgerDraftForm = {
  date: string;
  kind: 'income' | 'expense';
  amount: string;
  category: string;
  memo: string;
};

export type LedgerFormMode = 'create' | 'edit';

/** §4.7 — 재연결 성공 직후 **이어서 실행**할 작업. */
export type LedgerPendingAction =
  | { intent: 'create'; draft: LedgerDraftForm }
  | { intent: 'update'; id: string; draft: LedgerDraftForm }
  | { intent: 'remove'; id: string };

/** 폼·행·다이얼로그가 공유하는 실패 표시 모델. */
export type LedgerErrorModel = {
  title: string;
  body: string;
  reason: LedgerFailureReason;
};

/**
 * §4.8 저장하지 못한 기록. `null` 이면 목록 카드도 배너도 그리지 않는다.
 *
 * 🔴 요약 배너는 **여러 건을 한 번에 쓴 결과가 있을 때만**(`hasBatchReport`) 나온다 — 한 건짜리
 * 실패에 "1건 중 0건" 이라고 말하면 숫자가 정보가 아니라 소음이 된다. 대신 그 한 건은 아래 목록에
 * 건별 사유와 함께 그대로 남는다.
 */
export type LedgerPartialFailureModel = {
  successCount: number;
  totalCount: number;
  hasBatchReport: boolean;
  rows: readonly LedgerRowModel[];
  /** 실패 건에 429 가 하나라도 있으면 "모두 다시 시도"가 비활성이다(무음 비활성 금지 → 사유 줄). */
  isRetryAllBlocked: boolean;
};

/** 삭제 확인이 보여 주는 대상 요약(🔴 "정말 삭제하시겠습니까?" 단독 금지). */
export type LedgerRemoveTarget = {
  id: string;
  dateText: string;
  kindText: string;
  category: string;
  amountText: string;
};

/** 매핑 단계의 화면 모델. */
export type LedgerMappingModel = {
  sheetName: string;
  columns: readonly LedgerColumnOption[];
  draft: LedgerMappingDraft;
  matchedCount: number;
  /** 아직 고르지 않은 **필수** 항목의 한국어 이름. 비어 있지 않으면 제출이 비활성이다. */
  missingNames: readonly string[];
  previewRows: readonly LedgerPreviewRow[];
  /** 미리보기 표를 그릴 수 있는가(필수 열이 전부 정해졌는가). */
  canPreview: boolean;
  allUnreadable: boolean;
  isPreviewLoading: boolean;
};

/** 폼 모달의 화면 모델. */
export type LedgerFormModel = {
  mode: LedgerFormMode;
  draft: LedgerDraftForm;
  /** 제출 시도 후에만 채워진다(입력 중 빨간 줄 금지). */
  errors: Partial<Record<keyof LedgerDraftForm, string>>;
  /** 분류 자동완성 후보(빈도 내림차순, 상한 50). */
  categoryOptions: readonly string[];
  isSaving: boolean;
  writeError: LedgerErrorModel | null;
};
