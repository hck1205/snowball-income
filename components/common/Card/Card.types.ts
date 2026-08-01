import type { ReactNode } from 'react';

/**
 * 카드의 격 — **위계 축은 이 prop 하나다**(`shared/styles` 의 `cardElevation` 이 3단을 소유).
 *
 * - `raised`  — **주역 카드**. 그 화면을 켠 이유(결과 요약). 테두리 없이 그림자로 뜬다.
 *   🔴 **화면당 하나**. 둘이 되면 어느 쪽도 주역이 아니다(hero 타일 규칙과 같은 논리).
 * - `default` — **본문 카드**. 차트·표·구성처럼 주역을 뒷받침하는 면. 테두리만, 그림자 없음.
 * - `sunken`  — **부속 카드**. "다른 가정"을 말하는 곁가지(예: 전량 매도 시 세금)라
 *   한 단계 가라앉힌다(`radius.md` · `surfaceSunken`). 같은 위계로 보이면 사용자가
 *   부가 가정을 본문 결과로 읽는다.
 * - `wash`    — **장식 표면**. 파스텔 그라디언트 배경(면색만 `default` 와 다르다).
 *   ⚠ **콘텐츠 카드에 쓰지 마라**(디자인 결정 트랙 ③). 빈 상태·프로모·CTA 처럼
 *   "여기서 시작하세요"를 말하는 면에만 쓴다. 데이터가 든 카드에 깔면 숫자가 배경과 경쟁한다.
 *
 * 구 `elevation` prop(1|2|3)은 **삭제됐다** — 호출부가 한 곳도 없었고, 카드가 테두리와 그림자를
 * 동시에 갖는 한 그 숫자는 화면에서 아무것도 바꾸지 못했다(위계는 tone 이 만든다).
 */
export type CardTone = 'default' | 'raised' | 'sunken' | 'wash';

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
  /** 기본 `'default'`(본문 카드). 위 `CardTone` 주석의 3단 위계를 따른다. */
  tone?: CardTone;
  /**
   * 가이드 투어가 이 카드를 가리킬 수 있게 하는 표식(`data-tour`).
   * 카드 루트가 곧 하이라이트 대상이라, 래퍼 div를 덧대면 레이아웃 간격이 흔들린다 → 속성만 통과시킨다.
   */
  dataTour?: string;
  children: ReactNode;
};
