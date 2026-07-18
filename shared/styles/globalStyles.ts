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
 * 다크여도 현재 프리셋의 라이트로 강제할 수 있는 탈출구다(현재 소비처 없음, 향후 확장 대비 유지).
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

  /* 수동 토글 대비 (이번 범위에서는 토글 UI 없음) */
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
  body,
  #root {
    height: 100%;
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
   * 금액·퍼센트는 자릿수 정렬(tabular-nums)이 되어야 표에서 눈이 흐르지 않는다.
   * 숫자를 다루는 컨트롤과 표 셀에 일괄 적용.
   */
  input[type='number'],
  input[inputmode='decimal'],
  table,
  th,
  td {
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
