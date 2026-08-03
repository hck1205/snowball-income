import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 글쓰기 로딩 — **들어올 작업대의 모양**으로 자리를 잡는다.
 *
 * 그전에는 `EmptyState title="불러오는 중…"` 한 줄이 화면 전체를 대신했다. 인증 확인은 매 방문마다
 * 지나가는 상태라 사용자가 가장 자주 보는 첫 화면이 그 한 줄이었고, 로드가 끝나는 순간 레이아웃이
 * 통째로 튀었다. 지금은 커맨드 바 · 문서 시트 · 인스펙터 칼럼의 자리가 그대로 먼저 선다.
 */

const shimmer = keyframes`
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
`;

/**
 * 스켈레톤 한 조각. 중립 3색(border → surface → border)을 흐르게 해 "로딩 중"을 모션으로 말한다.
 * `prefers-reduced-motion` 에서는 흐름을 멈추고 면색만 남긴다(정보 손실 없음).
 *
 * 🔴 커뮤니티 스켈레톤 3종(목록·상세·글쓰기)이 **같은 두 stop** 을 쓴다 — 2026-08-03 흰 캔버스
 * 전환에서 함께 다시 골랐다. 블록 면 sunken(1.11) → `border`(1.49)로 올렸고, 가운데 stop 은
 * `surfaceHover` 를 버렸다(velog 라이트에서 sunken 과 같은 값이 되어 스윕이 평평해졌다).
 * 🔴 이 조각은 흰 `Sheet` 와 가라앉은 `InspectorSection` **양쪽**에 앉는다 — `border` 는 두 지면
 * 위에서 각각 1.49 / 1.34 로 남는 유일한 선택이다.
 */
export const Bar = styled.div<{ w: string; h: string }>`
  width: ${({ w }) => w};
  height: ${({ h }) => h};
  max-width: 100%;
  border-radius: ${radius.sm};
  background: linear-gradient(
    90deg,
    ${color.border} 25%,
    ${color.surface} 37%,
    ${color.border} 63%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: ${color.border};
  }
`;

export const SkeletonShell = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[4]};
`;

/** 커맨드 바 자리 — 실제 바와 같은 높이·반경·그림자 없는 중립 면. */
export const BarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[4]};
  padding: ${space[3]} clamp(${space[3]}, 2vw, ${space[5]});
  border-radius: ${radius.lg};
  background: ${color.surface};
  border: 1px solid ${color.border};
`;

export const BarActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
`;

export const Work = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: ${space[5]};

  ${media.up('layout')} {
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: clamp(${space[5]}, 2.4vw, ${space[8]});
  }
`;

export const Sheet = styled.div`
  display: grid;
  gap: ${space[5]};
  min-width: 0;
  padding: clamp(${space[4]}, 3vw, ${space[8]});
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
`;

/** 본문 에디터가 설 자리 — 실제 지면(clamp(320,44vh,560))과 같은 높이라 로드 뒤 튐이 없다. */
export const Canvas = styled.div`
  min-height: clamp(320px, 44vh, 560px);
  border-radius: ${radius.lg};
  border: 1px solid ${color.border};
`;

export const Side = styled.div`
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

export const Tile = styled.div`
  display: grid;
  gap: ${space[3]};
  padding: clamp(${space[4]}, 2vw, ${space[5]});
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
`;

/** 스크린리더용 한 줄 — 시각적으로는 스켈레톤이, 보조기기에는 이 문장이 상태를 말한다. */
export const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
  font-size: ${font.size.xs};
`;
