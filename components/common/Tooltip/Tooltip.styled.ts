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
  /*
   * 🔴 fixed + portal — 문서가 아니라 **화면**에 매인다(2026-08-07). 종전의 absolute 는
   * 조상의 overflow 에 잘렸다(표의 가로 스크롤러에 가려 안 보이던 신고의 원인). 자리는
   * Tooltip.tsx 가 트리거의 화면 좌표를 재서 인라인 style 로 넣는다 — 여기서는 정하지 마라.
   */
  position: fixed;
  /* top·left 가 트리거의 **위 변 중앙**이므로, 자기 높이만큼 위로 올려 그 위에 선다. */
  transform: translate(-50%, -100%);
  z-index: ${zIndex.tooltip};
  /*
   * 화면보다 넓어지지 않는다. 종전에는 nowrap 하나뿐이라 긴 문장이 화면을 넘겼다 —
   * 이제 폭이 차면 접힌다(짧은 툴팁은 내용만큼만 차지하므로 여전히 한 줄이다).
   */
  max-width: min(320px, calc(100vw - 16px));
  text-align: center;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  line-height: 1.5;
  color: ${color.textInverse};
  background: ${color.text};
  box-shadow: ${shadow.e2};
  pointer-events: none;
`;
