import { useMemo, useState, type ChangeEvent } from 'react';
import { Receipt } from 'lucide-react';
import { InputField, PageHero } from '@/components/common';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { DIVIDEND_TAX_PATH } from '@/shared/constants/routes';
import { calculateDividendTax, type HealthInsuranceStatus } from '@/shared/lib/dividendTax';
import { formatKoreanWon } from '@/shared/utils';
import { DIVIDEND_TAX_COPY } from '../copy';
import {
  BigValue,
  Compare,
  CompareItem,
  CompareLabel,
  CompareValue,
  Eyebrow,
  Field,
  FieldLabel,
  Footnotes,
  FormGrid,
  Highlight,
  Note,
  Panel,
  PanelHead,
  PanelTitle,
  ResultCard,
  ResultGrid,
  SegmentButton,
  Segmented,
  Stack,
  StatusBadge,
  ToggleChip
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
  const isaSaving = result.isa.generalTax - result.isa.isaTax;

  const healthCard =
    health === 'dependent'
      ? {
          value: result.health.dependentLost ? '탈락 가능' : '유지',
          tone: result.health.dependentLost ? ('warn' as const) : ('ok' as const),
          badge: result.health.dependentLost ? '소득요건 초과' : '소득요건 이내',
          note: copy.results.dependentNote
        }
      : {
          value: result.health.monthlyIncrease > 0 ? `월 +${result.health.monthlyIncrease.toLocaleString('ko-KR')}원` : '변화 없음',
          tone: result.health.monthlyIncrease > 0 ? ('warn' as const) : ('ok' as const),
          badge: copy.inputs.healthOptions[health],
          note:
            result.health.monthlyIncrease > 0
              ? `보험료에 반영되는 금융소득 연 ${formatKoreanWon(result.health.countedIncome)} · 장기요양 포함`
              : health === 'regional'
                ? copy.results.premiumZeroRegional
                : copy.results.premiumZeroEmployee
        };

  return (
    <TickerPageShell>
      <Stack>
        <PageHero title={copy.heroTitle} titleAs="h1" lede={copy.lede} icon={<Receipt aria-hidden />} />

        <Panel as="form" onSubmit={(event) => event.preventDefault()} aria-label="계산 조건">
          <FormGrid>
            <InputField label={copy.inputs.monthlyUs} type="number" min={0} value={monthlyUs} suffix="만원" onChange={onText(setMonthlyUs)} />
            <Field>
              <FieldLabel id="health-label">{copy.inputs.health}</FieldLabel>
              <Segmented role="radiogroup" aria-labelledby="health-label">
                {HEALTH.map((status) => (
                  <SegmentButton
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={health === status}
                    active={health === status}
                    onClick={() => setHealth(status)}
                  >
                    {copy.inputs.healthOptions[status]}
                  </SegmentButton>
                ))}
              </Segmented>
            </Field>
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
          </FormGrid>
        </Panel>

        <ResultGrid aria-live="polite">
          <ResultCard>
            <Eyebrow>{copy.results.withholding}</Eyebrow>
            <BigValue>월 {formatKoreanWon(result.usNetAfterWithholding / 12)}</BigValue>
            <StatusBadge tone="info">미국 원천징수 15%</StatusBadge>
            <Note>
              {copy.results.perYear(formatKoreanWon(result.usNetAfterWithholding))} · 원천징수 연 {formatKoreanWon(result.usWithheld)}
            </Note>
          </ResultCard>

          <ResultCard>
            <Eyebrow>금융소득종합과세</Eyebrow>
            <BigValue>
              {result.comprehensive ? (result.extraIncomeTax > 0 ? `연 +${formatKoreanWon(result.extraIncomeTax)}` : '대상') : '대상 아님'}
            </BigValue>
            <StatusBadge tone={result.comprehensive ? 'warn' : 'ok'}>
              {result.comprehensive ? '연 2,000만원 초과 · 추정' : '연 2,000만원 이하'}
            </StatusBadge>
            <Note>
              {copy.results.comprehensiveDetail(formatKoreanWon(result.financialIncome))}
              {result.comprehensive && result.extraIncomeTax === 0 ? ` ${copy.results.extraTaxZero}` : ''}
            </Note>
          </ResultCard>

          <ResultCard>
            <Eyebrow>{health === 'dependent' ? '건강보험 피부양자' : '늘어나는 월 건강보험료'}</Eyebrow>
            <BigValue>{healthCard.value}</BigValue>
            <StatusBadge tone={healthCard.tone}>{healthCard.badge}</StatusBadge>
            <Note>{healthCard.note}</Note>
          </ResultCard>
        </ResultGrid>

        <Panel aria-labelledby="isa-title">
          <PanelHead>
            <PanelTitle id="isa-title">{copy.results.isaHeading}</PanelTitle>
            <ToggleChip type="button" active={isaSeomin} aria-pressed={isaSeomin} onClick={() => setIsaSeomin((value) => !value)}>
              {copy.inputs.isaSeomin}
            </ToggleChip>
          </PanelHead>
          <Compare>
            <CompareItem>
              <CompareLabel>{copy.results.isaGeneral}</CompareLabel>
              <CompareValue>연 {formatKoreanWon(result.isa.generalTax)}</CompareValue>
            </CompareItem>
            <CompareItem best={isaSaving > 0}>
              <CompareLabel>{copy.results.isaAccount(formatKoreanWon(result.isa.taxFreeLimit))}</CompareLabel>
              <CompareValue>연 {formatKoreanWon(result.isa.isaTax)}</CompareValue>
            </CompareItem>
          </Compare>
          {isaSaving > 0 ? <Highlight>ISA가 세금이 연 {formatKoreanWon(isaSaving)} 적습니다.</Highlight> : null}
          <Note>
            세전 배당 연 {formatKoreanWon(usAnnual)} 기준. {copy.results.isaNote}
          </Note>
        </Panel>

        <Footnotes>
          <Note>{copy.basis}</Note>
          <Note>{copy.disclaimer}</Note>
        </Footnotes>
      </Stack>
    </TickerPageShell>
  );
}
