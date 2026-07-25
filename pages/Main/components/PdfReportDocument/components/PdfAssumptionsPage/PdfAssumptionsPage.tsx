import { Fragment } from 'react';
import { formatKRW } from '@/shared/utils';
import type { SnowballReport } from '@/shared/lib/snowball';
// 부모 배럴(../../index.ts)을 경유하면 PdfReportDocument ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import {
  Narrative,
  Page,
  PieImage,
  SectionTitle,
  SplitRow,
  StackRow,
  Table
} from '../../PdfReportDocument.styled';
import { buildPortfolioNarrative, chunkIntoPairs, formatPercentValue, frequencyLabel } from '../../PdfReportDocument.utils';
import type { AssumptionCell } from '../../PdfReportDocument.types';
import { PdfPageFooter } from '../PdfPageFooter';
import type { PdfAssumptionsPageProps } from './PdfAssumptionsPage.types';

/** ── 2. 전제 + 포트폴리오 구성 ─────────────────────────────────────── */
function PdfAssumptionsPage({ report, allocationPie, title, themeVars }: PdfAssumptionsPageProps) {
  const { inputs, portfolio, target } = report;

  /**
   * 전제표 셀 — **평평한 목록으로 만든 뒤 2개씩 묶어** 행을 만든다.
   *
   * 예전에는 `재투자 ON/OFF`와 `목표 유무`마다 `<tr>` 뭉치를 통째로 분기했는데, 두 조건이 서로
   * 배타적이지 않아 조합에 따라 같은 항목이 두 번 인쇄되거나(재투자 OFF + 목표 있음 → 가중평균
   * 총수익률 2회) 아예 빠졌다(재투자 ON + 목표 없음 → 총수익률 0회). 항목을 한 번씩만 담는
   * 목록으로 만들면 그 조합 폭발 자체가 사라진다.
   */
  const assumptionCells: AssumptionCell[] = [
    { label: '초기 투자금', value: formatKRW(inputs.initialInvestment) },
    { label: '월 투자금', value: formatKRW(inputs.monthlyContribution) },
    { label: '투자 기간', value: `${inputs.durationYears}년` },
    { label: '투자 시작일', value: inputs.investmentStartDate },
    { label: '배당소득세율', value: formatPercentValue(inputs.taxRatePercent) },
    {
      label: '배당 재투자',
      value: inputs.reinvestDividends ? `사용 · ${inputs.reinvestDividendPercent}%` : '사용 안 함'
    },
    // 재투자 OFF면 재투자 시점은 의미가 없으므로 항목 자체를 넣지 않는다.
    ...(inputs.reinvestDividends
      ? [{ label: '재투자 시점', value: inputs.reinvestTiming === 'sameMonth' ? '당월' : '익월(보수적)' }]
      : []),
    {
      label: 'DPS 성장 반영',
      value: inputs.dpsGrowthMode === 'annualStep' ? '연 단위 점프' : '월 단위 스무딩'
    },
    { label: '가중평균 배당률', value: formatPercentValue(portfolio.weightedAverageDividendYieldPercent, 2) },
    {
      label: '가중평균 배당성장률',
      value: formatPercentValue(portfolio.weightedAverageDividendGrowthPercent, 2)
    },
    {
      label: '가중평균 총수익률',
      value: formatPercentValue(portfolio.weightedAverageExpectedTotalReturnPercent, 2)
    },
    // 목표 미설정(0)이면 항목을 지운다 — 0원 목표를 인쇄하면 달성 여부가 오독된다.
    ...(target.hasTarget
      ? [{ label: '목표 월배당', value: formatKRW(target.targetMonthlyDividend) }]
      : [])
  ];

  return (
    <Page data-pdf-page="assumptions" style={themeVars}>
      <SectionTitle>이 리포트의 전제</SectionTitle>
      <Table>
        <tbody>
          {chunkIntoPairs(assumptionCells).map((pair) => (
            <tr key={pair.map((cell) => cell.label).join('|')}>
              {pair.map((cell) => (
                <Fragment key={cell.label}>
                  <th scope="row">{cell.label}</th>
                  <td data-numeric="true">{cell.value}</td>
                </Fragment>
              ))}
              {/* 홀수 개일 때 마지막 칸을 비워 표 구조를 유지한다. */}
              {pair.length === 1 ? <td colSpan={2} /> : null}
            </tr>
          ))}
        </tbody>
      </Table>

      <SectionTitle>포트폴리오 구성</SectionTitle>
      {portfolio.holdings.length > 6 ? (
        <StackRow>
          {allocationPie ? <PieImage src={allocationPie.src} alt={allocationPie.alt} /> : null}
          <HoldingsTable report={report} />
        </StackRow>
      ) : (
        <SplitRow>
          {allocationPie ? <PieImage src={allocationPie.src} alt={allocationPie.alt} /> : <div />}
          <HoldingsTable report={report} />
        </SplitRow>
      )}

      <Narrative>{buildPortfolioNarrative(report)}</Narrative>
      <PdfPageFooter title={title} label="2" />
    </Page>
  );
}

export default PdfAssumptionsPage;

/** 종목표 — 파이 옆(6종 이하) 또는 파이 아래(7종 이상)에 같은 내용으로 들어간다. 이 페이지 전용이라 여기 하위에 둔다. */
function HoldingsTable({ report }: { report: SnowballReport }) {
  return (
    <Table>
      <thead>
        <tr>
          <th scope="col">티커</th>
          <th scope="col" data-numeric="true">
            비중
          </th>
          <th scope="col" data-numeric="true">
            배당률
          </th>
          <th scope="col" data-numeric="true">
            배당성장률
          </th>
          <th scope="col">지급 주기</th>
          <th scope="col" data-numeric="true">
            배분 금액
          </th>
        </tr>
      </thead>
      <tbody>
        {report.portfolio.holdings.map((holding) => (
          <tr key={holding.ticker}>
            <td>{holding.ticker}</td>
            <td data-numeric="true">{formatPercentValue(holding.weight * 100)}</td>
            <td data-numeric="true">{formatPercentValue(holding.dividendYieldPercent, 2)}</td>
            <td data-numeric="true">{formatPercentValue(holding.dividendGrowthPercent, 2)}</td>
            <td>{frequencyLabel(holding.frequency)}</td>
            <td data-numeric="true">{formatKRW(holding.allocatedInitialInvestment)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
