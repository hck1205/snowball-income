import { render, screen, within } from '@testing-library/react';
import { EMPTY_INVESTMENT_SETTINGS, type PersistedInvestmentSettings } from '@/jotai';
import { buildSnowballReport } from '@/shared/lib/snowball';
import type { SnowballReport } from '@/shared/lib/snowball';
import type { TickerProfile } from '@/shared/types/snowball';
import PdfReportDocument from '@/pages/Main/components/PdfReportDocument';

/**
 * PDF **문서 렌더** 계약 테스트.
 *
 * 이 문서는 화면이 아니라 종이라서, 잘못 인쇄된 문장은 되돌릴 수 없다. 특히
 * `findTargetYear(rows, 0)`이 "1년차 달성"을 만들어 내는 함정(OG 카드·커뮤니티 카드에서 두 번 잡힘)은
 * **네 곳**(표지 배지 / 표지 해설 / 전제표 목표 행 / 연도별 표 행 강조)에서 동시에 막혀야 한다.
 * 여기서는 그 네 곳을 한 번에 고정한다.
 *
 * 캡처 파이프라인(html2canvas·jsPDF·ECharts)은 돌리지 않는다 — 차트는 이미 PNG로 뽑힌 뒤
 * props로 들어오므로 문서는 순수 props 컴포넌트다.
 */

const profile = (
  id: string,
  ticker: string,
  dividendYield: number,
  dividendGrowth: number,
  frequency: TickerProfile['frequency'] = 'quarterly'
): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield,
  dividendGrowth,
  expectedTotalReturn: dividendYield + dividendGrowth,
  frequency
});

const schd = profile('t1', 'SCHD', 3.5, 5);
const jepi = profile('t2', 'JEPI', 7.2, 0, 'monthly');

const buildReport = (
  overrides: Partial<PersistedInvestmentSettings> = {},
  profiles: TickerProfile[] = [schd, jepi],
  weightByTickerId: Record<string, number> = { t1: 60, t2: 40 }
): SnowballReport => {
  const report = buildSnowballReport({
    portfolio: {
      tickerProfiles: profiles,
      includedTickerIds: profiles.map((item) => item.id),
      weightByTickerId,
      fixedByTickerId: {},
      selectedTickerId: null
    },
    investmentSettings: {
      ...EMPTY_INVESTMENT_SETTINGS,
      initialInvestment: 10_000_000,
      monthlyContribution: 1_000_000,
      targetMonthlyDividend: 2_000_000,
      investmentStartDate: '2024-01-01',
      durationYears: 20,
      reinvestDividends: true,
      reinvestDividendPercent: 100,
      taxRate: 15.4,
      ...overrides
    }
  });

  if (!report) throw new Error('테스트 픽스처가 계산 가능한 리포트를 만들지 못했습니다.');
  return report;
};

const renderDocument = (report: SnowballReport) =>
  render(
    <PdfReportDocument
      report={report}
      scenarioName="내 포트폴리오"
      generatedAt={new Date(2026, 6, 20, 14, 32)}
      charts={{ allocationPie: null, yearlyTrend: null, monthlyDividend: null }}
      themeVars={{ '--sb-bg': '#ffffff' }}
    />
  );

/** 연도별 표에서 "목표 달성" 강조가 걸린 행. 강조는 data 계약으로만 단정한다(스타일 내부 구현 무관). */
const targetRows = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('tr[data-target-reached="true"]'));

describe('PDF 문서 — 목표 미설정(0) 함정: 네 곳 전부', () => {
  it('표지 배지·표지 해설·전제표 목표 행·연도별 표 강조 어디에도 목표 문구가 없다', () => {
    const { container } = renderDocument(buildReport({ targetMonthlyDividend: 0 }));

    // 1) 표지 배지
    expect(screen.queryByText(/목표 달성$/)).not.toBeInTheDocument();
    expect(screen.queryByText('기간 내 미달성')).not.toBeInTheDocument();
    // 2) 표지 해설 문장
    expect(screen.queryByText(/목표했던 월/)).not.toBeInTheDocument();
    expect(screen.queryByText(/년차에 도달/)).not.toBeInTheDocument();
    // 3) 전제표의 목표 월배당 행
    expect(screen.queryByRole('rowheader', { name: '목표 월배당' })).not.toBeInTheDocument();
    // 4) 연도별 표 행 강조
    expect(targetRows(container)).toHaveLength(0);
    expect(screen.queryByText('목표 달성')).not.toBeInTheDocument();
  });

  it('목표가 0이어도 나머지 리포트는 정상적으로 인쇄된다 (블록만 생략)', () => {
    renderDocument(buildReport({ targetMonthlyDividend: 0 }));

    expect(screen.getByText('최종 자산 가치')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '초기 투자금' })).toBeInTheDocument();
    expect(screen.getByText(/세후로 들어옵니다/)).toBeInTheDocument();
  });
});

