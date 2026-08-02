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

/**
 * **앱 로그인**(Supabase 세션) 게이트 — 🔴 위 `LedgerConnectionState`(구글 시트 연결)와 **다른 축**이다.
 *
 * 두 축은 중첩되지 않는다. 앱 신원은 구글·네이버·카카오 아무 계정이나 될 수 있고, 구글 시트 권한은
 * 그와 무관하게 GIS 액세스 토큰(`drive.file`)이 따로 쥔다. 그래서 네이버로 로그인한 사용자도
 * 로그인을 유지한 채 구글 동의만 추가로 받는다 — 로그인을 갈아탈 이유가 없다.
 */
export type LedgerAppAuthGate = {
  /** 초기 세션 확인이 끝났는가. `false` 면 게이트를 성급히 보여주지 않는다("아직 모름"). */
  isReady: boolean;
  isLoggedIn: boolean;
};

/** 지금 진행 중인 비동기 작업. 버튼 `loading` 배정의 단일 기준이다. */
export type LedgerPhase = 'idle' | 'picking' | 'creating' | 'connecting' | 'reconnecting' | 'refreshing';

/**
 * 탭 선택지 하나. `title` 은 **표시 전용**이다 — 준PII 라 로컬·GA·에러 문구에 남기지 않는다
 * (연결할 때마다 시트 메타에서 다시 읽는다).
 */
export type LedgerTabOption = { sheetId: number; title: string };

/**
 * B-1 탭 선택 화면 모델. `null` 이면 탭을 고를 자리가 없다(연결 전).
 *
 * 🔴 `blockedReason` 이 있으면 선택이 **비활성**이고 그 문장이 화면에 함께 선다 — 사유 없는 회색
 * 컨트롤을 만들지 않는다. 막는 이유는 사고 방지다: 저장 실패 대기열의 재시도는 그때의 연결(링크)로
 * 행을 **추가**하므로, 탭이 바뀐 뒤에 재시도하면 다른 탭에 기록이 들어간다.
 */
export type LedgerTabPickerModel = {
  options: readonly LedgerTabOption[];
  /** 지금 보고 있는 탭. `options` 안에 반드시 있다. */
  currentSheetId: number;
  currentTitle: string;
  /** 비활성 사유. `null` 이면 고를 수 있다. */
  blockedReason: string | null;
  /** 전환 중(연결 재수립 + 재조회). */
  isSwitching: boolean;
};

/**
 * B-2 신선도 — **"지금 보는 화면이 언제 기준인가"**. 목록 카드 헤더가 이 모델 하나를 그린다.
 *
 * 🔴 여기에 "몇 분 전" 같은 상대시간을 넣지 않는다 — 렌더 시점에 따라 값이 달라져 화면과 테스트가
 * 함께 흔들린다. 절대 시각(`HH:MM 기준`)은 언제 읽어도 같은 문자열이다.
 * 🔴 `hasUpdate` 는 **"달라졌다"까지만** 말한다. 어느 행이 어떻게 달라졌는지는 물리 삭제가 행 번호를
 * 밀어 버리는 이 도메인에서 원리적으로 확정할 수 없다(`useLedgerFreshness` 의 서명 주석이 근거).
 */
export type LedgerFreshnessModel = {
  /** `09:30 기준`. 아직 한 번도 읽지 못했으면 `null` — 없는 값에 "—" 를 남기지 않는다. */
  readAtText: string | null;
  /** 다시 읽는 중(수동·자동·쓰기 뒤 재조회 공통). */
  isRefreshing: boolean;
  /** 429 로 막힌 남은 초. `null` 이면 지금 누를 수 있다. 🔴 무음 비활성 금지 — 사유 줄이 함께 선다. */
  retrySeconds: number | null;
  /** 마지막 재조회 결과가 직전 스냅샷과 달랐는가. */
  hasUpdate: boolean;
};

