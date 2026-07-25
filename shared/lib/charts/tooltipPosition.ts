const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * ECharts `tooltip.position` 콜백 — 커서 **위쪽**에 가운데 정렬로 띄우되, 뷰포트 밖으로
 * 넘치면 아래로 뒤집고 좌우로도 가둔다(`confine`만으로는 잘린 위치에 붙는다).
 *
 * 옵션 빌더가 여러 레이어(pages 차트 유틸 / 이 모듈)로 나뉘어도 툴팁 거동은 하나여야 하므로
 * 여기가 단일 소유자다.
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
    clamp(centeredX, xPadding, viewWidth - contentWidth - xPadding),
    clamp(nextY, yPadding, viewHeight - contentHeight - yPadding)
  ];
};
