/**
 * 전 프리셋 공통 토큰 — 워드마크 + 데이터·상태 어휘 (변경 금지).
 *
 * 모든 hex는 확정 스펙 값이다(스펙: theme-presets-spec v1.0 + theme-variation-spec v1.0 —
 * 8종 확장판 검증 로그 1,276건 전 PASS). **임의로 바꾸지 마라** — 바꾸면 contrast.test.ts가
 * 떨어지고, 통과하더라도 실측 근거가 사라진다.
 */

import { palette } from '../primitives';
import type { ThemeTokens } from '../semantic';
import { buildWordmarkGradient } from './gradients';

const { brand, auroraTeal, auroraGreen, up, down, positive, warning, danger } = palette;

/**
 * 워드마크("스노우볼 인컴")도 **전 프리셋 공통**이다 — 프리셋은 사용자가 고르는 피부고
 * 워드마크는 제품의 이름이라, 스킨을 따라 색이 바뀌면 안 된다. 더 실제적인 이유:
 * OG 이미지·파비콘·webmanifest는 `data-palette`를 모르는 표면이라 프리셋별로 갈리면
 * **어떤 값을 구울지 결정 불가**가 된다.
 *
 * 2색 구성: "스노우볼" = 브랜드 램프(아이스블루), "인컴" = 틸→그린(액센트 축).
 * 단색 폴백(`wordmark-*-solid`)은 **라이트/다크 동일 1쌍** — 다크 헤더 위에서도
 * 3.57~5.14:1로 살아 있어 테마별로 가를 이유가 없고, 표면마다 브랜드 색이 갈리지 않는다.
 * 소비처에서 `background-clip: text`를 쓸 때 폴백(@supports·forced-colors·print)을 반드시 깔 것.
 */
const WORDMARK_LIGHT: ThemeTokens = {
  'gradient-wordmark-snow': buildWordmarkGradient(brand[400], brand[300]),
  'gradient-wordmark-income': buildWordmarkGradient(auroraTeal[600], auroraGreen[600]),
  'wordmark-snow-solid': brand[400],
  'wordmark-income-solid': auroraTeal[600]
};

const WORDMARK_DARK: ThemeTokens = {
  'gradient-wordmark-snow': buildWordmarkGradient(brand[300], brand[200]),
  'gradient-wordmark-income': buildWordmarkGradient(auroraTeal[400], auroraGreen[400]),
  /* 단색 폴백은 라이트와 동일 값 — 위 주석 참조 */
  'wordmark-snow-solid': brand[400],
  'wordmark-income-solid': auroraTeal[600]
};

/**
 * up/down(상승 적색/하락 청색)·success/warning/danger는 **전 프리셋 공통 동일값**이다.
 * 숫자 옆의 색은 학습된 반사신경이라 프리셋이 바꾸면 오독을 유발한다.
 *
 * 하한 근거: 공통 `data-positive`(#d92d20)는 각 프리셋 `surface-muted` 위에서 빠듯하다 —
 * 최저는 **ink 라이트 4.50(knife-edge, AA 턱걸이)**, 나머지도 4.5x대.
 * **어느 프리셋도 surface-muted를 지금보다 어둡게 내릴 수 없고, 이 공통값도 조정 여지가 없다.**
 */
export const COMMON_LIGHT: ThemeTokens = {
  'data-positive': up.light,
  'data-positive-surface': up.soft,
  'data-negative': down.light,
  'data-negative-surface': down.soft,
  success: positive.light,
  'success-surface': positive.soft,
  warning: warning.light,
  'warning-surface': warning.soft,
  danger: danger.light,
  'danger-surface': danger.soft,
  'danger-border': danger.softBorder,

  ...WORDMARK_LIGHT
};

export const COMMON_DARK: ThemeTokens = {
  'data-positive': up.dark,
  'data-positive-surface': up.softDark,
  'data-negative': down.dark,
  'data-negative-surface': down.softDark,
  success: positive.dark,
  'success-surface': positive.softDark,
  warning: warning.dark,
  'warning-surface': warning.softDark,
  danger: danger.dark,
  'danger-surface': danger.softDark,
  'danger-border': danger.softDarkBorder,

  ...WORDMARK_DARK
};
