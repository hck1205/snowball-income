import type { CommunityOAuthProvider } from '@/shared/lib/supabase';
import type {
  LedgerAnalysisModel,
  LedgerPayerScope,
  LedgerSideDraft,
  LedgerSideFormKind,
  LedgerViewTab,
  LedgerViewTabId
} from '../utils';
import type {
  LedgerAppAuthGate,
  LedgerCarryOverModel,
  LedgerConnectionState,
  LedgerDividendModel,
  LedgerDraftForm,
  LedgerErrorModel,
  LedgerFieldId,
  LedgerFormModel,
  LedgerFreshnessModel,
  LedgerMappingModel,
  LedgerMonthSummary,
  LedgerPartialFailureModel,
  LedgerPhase,
  LedgerRemoveTarget,
  LedgerRowModel,
  LedgerTabPickerModel
} from '../types';
import type { LedgerSideTabState } from '../components';

/**
 * 뷰가 그대로 그리는 화면 모델. **여기 없는 필드는 화면에 없다.**
 *
 * 도메인 모델(`LedgerRowModel` 등)은 형제 폴더 `pages/Ledger/types` 가 소유한다 — 훅·컴포넌트도
 * 같은 모델을 쓰기 때문이다(그 파일 상단 주석 참고).
 */
export type LedgerViewModel = {
  /**
   * 🔴 **앱 로그인 게이트 — `state`(구글 시트 연결)보다 앞선 다른 축이다.**
   *
   *  - `null`  = 이 배포에 앱 로그인 계층이 없다 → 게이트 없이 곧바로 시트 연결 화면.
   *  - `isReady: false` = 세션 확인 중 → 게이트를 성급히 보여주지 않는다.
   *  - `isLoggedIn: false` = 로그인 유도 화면(구글·네이버·카카오).
   *  - `isLoggedIn: true`  = 제공자와 무관하게 시트 연결 흐름으로 간다.
   */
  appAuth: LedgerAppAuthGate | null;

  /**
   * 🔴 **화면 탭 — 시트의 네 입력 탭을 앱에서도 탭으로**(2026-08-08).
   *
   * `tabPicker`(사용자 워크시트 고르기)와 **다른 축이다.** 섞지 마라 —
   *  - `tabPicker` 는 어느 **파일의 어느 워크시트**를 볼지(개수가 열려 있다 · 셀렉트).
   *  - 이것은 같은 파일 안의 **어느 관심사**를 볼지(넷으로 닫혀 있다 · 가로 탭바).
   */
  viewTabs: readonly LedgerViewTab[];
  selectedViewTab: LedgerViewTabId;
  /** `entries` 를 보고 있으면 `null`. 그 밖에는 그 탭의 읽기 상태다. */
  sideTab: LedgerSideTabState | null;
  /** 자산·투자 직접 적기 폼. 열려 있지 않으면 `null`. */
  sideForm: {
    kind: LedgerSideFormKind;
    draft: LedgerSideDraft;
    errors: Readonly<Record<string, string>>;
    isSaving: boolean;
    writeError: LedgerErrorModel | null;
  } | null;

  /**
   * 주체 목록 — 부부·연인이 한 장부를 나눠 볼 때. **걸러지지 않은** 기록에서 뽑는다.
   * 🔴 `공동` 은 언제나 마지막이고, 하나의 선택지다(겹치지 않게 나눈다 — `ledgerPayerScope.ts`).
   */
  payers: readonly string[];
  payerScope: LedgerPayerScope;
  /** 🔴 둘 이상일 때만 컨트롤을 그린다 — 선택지 하나인 필터는 화면의 거짓말이다. */
  offerPayerScope: boolean;

  state: LedgerConnectionState;
  phase: LedgerPhase;
  /** `checking` 이 300ms 를 넘겼는가. 넘기기 전에는 스켈레톤을 그리지 않는다(깜빡임 방지). */
  showCheckingSkeleton: boolean;
  /** 새 탭으로 열 시트 주소. 연결 전에는 `null`. */
  sheetUrl: string | null;
  sheetName: string | null;
  /**
   * B-1 탭 선택. `null` 이면 고를 자리가 없다(연결 전 · 연결 정보를 아직 못 받았다).
   * 🔴 탭 제목은 여기까지만 온다 — 저장·GA·에러 문구로 흘리지 않는다.
   */
  tabPicker: LedgerTabPickerModel | null;

  monthLabel: string;
  prevMonthLabel: string;
  nextMonthLabel: string;
  thisMonthLabel: string;
  isCurrentMonth: boolean;
  /** §4.4 — 기록이 있는 가장 최근 달. 없으면 `null`(그 문장을 만들 수 없다). */
  latestMonthLabel: string | null;

  /**
   * B-2 신선도 — 목록 카드 헤더의 "언제 기준 · 새로고침". 🔴 연결 전에도 값은 있고(전부 비어 있고)
   * 그리는 자리가 `connected` 안이라 화면에는 나오지 않는다.
   */
  freshness: LedgerFreshnessModel;

  /**
   * B-4 배당 겹쳐 보기 — 🔴 **요약 3숫자와 완전히 분리된 값**이다. `summary` 를 만드는 코드는 이
   * 필드를 읽지 않고, 이 필드를 만드는 코드는 `summary` 에 아무것도 더하지 않는다(가계부 총합의
   * 정의는 하나다). 토글이 꺼져 있어도 모델은 있고 `body` 만 `null` 이다.
   */
  dividend: LedgerDividendModel;

  /**
   * P4·P5 **이 달 살펴보기**. 🔴 `summary` 와 다른 질문에 답한다 — 요약은 "얼마인가",
   * 이쪽은 "어디에 몰렸는가"다. 여기 숫자는 요약에 **한 번도 더해지지 않는다**.
   */
  analysis: LedgerAnalysisModel;

  /**
   * 고정비 이어가기. `null` 이면 이어갈 것이 없어 자리를 만들지 않는다
   * (버튼만 남고 눌러도 아무 일 없는 컨트롤을 두지 않는다).
   */
  carryOver: LedgerCarryOverModel | null;


  summary: LedgerMonthSummary;
  rows: readonly LedgerRowModel[];
  /** 목록을 다시 읽는 중. 🔴 기존 목록을 지우지 않고 `aria-busy` 만 켠다. */
  isRefetching: boolean;
  /** 첫 로드 — 목록 자리에 스켈레톤. */
  isFirstLoad: boolean;

  /** 🔴 만료돼도 목록·요약은 마지막으로 읽은 그대로 남는다. */
  isExpired: boolean;
  isReconnecting: boolean;
  isConflict: boolean;
  /** 권한 거부 직후 §4.1 로 복귀하며 얹히는 배너. */
  isDenied: boolean;
  /** `window.open` 이 `null` 을 돌려준 경우(예외가 아니다 — pitfalls 2026-07-29). */
  isPopupBlocked: boolean;
  /** 세션 1회 — 새 시트를 방금 만들었을 때만. */
  showCreatedNotice: boolean;
  /** 연결·조회 단계의 실패(§4.2④·§4.11④). */
  connectError: LedgerErrorModel | null;

  /** 매핑 단계 모델. `state === 'mapping'` 일 때만 값이 있다. */
  mapping: LedgerMappingModel | null;

  partialFailure: LedgerPartialFailureModel | null;

  /** 폼 모달. `null` 이면 닫혀 있다. */
  form: LedgerFormModel | null;

  /** 삭제 확인. `null` 이면 닫혀 있다. 🔴 폼과 동시에 열리지 않는다(중첩 오버레이 0). */
  removeTarget: LedgerRemoveTarget | null;
  isRemoving: boolean;
  removeError: LedgerErrorModel | null;

  /** 라이브 리전 문구(화면당 1개). */
  liveMessage: string;
};

