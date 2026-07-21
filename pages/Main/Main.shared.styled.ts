import styled from '@emotion/styled';
import { color, container, font, media, motion, radius, shadow, space, zIndex } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 레이아웃                                                                     */
/* -------------------------------------------------------------------------- */

export const SkipLink = styled.a`
  position: absolute;
  top: -48px;
  left: ${space[3]};
  z-index: ${zIndex.skipLink};
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.sm};
  border: 1px solid ${color.brand};
  background: ${color.surface};
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  box-shadow: ${shadow.e2};

  &:focus-visible {
    top: ${space[3]};
  }
`;

export const FeatureLayout = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(16px, 2.6vw, 28px) clamp(12px, 2vw, 20px) clamp(24px, 4vw, 48px);
  display: grid;
  gap: clamp(12px, 1.8vw, 20px);
  color: ${color.text};
  container-type: inline-size;
  contain: layout style;

  ${media.down('drawer')} {
    contain: none;
  }
`;

export const MainContent = styled.main`
  display: contents;
`;

export const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
  gap: clamp(12px, 2vw, 20px);
  align-items: start;

  ${container.down('layout')} {
    grid-template-columns: 1fr;
  }

  ${media.down('layout')} {
    grid-template-columns: 1fr;
  }
`;

export const ConfigColumn = styled.aside`
  position: static;
  display: grid;
  gap: ${space[4]};
  max-height: none;
  overflow: visible;
  padding: 0;
  contain: layout paint style;

  ${media.down('drawer')} {
    position: fixed;
    top: 0;
    left: 0;
    width: min(92vw, 360px);
    height: 100dvh;
    max-height: 100dvh;
    z-index: ${zIndex.drawer};
    /* 페이지와 같은 극야 + 오로라 글로우 위에 입력 폼 — 글로우 마지막 레이어가 bg 단색이라 폴백 안전. */
    background: ${color.bgGlow} no-repeat;
    background-color: ${color.bg};
    border-right: 1px solid ${color.border};
    box-shadow: ${shadow.e3};
    padding: ${space[12]} ${space[3]} ${space[5]};
    transform: translateX(-100%);
    transition: transform ${motion.base} ${motion.ease};
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
`;

export const ConfigDrawerColumn = styled(ConfigColumn)<{ open: boolean }>`
  ${media.down('drawer')} {
    display: ${({ open }) => (open ? 'grid' : 'none')};
    will-change: transform;
    transform: ${({ open }) => (open ? 'translateX(0)' : 'translateX(-100%)')};
  }
`;

export const DrawerBackdrop = styled.div<{ open: boolean }>`
  display: none;

  ${media.down('drawer')} {
    display: ${({ open }) => (open ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    z-index: ${zIndex.drawerBackdrop};
    background: ${color.overlay};
    backdrop-filter: blur(2px);
  }
`;

/**
 * 모바일 설정 드로어를 여는 버튼. **`SimulatorHeader`의 컨트롤 줄 안에 정적으로** 산다.
 *
 * 예전에는 본문 흐름에 있다가 sentinel(IntersectionObserver)이 뷰포트를 벗어나면
 * `position: fixed`로 승격해 화면 좌상단에 떠 있었다. 헤더가 전폭 sticky 바가 되면서 그 전제가
 * 깨졌다 — 헤더가 `top: 0`을 영구 점유하므로 `top: 12px` 플로팅 토글이 헤더(브랜드 로고) 위에
 * 겹쳐 그려졌고, 데스크톱→모바일 리사이즈 시 sentinel이 뷰포트 밖이면 승격이 영영 안 걸려
 * 설정 진입이 막히는 경로도 있었다.
 *
 * **헤더가 항상 화면에 있으므로 플로팅 승격 자체가 불필요하다.** 버튼을 헤더에 정적으로 두면
 * 항상 보이고 누를 수 있으며, `position: fixed`가 사라져 컨테이닝 블록/스태킹 문제도 없다
 * (그 덕에 sentinel·IntersectionObserver·`isFloating` 상태를 전부 삭제했다 — 되살리지 말 것).
 *
 * 데스크톱에는 드로어 자체가 없으므로 `display: none`이고, 드로어가 열려 있는 동안에도 숨긴다.
 */
