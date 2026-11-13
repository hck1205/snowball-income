import { CalculatorNote, CalculatorPanel, CalculatorPanelTitle } from '@/components/common';
import type { RetirementIncomeResult } from '@/shared/lib/retirementIncome';
import { formatKoreanWon } from '@/shared/utils';
import { RETIREMENT_INCOME_COPY } from '../../copy';
import {
  Bar,
  BarSegment,
  Breakdown,
  GapText,
  Legend,
  LegendItem,
  SOURCE_COLOR,
  StageAge,
  StageBody,
  StageList,
  StageRow,
  StageSide,
  StageTotal,
  Swatch,
  TargetLine,
  Warning
} from './IncomeStagesPanel.styled';
import { buildStageView, stageScale, type IncomeSource } from './IncomeStagesPanel.utils';

const copy = RETIREMENT_INCOME_COPY.results;
const LEGEND: readonly IncomeSource[] = ['nps', 'account', 'dividend'];

export type IncomeStagesPanelProps = {
  readonly result: RetirementIncomeResult;
  /** 목표 월 생활비(원). 0이면 목표선·부족액을 말하지 않는다. */
  readonly target: number;
};

/** 나이별 월 소득 — 구간마다 쌓은 막대 · 내역 · 합계 · 목표 대비(2026-11-13). 표시 내용은 `buildStageView`. */
export default function IncomeStagesPanel({ result, target }: IncomeStagesPanelProps) {
  const scale = stageScale(result.stages, target);
  const hasIncome = result.stages.some((stage) => stage.total > 0);
  return (
    <CalculatorPanel aria-labelledby="stages-title" aria-live="polite">
      <CalculatorPanelTitle id="stages-title">{copy.heading}</CalculatorPanelTitle>
      <Legend>
        {LEGEND.map((source) => (
          <LegendItem key={source}>
            <Swatch tone={SOURCE_COLOR[source]} aria-hidden />
            {copy.legend[source]}
          </LegendItem>
        ))}
        {target > 0 ? <LegendItem>{copy.targetLegend(formatKoreanWon(target))}</LegendItem> : null}
      </Legend>
      {hasIncome ? (
        <StageList>
          {result.stages.map((stage) => {
            const view = buildStageView(stage, scale, target);
            return (
              <StageRow key={view.key}>
                <StageAge>{view.range}</StageAge>
                <StageBody>
                  <Bar aria-hidden>
                    {view.segments.map((segment) => (
                      <BarSegment key={segment.source} tone={SOURCE_COLOR[segment.source]} share={segment.share} />
                    ))}
                    {view.targetAt !== null ? <TargetLine at={view.targetAt} /> : null}
                  </Bar>
                  <Breakdown>{view.breakdown}</Breakdown>
                </StageBody>
                <StageSide>
                  <StageTotal>{view.total}</StageTotal>
                  {view.gap ? <GapText tone={view.gap.tone}>{view.gap.label}</GapText> : null}
                </StageSide>
              </StageRow>
            );
          })}
        </StageList>
      ) : (
        <CalculatorNote>{copy.empty}</CalculatorNote>
      )}
      {result.dividendComprehensive ? <Warning>{copy.comprehensiveWarn}</Warning> : null}
    </CalculatorPanel>
  );
}
