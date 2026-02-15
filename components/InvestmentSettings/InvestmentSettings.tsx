import { Card, FormSection, InputField, ToggleField } from '@/components';
import type { YieldFormValues } from '@/shared/types';
import type { InvestmentSettingsProps } from './InvestmentSettings.types';
import {
  ConfigFormGrid,
  ConfigSectionDivider,
  ErrorBox,
  HelpMarkButton,
  InlineField,
  InlineFieldHeader,
  InlineSelect
} from '@/pages/Main/Main.shared.styled';

export default function InvestmentSettings({
  values,
  showQuickEstimate,
  showSplitGraphs,
  validationErrors,
  onSetField,
  onToggleQuickEstimate,
  onToggleSplitGraphs,
  onHelpResultMode,
  onHelpReinvestTiming,
  onHelpDpsGrowthMode
}: InvestmentSettingsProps) {
  return (
    <Card>
      <FormSection title="투자 설정">
        <ConfigFormGrid>
          <ToggleField
            label="빠른 추정 보기"
            checked={showQuickEstimate}
            helpAriaLabel="결과 모드 설명 열기"
            onHelpClick={onHelpResultMode}
            onChange={(event) => onToggleQuickEstimate(event.target.checked)}
          />
          <ToggleField
            label="그래프 나누어 보기"
            checked={showSplitGraphs}
            onChange={(event) => onToggleSplitGraphs(event.target.checked)}
          />
          <ToggleField
            label="배당 재투자"
            checked={values.reinvestDividends}
            onChange={(event) => onSetField('reinvestDividends', event.target.checked)}
          />
          <ConfigSectionDivider aria-hidden="true" />
          <InputField
            label="월 투자금 (원)"
            type="number"
            min={0}
            value={values.monthlyContribution}
            onChange={(event) => onSetField('monthlyContribution', Number(event.target.value))}
          />
          <InputField
            label="투자 기간 (연단위)"
            type="number"
            min={1}
            max={60}
            value={values.durationYears}
            onChange={(event) => onSetField('durationYears', Number(event.target.value))}
          />
          <InputField
            label="세율 (%)"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={values.taxRate ?? ''}
            onChange={(event) => {
              const next = event.target.value;
              onSetField('taxRate', next === '' ? undefined : Number(next));
            }}
          />
          <InputField
            label="목표 월배당 (원)"
            type="number"
            min={0}
            value={values.targetMonthlyDividend}
            onChange={(event) => onSetField('targetMonthlyDividend', Number(event.target.value))}
          />
          <InlineField htmlFor="reinvest-timing">
            <InlineFieldHeader>
              재투자 시점
              <HelpMarkButton type="button" aria-label="재투자 시점 설명 열기" onClick={onHelpReinvestTiming}>
                ?
              </HelpMarkButton>
            </InlineFieldHeader>
            <InlineSelect
              id="reinvest-timing"
              aria-label="재투자 시점"
              value={values.reinvestTiming}
              disabled={!values.reinvestDividends}
              onChange={(event) => onSetField('reinvestTiming', event.target.value as YieldFormValues['reinvestTiming'])}
            >
              <option value="sameMonth">당월 재투자</option>
              <option value="nextMonth">익월 재투자(보수적)</option>
            </InlineSelect>
          </InlineField>
          <InlineField htmlFor="dps-growth-mode">
            <InlineFieldHeader>
              DPS 성장 반영
              <HelpMarkButton type="button" aria-label="DPS 성장 반영 설명 열기" onClick={onHelpDpsGrowthMode}>
                ?
              </HelpMarkButton>
            </InlineFieldHeader>
            <InlineSelect
              id="dps-growth-mode"
              aria-label="DPS 성장 반영"
              value={values.dpsGrowthMode}
              onChange={(event) => onSetField('dpsGrowthMode', event.target.value as YieldFormValues['dpsGrowthMode'])}
            >
              <option value="annualStep">연 단위 점프</option>
              <option value="monthlySmooth">월 단위 스무딩</option>
            </InlineSelect>
          </InlineField>
        </ConfigFormGrid>
      </FormSection>

      {validationErrors.length > 0 ? (
        <ErrorBox role="alert" aria-live="polite">
          {validationErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </ErrorBox>
      ) : null}
    </Card>
  );
}
