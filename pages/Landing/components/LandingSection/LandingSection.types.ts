import type { ReactNode } from 'react';

/**
 * 섹션 머리 배지의 톤. **검증된 토큰 쌍만** 쓴다(`*Subtle` 면 + `*Text` 글리프) —
 * `color-mix` 파생 면은 대비 테스트가 보지 못한다(decisions.md 2026-07-31).
 * `neutral` 은 색이 아니라 "그 밖의"라는 뜻이다.
 */
export type LandingSectionTone = 'identity' | 'accent' | 'accentAlt' | 'neutral';

/**
 * 이 섹션의 **무게 등급**.
 *
 * 등급이 실제로 만드는 차이는 하나뿐이다 — `chapter`(본론 두 장)만 장 머리 룰이 2px 페이지 hue 다
 * (나머지는 1px 중립 룰). 번호·배지·제목 크기·본문 크기는 전 등급이 같다.
 * **등급을 늘리거나 새 장치를 발명하지 마라**: 한 화면에 위계 장치가 셋 이상이면 그건 위계가
 * 아니라 소음이다.
 *
 * ⚠ 2026-08-03 리워크로 **룰의 자리**가 바뀌었다(제목 아래 → 장 머리 위). 장치 수는 그대로 하나다 —
 * 스파인 레이아웃에서 "제목 아래"는 왼쪽 기둥 안쪽 300px 에만 그어져 장의 시작으로 읽히지 않는다.
 */
export type LandingSectionEmphasis = 'chapter' | 'support' | 'reference';

export type LandingSectionProps = {
  /** `aria-labelledby` ↔ `h2` 를 잇는 id. 페이지가 한 곳에서 정한다. */
  id: string;
  /**
   * 차례(`ChapterIndex`)가 링크하는 **안정 앵커 id**. `<section>` 이 갖는다.
   * 🔴 `useId` 파생을 넘기지 마라 — `:r3:-concept` 같은 값이 주소창에 남고 렌더마다 달라진다.
   */
  anchorId: string;
  /** 장 번호(`01`…). 차례와 **같은 배열**에서 온다 — 두 곳이 갈라지면 목차가 거짓말을 한다. */
  ordinal: string;
  title: string;
  /** 36px 배지 안에 들어가는 lucide 글리프. `aria-hidden` 은 이 컴포넌트가 붙인다. */
  icon: ReactNode;
  tone: LandingSectionTone;
  /**
   * 🔴 **필수다 — 기본값을 두지 마라.** 기본값이 있으면 다음 사람이 등급을 정하지 않고 섹션을
   * 추가하고, 그 순간 "본론이 무엇인가"라는 판단이 코드에서 사라진다.
   */
  emphasis: LandingSectionEmphasis;
  /** 제목 아래 한두 줄. 없으면 렌더하지 않는다. 🔴 본문 열이 소유한다(기둥이 아니다 — 68ch 가 필요하다). */
  lede?: ReactNode;
  children: ReactNode;
};
