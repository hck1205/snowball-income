import { Fragment, useMemo, useState } from 'react';
import { Sunset } from 'lucide-react';
import { CalculatorFormGrid, CalculatorPanel, CalculatorStack, InputField, PageHero } from '@/components/common';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { RETIREMENT_INCOME_PATH } from '@/shared/constants/routes';
import { calculateRetirementIncome } from '@/shared/lib/retirementIncome';
import { manInputToWon } from '@/shared/utils';
import { IncomeStagesPanel, RetirementHealthPanel } from '../components';
import { RETIREMENT_INCOME_COPY } from '../copy';
import { Footnotes, GroupTitle } from './RetirementIncomePage.styled';
import {
  DEFAULT_RETIREMENT_FORM,
  taxCalculatorHref,
  toRetirementInput,
  type RetirementFieldGroup,
  type RetirementForm
} from './RetirementIncomePage.utils';

const copy = RETIREMENT_INCOME_COPY;
const { inputs, units, sections } = copy;

/** 입력 네 묶음 — 묶음 제목이 두 열을 가로지르고, 칸은 공용 InputField 다. 순서가 곧 화면 순서다. */
const FIELD_GROUPS: readonly RetirementFieldGroup[] = [
  {
    title: sections.plan,
    fields: [
      { key: 'retireAge', label: inputs.retireAge, unit: units.age, min: 0 },
      { key: 'target', label: inputs.targetMonthly, unit: units.man, min: 0 }
    ]
  },
  {
    title: sections.nps,
    fields: [
      { key: 'npsMonthly', label: inputs.npsMonthly, unit: units.man, hint: inputs.npsMonthlyHint, min: 0 },
      { key: 'npsAge', label: inputs.npsStartAge, unit: units.age, hint: inputs.npsStartAgeHint, min: 60 }
    ]
  },
  {
    title: sections.account,
    fields: [
      { key: 'balance', label: inputs.accountBalance, unit: units.man, min: 0 },
      { key: 'accountAge', label: inputs.accountStartAge, unit: units.age, hint: inputs.accountStartAgeHint, min: 55 },
      { key: 'accountYears', label: inputs.accountYears, unit: units.years, min: 1 },
      { key: 'accountReturn', label: inputs.accountReturn, unit: units.percent, min: 0 }
    ]
  },
  {
    title: sections.dividend,
    fields: [{ key: 'dividend', label: inputs.dividendMonthly, unit: units.man, hint: inputs.dividendMonthlyHint, min: 0 }]
  }
];

/**
 * 은퇴 후 월 소득 계산기(`/retirement/income`, 2026-11-13) — 40~50대의 질문 "은퇴하면 매달 얼마가 들어오나".
 * 계산은 전부 `calculateRetirementIncome`(순수 함수). 세율·건보 기준은 세금 계산기 정본과 같은 상수다.
 * 이 파일은 조건(하나의 form 상태)과 조립만 갖는다 — 구간 차트·건강보험은 `../components`.
 */
export default function RetirementIncomePage() {
  useDocumentMeta({ title: copy.meta.title, description: copy.meta.description, pathname: RETIREMENT_INCOME_PATH });

  const [form, setForm] = useState<RetirementForm>(DEFAULT_RETIREMENT_FORM);
  const result = useMemo(() => calculateRetirementIncome(toRetirementInput(form)), [form]);

  return (
    <TickerPageShell>
      <CalculatorStack>
        <PageHero title={copy.heroTitle} titleAs="h1" lede={copy.lede} icon={<Sunset aria-hidden />} />

        <CalculatorPanel as="form" onSubmit={(event) => event.preventDefault()} aria-label="은퇴 소득 조건">
          <CalculatorFormGrid>
            {FIELD_GROUPS.map((group) => (
              <Fragment key={group.title}>
                <GroupTitle>{group.title}</GroupTitle>
                {group.fields.map((field) => (
                  <InputField
                    key={field.key}
                    label={field.label}
                    type="number"
                    min={field.min}
                    value={form[field.key]}
                    suffix={field.unit}
                    hint={field.hint}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((prev) => ({ ...prev, [field.key]: value }));
                    }}
                  />
                ))}
              </Fragment>
            ))}
          </CalculatorFormGrid>
        </CalculatorPanel>

        <IncomeStagesPanel result={result} target={manInputToWon(form.target)} />

        {result.health ? <RetirementHealthPanel health={result.health} taxHref={taxCalculatorHref(form)} /> : null}

        <Footnotes>
          {copy.assumptions.map((line) => (
            <li key={line}>{line}</li>
          ))}
          <li>{copy.disclaimer}</li>
        </Footnotes>
      </CalculatorStack>
    </TickerPageShell>
  );
}
