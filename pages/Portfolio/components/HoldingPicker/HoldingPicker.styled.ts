import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/** 티커 열 고정폭 — 목록 전체의 정렬선을 하나로 만드는 기준값(캘린더 피커와 같은 값). */
const TICKER_COLUMN = '58px';

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

/** 시각 라벨 없이 아이콘 + placeholder 로 읽히게 하고, 접근성 이름은 `aria-label` 이 책임진다. */
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

export const ResultCount = styled.p`
  margin: 0;
  min-height: 20px;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  ${font.numeric}
`;

/** 한 줄에 한 종목. 줄 사이는 보더가 아니라 간격으로 가른다(촘촘한 구분선은 목록을 빽빽하게 만든다). */
export const ResultList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1 1 auto;
  display: grid;
  grid-auto-rows: max-content;
  gap: ${space[1]};
  min-height: 120px;
`;

export const ResultItem = styled.li`
  min-width: 0;
`;

/**
 * 결과 한 줄은 **토글이 아니라 액션 버튼**이다(`aria-pressed` 미사용).
 *
 * 캘린더의 선택은 "표시 필터"라 해제 비용이 0이지만, 여기서 해제는 **사용자가 입력한 수량이 사라지는
 * 삭제**다. 파괴적 동작을 드로어 뒤에 숨기지 않으려고 행에서는 추가만 하고, 이미 보유 중이면
 * "수량 수정하기"로 그 행에 데려다 준다. `aria-pressed` 를 달고 해제되지 않게 하는 것은
 * "토글이라 말하고 토글하지 않는" 접근성 거짓말이라 하지 않는다.
 */
export const ResultButton = styled.button<{ $held: boolean }>`
  width: 100%;
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: ${space[3]};
  text-align: left;
  padding: ${space[2]} ${space[3]};
  border: 0;
  border-radius: ${radius.sm};
  background: ${({ $held }) => ($held ? color.surfaceSunken : 'transparent')};
  color: ${color.text};
  cursor: pointer;
  font-family: inherit;
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $held }) => ($held ? color.surfaceSunken : color.surfaceHover)};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

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

/** 보유 중 표식 — 색이 아니라 단어가 상태를 말한다. */
export const HeldBadge = styled.span`
  flex: 0 0 auto;
  padding: 0 ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

export const NoResultText = styled.p`
  margin: 0;
  padding: ${space[3]};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;