/**
 * B-4 배당 겹쳐 보기 본문 — **보고 있는 달** 기준.
 *
 * 🔴 유니온으로 갈라 둔 것이 이 기능의 안전장치다. `fx-unavailable` 과 `metrics` 는 **다른 갈래**라
 * 환율이 없는 상태에서 원화·커버율을 그리려면 갈래를 통째로 바꿔야 한다(실수로 새지 않는다).
 * 🔴 값이 없으면 갈래로 말한다 — 0 으로 채우지 않는다(날조 금지).
 */
export type LedgerDividendBody =
  /** 포트폴리오 저장소를 아직 읽는 중. */
  | { kind: 'loading' }
  /** 포트폴리오를 읽지 못했다 — 숫자를 지어내지 않는다. */
  | { kind: 'unavailable' }
  /** 합계에 들어가는 보유가 하나도 없다(수량 미입력·시장정보 미해석 포함). */
  | { kind: 'no-holdings' }
  /** 보유는 있으나 이 달에 지급이 예정된 종목이 없다. */
  | { kind: 'no-payout' }
  /** 🔴 환율 미가용 — 원화 환산·커버율을 만들지 않고 달러 원값만 말한다. */
  | { kind: 'fx-unavailable'; usdText: string; unknownScheduleCount: number }
  | {
      kind: 'metrics';
      /** 세후·원화로 환산한 이 달 예상 배당. */
      amountText: string;
      /** 🔴 지출이 0 인 달에는 `null` — 0 나눗셈을 100% 로 위장하지 않는다. */
      coverageText: string | null;
      /** 작은 분류부터 누적해 예상 배당 이내에 들어오는 분류 이름. */
      coveredCategories: readonly string[];
      /** 지급월을 몰라 이 달 계산에서 빠진 종목 수. */
      unknownScheduleCount: number;
    };

/**
 * B-4 카드 모델. 🔴 **토글이 꺼져 있어도 모델은 존재한다** — 카드(=토글의 자리)는 상시 서고
 * 본문만 없다. 켜고 끄는 자리가 사라지면 사용자가 이 기능을 다시 켤 방법이 없다.
 *
 * ⚠ 이 모델은 **단일 가계부 뷰 전용**이다. 두 가계부 블렌딩(B-3) 화면에서는 V1 에서 쓰지 않는다 —
 * "우리 가계" 지출에 "내 포트폴리오" 배당을 겹치면 귀속이 섞인다(배당은 한 사람 것).
 */
export type LedgerDividendModel = {
  isOn: boolean;
  /** 꺼져 있으면 `null`. */
  body: LedgerDividendBody | null;
};

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
export type LedgerFailureReason =
  | 'network'
  | 'permission'
  | 'apiDisabled'
  | 'rateLimited'
  | 'conflict'
  | 'unknown';

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

/* ── B-3 두 가계부 블렌딩 ─────────────────────────────────────────────────────
 *
 * 🔴 이 블록의 유일한 목적은 **"반쪽 실패를 합계로 위장할 수 없게" 타입으로 막는 것**이다(D3-7).
 *    합산 3숫자(`summary`)는 `kind: 'ready'` 갈래에만 존재한다 — 한쪽이라도 실패하면 그 필드가
 *    타입에 아예 없으므로, UI 가 실수로 반쪽 합계를 그리려면 갈래를 통째로 바꿔야 한다.
 * 🔴 분류는 합치지 않는다(D3-5). 두 가계부의 분류 문자열은 원문 그대로 남고 출처로만 구분한다.
 * 🔴 통화 변환을 하지 않는다(D3-6) — 금액 숫자를 그대로 더한다. 이 전제는 UI 가 문구로 알린다.
 */

/** 블렌딩의 두 자리. 순서(a → b)가 곧 소계 2줄의 순서다. */
export type LedgerBlendSourceKey = 'a' | 'b';

