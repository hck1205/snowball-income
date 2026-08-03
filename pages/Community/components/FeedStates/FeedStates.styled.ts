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

/*
 * 🔴 2026-08-03 흰 캔버스 전환에 맞춰 **두 값을 다시 골랐다**(실측 근거 포함).
 *
 *  - 블록 면: `surfaceMuted` → `border`. 스켈레톤 카드는 흰 면이고 그 위에서 muted 는 **1.05:1**
 *    이라 블록이 보이지 않았다(= 로딩 화면이 "빈 흰 카드"로 읽힌다). `border` 는 1.49:1 로,
 *    이 파일이 6px 레일(`SkeletonRail`)에 이미 쓰고 있는 값이다 — 블록끼리 같은 회색을 쓴다.
 *    🔴 `surfaceSunken`(1.11)은 답이 아니다: 블록 셋이 **`SkeletonTile` 안**에 앉는데 그 타일이
 *    바로 sunken 이라 통째로 사라진다. `border` 는 sunken 타일 위에서도 1.34:1 로 남는다.
 *  - 스윕: `surfaceHover` → `surface`. velog 라이트에서 hover 와 sunken 이 **같은 값**(#f1f3f5,
 *    실측 대비 1.000)이 되어 스윕이 통째로 사라졌다(평평한 한 색 = 멈춘 스켈레톤).
 *    `surface` 는 16테마 전부에서 `border` 와 값이 다르므로 어느 프리셋에서도 띠가 지나간다
 *    (라이트는 밝은 하이라이트, 다크는 어두운 띠 — 다크 중립군에는 `border` 보다 밝으면서
 *     블록으로 쓸 만한 토큰이 없다. 방향보다 "움직이는 것이 보인다"가 먼저다).
 */
const shimmer = `
  position: relative;
  overflow: hidden;
  background: ${color.border};

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${color.surface} 50%,
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

/**
 * 카드 안의 숫자판 자리 — 실제 숫자판과 같은 높이(132px)를 확보해 도착 시 튀지 않게 한다.
 * 면색도 실제 `SimTile` 과 같은 `surfaceSunken` 이다(스켈레톤은 올 것의 모양이어야 한다).
 * 이 타일 위에서도 블록이 보이는 것은 위 `shimmer` 가 블록 면을 `border` 로 잡기 때문이다.
 */
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
 * 허용), 글은 왼쪽 정렬로 읽기 흐름을 만든다.
 *
 * ── 🔴 2026-08-03 흰 캔버스 전환 — 이 면을 세우는 채널이 바뀌었다 ────────────────
 * 종전 근거("파스텔 워시 `gradientHeroSoft`")는 **더 이상 사실이 아니다.** 그 토큰은 옛 브랜드
 * 램프가 철거되면서 `surfaceMuted` 와 **같은 단색**이 됐다(16테마 전부 값이 일치). 그래서
 *  ① 역할을 그대로 말하는 토큰(`surfaceMuted`)으로 바꿔 이름이 거짓말하지 않게 하고,
 *  ② 흰 캔버스 위 1.04:1 인 면색 대신 **점선 경계를 `borderStrong`(3.3:1)으로 올려** 격을 맡겼다.
 * 채우지 않고 두르는 쪽을 고른 이유는 이 패널이 **버튼을 품기 때문**이다 — 면을 `surfaceSunken`
 * 까지 내리면 velog 라이트에서 공용 `Button secondary` 의 hover(`surfaceHover`)와 값이 같아져
 * (둘 다 #f1f3f5) 빈 상태의 유일한 CTA 가 hover 피드백을 잃는다(실측).
 * 점선 + `borderStrong` 은 이 레포가 "비어 있음 / 잠긴 자리"에 이미 쓰는 어휘다
 * (`CommentSection.LoginPrompt` · `AttachScenarioSection.AttachEmpty`).
 *
 * ⚠ `tintscan` 은 이 면을 **더 이상 세지 않는다** — 배경이 중립 토큰 집합(surface-muted)이기
 *   때문이다. 목록 화면의 색면 예산은 머리 면 1개뿐이고, 남은 1장은 **쓰지 않는다**
 *   (흰 캔버스의 이득은 절제에서 나온다 — `shared/styles/surfaces.ts` 머리말).
 */
export const EmptyRoot = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(${space[5]}, 3vw, ${space[10]});
  border: 1px dashed ${color.borderStrong};
  border-radius: ${PICK_RADIUS};
  padding: clamp(${space[8]}, 5vw, ${space[12]}) clamp(${space[5]}, 4vw, ${space[10]});
  background: ${color.surfaceMuted};

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
