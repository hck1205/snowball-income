import { normalizeCanvasHorizontalCenter } from './capture/align';
import { buildCloneTransformer } from './capture/cloneTransform';
import { createCaptureContext } from './capture/context';
import { downloadCanvasAsPng } from './capture/download';
import { captureStitchedCanvas } from './capture/tiling';

type CaptureStyleSnapshot = {
  element: HTMLElement;
  contain: string;
  contentVisibility: string;
  containIntrinsicSize: string;
};

const forceFullRenderForCapture = (): (() => void) => {
  const root = document.getElementById('root') as HTMLElement | null;
  if (!root) return () => {};

  const candidates = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  const snapshots: CaptureStyleSnapshot[] = [];

  candidates.forEach((element) => {
    const computed = window.getComputedStyle(element);
    if (computed.contain === 'none' && computed.contentVisibility === 'visible' && computed.containIntrinsicSize === 'none') {
      return;
    }

    snapshots.push({
      element,
      contain: element.style.contain,
      contentVisibility: element.style.contentVisibility,
      containIntrinsicSize: element.style.containIntrinsicSize
    });

    element.style.contain = 'none';
    element.style.contentVisibility = 'visible';
    element.style.containIntrinsicSize = 'auto';
  });

  return () => {
    snapshots.forEach(({ element, contain, contentVisibility, containIntrinsicSize }) => {
      element.style.contain = contain;
      element.style.contentVisibility = contentVisibility;
      element.style.containIntrinsicSize = containIntrinsicSize;
    });
  };
};

const waitForStableLayout = async (): Promise<void> => {
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
};

export const capturePage = async (): Promise<void> => {
  const restoreFullRender = forceFullRenderForCapture();
  try {
    await waitForStableLayout();
    const context = createCaptureContext();
    const onclone = buildCloneTransformer(context);
    const stitchedCanvas = await captureStitchedCanvas({ context, onclone });
    const finalCanvas = normalizeCanvasHorizontalCenter(stitchedCanvas);
    await downloadCanvasAsPng(finalCanvas, 'snowball-capture');
  } finally {
    restoreFullRender();
  }
};