/**
 * 출처별 라벨. **사용자가 붙인 이름**이다 — 시트 파일명·탭 제목을 기본값으로 쓰지 않는다(D3-3:
 * 준PII 를 로컬에 저장하는 뒷문이 된다). 기본값은 중립 문구(`LEDGER_BLEND_DEFAULT_LABEL`).
 */
export type LedgerBlendLabels = Readonly<Record<LedgerBlendSourceKey, string>>;

/**
 * 통합 목록의 한 행 = 단일 뷰의 행 + 출처.
 *
 * 🔴 `blendId` 를 따로 두는 이유: `id`(=`snapshotId:rowNumber`)는 "이 가계부에서 열기"가 원본을
 * 되찾는 열쇠라 **가공하면 안 된다**. 리스트 키는 출처를 붙인 `blendId` 를 쓴다.
 */
export type LedgerBlendRow = LedgerRowModel & {
  readonly source: LedgerBlendSourceKey;
  /** 배지에 그대로 나가는 텍스트. 🔴 색이 아니라 이 문자열이 출처의 채널이다. */
  readonly sourceLabel: string;
  /** 리스트 키 전용(`a:snap-1:3`). 원본 조회에는 쓰지 않는다. */
  readonly blendId: string;
};

/** 출처 한쪽의 소계. 🔴 텍스트와 함께 **숫자**를 싣는다 — "합산 = 소계의 합" 을 단정할 수 있어야 한다. */
export type LedgerBlendSubtotal = {
  readonly source: LedgerBlendSourceKey;
  readonly label: string;
  readonly income: number;
  readonly expense: number;
  readonly incomeText: string;
  readonly expenseText: string;
  readonly incomeCount: number;
  readonly expenseCount: number;
};

/** 출처별 "읽지 못한 행" 수(D3-6). 0 건인 출처는 목록에 넣지 않는다. */
export type LedgerBlendUnreadable = {
  readonly source: LedgerBlendSourceKey;
  readonly label: string;
  readonly count: number;
};

/** 출처 한쪽의 실패. 문구는 기존 `toErrorModel` 규약을 그대로 쓴다(정적 문구 — 값이 섞이지 않는다). */
export type LedgerBlendFailure = {
  readonly source: LedgerBlendSourceKey;
  readonly label: string;
  readonly error: LedgerErrorModel;
};

/**
 * 블렌딩 본문. 🔴 **합산은 `ready` 에만 있다.**
 *
 * - `loading`    한쪽이라도 아직 읽는 중 — 숫자를 만들지 않는다.
 * - `unavailable` 양쪽 실패 — 실패 2건만 말한다.
 * - `partial`    한쪽 실패 — 성공한 쪽의 행·소계까지만. 합산 필드가 **없다**(0 으로 채우지 않는다).
 * - `ready`      양쪽 성공 — 합산 3숫자 + 출처별 소계 2줄.
 */
export type LedgerBlendBody =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly failures: readonly [LedgerBlendFailure, LedgerBlendFailure] }
  | {
      readonly kind: 'partial';
      readonly failure: LedgerBlendFailure;
      /** 성공한 쪽의 소계. 이것은 합산이 아니라 그 가계부 하나의 숫자다. */
      readonly available: LedgerBlendSubtotal;
      readonly rows: readonly LedgerBlendRow[];
      readonly unreadable: readonly LedgerBlendUnreadable[];
    }
  | {
      readonly kind: 'ready';
      readonly rows: readonly LedgerBlendRow[];
      /** 합산 3숫자. 손익색을 쓰지 않는 기존 규약(`LedgerMonthSummary`)을 그대로 따른다. */
      readonly summary: LedgerMonthSummary;
      readonly subtotals: readonly [LedgerBlendSubtotal, LedgerBlendSubtotal];
      readonly unreadable: readonly LedgerBlendUnreadable[];
    };