export const DrawerToggleButton = styled.button`
  display: none;

  ${media.down('drawer')} {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    /* 터치 타깃 하한. 헤더 컨트롤 줄에서 가장 높은 요소가 되어 줄 높이를 정한다. */
    min-height: 40px;
    border: 1px solid ${color.brand};
    background: ${color.brand};
    color: ${color.onBrand};
    border-radius: ${radius.sm};
    padding: ${space[2]} ${space[3]};
    font-size: ${font.size.sm};
    font-weight: ${font.weight.semibold};
    white-space: nowrap;
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color ${motion.fast} ${motion.ease};

    &:hover {
      background: ${color.brandHover};
    }

    &[aria-expanded='true'] {
      display: none;
    }
  }
`;

export const DrawerCloseButton = styled.button`
  display: none;

  ${media.down('drawer')} {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: ${space[2]};
    right: ${space[2]};
    width: 38px;
    height: 38px;
    border: 1px solid ${color.border};
    background: ${color.surface};
    color: ${color.textSecondary};
    border-radius: ${radius.pill};
    padding: 0;
    font-size: ${font.size.lg};
    line-height: 1;
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

    &:hover {
      background: ${color.surfaceHover};
      color: ${color.text};
    }
  }
`;

export const ResultsColumn = styled.section`
  display: grid;
  gap: clamp(12px, 1.8vw, 20px);
  min-width: 0;
  contain: layout style;

  > * {
    min-width: 0;
  }
`;

/* -------------------------------------------------------------------------- */
/* 헤더                                                                         */
/* -------------------------------------------------------------------------- */

/*
 * 시뮬레이터 헤더 자체는 이제 `components/SimulatorHeader`가 소유한다(전폭 sticky 글래스 바).
 * 여기 남은 것은 헤더 **밖** 본문 흐름으로 내려온 페이지 설명뿐이다.
 */

/**
 * 페이지 설명 한 줄. 헤더가 전폭 sticky 바가 되면서 **헤더 밖 본문 흐름 최상단**으로 내려왔다
 * (커뮤니티 헤더에도 설명이 없다 — 통일 관점에서도 헤더 밖이 맞다). sticky가 아니므로
 * 모바일에서 스크롤과 함께 사라져 뷰포트를 계속 잠식하지 않는다.
 */
export const HeaderDescription = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.snug};
`;




/* -------------------------------------------------------------------------- */
/* 시나리오 이름 / 탭                                                           */
/* -------------------------------------------------------------------------- */

export const ScenarioTabsWrap = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${space[1]};
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid ${color.border};
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;

  /* 모바일에서 탭이 넘칠 때: 스냅 + 우측 페이드로 "더 있음"을 알린다 */
  ${media.down('drawer')} {
    scroll-snap-type: x proximity;
    scroll-padding-inline: ${space[2]};
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const ScenarioTabButton = styled.button<{ active?: boolean; dragOver?: boolean; isDragging?: boolean }>`
  position: relative;
  flex: 0 0 auto;
  max-width: 160px;
  scroll-snap-align: start;
  border: 1px solid ${({ active }) => (active ? color.border : 'transparent')};
  border-bottom: 0;
  background: ${({ active }) => (active ? color.surface : 'transparent')};
  color: ${({ active }) => (active ? color.text : color.textMuted)};
  border-radius: ${radius.md} ${radius.md} 0 0;
  padding: ${space[2]} ${space[4]};
  min-height: 40px;
  font-size: ${font.size.sm};
  font-family: inherit;
  font-weight: ${({ active }) => (active ? font.weight.bold : font.weight.medium)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  touch-action: manipulation;
  cursor: pointer;
  z-index: ${({ active }) => (active ? 2 : 1)};
  opacity: ${({ isDragging }) => (isDragging ? 0.65 : 1)};
  box-shadow: ${({ dragOver }) => (dragOver ? `inset 0 0 0 2px ${color.brand}` : 'none')};
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  /* 활성 탭이 아래 패널과 이어져 보이도록 경계선을 덮는다 */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background: ${({ active }) => (active ? color.surface : 'transparent')};
  }

  &[draggable='true'] {
    cursor: ${({ isDragging }) => (isDragging ? 'grabbing' : 'grab')};
  }

  &:hover:not(:disabled) {
    background: ${({ active }) => (active ? color.surface : color.surfaceHover)};
    color: ${color.text};
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export const ScenarioTabRenameInput = styled.input`
  border: 0;
  background: transparent;
  color: ${color.text};
  padding: 0 ${space[4]} 0 0;
  min-height: 20px;
  min-width: 0;
  width: 100%;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  font-family: inherit;
  box-shadow: none;
  appearance: none;

  &:focus {
    outline: none;
    box-shadow: none;
  }
`;

export const ScenarioTabEditWrap = styled.div`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0;
  max-width: 160px;
  border: 1px solid ${color.border};
  border-bottom: 0;
  background: ${color.surface};
  color: ${color.text};
  border-radius: ${radius.md} ${radius.md} 0 0;
  padding: ${space[2]} ${space[4]};
  min-height: 40px;
  white-space: nowrap;
`;

export const ScenarioTabCloseButton = styled.button`
  position: absolute;
  top: 50%;
  right: ${space[2]};
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${color.textMuted};
  width: 20px;
  height: 20px;
  border-radius: ${radius.xs};
  padding: 0;
  line-height: 1;
  font-size: ${font.size.base};
  font-family: inherit;
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ScenarioTabTooltip = styled.div`
  position: fixed;
  z-index: ${zIndex.tooltip};
  pointer-events: none;
  max-width: 280px;
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  box-shadow: ${shadow.e3};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* -------------------------------------------------------------------------- */
/* 티커 생성 / 목록                                                             */
/* -------------------------------------------------------------------------- */

/**
 * 퀵액션 툴바 — "데이터 저장"이 자동저장으로 대체돼 제거된 뒤 보이는 버튼은 [공유] 하나뿐이라 단일 열로
 * 전폭을 채운다. (Coffee는 display:none 이라 그리드 셀을 차지하지 않는다 → 공유가 전폭.)
 */
export const TickerQuickActionRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[2]};
  width: 100%;
  margin-bottom: ${space[2]};
