const detectContentBoundsX = (canvas: HTMLCanvasElement): { minX: number; maxX: number } | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let maxX = -1;
  const sampleStep = 2;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const isVisibleContent = a > 8 && (r < 248 || g < 248 || b < 248);
      if (!isVisibleContent) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }

  if (maxX < minX) return null;
  return { minX, maxX };
};

export const normalizeCanvasHorizontalCenter = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const bounds = detectContentBoundsX(canvas);
  if (!bounds) return canvas;

  const contentWidth = Math.max(1, bounds.maxX - bounds.minX + 1);
  const targetX = Math.max(0, Math.floor((canvas.width - contentWidth) / 2));
  if (targetX === bounds.minX) return canvas;

  const centered = document.createElement('canvas');
  centered.width = canvas.width;
  centered.height = canvas.height;
  const ctx = centered.getContext('2d');
  if (!ctx) throw new Error('캡처 캔버스 컨텍스트 생성 실패');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, centered.width, centered.height);
  ctx.drawImage(canvas, bounds.minX, 0, contentWidth, canvas.height, targetX, 0, contentWidth, centered.height);
  return centered;
};

