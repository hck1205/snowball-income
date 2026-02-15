import { css } from '@emotion/react';

export const globalStyle = css`
  :root {
    font-family: 'Pretendard Variable', 'Noto Sans KR', sans-serif;
    background: linear-gradient(180deg, #ecf7fb 0%, #f6fbff 100%);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
  }

  html,
  body,
  #root {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }
`;
