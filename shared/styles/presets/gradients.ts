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

/*
 * ⛔ `buildHeroGradient` 는 **삭제됐다**(2026-08-03, 사용자 결정: "그라데이션은 고수할 필요가 없어").
 *
 * 그 빌더가 만들던 파스텔 램프(아이스블루 205° → 민트 158°)는 **옛 브랜드 잔재**였다. 근거 셋:
 *  ① 8프리셋 중 6개가 자기 hue 와 무관하게 **같은 블루→민트**를 깔고 있었다(선셋의 히어로가
 *    `#e9f3f9→#eef8f5` 하늘색이었다 — 그 프리셋에 없는 색이다). 즉 프리셋 축이 아니라 구 브랜드 축이다.
 *  ② 그 면이 라이트/다크 전체에서 **대비 최악 지점**을 만들고 있었다(velog 다크 t≈0.88 에서
 *    text-muted 4.58:1 — 16테마 32그라디언트 중 전역 최저. "knife-edge" 주석이 그 증거다).
 *  ③ 흰 캔버스로 옮기면 히어로가 유일한 채도 면이 되어 페이지가 그 한 장으로 읽힌다.
 *
 * 토큰 이름(`gradient-hero` / `gradient-hero-soft`)은 **역할 이름이라 남는다** — 이 폴더의 계약이
 * "이름은 역할, 값은 프리셋"이고(index.ts 머리말), 소비처 5곳은 한 줄도 고치지 않는다.
 * 값은 이제 **단색**이다: `gradient-hero` = surface(카드 면) · `gradient-hero-soft` = surface-muted(옅은 워시).
 * 그 계약은 `contrast.test.ts` 의 "히어로 면은 더 이상 그라데이션이 아니다" 가 잠근다 —
 * 여기에 빌더를 되살리면 그 테스트가 먼저 빨개진다.
 *
 * 남은 3계열은 **유지한다**(옛 브랜드 램프가 아니라는 근거와 함께):
 *  - `gradient-aurora`(리본·장식) : stop 이 그 프리셋 자신의 brand/accent 램프에서 나온다
 *    (velog=틸 duotone, ink=무채). 3~6px **선**이라 흰 캔버스의 면 예산을 먹지 않는다.
 *  - `gradient-cta`(버튼 채움)    : 같은 이유 + 누를 수 있는 작은 면이라 페이지 배경과 경쟁하지 않는다.
 *  - `gradient-wordmark-*`        : 제품 이름 그 자체다. WCAG 1.4.3 이 로고 텍스트를 면제하고,
 *    전 프리셋 공통이며 OG·파비콘에도 구워진다(sharedTokens.ts). **지우지 마라.**
 */
