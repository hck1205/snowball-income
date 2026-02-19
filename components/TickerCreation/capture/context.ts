import {
  CAPTURE_PADDING_X,
  CAPTURE_PADDING_Y,
  DESKTOP_WINDOW_WIDTH,
  MAX_CANVAS_AREA,
  MAX_CANVAS_EDGE
} from './constants';
import type { CaptureContext } from './types';

type RenderedBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const measureRenderedBounds = (root: HTMLElement): RenderedBounds => {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  let minLeft = Number.POSITIVE_INFINITY;
  let maxRight = 0;
  let minTop = Number.POSITIVE_INFINITY;
  let maxBottom = 0;

  const candidates = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  candidates.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const docLeft = rect.left + scrollX;
    const docTop = rect.top + scrollY;
    const elementRight = Math.max(docLeft + rect.width, docLeft + element.scrollWidth);
    const elementBottom = Math.max(docTop + rect.height, docTop + element.scrollHeight);
    const elementLeft = Math.min(docLeft, docLeft + element.clientLeft);
    const elementTop = Math.min(docTop, docTop + element.clientTop);

    if (Number.isFinite(elementLeft)) {
      minLeft = Math.min(minLeft, Math.floor(elementLeft));
    }
    if (Number.isFinite(elementRight)) {
      maxRight = Math.max(maxRight, Math.ceil(elementRight));
    }
    if (Number.isFinite(elementTop)) {
      minTop = Math.min(minTop, Math.floor(elementTop));
    }
    if (Number.isFinite(elementBottom)) {
      maxBottom = Math.max(maxBottom, Math.ceil(elementBottom));
    }
  });

  return {
    left: Number.isFinite(minLeft) ? minLeft : 0,
    right: maxRight,
    top: Number.isFinite(minTop) ? minTop : 0,
    bottom: maxBottom
  };
};

export const createCaptureContext = (): CaptureContext => {
  const root = document.getElementById('root') as HTMLElement | null;
  if (!root) throw new Error('캡처 대상(root)을 찾을 수 없습니다.');

  const docEl = document.documentElement;
  const body = document.body;
  const renderedBounds = measureRenderedBounds(root);
  const contentLayoutEl = root.querySelector<HTMLElement>('[data-capture-role="content-layout"]');
  const contentLayoutWidth = contentLayoutEl
    ? Math.max(contentLayoutEl.scrollWidth, Math.ceil(contentLayoutEl.getBoundingClientRect().width))
    : 0;
  const renderedWidth = Math.max(0, renderedBounds.right - renderedBounds.left);
  const renderedHeight = Math.max(0, renderedBounds.bottom - renderedBounds.top);
  const layoutWidth = Math.max(DESKTOP_WINDOW_WIDTH, contentLayoutWidth, renderedWidth);
  const fullHeight = Math.max(root.scrollHeight, body.scrollHeight, docEl.scrollHeight, docEl.clientHeight, renderedHeight, 900);
  const captureWidth = layoutWidth + CAPTURE_PADDING_X * 2;
  const captureHeight = fullHeight + CAPTURE_PADDING_Y * 2;
  const outputScale = Math.max(
    0.2,
    Math.min(1, MAX_CANVAS_EDGE / captureWidth, MAX_CANVAS_EDGE / captureHeight, Math.sqrt(MAX_CANVAS_AREA / Math.max(1, captureWidth * captureHeight)))
  );
  const outputWidth = Math.max(1, Math.floor(captureWidth * outputScale));
  const outputHeight = Math.max(1, Math.floor(captureHeight * outputScale));
  const tileMaxHeightByArea = Math.floor(MAX_CANVAS_AREA / Math.max(1, captureWidth));
  const tileMaxHeight = Math.max(512, Math.min(6000, MAX_CANVAS_EDGE - 64, tileMaxHeightByArea));

  return {
    root,
    captureTarget: body as HTMLElement,
    layoutWidth,
    captureWidth,
    captureHeight,
    outputScale,
    outputWidth,
    outputHeight,
    tileMaxHeight
  };
};
