import styled from '@emotion/styled';
import {
  appHeaderHeight,
  color,
  font,
  media,
  radius,
  scrollFadeRight,
  space,
  subtleScrollbar,
  zIndex
} from '@/shared/styles';

/**
 * 세 축 필터 판.
 *
 * 표 바로 위에 **자기 면**을 갖는 이유: 종전의 섹터 칩 한 줄은 표와 같은 면 위에 떠 있어서
 * "표의 일부"로 읽혔다. 축이 셋이 되면 그 줄은 8~14개 칩이 흘러가는 덩어리가 되므로, 면과
 * 테두리로 "여기까지가 조건, 아래가 결과"를 먼저 갈라야 한다.
 *
 * ⚠ 면은 `surfaceSunken` 이다(카드가 아니라 **패인 자리**). 표는 캔버스 위에 그대로 서므로
 *   필터가 솟은 카드가 되면 결과보다 조건이 무거워 보인다.
 */
export const FiltersPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
  min-width: 0;

  /*
   * 🔴 좁은 화면에서 **헤더 아래에 붙는다**(2026-08-17 사용자 요청). 표가 행 카드로 접히는
   * 바로 그 폭(tablet)부터다 — 카드 모드의 목록은 세로로 길어서, 40번째 줄에서 조건을 바꾸려면
   * 조건 판까지 되돌아 올라가야 했다.
   *
   * ⚠ 붙는 것은 이 판이 **표와 같은 섹션 안에 있기 때문**에 성립한다(둘 다 같은 Section 의 자식).
   *   sticky 는 제 부모 상자 안에서만 붙으므로, 표를 다 지나가면 자연스럽게 함께 떠난다 —
   *   출처·관련 목록 섹션까지 따라다니지 않는다. 판을 다른 상자로 옮기지 마라.
   * ⚠ 면이 반투명하면 밑을 지나는 표 글자가 비친다. surfaceSunken 은 불투명 토큰이다.
   * ⚠ 높이는 두 줄(검색 + 가로로 미는 축 트랙)로 묶는다. 세 축을 세로로 쌓으면 390px 에서
   *   판만 240px 가 되어 뷰포트의 28% 를 영구히 먹는다 — 그건 조건이 아니라 벽이다.
   */
  ${media.down('tablet')} {
    position: sticky;
    top: ${appHeaderHeight};
    z-index: ${zIndex.stickyAction};
    gap: ${space[2]};
    padding: ${space[2]} ${space[3]};
  }
`;

/**
 * 세 축(배당률·성장·섹터)을 **한 줄로 미는 트랙** — 좁은 화면 전용.
 *
 * 넓은 화면에서는 상자가 아니다(`display: contents`) — 판이 이미 세로 스택이라 여기서 상자를
 * 하나 더 만들면 gap 리듬이 트랙 안팎으로 갈린다.
 *
 * 🔴 트랙 안에서는 축의 라벨이 칩 **옆**으로 돌아온다. 위 `AxisRow` 가 좁은 폭에서 라벨을 칩 위로
 * 올리는 것은 칩이 여러 줄로 접히는 세로 배치를 전제한 판단인데, 트랙은 접지 않고 옆으로 밀기
 * 때문에 그 전제가 뒤집힌다 — 라벨이 위로 가면 트랙이 통째로 두 줄이 된다.
 */
export const AxisTrack = styled.div`
  display: contents;

  ${media.down('tablet')} {
    display: flex;
    align-items: center;
    gap: ${space[4]};
    overflow-x: auto;
    overscroll-behavior-x: contain;
    ${subtleScrollbar}
    ${scrollFadeRight}

    /*
     * 축 한 묶음 = 라벨 + 칩들. 접히지 않고 제 폭을 그대로 갖는다.
     * ⚠ 클래스를 두 번 쓴다(&&, 명시도 0,2,0). AxisRow 가 같은 폭 구간에서 스스로
     *   flex-direction: column 을 걸고 있어 명시도가 같으면 **정의 순서**로 승패가 갈린다 —
     *   실측(390px)에서 실제로 져서 축이 두 줄로 섰다. 순서에 기대지 않는다.
     */
    && > * {
      flex: none;
      flex-direction: row;
      align-items: center;
      gap: ${space[2]};
    }

    /* 칩 줄이 접히면 트랙이 두 줄이 되어 가로로 미는 의미가 사라진다. */
    && > * > * {
      flex-wrap: nowrap;
      min-width: 0;
    }
  }
`;

/**
 * 축 한 줄 = 라벨 + 칩들. 라벨이 **자기 폭만** 갖고 칩이 남는 폭을 먹는다(반대로 두면 칩 줄이
 * 접힐 때 라벨이 눌린다 — 표의 행 카드에서 같은 함정을 이미 겪었다).
 */
export const AxisRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${space[3]};
  min-width: 0;

  /*
   * 좁은 폭에서는 라벨을 칩 줄 **위로** 올린다. 390 실측(2026-08-04 · 배당챔피언, 칩이 몇 줄로
   * 접히는지를 잰 값): 라벨 기둥을 남기면 칩이 쓸 폭이 332 → 240px 로 줄어
   * 배당률·성장 축이 1줄에서 **2줄**, 섹터 축이 4줄에서 **5줄**이 된다. 라벨 하나를 옆에 세우려고
   * 세 축이 세로로 3줄씩 자라는 거래는 남는 게 없다.
   */
  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
    gap: ${space[1]};
  }
`;

