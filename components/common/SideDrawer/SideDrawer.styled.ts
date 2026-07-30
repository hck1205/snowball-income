import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  color,
  font,
  hitAreaWithin,
  iconOpticalAlign,
  media,
  motion,
  radius,
  shadow,
  space,
  subtleScrollbar,
  zIndex
} from '@/shared/styles';
import type { SideDrawerBodyLayout, SideDrawerDimScope, SideDrawerSide } from './SideDrawer.types';

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
/**
 * 딤이 실제로 보이는 상태. `dimBelow` 가 브레이크포인트면 미디어 블록 안에, `'always'` 면
 * 바깥에 그대로 얹는다 — **같은 선언 한 벌**을 두 자리에 쓰기 위해 뽑았다(두 벌로 나누면
 * 한쪽만 고쳐진다).
 */
const dimSurface = (open: boolean) => css`
  background: ${color.overlay};
  backdrop-filter: blur(2px);
  opacity: ${open ? 1 : 0};
  visibility: ${open ? 'visible' : 'hidden'};
`;

export const SideDrawerDim = styled.div<{ $open: boolean; $dimBelow: SideDrawerDimScope }>`
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

  ${({ $open, $dimBelow }) =>
    $dimBelow === 'always'
      ? dimSurface($open)
      : css`
          ${media.down($dimBelow)} {
            ${dimSurface($open)}
          }
        `}

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
 * 시각 크기는 38×38이지만 히트 영역만 넓혀 터치 하한(WCAG 2.5.5)에 다가간다.
 * 포커스 링은 전역 `:focus-visible` 규칙 위에 얹기만 하고 절대 끄지 않는다.
 *
 * 2026-07-30 까지 `::before` 44×44 를 손으로 적고 있었다 — `shared/styles/surfaces.ts` 가
 * 정확히 그 20곳을 모으려고 생긴 헬퍼인데 여기가 빠져 있었고, 손코딩 사본 중 하나(`Chip`)는
 * `top/left/transform` 을 빠뜨려 히트 영역이 옆·아래로만 뻗는 실제 버그였다. 정렬을 헬퍼가
 * 구조적으로 보장한다.
 *
 * `hitArea()`(무조건 44) 가 아니라 `hitAreaWithin(space[3])` 인 이유: 이 버튼은 헤드 줄에서
 * 제목과 `gap: space[3]`(12px) 로 붙어 앉는다. 헬퍼가 그 간격을 넘지 않는 선까지만 넓히므로
 * 나중에 버튼이 커지거나 헤드 gap 이 줄어도 제목을 덮지 않는다.
 * 현재 치수의 실효값은 `min(44px, 38 + 12) = 44px` — **바꾸기 전과 같은 44×44** 다.
 */
export const SideDrawerCloseButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: ${radius.sm};
  background: none;
  color: ${color.textSecondary};
  cursor: pointer;
  transition: color ${motion.fast} ${motion.ease};

  /*
   * 제목(SideDrawerTitle)은 헤딩 서체라 잉크 중심이 라인박스 중심보다 위에 있다 — 헤드 줄이
   * align-items: center 인데도 X 가 제목 한가운데보다 2.0px 아래에 앉아 있었다(2026-07-30 실측).
   * 보정 기준은 X 자신이 아니라 **제목 글자 크기**다.
   */
  ${iconOpticalAlign('display', font.size.lg)}

  ${hitAreaWithin(space[3])}

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * 본문(스크롤 컨테이너). 배치는 `$layout` 이 정한다:
 *
 * - `'scroll'`: **드로어 안 폼(`ConfigInputGrid`)이 기대는 컨테이너**다 — 여기서 `container-type`을
 *   빼면 드로어 폭에서 설정 입력이 1열로 접히지 않는다. (앱 전체의 유일한 컨테이너는 아니다:
 *   `DataTable`·`PortfolioAllocation`·티커 상세/허브도 각자 만든다.)
 * - `'fill'`: 목록 피커용 flex 컬럼. 검색행은 제 높이를 쓰고 `flex: 1 1 auto` 자식(`PickerRoot`)이
 *   남은 높이를 전부 먹어 **그 안에서만** 스크롤한다 — grid 로 두면 목록이 자연 높이로 자라
 *   검색행이 위로 밀려 사라진다. 여기에는 `container-type` 을 **일부러 켜지 않는다**(피커 안에
 *   컨테이너 쿼리 소비자가 없고, 아래 ⚠ 위험만 남는다).
 *
 * ⚠ `container-type: inline-size` 는 레이아웃 컨테인먼트를 함께 적용해 **`position: fixed` 자손의
 *   컨테이닝 블록을 가로챈다**(뷰포트가 아니라 이 박스 기준으로 배치된다). 그래서 드로어 안에서
 *   오버레이(토스트·모달·팝오버)를 띄울 때는 **반드시 `createPortal(document.body)`** 로 뽑아라.
 *   여기에 직접 렌더하면 위치가 조용히 어긋나고 스크롤에 따라 밀린다.
 *   (`contain: none` 으로는 못 끈다 — `contain` 과 `container-type` 은 별개 속성이다.)
 *
 * `scrollbar-gutter` 는 쓰지 않는다 — 비대칭 여백이 좁은 폭에서 더 나쁘다.
 * (모양만 `subtleScrollbar` 로 통일한다 — 거터와는 별개 결정이다.)
 */
export const SideDrawerBody = styled.div<{ $layout: SideDrawerBodyLayout }>`
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  ${subtleScrollbar}
  min-height: 0;
  gap: ${space[4]};
  padding: ${space[4]};
  padding-bottom: calc(${space[5]} + env(safe-area-inset-bottom, 0px));

  ${({ $layout }) =>
    $layout === 'fill'
      ? css`
          display: flex;
          flex-direction: column;
        `
      : css`
          display: grid;
          align-content: start;
          container-type: inline-size;
        `}
`;