describe('PDF 문서 — 목표 달성/미달성 분기', () => {
  it('달성하면 배지·해설·전제표·연도별 표가 같은 연차를 가리킨다', () => {
    const report = buildReport({ targetMonthlyDividend: 300_000 });
    const { container } = renderDocument(report);

    expect(report.target.reachedInYears).not.toBeNull();
    expect(screen.getByText(`${report.target.reachedInYears}년차 목표 달성`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${report.target.reachedInYears}년차에 도달`))).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '목표 월배당' })).toBeInTheDocument();

    // 강조 행은 정확히 하나이고, 그 행의 연도가 달성 연도 라벨이다.
    const rows = targetRows(container);
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText(`${report.target.reachedInYears}년차`)).toBeInTheDocument();
    expect(rows[0].textContent).toContain(String(report.target.reachedYearLabel));
    expect(within(rows[0]).getByText('목표 달성')).toBeInTheDocument();
  });

  it('기간 내 미달성이면 강조 행이 없고 배지가 미달성을 말한다', () => {
    const report = buildReport({ targetMonthlyDividend: 5_000_000_000, durationYears: 5 });
    const { container } = renderDocument(report);

    expect(screen.getByText('기간 내 미달성')).toBeInTheDocument();
    expect(targetRows(container)).toHaveLength(0);
    expect(screen.getByText(/도달하지 못하고/)).toBeInTheDocument();
  });
});

describe('PDF 문서 — 전제표는 조건 조합과 무관하게 각 항목을 정확히 한 번 인쇄한다', () => {
  /**
   * 회귀: 재투자 ON/OFF와 목표 유무를 각각 `<tr>` 뭉치로 분기하던 구현은 두 조건이 배타적이지 않아
   * "재투자 OFF + 목표 있음"에서 가중평균 총수익률을 2번, "재투자 ON + 목표 없음"에서 0번 인쇄했다.
   */
  const combinations: [string, Partial<PersistedInvestmentSettings>][] = [
    ['재투자 ON · 목표 있음', {}],
    ['재투자 ON · 목표 없음', { targetMonthlyDividend: 0 }],
    ['재투자 OFF · 목표 있음', { reinvestDividends: false }],
    ['재투자 OFF · 목표 없음', { reinvestDividends: false, targetMonthlyDividend: 0 }]
  ];

  const ALWAYS_PRESENT = [
    '초기 투자금',
    '월 투자금',
    '투자 기간',
    '투자 시작일',
    '배당소득세율',
    '배당 재투자',
    'DPS 성장 반영',
    '가중평균 배당률',
    '가중평균 배당성장률',
    '가중평균 총수익률'
  ];

  it.each(combinations)('%s — 공통 항목이 빠짐없이 딱 한 번씩 나온다', (_name, overrides) => {
    renderDocument(buildReport(overrides));

    ALWAYS_PRESENT.forEach((label) => {
      expect(screen.queryAllByText(label)).toHaveLength(1);
    });
  });

  it.each(combinations)('%s — 조건부 항목은 조건에 맞게 0회 또는 1회다', (_name, overrides) => {
    const report = buildReport(overrides);
    renderDocument(report);

    expect(screen.queryAllByText('재투자 시점')).toHaveLength(report.inputs.reinvestDividends ? 1 : 0);
    expect(screen.queryAllByText('목표 월배당')).toHaveLength(report.target.hasTarget ? 1 : 0);
  });
});

describe('PDF 문서 — 조건부 블록 생략', () => {
  it('재투자를 끄면 재투자 시점 행이 사라지고 "사용 안 함"으로 인쇄된다', () => {
    renderDocument(buildReport({ reinvestDividends: false }));

    expect(screen.queryByRole('rowheader', { name: '재투자 시점' })).not.toBeInTheDocument();
    expect(screen.getByText('사용 안 함')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '가중평균 총수익률' })).toBeInTheDocument();
  });

  it('재투자를 켜면 재투자 시점과 비율이 인쇄된다', () => {
    renderDocument(buildReport({ reinvestDividends: true, reinvestDividendPercent: 70, reinvestTiming: 'nextMonth' }));

    expect(screen.getByRole('rowheader', { name: '재투자 시점' })).toBeInTheDocument();
    expect(screen.getByText('익월(보수적)')).toBeInTheDocument();
    expect(screen.getByText('사용 · 70%')).toBeInTheDocument();
  });

  it('금융소득종합과세에 해당하지 않으면 경고 박스 자체가 없다', () => {
    // 소액·단기 시나리오 — 세전 연 배당이 기준(2,000만원)에 한참 못 미친다.
    const report = buildReport({
      initialInvestment: 1_000_000,
      monthlyContribution: 0,
      durationYears: 3,
      targetMonthlyDividend: 0
    });

    expect(report.taxes.financialIncomeThresholdYear).toBeNull();
    renderDocument(report);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(screen.queryByText(/금융소득종합과세 대상/)).not.toBeInTheDocument();
  });

  it('금융소득종합과세에 해당하면 경고 박스가 해당 연차를 말한다', () => {
    const report = buildReport();

    expect(report.taxes.financialIncomeThresholdYear).not.toBeNull();
    renderDocument(report);
    expect(screen.getByRole('note')).toHaveTextContent(
      `${report.taxes.financialIncomeThresholdYear}년차에 세전 연 배당이`
    );
  });

  it('차트가 없으면 이미지 없이도 문서가 완성된다 (앱 아이콘만 남는다)', () => {
    const { container } = renderDocument(buildReport());

    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelectorAll('[data-pdf-page]').length).toBeGreaterThanOrEqual(5);
  });
});

describe('PDF 문서 — 연도별 표', () => {
  it('모든 연차가 빠짐없이 인쇄되고 연차 라벨이 1..N이다', () => {
    const report = buildReport({ durationYears: 30, targetMonthlyDividend: 0 });
    const { container } = renderDocument(report);

    const bodyRows = Array.from(container.querySelectorAll('[data-pdf-page^="yearly-"] tbody tr'));
    expect(bodyRows).toHaveLength(30);
    bodyRows.forEach((row, index) => {
      expect(row.querySelector('td')?.textContent).toBe(`${index + 1}년차`);
    });
    // 26행을 넘으면 페이지가 늘어난다.
    expect(container.querySelectorAll('[data-pdf-page^="yearly-"]')).toHaveLength(2);
  });
});
