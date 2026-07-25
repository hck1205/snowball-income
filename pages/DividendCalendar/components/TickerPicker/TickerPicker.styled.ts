import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/** 티커 열 고정폭 — 목록 전체의 정렬선을 하나로 만드는 기준값. */
const TICKER_COLUMN = '58px';

/** 드로어의 세로 공간을 채우는 컬럼 — 검색·메타·칩은 고정, 결과 목록이 남은 높이를 전부 먹는다. */
export const PickerRoot = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  min-width: 0;
  min-height: 0;
`;

export const SearchRow = styled.div`
  position: relative;
  display: block;
`;

export const SearchIconSlot = styled.span`
  position: absolute;
  top: 50%;
  left: ${space[3]};
  transform: translateY(-50%);
  display: inline-flex;
  color: ${color.textMuted};
  pointer-events: none;
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  box-sizing: border-box;
  padding: 0 ${space[3]} 0 36px;
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};
  font-family: inherit;
  transition: border-color ${motion.fast} ${motion.ease};

  &::placeholder {
    color: ${color.textMuted};
  }

  &:focus {
    border-color: ${color.brand};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const PickerMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  min-height: 20px;
`;

export const ResultCount = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  ${font.numeric}
`;

export const ClearButton = styled.button`
  border: 0;
  background: transparent;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const SelectedChipList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
`;

export const SelectedChipItem = styled.li`
  display: inline-flex;
`;

/**
 * 한 줄에 한 종목(사용자 결정 2026-07-25 — 2열은 되돌렸다).
 * 높이는 드로어가 준다 — 고정 max-height 없이 남은 세로를 전부 채운 뒤 여기서만 스크롤한다.
 * 줄 사이는 **보더가 아니라 간격**으로 가른다(촘촘한 구분선은 목록을 빽빽하게 만든다).
 */
export const ResultList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1 1 auto;
  display: grid;
  grid-auto-rows: max-content;
  gap: ${space[1]};
  min-height: 120px;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

export const ResultItem = styled.li`
  min-width: 0;
`;

/**
 * 결과 한 줄. 선택 여부는 `aria-pressed`가 말하고, 색은 그것을 눈으로 반복할 뿐이다.
 * 선택 불가 종목은 `disabled` 대신 `aria-disabled` — 스크린리더가 건너뛰지 않고 이유를 읽게 한다.
 */
export const ResultButton = styled.button<{ $selected: boolean; $disabled: boolean }>`
  width: 100%;
  /*
   * 모든 줄이 **같은 높이·같은 안쪽 여백**이다(사용자 최종 결정 2026-07-25 — 밀도보다 가독이 먼저).
   * 46px 는 터치 타깃(44px) 위에서 리듬이 흔들리지 않는 값이다.
   */
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: ${space[3]};
  text-align: left;
  padding: ${space[2]} ${space[3]};
  border: 0;
  border-radius: ${radius.sm};
  background: ${({ $selected }) => ($selected ? color.brandSubtle : 'transparent')};
  box-shadow: ${({ $selected }) => ($selected ? `inset 2px 0 0 ${color.brand}` : 'none')};
  color: ${({ $selected, $disabled }) =>
    $disabled ? color.textMuted : $selected ? color.brandText : color.text};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  font-family: inherit;
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $selected, $disabled }) =>
      $disabled ? 'transparent' : $selected ? color.brandSubtleHover : color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

/** 티커 열은 고정폭 — 줄마다 한글명·배지가 같은 세로선에서 시작한다(들쭉날쭉하면 스캔이 안 된다). */
export const ResultTicker = styled.span`
  flex: 0 0 ${TICKER_COLUMN};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

export const ResultName = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NoResultText = styled.p`
  margin: 0;
  padding: ${space[3]};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;
