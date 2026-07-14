import { css } from '@emotion/react';
import { DARK_THEME, LIGHT_THEME, toCssVars } from './semantic';
import { font, motion } from './tokens';

/**
 * 라이트가 기본. 다크는 `prefers-color-scheme`로 자동 적용된다.
 *
 * 변수 값은 여기에 하드코딩하지 않고 `semantic.ts`의 테마 맵에서 생성한다.
 * → 토큰의 진실 공급원이 하나뿐이라, 대비 검증 스크립트가 실제로 화면에 쓰이는 값을 검사한다.
 *
 * `:root:not([data-theme='light'])` 로 감싼 이유:
 *  - PNG 캡처(html2canvas)는 흰 배경으로 고정되어 있다(capture/tiling.ts, cloneTransform.ts).
 *    클론 문서에 `data-theme="light"`를 박아 캡처 결과가 항상 라이트로 나오게 하려면 탈출구가 필요하다.
 */
export const globalStyles = css`
  :root {
    ${toCssVars(LIGHT_THEME)};

    font-family: ${font.sans};
    color-scheme: light;
    background: var(--sb-bg);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      ${toCssVars(DARK_THEME)};
      color-scheme: dark;
    }
  }

  /* 수동 토글 대비 (이번 범위에서는 토글 UI 없음) */
  :root[data-theme='dark'] {
    ${toCssVars(DARK_THEME)};
    color-scheme: dark;
  }

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
    background: var(--sb-bg);
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
    }
  }
`;
