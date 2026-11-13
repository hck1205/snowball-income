import { DIVIDEND_TAX_PATH } from '@/shared/constants/routes';
import { DEFAULT_DIVIDEND_TAX_FORM, formToSearch } from '@/shared/lib/dividendTax';
import type { RetirementIncomeInput } from '@/shared/lib/retirementIncome';
import { manInputToWon, parsePositiveInput } from '@/shared/utils';

/** 은퇴 후 월 소득 입력 — 입력창 문자열 그대로(금액은 만원, 나이는 세, 수익률은 %). */
export type RetirementForm = {
  readonly retireAge: string;
  readonly target: string;
  readonly npsMonthly: string;
  readonly npsAge: string;
  readonly balance: string;
  readonly accountAge: string;
  readonly accountYears: string;
  readonly accountReturn: string;
  readonly dividend: string;
};

export const DEFAULT_RETIREMENT_FORM: RetirementForm = {
  retireAge: '60',
  target: '300',
  npsMonthly: '100',
  npsAge: '65',
  balance: '10000',
  accountAge: '60',
  accountYears: '20',
  accountReturn: '3',
  dividend: '100'
};

/** 입력 → 엔진 입력(원 · 세 · 소수 수익률). */
export const toRetirementInput = (form: RetirementForm): RetirementIncomeInput => ({
  retireAge: parsePositiveInput(form.retireAge),
  targetMonthly: manInputToWon(form.target),
  npsMonthly: manInputToWon(form.npsMonthly),
  npsStartAge: parsePositiveInput(form.npsAge),
  accountBalance: manInputToWon(form.balance),
  accountStartAge: parsePositiveInput(form.accountAge),
  accountYears: parsePositiveInput(form.accountYears),
  accountReturn: parsePositiveInput(form.accountReturn) / 100,
  dividendMonthly: manInputToWon(form.dividend)
});

/**
 * 같은 조건으로 미리 채운 세금 계산기 주소 — 배당 월액 · 피부양자 · 국민연금(연)을 "피부양자 판정에 더할 다른 소득"으로.
 * 주소 형식은 세금 계산기의 정본(`formToSearch`)이 만든다.
 */
export const taxCalculatorHref = (form: RetirementForm): string =>
  `${DIVIDEND_TAX_PATH}${formToSearch({
    ...DEFAULT_DIVIDEND_TAX_FORM,
    monthlyUs: String(parsePositiveInput(form.dividend)),
    health: 'dependent',
    otherIncomeForDependent: String(parsePositiveInput(form.npsMonthly) * 12)
  })}`;

export type RetirementField = {
  readonly key: keyof RetirementForm;
  readonly label: string;
  readonly unit: string;
  readonly hint?: string;
  readonly min: number;
};

export type RetirementFieldGroup = { readonly title: string; readonly fields: readonly RetirementField[] };