export const AxisLabel = styled.span`
  flex: 0 0 auto;
  min-width: 88px;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};

  /* 트랙 안에서는 라벨 기둥을 세울 이유가 없다 — 축끼리 나란히 흐르므로 제 글자 폭이면 된다. */
  ${media.down('tablet')} {
    min-width: 0;
    white-space: nowrap;
  }
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  min-width: 0;
`;

/** 세 축이 함께 걸린다는 사실을 말하는 한 줄. 칩 아래에 둔다(읽기 전에 조작할 수 있어야 한다). */
export const FilterHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};

  /*
   * 좁은 화면에서는 뺀다. 이 판이 헤더 아래 상시 고정되는 폭에서, 두 줄짜리 설명문은 스크롤하는
   * 내내 자리를 먹으면서 처음 한 번 말고는 읽히지 않는다 — 대신 아래 "적용 중" 줄이 지금 걸린
   * 조건을 계속 말한다(그쪽이 상태를 말하는 진짜 채널이다).
   */
  ${media.down('tablet')} {
    display: none;
  }
`;

/**
 * 지금 걸린 조건을 **글자로** 말하는 줄. 필터가 걸렸을 때만 그린다.
 *
 * 🔴 이 줄이 이 화면의 **색 아닌 채널**이다. 칩의 선택 표시는 (테두리·면·굵기)지만 그중 두 개가
 * 색이고, 굵기 하나만으로는 "무엇을 골랐는지"를 멀리서 알 수 없다. 조건을 문장으로 다시 쓰면
 * 색을 못 보는 사용자도, 칩 줄을 스크롤로 지나친 사용자도 상태를 잃지 않는다.
 */
export const ActiveRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  min-width: 0;

  ${media.down('tablet')} {
    padding-top: ${space[2]};
  }
`;

export const ActiveBadge = styled.span`
  flex: 0 0 auto;
  padding: 1px ${space[2]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

export const ActiveText = styled.span`
  min-width: 0;
  flex: 1 1 auto;
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  overflow-wrap: anywhere;
`;

/**
 * 종목 검색 한 줄(2026-08-07 사용자 요청).
 *
 * 🔴 **세 칩 축보다 위에 선다.** 검색은 "찾는 것이 정해졌을 때" 쓰는 축이라 목적이 다르고,
 * 칩 사이에 끼우면 사다리 축들 사이에서 성격이 다른 입력이 하나 섞여 읽는 순서가 끊긴다.
 * ⚠ 아래 얇은 경계선이 "여기까지 검색, 아래는 조건"을 가른다 — 판을 하나 더 만들지 않고 가른다.
 */
export const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
  min-width: 0;

  /* 고정된 판에서는 줄 사이 여백이 그대로 높이다 — 가르는 선은 남기고 여백만 줄인다. */
  ${media.down('tablet')} {
    padding-bottom: ${space[2]};
  }
`;

/**
 * 입력과 아이콘을 한 상자에 담는다.
 *
 * 🔴 `min-width: 0` — 이 상자는 flex 아이템이고 안에 input 이 있다. 둘 다 기본 최소 폭이
 * min-content 라, 없으면 좁은 화면에서 상자가 안 줄고 **페이지에 가로 스크롤**이 생긴다
 * (랜딩 검색창에서 실제로 겪은 사고 · 2026-08-07).
 */
export const SearchField = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  flex: 1;
  min-width: 0;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  color: ${color.textMuted};

  /* 포커스 링은 **상자가** 받는다 — 안의 input 이 받으면 아이콘 밖으로 링이 어긋나 그려진다. */
  &:focus-within {
    border-color: ${color.brand};
    box-shadow: 0 0 0 3px ${color.focusRing};
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  padding: ${space[2]} 0;
  color: ${color.text};
  font-size: ${font.size.sm};

  &::placeholder {
    color: ${color.textMuted};
  }

  /* 검색 타입이 브라우저마다 붙이는 기본 지우기 버튼을 없앤다 — 우리 버튼과 둘이 서면 혼란스럽다. */
  &::-webkit-search-cancel-button {
    appearance: none;
  }
`;

/** 지우기 버튼. 입력이 있을 때만 그린다 — 늘 떠 있으면 누를 것이 없는 버튼이 자리를 차지한다. */
export const SearchClear = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border: 0;
  padding: ${space[1]};
  border-radius: ${radius.pill};
  background: transparent;
  color: ${color.textMuted};
  cursor: pointer;

  &:hover {
    color: ${color.text};
    background: ${color.surfaceHover};
  }
`;
