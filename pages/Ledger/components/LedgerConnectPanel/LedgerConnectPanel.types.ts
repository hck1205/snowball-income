import type { LedgerPhase } from '../../types';

export type LedgerConnectPanelProps = {
  /** 진행 중인 쪽 버튼만 `loading`, 다른 쪽은 `disabled`(두 흐름을 동시에 시작할 수 없다). */
  phase: LedgerPhase;
  /** 섹션 제목의 id — `<section aria-labelledby>` 가 가리킨다. */
  headingId: string;
  /**
   * 앱 로그인을 이미 마친 사용자인가. `true` 면 "앱 로그인과 시트 접근은 다른 층"이라는 한 줄을
   * 함께 낸다 — 🔴 "이미 구글로 로그인했는데 왜 또?"가 이 화면에서 가장 흔한 혼란 지점이다.
   * 앱 로그인 계층 자체가 없는 배포(커뮤니티 비활성)에서는 `false` 라 그 문장이 나오지 않는다
   * (없는 절차를 설명하면 그것대로 혼란이다).
   */
  isAppSignedIn: boolean;
  /**
   * 이 브라우저에 저장된 연결이 있나. `true` 면 **지난 시트로 이어서** 타일이 맨 앞에 선다.
   *
   * 🔴 없는 사람에게 그리지 않는다 — 누를 수 없는 선택지는 화면의 거짓말이다.
   */
  hasStoredLink: boolean;
  /** 지난 시트로 한 번에. 🔴 피커를 거치지 않는다. */
  onRestoreLastSheet: () => void;
  onPickExistingSheet: () => void;
  onCreateSheet: () => void;
  /** 권한 거부 후 복귀했을 때 이 버튼으로 포커스를 옮긴다(§4.9). */
  registerPickButton?: (node: HTMLButtonElement | null) => void;
};
