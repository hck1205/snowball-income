/**
 * 그라데이션 조립 — 스칼라 stop이 진실 공급원.
 *
 * 각 프리셋 파일이 자신의 hex stop을 이 빌더들에 넘겨 CSS 그라데이션 문자열을 조립한다.
 * stop 자체(`ribbon-stop-1` 등)도 별도 토큰으로 노출되므로, 대비 검증(`contrast.test.ts`)이
 * 조립된 문자열이 아니라 스칼라 hex를 직접 읽을 수 있다.
 */

export type GradientStops = readonly [string, string, string];

/** 표시용 시그니처 리본 — hero 액센트 바, 진행률 채움, 탭 인디케이터, BrandMark. 서피스 대비 3:1 기준. */
export const buildAuroraGradient = ([stop1, stop2, stop3]: GradientStops): string =>
  `linear-gradient(135deg, ${stop1} 0%, ${stop2} 52%, ${stop3} 100%)`;

/** CTA 리본 — primary 버튼 채움. 모든 stop이 흰 라벨 ≥ 4.5:1 기준. */
export const buildCtaGradient = ([stop1, stop2, stop3]: GradientStops): string =>
  `linear-gradient(135deg, ${stop1} 0%, ${stop2} 55%, ${stop3} 100%)`;

/** duotone — velog·navy-gold처럼 그라데이션이 "거의 안 보이는" 프리셋의 시그니처. */
export const buildDuotoneGradient = (from: string, to: string): string =>
  `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;

/**
 * 워드마크 텍스트 그라데이션 — `background-clip: text` 전용. 글자가 가로로 흐르므로 각도를 눕힌다.
 *
 * 라이트 헤더 표면(brand-subtle) 위 실측은 stop-1 2.28~2.61 / stop-2 1.56~1.79 로 얇다.
 * WCAG 2.1 SC 1.4.3은 로고·브랜드명 텍스트를 명시적으로 면제하므로 **실패가 아니지만**,
 * 소비 컴포넌트에서 더 옅어 보이면 **hex를 바꾸지 말고** 끝 stop 위치를 100% 밖(예: 135%)으로
 * 밀어 렌더되는 최연색만 제한하라(선언 hex 불변 → 회귀 플로어 테스트도 그대로 통과한다).
 */
export const buildWordmarkGradient = (from: string, to: string): string =>
  `linear-gradient(100deg, ${from} 0%, ${to} 100%)`;

/**
 * 파스텔 히어로 면 — PageHero 배경·EmptyState 카드·프로모/CTA 카드 **전용**. 콘텐츠 카드 금지.
 *
 * `gradient-cta`(버튼 채움) ↔ `gradient-aurora`(리본·장식) 교차 금지 규칙은 그대로이고,
 * 이 계열은 **면 배경 전용의 세 번째 계열**이다 — 버튼·리본에 쓰면 안 된다.
 * stop은 임의의 파스텔이 아니라 각 프리셋의 surface(라이트)·bg(다크)에
 * 쿨 캐스트(blue 205° / teal-green 158°)를 섞어 파생한 값이다.
 */
export const buildHeroGradient = (from: string, to: string): string =>
  `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
