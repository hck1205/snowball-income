import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { CalculatorFormGrid, CalculatorNote, CalculatorPanel, CalculatorStack, InputField, PageHero } from '@/components/common';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { DIVIDEND_TAX_PATH } from '@/shared/constants/routes';
import {
  calculateDividendTax,
  formFromSearch,
  formToSearch,
  type DividendTaxForm,
  type HealthInsuranceStatus
} from '@/shared/lib/dividendTax';
import { manInputToWon, parsePositiveInput } from '@/shared/utils';
import { AccountComparePanel, ResultShare, SegmentedChoice, TaxResultCards } from '../components';
import { DIVIDEND_TAX_COPY } from '../copy';
import { Footnotes } from './DividendTaxPage.styled';

const copy = DIVIDEND_TAX_COPY;
const HEALTH: readonly HealthInsuranceStatus[] = ['employee', 'regional', 'dependent'];
const HEALTH_OPTIONS = HEALTH.map((status) => ({ value: status, label: copy.inputs.healthOptions[status] }));

/**
 * 미국 배당 세금·건강보험료 계산기(`/dividend/tax`, 2026-11-12) — "한국 사람이 미국 배당으로 은퇴할 때"의
 * 세금·건보료 질문에 답하는 검증 지면. 계산은 전부 `calculateDividendTax`(순수 함수, 규칙 정본은
 * `shared/lib/dividendTax/RULES.md`). 확인 못 한 규칙은 보수적으로 계산하고 "추정"을 밝힌다.
 *
 * 이 파일은 **조건(상태)과 조립**만 갖는다(2026-11-13 분리) — 결과 카드 · 계좌 비교 · 공유는 `../components`,
 * 그 안의 표시 내용은 각 컴포넌트의 순수 함수(`*.utils.ts`)가 만든다.
 */
export default function DividendTaxPage() {
  useDocumentMeta({ title: copy.meta.title, description: copy.meta.description, pathname: DIVIDEND_TAX_PATH });

  // 공유 링크(`?m=300&h=dependent…`)로 들어오면 그 조건으로 시작한다. 이후 입력은 주소창을 건드리지 않는다.
  const { search } = useLocation();
  const [form, setForm] = useState<DividendTaxForm>(() => formFromSearch(search));
  const set = useCallback(<K extends keyof DividendTaxForm>(key: K, value: DividendTaxForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);
  const onText =
    (key: 'monthlyUs' | 'otherFinancial' | 'otherTaxBase' | 'otherIncomeForDependent') =>
    (event: ChangeEvent<HTMLInputElement>) =>
      set(key, event.target.value);

  const result = useMemo(
    () =>
      calculateDividendTax({
        usDividendAnnual: manInputToWon(form.monthlyUs) * 12,
        otherFinancialAnnual: manInputToWon(form.otherFinancial),
        otherTaxBase: manInputToWon(form.otherTaxBase),
        health: form.health,
        otherIncomeForDependent: manInputToWon(form.otherIncomeForDependent),
        isaSeomin: form.isaSeomin,
        pensionAge: form.pensionAge
      }),
    [form]
  );

  const buildShareUrl = useCallback(() => `${window.location.origin}${DIVIDEND_TAX_PATH}${formToSearch(form)}`, [form]);

  return (
    <TickerPageShell>
      <CalculatorStack>
        <PageHero title={copy.heroTitle} titleAs="h1" lede={copy.lede} icon={<Receipt aria-hidden />} />

        <CalculatorPanel as="form" onSubmit={(event) => event.preventDefault()} aria-label="계산 조건">
          <CalculatorFormGrid>
            <InputField
              label={copy.inputs.monthlyUs}
              type="number"
              min={0}
              value={form.monthlyUs}
              suffix="만원"
              onChange={onText('monthlyUs')}
            />
            <SegmentedChoice
              label={copy.inputs.health}
              options={HEALTH_OPTIONS}
              value={form.health}
              onChange={(value) => set('health', value)}
            />
            <InputField
              label={copy.inputs.otherFinancial}
              type="number"
              min={0}
              value={form.otherFinancial}
              suffix="만원"
              onChange={onText('otherFinancial')}
            />
            <InputField
              label={copy.inputs.otherTaxBase}
              type="number"
              min={0}
              value={form.otherTaxBase}
              suffix="만원"
              hint={copy.inputs.otherTaxBaseHint}
              onChange={onText('otherTaxBase')}
            />
            {form.health === 'dependent' ? (
              <InputField
                label={copy.inputs.otherIncomeForDependent}
                type="number"
                min={0}
                value={form.otherIncomeForDependent}
                suffix="만원"
                onChange={onText('otherIncomeForDependent')}
              />
            ) : null}
          </CalculatorFormGrid>
        </CalculatorPanel>

        <TaxResultCards result={result} />

        <AccountComparePanel
          result={result}
          usAnnual={manInputToWon(form.monthlyUs) * 12}
          isaSeomin={form.isaSeomin}
          onToggleIsaSeomin={() => set('isaSeomin', !form.isaSeomin)}
          pensionAge={form.pensionAge}
          onPensionAgeChange={(band) => set('pensionAge', band)}
        />

        <ResultShare buildUrl={buildShareUrl} title={copy.share.title(String(parsePositiveInput(form.monthlyUs)))} />

        <Footnotes>
          <CalculatorNote>{copy.basis}</CalculatorNote>
          <CalculatorNote>{copy.disclaimer}</CalculatorNote>
        </Footnotes>
      </CalculatorStack>
    </TickerPageShell>
  );
}
