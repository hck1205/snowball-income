import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 탭 — 세그먼트(칩) 스타일.
 *
 * 활성 탭만 강조되고 비활성은 밋밋해 "누를 수 있는지" 읽기 어려웠다. 그래서 **모든 탭에** 은은한
 * 배경 + 1px 테두리를 주는 칩 형태로 바꿨다:
 *  - 비활성: `surfaceMuted` 배경 + `border` 테두리 + `textSecondary` (조각처럼 보이되 차분하게)
 *  - 활성: 브랜드 틴트(`brandSubtle` 배경 + `brandBorder` + `brandText`)로 확실히 구분
 *  - 아이콘은 `currentColor`라 활성 탭에선 브랜드 액센트 색을 자연스럽게 따른다
 *  - 라이트/다크 모두 semantic 토큰으로 대비가 유지되고, 가로 스크롤에도 깨지지 않는다
 */

export const TabList = styled.div`
  display: flex;
  align-items: stretch;
  gap: ${space[2]};
  /* 공유 트랙 없음 — 활성/비활성은 칩(배경·테두리·텍스트)과 활성 탭 자체의 하단 리본으로 구분한다. */
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const TabButton = styled.button<{ active?: boolean }>`
  position: relative;
  flex: 0 0 auto;
  /* 아이콘(선택) + 라벨을 가로로 정렬한다. 라벨만 있을 땐 gap이 관여하지 않아 기존과 동일하다. */
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  /* 비활성도 은은한 배경+테두리로 '조각'처럼. 활성은 브랜드 틴트로 확실히 구분. */
  border: 1px solid ${({ active }) => (active ? color.brandBorder : color.border)};
  background: ${({ active }) => (active ? color.brandSubtle : color.surfaceMuted)};
  color: ${({ active }) => (active ? color.brandText : color.textSecondary)};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[4]};
  min-height: 40px;
  font-family: inherit;
  font-size: ${font.size.sm};
  font-weight: ${({ active }) => (active ? font.weight.bold : font.weight.medium)};
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
  transition: color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    background-color ${motion.fast} ${motion.ease};

  /* 활성 탭에만 하단 오로라 리본(표시용 gradient-aurora — brand-subtle 위 stop 최저 대비 3.40:1). */
  ${({ active }) =>
    active
      ? `
    &::after {
      content: '';
      position: absolute;
      left: 10px;
      right: 10px;
      bottom: 5px;
      height: 2px;
      border-radius: ${radius.pill};
      background: ${color.gradientAurora};
    }
  `
      : ''}

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
    background: ${({ active }) => (active ? color.brandSubtleHover : color.surfaceHover)};
    color: ${({ active }) => (active ? color.brandText : color.text)};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 탭 아이콘은 라벨 크기에 맞춘다(라벨 없이 아이콘만 쓰는 탭이 없어 1em 기준으로 충분). */
  svg {
    width: 1.15em;
    height: 1.15em;
    flex: 0 0 auto;
  }
`;