`;

export const TickerQuickActionButton = styled.button`
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  border-radius: ${radius.sm};
  /* 전폭 단일 버튼(공유) — 아이콘을 세로로 쌓지 않고 가로로 나란히 둬 높이를 낮춘다. */
  min-height: 38px;
  padding: ${space[2]} ${space[3]};
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  font-family: inherit;
  line-height: 1.1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;

export const TickerQuickActionIcon = styled.span`
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

/**
 * 좌측 패널의 사실상 primary CTA — Button primary와 같은 오로라 CTA 리본 레시피를 쓴다.
 * hover는 색을 바꾸지 않고 background-position만 움직여 라벨 대비(전 stop 흰 라벨 ≥4.5:1)가 불변이다.
 */
export const TickerCreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background-image: ${color.gradientCta};
  background-size: 160% 160%;
  background-position: 0% 0%;
  color: ${color.onBrand};
  border-radius: ${radius.sm};
  min-height: 44px;
  padding: ${space[2]} ${space[4]};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  margin-bottom: ${space[3]};
  touch-action: manipulation;
  transition: background-position ${motion.base} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:hover {
    background-position: 100% 100%;
    box-shadow: ${shadow.e2};
  }

  &:active {
    transform: translateY(1px);
  }

  ${media.down('drawer')} {
    margin-bottom: ${space[5]};
  }
`;

export const TickerGridWrap = styled.div`
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
  padding: ${space[2]};
`;

export const TickerList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: ${space[2]};
`;

export const TickerChipWrap = styled.div`
  position: relative;

  &:hover button[data-chip='true'],
  &:focus-within button[data-chip='true'] {
    padding-right: 32px;
  }

  &:hover button[data-gear='true'],
  &:focus-within button[data-gear='true'] {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(-50%) scale(1);
  }
