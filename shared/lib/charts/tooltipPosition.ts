import { clamp } from '@/shared/lib/numeric';

/**
 * 한 축(가로 또는 세로)을 뷰 안에 가둔다.
 *
 * 🔴 **내용이 뷰보다 클 때가 진짜 함정이다.** 그때는 `min > max` 라 `clamp` 가 뒤집혀
 *    **음수**를 돌려주고, 툴팁이 왼쪽(또는 위)으로 튀어나가 **앞부분부터** 잘린다
 *    — 모바일 파이 툴팁이 잘리던 원인이 이것이다. 그럴 땐 0 에 붙여 적어도 앞부분
 *    (종목명·값)은 읽히게 한다. 넘치는 쪽은 뒤(오른쪽/아래)가 된다.
 */
const clampAxis = (preferred: number, contentSize: number, viewSize: number, padding: number) => {
  const max = viewSize - contentSize - padding;
  if (max < padding) return 0;
  return clamp(preferred, padding, max);
};

/**
 * ECharts `tooltip.position` 콜백 — 커서 **위쪽**에 가운데 정렬로 띄우되, 뷰포트 밖으로
 * 넘치면 아래로 뒤집고 좌우로도 가둔다(`confine`만으로는 잘린 위치에 붙는다).
 *
 * 옵션 빌더가 여러 레이어(pages 차트 유틸 / 이 모듈)로 나뉘어도 툴팁 거동은 하나여야 하므로
 * 여기가 단일 소유자다. `size.viewSize` 는 **차트 컨테이너** 크기다(뷰포트가 아니다) —
 * 좁은 화면에서 컨테이너보다 넓은 툴팁이 생기지 않도록 폭 상한은 `buildTooltipStyle` 의
 * `max-width` 가 함께 막는다.
 */
export const tooltipPosition = (
  point: number[],
  _params: unknown,
  _dom: unknown,
  _rect: unknown,
  size: { contentSize: number[]; viewSize: number[] }
): [number, number] => {
  const [x, y] = point;
  const [contentWidth, contentHeight] = size.contentSize;
  const [viewWidth, viewHeight] = size.viewSize;
  const xPadding = 10;
  const yPadding = 10;

  const centeredX = x - contentWidth / 2;
  const preferUpperY = y - contentHeight - 14;
  const fallbackLowerY = y + 14;
  const nextY = preferUpperY >= yPadding ? preferUpperY : fallbackLowerY;

  return [
    clampAxis(centeredX, contentWidth, viewWidth, xPadding),
    clampAxis(nextY, contentHeight, viewHeight, yPadding)
  ];
};
