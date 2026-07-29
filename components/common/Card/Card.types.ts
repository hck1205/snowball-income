import type { ReactNode } from 'react';

/** 1 = 기본 카드. 2 = 떠 있는 것(드롭다운/팝오버). 3 = 모달. */
export type CardElevation = 1 | 2 | 3;

/**
 * 카드의 격.
 *
 * - `default` — **도구 카드**. 페이지의 주 정보 표면(`radius.lg` · `surface` · 그림자).
 * - `sunken`  — **부속 카드**. "다른 가정"을 말하는 곁가지(예: 전량 매도 시 세금)라
 *   한 단계 가라앉힌다(`radius.md` · `surfaceSunken` · **그림자 없음**).
 *   같은 위계로 보이면 사용자가 부가 가정을 본문 결과로 읽는다.
 */
/**
 * `default` 일반 카드 · `sunken` 카드 안 카드(들어간 면) ·
 * `wash` **장식 표면** — 파스텔 그라디언트 배경.
 *
 * ⚠ `wash` 는 **콘텐츠 카드에 쓰지 마라**(디자인 결정 트랙 ③). 빈 상태·프로모·CTA 처럼
 * "여기서 시작하세요"를 말하는 면에만 쓴다. 데이터가 든 카드에 깔면 숫자가 배경과 경쟁한다.
 */
export type CardTone = 'default' | 'sunken' | 'wash';

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
  /** 기본 `'default'`(도구 카드). `'sunken'` 은 부속 카드 — `elevation` 은 무시된다. */
  tone?: CardTone;
  /**
   * 가이드 투어가 이 카드를 가리킬 수 있게 하는 표식(`data-tour`).
   * 카드 루트가 곧 하이라이트 대상이라, 래퍼 div를 덧대면 레이아웃 간격이 흔들린다 → 속성만 통과시킨다.
   */
  dataTour?: string;
  children: ReactNode;
};