`;

/**
 * 티커 칩(좌측 패널 그리드).
 *
 * `Chip` 프리미티브와 같은 시각 언어(pill, 선택 시 브랜드 채움)를 쓰되, 여기서는
 * 고정폭 그리드 셀이라 폭 100%가 필요해서 별도 스타일로 둔다.
 * 선택 상태를 폰트 굵기만으로 말하던 걸 **pill 형태 + 브랜드 채움**으로 바꿨다.
 */
export const TickerItemButton = styled.button<{ selected?: boolean }>`
  width: 100%;
  min-height: 36px;
  text-align: center;
  border: 1px solid ${({ selected }) => (selected ? color.brandBorder : color.border)};
  background: ${({ selected }) => (selected ? color.brandSubtle : color.surface)};
  color: ${({ selected }) => (selected ? color.brandText : color.textSecondary)};
  border-radius: ${radius.pill};
  padding: ${space[2]};
  font-size: ${font.size['2xs']};
  font-weight: ${({ selected }) => (selected ? font.weight.bold : font.weight.medium)};
  font-family: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease}, padding-right ${motion.base} ${motion.ease};

  &:hover {
    background: ${({ selected }) => (selected ? color.brandSubtleHover : color.surfaceHover)};
    border-color: ${color.brandBorder};
  }
`;

export const TickerGearButton = styled.button`
  position: absolute;
  top: 50%;
  /* 오른쪽 끝에서 살짝 안쪽으로 들여, 칩 텍스트와의 간격도 자연스럽게 좁아진다. */
  right: 3px;
  transform: translateY(-50%) scale(0.88);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.borderStrong};
  /* 칩(surface)과 살짝 다른 톤으로 떠 있는 작은 버튼임을 드러낸다. */
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  border-radius: ${radius.pill};
  width: 24px;
  height: 24px;
  padding: 0;
  line-height: 0;
  cursor: pointer;
  opacity: 0;
  pointer-events: auto;
  transition: opacity ${motion.base} ${motion.ease}, transform ${motion.base} ${motion.ease},
    background-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandSubtle};
    color: ${color.brandText};
  }

  svg {
    width: 12px;
    height: 12px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

/* -------------------------------------------------------------------------- */
/* 선택된 티커 칩                                                               */
/* -------------------------------------------------------------------------- */

export const SelectedChipWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: ${space[2]};

  ${media.down('drawer')} {
    margin-top: ${space[4]};
  }
`;




/* -------------------------------------------------------------------------- */
/* 폼 그리드 / 필드                                                             */
/* -------------------------------------------------------------------------- */

export const FormGrid = styled.div`
  display: grid;
  /* 티커 + 이름 2개를 한 줄에 나란히 둔다(좁은 모달에서도 auto-fit 로 무너지지 않게 2열 고정). */
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[3]};
`;

export const ModalCompactFormGrid = styled.div`
  display: grid;
  /* 6열 격자로 5개 필드를 2줄로 채운다:
       1행 = 현재주가·배당률·배당성장률 (각 2칸 → 3개)
       2행 = 기대총수익률·지급주기 (각 3칸 → 2개, 각 절반 폭으로 줄을 꽉 채움) */
  grid-template-columns: repeat(6, minmax(0, 1fr));
  /* 기대총수익률 셀은 아래에 근거 캡션이 붙어 더 높아질 수 있다 — 같은 행의 지급주기가
     늘어나 보이지 않게 셀을 위로 정렬한다. */
  align-items: start;
  gap: ${space[3]};

  > * {
    grid-column: span 2;
  }
  > *:nth-child(4),
  > *:nth-child(5) {
    grid-column: span 3;
  }

  /* 모바일/드로어에선 숫자 입력이 좁아지지 않게 2열로 단순화(span 해제). */
  ${media.down('drawer')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    > *,
    > *:nth-child(4),
    > *:nth-child(5) {
      grid-column: auto;
    }
  }
`;

export const ConfigFormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${space[3]};
`;

export const ConfigInputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${space[3]};

  ${container.between('mobileWide', 'layout')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${space[3]} ${space[4]};
  }
`;

export const ConfigSectionDivider = styled.hr`
  border: 0;
  border-top: 1px solid ${color.border};
  width: 100%;
  margin: ${space[1]} auto ${space[2]};
`;

export const InlineField = styled.label`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

export const InlineFieldHeader = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

/* InlineField 안의 셀렉트는 공용 프리미티브(`@/components/common` Select, 기본 size='lg')가 그린다. */

/* -------------------------------------------------------------------------- */
/* 모달 내 티커 검색                                                            */
/* -------------------------------------------------------------------------- */

export const ModalTickerSearchWrap = styled.div`
  position: relative;
  margin-bottom: ${space[3]};
`;

