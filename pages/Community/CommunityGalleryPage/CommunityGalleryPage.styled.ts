import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

export const ControlBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  margin-bottom: ${space[4]};

  ${media.down('mobileWide')} {
    flex-wrap: wrap;
  }
`;

export const ViewToggle = styled.div`
  display: inline-flex;
  gap: ${space[1]};
  padding: 2px;
  border-radius: ${radius.md};
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
`;

export const ViewToggleButton = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 30px;
  border: 0;
  border-radius: ${radius.sm};
  background: ${({ active }) => (active ? color.brand : 'transparent')};
  color: ${({ active }) => (active ? color.onBrand : color.textSecondary)};
  cursor: pointer;

  &:hover {
    color: ${({ active }) => (active ? color.onBrand : color.text)};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const CardGrid = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
  gap: clamp(${space[3]}, 1.8vw, ${space[5]});

  > li {
    display: flex;
    min-width: 0;
  }

  > li > * {
    width: 100%;
  }
`;

export const InlineList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid ${color.border};
`;

/** 무한스크롤 센티널 + 상태 라이브 리전. */
export const Sentinel = styled.div`
  min-height: 1px;
`;

export const LoadStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  padding: ${space[5]} 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

export const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid ${color.border};
  border-top-color: ${color.brand};
  animation: community-spin 0.7s linear infinite;

  @keyframes community-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const BannerAction = styled.div`
  margin-top: ${space[3]};
`;

/**
 * 첫 로드 실패 시 에러 배너를 본문 영역 **정중앙**에 띄운다.
 * (배너의 danger 톤·role=alert·재시도는 그대로 두고, 위치만 가운데로.)
 *
 * flex로 가로(align-items)·세로(justify-content) 모두 중앙 정렬한다.
 * min-height는 헤더+컨트롤 바가 위에 있는 만큼을 빼서, 컨트롤 바 아래가 아니라
 * 뷰포트 기준 정중앙으로 보이게 한다.
 */
export const ErrorWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 220px);
  padding: ${space[6]} ${space[4]};

  > * {
    width: 100%;
    max-width: 420px;
  }
`;

export const InlineRetry = styled.button`
  border: 0;
  background: transparent;
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  text-decoration: underline;

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/* ── 스켈레톤 ─────────────────────────────────────────────────────────────── */

const shimmer = `
  background: linear-gradient(90deg, ${color.surfaceMuted} 25%, ${color.surfaceHover} 37%, ${color.surfaceMuted} 63%);
  background-size: 400% 100%;
  animation: community-shimmer 1.4s ease infinite;

  @keyframes community-shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
`;

export const SkeletonCard = styled.div`
  display: grid;
  gap: ${space[3]};
  padding: ${space[4]};
  border-radius: ${radius.lg};
  border: 1px solid ${color.border};
  background: ${color.surface};
`;

export const SkeletonLine = styled.div<{ w?: string; h?: string }>`
  width: ${({ w }) => w ?? '100%'};
  height: ${({ h }) => h ?? '14px'};
  border-radius: ${radius.xs};
  ${shimmer}
`;

export const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[3]} ${space[2]};
  border-bottom: 1px solid ${color.border};
`;
