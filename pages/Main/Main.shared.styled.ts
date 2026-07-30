import styled from '@emotion/styled';
import { color, font, media, motion, radius, shadow, space, subtleScrollbar, zIndex } from '@/shared/styles';

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

/**
 * 메인 본문 래퍼.
 *
 * 설정 폼(`ConfigInputGrid`)이 기대는 컨테이너는 이제 `SideDrawerBody` 다 — **여기에는
 * `container-type`을 되살리지 마라.** 되살리면 fixed 자손의 컨테이닝 블록을 가로채는 함정
 * (2026-07-27, 드로어가 뷰포트가 아니라 본문 박스 기준으로 배치돼 끝까지 스크롤되지 않던 버그)이
 * 그대로 되살아난다. (앱의 다른 컨테이너 목록은 `shared/styles/tokens.ts`의 `container` 주석 참고.)
 *
 * ⚠ `padding`/`max-width`는 바꾸지 마라 — `AppHeader`의 `HeaderInner`가 같은 값으로
 * 좌우 끝선을 맞추고 있다(`AppHeader` 의 `contentGutter` 기본값).
 *
 * ⚠ 이 컨테이너에 `position: sticky` 자식을 두려고 하지 마라 — grid item 의 sticky 는 자기 grid
 * area(= 자기 행) 안에서만 움직여 사실상 무력화된다. 히어로 설정 버튼의 상단 고정은 그래서
 * sticky 가 아니라 실측 기반 `position: fixed` 승격이다(`useStickyHeroAction` 주석 참고).
 */
export const FeatureLayout = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(16px, 2.6vw, 28px) clamp(12px, 2vw, 20px) clamp(24px, 4vw, 48px);
  display: grid;
  gap: clamp(12px, 1.8vw, 20px);
  color: ${color.text};
`;

export const MainContent = styled.main`
  display: contents;
`;

/* 결과 그리드·시나리오 탭·포트폴리오 프리셋 카드 — 각각
   `components/common/ResultGrid/ResultGrid.styled.ts` ·
   `pages/Main/components/MainRightPanel/components/ScenarioTabs/ScenarioTabs.styled.ts` ·
   `.../MainRightPanel/components/PortfolioPresetBoard/PortfolioPresetBoard.styled.ts` 에 있다.
   설정 드로어를 여는 버튼은 `pages/Main/components/SettingsEntryButton` 이 소유한다
   (구 `DrawerToggleButton`은 삭제 — 드로어가 전 해상도 상시가 되면서 `display:none` 분기와
   "열려 있으면 숨김" 규칙이 둘 다 틀린 계약이 됐다). */

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
  padding: ${space[2]} ${space[10]} ${space[2]} ${space[8]};
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
     칩이 여러 줄로 흐르는 영역이라 130px면 3줄가량 보이며 스크롤 신호(peek)를 주고,
     프리셋 탭 콘텐츠 총 높이를 눌러 넓은 화면에서는 모달 자체 스크롤이 안 생긴다.
     ⚠ 좁은 폭에서는 이것만으로 부족해 패널이 넘친다 — 그래서 TickerModalPanel 은
     세로 스크롤을 갖는다(예전엔 overflow:hidden 이라 넘친 부분이 잘렸다). */
  max-height: 130px;
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
