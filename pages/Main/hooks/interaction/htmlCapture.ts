/**
 * DOM → 캔버스 캡처의 **공용 저수준 계층**.
 *
 * PDF 리포트(`pdfReportPipeline`)와 결과 이미지 캡처(`resultCapturePipeline`)가 같은 함정을 만난다:
 * 이미지가 아직 안 붙은 채 찍거나, 웹폰트가 로드되기 전에 찍어 폴백 서체로 박제되거나,
 * html2canvas 를 각자 다르게 부르는 것. 그래서 **두 번째 캡처 기능을 만들면서 새 통합을 만들지 않고**
 * 기존 파이프라인이 갖고 있던 대기 로직을 여기로 끌어올려 둘이 공유한다.
 *
 * ⚠ 래스터라이저는 이 모듈 안에서 **동적 import** 로만 부른다(정적 import 하면 초기 번들이 커진다).
 * 이 모듈 자체는 의존성이 없어 정적으로 import 해도 안전하다.
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

/**
 * 대상 안에서 **돌고 있는 애니메이션·전환이 끝날 때까지** 기다린다(상한 도달 시 그냥 반환).
 *
 * 🔴 이게 없으면 **연출 도중에 찍힌 그림이 통째로 비어 나온다.** 래스터라이저는 그 순간의
 * 계산된 스타일을 복제본에 그대로 옮기는데, `animation-fill-mode: backwards` 를 쓰는 진입 연출은
 * 지연 구간에서 계산값이 `opacity: 0` 이다 — 즉 "아직 안 나타난 카드"가 **투명한 채로 직렬화**된다.
 *
 * 실측(2026-07-31, 390px · 결과 그리드 8칸 · modern-screenshot):
 * 진입 연출이 도는 중에 저장하면 PNG 의 잉크 픽셀이 **1.05%**(연출 후 대조군 74.67%)였다.
 * 연출 길이를 3초로 늘리면 0.5% — 사실상 빈 그림이다.
 *
 * ⚠ **높이 대기(`waitForStableHeight`)로는 절대 못 잡는다.** 이 연출은 `opacity`/`transform` 만
 * 바꾸고 둘 다 `scrollHeight` 에 영향이 없어서, 높이는 첫 프레임에 이미 안정돼 게이트가 열린다.
 * 그래서 "대기를 다 했는데도 빈 그림"이라는 형태로 나타난다.
 *
 * 무한 반복 애니메이션(스켈레톤 셔머·스피너)은 **기다리지 않는다** — 끝나지 않으므로 상한까지
 * 헛되이 붙잡을 뿐이다. `getAnimations` 가 없는 환경(jsdom)은 그냥 넘긴다.
 */
export const waitForAnimations = async (
  host: HTMLElement,
  { timeoutMs = 1500 }: { timeoutMs?: number } = {}
): Promise<void> => {
  if (typeof host.getAnimations !== 'function') return;

  const finite = host.getAnimations({ subtree: true }).filter((animation) => {
    const iterations = animation.effect?.getComputedTiming().iterations ?? 1;
    return Number.isFinite(iterations);
  });
  if (finite.length === 0) return;

  await Promise.race([
    // 취소된 애니메이션의 `finished` 는 reject 한다 — 캡처를 그걸로 포기하지 않는다.
    Promise.allSettled(finite.map((animation) => animation.finished)),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    })
  ]);
};

/**
 * 요소의 높이가 **더 이상 변하지 않을 때까지** 기다린다(상한 도달 시 그냥 반환).
 *
 * 🔴 이걸 안 하면 결과물이 잘린다. 캡처 프레임은 갓 마운트된 **사본**이라, 그 안의 ECharts 는
 * 아직 캔버스를 만들지 않았고 측정 기반 카드도 자기 높이를 모른다. 그 순간에 찍으면 그리드가
 * 덜 자란 높이로 행을 잡아 **카드가 박스보다 큰 상태로 박제**된다.
 *
 * 실측(2026-07-29): 화면 그리드의 행이 `317 490 435 366 410 370 322` 일 때, 방금 마운트된 캡처
 * 사본은 `322 × 7` 이었고 카드 내용은 최대 476px 을 필요로 했다 — 그 차이만큼 잘려 나갔다.
 *
 * 폴링 대신 `ResizeObserver` 를 쓰지 않는 이유: 관찰 대상이 그리드 하나가 아니라 그 안의 모든
 * 차트·표라서, "전체 높이가 몇 프레임 연속 같으면 끝" 이 훨씬 단순하고 실패에 안전하다.
 */
export const waitForStableHeight = async (
  element: HTMLElement,
  { timeoutMs = 4000, stableFrames = 3 }: { timeoutMs?: number; stableFrames?: number } = {}
): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  let previous = -1;
  let steady = 0;

  while (Date.now() < deadline) {
    await nextFrame();
    const height = element.scrollHeight;

    if (height === previous) {
      steady += 1;
      // 연속 몇 프레임 같으면 안정된 것으로 본다 — 한 프레임만 보면 렌더 사이 빈틈에 속는다.
      if (steady >= stableFrames) return;
    } else {
      steady = 0;
      previous = height;
    }
  }
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

