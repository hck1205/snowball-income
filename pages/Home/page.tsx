import { css, Global } from '@emotion/react';
import YieldArchitectFeature from '@/features/YieldArchitect';

const globalStyle = css`
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
`;

export default function HomePage() {
  return (
    <>
      <Global styles={globalStyle} />
      <YieldArchitectFeature />
    </>
  );
}
