import styled from '@emotion/styled';
import {
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  colorCap,
  font,
  media,
  motion,
  radius,
  space
} from '@/shared/styles';

/* ── 스켈레톤 ─────────────────────────────────────────────────────────────────
 *
 * 🔴 스켈레톤은 **올 것의 모양**이어야 한다. 예전 것은 카드가 "회색 줄 4개", 행이 "회색 줄 2개"
 * 여서 실제로 도착하는 카드(레일 + 글리프 + 제목 + 요약 + 숫자판 + 계수 줄)와 높이도 배치도
 * 달랐다 — 데이터가 도착하는 순간 목록이 통째로 튀었다. 여기서는 같은 기하(PICK_RADIUS ·
 * PICK.pad · 6px 레일)를 그대로 쓰고, 블록의 자리도 실제 카드와 맞춘다.
 */

const shimmer = `
  position: relative;
  overflow: hidden;
  background: ${color.surfaceMuted};

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${color.surfaceHover} 50%,
      transparent 100%
    );
    animation: feed-skeleton-sweep 1.6s ${motion.ease} infinite;
  }

  @keyframes feed-skeleton-sweep {
    100% { transform: translateX(100%); }
  }

  /*
   * 스켈레톤은 정지가 정답이다(스피너와 반대) — "이 자리에 올 값이 아직 없다"는 회색 블록의
   * 모양이 통째로 말한다. 전역 리셋이 남기는 "0.01ms 1회" 잔상 대신 명시적으로 끈다.
   */
  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
      display: none;
    }
  }
`;

export const SkeletonBar = styled.span<{ $w?: string; $h?: string; $r?: string }>`
  display: block;
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '12px'};
  border-radius: ${({ $r }) => $r ?? radius.xs};
  ${shimmer}
`;

/** 실제 카드와 같은 면·반경·패딩. 다른 것은 안의 글자가 블록이라는 점뿐이다. */
export const SkeletonCard = styled.li<{ $delay: number }>`
  ${cardElevation('pick')}
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  border-radius: ${PICK_RADIUS};
  padding: ${PICK.pad};

  /* 도착 순서를 흉내내는 미세한 시차 — 격자가 한 덩어리로 깜빡이지 않는다.
     스윕은 블록의 ::after 가 그리므로 시차도 거기에 건다. */
  & *::after {
    animation-delay: ${({ $delay }) => $delay}ms;
  }
`;

/** 6px 레일 — 실제 카드의 컬러 캡 자리. 스켈레톤에서는 색이 아니라 중립 블록이다. */
export const SkeletonRail = styled.span`
  ${colorCap(PICK_RADIUS, PICK.pad)}
  display: block;
  height: ${PICK.railHeight};
  background: ${color.border};
`;

export const SkeletonGlyph = styled.span`
  display: block;
  width: ${PICK.glyphSize};
  height: ${PICK.glyphSize};
  border-radius: ${radius.md};
  ${shimmer}
`;

/** 카드 안의 숫자판 자리 — 실제 숫자판과 같은 높이(132px)를 확보해 도착 시 튀지 않게 한다. */
export const SkeletonTile = styled.span`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${space[2]};
  min-height: 108px;
  padding: ${space[3]} ${space[4]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

export const SkeletonMetaStrip = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
`;

export const SkeletonList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

export const SkeletonRow = styled.li<{ $delay: number }>`
  ${cardElevation('pick')}
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: clamp(${space[4]}, 2.4vw, ${space[7]});
  border-radius: ${PICK_RADIUS};
  padding: ${PICK.pad} clamp(${space[5]}, 2vw, ${space[6]});

  & *::after {
    animation-delay: ${({ $delay }) => $delay}ms;
  }

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SkeletonRowMain = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  min-width: 0;
`;

export const SkeletonRowRail = styled.span`
  display: grid;
  justify-items: end;
  align-content: start;
  gap: ${space[2]};
  padding-left: clamp(${space[4]}, 2vw, ${space[6]});
  border-left: 1px solid ${color.border};

  ${media.down('mobileWide')} {
    display: none;
  }
`;

/* ── 빈 상태 ───────────────────────────────────────────────────────────────── */

/**
 * 빈 목록 자리 — **가운데 정렬 스택에서 2단 조판으로** 바꿨다.
 *
 * 예전 빈 상태는 48px 회색 원 아이콘 + 가운데 정렬 문단이라 "무언가 잘못됐다"에 가깝게 읽혔다.
 * 빈 화면은 고장이 아니라 **아직 시작 전**이다. 그래서 마스코트를 96px 로 세우고(브랜드 면에서만
 * 허용), 글은 왼쪽 정렬로 읽기 흐름을 만든다. 파스텔 워시(`gradientHeroSoft`)는 8프리셋 ×
 * 라이트/다크 대비 검증을 이미 통과한 값이라 새 색을 지어내지 않는다.
 *
 * ⚠ 이 면은 `tintscan` 이 면 1개로 센다 — 머리 면(1)과 합쳐 2, 상한 안이다.
 *   빈 상태와 목록은 상호배타라 셋이 동시에 서지 않는다.
 */
