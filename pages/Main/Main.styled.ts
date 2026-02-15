import { css } from '@emotion/react';

export const globalStyle = css`
  html {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    scrollbar-gutter: stable;
    text-rendering: optimizeLegibility;
  }

  :root {
    font-family: 'Pretendard Variable', 'Noto Sans KR', sans-serif;
    background: linear-gradient(180deg, #ecf7fb 0%, #f6fbff 100%);
    --focus-ring-color: #1f7ab1;
    --focus-ring-shadow: rgba(31, 122, 177, 0.26);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html,
  body,
  #root {
    height: 100%;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  button,
  a,
  input,
  select,
  textarea,
  [tabindex]:not([tabindex='-1']) {
    &:focus-visible {
      outline: 2px solid var(--focus-ring-color);
      outline-offset: 2px;
      box-shadow: 0 0 0 3px var(--focus-ring-shadow);
    }
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
`;
