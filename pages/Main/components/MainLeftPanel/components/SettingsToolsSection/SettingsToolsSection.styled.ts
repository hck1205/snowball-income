import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space, zIndex } from '@/shared/styles';

/**
 * 도구 줄. **전폭 버튼을 쓰지 않는다** — 전폭 고스트 버튼은 드로어 안에서 빈 입력칸으로 오독됐다
 * (2026-07-31 실측 진단). 내용 폭 버튼이 왼쪽에 앉고 오른쪽은 비워 둔다.
 */
export const ToolRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
`;

/**
 * 도구 버튼(공유). 드물게 쓰는 동작이라 면·테두리 모두 담백하게 두고, 강조는 hover 에서만 든다.
 * 구 `TickerQuickActionButton`(전폭 그리드 셀)의 후신이고 폭만 내용 폭으로 바뀌었다.
 */
export const ToolButton = styled.button`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  min-height: 36px;
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  font-family: inherit;
  line-height: 1.1;
  cursor: pointer;
  touch-action: manipulation;
  transition:
    background-color ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }

  &:disabled {
    cursor: progress;
    opacity: 0.6;
  }

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

/** 공유 링크 복사 토스트. 배경/글자색은 토큰(다크에서도 안전). */
export const ShareToast = styled.div`
  position: fixed;
  top: ${space[4]};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${zIndex.tooltip};
  background: ${color.text};
  color: ${color.surface};
  border-radius: ${radius.sm};
  padding: ${space[3]} ${space[4]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  box-shadow: ${shadow.e3};
`;
