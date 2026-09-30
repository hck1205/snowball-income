import styled from '@emotion/styled';
import { color, font, inputSurface, radius, space, subtleScrollbar } from '@/shared/styles';

/* OverlapPicker 의 스타일 — 검색창 · 스크롤 목록 · 후보 줄. 규율은 ../../styled/index.ts 머리말. */

export const SearchInput = styled.input`
  ${inputSurface}

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }
`;

export const PickerHint = styled.p`
  margin: 0;
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

export const ListTitle = styled.h3`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.12em;
`;

export const CandidateList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
`;

export const CandidateItem = styled.li<{ $inBasket: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[1]} ${space[3]};
  padding: ${space[2]} ${space[2]} ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${({ $inBasket }) => ($inBasket ? color.surfaceSunken : color.surface)};
  min-width: 0;
`;

export const CandidateBody = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

export const CandidateTicker = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.01em;
  ${font.numeric}
`;

export const CandidateName = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.tight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

export const CandidateActions = styled.div`
  display: grid;
  justify-items: end;
  gap: ${space[1]};
`;

/**
 * "담으면 몇 %p" 미리보기. 늘면 warning 계열, 줄거나 그대로면 중립 — 부호는 글자로 함께 붙는다.
 * 높이 20px 안팎의 알약이라 면이 아니다(tintscan 면 판정 밖).
 */
export const PreviewChip = styled.span<{ $tone: 'up' | 'down' | 'flat' }>`
  padding: 1px ${space[2]};
  border-radius: ${radius.pill};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
  color: ${({ $tone }) => ($tone === 'up' ? color.warning : color.textSecondary)};
  background: ${({ $tone }) => ($tone === 'up' ? color.warningSurface : color.surfaceMuted)};
`;

export const UnavailableTag = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  white-space: nowrap;
`;

export const ListHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
`;

/** 필터 칩. 켜짐은 면색 **과** 체크 표식(글자)이 함께 말한다 — 색만으로 말하지 않는다. */
export const FilterToggle = styled.button`
  flex: none;
  padding: 3px ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  cursor: pointer;

  &[aria-pressed='true'] {
    border-color: ${color.brandBorder};
    background: ${color.brandSubtle};
    color: ${color.brandText};
  }

  &[aria-pressed='true']::before {
    content: '✓ ';
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * 목록 스크롤 영역. 화면 전체가 아니라 **이 칸이** 스크롤된다 — 모바일에서 검색이 위에 오면서 목록이 길면
 * 바구니·결론까지 내려가는 거리가 목록 길이만큼 늘기 때문이다. 스크롤 끝이 페이지로 새지 않게 막는다.
 */
export const CandidateScroller = styled.div`
  max-height: clamp(280px, 52vh, 560px);
  overflow-y: auto;
  overscroll-behavior: contain;
  margin-right: calc(-1 * ${space[1]});
  padding-right: ${space[1]};
  ${subtleScrollbar}
`;
