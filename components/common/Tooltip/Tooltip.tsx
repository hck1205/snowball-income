import { cloneElement, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { KeyboardEvent } from 'react';
import type { TooltipProps } from './Tooltip.types';
import { TooltipBubble, TooltipRoot } from './Tooltip.styled';

/** 말풍선이 트리거 위에 뜰 때 두는 틈(px). 스타일의 `translate` 와 짝이다. */
const GAP = 6;

/** 화면 가장자리에서 최소한 이만큼은 떨어진다 — 붙으면 잘린 것처럼 보인다. */
const EDGE = 8;

/**
 * 커스텀 툴팁 — native `title`을 쓰지 않는 이유: 뜨기까지의 지연을 제어할 수 없고,
 * 터치 환경에서는 아예 뜨지 않으며, 테마와 무관한 OS 모양으로 그려진다.
 *
 * 열림 규칙: hover·focus로 열리고, **클릭은 고정 토글**이다(터치의 유일한 경로이자,
 * 마우스가 떠나도 붙잡아 두는 수단). Escape는 항상 닫는다.
 * 말풍선은 열려 있을 때만 렌더하고, 그동안 트리거에 `aria-describedby`를 건다.
 *
 * ## 🔴 말풍선은 `body` 로 **꺼내서** 그린다 (2026-08-07)
 *
 * 종전에는 트리거 옆에 `position: absolute` 로 그렸다. 그러면 **조상 중 하나라도 잘라내면
 * 말풍선이 함께 잘린다** — 사용자 신고: "의원 이름에 툴팁이 표기는 되는데 테이블에 가려져서
 * 안 보여". 원인은 표의 가로 스크롤러다: `overflow-x: auto` 는 세로축을 `visible` 로 남기지
 * 못하고 함께 스크롤 컨테이너가 되므로(CSS overflow 명세), 칸 위로 솟은 말풍선이 그 상자에
 * 잘렸다. 고정 열의 `overflow: hidden` 도 같은 일을 한다.
 *
 * z-index 로는 못 고친다 — 이건 쌓임이 아니라 **잘라내기**다. 그래서 말풍선만 portal 로
 * `body` 에 옮기고 `position: fixed` 로 트리거의 화면 좌표에 세운다. 어떤 조상이 무엇을
 * 잘라내든 상관이 없어진다.
 *
 * ⚠ fixed 는 문서가 아니라 **화면**에 매인다 → 트리거가 스크롤로 움직이면 좌표를 다시 잰다.
 *   `scroll` 을 캡처 단계로 듣는 이유가 이것이다 — 표 안쪽 스크롤러는 window 로 버블링하지 않는다.
 */
export default function Tooltip({ content, children }: TooltipProps) {
  const bubbleId = useId();
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const open = hovered || pinned;

  /**
   * 트리거의 화면 좌표 → 말풍선 자리.
   *
   * 가로는 트리거 **중앙**에 맞추되 화면 밖으로 나가지 않게 가둔다. 가두는 폭은 말풍선의 실제
   * 폭으로 계산한다 — 어림한 값으로 가두면 짧은 툴팁이 공연히 안쪽으로 밀린다.
   */
  const place = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const half = (bubbleRef.current?.offsetWidth ?? 0) / 2;
    const min = EDGE + half;
    const max = window.innerWidth - EDGE - half;
    const center = rect.left + rect.width / 2;

    setPosition({
      top: rect.top - GAP,
      /* min > max 는 말풍선이 화면보다 넓다는 뜻 — 그때는 가운데에 둔다(양쪽을 똑같이 넘긴다). */
      left: min > max ? window.innerWidth / 2 : Math.min(Math.max(center, min), max)
    });
  }, []);

  /*
   * 🔴 `useLayoutEffect` 다 — 페인트 **전에** 자리를 잡아야 한다. useEffect 였다면 말풍선이
   * 한 프레임 동안 (0, 0) 즉 화면 왼쪽 위에 번쩍 나타났다가 제자리로 뛴다.
   */
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }

    place();
    /* capture: true — 표 안쪽 스크롤러의 스크롤은 window 로 버블링하지 않는다. */
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && open) {
      setHovered(false);
      setPinned(false);
    }
  };

  const bubble =
    open && typeof document !== 'undefined'
      ? createPortal(
          <TooltipBubble
            id={bubbleId}
            role="tooltip"
            ref={bubbleRef}
            /*
             * 자리는 인라인 style 로 준다 — 매 스크롤마다 바뀌는 값이라 Emotion 클래스로 만들면
             * 스타일시트에 규칙이 끝없이 쌓인다(같은 판단을 이 레포의 차트 색 주입이 이미 쓴다).
             * 첫 렌더에서는 폭을 몰라 자리도 모른다 → 그 한 프레임만 숨긴다(깜빡임 방지).
             */
            style={
              position === null
                ? { visibility: 'hidden', top: 0, left: 0 }
                : { top: position.top, left: position.left }
            }
          >
            {content}
          </TooltipBubble>,
          document.body
        )
      : null;

  return (
    <TooltipRoot
      ref={anchorRef}
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
      {bubble}
    </TooltipRoot>
  );
}
