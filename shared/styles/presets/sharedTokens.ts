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
 * 워드마크("Hungry Hippo")도 **전 프리셋 공통**이다 — 프리셋은 사용자가 고르는 피부고
 * 워드마크는 제품의 이름이라, 스킨을 따라 색이 바뀌면 안 된다. 더 실제적인 이유:
 * OG 이미지·파비콘·webmanifest는 `data-palette`를 모르는 표면이라 프리셋별로 갈리면
 * **어떤 값을 구울지 결정 불가**가 된다.
 *
 * 2색 구성: 앞 낱말("Hungry") = 브랜드 램프(아이스블루), 뒷 낱말("Hippo") = 틸→그린(액센트 축).
 * ⚠ 토큰 이름의 `snow`/`income` 은 구 제품명에서 온 **식별자**다(`gradient-wordmark-snow` 등).
 * 값과 의미는 위 2색 구성이 정본이고, 이름 정리는 CSS 변수·8프리셋·대비 테스트를 함께 옮기는
 * 별건이라 여기서 하지 않는다.
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
  /*
   * 🔴 `brand[600]` 이 아니다 — velog(기본 프리셋) 라이트의 `accent` 가 **같은 슬롯**(`brand[600]`)을
   * 뽑아 두 토큰의 ΔE 가 **0.0** 이었다. 그러면 "페이지마다 얼굴색" 설계가 기본 화면에서 통째로
   * no-op 이 되고, 랜딩이 파랑·초록 2색으로만 보인다(2026-08-01 랜딩 리워크에서 실측으로 재확인).
   *
   * `brand[700]` 은 ΔE 가 더 크지만(8.7 vs 6.1) 아래 `identity-text` 와 **같은 값이 되어**
   * 채움과 라벨이 한 값으로 붕괴한다 — 역할 분리를 하려다 다른 역할을 붙이는 셈이라 기각했다.
   */
  identity: brand[500],
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
 * 🔴 **브랜드 패널 — 금색이 합법적으로 사는 유일한 자리**(2026-08-03, D3 승인).
 *
 * ## 왜 이 4토큰이 필요한가
 * Hungry Hippo 의 브랜드 금색(#F6B34A, 코인)은 **밝은 면 위에서 쓸 수 없다.** 실측:
 * ```
 *   금색 글자 / 흰 배경        1.83:1  ❌
 *   금색 면  + 흰 글자         1.83:1  ❌
 *   금색 면  + 네이비 글자      8.86:1  ✅
 * ```
 * 즉 금색을 화면에 등장시키는 방법은 **어두운 네이비 면을 깔고 그 위에 올리는 것** 하나뿐이다.
 * 이 4토큰이 없으면 브랜드 금색은 로고 이미지 안에만 남고 앱 화면에서 완전히 사라진다.
 *
 * ## 전 프리셋 공통인 이유
 * `identity` 4토큰과 **같은 논리**다 — 프리셋은 사용자가 고르는 피부이고 이건 제품 자신이다.
 * ⚠ ink(무채) 프리셋도 예외가 아니다. 그 규율은 **accent 축**의 것이고, 워드마크·identity 가 이미
 *   같은 예외에 서 있다(위 IDENTITY 주석). 브랜드 패널은 "스킨"이 아니라 "이름표"다.
 *
 * ## 실측 (셋 다 AA 본문 4.5:1 통과)
 * ```
 *   on-panel        흰 글자   / panel   16.24:1
 *   on-panel-gold   금색      / panel    8.86:1
 *   on-panel-muted  연보라    / panel    8.20:1
 * ```
 * 라이트/다크가 **같은 값**이다 — 패널은 스스로 어두운 면이라 모드에 따라 뒤집을 것이 없다.
 * (워드마크 단색 폴백이 라이트/다크 동일 1쌍인 것과 같은 이유.)
 *
 * ## 🔴 하지 말 것
 * - **범용 `gold` 토큰을 만들지 마라.** 만드는 순간 누군가 흰 배경 위에 쓴다(1.83:1).
 *   금색은 `on-panel-gold` 라는 이름으로만 존재한다 — 이름이 사용 조건을 강제한다.
 * - **`panel` 을 데이터 표면에 깔지 마라.** 어두운 면 위 숫자는 이 앱의 나머지 표와 위계가 어긋난다.
 *   패널이 사는 곳은 브랜드 표면이다: 푸터 · 마무리 CTA · 공유/OG 카드 · 로고 락업.
 * - `warning` 에 금색을 쓰지 마라. 경고 자리는 전부 **글자가 얹히는 면**이라 즉시 깨진다.
 */
const BRAND_PANEL: ThemeTokens = {
  panel: '#1b1e3a',
  'on-panel': '#ffffff',
  'on-panel-muted': '#b7b3e6',
  'on-panel-gold': '#f6b34a'
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
  ...WORDMARK_LIGHT,
  ...BRAND_PANEL
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
  ...WORDMARK_DARK,
  /* 패널은 라이트/다크 같은 값이다 — 스스로 어두운 면이라 모드에 따라 뒤집을 것이 없다. */
  ...BRAND_PANEL
};
