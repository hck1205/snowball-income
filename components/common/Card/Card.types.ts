import type { ReactNode } from 'react';

/** 1 = 기본 카드. 2 = 떠 있는 것(드롭다운/팝오버). 3 = 모달. */
export type CardElevation = 1 | 2 | 3;

/**
 * 기존 props(title / titleRight / titleRightInline / children)는 그대로다 — 호출부가 많다.
 * 새 슬롯은 전부 optional로만 추가했다.
 */
export type CardProps = {
  title?: string;
  /** 헤더 우측 슬롯(토글·버튼 등). */
  titleRight?: ReactNode;
  /** 제목 바로 옆에 붙인다(우측 끝 정렬 대신). */
  titleRightInline?: boolean;
  /** 제목 아래 보조 설명 한 줄. */
  subtitle?: ReactNode;
  elevation?: CardElevation;
  /**
   * 가이드 투어가 이 카드를 가리킬 수 있게 하는 표식(`data-tour`).
   * 카드 루트가 곧 하이라이트 대상이라, 래퍼 div를 덧대면 레이아웃 간격이 흔들린다 → 속성만 통과시킨다.
   */
  dataTour?: string;
  children: ReactNode;
};