export const ModalTickerSearchIcon = styled.span`
  position: absolute;
  left: ${space[3]};
  top: 50%;
  width: 14px;
  height: 14px;
  color: ${color.textMuted};
  transform: translateY(-50%);
  pointer-events: none;

  svg {
    width: 14px;
    height: 14px;
    display: block;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const ModalTickerSearchInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[3]} ${space[2]} ${space[8]};
  font-size: ${font.size.base};
  font-family: inherit;
  color: ${color.text};
  background-color: ${color.surface};
  transition: border-color ${motion.fast} ${motion.ease};

  &::placeholder {
    color: ${color.textMuted};
  }

  &:hover {
    border-color: ${color.brandBorder};
  }
`;

/**
 * 거의 보이지 않는 얇은 스크롤바 — 트랙 투명, 6px thumb는 은은한 border 색, hover 시에만 살짝 진해진다.
 * 티커 모달의 프리셋 목록·검색 결과 등 내부 스크롤 영역에 써서 과한 기본 스크롤바를 절제한다(테마 토큰만 사용).
 */
const subtleScrollbar = `
  scrollbar-width: thin;
  scrollbar-color: ${color.border} transparent;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${color.border};
    border-radius: 999px;
  }
  &:hover::-webkit-scrollbar-thumb {
    background: ${color.borderStrong};
  }
`;

export const SearchResultList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${space[2]};
  max-height: 260px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  ${subtleScrollbar}
`;

export const SearchResultButton = styled.button`
  width: 100%;
  min-height: 44px;
  border: 1px solid ${color.border};
  background: ${color.surface};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[3]};
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
    background: ${color.brandSubtle};
  }
`;

export const SearchResultTicker = styled.div`
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
`;

export const SearchResultName = styled.div`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/* -------------------------------------------------------------------------- */
/* 프리셋 드롭다운 / 칩                                                          */
/* -------------------------------------------------------------------------- */

export const PresetChipGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-content: start;
  gap: ${space[2]};
`;

/**
 * 프리셋 칩 영역. 티커가 많아도 편하게 훑도록 **자체 스크롤**을 준다.
 * `overscroll-behavior: contain` 으로 이 영역 끝에서 모달 패널로 스크롤이 번지지 않게 해
 * 중첩 스크롤이 부자연스럽던 예전 문제를 막는다.
 */
export const PresetChipScrollArea = styled.div`
  /* 모달 안에서 이 영역이 너무 높으면 아래 입력 필드가 밀려 스크롤이 이중으로 생긴다.
     칩이 여러 줄로 흐르는 영역이라 160px면 2~3줄이 보이고, 나머지는 자체 스크롤로 훑는다. */
  max-height: 160px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: ${space[1]};
  margin-bottom: ${space[2]};
  scrollbar-gutter: stable;
  ${subtleScrollbar}
`;

export const PresetChipButton = styled.button<{ selected?: boolean }>`
  border: 1px solid ${({ selected }) => (selected ? color.brandBorder : color.border)};
  background: ${({ selected }) => (selected ? color.brandSubtle : color.surface)};
  color: ${({ selected }) => (selected ? color.brandText : color.textSecondary)};
  /* 티커 칩과 같은 pill 형태 — 둘 다 "고르는 조각"이므로 형태가 같아야 한다. */
  border-radius: ${radius.pill};
  padding: ${space[2]};
  min-height: 36px;
  font-size: ${font.size.xs};
  font-family: inherit;
  font-weight: ${({ selected }) => (selected ? font.weight.bold : font.weight.medium)};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
    background: ${({ selected }) => (selected ? color.brandSubtleHover : color.surfaceHover)};
  }
`;

/* -------------------------------------------------------------------------- */
/* 포트폴리오 프리셋 카드                                                        */
/* -------------------------------------------------------------------------- */

export const PortfolioPresetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${space[3]};
`;

/**
 * 프리셋 카드(빈 상태의 온보딩).
 *
 * 빈 상태는 이 앱의 **첫인상**이다. 예전엔 회색 테두리 상자가 세 개 있을 뿐이라
 * "고를 수 있는 것"으로 보이지 않았다. 고친 것:
 *  - 좌측 브랜드 액센트 바가 hover 시 나타난다 → 선택 가능한 카드임을 말한다
 *  - hover 시 살짝 떠오른다(그림자 + 1px) → 누를 수 있는 물건
 *  - 카드 전체가 버튼이므로 커서/포커스 링이 카드 전체에 걸린다
 */
