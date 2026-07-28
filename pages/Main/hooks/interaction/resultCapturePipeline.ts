import { sanitizeScenarioNameForFile } from '@/pages/Main/components/PdfReportDocument';
import { ResultCaptureError } from './resultCaptureError';
import {
  RESULT_CAPTURE_ROOT_ATTRIBUTE,
  captureElementToCanvas,
  nextFrame,
  waitForFonts,
  waitForImages
} from './htmlCapture';

/**
 * 결과 카드 **한 장의 이미지** 생성 파이프라인.
 *
 * PDF 리포트와 달리 인쇄용 문서를 새로 그리지 않는다 — 화면에 **지금 보이는 그대로**를 찍는 것이
 * 이 기능의 요구다(사용자: "해당 탭의 박스들만 모아서 사진 캡쳐"). 그래서 오프스크린 렌더도,
 * 별도 테마 토큰도 없다. 캡처 대상은 결과 그리드 하나이고 **시나리오 탭 바는 그 밖**이라 자연히 빠진다.
 *
 * html2canvas 는 `htmlCapture` 가 **동적 import** 로 부른다 — 이 모듈도 호출부(`useResultCapture`)가
 * `await import()` 로만 불러서 초기 번들에는 한 바이트도 실리지 않는다. jspdf 는 여기 오지 않는다.
 */

/** 캡처 결과물의 좌우·상하 여백(px). 카드가 화면 끝에 붙어 잘린 것처럼 보이지 않게 한다. */
const CAPTURE_PADDING = 20;

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** `스노우볼결과_{시나리오명}_{YYYYMMDD}.png` — PDF 리포트 파일명 규칙과 같은 어휘를 쓴다. */
export const buildResultCaptureFileName = (scenarioName: string, capturedAt: Date): string => {
  const stamp = `${capturedAt.getFullYear()}${pad2(capturedAt.getMonth() + 1)}${pad2(capturedAt.getDate())}`;
  return `스노우볼결과_${sanitizeScenarioNameForFile(scenarioName)}_${stamp}.png`;
};

/** 지금 테마의 배경색. 캔버스는 CSS 변수를 모르므로 계산된 값을 읽어 넘겨야 한다. */
const readThemeBackground = (): string => {
  const computed = getComputedStyle(document.documentElement).getPropertyValue('--sb-bg').trim();
  return computed.length > 0 ? computed : '#ffffff';
};

/** 캔버스 → PNG Blob. `toBlob` 이 없는(또는 실패하는) 환경은 사유를 남기고 끝낸다. */
const toPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== 'function') {
      reject(new ResultCaptureError('render-failed'));
      return;
    }

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new ResultCaptureError('render-failed'));
    }, 'image/png');
  });

/** Blob → 다운로드. object URL 은 반드시 해제한다(안 하면 탭이 살아 있는 동안 메모리를 붙든다). */
const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  /*
   * ⚠ `click()` 직후 **동기로** 해제하면 안 된다 — 다운로드 시작은 브라우저가 다음 태스크에 처리하는
   * 구현이 있어(비-Chromium) 그 전에 URL 이 죽으면 저장이 조용히 취소된다. 한 태스크만 미룬다.
   */
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export type CaptureResultImageInput = {
  scenarioName: string;
  /** 테스트에서 파일명을 고정하기 위한 주입점. */
  capturedAt?: Date;
};

/**
 * 활성 탭의 결과 카드를 한 장의 PNG로 저장한다. 실패는 `ResultCaptureError`로 던진다(무음 실패 금지).
 */
export const captureResultImage = async ({
  scenarioName,
  capturedAt
}: CaptureResultImageInput): Promise<string> => {
  const target = document.querySelector<HTMLElement>(`[${RESULT_CAPTURE_ROOT_ATTRIBUTE}]`);
  if (!target) throw new ResultCaptureError('target-missing');

  const backgroundColor = readThemeBackground();
  const fileName = buildResultCaptureFileName(scenarioName, capturedAt ?? new Date());

  await Promise.all([waitForImages(target), waitForFonts()]);
  await nextFrame();

  const canvas = await captureElementToCanvas(target, {
    backgroundColor,
    onCloneElement: (clone) => {
      /*
       * 복제본에만 손댄다(살아 있는 화면은 그대로다).
       * - `contain: layout style` 은 캡처 문서에서 불필요할 뿐 아니라 일부 브라우저에서 자식 높이
       *   계산을 가로챈다 — 복제본에선 푼다.
       * - 여백은 결과물이 "잘린 스크린샷"이 아니라 한 장의 카드처럼 보이게 한다.
       */
      clone.style.contain = 'none';
      clone.style.padding = `${CAPTURE_PADDING}px`;
      clone.style.background = backgroundColor;
    }
  });

  const blob = await toPngBlob(canvas);
  downloadBlob(blob, fileName);
  return fileName;
};

export { ResultCaptureError } from './resultCaptureError';
