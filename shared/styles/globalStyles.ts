import { css } from '@emotion/react';
import { font, motion } from './tokens';

/**
 * 라이트가 기본. 다크는 `prefers-color-scheme`로 자동 적용된다.
 *
 * `:root:not([data-theme='light'])` 로 감싼 이유:
 *  - PNG 캡처(html2canvas)는 흰 배경으로 고정되어 있다(capture/tiling.ts, cloneTransform.ts).
 *    클론 문서에 `data-theme="light"`를 박아 캡처 결과가 항상 라이트로 나오게 하려면 탈출구가 필요하다.
 *  - `[data-theme='dark']` 블록은 향후 수동 토글을 위해 미리 열어둔다(이번 범위에서는 UI 없음).
 */
const LIGHT_TOKENS = css`
  --sb-bg: #f2f5f8;
  --sb-surface: #ffffff;
  --sb-surface-muted: #f7f9fb;
  --sb-surface-sunken: #eef2f6;
  --sb-surface-hover: #f0f4f8;

  --sb-border: #e2e8ee;
  --sb-border-strong: #c9d4de;

  --sb-text: #14212e;
  --sb-text-secondary: #4a5b6b;
  --sb-text-muted: #64748b;

  --sb-brand: #2f6f93;
  --sb-brand-hover: #255a79;
  --sb-brand-subtle: #eaf3f9;
  --sb-brand-subtle-hover: #dceaf4;
  --sb-brand-border: #a9cade;
  --sb-brand-text: #1d5677;
  --sb-on-brand: #ffffff;

  --sb-success: #0f7a52;
  --sb-warning: #b45309;
  --sb-danger: #b42318;
  --sb-danger-surface: #fef3f2;
  --sb-danger-border: #f3c3bd;

  --sb-overlay: rgba(16, 29, 41, 0.45);
  --sb-focus-ring: #1f7ab1;
  --sb-focus-shadow: rgba(31, 122, 177, 0.26);

  --sb-shadow-1: 0 1px 2px rgba(15, 25, 35, 0.04), 0 1px 3px rgba(15, 25, 35, 0.06);
  --sb-shadow-2: 0 2px 4px rgba(15, 25, 35, 0.04), 0 4px 12px rgba(15, 25, 35, 0.08);
  --sb-shadow-3: 0 2px 6px rgba(15, 25, 35, 0.06), 0 12px 32px rgba(15, 25, 35, 0.14);

  /* ECharts가 읽어가는 차트 크롬 색 (chartTheme.ts) */
  --sb-chart-axis-line: #d8e0e8;
  --sb-chart-split-line: #eef2f6;
  --sb-chart-label: #4a5b6b;
  --sb-chart-slice-border: #ffffff;

  /* input[type=date] 피커 아이콘 */
  --sb-picker-filter: none;
`;

const DARK_TOKENS = css`
  --sb-bg: #0f151c;
  --sb-surface: #161d26;
  --sb-surface-muted: #1b232d;
  --sb-surface-sunken: #121922;
  --sb-surface-hover: #202a35;

  --sb-border: #2a3542;
  --sb-border-strong: #3a4756;

  --sb-text: #e6edf3;
  --sb-text-secondary: #a7b4c2;
  --sb-text-muted: #7e8c9b;

  --sb-brand: #2f6f93;
  --sb-brand-hover: #3a86ae;
  --sb-brand-subtle: #16303f;
  --sb-brand-subtle-hover: #1c3d50;
  --sb-brand-border: #2d5772;
  --sb-brand-text: #7cb8d9;
  --sb-on-brand: #ffffff;

  --sb-success: #3fbb8a;
  --sb-warning: #e0a052;
  --sb-danger: #f0776a;
  --sb-danger-surface: #2a1917;
  --sb-danger-border: #5b302b;

  --sb-overlay: rgba(3, 8, 13, 0.66);
  --sb-focus-ring: #5eb0e0;
  --sb-focus-shadow: rgba(94, 176, 224, 0.3);

  --sb-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24);
  --sb-shadow-2: 0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36);
  --sb-shadow-3: 0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48);

  --sb-chart-axis-line: #33404e;
  --sb-chart-split-line: #232d39;
  --sb-chart-label: #a7b4c2;
  --sb-chart-slice-border: #161d26;

  /* 다크에서 기본 피커 아이콘이 검게 묻히므로 반전 */
  --sb-picker-filter: invert(0.86);
`;

export const globalStyles = css`
  :root {
    ${LIGHT_TOKENS};

    font-family: ${font.sans};
    color-scheme: light;
    background: var(--sb-bg);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      ${DARK_TOKENS};
      color-scheme: dark;
    }
  }

  /* 향후 수동 토글 대비 (이번 범위에서는 토글 UI 없음) */
  :root[data-theme='dark'] {
    ${DARK_TOKENS};
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
