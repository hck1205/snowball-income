import { sanitizeScenarioNameForFile } from '@/pages/Main/components/PdfReportDocument';
import { ResultCaptureError } from './resultCaptureError';
import {
  RESULT_CAPTURE_ROOT_ATTRIBUTE,
  captureElementToPng,
  waitForAnimations,
  waitForElement,
  waitForFonts,
  waitForImages,
  waitForStableHeight
} from './htmlCapture';

/**
 * 결과 카드 **한 장의 이미지** 생성 파이프라인.
 *
 * 찍는 대상은 **오프스크린 캡처 프레임**(`ResultCaptureFrame`) 안의 결과 그리드다.
 *
 * 처음에는 화면에 보이는 그리드를 그 자리에서 찍었다. 그런데 카드 안의 컨테이너 쿼리
 * (`DataTable`·`PortfolioAllocation` 의 `container-type: inline-size`)가 html2canvas 의 복제 문서에서
 * 다르게 풀려 **결과물이 깨졌다**. 지금은 고정 폭·컨테이너 쿼리 없는 무대에 같은 카드를 한 번 더
 * 그려서 그쪽을 찍는다 — 카드 컴포넌트는 재사용하므로 저장본과 화면이 갈라지지 않는다.
 *
 * PDF 리포트처럼 인쇄용 문서를 **새로 작성하지는 않는다**. 다른 건 감싸는 무대뿐이다.
 * 테마도 화면 그대로다(프레임이 `var(--sb-bg)` 를 쓴다).
 *
 * html2canvas 는 `htmlCapture` 가 **동적 import** 로 부른다 — 이 모듈도 호출부(`useResultCapture`)가
 * `await import()` 로만 불러서 초기 번들에는 한 바이트도 실리지 않는다. jspdf 는 여기 오지 않는다.
 */

const pad2 = (value: number): string => String(value).padStart(2, '0');

/**
 * `HungryHippo_결과_{시나리오명}_{YYYYMMDD}.png` — PDF 리포트 파일명 규칙과 같은 어휘를 쓴다
 * (`buildPdfReportFileName`: `HungryHippo_리포트_…`). 두 다운로드가 한 제품에서 나온 것으로 읽혀야 하므로
 * 브랜드 조각·구분자·날짜 형식을 같이 간다 — 한쪽만 고치면 저장함에서 남처럼 보인다.
 *
 * ⚠ 브랜드 조각은 **공백 없이** `HungryHippo` 로 붙인다(파일명의 공백은 메일 첨부·일부 브라우저·CLI에서
 * 이름이 잘리는 원인). 시나리오 이름의 공백은 `sanitizeScenarioNameForFile` 이 `_` 로 바꾼다.
 */
export const buildResultCaptureFileName = (scenarioName: string, capturedAt: Date): string => {
  const stamp = `${capturedAt.getFullYear()}${pad2(capturedAt.getMonth() + 1)}${pad2(capturedAt.getDate())}`;
  return `HungryHippo_결과_${sanitizeScenarioNameForFile(scenarioName)}_${stamp}.png`;
};

/** 지금 테마의 배경색. 캔버스는 CSS 변수를 모르므로 계산된 값을 읽어 넘겨야 한다. */
const readThemeBackground = (): string => {
  const computed = getComputedStyle(document.documentElement).getPropertyValue('--sb-bg').trim();
  return computed.length > 0 ? computed : '#ffffff';
};

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
  /*
   * 🔴 **화면에 보이는 그리드를 그대로 찍는다.**
   *
   * 한때 고정 폭(1120px) 오프스크린 사본을 만들어 그쪽을 찍었다. 저장본을 화면 폭에서 떼어내
   * 결정적으로 만들려는 의도였는데, 결과가 계속 화면과 어긋났다 — 갓 마운트된 사본은 카드 높이가
   * 덜 자라고, 좁은 폭에서 표 글자가 찌그러지고, 차트 여백이 달라졌다. 사본을 화면에 맞추는 일은
   * 끝이 없었다.
   *
   * `modern-screenshot` 은 브라우저가 **실제로 그린 레이아웃**을 그대로 래스터라이즈하므로,
   * 살아 있는 그리드를 찍으면 정의상 "보이는 그대로"가 나온다. 저장본 폭은 사용자 화면 폭을
   * 따르게 되지만(모바일에선 좁은 그림), 그게 원래 이 기능의 요구였다.
   */
  const target = await waitForElement(`[${RESULT_CAPTURE_ROOT_ATTRIBUTE}]`);
  if (!target) throw new ResultCaptureError('target-missing');

  const backgroundColor = readThemeBackground();
  const fileName = buildResultCaptureFileName(scenarioName, capturedAt ?? new Date());

  await Promise.all([waitForImages(target), waitForFonts()]);
  /*
   * 🔴 **연출이 끝나기 전에는 찍지 않는다.** 첫 결과 등장 연출(W3)은 카드를 `opacity: 0` 에서
   * 밀어 올리는데, 그 도중에 직렬화하면 카드가 투명한 채로 그림에 박힌다(실측: 잉크 1.05% ↔ 74.67%).
   * 사용자가 결과를 보자마자 저장을 누르면 정확히 이 창에 들어간다.
   *
   * 복제 문서에서 `animation: none` 을 얹는 길도 있었지만 **버렸다**: ①결과 이미지의 래스터라이저는
   * `modern-screenshot` 이라 `html2canvas` 의 `onclone` 이 애초에 돌지 않고(그 훅은 PDF 경로 전용)
   * ②`backwards` fill 이 물고 있는 `opacity: 0` 을 선언 제거만으로 되돌릴 수 있는지가 래스터라이저
   * 구현에 달려 있어 "고쳤다고 믿는데 안 고쳐진" 형태가 된다. 살아 있는 화면이 연출을 끝내면
   * 계산값이 정의상 최종 상태라 이 대기는 래스터라이저와 무관하게 참이다.
   */
  await waitForAnimations(target);
  /*
   * 🔴 순서가 중요하다 — 폰트·이미지를 기다린 **뒤에** 높이 안정을 본다.
   * 폰트가 바뀌면 줄 수가 달라져 높이가 또 움직이기 때문이다.
   * 이 대기가 없으면 갓 마운트된 사본의 덜 자란 높이로 카드가 잘려 박제된다.
   */
  await waitForStableHeight(target);

  /*
   * 여백·배경·폭은 **판이 이미 갖고 있다**(`ResultCaptureFrame.styled`) — 여기서 또 주지 않는다.
   * 판은 무대 안에 있어 화면 밖에 있지만, 직렬화되는 것은 판 자신의 박스라 위치는 문제되지 않는다.
   */
  let blob: Blob;
  try {
    blob = await captureElementToPng(target, { backgroundColor });
  } catch {
    // 래스터라이즈 실패는 사유 어휘로 바꿔 올린다 — 호출부가 사용자에게 보여줄 문장을 고른다.
    throw new ResultCaptureError('render-failed');
  }

  downloadBlob(blob, fileName);
  return fileName;
};

export { ResultCaptureError } from './resultCaptureError';
