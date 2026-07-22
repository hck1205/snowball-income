/**
 * 포트폴리오 비중 조절 UI 카피.
 *
 * 두 "잠금" 개념을 명칭·안내로 확실히 가른다:
 *  - A) 전역 "비율 조절 잠금" 토글 — 모든 슬라이더를 disabled (자물쇠 메타포).
 *  - B) 종목별 "고정" 버튼 — 그 종목 비중만 고정하고 나머지를 재분배 (핀 메타포).
 * 슬라이더가 왜 비활성인지(무음 비활성 금지)는 범례 하단 단일 힌트 줄로 우선순위 안내한다.
 */
export const ALLOCATION_COPY = {
  /* ① 전역 "비율 조절 잠금" 토글 (A) */
  lockToggleLabel: '비율 조절 잠금',
  lockToggleOnText: '잠금',
  lockToggleOffText: '조절',

  /* ② 종목별 "고정" 버튼 (B) */
  fixButtonText: '고정',
  fixButtonAriaFix: (name: string) => `${name} 비중 고정`,
  fixButtonAriaUnfix: (name: string) => `${name} 비중 고정 해제`,
  fixButtonTitleFix: '비중 고정',
  fixButtonTitleUnfix: '비중 고정 해제',

  /* 비활성 사유 힌트 (우선순위로 하나만 노출) */
  hintLocked: "비중 조절이 잠겨 있어요. 위 스위치를 '조절'로 바꾸면 드래그할 수 있어요.",
  hintOneAdjustable: '다른 종목이 고정돼 조절할 여지가 없어요. 고정을 풀면 다시 드래그할 수 있어요.',
  hintSingleTicker: '종목이 하나뿐이라 비중은 100%예요.',

  /* '고정 전체 해제' 단축 액션 */
  clearAllFixedLabel: '고정 전체 해제',
  clearAllFixedAria: '모든 종목 비중 고정 해제'
} as const;
