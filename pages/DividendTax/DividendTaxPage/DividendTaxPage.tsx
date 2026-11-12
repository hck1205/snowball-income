import { useMemo, useState, type ChangeEvent } from 'react';
import { Receipt } from 'lucide-react';
import { Chip, InputField, PageHero } from '@/components/common';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { DIVIDEND_TAX_PATH } from '@/shared/constants/routes';
import { calculateDividendTax, type HealthInsuranceStatus } from '@/shared/lib/dividendTax';
import { formatKoreanWon } from '@/shared/utils';
import { DIVIDEND_TAX_COPY } from '../copy';
import {
  ChipRow,
  Compare,
  CompareItem,
  CompareLabel,
  CompareValue,
  Field,
  FieldLabel,
  Form,
  Note,
  ResultCard,
  ResultGrid,
  ResultLabel,
  ResultTone,
  ResultValue,
  Stack
} from './DividendTaxPage.styled';

const copy = DIVIDEND_TAX_COPY;
const MAN = 10_000;

/** 만원 단위 입력 → 원. 빈 칸·음수·숫자 아님은 0. */
const toWon = (value: string): number => {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed * MAN : 0;
};

const HEALTH: readonly HealthInsuranceStatus[] = ['employee', 'regional', 'dependent'];

/**
 * 미국 배당 세금·건강보험료 계산기(`/dividend/tax`, 2026-11-12) — "한국 사람이 미국 배당으로 은퇴할 때"의
 * 세금·건보료 질문에 답하는 검증 지면. 계산은 전부 `calculateDividendTax`(순수 함수, 규칙 정본은
 * `shared/lib/dividendTax/RULES.md`). 확인 못 한 규칙은 보수적으로 계산하고 "추정"을 밝힌다.
 */
export default function DividendTaxPage() {
  useDocumentMeta({ title: copy.meta.title, description: copy.meta.description, pathname: DIVIDEND_TAX_PATH });

  const [monthlyUs, setMonthlyUs] = useState('150');
  const [otherFinancial, setOtherFinancial] = useState('0');
  const [otherTaxBase, setOtherTaxBase] = useState('0');
  const [health, setHealth] = useState<HealthInsuranceStatus>('regional');
  const [otherIncomeForDependent, setOtherIncomeForDependent] = useState('0');
  const [isaSeomin, setIsaSeomin] = useState(false);

  const result = useMemo(
    () =>
      calculateDividendTax({
        usDividendAnnual: toWon(monthlyUs) * 12,
        otherFinancialAnnual: toWon(otherFinancial),
        otherTaxBase: toWon(otherTaxBase),
        health,
        otherIncomeForDependent: toWon(otherIncomeForDependent),
        isaSeomin
      }),
    [monthlyUs, otherFinancial, otherTaxBase, health, otherIncomeForDependent, isaSeomin]
  );

  const onText = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => setter(event.target.value);
  const usAnnual = toWon(monthlyUs) * 12;

  return (
    <TickerPageShell>
      <Stack>
        <PageHero title={copy.heroTitle} titleAs="h1" lede={copy.lede} icon={<Receipt aria-hidden />} />

        <Form onSubmit={(event) => event.preventDefault()}>
          <InputField label={copy.inputs.monthlyUs} type="number" min={0} value={monthlyUs} suffix="만원" onChange={onText(setMonthlyUs)} />
          <InputField
            label={copy.inputs.otherFinancial}
            type="number"
            min={0}
            value={otherFinancial}
            suffix="만원"
            onChange={onText(setOtherFinancial)}
          />
          <InputField
            label={copy.inputs.otherTaxBase}
            type="number"
            min={0}
            value={otherTaxBase}
            suffix="만원"
            hint={copy.inputs.otherTaxBaseHint}
            onChange={onText(setOtherTaxBase)}
          />
          <Field>
            <FieldLabel>{copy.inputs.health}</FieldLabel>
            <ChipRow>
              {HEALTH.map((status) => (
                <Chip key={status} selected={health === status} onClick={() => setHealth(status)}>
                  {copy.inputs.healthOptions[status]}
                </Chip>
              ))}
            </ChipRow>
          </Field>
          {health === 'dependent' ? (
            <InputField
              label={copy.inputs.otherIncomeForDependent}
              type="number"
              min={0}
              value={otherIncomeForDependent}
              suffix="만원"
              onChange={onText(setOtherIncomeForDependent)}
            />
          ) : null}
        </Form>

        <ResultGrid aria-live="polite">
          <ResultCard>
            <ResultLabel>{copy.results.withholding}</ResultLabel>
            <ResultValue>월 {formatKoreanWon(result.usNetAfterWithholding / 12)}</ResultValue>
            <Note>{copy.results.perYear(formatKoreanWon(result.usNetAfterWithholding))} · 미국 원천징수 연 {formatKoreanWon(result.usWithheld)}</Note>
          </ResultCard>

          <ResultCard tone={result.comprehensive ? 'warn' : 'ok'}>
            <ResultTone>{result.comprehensive ? copy.results.comprehensiveYes : copy.results.comprehensiveNo}</ResultTone>
            <Note>{copy.results.comprehensiveDetail(formatKoreanWon(result.financialIncome))}</Note>
            {result.comprehensive ? (
              <>
                <ResultLabel>{copy.results.extraTax}</ResultLabel>
                <ResultValue>연 {formatKoreanWon(result.extraIncomeTax)}</ResultValue>
                {result.extraIncomeTax === 0 ? <Note>{copy.results.extraTaxZero}</Note> : null}
              </>
            ) : null}
          </ResultCard>

          <ResultCard tone={result.health.dependentLost || result.health.monthlyIncrease > 0 ? 'warn' : 'ok'}>
            {health === 'dependent' ? (
              <>
                <ResultTone>{result.health.dependentLost ? copy.results.dependentLost : copy.results.dependentKept}</ResultTone>
                <Note>{copy.results.dependentNote}</Note>
              </>
            ) : (
              <>
                <ResultLabel>{copy.results.premiumIncrease}</ResultLabel>
                <ResultValue>월 {result.health.monthlyIncrease.toLocaleString('ko-KR')}원</ResultValue>
                {result.health.monthlyIncrease === 0 ? (
                  <Note>{health === 'regional' ? copy.results.premiumZeroRegional : copy.results.premiumZeroEmployee}</Note>
                ) : null}
              </>
            )}
          </ResultCard>
        </ResultGrid>

        <ResultCard>
          <ResultLabel>{copy.results.isaHeading}</ResultLabel>
          <Compare>
            <CompareItem>
              <CompareLabel>{copy.results.isaGeneral}</CompareLabel>
              <CompareValue>연 {formatKoreanWon(result.isa.generalTax)}</CompareValue>
            </CompareItem>
            <CompareItem>
              <CompareLabel>{copy.results.isaAccount(formatKoreanWon(result.isa.taxFreeLimit))}</CompareLabel>
              <CompareValue>연 {formatKoreanWon(result.isa.isaTax)}</CompareValue>
            </CompareItem>
          </Compare>
          <ChipRow>
            <Chip selected={isaSeomin} onClick={() => setIsaSeomin((value) => !value)}>
              {copy.inputs.isaSeomin}
            </Chip>
          </ChipRow>
          <Note>
            세전 배당 연 {formatKoreanWon(usAnnual)} 기준. {copy.results.isaNote}
          </Note>
        </ResultCard>

        <Note>{copy.basis}</Note>
        <Note>{copy.disclaimer}</Note>
      </Stack>
    </TickerPageShell>
  );
}
