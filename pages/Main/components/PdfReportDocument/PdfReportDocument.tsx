import { OffscreenRoot } from './PdfReportDocument.styled';
import { DEFAULT_SCENARIO_NAME, chunkYearlyRows, formatGeneratedAt } from './PdfReportDocument.utils';
import type { PdfReportDocumentProps } from './PdfReportDocument.types';
import {
  PdfAssumptionsPage,
  PdfCoverPage,
  PdfTaxPage,
  PdfTrajectoryPage,
  PdfYearlyPages
} from './components';

/**
 * PDF 리포트 **문서** — 화면이 아니라 A4 종이를 그리는 인쇄 전용 컴포넌트다.
 *
 * 계약 세 가지:
 *  1. **props만 받는다.** atom 구독도, 계산도 없다. 숫자는 전부 `buildSnowballReport`의 결과이고
 *     문장은 `PdfReportDocument.utils`의 순수 함수가 만든다.
 *  2. **페이지 div 단위로 구성한다.** 캡처 파이프라인이 `data-pdf-page` 요소를 하나씩 캔버스로 떠서
 *     jsPDF 페이지에 넣는다 — 긴 캔버스를 잘라내면 표·문장 중간이 잘리기 때문이다.
 *  3. **없는 것은 통째로 생략한다.** 목표 미설정·재투자 OFF·종합과세 미해당은 빈 박스나 "없음"이 아니라
 *     블록 자체를 그리지 않는다.
 *
 * 차트는 여기서 렌더하지 않는다 — ECharts `getDataURL`로 미리 뽑은 PNG를 `<img>`로 받는다
 * (html2canvas가 캔버스를 다시 그리는 것보다 선명하고, 사용자 뷰포트 폭과 무관하게 결정적이다).
 *
 * 이 컴포넌트는 페이지 5종을 `components/` 하위 서브컴포넌트로 위임하고 **조립만** 한다.
 * `yearlyPages`(연도별 표 청킹)만은 여기서 한 번 계산해 `PdfYearlyPages`와 `PdfTaxPage`(푸터 페이지
 * 번호 `4 + yearlyPages.length`) 양쪽에 같은 값을 넘긴다 — 두 곳에서 각자 다시 청킹하면 같은 입력에도
 * 이론상 다른 결과가 나올 여지가 생기므로, 단일 소스를 부모가 쥐고 있는다.
 */
export default function PdfReportDocument({
  report,
  scenarioName,
  generatedAt,
  charts,
  themeVars
}: PdfReportDocumentProps) {
  const title = scenarioName.trim().length > 0 ? scenarioName.trim() : DEFAULT_SCENARIO_NAME;
  const generatedLabel = formatGeneratedAt(generatedAt);

  /** 목표 달성 연차의 연도 라벨 — 표에서 그 행에만 레일·라벨을 단다. */
  const reachedYearLabel = report.target.hasTarget ? report.target.reachedYearLabel : null;
  const yearlyPages = chunkYearlyRows(report.yearly, 26, 30);

  return (
    /* 인쇄용(라이트 고정) 토큰을 이 서브트리에만 주입한다 — :root의 data-theme은 건드리지 않는다. */
    <OffscreenRoot data-pdf-report="true" style={themeVars}>
      <PdfCoverPage report={report} title={title} generatedLabel={generatedLabel} themeVars={themeVars} />
      <PdfAssumptionsPage report={report} allocationPie={charts.allocationPie} title={title} themeVars={themeVars} />
      <PdfTrajectoryPage
        report={report}
        yearlyTrend={charts.yearlyTrend}
        monthlyDividend={charts.monthlyDividend}
        title={title}
        themeVars={themeVars}
      />
      <PdfYearlyPages
        yearlyPages={yearlyPages}
        reachedYearLabel={reachedYearLabel}
        title={title}
        themeVars={themeVars}
      />
      <PdfTaxPage report={report} title={title} themeVars={themeVars} footerLabel={`${4 + yearlyPages.length}`} />
    </OffscreenRoot>
  );
}
