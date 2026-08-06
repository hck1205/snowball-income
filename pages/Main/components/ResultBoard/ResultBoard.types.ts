import type { ReactNode } from 'react';

export type ResultBoardProps = {
  /**
   * 보드 머리 — 시나리오 탭 스트립. **캡처 루트 밖**이라 결과 이미지에 들어가지 않는다
   * (이 계약은 예전에 `MainResultGrid` 가 탭 줄의 형제였을 때와 동일하다).
   */
  header?: ReactNode;
  /**
   * 머리 아래 알림 줄(공유 링크 실패 · 프리필 안내). 두 컴포넌트 모두 조건이 아니면 `null` 을
   * 반환하므로, 자리 자체를 지우는 판정은 CSS `:empty` 가 한다 — 호출부가 조건을 두 번 쓰지 않는다.
   */
  notices?: ReactNode;
  /** 보드 본문 — 결과 격자(`MainResultGrid`). */
  children: ReactNode;
};