/**
 * 캡처 전용 오프스크린 프레임의 마커.
 *
 * 캡처 중에는 결과 그리드가 **두 벌** 존재한다 — 화면에 보이는 것과 이 프레임 안의 것.
 * 파이프라인은 프레임 안쪽을 찍어야 하므로, 살아 있는 그리드와 구분할 이름이 필요하다.
 */
export const RESULT_CAPTURE_FRAME_ATTRIBUTE = 'data-result-capture-frame';

/**
 * 선택자가 DOM 에 나타날 때까지 기다린다(상한 도달 시 null).
 *
 * 캡처 프레임은 React state 로 켜지므로 `setState` 직후에는 아직 없다. 커밋·레이아웃이 끝날 때까지
 * 프레임 단위로 확인한다 — 고정 시간 `setTimeout` 은 느린 기기에서 먼저 깨고 빠른 기기에선 낭비다.
 */
export const waitForElement = async (selector: string, timeoutMs = 2000): Promise<HTMLElement | null> => {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const found = document.querySelector<HTMLElement>(selector);
    if (found) return found;
    if (Date.now() >= deadline) return null;
    await nextFrame();
  }
};

export type CaptureElementOptions = {
  /** 투명 PNG 는 뷰어에 따라 검게 합성되므로 **항상** 배경색을 준다. */
  backgroundColor: string;
  /** 기본 2 — 레티나에서도 글자가 뭉개지지 않는 최소값. */
  scale?: number;
};

/**
 * 요소 하나를 PNG Blob 으로 찍는다.
 *
 * ⚠ **왜 html2canvas 가 아닌가** — 그 라이브러리는 브라우저 엔진을 쓰지 않고 CSS 를 **자체 구현**한다.
 * 1.4.1(2022년 마지막 릴리스)이 못 그리는 것 중 이 앱이 실제로 쓰는 것만 꼽아도:
 * `display: grid`(65개 파일 · 결과 그리드 자체가 12열 grid) · `filter`(13) · `backdrop-filter`(9) ·
 * `clip-path`(6) · `color-mix()` · `:has()`. 그래서 무엇을 찍든 결과물이 무너졌다 —
 * 캡처 대상을 바꾸거나 폭을 고정해도 해결되지 않는 문제였다.
 *
 * `modern-screenshot` 은 DOM 을 SVG `<foreignObject>` 에 담아 **브라우저가 직접 래스터라이즈**한다.
 * 렌더링 주체가 브라우저이므로 grid 든 filter 든 컨테이너 쿼리든 화면과 같은 결과가 나온다.
 * ECharts 의 `<canvas>` 와 셀프호스팅 웹폰트도 이 라이브러리가 이미지·데이터URI 로 인라인한다.
 *
 * `[data-capture-exclude]` 요소는 `filter` 로 **직렬화 단계에서 건너뛴다** — 살아 있는 화면은
 * 전혀 건드리지 않는다(레이아웃이 튀거나, 실패 시 복원을 책임질 일이 없다).
 */
export const captureElementToPng = async (
  element: HTMLElement,
  { backgroundColor, scale = 2 }: CaptureElementOptions
): Promise<Blob> => {
  const { domToBlob } = await import('modern-screenshot');

  const blob = await domToBlob(element, {
    scale,
    backgroundColor,
    type: 'image/png',
    /*
     * ⚠ 폰트 임베딩은 **기본값에 맡긴다.** SVG `foreignObject` 는 이미지로 그려져 문서에 이미
     * 로드된 웹폰트를 쓸 수 없으므로 라이브러리가 인라인해야 하는데, `preferredFormat` 으로
     * 형식을 좁혔더니 결과가 더 나빠졌다(2026-07-29 실사용 확인). 근거 없이 조이지 않는다.
     */
    filter: (node) =>
      !(node instanceof Element && node.hasAttribute(CAPTURE_EXCLUDE_ATTRIBUTE))
  });

  if (!blob) throw new Error('capture-blob-empty');
  return blob;
};

export type CaptureCanvasOptions = CaptureElementOptions & {
  /** 캡처 직전, **복제된 문서**에서 한 번 더 손볼 기회. */
  onCloneElement?: (clone: HTMLElement) => void;
};

/**
 * 요소 하나를 캔버스로 찍는다 — **PDF 리포트 전용**(jsPDF 가 캔버스를 요구한다).
 *
 * ⚠ 여기만 아직 html2canvas 다. 위 `captureElementToPng` 의 경고가 그대로 적용되지만,
 * PDF 는 화면 카드가 아니라 **인쇄용으로 따로 작성한 문서**(`PdfReportDocument`)를 찍으므로
 * 문제가 덜 드러난다. 그 문서가 grid·filter 를 쓰기 시작하면 같은 방식으로 무너진다 —
 * 이미지 저장과 같은 래스터라이저로 옮기는 것이 후속 과제다.
 */
export const captureElementToCanvas = async (
  element: HTMLElement,
  { backgroundColor, scale = 2, onCloneElement }: CaptureCanvasOptions
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
