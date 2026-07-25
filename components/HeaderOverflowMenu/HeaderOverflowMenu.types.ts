/**
 * Chrome/Edge가 "설치 가능" 시점에 던지는 `beforeinstallprompt` 이벤트.
 * 표준 lib.dom 에 없어 여기서 형태만 선언한다(우리가 쓰는 필드만).
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type InstallPlatform = 'ios' | 'android' | 'desktop';

/** PDF 리포트 저장 항목의 상태·동작. 시뮬레이터(pages/Main)만 주입한다. */
export type HeaderOverflowMenuPdfReport = {
  /**
   * 리포트를 만들고 저장한다. **성공하면 true**를 돌려준다(메뉴를 닫고 트리거로 포커스를 되돌리는 신호).
   * 실패는 예외가 아니라 false + `hasFailed`로 표현한다 — 메뉴를 유지한 채 인라인 알림을 띄우기 위함이다.
   */
  onDownload: () => Promise<boolean>;
  /** 생성 중 — 항목을 비활성화하되 **메뉴는 닫지 않는다**. */
  isGenerating: boolean;
  /**
   * 직전 시도 실패(없으면 null) — 인라인 `role="alert"` 알림을 편다.
   *
   * 메뉴는 **사유 어휘를 모른다**: 완성된 문구와 "재시도가 의미 있나"만 받는다. 그래야 커뮤니티와
   * 공유하는 이 컴포넌트가 시뮬레이터의 실패 분류에 결합되지 않는다. `canRetry=false`면
   * [다시 시도] 버튼을 아예 렌더하지 않는다 — 눌러도 같은 결과인 실패에 재시도를 권하지 않기 위해서다.
   */
  failure: { message: string; canRetry: boolean } | null;
  /** 비활성 사유(없으면 null). 사유가 있으면 항목은 disabled + 캡션이 붙는다. */
  blockedReason: string | null;
};

export type HeaderOverflowMenuProps = {
  /**
   * 튜토리얼(코치마크 투어) 항목을 메뉴에 넣을지. 기본 true.
   * false면 튜토리얼 메뉴 항목·첫 방문 유도 점·투어 트리거를 전부 스킵한다 — 코치마크 투어가 없는
   * 표면(커뮤니티 헤더 등)에서 "앱 설치 + 테마"만 담기 위함. 시뮬레이터 헤더는 기본(true)이라 불변.
   */
  showTutorial?: boolean;
  /**
   * "PDF 리포트 저장" 항목을 넣을지. **기본 false** — 커뮤니티 헤더는 무변경이다.
   * 이 메뉴는 커뮤니티와 공유되므로 시뮬레이터 데이터에 결합시키지 않는다: 메뉴는 트리거와 상태 표현만
   * 하고, 실제 생성은 `pages/Main`이 `pdfReport` 콜백으로 주입한다.
   */
  showPdfReport?: boolean;
  pdfReport?: HeaderOverflowMenuPdfReport;
};
