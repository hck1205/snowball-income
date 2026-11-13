import { useMemo, useState, type ChangeEvent } from 'react';
import { Sunset } from 'lucide-react';
import { InputField, PageHero } from '@/components/common';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { DIVIDEND_TARGET_PATH, DIVIDEND_TAX_PATH, RETIREMENT_INCOME_PATH } from '@/shared/constants/routes';
import { calculateRetirementIncome, type RetirementStage } from '@/shared/lib/retirementIncome';
import { formatKoreanWon } from '@/shared/utils';
import { RETIREMENT_INCOME_COPY } from '../copy';
import {
  Bar,
  BarSegment,
  Breakdown,
  Footnotes,
  FormGrid,
  GapText,
  GroupTitle,
  Legend,
  LegendItem,
  LinkRow,
  Note,
  Panel,
  PanelTitle,
  SecondaryLink,
  SOURCE_COLOR,
  Stack,
  StageAge,
  StageBody,
  StageList,
  StageRow,
  StageSide,
  StageTotal,
  StatusBadge,
  Strong,
  Swatch,
  TargetLine
} from './RetirementIncomePage.styled';

const copy = RETIREMENT_INCOME_COPY;
const MAN = 10_000;

/** 입력창 문자열 → 숫자. 빈 칸·음수·숫자 아님은 0. */
const num = (value: string): number => {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};
const percent = (rate: number) => `${Number((rate * 100).toFixed(1))}%`;
const SOURCES = ['nps', 'account', 'dividend'] as const;

/**
 * 은퇴 후 월 소득 계산기(`/retirement/income`, 2026-11-13) — 40~50대의 질문 "은퇴하면 매달 얼마가 들어오나".
 * 계산은 전부 `calculateRetirementIncome`(순수 함수). 세율·건보 기준은 세금 계산기 정본과 같은 상수다.
 */
