import { normalizeCanvasHorizontalCenter } from './capture/align';
import { buildCloneTransformer } from './capture/cloneTransform';
import { createCaptureContext } from './capture/context';
import { downloadCanvasAsPng } from './capture/download';
import { captureStitchedCanvas } from './capture/tiling';

export const capturePage = async (): Promise<void> => {
  const context = createCaptureContext();
  const onclone = buildCloneTransformer(context);
  const stitchedCanvas = await captureStitchedCanvas({ context, onclone });
  const finalCanvas = normalizeCanvasHorizontalCenter(stitchedCanvas);
  await downloadCanvasAsPng(finalCanvas, 'snowball-capture');
};

