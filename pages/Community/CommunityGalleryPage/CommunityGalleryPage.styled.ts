import styled from '@emotion/styled';
import { appHeaderHeight, color, font, media, motion, radius, space, zIndex } from '@/shared/styles';

/** 회원 탈퇴 완료 등 목록 상단 1회성 안내 배너 자리. */
export const GalleryNotice = styled.div`
  margin-bottom: ${space[4]};
`;

/**
 * 검색 줄 — 본문 첫 줄, **정렬 탭·뷰 토글 줄과 따로 선다.**
 *
 * 2026-07-31 사용자 지시로 앱 헤더 가운데 슬롯에서 여기로 내려왔다("같은 라인에 있으니까 이상해").
 * 아래 `ControlBar` 에 합치지 않는 이유는 그 지시의 이유와 같다 — 한 줄에 검색·정렬·뷰토글 세 덩어리를
 * 세우면 헤더에서 벌어진 폭 경쟁이 본문에서 재현된다.
 *
 * 🔴 **반응형(≤1023)에서는 sticky** — 사용자는 "fixed"라고 했지만 `position: fixed` 는 흐름에서 빠져
 * 본문을 덮고 그만큼 상단 패딩을 손으로 벌어야 한다(그 값이 헤더 높이와 어긋나는 순간 겹치거나 뜬다).
 * sticky 는 자기 자리를 지키므로 레이아웃 시프트가 0이고 시각 결과는 같다.
 * `top` 은 **`--sb-app-header-h` 실측값**(AppHeader 가 ResizeObserver 로 발행)을 쓴다 — 헤더가 한 줄/두 줄을
 * 오갈 때 하드코딩한 숫자는 반드시 낡는다(구 `--tk-header-h: 88px` 가 세 번 고쳐진 이력).
 *
 * ⚠ sticky 는 **컨테이닝 블록(부모) 안에서만** 움직인다. 이 요소의 부모는 갤러리 `<section>`(목록 전체를
 * 감싸는 긴 블록)이라 목록이 끝날 때까지 붙어 있다 — 부모를 짧은 줄로 바꾸거나 grid item 으로 만들면
 * 그 순간 조용히 무력해진다(레포 실측 함정).
 *
 * 배경은 `color.bg`(본문 배경) — 아래 카드가 이 바를 통과해 비치지 않게 한다. 좌우로 `CommunityMain` 의
 * 안쪽 여백만큼 번지게 하지 않는 이유: 카드도 같은 컨테이너 폭 안에 있어 옆으로 새는 픽셀이 없다.
 */
export const SearchRow = styled.div`
  margin-bottom: ${space[3]};

  ${media.down('headerStack')} {
    position: sticky;
    top: ${appHeaderHeight};
    /* 콘텐츠 위·헤더(30) 아래. 명시하지 않으면 뒤따르는 카드가 이 바를 덮는다. */
    z-index: ${zIndex.stickyAction};
    margin-bottom: 0;
    padding: ${space[2]} 0;
    background: ${color.bg};
    box-shadow: 0 1px 0 ${color.border};
  }
`;

export const ControlBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  margin-bottom: ${space[4]};

  ${media.down('headerStack')} {
    padding-top: ${space[3]};
  }

  ${media.down('mobileWide')} {
    flex-wrap: wrap;
  }
`;

/** 컨트롤 줄 오른쪽 묶음 — 뷰 토글 + 글쓰기. 헤더에 있던 글쓰기가 여기로 내려왔다(§4.A-5). */
export const ControlActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
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
  /*
   * padding-top: 카드 hover 이동이 위 컨트롤 바와 겹치지 않게 하는 여유.
   * (이동량은 2026-07-30 에 8px → 2px 로 줄었다 — 'PostCard.styled.ts' 참고. 여유는 space[2] 로 남긴다.)
   */
  padding: ${space[2]} 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
  gap: clamp(${space[4]}, 2vw, ${space[6]});

  > li {
    display: flex;
    min-width: 0;
  }

  > li > * {
    width: 100%;
  }
`;

/**
 * 소프트 카드 피드(velog풍) — 각 행이 surface 카드로 뜨므로 구분선 대신 세로 간격으로 리듬을 만든다.
 * padding-top: 행 hover translateY(-2px)가 위 컨트롤 바에 닿지 않게 하는 소량 여유(CardGrid와 같은 관례).
 */
export const InlineList = styled.ul`
  list-style: none;
  margin: 0;
  padding: ${space[1]} 0 0;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
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

  @keyframes community-busy-pulse {
    50% {
      opacity: 0.35;
    }
  }

  /*
   * 전역 리셋이 'animation-duration: 0.01ms' 와 'animation-iteration-count: 1' 을 '!important' 로
   * 걸어 이 링을 **첫 프레임에서 얼린다.** 멈춘 링은 "더 불러오는 중"이 아니라 "여기서 끝"으로
   * 읽힌다. 회전이 아니라 불투명도 펄스로 되찾는다(전정계 안전, CloudSyncIndicator 와 같은 처방).
   */
  @media (prefers-reduced-motion: reduce) {
    animation-name: community-busy-pulse;
    animation-timing-function: ${motion.ease};
    animation-duration: 1.4s !important;
    animation-iteration-count: infinite !important;
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

  /*
   * 스켈레톤은 **정지가 정답**이다(스피너와 반대) — "이 자리에 올 값이 아직 없다"는 회색 막대의
   * 모양이 통째로 말한다. 전역 리셋이 남기는 "0.01ms 1회" 잔상 대신 명시적으로 끈다.
   */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
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
