import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { flushSync } from 'react-dom';
import type { EChartsOption } from 'echarts';
import { buildSnowballReport } from '@/shared/lib/snowball';
import type { SnowballReport } from '@/shared/lib/snowball';
import { YEARLY_SERIES_ORDER } from '@/shared/constants';
import type { YearlySeriesKey } from '@/shared/constants';
import { getPrintChartTheme, getPrintThemeTokens } from '@/shared/styles';
import type { ChartTheme } from '@/shared/styles';
import { formatApproxKRW } from '@/shared/utils';
import { PdfReportError } from './pdfReportError';
import PdfReportDocument, { buildPdfReportFileName } from '@/pages/Main/components/PdfReportDocument';
import type { PdfReportCharts } from '@/pages/Main/components/PdfReportDocument';
import {
  buildAllocationPieOption,
  buildRecentCashflowBarOption,
  buildYearlyResultBarOption
} from '@/pages/Main/utils';
import type { NormalizedAllocationItem } from '@/pages/Main/utils';

/**
 * PDF 리포트 **생성 파이프라인** — 무거운 의존성(jspdf · html2canvas · echarts · react-dom/client)을
 * 전부 여기에 가둔다. 호출부(`usePdfReport`)는 이 모듈을 `await import()`로만 불러오므로
 * 초기 번들에는 한 바이트도 실리지 않는다.
 *
 * 파이프라인:
 *   payload → `buildSnowballReport`(순수 수치 모델)
 *           → 차트 3종을 **오프스크린 ECharts 인스턴스**에서 `getDataURL`로 PNG 추출
 *           → 인쇄 전용 문서를 오프스크린에 마운트
 *           → 페이지 div 하나씩 html2canvas → jsPDF `addImage`/`addPage`
 *           → `doc.save(파일명)`
 *
 * 왜 차트를 html2canvas에 맡기지 않는가: ECharts는 캔버스라 html2canvas가 다시 그릴 수 없고,
 * `getDataURL({ pixelRatio: 2 })`가 더 선명하다. 게다가 오프스크린 고정 크기(960×420 등)에서 뽑으므로
 * **사용자 뷰포트 폭(모바일 360px)과 무관하게 항상 같은 종횡비·품질**이 나온다.
 */

/** A4 96dpi 픽셀 — 문서 스타일(PAGE_WIDTH_PX)과 반드시 같아야 한다. */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

const YEARLY_CHART_SIZE = { width: 960, height: 420 };
const MONTHLY_CHART_SIZE = { width: 960, height: 370 };
const PIE_CHART_SIZE = { width: 520, height: 520 };

export type GeneratePdfReportInput = {
  /** `{ portfolio, investmentSettings }` — 커뮤니티 요약과 **완전히 같은** payload. */
  payload: unknown;
  /** 파이 차트용 정규화 비중(대시보드와 같은 값). */
  normalizedAllocation: NormalizedAllocationItem[];
  scenarioName: string;
  /** 현재 팔레트 프리셋 id — 이 프리셋의 **라이트** 토큰으로 인쇄한다. */
  presetId: string;
  showPortfolioDividendCenter: boolean;
  /** 테스트에서 시각을 고정하기 위한 주입점. */
  generatedAt?: Date;
};

/**
 * 실패 사유는 `pdfReportError.ts`(의존성 0)가 소유한다 — UI가 사유를 읽으려고 이 모듈을 정적으로
 * import하면 jspdf·html2canvas가 초기 번들로 새어 나가기 때문이다. 여기서는 던지기만 한다.
 */
export { PdfReportError } from './pdfReportError';

const ALL_YEARLY_SERIES: Record<YearlySeriesKey, boolean> = YEARLY_SERIES_ORDER.reduce(
  (acc, key) => ({ ...acc, [key]: true }),
  {} as Record<YearlySeriesKey, boolean>
);

/**
 * 토큰 맵 → 인라인 CSS 커스텀 프로퍼티 맵(`{ '--sb-bg': '#fff' }`).
 * `<style>` 규칙이 아니라 인라인으로 심어야 html2canvas의 문서 복제에서도 색이 반드시 따라온다.
 */
const toThemeVars = (tokens: Record<string, string>): Record<string, string> =>
  Object.entries(tokens).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[`--sb-${key}`] = value;
    return acc;
  }, {});

/** 오프스크린 컨테이너 하나 만들고 콜백에 넘긴 뒤 반드시 정리한다. */
const withOffscreenElement = async <T>(
  width: number,
  height: number,
  run: (element: HTMLDivElement) => Promise<T> | T
): Promise<T> => {
  const element = document.createElement('div');
  element.style.position = 'fixed';
  element.style.left = '-99999px';
  element.style.top = '0';
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  document.body.appendChild(element);

  try {
    return await run(element);
  } finally {
    element.remove();
  }
};

/**
 * ECharts 옵션 → PNG data URL.
 *
 * `backgroundColor`를 반드시 넘긴다 — 생략하면 투명 PNG가 되고, 일부 PDF 뷰어가 이를
 * 검은 배경으로 합성해 차트가 통째로 까맣게 나온다.
 */
const renderChartDataUrl = async (
  option: EChartsOption,
  size: { width: number; height: number },
  backgroundColor: string
): Promise<string> => {
  const echarts = await import('echarts');

  return withOffscreenElement(size.width, size.height, (element) => {
    const chart = echarts.init(element, undefined, {
      renderer: 'canvas',
      width: size.width,
      height: size.height
    });

    try {
      // animation:false — 즉시 최종 프레임을 그려야 바로 뽑을 수 있다.
      chart.setOption({ ...option, animation: false });
      return chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor });
    } finally {
      chart.dispose();
    }
  });
};

