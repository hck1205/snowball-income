import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Card,
  DataTable,
  FormSection,
  FrequencySelect,
  InputField,
  ToggleField
} from '@/components';
import { formatKRW } from '@/shared/utils';
import type { SimulationResult } from '@/shared/types';
import { useYieldArchitect } from '@/features/YieldArchitect/hooks';
import {
  ChartWrap,
  ErrorBox,
  FeatureLayout,
  FormGrid,
  Header,
  HeaderDescription,
  HeaderTitle,
  SummaryGrid,
  SummaryValue
} from './feature.styled';

type SummaryItemProps = {
  title: string;
  value: string;
};

function SummaryItem({ title, value }: SummaryItemProps) {
  return (
    <Card title={title}>
      <SummaryValue>{value}</SummaryValue>
    </Card>
  );
}

function ChartPanel({ title, rows, keyName }: { title: string; rows: SimulationResult[]; keyName: keyof SimulationResult }) {
  return (
    <Card title={title}>
      <ChartWrap>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => formatKRW(Number(value))} width={100} />
            <Tooltip formatter={(value) => formatKRW(Number(value))} />
            <Line type="monotone" dataKey={keyName} stroke="#0a7285" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrap>
    </Card>
  );
}

const targetYearLabel = (year: number | undefined): string => (year ? `${year}년` : '미도달');

export default function YieldArchitectFeature() {
  const { values, setField, validation, simulation } = useYieldArchitect();

  const tableRows = simulation?.yearly ?? [];

  return (
    <FeatureLayout>
      <Header>
        <HeaderTitle>Yield Architect</HeaderTitle>
        <HeaderDescription>장기 배당 투자 전략을 설계하고 시뮬레이션 결과를 비교하세요.</HeaderDescription>
      </Header>

      <Card title="입력 대시보드">
        <FormSection title="티커 및 성장 가정">
          <FormGrid>
            <InputField label="티커" value={values.ticker} onChange={(event) => setField('ticker', event.target.value)} />
            <InputField
              label="현재 주가"
              type="number"
              min={0}
              value={values.initialPrice}
              onChange={(event) => setField('initialPrice', Number(event.target.value))}
            />
            <InputField
              label="배당률"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={values.dividendYield}
              onChange={(event) => setField('dividendYield', Number(event.target.value))}
            />
            <InputField
              label="배당 성장률"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={values.dividendGrowth}
              onChange={(event) => setField('dividendGrowth', Number(event.target.value))}
            />
            <InputField
              label="주가 성장률"
              type="number"
              min={-100}
              max={100}
              step={0.1}
              value={values.priceGrowth}
              onChange={(event) => setField('priceGrowth', Number(event.target.value))}
            />
            <FrequencySelect
              label="배당 지급 주기"
              value={values.frequency}
              onChange={(event) => setField('frequency', event.target.value as typeof values.frequency)}
            />
          </FormGrid>
        </FormSection>

        <FormSection title="투자 설정">
          <FormGrid>
            <InputField
              label="월 투자금"
              type="number"
              min={0}
              value={values.monthlyContribution}
              onChange={(event) => setField('monthlyContribution', Number(event.target.value))}
            />
            <InputField
              label="투자 기간"
              type="number"
              min={1}
              max={60}
              value={values.durationYears}
              onChange={(event) => setField('durationYears', Number(event.target.value))}
            />
            <InputField
              label="세율"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={values.taxRate ?? ''}
              onChange={(event) => {
                const next = event.target.value;
                setField('taxRate', next === '' ? undefined : Number(next));
              }}
            />
            <ToggleField
              label="배당 재투자"
              checked={values.reinvestDividends}
              onChange={(event) => setField('reinvestDividends', event.target.checked)}
            />
          </FormGrid>
        </FormSection>

        {!validation.isValid ? (
          <ErrorBox role="alert" aria-live="polite">
            {validation.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </ErrorBox>
        ) : null}
      </Card>

      {simulation ? (
        <>
          <Card title="요약">
            <SummaryGrid>
              <SummaryItem title="최종 자산 가치" value={formatKRW(simulation.summary.finalAssetValue)} />
              <SummaryItem title="최종 월 배당" value={formatKRW(simulation.summary.finalMonthlyDividend)} />
              <SummaryItem title="누적 순배당" value={formatKRW(simulation.summary.totalNetDividend)} />
              <SummaryItem title="목표 월 배당 100만" value={targetYearLabel(simulation.summary.targetMonthDividend100ReachedYear)} />
              <SummaryItem title="목표 월 배당 200만" value={targetYearLabel(simulation.summary.targetMonthDividend200ReachedYear)} />
            </SummaryGrid>
          </Card>

          <ChartPanel title="월 평균 배당" rows={tableRows} keyName="monthlyDividend" />
          <ChartPanel title="자산 가치" rows={tableRows} keyName="assetValue" />
          <ChartPanel title="누적 배당" rows={tableRows} keyName="cumulativeDividend" />

          <Card title="연도별 결과">
            <DataTable
              rows={tableRows}
              columns={[
                { key: 'year', header: '연도', render: (row) => row.year },
                { key: 'totalContribution', header: '누적 투자금', render: (row) => formatKRW(row.totalContribution) },
                { key: 'assetValue', header: '자산 가치', render: (row) => formatKRW(row.assetValue) },
                { key: 'annualDividend', header: '연 배당', render: (row) => formatKRW(row.annualDividend) },
                { key: 'monthlyDividend', header: '월 평균 배당', render: (row) => formatKRW(row.monthlyDividend) },
                { key: 'cumulativeDividend', header: '누적 배당', render: (row) => formatKRW(row.cumulativeDividend) }
              ]}
            />
          </Card>
        </>
      ) : (
        <Card title="결과">
          <p>입력값 오류를 수정하면 결과가 표시됩니다.</p>
        </Card>
      )}
    </FeatureLayout>
  );
}
