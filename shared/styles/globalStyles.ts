import { css } from '@emotion/react';
import { DEFAULT_THEME_PRESET, PALETTE_PRESET_IDS, THEME_PRESETS } from './presets';
import { toCssVars } from './semantic';
import { font, motion } from './tokens';

/**
 * 라이트가 기본. 다크는 `prefers-color-scheme`로 자동 적용된다.
 *
 * 변수 값은 여기에 하드코딩하지 않고 `presets.ts`의 레지스트리에서 생성한다.
 * → 토큰의 진실 공급원이 하나뿐이라, 대비 검증 테스트가 실제로 화면에 쓰이는 값을 검사한다.
 *
 * 팔레트 프리셋: `html[data-palette='<id>']`가 프리셋을 정한다. **속성이 없으면 기본
 * 프리셋(velog)** — no-JS 폴백. 프리셋 전환 = `dataset.palette` 변경 한 번(jotai
 * `useApplyPalettePreset` 배선), 리렌더 없이 CSS 변수만 갈린다(캔버스 차트만 리빌드 필요 —
 * chartTheme.ts 참고).
 *
 * 다크 블록은 `:root:not([data-theme='light'])`로 감싼다 — `data-theme="light"`를 박으면 OS가
 * 다크여도 현재 프리셋의 라이트로 강제할 수 있는 탈출구다. **헤더의 밝기 토글이 이 탈출구를 쓴다**
 * (`components/ColorSchemeToggle` → `colorSchemeAtom` → `html[data-theme]`, 2026-08-01).
 * 선호가 `system`이면 어트리뷰트가 **없고**, 그때만 위 `prefers-color-scheme` 블록이 산다.
 */

/**
 * 프리셋별 변수 스코프 3블록(라이트 / OS 다크 / 강제 다크).
 * 기본 프리셋(velog)도 명시 블록을 둔다 — `data-palette='velog'`가 유효한 상태값이 되도록.
 * 다크 블록(:root[data-palette][…] = 0,3,0)이 라이트 블록(0,2,0)보다 우선해 안전하다.
 */
const paletteScopes = PALETTE_PRESET_IDS.map((id) => {
  const preset = THEME_PRESETS[id];

  return `
  :root[data-palette='${id}'] {
    ${toCssVars(preset.light)};
    color-scheme: light;
  }

  @media (prefers-color-scheme: dark) {
    :root[data-palette='${id}']:not([data-theme='light']) {
      ${toCssVars(preset.dark)};
      color-scheme: dark;
    }
  }

  :root[data-palette='${id}'][data-theme='dark'] {
    ${toCssVars(preset.dark)};
    color-scheme: dark;
  }
`;
}).join('\n');