export default function RetirementIncomePage() {
  useDocumentMeta({ title: copy.meta.title, description: copy.meta.description, pathname: RETIREMENT_INCOME_PATH });

  const [retireAge, setRetireAge] = useState('60');
  const [target, setTarget] = useState('300');
  const [npsMonthly, setNpsMonthly] = useState('100');
  const [npsAge, setNpsAge] = useState('65');
  const [balance, setBalance] = useState('10000');
  const [accountAge, setAccountAge] = useState('60');
  const [accountYears, setAccountYears] = useState('20');
  const [accountReturn, setAccountReturn] = useState('3');
  const [dividend, setDividend] = useState('100');

  const result = useMemo(
    () =>
      calculateRetirementIncome({
        retireAge: num(retireAge),
        targetMonthly: num(target) * MAN,
        npsMonthly: num(npsMonthly) * MAN,
        npsStartAge: num(npsAge),
        accountBalance: num(balance) * MAN,
        accountStartAge: num(accountAge),
        accountYears: num(accountYears),
        accountReturn: num(accountReturn) / 100,
        dividendMonthly: num(dividend) * MAN
      }),
    [retireAge, target, npsMonthly, npsAge, balance, accountAge, accountYears, accountReturn, dividend]
  );

  const on = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => setter(event.target.value);
  const targetWon = num(target) * MAN;
  const scale = Math.max(targetWon, ...result.stages.map((stage) => stage.total), 1);
  const hasIncome = result.stages.some((stage) => stage.total > 0);

  // 세금 계산기로 같은 조건을 넘긴다 — 배당 월액 · 피부양자 · 국민연금(연)을 "피부양자 판정에 더할 다른 소득"으로.
  const npsAnnualMan = num(npsMonthly) * 12;
  const taxHref = `${DIVIDEND_TAX_PATH}?m=${num(dividend)}&h=dependent${npsAnnualMan > 0 ? `&od=${npsAnnualMan}` : ''}`;

  return (
    <TickerPageShell>
      <Stack>
        <PageHero title={copy.heroTitle} titleAs="h1" lede={copy.lede} icon={<Sunset aria-hidden />} />

        <Panel as="form" onSubmit={(event) => event.preventDefault()} aria-label="은퇴 소득 조건">
          <FormGrid>
            <GroupTitle>{copy.sections.plan}</GroupTitle>
            <InputField label={copy.inputs.retireAge} type="number" min={0} value={retireAge} suffix={copy.units.age} onChange={on(setRetireAge)} />
            <InputField label={copy.inputs.targetMonthly} type="number" min={0} value={target} suffix={copy.units.man} onChange={on(setTarget)} />

            <GroupTitle>{copy.sections.nps}</GroupTitle>
            <InputField
              label={copy.inputs.npsMonthly}
              type="number"
              min={0}
              value={npsMonthly}
              suffix={copy.units.man}
              hint={copy.inputs.npsMonthlyHint}
              onChange={on(setNpsMonthly)}
            />
            <InputField
              label={copy.inputs.npsStartAge}
              type="number"
              min={60}
              value={npsAge}
              suffix={copy.units.age}
              hint={copy.inputs.npsStartAgeHint}
              onChange={on(setNpsAge)}
            />

            <GroupTitle>{copy.sections.account}</GroupTitle>
            <InputField label={copy.inputs.accountBalance} type="number" min={0} value={balance} suffix={copy.units.man} onChange={on(setBalance)} />
            <InputField
              label={copy.inputs.accountStartAge}
              type="number"
              min={55}
              value={accountAge}
              suffix={copy.units.age}
              hint={copy.inputs.accountStartAgeHint}
              onChange={on(setAccountAge)}
            />
            <InputField
              label={copy.inputs.accountYears}
              type="number"
              min={1}
              value={accountYears}
              suffix={copy.units.years}
              onChange={on(setAccountYears)}
            />
            <InputField
              label={copy.inputs.accountReturn}
              type="number"
              min={0}
              value={accountReturn}
              suffix={copy.units.percent}
              onChange={on(setAccountReturn)}
            />

            <GroupTitle>{copy.sections.dividend}</GroupTitle>
            <InputField
              label={copy.inputs.dividendMonthly}
              type="number"
              min={0}
              value={dividend}
              suffix={copy.units.man}
              hint={copy.inputs.dividendMonthlyHint}
              onChange={on(setDividend)}
            />
          </FormGrid>
        </Panel>

        <Panel aria-labelledby="stages-title" aria-live="polite">
          <PanelTitle id="stages-title">{copy.results.heading}</PanelTitle>
          <Legend>
            {SOURCES.map((source) => (
              <LegendItem key={source}>
                <Swatch tone={SOURCE_COLOR[source]} aria-hidden />
                {copy.results.legend[source]}
              </LegendItem>
            ))}
            {targetWon > 0 ? <LegendItem>{copy.results.targetLegend(formatKoreanWon(targetWon))}</LegendItem> : null}
          </Legend>
          {hasIncome ? (
            <StageList>
              {result.stages.map((stage) => (
                <StageItem key={stage.fromAge} stage={stage} scale={scale} target={targetWon} />
              ))}
            </StageList>
          ) : (
            <Note>{copy.results.empty}</Note>
          )}
          {result.dividendComprehensive ? <Strong>{copy.results.comprehensiveWarn}</Strong> : null}
        </Panel>

        {result.health ? (
          <Panel aria-labelledby="health-title">
            <PanelTitle id="health-title">{copy.results.healthHeading}</PanelTitle>
            <Note>{copy.results.healthFrom(result.health.fromAge)}</Note>
            <StatusBadge tone={result.health.dependentLost ? 'warn' : 'ok'}>
              {result.health.dependentLost ? copy.results.dependentLost : copy.results.dependentKept}
            </StatusBadge>
            <Note>{copy.results.dependentDetail(formatKoreanWon(result.health.dependentIncome))}</Note>
            {result.health.regionalMonthly > 0 ? (
              <Strong>{copy.results.regional(`${result.health.regionalMonthly.toLocaleString('ko-KR')}원`)}</Strong>
            ) : null}
            <Note>{copy.results.healthNote}</Note>
            <LinkRow>
              <SecondaryLink to={taxHref}>{copy.results.taxLink}</SecondaryLink>
              <SecondaryLink to={DIVIDEND_TARGET_PATH}>{copy.results.targetLink}</SecondaryLink>
            </LinkRow>
          </Panel>
        ) : null}

        <Footnotes>
          {copy.assumptions.map((line) => (
            <li key={line}>{line}</li>
          ))}
          <li>{copy.disclaimer}</li>
        </Footnotes>
      </Stack>
    </TickerPageShell>
  );
}

const PARTS = [
  { key: 'nps', label: '국민연금' },
  { key: 'account', label: '연금계좌' },
  { key: 'dividend', label: '배당' }
] as const;

function StageItem({ stage, scale, target }: { readonly stage: RetirementStage; readonly scale: number; readonly target: number }) {
  const shown = PARTS.filter((part) => stage[part.key] > 0);
  const gapLabel =
    stage.gap < 0
      ? copy.results.short(formatKoreanWon(-stage.gap))
      : stage.gap > 0
        ? copy.results.surplus(formatKoreanWon(stage.gap))
        : copy.results.exact;
  return (
    <StageRow>
      <StageAge>{copy.results.stageRange(stage.fromAge, stage.toAge)}</StageAge>
      <StageBody>
        <Bar aria-hidden>
          {shown.map((part) => (
            <BarSegment key={part.key} tone={SOURCE_COLOR[part.key]} share={stage[part.key] / scale} />
          ))}
          {target > 0 ? <TargetLine at={Math.min(1, target / scale)} /> : null}
        </Bar>
        <Breakdown>
          {shown.length > 0 ? shown.map((part) => `${part.label} ${formatKoreanWon(stage[part.key])}`).join(' + ') : '수입 없음'}
          {stage.accountTaxRate !== null ? ` · ${copy.results.accountTax(percent(stage.accountTaxRate))}` : ''}
        </Breakdown>
      </StageBody>
      <StageSide>
        <StageTotal>월 {formatKoreanWon(stage.total)}</StageTotal>
        {target > 0 ? <GapText tone={stage.gap < 0 ? 'short' : 'ok'}>{gapLabel}</GapText> : null}
      </StageSide>
    </StageRow>
  );
}
