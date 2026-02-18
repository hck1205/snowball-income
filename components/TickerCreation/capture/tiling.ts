import html2canvas from 'html2canvas';
import type { CaptureContext } from './types';

const createCaptureAttempts = ({
  captureWidth,
  tileHeight,
  offsetY,
  onclone
}: {
  captureWidth: number;
  tileHeight: number;
  offsetY: number;
  onclone: (doc: Document) => void;
}): Array<Parameters<typeof html2canvas>[1]> => [
  {
    backgroundColor: '#ffffff',
    useCORS: true,
    scale: 1,
    width: captureWidth,
    height: tileHeight,
    windowWidth: captureWidth,
    windowHeight: tileHeight,
    scrollX: 0,
    scrollY: -offsetY,
    imageTimeout: 0,
    logging: false,
    onclone
  },
  {
    backgroundColor: '#ffffff',
    useCORS: false,
    allowTaint: true,
    foreignObjectRendering: true,
    scale: 1,
    width: captureWidth,
    height: tileHeight,
    windowWidth: captureWidth,
    windowHeight: tileHeight,
    scrollX: 0,
    scrollY: -offsetY,
    imageTimeout: 0,
    logging: false,
    onclone
  },
  {
    backgroundColor: '#ffffff',
    useCORS: false,
    allowTaint: true,
    scale: 1,
    width: captureWidth,
    height: tileHeight,
    windowWidth: captureWidth,
    windowHeight: tileHeight,
    scrollX: 0,
    scrollY: -offsetY,
    imageTimeout: 0,
    logging: false,
    onclone
  }
];

const captureTile = async ({
  target,
  attempts
}: {
  target: HTMLElement;
  attempts: Array<Parameters<typeof html2canvas>[1]>;
}): Promise<HTMLCanvasElement> => {
  let lastError: unknown = null;
  for (const options of attempts) {
    try {
      const canvas = await html2canvas(target, options);
      if (canvas.width > 0 && canvas.height > 0) return canvas;
    } catch (error) {
      lastError = error;
    }
  }
  throw (lastError instanceof Error ? lastError : new Error('캡처 타일 생성 실패'));
};

const createBaseCanvas = (context: Pick<CaptureContext, 'outputWidth' | 'outputHeight'>): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = context.outputWidth;
  canvas.height = context.outputHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('캡처 캔버스 컨텍스트 생성 실패');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, context.outputWidth, context.outputHeight);
  return canvas;
};

export const captureStitchedCanvas = async ({
  context,
  onclone
}: {
  context: CaptureContext;
  onclone: (doc: Document) => void;
}): Promise<HTMLCanvasElement> => {
  const stitchedCanvas = createBaseCanvas(context);
  const stitchedCtx = stitchedCanvas.getContext('2d');
  if (!stitchedCtx) throw new Error('캡처 캔버스 컨텍스트 생성 실패');

  let offsetY = 0;
  while (offsetY < context.captureHeight) {
    const tileHeight = Math.min(context.tileMaxHeight, context.captureHeight - offsetY);
    const attempts = createCaptureAttempts({
      captureWidth: context.captureWidth,
      tileHeight,
      offsetY,
      onclone
    });
    const tileCanvas = await captureTile({ target: context.captureTarget, attempts });

    const targetY = Math.round(offsetY * context.outputScale);
    const targetYEnd = Math.round((offsetY + tileHeight) * context.outputScale);
    const targetH = Math.max(1, targetYEnd - targetY);
    stitchedCtx.drawImage(tileCanvas, 0, 0, tileCanvas.width, tileCanvas.height, 0, targetY, context.outputWidth, targetH);
    offsetY += tileHeight;
  }

  return stitchedCanvas;
};