export const globalStyles = css`
  :root {
    ${toCssVars(DEFAULT_THEME_PRESET.light)};

    font-family: ${font.sans};
    color-scheme: light;
    background: var(--sb-bg);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      ${toCssVars(DEFAULT_THEME_PRESET.dark)};
      color-scheme: dark;
    }
  }

  /* 수동 토글(헤더 밝기 버튼)이 박는 다크 — OS 설정보다 우선한다 */
  :root[data-theme='dark'] {
    ${toCssVars(DEFAULT_THEME_PRESET.dark)};
    color-scheme: dark;
  }

  /* 팔레트 프리셋 스코프 — html[data-palette]가 위 기본(velog)을 덮는다 */
  ${paletteScopes}

  html {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    scrollbar-gutter: stable;
    text-rendering: optimizeLegibility;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    /*
     * 페이지 상단 오로라 글로우. 글로우 문자열의 마지막 레이어가 bg 단색이라 폴백 안전.
     * background-color는 이중 안전망. 스크롤하면 글로우도 함께 올라간다 —
     * background-attachment: fixed 는 모바일 성능 문제로 금지.
     */
    background: var(--sb-bg-glow) no-repeat;
    background-color: var(--sb-bg);
    color: var(--sb-text);
    font-family: ${font.sans};
    line-height: ${font.leading.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html,
  body {
    height: 100%;
    width: 100%;
    max-width: 100%;
  }

  /*
   * ⚠ height 가 아니라 **min-height** 여야 한다. (이 파일은 css 템플릿 리터럴이라 주석에 백틱 금지)
   * position: sticky 는 **부모 박스 안에서만** 달라붙는다. #root 를 뷰포트 높이로 고정하면
   * 그 박스는 100vh 에서 끝나므로, 스크롤이 그 지점을 넘는 순간 sticky 헤더가 부모와 함께
   * 밀려 올라가 화면에서 사라진다(= 모바일에서 헤더 안 "설정 열기" 진입 불가).
   * min-height 면 #root 가 콘텐츠만큼 자라 sticky 범위가 문서 전체가 된다.
   */
  #root {
    min-height: 100%;
    width: 100%;
    max-width: 100%;
  }

  /* 폼 컨트롤이 OS 기본 폰트로 떨어지는 것 방지 */
  button,
  input,
  select,
  textarea {
    font-family: inherit;
  }

  /*
   * 헤딩은 display 서체(원본은 Gmarket Sans / CSS family는 'Snowball Display').
   * **여기 한 곳에서만** 건다 — 페이지별 styled 파일이 각자
   * font-family를 박기 시작하면 역할이 흩어져 서체 교체가 불가능해진다.
   * 굵기는 각 헤딩의 styled가 그대로 정한다(display 페이스가 한 벌이라 굵기 차이는 안 보인다 —
   * tokens.ts의 font.display 주석 참고. 위계는 크기로 만든다).
   */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: ${font.display};

    /*
     * 줄바꿈도 여기서 한 번에 건다(2026-07-30 신설 — 종전 레포 전체에 'text-wrap' 0건).
     *
     * ⚠ 'keep-all' 과 'balance' 는 **한 짝이다. 따로 쓰면 한국어가 나빠진다.**
     * 'balance' 는 줄들을 고르게 만들려고 **줄 중앙 쪽**에서 끊을 자리를 찾는데, 한글은 음절마다
     * 끊을 수 있어서 그 중앙이 어절 한가운데 떨어지기 쉽다("시뮬레이" / "터"). greedy 줄바꿈은
     * 오른쪽 끝에서만 잘못 끊기지만 balance 는 **어디서든** 그럴 수 있다.
     * 'keep-all' 로 끊을 자리를 공백으로 제한하면 그제서야 balance 가 이득이 된다.
     *
     * 'anywhere' 는 마지막 방어선이다 — 공백 없는 긴 토큰(티커·URL)이 컨테이너를 뚫는 걸 막는다.
     *
     * 이 짝은 'Card'·'PageHero' 가 이미 각자 쓰고 있었다. 검증된 패턴을 전역으로 올린 것이다.
     */
    word-break: keep-all;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  /*
   * 본문은 'pretty' — 마지막 줄에 낱말 하나만 남는 것(외톨이)을 막는다.
   *
   * ⚠ 여기엔 'keep-all' 을 걸지 않는다. 한국어 **산문**은 음절 단위 줄바꿈이 관례이고,
   * 본문에 keep-all 을 걸면 오른쪽 끝이 심하게 들쭉날쭉해지며 좁은 카드에서 가로 넘침이 생긴다.
   * 헤딩과 본문은 이 점에서 규칙이 다르다.
   *
   * 요소 선택자(0,0,1)라 Emotion 클래스(0,1,0)에 항상 진다 — 기존 컴포넌트 선언을 건드리지 않는다.
   */
  p,
  li,
  dd,
  figcaption,
  caption,
  summary,
  small,
  blockquote {
    text-wrap: pretty;
  }

  /*
   * 금액·퍼센트는 자릿수 정렬(tabular-nums)이 되어야 표에서 눈이 흐르지 않는다.
   * 숫자를 다루는 컨트롤과 표 셀에 일괄 적용 — 서체도 dataNumeric(Inter)으로 함께 건다.
   * Inter에는 한글이 없으므로 같은 셀 안의 한글 라벨은 자동으로 본문 서체가 받는다(스택 순서).
   */
  input[type='number'],
  input[inputmode='decimal'],
  table,
  th,
  td {
    font-family: ${font.dataNumeric};
    ${font.numeric};
  }

  button,
  a,
  input,
  select,
  textarea,
  [tabindex]:not([tabindex='-1']) {
    &:focus-visible {
      outline: 2px solid var(--sb-focus-ring);
      outline-offset: 2px;
      box-shadow: 0 0 0 3px var(--sb-focus-shadow);
    }
  }

  ::placeholder {
    color: var(--sb-text-muted);
    opacity: 1;
  }

  ::selection {
    background: var(--sb-brand-subtle-hover);
    color: var(--sb-text);
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    :root {
      --sb-motion-fast: ${motion.fast};
      --sb-motion-base: ${motion.base};
      --sb-motion-slow: ${motion.slow};
    }
  }
`;
