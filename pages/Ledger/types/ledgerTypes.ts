/**
 * `/ledger` 의 **도메인 모델**. 페이지·훅·컴포넌트가 함께 쓴다.
 *
 * 왜 `LedgerPage/LedgerPage.types.ts` 가 아니라 여기인가: `pages/Ledger/hooks` 와
 * `pages/Ledger/components` 는 `LedgerPage/` 폴더의 **외부**라, 그 안의 파일을 직접 import 하면
 * "폴더 단위 import" 규칙을 어긴다(`.cursor/rules`). 배럴(`LedgerPage/index.ts`)을 거치면 이번엔
 * 순환이 된다. 그래서 공유 모델만 형제 폴더로 뺐다 — `LedgerPage.types.ts` 에는 그 페이지의
 * **뷰 모델·props** 만 남는다.
 */
import type { LedgerKind } from '@/shared/lib/googleSheets';

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

/**
 * 화면이 다루는 논리 필드. 데이터 계층의 `status`(소프트 삭제 표시)는 사용자가 고르는 대상이 아니다.
 *
 * 🔴 **데이터 계층의 `LedgerField` 와 맞춰 둔다**(`status` 하나만 뺀 것). v2 에서 축 넷이 늘었을 때
 *    이 목록만 옛 다섯으로 남아 있었고, 그 결과 **매핑 화면에서 상세항목·주체·결제수단·고정을
 *    고를 자리가 없었다.** 앱이 만든 시트는 헤더가 정확히 맞아 매핑을 건너뛰므로 겉으로는 멀쩡했지만,
 *    사용자가 열을 하나 더하거나 헤더 이름을 바꾸는 순간 매핑 화면으로 떨어지고 그 네 축이 조용히
 *    죽었다(입력 폼에는 칸이 있고, 저장은 성공했다고 나오고, 시트에는 안 들어간다).
 *    시트를 손대는 것은 헤비 유저일수록 잦다 — 정확히 겨냥한 사용자에게만 터지는 결함이었다.
 */
export type LedgerFieldId = 'date' | 'kind' | 'amount' | 'category' | 'subcategory' | 'payer' | 'method' | 'fixity' | 'memo';

/** 필드 → 열 문자. `null` = 아직 고르지 않음. */
export type LedgerMappingDraft = Readonly<Record<LedgerFieldId, string | null>>;

/**
 * 매핑 화면의 필드 정의(필수 4 + 선택 5). 순서가 곧 화면 순서다.
 *
 * 순서는 **앱이 만드는 시트의 열 순서**와 같다 — 사용자가 시트를 옆에 띄워 두고 위에서부터 짚어
 * 내려갈 수 있어야 한다. 필수를 앞에 몰지 않은 이유가 이것이다(필수 표시는 배지가 진다).
 */
export const LEDGER_MAPPING_FIELDS = [
  { id: 'date', required: true },
  { id: 'kind', required: true },
  { id: 'category', required: true },
  { id: 'subcategory', required: false },
  { id: 'amount', required: true },
  { id: 'payer', required: false },
  { id: 'method', required: false },
  { id: 'fixity', required: false },
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
  /** 🔴 `transfer`(이체) 가 v2 에서 늘었다 — 저축·투자 납입은 쓴 것이 아니라 옮긴 것이다. */
  kind: LedgerKind;
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
  kind: LedgerKind;
  amount: string;
  category: string;
  /**
   * v2 축 넷. 전부 **선택**이라 빈 값이 정상이다.
   * 🔴 폼에서 비워 두면 상세항목 없음 · 공동 · 수단 없음 · 변동비로 저장된다 —
   *    1인 가구가 매번 네 칸을 더 채우게 만들면 입력이 무거워져 가계부 자체를 안 쓰게 된다.
   */
  subcategory: string;
  payer: string;
  method: string;
  /** 체크박스 하나. 도메인의 `LedgerFixity` 로는 저장 직전에 접는다. */
  isFixed: boolean;
  memo: string;
};

export type LedgerFormMode = 'create' | 'edit';

/** 이어갈 고정비 한 줄. 값은 이미 포맷된 문자열이다(뷰는 계산하지 않는다). */
export type LedgerCarryOverRow = {
  id: string;
  /** `주거 · 월세`. 어디서 왔는지 사용자가 알아볼 수 있어야 한다. */
  label: string;
  amountText: string;
  dateText: string;
};

/**
 * 고정비 이어가기. `null` 이면 이어갈 것이 없어 자리를 만들지 않는다.
 *
 * 🔴 **두 단계다.** `isOpen` 이 false 면 버튼만 있고, 열어야 목록이 보이고, 확인해야 쓴다 —
 *    남의 시트에 여러 줄을 한 번에 넣는 일이라 한 번의 오조작이 비싸다(되돌리려면 하나씩 지운다).
 */
export type LedgerCarryOverModel = {
  count: number;
  isOpen: boolean;
  isSaving: boolean;
  rows: readonly LedgerCarryOverRow[];
};

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
  /**
   * 자동완성 후보(빈도 내림차순, 상한 50).
   *
   * 🔴 후보는 **시트에서 관측한 값 + 기본 분류 사전**을 합친 것이다. 설정 화면을 따로 만들지 않은
   *    이유가 이것이다 — 구성원·결제수단은 한 번 쓰면 다음부터 목록에 뜬다. 관리할 화면을 하나 더
   *    만드는 것보다, 쓰던 값이 저절로 쌓이는 쪽이 가볍고 시트가 정본이라는 원칙과도 맞는다.
   */
  /**
   * 내용 제안 — **`분류 규칙` 탭의 "포함하는 말"** 이다(2026-08-08).
   *
   * 🔴 규칙에 적어 둔 말을 그대로 고르면 그 규칙이 반드시 걸린다. 손으로 치다 한 글자 틀리면
   *    규칙이 안 걸리는데, 그 사실은 저장한 뒤에야 보인다 — 고르게 하면 그 실패가 사라진다.
   * ⚠ 자유 입력은 그대로다. 목록은 제안이지 강제가 아니다.
   */
  memoOptions: readonly string[];
  categoryOptions: readonly string[];
  subcategoryOptions: readonly string[];
  payerOptions: readonly string[];
  methodOptions: readonly string[];
  isSaving: boolean;
  writeError: LedgerErrorModel | null;
};

/*
 * 🔴 B-3 "두 가계부 블렌딩" 타입 블록은 **2026-08-02 사용자 결정으로 제거**했다.
 *
 * 이유: 사용자가 스프레드시트 안에서 이미 할 수 있는 일이었다 — 장부를 탭으로 나누고 또 다른 탭에서
 * 합계를 내는 것이 스프레드시트의 본래 강점이다. 앱이 그걸 다시 구현하면 "어느 쪽이 진짜 합계인가"가
 * 둘로 갈리고, 두 링크가 섞인 화면의 쓰기는 오류 표면이 두 배가 된다.
 *
 * 그래서 앱은 **파일 하나만 호출**한다. 여러 장부는 그 파일의 탭으로 두고, 앱은 탭 전환만 제공한다
 * (LedgerTabPicker · useLedgerConnection.switchTab · LedgerTabOption/LedgerTabPickerModel).
 * 되살리지 마라 — 되살리려면 위 "합계 정의가 둘로 갈린다"부터 풀어야 한다.
 */
