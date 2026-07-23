import styled from '@emotion/styled';
import { color, headerGlassSurface, media, space, zIndex } from '@/shared/styles';

export const ShellRoot = styled.div`
  /*
   * 앱 헤더 높이를 CSS 변수로 확정한다. 스크롤 시 붙는 목차 바(TickerDetailPage 의 TocAside)가
   * 이 변수를 sticky top 으로 그대로 써서, 헤더와 목차 사이에 빈 띠가 생기던 문제를 없앤다.
   * (티커 헤더는 PrimaryNav 한 줄이라 시뮬레이터의 2줄 헤더보다 짧다 — 그래서 57/84px 하드코딩이 안 맞았다.)
   */
  --tk-header-h: 56px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  color: ${color.text};

  ${media.down('mobileWide')} {
    --tk-header-h: 48px;
  }
`;

/**
 * 전역 헤더와 동일한 전폭 sticky 글래스 바(SimulatorHeader.styled HeaderRoot 와 같은 형태) —
 * 로고·워드마크·주요 nav 를 시뮬레이터/커뮤니티 헤더와 픽셀 단위로 일치시킨다.
 *
 * 높이를 `--tk-header-h` 로 **확정**한다(box-sizing: border-box 라 border 포함). 목차 바가 이 값에
 * 정확히 맞물리게 하기 위함 — 자연 높이에 맡기면 목차 바의 하드코딩 top 과 어긋나 갭이 생긴다.
 */
export const ShellHeader = styled.header`
  position: sticky;
  top: 0;
  height: var(--tk-header-h);
  box-sizing: border-box;
  z-index: ${zIndex.headerSurface};
  ${headerGlassSurface}
  border-bottom: 1px solid ${color.borderStrong};
`;

export const ShellHeaderInner = styled.div`
  /* 확정된 헤더 높이 안에서 한 줄 PrimaryNav 를 세로 가운데 정렬(세로 패딩 대신 height+center 로 높이를 소유). */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(12px, 2vw, 20px);

  ${media.down('mobileWide')} {
    padding: 0 ${space[3]};
  }
`;

export const ShellMain = styled.main`
  flex: 1 1 auto;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(20px, 4vw, 48px) clamp(16px, 4vw, 40px) 64px;
`;
