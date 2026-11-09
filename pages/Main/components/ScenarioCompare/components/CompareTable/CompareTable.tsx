import { memo, type CSSProperties, type ReactNode } from 'react';
import { Button } from '@/components/common';
import { findBestColumnIds, type ScenarioCompareColumn, type ScenarioCompareMetric } from '@/pages/Main/utils';
import { barPercents, bestLabelOf, formatSignedRate, swatchOf } from '../../ScenarioCompare.utils';
import {
  ActiveTag,
  BestTag,
  BestValue,
  CompareNote,
  CompareScroll,
  CompareTable as Table,
  GroupRow,
  HoldingsCell,
  MetricCell,
  MiniFill,
  MiniTrack,
  MutedValue,
  SectionTitle,
  SrOnly,
  Swatch,
  TabHead,
  TabName,
  TableSection
} from './CompareTable.styled';
import type { CompareTableProps } from './CompareTable.types';

type Money = (value: number) => string;
type ComputedColumn = ScenarioCompareColumn & { readonly result: NonNullable<ScenarioCompareColumn['result']> };

/** 조건 행 — 계산 결과와 무관하게 늘 그린다(계산 불가 탭도 조건은 있다). */
type ConditionRow = { readonly label: string; readonly render: (column: ScenarioCompareColumn, money: Money) => ReactNode };

/** 결과 행 — 결과가 있는 탭에만 값·막대·"최고"가 붙는다. 표시 문구는 `render` 가 정한다. */
type ResultRow = {
  readonly metric: ScenarioCompareMetric;
  readonly label: string;
  readonly render: (column: ComputedColumn, money: Money) => ReactNode;
};

const CONDITION_ROWS: readonly ConditionRow[] = [
  { label: '종목 수', render: (c) => `${c.tickerCount}종목` },
  { label: '시작일', render: (c) => c.investmentStartDate },
  { label: '초기 투자금', render: (c, money) => money(c.initialInvestment) },
  { label: '월 적립금', render: (c, money) => money(c.monthlyContribution) },
  { label: '투자 기간', render: (c) => `${c.durationYears}년` },
  {
    label: '목표 월 배당',
    render: (c, money) => (c.targetMonthlyDividend > 0 ? money(c.targetMonthlyDividend) : <MutedValue>없음</MutedValue>)
  },
  { label: '배당 재투자', render: (c) => (c.reinvestPercent > 0 ? `${c.reinvestPercent}%` : <MutedValue>안 함</MutedValue>) },
  {
    label: '배당소득세',
    render: (c) => (c.taxRatePercent === null ? <MutedValue>종목별 기본</MutedValue> : `${c.taxRatePercent}%`)
  }
];

const RESULT_ROWS: readonly ResultRow[] = [
  { metric: 'finalAssetValue', label: '최종 자산', render: (c, money) => money(c.result.finalAssetValue) },
  { metric: 'totalContribution', label: '총 납입', render: (c, money) => money(c.result.totalContribution) },
  { metric: 'gain', label: '수익(자산 − 납입)', render: (c, money) => money(c.result.gain) },
  {
    metric: 'gainRate',
    label: '수익률',
    render: (c) => (c.result.gainRate === null ? <MutedValue>-</MutedValue> : formatSignedRate(c.result.gainRate))
  },
  { metric: 'finalMonthlyDividend', label: '마지막 해 월 배당(세후)', render: (c, money) => money(c.result.finalMonthlyDividend) },
  { metric: 'finalPayoutDividend', label: '최근 실지급 배당(세후)', render: (c, money) => money(c.result.finalPayoutDividend) },
  { metric: 'totalNetDividend', label: '누적 배당(세후)', render: (c, money) => money(c.result.totalNetDividend) },
  { metric: 'totalTaxPaid', label: '누적 세금', render: (c, money) => money(c.result.totalTaxPaid) },
  {
    metric: 'targetReachedYear',
    label: '목표 월 배당 달성',
    render: (c, money) =>
      c.targetMonthlyDividend <= 0 ? (
        <MutedValue>목표 없음</MutedValue>
      ) : c.result.targetReachedYear === null ? (
        <MutedValue>{money(c.targetMonthlyDividend)} 미도달</MutedValue>
      ) : (
        `${c.result.targetReachedYear}년차`
      )
  },
  {
    metric: 'requiredMonthlyContribution',
    label: '목표까지 필요한 월 적립',
    render: (c, money) =>
      c.result.requiredMonthlyContribution === null ? (
        <MutedValue>{c.targetMonthlyDividend <= 0 ? '-' : c.result.targetReachedYear !== null ? '이미 도달' : '계산 불가'}</MutedValue>
      ) : (
        `월 ${money(c.result.requiredMonthlyContribution)}`
      )
  }
];