export const PortfolioPresetCardButton = styled.button`
  position: relative;
  display: grid;
  gap: ${space[2]};
  width: 100%;
  text-align: left;
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  padding: ${space[4]};
  padding-left: ${space[5]};
  color: ${color.text};
  font-family: inherit;
  cursor: pointer;
  overflow: hidden;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease}, background-color ${motion.fast} ${motion.ease};

  /* 좌측 액센트 바 — 평소엔 투명, hover/focus 시 오로라 리본(표시용). */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: transparent;
    opacity: 0;
    transition: opacity ${motion.fast} ${motion.ease};
  }

  &:hover,
  &:focus-visible {
    border-color: ${color.brandBorder};
    background: ${color.surfaceHover};
    box-shadow: ${shadow.e2};
    transform: translateY(-1px);
  }

  &:hover::before,
  &:focus-visible::before {
    background: ${color.gradientAurora};
    opacity: 1;
  }

  &:active {
    transform: translateY(0);
  }
`;

export const PortfolioPresetContentRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: ${space[4]};
  align-items: start;

  ${media.down('tabletSm')} {
    grid-template-columns: 1fr;
  }
`;

export const PortfolioPresetMain = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const PortfolioPresetTitle = styled.span`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  color: ${color.text};
  letter-spacing: -0.01em;
`;

export const PortfolioPresetDesc = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

export const PortfolioPresetCore = styled.span`
  font-size: ${font.size.xs};
  color: ${color.brandText};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
`;

export const PortfolioPresetMeta = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const PortfolioPresetPlan = styled.div`
  display: grid;
  gap: ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
  padding: ${space[3]};
`;

export const PortfolioPresetPlanItem = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  display: flex;
  justify-content: space-between;
  gap: ${space[2]};

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
    ${font.numeric};
  }
`;

/* -------------------------------------------------------------------------- */
/* 요약 카드                                                                    */
/* -------------------------------------------------------------------------- */








export const CompactSummaryHelpButton = styled.button`
  position: relative;
  flex: 0 0 auto;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};
  border-radius: ${radius.pill};
  width: 18px;
  height: 18px;
  line-height: 1;
  padding: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  font-family: inherit;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  /* 시각 크기는 유지하고 히트 영역만 44x44 */
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
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;


/* -------------------------------------------------------------------------- */
/* 시리즈 필터 / 토글                                                           */
/* -------------------------------------------------------------------------- */

export const SeriesFilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
  margin-bottom: ${space[3]};
  align-items: center;
  justify-content: space-between;
`;

export const SeriesFilterGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
`;

export const SeriesFilterItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const SeriesFilterLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 32px;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  cursor: pointer;
  user-select: none;
`;

export const SeriesFilterCheckbox = styled.input`
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: ${color.brand};
  cursor: pointer;
`;

/* -------------------------------------------------------------------------- */
/* 보조 텍스트 / 도움말 / 에러                                                   */
/* -------------------------------------------------------------------------- */

export const HintText = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  line-height: ${font.leading.normal};
`;

export const HelpMarkButton = styled.button`
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.borderStrong};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  border-radius: ${radius.pill};
  width: 18px;
  height: 18px;
  line-height: 1;
  padding: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  font-family: inherit;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  /* 시각 크기는 유지하고 히트 영역만 44x44 */
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
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;

export const ScenarioTabsHelpButton = styled(HelpMarkButton)`
  align-self: center;
  flex: 0 0 auto;
  margin-left: ${space[2]};
`;

export const ErrorBox = styled.div`
  display: grid;
  gap: ${space[1]};
  border: 1px solid ${color.dangerBorder};
  border-left: 3px solid ${color.danger};
  border-radius: ${radius.sm};
  padding: ${space[3]};
  margin-top: ${space[3]};
  background: ${color.dangerSurface};
  color: ${color.danger};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};

  p {
    margin: 0;
  }
`;

/* -------------------------------------------------------------------------- */
/* 차트 / 알로케이션 범례                                                        */
/* -------------------------------------------------------------------------- */

export const ChartWrap = styled.div`
  width: 100%;
  height: clamp(220px, 30vw, 280px);
  min-width: 0;
  overflow: hidden;
  contain: layout paint style;
`;

