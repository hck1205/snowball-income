export const downloadCanvasAsPng = async (canvas: HTMLCanvasElement, filePrefix: string): Promise<void> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (!nextBlob) {
        reject(new Error('캡처 이미지 생성 실패'));
        return;
      }
      resolve(nextBlob);
    }, 'image/png');
  });

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${filePrefix}-${timestamp}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
};

