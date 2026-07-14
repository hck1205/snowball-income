import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 탭.
 *
 * 예전엔 활성 탭이 "카드 모서리를 아래 패널에 이어붙이는" 방식이라 경계선을 덮는 ::after 트릭이
 * 필요했고, 결과적으로 지저분했다. 활성 표시를 **밑줄(브랜드 2px)** 로 바꿨다:
 *  - 마크업이 단순해지고(경계선 덮기 불필요)
 *  - 활성 탭이 어디인지 훨씬 빨리 읽힌다
 *  - 탭이 가로 스크롤될 때도 깨지지 않는다
 */

export const TabList = styled.div`
  display: flex;
  align-items: stretch;
  gap: ${space[1]};
  border-bottom: 1px solid ${color.border};
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
  border: 0;
  /* 밑줄 자리를 항상 확보해서 활성/비활성 전환 시 텍스트가 1px 튀지 않게 한다. */
  border-bottom: 2px solid ${({ active }) => (active ? color.brand : 'transparent')};
  background: transparent;
  color: ${({ active }) => (active ? color.brandText : color.textMuted)};
  border-radius: ${radius.xs} ${radius.xs} 0 0;
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

  &:hover:not(:disabled) {
    color: ${color.text};
    background: ${color.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