export const AllocationChartLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr));
  gap: clamp(8px, 1.5vw, 16px);
  align-items: start;
  contain: layout style;
`;

export const AllocationLegend = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${space[2]};
  container-type: inline-size;
`;

const stackedLegendItem = `
  grid-template-columns: 16px 40px minmax(0, 1fr) 48px;
  grid-template-areas:
    'dot name name value'
    'dot slider slider fix';
  gap: ${space[2]};
`;

export const AllocationLegendItem = styled.li`
  display: grid;
  /*
   * 고정 버튼은 행의 **맨 우측**이다. 한때 슬라이더 앞(name 다음)으로 옮겼던 이유는
   * 모바일에서 슬라이더를 쓸다가 오른쪽 끝의 고정을 잘못 누르는 사고였는데,
   * 카드 헤더의 "비율 조절 잠금" 토글이 그 오조작을 원천 차단하면서 근거가 사라졌다.
   */
  grid-template-columns: 16px 72px minmax(120px, 1fr) 52px 40px;
  grid-template-areas: 'dot name slider value fix';
  gap: ${space[2]};
  align-items: center;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};

  ${container.down('mobile')} {
    ${stackedLegendItem};
  }

  ${media.down('mobile')} {
    ${stackedLegendItem};
  }
`;

export const AllocationColorDot = styled.span<{ color: string }>`
  grid-area: dot;
  width: 12px;
  height: 12px;
  border-radius: ${radius.xs};
  background: ${({ color: dotColor }) => dotColor};
`;

export const AllocationLegendName = styled.span`
  grid-area: name;
  min-width: 0;
  color: ${color.text};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.tight};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const AllocationLegendSlider = styled.input`
  grid-area: slider;
  width: 100%;
  height: 8px;
  appearance: none;
  -webkit-appearance: none;
  background: linear-gradient(
    to right,
    ${color.brand} 0%,
    ${color.brand} var(--slider-progress),
    ${color.surfaceSunken} var(--slider-progress),
    ${color.surfaceSunken} 100%
  );
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  --slider-progress: 0%;
  margin: 0;
  padding: 0;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::-webkit-slider-runnable-track {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -5px;
    border-radius: ${radius.pill};
    border: 2px solid ${color.surface};
    background: ${color.brand};
    box-shadow: 0 1px 3px rgba(15, 25, 35, 0.3);
  }

  &::-moz-range-track {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-moz-range-progress {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: ${radius.pill};
    border: 2px solid ${color.surface};
    background: ${color.brand};
    box-shadow: 0 1px 3px rgba(15, 25, 35, 0.3);
  }
`;

const stackedFixButton = `
  justify-self: end;
`;

/** 카드 헤더 우측 토글 묶음 — "배당 중앙표시"와 "비율 조절 잠금"을 나란히 둔다. */
export const CardHeaderToggles = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[3]};
`;

export const AllocationFixButton = styled.button<{ active: boolean }>`
  grid-area: fix;
  width: 40px;
  height: 28px;
  border: 1px solid ${({ active }) => (active ? color.brand : color.borderStrong)};
  background: ${({ active }) => (active ? color.brand : color.surface)};
  color: ${({ active }) => (active ? color.onBrand : color.textSecondary)};
  border-radius: ${radius.xs};
  padding: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brand};
  }

  ${container.down('mobile')} {
    ${stackedFixButton};
  }

  ${media.down('mobile')} {
    ${stackedFixButton};
  }
`;

export const AllocationLegendValue = styled.span`
  grid-area: value;
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  justify-self: end;
  ${font.numeric};
`;

/* -------------------------------------------------------------------------- */
/* 모달                                                                         */
/* -------------------------------------------------------------------------- */

/**
 * 모달 스타일의 진짜 주인은 `components/common/Modal`이다. 여기서는 다시 내보내기만 한다.
 * → TickerModal / MainRightPanel / HelpModal이 import 한 줄도 안 바꾸고 새 스킨을 받는다.
 */
export { ModalActions, ModalBackdrop, ModalBody, ModalPanel, ModalTitle } from '@/components/common/Modal';

/** 모달 안의 탭. `Tabs` 프리미티브와 같은 시각 언어(브랜드 밑줄)를 쓴다. */
export { TabButton as ModalTabButton, TabList as ModalTabList } from '@/components/common/Tabs/Tabs.styled';
