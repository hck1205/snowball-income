import { cloneElement, useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { TooltipProps } from './Tooltip.types';
import { TooltipBubble, TooltipRoot } from './Tooltip.styled';

/**
 * 커스텀 툴팁 — native `title`을 쓰지 않는 이유: 뜨기까지의 지연을 제어할 수 없고,
 * 터치 환경에서는 아예 뜨지 않으며, 테마와 무관한 OS 모양으로 그려진다.
 *
 * 열림 규칙: hover·focus로 열리고, **클릭은 고정 토글**이다(터치의 유일한 경로이자,
 * 마우스가 떠나도 붙잡아 두는 수단). Escape는 항상 닫는다.
 * 말풍선은 열려 있을 때만 렌더하고, 그동안 트리거에 `aria-describedby`를 건다.
 */
export default function Tooltip({ content, children }: TooltipProps) {
  const bubbleId = useId();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && open) {
      setHovered(false);
      setPinned(false);
    }
  };

  return (
    <TooltipRoot
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => {
        setHovered(false);
        setPinned(false);
      }}
      onClick={() => setPinned((prev) => !prev)}
      onKeyDown={handleKeyDown}
    >
      {cloneElement(children, open ? { 'aria-describedby': bubbleId } : undefined)}
      {open ? (
        <TooltipBubble id={bubbleId} role="tooltip">
          {content}
        </TooltipBubble>
      ) : null}
    </TooltipRoot>
  );
}
