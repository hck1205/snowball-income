import styled from '@emotion/styled';
import { color, font, media, motion, radius, shadow, space, zIndex } from '@/shared/styles';
import type { BreakpointKey } from '@/shared/styles';
import type { SideDrawerSide } from './SideDrawer.types';

/**
 * 오버레이 사이드 드로어의 표면. 백드롭은 **두 겹으로 쪼개져 있다** — 의도된 분리다:
 *
 * - `SideDrawerDim`  : 시각 딤 전용(좁은 폭에서만). 클릭을 받지 않는다.
 * - `SideDrawerScrim`: 클릭=닫기 전용. 항상 투명하고 전 폭에 존재한다.
 *
 * 넓은 폭에서 "결과를 클릭하려는데 드로어가 닫힌다"는 보고가 오면 스크림 블록에
 * `pointer-events: none` **한 줄**만 넣어 비모달 사이드 패널로 바꿀 수 있다(딤 동작은 무영향).
 * 두 역할을 한 요소에 합치면 그 전환이 딤까지 함께 꺼버린다.
 */
export const SideDrawerDim = styled.div<{ $open: boolean; $dimBelow: BreakpointKey }>`
  position: fixed;
  inset: 0;
  z-index: ${zIndex.drawerBackdrop};
  /* 순수 장식 — 클릭은 형제 스크림이 받는다. */
  pointer-events: none;
  background: transparent;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity ${motion.base} ${motion.ease},
    visibility ${motion.base} ${motion.ease};

  ${({ $dimBelow }) => media.down($dimBelow)} {
    background: ${color.overlay};
    backdrop-filter: blur(2px);
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const SideDrawerScrim = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: ${zIndex.drawerBackdrop};
  background: transparent;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  /* 닫혀 있을 때 클릭을 삼키지 않게 하는 것은 opacity 가 아니라 visibility 다. */
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition:
    opacity ${motion.base} ${motion.ease},
    visibility ${motion.base} ${motion.ease};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * 패널은 **항상 마운트**되고 열림은 CSS 가 정한다 — 언마운트/`display:none` 은 안쪽 스크롤 위치와
 * 입력 포커스를 매번 날린다.
 *
 * 닫힘 상태에 `visibility: hidden` 이 반드시 함께 붙어야 한다. `transform` 으로 화면 밖에 밀기만 하면
 * 스크린리더와 탭 이동이 여전히 닿아 "안 보이는데 포커스가 들어가는 패널"이 된다.
 */
export const SideDrawerPanel = styled.aside<{ $open: boolean; $side: SideDrawerSide; $width: string }>`
  position: fixed;
  top: 0;
  bottom: 0;
  ${({ $side }) => ($side === 'left' ? 'left: 0;' : 'right: 0;')}
  z-index: ${zIndex.drawer};
  width: ${({ $width }) => $width};
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: ${color.surface};
  ${({ $side }) =>
    $side === 'left' ? `border-right: 1px solid ${color.border};` : `border-left: 1px solid ${color.border};`}
  box-shadow: ${shadow.e3};
  transform: translateX(${({ $open, $side }) => ($open ? '0' : $side === 'left' ? '-100%' : '100%')});
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition:
    transform ${motion.base} ${motion.ease},
    visibility ${motion.base} ${motion.ease};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** 상단 그라디언트 한 줄 — 히어로·피커 드로어와 같은 시그니처로 "같은 제품의 표면"임을 잇는다. */
export const SideDrawerHead = styled.header`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  padding: ${space[4]} ${space[4]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  background: ${color.brandSubtle};

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: ${color.gradientAurora};
  }
`;

export const SideDrawerTitle = styled.h2`
  margin: 0;
  min-width: 0;
  font-family: ${font.display};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

/**
 * 닫기(×) — 테두리·면색 없는 담백형 아이콘 버튼(드로어 공통 확정 스타일).
 * 시각 크기는 38×38이지만 `::before` 로 히트 영역만 44×44 로 넓혀 터치 하한을 만족한다.
 * 포커스 링은 전역 `:focus-visible` 규칙 위에 얹기만 하고 절대 끄지 않는다.
 */
export const SideDrawerCloseButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: ${radius.sm};
  background: none;
  color: ${color.textSecondary};
  cursor: pointer;
  transition: color ${motion.fast} ${motion.ease};

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * 본문(스크롤 컨테이너). **드로어 안 폼(`ConfigInputGrid`)이 기대는 컨테이너**다 —
 * 여기서 `container-type`을 빼면 드로어 폭에서 설정 입력이 1열로 접히지 않는다.
 * (앱 전체의 유일한 컨테이너는 아니다: `DataTable`·`PortfolioAllocation`·티커 상세/허브도 각자 만든다.)
 *
 * ⚠ `container-type: inline-size` 는 레이아웃 컨테인먼트를 함께 적용해 **`position: fixed` 자손의
 *   컨테이닝 블록을 가로챈다**(뷰포트가 아니라 이 박스 기준으로 배치된다). 그래서 드로어 안에서
 *   오버레이(토스트·모달·팝오버)를 띄울 때는 **반드시 `createPortal(document.body)`** 로 뽑아라.
 *   여기에 직접 렌더하면 위치가 조용히 어긋나고 스크롤에 따라 밀린다.
 *   (`contain: none` 으로는 못 끈다 — `contain` 과 `container-type` 은 별개 속성이다.)
 *
 * `scrollbar-gutter` 는 쓰지 않는다 — 비대칭 여백이 좁은 폭에서 더 나쁘다.
 */
export const SideDrawerBody = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: ${space[4]};
  padding-bottom: calc(${space[5]} + env(safe-area-inset-bottom, 0px));
  container-type: inline-size;
`;
