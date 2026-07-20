import { Fragment } from 'react';
import {
  CAPITAL_GAINS_ANNUAL_DEDUCTION,
  FINANCIAL_INCOME_TAX_THRESHOLD,
  OVERSEAS_CAPITAL_GAINS_TAX_RATE
} from '@/shared/constants';
import { formatKRW } from '@/shared/utils';
import {
  BrandIcon,
  BrandRow,
  BrandWordmark,
  Caption,
  ChartImage,
  CoverRibbon,
  CoverSubtitle,
  CoverTimestamp,
  CoverTitle,
  DisclaimerBox,
  Footer,
  HeroGrid,
  HeroLabel,
  HeroTile,
  HeroValue,
  Narrative,
  NoteText,
  OffscreenRoot,
  Page,
  PieImage,
  SectionTitle,
  SplitRow,
  StackRow,
  StatGrid,
  StatLabel,
  StatTile,
  StatValue,
  Table,
  TargetBadge,
  TargetCellLabel,
  WarningBox
} from './PdfReportDocument.styled';
import {
  DEFAULT_SCENARIO_NAME,
  PDF_REPORT_DISCLAIMER,
  PDF_REPORT_MONTHLY_NOTE,
  buildAssetGrowthNarrative,
  buildCalendarNarrative,
  buildCoverNarrative,
  buildCoverSubtitle,
  buildDividendNarrative,
  buildMonthlyCaption,
  buildMonthlyGrowthNarrative,
  buildPortfolioNarrative,
  buildTaxNarrative,
  chunkIntoPairs,
  chunkYearlyRows,
  formatGeneratedAt,
  formatPercentValue,
  formatSignedApproxKRW,
  frequencyLabel
} from './PdfReportDocument.utils';
import type { AssumptionCell, PdfReportDocumentProps } from './PdfReportDocument.types';

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
  const { inputs, portfolio, outcome, composition, yieldOnCost, target, taxes } = report;

  const assetGrowthNarrative = buildAssetGrowthNarrative(report);
  const monthlyGrowthNarrative = buildMonthlyGrowthNarrative(report);
  const calendarNarrative = buildCalendarNarrative(report);

  /** 목표 달성 연차의 연도 라벨 — 표에서 그 행에만 레일·라벨을 단다. */
  const reachedYearLabel = target.hasTarget ? target.reachedYearLabel : null;

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
  const yearlyPages = chunkYearlyRows(report.yearly, 26, 30);
  /**
   * 각 페이지의 첫 행이 전체에서 몇 번째인가. `chunkYearlyRows`는 순서를 보존하므로 연차는
   * `offset + rowIndex + 1`로 그냥 센다(연도로 역검색하면 O(n²)인데다 같은 연도가 두 번 나오면 틀린다).
   * 페이지 크기 상수를 여기서 다시 쓰지 않도록 **실제 청크 길이**로 누적한다.
   */
  const yearlyPageOffsets = yearlyPages.reduce<number[]>((offsets, _rows, index) => {
    offsets.push(index === 0 ? 0 : offsets[index - 1] + yearlyPages[index - 1].length);
    return offsets;
  }, []);

  const pageFooter = (label: string) => (
    <Footer>
      <span>스노우볼 인컴 · {title}</span>
      <span>{label}</span>
    </Footer>
  );

  return (
    /* 인쇄용(라이트 고정) 토큰을 이 서브트리에만 주입한다 — :root의 data-theme은 건드리지 않는다. */
    <OffscreenRoot data-pdf-report="true" style={themeVars}>
      {/* ── 1. 표지 + 핵심 지표 ───────────────────────────────────────────── */}
      <Page data-pdf-page="cover" style={themeVars}>
        <CoverRibbon aria-hidden="true" />
        <BrandRow>
          <BrandIcon src="/app_icon.png" alt="" />
          <BrandWordmark>스노우볼 인컴</BrandWordmark>
        </BrandRow>

        <StackRow>
          <CoverTitle>{title}</CoverTitle>
          <CoverSubtitle>{buildCoverSubtitle(report)}</CoverSubtitle>
          <CoverTimestamp>{generatedLabel}</CoverTimestamp>
        </StackRow>

        <HeroGrid>
          <HeroTile wide>
            <HeroLabel>최종 자산 가치</HeroLabel>
            <HeroValue hero>{formatKRW(outcome.finalAssetValue)}</HeroValue>
          </HeroTile>
          <HeroTile>
            <HeroLabel>마지막 해 월평균 배당(세후)</HeroLabel>
            <HeroValue>{formatKRW(outcome.finalMonthlyAverageDividend)}</HeroValue>
          </HeroTile>
          <HeroTile>
            <HeroLabel>누적 순배당(세후)</HeroLabel>
            <HeroValue>{formatKRW(outcome.cumulativeNetDividend)}</HeroValue>
          </HeroTile>
          <HeroTile wide>
            <HeroLabel>투입 원금</HeroLabel>
            <HeroValue>{formatKRW(outcome.totalContribution)}</HeroValue>
          </HeroTile>
        </HeroGrid>

        {/* 목표 배지는 목표가 실제로 설정됐을 때만. target=0에 "1년차 달성"을 찍는 함정을 원천 차단한다. */}
        {target.hasTarget ? (
          <TargetBadge reached={target.reachedInYears !== null}>
            {target.reachedInYears !== null ? `${target.reachedInYears}년차 목표 달성` : '기간 내 미달성'}
          </TargetBadge>
        ) : null}

        <Narrative>{buildCoverNarrative(report)}</Narrative>
        {pageFooter('1')}
      </Page>

      {/* ── 2. 전제 + 포트폴리오 구성 ─────────────────────────────────────── */}
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
            {charts.allocationPie ? (
              <PieImage src={charts.allocationPie.src} alt={charts.allocationPie.alt} />
            ) : null}
            <HoldingsTable report={report} />
          </StackRow>
        ) : (
          <SplitRow>
            {charts.allocationPie ? (
              <PieImage src={charts.allocationPie.src} alt={charts.allocationPie.alt} />
            ) : (
              <div />
            )}
            <HoldingsTable report={report} />
          </SplitRow>
        )}

        <Narrative>{buildPortfolioNarrative(report)}</Narrative>
        {pageFooter('2')}
      </Page>

      {/* ── 3. 자산·배당의 궤적 ───────────────────────────────────────────── */}
      <Page data-pdf-page="trajectory" style={themeVars}>
        <SectionTitle>자산과 배당은 이렇게 자랍니다</SectionTitle>
        {charts.yearlyTrend ? <ChartImage src={charts.yearlyTrend.src} alt={charts.yearlyTrend.alt} /> : null}

        {assetGrowthNarrative ? <Narrative>{assetGrowthNarrative}</Narrative> : null}
        <Narrative>{buildDividendNarrative(report)}</Narrative>
        {monthlyGrowthNarrative ? <Narrative>{monthlyGrowthNarrative}</Narrative> : null}

        <NoteText>{PDF_REPORT_MONTHLY_NOTE}</NoteText>
        <Caption>{buildMonthlyCaption(report.finalYearCalendar)}</Caption>
        {charts.monthlyDividend ? (
          <ChartImage src={charts.monthlyDividend.src} alt={charts.monthlyDividend.alt} />
        ) : null}
        {calendarNarrative ? <Narrative>{calendarNarrative}</Narrative> : null}
        {pageFooter('3')}
      </Page>

      {/* ── 4. 연도별 상세 (행이 많으면 페이지가 늘어난다) ────────────────── */}
      {yearlyPages.map((rows, pageIndex) => (
        <Page data-pdf-page={`yearly-${pageIndex}`} style={themeVars} key={`yearly-${rows[0]?.year ?? pageIndex}`}>
          {pageIndex === 0 ? <SectionTitle>연도별 상세</SectionTitle> : null}
          <Table>
            <thead>
              <tr>
                <th scope="col">연차</th>
                <th scope="col">연도</th>
                <th scope="col" data-numeric="true">
                  투입 원금
                </th>
                <th scope="col" data-numeric="true">
                  자산 가치
                </th>
                <th scope="col" data-numeric="true">
                  연 배당(세후)
                </th>
                <th scope="col" data-numeric="true">
                  월평균 배당
                </th>
                <th scope="col" data-numeric="true">
                  누적 배당
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const isTargetRow = reachedYearLabel !== null && row.year === reachedYearLabel;
                const yearIndex = yearlyPageOffsets[pageIndex] + rowIndex + 1;

                return (
                  <tr key={row.year} data-target-reached={isTargetRow ? 'true' : undefined}>
                    <td>{yearIndex}년차</td>
                    <td>
                      {row.year}
                      {isTargetRow ? <> <TargetCellLabel>목표 달성</TargetCellLabel></> : null}
                    </td>
                    <td data-numeric="true">{formatKRW(row.totalContribution)}</td>
                    <td data-numeric="true">{formatKRW(row.assetValue)}</td>
                    <td data-numeric="true">{formatKRW(row.annualDividend)}</td>
                    <td data-numeric="true">{formatKRW(row.monthlyDividend)}</td>
                    <td data-numeric="true">{formatKRW(row.cumulativeDividend)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {pageFooter(`${4 + pageIndex}`)}
        </Page>
      ))}

      {/* ── 5. 세금 · 면책 ────────────────────────────────────────────────── */}
      <Page data-pdf-page="tax" style={themeVars}>
        <SectionTitle>최종 자산은 어디서 왔나</SectionTitle>
        <StatGrid>
          <StatTile>
            <StatLabel>내가 넣은 원금</StatLabel>
            <StatValue>{formatKRW(composition.contribution)}</StatValue>
          </StatTile>
          <StatTile>
            <StatLabel>재투자된 배당</StatLabel>
            <StatValue>{formatKRW(composition.reinvestedDividend)}</StatValue>
          </StatTile>
          <StatTile>
            <StatLabel>시세 평가이익</StatLabel>
            <StatValue tone={composition.marketGain >= 0 ? 'positive' : 'negative'}>
              {formatSignedApproxKRW(composition.marketGain)}
            </StatValue>
          </StatTile>
          <StatTile>
            <StatLabel>YoC(투입원금 대비 배당률)</StatLabel>
            <StatValue>
              {yieldOnCost.firstYearPercent === null || yieldOnCost.finalYearPercent === null
                ? '—'
                : `${formatPercentValue(yieldOnCost.firstYearPercent, 2)} → ${formatPercentValue(
                    yieldOnCost.finalYearPercent,
                    2
                  )}`}
            </StatValue>
          </StatTile>
        </StatGrid>

        <SectionTitle>전량 매도한다면</SectionTitle>
        <StatGrid>
          <StatTile>
            <StatLabel>취득원가</StatLabel>
            <StatValue>{formatKRW(taxes.totalCostBasis)}</StatValue>
          </StatTile>
          <StatTile>
            <StatLabel>평가이익</StatLabel>
            <StatValue tone={taxes.unrealizedGain >= 0 ? 'positive' : 'negative'}>
              {formatSignedApproxKRW(taxes.unrealizedGain)}
            </StatValue>
          </StatTile>
          <StatTile>
            <StatLabel>전량 매도 시 예상 양도세</StatLabel>
            <StatValue>{formatKRW(taxes.estimatedCapitalGainsTax)}</StatValue>
          </StatTile>
          <StatTile>
            <StatLabel>세후 실현 가능 자산</StatLabel>
            <StatValue>{formatKRW(taxes.afterCapitalGainsTaxValue)}</StatValue>
          </StatTile>
        </StatGrid>

        <Narrative>{buildTaxNarrative(report)}</Narrative>
        <NoteText>
          {`해외주식 양도세 ${OVERSEAS_CAPITAL_GAINS_TAX_RATE}%, 기본공제 연 ${(
            CAPITAL_GAINS_ANNUAL_DEDUCTION / 10_000
          ).toLocaleString()}만원, 마지막 해에 전량 매도 가정. ` +
            '계속 보유하면 내지 않는 세금이라 위쪽 자산·누적 세금에는 반영되지 않았습니다.'}
        </NoteText>

        {/* 종합과세 경고는 실제로 기준을 넘는 연차가 있을 때만 — 없으면 박스 자체가 없다. */}
        {taxes.financialIncomeThresholdYear !== null ? (
          <WarningBox role="note">
            {`이 시나리오는 ${taxes.financialIncomeThresholdYear}년차에 세전 연 배당이 ${(
              FINANCIAL_INCOME_TAX_THRESHOLD / 10_000
            ).toLocaleString()}만원을 넘습니다. ` + '금융소득종합과세 대상이 되어 실제 세율이 입력한 값보다 높아질 수 있습니다.'}
          </WarningBox>
        ) : null}

        <DisclaimerBox>{PDF_REPORT_DISCLAIMER}</DisclaimerBox>
        {pageFooter(`${4 + yearlyPages.length}`)}
      </Page>
    </OffscreenRoot>
  );
}

/** 종목표 — 파이 옆(6종 이하) 또는 파이 아래(7종 이상)에 같은 내용으로 들어간다. */
function HoldingsTable({ report }: { report: PdfReportDocumentProps['report'] }) {
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
