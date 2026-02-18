import {
  CAPTURE_PADDING_X,
  CAPTURE_PADDING_Y,
  DESKTOP_WINDOW_WIDTH,
  MAX_CANVAS_AREA,
  MAX_CANVAS_EDGE
} from './constants';
import type { CaptureContext } from './types';

export const createCaptureContext = (): CaptureContext => {
  const root = document.getElementById('root') as HTMLElement | null;
  if (!root) throw new Error('캡처 대상(root)을 찾을 수 없습니다.');

  const docEl = document.documentElement;
  const body = document.body;
  const contentLayoutEl = root.querySelector<HTMLElement>('[data-capture-role="content-layout"]');
  const contentLayoutWidth = contentLayoutEl
    ? Math.max(contentLayoutEl.scrollWidth, Math.ceil(contentLayoutEl.getBoundingClientRect().width))
    : 0;
  const layoutWidth = Math.max(DESKTOP_WINDOW_WIDTH, contentLayoutWidth);
  const fullHeight = Math.max(root.scrollHeight, body.scrollHeight, docEl.scrollHeight, docEl.clientHeight, 900);
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

