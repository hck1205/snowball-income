/**
 * DOM → 캔버스 캡처의 **공용 저수준 계층**.
 *
 * PDF 리포트(`pdfReportPipeline`)와 결과 이미지 캡처(`resultCapturePipeline`)가 같은 함정을 만난다:
 * 이미지가 아직 안 붙은 채 찍거나, 웹폰트가 로드되기 전에 찍어 폴백 서체로 박제되거나,
 * html2canvas 를 각자 다르게 부르는 것. 그래서 **두 번째 캡처 기능을 만들면서 새 통합을 만들지 않고**
 * 기존 파이프라인이 갖고 있던 대기 로직을 여기로 끌어올려 둘이 공유한다.
 *
 * ⚠ `html2canvas` 는 이 모듈 안에서 **동적 import** 로만 부른다(정적 import 하면 202KB 청크가 초기
 * 번들로 들어간다). 이 모듈 자체는 의존성이 없어 정적으로 import 해도 안전하다.
 */

/** 다음 페인트까지 기다린다 — 이미지(`<img src="data:...">`)와 레이아웃이 자리를 잡을 시간을 준다. */
export const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      setTimeout(resolve, 0);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

/**
 * 문서 안의 모든 `<img>`가 디코드될 때까지 기다린다.
 *
 * 차트 PNG와 앱 아이콘이 아직 로드되지 않은 상태로 캡처하면 그 자리가 **빈 칸으로 인쇄된다**.
 * 실패한 이미지는 그냥 넘긴다 — 아이콘 하나 때문에 결과물 전체를 포기하지 않는다.
 */
export const waitForImages = async (host: HTMLElement): Promise<void> => {
  const images = Array.from(host.querySelectorAll('img'));

  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );
};

/**
 * 웹폰트가 다 로드될 때까지 기다린다.
 *
 * 이 앱의 서체 4역할은 전부 **셀프호스팅 서브셋**이라 처음 그려지는 순간에도 조각이 아직 오는 중일 수
 * 있다. 그때 캡처하면 결과 이미지에 **폴백 서체가 박제**된다(화면은 곧 제대로 바뀌므로 사용자는
 * "왜 저장한 그림만 이상하지?"가 된다). `document.fonts` 가 없는 환경(jsdom·구형)은 그냥 넘긴다.
 *
 * 서브셋이 92분할이라 최악의 경우 대기가 길어질 수 있어 상한을 둔다 — 못 기다렸다고 캡처를
 * 포기하지는 않는다(폴백 서체라도 이미지는 나오는 편이 낫다).
 */
export const waitForFonts = async (timeoutMs = 3000): Promise<void> => {
  const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
  if (!fonts?.ready) return;

  await Promise.race([
    fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    })
  ]);
};

/** 캡처에서 빼는 요소의 마커. 값은 필요 없다 — 존재만으로 "이 결과물엔 넣지 않는다"는 뜻이다. */
export const CAPTURE_EXCLUDE_ATTRIBUTE = 'data-capture-exclude';

/**
 * 결과 이미지 캡처의 대상이 되는 요소의 마커(결과 그리드가 스스로 붙인다).
 * PDF 파이프라인의 `data-pdf-page` 와 같은 성격의 **DOM 계약**이다.
 *
 * 이 두 상수가 (파이프라인이 아니라) 의존성 0짜리 이 모듈에 사는 이유: 마커를 다는 쪽은 항상
 * 화면 컴포넌트라, 파이프라인 모듈에 두면 그 컴포넌트가 캡처 청크를 정적으로 끌고 온다.
 */
export const RESULT_CAPTURE_ROOT_ATTRIBUTE = 'data-result-capture-root';

export type CaptureElementOptions = {
  /** 투명 PNG 는 뷰어에 따라 검게 합성되므로 **항상** 배경색을 준다. */
  backgroundColor: string;
  /** 기본 2 — 레티나에서도 글자가 뭉개지지 않는 최소값. */
  scale?: number;
  /** 캡처 직전, **복제된 문서**에서 한 번 더 손볼 기회. */
  onCloneElement?: (clone: HTMLElement) => void;
};

/**
 * 요소 하나를 캔버스로 찍는다.
 *
 * `[data-capture-exclude]` 요소는 **복제본에서만** 제거한다 — 살아 있는 화면을 건드리면 사용자
 * 눈앞에서 레이아웃이 한 번 튀고, 캡처가 실패했을 때 복원까지 책임져야 한다. html2canvas 의
 * `onclone` 은 그 위험을 통째로 없앤다.
 */
export const captureElementToCanvas = async (
  element: HTMLElement,
  { backgroundColor, scale = 2, onCloneElement }: CaptureElementOptions
): Promise<HTMLCanvasElement> => {
  const { default: html2canvas } = await import('html2canvas');

  return html2canvas(element, {
    scale,
    backgroundColor,
    logging: false,
    useCORS: true,
    onclone: (_document, clone) => {
      clone.querySelectorAll(`[${CAPTURE_EXCLUDE_ATTRIBUTE}]`).forEach((node) => node.remove());
      onCloneElement?.(clone);
    }
  });
};