/**
 * 블렌딩 화면 모델. `labels` 는 본문 갈래와 **무관하게** 항상 있다 — 로딩·실패 중에도 화면은
 * "어느 가계부가 실패했는지"를 이름으로 말해야 한다.
 */
export type LedgerBlendModel = {
  readonly labels: LedgerBlendLabels;
  readonly body: LedgerBlendBody;
};

/**
 * 설정 화면의 선택지 하나 = 이 브라우저에 저장된 링크 하나.
 *
 * 🔴 `value` 는 `spreadsheetId:sheetId` 를 접은 **폼 값**이다 — 화면에 그리지 않는다(준PII).
 *    사람이 읽는 것은 `name`(탭 제목)뿐이고, 제목을 아직 못 읽었으면 중립 문구가 들어온다.
 */
export type LedgerBlendSourceOption = {
  readonly value: string;
  readonly name: string;
};

/**
 * 블렌딩 설정 화면 모델. `null` 이면 설정 화면이 닫혀 있다.
 *
 * 🔴 `blockedReason` 이 있으면 제출이 **비활성**이고 그 문장이 함께 선다(사유 없는 회색 버튼 금지).
 *    같은 링크를 두 번 고른 경우가 여기로 온다 — 판정은 `createLedgerBlendConfig` 와 **같은 규칙**이다.
 */
export type LedgerBlendSetupModel = {
  readonly options: readonly LedgerBlendSourceOption[];
  readonly a: { readonly value: string | null; readonly label: string };
  readonly b: { readonly value: string | null; readonly label: string };
  readonly blockedReason: string | null;
  /** 이미 저장된 구성이 있는가(해제 버튼의 노출 조건). */
  readonly canClear: boolean;
  /** 탭 제목을 읽는 중. 이름 자리에 중립 문구가 들어 있다는 사실을 화면이 말한다. */
  readonly isLoadingNames: boolean;
};

/**
 * B-3 화면 모델 한 벌. 🔴 **진입점 노출 조건(`isAvailable`)이 여기 있다** — 저장된 링크가 2개 이상일
 * 때만 고를 것이 있다(AC3-1). 화면은 이 불리언만 보고 그린다.
 */
export type LedgerBlendViewModel = {
  readonly isAvailable: boolean;
  /** 지금 블렌딩 뷰를 보고 있는가. `true` 면 단일 가계부 화면(요약·목록·쓰기)이 통째로 대체된다. */
  readonly isOn: boolean;
  /** 링크 대조(`resolveLedgerBlendConfig`)를 통과한 구성이 있는가. 고아 참조는 여기서 이미 떨어진다. */
  readonly hasConfig: boolean;
  readonly setup: LedgerBlendSetupModel | null;
  /** 블렌딩 본문. `isOn` 이 아니면 `null`. */
  readonly model: LedgerBlendModel | null;
  /**
   * "이 가계부에서 열기"를 제공할 수 있는 출처. 🔴 지금 연결된 **같은 스프레드시트의 탭**만 들어온다 —
   * 다른 파일의 가계부는 피커를 다시 거쳐야 열리므로, 되지 않는 버튼을 그리지 않는다.
   */
  readonly openableSources: readonly LedgerBlendSourceKey[];
  /**
   * "이 가계부에서 열기"가 막힌 사유(`null` 이면 열 수 있다).
   *
   * 🔴 **탭 피커의 비활성 사유와 같은 값**이다 — 이 버튼이 하는 일이 결국 탭 전환(`switchTab`)이라
   * 같은 사고 경로를 탄다. 저장 실패 대기열의 재시도는 그때의 연결로 행을 **추가**하는데, 추가에는
   * 행 참조가 없어 `guardRowRef` 가 막지 못하므로, 탭이 바뀐 뒤 재시도하면 다른 탭에 기록이 들어간다.
   * 판단은 `tabSwitchBlockedReason` 하나가 갖는다 — 여기에 두 번째 규칙을 만들지 마라.
   */
  readonly openBlockedReason: string | null;
};