const metricValue = (column: ScenarioCompareColumn, metric: ScenarioCompareMetric): number | null => {
  const value = column.result?.[metric];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

/**
 * 탭 비교의 **조건 · 결과 표**. 탭이 열, 지표가 행. 첫 열은 고정이고 표는 가로로 스크롤한다.
 *
 * 결과 칸마다 그 행의 최댓값 대비 작은 막대(`barPercents`)와 "최고"(`bestLabelOf` — 색이 아니라 글자로도).
 * ⚠ 권유가 아니라 숫자의 방향이다 — 그래서 조건(넣은 돈)을 같은 표 위에 둔다.
 */
function CompareTableComponent({ columns, money, onSelect }: CompareTableProps) {
  const renderResultRow = ({ metric, label, render }: ResultRow) => {
    const best = findBestColumnIds(columns, metric);
    const bestLabel = bestLabelOf(metric);
    const percents = barPercents(columns.map((column) => metricValue(column, metric)));

    return (
      <tr key={metric}>
        <th scope="row">{label}</th>
        {columns.map((column, index) => {
          if (!column.result) {
            return (
              <td key={column.id}>
                <MutedValue>계산 불가</MutedValue>
              </td>
            );
          }
          const text = render({ ...column, result: column.result }, money);
          const isBest = bestLabel !== null && best.has(column.id);

          return (
            <td key={column.id}>
              <MetricCell style={{ '--swatch': swatchOf(index), '--bar': `${percents[index]}%` } as CSSProperties}>
                <span>
                  {isBest ? <BestValue>{text}</BestValue> : text}
                  {isBest ? <BestTag>{bestLabel}</BestTag> : null}
                </span>
                {metricValue(column, metric) !== null ? (
                  <MiniTrack aria-hidden>
                    <MiniFill />
                  </MiniTrack>
                ) : null}
              </MetricCell>
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <TableSection aria-label="탭별 조건과 결과">
      <SectionTitle>조건과 결과</SectionTitle>
      <CompareScroll>
        <Table aria-label="탭별 조건과 결과">
          <thead>
            <tr>
              <th scope="col">항목</th>
              {columns.map((column, index) => (
                <th key={column.id} scope="col">
                  <TabHead style={{ '--swatch': swatchOf(index) } as CSSProperties}>
                    <TabName>
                      <Swatch aria-hidden />
                      {column.name}
                    </TabName>
                    {column.isActive ? (
                      <ActiveTag>보는 중</ActiveTag>
                    ) : (
                      <Button type="button" variant="secondary" size="sm" onClick={() => onSelect(column.id)}>
                        이 탭 보기<SrOnly> ({column.name})</SrOnly>
                      </Button>
                    )}
                  </TabHead>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <GroupRow>
              <th scope="rowgroup" colSpan={columns.length + 1}>
                조건
              </th>
            </GroupRow>
            <tr>
              <th scope="row">종목 구성</th>
              {columns.map((column) => (
                <HoldingsCell key={column.id}>{column.holdingsLine || '종목 없음'}</HoldingsCell>
              ))}
            </tr>
            {CONDITION_ROWS.map(({ label, render }) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {columns.map((column) => (
                  <td key={column.id}>{render(column, money)}</td>
                ))}
              </tr>
            ))}

            <GroupRow>
              <th scope="rowgroup" colSpan={columns.length + 1}>
                결과
              </th>
            </GroupRow>
            {RESULT_ROWS.map(renderResultRow)}
          </tbody>
        </Table>
      </CompareScroll>
      <CompareNote>
        막대는 그 행에서 가장 큰 값 대비 길이입니다. "최고"·"가장 적음"·"가장 빠름"은 숫자의 방향일 뿐 권유가 아닙니다 —
        넣는 돈과 기간이 다르면 결과도 다릅니다. 수익률 = 최종 자산 ÷ 총 납입 − 1.
      </CompareNote>
    </TableSection>
  );
}

const CompareTable = memo(CompareTableComponent);

export default CompareTable;
