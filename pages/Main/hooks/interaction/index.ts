/** 캡처 **마커 상수와 대기 유틸**만 — html2canvas 는 이 모듈 안에서 동적 import 라 안전하다. */
export * from './htmlCapture';
export * from './useLongPress';
/**
 * `pdfReportPipeline`·`resultCapturePipeline`은 **일부러 re-export하지 않는다** — jspdf·html2canvas·echarts를
 * 끌고 오므로 배럴이 정적으로 참조하면 초기 번들에 딸려 들어간다.
 * `usePdfReport`·`useResultCapture`가 `await import()`로만 부른다(실패 사유 어휘만 정적으로 공유).
 */
export * from './usePdfReport';
export * from './resultCaptureError';
export * from './useResultCapture';
export * from './useStickyHeroAction';