export const EmptyRoot = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(${space[5]}, 3vw, ${space[10]});
  border: 1px dashed ${color.border};
  border-radius: ${PICK_RADIUS};
  padding: clamp(${space[8]}, 5vw, ${space[12]}) clamp(${space[5]}, 4vw, ${space[10]});
  background: ${color.gradientHeroSoft};

  ${media.down('tabletSm')} {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    text-align: center;
  }
`;

export const EmptyMark = styled.div`
  display: grid;
  place-items: center;
  color: ${color.identity};
`;

/** 제목·본문·행동이 한 부모 안에 선다 — 빈 상태에서 눈이 한 덩어리로 읽어야 하는 묶음이다. */
export const EmptyBody = styled.div`
  display: grid;
  gap: ${space[3]};
  justify-items: start;
  min-width: 0;

  ${media.down('tabletSm')} {
    justify-items: center;
  }
`;

export const EmptyTitle = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

export const EmptySubtitle = styled.p`
  margin: 0;
  max-width: 44ch;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;

export const EmptyActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: ${space[1]};
`;

/* ── 에러 ──────────────────────────────────────────────────────────────────── */

/**
 * 첫 로드 실패.
 *
 * 예전에는 `Banner tone="danger"`(붉은 면)를 본문 정중앙에 띄웠다 — 목록 화면 전체가
 * 붉은 면 하나로 요약되고, 그 면이 색면 예산까지 먹었다. 지금은 **중립 면 + 1px danger 테두리 +
 * 44px danger 글리프**다: 위험을 말하는 것은 테두리·글리프·문장이고 면색이 아니다
 * (글리프는 폭 44px 이라 색면으로 세어지지 않는다).
 */
export const ErrorWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: min(52vh, 420px);
  padding: ${space[6]} 0;
`;

export const ErrorPanel = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[4]};
  width: 100%;
  max-width: 520px;
  border: 1px solid ${color.dangerBorder};
  border-radius: ${PICK_RADIUS};
  padding: clamp(${space[5]}, 3vw, ${space[7]});
  background: ${color.surface};
`;

export const ErrorMark = styled.span`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: ${radius.md};
  background: ${color.dangerSurface};
  color: ${color.danger};
`;

export const ErrorBody = styled.div`
  display: grid;
  gap: ${space[2]};
  justify-items: start;
  min-width: 0;
`;

export const ErrorTitle = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
`;

export const ErrorText = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
`;

export const ErrorActions = styled.div`
  margin-top: ${space[2]};
`;

/* ── 목록 꼬리 ─────────────────────────────────────────────────────────────── */

export const TailRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  padding: clamp(${space[6]}, 3vw, ${space[10]}) 0 ${space[4]};
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

/**
 * 종료 표시 — 문장 하나로 끝내던 자리를 **양쪽 선 + 가운데 캡슐**로 닫는다.
 * 무한 스크롤의 끝은 "더 없음"이 아니라 "여기까지"라는 마침표라, 형태가 그 말을 해야 한다.
 */
export const TailEndCap = styled.span`
  display: flex;
  align-items: center;
  gap: ${space[4]};
  width: 100%;

  &::before,
  &::after {
    content: '';
    flex: 1 1 auto;
    height: 1px;
    background: ${color.border};
  }
`;

export const TailEndLabel = styled.span`
  flex: 0 0 auto;
  padding: ${space[1]} ${space[4]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.02em;
  white-space: nowrap;
`;

export const TailSpinner = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid ${color.border};
  border-top-color: ${color.brand};
  animation: feed-tail-spin 0.7s linear infinite;

  @keyframes feed-tail-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes feed-tail-pulse {
    50% {
      opacity: 0.35;
    }
  }

  /*
   * 전역 리셋이 animation-duration 0.01ms · iteration 1 을 !important 로 걸어 이 링을 첫
   * 프레임에서 얼린다. 멈춘 링은 "더 불러오는 중"이 아니라 "여기서 끝"으로 읽힌다 — 회전이
   * 아니라 불투명도 펄스로 되찾는다(전정계 안전).
   */
  @media (prefers-reduced-motion: reduce) {
    animation-name: feed-tail-pulse;
    animation-timing-function: ${motion.ease};
    animation-duration: 1.4s !important;
    animation-iteration-count: infinite !important;
  }
`;

export const TailRetry = styled.button`
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
