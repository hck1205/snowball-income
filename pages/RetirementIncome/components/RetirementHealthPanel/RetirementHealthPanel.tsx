import { CalculatorNote, CalculatorPanel, CalculatorPanelTitle } from '@/components/common';
import { DIVIDEND_TARGET_PATH } from '@/shared/constants/routes';
import type { RetirementIncomeResult } from '@/shared/lib/retirementIncome';
import { formatKoreanWon } from '@/shared/utils';
import { RETIREMENT_INCOME_COPY } from '../../copy';
import { LinkRow, SecondaryLink, StatusBadge, Strong } from './RetirementHealthPanel.styled';

const copy = RETIREMENT_INCOME_COPY.results;

export type RetirementHealthPanelProps = {
  readonly health: NonNullable<RetirementIncomeResult['health']>;
  /** 같은 조건으로 미리 채운 세금 계산기 주소. */
  readonly taxHref: string;
};

/** 은퇴 후 건강보험 — 국민연금이 나온 뒤의 피부양자 판정 · 지역 소득분 보험료 · 다음 계산기(2026-11-13). */
export default function RetirementHealthPanel({ health, taxHref }: RetirementHealthPanelProps) {
  return (
    <CalculatorPanel aria-labelledby="health-title">
      <CalculatorPanelTitle id="health-title">{copy.healthHeading}</CalculatorPanelTitle>
      <CalculatorNote>{copy.healthFrom(health.fromAge)}</CalculatorNote>
      <StatusBadge tone={health.dependentLost ? 'warn' : 'ok'}>{health.dependentLost ? copy.dependentLost : copy.dependentKept}</StatusBadge>
      <CalculatorNote>{copy.dependentDetail(formatKoreanWon(health.dependentIncome))}</CalculatorNote>
      {health.regionalMonthly > 0 ? <Strong>{copy.regional(`${health.regionalMonthly.toLocaleString('ko-KR')}원`)}</Strong> : null}
      <CalculatorNote>{copy.healthNote}</CalculatorNote>
      <LinkRow>
        <SecondaryLink to={taxHref}>{copy.taxLink}</SecondaryLink>
        <SecondaryLink to={DIVIDEND_TARGET_PATH}>{copy.targetLink}</SecondaryLink>
      </LinkRow>
    </CalculatorPanel>
  );
}
