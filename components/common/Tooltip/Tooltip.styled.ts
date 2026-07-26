import styled from '@emotion/styled';
import { color, font, radius, shadow, space, zIndex } from '@/shared/styles';

/** 트리거를 감싸는 앵커 — 말풍선의 컨테이닝 블록이다. 레이아웃에 개입하지 않는다. */
export const TooltipRoot = styled.span`
  position: relative;
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
`;

/**
 * 말풍선. 트리거 위 중앙. 인버스 배경(text/textInverse)이라 어느 테마에서든 본문과 분리돼 보인다.
 * 화살표는 그리지 않는다 — 트리거 바로 위 6px라 소속이 헷갈릴 거리가 아니다.
 */
export const TooltipBubble = styled.span`
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: ${zIndex.tooltip};
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  line-height: 1.5;
  white-space: nowrap;
  color: ${color.textInverse};
  background: ${color.text};
  box-shadow: ${shadow.e2};
  pointer-events: none;
`;