export type LedgerViewProps = {
  viewModel: LedgerViewModel;
  /** 페이지 전체를 도는 재시도 카운트다운(🔴 타이머 1개). 행 id → 남은 초. */
  retryCountdowns: ReadonlyMap<string, number>;
  /**
   * 삭제 성공 뒤 포커스를 옮길 행 id. `null` 이면 목록 카드 제목으로 보낸다.
   * 뷰가 가진 유일한 명령형 로직이다(DOM 참조가 필요해 여기 말고는 둘 곳이 없다).
   */
  focusAfterRemoveId: string | null;
  onFocusAfterRemoveHandled: () => void;

  /** 앱 로그인 시작(구글·네이버·카카오). 🔴 구글 시트 동의와 다른 층이다. */
  onSignIn: (provider: CommunityOAuthProvider) => void;

  onPickExistingSheet: () => void;
  onCreateSheet: () => void;
  onMappingChange: (field: LedgerFieldId, letter: string | null) => void;
  onConfirmMapping: () => void;
  /** 같은 파일의 다른 탭으로. 🔴 막혀 있을 때는 컨트롤이 비활성이라 호출되지 않는다. */
  onSelectTab: (sheetId: number) => void;

  /** 화면 탭 전환. 🔴 `onSelectTab`(워크시트 전환)과 다른 축이다 — 저장 대기열에 영향이 없다. */
  onSelectViewTab: (id: LedgerViewTabId) => void;
  /** 주체 범위. `null` = 전체. */
  onSelectPayerScope: (scope: LedgerPayerScope) => void;
  /** 옆탭 다시 읽기. 🔴 자동 갱신 대신 **사용자가 정하는** 갱신이다(할당량을 아낀다). */
  onRetrySideTab: () => void;
  /** 지금 보고 있는 옆탭에 한 줄 적기. */
  onAddSideEntry: () => void;
  onSideFormChange: (patch: Readonly<Record<string, string>>) => void;
  onSideFormSubmit: () => void;
  onSideFormClose: () => void;

  /** B-4 배당 겹쳐 보기 토글. 🔴 시트에 아무것도 쓰지 않는다 — 화면 상태와 로컬 취향뿐이다. */
  onToggleDividendOverlay: (isOn: boolean) => void;

  onPrevMonth: () => void;
  onNextMonth: () => void;
  onThisMonth: () => void;
  onGoLatestMonth: () => void;

  onOpenCreateForm: () => void;
  onOpenEditForm: (id: string) => void;
  onFormChange: (patch: Partial<LedgerDraftForm>) => void;
  onSubmitForm: () => void;
  onCloseForm: () => void;

  onRequestRemove: (id: string) => void;
  onConfirmRemove: () => void;
  onCloseRemove: () => void;

  onRetryRow: (id: string) => void;
  onRetryAll: () => void;

  /** 🔴 두 단계다 — 열기는 목록만 보이고, 확인이 실제로 시트에 쓴다. */
  onOpenCarryOver: () => void;
  onConfirmCarryOver: () => void;
  onCloseCarryOver: () => void;
  onReconnect: () => void;
  onRefresh: () => void;
  onOpenSheet: () => void;
  onDismissCreatedNotice: () => void;
};

export type LedgerPageProps = {
  /** '오늘' 주입(테스트 전용). 미지정이면 컨테이너가 마운트 시점의 시각을 고정해 쓴다. */
  now?: Date;
};
