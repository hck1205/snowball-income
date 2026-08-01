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
 * 아이덴티티(쿨 블루) — **전 프리셋 공통**. 워드마크와 같은 논리다: 프리셋은 사용자가 고르는
 * 피부고, 아이덴티티는 제품 자신이라 스킨을 따라 색이 바뀌지 않는다(ink 도 예외가 아니다 —
 * 무채 규율은 accent 축의 것이고, ink 에서도 워드마크는 이미 파랑/그린으로 남아 있다).
 *
 * 이 4토큰이 생긴 이유: 기본 프리셋(velog)에서 brand 와 accent 가 사실상 같은 초록이라
 * 화면 전체가 단색으로 읽혔고, hue 200 브랜드 애저가 나오는 곳이 워드마크 첫 단어뿐이었다.
 * **두 번째 색축을 스킨과 무관하게** 되살리는 것이 목적이다.
 *
 * 값은 전부 `palette.brand` 램프에서만 파생한다(새 hex 없음).
 * 라이트 600/50/200/700 · 다크 400/900/700/300.
 *
 * 실측(16테마 전수, 최저값과 그 테마):
 *  - identity on surface        5.49 (navy-gold/light) — 비텍스트 3:1 ✅
 *  - identity on bg             4.87 (aurora/light)    — 비텍스트 3:1 ✅
 *  - identity on identity-subtle 4.09 (전 다크 공통)     — 비텍스트 3:1 ✅
 *  - identity-text on surface   7.24 (navy-gold/light)  — 본문 4.5:1 ✅
 *  - identity-text on identity-subtle 5.97 (전 다크 공통) — 본문 4.5:1 ✅
 *  - identity-subtle ↔ surface  ΔE 6.6(라이트 흰 서피스) / 15.6(aurora/dark)
 *
 * ⚠ **identity 채움 위에 텍스트를 올리지 마라 — 아이콘·리본 같은 비텍스트 전용이다.**
 *   다크 identity(brand[400] #3ba5d3) 위의 흰 라벨은 2.79:1 로 AA 미달이고, on-brand 는
 *   프리셋마다 명/암이 갈려 대신 쓸 수도 없다. 면 위 라벨은 identity-subtle + identity-text 조합.
 * ⚠ identity-border 는 **장식 경계**다(3:1 대상 아님). 이 시스템의 모든 *-border 가 같은
 *   급이다: border 1.18~1.48 · brand-border 1.31~3.34 · accent-border 1.44~2.70 ·
 *   identity-border 1.44~2.34. 3:1 로 올리려면 brand[500] 급이 필요한데, 그러면 1px 경계가
 *   표시색(identity)만큼 진해져 액센트 계열 틴트 패널들과 무게가 어긋난다.
 */
const IDENTITY_LIGHT: ThemeTokens = {
  identity: brand[600],
  'identity-subtle': brand[50],
  'identity-border': brand[200],
  'identity-text': brand[700]
};

/**
 * 다크 identity-subtle 은 램프의 가장 어두운 쪽인 `brand[900]`(#0d3d5a)로 확정했다.
 * 더 어두운 슬롯(950 신설)이 필요 없는 이유는 두 가지 요건을 이미 만족해서다:
 *  ① 그 위의 identity-text(brand[300] #79c5e6)가 5.97:1 (요건 4.5:1)
 *  ② 다크 surface 와 ΔE 15.6(최저, aurora/dark) — 면으로 읽힌다.
 *     ink 히어로가 1px border 를 강제당한 사고(hero↔bg ΔE 2.8)와는 자릿수가 다르다.
 * 더 어둡게 내리면 ①이 올라가는 대신 ②가 붕괴한다(다크 서피스와 같은 어둠으로 수렴).
 */
const IDENTITY_DARK: ThemeTokens = {
  identity: brand[400],
  'identity-subtle': brand[900],
  'identity-border': brand[700],
  'identity-text': brand[300]
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

  ...IDENTITY_LIGHT,
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

  ...IDENTITY_DARK,
  ...WORDMARK_DARK
};
