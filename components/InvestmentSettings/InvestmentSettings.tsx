import { memo, useEffect } from 'react';
import { Card, FormSection, InputField, ToggleField } from '@/components';
import CurrencyToggleField from '@/components/CurrencyToggleField';
import { TARGET_MONTHLY_DIVIDEND_INPUT_ID, TOUR_TARGET } from '@/shared/constants';
import type { YieldFormValues } from '@/shared/types';
import type { InvestmentSettingsProps } from './InvestmentSettings.types';
import { buildAmountHint } from './InvestmentSettings.utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { clampPercent } from '@/shared/utils';
import {
  ConfigFormGrid,
  ConfigInputGrid,
  ConfigSectionDivider,
  ErrorBox,
  HelpMarkButton,
  InlineField,
  InlineFieldHeader
} from '@/components/common';
import { Select } from '@/components/common';
import { ReinvestRouting } from './components';
import {
  ReinvestControls,
  ReinvestLabel,
  ReinvestPercentField,
  ReinvestPercentPrefix,
  ReinvestPercentInput,
  ReinvestPercentSuffix,
  ReinvestRow
} from './InvestmentSettings.styled';

function InvestmentSettingsComponent({
  values,
  showQuickEstimate,
  showSplitGraphs,
  display,
  validationErrors,
  validationFields,
  onSetField,
  onToggleQuickEstimate,
  onToggleSplitGraphs,
  onChangeCurrency,
  onHelpResultMode,
  onHelpReinvestTiming,
  onHelpDpsGrowthMode,
  reinvestRouting
}: InvestmentSettingsProps) {
  /**
   * 검증 에러 노출 계측.
   *
   * 🔴 `field_name` 이 이 이벤트의 존재 이유다(2026-08-22 추가). 전에는 `error_count` 만 보내서
   * "몇 개 틀렸다"는 알아도 **"무엇이 틀렸다"는 몰랐다** — GA4 에서 45건 전부 `(not set)` 이었고,
   * 택소노미가 선언한 용도("이탈 유발 입력 항목 식별")를 달성할 수 없었다.
   *
   * ⚠ 여러 필드가 동시에 틀리면 `|` 로 잇는다. 값공간이 조금 늘지만, 실제로는 한두 개가 대부분이고
   *   `error_count` 와 함께 보면 조합인지 단일인지 구별된다. 필드마다 이벤트를 쪼개지 않은 이유는
   *   이 이벤트가 "에러 상태가 보인 순간" 1회를 세는 것이기 때문이다 — 쪼개면 그 뜻이 바뀌고
   *   과거 데이터와 비교가 끊긴다.
   * ⚠ 이름은 정렬한다. `a|b` 와 `b|a` 가 다른 값으로 갈리면 집계가 흩어진다.
   */
  useEffect(() => {
    if (validationErrors.length === 0) return;
    trackEvent(ANALYTICS_EVENT.VALIDATION_ERROR_VIEW, {
      error_count: validationErrors.length,
      field_name: [...validationFields].sort().join('|') || 'unknown'
    });
  }, [validationErrors, validationFields]);

  return (
    <Card dataTour={TOUR_TARGET.investmentSettings}>
      {/*
       * 🔴 이 카드 안의 순서 = **② 투자 조건 → ③ 계산 방식**. 2026-07-31 에 뒤집었다.
       *   종전엔 토글 4개가 맨 위에 있어서, 드로어를 열면 가장 먼저 닿는 것이 "빠른 추정 보기"·
       *   "그래프 나누어 보기" 같은 **표시 옵션**이었고 정작 자주 고치는 금액·기간·세율은 그 아래였다.
       *   구분선(`ConfigSectionDivider`)이 두 덩어리를 가른다.
       */}
      <FormSection title="투자 설정">
        <ConfigFormGrid>
          <ConfigInputGrid>
            {/* 금액 필드는 **원화로 입력·저장**하고 달러는 아래 줄에 참고로만 병기한다
                (이유는 InvestmentSettings.utils 의 buildAmountHint 주석). */}
            <InputField
              label="초기 투자금 (원)"
              type="number"
              min={0}
              value={values.initialInvestment}
              hint={buildAmountHint(values.initialInvestment, display)}
              onChange={(event) => onSetField('initialInvestment', Number(event.target.value))}
            />
            <InputField
              label="월 투자금 (원)"
              type="number"
              min={0}
              value={values.monthlyContribution}
              hint={buildAmountHint(values.monthlyContribution, display)}
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
            {/*
              🔴 **비워 두는 것이 기본이고, 그 상태가 정답인 경우가 많다**(2026-08-18).
              세율은 종목의 상장지에서 갈리므로(미국 상장 15% · 국내 상장 15.4%) 엔진이 종목마다
              판정하게 두는 편이 정확하다 — 미국·국내를 섞은 포트폴리오는 단일 숫자로 맞출 수가 없다.
              그래서 값을 넣지 않았을 때 필드를 **빈 칸 + "자동"** 으로 보여 준다: 예전처럼 15 를 미리
              박아 넣으면 사용자가 입력한 것과 구별되지 않아 파생이 죽고, 국내 종목이 15% 로 계산된다
              (`SnowballForm` 의 `taxRate` 주석).
              ⚠ 힌트는 값이 있을 때도 남긴다 — 이미 15 가 저장된 옛 탭에서 "왜 15.4 가 아닌가"를
                사용자가 스스로 알아챌 수 있는 유일한 단서다.
            */}
            <InputField
              label="세율 (%)"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={values.taxRate ?? ''}
              placeholder="자동"
              hint="비우면 종목별 자동 — 미국 상장 15% · 국내 상장 15.4%"
              onChange={(event) => {
                const next = event.target.value;
                onSetField('taxRate', next === '' ? undefined : Number(next));
              }}
            />
            <InputField
              /* 결과 카드의 "직접 입력" CTA가 이 필드를 지목한다 — 라벨 파생 id는 카피에 묶여 취약하다. */
              id={TARGET_MONTHLY_DIVIDEND_INPUT_ID}
              label="목표 월배당 (원)"
              type="number"
              min={0}
              value={values.targetMonthlyDividend}
              hint={buildAmountHint(values.targetMonthlyDividend, display)}
              onChange={(event) => onSetField('targetMonthlyDividend', Number(event.target.value))}
            />
            <InputField
              label="투자 시작 날짜"
              type="date"
              value={values.investmentStartDate}
              onChange={(event) => onSetField('investmentStartDate', event.target.value)}
            />
          </ConfigInputGrid>
          <ConfigSectionDivider aria-hidden="true" />
          {/* ③ 계산 방식 — 값이 아니라 "어떻게 계산·표시할 것인가". 재투자 토글과 그 시점·성장 반영
              셀렉트가 여기 함께 온다(토글이 셀렉트의 활성 여부를 정하므로 같은 덩어리여야 읽힌다). */}
          <ToggleField
            label="빠른 추정 보기"
            checked={showQuickEstimate}
            helpAriaLabel="결과 모드 설명 열기"
            onHelpClick={onHelpResultMode}
            onChange={(event) => {
              trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
                field_name: 'showQuickEstimate',
                value: event.target.checked
              });
              onToggleQuickEstimate(event.target.checked);
            }}
          />
          <ToggleField
            label="그래프 나누어 보기"
            checked={showSplitGraphs}
            onChange={(event) => {
              trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
                field_name: 'showSplitGraphs',
                value: event.target.checked
              });
              onToggleSplitGraphs(event.target.checked);
            }}
          />
          <ReinvestRow>
            <ReinvestLabel>배당 재투자</ReinvestLabel>
            <ReinvestControls>
              {values.reinvestDividends ? (
                <ReinvestPercentField>
                  {/*
                    🔴 **"기본"이라고 말한다** (2026-08-23 사용자 지적). 종목별 재투자가 생긴 뒤로
                       이 숫자는 포트폴리오 전체가 아니라 **종목별 값이 없을 때 쓰는 기본값**이다.
                       그냥 "배당 재투자 100%"로 두면, 한 종목이라도 0%면 화면이 거짓을 말한다.
                       라벨을 고치는 것이 진짜 수정이다 — 안내 문구만 덧붙이는 것은 반쪽이다.
                  */}
                  <ReinvestPercentPrefix>기본</ReinvestPercentPrefix>
                  <ReinvestPercentInput
                    aria-label="배당 재투자 기본 비율"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={values.reinvestDividendPercent}
                    onChange={(event) => {
                      onSetField('reinvestDividendPercent', clampPercent(Number(event.target.value)));
                    }}
                  />
                  <ReinvestPercentSuffix>%</ReinvestPercentSuffix>
                </ReinvestPercentField>
              ) : null}
              <ToggleField
                label="배당 재투자"
                hideLabel
                checked={values.reinvestDividends}
                onChange={(event) => onSetField('reinvestDividends', event.target.checked)}
              />
            </ReinvestControls>
          </ReinvestRow>
          {/* 전역값은 기본값이고 아래 표가 그것을 종목마다 덮는다 — 근거는 그 컴포넌트 머리말. */}
          <ReinvestRouting
            {...reinvestRouting}
            globalPercent={values.reinvestDividendPercent}
            enabled={values.reinvestDividends}
          />
          <ConfigInputGrid>
            <InlineField htmlFor="reinvest-timing">
              <InlineFieldHeader>
                재투자 시점
                <HelpMarkButton type="button" aria-label="재투자 시점 설명 열기" onClick={onHelpReinvestTiming}>
                  ?
                </HelpMarkButton>
              </InlineFieldHeader>
              <Select
                id="reinvest-timing"
                aria-label="재투자 시점"
                value={values.reinvestTiming}
                disabled={!values.reinvestDividends}
                onChange={(event) => onSetField('reinvestTiming', event.target.value as YieldFormValues['reinvestTiming'])}
              >
                <option value="sameMonth">당월 재투자</option>
                <option value="nextMonth">익월 재투자(보수적)</option>
              </Select>
            </InlineField>
            <InlineField htmlFor="dps-growth-mode">
              <InlineFieldHeader>
                DPS 성장 반영
                <HelpMarkButton type="button" aria-label="DPS 성장 반영 설명 열기" onClick={onHelpDpsGrowthMode}>
                  ?
                </HelpMarkButton>
              </InlineFieldHeader>
              <Select
                id="dps-growth-mode"
                aria-label="DPS 성장 반영"
                value={values.dpsGrowthMode}
                onChange={(event) => onSetField('dpsGrowthMode', event.target.value as YieldFormValues['dpsGrowthMode'])}
              >
                <option value="annualStep">연 단위 점프</option>
                <option value="monthlySmooth">월 단위 스무딩</option>
              </Select>
            </InlineField>
          </ConfigInputGrid>
          {/* 표시 통화 — 값이 아니라 표시 방식이라 계산 방식 덩어리의 끝에 둔다. 위 토글들과 같은
              `ToggleField` 라 라벨 줄·스위치 정렬이 그대로 이어진다. */}
          <CurrencyToggleField display={display} onChangeCurrency={onChangeCurrency} />
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

const InvestmentSettings = memo(InvestmentSettingsComponent);

export default InvestmentSettings;
