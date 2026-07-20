import type { SnowballReport } from '@/shared/lib/snowball';

/** 리포트 안에 심는 차트 한 장 — ECharts `getDataURL` 결과(PNG data URL). */
export type PdfReportChartImage = {
  /** `data:image/png;base64,...` */
  src: string;
  /** 스크린리더/대체 텍스트 (차트는 이미지라 반드시 의미를 문장으로 남긴다). */
  alt: string;
};

/** 문서가 그릴 차트 3종. 만들지 못한 차트는 null → 해당 블록을 통째로 생략한다. */
export type PdfReportCharts = {
  allocationPie: PdfReportChartImage | null;
  yearlyTrend: PdfReportChartImage | null;
  monthlyDividend: PdfReportChartImage | null;
};

/**
 * 전제표의 셀 한 칸(라벨 + 이미 포맷된 값).
 *
 * 조건부 항목을 `<tr>` 뭉치로 분기하지 않고 **평평한 목록**으로 다루기 위한 형태다 —
 * 조건이 둘 이상 겹치면 같은 항목이 중복 인쇄되거나 누락되는 조합 버그가 생긴다.
 */
export type AssumptionCell = {
  label: string;
  value: string;
};

export type PdfReportDocumentProps = {
  report: SnowballReport;
  /** 시나리오 탭 이름(비면 '내 포트폴리오'로 대체된다). */
  scenarioName: string;
  /** 생성 시각 — 표지에 찍힌다. */
  generatedAt: Date;
  charts: PdfReportCharts;
  /**
   * 인쇄용(라이트 고정) CSS 커스텀 프로퍼티 맵 — `{ '--sb-bg': '#fff', ... }`.
   *
   * `<style>` 태그가 아니라 **각 페이지의 인라인 style**로 심는다. html2canvas는 문서를 복제해
   * 렌더하는데, 인라인 스타일은 어떤 복제 전략에서도 반드시 함께 오지만 문서 어딘가의 `<style>` 규칙은
   * 그렇다고 보장할 수 없다. 인라인이면 캡처 색이 조용히 틀어질 여지가 없다.
   */
  themeVars: Record<string, string>;
};
