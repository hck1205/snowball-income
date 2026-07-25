import styled from '@emotion/styled';
import { color, font, media, motion, radius, shadow, space, zIndex } from '@/shared/styles';

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
    /* 브랜드(좌측 이웃)와의 최소 간격 — 헤더 2줄 개편 후 같은 줄에 서게 되어 살짝 띄운다(사용자 요청). */
    margin-left: ${space[1]};
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

/* ResultsColumn·시나리오 탭·포트폴리오 프리셋 카드 — MainRightPanel 전용이라 각각
   `pages/Main/components/MainRightPanel/MainRightPanel.styled.ts` ·
   `.../MainRightPanel/components/ScenarioTabs/ScenarioTabs.styled.ts` ·
   `.../MainRightPanel/components/PortfolioPresetBoard/PortfolioPresetBoard.styled.ts` 로 이동했다. */

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
     칩이 여러 줄로 흐르는 영역이라 130px면 3줄가량 보이며 스크롤 신호(peek)를 주고,
     프리셋 탭 콘텐츠 총 높이를 TickerModal 패널 안에 눌러 모달 자체 스크롤이 불필요해진다
     (TickerModalPanel 이 overflow:hidden 로 스크롤을 끈다). 나머지는 이 영역 자체 스크롤로 훑는다. */
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
