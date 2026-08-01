import { color } from './tokens';

/**
 * ── 페이지 정체성 hue(`--sb-page-hue`)의 **CSS 계약** ────────────────────────────
 *
 * 왜 있는가: 시뮬레이터·내 포트폴리오·배당 캘린더의 히어로가 **같은 그라디언트·같은 테두리**라
 * 탭을 옮겨도 화면이 바뀐 느낌이 없었다(제목을 읽어야 어디인지 안다). 페이지마다 "얼굴색"을 하나
 * 배정하고, 히어로와 상단 내비가 **같은 변수**를 읽게 해 두 곳이 항상 같은 말을 하게 만든다.
 *
 * **이 파일은 값(토큰)과 이름만 정한다.** 어느 라우트가 어느 hue인지, 그리고 그것을 언제 DOM에
 * 발행하는지는 **`@/shared/hooks` 의 `usePageHue` 한 곳**이 소유한다 — 변수의 발행처가 둘이면
 * 히어로와 내비가 서로 다른 색을 말하는 순간이 생긴다.
 *
 * 🔴 **변수에는 hex 가 아니라 `var(--sb-*)` 참조를 넣는다.** 해석된 hex 를 넣으면 팔레트·라이트/다크
 * 전환 때 그 값이 그대로 굳어 버린다(커스텀 프로퍼티는 치환이 재귀적이라 참조로 넣으면 자동 추종한다).
 *
 * 🔴 **파생 면(`pageHueMix`) 위에 텍스트를 얹지 마라.** `color-mix` 결과는 대비 테스트
 * (`shared/styles/contrast.test.ts`)가 볼 수 없는 값이 된다 — 텍스트는 검증된 토큰 면 위에만 올린다.
 * 이 유틸의 정당한 소비처는 리본·배지 채움·경계 같은 **비텍스트 장식**뿐이다.
 */
export const PAGE_HUE_VAR = '--sb-page-hue';

/**
 * 페이지에 배정할 수 있는 hue. **새 hue 를 만들지 마라** — 전부 기존 시맨틱 토큰이고,
 * 여기에 없는 축(노랑·골드 등)은 제품 아이덴티티에서 금지돼 있다.
 */
export type PageHueName = 'identity' | 'accent' | 'accentAlt' | 'brand';

/** hue 이름 → 실제로 발행할 CSS 값. `color.*` 이므로 프리셋·테마를 자동으로 따라간다. */
export const PAGE_HUE_TOKEN: Record<PageHueName, string> = {
  identity: color.identity,
  accent: color.accent,
  accentAlt: color.accentAlt,
  brand: color.brand
};

/**
 * 소비처가 쓰는 값. **폴백은 `brand`** — 변수가 없는 라우트(티커 랜딩처럼 자기 스킨 `--tk-*` 을
 * 가진 화면, 혹은 아직 배정 안 된 새 화면)에서는 지금까지의 색이 그대로 유지된다.
 */
export const pageHue = `var(${PAGE_HUE_VAR}, ${color.brand})`;

/**
 * hue 에서 파생한 **장식용** 면·경계. 선례는 티커 상세의 `--tk-soft`/`--tk-border`
 * (`pages/Ticker/TickerDetailPage/TickerDetailPage.styled.ts`) — 같은 비율대를 쓴다.
 *
 * @param percent hue 비율(%). 면은 10~20, 경계는 35~55 근처가 이 레포의 실측 관례다.
 * @param base    나머지를 채울 색. 기본은 표면색이고, 경계에는 `'transparent'` 를 넘겨
 *                아래 깔린 히어로 그라디언트가 비치게 한다.
 */
export const pageHueMix = (percent: number, base: string = color.surface) =>
  `color-mix(in srgb, ${pageHue} ${percent}%, ${base})`;