/**
 * 마지막 12개월 캘린더 → 대시보드 월별 차트와 **같은 빌더**가 먹을 수 있는 형태.
 * 종목별 분해가 아니라 합계 1시리즈다(리포트는 "언제 얼마가 들어오나"만 말하면 된다).
 */
const toMonthlySeries = (report: SnowballReport, theme: ChartTheme) => ({
  months: report.finalYearCalendar.map((item) => `${item.month}월`),
  series: [
    {
      name: '세후 배당',
      data: report.finalYearCalendar.map((item) => item.amount),
      color: theme.series[0]
    }
  ]
});

const buildCharts = async (
  report: SnowballReport,
  input: GeneratePdfReportInput,
  theme: ChartTheme,
  surface: string
): Promise<PdfReportCharts> => {
  const pieOption = buildAllocationPieOption({
    normalizedAllocation: input.normalizedAllocation,
    showPortfolioDividendCenter: input.showPortfolioDividendCenter,
    finalMonthlyAverageDividend: report.outcome.finalMonthlyAverageDividend,
    theme
  });

  const yearlyOption = buildYearlyResultBarOption({
    tableRows: report.yearly,
    visibleYearlySeries: ALL_YEARLY_SERIES,
    isYearlyAreaFillOn: true,
    theme
  });

  const monthlyOption = buildRecentCashflowBarOption(toMonthlySeries(report, theme), theme);

  const [allocationPie, yearlyTrend, monthlyDividend] = await Promise.all([
    pieOption ? renderChartDataUrl(pieOption, PIE_CHART_SIZE, surface) : Promise.resolve(null),
    renderChartDataUrl(yearlyOption, YEARLY_CHART_SIZE, surface),
    renderChartDataUrl(monthlyOption, MONTHLY_CHART_SIZE, surface)
  ]);

  return {
    allocationPie: allocationPie
      ? {
          src: allocationPie,
          alt: `종목별 배분 비중 — ${input.normalizedAllocation
            .map((item) => `${item.profile.ticker} ${(item.weight * 100).toFixed(1)}%`)
            .join(', ')}`
        }
      : null,
    yearlyTrend: {
      src: yearlyTrend,
      alt:
        `연도별 자산·배당 추이 — 최종 자산 ${formatApproxKRW(report.outcome.finalAssetValue)}, ` +
        `마지막 해 연 배당 ${formatApproxKRW(report.outcome.finalAnnualDividend)}`
    },
    monthlyDividend: {
      src: monthlyDividend,
      alt: `마지막 12개월 실지급 배당 — ${report.finalYearCalendar
        .filter((item) => item.amount > 0)
        .map((item) => `${item.month}월 ${formatApproxKRW(item.amount)}`)
        .join(', ')}`
    }
  };
};

/** 다음 페인트까지 기다린다 — 이미지(`<img src="data:...">`)와 폰트가 자리를 잡을 시간을 준다. */
const nextFrame = (): Promise<void> =>
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
 * 실패한 이미지는 그냥 넘긴다 — 아이콘 하나 때문에 리포트 전체를 포기하지 않는다.
 */
const waitForImages = async (host: HTMLElement): Promise<void> => {
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

/** 오프스크린 문서의 페이지 div들을 캡처해 A4 PDF로 저장한다. */
const exportPages = async (pages: HTMLElement[], fileName: string, backgroundColor: string): Promise<void> => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let index = 0; index < pages.length; index += 1) {
    // 페이지 단위 순차 캡처 — 병렬로 돌리면 html2canvas가 같은 문서를 동시에 복제하며 메모리가 튄다.
    // eslint-disable-next-line no-await-in-loop
    const canvas = await html2canvas(pages[index], {
      scale: 2,
      backgroundColor,
      logging: false,
      useCORS: true
    });

    if (index > 0) doc.addPage();
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
  }

  doc.save(fileName);
};

/**
 * 리포트 PDF를 만들어 다운로드시킨다. 실패는 `PdfReportError`로 던진다(무음 실패 금지).
 * 성공/실패와 무관하게 오프스크린 DOM과 React 루트는 반드시 정리된다.
 */
export const generatePdfReport = async (input: GeneratePdfReportInput): Promise<string> => {
  const report = buildSnowballReport(input.payload);
  if (!report) throw new PdfReportError('report-unavailable');

  const theme = getPrintChartTheme(input.presetId);
  const tokens = getPrintThemeTokens(input.presetId);
  const surface = tokens.surface;
  const generatedAt = input.generatedAt ?? new Date();
  const fileName = buildPdfReportFileName(input.scenarioName, generatedAt);

  const charts = await buildCharts(report, input, theme, surface);

  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    // flushSync로 동기 커밋 — 렌더가 끝나기 전에 캡처하면 빈 페이지가 나온다.
    flushSync(() => {
      root.render(
        createElement(PdfReportDocument, {
          report,
          scenarioName: input.scenarioName,
          generatedAt,
          charts,
          themeVars: toThemeVars(tokens)
        })
      );
    });

    await waitForImages(host);
    await nextFrame();

    const pages = Array.from(host.querySelectorAll<HTMLElement>('[data-pdf-page]'));
    if (pages.length === 0) throw new PdfReportError('render-failed');

    await exportPages(pages, fileName, surface);
    return fileName;
  } finally {
    root.unmount();
    host.remove();
  }
};
